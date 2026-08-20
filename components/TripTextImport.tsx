import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
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

export default function TripTextImport({onDone}:{onDone?:()=>void}){
  const createTrip=useTravelStore(s=>s.createTrip);
  const [source,setSource]=useState('');
  const [parsed,setParsed]=useState<ParsedTripText|null>(null);
  const [startDate,setStartDate]=useState(today());
  const [title,setTitle]=useState('');

  const scheduleCount=useMemo(()=>parsed?.days.reduce((sum,d)=>sum+(d.schedule?.length||0),0)||0,[parsed]);

  const parse=()=>{
    const text=source.trim();
    if(!text)return Alert.alert('ยังไม่มีข้อความ','วางแผนเที่ยวที่ต้องการแยกก่อน');
    const result=parseDetailedTripText(text);
    if(!result.days.length){
      setParsed(null);
      return Alert.alert('ยังแยก DAY ไม่ได้','รูปแบบควรมี DAY 1, DAY 2, ... และแต่ละช่วงเวลาควรเขียนเช่น 09.00 น. หรือ 09.00–10.00 น.');
    }
    setParsed(result);
    setTitle(result.title||'แผนเที่ยวใหม่');
  };

  const save=()=>{
    if(!parsed)return;
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
    const trip:Trip={
      id:uid(),
      title:title.trim()||parsed.title||'แผนเที่ยวใหม่',
      startDate,
      endDate:addDays(startDate,normalizedDays.length),
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
    createTrip(trip);
    Alert.alert('แยกและบันทึกแล้ว','ระบบสร้างทริปจากข้อความแล้ว จากนั้นกด “แก้ไขทั้งหมด” เพื่อแก้ทุกช่องได้');
    setSource('');setParsed(null);setTitle('');
    onDone?.();
  };

  return <SafeAreaView style={s.safe} edges={['top']}>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.hero}>
        <View style={s.heroIcon}><Ionicons name="sparkles" size={25} color={COLORS.primary}/></View>
        <View style={{flex:1}}>
          <Text style={s.kicker}>TEXT → ITINERARY</Text>
          <Text style={s.title}>แยกแผนอัตโนมัติ</Text>
          <Text style={s.sub}>วางข้อความยาว แล้วระบบแยก DAY · เวลา · กิจกรรม · งบ · ที่พัก · Checklist ให้ จากนั้นแก้เองได้ทุกจุดใน Manual Editor</Text>
        </View>
      </View>

      <View style={s.notice}><Ionicons name="information-circle-outline" size={20} color={COLORS.primary}/><Text style={s.noticeText}>ฟังก์ชันนี้เป็น “ตัวแยกข้อความ” เท่านั้น ไม่ใช่ Auto Fill และจะไม่เดา Wishlist, เส้นทาง หรือราคาให้เอง</Text></View>

      <View style={s.card}>
        <Text style={s.label}>วางแผนเที่ยวแบบข้อความ</Text>
        <TextInput
          value={source}
          onChangeText={setSource}
          multiline
          textAlignVertical="top"
          placeholder={'ตัวอย่าง\nแผนเที่ยวศรีสะเกษ 5 วัน 4 คืน\nงบประมาณสำหรับ 2 คน: ประมาณ 14,000–18,000 บาท\nเส้นทางหลัก:\nกรุงเทพฯ → ศรีสะเกษ → กรุงเทพฯ\n\nDAY 1\nเที่ยวตัวเมืองศรีสะเกษ\n09.00 น.\nวัดพระธาตุเรืองรอง\nกิจกรรม:\n- ไหว้พระ\n- ถ่ายรูป\n\nงบวันที่ 1\nรวมประมาณ 2,000–3,000 บาท'}
          placeholderTextColor={COLORS.textMuted}
          style={s.textarea}
        />
        <Pressable style={s.parseButton} onPress={parse}><Ionicons name="git-compare-outline" size={19} color="#fff"/><Text style={s.parseText}>แยกแผนอัตโนมัติ</Text></Pressable>
      </View>

      {parsed&&<View style={s.card}>
        <View style={s.previewTop}><View style={{flex:1}}><Text style={s.previewKicker}>PREVIEW</Text><Text style={s.previewTitle}>แยกสำเร็จ</Text></View><Ionicons name="checkmark-circle" size={28} color={COLORS.visited}/></View>
        <Text style={s.label}>ชื่อทริป</Text>
        <TextInput value={title} onChangeText={setTitle} style={s.input} placeholderTextColor={COLORS.textMuted}/>
        <Text style={s.label}>วันเริ่มเดินทาง</Text>
        <TextInput value={startDate} onChangeText={setStartDate} style={s.input} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted}/>

        <View style={s.stats}>
          <Stat label="DAY" value={String(parsed.days.length)}/>
          <Stat label="ช่วงเวลา" value={String(scheduleCount)}/>
          <Stat label="Route Stops" value={String(parsed.routeStops.length)}/>
          <Stat label="Checklist" value={String(parsed.packingList.length)}/>
        </View>

        {!!parsed.routeStops.length&&<View style={s.routeWrap}>{parsed.routeStops.map((x,i)=><React.Fragment key={`${x}-${i}`}><View style={s.routeChip}><Text style={s.routeText}>{x}</Text></View>{i<parsed.routeStops.length-1&&<Ionicons name="chevron-forward" size={14} color={COLORS.primary}/>}</React.Fragment>)}</View>}

        {parsed.days.slice(0,5).map(day=><View key={day.day} style={s.dayCard}><View style={s.dayNo}><Text style={s.dayNoText}>{day.day}</Text></View><View style={{flex:1}}><Text style={s.dayTitle}>{day.title}</Text>{(day.schedule||[]).slice(0,4).map(item=><View key={item.id} style={s.slot}><Text style={s.time}>{item.time||'--:--'}</Text><Text style={s.slotTitle}>{item.title}</Text></View>)}</View></View>)}
        {parsed.days.length>5&&<Text style={s.more}>+ อีก {parsed.days.length-5} วัน จะบันทึกทั้งหมด</Text>}

        <Pressable style={s.saveButton} onPress={save}><Ionicons name="save-outline" size={19} color="#fff"/><Text style={s.saveText}>บันทึก แล้วไปแก้ไขรายละเอียดต่อ</Text></Pressable>
      </View>}
    </ScrollView>
  </SafeAreaView>;
}

function Stat({label,value}:{label:string;value:string}){return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'transparent'},scroll:{flex:1},content:{padding:SPACING.lg,paddingBottom:130,gap:14,maxWidth:980,width:'100%',alignSelf:'center'},
  hero:{padding:20,borderRadius:28,backgroundColor:'rgba(255,255,255,.78)',borderWidth:1,borderColor:'rgba(255,255,255,.72)',flexDirection:'row',alignItems:'center',gap:14,...SHADOW.card},heroIcon:{width:52,height:52,borderRadius:18,backgroundColor:'rgba(232,246,246,.9)',alignItems:'center',justifyContent:'center'},kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:COLORS.primary},title:{fontSize:30,fontWeight:'900',color:COLORS.text,marginTop:2},sub:{color:COLORS.textMuted,lineHeight:20,marginTop:3},
  notice:{padding:14,borderRadius:18,backgroundColor:'rgba(232,246,246,.82)',borderWidth:1,borderColor:'rgba(255,255,255,.66)',flexDirection:'row',gap:9,alignItems:'flex-start'},noticeText:{flex:1,color:COLORS.textMuted,lineHeight:19,fontSize:12,fontWeight:'700'},
  card:{padding:16,borderRadius:24,backgroundColor:'rgba(255,255,255,.78)',borderWidth:1,borderColor:'rgba(255,255,255,.7)',gap:10,...SHADOW.card},label:{fontSize:12,fontWeight:'900',color:COLORS.text},textarea:{minHeight:360,borderRadius:16,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.84)',padding:14,color:COLORS.text,fontSize:14,lineHeight:21},input:{minHeight:48,borderRadius:15,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.84)',paddingHorizontal:13,color:COLORS.text,fontSize:15,fontWeight:'700'},parseButton:{minHeight:50,borderRadius:15,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},parseText:{color:'#fff',fontWeight:'900'},
  previewTop:{flexDirection:'row',alignItems:'center'},previewKicker:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:COLORS.primary},previewTitle:{fontSize:20,fontWeight:'900',color:COLORS.text,marginTop:2},stats:{flexDirection:'row',flexWrap:'wrap',gap:8},stat:{minWidth:120,flex:1,padding:12,borderRadius:15,backgroundColor:'rgba(232,246,246,.72)',alignItems:'center'},statValue:{fontSize:20,fontWeight:'900',color:COLORS.text},statLabel:{fontSize:10,fontWeight:'800',color:COLORS.textMuted,marginTop:2},routeWrap:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:6},routeChip:{paddingHorizontal:9,paddingVertical:6,borderRadius:999,backgroundColor:'rgba(232,246,246,.9)'},routeText:{fontSize:10,fontWeight:'900',color:COLORS.text},
  dayCard:{padding:12,borderRadius:17,backgroundColor:'rgba(255,255,255,.65)',borderWidth:1,borderColor:'rgba(7,61,75,.08)',flexDirection:'row',gap:10},dayNo:{width:36,height:36,borderRadius:12,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},dayNoText:{color:'#fff',fontWeight:'900'},dayTitle:{fontSize:13,fontWeight:'900',color:COLORS.text,marginBottom:4},slot:{flexDirection:'row',gap:8,paddingVertical:2},time:{width:88,fontSize:10,fontWeight:'900',color:COLORS.primary},slotTitle:{flex:1,fontSize:11,fontWeight:'700',color:COLORS.text},more:{fontSize:11,fontWeight:'800',color:COLORS.textMuted,textAlign:'center'},saveButton:{minHeight:50,borderRadius:15,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},saveText:{color:'#fff',fontWeight:'900'},
});
