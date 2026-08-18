import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PlaceCard from '@/components/PlaceCard';
import { GlassCard, GlassCircleButton, GlassPressable, GlassSection } from '@/components/glass';
import { CATEGORIES, PLACES, PROVINCES } from '@/data/catalog';
import { GLASS, GLASS_RADIUS, GLASS_TEXT, glassSurface } from '@/constants/glassTheme';
import { Region } from '@/types';

const REGIONS:(Region|'ทั้งหมด')[]=['ทั้งหมด','ภาคเหนือ','ภาคอีสาน','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];

export default function Search(){
 const router=useRouter();
 const [q,setQ]=useState('');
 const [category,setCategory]=useState('ทั้งหมด');
 const [region,setRegion]=useState<Region|'ทั้งหมด'>('ทั้งหมด');
 const [freeOnly,setFreeOnly]=useState(false);
 const places=useMemo(()=>PLACES.filter(p=>{const prov=PROVINCES.find(x=>x.id===p.provinceId);const text=`${p.name} ${p.province} ${p.tags.join(' ')}`.toLowerCase();return (!q||text.includes(q.toLowerCase()))&&(category==='ทั้งหมด'||p.category===category)&&(region==='ทั้งหมด'||prov?.region===region)&&(!freeOnly||p.ticketPrice.includes('ฟรี'));}),[q,category,region,freeOnly]);
 const provinces=useMemo(()=>PROVINCES.filter(p=>(!q||p.nameTh.includes(q)||p.nameEn.toLowerCase().includes(q.toLowerCase()))&&(region==='ทั้งหมด'||p.region===region)).slice(0,8),[q,region]);

 return <SafeAreaView style={s.safe} edges={['top']}>
  <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
   <View style={s.header}>
    <GlassCircleButton icon="chevron-back" onPress={()=>router.back()} label="กลับ"/>
    <View style={{flex:1,minWidth:0}}><Text style={s.eyebrow}>DISCOVER THAILAND</Text><Text style={s.title}>ค้นหาสถานที่</Text></View>
   </View>

   <GlassCard strong style={s.searchBox}>
    <Ionicons name="search" size={20} color={GLASS.white}/>
    <TextInput autoFocus value={q} onChangeText={setQ} placeholder="ทะเลใกล้กรุงเทพ, วัดเชียงใหม่, ที่เที่ยวฟรี..." placeholderTextColor="rgba(255,255,255,.78)" style={s.input}/>
    {!!q&&<GlassPressable style={s.clear} onPress={()=>setQ('')}><Ionicons name="close-circle" size={20} color={GLASS_TEXT.secondary}/></GlassPressable>}
   </GlassCard>

   <GlassCard style={s.filters}>
    <Text style={s.filterLabel}>ประเภท</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{CATEGORIES.map(x=><Chip key={x} label={x} on={category===x} onPress={()=>setCategory(x)}/>)}</ScrollView>
    <Text style={s.filterLabel}>ภูมิภาค</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{REGIONS.map(x=><Chip key={x} label={x} on={region===x} onPress={()=>setRegion(x)}/>)}</ScrollView>
    <GlassPressable style={[s.free,freeOnly&&s.freeOn]} onPress={()=>setFreeOnly(v=>!v)}><Ionicons name="pricetag" size={16} color={freeOnly?GLASS.white:GLASS.aqua}/><Text style={[s.freeText,freeOnly&&s.freeTextOn]}>เฉพาะที่เที่ยวฟรี</Text></GlassPressable>
   </GlassCard>

   <GlassSection title="จังหวัดที่เกี่ยวข้อง" subtitle={`${provinces.length} จังหวัด`} />
   <View style={s.provinces}>{provinces.map(p=><GlassPressable key={p.id} style={[s.province,glassSurface()]} onPress={()=>router.replace({pathname:'/province-detail',params:{id:p.id}})}><View style={{flex:1,minWidth:0}}><Text style={s.pname}>{p.nameTh}</Text><Text style={s.pregion}>{p.nameEn} · {p.region}</Text></View><Ionicons name="chevron-forward" size={16} color={GLASS_TEXT.tertiary}/></GlassPressable>)}</View>

   <View style={s.resultsHead}><GlassSection title={`สถานที่ (${places.length})`} subtitle="จัดตามความเกี่ยวข้อง" /></View>
   {places.length?<View style={s.placeList}>{places.map(p=><PlaceCard key={p.id} place={p} compact/>)}</View>:<GlassCard style={s.empty}><View style={s.emptyIcon}><Ionicons name="search-outline" size={28} color={GLASS.aqua}/></View><Text style={s.emptyTitle}>ยังไม่พบผลลัพธ์</Text><Text style={s.emptyText}>ลองลดตัวกรองหรือใช้คำค้นอื่น</Text></GlassCard>}
  </ScrollView>
 </SafeAreaView>
}

function Chip({label,on,onPress}:{label:string;on:boolean;onPress:()=>void}){
 return <GlassPressable onPress={onPress} style={[s.chip,on&&s.chipOn]}><Text style={[s.chipText,on&&s.chipTextOn]}>{label}</Text></GlassPressable>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'transparent'},content:{padding:18,paddingBottom:120,gap:15,maxWidth:1260,width:'100%',alignSelf:'center'},
 header:{flexDirection:'row',alignItems:'center',gap:12},eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.25,color:GLASS.gold},title:{fontSize:27,fontWeight:'900',color:GLASS.white,marginTop:2},
 searchBox:{minHeight:58,paddingHorizontal:15,flexDirection:'row',alignItems:'center',gap:9},input:{flex:1,color:GLASS.white,fontSize:13,fontWeight:'600',paddingVertical:0},clear:{width:34,height:34},
 filters:{padding:14,gap:10},filterLabel:{fontSize:11,fontWeight:'900',color:GLASS_TEXT.secondary},chips:{gap:8,paddingRight:8},chip:{minHeight:34,paddingHorizontal:11,borderRadius:999,backgroundColor:'rgba(255,255,255,.08)',borderWidth:1,borderColor:'rgba(255,255,255,.14)'},chipOn:{backgroundColor:'rgba(53,223,235,.24)',borderColor:'rgba(255,255,255,.38)'},chipText:{fontSize:10,fontWeight:'800',color:GLASS_TEXT.tertiary},chipTextOn:{color:GLASS.white},
 free:{alignSelf:'flex-start',minHeight:36,paddingHorizontal:11,borderRadius:999,backgroundColor:'rgba(255,255,255,.07)',borderWidth:1,borderColor:'rgba(255,255,255,.14)'},freeOn:{backgroundColor:'rgba(40,213,199,.24)',borderColor:'rgba(40,213,199,.58)'},freeText:{fontSize:10,fontWeight:'800',color:GLASS_TEXT.secondary,marginLeft:6},freeTextOn:{color:GLASS.white},
 provinces:{flexDirection:'row',flexWrap:'wrap',gap:9},province:{flex:1,minWidth:230,minHeight:64,borderRadius:GLASS_RADIUS.md,paddingHorizontal:12,paddingVertical:10,justifyContent:'flex-start'},pname:{fontSize:13,fontWeight:'900',color:GLASS.white},pregion:{fontSize:8,fontWeight:'700',color:GLASS_TEXT.tertiary,marginTop:3},
 resultsHead:{marginTop:2},placeList:{gap:12},empty:{padding:28,alignItems:'center'},emptyIcon:{width:56,height:56,borderRadius:19,backgroundColor:'rgba(115,240,248,.10)',alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:16,fontWeight:'900',color:GLASS.white,marginTop:10},emptyText:{fontSize:10,fontWeight:'600',color:GLASS_TEXT.tertiary,marginTop:4},
});
