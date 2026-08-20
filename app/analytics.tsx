import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PLACES, PROVINCES } from '@/data/catalog';
import { GLASS } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';
import type { Region } from '@/types';
import {
  GlassCard,
  GlassCircleButton,
  GlassHeader,
  GlassPageEnter,
  GlassProgress,
  GlassScreen,
} from '@/components/glass';

const REGIONS: Region[] = ['ภาคเหนือ', 'ภาคอีสาน', 'ภาคกลาง', 'ภาคตะวันออก', 'ภาคตะวันตก', 'ภาคใต้'];

export default function Analytics() {
  const router = useRouter();
  const {
    visitedProvinceIds,
    visitedPlaceIds,
    wishlistPlaceIds,
    trips,
    journals,
  } = useTravelStore();

  const overall = Math.round((visitedProvinceIds.length / 77) * 100);
  const remaining = Math.max(0, 77 - visitedProvinceIds.length);
  const totalDays = trips.reduce((sum, trip) => sum + Math.max(1, trip.days?.length || 1), 0);
  const journalExpense = journals.reduce((sum, journal) => sum + (Number(journal.expense) || 0), 0);
  const plannedBudget = trips.reduce((sum, trip) => sum + (Number(trip.budget) || 0), 0);
  const averageBudget = trips.length ? Math.round(plannedBudget / trips.length) : 0;

  const regionData = useMemo(
    () =>
      REGIONS.map((region) => {
        const total = PROVINCES.filter((province) => province.region === region).length;
        const visited = PROVINCES.filter(
          (province) => province.region === region && visitedProvinceIds.includes(province.id),
        ).length;
        return {
          region,
          total,
          visited,
          pct: total ? Math.round((visited / total) * 100) : 0,
        };
      }),
    [visitedProvinceIds],
  );

  const regionsStarted = regionData.filter((item) => item.visited > 0).length;

  const categories = useMemo(() => {
    const count: Record<string, number> = {};
    PLACES.filter((place) => visitedPlaceIds.includes(place.id)).forEach((place) => {
      count[place.category] = (count[place.category] || 0) + 1;
    });
    return Object.entries(count).sort((a, b) => b[1] - a[1]) as [string, number][];
  }, [visitedPlaceIds]);

  const topCategory = categories[0]?.[0] || 'ยังไม่มีข้อมูล';
  const topCategoryCount = categories[0]?.[1] || 0;

  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const count = trips.filter((trip) => {
        const start = new Date(trip.startDate);
        return !Number.isNaN(start.getTime()) && start.getFullYear() === year && start.getMonth() === month;
      }).length;
      return {
        label: date.toLocaleString('th-TH', { month: 'short' }),
        count,
      };
    });
  }, [trips]);

  const maxMonthly = Math.max(1, ...monthly.map((item) => item.count));
  const background = PLACES.find((place) => place.category === 'ธรรมชาติ')?.image || PROVINCES[0].coverImage;

  return (
    <GlassScreen image={background}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.page}>
            <GlassPageEnter>
              <GlassHeader
                eyebrow="MY TRAVEL OVERVIEW"
                title="สถิติการเดินทาง"
                subtitle="สรุปการเดินทางของคุณแบบอ่านง่าย จัดเป็นหมวด และเหมาะกับหน้าจอมือถือ"
                right={<GlassCircleButton icon="chevron-back" label="กลับ" onPress={() => router.back()} />}
              />
            </GlassPageEnter>

            <GlassPageEnter delay={60}>
              <GlassCard strong style={styles.heroCard}>
                <View style={styles.heroHead}>
                  <View style={styles.heroIcon}>
                    <Ionicons name="map-outline" size={22} color={GLASS.gold} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.eyebrow}>THAILAND PROGRESS</Text>
                    <Text style={styles.heroTitle}>สำรวจแล้ว {visitedProvinceIds.length} จาก 77 จังหวัด</Text>
                  </View>
                </View>

                <View style={styles.progressValueRow}>
                  <Text style={styles.progressValue}>{overall}%</Text>
                  <Text style={styles.progressCaption}>ของประเทศไทย</Text>
                </View>
                <GlassProgress value={overall} height={9} />

                <View style={styles.heroFacts}>
                  <Fact value={String(remaining)} label="จังหวัดที่เหลือ" />
                  <Fact value={`${regionsStarted}/6`} label="ภูมิภาคที่เริ่มแล้ว" />
                  <Fact value={String(visitedPlaceIds.length)} label="สถานที่ไปแล้ว" />
                </View>
              </GlassCard>
            </GlassPageEnter>

            <GlassPageEnter delay={90}>
              <SectionTitle title="ภาพรวมของคุณ" subtitle="ตัวเลขหลักที่ใช้บ่อย" />
              <View style={styles.metricGrid}>
                <Metric icon="airplane-outline" value={trips.length.toLocaleString()} label="ทริปทั้งหมด" />
                <Metric icon="calendar-outline" value={totalDays.toLocaleString()} label="วันเดินทาง" />
                <Metric icon="heart-outline" value={wishlistPlaceIds.length.toLocaleString()} label="สถานที่อยากไป" />
                <Metric icon="book-outline" value={journals.length.toLocaleString()} label="บันทึกการเดินทาง" />
              </View>
            </GlassPageEnter>

            <GlassPageEnter delay={120}>
              <SectionTitle title="กิจกรรม 6 เดือนล่าสุด" subtitle="จำนวนทริปที่เริ่มในแต่ละเดือน" />
              <GlassCard style={styles.timelineCard}>
                <View style={styles.timelineSummary}>
                  <View>
                    <Text style={styles.timelineValue}>{trips.length}</Text>
                    <Text style={styles.timelineLabel}>ทริปที่บันทึกทั้งหมด</Text>
                  </View>
                  <View style={styles.cleanBadge}>
                    <Ionicons name="pulse-outline" size={14} color={GLASS.aqua} />
                    <Text style={styles.cleanBadgeText}>6 MONTHS</Text>
                  </View>
                </View>

                <View style={styles.bars}>
                  {monthly.map((item) => {
                    const height = 18 + (item.count / maxMonthly) * 62;
                    return (
                      <View key={`${item.label}-${item.count}`} style={styles.barItem}>
                        <Text style={styles.barCount}>{item.count}</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { height }]} />
                        </View>
                        <Text style={styles.barLabel}>{item.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </GlassCard>
            </GlassPageEnter>

            <GlassPageEnter delay={150}>
              <SectionTitle title="ความคืบหน้าตามภูมิภาค" subtitle="ดูว่าคุณสำรวจพื้นที่ไหนไปมากแค่ไหน" />
              <GlassCard style={styles.regionCard}>
                {regionData.map((item) => (
                  <View key={item.region} style={styles.regionItem}>
                    <View style={styles.regionTop}>
                      <View style={styles.regionNameWrap}>
                        <View style={styles.regionDot} />
                        <Text style={styles.regionName}>{item.region}</Text>
                      </View>
                      <Text style={styles.regionCount}>
                        {item.visited}/{item.total} · {item.pct}%
                      </Text>
                    </View>
                    <GlassProgress value={item.pct} height={7} />
                  </View>
                ))}
              </GlassCard>
            </GlassPageEnter>

            <GlassPageEnter delay={180}>
              <SectionTitle title="สไตล์การเดินทาง" subtitle="อิงจากสถานที่ที่คุณทำเครื่องหมายว่าไปแล้ว" />
              <GlassCard style={styles.categoryCard}>
                <View style={styles.categoryHero}>
                  <View style={styles.categoryIcon}>
                    <Ionicons name="sparkles-outline" size={21} color={GLASS.gold} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.eyebrow}>TOP CATEGORY</Text>
                    <Text style={styles.categoryTitle}>{topCategory}</Text>
                    <Text style={styles.categorySub}>{topCategoryCount} สถานที่ในหมวดอันดับหนึ่ง</Text>
                  </View>
                </View>

                <View style={styles.rankList}>
                  {categories.length ? (
                    categories.slice(0, 5).map(([category, count], index) => (
                      <View key={category} style={styles.rankRow}>
                        <View style={styles.rankNo}><Text style={styles.rankNoText}>{index + 1}</Text></View>
                        <Text style={styles.rankName}>{category}</Text>
                        <Text style={styles.rankCount}>{count} ที่</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>เมื่อคุณเพิ่มสถานที่ที่ “ไปแล้ว” ระบบจะสรุปหมวดที่เที่ยวบ่อยให้ตรงนี้</Text>
                  )}
                </View>
              </GlassCard>
            </GlassPageEnter>

            <GlassPageEnter delay={210}>
              <SectionTitle title="งบและความทรงจำ" subtitle="แยกงบวางแผนออกจากค่าใช้จ่ายที่บันทึกจริง" />
              <GlassCard style={styles.moneyCard}>
                <MoneyRow icon="wallet-outline" label="งบที่วางไว้รวม" value={`${plannedBudget.toLocaleString()} บาท`} />
                <MoneyRow icon="receipt-outline" label="ค่าใช้จ่ายจาก Journal" value={`${journalExpense.toLocaleString()} บาท`} />
                <MoneyRow icon="calculator-outline" label="งบเฉลี่ยต่อทริป" value={`${averageBudget.toLocaleString()} บาท`} last />
              </GlassCard>
            </GlassPageEnter>

            <GlassPageEnter delay={240}>
              <SectionTitle title="เป้าหมายการเดินทาง" subtitle="Milestones ที่ปลดล็อกจากข้อมูลของคุณ" />
              <View style={styles.achievementGrid}>
                <Achievement icon="compass-outline" title="นักสำรวจ" detail="ไปแล้ว 5 จังหวัด" unlocked={visitedProvinceIds.length >= 5} />
                <Achievement icon="heart-outline" title="นักวางฝัน" detail="Wishlist 5 ที่" unlocked={wishlistPlaceIds.length >= 5} />
                <Achievement icon="book-outline" title="นักบันทึก" detail="Journal 3 ครั้ง" unlocked={journals.length >= 3} />
                <Achievement icon="map-outline" title="ครบทุกภาค" detail="เริ่มครบ 6 ภาค" unlocked={regionsStarted === 6} />
              </View>
            </GlassPageEnter>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlassScreen>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

function Metric({ icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <GlassCard style={styles.metricCard}>
      <View style={styles.metricIcon}><Ionicons name={icon} size={18} color={GLASS.white} /></View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </GlassCard>
  );
}

function MoneyRow({ icon, label, value, last = false }: { icon: any; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.moneyRow, last && styles.moneyRowLast]}>
      <View style={styles.moneyIcon}><Ionicons name={icon} size={18} color={GLASS.aqua} /></View>
      <View style={styles.flex}>
        <Text style={styles.moneyLabel}>{label}</Text>
        <Text style={styles.moneyValue}>{value}</Text>
      </View>
    </View>
  );
}

function Achievement({ icon, title, detail, unlocked }: { icon: any; title: string; detail: string; unlocked: boolean }) {
  return (
    <GlassCard style={[styles.achievement, !unlocked && styles.achievementLocked]}>
      <View style={[styles.achievementIcon, unlocked && styles.achievementIconOn]}>
        <Ionicons name={icon} size={20} color={unlocked ? GLASS.gold : 'rgba(255,255,255,.48)'} />
      </View>
      <Text style={styles.achievementTitle}>{title}</Text>
      <Text style={styles.achievementDetail}>{detail}</Text>
      <Text style={[styles.achievementState, unlocked && styles.achievementStateOn]}>
        {unlocked ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก'}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 92 },
  page: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 14, paddingTop: 12, gap: 16 },
  flex: { flex: 1, minWidth: 0 },
  heroCard: { padding: 16, gap: 14 },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  heroIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.10)', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1, color: GLASS.gold },
  heroTitle: { marginTop: 3, fontSize: 20, lineHeight: 26, fontWeight: '900', color: GLASS.white },
  progressValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  progressValue: { fontSize: 34, fontWeight: '900', color: GLASS.white, letterSpacing: -1 },
  progressCaption: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,.68)' },
  heroFacts: { flexDirection: 'row', gap: 7 },
  fact: { flex: 1, minWidth: 0, minHeight: 60, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  factValue: { fontSize: 16, fontWeight: '900', color: GLASS.white },
  factLabel: { marginTop: 2, fontSize: 8, lineHeight: 11, textAlign: 'center', fontWeight: '700', color: 'rgba(255,255,255,.58)' },
  sectionTitleWrap: { gap: 2 },
  sectionTitle: { fontSize: 18, lineHeight: 23, fontWeight: '900', color: GLASS.white },
  sectionSubtitle: { fontSize: 10.5, lineHeight: 15, fontWeight: '600', color: 'rgba(255,255,255,.64)' },
  metricGrid: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: { width: '48%', flexGrow: 1, minHeight: 104, padding: 12 },
  metricIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.10)', alignItems: 'center', justifyContent: 'center' },
  metricValue: { marginTop: 9, fontSize: 20, fontWeight: '900', color: GLASS.white },
  metricLabel: { marginTop: 2, fontSize: 9.5, fontWeight: '700', color: 'rgba(255,255,255,.62)' },
  timelineCard: { marginTop: 8, padding: 14, gap: 14 },
  timelineSummary: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  timelineValue: { fontSize: 26, fontWeight: '900', color: GLASS.white },
  timelineLabel: { marginTop: 1, fontSize: 9.5, color: 'rgba(255,255,255,.60)' },
  cleanBadge: { minHeight: 30, paddingHorizontal: 9, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,.08)' },
  cleanBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: .8, color: GLASS.white },
  bars: { height: 122, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barItem: { flex: 1, alignItems: 'center', gap: 4 },
  barCount: { fontSize: 8.5, fontWeight: '900', color: 'rgba(255,255,255,.72)' },
  barTrack: { width: '74%', height: 80, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: 'rgba(255,255,255,.07)' },
  barFill: { width: '100%', minHeight: 8, borderRadius: 8, backgroundColor: GLASS.aqua },
  barLabel: { fontSize: 8.5, fontWeight: '800', color: 'rgba(255,255,255,.58)' },
  regionCard: { marginTop: 8, padding: 14, gap: 14 },
  regionItem: { gap: 7 },
  regionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  regionNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  regionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GLASS.aqua },
  regionName: { fontSize: 11, fontWeight: '900', color: GLASS.white },
  regionCount: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,.60)' },
  categoryCard: { marginTop: 8, padding: 14, gap: 14 },
  categoryHero: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  categoryIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(242,211,154,.12)', alignItems: 'center', justifyContent: 'center' },
  categoryTitle: { marginTop: 2, fontSize: 21, fontWeight: '900', color: GLASS.white },
  categorySub: { marginTop: 2, fontSize: 9.5, color: 'rgba(255,255,255,.60)' },
  rankList: { gap: 7 },
  rankRow: { minHeight: 42, borderRadius: 13, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,.07)' },
  rankNo: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.09)' },
  rankNoText: { fontSize: 9, fontWeight: '900', color: GLASS.gold },
  rankName: { flex: 1, fontSize: 10.5, fontWeight: '900', color: GLASS.white },
  rankCount: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,.58)' },
  emptyText: { fontSize: 10, lineHeight: 16, color: 'rgba(255,255,255,.62)' },
  moneyCard: { marginTop: 8, paddingHorizontal: 13 },
  moneyRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)' },
  moneyRowLast: { borderBottomWidth: 0 },
  moneyIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  moneyLabel: { fontSize: 9.5, fontWeight: '700', color: 'rgba(255,255,255,.58)' },
  moneyValue: { marginTop: 2, fontSize: 15, fontWeight: '900', color: GLASS.white },
  achievementGrid: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achievement: { width: '48%', flexGrow: 1, minHeight: 132, padding: 12 },
  achievementLocked: { opacity: .58 },
  achievementIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  achievementIconOn: { backgroundColor: 'rgba(242,211,154,.12)' },
  achievementTitle: { marginTop: 8, fontSize: 11, fontWeight: '900', color: GLASS.white },
  achievementDetail: { marginTop: 2, fontSize: 8.5, lineHeight: 12, color: 'rgba(255,255,255,.56)' },
  achievementState: { marginTop: 7, fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,.48)' },
  achievementStateOn: { color: GLASS.gold },
});
