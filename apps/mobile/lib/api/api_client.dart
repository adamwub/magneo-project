import 'dart:convert';

import 'package:http/http.dart' as http;

import '../generated/magnoo_models.dart';

/// Alamat backend (build-time). Override: --dart-define=API_URL=...
const String _apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:3000');
const String _prefix = '/api/v1';

/// Error API dengan pesan ramah (untuk ditampilkan ke pengguna).
class ApiException implements Exception {
  ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Hasil login (mencakup field yang belum ada di model generated: mustAcceptTos).
class LoginResult {
  LoginResult({
    required this.accessToken,
    required this.refreshToken,
    required this.role,
    required this.mustChangePassword,
    required this.mustAcceptTos,
  });
  final String accessToken;
  final String refreshToken;
  final Role role;
  final bool mustChangePassword;
  final bool mustAcceptTos;
}

/// Klien API Magneo (Fase 1j). Method bersifat virtual → mudah di-fake saat test.
class ApiClient {
  ApiClient({String? baseUrl, http.Client? client})
      : base = baseUrl ?? '$_apiUrl$_prefix',
        _http = client ?? http.Client();

  final String base;
  final http.Client _http;

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
    String? token,
  }) async {
    final headers = <String, String>{'content-type': 'application/json'};
    if (token != null) headers['authorization'] = 'Bearer $token';
    final uri = Uri.parse('$base$path');
    late http.Response res;
    try {
      final encoded = body == null ? null : jsonEncode(body);
      res = method == 'POST'
          ? await _http.post(uri, headers: headers, body: encoded)
          : await _http.get(uri, headers: headers);
    } catch (_) {
      throw ApiException('Tidak dapat menghubungi server. Periksa koneksi.');
    }
    final map = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) return map;
    final err = map['error'];
    final msg = (err is Map && err['message'] is String) ? err['message'] as String : 'Terjadi kesalahan (${res.statusCode}).';
    throw ApiException(msg);
  }

  /// POST /auth/login — siswa (username+schoolId) atau dewasa (phone/email).
  Future<LoginResult> login({
    String? username,
    String? phone,
    String? email,
    String? schoolId,
    required String password,
    required String deviceId,
  }) async {
    final body = <String, dynamic>{'password': password, 'deviceId': deviceId, 'deviceName': 'Magneo Mobile'};
    if (username != null) body['username'] = username;
    if (phone != null) body['phone'] = phone;
    if (email != null) body['email'] = email;
    if (schoolId != null && schoolId.isNotEmpty) body['schoolId'] = schoolId;
    final m = await _send('POST', '/auth/login', body: body);
    return LoginResult(
      accessToken: m['accessToken'] as String,
      refreshToken: m['refreshToken'] as String,
      role: Role.fromValue(m['role'] as String),
      mustChangePassword: m['mustChangePassword'] as bool? ?? false,
      mustAcceptTos: m['mustAcceptTos'] as bool? ?? false,
    );
  }

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
    required String token,
  }) async {
    await _send('POST', '/auth/password/change',
        body: {'oldPassword': oldPassword, 'newPassword': newPassword}, token: token);
  }

  Future<void> acceptTos({required String docVersion, required String token}) async {
    await _send('POST', '/auth/tos/accept', body: {'docVersion': docVersion}, token: token);
  }

  /// POST /auth/parent/register → kirim OTP (kembalikan masa berlaku detik).
  Future<int> parentRegister(String phone) async {
    final m = await _send('POST', '/auth/parent/register', body: {'phone': phone});
    return m['expiresInSec'] as int? ?? 300;
  }

  /// POST /auth/parent/verify-otp → temp token.
  Future<String> parentVerifyOtp({required String phone, required String otp}) async {
    final m = await _send('POST', '/auth/parent/verify-otp', body: {'phone': phone, 'otp': otp});
    return m['tempToken'] as String;
  }

  /// POST /auth/parent/link-child → {studentUserId, status}. Bearer = temp/penuh.
  Future<String> parentLinkChild({required String inviteCode, required String token}) async {
    final m = await _send('POST', '/auth/parent/link-child', body: {'inviteCode': inviteCode}, token: token);
    return m['status'] as String? ?? 'ACTIVE';
  }

  Future<void> passwordForgot({String? phone, String? email}) async {
    final body = <String, dynamic>{};
    if (phone != null) body['phone'] = phone;
    if (email != null) body['email'] = email;
    await _send('POST', '/auth/password/forgot', body: body);
  }

  Future<void> passwordReset({
    String? phone,
    String? email,
    required String otp,
    required String newPassword,
  }) async {
    final body = <String, dynamic>{'otp': otp, 'newPassword': newPassword};
    if (phone != null) body['phone'] = phone;
    if (email != null) body['email'] = email;
    await _send('POST', '/auth/password/reset', body: body);
  }
}
