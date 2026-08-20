import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW, SPACING } from '@/constants/theme';
import { PLACES, PROVINCES } from '@/data/catalog';
import { useTravelStore } from '@/store/useTravelStore';
import { parseDetailedTripText } from '@/utils/tripTextParser';
import type { ParsedTripText } from '@/utils/tripTextParser';
import type { Trip, TripDay, TripScheduleItem } from '@/types';

const uid=(prefix='trip')=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const today=()=>new Date().toISOString().slice(0,10);
const addDays=(date:string,count:number)=>{
  const d=new Date(`${date}T12:00:00`);
  if(Number.isNaN(d.getTime()))return date;
  d.setDate(d.getDate()+Math.max(0,count-1));
  return d.toISOString().slice(0,10);
};
const asText=(v:unknown)=>typeof v==='string'?v:'';
const asList=(v:unknown)=>Array.isArray(v)?v.filter(x=>typeof x==='string') as string[]:[];
const finite=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:0};

const normalizeSchedule=(item:any,dayIndex:number,itemIndex:number):TripScheduleItem=>({
  id:asText(item?.id)||uid(`day-${dayIndex+1}-slot`),
  time:asText(item?.time)||undefined,
  title:asText(item?.title).trim()||'กิจกรรม',
  detail:asText(item?.detail)||undefined,
  activities:asList(item?.activities),
  notes:asList(item?.notes),
});

const normalizeDay=(day:any,index:number,startDate:string):TripDay=>({
  day:index+1,
  date:asText(day?.date)||addDays(startDate,index+1),
  title:asText(day?.title).trim()||`DAY ${index+1}`,
  route:asText(day?.route)||undefined,
  placeIds:asList(day?.placeIds),
  note:asText(day?.note)||undefined,
  schedule:Array.isArray(day?.schedule)?day.schedule.map((x:any,i:number)=>normalizeSchedule(x,index,i)):[],
  accommodation:asText(day?.accommodation)||undefined,
  budgetRange:day?.budgetRange&&typeof day.budgetRange==='object'?day.budgetRange:undefined,
  budgetItems:Array.isArray(day?.budgetItems)?day.budgetItems.map((x:any)=>({...x})):[],
});

const fallbackParsed=(text:string):ParsedTripText=>{
  const cleaned=text.replace(/\r/g,'').trim();
  const allLines=cleaned.split('\n').map(x=>x.trim()).filter(Boolean);
  const title=(allLines.find(x=>!/^[-•#*=]/.test(x))||'แผนเที่ยวใหม่').replace(/^#{1,6}\s*/,'').slice(0,120);
  const schedule:TripScheduleItem[]=[];
  const timeRx=/^(\d{1,2}[.:]\d{2}(?:\s*(?:-|–|—|ถึง)\s*\d{1,2}[.:]\d{2})?)\s*(?:น\.?)?\s*(.*)$/;
  allLines.forEach((line,i)=>{
    const m=line.replace(/^[-•]\s*/,'').match(timeRx);
    if(m){
      schedule.push({id:uid(`fallback-${i}`),time:m[1].replace(/\./g,':'),title:(m[2]||'กิจกรรม').trim()||'กิจกรรม',activities:[],notes:[]});
    }
  });
  if(!schedule.length){
    schedule.push({id:uid('fallback-slot'),title:title==='แผนเที่ยวใหม่'?'รายละเอียดจากข้อความ':'เริ่มต้นแผน',detail:cleaned.slice(0,12000),activities:[],notes:[]});
  }
  return {
    title,
    travelers:1,
    routeStops:[],
    days:[{day:1,title:'DAY 1',placeIds:[],schedule,budgetItems:[],note:cleaned.length>12000?'เก็บข้อความต้นฉบับไว้ในทริปแล้ว':undefined}],
    attractionsSummary:[],
    accommodationPlan:[],
    budgetSummaryLines:[],
    budgetTiers:[],
    packingList:[],
    importantNotes:[],
  };
};

const safelyParse=(text:string):ParsedTripText=>{
  try{
    const result=parseDetailedTripText(text);
    if(result&&Array.isArray(result.days)&&result.days.length)return result;
  }catch(error){
    console.warn('Trip parser fallback',error);
  }
  return fallbackParsed(text);
};

const buildTrip=(parsed:ParsedTripText,source:string,startDate:string):Trip=>{
  const rawDays=Array.isArray(parsed.days)&&parsed.days.length?parsed.days:fallbackParsed(source).days;
  const days=rawDays.map((day,index)=>normalizeDay(day,index,startDate));
  const lower=source.toLowerCase();
  const provinceIds=Array.from(new Set(PROVINCES.filter(p=>lower.includes(p.nameTh.toLowerCase())||lower.includes(p.nameEn.toLowerCase())).map(p=>p.id)));

  days.forEach(day=>{
    const hay=[day.title,day.route,day.note,...(day.schedule||[]).flatMap(s=>[s.title,s.detail,...asList(s.activities),...asList(s.notes)])].filter(Boolean).join(' ');
    day.placeIds=PLACES.filter(p=>hay.includes(p.name)).map(p=>p.id);
  });

  const min=finite(parsed.overviewBudgetRange?.min);
  const max=finite(parsed.overviewBudgetRange?.max)||min;
  const budget=min||max?Math.round((min+max)/2):0;
  const accommodationPlan=Array.isArray(parsed.accommodationPlan)?parsed.accommodationPlan.filter(Boolean).map((x:any,i:number)=>({night:finite(x?.night)||i+1,location:asText(x?.location)})).filter(x=>x.location):[];

  return {
    id:uid(),
    title:asText(parsed.title).trim()||'แผนเที่ยวใหม่',
    startDate,
    endDate:addDays(startDate,Math.max(1,days.length)),
    budget,
    provinceIds,
    days,
    note:asText(parsed.note)||undefined,
    travelers:finite(parsed.travelers)||1,
    transport:asText(parsed.transport)||undefined,
    accommodation:accommodationPlan.map(x=>`คืน ${x.night}: ${x.location}`).join(' · ')||undefined,
    status:'วางแผน',
    autoFilled:false,
    autoFillSource:undefined,
    routeText:asText(parsed.routeText)||undefined,
    routeStops:asList(parsed.routeStops),
    overviewBudgetRange:parsed.overviewBudgetRange,
    attractionsSummary:asList(parsed.attractionsSummary),
    accommodationPlan,
    budgetSummaryLines:asList(parsed.budgetSummaryLines),
    budgetTiers:Array.isArray(parsed.budgetTiers)?parsed.budgetTiers.map((x:any)=>({...x})):[],
    packingList:asList(parsed.packingList),
    importantNotes:asList(parsed.importantNotes),
    sourceText:source.slice(0,120000),
    importMode:'text-import',
  };
};

type Props={onViewPlans?:()=>void};

export default function TripTextImport({onViewPlans}:Props){
  const createTrip=useTravelStore(s=>s.createTrip);
  const [source,setSource]=useState('');
  const [startDate,setStartDate]=useState(today());
  const [working,setWorking]=useState(false);
  const [created,setCreated]=useState<Trip|null>(null);
  const [error,setError]=useState('');
  const chars=source.length;
  const tooLong=chars>120000;
  const canCreate=source.trim().length>0&&!working&&!tooLong;

  const preview=useMemo(()=>source.trim()?`ข้อความ ${chars.toLocaleString()} ตัวอักษร`:'วางข้อความแผนเที่ยวด้านล่าง',[chars,source]);

  const createFromText=()=>{
    const text=source.trim();
    if(!text){setError('กรุณาวางข้อความแผนเที่ยวก่อน');return;}
    if(tooLong){setError('ข้อความยาวเกิน 120,000 ตัวอักษร กรุณาแบ่งเป็นหลายทริป');return;}
    if(working)return;
    setWorking(true);
    setError('');
    setCreated(null);
    try{
      const parsed=safelyParse(text);
      const trip=buildTrip(parsed,text,startDate.trim()||today());
      createTrip(trip);
      setCreated(trip);
      setSource('');
    }catch(e:any){
      console.error('Create trip from text failed',e);
      setError(e?.message||'สร้างแผนไม่สำเร็จ กรุณาลองใหม่');
    }finally{
      setWorking(false);
    }
  };

  return <View style={s.root}>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <View style={s.heroIcon}><Ionicons name="git-compare-outline" size={23} color={COLORS.primary}/></View>
        <View style={{flex:1}}>
          <Text style={s.kicker}>TEXT → ITINERARY</Text>
          <Text style={s.title}>แยกแผนอัตโนมัติ</Text>
          <Text style={s.sub}>วางข้อความ → กดสร้างแผนครั้งเดียว ระบบจะแยก DAY / เวลา / กิจกรรม / งบ / ที่พัก แล้วบันทึกเข้าทริป</Text>
        </View>
      </View>

      <View style={s.notice}>
        <Ionicons name="shield-checkmark-outline" size={19} color={COLORS.primary}/>
        <Text style={s.noticeText}>ถ้าข้อความมีรูปแบบแปลก ระบบจะไม่ล้มและไม่ขึ้นหน้าขาว แต่จะสร้าง DAY 1 จากข้อความเดิมเพื่อให้เข้า Manual Editor ไปแก้ต่อได้</Text>
      </View>

      <View style={s.card}>
        <Text style={s.label}>วันเริ่มเดินทาง</Text>
        <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} style={s.input}/>

        <View style={s.labelRow}><Text style={s.label}>ข้อความแผนเที่ยว</Text><Text style={[s.counter,tooLong&&s.counterDanger]}>{chars.toLocaleString()} / 120,000</Text></View>
        <TextInput
          value={source}
          onChangeText={v=>{setSource(v);if(error)setError('');if(created)setCreated(null)}}
          multiline
          textAlignVertical="top"
          placeholder={'วางข้อความจาก ChatGPT หรือที่เขียนเองได้เลย\n\nตัวอย่าง\nแผนเที่ยวศรีสะเกษ 3 วัน 2 คืน\nDAY 1 — ตัวเมือง\n09:00 วัดพระธาตุเรืองรอง\n12:00 ร้านอาหารท้องถิ่น\nที่พัก: ตัวเมืองศรีสะเกษ\nงบวันที่ 1: 2,000–3,000 บาท'}
          placeholderTextColor={COLORS.textMuted}
          style={s.textarea}
        />
        <Text style={s.helper}>{preview}</Text>

        {!!error&&<View style={s.errorBox}><Ionicons name="alert-circle" size={18} color={COLORS.danger}/><Text style={s.errorText}>{error}</Text></View>}

        {!!created&&<View style={s.successBox}>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.visited}/>
          <View style={{flex:1}}>
            <Text style={s.successTitle}>สร้างแผนสำเร็จ</Text>
            <Text style={s.successText}>{created.title} · {created.days.length} วัน · {created.days.reduce((sum,d)=>sum+(d.schedule?.length||0),0)} ช่วงเวลา</Text>
          </View>
        </View>}

        <Pressable disabled={!canCreate} style={[s.createButton,!canCreate&&s.disabled]} onPress={createFromText}>
          <Ionicons name={working?'hourglass-outline':'sparkles'} size={19} color="#fff"/>
          <Text style={s.createText}>{working?'กำลังแยกและสร้างแผน...':'แยกและสร้างแผนทันที'}</Text>
        </Pressable>

        {!!created&&<Pressable style={s.viewButton} onPress={onViewPlans}>
          <Ionicons name="map-outline" size={18} color={COLORS.primary}/>
          <Text style={s.viewText}>ไปดูแผนที่สร้าง</Text>
        </Pressable>}
      </View>

      <View style={s.tip}>
        <Ionicons name="create-outline" size={19} color={COLORS.primary}/>
        <Text style={s.tipText}>หลังสร้างแล้วกด “แก้ไขทั้งหมด” เพื่อแก้ชื่อทริป, DAY, วันที่, เวลา, สถานที่, กิจกรรม, เส้นทาง, ที่พัก, งบ, Checklist และหมายเหตุได้ทุกจุด</Text>
      </View>
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,minHeight:0},scroll:{flex:1},content:{padding:SPACING.md,paddingBottom:140,gap:12,width:'100%'},
  hero:{padding:15,borderRadius:22,backgroundColor:'rgba(255,255,255,.80)',borderWidth:1,borderColor:'rgba(255,255,255,.72)',flexDirection:'row',alignItems:'center',gap:11,...SHADOW.card},heroIcon:{width:46,height:46,borderRadius:15,backgroundColor:'rgba(232,246,246,.94)',alignItems:'center',justifyContent:'center'},kicker:{fontSize:9,fontWeight:'900',letterSpacing:1.1,color:COLORS.primary},title:{fontSize:23,fontWeight:'900',color:COLORS.text,marginTop:2},sub:{fontSize:11,color:COLORS.textMuted,lineHeight:17,marginTop:3},
  notice:{padding:12,borderRadius:16,backgroundColor:'rgba(232,246,246,.88)',borderWidth:1,borderColor:'rgba(255,255,255,.66)',flexDirection:'row',alignItems:'flex-start',gap:8},noticeText:{flex:1,fontSize:10.5,fontWeight:'700',lineHeight:17,color:COLORS.textMuted},
  card:{padding:14,borderRadius:22,backgroundColor:'rgba(255,255,255,.82)',borderWidth:1,borderColor:'rgba(255,255,255,.72)',gap:9,...SHADOW.card},labelRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},label:{fontSize:12,fontWeight:'900',color:COLORS.text},counter:{fontSize:9,fontWeight:'800',color:COLORS.textMuted},counterDanger:{color:COLORS.danger},input:{minHeight:46,borderRadius:14,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.9)',paddingHorizontal:12,color:COLORS.text,fontSize:14,fontWeight:'700'},textarea:{minHeight:330,borderRadius:15,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.92)',padding:13,color:COLORS.text,fontSize:13,lineHeight:20},helper:{fontSize:9.5,color:COLORS.textMuted},
  errorBox:{padding:10,borderRadius:13,backgroundColor:'rgba(224,92,102,.10)',borderWidth:1,borderColor:'rgba(224,92,102,.25)',flexDirection:'row',gap:7,alignItems:'flex-start'},errorText:{flex:1,fontSize:11,fontWeight:'800',lineHeight:17,color:COLORS.text},successBox:{padding:11,borderRadius:14,backgroundColor:'rgba(47,174,104,.10)',borderWidth:1,borderColor:'rgba(47,174,104,.24)',flexDirection:'row',gap:8,alignItems:'flex-start'},successTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},successText:{fontSize:10.5,fontWeight:'700',lineHeight:16,color:COLORS.textMuted,marginTop:2},
  createButton:{minHeight:52,borderRadius:15,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},disabled:{opacity:.48},createText:{color:'#fff',fontSize:13,fontWeight:'900'},viewButton:{minHeight:48,borderRadius:14,backgroundColor:'rgba(232,246,246,.94)',borderWidth:1,borderColor:'rgba(7,61,75,.10)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},viewText:{fontSize:12,fontWeight:'900',color:COLORS.primary},
  tip:{padding:12,borderRadius:17,backgroundColor:'rgba(255,255,255,.72)',borderWidth:1,borderColor:'rgba(255,255,255,.62)',flexDirection:'row',gap:8,alignItems:'flex-start'},tipText:{flex:1,fontSize:10.5,lineHeight:17,fontWeight:'700',color:COLORS.textMuted},
});
