import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlaceCard from '@/components/PlaceCard';
import { PLACES, PROVINCES } from '@/data/catalog';
import { getProvinceInfo } from '@/data/provinceInfo';
import { GLASS, GLASS_RADIUS, glassSurface } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';
import { GlassCard, GlassCircleButton, GlassPageEnter, GlassPressable, GlassScreen, GlassSection } from '@/components/glass';

const TABS=['แนะนำ','ที่เที่ยว','ที่พัก','ร้านอาหาร','กิจกรรม'] as const;
type Tab=typeof TABS[number];

export default function ProvinceDetail(){
 const {id}=useLocalSearchParams<{id:string}>();
 const router=useRouter();
 const {width}=useWindowDimensions();
 const wide=width>=920;
 const p=PROVINCES.find(x=>x.id===id);
 const {visitedProvinceIds,wishlistProvinceIds,toggleVisitedProvince,toggleWishlistProvince}=useTravelStore();
 const [tab,setTab]=useState<Tab>('แนะนำ');
 if(!p)return <SafeAreaView style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text>ไม่พบจังหวัด</Text></SafeAreaView>;
 const visited=visitedProvinceIds.includes(p.id),wish=wishlistProvinceIds.includes(p.id);
 const places=PLACES.filter(x=>x.provinceId===p.id);
 const info=getProvinceInfo(p.nameTh,p.region,p.description,p.bestMonths);
 const filtered=useMemo(()=>{
  if(tab==='ที่พัก')return places.filter(x=>x.category==='ที่พัก');
  if(tab==='ร้านอาหาร')return places.filter(x=>x.category==='อาหาร'||x.category==='คาเฟ่');
  if(tab==='กิจกรรม')return places.filter(x=>!['ที่พัก','อาหาร','คาเฟ่'].includes(x.category));
  return places;
 },[places,tab]);

 return <GlassScreen image={p.coverImage}>
  <SafeAreaView style={s.safe} edges={['top','bottom']}>
   <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
    <View style={[s.page,wide&&s.pageWide]}>
     <GlassPageEnter>
      <View style={s.hero}>
       <Image source={p.coverImage} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={300}/>
       <View style={s.heroTint}/><View style={s.heroBottom}/>
       <View style={s.heroTop}><GlassCircleButton icon="chevron-back" label="ย้อนกลับ" onPress={()=>router.back()}/><View style={{flex:1}}/><GlassCircleButton icon={wish?'heart':'heart-outline'} active={wish} label="Wishlist" onPress={()=>toggleWishlistProvince(p.id)}/></View>
       <View style={s.heroText}><Text style={s.region}>{p.region}</Text><Text style={s.title}>{p.nameTh}</Text><Text style={s.en}>{p.nameEn.toUpperCase()}</Text><Text style={s.tagline}>{info.highlights.slice(0,2).join(' · ')}</Text></View>
      </View>
     </GlassPageEnter>

     <GlassPageEnter delay={70}>
      <View style={s.metrics}>
       <Metric icon="checkmark-circle" value={visited?'บันทึกแล้ว':'ยังไม่ไป'} label="สถานะจังหวัด"/>
       <Metric icon="location" value={`${places.length}`} label="สถานที่ในระบบ"/>
       <Metric icon="time" value={info.recommendedDays} label="ระยะเวลาที่แนะนำ"/>
       <Metric icon="calendar" value={p.bestMonths.slice(0,3).join(' ')} label="ช่วงแนะนำ"/>
      </View>
     </GlassPageEnter>

     <GlassPageEnter delay={110}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{TABS.map(x=><GlassPressable key={x} onPress={()=>setTab(x)} style={[s.tab,tab===x&&s.tabActive]}><Text style={[s.tabText,tab===x&&s.tabTextActive]}>{x}</Text></GlassPressable>)}</ScrollView>
     </GlassPageEnter>

     {tab==='แนะนำ'?<>
      <GlassPageEnter delay={150}><GlassCard strong style={s.intro}><Text style={s.eyebrow}>ภาพรวมจังหวัด</Text><Text style={s.introText}>{info.fullDescription}</Text></GlassCard></GlassPageEnter>
      <View style={[s.twoCol,wide&&s.twoColWide]}>
       <View style={s.col}>
        <GlassPageEnter delay={190}><Section title="ไฮไลต์ที่ควรรู้" icon="sparkles"><View style={s.chipGrid}>{info.highlights.map(x=><InfoChip key={x} icon="location-outline" text={x}/>)}</View></Section></GlassPageEnter>
        <GlassPageEnter delay={230}><Section title="เหมาะกับทริปแบบไหน" icon="compass"><View style={s.chipGrid}>{info.bestFor.map(x=><InfoChip key={x} icon="checkmark-circle-outline" text={x}/>)}</View></Section></GlassPageEnter>
        <GlassPageEnter delay={270}><Section title="คำแนะนำก่อนเดินทาง" icon="information-circle"><BulletList items={info.travelTips}/></Section></GlassPageEnter>
       </View>
       <View style={[s.col,wide&&s.side]}>
        <GlassPageEnter delay={210}><GlassCard style={s.note}><Ionicons name="calendar" size={18} color={GLASS.gold}/><View style={{flex:1}}><Text style={s.blockTitle}>ช่วงเวลาและฤดูกาล</Text><Text style={s.blockText}>{info.seasonNote}</Text></View></GlassCard></GlassPageEnter>
        <GlassPageEnter delay={250}><Section title="การเดินทางในจังหวัด" icon="car-sport"><BulletList items={info.transportTips}/></Section></GlassPageEnter>
        <GlassPageEnter delay={290}><GlassCard style={s.food}><Text style={s.blockTitle}>ของกินและของฝาก</Text><View style={s.foodTags}>{info.localFoods.map(x=><View key={x} style={s.foodTag}><Text style={s.foodText}>{x}</Text></View>)}</View></GlassCard></GlassPageEnter>
       </View>
      </View>
     </>:<GlassPageEnter delay={150}>
      <GlassSection title={tab} subtitle={`${filtered.length} รายการจากข้อมูลที่มีในระบบ`}/>
      {filtered.length?<View style={[s.placeGrid,wide&&s.placeGridWide]}>{filtered.map(x=><View key={x.id} style={s.placeItem}><PlaceCard place={x} compact/></View>)}</View>:<GlassCard style={s.empty}><Ionicons name="hourglass-outline" size={24} color={GLASS.aqua}/><Text style={s.emptyTitle}>ยังไม่มีข้อมูลหมวดนี้ในจังหวัด {p.nameTh}</Text><Text style={s.emptyText}>โครงสร้างหน้ารองรับแล้ว และจะใช้ข้อมูลเดิมทันทีเมื่อ Dataset มีรายการหมวดนี้</Text></GlassCard>}
     </GlassPageEnter>}

     <GlassPageEnter delay={330}><GlassSection title={`สถานที่แนะนำใน ${p.nameTh}`} subtitle="Recommended places"/>{places.length?<View style={[s.placeGrid,wide&&s.placeGridWide]}>{places.slice(0,6).map(x=><View key={x.id} style={s.placeItem}><PlaceCard place={x} compact/></View>)}</View>:<GlassCard style={s.empty}><Text style={s.emptyTitle}>กำลังเพิ่มสถานที่แบบละเอียด</Text><Text style={s.emptyText}>ข้อมูลจังหวัดพร้อมใช้งานแล้ว ส่วนสถานที่จะเพิ่มตาม Dataset</Text></GlassCard>}</GlassPageEnter>

     <GlassPageEnter delay={370}><GlassPressable style={[s.plan,glassSurface(true)]} onPress={()=>router.push('/(tabs)/trips')}><Ionicons name="calendar" size={19} color={GLASS.white}/><Text style={s.planText}>วางแผนทริปไป {p.nameTh}</Text><Ionicons name="arrow-forward" size={17} color={GLASS.white}/></GlassPressable></GlassPageEnter>
    </View>
   </ScrollView>

   <View style={[s.bottom,glassSurface(true)]}>
    <GlassPressable style={[s.action,visited&&s.visited]} onPress={()=>toggleVisitedProvince(p.id)}><Ionicons name={visited?'checkmark-circle':'checkmark-circle-outline'} size={18} color={GLASS.white}/><Text style={s.actionText}>{visited?'ไปแล้ว':'ทำเครื่องหมายว่าไปแล้ว'}</Text></GlassPressable>
    <GlassPressable style={[s.action,wish&&s.wish]} onPress={()=>toggleWishlistProvince(p.id)}><Ionicons name={wish?'heart':'heart-outline'} size={18} color={GLASS.white}/><Text style={s.actionText}>{wish?'อยู่ใน Wishlist':'อยากไป'}</Text></GlassPressable>
   </View>
  </SafeAreaView>
 </GlassScreen>
}

function Metric({icon,value,label}:{icon:any;value:any;label:string}){return <GlassCard style={s.metric}><Ionicons name={icon} size={19} color={GLASS.aqua}/><Text style={s.metricValue}>{value||'-'}</Text><Text style={s.metricLabel}>{label}</Text></GlassCard>}
function Section({title,icon,children}:{title:string;icon:any;children:React.ReactNode}){return <View style={s.sectionWrap}><View style={s.sectionHead}><Ionicons name={icon} size={18} color={GLASS.gold}/><Text style={s.section}>{title}</Text></View>{children}</View>}
function InfoChip({icon,text}:{icon:any;text:string}){return <GlassCard style={s.highlight}><Ionicons name={icon} size={17} color={GLASS.aqua}/><Text style={s.highlightText}>{text}</Text></GlassCard>}
function BulletList({items}:{items:string[]}){return <GlassCard style={s.bulletCard}>{items.map(x=><View key={x} style={s.bulletRow}><View style={s.bulletDot}/><Text style={s.bulletText}>{x}</Text></View>)}</GlassCard>}

const s=StyleSheet.create({
 safe:{flex:1},scroll:{paddingBottom:130},page:{width:'100%',maxWidth:1360,alignSelf:'center',padding:14,gap:18},pageWide:{paddingHorizontal:28},
 hero:{height:360,borderRadius:32,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,.30)',shadowColor:'#034B5A',shadowOpacity:.25,shadowRadius:28,elevation:10},heroTint:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(4,56,68,.17)'},heroBottom:{position:'absolute',left:0,right:0,bottom:0,height:165,backgroundColor:'rgba(3,45,56,.62)'},heroTop:{position:'absolute',top:14,left:14,right:14,flexDirection:'row',gap:8},heroText:{position:'absolute',left:20,right:20,bottom:20},region:{alignSelf:'flex-start',fontSize:9,fontWeight:'900',letterSpacing:.8,color:GLASS.gold,backgroundColor:'rgba(4,45,55,.42)',borderWidth:1,borderColor:'rgba(255,255,255,.20)',paddingHorizontal:9,paddingVertical:5,borderRadius:999},title:{fontSize:36,fontWeight:'900',color:GLASS.white,letterSpacing:-.7,marginTop:7},en:{fontSize:9,fontWeight:'900',letterSpacing:1.3,color:'rgba(255,255,255,.68)',marginTop:2},tagline:{fontSize:11,color:'rgba(255,255,255,.76)',marginTop:7},
 metrics:{flexDirection:'row',gap:9,flexWrap:'wrap'},metric:{flex:1,minWidth:145,padding:12},metricValue:{fontSize:13,fontWeight:'900',color:GLASS.white,marginTop:7},metricLabel:{fontSize:8,color:'rgba(255,255,255,.58)',marginTop:2},
 tabs:{gap:7,paddingBottom:3},tab:{minHeight:38,borderRadius:999,paddingHorizontal:13,backgroundColor:'rgba(255,255,255,.09)',borderWidth:1,borderColor:'rgba(255,255,255,.18)'},tabActive:{backgroundColor:'rgba(99,232,244,.28)',borderColor:'rgba(255,255,255,.42)'},tabText:{fontSize:9,fontWeight:'900',color:'rgba(255,255,255,.66)'},tabTextActive:{color:GLASS.white},
 intro:{padding:17},eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:.8,color:GLASS.gold},introText:{fontSize:13,lineHeight:22,color:'rgba(255,255,255,.82)',marginTop:8},twoCol:{gap:16},twoColWide:{flexDirection:'row',alignItems:'flex-start'},col:{flex:1,gap:16},side:{maxWidth:410},sectionWrap:{gap:9},sectionHead:{flexDirection:'row',alignItems:'center',gap:7},section:{fontSize:17,fontWeight:'900',color:GLASS.white},chipGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},highlight:{width:'48%',minWidth:170,padding:12,flexDirection:'row',alignItems:'center',gap:8},highlightText:{flex:1,fontSize:10,fontWeight:'800',color:'rgba(255,255,255,.80)'},note:{padding:13,flexDirection:'row',gap:9,alignItems:'flex-start'},blockTitle:{fontSize:11,fontWeight:'900',color:GLASS.white},blockText:{fontSize:10,lineHeight:16,color:'rgba(255,255,255,.70)',marginTop:3},bulletCard:{padding:13,gap:8},bulletRow:{flexDirection:'row',alignItems:'flex-start',gap:8},bulletDot:{width:5,height:5,borderRadius:3,backgroundColor:GLASS.aqua,marginTop:6},bulletText:{flex:1,fontSize:10,lineHeight:16,color:'rgba(255,255,255,.70)'},food:{padding:13},foodTags:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:9},foodTag:{backgroundColor:'rgba(242,211,154,.14)',borderWidth:1,borderColor:'rgba(242,211,154,.22)',borderRadius:999,paddingHorizontal:9,paddingVertical:6},foodText:{fontSize:9,fontWeight:'800',color:GLASS.gold},
 placeGrid:{gap:10,marginTop:9},placeGridWide:{flexDirection:'row',flexWrap:'wrap'},placeItem:{flex:1,minWidth:280},empty:{padding:18,marginTop:9,alignItems:'flex-start'},emptyTitle:{fontSize:12,fontWeight:'900',color:GLASS.white,marginTop:7},emptyText:{fontSize:9,lineHeight:15,color:'rgba(255,255,255,.62)',marginTop:4},plan:{minHeight:52,borderRadius:20,paddingHorizontal:14},planText:{flex:1,fontSize:11,fontWeight:'900',color:GLASS.white,marginLeft:8},
 bottom:{position:'absolute',left:10,right:10,bottom:10,minHeight:66,borderRadius:24,padding:8,flexDirection:'row',gap:7},action:{flex:1,minHeight:48,borderRadius:17,backgroundColor:'rgba(255,255,255,.09)',borderWidth:1,borderColor:'rgba(255,255,255,.18)'},visited:{backgroundColor:'rgba(37,213,178,.28)'},wish:{backgroundColor:'rgba(242,211,154,.20)'},actionText:{fontSize:9,fontWeight:'900',color:GLASS.white,marginLeft:6},
});
