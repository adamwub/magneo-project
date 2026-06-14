import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'generated/magnoo_models.dart';

// Alamat API (build-time). Default lokal; override: --dart-define=API_URL=...
const String apiUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://localhost:3000',
);

// Warna identitas Magnoo (BAGIAN 7/17 aplikasi.md).
const Color ink = Color(0xFF10243A);
const Color magnetRed = Color(0xFFE4391F);
const Color fieldBlue = Color(0xFF1656C9);
const Color paper = Color(0xFFF7F9FB);

void main() {
  runApp(const MagnooApp());
}

class MagnooApp extends StatelessWidget {
  const MagnooApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Magnoo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: fieldBlue),
        scaffoldBackgroundColor: paper,
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

enum ApiState { checking, online, offline }

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  ApiState _state = ApiState.checking;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    try {
      final res = await http
          .get(Uri.parse('$apiUrl/health'))
          .timeout(const Duration(seconds: 5));
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final ok = res.statusCode == 200 && body['status'] == 'ok';
      if (mounted) {
        setState(() => _state = ok ? ApiState.online : ApiState.offline);
      }
    } catch (_) {
      if (mounted) setState(() => _state = ApiState.offline);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Pakai model bersama hasil generator 0b untuk membuktikan ia compile di Flutter.
    final String sharedSample = Role.student.value;

    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'Magnoo',
              style: TextStyle(
                fontSize: 34,
                fontWeight: FontWeight.w800,
                color: ink,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Aplikasi — kerangka Fase 0',
              style: TextStyle(color: Color(0xFF5B6B7D)),
            ),
            const SizedBox(height: 24),
            _StatusChip(state: _state),
            const SizedBox(height: 16),
            Text(
              'Model bersama OK (Role.student = "$sharedSample")',
              style: const TextStyle(fontSize: 12, color: Color(0xFF8493A3)),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.state});

  final ApiState state;

  @override
  Widget build(BuildContext context) {
    late final String label;
    late final Color color;
    switch (state) {
      case ApiState.checking:
        label = 'Memeriksa server…';
        color = const Color(0xFF8493A3);
      case ApiState.online:
        label = 'API terhubung';
        color = fieldBlue;
      case ApiState.offline:
        label = 'API tidak terhubung';
        color = magnetRed;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontWeight: FontWeight.w700),
      ),
    );
  }
}
