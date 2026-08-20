import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PLACES, PROVINCES } from '@/data/catalog';
import { COLORS, SHADOW } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';
import type {
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
const TRANSPORTS=['รถยนต์ส่วนตัว','รถไฟ','เครื่องบิน','รถบัส','มอเตอร์ไซค์'];
const TRIP_STYLES=['ชิล ๆ','ธรรมชาติ','คาเฟ่','วัฒนธรรม','กินเที่ยว','ครอบครัว'];
const BUDGET_FIELDS:[keyof TripBudgetBreakdown,string,string][]=[
  ['transport','เดินทาง','car-outline'],
  ['accommodation','ที่พัก','bed-outline'],
  ['food','อาหาร','restaurant-outline'],
  ['activities','กิจกรรม','ticket-outline'],
  ['other','อื่น ๆ','wallet-outline'],
];

const uid=(prefix='x')=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const today=()=>new Date().toISOString().slice(0,10);
const numberValue=(v:string|number|undefined)=>Math.max(0,Number(String(v??'').replace(/,/g,''))||0);
const listFromText=(v:string)=>v.split('\n').map(x=>x.replace(/^[-•]\s*/,'').trim()).filter(Boolean);
const textFromList=(v?:string[])=>Array.isArray(v)?v.join('\n'):'';
const addDays=(date:string,count:number)=>{
  const d=new Date(`${date}T12:00:00`);
  if(Number.isNaN(d.getTime()))return date;
  d.setDate(d.getDate()+Math.max(0,count-1));
  return d.toISOString().slice(0,10);
};
const blankSchedule=():TripScheduleItem=>({id:uid('slot'),time:'',title:'',detail:'',activities:[],notes:[]});
const blankDay=(day:number,date:string):TripDay=>({day,date,title:`DAY ${day}`,route:'',placeIds:[],note:'',schedule:[blankSchedule()],accommodation:'',budgetItems:[]});
const rangeFrom=(min:string,max:string,label=''):TripMoneyRange|undefined=>{
  const a=numberValue(min),b=numberValue(max);
  if(!a&&!b&&!label.trim())return undefined;
  return {min:a||undefined,max:b||a||undefined,label:label.trim()||undefined};
};

type Draft={
  id?:string;
  title:string; startDate:string; endDate:string; travelers:string; status:NonNullable<Trip['status']>;
  origin:string; destinationSummary:string; transport:string; tripStyle:string; accommodation:string; note:string;
  provinceIds:string[]; routeText:string; routeStopsText:string;
  budget:string; budgetMin:string; budgetMax:string; budgetLabel:string;
  budgetBreakdown:Record<keyof TripBudgetBreakdown,string>;
  budgetSummaryText:string; budgetTiers:TripBudgetTier[];
  days:TripDay[]; accommodationPlan:TripAccommodationNight[];
  attractionsText:string; packingText:string; importantText:string; sourceText:string;
};

const toDraft=(trip?:Trip):Draft=>{
  const start=trip?.startDate||today();
  if(!trip)return {
    title:'',startDate:start,endDate:start,travelers:'2',status:'วางแผน',origin:'กรุงเทพฯ',destinationSummary:'',transport:'รถยนต์ส่วนตัว',tripStyle:'ชิล ๆ',accommodation:'',note:'',provinceIds:[],routeText:'',routeStopsText:'',budget:'',budgetMin:'',budgetMax:'',budgetLabel:'',
    budgetBreakdown:{transport:'',accommodation:'',food:'',activities:'',other:''},budgetSummaryText:'',budgetTiers:[],days:[blankDay(1,start)],accommodationPlan:[],attractionsText:'',packingText:'',importantText:'',sourceText:'',
  };
  return {
    id:trip.id,title:trip.title||'',startDate:start,endDate:trip.endDate||start,travelers:String(trip.travelers||1),status:trip.status||'วางแผน',origin:trip.origin||'',destinationSummary:trip.destinationSummary||'',transport:trip.transport||'',tripStyle:trip.tripStyle||'',accommodation:trip.accommodation||'',note:trip.note||'',provinceIds:[...(trip.provinceIds||[])],routeText:trip.routeText||'',routeStopsText:textFromList(trip.routeStops),budget:String(trip.budget||''),budgetMin:String(trip.overviewBudgetRange?.min??''),budgetMax:String(trip.overviewBudgetRange?.max??''),budgetLabel:trip.overviewBudgetRange?.label||'',
    budgetBreakdown:{transport:String(trip.budgetBreakdown?.transport??''),accommodation:String(trip.budgetBreakdown?.accommodation??''),food:String(trip.budgetBreakdown?.food??''),activities:String(trip.budgetBreakdown?.activities??''),other:String(trip.budgetBreakdown?.other??'')},
    budgetSummaryText:textFromList(trip.budgetSummaryLines),budgetTiers:(trip.budgetTiers||[]).map(x=>({...x})),
    days:(trip.days?.length?trip.days:[blankDay(1,start)]).map((d,i)=>({...d,day:i+1,placeIds:[...(d.placeIds||[])],schedule:(d.schedule||[]).map(s=>({...s,activities:[...(s.activities||[])],notes:[...(s.notes||[])]})),budgetItems:(d.budgetItems||[]).map(x=>({...x}))})),
    accommodationPlan:(trip.accommodationPlan||[]).map(x=>({...x})),attractionsText:textFromList(trip.attractionsSummary),packingText:textFromList(trip.packingList),importantText:textFromList(trip.importantNotes),sourceText:trip.sourceText||'',
  };
};

export default function TripPlannerCore(){
  const {trips,createTrip,updateTrip,deleteTrip}=useTravelStore();
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState<Draft>(()=>toDraft());
  const [expandedDay,setExpandedDay]=useState(1);
  const [provinceSearch,setProvinceSearch]=useState('');
  const [placeSearch,setPlaceSearch]=useState<Record<number,string>>({});

  const totalDays=trips.reduce((sum,t)=>sum+Math.max(1,t.days?.length||0),0);
  const totalBudget=trips.reduce((sum,t)=>sum+(t.budget||0),0);
  const provinceResults=useMemo(()=>{
    const q=provinceSearch.trim().toLowerCase();
    return PROVINCES.filter(p=>!q||`${p.nameTh} ${p.nameEn}`.toLowerCase().includes(q)).slice(0,q?20:10);
  },[provinceSearch]);

  const setField=<K extends keyof Draft>(key:K,value:Draft[K])=>setDraft(d=>({...d,[key]:value}));
  const openNew=()=>{setDraft(toDraft());setExpandedDay(1);setProvinceSearch('');setPlaceSearch({});setEditing(true)};
  const openEdit=(trip:Trip)=>{setDraft(toDraft(trip));setExpandedDay(1);setProvinceSearch('');setPlaceSearch({});setEditing(true)};
  const toggleProvince=(id:string)=>setDraft(d=>({...d,provinceIds:d.provinceIds.includes(id)?d.provinceIds.filter(x=>x!==id):[...d.provinceIds,id]}));
  const setBreakdown=(key:keyof TripBudgetBreakdown,value:string)=>setDraft(d=>({...d,budgetBreakdown:{...d.budgetBreakdown,[key]:value}}));
  const updateDay=(index:number,patch:Partial<TripDay>)=>setDraft(d=>({...d,days:d.days.map((x,i)=>i===index?{...x,...patch}:x)}));
  const addDay=()=>setDraft(d=>{const no=d.days.length+1;const date=addDays(d.startDate,no);return {...d,days:[...d.days,blankDay(no,date)],endDate:date}});
  const removeDay=(index:number)=>setDraft(d=>{
    if(d.days.length<=1)return d;
    const days=d.days.filter((_,i)=>i!==index).map((x,i)=>({...x,day:i+1,title:x.title||`DAY ${i+1}`}));
    return {...d,days,endDate:addDays(d.startDate,days.length)};
  });
  const addSchedule=(dayIndex:number)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,schedule:[...(day.schedule||[]),blankSchedule()]}:day)}));
  const updateSchedule=(dayIndex:number,slotIndex:number,patch:Partial<TripScheduleItem>)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,schedule:(day.schedule||[]).map((slot,j)=>j===slotIndex?{...slot,...patch}:slot)}:day)}));
  const removeSchedule=(dayIndex:number,slotIndex:number)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,schedule:(day.schedule||[]).filter((_,j)=>j!==slotIndex)}:day)}));
  const togglePlace=(dayIndex:number,id:string)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,placeIds:(day.placeIds||[]).includes(id)?day.placeIds.filter(x=>x!==id):[...(day.placeIds||[]),id]}:day)}));
  const addBudgetItem=(dayIndex:number)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,budgetItems:[...(day.budgetItems||[]),{label:'',text:''}]}:day)}));
  const updateBudgetItem=(dayIndex:number,itemIndex:number,patch:Partial<TripDayBudgetItem>)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,budgetItems:(day.budgetItems||[]).map((item,j)=>j===itemIndex?{...item,...patch}:item)}:day)}));
  const removeBudgetItem=(dayIndex:number,itemIndex:number)=>setDraft(d=>({...d,days:d.days.map((day,i)=>i===dayIndex?{...day,budgetItems:(day.budgetItems||[]).filter((_,j)=>j!==itemIndex)}:day)}));
  const addNight=()=>setDraft(d=>({...d,accommodationPlan:[...d.accommodationPlan,{night:d.accommodationPlan.length+1,location:''}]}));
  const updateNight=(index:number,location:string)=>setDraft(d=>({...d,accommodationPlan:d.accommodationPlan.map((x,i)=>i===index?{...x,location}:x)}));
  const removeNight=(index:number)=>setDraft(d=>({...d,accommodationPlan:d.accommodationPlan.filter((_,i)=>i!==index).map((x,i)=>({...x,night:i+1}))}));
  const addTier=()=>setDraft(d=>({...d,budgetTiers:[...d.budgetTiers,{label:'งบแนะนำ',text:'',perPerson:false}]}));
  const updateTier=(index:number,patch:Partial<TripBudgetTier>)=>setDraft(d=>({...d,budgetTiers:d.budgetTiers.map((x,i)=>i===index?{...x,...patch}:x)}));
  const removeTier=(index:number)=>setDraft(d=>({...d,budgetTiers:d.budgetTiers.filter((_,i)=>i!==index)}));

  const save=()=>{
    if(!draft.title.trim())return Alert.alert('กรุณาใส่ชื่อทริป');
    const days=draft.days.map((day,i)=>({
      ...day,day:i+1,title:day.title?.trim()||`DAY ${i+1}`,placeIds:[...(day.placeIds||[])],
      schedule:(day.schedule||[]).filter(x=>x.time?.trim()||x.title?.trim()||x.detail?.trim()).map(x=>({...x,id:x.id||uid('slot'),title:x.title?.trim()||'กิจกรรม',activities:[...(x.activities||[])],notes:[...(x.notes||[])]})),
      budgetItems:(day.budgetItems||[]).filter(x=>x.label?.trim()||x.text?.trim()||x.min||x.max),
    }));
    const trip:Trip={
      id:draft.id||uid('trip'),title:draft.title.trim(),startDate:draft.startDate||today(),endDate:draft.endDate||addDays(draft.startDate,days.length),budget:numberValue(draft.budget),provinceIds:[...draft.provinceIds],days,
      travelers:Math.max(1,Number(draft.travelers)||1),status:draft.status,origin:draft.origin.trim()||undefined,destinationSummary:draft.destinationSummary.trim()||undefined,transport:draft.transport.trim()||undefined,tripStyle:draft.tripStyle.trim()||undefined,accommodation:draft.accommodation.trim()||undefined,note:draft.note.trim()||undefined,
      budgetBreakdown:{transport:numberValue(draft.budgetBreakdown.transport)||undefined,accommodation:numberValue(draft.budgetBreakdown.accommodation)||undefined,food:numberValue(draft.budgetBreakdown.food)||undefined,activities:numberValue(draft.budgetBreakdown.activities)||undefined,other:numberValue(draft.budgetBreakdown.other)||undefined},
      routeText:draft.routeText.trim()||undefined,routeStops:listFromText(draft.routeStopsText),overviewBudgetRange:rangeFrom(draft.budgetMin,draft.budgetMax,draft.budgetLabel),budgetSummaryLines:listFromText(draft.budgetSummaryText),budgetTiers:draft.budgetTiers.filter(x=>x.label?.trim()||x.text?.trim()||x.min||x.max),
      accommodationPlan:draft.accommodationPlan.filter(x=>x.location.trim()).map((x,i)=>({...x,night:i+1,location:x.location.trim()})),attractionsSummary:listFromText(draft.attractionsText),packingList:listFromText(draft.packingText),importantNotes:listFromText(draft.importantText),sourceText:draft.sourceText.trim()||undefined,importMode:draft.sourceText.trim()?'text-import':'manual',autoFilled:false,
    };
    if(draft.id)updateTrip(draft.id,trip);else createTrip(trip);
    setEditing(false);
  };

  const confirmDelete=(trip:Trip)=>Alert.alert('ลบทริป?',trip.title,[{text:'ยกเลิก',style:'cancel'},{text:'ลบ',style:'destructive',onPress:()=>deleteTrip(trip.id)}]);

  if(editing)return <EditorShell title={draft.id?'แก้ไขทริป':'สร้างทริปใหม่'} onClose={()=>setEditing(false)}>
    <Section icon="information-circle-outline" title="ข้อมูลทริป">
      <Field label="ชื่อทริป"><Input value={draft.title} onChangeText={(v:string)=>setField('title',v)} placeholder="เช่น ศรีสะเกษ 5 วัน 4 คืน"/></Field>
      <Field label="วันเริ่ม"><Input value={draft.startDate} onChangeText={(v:string)=>setField('startDate',v)} placeholder="YYYY-MM-DD"/></Field>
      <Field label="วันสิ้นสุด"><Input value={draft.endDate} onChangeText={(v:string)=>setField('endDate',v)} placeholder="YYYY-MM-DD"/></Field>
      <Field label="จำนวนคน"><Input value={draft.travelers} onChangeText={(v:string)=>setField('travelers',v)} keyboardType="number-pad"/></Field>
      <Field label="สถานะ"><ChipRow values={STATUS} selected={draft.status} onSelect={v=>setField('status',v as Draft['status'])}/></Field>
      <Field label="ต้นทาง"><Input value={draft.origin} onChangeText={(v:string)=>setField('origin',v)}/></Field>
      <Field label="ปลายทาง / พื้นที่"><Input value={draft.destinationSummary} onChangeText={(v:string)=>setField('destinationSummary',v)}/></Field>
      <Field label="การเดินทาง"><ChipRow values={TRANSPORTS} selected={draft.transport} onSelect={v=>setField('transport',v)}/><Input value={draft.transport} onChangeText={(v:string)=>setField('transport',v)} placeholder="หรือพิมพ์เอง"/></Field>
      <Field label="สไตล์ทริป"><ChipRow values={TRIP_STYLES} selected={draft.tripStyle} onSelect={v=>setField('tripStyle',v)}/><Input value={draft.tripStyle} onChangeText={(v:string)=>setField('tripStyle',v)} placeholder="หรือพิมพ์เอง"/></Field>
      <Field label="ที่พักภาพรวม"><Input value={draft.accommodation} onChangeText={(v:string)=>setField('accommodation',v)} multiline/></Field>
      <Field label="หมายเหตุ"><Input value={draft.note} onChangeText={(v:string)=>setField('note',v)} multiline/></Field>
    </Section>

    <Section icon="map-outline" title="จังหวัดและเส้นทาง">
      <Field label="ค้นหาจังหวัด"><Input value={provinceSearch} onChangeText={setProvinceSearch} placeholder="ค้นหาจังหวัด"/></Field>
      <View style={s.chipGrid}>{provinceResults.map(p=>{const active=draft.provinceIds.includes(p.id);return <Pressable key={p.id} onPress={()=>toggleProvince(p.id)} style={[s.selectChip,active&&s.selectChipOn]}><Text numberOfLines={1} style={[s.selectChipText,active&&s.selectChipTextOn]}>{p.nameTh}</Text>{active&&<Ionicons name="checkmark" size={14} color={COLORS.primary}/>}</Pressable>})}</View>
      <Field label="เส้นทางหลัก"><Input value={draft.routeText} onChangeText={(v:string)=>setField('routeText',v)} multiline placeholder="กรุงเทพฯ → ศรีสะเกษ → ขุนหาญ"/></Field>
      <Field label="จุดตามเส้นทาง (1 บรรทัดต่อจุด)"><Input value={draft.routeStopsText} onChangeText={(v:string)=>setField('routeStopsText',v)} multiline/></Field>
    </Section>

    <Section icon="wallet-outline" title="งบประมาณ">
      <Field label="งบรวม"><Input value={draft.budget} onChangeText={(v:string)=>setField('budget',v)} keyboardType="number-pad"/></Field>
      <Field label="งบขั้นต่ำ"><Input value={draft.budgetMin} onChangeText={(v:string)=>setField('budgetMin',v)} keyboardType="number-pad"/></Field>
      <Field label="งบสูงสุด"><Input value={draft.budgetMax} onChangeText={(v:string)=>setField('budgetMax',v)} keyboardType="number-pad"/></Field>
      <Field label="คำอธิบายช่วงงบ"><Input value={draft.budgetLabel} onChangeText={(v:string)=>setField('budgetLabel',v)}/></Field>
      <View style={s.budgetList}>{BUDGET_FIELDS.map(([key,label,icon])=><View key={key} style={s.budgetRow}><View style={s.budgetIcon}><Ionicons name={icon as any} size={18} color={COLORS.primary}/></View><Text style={s.budgetLabel}>{label}</Text><TextInput value={draft.budgetBreakdown[key]} onChangeText={v=>setBreakdown(key,v)} keyboardType="number-pad" placeholder="0" placeholderTextColor={COLORS.textMuted} style={s.budgetInput}/></View>)}</View>
      <Field label="สรุปงบเพิ่มเติม"><Input value={draft.budgetSummaryText} onChangeText={(v:string)=>setField('budgetSummaryText',v)} multiline/></Field>
      <SubHeader title="ระดับงบ" action="เพิ่ม" onPress={addTier}/>
      {draft.budgetTiers.map((tier,i)=><SubCard key={`tier-${i}`} title={`ระดับงบ ${i+1}`} onDelete={()=>removeTier(i)}>
        <Input value={tier.label||''} onChangeText={(v:string)=>updateTier(i,{label:v})} placeholder="ชื่อระดับงบ"/>
        <Input value={String(tier.min??'')} onChangeText={(v:string)=>updateTier(i,{min:numberValue(v)||undefined})} keyboardType="number-pad" placeholder="ขั้นต่ำ"/>
        <Input value={String(tier.max??'')} onChangeText={(v:string)=>updateTier(i,{max:numberValue(v)||undefined})} keyboardType="number-pad" placeholder="สูงสุด"/>
        <Pressable style={s.checkRow} onPress={()=>updateTier(i,{perPerson:!tier.perPerson})}><Ionicons name={tier.perPerson?'checkbox':'square-outline'} size={19} color={tier.perPerson?COLORS.primary:COLORS.textMuted}/><Text style={s.checkText}>คิดต่อคน</Text></Pressable>
        <Input value={tier.text||''} onChangeText={(v:string)=>updateTier(i,{text:v})} multiline placeholder="รายละเอียด"/>
      </SubCard>)}
    </Section>

    <Section icon="calendar-outline" title={`แผนรายวัน · ${draft.days.length} วัน`}>
      {draft.days.map((day,dayIndex)=>{
        const open=expandedDay===dayIndex+1;
        const q=(placeSearch[dayIndex]||'').trim().toLowerCase();
        const places=PLACES.filter(p=>(!draft.provinceIds.length||draft.provinceIds.includes(p.provinceId))&&(!q||`${p.name} ${p.province}`.toLowerCase().includes(q))).slice(0,q?14:8);
        return <View key={`day-${dayIndex}`} style={s.dayCard}>
          <Pressable style={s.dayHead} onPress={()=>setExpandedDay(open?0:dayIndex+1)}>
            <View style={s.dayNo}><Text style={s.dayNoText}>{dayIndex+1}</Text></View>
            <View style={s.flex}><Text style={s.dayTitle}>{day.title||`DAY ${dayIndex+1}`}</Text><Text style={s.dayMeta}>{day.date||'-'} · {(day.schedule||[]).length} ช่วงเวลา</Text></View>
            <Ionicons name={open?'chevron-up':'chevron-down'} size={19} color={COLORS.text}/>
          </Pressable>
          {open&&<View style={s.dayBody}>
            <Field label="ชื่อ DAY"><Input value={day.title||''} onChangeText={(v:string)=>updateDay(dayIndex,{title:v})}/></Field>
            <Field label="วันที่"><Input value={day.date||''} onChangeText={(v:string)=>updateDay(dayIndex,{date:v})} placeholder="YYYY-MM-DD"/></Field>
            <Field label="เส้นทางวันนี้"><Input value={day.route||''} onChangeText={(v:string)=>updateDay(dayIndex,{route:v})} multiline/></Field>
            <Field label="หมายเหตุวันนี้"><Input value={day.note||''} onChangeText={(v:string)=>updateDay(dayIndex,{note:v})} multiline/></Field>
            <Field label="ที่พักคืนนี้"><Input value={day.accommodation||''} onChangeText={(v:string)=>updateDay(dayIndex,{accommodation:v})}/></Field>
            <Field label="งบวันนี้ขั้นต่ำ"><Input value={String(day.budgetRange?.min??'')} onChangeText={(v:string)=>updateDay(dayIndex,{budgetRange:{...(day.budgetRange||{}),min:numberValue(v)||undefined}})} keyboardType="number-pad"/></Field>
            <Field label="งบวันนี้สูงสุด"><Input value={String(day.budgetRange?.max??'')} onChangeText={(v:string)=>updateDay(dayIndex,{budgetRange:{...(day.budgetRange||{}),max:numberValue(v)||undefined}})} keyboardType="number-pad"/></Field>

            <SubHeader title="สถานที่วันนี้"/>
            <Input value={placeSearch[dayIndex]||''} onChangeText={(v:string)=>setPlaceSearch(x=>({...x,[dayIndex]:v}))} placeholder="ค้นหาสถานที่"/>
            <View style={s.chipGrid}>{places.map(p=>{const active=(day.placeIds||[]).includes(p.id);return <Pressable key={p.id} onPress={()=>togglePlace(dayIndex,p.id)} style={[s.selectChip,active&&s.selectChipOn]}><Text numberOfLines={1} style={[s.selectChipText,active&&s.selectChipTextOn]}>{p.name}</Text></Pressable>})}</View>

            <SubHeader title="เวลา / กิจกรรม" action="เพิ่มช่วง" onPress={()=>addSchedule(dayIndex)}/>
            {(day.schedule||[]).map((slot,slotIndex)=><SubCard key={slot.id||slotIndex} title={`ช่วงที่ ${slotIndex+1}`} onDelete={()=>removeSchedule(dayIndex,slotIndex)}>
              <Field label="เวลา"><Input value={slot.time||''} onChangeText={(v:string)=>updateSchedule(dayIndex,slotIndex,{time:v})} placeholder="09:00–10:00"/></Field>
              <Field label="หัวข้อ / สถานที่"><Input value={slot.title||''} onChangeText={(v:string)=>updateSchedule(dayIndex,slotIndex,{title:v})}/></Field>
              <Field label="รายละเอียด"><Input value={slot.detail||''} onChangeText={(v:string)=>updateSchedule(dayIndex,slotIndex,{detail:v})} multiline/></Field>
              <Field label="กิจกรรม (1 บรรทัดต่อรายการ)"><Input value={textFromList(slot.activities)} onChangeText={(v:string)=>updateSchedule(dayIndex,slotIndex,{activities:listFromText(v)})} multiline/></Field>
              <Field label="หมายเหตุ / ข้อควรระวัง"><Input value={textFromList(slot.notes)} onChangeText={(v:string)=>updateSchedule(dayIndex,slotIndex,{notes:listFromText(v)})} multiline/></Field>
            </SubCard>)}

            <SubHeader title="งบรายวัน" action="เพิ่มรายการ" onPress={()=>addBudgetItem(dayIndex)}/>
            {(day.budgetItems||[]).map((item,itemIndex)=><SubCard key={`budget-${itemIndex}`} title={`รายการ ${itemIndex+1}`} onDelete={()=>removeBudgetItem(dayIndex,itemIndex)}>
              <Input value={item.label||''} onChangeText={(v:string)=>updateBudgetItem(dayIndex,itemIndex,{label:v})} placeholder="ชื่อรายการ"/>
              <Input value={String(item.min??'')} onChangeText={(v:string)=>updateBudgetItem(dayIndex,itemIndex,{min:numberValue(v)||undefined})} keyboardType="number-pad" placeholder="ขั้นต่ำ"/>
              <Input value={String(item.max??'')} onChangeText={(v:string)=>updateBudgetItem(dayIndex,itemIndex,{max:numberValue(v)||undefined})} keyboardType="number-pad" placeholder="สูงสุด"/>
              <Input value={item.text||''} onChangeText={(v:string)=>updateBudgetItem(dayIndex,itemIndex,{text:v})} multiline placeholder="รายละเอียด"/>
            </SubCard>)}
            <Pressable style={s.dangerButton} onPress={()=>removeDay(dayIndex)}><Ionicons name="trash-outline" size={17} color={COLORS.danger}/><Text style={s.dangerText}>ลบ DAY {dayIndex+1}</Text></Pressable>
          </View>}
        </View>;
      })}
      <Pressable style={s.outlineButton} onPress={addDay}><Ionicons name="add-circle-outline" size={19} color={COLORS.primary}/><Text style={s.outlineText}>เพิ่ม DAY ใหม่</Text></Pressable>
    </Section>

    <Section icon="bed-outline" title="ที่พักรายคืน">
      <SubHeader title="คืนที่พัก" action="เพิ่มคืน" onPress={addNight}/>
      {draft.accommodationPlan.map((night,i)=><View key={`night-${i}`} style={s.nightRow}><View style={s.nightNo}><Text style={s.nightNoText}>{i+1}</Text></View><TextInput value={night.location} onChangeText={v=>updateNight(i,v)} placeholder="สถานที่พัก" placeholderTextColor={COLORS.textMuted} style={[s.input,s.flex]}/><IconDelete onPress={()=>removeNight(i)}/></View>)}
    </Section>

    <Section icon="list-outline" title="สรุปและ Checklist">
      <Field label="สรุปสถานที่เที่ยว"><Input value={draft.attractionsText} onChangeText={(v:string)=>setField('attractionsText',v)} multiline/></Field>
      <Field label="ของที่ควรเตรียม"><Input value={draft.packingText} onChangeText={(v:string)=>setField('packingText',v)} multiline/></Field>
      <Field label="หมายเหตุสำคัญ"><Input value={draft.importantText} onChangeText={(v:string)=>setField('importantText',v)} multiline/></Field>
      <Field label="ข้อความต้นฉบับ"><Input value={draft.sourceText} onChangeText={(v:string)=>setField('sourceText',v)} multiline/></Field>
    </Section>

    <View style={s.editorActions}>
      <Pressable style={s.secondaryButton} onPress={()=>setEditing(false)}><Text style={s.secondaryText}>ยกเลิก</Text></Pressable>
      <Pressable style={s.primaryButton} onPress={save}><Ionicons name="save-outline" size={18} color="#fff"/><Text style={s.primaryText}>{draft.id?'บันทึกทั้งหมด':'บันทึกทริป'}</Text></Pressable>
    </View>
  </EditorShell>;

  return <SafeAreaView style={s.safe} edges={['top']}>
    <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <View style={s.heroTop}><View style={s.heroIcon}><Ionicons name="map" size={23} color={COLORS.primary}/></View><View style={s.flex}><Text style={s.kicker}>MANUAL TRIP PLANNER</Text><Text style={s.heroTitle}>แผนการเดินทาง</Text></View></View>
        <Text style={s.heroSub}>สร้างเอง แก้เอง และคุมรายละเอียดได้ทุกจุด หลังใช้แยกแผนอัตโนมัติก็กลับมาแก้ต่อได้ทั้งหมด</Text>
        <Pressable style={s.primaryButton} onPress={openNew}><Ionicons name="add" size={19} color="#fff"/><Text style={s.primaryText}>สร้างทริปเอง</Text></Pressable>
      </View>

      <View style={s.statsRow}><Stat label="ทริป" value={String(trips.length)}/><Stat label="วันเที่ยว" value={String(totalDays)}/><Stat label="งบรวม" value={`${totalBudget.toLocaleString()}฿`}/></View>

      {!trips.length?<View style={s.empty}><View style={s.emptyIcon}><Ionicons name="create-outline" size={28} color={COLORS.primary}/></View><Text style={s.emptyTitle}>ยังไม่มีแผนทริป</Text><Text style={s.emptyText}>สร้างเอง หรือใช้เมนู “แยกแผนอัตโนมัติ” จากด้านบนได้</Text><Pressable style={s.primaryButton} onPress={openNew}><Ionicons name="add" size={18} color="#fff"/><Text style={s.primaryText}>สร้างทริปแรก</Text></Pressable></View>
      :<View style={s.tripList}>{trips.map(trip=><TripCard key={trip.id} trip={trip} onEdit={()=>openEdit(trip)} onDelete={()=>confirmDelete(trip)}/>)}</View>}
    </ScrollView>
  </SafeAreaView>;
}

function EditorShell({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
  return <SafeAreaView style={s.safe} edges={['top']}><ScrollView style={s.scroll} contentContainerStyle={s.editorContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={s.editorHeader}><View style={s.flex}><Text style={s.kicker}>FULL MANUAL EDITOR</Text><Text style={s.editorTitle}>{title}</Text><Text style={s.editorSub}>ทุกช่องแก้ไขได้ และบันทึกทับทริปเดิมได้โดยไม่ลบข้อมูลอื่น</Text></View><Pressable style={s.closeButton} onPress={onClose}><Ionicons name="close" size={21} color={COLORS.text}/></Pressable></View>
    {children}
  </ScrollView></SafeAreaView>;
}

function TripCard({trip,onEdit,onDelete}:{trip:Trip;onEdit:()=>void;onDelete:()=>void}){
  const [open,setOpen]=useState(false);
  const provinceNames=(trip.provinceIds||[]).map(id=>PROVINCES.find(p=>p.id===id)?.nameTh).filter(Boolean).join(' · ');
  const scheduleCount=(trip.days||[]).reduce((sum,d)=>sum+(d.schedule?.length||0),0);
  return <View style={s.tripCard}>
    <View style={s.tripTop}><View style={s.tripBadge}><Ionicons name="briefcase-outline" size={18} color={COLORS.primary}/></View><View style={s.flex}><Text style={s.tripTitle}>{trip.title}</Text><Text style={s.tripMeta}>{trip.startDate} → {trip.endDate}</Text></View><View style={s.statusPill}><Text style={s.statusText}>{trip.status||'วางแผน'}</Text></View></View>
    {!!provinceNames&&<Text style={s.tripProvince}>{provinceNames}</Text>}
    <View style={s.metrics}><Metric label="วัน" value={String(trip.days?.length||0)}/><Metric label="งบ" value={`${(trip.budget||0).toLocaleString()}฿`}/><Metric label="ช่วงเวลา" value={String(scheduleCount)}/></View>
    {!!trip.routeText&&<View style={s.routeBox}><Ionicons name="git-branch-outline" size={16} color={COLORS.primary}/><Text style={s.routeText}>{trip.routeText}</Text></View>}
    {open&&<View style={s.preview}>{(trip.days||[]).map(day=><View key={day.day} style={s.previewDay}><View style={s.previewNo}><Text style={s.previewNoText}>{day.day}</Text></View><View style={s.flex}><Text style={s.previewTitle}>{day.title||`DAY ${day.day}`}</Text>{(day.schedule||[]).slice(0,5).map((x,i)=><View key={x.id||i} style={s.previewSlot}><Text style={s.previewTime}>{x.time||'--:--'}</Text><Text style={s.previewSlotText}>{x.title||'กิจกรรม'}</Text></View>)}</View></View>)}</View>}
    <View style={s.cardActions}><Pressable style={s.smallButton} onPress={()=>setOpen(v=>!v)}><Ionicons name={open?'chevron-up':'eye-outline'} size={17} color={COLORS.primary}/><Text style={s.smallButtonText}>{open?'ย่อ':'ดูแผน'}</Text></Pressable><Pressable style={[s.primaryButton,s.editButton]} onPress={onEdit}><Ionicons name="create-outline" size={17} color="#fff"/><Text style={s.primaryText}>แก้ไขทั้งหมด</Text></Pressable><Pressable style={s.deleteButton} onPress={onDelete}><Ionicons name="trash-outline" size={18} color={COLORS.danger}/></Pressable></View>
  </View>;
}

function Section({icon,title,children}:{icon:string;title:string;children:React.ReactNode}){return <View style={s.section}><View style={s.sectionHead}><View style={s.sectionIcon}><Ionicons name={icon as any} size={19} color={COLORS.primary}/></View><Text style={s.sectionTitle}>{title}</Text></View><View style={s.sectionBody}>{children}</View></View>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <View style={s.field}><Text style={s.label}>{label}</Text>{children}</View>}
function Input(props:any){return <TextInput {...props} placeholderTextColor={COLORS.textMuted} textAlignVertical={props.multiline?'top':'center'} style={[s.input,props.multiline&&s.inputMulti,props.style]}/>}
function ChipRow({values,selected,onSelect}:{values:string[];selected:string;onSelect:(v:string)=>void}){return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.choiceRow}>{values.map(v=><Pressable key={v} onPress={()=>onSelect(v)} style={[s.choice,selected===v&&s.choiceOn]}><Text style={[s.choiceText,selected===v&&s.choiceTextOn]}>{v}</Text></Pressable>)}</ScrollView>}
function SubHeader({title,action,onPress}:{title:string;action?:string;onPress?:()=>void}){return <View style={s.subHeader}><Text style={s.subHeaderTitle}>{title}</Text>{action&&<Pressable style={s.subAction} onPress={onPress}><Ionicons name="add" size={15} color={COLORS.primary}/><Text style={s.subActionText}>{action}</Text></Pressable>}</View>}
function SubCard({title,onDelete,children}:{title:string;onDelete:()=>void;children:React.ReactNode}){return <View style={s.subCard}><View style={s.subCardTop}><Text style={s.subCardTitle}>{title}</Text><IconDelete onPress={onDelete}/></View>{children}</View>}
function IconDelete({onPress}:{onPress:()=>void}){return <Pressable style={s.iconDelete} onPress={onPress}><Ionicons name="trash-outline" size={16} color={COLORS.danger}/></Pressable>}
function Stat({label,value}:{label:string;value:string}){return <View style={s.stat}><Text numberOfLines={1} style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text numberOfLines={1} style={s.metricValue}>{value}</Text></View>}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'transparent'},scroll:{flex:1},flex:{flex:1,minWidth:0},
  content:{paddingHorizontal:14,paddingTop:10,paddingBottom:130,gap:12,width:'100%'},editorContent:{paddingHorizontal:14,paddingTop:10,paddingBottom:150,gap:12,width:'100%'},
  kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.15,color:COLORS.primary},
  hero:{padding:16,borderRadius:22,backgroundColor:'rgba(255,255,255,.84)',borderWidth:1,borderColor:'rgba(255,255,255,.74)',gap:12,...SHADOW.card},heroTop:{flexDirection:'row',alignItems:'center',gap:11},heroIcon:{width:48,height:48,borderRadius:16,backgroundColor:'rgba(232,246,246,.96)',alignItems:'center',justifyContent:'center'},heroTitle:{fontSize:27,lineHeight:32,fontWeight:'900',color:COLORS.text,letterSpacing:-.4,marginTop:2},heroSub:{fontSize:13,lineHeight:19,color:COLORS.textMuted},
  primaryButton:{minHeight:48,borderRadius:15,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,paddingHorizontal:14},primaryText:{fontSize:13,fontWeight:'900',color:'#fff'},secondaryButton:{minHeight:48,borderRadius:15,backgroundColor:'rgba(255,255,255,.76)',borderWidth:1,borderColor:'rgba(7,61,75,.10)',alignItems:'center',justifyContent:'center',paddingHorizontal:14},secondaryText:{fontSize:13,fontWeight:'900',color:COLORS.text},
  statsRow:{flexDirection:'row',gap:8},stat:{flex:1,minWidth:0,minHeight:68,borderRadius:16,backgroundColor:'rgba(255,255,255,.78)',borderWidth:1,borderColor:'rgba(255,255,255,.66)',alignItems:'center',justifyContent:'center',padding:8},statValue:{fontSize:16,fontWeight:'900',color:COLORS.text,maxWidth:'100%'},statLabel:{fontSize:10,fontWeight:'800',color:COLORS.textMuted,marginTop:2},
  empty:{padding:20,borderRadius:22,backgroundColor:'rgba(255,255,255,.80)',borderWidth:1,borderColor:'rgba(255,255,255,.68)',alignItems:'center',gap:9},emptyIcon:{width:54,height:54,borderRadius:18,backgroundColor:'rgba(232,246,246,.96)',alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:19,fontWeight:'900',color:COLORS.text},emptyText:{fontSize:12,lineHeight:18,color:COLORS.textMuted,textAlign:'center'},tripList:{gap:11},
  editorHeader:{padding:14,borderRadius:20,backgroundColor:'rgba(255,255,255,.84)',borderWidth:1,borderColor:'rgba(255,255,255,.72)',flexDirection:'row',alignItems:'flex-start',gap:10,...SHADOW.card},editorTitle:{fontSize:23,lineHeight:28,fontWeight:'900',color:COLORS.text,marginTop:2},editorSub:{fontSize:11.5,lineHeight:17,color:COLORS.textMuted,marginTop:3},closeButton:{width:40,height:40,borderRadius:13,backgroundColor:'rgba(232,246,246,.86)',alignItems:'center',justifyContent:'center'},
  section:{borderRadius:20,backgroundColor:'rgba(255,255,255,.82)',borderWidth:1,borderColor:'rgba(255,255,255,.70)',overflow:'hidden'},sectionHead:{minHeight:58,paddingHorizontal:14,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:9,borderBottomWidth:1,borderBottomColor:'rgba(7,61,75,.07)'},sectionIcon:{width:36,height:36,borderRadius:12,backgroundColor:'rgba(232,246,246,.94)',alignItems:'center',justifyContent:'center'},sectionTitle:{flex:1,fontSize:17,fontWeight:'900',color:COLORS.text},sectionBody:{padding:13,gap:12},
  field:{gap:6},label:{fontSize:12,fontWeight:'900',color:COLORS.text},input:{width:'100%',minHeight:48,borderRadius:14,borderWidth:1,borderColor:'rgba(7,61,75,.12)',backgroundColor:'rgba(255,255,255,.92)',paddingHorizontal:12,paddingVertical:10,fontSize:14,fontWeight:'700',color:COLORS.text},inputMulti:{minHeight:92,lineHeight:20},
  choiceRow:{gap:7,paddingRight:12},choice:{minHeight:38,paddingHorizontal:12,borderRadius:999,backgroundColor:'rgba(255,255,255,.78)',borderWidth:1,borderColor:'rgba(7,61,75,.10)',alignItems:'center',justifyContent:'center'},choiceOn:{backgroundColor:'rgba(219,246,247,.98)',borderColor:COLORS.primary},choiceText:{fontSize:11.5,fontWeight:'800',color:COLORS.textMuted},choiceTextOn:{color:COLORS.primary},
  chipGrid:{flexDirection:'row',flexWrap:'wrap',gap:7},selectChip:{maxWidth:'100%',minHeight:36,paddingHorizontal:10,borderRadius:12,backgroundColor:'rgba(255,255,255,.74)',borderWidth:1,borderColor:'rgba(7,61,75,.09)',flexDirection:'row',alignItems:'center',gap:4},selectChipOn:{backgroundColor:'rgba(219,246,247,.98)',borderColor:COLORS.primary},selectChipText:{maxWidth:220,fontSize:11,fontWeight:'800',color:COLORS.textMuted},selectChipTextOn:{color:COLORS.primary},
  budgetList:{gap:7},budgetRow:{minHeight:48,borderRadius:14,backgroundColor:'rgba(255,255,255,.72)',borderWidth:1,borderColor:'rgba(7,61,75,.08)',flexDirection:'row',alignItems:'center',paddingHorizontal:9,gap:8},budgetIcon:{width:32,height:32,borderRadius:10,backgroundColor:'rgba(232,246,246,.92)',alignItems:'center',justifyContent:'center'},budgetLabel:{width:68,fontSize:11,fontWeight:'900',color:COLORS.textMuted},budgetInput:{flex:1,minWidth:0,fontSize:16,fontWeight:'900',color:COLORS.text,textAlign:'right',paddingVertical:8},
  subHeader:{minHeight:40,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},subHeaderTitle:{flex:1,fontSize:14,fontWeight:'900',color:COLORS.text},subAction:{minHeight:34,paddingHorizontal:10,borderRadius:11,backgroundColor:'rgba(232,246,246,.94)',flexDirection:'row',alignItems:'center',gap:4},subActionText:{fontSize:11,fontWeight:'900',color:COLORS.primary},subCard:{padding:11,borderRadius:16,backgroundColor:'rgba(244,250,250,.86)',borderWidth:1,borderColor:'rgba(7,61,75,.08)',gap:9},subCardTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},subCardTitle:{flex:1,fontSize:12,fontWeight:'900',color:COLORS.text},iconDelete:{width:34,height:34,borderRadius:11,backgroundColor:'rgba(255,255,255,.86)',alignItems:'center',justifyContent:'center'},checkRow:{minHeight:42,borderRadius:12,backgroundColor:'rgba(255,255,255,.72)',paddingHorizontal:10,flexDirection:'row',alignItems:'center',gap:7},checkText:{fontSize:12,fontWeight:'800',color:COLORS.text},
  dayCard:{borderRadius:18,borderWidth:1,borderColor:'rgba(7,61,75,.09)',backgroundColor:'rgba(255,255,255,.74)',overflow:'hidden'},dayHead:{minHeight:62,padding:10,flexDirection:'row',alignItems:'center',gap:9},dayNo:{width:40,height:40,borderRadius:13,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},dayNoText:{fontSize:13,fontWeight:'900',color:'#fff'},dayTitle:{fontSize:14,fontWeight:'900',color:COLORS.text},dayMeta:{fontSize:10.5,color:COLORS.textMuted,marginTop:2},dayBody:{padding:11,paddingTop:10,gap:11,borderTopWidth:1,borderTopColor:'rgba(7,61,75,.07)'},
  dangerButton:{minHeight:44,borderRadius:13,backgroundColor:'rgba(224,92,102,.07)',borderWidth:1,borderColor:'rgba(224,92,102,.14)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},dangerText:{fontSize:12,fontWeight:'900',color:COLORS.danger},outlineButton:{minHeight:48,borderRadius:14,borderStyle:'dashed',borderWidth:1,borderColor:COLORS.primary,backgroundColor:'rgba(232,246,246,.58)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},outlineText:{fontSize:12.5,fontWeight:'900',color:COLORS.primary},
  nightRow:{flexDirection:'row',alignItems:'center',gap:7},nightNo:{width:34,height:34,borderRadius:11,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},nightNoText:{fontSize:11,fontWeight:'900',color:'#fff'},editorActions:{flexDirection:'row',gap:8,paddingBottom:8},
  tripCard:{padding:13,borderRadius:20,backgroundColor:'rgba(255,255,255,.82)',borderWidth:1,borderColor:'rgba(255,255,255,.68)',gap:10,...SHADOW.card},tripTop:{flexDirection:'row',alignItems:'center',gap:8},tripBadge:{width:40,height:40,borderRadius:13,backgroundColor:'rgba(232,246,246,.94)',alignItems:'center',justifyContent:'center'},tripTitle:{fontSize:16,fontWeight:'900',color:COLORS.text},tripMeta:{fontSize:10.5,color:COLORS.textMuted,marginTop:2},statusPill:{maxWidth:88,minHeight:28,paddingHorizontal:8,borderRadius:999,backgroundColor:'rgba(232,246,246,.92)',alignItems:'center',justifyContent:'center'},statusText:{fontSize:9.5,fontWeight:'900',color:COLORS.primary},tripProvince:{fontSize:11,fontWeight:'800',color:COLORS.textMuted},metrics:{flexDirection:'row',gap:7},metric:{flex:1,minWidth:0,padding:8,borderRadius:12,backgroundColor:'rgba(248,252,252,.82)'},metricLabel:{fontSize:9,fontWeight:'800',color:COLORS.textMuted},metricValue:{fontSize:12,fontWeight:'900',color:COLORS.text,marginTop:2},routeBox:{padding:9,borderRadius:12,backgroundColor:'rgba(232,246,246,.70)',flexDirection:'row',alignItems:'flex-start',gap:7},routeText:{flex:1,fontSize:11,lineHeight:17,fontWeight:'700',color:COLORS.text},
  cardActions:{flexDirection:'row',gap:7},smallButton:{height:44,paddingHorizontal:11,borderRadius:13,backgroundColor:'rgba(232,246,246,.90)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4},smallButtonText:{fontSize:11,fontWeight:'900',color:COLORS.primary},editButton:{flex:1,minWidth:0,minHeight:44},deleteButton:{width:44,height:44,borderRadius:13,backgroundColor:'rgba(255,255,255,.78)',alignItems:'center',justifyContent:'center'},
  preview:{gap:8,paddingTop:7,borderTopWidth:1,borderTopColor:'rgba(7,61,75,.07)'},previewDay:{flexDirection:'row',gap:8,paddingTop:4},previewNo:{width:32,height:32,borderRadius:10,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},previewNoText:{fontSize:10,fontWeight:'900',color:'#fff'},previewTitle:{fontSize:12.5,fontWeight:'900',color:COLORS.text,marginBottom:4},previewSlot:{flexDirection:'row',gap:7,paddingVertical:2},previewTime:{width:68,fontSize:9.5,fontWeight:'900',color:COLORS.primary},previewSlotText:{flex:1,fontSize:10.5,fontWeight:'700',color:COLORS.text},
});
