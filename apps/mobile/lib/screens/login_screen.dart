import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/session.dart';
import '../theme.dart';
import 'first_login_screen.dart';
import 'home_screen.dart';
import 'parent_onboarding_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.api});
  final ApiClient? api;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final ApiClient _api = widget.api ?? ApiClient();
  bool _student = true; // true = siswa, false = dewasa
  final _id = TextEditingController();
  final _schoolId = TextEditingController();
  final _password = TextEditingController();
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _id.dispose();
    _schoolId.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      final id = _id.text.trim();
      final pwd = _password.text;
      final res = _student
          ? await _api.login(username: id, schoolId: _schoolId.text.trim(), password: pwd, deviceId: session.deviceId)
          : await _api.login(
              email: id.contains('@') ? id : null,
              phone: id.contains('@') ? null : id,
              password: pwd,
              deviceId: session.deviceId,
            );
      session.set(access: res.accessToken, refresh: res.refreshToken, r: res.role);
      if (!mounted) return;
      final needsFirst = res.mustChangePassword || res.mustAcceptTos;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => needsFirst
              ? FirstLoginScreen(
                  api: _api,
                  oldPassword: pwd,
                  needPassword: res.mustChangePassword,
                  needTos: res.mustAcceptTos,
                )
              : const HomeScreen(),
        ),
      );
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Magneo',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: magnetRed)),
                  const SizedBox(height: 4),
                  const Text('Masuk ke akun Anda', textAlign: TextAlign.center, style: TextStyle(color: muted)),
                  const SizedBox(height: 24),
                  SegmentedButton<bool>(
                    segments: const [
                      ButtonSegment(value: true, label: Text('Siswa')),
                      ButtonSegment(value: false, label: Text('Guru / Ortu')),
                    ],
                    selected: {_student},
                    onSelectionChanged: (s) => setState(() => _student = s.first),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    key: const Key('idField'),
                    controller: _id,
                    decoration: InputDecoration(labelText: _student ? 'NIS' : 'Email / No. HP'),
                  ),
                  if (_student) ...[
                    const SizedBox(height: 12),
                    TextField(
                      key: const Key('schoolField'),
                      controller: _schoolId,
                      decoration: const InputDecoration(labelText: 'Kode Sekolah'),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    key: const Key('passwordField'),
                    controller: _password,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Password'),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, key: const Key('loginError'), style: const TextStyle(color: magnetRed)),
                  ],
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: _loading ? null : _submit,
                    child: Text(_loading ? 'Memproses…' : 'Masuk'),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(builder: (_) => ParentOnboardingScreen(api: _api)),
                    ),
                    child: const Text('Orang tua baru? Daftar di sini'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
