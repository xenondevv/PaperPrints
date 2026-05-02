import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // TODO: Initialize Firebase
  // await Firebase.initializeApp();

  runApp(
    const ProviderScope(
      child: VendorApp(),
    ),
  );
}

class VendorApp extends ConsumerWidget {
  const VendorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'PaperPrints Vendor',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0D9488), // Teal color
          primary: const Color(0xFF0D9488),
        ),
        useMaterial3: true,
      ),
      home: const Scaffold(
        body: Center(
          child: Text('Vendor App Initialized'),
        ),
      ),
    );
  }
}
