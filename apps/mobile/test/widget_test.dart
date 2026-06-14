// Widget test rangka Fase 0: pastikan aplikasi ter-render dan menampilkan brand.
import 'package:flutter_test/flutter_test.dart';

import 'package:magnoo_mobile/main.dart';

void main() {
  testWidgets('Layar beranda menampilkan brand & status awal', (tester) async {
    await tester.pumpWidget(const MagnooApp());

    // Brand muncul.
    expect(find.text('Magnoo'), findsOneWidget);
    // Saat awal, status masih "memeriksa" (belum ada server di test).
    expect(find.text('Memeriksa server…'), findsOneWidget);
  });
}
