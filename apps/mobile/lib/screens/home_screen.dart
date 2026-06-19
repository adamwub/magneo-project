import 'package:flutter/material.dart';

import '../api/session.dart';
import '../generated/magnoo_models.dart';
import '../theme.dart';
import 'login_screen.dart';

const Map<Role, String> _roleLabel = {
  Role.student: 'Siswa',
  Role.teacher: 'Guru',
  Role.schoolAdmin: 'Admin Sekolah',
  Role.principal: 'Kepala Sekolah',
  Role.parent: 'Orang Tua',
  Role.alumni: 'Alumni',
};

/// Home minimal per peran (Fase 1j). Tab/fitur lengkap menyusul di Fase 2+.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final role = session.role;
    final label = role == null ? '-' : (_roleLabel[role] ?? role.value);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Magneo'),
        backgroundColor: paper,
        actions: [
          IconButton(
            key: const Key('logout'),
            icon: const Icon(Icons.logout),
            tooltip: 'Keluar',
            onPressed: () {
              session.clear();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
                (_) => false,
              );
            },
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Selamat datang', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: ink)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(color: fieldBlue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(999)),
                child: Text('Masuk sebagai $label', style: const TextStyle(color: fieldBlue, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 16),
              const Text(
                'Fitur lengkap (absen, kuis, pesan, dll) hadir pada fase berikutnya.',
                textAlign: TextAlign.center,
                style: TextStyle(color: muted, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
