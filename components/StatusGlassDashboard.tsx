import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ThailandMap from '@/components/ThailandMap';
import { GlassCard, GlassPressable, GlassProgress, GlassSection } from '@/components/glass';
import { GLASS, GLASS_RADIUS, GLASS_TEXT, glassSurface } from '@/constants/glassTheme';
import { PLACES, PROVINCES } from '@/data/catalog';
import { getProvinceInfo } from '@/data/provinceInfo';
import { useTravelStore } from '@/store/useTravelStore';

export type StatusGlassMode = 'visited' | 'wishlist';
type Props = { mode: StatusGlassMode };

const MODE = {
  visited: {
    eyebrow: 'TRAVEL MEMORY',
    title: 'ที่ที่ไปแล้ว',
    subtitle: 'เก็บครบทุกความทรงจำจากการเดินทางของคุณ',
    icon: 'checkmark-circle' as const,
    accent: GLASS.turquoise,
    accentText: GLASS.aqua,
    soft: 'rgba(40,213,199,.18)',
    helper: 'แตะจังหวัดบนแผนที่เพื่อทำเครื่องหมายว่าไปแล้ว',
    recent: 'จังหวัดที่ไปล่าสุด',
    placeTitle: 'สถานที่ที่ไปแล้ว',
    provinceTitle: 'จังหวัดที่ไปแล้ว',
    emptyProvince: 'ยังไม่ได้เลือกจังหวัดที่ไปแล้ว',
    emptyPlace: 'ยังไม่มีสถานที่ที่ทำเครื่องหมายว่าไปแล้ว',
  },
  wishlist: {
    eyebrow: 'TRAVEL WISHLIST',
    title: 'รายการโปรด',
    subtitle: 'รวมจังหวัดและสถานที่ในฝันที่คุณอยากไป',
    icon: 'heart' as const,
    accent: GLASS.goldStrong,
    accentText: GLASS.gold,
    soft: 'rgba(233,185,91,.18)',
    helper: 'แตะจังหวัดบนแผนที่เพื่อเพิ่มหรือนำออกจาก Wishlist',
    recent: 'จังหวัดที่อยากไปล่าสุด',
    placeTitle: 'สถานที่ที่อยากไป',
    provinceTitle: 'จังหวัดที่อยากไป',
    emptyProvince: 'ยังไม่ได้เลือกจังหวัดที่อยากไป',
    emptyPlace: 'ยังไม่มีสถานที่ในรายการอยากไป',
  },
};

const REGIONS = ['ภาคเหนือ', 'ภาคอีสาน', 'ภาคกลาง', 'ภาคตะวันออก', 'ภาคตะวันตก', 'ภาคใต้'] as const;

export default function StatusGlassDashboard({ mode }: Props) {
  const cfg = MODE[mode];
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 1080;
  const medium = width >= 760;

  const {
    visitedProvinceIds,
    wishlistProvinceIds,
    visitedPlaceIds,
    wishlistPlaceIds,
    journals,
    trips,
    toggleVisitedProvince,
    toggleWishlistProvince,
    toggleVisitedPlace,
    toggleWishlistPlace,
  } = useTravelStore();

  const provinceIds = mode === 'visited' ? visitedProvinceIds : wishlistProvinceIds;
  const placeIds = mode === 'visited' ? visitedPlaceIds : wishlistPlaceIds;
  const toggleProvince = mode === 'visited' ? toggleVisitedProvince : toggleWishlistProvince;
  const togglePlace = mode === 'visited' ? toggleVisitedPlace : toggleWishlistPlace;

  const selectedProvinces = useMemo(
    () => provinceIds.map(id => PROVINCES.find(p => p.id === id)).filter(Boolean) as typeof PROVINCES,
    [provinceIds]
  );
  const selectedPlaces = useMemo(
    () => placeIds.map(id => PLACES.find(p => p.id === id)).filter(Boolean) as typeof PLACES,
    [placeIds]
  );
  const recent = useMemo(() => [...selectedProvinces].reverse().slice(0, 5), [selectedProvinces]);
  const pct = Math.round((provinceIds.length / 77) * 1000) / 10;

  const regionStats = useMemo(
    () => REGIONS.map(region => {
      const total = PROVINCES.filter(p => p.region === region).length;
      const chosen = PROVINCES.filter(p => p.region === region && provinceIds.includes(p.id)).length;
      return { region, total, chosen, pct: total ? Math.round((chosen / total) * 100) : 0 };
    }),
    [provinceIds]
  );

  const highlights = useMemo(() => {
    const all: string[] = [];
    selectedProvinces.slice(0, 8).forEach(p => {
      const info = getProvinceInfo(p.nameTh, p.region, p.description, p.bestMonths);
      info.highlights.slice(0, 2).forEach(x => { if (!all.includes(x)) all.push(x); });
    });
    return all.slice(0, 6);
  }, [selectedProvinces]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.page}>
      <View style={s.headerRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.eyebrow, { color: cfg.accentText }]}>{cfg.eyebrow}</Text>
          <Text style={s.title}>{cfg.title}</Text>
          <Text style={s.subtitle}>{cfg.subtitle}</Text>
        </View>
        <View style={[s.helper, glassSurface()]}> 
          <Ionicons name="navigate-outline" size={16} color={cfg.accentText} />
          <Text style={s.helperText}>{cfg.helper}</Text>
        </View>
      </View>

      <View style={[s.dashboard, wide && s.dashboardWide]}>
        <GlassCard strong style={[s.mapPanel, wide && s.mapPanelWide]}>
          <View style={s.mapPanelHead}>
            <View style={{ flex: 1, minWidth: 220 }}>
              <Text style={s.panelEyebrow}>THAILAND MAP · 77 PROVINCES</Text>
              <Text style={s.mapTitle}>แผนที่ประเทศไทย</Text>
              <Text style={s.mapSub}>แตะจังหวัดเพื่อเปลี่ยนสถานะ สีจะบันทึกอัตโนมัติในเครื่อง</Text>
            </View>
            <View style={[s.countBadge, { backgroundColor: cfg.soft, borderColor: cfg.accent }]}> 
              <View style={[s.dot, { backgroundColor: cfg.accent }]} />
              <Text style={s.countBadgeText}>{provinceIds.length} จังหวัด</Text>
            </View>
          </View>
          <View style={s.mapWrap}>
            <ThailandMap onSelectProvince={toggleProvince} mode={mode} compact />
          </View>
          <View style={s.legendRow}>
            <Legend color={GLASS.turquoise} label="ไปแล้ว" />
            <Legend color={GLASS.goldStrong} label="กำลังจะไป" />
            <Legend color="rgba(255,255,255,.42)" label="ยังไม่ไป" />
          </View>
        </GlassCard>

        <View style={[s.side, wide && s.sideWide]}>
          <GlassCard strong style={s.progressCard}>
            <View style={s.progressTop}>
              <View style={[s.progressIcon, { backgroundColor: cfg.soft, borderColor: cfg.accent }]}> 
                <Ionicons name={cfg.icon} size={27} color={cfg.accentText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.progressLabel}>{mode === 'visited' ? 'ความคืบหน้าการเดินทาง' : 'แผนการเดินทางของคุณ'}</Text>
                <View style={s.bigCountRow}>
                  <Text style={s.bigCount}>{provinceIds.length}</Text>
                  <Text style={s.bigCountUnit}> / 77 จังหวัด</Text>
                </View>
              </View>
              <View style={[s.percentRing, { borderColor: cfg.accent }]}> 
                <Text style={s.percentText}>{pct}%</Text>
              </View>
            </View>
            <Text style={s.progressHint}>{pct}% ของประเทศไทย</Text>
            <GlassProgress value={pct} height={7} />
          </GlassCard>

          <View style={s.statsRow}>
            <MiniStat icon="map-outline" value={provinceIds.length} label="จังหวัด" accent={cfg.accentText} />
            <MiniStat icon="location-outline" value={placeIds.length} label="สถานที่" accent={cfg.accentText} />
            <MiniStat icon={mode === 'visited' ? 'book-outline' : 'calendar-outline'} value={mode === 'visited' ? journals.length : trips.length} label={mode === 'visited' ? 'บันทึก' : 'ทริป'} accent={GLASS.gold} />
          </View>

          <GlassCard style={s.regionPanel}>
            <GlassSection title="ตามภูมิภาค" subtitle={`${provinceIds.length}/77 จังหวัด`} />
            <View style={s.regionList}>
              {regionStats.map(x => (
                <View key={x.region} style={s.regionItem}>
                  <View style={s.regionTop}>
                    <Text style={s.regionName}>{x.region}</Text>
                    <Text style={s.regionCount}>{x.chosen} / {x.total}</Text>
                  </View>
                  <View style={s.regionTrack}><View style={[s.regionFill, { width: `${x.pct}%`, backgroundColor: cfg.accent }]} /></View>
                </View>
              ))}
            </View>
          </GlassCard>

          <GlassCard style={s.recentPanel}>
            <View style={s.sectionInline}>
              <Text style={s.sectionTitle}>{cfg.recent}</Text>
              <GlassPressable style={s.smallLink} onPress={() => router.push('/(tabs)/map')}>
                <Text style={[s.smallLinkText, { color: cfg.accentText }]}>ดูแผนที่</Text>
                <Ionicons name="chevron-forward" size={14} color={cfg.accentText} />
              </GlassPressable>
            </View>
            {recent.length ? recent.map((p, i) => (
              <GlassPressable key={p.id} style={[s.recentRow, i > 0 && s.recentBorder]} onPress={() => router.push({ pathname: '/province-detail', params: { id: p.id } })}>
                <View style={[s.recentIcon, { backgroundColor: cfg.soft }]}><Ionicons name={cfg.icon} size={16} color={cfg.accentText} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.recentName}>{p.nameTh}</Text>
                  <Text style={s.recentMeta}>{p.nameEn} · {p.region}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={GLASS_TEXT.tertiary} />
              </GlassPressable>
            )) : <EmptySmall text={cfg.emptyProvince} accent={cfg.accentText} />}
          </GlassCard>
        </View>
      </View>

      {highlights.length > 0 && (
        <GlassCard style={s.highlightPanel}>
          <GlassSection title={mode === 'visited' ? 'ไฮไลต์จากเส้นทางของคุณ' : 'ไอเดียสำหรับทริปต่อไป'} subtitle="Highlights" />
          <View style={s.tags}>{highlights.map(x => <View key={x} style={[s.tag, { backgroundColor: cfg.soft, borderColor: cfg.accent }]}><Ionicons name="sparkles-outline" size={13} color={cfg.accentText} /><Text style={s.tagText}>{x}</Text></View>)}</View>
        </GlassCard>
      )}

      <View style={s.listHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>{mode === 'visited' ? 'ไปไหนมาบ้าง' : 'อยากไปไหนบ้าง'}</Text>
          <Text style={s.sectionSub}>{mode === 'visited' ? 'จังหวัดและสถานที่ที่คุณเคยไปทั้งหมด' : 'จังหวัดและสถานที่ที่บันทึกไว้สำหรับทริปในอนาคต'}</Text>
        </View>
        <View style={[s.totalPill, { backgroundColor: cfg.soft, borderColor: cfg.accent }]}><Text style={s.totalPillText}>{provinceIds.length} จังหวัด · {placeIds.length} สถานที่</Text></View>
      </View>

      <View style={[s.listGrid, medium && s.listGridWide]}>
        <GlassCard strong style={s.listPanel}>
          <View style={s.sectionInline}>
            <View><Text style={s.listTitle}>{cfg.provinceTitle}</Text><Text style={s.listSub}>{provinceIds.length} จังหวัด</Text></View>
            <GlassPressable style={s.smallLink} onPress={() => router.push('/(tabs)/map')}><Text style={[s.smallLinkText, { color: cfg.accentText }]}>เพิ่มจากแผนที่</Text></GlassPressable>
          </View>
          {selectedProvinces.length ? (
            <View style={s.provinceGrid}>
              {[...selectedProvinces].reverse().map(p => (
                <View key={p.id} style={s.provinceCard}>
                  <GlassPressable style={s.provinceOpen} onPress={() => router.push({ pathname: '/province-detail', params: { id: p.id } })}>
                    <Image source={p.coverImage} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
                    <View style={s.imageShade} />
                    <View style={s.provinceCopy}>
                      <Text style={s.provinceName}>{p.nameTh}</Text>
                      <Text style={s.provinceMeta}>{p.nameEn} · {p.region}</Text>
                    </View>
                  </GlassPressable>
                  <GlassPressable style={[s.removeBtn, glassSurface()]} onPress={() => toggleProvince(p.id)} accessibilityLabel={`นำ ${p.nameTh} ออกจากรายการ`}>
                    <Ionicons name="close" size={16} color={GLASS.white} />
                  </GlassPressable>
                </View>
              ))}
            </View>
          ) : <EmptyLarge text={cfg.emptyProvince} action="เลือกจากแผนที่" accent={cfg.accentText} onPress={() => router.push('/(tabs)/map')} />}
        </GlassCard>

        <GlassCard strong style={s.listPanel}>
          <View style={s.sectionInline}>
            <View><Text style={s.listTitle}>{cfg.placeTitle}</Text><Text style={s.listSub}>{placeIds.length} สถานที่</Text></View>
            <GlassPressable style={s.smallLink} onPress={() => router.push('/search')}><Text style={[s.smallLinkText, { color: cfg.accentText }]}>ค้นหาสถานที่</Text></GlassPressable>
          </View>
          {selectedPlaces.length ? (
            <View style={s.placeList}>
              {[...selectedPlaces].reverse().map(p => (
                <View key={p.id} style={s.placeRow}>
                  <GlassPressable style={s.placeOpen} onPress={() => router.push({ pathname: '/place-detail', params: { id: p.id } })}>
                    <Image source={p.image} style={s.placeImage} contentFit="cover" cachePolicy="memory-disk" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.placeName} numberOfLines={1}>{p.name}</Text>
                      <Text style={s.placeMeta} numberOfLines={1}>{p.province} · {p.category}</Text>
                      <View style={s.ratingRow}><Ionicons name="star" size={12} color={GLASS.gold} /><Text style={s.ratingText}>{p.rating}</Text></View>
                    </View>
                  </GlassPressable>
                  <GlassPressable style={s.removeInline} onPress={() => togglePlace(p.id)} accessibilityLabel={`นำ ${p.name} ออกจากรายการ`}><Ionicons name="close-circle-outline" size={21} color={GLASS_TEXT.secondary} /></GlassPressable>
                </View>
              ))}
            </View>
          ) : <EmptyLarge text={cfg.emptyPlace} action="ค้นหาสถานที่" accent={cfg.accentText} onPress={() => router.push('/search')} />}
        </GlassCard>
      </View>

      <GlassCard style={s.syncPanel}>
        <View style={s.syncIcon}><Ionicons name="sync-outline" size={20} color={GLASS.aqua} /></View>
        <View style={{ flex: 1 }}><Text style={s.syncTitle}>ข้อมูลเชื่อมกันทุกหน้า</Text><Text style={s.syncSub}>สถานะจาก Map, Place Detail, Wishlist และ Visited ใช้ Store ชุดเดียวกันและบันทึกอัตโนมัติ</Text></View>
        <GlassPressable style={[s.syncBtn, { backgroundColor: cfg.soft, borderColor: cfg.accent }]} onPress={() => router.push('/(tabs)/map')}><Text style={s.syncBtnText}>เปิดแผนที่</Text><Ionicons name="arrow-forward" size={15} color={GLASS.white} /></GlassPressable>
      </GlassCard>
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <View style={s.legend}><View style={[s.legendDot, { backgroundColor: color }]} /><Text style={s.legendText}>{label}</Text></View>;
}

function MiniStat({ icon, value, label, accent }: { icon: any; value: number; label: string; accent: string }) {
  return <GlassCard style={s.miniStat}><View style={s.miniIcon}><Ionicons name={icon} size={17} color={accent} /></View><Text style={s.miniValue}>{value}</Text><Text style={s.miniLabel}>{label}</Text></GlassCard>;
}

function EmptySmall({ text, accent }: { text: string; accent: string }) {
  return <View style={s.emptySmall}><Ionicons name="map-outline" size={23} color={accent} /><Text style={s.emptyText}>{text}</Text></View>;
}

function EmptyLarge({ text, action, accent, onPress }: { text: string; action: string; accent: string; onPress: () => void }) {
  return <View style={s.emptyLarge}><View style={s.emptyIcon}><Ionicons name="compass-outline" size={25} color={accent} /></View><Text style={s.emptyText}>{text}</Text><GlassPressable style={s.emptyAction} onPress={onPress}><Text style={[s.emptyActionText, { color: accent }]}>{action}</Text><Ionicons name="arrow-forward" size={14} color={accent} /></GlassPressable></View>;
}

const s = StyleSheet.create({
  page:{paddingHorizontal:18,paddingTop:14,paddingBottom:132,gap:18,maxWidth:1460,width:'100%',alignSelf:'center'},
  headerRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap'},
  eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.35},
  title:{fontSize:31,fontWeight:'900',color:GLASS.white,letterSpacing:-.55,marginTop:2,textShadowColor:'rgba(0,24,33,.45)',textShadowOffset:{width:0,height:1},textShadowRadius:6},
  subtitle:{fontSize:13,fontWeight:'600',color:GLASS_TEXT.secondary,marginTop:4},
  helper:{minHeight:42,maxWidth:560,borderRadius:GLASS_RADIUS.pill,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:8},
  helperText:{fontSize:11,fontWeight:'700',color:GLASS_TEXT.secondary,flexShrink:1},
  dashboard:{gap:14},dashboardWide:{flexDirection:'row',alignItems:'stretch'},
  mapPanel:{padding:14,minHeight:530},mapPanelWide:{flex:1,minWidth:0},
  mapPanelHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',paddingHorizontal:6,paddingTop:4,paddingBottom:10},
  panelEyebrow:{fontSize:8,fontWeight:'900',letterSpacing:1.1,color:GLASS.gold},mapTitle:{fontSize:20,fontWeight:'900',color:GLASS.white,marginTop:3},mapSub:{fontSize:10,fontWeight:'600',color:GLASS_TEXT.tertiary,marginTop:3},
  countBadge:{borderWidth:1,borderRadius:GLASS_RADIUS.pill,paddingHorizontal:11,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:6},dot:{width:7,height:7,borderRadius:4},countBadgeText:{fontSize:10,fontWeight:'900',color:GLASS.white},
  mapWrap:{flex:1,minHeight:420,borderRadius:22,overflow:'hidden',backgroundColor:'rgba(255,255,255,.06)',borderWidth:1,borderColor:'rgba(255,255,255,.12)'},
  legendRow:{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:13,flexWrap:'wrap',paddingHorizontal:7,paddingTop:10},legend:{flexDirection:'row',alignItems:'center',gap:5},legendDot:{width:7,height:7,borderRadius:4},legendText:{fontSize:8,fontWeight:'800',color:GLASS_TEXT.tertiary},
  side:{gap:12},sideWide:{width:360},
  progressCard:{padding:16},progressTop:{flexDirection:'row',alignItems:'center',gap:12},progressIcon:{width:54,height:54,borderRadius:20,borderWidth:1,alignItems:'center',justifyContent:'center'},progressLabel:{fontSize:11,fontWeight:'800',color:GLASS_TEXT.secondary},bigCountRow:{flexDirection:'row',alignItems:'baseline',marginTop:2},bigCount:{fontSize:34,fontWeight:'900',color:GLASS.white},bigCountUnit:{fontSize:11,fontWeight:'800',color:GLASS_TEXT.tertiary},percentRing:{width:64,height:64,borderRadius:32,borderWidth:5,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.05)'},percentText:{fontSize:15,fontWeight:'900',color:GLASS.white},progressHint:{fontSize:9,fontWeight:'700',color:GLASS_TEXT.tertiary,marginTop:12,marginBottom:7},
  statsRow:{flexDirection:'row',gap:8},miniStat:{flex:1,minWidth:95,padding:11,minHeight:91},miniIcon:{width:31,height:31,borderRadius:12,backgroundColor:'rgba(255,255,255,.10)',alignItems:'center',justifyContent:'center'},miniValue:{fontSize:20,fontWeight:'900',color:GLASS.white,marginTop:7},miniLabel:{fontSize:9,fontWeight:'800',color:GLASS_TEXT.tertiary,marginTop:1},
  regionPanel:{padding:15},regionList:{gap:9,marginTop:12},regionItem:{gap:5},regionTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},regionName:{fontSize:10,fontWeight:'800',color:GLASS_TEXT.secondary},regionCount:{fontSize:9,fontWeight:'800',color:GLASS_TEXT.tertiary},regionTrack:{height:5,borderRadius:99,backgroundColor:'rgba(255,255,255,.13)',overflow:'hidden'},regionFill:{height:'100%',borderRadius:99},
  recentPanel:{padding:15},sectionInline:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},sectionTitle:{fontSize:17,fontWeight:'900',color:GLASS.white},sectionSub:{fontSize:10,fontWeight:'600',color:GLASS_TEXT.tertiary,marginTop:3},smallLink:{minHeight:32,paddingHorizontal:4},smallLinkText:{fontSize:9,fontWeight:'900',marginRight:2},recentRow:{minHeight:52,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:9},recentBorder:{borderTopWidth:1,borderTopColor:'rgba(255,255,255,.10)'},recentIcon:{width:34,height:34,borderRadius:13,alignItems:'center',justifyContent:'center'},recentName:{fontSize:12,fontWeight:'900',color:GLASS.white},recentMeta:{fontSize:8,fontWeight:'600',color:GLASS_TEXT.tertiary,marginTop:2},
  highlightPanel:{padding:16},tags:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12},tag:{minHeight:34,borderRadius:GLASS_RADIUS.pill,borderWidth:1,paddingHorizontal:10,flexDirection:'row',alignItems:'center',gap:5},tagText:{fontSize:9,fontWeight:'800',color:GLASS_TEXT.secondary},
  listHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'},totalPill:{borderRadius:GLASS_RADIUS.pill,borderWidth:1,paddingHorizontal:11,paddingVertical:7},totalPillText:{fontSize:9,fontWeight:'900',color:GLASS.white},
  listGrid:{gap:12},listGridWide:{flexDirection:'row',alignItems:'stretch'},listPanel:{flex:1,minWidth:0,padding:15},listTitle:{fontSize:15,fontWeight:'900',color:GLASS.white},listSub:{fontSize:9,fontWeight:'700',color:GLASS_TEXT.tertiary,marginTop:2},
  provinceGrid:{flexDirection:'row',flexWrap:'wrap',gap:9,marginTop:12},provinceCard:{width:165,height:112,borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,.18)',backgroundColor:GLASS.glassSoft},provinceOpen:{flex:1,borderRadius:18,overflow:'hidden'},imageShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(2,31,42,.48)'},provinceCopy:{position:'absolute',left:11,right:11,bottom:10},provinceName:{fontSize:13,fontWeight:'900',color:GLASS.white},provinceMeta:{fontSize:8,fontWeight:'700',color:GLASS_TEXT.secondary,marginTop:2},removeBtn:{position:'absolute',right:7,top:7,width:29,height:29,borderRadius:15},
  placeList:{gap:8,marginTop:12},placeRow:{minHeight:78,borderRadius:17,backgroundColor:'rgba(255,255,255,.07)',borderWidth:1,borderColor:'rgba(255,255,255,.12)',flexDirection:'row',alignItems:'center',overflow:'hidden'},placeOpen:{flex:1,minHeight:78,padding:8,justifyContent:'flex-start'},placeImage:{width:62,height:62,borderRadius:14,marginRight:10},placeName:{fontSize:12,fontWeight:'900',color:GLASS.white},placeMeta:{fontSize:8,fontWeight:'700',color:GLASS_TEXT.tertiary,marginTop:2},ratingRow:{flexDirection:'row',alignItems:'center',gap:4,marginTop:5},ratingText:{fontSize:9,fontWeight:'900',color:GLASS_TEXT.secondary},removeInline:{width:40,height:78},
  emptySmall:{minHeight:76,alignItems:'center',justifyContent:'center',gap:6},emptyLarge:{minHeight:176,alignItems:'center',justifyContent:'center',gap:9,borderWidth:1,borderStyle:'dashed',borderColor:'rgba(255,255,255,.18)',borderRadius:18,marginTop:12,padding:16},emptyIcon:{width:48,height:48,borderRadius:17,backgroundColor:'rgba(255,255,255,.08)',alignItems:'center',justifyContent:'center'},emptyText:{fontSize:10,fontWeight:'700',color:GLASS_TEXT.tertiary,textAlign:'center'},emptyAction:{minHeight:34,paddingHorizontal:8},emptyActionText:{fontSize:9,fontWeight:'900',marginRight:4},
  syncPanel:{padding:14,flexDirection:'row',alignItems:'center',gap:11,flexWrap:'wrap'},syncIcon:{width:42,height:42,borderRadius:15,backgroundColor:'rgba(115,240,248,.10)',alignItems:'center',justifyContent:'center'},syncTitle:{fontSize:12,fontWeight:'900',color:GLASS.white},syncSub:{fontSize:9,fontWeight:'600',color:GLASS_TEXT.tertiary,lineHeight:14,marginTop:2},syncBtn:{minHeight:40,borderRadius:14,borderWidth:1,paddingHorizontal:12},syncBtnText:{fontSize:10,fontWeight:'900',color:GLASS.white,marginRight:6},
});
