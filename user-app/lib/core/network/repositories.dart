import 'package:dio/dio.dart';
import 'package:paper_prints_user/core/network/api_client.dart';

class AuthRepository {
  final _dio = ApiClient.instance.dio;

  /// Exchange a Firebase ID token for our own JWT pair.
  Future<Map<String, dynamic>> firebaseLogin(String idToken) async {
    final res = await _dio.post('/auth/firebase', data: {'idToken': idToken});
    return res.data as Map<String, dynamic>;
  }
}


class VendorsRepository {
  final _dio = ApiClient.instance.dio;

  Future<List<dynamic>> getNearby(double lat, double lng, double radius) async {
    final res = await _dio.get('/vendors/nearby', queryParameters: {
      'lat': lat,
      'lng': lng,
      'radius': radius,
    });
    return res.data['vendors'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> getById(String id) async {
    final res = await _dio.get('/vendors/$id');
    return res.data['vendor'] as Map<String, dynamic>;
  }
}

class FilesRepository {
  final _dio = ApiClient.instance.dio;

  Future<Map<String, dynamic>> upload(
    String filePath,
    String fileName, {
    void Function(int sent, int total)? onProgress,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });
    final res = await _dio.post(
      '/files/upload',
      data: formData,
      onSendProgress: onProgress,
      options: Options(contentType: 'multipart/form-data'),
    );
    return res.data['file'] as Map<String, dynamic>;
  }
}

class OrdersRepository {
  final _dio = ApiClient.instance.dio;

  Future<List<dynamic>> getAll() async {
    final res = await _dio.get('/orders');
    return res.data['orders'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> getById(String id) async {
    final res = await _dio.get('/orders/$id');
    return res.data['order'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> payload) async {
    final res = await _dio.post('/orders', data: payload);
    return res.data['order'] as Map<String, dynamic>;
  }

  Future<void> cancel(String id) async {
    await _dio.patch('/orders/$id/status', data: {'status': 'CANCELLED'});
  }
}

class UsersRepository {
  final _dio = ApiClient.instance.dio;

  Future<Map<String, dynamic>> getProfile() async {
    final res = await _dio.get('/users/me');
    return res.data['user'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final res = await _dio.patch('/users/me', data: data);
    return res.data['user'] as Map<String, dynamic>;
  }
}
