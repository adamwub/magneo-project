import 'package:flutter/material.dart';

import 'screens/login_screen.dart';
import 'theme.dart';

void main() {
  runApp(const MagneoApp());
}

class MagneoApp extends StatelessWidget {
  const MagneoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Magneo',
      debugShowCheckedModeBanner: false,
      theme: magnooTheme(),
      home: const LoginScreen(),
    );
  }
}
