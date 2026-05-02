import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:paper_prints_user/core/constants/app_constants.dart';

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  final _storage = const FlutterSecureStorage();

  late final Dio _dio = Dio(
    BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ),
  )
    ..interceptors.add(_AuthInterceptor(_storage))
    ..interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
    ));

  Dio get dio => _dio;
}

class _AuthInterceptor extends QueuedInterceptor {
  final FlutterSecureStorage _storage;
  _AuthInterceptor(this._storage);

  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: AppConstants.keyAccessToken);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 &&
        err.requestOptions.extra['_retry'] != true) {
      try {
        final refreshToken =
            await _storage.read(key: AppConstants.keyRefreshToken);
        final response = await Dio().post(
          '${AppConstants.apiBaseUrl}/auth/refresh',
          data: {'refreshToken': refreshToken},
        );
        final newToken = response.data['accessToken'] as String;
        await _storage.write(
            key: AppConstants.keyAccessToken, value: newToken);

        final opts = err.requestOptions
          ..headers['Authorization'] = 'Bearer $newToken'
          ..extra['_retry'] = true;

        final retried =
            await ApiClient.instance.dio.fetch(opts);
        return handler.resolve(retried);
      } catch (_) {
        await _storage.deleteAll();
      }
    }
    handler.next(err);
  }
}
