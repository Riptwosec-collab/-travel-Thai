import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PlaceCard from '@/components/PlaceCard';
import { PLACES, PROVINCES } from '@/data/catalog';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';

export default function Visited(){
 const router=useRouter();const {visitedPlaceIds,visitedProvinceIds,journals}=useTravelStore();const places=PLACES.filter(p=>visitedPlaceIds.includes(p.id));const provinces=PROVINCES.filter(p=>visitedProvinceIds.includes(p.id));const pct=Math.round(visitedProvinceIds.length/77*100);
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <Text style={s.title}>ที่ที่ไปมาแล้ว</Text><Text style={s.sub}>บันทึกความสำเร็จและย้อนดูความทรงจำจากทุกทริป</Text>
  <View style={s.hero}><Text style={s.heroBig}>{visitedProvinceIds.length}<Text style={s.heroSmall}> / 77 จังหวัด</Text></Text><Text style={s.heroLabel}>คุณเที่ยวไทยแล้ว {pct}%</Text><View style={s.bar}><View style={[s.fill,{width:`${Math.max(2,pct)}%`}]}/></View></View>
  <View style={s.stats}><Box icon="location" n={places.length} label="สถานที่"/><Box icon="map" n={provinces.length} label="จังหวัด"/><Box icon="book" n={journals.length} label="บันทึก"/></View>
  <View style={s.row}><Text style={s.section}>จังหวัดที่ไปแล้ว</Text><Pressable onPress={()=>router.push('/(tabs)/map')}><Text style={s.link}>เพิ่มจังหวัด</Text></Pressable></View>
  {provinces.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10}}>{provinces.map(p=><Pressable key={p.id} style={s.pill} onPress={()=>router.push({pathname:'/province-detail',params:{id:p.id}})}><Ionicons name="checkmark-circle" color={COLORS.visited} size={16}/><Text style={s.pillText}>{p.nameTh}</Text></Pressable>)}</ScrollView>:<Empty text="ยังไม่มีจังหวัดที่ทำเครื่องหมายว่าไปแล้ว" action="เปิดแผนที่" onPress={()=>router.push('/(tabs)/map')}/>} 
  <Text style={s.section}>สถานที่ที่ไปแล้ว</Text>
  {places.length?<View style={s.list}>{places.map(p=><PlaceCard key={p.id} place={p} compact/>)}</View>:<Empty text="เมื่อกด “ไปแล้ว” ในหน้าสถานที่ รายการจะมาอยู่ที่นี่" action="ค้นหาที่เที่ยว" onPress={()=>router.push('/search')}/>} 
 </ScrollView></SafeAreaView>
}
function Box({icon,n,label}:{icon:any;n:number;label:string}){return <View style={s.box}><Ionicons name={icon} size={19} color={COLORS.primary}/><Text style={s.boxN}>{n}</Text><Text style={s.boxLabel}>{label}</Text></View>}
function Empty({text,action,onPress}:{text:string;action:string;onPress:()=>void}){return <View style={s.empty}><Ionicons name="sparkles-outline" size={28} color={COLORS.primary}/><Text style={s.emptyText}>{text}</Text><Pressable style={s.emptyBtn} onPress={onPress}><Text style={s.emptyBtnText}>{action}</Text></Pressable></View>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:COLORS.background},content:{padding:SPACING.lg,paddingBottom:120,gap:14},title:{fontSize:28,fontWeight:'900',color:COLORS.text},sub:{color:COLORS.textMuted},hero:{backgroundColor:COLORS.dark,borderRadius:RADIUS.lg,padding:22},heroBig:{fontSize:38,fontWeight:'900',color:'#fff'},heroSmall:{fontSize:20,color:'#C4D9D4'},heroLabel:{color:'#C4D9D4',marginTop:4},bar:{height:8,borderRadius:9,backgroundColor:'#24483F',overflow:'hidden',marginTop:16},fill:{height:'100%',backgroundColor:COLORS.gold},stats:{flexDirection:'row',gap:10},box:{flex:1,backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:13,borderWidth:1,borderColor:COLORS.border},boxN:{fontSize:22,fontWeight:'900',color:COLORS.text,marginTop:4},boxLabel:{fontSize:12,color:COLORS.textMuted},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},section:{fontSize:19,fontWeight:'900',color:COLORS.text},link:{color:COLORS.primary,fontWeight:'800'},pill:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border,paddingHorizontal:12,paddingVertical:9,borderRadius:999},pillText:{fontWeight:'800',color:COLORS.text},list:{gap:12},empty:{backgroundColor:COLORS.surface,borderRadius:RADIUS.md,borderWidth:1,borderColor:COLORS.border,padding:22,alignItems:'center',gap:10},emptyText:{color:COLORS.textMuted,textAlign:'center'},emptyBtn:{backgroundColor:COLORS.primary,paddingHorizontal:14,paddingVertical:9,borderRadius:999},emptyBtnText:{color:'#fff',fontWeight:'800'}});
