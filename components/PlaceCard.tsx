import React, { useRef } from 'react';
import { View, Text, Image, TouchableWithoutFeedback, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';
import { Place, usePlaceStore } from '../store/usePlaceStore';

export const PlaceCard = ({ place }: { place: Place }) => {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;
  const { toggleWishlist } = usePlaceStore();

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <TouchableWithoutFeedback 
      onPressIn={handlePressIn} onPressOut={handlePressOut}
      onPress={() => router.push(`/place-detail?id=${place.id}`)}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Image source={{ uri: place.image }} style={styles.image} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />
        
        <TouchableWithoutFeedback onPress={() => toggleWishlist(place.id)}>
          <View style={styles.heartButton}>
            <Ionicons name={place.isWishlist ? "heart" : "heart-outline"} size={22} color={place.isWishlist ? COLORS.wishlist : COLORS.card} />
          </View>
        </TouchableWithoutFeedback>

        {place.isVisited && (
          <View style={styles.visitedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.visited} />
            <Text style={styles.visitedText}>เคยไปแล้ว</Text>
          </View>
        )}

        <View style={styles.info}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{place.name}</Text>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={12} color={COLORS.rating} />
              <Text style={styles.ratingText}>{place.rating}</Text>
            </View>
          </View>
          <Text style={styles.province}><Ionicons name="location-sharp" size={12} /> {place.province}</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 250, width: Platform.OS === 'web' ? '100%' : 260,
    borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.card,
    marginRight: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  image: { width: '100%', height: '100%', position: 'absolute' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  heartButton: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.25)', padding: 8, borderRadius: 20 },
  visitedBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.95)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  visitedText: { marginLeft: 4, fontSize: 12, fontWeight: '700', color: COLORS.visited },
  info: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: COLORS.card, fontSize: 20, fontWeight: '800', flex: 1 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { color: COLORS.card, marginLeft: 4, fontWeight: '700', fontSize: 12 },
  province: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4, fontWeight: '500' },
});