// GENERATED FILE — DO NOT EDIT BY HAND.
// Source: packages/shared (zod schemas). Regenerate: pnpm --filter @magnoo/shared generate:dart

enum Role {
  student('STUDENT'),
  teacher('TEACHER'),
  schoolAdmin('SCHOOL_ADMIN'),
  principal('PRINCIPAL'),
  parent('PARENT'),
  alumni('ALUMNI'),
  partner('PARTNER'),
  hqAdmin('HQ_ADMIN'),
  hqOps('HQ_OPS');

  const Role(this.value);
  final String value;

  static Role fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

enum UserStatus {
  active('ACTIVE'),
  inactive('INACTIVE'),
  locked('LOCKED'),
  pendingConsent('PENDING_CONSENT');

  const UserStatus(this.value);
  final String value;

  static UserStatus fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

enum AttType {
  in_('IN'),
  out('OUT'),
  correction('CORRECTION');

  const AttType(this.value);
  final String value;

  static AttType fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

enum AttMethod {
  qr('QR'),
  face('FACE'),
  manual('MANUAL');

  const AttMethod(this.value);
  final String value;

  static AttMethod fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

enum AttStatus {
  present('PRESENT'),
  late('LATE');

  const AttStatus(this.value);
  final String value;

  static AttStatus fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

enum FinalAtt {
  present('PRESENT'),
  late('LATE'),
  permit('PERMIT'),
  sick('SICK'),
  absentNoInfo('ABSENT_NO_INFO');

  const FinalAtt(this.value);
  final String value;

  static FinalAtt fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

enum LinkStatus {
  active('ACTIVE'),
  revoked('REVOKED');

  const LinkStatus(this.value);
  final String value;

  static LinkStatus fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

enum ConsentType {
  generalData('GENERAL_DATA'),
  face('FACE'),
  publication('PUBLICATION'),
  alumniCareer('ALUMNI_CAREER'),
  tos('TOS');

  const ConsentType(this.value);
  final String value;

  static ConsentType fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

class LoginRequest {
  final String? username;
  final String? phone;
  final String? email;
  final String password;
  final String deviceId;
  final String? deviceName;

  const LoginRequest({this.username, this.phone, this.email, required this.password, required this.deviceId, this.deviceName});

  factory LoginRequest.fromJson(Map<String, dynamic> json) => LoginRequest(
      username: json['username'] == null ? null : json['username'] as String,
      phone: json['phone'] == null ? null : json['phone'] as String,
      email: json['email'] == null ? null : json['email'] as String,
      password: json['password'] as String,
      deviceId: json['deviceId'] as String,
      deviceName: json['deviceName'] == null ? null : json['deviceName'] as String,
      );

  Map<String, dynamic> toJson() => {
      'username': username,
      'phone': phone,
      'email': email,
      'password': password,
      'deviceId': deviceId,
      'deviceName': deviceName,
      };
}

class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final Role role;
  final bool mustChangePassword;

  const LoginResponse({required this.accessToken, required this.refreshToken, required this.role, required this.mustChangePassword});

  factory LoginResponse.fromJson(Map<String, dynamic> json) => LoginResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      role: Role.fromValue(json['role'] as String),
      mustChangePassword: json['mustChangePassword'] as bool,
      );

  Map<String, dynamic> toJson() => {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'role': role.value,
      'mustChangePassword': mustChangePassword,
      };
}

class JwtClaims {
  final String sub;
  final Role role;
  final String? schoolId;
  final List<String> scopes;
  final List<Role> linkRoles;

  const JwtClaims({required this.sub, required this.role, this.schoolId, required this.scopes, required this.linkRoles});

  factory JwtClaims.fromJson(Map<String, dynamic> json) => JwtClaims(
      sub: json['sub'] as String,
      role: Role.fromValue(json['role'] as String),
      schoolId: json['schoolId'] == null ? null : json['schoolId'] as String,
      scopes: (json['scopes'] as List).cast<String>(),
      linkRoles: (json['linkRoles'] as List).map((e) => Role.fromValue(e as String)).toList(),
      );

  Map<String, dynamic> toJson() => {
      'sub': sub,
      'role': role.value,
      'schoolId': schoolId,
      'scopes': scopes,
      'linkRoles': linkRoles.map((e) => e.value).toList(),
      };
}

class QrCheckinRequest {
  final String qrToken;
  final double? geoLat;
  final double? geoLng;

  const QrCheckinRequest({required this.qrToken, this.geoLat, this.geoLng});

  factory QrCheckinRequest.fromJson(Map<String, dynamic> json) => QrCheckinRequest(
      qrToken: json['qrToken'] as String,
      geoLat: json['geoLat'] == null ? null : json['geoLat'] as double,
      geoLng: json['geoLng'] == null ? null : json['geoLng'] as double,
      );

  Map<String, dynamic> toJson() => {
      'qrToken': qrToken,
      'geoLat': geoLat,
      'geoLng': geoLng,
      };
}

class AttendanceEvent {
  final String id;
  final String userId;
  final String schoolId;
  final String date;
  final AttType type;
  final AttMethod method;
  final AttStatus status;
  final String occurredAt;

  const AttendanceEvent({required this.id, required this.userId, required this.schoolId, required this.date, required this.type, required this.method, required this.status, required this.occurredAt});

  factory AttendanceEvent.fromJson(Map<String, dynamic> json) => AttendanceEvent(
      id: json['id'] as String,
      userId: json['userId'] as String,
      schoolId: json['schoolId'] as String,
      date: json['date'] as String,
      type: AttType.fromValue(json['type'] as String),
      method: AttMethod.fromValue(json['method'] as String),
      status: AttStatus.fromValue(json['status'] as String),
      occurredAt: json['occurredAt'] as String,
      );

  Map<String, dynamic> toJson() => {
      'id': id,
      'userId': userId,
      'schoolId': schoolId,
      'date': date,
      'type': type.value,
      'method': method.value,
      'status': status.value,
      'occurredAt': occurredAt,
      };
}

class DailyAttendanceStatus {
  final String userId;
  final String schoolId;
  final String date;
  final FinalAtt finalStatus;

  const DailyAttendanceStatus({required this.userId, required this.schoolId, required this.date, required this.finalStatus});

  factory DailyAttendanceStatus.fromJson(Map<String, dynamic> json) => DailyAttendanceStatus(
      userId: json['userId'] as String,
      schoolId: json['schoolId'] as String,
      date: json['date'] as String,
      finalStatus: FinalAtt.fromValue(json['finalStatus'] as String),
      );

  Map<String, dynamic> toJson() => {
      'userId': userId,
      'schoolId': schoolId,
      'date': date,
      'finalStatus': finalStatus.value,
      };
}

class PasswordChangeRequest {
  final String oldPassword;
  final String newPassword;

  const PasswordChangeRequest({required this.oldPassword, required this.newPassword});

  factory PasswordChangeRequest.fromJson(Map<String, dynamic> json) => PasswordChangeRequest(
      oldPassword: json['oldPassword'] as String,
      newPassword: json['newPassword'] as String,
      );

  Map<String, dynamic> toJson() => {
      'oldPassword': oldPassword,
      'newPassword': newPassword,
      };
}

class ParentRegisterRequest {
  final String phone;

  const ParentRegisterRequest({required this.phone});

  factory ParentRegisterRequest.fromJson(Map<String, dynamic> json) => ParentRegisterRequest(
      phone: json['phone'] as String,
      );

  Map<String, dynamic> toJson() => {
      'phone': phone,
      };
}

class OtpSentResponse {
  final int expiresInSec;

  const OtpSentResponse({required this.expiresInSec});

  factory OtpSentResponse.fromJson(Map<String, dynamic> json) => OtpSentResponse(
      expiresInSec: json['expiresInSec'] as int,
      );

  Map<String, dynamic> toJson() => {
      'expiresInSec': expiresInSec,
      };
}

class ParentVerifyOtpRequest {
  final String phone;
  final String otp;

  const ParentVerifyOtpRequest({required this.phone, required this.otp});

  factory ParentVerifyOtpRequest.fromJson(Map<String, dynamic> json) => ParentVerifyOtpRequest(
      phone: json['phone'] as String,
      otp: json['otp'] as String,
      );

  Map<String, dynamic> toJson() => {
      'phone': phone,
      'otp': otp,
      };
}

class TempTokenResponse {
  final String tempToken;
  final int expiresInSec;

  const TempTokenResponse({required this.tempToken, required this.expiresInSec});

  factory TempTokenResponse.fromJson(Map<String, dynamic> json) => TempTokenResponse(
      tempToken: json['tempToken'] as String,
      expiresInSec: json['expiresInSec'] as int,
      );

  Map<String, dynamic> toJson() => {
      'tempToken': tempToken,
      'expiresInSec': expiresInSec,
      };
}

class ParentLinkChildRequest {
  final String inviteCode;

  const ParentLinkChildRequest({required this.inviteCode});

  factory ParentLinkChildRequest.fromJson(Map<String, dynamic> json) => ParentLinkChildRequest(
      inviteCode: json['inviteCode'] as String,
      );

  Map<String, dynamic> toJson() => {
      'inviteCode': inviteCode,
      };
}

class LinkChildResponse {
  final String studentUserId;
  final LinkStatus status;

  const LinkChildResponse({required this.studentUserId, required this.status});

  factory LinkChildResponse.fromJson(Map<String, dynamic> json) => LinkChildResponse(
      studentUserId: json['studentUserId'] as String,
      status: LinkStatus.fromValue(json['status'] as String),
      );

  Map<String, dynamic> toJson() => {
      'studentUserId': studentUserId,
      'status': status.value,
      };
}

class RoleSwitchRequest {
  final String targetUserId;

  const RoleSwitchRequest({required this.targetUserId});

  factory RoleSwitchRequest.fromJson(Map<String, dynamic> json) => RoleSwitchRequest(
      targetUserId: json['targetUserId'] as String,
      );

  Map<String, dynamic> toJson() => {
      'targetUserId': targetUserId,
      };
}

class TosAcceptRequest {
  final String docVersion;

  const TosAcceptRequest({required this.docVersion});

  factory TosAcceptRequest.fromJson(Map<String, dynamic> json) => TosAcceptRequest(
      docVersion: json['docVersion'] as String,
      );

  Map<String, dynamic> toJson() => {
      'docVersion': docVersion,
      };
}

class Session {
  final String id;
  final String? deviceName;
  final String createdAt;
  final bool current;

  const Session({required this.id, this.deviceName, required this.createdAt, required this.current});

  factory Session.fromJson(Map<String, dynamic> json) => Session(
      id: json['id'] as String,
      deviceName: json['deviceName'] == null ? null : json['deviceName'] as String,
      createdAt: json['createdAt'] as String,
      current: json['current'] as bool,
      );

  Map<String, dynamic> toJson() => {
      'id': id,
      'deviceName': deviceName,
      'createdAt': createdAt,
      'current': current,
      };
}
