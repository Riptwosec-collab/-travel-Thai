import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW, SPACING } from '@/constants/theme';
import { PLACES, PROVINCES } from '@/data/catalog';
import { useTravelStore } from '@/store/useTravelStore';
import { Trip } from '@/types';
import { ParsedTripText, parseDetailedTripText } from '@/utils/tripTextParser';

const uid=()=>`trip-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const today=()=>new Date().toISOString().slice(0,10);
const addDays=(date:string,count:number)=>{
  const d=new Date(`${date}T12:00:00`);
  if(Number.isNaN(d.getTime()))return date;
  d.setDate(d.getDate()+Math.max(0,count-1));
  return d.toISOString().slice(0,10);
};
const midpoint=(min?:number,max?:number)=>Math.round(((min||0)+(max||min||0))/2);

const toTrip=(parsed:ParsedTripText,source:string,startDate:string):Trip=>{
  const allText=source.toLowerCase();
  const provinceIds=PROVINCES.filter(p=>allText.includes(p.nameTh.toLowerCase())||allText.includes(p.nameEn.toLowerCase())).map(p=>p.id);
  const normalizedDays=parsed.days.map((day,i)=>({
    ...day,
    day:i+1,
    date:addDays(startDate,i+1),
    placeIds:PLACES.filter(p=>{
      const hay=[day.title,day.route,day.note,...(day.schedule||[]).flatMap(s=>[s.title,s.detail,...(s.activities||[]),...(s.notes||[])])].filter(Boolean).join(' ');
      return hay.includes(p.name);
    }).map(p=>p.id),
  }));
  const budget=midpoint(parsed.overviewBudgetRange?.min,parsed.overviewBudgetRange?.max);
  return {
    id:uid(),
    title:parsed.title?.trim()||'แผนเที่ยวใหม่',
    startDate,
    endDate:addDays(startDate,Math.max(1,normalizedDays.length)),
    budget,
    provinceIds,
    days:normalizedDays,
    note:parsed.note,
    travelers:parsed.travelers||1,
    transport:parsed.transport,
    accommodation:parsed.accommodationPlan.map(x=>`คืน ${x.night}: ${x.location}`).join(' · ')||undefined,
    status:'วางแผน',
    autoFilled:false,
    autoFillSource:undefined,
    routeText:parsed.routeText,
    routeStops:parsed.routeStops,
    overviewBudgetRange:parsed.overviewBudgetRange,
    attractionsSummary:parsed.attractionsSummary,
    accommodationPlan:parsed.accommodationPlan,
    budgetSummaryLines:parsed.budgetSummaryLines,
    budgetTiers:parsed.budgetTiers,
    packingList:parsed.packingList,
    importantNotes:parsed.importantNotes,
    sourceText:source,
    importMode:'text-import',
  };
};

export default function TripTextImport({onDone}:{onDone?:()=>void}){
  const createTrip=useTravelStore(s=>s.createTrip);
  const [source,setSource]=useState('');
  const [startDate,setStartDate]=useState(today());
  const [working,setWorking]=useState(false);
  const [message,setMessage]=useState<{type:'error'|'success';text:string}|null>(null);

  const createFromText=()=>{
    const text=source.trim();
    if(!text){
      setMessage({type:'error',text:'ยังไม่มีข้อความ กรุณาวางแผนเที่ยวก่อนกดสร้างแผน'});
      return;
    }
    if(working)return;
    setWorking(true);
    setMessage(null);
    try{
      const parsed=parseDetailedTripText(text);
      if(!parsed.days.length)throw new Error('ไม่พบข้อมูล DAY ในข้อความ');
      const trip=toTrip(parsed,text,startDate.trim()||today());
      createTrip(trip);
      setMessage({type:'success',text:`สร้างแผนสำเร็จ ${trip.days.length} วัน · ${trip.days.reduce((sum,d)=>sum+(d.schedule?.length||0),0)} ช่วงเวลา`});
      setSource('');
      setTimeout(()=>onDone?.(),250);
    }catch(error:any){
      setMessage({type:'error',text:error?.message||'แยกข้อความไม่สำเร็จ กรุณาลองอีกครั้ง'});
    }finally{
      setWorking(false);
    }
  };

  return <SafeAreaView style={s.safe} edges={['top']}>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <View style={s.heroIcon}><Ionicons name="sparkles" size={25} color={COLORS.primary}/></View>
        <View style={{flex:1}}>
          <Text style={s.kicker}>TEXT → ITINERARY</Text>
          <Text style={s.title}>แยกแผนอัตโนมัติ</Text>
          <Text style={s.sub}>วางข้อความแล้วกดครั้งเดียว ระบบจะสร้างทริปให้ทันที จากนั้นกลับไปกด “แก้ไขทั้งหมด” เพื่อแก้ทุกช่องได้</Text>
        </View>
      </View>

      <View style={s.notice}>
        <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary}/>
        <Text style={s.noticeText}>รองรับ DAY 1, DAY 1 — หัวข้อ, ## DAY 1, วันที่ 1, วันแรก รวมถึงเวลา 09.00 น., 09:00, 09:00–10:00 และเวลา+สถานที่ในบรรทัดเดียว</Text>
      </View>

      <View style={s.card}>
        <Text style={s.label}>วันเริ่มเดินทาง</Text>
        <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} style={s.input}/>

        <Text style={s.label}>วางแผนเที่ยวแบบข้อความ</Text>
        <TextInput
          value={source}
          onChangeText={v=>{setSource(v);if(message)setMessage(null)}}
          multiline
          textAlignVertical="top"
          placeholder={'วางข้อความจาก ChatGPT หรือแผนที่เขียนเองได้เลย\n\nตัวอย่าง\nแผนเที่ยวศรีสะเกษ 5 วัน 4 คืน\nงบ 14,000–18,000 บาท\nเส้นทางหลัก: กรุงเทพฯ → ศรีสะเกษ → กรุงเทพฯ\n\nDAY 1 — เที่ยวตัวเมือง\n09:00 วัดพระธาตุเรืองรอง\n12:00–13:00 ร้านอาหารท้องถิ่น\nที่พัก: ตัวเมืองศรีสะเกษ\nงบวันที่ 1\nรวมประมาณ 2,000–3,000 บาท'}
          placeholderTextColor={COLORS.textMuted}
          style={s.textarea}
        />

        {message&&<View style={[s.message,message.type==='error'?s.messageError:s.messageSuccess]}>
          <Ionicons name={message.type==='error'?'alert-circle':'checkmark-circle'} size={18} color={message.type==='error'?COLORS.danger:COLORS.visited}/>
          <Text style={s.messageText}>{message.text}</Text>
        </View>}

        <Pressable disabled={working} style={[s.parseButton,working&&s.parseButtonDisabled]} onPress={createFromText}>
          <Ionicons name={working?'hourglass-outline':'git-compare-outline'} size={19} color="#fff"/>
          <Text style={s.parseText}>{working?'กำลังแยกและสร้างแผน...':'แยกและสร้างแผนทันที'}</Text>
        </Pressable>
      </View>

      <View style={s.tipCard}>
        <Ionicons name="create-outline" size={20} color={COLORS.primary}/>
        <View style={{flex:1}}><Text style={s.tipTitle}>หลังสร้างแล้วแก้ได้ทุกจุด</Text><Text style={s.tipText}>DAY · วันที่ · เวลา · สถานที่ · กิจกรรม · เส้นทาง · ที่พัก · งบ · Checklist · หมายเหตุ ยังคงแก้ เพิ่ม หรือลบด้วย Manual Editor ได้ทั้งหมด</Text></View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'transparent'},scroll:{flex:1},content:{padding:SPACING.lg,paddingBottom:130,gap:14,width:'100%',alignSelf:'center'},
  hero:{padding:16,borderRadius:24,backgroundColor:'rgba(255,255,255,.78)',borderWidth:1,borderColor:'rgba(255,255,255,.72)',flexDirection:'row',alignItems:'center',gap:12,...SHADOW.card},heroIcon:{width:48,height:48,borderRadius:16,backgroundColor:'rgba(232,246,246,.9)',alignItems:'center',justifyContent:'center'},kicker:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:COLORS.primary},title:{fontSize:24,fontWeight:'900',color:COLORS.text,marginTop:2},sub:{color:COLORS.textMuted,lineHeight:19,marginTop:3,fontSize:12},
  notice:{padding:13,borderRadius:17,backgroundColor:'rgba(232,246,246,.82)',borderWidth:1,borderColor:'rgba(255,255,255,.66)',flexDirection:'row',gap:8,alignItems:'flex-start'},noticeText:{flex:1,color:COLORS.textMuted,lineHeight:18,fontSize:11,fontWeight:'700'},
  card:{padding:14,borderRadius:22,backgroundColor:'rgba(255,255,255,.78)',borderWidth:1,borderColor:'rgba(255,255,255,.7)',gap:9,...SHADOW.card},label:{fontSize:12,fontWeight:'900',color:COLORS.text},input:{minHeight:46,borderRadius:14,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.84)',paddingHorizontal:12,color:COLORS.text,fontSize:14,fontWeight:'700'},textarea:{minHeight:360,borderRadius:15,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.84)',padding:13,color:COLORS.text,fontSize:13,lineHeight:20},
  message:{padding:11,borderRadius:13,flexDirection:'row',alignItems:'flex-start',gap:7,borderWidth:1},messageError:{backgroundColor:'rgba(224,92,102,.10)',borderColor:'rgba(224,92,102,.22)'},messageSuccess:{backgroundColor:'rgba(47,174,104,.10)',borderColor:'rgba(47,174,104,.22)'},messageText:{flex:1,fontSize:11,fontWeight:'800',lineHeight:17,color:COLORS.text},
  parseButton:{minHeight:52,borderRadius:15,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},parseButtonDisabled:{opacity:.62},parseText:{color:'#fff',fontWeight:'900',fontSize:13},
  tipCard:{padding:13,borderRadius:18,backgroundColor:'rgba(255,255,255,.70)',borderWidth:1,borderColor:'rgba(255,255,255,.62)',flexDirection:'row',alignItems:'flex-start',gap:9},tipTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},tipText:{fontSize:10,color:COLORS.textMuted,lineHeight:16,marginTop:2},
});
