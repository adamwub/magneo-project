import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/session.dart';
import '../theme.dart';
import 'home_screen.dart';

/// Versi dokumen ToS yang ditampilkan & disetujui (placeholder Fase 1).
const String tosDocVersion = 'v1';

class FirstLoginScreen extends StatefulWidget {
  const FirstLoginScreen({
    super.key,
    required this.api,
    required this.oldPassword,
    required this.needPassword,
    required this.needTos,
  });
  final ApiClient api;
  final String oldPassword;
  final bool needPassword;
  final bool needTos;

  @override
  State<FirstLoginScreen> createState() => _FirstLoginScreenState();
}

class _FirstLoginScreenState extends State<FirstLoginScreen> {
  final _newPassword = TextEditingController();
  bool _tosChecked = false;
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _newPassword.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (widget.needTos && !_tosChecked) {
      setState(() => _error = 'Anda harus menyetujui Syarat & Ketentuan.');
      return;
    }
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      final token = session.accessToken!;
      if (widget.needPassword) {
        await widget.api.changePassword(
          oldPassword: widget.oldPassword,
          newPassword: _newPassword.text,
          token: token,
        );
      }
      if (widget.needTos) {
        await widget.api.acceptTos(docVersion: tosDocVersion, token: token);
      }
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute<void>(builder: (_) => const HomeScreen()));
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pengaturan Awal'), backgroundColor: paper),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Selesaikan langkah pertama untuk mengamankan akun Anda.', style: TextStyle(color: muted)),
              const SizedBox(height: 20),
              if (widget.needPassword) ...[
                const Text('Buat Password Baru', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                TextField(
                  key: const Key('newPasswordField'),
                  controller: _newPassword,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password baru (min. 8 karakter)'),
                ),
                const SizedBox(height: 16),
              ],
              if (widget.needTos)
                CheckboxListTile(
                  key: const Key('tosCheckbox'),
                  value: _tosChecked,
                  onChanged: (v) => setState(() => _tosChecked = v ?? false),
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: const Text('Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi.'),
                ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, key: const Key('firstLoginError'), style: const TextStyle(color: magnetRed)),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _loading ? null : _submit,
                child: Text(_loading ? 'Menyimpan…' : 'Lanjutkan'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
