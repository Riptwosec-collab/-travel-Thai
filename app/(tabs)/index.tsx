import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PlaceCard from '@/components/PlaceCard';
import { GlassCard, GlassCircleButton, GlassPageEnter, GlassPressable, GlassProgress, GlassScreen, GlassSearch, GlassSection } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';
import { GLASS, GLASS_RADIUS, GLASS_SPACING, glassSurface } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';

export default function Home(){
 const router=useRouter();
 const viewport=useWindowDimensions();
 const width=Platform.OS==='web'?402:viewport.width;
 const wide=width>=1060;
 const tablet=width>=720;
 const {visitedProvinceIds,wishlistProvinceIds,visitedPlaceIds,wishlistPlaceIds,preferences}=useTravelStore();
 const recommended=useMemo(()=>{const favorite=new Set(preferences.interests);return [...PLACES].sort((a,b)=>Number(favorite.has(b.category))-Number(favorite.has(a.category))).slice(0,8)},[preferences.interests]);
 const progress=Math.round(visitedProvinceIds.length/77*100);
 const background=PLACES.find(x=>x.category==='ทะเล')?.image||PLACES[0]?.image||PROVINCES[0].coverImage;
 const favoriteProvinces=PROVINCES.filter(p=>preferences.favoriteRegions.includes(p.region)).slice(0,6);

 return <GlassScreen image={background}>
  <SafeAreaView style={s.safe}>
   <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <View style={[s.page,wide&&s.pageWide]}>
     <GlassPageEnter>
      <View style={s.topBar}>
       <View style={s.brandRow}>
        <View style={[s.brandMark,glassSurface(true)]}><Ionicons name="airplane" size={22} color={GLASS.gold}/></View>
        <View><Text style={s.brand}>เที่ยวไทย</Text><Text style={s.brandEn}>TRAVEL THAI · THAILAND GLASS</Text></View>
       </View>
       <GlassCircleButton icon="notifications-outline" label="การแจ้งเตือน" onPress={()=>router.push('/account')}/>
      </View>
     </GlassPageEnter>

     <GlassPageEnter delay={70}>
      <View style={s.greetingRow}>
       <View style={{flex:1,minWidth:260}}>
        <Text style={s.greetingSmall}>สวัสดีตอนเช้า</Text>
        <Text style={s.greeting}>นักเดินทาง 👋</Text>
        <Text style={s.greetingSub}>พร้อมออกเดินทางไปกับเราแล้วหรือยัง?</Text>
       </View>
      </View>
     </GlassPageEnter>

     <GlassPageEnter delay={120}>
      <GlassSearch placeholder="ค้นหาสถานที่ จังหวัด หรือกิจกรรม" onPress={()=>router.push('/search')}/>
     </GlassPageEnter>

     <View style={[s.heroGrid,wide&&s.heroGridWide]}>
      <GlassPageEnter delay={170} style={{flex:1}}>
       <GlassCard strong style={s.progressHero}>
        <View pointerEvents="none" style={s.heroGlowA}/><View pointerEvents="none" style={s.heroGlowB}/>
        <View style={s.heroMain}>
         <View style={s.heroCopy}>
          <Text style={s.heroEyebrow}>การเดินทางของคุณ · VISITED PROVINCES</Text>
          <View style={s.heroNumberRow}><Counter value={visitedProvinceIds.length}/><Text style={s.heroSlash}> / 77</Text><Text style={s.heroUnit}> จังหวัด</Text></View>
          <Text style={s.heroSub}>{progress}% ของประเทศไทย · เก็บทุกความทรงจำไว้ในแผนที่เดียว</Text>
          <View style={s.progressMeta}><Text style={s.progressMetaText}>TRAVEL PROGRESS</Text><Text style={s.progressMetaText}>{progress}%</Text></View>
          <GlassProgress value={progress}/>
          <GlassPressable style={s.mapCta} onPress={()=>router.push('/(tabs)/map')}>
           <Text style={s.mapCtaText}>ดูแผนที่</Text><Ionicons name="arrow-forward" size={16} color={GLASS.white}/>
          </GlassPressable>
         </View>
         <View style={s.progressRing}><Text style={s.progressRingValue}>{progress}%</Text><Text style={s.progressRingLabel}>สำรวจแล้ว</Text></View>
        </View>
       </GlassCard>
      </GlassPageEnter>

      <GlassPageEnter delay={220} style={[s.statsWrap,wide&&s.statsWrapWide]}>
       <GlassMiniStat icon="checkmark-circle" value={`${visitedPlaceIds.length}`} label="ไปแล้ว" sub="Visited places"/>
       <GlassMiniStat icon="heart" value={`${wishlistPlaceIds.length}`} label="อยากไป" sub="Wishlist"/>
       <GlassMiniStat icon="map" value={`${wishlistProvinceIds.length}`} label="จังหวัดรอไป" sub="Next provinces"/>
      </GlassPageEnter>
     </View>

     <GlassPageEnter delay={260}>
      <GlassSection title="ทางลัด" subtitle="Quick access"/>
      <View style={[s.quickGrid,tablet&&s.quickGridTablet]}>
       <Quick icon="map" label="แผนที่" en="Map" onPress={()=>router.push('/(tabs)/map')}/>
       <Quick icon="briefcase" label="ทริป" en="Trips" onPress={()=>router.push('/(tabs)/trips')}/>
       <Quick icon="journal" label="บันทึก" en="Journal" onPress={()=>router.push('/journal')}/>
       <Quick icon="bar-chart" label="สถิติ" en="Analytics" onPress={()=>router.push('/analytics')}/>
      </View>
     </GlassPageEnter>

     <GlassPageEnter delay={310}>
      <GlassSection title="แนะนำสำหรับคุณ" subtitle="Recommended for you" right={<GlassPressable style={s.textLink} onPress={()=>router.push('/search')}><Text style={s.textLinkText}>ดูทั้งหมด</Text><Ionicons name="chevron-forward" size={15} color={GLASS.white}/></GlassPressable>}/>
      <FlatList data={recommended} keyExtractor={x=>x.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recommended} renderItem={({item})=><View style={{width:tablet?288:250}}><PlaceCard place={item} compact/></View>}/>
     </GlassPageEnter>

     <GlassPageEnter delay={350}>
      <GlassSection title="จังหวัดน่าไปต่อ" subtitle="Next provinces" right={<GlassPressable style={s.textLink} onPress={()=>router.push('/(tabs)/map')}><Text style={s.textLinkText}>เปิดแผนที่</Text><Ionicons name="map-outline" size={15} color={GLASS.white}/></GlassPressable>}/>
      <View style={[s.provinceGrid,tablet&&s.provinceGridTablet]}>{favoriteProvinces.map((p,index)=><GlassPressable key={p.id} style={[s.provinceCard,glassSurface()]} onPress={()=>router.push({pathname:'/province-detail',params:{id:p.id}})}>
       <View style={s.provinceNo}><Text style={s.provinceNoText}>{String(index+1).padStart(2,'0')}</Text></View>
       <View style={{flex:1,minWidth:0}}><Text style={s.provinceName}>{p.nameTh}</Text><Text style={s.provinceMeta}>{p.nameEn} · {p.region}</Text></View>
       <Ionicons name="chevron-forward" size={18} color={GLASS.white}/>
      </GlassPressable>)}</View>
     </GlassPageEnter>

     {!preferences.onboardingDone&&<GlassPageEnter delay={390}><GlassPressable style={[s.personalize,glassSurface(true)]} onPress={()=>router.push('/onboarding')}>
      <View style={s.personalizeIcon}><Ionicons name="sparkles" size={20} color={GLASS.gold}/></View>
      <View style={{flex:1,minWidth:0}}><Text style={s.personalizeTitle}>ปรับคำแนะนำให้ตรงกับคุณ</Text><Text style={s.personalizeText}>เลือกสไตล์เที่ยว งบ และภูมิภาคที่ชอบ</Text></View>
      <Ionicons name="arrow-forward" size={18} color={GLASS.white}/>
     </GlassPressable></GlassPageEnter>}
    </View>
   </ScrollView>
  </SafeAreaView>
 </GlassScreen>
}

function Counter({value}:{value:number}){
 const anim=useRef(new Animated.Value(0)).current;
 const [shown,setShown]=useState(0);
 useEffect(()=>{
  const id=anim.addListener(({value:v})=>setShown(Math.round(v)));
  Animated.timing(anim,{toValue:value,duration:650,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start();
  return()=>anim.removeListener(id);
 },[value,anim]);
 return <Text style={s.heroNumber}>{shown}</Text>;
}

function GlassMiniStat({icon,value,label,sub}:{icon:any;value:string;label:string;sub:string}){
 return <GlassCard style={s.miniStat}><View style={s.miniIcon}><Ionicons name={icon} size={19} color={GLASS.white}/></View><Text style={s.miniValue}>{value}</Text><Text style={s.miniLabel}>{label}</Text><Text style={s.miniSub}>{sub}</Text></GlassCard>
}

function Quick({icon,label,en,onPress}:{icon:any;label:string;en:string;onPress:()=>void}){
 return <GlassPressable style={[s.quick,glassSurface(true)]} onPress={onPress}>
  <View style={s.quickIcon}><Ionicons name={icon} size={25} color={GLASS.white}/></View><Text style={s.quickLabel}>{label}</Text><Text style={s.quickEn}>{en}</Text>
 </GlassPressable>
}

const s=StyleSheet.create({
 safe:{flex:1},content:{paddingBottom:130},page:{width:'100%',maxWidth:1460,alignSelf:'center',paddingHorizontal:18,paddingTop:10,gap:20},pageWide:{paddingHorizontal:34},
 topBar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},brandRow:{flexDirection:'row',alignItems:'center',gap:11},brandMark:{width:48,height:48,borderRadius:17,alignItems:'center',justifyContent:'center',overflow:'hidden'},brand:{fontSize:22,fontWeight:'900',color:GLASS.white,letterSpacing:-.4},brandEn:{fontSize:8,fontWeight:'900',letterSpacing:1.35,color:'rgba(255,255,255,.68)',marginTop:2},
 greetingRow:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:16},greetingSmall:{fontSize:13,fontWeight:'700',color:'rgba(255,255,255,.80)'},greeting:{fontSize:34,fontWeight:'900',color:GLASS.white,letterSpacing:-.7,marginTop:1},greetingSub:{fontSize:13,color:'rgba(255,255,255,.72)',marginTop:4},
 heroGrid:{gap:12},heroGridWide:{flexDirection:'row',alignItems:'stretch'},progressHero:{minHeight:220,padding:22},heroGlowA:{position:'absolute',width:250,height:250,borderRadius:125,right:-80,top:-100,backgroundColor:'rgba(99,232,244,.15)'},heroGlowB:{position:'absolute',width:180,height:180,borderRadius:90,left:-70,bottom:-100,backgroundColor:'rgba(242,211,154,.11)'},heroMain:{flex:1,flexDirection:'row',alignItems:'center',gap:20},heroCopy:{flex:1,minWidth:0},heroEyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:GLASS.gold},heroNumberRow:{flexDirection:'row',alignItems:'baseline',marginTop:8},heroNumber:{fontSize:38,fontWeight:'900',color:GLASS.white,letterSpacing:-1},heroSlash:{fontSize:27,fontWeight:'700',color:'rgba(255,255,255,.85)'},heroUnit:{fontSize:12,fontWeight:'800',color:'rgba(255,255,255,.72)',marginLeft:5},heroSub:{fontSize:11,color:'rgba(255,255,255,.72)',marginTop:5,lineHeight:17},progressMeta:{flexDirection:'row',justifyContent:'space-between',marginTop:18,marginBottom:7},progressMetaText:{fontSize:8,fontWeight:'900',letterSpacing:.8,color:'rgba(255,255,255,.74)'},mapCta:{alignSelf:'flex-start',minHeight:36,borderRadius:GLASS_RADIUS.pill,paddingHorizontal:12,marginTop:14,backgroundColor:'rgba(255,255,255,.14)',borderWidth:1,borderColor:'rgba(255,255,255,.28)'},mapCtaText:{fontSize:10,fontWeight:'900',color:GLASS.white,marginRight:6},progressRing:{width:96,height:96,borderRadius:48,borderWidth:7,borderColor:GLASS.gold,backgroundColor:'rgba(255,255,255,.08)',alignItems:'center',justifyContent:'center'},progressRingValue:{fontSize:20,fontWeight:'900',color:GLASS.white},progressRingLabel:{fontSize:8,fontWeight:'800',color:'rgba(255,255,255,.65)',marginTop:2},
 statsWrap:{flexDirection:'row',gap:10,flexWrap:'wrap'},statsWrapWide:{width:330,flexDirection:'column',flexWrap:'nowrap'},miniStat:{flex:1,minWidth:100,minHeight:66,padding:12},miniIcon:{position:'absolute',right:10,top:10,width:34,height:34,borderRadius:13,backgroundColor:'rgba(255,255,255,.10)',alignItems:'center',justifyContent:'center'},miniValue:{fontSize:22,fontWeight:'900',color:GLASS.white},miniLabel:{fontSize:10,fontWeight:'900',color:'rgba(255,255,255,.82)',marginTop:1},miniSub:{fontSize:8,color:'rgba(255,255,255,.56)',marginTop:2},
 quickGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:10},quickGridTablet:{flexWrap:'nowrap'},quick:{flex:1,minWidth:140,minHeight:92,borderRadius:GLASS_RADIUS.md,flexDirection:'column',padding:12,alignItems:'flex-start'},quickIcon:{width:42,height:42,borderRadius:15,backgroundColor:'rgba(255,255,255,.14)',alignItems:'center',justifyContent:'center'},quickLabel:{fontSize:13,fontWeight:'900',color:GLASS.white,marginTop:8},quickEn:{fontSize:8,fontWeight:'700',color:'rgba(255,255,255,.58)',marginTop:1},
 textLink:{minHeight:34,paddingHorizontal:7},textLinkText:{fontSize:10,fontWeight:'900',color:GLASS.white,marginRight:3},recommended:{gap:14,paddingTop:10,paddingBottom:6,paddingRight:18},
 provinceGrid:{gap:10,marginTop:10},provinceGridTablet:{flexDirection:'row',flexWrap:'wrap'},provinceCard:{flex:1,minWidth:260,minHeight:72,borderRadius:GLASS_RADIUS.md,paddingHorizontal:12,paddingVertical:11},provinceNo:{width:39,height:39,borderRadius:14,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center',marginRight:10},provinceNoText:{fontSize:9,fontWeight:'900',color:GLASS.gold},provinceName:{fontSize:14,fontWeight:'900',color:GLASS.white},provinceMeta:{fontSize:9,color:'rgba(255,255,255,.62)',marginTop:3},
 personalize:{minHeight:78,borderRadius:GLASS_RADIUS.md,padding:13},personalizeIcon:{width:44,height:44,borderRadius:15,backgroundColor:'rgba(242,211,154,.15)',alignItems:'center',justifyContent:'center',marginRight:11},personalizeTitle:{fontSize:13,fontWeight:'900',color:GLASS.white},personalizeText:{fontSize:10,color:'rgba(255,255,255,.65)',marginTop:3},
});
