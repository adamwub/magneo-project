// Widget test Fase 1j: alur login, first-login, & onboarding ortu (pakai API tiruan).
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:magnoo_mobile/api/api_client.dart';
import 'package:magnoo_mobile/generated/magnoo_models.dart';
import 'package:magnoo_mobile/screens/login_screen.dart';

/// API tiruan — tak ada panggilan jaringan nyata.
class FakeApi extends ApiClient {
  FakeApi({this.loginThrows = false, this.mustChange = false, this.mustTos = false}) : super(baseUrl: 'http://test');
  bool loginThrows;
  bool mustChange;
  bool mustTos;
  bool changePasswordCalled = false;
  final List<String> steps = [];

  // Token dengan payload {"sub":"u1","role":"STUDENT"} (base64url) agar Session bisa decode.
  static const String _tok = 'a.eyJzdWIiOiJ1MSIsInJvbGUiOiJTVFVERU5UIn0.c';

  @override
  Future<LoginResult> login({String? username, String? phone, String? email, String? schoolId, required String password, required String deviceId}) async {
    if (loginThrows) throw ApiException('Login gagal.');
    return LoginResult(accessToken: _tok, refreshToken: 'r', role: Role.student, mustChangePassword: mustChange, mustAcceptTos: mustTos);
  }

  @override
  Future<void> changePassword({required String oldPassword, required String newPassword, required String token}) async {
    changePasswordCalled = true;
  }

  @override
  Future<void> acceptTos({required String docVersion, required String token}) async {}

  @override
  Future<int> parentRegister(String phone) async { steps.add('register'); return 300; }
  @override
  Future<String> parentVerifyOtp({required String phone, required String otp}) async { steps.add('verify'); return 'temp'; }
  @override
  Future<String> parentLinkChild({required String inviteCode, required String token}) async { steps.add('link'); return 'ACTIVE'; }
  @override
  Future<void> passwordForgot({String? phone, String? email}) async { steps.add('forgot'); }
  @override
  Future<void> passwordReset({String? phone, String? email, required String otp, required String newPassword}) async { steps.add('reset'); }
}

void main() {
  testWidgets('Login menampilkan brand & field siswa; toggle ke dewasa', (tester) async {
    await tester.pumpWidget(MaterialApp(home: LoginScreen(api: FakeApi())));
    expect(find.text('Magneo'), findsOneWidget);
    expect(find.text('NIS'), findsOneWidget);
    await tester.tap(find.text('Guru / Ortu'));
    await tester.pumpAndSettle();
    expect(find.text('Email / No. HP'), findsOneWidget);
  });

  testWidgets('Login sukses (tanpa first-login) -> masuk Home', (tester) async {
    await tester.pumpWidget(MaterialApp(home: LoginScreen(api: FakeApi())));
    await tester.enterText(find.byKey(const Key('idField')), '20240001');
    await tester.enterText(find.byKey(const Key('schoolField')), 'sch-1');
    await tester.enterText(find.byKey(const Key('passwordField')), 'rahasia123');
    await tester.tap(find.text('Masuk'));
    await tester.pumpAndSettle();
    expect(find.text('Selamat datang'), findsOneWidget);
    expect(find.text('Masuk sebagai Siswa'), findsOneWidget);
  });

  testWidgets('Login gagal -> pesan error', (tester) async {
    await tester.pumpWidget(MaterialApp(home: LoginScreen(api: FakeApi(loginThrows: true))));
    await tester.enterText(find.byKey(const Key('idField')), 'x');
    await tester.enterText(find.byKey(const Key('passwordField')), 'y');
    await tester.tap(find.text('Masuk'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('loginError')), findsOneWidget);
  });

  testWidgets('First-login: ganti password -> Home', (tester) async {
    final fake = FakeApi(mustChange: true);
    await tester.pumpWidget(MaterialApp(home: LoginScreen(api: fake)));
    await tester.enterText(find.byKey(const Key('idField')), '20240001');
    await tester.enterText(find.byKey(const Key('schoolField')), 'sch-1');
    await tester.enterText(find.byKey(const Key('passwordField')), 'temp1234');
    await tester.tap(find.text('Masuk'));
    await tester.pumpAndSettle();
    expect(find.text('Buat Password Baru'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('newPasswordField')), 'PasswordBaru#9');
    await tester.tap(find.text('Lanjutkan'));
    await tester.pumpAndSettle();
    expect(fake.changePasswordCalled, isTrue);
    expect(find.text('Selamat datang'), findsOneWidget);
  });

  testWidgets('Onboarding ortu: register->otp->link->password->selesai', (tester) async {
    final fake = FakeApi();
    await tester.pumpWidget(MaterialApp(home: LoginScreen(api: fake)));
    await tester.tap(find.text('Orang tua baru? Daftar di sini'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('phoneField')), '0812345678');
    await tester.tap(find.text('Kirim OTP'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('otpField')), '123456');
    await tester.tap(find.text('Verifikasi'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('inviteField')), 'ABCD2345');
    await tester.tap(find.text('Tautkan Anak'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('resetOtpField')), '654321');
    await tester.enterText(find.byKey(const Key('newPassField')), 'OrtuKuat#9');
    await tester.tap(find.text('Simpan Password'));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('backToLogin')), findsOneWidget);
    expect(fake.steps, ['register', 'verify', 'link', 'forgot', 'reset']);
  });
}
