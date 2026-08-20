import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PLACES, PROVINCES } from '@/data/catalog';
import { COLORS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';
import {
  Trip,
  TripAccommodationNight,
  TripBudgetBreakdown,
  TripBudgetTier,
  TripDay,
  TripDayBudgetItem,
  TripMoneyRange,
  TripScheduleItem,
} from '@/types';

const STATUS:NonNullable<Trip['status']>[]=['วางแผน','พร้อมเดินทาง','จบทริป'];
const TRANSPORTS=['รถยนต์ส่วนตัว','รถยนต์','รถไฟ','เครื่องบิน','รถบัส','มอเตอร์ไซค์'];
const STYLES=['ชิล ๆ','ธรรมชาติ','คาเฟ่','วัฒนธรรม','กินเที่ยว','ครอบครัว'];
const BUDGET_FIELDS:[keyof TripBudgetBreakdown,string,string][]=[
  ['transport','เดินทาง','car-outline'],
  ['accommodation','ที่พัก','bed-outline'],
  ['food','อาหาร','restaurant-outline'],
  ['activities','กิจกรรม','ticket-outline'],
  ['other','อื่น ๆ','wallet-outline'],
];

const uid=(prefix='x')=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const isoToday=()=>new Date().toISOString().slice(0,10);
const num=(v:string|number|undefined)=>Math.max(0,Number(String(v??'').replace(/,/g,''))||0);
const fmt=(v?:number)=>typeof v==='number'?v.toLocaleString():'-';
const fmtRange=(r?:TripMoneyRange)=>!r?'-':r.min===r.max?`${fmt(r.min)} บาท`:`${fmt(r.min)}–${fmt(r.max)} บาท`;
const lines=(value:string)=>value.split('\n').map(x=>x.replace(/^[-•]\s*/,'').trim()).filter(Boolean);
const joinLines=(value?:string[])=>Array.isArray(value)?value.join('\n'):'';
const addDays=(date:string,count:number)=>{
  const d=new Date(`${date}T12:00:00`);
  if(Number.isNaN(d.getTime()))return date;
  d.setDate(d.getDate()+Math.max(0,count-1));
  return d.toISOString().slice(0,10);
};
const moneyRange=(min:string,max:string,label?:string):TripMoneyRange|undefined=>{
  const a=num(min); const b=num(max);
  if(!a&&!b&&!label?.trim())return undefined;
  return {min:a||undefined,max:b||a||undefined,label:label?.trim()||undefined};
};
const blankSchedule=():TripScheduleItem=>({id:uid('schedule'),time:'',title:'',detail:'',activities:[],notes:[]});
const blankDay=(day:number,date?:string):TripDay=>({day,date,title:`DAY ${day}`,route:'',placeIds:[],note:'',schedule:[blankSchedule()],accommodation:'',budgetRange:undefined,budgetItems:[]});

interface Draft {
  id?:string;
  title:string;
  startDate:string;
  endDate:string;
  budget:string;
  travelers:string;
  transport:string;
  accommodation:string;
  tripStyle:string;
  status:NonNullable<Trip['status']>;
  origin:string;
  destinationSummary:string;
  note:string;
  provinceIds:string[];
  routeText:string;
  routeStopsText:string;
  overviewBudgetMin:string;
  overviewBudgetMax:string;
  overviewBudgetLabel:string;
  attractionsText:string;
  budgetSummaryText:string;
  packingText:string;
  importantText:string;
  sourceText:string;
  budgetBreakdown:Record<keyof TripBudgetBreakdown,string>;
  days:TripDay[];
  accommodationPlan:TripAccommodationNight[];
  budgetTiers:TripBudgetTier[];
}

const toDraft=(trip?:Trip):Draft=>{
  if(!trip){
    const start=isoToday();
    return {
      title:'',startDate:start,endDate:start,budget:'',travelers:'2',transport:'รถยนต์ส่วนตัว',accommodation:'',tripStyle:'ชิล ๆ',status:'วางแผน',origin:'กรุงเทพฯ',destinationSummary:'',note:'',provinceIds:[],routeText:'',routeStopsText:'',overviewBudgetMin:'',overviewBudgetMax:'',overviewBudgetLabel:'',attractionsText:'',budgetSummaryText:'',packingText:'',importantText:'',sourceText:'',
      budgetBreakdown:{transport:'',accommodation:'',food:'',activities:'',other:''},
      days:[blankDay(1,start)],accommodationPlan:[],budgetTiers:[],
    };
  }
  return {
    id:trip.id,
    title:trip.title||'',startDate:trip.startDate||isoToday(),endDate:trip.endDate||trip.startDate||isoToday(),budget:String(trip.budget||''),travelers:String(trip.travelers||2),transport:trip.transport||'',accommodation:trip.accommodation||'',tripStyle:trip.tripStyle||'',status:trip.status||'วางแผน',origin:trip.origin||'',destinationSummary:trip.destinationSummary||'',note:trip.note||'',provinceIds:[...(trip.provinceIds||[])],routeText:trip.routeText||'',routeStopsText:joinLines(trip.routeStops),overviewBudgetMin:String(trip.overviewBudgetRange?.min??''),overviewBudgetMax:String(trip.overviewBudgetRange?.max??''),overviewBudgetLabel:trip.overviewBudgetRange?.label||'',attractionsText:joinLines(trip.attractionsSummary),budgetSummaryText:joinLines(trip.budgetSummaryLines),packingText:joinLines(trip.packingList),importantText:joinLines(trip.importantNotes),sourceText:trip.sourceText||'',
    budgetBreakdown:{transport:String(trip.budgetBreakdown?.transport??''),accommodation:String(trip.budgetBreakdown?.accommodation??''),food:String(trip.budgetBreakdown?.food??''),activities:String(trip.budgetBreakdown?.activities??''),other:String(trip.budgetBreakdown?.other??'')},
    days:(trip.days?.length?trip.days:[blankDay(1,trip.startDate)]).map((d,i)=>({...d,day:i+1,placeIds:[...(d.placeIds||[])],schedule:(d.schedule||[]).map(s=>({...s,activities:[...(s.activities||[])],notes:[...(s.notes||[])]})),budgetItems:(d.budgetItems||[]).map(x=>({...x}))})),
    accommodationPlan:(trip.accommodationPlan||[]).map(x=>({...x})),
    budgetTiers:(trip.budgetTiers||[]).map(x=>({...x})),
  };
};

export default function TripPlannerCore(){
  const {width}=useWindowDimensions();
  const wide=width>=980;
  const medium=width>=720;
  const {trips,createTrip,updateTrip,deleteTrip}=useTravelStore();
  const [editorOpen,setEditorOpen]=useState(false);
  const [draft,setDraft]=useState<Draft>(()=>toDraft());
  const [provinceSearch,setProvinceSearch]=useState('');
  const [placeSearch,setPlaceSearch]=useState<Record<number,string>>({});
  const [expandedDay,setExpandedDay]=useState(1);
  const pageIn=useRef(new Animated.Value(1)).current;

  const totalDays=trips.reduce((sum,t)=>sum+(t.days?.length||0),0);
  const totalBudget=trips.reduce((sum,t)=>sum+(t.budget||0),0);
  const selectedProvinceNames=draft.provinceIds.map(id=>PROVINCES.find(p=>p.id===id)?.nameTh).filter(Boolean) as string[];
  const provinceResults=useMemo(()=>{
    const q=provinceSearch.trim().toLowerCase();
    return PROVINCES.filter(p=>!q||`${p.nameTh} ${p.nameEn}`.toLowerCase().includes(q)).slice(0,q?16:12);
  },[provinceSearch]);

  const openNew=()=>{setDraft(toDraft());setExpandedDay(1);setProvinceSearch('');setPlaceSearch({});setEditorOpen(true)};
  const openEdit=(trip:Trip)=>{setDraft(toDraft(trip));setExpandedDay(1);setProvinceSearch('');setPlaceSearch({});setEditorOpen(true)};
  const closeEditor=()=>{setEditorOpen(false);setPlaceSearch({});};

  const setField=<K extends keyof Draft>(key:K,value:Draft[K])=>setDraft(d=>({...d,[key]:value}));
  const setBreakdown=(key:keyof TripBudgetBreakdown,value:string)=>setDraft(d=>({...d,budgetBreakdown:{...d.budgetBreakdown,[key]:value}}));
  const toggleProvince=(id:string)=>setDraft(d=>({...d,provinceIds:d.provinceIds.includes(id)?d.provinceIds.filter(x=>x!==id):[...d.provinceIds,id]}));

  const updateDay=(index:number,patch:Partial<TripDay>)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===index?{...day,...patch}:day)}));
  const addDay=()=>setDraft(d=>{
    const dayNo=d.days.length+1;
    const date=addDays(d.startDate,dayNo);
    return {...d,days:[...d.days,blankDay(dayNo,date)],endDate:date};
  });
  const removeDay=(index:number)=>setDraft(d=>{
    if(d.days.length<=1)return d;
    const next=d.days.filter((_,i)=>i!==index).map((day,i)=>({...day,day:i+1}));
    return {...d,days:next,endDate:addDays(d.startDate,next.length)};
  });
  const addSchedule=(dayIndex:number)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,schedule:[...(day.schedule||[]),blankSchedule()]}:day)}));
  const updateSchedule=(dayIndex:number,sIndex:number,patch:Partial<TripScheduleItem>)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,schedule:(day.schedule||[]).map((s,j)=>j===sIndex?{...s,...patch}:s)}:day)}));
  const removeSchedule=(dayIndex:number,sIndex:number)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,schedule:(day.schedule||[]).filter((_,j)=>j!==sIndex)}:day)}));
  const toggleDayPlace=(dayIndex:number,placeId:string)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,placeIds:(day.placeIds||[]).includes(placeId)?day.placeIds.filter(x=>x!==placeId):[...(day.placeIds||[]),placeId]}:day)}));

  const addBudgetItem=(dayIndex:number)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,budgetItems:[...(day.budgetItems||[]),{label:'',min:undefined,max:undefined,text:''}]}:day)}));
  const updateBudgetItem=(dayIndex:number,itemIndex:number,patch:Partial<TripDayBudgetItem>)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,budgetItems:(day.budgetItems||[]).map((item,j)=>j===itemIndex?{...item,...patch}:item)}:day)}));
  const removeBudgetItem=(dayIndex:number,itemIndex:number)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,budgetItems:(day.budgetItems||[]).filter((_,j)=>j!==itemIndex)}:day)}));

  const addAccommodationNight=()=>setDraft(d=>({...d,accommodationPlan:[...d.accommodationPlan,{night:d.accommodationPlan.length+1,location:''}]}));
  const updateAccommodationNight=(index:number,location:string)=>setDraft(d=>({...d,accommodationPlan:d.accommodationPlan.map((x,i)=>i===index?{...x,location}:x)}));
  const removeAccommodationNight=(index:number)=>setDraft(d=>({...d,accommodationPlan:d.accommodationPlan.filter((_,i)=>i!==index).map((x,i)=>({...x,night:i+1}))}));

  const addBudgetTier=()=>setDraft(d=>({...d,budgetTiers:[...d.budgetTiers,{label:'งบแนะนำ',min:undefined,max:undefined,perPerson:false,text:''}]}));
  const updateBudgetTier=(index:number,patch:Partial<TripBudgetTier>)=>setDraft(d=>({...d,budgetTiers:d.budgetTiers.map((x,i)=>i===index?{...x,...patch}:x)}));
  const removeBudgetTier=(index:number)=>setDraft(d=>({...d,budgetTiers:d.budgetTiers.filter((_,i)=>i!==index)}));

  const save=()=>{
    if(!draft.title.trim())return Alert.alert('ยังบันทึกไม่ได้','กรุณาใส่ชื่อทริป');
    if(!draft.startDate.trim())return Alert.alert('ยังบันทึกไม่ได้','กรุณาใส่วันเริ่มเดินทาง');
    if(!draft.days.length)return Alert.alert('ยังบันทึกไม่ได้','กรุณาเพิ่มอย่างน้อย 1 วัน');

    const normalizedDays=draft.days.map((day,i)=>({
      ...day,
      day:i+1,
      title:day.title?.trim()||`DAY ${i+1}`,
      placeIds:[...(day.placeIds||[])],
      schedule:(day.schedule||[]).filter(s=>s.title?.trim()||s.time?.trim()||s.detail?.trim()).map(s=>({...s,id:s.id||uid('schedule'),title:s.title?.trim()||'กิจกรรม',activities:[...(s.activities||[])],notes:[...(s.notes||[])]})),
      budgetItems:(day.budgetItems||[]).filter(x=>x.label?.trim()||x.text?.trim()||x.min||x.max),
    }));
    const breakdown:TripBudgetBreakdown={
      transport:num(draft.budgetBreakdown.transport)||undefined,
      accommodation:num(draft.budgetBreakdown.accommodation)||undefined,
      food:num(draft.budgetBreakdown.food)||undefined,
      activities:num(draft.budgetBreakdown.activities)||undefined,
      other:num(draft.budgetBreakdown.other)||undefined,
    };
    const trip:Trip={
      id:draft.id||uid('trip'),
      title:draft.title.trim(),
      startDate:draft.startDate.trim(),
      endDate:draft.endDate.trim()||addDays(draft.startDate,normalizedDays.length),
      budget:num(draft.budget),
      provinceIds:[...draft.provinceIds],
      days:normalizedDays,
      note:draft.note.trim()||undefined,
      travelers:Math.max(1,Number(draft.travelers)||1),
      transport:draft.transport.trim()||undefined,
      accommodation:draft.accommodation.trim()||undefined,
      tripStyle:draft.tripStyle.trim()||undefined,
      budgetBreakdown:breakdown,
      status:draft.status,
      origin:draft.origin.trim()||undefined,
      destinationSummary:draft.destinationSummary.trim()||undefined,
      autoFilled:false,
      autoFillSource:undefined,
      routeText:draft.routeText.trim()||undefined,
      routeStops:lines(draft.routeStopsText),
      overviewBudgetRange:moneyRange(draft.overviewBudgetMin,draft.overviewBudgetMax,draft.overviewBudgetLabel),
      attractionsSummary:lines(draft.attractionsText),
      accommodationPlan:draft.accommodationPlan.filter(x=>x.location.trim()).map((x,i)=>({...x,night:i+1,location:x.location.trim()})),
      budgetSummaryLines:lines(draft.budgetSummaryText),
      budgetTiers:draft.budgetTiers.filter(x=>x.label?.trim()||x.text?.trim()||x.min||x.max),
      packingList:lines(draft.packingText),
      importantNotes:lines(draft.importantText),
      sourceText:draft.sourceText.trim()||undefined,
      importMode:'manual',
    };
    if(draft.id)updateTrip(draft.id,trip); else createTrip(trip);
    setEditorOpen(false);
    Alert.alert('บันทึกแล้ว',draft.id?'แก้ไขทริปเรียบร้อยแล้ว':'สร้างทริปแบบทำเองเรียบร้อยแล้ว');
  };

  const confirmDelete=(trip:Trip)=>Alert.alert('ลบทริปนี้?','ข้อมูลทริปนี้จะถูกลบออกจากเครื่อง',[{text:'ยกเลิก',style:'cancel'},{text:'ลบ',style:'destructive',onPress:()=>deleteTrip(trip.id)}]);

  const editorHeader=<View style={s.editorHeader}>
    <View style={{flex:1}}>
      <Text style={s.kicker}>MANUAL TRIP EDITOR</Text>
      <Text style={s.editorTitle}>{draft.id?'แก้ไขทริปทั้งหมด':'สร้างทริปด้วยตัวเอง'}</Text>
      <Text style={s.editorSub}>ไม่มี Auto Fill · ไม่มีแยกข้อความอัตโนมัติ · ทุกช่องแก้เองได้</Text>
    </View>
    <Pressable style={s.closeButton} onPress={closeEditor}><Ionicons name="close" size={24} color={COLORS.text}/></Pressable>
  </View>;

  if(editorOpen){
    return <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.editorContent} keyboardShouldPersistTaps="handled">
        {editorHeader}

        <Section icon="information-circle-outline" title="ข้อมูลทริป" subtitle="แก้ข้อมูลพื้นฐานทั้งหมดได้โดยตรง">
          <Field label="ชื่อทริป"><Input value={draft.title} onChangeText={(v:string)=>setField('title',v)} placeholder="เช่น ศรีสะเกษ 5 วัน 4 คืน"/></Field>
          <View style={[s.row,wide&&s.rowWide]}>
            <View style={s.flex1}><Field label="วันเริ่ม"><Input value={draft.startDate} onChangeText={(v:string)=>setField('startDate',v)} placeholder="YYYY-MM-DD"/></Field></View>
            <View style={s.flex1}><Field label="วันสิ้นสุด"><Input value={draft.endDate} onChangeText={(v:string)=>setField('endDate',v)} placeholder="YYYY-MM-DD"/></Field></View>
            <View style={s.flex1}><Field label="จำนวนคน"><Input value={draft.travelers} onChangeText={(v:string)=>setField('travelers',v)} keyboardType="number-pad"/></Field></View>
          </View>
          <Field label="สถานะ"><ChipRow values={STATUS} selected={draft.status} onSelect={v=>setField('status',v as Draft['status'])}/></Field>
          <Field label="ต้นทาง"><Input value={draft.origin} onChangeText={(v:string)=>setField('origin',v)} placeholder="เช่น กรุงเทพฯ"/></Field>
          <Field label="ปลายทาง / สรุปพื้นที่"><Input value={draft.destinationSummary} onChangeText={(v:string)=>setField('destinationSummary',v)} placeholder="เช่น ศรีสะเกษ · ขุนหาญ · ภูสิงห์"/></Field>
          <Field label="รูปแบบการเดินทาง"><ChipRow values={TRANSPORTS} selected={draft.transport} onSelect={v=>setField('transport',v)}/><Input value={draft.transport} onChangeText={(v:string)=>setField('transport',v)} placeholder="หรือพิมพ์เอง"/></Field>
          <Field label="สไตล์ทริป"><ChipRow values={STYLES} selected={draft.tripStyle} onSelect={v=>setField('tripStyle',v)}/><Input value={draft.tripStyle} onChangeText={(v:string)=>setField('tripStyle',v)} placeholder="พิมพ์เองได้"/></Field>
          <Field label="ที่พักภาพรวม"><Input value={draft.accommodation} onChangeText={(v:string)=>setField('accommodation',v)} multiline placeholder="เช่น คืน 1-2 ตัวเมือง / คืน 3 ขุนหาญ"/></Field>
          <Field label="หมายเหตุภาพรวม"><Input value={draft.note} onChangeText={(v:string)=>setField('note',v)} multiline placeholder="หมายเหตุของทริป"/></Field>
        </Section>

        <Section icon="map-outline" title="จังหวัดและเส้นทาง" subtitle="เลือกและแก้เส้นทางเองทั้งหมด">
          <Field label="ค้นหาจังหวัด"><Input value={provinceSearch} onChangeText={setProvinceSearch} placeholder="ค้นหาจังหวัด..."/></Field>
          {!!selectedProvinceNames.length&&<View style={s.selectedWrap}>{selectedProvinceNames.map(name=><View key={name} style={s.selectedBadge}><Ionicons name="location" size={14} color={COLORS.primary}/><Text style={s.selectedBadgeText}>{name}</Text></View>)}</View>}
          <View style={s.provinceGrid}>{provinceResults.map(p=>{
            const active=draft.provinceIds.includes(p.id);
            return <Pressable key={p.id} onPress={()=>toggleProvince(p.id)} style={[s.provinceChip,active&&s.provinceChipActive]}><Text style={[s.provinceChipText,active&&s.provinceChipTextActive]}>{p.nameTh}</Text>{active&&<Ionicons name="checkmark-circle" size={16} color={COLORS.primary}/>}</Pressable>
          })}</View>
          <Field label="เส้นทางหลัก"><Input value={draft.routeText} onChangeText={(v:string)=>setField('routeText',v)} multiline placeholder="กรุงเทพฯ → ศรีสะเกษ → ขุนหาญ → กรุงเทพฯ"/></Field>
          <Field label="จุดตามเส้นทาง (1 บรรทัดต่อ 1 จุด)"><Input value={draft.routeStopsText} onChangeText={(v:string)=>setField('routeStopsText',v)} multiline placeholder={'กรุงเทพฯ\nตัวเมืองศรีสะเกษ\nขุนหาญ\nกรุงเทพฯ'}/></Field>
        </Section>

        <Section icon="wallet-outline" title="งบประมาณ" subtitle="กรอกเองได้ทั้งงบรวม ช่วงงบ และแยกหมวด">
          <Field label="งบรวม"><Input value={draft.budget} onChangeText={(v:string)=>setField('budget',v)} keyboardType="number-pad" placeholder="เช่น 18000"/></Field>
          <View style={[s.row,medium&&s.rowWide]}>
            <View style={s.flex1}><Field label="ช่วงงบขั้นต่ำ"><Input value={draft.overviewBudgetMin} onChangeText={(v:string)=>setField('overviewBudgetMin',v)} keyboardType="number-pad"/></Field></View>
            <View style={s.flex1}><Field label="ช่วงงบสูงสุด"><Input value={draft.overviewBudgetMax} onChangeText={(v:string)=>setField('overviewBudgetMax',v)} keyboardType="number-pad"/></Field></View>
          </View>
          <Field label="คำอธิบายช่วงงบ"><Input value={draft.overviewBudgetLabel} onChangeText={(v:string)=>setField('overviewBudgetLabel',v)} placeholder="เช่น งบแนะนำสำหรับ 2 คน"/></Field>
          <View style={s.budgetGrid}>{BUDGET_FIELDS.map(([key,label,icon])=><View key={key} style={s.budgetBox}><Ionicons name={icon as any} size={18} color={COLORS.primary}/><Text style={s.budgetBoxLabel}>{label}</Text><TextInput value={draft.budgetBreakdown[key]} onChangeText={v=>setBreakdown(key,v)} keyboardType="number-pad" placeholder="0" placeholderTextColor={COLORS.textMuted} style={s.budgetMiniInput}/></View>)}</View>
          <Field label="สรุปงบเพิ่มเติม (1 บรรทัดต่อรายการ)"><Input value={draft.budgetSummaryText} onChangeText={(v:string)=>setField('budgetSummaryText',v)} multiline/></Field>

          <SubHeader title="ระดับงบ" action="เพิ่มระดับงบ" onPress={addBudgetTier}/>
          {draft.budgetTiers.map((tier,i)=><View key={`tier-${i}`} style={s.subCard}>
            <View style={s.subCardTop}><Text style={s.subCardTitle}>ระดับงบ {i+1}</Text><IconDelete onPress={()=>removeBudgetTier(i)}/></View>
            <Input value={tier.label||''} onChangeText={(v:string)=>updateBudgetTier(i,{label:v})} placeholder="ชื่อ เช่น งบประหยัด"/>
            <View style={[s.row,medium&&s.rowWide]}><View style={s.flex1}><Input value={String(tier.min??'')} onChangeText={(v:string)=>updateBudgetTier(i,{min:num(v)||undefined})} keyboardType="number-pad" placeholder="ขั้นต่ำ"/></View><View style={s.flex1}><Input value={String(tier.max??'')} onChangeText={(v:string)=>updateBudgetTier(i,{max:num(v)||undefined})} keyboardType="number-pad" placeholder="สูงสุด"/></View></View>
            <Pressable onPress={()=>updateBudgetTier(i,{perPerson:!tier.perPerson})} style={[s.checkRow,tier.perPerson&&s.checkRowActive]}><Ionicons name={tier.perPerson?'checkbox':'square-outline'} size={19} color={tier.perPerson?COLORS.primary:COLORS.textMuted}/><Text style={s.checkText}>คิดต่อคน</Text></Pressable>
            <Input value={tier.text||''} onChangeText={(v:string)=>updateBudgetTier(i,{text:v})} multiline placeholder="รายละเอียดเพิ่มเติม"/>
          </View>)}
        </Section>

        <Section icon="calendar-outline" title={`แผนรายวัน (${draft.days.length} วัน)`} subtitle="เพิ่ม/ลบ/แก้ DAY, เวลา, สถานที่ และกิจกรรมได้ทุกจุด">
          {draft.days.map((day,dayIndex)=>{
            const open=expandedDay===dayIndex+1;
            const q=(placeSearch[dayIndex]||'').trim().toLowerCase();
            const placeOptions=PLACES.filter(p=>(!draft.provinceIds.length||draft.provinceIds.includes(p.provinceId))&&(!q||`${p.name} ${p.province}`.toLowerCase().includes(q))).slice(0,q?12:8);
            return <View key={`day-${dayIndex}`} style={s.dayCard}>
              <Pressable style={s.dayHeader} onPress={()=>setExpandedDay(open?0:dayIndex+1)}>
                <View style={s.dayNumber}><Text style={s.dayNumberText}>{dayIndex+1}</Text></View>
                <View style={s.flex1}><Text style={s.dayTitleText}>{day.title||`DAY ${dayIndex+1}`}</Text><Text style={s.dayMeta}>{day.date||'-'} · {(day.schedule||[]).length} ช่วงเวลา</Text></View>
                <Ionicons name={open?'chevron-up':'chevron-down'} size={20} color={COLORS.text}/>
              </Pressable>
              {open&&<View style={s.dayBody}>
                <View style={[s.row,medium&&s.rowWide]}><View style={s.flex1}><Field label="ชื่อ DAY"><Input value={day.title||''} onChangeText={(v:string)=>updateDay(dayIndex,{title:v})}/></Field></View><View style={s.flex1}><Field label="วันที่"><Input value={day.date||''} onChangeText={(v:string)=>updateDay(dayIndex,{date:v})} placeholder="YYYY-MM-DD"/></Field></View></View>
                <Field label="เส้นทางวันนี้"><Input value={day.route||''} onChangeText={(v:string)=>updateDay(dayIndex,{route:v})} multiline/></Field>
                <Field label="หมายเหตุวันนี้"><Input value={day.note||''} onChangeText={(v:string)=>updateDay(dayIndex,{note:v})} multiline/></Field>
                <Field label="ที่พักคืนนี้"><Input value={day.accommodation||''} onChangeText={(v:string)=>updateDay(dayIndex,{accommodation:v})}/></Field>
                <View style={[s.row,medium&&s.rowWide]}><View style={s.flex1}><Field label="งบวันนี้ขั้นต่ำ"><Input value={String(day.budgetRange?.min??'')} onChangeText={(v:string)=>updateDay(dayIndex,{budgetRange:{...(day.budgetRange||{}),min:num(v)||undefined}})} keyboardType="number-pad"/></Field></View><View style={s.flex1}><Field label="งบวันนี้สูงสุด"><Input value={String(day.budgetRange?.max??'')} onChangeText={(v:string)=>updateDay(dayIndex,{budgetRange:{...(day.budgetRange||{}),max:num(v)||undefined}})} keyboardType="number-pad"/></Field></View></View>

                <SubHeader title="สถานที่ของวันนี้"/>
                <Input value={placeSearch[dayIndex]||''} onChangeText={(v:string)=>setPlaceSearch(x=>({...x,[dayIndex]:v}))} placeholder="ค้นหาสถานที่..."/>
                {!!day.placeIds?.length&&<View style={s.selectedWrap}>{day.placeIds.map(id=>{const p=PLACES.find(x=>x.id===id);return p?<Pressable key={id} onPress={()=>toggleDayPlace(dayIndex,id)} style={s.selectedBadge}><Text style={s.selectedBadgeText}>{p.name}</Text><Ionicons name="close-circle" size={14} color={COLORS.textMuted}/></Pressable>:null})}</View>}
                <View style={s.provinceGrid}>{placeOptions.map(p=>{const active=day.placeIds?.includes(p.id);return <Pressable key={p.id} onPress={()=>toggleDayPlace(dayIndex,p.id)} style={[s.provinceChip,active&&s.provinceChipActive]}><Text numberOfLines={1} style={[s.provinceChipText,active&&s.provinceChipTextActive]}>{p.name}</Text></Pressable>})}</View>

                <SubHeader title="ตารางเวลา / กิจกรรม" action="เพิ่มช่วงเวลา" onPress={()=>addSchedule(dayIndex)}/>
                {(day.schedule||[]).map((item,sIndex)=><View key={item.id||`schedule-${sIndex}`} style={s.scheduleCard}>
                  <View style={s.subCardTop}><Text style={s.subCardTitle}>ช่วงที่ {sIndex+1}</Text><IconDelete onPress={()=>removeSchedule(dayIndex,sIndex)}/></View>
                  <View style={[s.row,medium&&s.rowWide]}><View style={{width:medium?150:undefined,flex:medium?0:1}}><Field label="เวลา"><Input value={item.time||''} onChangeText={(v:string)=>updateSchedule(dayIndex,sIndex,{time:v})} placeholder="09.00–10.00"/></Field></View><View style={s.flex1}><Field label="หัวข้อ / สถานที่"><Input value={item.title||''} onChangeText={(v:string)=>updateSchedule(dayIndex,sIndex,{title:v})} placeholder="เช่น วัดล้านขวด"/></Field></View></View>
                  <Field label="รายละเอียด"><Input value={item.detail||''} onChangeText={(v:string)=>updateSchedule(dayIndex,sIndex,{detail:v})} multiline/></Field>
                  <Field label="กิจกรรม (1 บรรทัดต่อรายการ)"><Input value={joinLines(item.activities)} onChangeText={(v:string)=>updateSchedule(dayIndex,sIndex,{activities:lines(v)})} multiline placeholder={'ไหว้พระ\nเดินชมวัด\nถ่ายรูป'}/></Field>
                  <Field label="หมายเหตุ / ข้อควรระวัง (1 บรรทัดต่อรายการ)"><Input value={joinLines(item.notes)} onChangeText={(v:string)=>updateSchedule(dayIndex,sIndex,{notes:lines(v)})} multiline/></Field>
                </View>)}

                <SubHeader title="งบรายวันแบบแยกรายการ" action="เพิ่มรายการงบ" onPress={()=>addBudgetItem(dayIndex)}/>
                {(day.budgetItems||[]).map((item,itemIndex)=><View key={`budget-${itemIndex}`} style={s.subCard}>
                  <View style={s.subCardTop}><Text style={s.subCardTitle}>รายการ {itemIndex+1}</Text><IconDelete onPress={()=>removeBudgetItem(dayIndex,itemIndex)}/></View>
                  <Input value={item.label||''} onChangeText={(v:string)=>updateBudgetItem(dayIndex,itemIndex,{label:v})} placeholder="เช่น ที่พัก / อาหาร / น้ำมัน"/>
                  <View style={[s.row,medium&&s.rowWide]}><View style={s.flex1}><Input value={String(item.min??'')} onChangeText={(v:string)=>updateBudgetItem(dayIndex,itemIndex,{min:num(v)||undefined})} keyboardType="number-pad" placeholder="ขั้นต่ำ"/></View><View style={s.flex1}><Input value={String(item.max??'')} onChangeText={(v:string)=>updateBudgetItem(dayIndex,itemIndex,{max:num(v)||undefined})} keyboardType="number-pad" placeholder="สูงสุด"/></View></View>
                  <Input value={item.text||''} onChangeText={(v:string)=>updateBudgetItem(dayIndex,itemIndex,{text:v})} multiline placeholder="รายละเอียด"/>
                </View>)}

                <Pressable style={s.removeDayButton} onPress={()=>removeDay(dayIndex)}><Ionicons name="trash-outline" size={17} color={COLORS.danger}/><Text style={s.removeDayText}>ลบ DAY {dayIndex+1}</Text></Pressable>
              </View>}
            </View>
          })}
          <Pressable style={s.addDayButton} onPress={addDay}><Ionicons name="add-circle" size={20} color={COLORS.primary}/><Text style={s.addDayText}>เพิ่ม DAY ใหม่</Text></Pressable>
        </Section>

        <Section icon="bed-outline" title="สรุปที่พักรายคืน" subtitle="แก้ตำแหน่งพักแต่ละคืนเอง">
          <SubHeader title="คืนที่พัก" action="เพิ่มคืน" onPress={addAccommodationNight}/>
          {draft.accommodationPlan.map((night,i)=><View key={`night-${i}`} style={s.inlineItem}><View style={s.inlineNumber}><Text style={s.inlineNumberText}>{i+1}</Text></View><TextInput style={[s.input,s.flex1]} value={night.location} onChangeText={v=>updateAccommodationNight(i,v)} placeholder="เช่น ตัวเมืองศรีสะเกษ" placeholderTextColor={COLORS.textMuted}/><IconDelete onPress={()=>removeAccommodationNight(i)}/></View>)}
        </Section>

        <Section icon="list-outline" title="สรุปและ Checklist" subtitle="ทุกส่วนเป็นข้อความที่แก้เองได้">
          <Field label="สรุปสถานที่เที่ยว (1 บรรทัดต่อ 1 ที่)"><Input value={draft.attractionsText} onChangeText={(v:string)=>setField('attractionsText',v)} multiline/></Field>
          <Field label="ของที่ควรเตรียม (1 บรรทัดต่อ 1 รายการ)"><Input value={draft.packingText} onChangeText={(v:string)=>setField('packingText',v)} multiline/></Field>
          <Field label="หมายเหตุสำคัญ (1 บรรทัดต่อ 1 รายการ)"><Input value={draft.importantText} onChangeText={(v:string)=>setField('importantText',v)} multiline/></Field>
          <Field label="ข้อความต้นฉบับ / ข้อมูลเก่าที่ต้องการเก็บ"><Input value={draft.sourceText} onChangeText={(v:string)=>setField('sourceText',v)} multiline placeholder="เก็บข้อความเดิมไว้แก้เองได้ แต่ระบบจะไม่แยกให้อัตโนมัติ"/></Field>
        </Section>

        <View style={s.stickyActions}>
          <Pressable style={s.cancelButton} onPress={closeEditor}><Text style={s.cancelText}>ยกเลิก</Text></Pressable>
          <Pressable style={s.saveButton} onPress={save}><Ionicons name="save-outline" size={19} color="#fff"/><Text style={s.saveText}>{draft.id?'บันทึกการแก้ไขทั้งหมด':'บันทึกทริป'}</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>;
  }

  return <SafeAreaView style={s.safe} edges={['top']}>
    <Animated.View style={[s.page,{opacity:pageIn}]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <View style={s.hero}>
          <View style={s.heroIcon}><Ionicons name="map" size={25} color={COLORS.primary}/></View>
          <View style={s.flex1}><Text style={s.kicker}>MANUAL TRIP PLANNER</Text><Text style={s.heroTitle}>แผนการเดินทาง</Text><Text style={s.heroSub}>สร้างเอง · แก้เอง · คุมรายละเอียดทุกจุด ไม่มีระบบเติมหรือแยกแผนอัตโนมัติ</Text></View>
          <Pressable style={s.heroButton} onPress={openNew}><Ionicons name="add" size={21} color="#fff"/><Text style={s.heroButtonText}>สร้างทริปเอง</Text></Pressable>
        </View>

        <View style={s.statsRow}>
          <Stat icon="briefcase-outline" label="ทริป" value={String(trips.length)}/>
          <Stat icon="calendar-outline" label="วันเที่ยว" value={String(totalDays)}/>
          <Stat icon="wallet-outline" label="งบรวม" value={`${totalBudget.toLocaleString()}฿`}/>
        </View>

        <View style={s.notice}>
          <Ionicons name="create-outline" size={22} color={COLORS.primary}/>
          <View style={s.flex1}><Text style={s.noticeTitle}>เปลี่ยนเป็น Manual Editor แล้ว</Text><Text style={s.noticeText}>Auto Fill และ “แยกแผนอัตโนมัติ” ถูกถอดออกจากการใช้งาน ทริปเดิมยังอยู่ครบและกด “แก้ไขทั้งหมด” เพื่อแก้ทุกส่วนได้</Text></View>
        </View>

        {!trips.length?<View style={s.empty}>
          <View style={s.emptyIcon}><Ionicons name="create-outline" size={35} color={COLORS.primary}/></View>
          <Text style={s.emptyTitle}>ยังไม่มีแผนทริป</Text>
          <Text style={s.emptyText}>เริ่มสร้าง DAY และรายละเอียดแต่ละช่วงเวลาด้วยตัวเองได้เลย</Text>
          <Pressable style={s.saveButton} onPress={openNew}><Ionicons name="add" size={19} color="#fff"/><Text style={s.saveText}>สร้างทริปแรก</Text></Pressable>
        </View>:<View style={s.tripList}>{trips.map(trip=><TripCard key={trip.id} trip={trip} onEdit={()=>openEdit(trip)} onDelete={()=>confirmDelete(trip)}/>)}</View>}
      </ScrollView>
    </Animated.View>
  </SafeAreaView>;
}

function TripCard({trip,onEdit,onDelete}:{trip:Trip;onEdit:()=>void;onDelete:()=>void}){
  const [open,setOpen]=useState(false);
  const provinceNames=trip.provinceIds.map(id=>PROVINCES.find(p=>p.id===id)?.nameTh).filter(Boolean).join(' · ');
  return <View style={s.tripCard}>
    <View style={s.tripTop}>
      <View style={s.tripBadge}><Ionicons name="create" size={16} color={COLORS.primary}/></View>
      <View style={s.flex1}><Text style={s.tripTitle}>{trip.title}</Text><Text style={s.tripMeta}>{trip.startDate} → {trip.endDate} · {trip.days.length} วัน · {trip.travelers||1} คน</Text></View>
      <View style={s.statusPill}><Text style={s.statusText}>{trip.status||'วางแผน'}</Text></View>
    </View>
    {!!provinceNames&&<Text style={s.tripProvince}>{provinceNames}</Text>}
    {!!trip.routeText&&<View style={s.routePreview}><Ionicons name="git-branch-outline" size={16} color={COLORS.primary}/><Text style={s.routePreviewText}>{trip.routeText}</Text></View>}
    <View style={s.tripMetrics}><Metric label="งบ" value={`${(trip.budget||0).toLocaleString()}฿`}/><Metric label="ที่พัก" value={trip.accommodationPlan?.length?`${trip.accommodationPlan.length} คืน`:trip.accommodation||'-'}/><Metric label="ช่วงเวลา" value={String(trip.days.reduce((sum,d)=>sum+(d.schedule?.length||0),0))}/></View>

    {open&&<View style={s.previewBody}>
      {trip.days.map(day=><View key={day.day} style={s.previewDay}><View style={s.previewDayNo}><Text style={s.previewDayNoText}>{day.day}</Text></View><View style={s.flex1}><Text style={s.previewDayTitle}>{day.title||`DAY ${day.day}`}</Text>{(day.schedule||[]).slice(0,5).map(item=><View key={item.id} style={s.previewSchedule}><Text style={s.previewTime}>{item.time||'--:--'}</Text><Text style={s.previewScheduleText}>{item.title}</Text></View>)}{(day.schedule?.length||0)>5&&<Text style={s.moreText}>+ อีก {(day.schedule?.length||0)-5} รายการ</Text>}</View></View>)}
      {!!trip.packingList?.length&&<View style={s.previewSection}><Text style={s.previewSectionTitle}>ของที่ควรเตรียม</Text><Text style={s.previewText}>{trip.packingList.join(' · ')}</Text></View>}
      {!!trip.importantNotes?.length&&<View style={s.previewSection}><Text style={s.previewSectionTitle}>หมายเหตุสำคัญ</Text><Text style={s.previewText}>{trip.importantNotes.join('\n')}</Text></View>}
    </View>}

    <View style={s.cardActions}>
      <Pressable style={s.expandButton} onPress={()=>setOpen(v=>!v)}><Ionicons name={open?'chevron-up':'eye-outline'} size={18} color={COLORS.primary}/><Text style={s.expandText}>{open?'ย่อ':'ดูแผน'}</Text></Pressable>
      <Pressable style={s.editButton} onPress={onEdit}><Ionicons name="create-outline" size={18} color="#fff"/><Text style={s.editButtonText}>แก้ไขทั้งหมด</Text></Pressable>
      <Pressable style={s.deleteButton} onPress={onDelete}><Ionicons name="trash-outline" size={18} color={COLORS.danger}/></Pressable>
    </View>
  </View>;
}

function Section({icon,title,subtitle,children}:{icon:string;title:string;subtitle?:string;children:React.ReactNode}){
  return <View style={s.section}>
    <View style={s.sectionHead}><View style={s.sectionIcon}><Ionicons name={icon as any} size={20} color={COLORS.primary}/></View><View style={s.flex1}><Text style={s.sectionTitle}>{title}</Text>{!!subtitle&&<Text style={s.sectionSub}>{subtitle}</Text>}</View></View>
    <View style={s.sectionBody}>{children}</View>
  </View>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <View style={s.field}><Text style={s.label}>{label}</Text>{children}</View>}
function Input(props:any){return <TextInput {...props} placeholderTextColor={COLORS.textMuted} style={[s.input,props.multiline&&s.inputMulti,props.style]} textAlignVertical={props.multiline?'top':'center'}/>}
function ChipRow({values,selected,onSelect}:{values:string[];selected:string;onSelect:(v:string)=>void}){return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>{values.map(v=><Pressable key={v} onPress={()=>onSelect(v)} style={[s.choiceChip,selected===v&&s.choiceChipActive]}><Text style={[s.choiceText,selected===v&&s.choiceTextActive]}>{v}</Text></Pressable>)}</ScrollView>}
function SubHeader({title,action,onPress}:{title:string;action?:string;onPress?:()=>void}){return <View style={s.subHeader}><Text style={s.subHeaderTitle}>{title}</Text>{!!action&&<Pressable onPress={onPress} style={s.subHeaderAction}><Ionicons name="add" size={16} color={COLORS.primary}/><Text style={s.subHeaderActionText}>{action}</Text></Pressable>}</View>}
function IconDelete({onPress}:{onPress:()=>void}){return <Pressable onPress={onPress} style={s.iconDelete}><Ionicons name="trash-outline" size={17} color={COLORS.danger}/></Pressable>}
function Stat({icon,label,value}:{icon:string;label:string;value:string}){return <View style={s.stat}><Ionicons name={icon as any} size={19} color={COLORS.primary}/><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text numberOfLines={1} style={s.metricValue}>{value}</Text></View>}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'transparent'},
  page:{flex:1},scroll:{flex:1},content:{padding:SPACING.lg,paddingBottom:120,gap:14,maxWidth:1180,width:'100%',alignSelf:'center'},editorContent:{padding:SPACING.lg,paddingBottom:150,gap:14,maxWidth:1180,width:'100%',alignSelf:'center'},
  flex1:{flex:1},row:{gap:10},rowWide:{flexDirection:'row'},
  kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.5,color:COLORS.primary},
  hero:{padding:20,borderRadius:28,backgroundColor:'rgba(255,255,255,.78)',borderWidth:1,borderColor:'rgba(255,255,255,.72)',flexDirection:'row',alignItems:'center',gap:14,...SHADOW.card},
  heroIcon:{width:52,height:52,borderRadius:18,backgroundColor:'rgba(232,246,246,.9)',alignItems:'center',justifyContent:'center'},heroTitle:{fontSize:30,fontWeight:'900',color:COLORS.text,letterSpacing:-.5,marginTop:2},heroSub:{color:COLORS.textMuted,lineHeight:20,marginTop:3,maxWidth:650},heroButton:{minHeight:48,borderRadius:16,paddingHorizontal:17,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},heroButtonText:{color:'#fff',fontWeight:'900'},
  statsRow:{flexDirection:'row',gap:10},stat:{flex:1,minHeight:96,borderRadius:20,backgroundColor:'rgba(255,255,255,.72)',borderWidth:1,borderColor:'rgba(255,255,255,.65)',padding:14,alignItems:'center',justifyContent:'center'},statValue:{fontSize:21,fontWeight:'900',color:COLORS.text,marginTop:3},statLabel:{fontSize:11,fontWeight:'800',color:COLORS.textMuted,marginTop:2},
  notice:{padding:16,borderRadius:20,backgroundColor:'rgba(232,246,246,.82)',borderWidth:1,borderColor:'rgba(255,255,255,.66)',flexDirection:'row',gap:11,alignItems:'flex-start'},noticeTitle:{fontWeight:'900',color:COLORS.text,fontSize:16},noticeText:{color:COLORS.textMuted,lineHeight:20,marginTop:3},
  empty:{padding:30,borderRadius:26,backgroundColor:'rgba(255,255,255,.72)',borderWidth:1,borderColor:'rgba(255,255,255,.66)',alignItems:'center',gap:9},emptyIcon:{width:62,height:62,borderRadius:22,backgroundColor:'rgba(232,246,246,.9)',alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:21,fontWeight:'900',color:COLORS.text},emptyText:{color:COLORS.textMuted,textAlign:'center',marginBottom:7},tripList:{gap:12},
  editorHeader:{padding:18,borderRadius:24,backgroundColor:'rgba(255,255,255,.8)',borderWidth:1,borderColor:'rgba(255,255,255,.7)',flexDirection:'row',alignItems:'center',gap:12,...SHADOW.card},editorTitle:{fontSize:27,fontWeight:'900',color:COLORS.text,marginTop:2},editorSub:{color:COLORS.textMuted,lineHeight:19,marginTop:2},closeButton:{width:42,height:42,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.65)'},
  section:{borderRadius:24,backgroundColor:'rgba(255,255,255,.76)',borderWidth:1,borderColor:'rgba(255,255,255,.7)',overflow:'hidden',...SHADOW.card},sectionHead:{padding:16,flexDirection:'row',alignItems:'center',gap:11,borderBottomWidth:1,borderBottomColor:'rgba(7,61,75,.08)'},sectionIcon:{width:38,height:38,borderRadius:13,backgroundColor:'rgba(232,246,246,.9)',alignItems:'center',justifyContent:'center'},sectionTitle:{fontSize:18,fontWeight:'900',color:COLORS.text},sectionSub:{fontSize:12,color:COLORS.textMuted,lineHeight:17,marginTop:2},sectionBody:{padding:16,gap:12},
  field:{gap:6},label:{fontSize:12,fontWeight:'900',color:COLORS.text},input:{minHeight:48,borderRadius:15,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.82)',paddingHorizontal:13,paddingVertical:10,color:COLORS.text,fontSize:15,fontWeight:'700'},inputMulti:{minHeight:96,lineHeight:21},
  chipRow:{gap:8,paddingVertical:2},choiceChip:{minHeight:38,paddingHorizontal:13,borderRadius:999,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.68)',alignItems:'center',justifyContent:'center'},choiceChipActive:{backgroundColor:'rgba(232,246,246,.95)',borderColor:COLORS.primary},choiceText:{fontSize:12,fontWeight:'800',color:COLORS.textMuted},choiceTextActive:{color:COLORS.primary},
  selectedWrap:{flexDirection:'row',flexWrap:'wrap',gap:7},selectedBadge:{minHeight:32,paddingHorizontal:10,borderRadius:999,backgroundColor:'rgba(232,246,246,.95)',borderWidth:1,borderColor:'rgba(7,61,75,.09)',flexDirection:'row',alignItems:'center',gap:5},selectedBadgeText:{fontSize:11,fontWeight:'900',color:COLORS.text},provinceGrid:{flexDirection:'row',flexWrap:'wrap',gap:7},provinceChip:{maxWidth:220,minHeight:36,paddingHorizontal:11,borderRadius:12,backgroundColor:'rgba(255,255,255,.65)',borderWidth:1,borderColor:'rgba(7,61,75,.1)',flexDirection:'row',alignItems:'center',gap:5},provinceChipActive:{backgroundColor:'rgba(232,246,246,.95)',borderColor:COLORS.primary},provinceChipText:{fontSize:11,fontWeight:'800',color:COLORS.textMuted,maxWidth:180},provinceChipTextActive:{color:COLORS.primary},
  budgetGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},budgetBox:{minWidth:150,flexGrow:1,flexBasis:160,borderRadius:17,padding:12,backgroundColor:'rgba(255,255,255,.66)',borderWidth:1,borderColor:'rgba(7,61,75,.08)'},budgetBoxLabel:{fontSize:11,fontWeight:'900',color:COLORS.textMuted,marginTop:5},budgetMiniInput:{fontSize:18,fontWeight:'900',color:COLORS.text,paddingVertical:6,borderBottomWidth:1,borderBottomColor:'rgba(7,61,75,.12)'},
  subHeader:{minHeight:40,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,marginTop:2},subHeaderTitle:{fontSize:14,fontWeight:'900',color:COLORS.text},subHeaderAction:{minHeight:34,paddingHorizontal:10,borderRadius:11,backgroundColor:'rgba(232,246,246,.9)',flexDirection:'row',alignItems:'center',gap:4},subHeaderActionText:{fontSize:11,fontWeight:'900',color:COLORS.primary},subCard:{padding:13,borderRadius:17,backgroundColor:'rgba(255,255,255,.62)',borderWidth:1,borderColor:'rgba(7,61,75,.08)',gap:9},subCardTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},subCardTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},iconDelete:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.75)'},checkRow:{minHeight:40,paddingHorizontal:11,borderRadius:12,backgroundColor:'rgba(255,255,255,.55)',flexDirection:'row',alignItems:'center',gap:7},checkRowActive:{backgroundColor:'rgba(232,246,246,.88)'},checkText:{fontSize:12,fontWeight:'800',color:COLORS.text},
  dayCard:{borderRadius:20,borderWidth:1,borderColor:'rgba(7,61,75,.1)',backgroundColor:'rgba(255,255,255,.67)',overflow:'hidden'},dayHeader:{minHeight:66,padding:12,flexDirection:'row',alignItems:'center',gap:10},dayNumber:{width:40,height:40,borderRadius:14,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},dayNumberText:{color:'#fff',fontWeight:'900'},dayTitleText:{fontSize:15,fontWeight:'900',color:COLORS.text},dayMeta:{fontSize:11,color:COLORS.textMuted,marginTop:2},dayBody:{padding:12,paddingTop:4,gap:11,borderTopWidth:1,borderTopColor:'rgba(7,61,75,.07)'},scheduleCard:{padding:13,borderRadius:17,backgroundColor:'rgba(232,246,246,.62)',borderWidth:1,borderColor:'rgba(7,61,75,.08)',gap:9},addDayButton:{height:48,borderRadius:15,borderWidth:1,borderStyle:'dashed',borderColor:COLORS.primary,backgroundColor:'rgba(232,246,246,.6)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},addDayText:{fontWeight:'900',color:COLORS.primary},removeDayButton:{height:42,borderRadius:13,backgroundColor:'rgba(255,255,255,.62)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},removeDayText:{fontSize:12,fontWeight:'900',color:COLORS.danger},
  inlineItem:{flexDirection:'row',alignItems:'center',gap:8},inlineNumber:{width:34,height:34,borderRadius:11,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},inlineNumberText:{fontSize:12,fontWeight:'900',color:'#fff'},
  stickyActions:{flexDirection:'row',gap:10,padding:12,borderRadius:20,backgroundColor:'rgba(255,255,255,.82)',borderWidth:1,borderColor:'rgba(255,255,255,.72)'},cancelButton:{height:50,paddingHorizontal:20,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.68)',borderWidth:1,borderColor:'rgba(7,61,75,.1)'},cancelText:{fontWeight:'900',color:COLORS.text},saveButton:{minHeight:50,flex:1,paddingHorizontal:18,borderRadius:15,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},saveText:{color:'#fff',fontWeight:'900'},
  tripCard:{padding:16,borderRadius:24,backgroundColor:'rgba(255,255,255,.76)',borderWidth:1,borderColor:'rgba(255,255,255,.7)',gap:11,...SHADOW.card},tripTop:{flexDirection:'row',alignItems:'center',gap:10},tripBadge:{width:42,height:42,borderRadius:14,backgroundColor:'rgba(232,246,246,.9)',alignItems:'center',justifyContent:'center'},tripTitle:{fontSize:18,fontWeight:'900',color:COLORS.text},tripMeta:{fontSize:11,color:COLORS.textMuted,marginTop:2},statusPill:{paddingHorizontal:9,height:28,borderRadius:999,backgroundColor:'rgba(232,246,246,.9)',alignItems:'center',justifyContent:'center'},statusText:{fontSize:10,fontWeight:'900',color:COLORS.primary},tripProvince:{fontSize:12,fontWeight:'800',color:COLORS.textMuted},routePreview:{padding:10,borderRadius:13,backgroundColor:'rgba(232,246,246,.65)',flexDirection:'row',gap:7,alignItems:'flex-start'},routePreviewText:{flex:1,fontSize:12,fontWeight:'700',color:COLORS.text,lineHeight:18},tripMetrics:{flexDirection:'row',gap:8},metric:{flex:1,padding:10,borderRadius:14,backgroundColor:'rgba(255,255,255,.62)'},metricLabel:{fontSize:9,fontWeight:'900',color:COLORS.textMuted},metricValue:{fontSize:13,fontWeight:'900',color:COLORS.text,marginTop:3},cardActions:{flexDirection:'row',gap:8},expandButton:{height:44,paddingHorizontal:14,borderRadius:13,backgroundColor:'rgba(232,246,246,.8)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},expandText:{fontSize:12,fontWeight:'900',color:COLORS.primary},editButton:{height:44,flex:1,borderRadius:13,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},editButtonText:{color:'#fff',fontWeight:'900'},deleteButton:{width:44,height:44,borderRadius:13,backgroundColor:'rgba(255,255,255,.65)',alignItems:'center',justifyContent:'center'},
  previewBody:{gap:10,paddingTop:4,borderTopWidth:1,borderTopColor:'rgba(7,61,75,.08)'},previewDay:{flexDirection:'row',gap:10,paddingTop:10},previewDayNo:{width:34,height:34,borderRadius:11,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},previewDayNoText:{fontSize:11,fontWeight:'900',color:'#fff'},previewDayTitle:{fontSize:13,fontWeight:'900',color:COLORS.text,marginBottom:5},previewSchedule:{flexDirection:'row',gap:8,paddingVertical:3},previewTime:{width:75,fontSize:10,fontWeight:'900',color:COLORS.primary},previewScheduleText:{flex:1,fontSize:11,fontWeight:'700',color:COLORS.text},moreText:{fontSize:10,fontWeight:'800',color:COLORS.textMuted,marginTop:3},previewSection:{padding:10,borderRadius:13,backgroundColor:'rgba(255,255,255,.55)'},previewSectionTitle:{fontSize:11,fontWeight:'900',color:COLORS.text},previewText:{fontSize:11,color:COLORS.textMuted,lineHeight:18,marginTop:4},
});
