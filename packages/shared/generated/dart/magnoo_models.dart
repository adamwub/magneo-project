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

enum PermitType {
  sick('SICK'),
  family('FAMILY'),
  dispensation('DISPENSATION'),
  other('OTHER');

  const PermitType(this.value);
  final String value;

  static PermitType fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

enum PermitStatus {
  submitted('SUBMITTED'),
  approved('APPROVED'),
  rejected('REJECTED'),
  cancelled('CANCELLED');

  const PermitStatus(this.value);
  final String value;

  static PermitStatus fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

enum AnnScope {
  class_('CLASS'),
  grade('GRADE'),
  school('SCHOOL'),
  parents('PARENTS');

  const AnnScope(this.value);
  final String value;

  static AnnScope fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

enum Platform {
  android('ANDROID'),
  ios('IOS');

  const Platform(this.value);
  final String value;

  static Platform fromValue(String v) =>
      values.firstWhere((e) => e.value == v);
}

class LoginRequest {
  final String? username;
  final String? phone;
  final String? email;
  final String? schoolId;
  final String password;
  final String deviceId;
  final String? deviceName;

  const LoginRequest({this.username, this.phone, this.email, this.schoolId, required this.password, required this.deviceId, this.deviceName});

  factory LoginRequest.fromJson(Map<String, dynamic> json) => LoginRequest(
      username: json['username'] == null ? null : json['username'] as String,
      phone: json['phone'] == null ? null : json['phone'] as String,
      email: json['email'] == null ? null : json['email'] as String,
      schoolId: json['schoolId'] == null ? null : json['schoolId'] as String,
      password: json['password'] as String,
      deviceId: json['deviceId'] as String,
      deviceName: json['deviceName'] == null ? null : json['deviceName'] as String,
      );

  Map<String, dynamic> toJson() => {
      'username': username,
      'phone': phone,
      'email': email,
      'schoolId': schoolId,
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
  final bool mustAcceptTos;
  final bool sessionEvicted;

  const LoginResponse({required this.accessToken, required this.refreshToken, required this.role, required this.mustChangePassword, required this.mustAcceptTos, required this.sessionEvicted});

  factory LoginResponse.fromJson(Map<String, dynamic> json) => LoginResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      role: Role.fromValue(json['role'] as String),
      mustChangePassword: json['mustChangePassword'] as bool,
      mustAcceptTos: json['mustAcceptTos'] as bool,
      sessionEvicted: json['sessionEvicted'] as bool,
      );

  Map<String, dynamic> toJson() => {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'role': role.value,
      'mustChangePassword': mustChangePassword,
      'mustAcceptTos': mustAcceptTos,
      'sessionEvicted': sessionEvicted,
      };
}

class JwtClaims {
  final String sub;
  final String sid;
  final Role role;
  final String? schoolId;
  final List<String> scopes;
  final List<Role> linkRoles;

  const JwtClaims({required this.sub, required this.sid, required this.role, this.schoolId, required this.scopes, required this.linkRoles});

  factory JwtClaims.fromJson(Map<String, dynamic> json) => JwtClaims(
      sub: json['sub'] as String,
      sid: json['sid'] as String,
      role: Role.fromValue(json['role'] as String),
      schoolId: json['schoolId'] == null ? null : json['schoolId'] as String,
      scopes: (json['scopes'] as List).cast<String>(),
      linkRoles: (json['linkRoles'] as List).map((e) => Role.fromValue(e as String)).toList(),
      );

  Map<String, dynamic> toJson() => {
      'sub': sub,
      'sid': sid,
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

class QrCurrentResponse {
  final String token;
  final int period;
  final int expiresInSec;

  const QrCurrentResponse({required this.token, required this.period, required this.expiresInSec});

  factory QrCurrentResponse.fromJson(Map<String, dynamic> json) => QrCurrentResponse(
      token: json['token'] as String,
      period: json['period'] as int,
      expiresInSec: json['expiresInSec'] as int,
      );

  Map<String, dynamic> toJson() => {
      'token': token,
      'period': period,
      'expiresInSec': expiresInSec,
      };
}

class DeviceRegisterRequest {
  final String token;
  final Platform platform;

  const DeviceRegisterRequest({required this.token, required this.platform});

  factory DeviceRegisterRequest.fromJson(Map<String, dynamic> json) => DeviceRegisterRequest(
      token: json['token'] as String,
      platform: Platform.fromValue(json['platform'] as String),
      );

  Map<String, dynamic> toJson() => {
      'token': token,
      'platform': platform.value,
      };
}

class PermitCreateRequest {
  final String? studentUserId;
  final PermitType type;
  final String dateStart;
  final String dateEnd;
  final String note;
  final String? attachmentUrl;

  const PermitCreateRequest({this.studentUserId, required this.type, required this.dateStart, required this.dateEnd, required this.note, this.attachmentUrl});

  factory PermitCreateRequest.fromJson(Map<String, dynamic> json) => PermitCreateRequest(
      studentUserId: json['studentUserId'] == null ? null : json['studentUserId'] as String,
      type: PermitType.fromValue(json['type'] as String),
      dateStart: json['dateStart'] as String,
      dateEnd: json['dateEnd'] as String,
      note: json['note'] as String,
      attachmentUrl: json['attachmentUrl'] == null ? null : json['attachmentUrl'] as String,
      );

  Map<String, dynamic> toJson() => {
      'studentUserId': studentUserId,
      'type': type.value,
      'dateStart': dateStart,
      'dateEnd': dateEnd,
      'note': note,
      'attachmentUrl': attachmentUrl,
      };
}

class PermitDecisionRequest {
  final String decision;
  final String? decisionNote;

  const PermitDecisionRequest({required this.decision, this.decisionNote});

  factory PermitDecisionRequest.fromJson(Map<String, dynamic> json) => PermitDecisionRequest(
      decision: json['decision'] as String,
      decisionNote: json['decisionNote'] == null ? null : json['decisionNote'] as String,
      );

  Map<String, dynamic> toJson() => {
      'decision': decision,
      'decisionNote': decisionNote,
      };
}

class Permit {
  final String id;
  final String studentUserId;
  final String requestedByUserId;
  final PermitType type;
  final String dateStart;
  final String dateEnd;
  final String note;
  final String? attachmentUrl;
  final PermitStatus status;
  final String? decidedByUserId;
  final String? decidedAt;
  final String? decisionNote;

  const Permit({required this.id, required this.studentUserId, required this.requestedByUserId, required this.type, required this.dateStart, required this.dateEnd, required this.note, this.attachmentUrl, required this.status, this.decidedByUserId, this.decidedAt, this.decisionNote});

  factory Permit.fromJson(Map<String, dynamic> json) => Permit(
      id: json['id'] as String,
      studentUserId: json['studentUserId'] as String,
      requestedByUserId: json['requestedByUserId'] as String,
      type: PermitType.fromValue(json['type'] as String),
      dateStart: json['dateStart'] as String,
      dateEnd: json['dateEnd'] as String,
      note: json['note'] as String,
      attachmentUrl: json['attachmentUrl'] == null ? null : json['attachmentUrl'] as String,
      status: PermitStatus.fromValue(json['status'] as String),
      decidedByUserId: json['decidedByUserId'] == null ? null : json['decidedByUserId'] as String,
      decidedAt: json['decidedAt'] == null ? null : json['decidedAt'] as String,
      decisionNote: json['decisionNote'] == null ? null : json['decisionNote'] as String,
      );

  Map<String, dynamic> toJson() => {
      'id': id,
      'studentUserId': studentUserId,
      'requestedByUserId': requestedByUserId,
      'type': type.value,
      'dateStart': dateStart,
      'dateEnd': dateEnd,
      'note': note,
      'attachmentUrl': attachmentUrl,
      'status': status.value,
      'decidedByUserId': decidedByUserId,
      'decidedAt': decidedAt,
      'decisionNote': decisionNote,
      };
}

class AnnouncementCreateRequest {
  final AnnScope scope;
  final List<String>? scopeIds;
  final String title;
  final String body;

  const AnnouncementCreateRequest({required this.scope, this.scopeIds, required this.title, required this.body});

  factory AnnouncementCreateRequest.fromJson(Map<String, dynamic> json) => AnnouncementCreateRequest(
      scope: AnnScope.fromValue(json['scope'] as String),
      scopeIds: json['scopeIds'] == null ? null : (json['scopeIds'] as List).cast<String>(),
      title: json['title'] as String,
      body: json['body'] as String,
      );

  Map<String, dynamic> toJson() => {
      'scope': scope.value,
      'scopeIds': scopeIds,
      'title': title,
      'body': body,
      };
}

class Announcement {
  final String id;
  final String schoolId;
  final String authorUserId;
  final AnnScope scope;
  final List<String> scopeIds;
  final String title;
  final String body;
  final String publishedAt;
  final String? retractedAt;

  const Announcement({required this.id, required this.schoolId, required this.authorUserId, required this.scope, required this.scopeIds, required this.title, required this.body, required this.publishedAt, this.retractedAt});

  factory Announcement.fromJson(Map<String, dynamic> json) => Announcement(
      id: json['id'] as String,
      schoolId: json['schoolId'] as String,
      authorUserId: json['authorUserId'] as String,
      scope: AnnScope.fromValue(json['scope'] as String),
      scopeIds: (json['scopeIds'] as List).cast<String>(),
      title: json['title'] as String,
      body: json['body'] as String,
      publishedAt: json['publishedAt'] as String,
      retractedAt: json['retractedAt'] == null ? null : json['retractedAt'] as String,
      );

  Map<String, dynamic> toJson() => {
      'id': id,
      'schoolId': schoolId,
      'authorUserId': authorUserId,
      'scope': scope.value,
      'scopeIds': scopeIds,
      'title': title,
      'body': body,
      'publishedAt': publishedAt,
      'retractedAt': retractedAt,
      };
}
