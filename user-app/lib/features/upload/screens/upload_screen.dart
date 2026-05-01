import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:paper_prints_user/core/constants/app_constants.dart';
import 'package:paper_prints_user/core/network/repositories.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/orders/providers/orders_provider.dart';
import 'package:paper_prints_user/features/shops/providers/shops_provider.dart';
import 'package:paper_prints_user/shared/widgets/shop_card.dart';

class UploadScreen extends ConsumerStatefulWidget {
  final String? preselectedVendorId;
  const UploadScreen({super.key, this.preselectedVendorId});

  @override
  ConsumerState<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends ConsumerState<UploadScreen> {
  VendorModel? _selectedVendor;
  PlatformFile? _file;
  Map<String, dynamic>? _fileRecord;
  bool _uploading = false;
  double _uploadProgress = 0;
  int _copies = 1;
  bool _doubleSided = false;
  Map<int, String> _pageTypes = {}; // page_number -> 'BW' | 'COLOR'

  @override
  void initState() {
    super.initState();
    if (widget.preselectedVendorId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final shops = ref.read(nearbyShopsProvider).shops;
        final match =
            shops.where((s) => s.id == widget.preselectedVendorId).firstOrNull;
        if (match != null) setState(() => _selectedVendor = match);
      });
    }
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
      withData: false,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;

    if ((file.size) > AppConstants.maxFileSizeBytes) {
      _showError('File too large. Maximum size is 50 MB.');
      return;
    }

    setState(() {
      _file = file;
      _fileRecord = null;
      _pageTypes = {};
    });
    await _uploadFile(file);
  }

  Future<void> _uploadFile(PlatformFile file) async {
    setState(() {
      _uploading = true;
      _uploadProgress = 0;
    });
    try {
      final record = await FilesRepository().upload(
        file.path!,
        file.name,
        onProgress: (sent, total) =>
            setState(() => _uploadProgress = sent / total),
      );
      final pages = record['pages'] as List<dynamic>? ?? [];
      final defaults = <int, String>{};
      for (final p in pages) {
        final pMap = p as Map<String, dynamic>;
        defaults[pMap['page_number'] as int] =
            (pMap['is_color'] as bool? ?? false) ? PrintType.color : PrintType.bw;
      }
      setState(() {
        _fileRecord = record;
        _pageTypes = defaults;
      });
    } catch (e) {
      _showError('Upload failed. Please try again.');
      setState(() => _file = null);
    } finally {
      setState(() => _uploading = false);
    }
  }

  Future<void> _placeOrder() async {
    if (_selectedVendor == null) {
      _showError('Please select a print shop.');
      return;
    }
    if (_fileRecord == null) {
      _showError('Please upload a PDF first.');
      return;
    }

    final pages = _pageTypes.entries
        .map((e) => {'page_number': e.key, 'print_type': e.value})
        .toList();

    try {
      final order = await ref.read(ordersProvider.notifier).create({
        'vendor_id': _selectedVendor!.id,
        'file_id': _fileRecord!['id'],
        'copies': _copies,
        'is_double_sided': _doubleSided,
        'pages': pages,
      });
      if (mounted) context.push('/orders/${order.id}');
    } catch (e) {
      _showError('Failed to place order. Please try again.');
    }
  }

  double? get _estimatedPrice {
    if (_fileRecord == null || _selectedVendor?.settings == null) return null;
    final s = _selectedVendor!.settings!;
    double total = 0;
    for (final type in _pageTypes.values) {
      total += type == PrintType.color ? s.priceColor : s.priceBw;
    }
    if (_doubleSided && s.priceDoubleSided != null) {
      total += s.priceDoubleSided! * (_fileRecord!['total_pages'] as int? ?? 1);
    }
    return total * _copies;
  }

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

    return Scaffold(
      appBar: AppBar(title: const Text('New Print Order')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [

          // Step 1: Shop
          _stepLabel('1. Print Shop'),
          if (_selectedVendor != null) ...[
            ShopCard(shop: _selectedVendor!, onTap: () {}, compact: true),
            TextButton(
              onPressed: () => setState(() => _selectedVendor = null),
              child: const Text('Change shop',
                  style: TextStyle(color: AppColors.primary)),
            ),
          ] else
            GestureDetector(
              onTap: () => context.push('/shops'),
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
                  Icon(Icons.chevron_right, color: AppColors.textDisabled),
                ]),
              ),
            ),
          const SizedBox(height: 24),

          // Step 2: PDF
          _stepLabel('2. Upload PDF'),
          if (_file == null)
            GestureDetector(
              onTap: _pickFile,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 40),
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
                      color: AppColors.primary, size: 40),
                  SizedBox(height: 8),
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
            )
          else
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(children: [
                const Icon(Icons.picture_as_pdf,
                    color: AppColors.primary, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_file!.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: AppColors.textPrimary, fontSize: 14)),
                      const SizedBox(height: 2),
                      if (_uploading)
                        LinearProgressIndicator(
                          value: _uploadProgress,
                          backgroundColor: AppColors.border,
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(4),
                        )
                      else if (_fileRecord != null)
                        Text(
                            '✓ ${_fileRecord!['total_pages']} pages analysed',
                            style: const TextStyle(
                                color: AppColors.success, fontSize: 12)),
                    ],
                  ),
                ),
                if (!_uploading)
                  IconButton(
                    icon: const Icon(Icons.refresh,
                        color: AppColors.textTertiary),
                    onPressed: _pickFile,
                  ),
              ]),
            ),
          const SizedBox(height: 24),

          // Step 3: Print Options
          if (_fileRecord != null) ...[
            _stepLabel('3. Print Options'),
            _PrintOptions(
              pages: (_fileRecord!['pages'] as List<dynamic>? ?? [])
                  .map((e) => e as Map<String, dynamic>)
                  .toList(),
              pageTypes: _pageTypes,
              copies: _copies,
              doubleSided: _doubleSided,
              onPageTypeChange: (page, type) =>
                  setState(() => _pageTypes[page] = type),
              onCopiesChange: (v) => setState(() => _copies = v),
              onDoubleSidedChange: (v) => setState(() => _doubleSided = v),
            ),
            const SizedBox(height: 24),
          ],

          // Price + CTA
          if (_fileRecord != null && _selectedVendor != null) ...[
            if (_estimatedPrice != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  'Estimated: ₹${_estimatedPrice!.toStringAsFixed(2)}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 18),
                ),
              ),
            ElevatedButton(
              onPressed: orderState.isLoading ? null : _placeOrder,
              child: orderState.isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text('Place Order'),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _stepLabel(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(t.toUpperCase(),
            style: const TextStyle(
                color: AppColors.primary,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5)),
      );
}

// ─── Print Options widget ─────────────────────────────────────────────────────

class _PrintOptions extends StatelessWidget {
  final List<Map<String, dynamic>> pages;
  final Map<int, String> pageTypes;
  final int copies;
  final bool doubleSided;
  final void Function(int page, String type) onPageTypeChange;
  final void Function(int) onCopiesChange;
  final void Function(bool) onDoubleSidedChange;

  const _PrintOptions({
    required this.pages,
    required this.pageTypes,
    required this.copies,
    required this.doubleSided,
    required this.onPageTypeChange,
    required this.onCopiesChange,
    required this.onDoubleSidedChange,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(children: [
        // Copies
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(children: [
            const Icon(Icons.content_copy_outlined,
                color: AppColors.primary, size: 18),
            const SizedBox(width: 12),
            const Expanded(
                child: Text('Copies',
                    style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600))),
            _Stepper(
                value: copies,
                onDecrement: () => onCopiesChange(copies - 1),
                onIncrement: () => onCopiesChange(copies + 1)),
          ]),
        ),
        const Divider(color: AppColors.border, height: 1),

        // Double-sided
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(children: [
            const Icon(Icons.book_outlined,
                color: AppColors.primary, size: 18),
            const SizedBox(width: 12),
            const Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text('Double-sided',
                      style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w600)),
                  Text('Print on both sides',
                      style: TextStyle(
                          color: AppColors.textTertiary, fontSize: 12)),
                ])),
            Switch(
              value: doubleSided,
              onChanged: onDoubleSidedChange,
              activeColor: AppColors.primary,
              trackColor:
                  WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected)
                      ? AppColors.primary.withValues(alpha: 0.3)
                      : AppColors.border),
            ),
          ]),
        ),
        const Divider(color: AppColors.border, height: 1),

        // Per-page color
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Page Colors',
                      style: TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 14)),
                  Row(children: [
                    _BulkBtn(
                      label: 'All B&W',
                      onTap: () {
                        for (final p in pages) {
                          onPageTypeChange(
                              p['page_number'] as int, PrintType.bw);
                        }
                      },
                    ),
                    const SizedBox(width: 6),
                    _BulkBtn(
                      label: 'All Color',
                      color: true,
                      onTap: () {
                        for (final p in pages) {
                          onPageTypeChange(
                              p['page_number'] as int, PrintType.color);
                        }
                      },
                    ),
                  ]),
                ],
              ),
              const SizedBox(height: 12),
              ...pages.map((p) {
                final num = p['page_number'] as int;
                final type = pageTypes[num] ?? PrintType.bw;
                final isColor = type == PrintType.color;
                return Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceAlt,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                          color: AppColors.border,
                          borderRadius: BorderRadius.circular(8)),
                      child: Center(
                          child: Text('$num',
                              style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700))),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                          (p['is_color'] as bool? ?? false)
                              ? '🎨 Color page'
                              : '⬛ B&W page',
                          style: const TextStyle(
                              color: AppColors.textTertiary,
                              fontSize: 12)),
                    ),
                    // Toggle
                    Container(
                      decoration: BoxDecoration(
                          color: AppColors.border,
                          borderRadius: BorderRadius.circular(8)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        _TypeBtn(
                          label: 'B&W',
                          active: !isColor,
                          activeColor: const Color(0xFF374151),
                          onTap: () =>
                              onPageTypeChange(num, PrintType.bw),
                        ),
                        _TypeBtn(
                          label: 'Color',
                          active: isColor,
                          activeColor: AppColors.primary,
                          onTap: () =>
                              onPageTypeChange(num, PrintType.color),
                        ),
                      ]),
                    ),
                  ]),
                );
              }),
            ],
          ),
        ),
      ]),
    );
  }
}

class _Stepper extends StatelessWidget {
  final int value;
  final VoidCallback onDecrement, onIncrement;
  const _Stepper(
      {required this.value,
      required this.onDecrement,
      required this.onIncrement});

  @override
  Widget build(BuildContext context) => Row(children: [
        _StepBtn(
            icon: Icons.remove,
            onTap: value > 1 ? onDecrement : null),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('$value',
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w700)),
        ),
        _StepBtn(
            icon: Icons.add,
            onTap: value < 99 ? onIncrement : null),
      ]);
}

class _StepBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _StepBtn({required this.icon, this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.border,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon,
              size: 16,
              color: onTap != null
                  ? AppColors.textPrimary
                  : AppColors.textDisabled),
        ),
      );
}

class _BulkBtn extends StatelessWidget {
  final String label;
  final bool color;
  final VoidCallback onTap;
  const _BulkBtn(
      {required this.label, required this.onTap, this.color = false});
  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: color ? AppColors.primarySurface : AppColors.border,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(label,
              style: TextStyle(
                  color: color
                      ? AppColors.primaryLight
                      : AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
        ),
      );
}

class _TypeBtn extends StatelessWidget {
  final String label;
  final bool active;
  final Color activeColor;
  final VoidCallback onTap;
  const _TypeBtn(
      {required this.label,
      required this.active,
      required this.activeColor,
      required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: active ? activeColor : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(label,
              style: TextStyle(
                  color: active
                      ? Colors.white
                      : AppColors.textTertiary,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
        ),
      );
}
