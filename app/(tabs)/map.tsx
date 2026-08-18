import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ThailandMap from '@/components/ThailandMap';
import { PROVINCES } from '@/data/catalog';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';
import { Region } from '@/types';

const REGIONS:(Region|'ทั้งหมด')[]=['ทั้งหมด','ภาคเหนือ','ภาคอีสาน','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];
export default function MapScreen(){
 const router=useRouter();const [q,setQ]=useState('');const {visitedProvinceIds,wishlistProvinceIds}=useTravelStore();const [region,setRegion]=useState<Region|'ทั้งหมด'>('ทั้งหมด');
 const filtered=useMemo(()=>PROVINCES.filter(p=>(region==='ทั้งหมด'||p.region===region)&&(p.nameTh.includes(q)||p.nameEn.toLowerCase().includes(q.toLowerCase()))),[q,region]);
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
  <Text style={s.title}>แผนที่เที่ยวไทย</Text><Text style={s.sub}>แตะจังหวัดบนแผนที่เพื่อดูสถานที่และบันทึกสถานะการเดินทาง</Text>
  <View style={s.stats}><Stat n={visitedProvinceIds.length} label="ไปแล้ว" color={COLORS.visited}/><Stat n={wishlistProvinceIds.length} label="อยากไป" color="#E6B851"/><Stat n={77-visitedProvinceIds.length} label="เหลือ" color={COLORS.primary}/></View>
  <ThailandMap onSelectProvince={(id)=>router.push({pathname:'/province-detail',params:{id}})}/>
  <View style={s.search}><Ionicons name="search" size={19} color={COLORS.textMuted}/><TextInput value={q} onChangeText={setQ} placeholder="ค้นหาจังหวัด" style={s.input}/></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{REGIONS.map(r=><Pressable key={r} onPress={()=>setRegion(r)} style={[s.chip,region===r&&s.chipActive]}><Text style={[s.chipText,region===r&&s.chipTextActive]}>{r}</Text></Pressable>)}</ScrollView>
  <Text style={s.section}>จังหวัดทั้งหมด ({filtered.length})</Text>
  <View style={s.grid}>{filtered.map(p=>{const v=visitedProvinceIds.includes(p.id),w=wishlistProvinceIds.includes(p.id);return <Pressable key={p.id} style={s.province} onPress={()=>router.push({pathname:'/province-detail',params:{id:p.id}})}><View style={[s.status,{backgroundColor:v?COLORS.visited:w?'#E6B851':'#D9E7E8'}]}/><View style={{flex:1}}><Text style={s.pname}>{p.nameTh}</Text><Text style={s.pregion}>{p.region}</Text></View><Ionicons name="chevron-forward" size={18} color={COLORS.textMuted}/></Pressable>})}</View>
 </ScrollView></SafeAreaView>
}
function Stat({n,label,color}:{n:number;label:string;color:string}){return <View style={s.stat}><View style={[s.statDot,{backgroundColor:color}]}/><Text style={s.statN}>{n}</Text><Text style={s.statLabel}>{label}</Text></View>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:COLORS.background},content:{padding:SPACING.lg,paddingBottom:120,gap:14},title:{fontSize:28,fontWeight:'900',color:COLORS.text},sub:{color:COLORS.textMuted,lineHeight:21},stats:{flexDirection:'row',gap:10},stat:{flex:1,backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:12,borderWidth:1,borderColor:COLORS.border},statDot:{width:9,height:9,borderRadius:5},statN:{fontSize:22,fontWeight:'900',color:COLORS.text,marginTop:5},statLabel:{fontSize:12,color:COLORS.textMuted},search:{height:50,borderRadius:RADIUS.md,backgroundColor:COLORS.surface,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:14,borderWidth:1,borderColor:COLORS.border},input:{flex:1,color:COLORS.text},chip:{borderRadius:999,paddingHorizontal:13,paddingVertical:8,backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border},chipActive:{backgroundColor:COLORS.dark,borderColor:COLORS.dark},chipText:{color:COLORS.textMuted,fontWeight:'700'},chipTextActive:{color:'#fff'},section:{fontSize:19,fontWeight:'900',color:COLORS.text,marginTop:3},grid:{gap:8},province:{backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:13,borderWidth:1,borderColor:COLORS.border,flexDirection:'row',alignItems:'center',gap:11},status:{width:10,height:42,borderRadius:9},pname:{fontWeight:'900',fontSize:15,color:COLORS.text},pregion:{fontSize:12,color:COLORS.textMuted,marginTop:2}});
