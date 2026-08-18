import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlaceStore } from '../../store/usePlaceStore';
import { PlaceCard } from '../../components/PlaceCard';
import { COLORS } from '../../constants/theme';

export default function HomeScreen() {
  const { places, searchQuery, setSearchQuery } = usePlaceStore();
  const filteredPlaces = places.filter(p => p.name.includes(searchQuery) || p.province.includes(searchQuery));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <Text style={styles.greeting}>สวัสดี, นักเดินทาง! 👋</Text>
          <Text style={styles.subGreeting}>ไปค้นหาประสบการณ์ใหม่ในไทยกันเถอะ</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} />
          <TextInput style={styles.searchInput} placeholder="ค้นหาสถานที่ เช่น เชียงใหม่, ทะเล..." value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <Text style={styles.sectionTitle}>แนะนำที่เที่ยว 🏝️</Text>
        <FlatList
          data={filteredPlaces} keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlaceCard place={item} />}
          horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placesList}
        />
        
        <Text style={styles.sectionTitle}>ฮิตติดเทรนด์ 🔥</Text>
        <FlatList
          data={[...filteredPlaces].reverse()} keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlaceCard place={item} />}
          horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placesList}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 24, paddingBottom: 16 },
  greeting: { fontSize: 28, fontWeight: '900', color: COLORS.textDark },
  subGreeting: { fontSize: 16, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: 24, paddingHorizontal: 16, height: 56, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500' },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, marginHorizontal: 24, marginTop: 32, marginBottom: 16 },
  placesList: { paddingLeft: 24, paddingRight: 8 },
});