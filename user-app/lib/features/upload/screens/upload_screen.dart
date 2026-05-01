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
  // Step 1: Shop
  VendorModel? _selectedVendor;

  // Step 2: File
  PlatformFile? _file;
  Map<String, dynamic>? _fileRecord;
  bool _uploading = false;
  double _uploadProgress = 0;

  // Step 3: Options
  int _copies = 1;
  bool _doubleSided = false;
  bool _printEntire = true;
  _ColorMode _colorMode = _ColorMode.autoDetect;
  _Orientation _orientation = _Orientation.portrait;
  Map<int, String> _pageTypes = {};

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

  // Resolve page types based on selected color mode
  List<Map<String, dynamic>> _resolvedPages() {
    if (_fileRecord == null) return [];
    final pages = _fileRecord!['pages'] as List<dynamic>? ?? [];
    return pages.map((p) {
      final pMap = p as Map<String, dynamic>;
      final num = pMap['page_number'] as int;
      String type;
      switch (_colorMode) {
        case _ColorMode.colored:
          type = PrintType.color;
        case _ColorMode.bw:
          type = PrintType.bw;
        case _ColorMode.autoDetect:
          type = _pageTypes[num] ?? PrintType.bw;
        case _ColorMode.manual:
          type = _pageTypes[num] ?? PrintType.bw;
      }
      return {'page_number': num, 'print_type': type};
    }).toList();
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

    try {
      final order = await ref.read(ordersProvider.notifier).create({
        'vendor_id': _selectedVendor!.id,
        'file_id': _fileRecord!['id'],
        'copies': _copies,
        'is_double_sided': _doubleSided,
        'orientation': _orientation == _Orientation.portrait ? 'PORTRAIT' : 'LANDSCAPE',
        'pages': _resolvedPages(),
      });
      if (mounted) context.push('/orders/${order.id}');
    } catch (e) {
      _showError('Failed to place order. Please try again.');
    }
  }

  int get _totalPages {
    if (_fileRecord == null) return 0;
    return (_fileRecord!['total_pages'] as int? ?? 0) * _copies;
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

    // If no file yet, show the shop selector + file picker step
    if (_file == null) {
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
            if (_selectedVendor != null) ...[
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
    final totalPages = _fileRecord?['total_pages'] as int? ?? 0;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Standard Documents'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() {
            _file = null;
            _fileRecord = null;
          }),
        ),
        actions: [
          // Doc counter pill
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text('Doc 1/1',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
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
                  if (_uploading)
                    LinearProgressIndicator(
                      value: _uploadProgress,
                      backgroundColor: AppColors.border,
                      color: AppColors.primary,
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
                                  onTap: () {},
                                  child: const Text('Select Pages',
                                      style: TextStyle(
                                          color: AppColors.primary,
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
                                  iconColor: AppColors.textDisabled,
                                  title: 'Manual Mode',
                                  subtitle: 'Unavailable',
                                  selected: false,
                                  disabled: true,
                                  onTap: null,
                                ),
                              ),
                            ],
                          ),
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
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // ── Shop selection (compact) ─────────────────────────
                  if (_selectedVendor == null)
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
                    const Text('Total Pages',
                        style: TextStyle(
                            color: AppColors.textSecondary, fontSize: 12)),
                    Text('$_totalPages',
                        style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w800,
                            fontSize: 20)),
                    GestureDetector(
                      onTap: () {},
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
                  width: 140,
                  child: ElevatedButton(
                    onPressed: (orderState.isLoading ||
                            _selectedVendor == null ||
                            _uploading)
                        ? null
                        : _placeOrder,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(140, 48),
                    ),
                    child: orderState.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Text('Proceed'),
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
