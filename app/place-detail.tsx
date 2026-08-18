import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePlaceStore } from '../store/usePlaceStore';
import { COLORS } from '../constants/theme';

export default function PlaceDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { places, toggleWishlist, toggleVisited } = usePlaceStore();
  const place = places.find(p => p.id === id);

  if (!place) return null;

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: place.image }} style={styles.heroImage} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <BlurView intensity={80} tint="light" style={styles.blurBtn}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </BlurView>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{place.name}</Text>
              <Text style={styles.location}><Ionicons name="location" size={16} /> {place.province}, ประเทศไทย</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color={COLORS.rating} />
              <Text style={styles.ratingText}>{place.rating}</Text>
            </View>
          </View>

          <View style={styles.tagContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>{place.category}</Text></View>
          </View>

          <Text style={styles.desc}>{place.description}</Text>
        </View>
      </ScrollView>

      {/* Action Buttons at Bottom */}
      <BlurView intensity={90} tint="light" style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.btn, place.isVisited ? styles.btnVisited : styles.btnOutline]} 
          onPress={() => toggleVisited(place.id)}
        >
          <Ionicons name="checkmark-circle" size={20} color={place.isVisited ? '#fff' : COLORS.textDark} />
          <Text style={[styles.btnText, { color: place.isVisited ? '#fff' : COLORS.textDark }]}>
            {place.isVisited ? 'เคยไปแล้ว' : 'ทำเครื่องหมายว่าไปมาแล้ว'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btn, styles.btnPrimary]} 
          onPress={() => toggleWishlist(place.id)}
        >
          <Ionicons name={place.isWishlist ? "heart" : "heart-outline"} size={20} color="#fff" />
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {place.isWishlist ? 'บันทึกแล้ว' : 'บันทึกใน Wishlist'}
          </Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  imageContainer: { height: 400, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 50, left: 20, borderRadius: 20, overflow: 'hidden' },
  blurBtn: { padding: 10 },
  content: { padding: 24, backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textDark },
  location: { fontSize: 16, color: COLORS.textMuted, marginTop: 8, fontWeight: '500' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  ratingText: { marginLeft: 6, fontWeight: '800', fontSize: 16, color: COLORS.textDark },
  tagContainer: { flexDirection: 'row', marginTop: 16 },
  tag: { backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { color: COLORS.secondary, fontWeight: '700' },
  desc: { marginTop: 24, fontSize: 16, lineHeight: 28, color: COLORS.textMuted },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, flexDirection: 'row', gap: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
  btnOutline: { backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: COLORS.border },
  btnVisited: { backgroundColor: COLORS.visited },
  btnPrimary: { backgroundColor: COLORS.wishlist },
  btnText: { fontWeight: '700', fontSize: 16 },
});