import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: styles.tabBar,
      tabBarBackground: () => (
        Platform.OS !== 'web' ? <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} /> : null
      ),
    }}>
      <Tabs.Screen name="index" options={{ title: 'หน้าแรก', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="visited" options={{ title: 'ไปมาแล้ว', tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={24} color={color} /> }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', tabBarIcon: ({ color }) => <Ionicons name="heart" size={24} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', bottom: Platform.OS === 'web' ? 0 : 20, left: Platform.OS === 'web' ? 0 : 20, right: Platform.OS === 'web' ? 0 : 20,
    elevation: 0, height: 65, borderRadius: Platform.OS === 'web' ? 0 : 30,
    backgroundColor: Platform.OS === 'web' ? '#fff' : 'rgba(255,255,255,0.8)',
    borderTopWidth: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20,
  }
});