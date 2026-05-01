import 'package:flutter/material.dart';
import 'package:pdfx/pdfx.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';

class PdfViewerScreen extends StatefulWidget {
  final String filePath;
  final int initialPage;

  const PdfViewerScreen({
    super.key,
    required this.filePath,
    this.initialPage = 1,
  });

  @override
  State<PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<PdfViewerScreen> {
  late final PdfController _controller;
  int _currentPage = 1;
  int _totalPages = 0;

  @override
  void initState() {
    super.initState();
    _currentPage = widget.initialPage;
    _controller = PdfController(
      document: PdfDocument.openFile(widget.filePath),
      initialPage: widget.initialPage,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          _totalPages > 0 ? 'Page $_currentPage / $_totalPages' : 'PDF Viewer',
          style: const TextStyle(color: Colors.white, fontSize: 15),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.chevron_left, color: Colors.white),
            onPressed: _currentPage > 1
                ? () => _controller.previousPage(
                      curve: Curves.easeInOut,
                      duration: const Duration(milliseconds: 250),
                    )
                : null,
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right, color: Colors.white),
            onPressed: (_totalPages > 0 && _currentPage < _totalPages)
                ? () => _controller.nextPage(
                      curve: Curves.easeInOut,
                      duration: const Duration(milliseconds: 250),
                    )
                : null,
          ),
        ],
      ),
      body: PdfView(
        controller: _controller,
        scrollDirection: Axis.horizontal,
        onDocumentLoaded: (doc) =>
            setState(() => _totalPages = doc.pagesCount),
        onPageChanged: (page) => setState(() => _currentPage = page),
        builders: PdfViewBuilders<DefaultBuilderOptions>(
          options: const DefaultBuilderOptions(),
          documentLoaderBuilder: (_) => const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
          pageLoaderBuilder: (_) => const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
          errorBuilder: (_, err) => Center(
            child: Text(
              'Could not render page\n$err',
              style: const TextStyle(color: Colors.white70),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}
