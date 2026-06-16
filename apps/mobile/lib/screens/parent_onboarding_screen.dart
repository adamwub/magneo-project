import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../theme.dart';

enum _Step { phone, otp, invite, setPassword, done }

/// Onboarding orang tua (Fase 1j, BAGIAN 9.1):
/// register (OTP) → verifikasi → tautkan anak (kode undangan) → buat password.
class ParentOnboardingScreen extends StatefulWidget {
  const ParentOnboardingScreen({super.key, required this.api});
  final ApiClient api;

  @override
  State<ParentOnboardingScreen> createState() => _ParentOnboardingScreenState();
}

class _ParentOnboardingScreenState extends State<ParentOnboardingScreen> {
  _Step _step = _Step.phone;
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  final _invite = TextEditingController();
  final _resetOtp = TextEditingController();
  final _newPassword = TextEditingController();
  String? _tempToken;
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    for (final c in [_phone, _otp, _invite, _resetOtp, _newPassword]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await action();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Daftar Orang Tua'), backgroundColor: paper),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(_subtitle(), style: const TextStyle(color: muted)),
              const SizedBox(height: 20),
              ..._stepBody(),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, key: const Key('parentError'), style: const TextStyle(color: magnetRed)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _subtitle() {
    switch (_step) {
      case _Step.phone:
        return 'Masukkan nomor HP untuk menerima kode OTP.';
      case _Step.otp:
        return 'Masukkan 6 digit kode OTP yang dikirim ke ${_phone.text}.';
      case _Step.invite:
        return 'Masukkan kode undangan dari sekolah untuk menautkan anak Anda.';
      case _Step.setPassword:
        return 'Buat password. Masukkan OTP baru yang kami kirim ke nomor Anda.';
      case _Step.done:
        return 'Selesai! Akun Anda siap digunakan.';
    }
  }

  List<Widget> _stepBody() {
    switch (_step) {
      case _Step.phone:
        return [
          TextField(key: const Key('phoneField'), controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'No. HP')),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _loading ? null : () => _run(() async {
              await widget.api.parentRegister(_phone.text.trim());
              setState(() => _step = _Step.otp);
            }),
            child: Text(_loading ? 'Mengirim…' : 'Kirim OTP'),
          ),
        ];
      case _Step.otp:
        return [
          TextField(key: const Key('otpField'), controller: _otp, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Kode OTP')),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _loading ? null : () => _run(() async {
              _tempToken = await widget.api.parentVerifyOtp(phone: _phone.text.trim(), otp: _otp.text.trim());
              setState(() => _step = _Step.invite);
            }),
            child: Text(_loading ? 'Memverifikasi…' : 'Verifikasi'),
          ),
        ];
      case _Step.invite:
        return [
          TextField(key: const Key('inviteField'), controller: _invite, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Kode Undangan (8 karakter)')),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _loading ? null : () => _run(() async {
              await widget.api.parentLinkChild(inviteCode: _invite.text.trim().toUpperCase(), token: _tempToken!);
              // Langsung kirim OTP untuk pembuatan password.
              await widget.api.passwordForgot(phone: _phone.text.trim());
              setState(() => _step = _Step.setPassword);
            }),
            child: Text(_loading ? 'Menautkan…' : 'Tautkan Anak'),
          ),
        ];
      case _Step.setPassword:
        return [
          TextField(key: const Key('resetOtpField'), controller: _resetOtp, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Kode OTP (untuk password)')),
          const SizedBox(height: 12),
          TextField(key: const Key('newPassField'), controller: _newPassword, obscureText: true, decoration: const InputDecoration(labelText: 'Password baru (min. 8 karakter)')),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _loading ? null : () => _run(() async {
              await widget.api.passwordReset(phone: _phone.text.trim(), otp: _resetOtp.text.trim(), newPassword: _newPassword.text);
              setState(() => _step = _Step.done);
            }),
            child: Text(_loading ? 'Menyimpan…' : 'Simpan Password'),
          ),
        ];
      case _Step.done:
        return [
          const Icon(Icons.check_circle, color: fieldBlue, size: 56),
          const SizedBox(height: 16),
          FilledButton(
            key: const Key('backToLogin'),
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Masuk Sekarang'),
          ),
        ];
    }
  }
}
