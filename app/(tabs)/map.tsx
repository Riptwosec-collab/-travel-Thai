import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ThailandMap from '@/components/ThailandMap';
import { GlassCard, GlassChip, GlassCircleButton, GlassHeader, GlassPageEnter, GlassPressable, GlassProgress, GlassScreen, GlassSection } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';
import { getProvinceInfo } from '@/data/provinceInfo';
import { GLASS, GLASS_RADIUS, glassSurface } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';
import { Region } from '@/types';

const REGIONS:(Region|'ทั้งหมด')[]=['ทั้งหมด','ภาคเหนือ','ภาคอีสาน','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];

export default function MapScreen(){
 const router=useRouter();
 const {width}=useWindowDimensions();
 const tablet=width>=760;
 const desktop=width>=1120;
 const [q,setQ]=useState('');
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [region,setRegion]=useState<Region|'ทั้งหมด'>('ทั้งหมด');
 const {visitedProvinceIds,wishlistProvinceIds,toggleVisitedProvince,toggleWishlistProvince}=useTravelStore();
 const progress=Math.round(visitedProvinceIds.length/77*100);
 const filtered=useMemo(()=>PROVINCES.filter(p=>(region==='ทั้งหมด'||p.region===region)&&(p.nameTh.includes(q)||p.nameEn.toLowerCase().includes(q.toLowerCase()))),[q,region]);
 const selected=selectedId?PROVINCES.find(p=>p.id===selectedId):undefined;
 const selectedPlaces=selectedId?PLACES.filter(p=>p.provinceId===selectedId):[];
 const selectedInfo=selected?getProvinceInfo(selected.nameTh,selected.region,selected.description,selected.bestMonths):undefined;
 const selectedVisited=!!selectedId&&visitedProvinceIds.includes(selectedId);
 const selectedWish=!!selectedId&&wishlistProvinceIds.includes(selectedId);
 const background=selected?.coverImage||PLACES.find(x=>x.category==='ธรรมชาติ')?.image||PROVINCES[0].coverImage;

 const openFullDetail=()=>{if(!selectedId)return;const id=selectedId;setSelectedId(null);router.push({pathname:'/province-detail',params:{id}})};

 return <GlassScreen image={background}>
  <SafeAreaView style={s.safe}>
   <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <View style={[s.page,desktop&&s.pageDesktop]}>
     <GlassPageEnter>
      <GlassHeader eyebrow="THAILAND MAP · 77 PROVINCES" title="แผนที่ประเทศไทย" subtitle="แตะจังหวัดเพื่อดูสถานะ ไฮไลต์ และวางแผนการเดินทาง" right={<GlassCircleButton icon="layers-outline" label="เลเยอร์แผนที่" onPress={()=>{}}/>}/>
     </GlassPageEnter>

     <GlassPageEnter delay={70}>
      <GlassCard strong style={s.progressCard}>
       <View style={{flex:1,minWidth:220}}><Text style={s.progressEyebrow}>ความคืบหน้าการเดินทาง · TRAVEL PROGRESS</Text><View style={s.progressNumbers}><Text style={s.progressBig}>{visitedProvinceIds.length}</Text><Text style={s.progressSlash}> / 77 จังหวัด</Text></View><Text style={s.progressSub}>{progress}% ของประเทศไทย</Text><View style={{marginTop:13}}><GlassProgress value={progress}/></View></View>
       <View style={s.ring}><Text style={s.ringValue}>{progress}%</Text><Text style={s.ringLabel}>EXPLORED</Text></View>
      </GlassCard>
     </GlassPageEnter>

     <GlassPageEnter delay={120}>
      <GlassCard strong style={s.mapCard}>
       <View style={s.mapHead}><View style={{flex:1,minWidth:180}}><Text style={s.mapTitle}>ประเทศไทย · 77 จังหวัด</Text><Text style={s.mapSub}>Visited / Wishlist / Not visited อัปเดตจาก Store จริง</Text></View><View style={s.legend}><Legend color={GLASS.turquoise} label="ไปแล้ว"/><Legend color={GLASS.goldStrong} label="กำลังจะไป"/><Legend color="rgba(255,255,255,.38)" label="ยังไม่ไป"/></View></View>
       <View style={s.mapInner}><ThailandMap onSelectProvince={setSelectedId}/></View>
       <View style={s.mapControls}><GlassCircleButton icon="locate-outline" size={40} label="ตำแหน่งปัจจุบัน" onPress={()=>{}}/><GlassCircleButton icon="refresh-outline" size={40} label="รีเซ็ตแผนที่" onPress={()=>{}}/><GlassCircleButton icon="options-outline" size={40} label="ตัวกรอง" onPress={()=>{}}/></View>
      </GlassCard>
     </GlassPageEnter>

     <GlassPageEnter delay={170}>
      <GlassCard style={s.toolbar}>
       <View style={s.searchWrap}><Ionicons name="search" size={19} color={GLASS.white}/><TextInput value={q} onChangeText={setQ} placeholder="ค้นหาจังหวัด เช่น ศรีสะเกษ เชียงใหม่ กระบี่" placeholderTextColor="rgba(255,255,255,.70)" style={s.input}/>{!!q&&<Pressable onPress={()=>setQ('')} hitSlop={8}><Ionicons name="close-circle" size={18} color="rgba(255,255,255,.76)"/></Pressable>}</View>
       <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.regionScroll}>{REGIONS.map(r=><GlassChip key={r} label={r} active={region===r} onPress={()=>setRegion(r)}/>)}</ScrollView>
      </GlassCard>
     </GlassPageEnter>

     <GlassPageEnter delay={220}>
      <GlassSection title="จังหวัดทั้งหมด" subtitle={`พบ ${filtered.length} จังหวัด`} />
      <View style={[s.grid,tablet&&s.gridTablet]}>{filtered.map(p=>{
       const v=visitedProvinceIds.includes(p.id),w=wishlistProvinceIds.includes(p.id);const info=getProvinceInfo(p.nameTh,p.region,p.description,p.bestMonths);
       return <GlassPressable key={p.id} style={[s.province,glassSurface()]} onPress={()=>setSelectedId(p.id)}>
        <View style={[s.status,{backgroundColor:v?GLASS.turquoise:w?GLASS.goldStrong:'rgba(255,255,255,.28)'}]}/>
        <View style={{flex:1,minWidth:0}}><View style={s.provinceNameRow}><Text style={s.pname}>{p.nameTh}</Text><Text style={s.pen}>{p.nameEn}</Text></View><Text style={s.pregion}>{p.region} · {info.recommendedDays}</Text><Text numberOfLines={1} style={s.psummary}>{info.highlights.slice(0,2).join(' · ')}</Text></View>
        <Ionicons name="chevron-forward" size={17} color={GLASS.white}/>
       </GlassPressable>;
      })}</View>
     </GlassPageEnter>
    </View>
   </ScrollView>
  </SafeAreaView>

  <Modal transparent visible={!!selected} animationType="fade" onRequestClose={()=>setSelectedId(null)}>
   <View style={s.modalRoot}><Pressable style={s.backdrop} onPress={()=>setSelectedId(null)}/>
    {selected&&selectedInfo&&<View style={[s.sheet,glassSurface(true)]}>
     <View style={s.handle}/>
     <View style={s.hero}><Image source={selected.coverImage} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk"/><View style={s.heroShade}/><GlassCircleButton icon="close" size={40} label="ปิด" onPress={()=>setSelectedId(null)}/><View style={s.heroText}><Text style={s.regionBadge}>{selected.region}</Text><Text style={s.sheetTitle}>{selected.nameTh}</Text><Text style={s.sheetEn}>{selected.nameEn}</Text></View></View>
     <ScrollView contentContainerStyle={s.sheetBody} showsVerticalScrollIndicator={false}>
      <Text style={s.description}>{selectedInfo.shortSummary}</Text>
      <View style={s.metrics}><Metric icon="location" value={`${selectedPlaces.length}`} label="สถานที่"/><Metric icon="time" value={selectedInfo.recommendedDays} label="แนะนำ"/><Metric icon="bookmark" value={selectedVisited?'ไปแล้ว':selectedWish?'อยากไป':'ยังไม่ไป'} label="สถานะ"/></View>
      <Info title="ไฮไลต์" icon="sparkles" items={selectedInfo.highlights.slice(0,4)}/>
      <Info title="เหมาะกับ" icon="compass" items={selectedInfo.bestFor.slice(0,3)}/>
      <GlassCard style={s.season}><Ionicons name="calendar" size={18} color={GLASS.gold}/><View style={{flex:1}}><Text style={s.infoTitle}>ช่วงน่าเที่ยว</Text><Text style={s.infoText}>{selectedInfo.seasonNote}</Text></View></GlassCard>
      <View style={s.actionRow}>
       <GlassPressable style={[s.action,selectedVisited&&s.actionOn]} onPress={()=>selectedId&&toggleVisitedProvince(selectedId)}><Ionicons name={selectedVisited?'checkmark-circle':'checkmark-circle-outline'} size={18} color={GLASS.white}/><Text style={s.actionText}>ไปแล้ว</Text></GlassPressable>
       <GlassPressable style={[s.action,selectedWish&&s.actionWish]} onPress={()=>selectedId&&toggleWishlistProvince(selectedId)}><Ionicons name={selectedWish?'heart':'heart-outline'} size={18} color={GLASS.white}/><Text style={s.actionText}>Wishlist</Text></GlassPressable>
      </View>
      <GlassPressable style={s.planBtn} onPress={()=>{setSelectedId(null);router.push('/(tabs)/trips')}}><Ionicons name="calendar-outline" size={18} color={GLASS.white}/><Text style={s.planText}>วางแผนทริปจังหวัดนี้</Text></GlassPressable>
      <GlassPressable style={s.detailBtn} onPress={openFullDetail}><Text style={s.detailText}>ดูรายละเอียดจังหวัด</Text><Ionicons name="arrow-forward" size={18} color={GLASS.white}/></GlassPressable>
     </ScrollView>
    </View>}
   </View>
  </Modal>
 </GlassScreen>
}

function Legend({color,label}:{color:string;label:string}){return <View style={s.legendItem}><View style={[s.legendDot,{backgroundColor:color}]}/><Text style={s.legendText}>{label}</Text></View>}
function Metric({icon,value,label}:{icon:any;value:string;label:string}){return <GlassCard style={s.metric}><Ionicons name={icon} size={17} color={GLASS.aqua}/><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text></GlassCard>}
function Info({title,icon,items}:{title:string;icon:any;items:string[]}){return <GlassCard style={s.info}><View style={s.infoHead}><Ionicons name={icon} size={18} color={GLASS.gold}/><Text style={s.infoTitle}>{title}</Text></View>{items.map(x=><View key={x} style={s.bullet}><View style={s.bulletDot}/><Text style={s.infoText}>{x}</Text></View>)}</GlassCard>}

const s=StyleSheet.create({
 safe:{flex:1},content:{paddingBottom:130},page:{width:'100%',maxWidth:1460,alignSelf:'center',padding:18,gap:18},pageDesktop:{paddingHorizontal:34},
 progressCard:{minHeight:150,padding:18,flexDirection:'row',alignItems:'center',gap:20},progressEyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.1,color:GLASS.gold},progressNumbers:{flexDirection:'row',alignItems:'baseline',marginTop:7},progressBig:{fontSize:36,fontWeight:'900',color:GLASS.white},progressSlash:{fontSize:15,fontWeight:'800',color:'rgba(255,255,255,.75)'},progressSub:{fontSize:10,color:'rgba(255,255,255,.68)',marginTop:3},ring:{width:88,height:88,borderRadius:44,borderWidth:7,borderColor:GLASS.gold,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.07)'},ringValue:{fontSize:18,fontWeight:'900',color:GLASS.white},ringLabel:{fontSize:7,fontWeight:'900',letterSpacing:.7,color:'rgba(255,255,255,.58)',marginTop:2},
 mapCard:{padding:10,minHeight:540,overflow:'visible'},mapHead:{padding:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'},mapTitle:{fontSize:15,fontWeight:'900',color:GLASS.white},mapSub:{fontSize:9,color:'rgba(255,255,255,.62)',marginTop:3},legend:{flexDirection:'row',gap:10,flexWrap:'wrap'},legendItem:{flexDirection:'row',alignItems:'center',gap:4},legendDot:{width:7,height:7,borderRadius:4},legendText:{fontSize:8,fontWeight:'800',color:'rgba(255,255,255,.72)'},mapInner:{borderRadius:22,overflow:'hidden',backgroundColor:'rgba(255,255,255,.08)'},mapControls:{position:'absolute',right:18,top:92,gap:8},
 toolbar:{padding:10,gap:10},searchWrap:{height:50,borderRadius:18,backgroundColor:'rgba(255,255,255,.10)',borderWidth:1,borderColor:'rgba(255,255,255,.20)',flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:13},input:{flex:1,color:GLASS.white,fontSize:13,paddingVertical:0},regionScroll:{gap:7,paddingRight:5},
 grid:{gap:9,marginTop:10},gridTablet:{flexDirection:'row',flexWrap:'wrap'},province:{flex:1,minWidth:280,minHeight:78,borderRadius:20,paddingHorizontal:11,paddingVertical:10},status:{width:5,height:46,borderRadius:4,marginRight:10},provinceNameRow:{flexDirection:'row',alignItems:'baseline',gap:7},pname:{fontSize:14,fontWeight:'900',color:GLASS.white},pen:{fontSize:8,fontWeight:'700',color:'rgba(255,255,255,.56)'},pregion:{fontSize:9,fontWeight:'800',color:'rgba(255,255,255,.72)',marginTop:3},psummary:{fontSize:9,color:'rgba(255,255,255,.56)',marginTop:3},
 modalRoot:{flex:1,justifyContent:'flex-end',alignItems:'center',padding:12},backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(1,27,35,.58)'},sheet:{width:'100%',maxWidth:720,maxHeight:'92%',borderRadius:30,overflow:'hidden',padding:8},handle:{alignSelf:'center',width:44,height:4,borderRadius:2,backgroundColor:'rgba(255,255,255,.42)',marginVertical:7},hero:{height:220,borderRadius:24,overflow:'hidden',padding:12,alignItems:'flex-end'},heroShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,50,61,.34)',borderBottomWidth:95,borderBottomColor:'rgba(3,44,55,.62)'},heroText:{position:'absolute',left:18,right:18,bottom:18},regionBadge:{alignSelf:'flex-start',fontSize:8,fontWeight:'900',letterSpacing:.8,color:GLASS.gold,backgroundColor:'rgba(1,39,49,.42)',paddingHorizontal:8,paddingVertical:4,borderRadius:999},sheetTitle:{fontSize:28,fontWeight:'900',color:GLASS.white,marginTop:6},sheetEn:{fontSize:10,fontWeight:'800',letterSpacing:1,color:'rgba(255,255,255,.70)',marginTop:1},sheetBody:{padding:10,paddingBottom:24,gap:10},description:{fontSize:12,lineHeight:19,color:'rgba(255,255,255,.82)'},metrics:{flexDirection:'row',gap:8,flexWrap:'wrap'},metric:{flex:1,minWidth:120,padding:11,alignItems:'flex-start'},metricValue:{fontSize:15,fontWeight:'900',color:GLASS.white,marginTop:6},metricLabel:{fontSize:8,color:'rgba(255,255,255,.60)',marginTop:2},info:{padding:12},infoHead:{flexDirection:'row',alignItems:'center',gap:7,marginBottom:7},infoTitle:{fontSize:11,fontWeight:'900',color:GLASS.white},infoText:{fontSize:10,lineHeight:16,color:'rgba(255,255,255,.72)'},bullet:{flexDirection:'row',gap:7,alignItems:'flex-start',marginTop:4},bulletDot:{width:5,height:5,borderRadius:3,backgroundColor:GLASS.aqua,marginTop:5},season:{padding:12,flexDirection:'row',gap:9,alignItems:'flex-start'},actionRow:{flexDirection:'row',gap:8},action:{flex:1,minHeight:46,borderRadius:18,backgroundColor:'rgba(255,255,255,.10)',borderWidth:1,borderColor:'rgba(255,255,255,.22)'},actionOn:{backgroundColor:'rgba(37,213,178,.32)'},actionWish:{backgroundColor:'rgba(242,211,154,.24)'},actionText:{fontSize:10,fontWeight:'900',color:GLASS.white,marginLeft:6},planBtn:{minHeight:48,borderRadius:18,backgroundColor:'rgba(33,213,228,.30)',borderWidth:1,borderColor:'rgba(255,255,255,.28)'},planText:{fontSize:11,fontWeight:'900',color:GLASS.white,marginLeft:7},detailBtn:{minHeight:48,borderRadius:18,backgroundColor:'rgba(255,255,255,.12)',borderWidth:1,borderColor:'rgba(255,255,255,.24)'},detailText:{fontSize:11,fontWeight:'900',color:GLASS.white,marginRight:7},
});
