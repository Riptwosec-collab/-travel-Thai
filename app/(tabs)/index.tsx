import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PlaceCard from '@/components/PlaceCard';
import { PLACES, PROVINCES } from '@/data/catalog';
import { COLORS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';

export default function Home(){
 const router=useRouter();
 const {width}=useWindowDimensions();
 const wide=width>=1050;
 const tablet=width>=720;
 const {visitedProvinceIds,wishlistProvinceIds,visitedPlaceIds,wishlistPlaceIds,preferences}=useTravelStore();
 const recommended=useMemo(()=>{const favorite=new Set(preferences.interests);return [...PLACES].sort((a,b)=>Number(favorite.has(b.category))-Number(favorite.has(a.category))).slice(0,8)},[preferences.interests]);
 const progress=Math.round(visitedProvinceIds.length/77*100);
 const enter=useRef(new Animated.Value(0)).current;
 const float=useRef(new Animated.Value(0)).current;

 useEffect(()=>{
  Animated.timing(enter,{toValue:1,duration:560,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
  const loop=Animated.loop(Animated.sequence([
   Animated.timing(float,{toValue:1,duration:2400,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
   Animated.timing(float,{toValue:0,duration:2400,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
  ]));
  loop.start();
  return()=>loop.stop();
 },[enter,float]);

 const pageStyle={opacity:enter,transform:[{translateY:enter.interpolate({inputRange:[0,1],outputRange:[14,0]})}]};
 return <SafeAreaView style={s.safe}>
  <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
   <Animated.View style={[s.page,pageStyle]}>
    <View style={s.header}>
     <View style={s.headerCopy}><Text style={s.hello}>สวัสดี นักเดินทาง</Text><Text style={s.sub}>วันนี้อยากไปเที่ยวที่ไหน?</Text></View>
     <MotionPressable style={s.avatar} onPress={()=>router.push('/account')}><Ionicons name="person" size={22} color={COLORS.primary}/></MotionPressable>
    </View>

    <MotionPressable style={s.search} onPress={()=>router.push('/search')}>
     <Ionicons name="search" size={20} color={COLORS.textMuted}/><Text style={s.searchText}>ค้นหาจังหวัด สถานที่ หรือกิจกรรม</Text><View style={s.searchTail}><Ionicons name="options" size={19} color={COLORS.primary}/></View>
    </MotionPressable>

    <View style={[s.heroRow,wide&&s.heroRowWide]}>
     <View style={s.hero}>
      <Animated.View pointerEvents="none" style={[s.heroOrb,{transform:[{translateY:float.interpolate({inputRange:[0,1],outputRange:[0,-8]})}]}]}/>
      <View style={s.heroCopy}>
       <Text style={s.heroEyebrow}>THAILAND PROGRESS</Text>
       <Text style={s.heroTitle}>{visitedProvinceIds.length} / 77 จังหวัด</Text>
       <Text style={s.heroDesc}>ออกไปเก็บความทรงจำให้ครบทุกจังหวัด</Text>
       <View style={s.progressMeta}><Text style={s.progressLabel}>ความคืบหน้าการเดินทาง</Text><Text style={s.progressLabel}>{progress}%</Text></View>
       <View style={s.progress}><Animated.View style={[s.progressFill,{width:`${Math.max(3,progress)}%`}]}/></View>
      </View>
      <View style={s.progressCircle}><Text style={s.progressNum}>{progress}%</Text><Text style={s.progressSmall}>สำรวจแล้ว</Text></View>
     </View>

     <View style={[s.metrics,wide?s.metricsWide:s.metricsRow]}>
      <Metric icon="checkmark-circle" label="ไปแล้ว" value={`${visitedPlaceIds.length} ที่`}/>
      <Metric icon="heart" label="อยากไป" value={`${wishlistPlaceIds.length} ที่`}/>
      <Metric icon="map" label="จังหวัด" value={`${wishlistProvinceIds.length} รอไป`}/>
     </View>
    </View>

    <SectionHeader title="ทางลัด" sub="เข้าถึงงานที่ใช้บ่อยได้เร็วขึ้น"/>
    <View style={[s.quick,tablet&&s.quickTablet]}>
     <Quick icon="map" label="แผนที่ 77 จังหวัด" desc="ดูสถานะทุกจังหวัด" onPress={()=>router.push('/(tabs)/map')}/>
     <Quick icon="calendar" label="วางแผนทริป" desc="สร้างและนำเข้าแผนละเอียด" onPress={()=>router.push('/(tabs)/trips')}/>
     <Quick icon="book" label="บันทึกทริป" desc="รวมความทรงจำการเดินทาง" onPress={()=>router.push('/journal')}/>
     <Quick icon="stats-chart" label="สถิติของฉัน" desc="ดูภาพรวมการเดินทาง" onPress={()=>router.push('/analytics')}/>
    </View>

    <View style={s.rowTitle}><SectionHeader title="แนะนำสำหรับคุณ" sub="คัดจากสไตล์และความสนใจของคุณ"/><MotionPressable style={s.linkBtn} onPress={()=>router.push('/search')}><Text style={s.link}>ดูทั้งหมด</Text><Ionicons name="arrow-forward" size={15} color={COLORS.primary}/></MotionPressable></View>
    <FlatList data={recommended} keyExtractor={x=>x.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recommendedList} renderItem={({item})=><View style={{width:tablet?280:250}}><PlaceCard place={item} compact/></View>}/>

    <View style={s.rowTitle}><SectionHeader title="จังหวัดน่าไปต่อ" sub="เลือกจากภูมิภาคที่คุณสนใจ"/><MotionPressable style={s.linkBtn} onPress={()=>router.push('/(tabs)/map')}><Text style={s.link}>เปิดแผนที่</Text><Ionicons name="map-outline" size={15} color={COLORS.primary}/></MotionPressable></View>
    <View style={[s.provinceGrid,tablet&&s.provinceGridTablet]}>{PROVINCES.filter(p=>preferences.favoriteRegions.includes(p.region)).slice(0,6).map((p,index)=><MotionPressable key={p.id} style={s.province} onPress={()=>router.push({pathname:'/province-detail',params:{id:p.id}})}>
     <View style={s.provinceNo}><Text style={s.provinceNoText}>{String(index+1).padStart(2,'0')}</Text></View>
     <View style={s.provinceCopy}><Text style={s.provinceName}>{p.nameTh}</Text><Text style={s.provinceRegion}>{p.region} · {p.nameEn}</Text></View>
     <Ionicons name="chevron-forward" size={18} color={COLORS.primary}/>
    </MotionPressable>)}</View>

    {!preferences.onboardingDone&&<MotionPressable style={s.personalize} onPress={()=>router.push('/onboarding')}><View style={s.personalizeIcon}><Ionicons name="sparkles" size={22} color={COLORS.rating}/></View><View style={{flex:1}}><Text style={s.personalizeTitle}>ปรับคำแนะนำให้ตรงกับคุณ</Text><Text style={s.personalizeDesc}>เลือกสไตล์เที่ยว งบ และภาคที่ชอบ ใช้เวลาไม่ถึง 1 นาที</Text></View><Ionicons name="arrow-forward" size={20} color={COLORS.primary}/></MotionPressable>}
   </Animated.View>
  </ScrollView>
 </SafeAreaView>
}

function SectionHeader({title,sub}:{title:string;sub:string}){return <View style={s.sectionHead}><Text style={s.section}>{title}</Text><Text style={s.sectionSub}>{sub}</Text></View>}
function Metric({icon,label,value}:{icon:any;label:string;value:string}){return <View style={s.metric}><View style={s.metricIcon}><Ionicons name={icon} size={20} color={COLORS.primary}/></View><View style={{flex:1}}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View></View>}
function Quick({icon,label,desc,onPress}:{icon:any;label:string;desc:string;onPress:()=>void}){return <MotionPressable style={s.quickCard} onPress={onPress}><View style={s.quickIcon}><Ionicons name={icon} size={22} color={COLORS.primary}/></View><View style={{flex:1}}><Text style={s.quickText}>{label}</Text><Text style={s.quickDesc}>{desc}</Text></View><Ionicons name="chevron-forward" size={17} color={COLORS.textMuted}/></MotionPressable>}

function MotionPressable({children,style,onPress}:{children:React.ReactNode;style?:any;onPress:()=>void}){
 const scale=useRef(new Animated.Value(1)).current;
 const lift=useRef(new Animated.Value(0)).current;
 const down=()=>Animated.spring(scale,{toValue:.985,useNativeDriver:true,damping:18,stiffness:260,mass:.4}).start();
 const up=()=>Animated.spring(scale,{toValue:1,useNativeDriver:true,damping:16,stiffness:220,mass:.45}).start();
 const hoverProps=Platform.OS==='web'?({onMouseEnter:()=>Animated.spring(lift,{toValue:1,useNativeDriver:true,damping:18,stiffness:220}).start(),onMouseLeave:()=>Animated.spring(lift,{toValue:0,useNativeDriver:true,damping:18,stiffness:220}).start()} as any):{};
 return <Animated.View {...hoverProps} style={[style,{transform:[{scale},{translateY:lift.interpolate({inputRange:[0,1],outputRange:[0,-3]})}]}]}><Pressable onPress={onPress} onPressIn={down} onPressOut={up} style={s.pressFill}>{children}</Pressable></Animated.View>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:COLORS.background},content:{paddingBottom:120},page:{padding:SPACING.lg,gap:20,maxWidth:1440,width:'100%',alignSelf:'center'},pressFill:{width:'100%',height:'100%',justifyContent:'center'},
 header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:14},headerCopy:{flex:1},hello:{fontSize:30,fontWeight:'900',color:COLORS.text,letterSpacing:-.45},sub:{fontSize:15,color:COLORS.textMuted,marginTop:4},avatar:{width:46,height:46,borderRadius:23,backgroundColor:'#E0F5F6',alignItems:'center',justifyContent:'center'},
 search:{minHeight:56,borderRadius:RADIUS.md,backgroundColor:COLORS.surface,paddingHorizontal:16,borderWidth:1,borderColor:COLORS.border,...SHADOW},searchText:{flex:1,color:COLORS.textMuted,fontSize:14},searchTail:{width:34,height:34,alignItems:'center',justifyContent:'center'},
 heroRow:{gap:12},heroRowWide:{flexDirection:'row',alignItems:'stretch'},hero:{flex:1,minHeight:190,borderRadius:RADIUS.lg,backgroundColor:COLORS.dark,padding:24,flexDirection:'row',alignItems:'center',gap:22,overflow:'hidden'},heroOrb:{position:'absolute',right:-50,top:-80,width:210,height:210,borderRadius:105,backgroundColor:'#24483F',opacity:.45},heroCopy:{flex:1,minWidth:0},heroEyebrow:{fontSize:11,fontWeight:'900',letterSpacing:1.5,color:'#9EDBD1'},heroTitle:{fontSize:34,fontWeight:'900',color:'#fff',marginTop:8,letterSpacing:-.6},heroDesc:{fontSize:13,color:'#C6DAD5',marginTop:6},progressMeta:{flexDirection:'row',justifyContent:'space-between',gap:10,marginTop:18},progressLabel:{fontSize:10,color:'#C6DAD5',fontWeight:'800'},progress:{height:8,borderRadius:9,backgroundColor:'#24483F',overflow:'hidden',marginTop:7},progressFill:{height:'100%',backgroundColor:COLORS.gold},progressCircle:{width:88,height:88,borderRadius:44,borderWidth:7,borderColor:COLORS.gold,alignItems:'center',justifyContent:'center'},progressNum:{color:'#fff',fontWeight:'900',fontSize:18},progressSmall:{color:'#C6DAD5',fontSize:9,marginTop:2},
 metrics:{gap:10},metricsWide:{width:310},metricsRow:{flexDirection:'row',flexWrap:'wrap'},metric:{flex:1,minWidth:130,minHeight:58,borderRadius:RADIUS.md,backgroundColor:COLORS.surface,padding:12,borderWidth:1,borderColor:COLORS.border,flexDirection:'row',alignItems:'center',gap:10,...SHADOW},metricIcon:{width:38,height:38,borderRadius:12,backgroundColor:'#E7F6F6',alignItems:'center',justifyContent:'center'},metricLabel:{fontSize:11,color:COLORS.textMuted},metricValue:{fontSize:17,fontWeight:'900',color:COLORS.text,marginTop:2},
 sectionHead:{flex:1,minWidth:0},section:{fontSize:21,fontWeight:'900',color:COLORS.text,letterSpacing:-.2},sectionSub:{fontSize:11,color:COLORS.textMuted,marginTop:3},quick:{flexDirection:'row',gap:10,flexWrap:'wrap'},quickTablet:{flexWrap:'nowrap'},quickCard:{flex:1,minWidth:220,minHeight:84,backgroundColor:COLORS.surface,padding:13,borderRadius:RADIUS.md,borderWidth:1,borderColor:COLORS.border},quickIcon:{position:'absolute',left:13,top:22,width:40,height:40,borderRadius:12,backgroundColor:'#E7F6F6',alignItems:'center',justifyContent:'center'},quickText:{fontWeight:'900',color:COLORS.text,fontSize:14,marginLeft:52,marginRight:24},quickDesc:{fontSize:10,color:COLORS.textMuted,marginTop:4,lineHeight:15,marginLeft:52,marginRight:24},
 rowTitle:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:12,marginTop:2},linkBtn:{minHeight:36,paddingHorizontal:10},link:{fontWeight:'800',color:COLORS.primary,fontSize:12,marginRight:21},recommendedList:{gap:14,paddingBottom:8,paddingRight:SPACING.lg},
 provinceGrid:{gap:10},provinceGridTablet:{flexDirection:'row',flexWrap:'wrap'},province:{minHeight:72,backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:12,borderWidth:1,borderColor:COLORS.border,flexDirection:'row',alignItems:'center',minWidth:300,flex:1},provinceNo:{width:38,height:38,borderRadius:12,backgroundColor:'#E7F6F6',alignItems:'center',justifyContent:'center'},provinceNoText:{fontWeight:'900',fontSize:10,color:COLORS.primary},provinceCopy:{flex:1,marginLeft:11},provinceName:{fontWeight:'900',color:COLORS.text,fontSize:15},provinceRegion:{color:COLORS.textMuted,fontSize:10,marginTop:3},
 personalize:{backgroundColor:'#FFF8E9',borderRadius:RADIUS.md,padding:15,minHeight:78,borderWidth:1,borderColor:'#F4E0AE'},personalizeIcon:{position:'absolute',left:15,top:18,width:42,height:42,borderRadius:13,alignItems:'center',justifyContent:'center'},personalizeTitle:{fontWeight:'900',color:COLORS.text,marginLeft:54,marginRight:24},personalizeDesc:{fontSize:12,color:COLORS.textMuted,marginTop:3,lineHeight:18,marginLeft:54,marginRight:24},
});