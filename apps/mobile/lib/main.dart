import 'package:flutter/material.dart';

import 'screens/login_screen.dart';
import 'theme.dart';

void main() {
  runApp(const MagnooApp());
}

class MagnooApp extends StatelessWidget {
  const MagnooApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Magnoo',
      debugShowCheckedModeBanner: false,
      theme: magnooTheme(),
      home: const LoginScreen(),
    );
  }
}
