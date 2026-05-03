import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:pdfx/pdfx.dart';
import 'package:pdf/pdf.dart' as pw;
import 'package:pdf/widgets.dart' as pw;
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart' show getTemporaryDirectory;
import 'package:paper_prints_user/core/constants/app_constants.dart';
import 'package:paper_prints_user/core/network/repositories.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/orders/providers/orders_provider.dart';
import 'package:paper_prints_user/features/shops/providers/shops_provider.dart';
import 'package:paper_prints_user/features/upload/screens/pdf_viewer_screen.dart';
import 'package:paper_prints_user/shared/widgets/shop_card.dart';
import 'package:paper_prints_user/core/services/payment_service.dart';

// Color mode options matching the screenshot
enum _ColorMode { colored, bw, autoDetect, manual }

// Orientation options
enum _Orientation { portrait, landscape }

class UploadScreen extends ConsumerStatefulWidget {
  final String? preselectedVendorId;
  const UploadScreen({super.key, this.preselectedVendorId});

  @override
  ConsumerState<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends ConsumerState<UploadScreen> {
  // Step 1: Shop — demo vendor pre-selected
  VendorModel? _selectedVendor;

  // Step 2: Files (multiple)
  final List<PlatformFile> _files = [];
  final List<Map<String, dynamic>?> _fileRecords = []; // null while uploading
  int _uploadingCount = 0;
  double _uploadProgress = 0;

  // Step 3: Options
  int _copies = 1;
  bool _doubleSided = false;
  bool _printEntire = true;
  _ColorMode _colorMode = _ColorMode.autoDetect;
  _Orientation _orientation = _Orientation.portrait;
  Map<int, String> _pageTypes = {};
  Set<int> _selectedPages = {}; // empty = all pages

  // Local PDF state (pdfx) — flat across all files
  final List<int> _filePageCounts = [];   // pages per file
  final List<Uint8List?> _thumbnails = []; // thumbnails across all files
  bool _renderingThumbs = false;

  // Vendor is loaded from the API
  bool _loadingVendor = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadVendor();
    });
  }

  /// Load the first available vendor from the API.
  /// Tries nearby first, then falls back to a wide radius.
  Future<void> _loadVendor() async {
    setState(() => _loadingVendor = true);
    try {
      // If a specific vendor is preselected by ID, fetch it directly
      if (widget.preselectedVendorId != null) {
        final raw = await VendorsRepository().getById(widget.preselectedVendorId!);
        final vendor = VendorModel.fromJson(raw);
        if (mounted) setState(() { _selectedVendor = vendor; _loadingVendor = false; });
        return;
      }

      // Try to load nearby shops (radius 50 km, then 1000 km as fallback)
      for (final radius in [50.0, 1000.0]) {
        final raw = await VendorsRepository().getNearby(28.6, 77.2, radius);
        if (raw.isNotEmpty) {
          final vendor = VendorModel.fromJson(raw.first as Map<String, dynamic>);
          if (mounted) setState(() { _selectedVendor = vendor; _loadingVendor = false; });
          return;
        }
      }
    } catch (e) {
      debugPrint('Failed to load vendor: $e');
    }
    if (mounted) setState(() => _loadingVendor = false);
  }

  /// Initial pick — allows selecting multiple files at once
  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.any,
      withData: kIsWeb,
      allowMultiple: true,
    );
    if (result == null || result.files.isEmpty) return;
    setState(() {
      _files.clear();
      _fileRecords.clear();
      _filePageCounts.clear();
      _thumbnails.clear();
      _pageTypes = {};
    });
    await _appendFiles(result.files);
  }

  /// Add button — pick more files and MERGE with existing
  Future<void> _addMoreFiles() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.any,
      withData: kIsWeb,
      allowMultiple: true,
    );
    if (result == null || result.files.isEmpty) return;
    await _appendFiles(result.files);
  }

  /// Shared logic: validate + render + upload each file, appending to state
  Future<void> _appendFiles(List<PlatformFile> picked) async {
    for (final file in picked) {
      if (file.size > AppConstants.maxFileSizeBytes) {
        _showError('${file.name}: too large (max 50 MB).');
        continue;
      }
      final fileIdx = _files.length;
      // Compute thumb offset = total pages so far
      final thumbOffset = _filePageCounts.fold(0, (a, b) => a + b);
      setState(() {
        _files.add(file);
        _fileRecords.add(null); // placeholder until upload completes
        _filePageCounts.add(0);
      });
      // Render thumbnails and upload in parallel
      _renderThumbnails(file, fileIdx, thumbOffset);
      _uploadFileAtIndex(file, fileIdx, thumbOffset);
    }
  }

  static const _imageExts = {'jpg','jpeg','png','gif','webp','bmp','tiff'};

  /// Render thumbnails for one file; for images reads bytes directly.
  Future<void> _renderThumbnails(PlatformFile file, int fileIdx, int thumbOffset) async {
    final ext = file.extension?.toLowerCase() ?? 'pdf';
    final isImage = _imageExts.contains(ext);
    final isPdf = ext == 'pdf';

    if (isImage) {
      // Read image bytes directly and store as thumbnail
      try {
        final bytes = kIsWeb ? file.bytes! : await File(file.path!).readAsBytes();
        setState(() {
          _filePageCounts[fileIdx] = 1;
          while (_thumbnails.length < thumbOffset + 1) _thumbnails.add(null);
          _thumbnails[thumbOffset] = bytes;
        });
      } catch (e) {
        debugPrint('Image read error: $e');
        setState(() => _filePageCounts[fileIdx] = 1);
        while (_thumbnails.length < thumbOffset + 1) _thumbnails.add(null);
      }
      return;
    }

    if (!isPdf) {
      // Other non-PDF: show file icon
      setState(() => _filePageCounts[fileIdx] = 1);
      while (_thumbnails.length < thumbOffset + 1) _thumbnails.add(null);
      return;
    }
    setState(() => _renderingThumbs = true);
    try {
      final doc = kIsWeb ? await PdfDocument.openData(file.bytes!) : await PdfDocument.openFile(file.path!);
      final count = doc.pagesCount;
      // Expand _thumbnails list and record count
      setState(() {
        _filePageCounts[fileIdx] = count;
        // Ensure list is long enough (may need padding for concurrent files)
        while (_thumbnails.length < thumbOffset + count) {
          _thumbnails.add(null);
        }
      });
      final limit = count > 30 ? 30 : count;
      for (int i = 1; i <= limit; i++) {
        final page = await doc.getPage(i);
        final img = await page.render(
          width: page.width * 0.3,
          height: page.height * 0.3,
          format: PdfPageImageFormat.jpeg,
          quality: 60,
        );
        await page.close();
        if (img != null && mounted) {
          final globalIdx = thumbOffset + i - 1;
          setState(() {
            if (globalIdx < _thumbnails.length) {
              _thumbnails[globalIdx] = img.bytes;
            }
          });
        }
      }
      await doc.close();
    } catch (e) {
      debugPrint('Thumbnail render error: $e');
    } finally {
      if (mounted) setState(() => _renderingThumbs = false);
    }
  }

  Future<void> _uploadFileAtIndex(
      PlatformFile file, int fileIdx, int thumbOffset) async {
    setState(() {
      _uploadingCount++;
      _uploadProgress = 0;
    });
    try {
      final record = await FilesRepository().upload(
        file.name,
        filePath: kIsWeb ? null : file.path,
        bytes: kIsWeb ? file.bytes : null,
        onProgress: (sent, total) =>
            setState(() => _uploadProgress = sent / total),
      );
      // Merge server-detected page types with global offset
      final pages = record['pages'] as List<dynamic>? ?? [];
      setState(() {
        _fileRecords[fileIdx] = record;
        for (final p in pages) {
          final pMap = p as Map<String, dynamic>;
          final localPage = pMap['page_number'] as int;
          final globalPage = thumbOffset + localPage;
          if (!_pageTypes.containsKey(globalPage)) {
            _pageTypes[globalPage] =
                (pMap['is_color'] as bool? ?? false)
                    ? PrintType.color
                    : PrintType.bw;
          }
        }
      });
    } catch (e) {
      String errMsg = 'Upload failed for ${file.name}.';
      if (e is DioException) {
        errMsg = 'Upload failed: ${e.response?.data ?? e.message}';
      } else {
        errMsg = 'Upload failed: $e';
      }
      _showError(errMsg);
      setState(() => _fileRecords[fileIdx] = null);
    } finally {
      setState(() => _uploadingCount--);
    }
  }

  // Resolve page types — only for _selectedPages (or all if none selected)
  List<Map<String, dynamic>> _resolvedPages() {
    // Use local count; fall back to server-reported total_pages from first record
    int total = _pageCountRaw;
    if (total == 0) {
      for (final r in _fileRecords) {
        total += (r?['total_pages'] as int? ?? 0);
      }
    }
    if (total == 0) return []; // genuinely unknown — backend accepts empty
    final activePages = _selectedPages.isEmpty
        ? List.generate(total, (i) => i + 1)
        : _selectedPages.toList()..sort();
    return activePages.map((pageNum) {
      final String type;
      switch (_colorMode) {
        case _ColorMode.colored:
          type = PrintType.color;
        case _ColorMode.bw:
          type = PrintType.bw;
        case _ColorMode.autoDetect:
        case _ColorMode.manual:
          type = _pageTypes[pageNum] ?? PrintType.bw;
      }
      return {'page_number': pageNum, 'print_type': type};
    }).toList();
  }

  bool _paymentInProgress = false;



  /// Renders a specific page from a PDF file as a pw.MemoryImage for embedding
  /// in a merged PDF document.
  Future<pw.MemoryImage?> _renderPageAsImage(PlatformFile pFile, int pageNum) async {
    final ext = pFile.extension?.toLowerCase() ?? 'pdf';
    if (_imageExts.contains(ext)) {
      // For images, just read the bytes directly
      final bytes = kIsWeb ? pFile.bytes! : await File(pFile.path!).readAsBytes();
      return pw.MemoryImage(bytes);
    }
    // For PDFs, render the specific page
    final doc = kIsWeb ? await PdfDocument.openData(pFile.bytes!) : await PdfDocument.openFile(pFile.path!);
    try {
      if (pageNum > doc.pagesCount) return null;
      final page = await doc.getPage(pageNum);
      final rendered = await page.render(
        width: page.width * 2,
        height: page.height * 2,
        format: PdfPageImageFormat.png,
      );
      await page.close();
      if (rendered == null) return null;
      return pw.MemoryImage(rendered.bytes);
    } finally {
      await doc.close();
    }
  }

  /// Merges specified global page indices into a single PDF document.
  /// [pageIndices] are 1-based global page numbers across all files.
  /// Returns the bytes of the merged PDF.
  Future<Uint8List> _buildMergedPdf(List<int> pageIndices, String label) async {
    final pdfDoc = pw.Document();
    final isLandscape = _orientation == _Orientation.landscape;

    for (final globalPage in pageIndices) {
      // Map global page number to (file index, local page number)
      int offset = 0;
      PlatformFile? pFile;
      int localPage = 1;
      for (int f = 0; f < _files.length; f++) {
        final fc = _filePageCounts.length > f ? _filePageCounts[f] : 0;
        if (globalPage <= offset + fc) {
          pFile = _files[f];
          localPage = globalPage - offset;
          break;
        }
        offset += fc;
      }
      if (pFile == null) continue;

      final image = await _renderPageAsImage(pFile, localPage);
      if (image == null) continue;

      if (isLandscape) {
        pdfDoc.addPage(
          pw.Page(
            pageFormat: pw.PdfPageFormat.a4,
            margin: pw.EdgeInsets.zero,
            build: (ctx) => pw.Center(
              child: pw.Transform.rotateBox(
                angle: -3.14159265 / 2,
                child: pw.Image(image,
                    fit: pw.BoxFit.contain,
                    width: pw.PdfPageFormat.a4.availableHeight,
                    height: pw.PdfPageFormat.a4.availableWidth),
              ),
            ),
          ),
        );
      } else {
        pdfDoc.addPage(
          pw.Page(
            pageFormat: pw.PdfPageFormat.a4,
            margin: pw.EdgeInsets.zero,
            build: (ctx) => pw.Center(
              child: pw.Image(image, fit: pw.BoxFit.contain),
            ),
          ),
        );
      }
    }

    return await pdfDoc.save();
  }

  /// Merges all uploaded files into either 1 or 2 PDFs based on the user's
  /// color mode, uploads them, and returns a list of uploaded file IDs.
  ///
  /// - Colored / B&W: all pages → 1 merged PDF
  /// - Auto Detect / Manual: color pages → 1 PDF, B&W pages → 1 PDF
  ///   (only creates the PDF if there are pages of that type)
  Future<List<String>> _mergeAndUploadFiles() async {
    final resolved = _resolvedPages();
    final total = _pageCountRaw;

    // Determine which global pages are active
    final activePages = _selectedPages.isEmpty
        ? List.generate(total, (i) => i + 1)
        : (_selectedPages.toList()..sort());

    if (_colorMode == _ColorMode.colored || _colorMode == _ColorMode.bw) {
      // Single merged PDF — all pages same color mode
      final label = _colorMode == _ColorMode.colored ? 'color' : 'bw';
      debugPrint('Merging ${activePages.length} pages into single $label PDF');
      final mergedBytes = await _buildMergedPdf(activePages, label);
      final record = await FilesRepository().upload(
        'merged_${label}_${DateTime.now().millisecondsSinceEpoch}.pdf',
        bytes: mergedBytes,
        onProgress: (sent, total) =>
            setState(() => _uploadProgress = sent / total),
      );
      return [record['id'].toString()];
    }

    // Auto Detect or Manual — split into color and B&W PDFs
    final colorPages = <int>[];
    final bwPages = <int>[];
    for (final p in resolved) {
      final pageNum = p['page_number'] as int;
      if (!activePages.contains(pageNum)) continue;
      if (p['print_type'] == PrintType.color) {
        colorPages.add(pageNum);
      } else {
        bwPages.add(pageNum);
      }
    }
    // If resolved is empty, default all to BW
    if (resolved.isEmpty) {
      bwPages.addAll(activePages);
    }

    final fileIds = <String>[];
    int step = 0;
    final totalSteps = (colorPages.isNotEmpty ? 1 : 0) + (bwPages.isNotEmpty ? 1 : 0);

    if (bwPages.isNotEmpty) {
      debugPrint('Merging ${bwPages.length} B&W pages into PDF');
      final bwBytes = await _buildMergedPdf(bwPages, 'bw');
      final record = await FilesRepository().upload(
        'merged_bw_${DateTime.now().millisecondsSinceEpoch}.pdf',
        bytes: bwBytes,
        onProgress: (sent, total) {
          step = 0;
          setState(() => _uploadProgress = (step + sent / total) / totalSteps);
        },
      );
      fileIds.add(record['id'].toString());
    }

    if (colorPages.isNotEmpty) {
      debugPrint('Merging ${colorPages.length} Color pages into PDF');
      final colorBytes = await _buildMergedPdf(colorPages, 'color');
      final record = await FilesRepository().upload(
        'merged_color_${DateTime.now().millisecondsSinceEpoch}.pdf',
        bytes: colorBytes,
        onProgress: (sent, total) {
          step = 1;
          setState(() => _uploadProgress = (step + sent / total) / totalSteps);
        },
      );
      fileIds.add(record['id'].toString());
    }

    return fileIds;
  }

  Future<void> _placeOrder() async {
    if (_selectedVendor == null) {
      _showError('Please select a print shop.');
      return;
    }

    try {
      final uploadedRecords =
          _fileRecords.where((r) => r != null && r['id'] != null).toList();
      if (uploadedRecords.isEmpty) {
        _showError('No uploaded files found. Please wait for upload to complete.');
        return;
      }

      // Merge all files into 1 or 2 PDFs based on color mode,
      // then upload the merged PDF(s) and use those file IDs.
      setState(() {
        _uploadingCount++;
        _uploadProgress = 0;
      });

      List<String> fileIds;
      try {
        fileIds = await _mergeAndUploadFiles();
      } finally {
        setState(() => _uploadingCount--);
      }

      if (fileIds.isEmpty) {
        _showError('Failed to merge files. Please try again.');
        return;
      }

      debugPrint('Placing order with merged file IDs: $fileIds');

      // Step 1: Create the order on the backend
      final order = await ref.read(ordersProvider.notifier).create({
        'vendor_id': _selectedVendor!.id,
        'file_id': fileIds.first,
        'file_ids': fileIds,
        'copies': _copies,
        'is_double_sided': _doubleSided,
        'orientation':
            _orientation == _Orientation.portrait ? 'PORTRAIT' : 'LANDSCAPE',
        'pages': _resolvedPages(),
      });

      // Step 2: Start Cashfree payment
      setState(() => _paymentInProgress = true);

      await PaymentService.instance.startPayment(
        orderId: order.id,
        onSuccess: (result) {
          if (!mounted) return;
          setState(() => _paymentInProgress = false);
          debugPrint('Payment successful: $result');

          // Navigate directly to the Order Details screen where it will show Waiting for Confirmation
          // context.go('/orders/${order.id}');
          
          // Show popup for successful payment
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (ctx) => AlertDialog(
              backgroundColor: AppColors.bg,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              contentPadding: const EdgeInsets.all(24),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_circle, color: AppColors.success, size: 50),
                  ),
                  const SizedBox(height: 20),
                  const Text('Payment Successful!',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 22, color: AppColors.textPrimary)),
                  const SizedBox(height: 12),
                  const Text(
                    'Your order has been placed.\nWaiting for the print shop to confirm.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        context.go('/orders/${order.id}');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('View Order Status', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
        onError: (error) {
          if (!mounted) return;
          setState(() => _paymentInProgress = false);
          debugPrint('Payment failed: $error');
          // Navigate to failed screen
          context.push('/payment-failed', extra: error?.toString());
        },
      );
    } catch (e) {
      setState(() => _paymentInProgress = false);
      debugPrint('Place order error: $e');
      if (e is DioException) {
        _showError('Failed to place order: ${e.response?.data}');
      } else {
        _showError('Failed to place order: ${e.toString().split('\n').first}');
      }
    }
  }

  int get _pageCountRaw =>
      _filePageCounts.fold(0, (a, b) => a + b);

  int get _totalPages => _pageCountRaw * _copies; // used by _placeOrder payload

  // ── Select Specific Pages ────────────────────────────────────────────────
  /// Returns a file-type icon widget for thumbnail slot [globalIdx]
  Widget _fileIconForIndex(int globalIdx) {
    // Figure out which file this index belongs to
    int offset = 0;
    for (int f = 0; f < _files.length; f++) {
      final fc = _filePageCounts.length > f ? _filePageCounts[f] : 0;
      if (globalIdx < offset + fc) {
        return _fileTypeIcon(_files[f].name);
      }
      offset += fc;
    }
    return const Icon(Icons.insert_drive_file_outlined,
        color: AppColors.textTertiary, size: 28);
  }

  Widget _fileTypeIcon(String name) {
    final ext = name.split('.').last.toLowerCase();
    switch (ext) {
      case 'pdf':
        return const Icon(Icons.picture_as_pdf_rounded,
            color: Color(0xFFE53935), size: 28);
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': case 'bmp':
        return const Icon(Icons.image_rounded,
            color: Color(0xFF1E88E5), size: 28);
      case 'xls': case 'xlsx': case 'csv': case 'ods':
        return const Icon(Icons.table_chart_rounded,
            color: Color(0xFF43A047), size: 28);
      case 'doc': case 'docx': case 'odt':
        return const Icon(Icons.description_rounded,
            color: Color(0xFF1565C0), size: 28);
      case 'ppt': case 'pptx': case 'odp':
        return const Icon(Icons.slideshow_rounded,
            color: Color(0xFFE64A19), size: 28);
      case 'txt':
        return const Icon(Icons.text_snippet_rounded,
            color: AppColors.textSecondary, size: 28);
      default:
        return const Icon(Icons.insert_drive_file_outlined,
            color: AppColors.textTertiary, size: 28);
    }
  }

  Future<void> _showSelectPages() async {
    final result = await showModalBottomSheet<Set<int>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PageRangeSheet(
        totalPages: _pageCountRaw,
        initial: Set.from(_selectedPages),
        thumbnails: _thumbnails,
      ),
    );
    if (result != null) {
      setState(() => _selectedPages = result);
    }
  }

  // ── Price Breakup ──────────────────────────────────────────────────────
  void _showBreakup() {
    final vendor = _selectedVendor;
    if (vendor == null || _pageCountRaw == 0) return;

    final priceBw = vendor.settings?.priceBw ?? 2;
    final priceColor = vendor.settings?.priceColor ?? 10;

    // Count BW vs Color pages based on current mode
    final resolved = _resolvedPages();
    int bwPages = 0;
    int colorPages = 0;
    for (final p in resolved) {
      if (p['print_type'] == PrintType.color) {
        colorPages++;
      } else {
        bwPages++;
      }
    }
    // If no resolved pages yet (still uploading), estimate from local count
    if (resolved.isEmpty && _pageCountRaw > 0) {
      if (_colorMode == _ColorMode.colored) {
        colorPages = _pageCountRaw;
      } else if (_colorMode == _ColorMode.bw) {
        bwPages = _pageCountRaw;
      } else {
        bwPages = _pageCountRaw; // default estimate
      }
    }

    final bwTotal = bwPages * priceBw * _copies;
    final colorTotal = colorPages * priceColor * _copies;
    final doubleSidedExtra = _doubleSided
        ? (_pageCountRaw * _copies * (vendor.settings?.priceDoubleSided ?? 0))
        : 0.0;
    final grandTotal = bwTotal + colorTotal + doubleSidedExtra;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const Text('Price Breakup',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 16),
            if (bwPages > 0)
              _breakupRow(
                'B&W pages',
                '$bwPages × ₹${priceBw.toStringAsFixed(0)} × $_copies copies',
                '₹${bwTotal.toStringAsFixed(0)}',
              ),
            if (colorPages > 0)
              _breakupRow(
                'Color pages',
                '$colorPages × ₹${priceColor.toStringAsFixed(0)} × $_copies copies',
                '₹${colorTotal.toStringAsFixed(0)}',
              ),
            if (_doubleSided && doubleSidedExtra > 0)
              _breakupRow(
                'Double-sided',
                '$_pageCountRaw × ₹${(vendor.settings?.priceDoubleSided ?? 0).toStringAsFixed(0)} × $_copies',
                '₹${doubleSidedExtra.toStringAsFixed(0)}',
              ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary)),
                Text('₹${grandTotal.toStringAsFixed(0)}',
                    style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Returns formatted total price string for the footer
  String _calcTotalPrice() {
    final vendor = _selectedVendor;
    if (vendor == null || _pageCountRaw == 0) return '₹0';

    final priceBw = vendor.settings?.priceBw ?? 2;
    final priceColor = vendor.settings?.priceColor ?? 10;

    final resolved = _resolvedPages();
    int bwPages = 0;
    int colorPages = 0;
    if (resolved.isEmpty) {
      // estimate before upload finishes
      if (_colorMode == _ColorMode.colored) {
        colorPages = _pageCountRaw;
      } else {
        bwPages = _pageCountRaw;
      }
    } else {
      for (final p in resolved) {
        if (p['print_type'] == PrintType.color) { colorPages++; } else { bwPages++; }
      }
    }

    final total = (bwPages * priceBw + colorPages * priceColor) * _copies
        + (_doubleSided ? _pageCountRaw * _copies * (vendor.settings?.priceDoubleSided ?? 0) : 0);
    return '₹${total.toStringAsFixed(0)}';
  }

  Widget _breakupRow(String label, String detail, String price) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary)),
                  Text(detail,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textTertiary)),
                ],
              ),
            ),
            Text(price,
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary)),
          ],
        ),
      );

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final orderState = ref.watch(ordersProvider);

    // If no files yet, show the shop selector + file picker step
    if (_files.isEmpty) {
      return _buildFilePickStep();
    }

    // File selected — show the options screen
    return _buildOptionsStep(orderState);
  }

  // ── Step 1: Pick file & shop ───────────────────────────────────────────────

  Widget _buildFilePickStep() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Standard Documents'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Shop selection
            const Text('SELECT SHOP',
                style: TextStyle(
                    color: AppColors.textTertiary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5)),
            const SizedBox(height: 8),
            if (_loadingVendor)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Row(
                  children: [
                    SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                    SizedBox(width: 12),
                    Text('Loading print shop...', style: TextStyle(color: AppColors.textSecondary)),
                  ],
                ),
              )
            else if (_selectedVendor != null) ...[
              ShopCard(shop: _selectedVendor!, onTap: () {}, compact: true),
              TextButton(
                onPressed: () => setState(() => _selectedVendor = null),
                child: const Text('Change shop',
                    style: TextStyle(color: AppColors.primary)),
              ),
            ] else
              GestureDetector(
                onTap: () async {
                  await context.push('/shops');
                  // After returning, check if a vendor was preselected
                },
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Row(children: [
                    Icon(Icons.storefront_outlined, color: AppColors.primary),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text('Select a nearby shop',
                          style: TextStyle(
                              color: AppColors.textPrimary, fontSize: 15)),
                    ),
                    Icon(Icons.chevron_right, color: AppColors.textTertiary),
                  ]),
                ),
              ),
            const SizedBox(height: 28),

            // File picker
            const Text('UPLOAD PDF',
                style: TextStyle(
                    color: AppColors.textTertiary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _pickFile,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 48),
                decoration: BoxDecoration(
                  border: Border.all(
                      color: AppColors.primary,
                      width: 2,
                      strokeAlign: BorderSide.strokeAlignCenter),
                  borderRadius: BorderRadius.circular(16),
                  color: AppColors.primarySurface,
                ),
                child: const Column(children: [
                  Icon(Icons.picture_as_pdf_outlined,
                      color: AppColors.primary, size: 44),
                  SizedBox(height: 10),
                  Text('Tap to select PDF',
                      style: TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 16)),
                  SizedBox(height: 4),
                  Text('Max 50 MB',
                      style: TextStyle(
                          color: AppColors.textTertiary, fontSize: 12)),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 2: Options (matches screenshot) ──────────────────────────────────

  Widget _buildOptionsStep(OrdersState orderState) {
    final totalPages = _pageCountRaw;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Standard Documents'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() {
            _files.clear();
            _fileRecords.clear();
            _filePageCounts.clear();
            _thumbnails.clear();
            _pageTypes = {};
          }),
        ),
        actions: [
          // + Add button for adding more files
          TextButton.icon(
            onPressed: _addMoreFiles,
            icon: const Icon(Icons.add, color: AppColors.primary, size: 18),
            label: Text(
              _files.isEmpty ? 'Add' : 'Add (${_files.length})',
              style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13)),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── Uploading progress ──────────────────────────────
                  if (_uploadingCount > 0)
                    LinearProgressIndicator(
                      value: _uploadProgress,
                      backgroundColor: AppColors.border,
                      color: AppColors.primary,
                    ),

                  // ── PDF Thumbnail Strip ───────────────────────────────
                  if (_thumbnails.isNotEmpty || _renderingThumbs)
                    Container(
                      height: 130,
                      margin: const EdgeInsets.only(top: 8),
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: _pageCountRaw > 0 ? _pageCountRaw : (_thumbnails.isEmpty ? 0 : _thumbnails.length),
                        itemBuilder: (context, i) {
                          final thumb = i < _thumbnails.length ? _thumbnails[i] : null;
                          return GestureDetector(
                            onTap: () {
                              // Find which file this global index belongs to
                              int offset = 0;
                              for (int f = 0; f < _files.length; f++) {
                                final fc = _filePageCounts.length > f ? _filePageCounts[f] : 0;
                                if (i < offset + fc) {
                                  final filePath = _files[f].path!;
                                  final ext = filePath.split('.').last.toLowerCase();
                                  if (_imageExts.contains(ext)) {
                                    showDialog(
                                      context: context,
                                      builder: (_) => Dialog(
                                        backgroundColor: Colors.black,
                                        insetPadding: EdgeInsets.zero,
                                        child: GestureDetector(
                                          onTap: () => Navigator.of(context).pop(),
                                          child: InteractiveViewer(
                                            child: Image.file(
                                              File(filePath),
                                              fit: BoxFit.contain,
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  } else {
                                    final localPage = i - offset + 1;
                                    Navigator.of(context).push(MaterialPageRoute(
                                      builder: (_) => PdfViewerScreen(
                                        filePath: filePath,
                                        initialPage: localPage,
                                      ),
                                    ));
                                  }
                                  return;
                                }
                                offset += fc;
                              }
                            },
                            child: Container(
                              width: 80,
                              margin: const EdgeInsets.only(right: 8),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: thumb != null
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(7),
                                      child: Image.memory(thumb, fit: BoxFit.cover),
                                    )
                                  : Center(child: _fileIconForIndex(i)),
                            ),
                          );
                        },
                      ),
                    ),
                  if (_pageCountRaw > 0)
                    Center(
                      child: Container(
                        margin: const EdgeInsets.only(top: 6, bottom: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _files.length > 1
                              ? '${_files.length} docs · $_pageCountRaw pages'
                              : 'Doc 1/1 · $_pageCountRaw pages',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),

                  const SizedBox(height: 8),

                  // ── Number of Copies ────────────────────────────────
                  _Section(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Number of Copies',
                                    style: TextStyle(
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15)),
                                Text(
                                  'File 1 ($totalPages pages)',
                                  style: const TextStyle(
                                      color: AppColors.textTertiary,
                                      fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          _Stepper(
                            value: _copies,
                            onDecrement: _copies > 1
                                ? () => setState(() => _copies--)
                                : null,
                            onIncrement: _copies < 99
                                ? () => setState(() => _copies++)
                                : null,
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // ── Checkboxes ──────────────────────────────────────
                  _Section(
                    child: Column(
                      children: [
                        // Print entire document
                        InkWell(
                          onTap: () =>
                              setState(() => _printEntire = !_printEntire),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Checkbox(
                                  value: _printEntire,
                                  onChanged: (v) => setState(
                                      () => _printEntire = v ?? true),
                                ),
                                const SizedBox(width: 8),
                                const Expanded(
                                  child: Text('Print entire document',
                                      style: TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500)),
                                ),
                                GestureDetector(
                                  onTap: _pageCountRaw > 0 ? _showSelectPages : null,
                                  child: Text(
                                    _selectedPages.isEmpty
                                        ? 'Select Pages'
                                        : '${_selectedPages.length} selected',
                                    style: TextStyle(
                                        color: _selectedPages.isEmpty
                                            ? AppColors.primary
                                            : AppColors.warning,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const Divider(height: 1, color: AppColors.border),
                        // Double-sided
                        InkWell(
                          onTap: () =>
                              setState(() => _doubleSided = !_doubleSided),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Checkbox(
                                  value: _doubleSided,
                                  onChanged: (v) => setState(
                                      () => _doubleSided = v ?? false),
                                ),
                                const SizedBox(width: 8),
                                const Expanded(
                                  child: Text('Double-sided',
                                      style: TextStyle(
                                          color: AppColors.textPrimary,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500)),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 8),

                  // ── Select Print Color ───────────────────────────────
                  _Section(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Select Print Color',
                              style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15)),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _ColorOptionTile(
                                  icon: Icons.palette,
                                  iconColor: Colors.purple,
                                  title: 'Colored',
                                  subtitle: 'Print All in Color',
                                  selected:
                                      _colorMode == _ColorMode.colored,
                                  onTap: () => setState(
                                      () => _colorMode = _ColorMode.colored),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _ColorOptionTile(
                                  icon: Icons.invert_colors,
                                  iconColor: Colors.grey.shade700,
                                  title: 'Black & White',
                                  subtitle: 'Print All in B&W',
                                  selected: _colorMode == _ColorMode.bw,
                                  onTap: () => setState(
                                      () => _colorMode = _ColorMode.bw),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: _ColorOptionTile(
                                  icon: Icons.auto_fix_high,
                                  iconColor: AppColors.primary,
                                  title: 'Auto Detect',
                                  subtitle: 'Color + B&W',
                                  selected:
                                      _colorMode == _ColorMode.autoDetect,
                                  onTap: () => setState(
                                      () =>
                                          _colorMode = _ColorMode.autoDetect),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _ColorOptionTile(
                                  icon: Icons.tune,
                                  iconColor: AppColors.primary,
                                  title: 'Manual Mode',
                                  subtitle: 'Per-page control',
                                  selected: _colorMode == _ColorMode.manual,
                                  disabled: false,
                                  onTap: () => setState(
                                      () => _colorMode = _ColorMode.manual),
                                ),
                              ),
                            ],
                          ),
                          // ── Manual mode thumbnail grid ──────────────
                          if (_colorMode == _ColorMode.manual) ...[
                            const SizedBox(height: 14),
                            const Text('Tap pages to mark as Color (rest stay B&W)',
                                style: TextStyle(
                                    color: AppColors.textTertiary,
                                    fontSize: 12)),
                            const SizedBox(height: 8),
                            SizedBox(
                              height: 120,
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                itemCount: _pageCountRaw,
                                itemBuilder: (context, i) {
                                  final pageNum = i + 1;
                                  final isColor = (_pageTypes[pageNum] ?? PrintType.bw) == PrintType.color;
                                  final thumb = i < _thumbnails.length ? _thumbnails[i] : null;
                                  return GestureDetector(
                                    onTap: () => setState(() {
                                      _pageTypes[pageNum] = isColor ? PrintType.bw : PrintType.color;
                                    }),
                                    child: Container(
                                      width: 75,
                                      margin: const EdgeInsets.only(right: 8),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: isColor ? Colors.amber : AppColors.border,
                                          width: isColor ? 2 : 1,
                                        ),
                                      ),
                                      child: Stack(
                                        children: [
                                          if (thumb != null)
                                            ClipRRect(
                                              borderRadius: BorderRadius.circular(7),
                                              child: Image.memory(thumb,
                                                  fit: BoxFit.cover,
                                                  width: 75,
                                                  height: 120),
                                            )
                                          else
                                            Center(
                                              child: Text('P$pageNum',
                                                  style: const TextStyle(
                                                      color: AppColors.textTertiary,
                                                      fontSize: 11)),
                                            ),
                                          // Color/BW badge
                                          Positioned(
                                            bottom: 2,
                                            right: 2,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(
                                                  horizontal: 5, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: isColor
                                                    ? Colors.amber
                                                    : Colors.grey.shade600,
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                isColor ? '🟡' : '⬜',
                                                style: const TextStyle(fontSize: 10),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // ── Select Print Orientation ─────────────────────────
                  _Section(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Select print orientation',
                              style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15)),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _OrientationTile(
                                  icon: Icons.stay_current_portrait,
                                  title: 'Portrait',
                                  subtitle: '8.3 x 11.7 inch',
                                  selected: _orientation ==
                                      _Orientation.portrait,
                                  onTap: () => setState(
                                      () =>
                                          _orientation = _Orientation.portrait),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _OrientationTile(
                                  icon: Icons.stay_current_landscape,
                                  title: 'Landscape',
                                  subtitle: '11.7 x 8.3 inch',
                                  selected: _orientation ==
                                      _Orientation.landscape,
                                  onTap: () => setState(
                                      () =>
                                          _orientation = _Orientation.landscape),
                                ),
                              ),
                            ],
                          ),
                          // ── Live paper preview ──────────────────────────
                          if (_thumbnails.isNotEmpty && _thumbnails[0] != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 16),
                              child: Center(
                                child: Container(
                                  width: 120,
                                  height: 170,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: AppColors.border,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.08),
                                        blurRadius: 12,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  clipBehavior: Clip.antiAlias,
                                  child: Stack(
                                    fit: StackFit.expand,
                                    children: [
                                      Padding(
                                        padding: const EdgeInsets.all(8),
                                        child: AnimatedRotation(
                                          turns: _orientation == _Orientation.landscape ? -0.25 : 0,
                                          duration: const Duration(milliseconds: 300),
                                          curve: Curves.easeInOut,
                                          child: FittedBox(
                                            fit: BoxFit.contain,
                                            child: Image.memory(
                                              _thumbnails[0]!,
                                              fit: BoxFit.contain,
                                            ),
                                          ),
                                        ),
                                      ),
                                      // Label badge
                                      Positioned(
                                        bottom: 4,
                                        right: 4,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 6, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withOpacity(0.9),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            _orientation == _Orientation.landscape
                                                ? 'Landscape'
                                                : 'Portrait',
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 9,
                                                fontWeight: FontWeight.w600),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // ── Shop selection (compact) ─────────────────────────
                  if (_loadingVendor)
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(children: [
                        SizedBox(width: 18, height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                        SizedBox(width: 10),
                        Text('Loading print shop...', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      ]),
                    )
                  else if (_selectedVendor == null)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: GestureDetector(
                        onTap: () => context.push('/shops'),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.primarySurface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.primary),
                          ),
                          child: const Row(children: [
                            Icon(Icons.storefront_outlined,
                                color: AppColors.primary),
                            SizedBox(width: 12),
                            Expanded(
                              child: Text('Select a shop to proceed',
                                  style: TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14)),
                            ),
                            Icon(Icons.chevron_right,
                                color: AppColors.primary),
                          ]),
                        ),
                      ),
                    )
                  else
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: ShopCard(
                          shop: _selectedVendor!, onTap: () {}, compact: true),
                    ),

                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),

          // ── Footer: Total Pages + Proceed ──────────────────────────────
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: AppColors.bg,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Total Price',
                        style: TextStyle(
                            color: AppColors.textSecondary, fontSize: 12)),
                    Text(_calcTotalPrice(),
                        style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 20)),
                    GestureDetector(
                      onTap: _showBreakup,
                      child: const Text('View Breakup',
                          style: TextStyle(
                              color: AppColors.primary,
                              fontSize: 12,
                              decoration: TextDecoration.underline,
                              decorationColor: AppColors.primary)),
                    ),
                  ],
                ),
                const Spacer(),
                SizedBox(
                  width: 160,
                  child: ElevatedButton.icon(
                    onPressed: (orderState.isLoading ||
                            _paymentInProgress ||
                            _loadingVendor ||
                            _selectedVendor == null ||
                            _uploadingCount > 0)
                        ? null
                        : _placeOrder,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(160, 48),
                    ),
                    icon: (orderState.isLoading || _paymentInProgress)
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.payment, size: 18),
                    label: (orderState.isLoading || _paymentInProgress)
                        ? const Text('Processing...')
                        : Text('Pay ${_calcTotalPrice()}'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Shared section wrapper ────────────────────────────────────────────────────

class _Section extends StatelessWidget {
  final Widget child;
  const _Section({required this.child});

  @override
  Widget build(BuildContext context) => Container(
        color: AppColors.bg,
        child: child,
      );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

class _Stepper extends StatelessWidget {
  final int value;
  final VoidCallback? onDecrement;
  final VoidCallback? onIncrement;
  const _Stepper(
      {required this.value,
      required this.onDecrement,
      required this.onIncrement});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          _StepBtn(icon: Icons.remove, onTap: onDecrement),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text('$value',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700)),
          ),
          _StepBtn(icon: Icons.add, onTap: onIncrement),
        ]),
      );
}

class _StepBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _StepBtn({required this.icon, this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color:
                onTap != null ? Colors.white24 : Colors.white10,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon,
              size: 18,
              color: onTap != null ? Colors.white : Colors.white38),
        ),
      );
}

// ─── Color Option Tile ────────────────────────────────────────────────────────

class _ColorOptionTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool selected;
  final bool disabled;
  final VoidCallback? onTap;

  const _ColorOptionTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.selected,
    this.disabled = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: disabled ? null : onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: selected ? AppColors.primarySurface : AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
                color:
                    selected ? AppColors.primary : AppColors.border,
                width: selected ? 1.5 : 1),
          ),
          child: Row(
            children: [
              Icon(icon,
                  size: 22,
                  color: disabled ? AppColors.textDisabled : iconColor),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: TextStyle(
                            color: disabled
                                ? AppColors.textDisabled
                                : AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 12)),
                    Text(subtitle,
                        style: TextStyle(
                            color: disabled
                                ? AppColors.textDisabled
                                : AppColors.textTertiary,
                            fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}

// ─── Page Range Selection Sheet ───────────────────────────────────────────────

class _PageRange {
  int from;
  int to;
  _PageRange(this.from, this.to);
}

class _PageRangeSheet extends StatefulWidget {
  final int totalPages;
  final Set<int> initial;
  final List<Uint8List?> thumbnails;

  const _PageRangeSheet({
    required this.totalPages,
    required this.initial,
    required this.thumbnails,
  });

  @override
  State<_PageRangeSheet> createState() => _PageRangeSheetState();
}

class _PageRangeSheetState extends State<_PageRangeSheet> {
  final List<_PageRange> _ranges = [];

  @override
  void initState() {
    super.initState();
    // Pre-populate from existing selection
    if (widget.initial.isNotEmpty) {
      final sorted = widget.initial.toList()..sort();
      int start = sorted.first;
      int prev = sorted.first;
      for (int i = 1; i < sorted.length; i++) {
        if (sorted[i] == prev + 1) {
          prev = sorted[i];
        } else {
          _ranges.add(_PageRange(start, prev));
          start = sorted[i];
          prev = sorted[i];
        }
      }
      _ranges.add(_PageRange(start, prev));
    }
  }

  Set<int> get _selectedSet {
    final set = <int>{};
    for (final r in _ranges) {
      final lo = r.from.clamp(1, widget.totalPages);
      final hi = r.to.clamp(1, widget.totalPages);
      for (int p = lo; p <= hi; p++) {
        set.add(p);
      }
    }
    return set;
  }

  int get _selectedCount => _selectedSet.length;

  void _addRange() {
    setState(() => _ranges.add(_PageRange(1, widget.totalPages)));
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: AppColors.bg,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Drag handle
            Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 0),
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('Select Specific Pages',
                        style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.textSecondary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            // Stats row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                  Text('Total Pages = ${widget.totalPages}',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 13)),
                  const Spacer(),
                  Text('Selected Pages = $_selectedCount',
                      style: TextStyle(
                          color: _selectedCount > 0
                              ? AppColors.primary
                              : AppColors.textSecondary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            // Range list + Add Range button
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                children: [
                  if (_ranges.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Text('No pages selected',
                          style: TextStyle(
                              color: AppColors.textTertiary, fontSize: 14)),
                    ),
                  ..._ranges.asMap().entries.map((entry) {
                    final i = entry.key;
                    final r = entry.value;
                    return _RangeTile(
                      key: ValueKey(i),
                      range: r,
                      totalPages: widget.totalPages,
                      thumbnails: widget.thumbnails,
                      onDelete: () => setState(() => _ranges.removeAt(i)),
                      onChanged: () => setState(() {}),
                    );
                  }),
                  const SizedBox(height: 8),
                  // + Add Range button
                  OutlinedButton.icon(
                    onPressed: _addRange,
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Add Range'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      minimumSize: const Size(double.infinity, 48),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
            // Clear + Apply
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
              decoration: const BoxDecoration(
                color: AppColors.bg,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _ranges.clear()),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.pinkAccent,
                        side: const BorderSide(color: Colors.pinkAccent),
                        minimumSize: const Size(0, 52),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Clear',
                          style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () =>
                          Navigator.pop(context, _selectedSet),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(0, 52),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Apply',
                          style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Single Range Tile ─────────────────────────────────────────────────────────

class _RangeTile extends StatefulWidget {
  final _PageRange range;
  final int totalPages;
  final List<Uint8List?> thumbnails;
  final VoidCallback onDelete;
  final VoidCallback onChanged;

  const _RangeTile({
    super.key,
    required this.range,
    required this.totalPages,
    required this.thumbnails,
    required this.onDelete,
    required this.onChanged,
  });

  @override
  State<_RangeTile> createState() => _RangeTileState();
}

class _RangeTileState extends State<_RangeTile> {
  late final TextEditingController _fromCtrl;
  late final TextEditingController _toCtrl;

  @override
  void initState() {
    super.initState();
    _fromCtrl = TextEditingController(text: '${widget.range.from}');
    _toCtrl = TextEditingController(text: '${widget.range.to}');
  }

  @override
  void dispose() {
    _fromCtrl.dispose();
    _toCtrl.dispose();
    super.dispose();
  }

  void _update() {
    final f = int.tryParse(_fromCtrl.text) ?? 1;
    final t = int.tryParse(_toCtrl.text) ?? widget.totalPages;
    widget.range.from = f.clamp(1, widget.totalPages);
    widget.range.to = t.clamp(f, widget.totalPages);
    widget.onChanged();
  }

  @override
  Widget build(BuildContext context) {
    // Preview thumbnails for the range
    final pages = <int>[];
    for (int p = widget.range.from; p <= widget.range.to && p <= widget.totalPages; p++) {
      pages.add(p);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // From – To + delete
          Row(
            children: [
              const Text('Pages',
                  style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      fontWeight: FontWeight.w500)),
              const SizedBox(width: 12),
              _PageInput(
                controller: _fromCtrl,
                label: 'From',
                onChanged: _update,
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Text('–',
                    style: TextStyle(
                        color: AppColors.textTertiary, fontSize: 16)),
              ),
              _PageInput(
                controller: _toCtrl,
                label: 'To',
                onChanged: _update,
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.delete_outline,
                    color: AppColors.error, size: 20),
                onPressed: widget.onDelete,
              ),
            ],
          ),
          if (pages.isNotEmpty) ...[
            const SizedBox(height: 10),
            SizedBox(
              height: 64,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: pages.length,
                itemBuilder: (_, i) {
                  final pageNum = pages[i];
                  final thumb = pageNum - 1 < widget.thumbnails.length
                      ? widget.thumbnails[pageNum - 1]
                      : null;
                  return Container(
                    width: 48,
                    margin: const EdgeInsets.only(right: 6),
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.primary, width: 1.5),
                    ),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (thumb != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(5),
                            child: Image.memory(thumb, fit: BoxFit.cover),
                          ),
                        Align(
                          alignment: Alignment.bottomCenter,
                          child: Container(
                            color: AppColors.primary.withOpacity(0.75),
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 1),
                            child: Text('$pageNum',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700)),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
          // Summary badge
          const SizedBox(height: 6),
          Text(
            '${pages.length} page${pages.length == 1 ? '' : 's'} selected',
            style: const TextStyle(
                color: AppColors.primary,
                fontSize: 12,
                fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _PageInput extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final VoidCallback onChanged;

  const _PageInput({
    required this.controller,
    required this.label,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 64,
        child: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          onChanged: (_) => onChanged(),
          style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary),
          decoration: InputDecoration(
            labelText: label,
            labelStyle: const TextStyle(
                fontSize: 11, color: AppColors.textTertiary),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide:
                  const BorderSide(color: AppColors.primary, width: 1.5),
            ),
          ),
        ),
      );
}
// ─── Orientation Tile ─────────────────────────────────────────────────────────

class _OrientationTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  const _OrientationTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: selected ? AppColors.primarySurface : AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
                color: selected ? AppColors.primary : AppColors.border,
                width: selected ? 1.5 : 1),
          ),
          child: Row(
            children: [
              Icon(icon,
                  size: 24,
                  color: selected
                      ? AppColors.primary
                      : AppColors.textSecondary),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 12)),
                    Text(subtitle,
                        style: const TextStyle(
                            color: AppColors.textTertiary,
                            fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}
