import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import useAuthStore from '../store/authStore';
import { SCREENS } from '../utils/constants';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main screens
import HomeScreen from '../screens/HomeScreen';
import ShopListScreen from '../screens/ShopListScreen';
import UploadScreen from '../screens/UploadScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Detail screens (pushed on stack)
import OrderScreen from '../screens/OrderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

// ──────────────────────────────────────────────
// Auth Stack
// ──────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name={SCREENS.LOGIN} component={LoginScreen} />
      <AuthStack.Screen name={SCREENS.REGISTER} component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ──────────────────────────────────────────────
// Main Tab Navigator
// ──────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f1a',
          borderTopColor: '#1e1e35',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case SCREENS.HOME:
              iconName = focused ? 'home' : 'home-outline';
              break;
            case SCREENS.SHOP_LIST:
              iconName = focused ? 'storefront' : 'storefront-outline';
              break;
            case SCREENS.UPLOAD:
              iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
              break;
            case SCREENS.ORDER_HISTORY:
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case SCREENS.PROFILE:
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'circle';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name={SCREENS.HOME} component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name={SCREENS.SHOP_LIST} component={ShopListScreen} options={{ tabBarLabel: 'Shops' }} />
      <Tab.Screen name={SCREENS.UPLOAD} component={UploadScreen} options={{ tabBarLabel: 'Upload' }} />
      <Tab.Screen name={SCREENS.ORDER_HISTORY} component={OrderHistoryScreen} options={{ tabBarLabel: 'Orders' }} />
      <Tab.Screen name={SCREENS.PROFILE} component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ──────────────────────────────────────────────
// Root Stack (tabs + modal screens)
// ──────────────────────────────────────────────
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name={SCREENS.ORDER_DETAIL}
        component={OrderScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}

// ──────────────────────────────────────────────
// Root Navigator — Auth gate
// ──────────────────────────────────────────────
export default function AppNavigator() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppStack /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
