import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '@/constants/theme';
import { PLACES, PROVINCES } from '@/data/catalog';
import { useTravelStore } from '@/store/useTravelStore';
import { parseDetailedTripText, parseMoneyRange } from '@/utils/tripTextParser';
import type { ParsedTripText } from '@/utils/tripTextParser';
import type { Trip, TripBudgetBreakdown, TripDay, TripScheduleItem } from '@/types';

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
const middle=(min?:number,max?:number)=>{
  const a=finite(min),b=finite(max)||a;
  return a||b?Math.round((a+b)/2):0;
};

const budgetBreakdownFromSummary=(lines:string[]):TripBudgetBreakdown=>{
  const out:TripBudgetBreakdown={};
  lines.forEach(line=>{
    const range=parseMoneyRange(line);
    const value=middle(range?.min,range?.max);
    if(!value)return;
    let key:keyof TripBudgetBreakdown|undefined;
    if(/น้ำมัน|4WD|ค่ารถ|เดินทาง|รถโดยสาร/i.test(line))key='transport';
    else if(/ที่พัก|โรงแรม|ห้อง|รีสอร์ต|รีสอร์ท/i.test(line))key='accommodation';
    else if(/อาหาร|กิน|Breakfast|Lunch|Dinner/i.test(line))key='food';
    else if(/ค่าเที่ยว|กิจกรรม|ค่าเข้า|ค่าเรือ|บัตร/i.test(line))key='activities';
    else if(/ของฝาก|กาแฟ|อื่น/i.test(line))key='other';
    if(key)out[key]=(out[key]||0)+value;
  });
  return out;
};

const normalizeSchedule=(item:any,dayIndex:number,itemIndex:number):TripScheduleItem=>({
  id:asText(item?.id)||uid(`day-${dayIndex+1}-slot-${itemIndex+1}`),
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
    if(m)schedule.push({id:uid(`fallback-${i}`),time:m[1].replace(/\./g,':'),title:(m[2]||'กิจกรรม').trim()||'กิจกรรม',activities:[],notes:[]});
  });
  if(!schedule.length)schedule.push({id:uid('fallback-slot'),title:'รายละเอียดจากข้อความ',detail:cleaned.slice(0,12000),activities:[],notes:[]});
  return {title,travelers:1,routeStops:[],days:[{day:1,title:'DAY 1',placeIds:[],schedule,budgetItems:[],note:cleaned.length>12000?'เก็บข้อความต้นฉบับไว้ในทริปแล้ว':undefined}],attractionsSummary:[],accommodationPlan:[],budgetSummaryLines:[],budgetTiers:[],packingList:[],importantNotes:[]};
};

const safelyParse=(text:string):ParsedTripText=>{
  try{
    const result=parseDetailedTripText(text);
    if(result&&Array.isArray(result.days)&&result.days.length)return result;
  }catch(error){console.warn('Trip parser fallback',error);}
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
  const routeStops=asList(parsed.routeStops);
  const origin=routeStops[0]||undefined;
  const destinationStops=routeStops.slice(1).filter((stop,index,arr)=>!(index===arr.length-1&&origin&&stop===origin));
  const destinationSummary=destinationStops.join(' → ')||undefined;
  const accommodationPlan=Array.isArray(parsed.accommodationPlan)?parsed.accommodationPlan.filter(Boolean).map((x:any,i:number)=>({night:finite(x?.night)||i+1,location:asText(x?.location)})).filter(x=>x.location):[];
  const budgetSummaryLines=asList(parsed.budgetSummaryLines);
  const budgetBreakdown=budgetBreakdownFromSummary(budgetSummaryLines);
  return {
    id:uid(),title:asText(parsed.title).trim()||'แผนเที่ยวใหม่',startDate,endDate:addDays(startDate,Math.max(1,days.length)),budget,provinceIds,days,
    note:asText(parsed.note)||undefined,travelers:finite(parsed.travelers)||1,transport:asText(parsed.transport)||undefined,origin,destinationSummary,
    accommodation:accommodationPlan.map(x=>`คืน ${x.night}: ${x.location}`).join(' · ')||undefined,status:'วางแผน',autoFilled:false,budgetBreakdown,
    routeText:asText(parsed.routeText)||undefined,routeStops,overviewBudgetRange:parsed.overviewBudgetRange,attractionsSummary:asList(parsed.attractionsSummary),accommodationPlan,budgetSummaryLines,budgetTiers:Array.isArray(parsed.budgetTiers)?parsed.budgetTiers.map((x:any)=>({...x})):[],packingList:asList(parsed.packingList),importantNotes:asList(parsed.importantNotes),sourceText:source.slice(0,120000),importMode:'text-import',
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
    setWorking(true);setError('');setCreated(null);
    try{
      const trip=buildTrip(safelyParse(text),text,startDate.trim()||today());
      createTrip(trip);setCreated(trip);setSource('');
    }catch(e:any){console.error('Create trip from text failed',e);setError(e?.message||'สร้างแผนไม่สำเร็จ กรุณาลองใหม่');}
    finally{setWorking(false);}
  };

  return <View style={s.root}>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <View style={s.heroIcon}><Ionicons name="git-compare-outline" size={22} color={COLORS.primary}/></View>
        <View style={s.flex}><Text style={s.kicker}>TEXT → ITINERARY</Text><Text style={s.title}>แยกแผนอัตโนมัติ</Text></View>
        <Text style={s.sub}>รองรับแผนละเอียดหลาย DAY พร้อมเวลา ระยะทาง เวลาขับ เวลาเปิด ค่าเข้า ค่าอาหาร งบ ที่พัก จุดเด่น ข้อควรระวัง และงบรวมท้ายทริป จากนั้นแก้เองได้ทุกช่อง</Text>
      </View>

      <View style={s.notice}><Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary}/><Text style={s.noticeText}>รองรับข้อความแบบ “ทริป 3 วัน 2 คืน + เส้นทาง + DAY 1/2/3 + ตารางเวลา + งบรวม” และจะแยกงบรวมออกจาก DAY สุดท้ายอัตโนมัติ</Text></View>

      <View style={s.card}>
        <Text style={s.label}>วันเริ่มเดินทาง</Text>
        <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} style={s.input}/>
        <View style={s.labelRow}><Text style={s.label}>ข้อความแผนเที่ยว</Text><Text style={[s.counter,tooLong&&s.counterDanger]}>{chars.toLocaleString()} / 120,000</Text></View>
        <TextInput value={source} onChangeText={v=>{setSource(v);if(error)setError('');if(created)setCreated(null)}} multiline textAlignVertical="top" placeholder={'ทริปราชบุรี 3 วัน 2 คืน\nเส้นทาง: กรุงเทพฯ → ดำเนินสะดวก → สวนผึ้ง → กรุงเทพฯ\n\nDAY 1 : ตลาดน้ำ + เมืองเก่า\n07:15–08:45 ตลาดน้ำดำเนินสะดวก\nเปิด: 07:00–13:00\nค่าเข้า: ฟรี\nงบอาหาร: 100–150 บาท/คน\n\nงบรวม\nที่พัก 2 คืน ~2,400–5,000 บาท\nรวม 2 คนประมาณ 8,800–15,000 บาท'} placeholderTextColor={COLORS.textMuted} style={s.textarea}/>
        <Text style={s.helper}>{preview}</Text>
        {!!error&&<View style={s.errorBox}><Ionicons name="alert-circle" size={18} color={COLORS.danger}/><Text style={s.errorText}>{error}</Text></View>}
        {!!created&&<View style={s.successBox}><Ionicons name="checkmark-circle" size={21} color={COLORS.visited}/><View style={s.flex}><Text style={s.successTitle}>สร้างแผนสำเร็จ</Text><Text style={s.successText}>{created.title} · {created.days.length} วัน · {created.days.reduce((sum,d)=>sum+(d.schedule?.length||0),0)} ช่วงเวลา · งบประมาณ {(created.budget||0).toLocaleString()} บาท</Text></View></View>}
        <Pressable disabled={!canCreate} style={[s.createButton,!canCreate&&s.disabled]} onPress={createFromText}><Ionicons name={working?'hourglass-outline':'sparkles'} size={18} color="#fff"/><Text style={s.createText}>{working?'กำลังสร้างแผน...':'แยกและสร้างแผนทันที'}</Text></Pressable>
        {!!created&&<Pressable style={s.viewButton} onPress={onViewPlans}><Ionicons name="create-outline" size={18} color={COLORS.primary}/><Text style={s.viewText}>ไปดูและแก้ไขแผน</Text></Pressable>}
      </View>

      <View style={s.tip}><Ionicons name="information-circle-outline" size={18} color={COLORS.primary}/><Text style={s.tipText}>ข้อมูลที่แยกจะถูกใส่ใน DAY, ช่วงเวลา, รายละเอียด, หมายเหตุ, งบรายวัน, งบรวม, เส้นทาง, ที่พัก, สรุปสถานที่ และ Checklist/คำเตือน แล้วกด “แก้ไขทั้งหมด” แก้ต่อได้</Text></View>
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  root:{flex:1,minHeight:0},scroll:{flex:1},flex:{flex:1,minWidth:0},content:{paddingHorizontal:14,paddingTop:10,paddingBottom:130,gap:11,width:'100%'},
  hero:{padding:15,borderRadius:20,backgroundColor:'rgba(255,255,255,.84)',borderWidth:1,borderColor:'rgba(255,255,255,.72)',gap:8,...SHADOW.card},heroIcon:{width:44,height:44,borderRadius:14,backgroundColor:'rgba(232,246,246,.96)',alignItems:'center',justifyContent:'center'},kicker:{fontSize:9.5,fontWeight:'900',letterSpacing:1.1,color:COLORS.primary},title:{fontSize:23,lineHeight:28,fontWeight:'900',color:COLORS.text,marginTop:1},sub:{fontSize:12,lineHeight:18,color:COLORS.textMuted},
  notice:{padding:11,borderRadius:15,backgroundColor:'rgba(232,246,246,.90)',borderWidth:1,borderColor:'rgba(255,255,255,.68)',flexDirection:'row',alignItems:'flex-start',gap:7},noticeText:{flex:1,fontSize:10.5,fontWeight:'700',lineHeight:16,color:COLORS.textMuted},
  card:{padding:13,borderRadius:20,backgroundColor:'rgba(255,255,255,.86)',borderWidth:1,borderColor:'rgba(255,255,255,.72)',gap:9,...SHADOW.card},labelRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},label:{fontSize:12,fontWeight:'900',color:COLORS.text},counter:{fontSize:9,fontWeight:'800',color:COLORS.textMuted},counterDanger:{color:COLORS.danger},input:{minHeight:48,borderRadius:14,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.94)',paddingHorizontal:12,color:COLORS.text,fontSize:14,fontWeight:'700'},textarea:{minHeight:250,maxHeight:430,borderRadius:14,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.95)',padding:12,color:COLORS.text,fontSize:13,lineHeight:20},helper:{fontSize:9.5,color:COLORS.textMuted},
  errorBox:{padding:10,borderRadius:13,backgroundColor:'rgba(224,92,102,.10)',borderWidth:1,borderColor:'rgba(224,92,102,.25)',flexDirection:'row',gap:7,alignItems:'flex-start'},errorText:{flex:1,fontSize:11,fontWeight:'800',lineHeight:17,color:COLORS.text},successBox:{padding:11,borderRadius:14,backgroundColor:'rgba(47,174,104,.10)',borderWidth:1,borderColor:'rgba(47,174,104,.24)',flexDirection:'row',gap:8,alignItems:'flex-start'},successTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},successText:{fontSize:10.5,fontWeight:'700',lineHeight:16,color:COLORS.textMuted,marginTop:2},
  createButton:{minHeight:50,borderRadius:14,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},disabled:{opacity:.45},createText:{color:'#fff',fontSize:13,fontWeight:'900'},viewButton:{minHeight:48,borderRadius:14,backgroundColor:'rgba(232,246,246,.96)',borderWidth:1,borderColor:'rgba(7,61,75,.10)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},viewText:{fontSize:12,fontWeight:'900',color:COLORS.primary},
  tip:{padding:11,borderRadius:15,backgroundColor:'rgba(255,255,255,.76)',borderWidth:1,borderColor:'rgba(255,255,255,.64)',flexDirection:'row',gap:7,alignItems:'flex-start'},tipText:{flex:1,fontSize:10.5,lineHeight:17,fontWeight:'700',color:COLORS.textMuted},
});
