import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';
import { Region, TravelPreferences } from '@/types';

const INTERESTS=['ธรรมชาติ','ทะเล','ภูเขา','วัด','คาเฟ่','อาหาร','ที่พัก'];
const REGIONS:Region[]=['ภาคเหนือ','ภาคอีสาน','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];
const BUDGET:TravelPreferences['budget'][]=['ประหยัด','กลาง','พรีเมียม'];
const STYLE:TravelPreferences['travelStyle'][]=['คนเดียว','คู่','เพื่อน','ครอบครัว'];
export default function Onboarding(){
 const router=useRouter();const {preferences,setPreferences}=useTravelStore();
 const toggleInterest=(x:string)=>setPreferences({interests:preferences.interests.includes(x)?preferences.interests.filter(i=>i!==x):[...preferences.interests,x]});
 const toggleRegion=(x:Region)=>setPreferences({favoriteRegions:preferences.favoriteRegions.includes(x)?preferences.favoriteRegions.filter(i=>i!==x):[...preferences.favoriteRegions,x]});
 const done=()=>{setPreferences({onboardingDone:true});router.replace('/(tabs)')};
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <View style={s.top}><View style={s.logo}><Ionicons name="map" size={27} color="#fff"/></View><Pressable onPress={()=>router.back()}><Ionicons name="close" size={26} color={COLORS.text}/></Pressable></View>
  <Text style={s.kicker}>PERSONALIZE YOUR TRAVEL</Text><Text style={s.title}>ให้เที่ยวไทยรู้จักคุณมากขึ้น</Text><Text style={s.sub}>เลือกสิ่งที่ชอบเพื่อจัดอันดับสถานที่ จังหวัด และไอเดียทริปให้ตรงกับคุณ</Text>
  <Text style={s.section}>คุณชอบเที่ยวแบบไหน?</Text><View style={s.grid}>{INTERESTS.map(x=><Select key={x} label={x} on={preferences.interests.includes(x)} onPress={()=>toggleInterest(x)}/>)}</View>
  <Text style={s.section}>งบต่อทริป</Text><View style={s.row}>{BUDGET.map(x=><Select key={x} label={x} on={preferences.budget===x} onPress={()=>setPreferences({budget:x})}/>)}</View>
  <Text style={s.section}>เดินทางกับใคร</Text><View style={s.grid}>{STYLE.map(x=><Select key={x} label={x} on={preferences.travelStyle===x} onPress={()=>setPreferences({travelStyle:x})}/>)}</View>
  <Text style={s.section}>ภาคที่สนใจ</Text><View style={s.grid}>{REGIONS.map(x=><Select key={x} label={x} on={preferences.favoriteRegions.includes(x)} onPress={()=>toggleRegion(x)}/>)}</View>
  <Pressable style={s.done} onPress={done}><Text style={s.doneText}>บันทึกและเริ่มสำรวจ</Text><Ionicons name="arrow-forward" size={20} color="#fff"/></Pressable><Text style={s.note}>แก้ไขได้ตลอดจากไอคอนโปรไฟล์หน้าแรก</Text>
 </ScrollView></SafeAreaView>
}
function Select({label,on,onPress}:{label:string;on:boolean;onPress:()=>void}){return <Pressable style={[s.select,on&&s.selectOn]} onPress={onPress}><Ionicons name={on?'checkmark-circle':'ellipse-outline'} size={18} color={on?'#fff':COLORS.textMuted}/><Text style={[s.selectText,on&&s.selectTextOn]}>{label}</Text></Pressable>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:COLORS.background},content:{padding:SPACING.lg,paddingBottom:50,gap:12},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},logo:{width:50,height:50,borderRadius:16,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},kicker:{fontSize:11,fontWeight:'900',letterSpacing:1.4,color:COLORS.primary,marginTop:16},title:{fontSize:30,fontWeight:'900',color:COLORS.text,lineHeight:38},sub:{fontSize:15,color:COLORS.textMuted,lineHeight:23},section:{fontSize:16,fontWeight:'900',color:COLORS.text,marginTop:12},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},row:{flexDirection:'row',gap:8},select:{minHeight:44,borderRadius:RADIUS.md,borderWidth:1,borderColor:COLORS.border,backgroundColor:COLORS.surface,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:7},selectOn:{backgroundColor:COLORS.primary,borderColor:COLORS.primary},selectText:{fontWeight:'800',color:COLORS.textMuted},selectTextOn:{color:'#fff'},done:{height:54,borderRadius:RADIUS.md,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,marginTop:20},doneText:{color:'#fff',fontWeight:'900',fontSize:16},note:{textAlign:'center',fontSize:12,color:COLORS.textMuted}});
