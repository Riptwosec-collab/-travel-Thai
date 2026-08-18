import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlassCard, GlassCircleButton, GlassPressable } from '@/components/glass';
import { GLASS, GLASS_RADIUS, GLASS_TEXT } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';
import { Region, TravelPreferences } from '@/types';

const INTERESTS=['ธรรมชาติ','ทะเล','ภูเขา','วัด','คาเฟ่','อาหาร','ที่พัก'];
const REGIONS:Region[]=['ภาคเหนือ','ภาคอีสาน','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];
const BUDGET:TravelPreferences['budget'][]=['ประหยัด','กลาง','พรีเมียม'];
const STYLE:TravelPreferences['travelStyle'][]=['คนเดียว','คู่','เพื่อน','ครอบครัว'];

export default function Onboarding(){
 const router=useRouter();
 const {preferences,setPreferences}=useTravelStore();
 const toggleInterest=(x:string)=>setPreferences({interests:preferences.interests.includes(x)?preferences.interests.filter(i=>i!==x):[...preferences.interests,x]});
 const toggleRegion=(x:Region)=>setPreferences({favoriteRegions:preferences.favoriteRegions.includes(x)?preferences.favoriteRegions.filter(i=>i!==x):[...preferences.favoriteRegions,x]});
 const done=()=>{setPreferences({onboardingDone:true});router.replace('/(tabs)')};
 return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
  <View style={s.top}><View style={s.logo}><Ionicons name="map" size={26} color={GLASS.white}/></View><GlassCircleButton icon="close" onPress={()=>router.back()} label="ปิด"/></View>
  <View><Text style={s.kicker}>PERSONALIZE YOUR TRAVEL</Text><Text style={s.title}>ให้เที่ยวไทยรู้จักคุณมากขึ้น</Text><Text style={s.sub}>เลือกสิ่งที่ชอบเพื่อจัดอันดับสถานที่ จังหวัด และไอเดียทริปให้ตรงกับคุณ</Text></View>

  <GlassCard strong style={s.block}><Text style={s.section}>คุณชอบเที่ยวแบบไหน?</Text><View style={s.grid}>{INTERESTS.map(x=><Select key={x} label={x} on={preferences.interests.includes(x)} onPress={()=>toggleInterest(x)}/>)}</View></GlassCard>
  <GlassCard style={s.block}><Text style={s.section}>งบต่อทริป</Text><View style={s.row}>{BUDGET.map(x=><Select key={x} label={x} on={preferences.budget===x} onPress={()=>setPreferences({budget:x})}/>)}</View></GlassCard>
  <GlassCard style={s.block}><Text style={s.section}>เดินทางกับใคร</Text><View style={s.grid}>{STYLE.map(x=><Select key={x} label={x} on={preferences.travelStyle===x} onPress={()=>setPreferences({travelStyle:x})}/>)}</View></GlassCard>
  <GlassCard style={s.block}><Text style={s.section}>ภาคที่สนใจ</Text><View style={s.grid}>{REGIONS.map(x=><Select key={x} label={x} on={preferences.favoriteRegions.includes(x)} onPress={()=>toggleRegion(x)}/>)}</View></GlassCard>

  <GlassPressable style={s.done} onPress={done}><Text style={s.doneText}>บันทึกและเริ่มสำรวจ</Text><Ionicons name="arrow-forward" size={19} color={GLASS.white}/></GlassPressable>
  <Text style={s.note}>แก้ไขได้ตลอดจากไอคอนโปรไฟล์หน้าแรก</Text>
 </ScrollView></SafeAreaView>
}

function Select({label,on,onPress}:{label:string;on:boolean;onPress:()=>void}){
 return <GlassPressable style={[s.select,on&&s.selectOn]} onPress={onPress}><Ionicons name={on?'checkmark-circle':'ellipse-outline'} size={17} color={on?GLASS.white:GLASS_TEXT.secondary}/><Text style={[s.selectText,on&&s.selectTextOn]}>{label}</Text></GlassPressable>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'transparent'},content:{padding:18,paddingBottom:70,gap:13,maxWidth:860,width:'100%',alignSelf:'center'},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},logo:{width:50,height:50,borderRadius:17,backgroundColor:'rgba(40,213,199,.22)',borderWidth:1,borderColor:'rgba(255,255,255,.28)',alignItems:'center',justifyContent:'center'},
 kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:GLASS.gold,marginTop:8},title:{fontSize:30,fontWeight:'900',color:GLASS.white,lineHeight:38,marginTop:2},sub:{fontSize:13,fontWeight:'600',color:GLASS_TEXT.secondary,lineHeight:20,marginTop:3},
 block:{padding:15,gap:11},section:{fontSize:15,fontWeight:'900',color:GLASS.white},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},row:{flexDirection:'row',gap:8,flexWrap:'wrap'},select:{minHeight:42,borderRadius:GLASS_RADIUS.md,borderWidth:1,borderColor:'rgba(255,255,255,.16)',backgroundColor:'rgba(255,255,255,.07)',paddingHorizontal:11},selectOn:{backgroundColor:'rgba(53,223,235,.24)',borderColor:'rgba(255,255,255,.40)'},selectText:{fontSize:10,fontWeight:'800',color:GLASS_TEXT.secondary,marginLeft:6},selectTextOn:{color:GLASS.white},
 done:{minHeight:54,borderRadius:GLASS_RADIUS.md,backgroundColor:'rgba(40,213,199,.28)',borderWidth:1,borderColor:'rgba(40,213,199,.56)'},doneText:{color:GLASS.white,fontWeight:'900',fontSize:14,marginRight:7},note:{textAlign:'center',fontSize:10,fontWeight:'600',color:GLASS_TEXT.tertiary},
});
