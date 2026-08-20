import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlassCard, GlassCircleButton, GlassPressable } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';
import { GLASS, GLASS_TEXT } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';

const normalize=(value:string)=>value.toLowerCase().trim();
const includes=(text:string,q:string)=>normalize(text).includes(q);

export default function Search(){
  const router=useRouter();
  const {trips,journals}=useTravelStore();
  const [q,setQ]=useState('');
  const term=normalize(q);

  const result=useMemo(()=>{
    const provinces=PROVINCES.filter(p=>!term||includes(`${p.nameTh} ${p.nameEn} ${p.region} ${p.description}`,term)).slice(0,8);
    const places=PLACES.filter(p=>!term||includes(`${p.name} ${p.province} ${p.category} ${p.tags.join(' ')} ${p.description}`,term)).slice(0,12);
    const tripResults=trips.filter(t=>!term||includes(`${t.title} ${t.origin||''} ${t.destinationSummary||''} ${t.routeText||''} ${(t.routeStops||[]).join(' ')} ${(t.attractionsSummary||[]).join(' ')} ${(t.days||[]).flatMap(d=>(d.schedule||[]).map(x=>x.title)).join(' ')}`,term)).slice(0,8);
    const journalResults=journals.filter(j=>!term||includes(`${j.title} ${j.note} ${j.mood}`,term)).slice(0,8);
    return {provinces,places,trips:tripResults,journals:journalResults};
  },[term,trips,journals]);

  const total=result.provinces.length+result.places.length+result.trips.length+result.journals.length;

  return <SafeAreaView style={s.safe} edges={['top']}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <GlassCircleButton icon="chevron-back" onPress={()=>router.back()} label="กลับ"/>
        <View style={s.flex}><Text style={s.eyebrow}>UNIVERSAL SEARCH</Text><Text style={s.title}>ค้นหาทุกอย่าง</Text><Text style={s.subtitle}>จังหวัด · สถานที่ · ทริป · Journal</Text></View>
      </View>

      <GlassCard strong style={s.searchBox}>
        <Ionicons name="search" size={20} color={GLASS.white}/>
        <TextInput autoFocus value={q} onChangeText={setQ} placeholder="เช่น ราชบุรี, เขากระโจม, ทริปสวนผึ้ง..." placeholderTextColor="rgba(255,255,255,.72)" style={s.input}/>
        {!!q&&<GlassPressable style={s.clear} onPress={()=>setQ('')}><Ionicons name="close" size={19} color={GLASS_TEXT.secondary}/></GlassPressable>}
      </GlassCard>

      <View style={s.summaryRow}><Text style={s.summaryLabel}>{term?'ผลการค้นหา':'รายการล่าสุดและข้อมูลในแอป'}</Text><Text style={s.summaryCount}>{total} รายการ</Text></View>

      <ResultSection icon="map-outline" title="จังหวัด" count={result.provinces.length}>
        {result.provinces.map(p=><Pressable key={p.id} style={s.resultRow} onPress={()=>router.push({pathname:'/province-detail',params:{id:p.id}})}>
          <View style={s.resultIcon}><Ionicons name="location-outline" size={18} color={GLASS.aqua}/></View><View style={s.flex}><Text style={s.resultTitle}>{p.nameTh}</Text><Text style={s.resultMeta}>{p.nameEn} · {p.region}</Text></View><Ionicons name="chevron-forward" size={17} color={GLASS_TEXT.tertiary}/>
        </Pressable>)}
      </ResultSection>

      <ResultSection icon="compass-outline" title="สถานที่" count={result.places.length}>
        {result.places.map(p=><Pressable key={p.id} style={s.resultRow} onPress={()=>router.push({pathname:'/place-detail',params:{id:p.id}})}>
          <View style={s.resultIcon}><Ionicons name="pin-outline" size={18} color={GLASS.aqua}/></View><View style={s.flex}><Text style={s.resultTitle}>{p.name}</Text><Text style={s.resultMeta}>{p.province} · {p.category} · {p.ticketPrice}</Text></View><Ionicons name="chevron-forward" size={17} color={GLASS_TEXT.tertiary}/>
        </Pressable>)}
      </ResultSection>

      <ResultSection icon="briefcase-outline" title="ทริปของฉัน" count={result.trips.length}>
        {result.trips.map(t=><Pressable key={t.id} style={s.resultRow} onPress={()=>router.push('/trips')}>
          <View style={s.resultIcon}><Ionicons name="calendar-outline" size={18} color={GLASS.aqua}/></View><View style={s.flex}><Text style={s.resultTitle}>{t.title}</Text><Text style={s.resultMeta}>{t.startDate} → {t.endDate} · {t.days?.length||0} วัน · {(t.budget||0).toLocaleString()}฿</Text>{!!t.routeText&&<Text numberOfLines={1} style={s.resultSub}>{t.routeText}</Text>}</View><Ionicons name="chevron-forward" size={17} color={GLASS_TEXT.tertiary}/>
        </Pressable>)}
      </ResultSection>

      <ResultSection icon="book-outline" title="Journal" count={result.journals.length}>
        {result.journals.map(j=><Pressable key={j.id} style={s.resultRow} onPress={()=>router.push('/journal')}>
          <View style={s.resultIcon}><Ionicons name="document-text-outline" size={18} color={GLASS.aqua}/></View><View style={s.flex}><Text style={s.resultTitle}>{j.title}</Text><Text style={s.resultMeta}>{j.date} · {j.mood||'บันทึกการเดินทาง'}</Text>{!!j.note&&<Text numberOfLines={2} style={s.resultSub}>{j.note}</Text>}</View><Ionicons name="chevron-forward" size={17} color={GLASS_TEXT.tertiary}/>
        </Pressable>)}
      </ResultSection>

      {term&&total===0&&<GlassCard style={s.empty}><View style={s.emptyIcon}><Ionicons name="search-outline" size={27} color={GLASS.aqua}/></View><Text style={s.emptyTitle}>ไม่พบ “{q}”</Text><Text style={s.emptyText}>ลองค้นชื่อจังหวัด สถานที่ ชื่อทริป หรือคำที่เคยเขียนใน Journal</Text></GlassCard>}
    </ScrollView>
  </SafeAreaView>;
}

function ResultSection({icon,title,count,children}:{icon:string;title:string;count:number;children:React.ReactNode}){
  if(!count)return null;
  return <GlassCard style={s.section}>
    <View style={s.sectionHead}><View style={s.sectionIcon}><Ionicons name={icon as any} size={17} color={GLASS.aqua}/></View><Text style={s.sectionTitle}>{title}</Text><View style={s.countPill}><Text style={s.countText}>{count}</Text></View></View>
    <View style={s.rows}>{children}</View>
  </GlassCard>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'transparent'},content:{paddingHorizontal:14,paddingTop:10,paddingBottom:120,gap:12,width:'100%',maxWidth:430,alignSelf:'center'},flex:{flex:1,minWidth:0},
  header:{flexDirection:'row',alignItems:'center',gap:11},eyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:GLASS.gold},title:{fontSize:27,lineHeight:32,fontWeight:'900',color:GLASS.white,marginTop:2},subtitle:{fontSize:10.5,fontWeight:'700',color:GLASS_TEXT.secondary,marginTop:2},
  searchBox:{minHeight:56,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:9},input:{flex:1,minWidth:0,color:GLASS.white,fontSize:13,fontWeight:'700',paddingVertical:0},clear:{width:34,height:34,borderRadius:11},summaryRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,paddingHorizontal:2},summaryLabel:{flex:1,fontSize:10.5,fontWeight:'800',color:GLASS_TEXT.secondary},summaryCount:{fontSize:10,fontWeight:'900',color:GLASS.gold},
  section:{padding:0,overflow:'hidden'},sectionHead:{minHeight:52,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:8,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.10)'},sectionIcon:{width:32,height:32,borderRadius:10,backgroundColor:'rgba(115,240,248,.10)',alignItems:'center',justifyContent:'center'},sectionTitle:{flex:1,fontSize:13,fontWeight:'900',color:GLASS.white},countPill:{minWidth:28,height:26,paddingHorizontal:7,borderRadius:999,backgroundColor:'rgba(255,255,255,.10)',alignItems:'center',justifyContent:'center'},countText:{fontSize:9.5,fontWeight:'900',color:GLASS_TEXT.secondary},rows:{paddingHorizontal:9,paddingBottom:7},
  resultRow:{minHeight:62,paddingHorizontal:4,paddingVertical:9,flexDirection:'row',alignItems:'center',gap:9,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.08)'},resultIcon:{width:36,height:36,borderRadius:12,backgroundColor:'rgba(255,255,255,.08)',alignItems:'center',justifyContent:'center'},resultTitle:{fontSize:12.5,lineHeight:17,fontWeight:'900',color:GLASS.white},resultMeta:{fontSize:9,lineHeight:14,fontWeight:'700',color:GLASS_TEXT.tertiary,marginTop:2},resultSub:{fontSize:9,lineHeight:14,color:GLASS_TEXT.secondary,marginTop:2},
  empty:{padding:24,alignItems:'center',gap:5},emptyIcon:{width:54,height:54,borderRadius:18,backgroundColor:'rgba(115,240,248,.10)',alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:15,fontWeight:'900',color:GLASS.white,marginTop:5},emptyText:{fontSize:10,lineHeight:16,color:GLASS_TEXT.tertiary,textAlign:'center'},
});
