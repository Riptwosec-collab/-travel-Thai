import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlassCard, GlassCircleButton, GlassPressable } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';
import { GLASS, GLASS_TEXT } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';

const HISTORY_KEY='travel-search-history-v1';
const normalize=(v:string)=>v.toLowerCase().trim();
const has=(text:string,q:string)=>normalize(text).includes(q);
const dateKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const tomorrow=()=>{const d=new Date();d.setDate(d.getDate()+1);return dateKey(d)};
const QUICK=['ทริปวันนี้','ทริปพรุ่งนี้','ที่เที่ยวฟรี','ไปแล้ว','Wishlist','วัด','คาเฟ่'];

export default function Search(){
  const router=useRouter();
  const {trips,journals,visitedPlaceIds,wishlistPlaceIds}=useTravelStore();
  const [q,setQ]=useState('');const [history,setHistory]=useState<string[]>([]);
  useEffect(()=>{AsyncStorage.getItem(HISTORY_KEY).then(v=>{try{if(v)setHistory(JSON.parse(v))}catch{}})},[]);
  const remember=(value=q)=>{const text=value.trim();if(!text)return;const next=[text,...history.filter(x=>x!==text)].slice(0,6);setHistory(next);AsyncStorage.setItem(HISTORY_KEY,JSON.stringify(next)).catch(()=>{})};
  const raw=normalize(q);const command=raw.startsWith('ทริป')?'trip':raw.includes('ฟรี')?'free':raw==='ไปแล้ว'?'visited':raw==='wishlist'||raw.includes('อยากไป')?'wishlist':'all';
  const stripped=normalize(q.replace(/^ทริป\s*/,'').replace(/ที่เที่ยวฟรี|ฟรี/g,'').replace(/wishlist|อยากไป|ไปแล้ว/ig,'').trim());
  const targetDate=raw.includes('พรุ่งนี้')?tomorrow():raw.includes('วันนี้')?dateKey(new Date()):'';

  const result=useMemo(()=>{
    const provinces=command==='trip'||command==='visited'||command==='wishlist'?[]:PROVINCES.filter(p=>!stripped||has(`${p.nameTh} ${p.nameEn} ${p.region} ${p.description}`,stripped)).slice(0,8);
    const places=command==='trip'?[]:PLACES.filter(p=>{
      if(command==='free'&&!p.ticketPrice.includes('ฟรี'))return false;
      if(command==='visited'&&!visitedPlaceIds.includes(p.id))return false;
      if(command==='wishlist'&&!wishlistPlaceIds.includes(p.id))return false;
      return !stripped||has(`${p.name} ${p.province} ${p.category} ${p.tags.join(' ')} ${p.description}`,stripped);
    }).slice(0,14);
    const tripResults=command==='free'||command==='visited'||command==='wishlist'?[]:trips.filter(t=>{
      if(targetDate&&t.startDate!==targetDate&&t.endDate!==targetDate&&!(t.days||[]).some(d=>d.date===targetDate))return false;
      const text=`${t.title} ${t.origin||''} ${t.destinationSummary||''} ${t.routeText||''} ${(t.routeStops||[]).join(' ')} ${(t.attractionsSummary||[]).join(' ')} ${(t.days||[]).flatMap(d=>(d.schedule||[]).map(x=>x.title)).join(' ')}`;
      const query=stripped.replace(/วันนี้|พรุ่งนี้/g,'').trim();return !query||has(text,query);
    }).slice(0,10);
    const journalResults=command!=='all'?[]:journals.filter(j=>!stripped||has(`${j.title} ${j.note} ${j.mood}`,stripped)).slice(0,8);
    return {provinces,places,trips:tripResults,journals:journalResults};
  },[stripped,command,targetDate,trips,journals,visitedPlaceIds,wishlistPlaceIds]);
  const total=result.provinces.length+result.places.length+result.trips.length+result.journals.length;

  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <View style={s.header}><GlassCircleButton icon="chevron-back" onPress={()=>router.back()} label="กลับ"/><View style={s.flex}><Text style={s.eyebrow}>COMMAND SEARCH</Text><Text style={s.title}>ค้นหา + สั่งงาน</Text><Text style={s.subtitle}>จังหวัด · สถานที่ · ทริป · Journal · คำสั่งลัด</Text></View></View>
    <GlassCard strong style={s.searchBox}><Ionicons name="search" size={20} color={GLASS.white}/><TextInput autoFocus value={q} onChangeText={setQ} onSubmitEditing={()=>remember()} placeholder="เช่น ทริปพรุ่งนี้, ที่เที่ยวฟรี, วัด, ราชบุรี..." placeholderTextColor="rgba(255,255,255,.72)" style={s.input}/>{!!q&&<GlassPressable style={s.clear} onPress={()=>setQ('')}><Ionicons name="close" size={19} color={GLASS_TEXT.secondary}/></GlassPressable>}</GlassCard>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickScroll}>{QUICK.map(x=><Pressable key={x} style={[s.quickChip,q===x&&s.quickChipOn]} onPress={()=>{setQ(x);remember(x)}}><Text style={[s.quickText,q===x&&s.quickTextOn]}>{x}</Text></Pressable>)}</ScrollView>
    {!q&&!!history.length&&<GlassCard style={s.history}><View style={s.sectionHead}><Text style={s.sectionTitle}>ค้นหาล่าสุด</Text><Pressable onPress={()=>{setHistory([]);AsyncStorage.removeItem(HISTORY_KEY)}}><Text style={s.clearHistory}>ล้าง</Text></Pressable></View><View style={s.historyWrap}>{history.map(x=><Pressable key={x} style={s.historyChip} onPress={()=>setQ(x)}><Ionicons name="time-outline" size={13} color={GLASS_TEXT.tertiary}/><Text style={s.historyText}>{x}</Text></Pressable>)}</View></GlassCard>}

    <View style={s.summaryRow}><Text style={s.summaryLabel}>{q?command==='trip'?'คำสั่ง: ค้นทริป':command==='free'?'คำสั่ง: ที่เที่ยวฟรี':command==='visited'?'คำสั่ง: สถานที่ไปแล้ว':command==='wishlist'?'คำสั่ง: Wishlist':'ผลการค้นหาทั้งระบบ':'ข้อมูลในแอป'}</Text><Text style={s.summaryCount}>{total} รายการ</Text></View>
    <ResultSection icon="map-outline" title="จังหวัด" count={result.provinces.length}>{result.provinces.map(p=><Pressable key={p.id} style={s.resultRow} onPress={()=>{remember();router.push({pathname:'/province-detail',params:{id:p.id}})}}><ResultIcon name="location-outline"/><View style={s.flex}><Text style={s.resultTitle}>{p.nameTh}</Text><Text style={s.resultMeta}>{p.nameEn} · {p.region}</Text></View><Arrow/></Pressable>)}</ResultSection>
    <ResultSection icon="compass-outline" title="สถานที่" count={result.places.length}>{result.places.map(p=><Pressable key={p.id} style={s.resultRow} onPress={()=>{remember();router.push({pathname:'/place-detail',params:{id:p.id}})}}><ResultIcon name="pin-outline"/><View style={s.flex}><Text style={s.resultTitle}>{p.name}</Text><Text style={s.resultMeta}>{p.province} · {p.category} · {p.ticketPrice}</Text></View><Arrow/></Pressable>)}</ResultSection>
    <ResultSection icon="briefcase-outline" title="ทริปของฉัน" count={result.trips.length}>{result.trips.map(t=><Pressable key={t.id} style={s.resultRow} onPress={()=>{remember();router.push('/trips')}}><ResultIcon name="calendar-outline"/><View style={s.flex}><Text style={s.resultTitle}>{t.title}</Text><Text style={s.resultMeta}>{t.startDate} → {t.endDate} · {t.days?.length||0} วัน · {(t.budget||0).toLocaleString()}฿</Text>{!!t.routeText&&<Text numberOfLines={1} style={s.resultSub}>{t.routeText}</Text>}</View><Arrow/></Pressable>)}</ResultSection>
    <ResultSection icon="book-outline" title="Journal" count={result.journals.length}>{result.journals.map(j=><Pressable key={j.id} style={s.resultRow} onPress={()=>{remember();router.push('/journal')}}><ResultIcon name="document-text-outline"/><View style={s.flex}><Text style={s.resultTitle}>{j.title}</Text><Text style={s.resultMeta}>{j.date} · {j.mood||'บันทึกการเดินทาง'}</Text>{!!j.note&&<Text numberOfLines={2} style={s.resultSub}>{j.note}</Text>}</View><Arrow/></Pressable>)}</ResultSection>
    {!!q&&total===0&&<GlassCard style={s.empty}><Ionicons name="search-outline" size={28} color={GLASS.aqua}/><Text style={s.emptyTitle}>ไม่พบ “{q}”</Text><Text style={s.emptyText}>ลอง “ทริปพรุ่งนี้”, “ที่เที่ยวฟรี”, “ไปแล้ว”, “Wishlist” หรือชื่อสถานที่</Text></GlassCard>}
  </ScrollView></SafeAreaView>
}
function ResultSection({icon,title,count,children}:{icon:string;title:string;count:number;children:React.ReactNode}){if(!count)return null;return <GlassCard style={s.section}><View style={s.sectionHead}><View style={s.sectionIcon}><Ionicons name={icon as any} size={17} color={GLASS.aqua}/></View><Text style={s.sectionTitle}>{title}</Text><View style={s.countPill}><Text style={s.countText}>{count}</Text></View></View><View style={s.rows}>{children}</View></GlassCard>}
function ResultIcon({name}:{name:string}){return <View style={s.resultIcon}><Ionicons name={name as any} size={18} color={GLASS.aqua}/></View>}
function Arrow(){return <Ionicons name="chevron-forward" size={17} color={GLASS_TEXT.tertiary}/>}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'transparent'},content:{paddingHorizontal:14,paddingTop:10,paddingBottom:120,gap:12,width:'100%',maxWidth:430,alignSelf:'center'},flex:{flex:1,minWidth:0},header:{flexDirection:'row',alignItems:'center',gap:11},eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:GLASS.gold},title:{fontSize:27,lineHeight:32,fontWeight:'900',color:GLASS.white,marginTop:2},subtitle:{fontSize:10.5,fontWeight:'700',color:GLASS_TEXT.secondary,marginTop:2},searchBox:{minHeight:56,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:9},input:{flex:1,minWidth:0,color:GLASS.white,fontSize:13,fontWeight:'700',paddingVertical:0},clear:{width:34,height:34,borderRadius:11},quickScroll:{gap:6,paddingRight:8},quickChip:{minHeight:34,paddingHorizontal:10,borderRadius:999,backgroundColor:'rgba(255,255,255,.10)',borderWidth:1,borderColor:'rgba(255,255,255,.14)',alignItems:'center',justifyContent:'center'},quickChipOn:{backgroundColor:'rgba(53,223,235,.25)'},quickText:{fontSize:9,fontWeight:'900',color:GLASS_TEXT.secondary},quickTextOn:{color:GLASS.white},history:{padding:11,gap:8},historyWrap:{flexDirection:'row',flexWrap:'wrap',gap:6},historyChip:{minHeight:32,paddingHorizontal:9,borderRadius:999,backgroundColor:'rgba(255,255,255,.08)',flexDirection:'row',alignItems:'center',gap:4},historyText:{fontSize:8.5,fontWeight:'800',color:GLASS_TEXT.secondary},clearHistory:{fontSize:8.5,fontWeight:'900',color:GLASS.aqua},summaryRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,paddingHorizontal:2},summaryLabel:{flex:1,fontSize:10.5,fontWeight:'800',color:GLASS_TEXT.secondary},summaryCount:{fontSize:10,fontWeight:'900',color:GLASS.gold},section:{padding:0,overflow:'hidden'},sectionHead:{minHeight:48,paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:8,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.10)'},sectionIcon:{width:31,height:31,borderRadius:10,backgroundColor:'rgba(115,240,248,.10)',alignItems:'center',justifyContent:'center'},sectionTitle:{flex:1,fontSize:12.5,fontWeight:'900',color:GLASS.white},countPill:{minWidth:28,height:26,paddingHorizontal:7,borderRadius:999,backgroundColor:'rgba(255,255,255,.10)',alignItems:'center',justifyContent:'center'},countText:{fontSize:9.5,fontWeight:'900',color:GLASS_TEXT.secondary},rows:{paddingHorizontal:9,paddingBottom:7},resultRow:{minHeight:60,paddingHorizontal:4,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:9,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.08)'},resultIcon:{width:36,height:36,borderRadius:12,backgroundColor:'rgba(255,255,255,.08)',alignItems:'center',justifyContent:'center'},resultTitle:{fontSize:12.5,lineHeight:17,fontWeight:'900',color:GLASS.white},resultMeta:{fontSize:9,lineHeight:14,fontWeight:'700',color:GLASS_TEXT.tertiary,marginTop:2},resultSub:{fontSize:9,lineHeight:14,color:GLASS_TEXT.secondary,marginTop:2},empty:{padding:24,alignItems:'center',gap:5},emptyTitle:{fontSize:15,fontWeight:'900',color:GLASS.white,marginTop:5},emptyText:{fontSize:10,lineHeight:16,color:GLASS_TEXT.tertiary,textAlign:'center'},
});
