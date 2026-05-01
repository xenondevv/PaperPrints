import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:paper_prints_user/core/constants/app_constants.dart';
import 'package:paper_prints_user/core/network/repositories.dart';

// ─── Model ───────────────────────────────────────────────────────────────────

class UserModel {
  final String id;
  final String name;
  final String email;
  final String? photoUrl;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.photoUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> j) => UserModel(
        id: j['id'] as String,
        name: j['name'] as String,
        email: j['email'] as String,
        photoUrl: j['photoUrl'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        if (photoUrl != null) 'photoUrl': photoUrl,
      };

  UserModel copyWith({String? name, String? email, String? photoUrl}) =>
      UserModel(
        id: id,
        name: name ?? this.name,
        email: email ?? this.email,
        photoUrl: photoUrl ?? this.photoUrl,
      );
}

// ─── State ───────────────────────────────────────────────────────────────────

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  bool get isLoggedIn => user != null;

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    String? error,
    bool clearUser = false,
  }) =>
      AuthState(
        user: clearUser ? null : user ?? this.user,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

// ─── Notifier ────────────────────────────────────────────────────────────────

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _tryAutoLogin();
  }

  final _storage = const FlutterSecureStorage();
  final _repo = AuthRepository();
  final _googleSignIn = GoogleSignIn();

  // ── Auto-login from persisted tokens ───────────────────────────────────────
  Future<void> _tryAutoLogin() async {
    final token = await _storage.read(key: AppConstants.keyAccessToken);
    final userJson = await _storage.read(key: AppConstants.keyUser);
    if (token != null && userJson != null) {
      final user = UserModel.fromJson(
          jsonDecode(userJson) as Map<String, dynamic>);
      state = AuthState(user: user);
    }
  }

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  Future<void> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // 1. Trigger Google account picker
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        // User cancelled the picker
        state = state.copyWith(isLoading: false);
        return;
      }

      // 2. Get Google auth credentials
      final googleAuth = await googleUser.authentication;

      // 3. Sign in to Firebase with Google credential
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final userCredential =
          await FirebaseAuth.instance.signInWithCredential(credential);

      // 4. Get Firebase ID token to send to our backend
      final idToken = await userCredential.user!.getIdToken();

      // 5. Exchange Firebase ID token for our own JWT pair
      final data = await _repo.firebaseLogin(idToken!);
      await _persist(data);
    } catch (e, st) {
      debugPrint('🔴 Sign-in error: $e');
      debugPrint('🔴 Stack trace: $st');
      state = state.copyWith(
        isLoading: false,
        error: 'Sign-in failed: $e',
      );
      rethrow;
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  Future<void> logout() async {
    await _googleSignIn.signOut();
    await FirebaseAuth.instance.signOut();
    await _storage.deleteAll();
    state = const AuthState();
  }

  // ── Update profile locally ─────────────────────────────────────────────────
  Future<void> updateUser(UserModel updated) async {
    await _storage.write(
        key: AppConstants.keyUser, value: jsonEncode(updated.toJson()));
    state = state.copyWith(user: updated);
  }

  void clearError() => state = state.copyWith(error: null);

  // ── Persist tokens + user to secure storage ───────────────────────────────
  Future<void> _persist(Map<String, dynamic> data) async {
    final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
    await _storage.write(
        key: AppConstants.keyAccessToken, value: data['accessToken'] as String);
    await _storage.write(
        key: AppConstants.keyRefreshToken,
        value: data['refreshToken'] as String);
    await _storage.write(
        key: AppConstants.keyUser, value: jsonEncode(user.toJson()));
    state = AuthState(user: user);
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (_) => AuthNotifier(),
);
