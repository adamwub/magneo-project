import 'package:flutter/material.dart';

/// Identitas visual Magneo (BAGIAN 7/17 aplikasi.md).
const Color ink = Color(0xFF10243A);
const Color magnetRed = Color(0xFFE4391F);
const Color fieldBlue = Color(0xFF1656C9);
const Color gold = Color(0xFFF2A91C);
const Color paper = Color(0xFFF7F9FB);
const Color muted = Color(0xFF5B6B7D);

ThemeData magnooTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: magnetRed,
    primary: magnetRed,
    secondary: fieldBlue,
  );
  return ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: paper,
    useMaterial3: true,
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(),
      filled: true,
      fillColor: Colors.white,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: magnetRed,
        minimumSize: const Size.fromHeight(48),
      ),
    ),
  );
}
