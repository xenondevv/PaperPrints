import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:paper_prints_user/core/network/repositories.dart';

// ─── Vendor Model ─────────────────────────────────────────────────────────────

class VendorSettings {
  final double priceBw;
  final double priceColor;
  final double? priceDoubleSided;
  final List<String> capabilities;

  const VendorSettings({
    required this.priceBw,
    required this.priceColor,
    this.priceDoubleSided,
    this.capabilities = const [],
  });

  factory VendorSettings.fromJson(Map<String, dynamic> j) => VendorSettings(
        priceBw: (j['price_bw'] as num).toDouble(),
        priceColor: (j['price_color'] as num).toDouble(),
        priceDoubleSided: j['price_double_sided'] != null
            ? (j['price_double_sided'] as num).toDouble()
            : null,
        capabilities: (j['capabilities'] as List<dynamic>? ?? [])
            .map((e) => e as String)
            .toList(),
      );
}

class VendorModel {
  final String id;
  final String shopName;
  final String? address;
  final String? phone;
  final bool isOpen;
  final double? distanceKm;
  final double? lat;
  final double? lng;
  final VendorSettings? settings;

  const VendorModel({
    required this.id,
    required this.shopName,
    this.address,
    this.phone,
    required this.isOpen,
    this.distanceKm,
    this.lat,
    this.lng,
    this.settings,
  });

  factory VendorModel.fromJson(Map<String, dynamic> j) => VendorModel(
        id: j['id'] as String,
        shopName: j['shop_name'] as String,
        address: j['address'] as String?,
        phone: j['phone'] as String?,
        isOpen: j['is_open'] as bool? ?? false,
        distanceKm: j['distance_km'] != null
            ? (j['distance_km'] as num).toDouble()
            : null,
        lat: j['lat'] != null ? (j['lat'] as num).toDouble() : null,
        lng: j['lng'] != null ? (j['lng'] as num).toDouble() : null,
        settings: j['settings'] != null
            ? VendorSettings.fromJson(j['settings'] as Map<String, dynamic>)
            : null,
      );

  String get distanceLabel {
    if (distanceKm == null) return '';
    if (distanceKm! < 1) return '${(distanceKm! * 1000).round()} m';
    return '${distanceKm!.toStringAsFixed(1)} km';
  }
}

// ─── Nearby Shops Provider ───────────────────────────────────────────────────

class NearbyShopsState {
  final List<VendorModel> shops;
  final bool isLoading;
  final String? error;

  const NearbyShopsState(
      {this.shops = const [], this.isLoading = false, this.error});

  NearbyShopsState copyWith(
          {List<VendorModel>? shops, bool? isLoading, String? error}) =>
      NearbyShopsState(
        shops: shops ?? this.shops,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class NearbyShopsNotifier extends StateNotifier<NearbyShopsState> {
  NearbyShopsNotifier() : super(const NearbyShopsState());

  final _repo = VendorsRepository();

  Future<void> load(double lat, double lng, {double radius = 10}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final raw = await _repo.getNearby(lat, lng, radius);
      state = state.copyWith(
        shops: raw.map((e) => VendorModel.fromJson(e as Map<String, dynamic>)).toList(),
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final nearbyShopsProvider =
    StateNotifierProvider<NearbyShopsNotifier, NearbyShopsState>(
  (_) => NearbyShopsNotifier(),
);

// ─── Shop Detail Provider ────────────────────────────────────────────────────

final shopDetailProvider = FutureProvider.family<VendorModel, String>((ref, id) async {
  final raw = await VendorsRepository().getById(id);
  return VendorModel.fromJson(raw);
});
