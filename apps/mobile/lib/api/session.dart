import 'dart:convert';
import 'dart:math';

import '../generated/magnoo_models.dart';

/// Sesi login di memori (Fase 1j). Token disimpan selama app hidup.
/// (Utang: persistensi aman lintas-restart via flutter_secure_storage saat polish.)
class Session {
  String? accessToken;
  String? refreshToken;
  Role? role;
  String? schoolId;

  /// deviceId stabil selama proses app berjalan (cukup untuk Fase 1).
  final String deviceId = _genDeviceId();

  bool get isLoggedIn => accessToken != null;

  void set({required String access, required String refresh, required Role r}) {
    accessToken = access;
    refreshToken = refresh;
    role = r;
    schoolId = _schoolIdFromJwt(access);
  }

  void clear() {
    accessToken = null;
    refreshToken = null;
    role = null;
    schoolId = null;
  }

  static String _genDeviceId() {
    final rnd = Random();
    final bytes = List<int>.generate(16, (_) => rnd.nextInt(256));
    return 'web-mobile-${base64Url.encode(bytes).replaceAll('=', '')}';
  }

  /// Ambil schoolId dari payload JWT (tanpa verifikasi — hanya untuk UI).
  static String? _schoolIdFromJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length < 2) return null;
      var p = parts[1].replaceAll('-', '+').replaceAll('_', '/');
      while (p.length % 4 != 0) {
        p += '=';
      }
      final claims = jsonDecode(utf8.decode(base64.decode(p))) as Map<String, dynamic>;
      return claims['schoolId'] as String?;
    } catch (_) {
      return null;
    }
  }
}

/// Sesi global aplikasi (sederhana untuk Fase 1).
final session = Session();
