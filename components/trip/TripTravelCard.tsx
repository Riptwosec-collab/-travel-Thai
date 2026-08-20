import React, { useMemo, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SHADOW } from '@/constants/theme';
import { PLACES, PROVINCES } from '@/data/catalog';
import { useTravelStore } from '@/store/useTravelStore';
import type { Trip, TripActualExpense, TripDay, TripScheduleItem } from '@/types';

type Props={trip:Trip;onEdit:()=>void;onDelete:()=>void;onChange:(patch:Partial<Trip>)=>void};
type TimelineState='done'|'skipped'|'late'|'now'|'upcoming';
type ExpenseCategory=TripActualExpense['category'];
const EXPENSE_CATEGORIES:ExpenseCategory[]=['เดินทาง','ที่พัก','อาหาร','กิจกรรม','อื่น ๆ'];
const clean=(v?:string)=>(v||'').trim();
const enc=(v:string)=>encodeURIComponent(v);
const uid=()=>`expense-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

async function copyText(value:string){
  const text=clean(value);if(!text)return false;
  try{
    if(Platform.OS==='web'){
      const nav=(globalThis as any).navigator;
      if(nav?.clipboard?.writeText){await nav.clipboard.writeText(text);return true;}
      const win=(globalThis as any).window;if(win?.prompt){win.prompt('คัดลอกข้อความ',text);return true;}
    }
    await Share.share({message:text});return true;
  }catch{return false;}
}
async function openMapsSearch(name:string){const q=clean(name);if(q)await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${enc(q)}`)}
async function openGoogleSearch(name:string){const q=clean(name);if(q)await Linking.openURL(`https://www.google.com/search?q=${enc(q)}`)}
async function sharePlace(name:string,detail?:string){const title=clean(name);if(title)await Share.share({message:[title,clean(detail)].filter(Boolean).join('\n')})}

function makeRouteStops(trip:Trip,day?:TripDay){
  const dayStops=(day?.schedule||[]).map(x=>clean(x.title)).filter(Boolean);
  if(dayStops.length)return Array.from(new Set(dayStops));
  const explicit=(trip.routeStops||[]).map(clean).filter(Boolean);if(explicit.length)return explicit;
  return Array.from(new Set((trip.days||[]).flatMap(d=>(d.schedule||[]).map(x=>clean(x.title))).filter(Boolean))).slice(0,12);
}
async function openRoute(trip:Trip,day?:TripDay){
  const stops=makeRouteStops(trip,day);if(!stops.length)return;
  const origin=day?stops[0]:(clean(trip.origin)||stops[0]);
  const destination=stops[stops.length-1]||clean(trip.destinationSummary);
  const middle=stops.slice(1,-1).slice(0,8);
  await Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${enc(origin)}&destination=${enc(destination)}${middle.length?`&waypoints=${enc(middle.join('|'))}`:''}&travelmode=driving`);
}

function parseClockRange(value?:string){
  const s=clean(value).replace(/\./g,':');
  const m=s.match(/(\d{1,2}):(\d{2})(?:\s*(?:-|–|—|ถึง)\s*(\d{1,2}):(\d{2}))?/);
  if(!m)return null;
  const start=Number(m[1])*60+Number(m[2]);const end=m[3]?Number(m[3])*60+Number(m[4]):start+60;
  return {start,end};
}
function timelineState(item:TripScheduleItem,day?:TripDay):TimelineState{
  if(item.completed)return'done';if(item.skipped)return'skipped';
  const range=parseClockRange(item.time);if(!range)return'upcoming';
  const today=dateKey();const date=clean(day?.date);
  if(date&&date<today)return'late';if(date&&date>today)return'upcoming';
  const now=new Date().getHours()*60+new Date().getMinutes();
  if(now>range.end)return'late';if(now>=range.start&&now<=range.end)return'now';return'upcoming';
}
function minutesUntil(item?:TripScheduleItem,day?:TripDay){
  if(!item)return null;const range=parseClockRange(item.time);if(!range)return null;
  if(clean(day?.date)&&clean(day?.date)!==dateKey())return null;
  return Math.max(0,range.start-(new Date().getHours()*60+new Date().getMinutes()));
}
function routeIntel(day:TripDay){
  let km=0,minutes=0;
  const text=(day.schedule||[]).flatMap(x=>[x.detail,...(x.activities||[]),...(x.notes||[])]).filter(Boolean).join('\n');
  for(const line of text.split('\n')){
    const k=line.match(/(?:ระยะ(?:ทาง)?[^\d]{0,12})?(\d+(?:\.\d+)?)\s*(?:-|–|—|ถึง|~)?\s*(\d+(?:\.\d+)?)?\s*กม\.?/i);
    if(k&&/ระยะ|กม/.test(line)){const a=Number(k[1]),b=Number(k[2]||k[1]);km+=(a+b)/2;}
    const h=line.match(/(\d+(?:\.\d+)?)\s*(?:ชม\.?|ชั่วโมง)/i);const mn=line.match(/(\d+)\s*นาที/i);
    if(/เวลา|ขับ|เดินทาง/.test(line)){if(h)minutes+=Number(h[1])*60;if(mn)minutes+=Number(mn[1]);}
  }
  return {km:Math.round(km),minutes:Math.round(minutes)};
}
function formatDrive(min:number){if(!min)return'ไม่พบข้อมูล';const h=Math.floor(min/60),m=min%60;return h?`${h} ชม.${m?` ${m} นาที`:''}`:`${m} นาที`}

export default function TripTravelCard({trip,onEdit,onDelete,onChange}:Props){
  const router=useRouter();
  const [open,setOpen]=useState(false);const [travelMode,setTravelMode]=useState(false);const [selectedDay,setSelectedDay]=useState(0);
  const [actionItem,setActionItem]=useState<{item:TripScheduleItem;dayIndex:number;slotIndex:number}|null>(null);
  const [expenseOpen,setExpenseOpen]=useState(false);const [checklistOpen,setChecklistOpen]=useState(false);const [scoreOpen,setScoreOpen]=useState(false);
  const [expenseCategory,setExpenseCategory]=useState<ExpenseCategory>('อาหาร');const [expenseAmount,setExpenseAmount]=useState('');const [expenseNote,setExpenseNote]=useState('');const [expenseDay,setExpenseDay]=useState(1);
  const {visitedPlaceIds,wishlistPlaceIds,toggleVisitedPlace,toggleWishlistPlace}=useTravelStore();
  const provinceNames=(trip.provinceIds||[]).map(id=>PROVINCES.find(p=>p.id===id)?.nameTh).filter(Boolean).join(' · ');
  const schedules=(trip.days||[]).flatMap(d=>d.schedule||[]);const doneCount=schedules.filter(x=>x.completed).length;const skippedCount=schedules.filter(x=>x.skipped).length;
  const progress=schedules.length?Math.round((doneCount+skippedCount)/schedules.length*100):0;
  const activeDay=(trip.days||[])[Math.min(selectedDay,Math.max(0,(trip.days||[]).length-1))];
  const nextStop=(activeDay?.schedule||[]).find(x=>!x.completed&&!x.skipped);const until=minutesUntil(nextStop,activeDay);
  const routeStops=useMemo(()=>makeRouteStops(trip),[trip]);const routeStats=useMemo(()=>routeIntel(activeDay||{day:1,placeIds:[]}),[activeDay]);
  const expenses=trip.actualExpenses||[];const actualTotal=expenses.reduce((sum,x)=>sum+(Number(x.amount)||0),0);const remaining=(trip.budget||0)-actualTotal;
  const todaySpend=expenses.filter(x=>x.day===selectedDay+1).reduce((sum,x)=>sum+x.amount,0);
  const checklistDone=trip.checklistDone||[];
  const beforeItems=(trip.packingList?.length?trip.packingList:['ตรวจเอกสาร/เงิน/โทรศัพท์','เช็กสภาพอากาศและการเดินทาง']).map((text,i)=>({key:`before:${i}:${text}`,text}));
  const duringItems=(trip.days||[]).flatMap((d,i)=>[
    d.route?{key:`during:route:${i}`,text:`เช็กเส้นทาง DAY ${i+1}: ${d.route}`} : null,
    d.accommodation?{key:`during:hotel:${i}`,text:`Check-in DAY ${i+1}: ${d.accommodation}`} : null,
  ].filter(Boolean) as {key:string;text:string}[]);
  const placeItems=(trip.days||[]).flatMap((d,di)=>(d.schedule||[]).map((x,si)=>({key:`place:${x.id||`${di}-${si}`}`,text:x.title,di,si,done:!!x.completed})));
  const checkTotal=beforeItems.length+duringItems.length+placeItems.length;const checkedCount=beforeItems.filter(x=>checklistDone.includes(x.key)).length+duringItems.filter(x=>checklistDone.includes(x.key)).length+placeItems.filter(x=>x.done).length;
  const scoreParts=[
    {label:'เดินทางตาม Timeline',value:schedules.length?Math.round(doneCount/schedules.length*35):0,max:35},
    {label:'Checklist',value:checkTotal?Math.round(checkedCount/checkTotal*20):0,max:20},
    {label:'บันทึกค่าใช้จ่ายจริง',value:expenses.length?15:0,max:15},
    {label:'มี Route พร้อมใช้',value:routeStops.length>=2?10:0,max:10},
    {label:'ควบคุมงบ',value:expenses.length&&remaining>=0?10:0,max:10},
    {label:'จบทริป',value:trip.status==='จบทริป'?10:0,max:10},
  ];
  const score=scoreParts.reduce((sum,x)=>sum+x.value,0);const level=score>=90?'THAILAND MASTER':score>=70?'ADVENTURER':score>=45?'TRAVELLER':'EXPLORER';

  const setScheduleFlag=(di:number,si:number,patch:Partial<TripScheduleItem>)=>onChange({days:(trip.days||[]).map((d,i)=>i!==di?d:{...d,schedule:(d.schedule||[]).map((x,j)=>j===si?{...x,...patch}:x)})});
  const moveSlot=(di:number,si:number,delta:number)=>{const days=[...(trip.days||[])];const day=days[di];if(!day)return;const arr=[...(day.schedule||[])];const to=si+delta;if(to<0||to>=arr.length)return;[arr[si],arr[to]]=[arr[to],arr[si]];days[di]={...day,schedule:arr};onChange({days})};
  const toggleChecklist=(key:string)=>onChange({checklistDone:checklistDone.includes(key)?checklistDone.filter(x=>x!==key):[...checklistDone,key]});
  const togglePlaceCheck=(x:{key:string;di:number;si:number;done:boolean})=>setScheduleFlag(x.di,x.si,{completed:!x.done,skipped:false});
  const addExpense=()=>{const amount=Number(expenseAmount.replace(/,/g,''));if(!amount||amount<=0)return;onChange({actualExpenses:[...expenses,{id:uid(),category:expenseCategory,amount,note:clean(expenseNote)||undefined,day:expenseDay,createdAt:new Date().toISOString()}]});setExpenseAmount('');setExpenseNote('')};
  const removeExpense=(id:string)=>onChange({actualExpenses:expenses.filter(x=>x.id!==id)});
  const selectedPlace=actionItem?PLACES.find(p=>clean(p.name).toLowerCase()===clean(actionItem.item.title).toLowerCase()):undefined;
  const selectedVisited=!!selectedPlace&&visitedPlaceIds.includes(selectedPlace.id);const selectedWish=!!selectedPlace&&wishlistPlaceIds.includes(selectedPlace.id);

  return <View style={s.card}>
    <View style={s.top}><View style={s.badge}><Ionicons name="briefcase-outline" size={18} color={COLORS.primary}/></View><View style={s.flex}><Text style={s.title}>{trip.title}</Text><Text style={s.meta}>{trip.startDate} → {trip.endDate}</Text></View><View style={s.status}><Text style={s.statusText}>{trip.status||'วางแผน'}</Text></View></View>
    {!!provinceNames&&<Text style={s.province}>{provinceNames}</Text>}
    <View style={s.metrics}><Metric label="วัน" value={String(trip.days?.length||0)}/><Metric label="ความคืบหน้า" value={`${progress}%`}/><Metric label="จ่ายจริง" value={`${actualTotal.toLocaleString()}฿`}/></View>
    <View style={s.progressTrack}><View style={[s.progressFill,{width:`${progress}%`}]}/></View>

    <View style={s.primaryActions}>
      <Pressable style={[s.bigAction,travelMode&&s.bigActionOn]} onPress={()=>{setTravelMode(v=>!v);setOpen(true)}}><Ionicons name={travelMode?'stop-circle-outline':'navigate-circle-outline'} size={19} color={travelMode?'#fff':COLORS.primary}/><Text style={[s.bigActionText,travelMode&&s.bigActionTextOn]}>{travelMode?'ออก Travel Mode':'Travel Mode 2.0'}</Text></Pressable>
      <Pressable style={s.squareAction} onPress={()=>openRoute(trip)}><Ionicons name="map-outline" size={19} color={COLORS.primary}/></Pressable>
      <Pressable style={s.squareAction} onPress={()=>setExpenseOpen(v=>!v)}><Ionicons name="wallet-outline" size={19} color={COLORS.primary}/></Pressable>
    </View>

    <View style={s.toolGrid}>
      <Tool icon="git-network-outline" label="Route Intelligence" value={`${routeStops.length} จุด`} onPress={()=>setOpen(true)}/>
      <Tool icon="checkbox-outline" label="Checklist" value={`${checkedCount}/${checkTotal}`} onPress={()=>setChecklistOpen(v=>!v)}/>
      <Tool icon="speedometer-outline" label="Travel Score" value={`${score}/100`} onPress={()=>setScoreOpen(v=>!v)}/>
    </View>

    {scoreOpen&&<Panel title={`TRAVEL SCORE · ${level}`} icon="trophy-outline"><Text style={s.scoreBig}>{score}</Text>{scoreParts.map(x=><View key={x.label} style={s.scoreRow}><Text style={s.scoreLabel}>{x.label}</Text><Text style={s.scoreValue}>+{x.value}/{x.max}</Text></View>)}</Panel>}

    {expenseOpen&&<Panel title="ACTUAL EXPENSE 2.0" icon="receipt-outline">
      <View style={s.moneySummary}><Money label="งบตั้งไว้" value={trip.budget||0}/><Money label="จ่ายจริง" value={actualTotal}/><Money label={remaining>=0?'คงเหลือ':'เกินงบ'} value={Math.abs(remaining)} danger={remaining<0}/></View>
      <Text style={s.helper}>DAY {selectedDay+1} จ่ายแล้ว {todaySpend.toLocaleString()} บาท</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{EXPENSE_CATEGORIES.map(x=><Pressable key={x} onPress={()=>setExpenseCategory(x)} style={[s.chip,expenseCategory===x&&s.chipOn]}><Text style={[s.chipText,expenseCategory===x&&s.chipTextOn]}>{x}</Text></Pressable>)}</ScrollView>
      <View style={s.inputRow}><TextInput value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="numeric" placeholder="จำนวนเงิน" placeholderTextColor={COLORS.textMuted} style={[s.input,s.flex]}/><Pressable style={s.dayExpense} onPress={()=>setExpenseDay(expenseDay>=(trip.days?.length||1)?1:expenseDay+1)}><Text style={s.dayExpenseText}>DAY {expenseDay}</Text></Pressable></View>
      <TextInput value={expenseNote} onChangeText={setExpenseNote} placeholder="หมายเหตุ เช่น ข้าวกลางวัน" placeholderTextColor={COLORS.textMuted} style={s.input}/>
      <Pressable style={s.addButton} onPress={addExpense}><Ionicons name="add" size={17} color="#fff"/><Text style={s.addButtonText}>เพิ่มค่าใช้จ่ายจริง</Text></Pressable>
      {!!expenses.length&&<View style={s.expenseList}>{expenses.slice().reverse().slice(0,8).map(x=><View key={x.id} style={s.expenseRow}><View style={s.flex}><Text style={s.expenseTitle}>{x.category} · DAY {x.day||1}</Text><Text style={s.expenseNote}>{x.note||'ไม่มีหมายเหตุ'}</Text></View><Text style={s.expenseAmount}>{x.amount.toLocaleString()}฿</Text><Pressable onPress={()=>removeExpense(x.id)}><Ionicons name="close-circle" size={18} color={COLORS.danger}/></Pressable></View>)}</View>}
    </Panel>}

    {checklistOpen&&<Panel title="CHECKLIST · 3 หมวด" icon="checkbox-outline">
      <ChecklistGroup title="ก่อนเดินทาง" items={beforeItems} done={checklistDone} onToggle={toggleChecklist}/>
      <ChecklistGroup title="ระหว่างเดินทาง" items={duringItems} done={checklistDone} onToggle={toggleChecklist}/>
      <View style={s.checkGroup}><Text style={s.checkGroupTitle}>สถานที่</Text>{placeItems.map(x=><Pressable key={x.key} style={s.checkRow} onPress={()=>togglePlaceCheck(x)}><Ionicons name={x.done?'checkbox':'square-outline'} size={20} color={x.done?'#2FAE68':COLORS.primary}/><Text style={[s.checkText,x.done&&s.doneText]}>{x.text}</Text></Pressable>)}</View>
    </Panel>}

    {!!routeStops.length&&<View style={s.routeCard}><View style={s.sectionHead}><View><Text style={s.eyebrow}>ROUTE INTELLIGENCE</Text><Text style={s.sectionTitle}>{routeStops.length} จุด · {routeStats.km?`~${routeStats.km} กม.`:'ระยะทางไม่ครบ'} · {formatDrive(routeStats.minutes)}</Text></View><Pressable onPress={()=>openRoute(trip,activeDay)}><Text style={s.linkText}>Maps DAY</Text></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.routeScroll}>{routeStops.map((name,i)=><React.Fragment key={`${name}-${i}`}><View style={s.routeStop}><View style={s.routeNo}><Text style={s.routeNoText}>{i+1}</Text></View><Text numberOfLines={2} style={s.routeStopText}>{name}</Text></View>{i<routeStops.length-1&&<Ionicons name="arrow-forward" size={14} color={COLORS.textMuted}/>}</React.Fragment>)}</ScrollView></View>}

    {travelMode&&<View style={s.travelPanel}>
      <View style={s.sectionHead}><View><Text style={s.eyebrow}>LIVE TRIP · {progress}%</Text><Text style={s.sectionTitle}>{trip.title}</Text></View><Text style={s.liveBadge}>DAY {selectedDay+1}</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{(trip.days||[]).map((d,i)=><Pressable key={d.day||i} onPress={()=>setSelectedDay(i)} style={[s.chip,selectedDay===i&&s.chipOn]}><Text style={[s.chipText,selectedDay===i&&s.chipTextOn]}>DAY {i+1}</Text></Pressable>)}</ScrollView>
      {nextStop?<View style={s.nextCard}><Text style={s.nextLabel}>จุดถัดไป {until!==null&&until>0?`· อีก ${until} นาที`:''}</Text><Text style={s.nextTime}>{nextStop.time||'ไม่ระบุเวลา'}</Text><Text style={s.nextTitle}>{nextStop.title}</Text><View style={s.nextActions}><Mini icon="navigate-outline" label="นำทาง" onPress={()=>openMapsSearch(nextStop.title)}/><Mini icon="checkmark-circle-outline" label="ถึงแล้ว" onPress={()=>{const i=(activeDay?.schedule||[]).indexOf(nextStop);if(i>=0)setScheduleFlag(selectedDay,i,{completed:true,skipped:false})}}/><Mini icon="play-skip-forward-outline" label="ข้าม" onPress={()=>{const i=(activeDay?.schedule||[]).indexOf(nextStop);if(i>=0)setScheduleFlag(selectedDay,i,{skipped:true,completed:false})}}/><Mini icon="ellipsis-horizontal" label="เพิ่มเติม" onPress={()=>{const i=(activeDay?.schedule||[]).indexOf(nextStop);if(i>=0)setActionItem({item:nextStop,dayIndex:selectedDay,slotIndex:i})}}/></View></View>:<View style={s.completeCard}><Ionicons name="checkmark-done-circle" size={28} color="#2FAE68"/><Text style={s.completeText}>DAY นี้ครบแล้ว</Text></View>}
      <Timeline day={activeDay} dayIndex={selectedDay} onAction={(item,si)=>setActionItem({item,dayIndex:selectedDay,slotIndex:si})} onDone={(si,done)=>setScheduleFlag(selectedDay,si,{completed:done,skipped:false})} onSkip={(si,skip)=>setScheduleFlag(selectedDay,si,{skipped:skip,completed:false})} onMove={(si,d)=>moveSlot(selectedDay,si,d)}/>
      {!!activeDay?.accommodation&&<View style={s.infoLine}><Ionicons name="bed-outline" size={15} color={COLORS.primary}/><Text style={s.infoText}>คืนนี้: {activeDay.accommodation}</Text></View>}
      {!!trip.importantNotes?.length&&<View style={s.warning}>{trip.importantNotes.slice(0,4).map((x,i)=><Text key={i} style={s.warningText}>⚠ {x}</Text>)}</View>}
    </View>}

    {open&&!travelMode&&<View style={s.plan}>{(trip.days||[]).map((day,di)=><View key={day.day||di} style={s.dayBlock}><View style={s.dayHeader}><View style={s.dayNo}><Text style={s.dayNoText}>{di+1}</Text></View><View style={s.flex}><Text style={s.dayTitle}>{day.title||`DAY ${di+1}`}</Text><Text style={s.dayMeta}>{day.date||'-'} · {routeIntel(day).km?`~${routeIntel(day).km} กม.`:'ไม่มีระยะรวม'} · {formatDrive(routeIntel(day).minutes)}</Text></View><Pressable onPress={()=>openRoute(trip,day)}><Ionicons name="navigate-outline" size={19} color={COLORS.primary}/></Pressable></View><Timeline day={day} dayIndex={di} onAction={(item,si)=>setActionItem({item,dayIndex:di,slotIndex:si})} onDone={(si,done)=>setScheduleFlag(di,si,{completed:done,skipped:false})} onSkip={(si,skip)=>setScheduleFlag(di,si,{skipped:skip,completed:false})} onMove={(si,d)=>moveSlot(di,si,d)}/>{!!day.accommodation&&<View style={s.infoLine}><Ionicons name="bed-outline" size={15} color={COLORS.primary}/><Text style={s.infoText}>ที่พัก: {day.accommodation}</Text></View>}</View>)}</View>}

    <View style={s.bottomActions}><Pressable style={s.viewButton} onPress={()=>setOpen(v=>!v)}><Ionicons name={open?'chevron-up':'eye-outline'} size={17} color={COLORS.primary}/><Text style={s.viewText}>{open?'ย่อ':'ดูแผน'}</Text></Pressable><Pressable style={s.editButton} onPress={onEdit}><Ionicons name="create-outline" size={17} color="#fff"/><Text style={s.editText}>แก้ไขทั้งหมด</Text></Pressable><Pressable style={s.deleteButton} onPress={onDelete}><Ionicons name="trash-outline" size={18} color={COLORS.danger}/></Pressable></View>

    <Modal transparent visible={!!actionItem} animationType="slide" onRequestClose={()=>setActionItem(null)}><View style={s.modalRoot}><Pressable style={s.backdrop} onPress={()=>setActionItem(null)}/>{actionItem&&<View style={s.sheet}><View style={s.handle}/><Text style={s.sheetTitle}>{actionItem.item.title}</Text><Text style={s.sheetMeta}>{actionItem.item.time||'ไม่ระบุเวลา'}</Text><View style={s.sheetGrid}>
      <SheetAction icon="navigate-outline" label="นำทาง" onPress={()=>openMapsSearch(actionItem.item.title)}/><SheetAction icon="copy-outline" label="Copy ชื่อ" onPress={()=>copyText(actionItem.item.title)}/><SheetAction icon="documents-outline" label="Copy รายละเอียด" onPress={()=>copyText([actionItem.item.title,actionItem.item.detail,...(actionItem.item.activities||[]),...(actionItem.item.notes||[])].filter(Boolean).join('\n'))}/><SheetAction icon="search-outline" label="ค้นหา Google" onPress={()=>openGoogleSearch(actionItem.item.title)}/><SheetAction icon="share-outline" label="แชร์" onPress={()=>sharePlace(actionItem.item.title,actionItem.item.detail)}/><SheetAction icon={actionItem.item.completed?'refresh-outline':'checkmark-circle-outline'} label={actionItem.item.completed?'ยกเลิกไปแล้ว':'ทำเครื่องหมายไปแล้ว'} onPress={()=>setScheduleFlag(actionItem.dayIndex,actionItem.slotIndex,{completed:!actionItem.item.completed,skipped:false})}/>{selectedPlace&&<SheetAction icon={selectedWish?'heart':'heart-outline'} label={selectedWish?'เอาออก Wishlist':'เพิ่ม Wishlist'} onPress={()=>toggleWishlistPlace(selectedPlace.id)}/>} {selectedPlace&&<SheetAction icon={selectedVisited?'checkmark-done':'checkmark-outline'} label={selectedVisited?'เอาออก ไปแล้ว':'เพิ่ม ไปแล้ว'} onPress={()=>toggleVisitedPlace(selectedPlace.id)}/>}<SheetAction icon="book-outline" label="เพิ่ม Journal" onPress={()=>{setActionItem(null);router.push('/journal')}}/><SheetAction icon="map-outline" label="ดูแผนที่" onPress={()=>{setActionItem(null);router.push('/(tabs)/map')}}/>
    </View></View>}</View></Modal>
  </View>;
}

function Timeline({day,dayIndex,onAction,onDone,onSkip,onMove}:{day?:TripDay;dayIndex:number;onAction:(item:TripScheduleItem,slotIndex:number)=>void;onDone:(slotIndex:number,done:boolean)=>void;onSkip:(slotIndex:number,skip:boolean)=>void;onMove:(slotIndex:number,delta:number)=>void}){
  if(!day)return null;return <View style={s.timeline}>{(day.schedule||[]).map((item,index)=>{const state=timelineState(item,day);return <View key={item.id||index} style={[s.timelineRow,(state==='done'||state==='skipped')&&s.timelineMuted,state==='now'&&s.timelineNow,state==='late'&&s.timelineLate]}><View style={s.timeCol}><Text style={s.time}>{item.time||'--:--'}</Text><View style={[s.dot,state==='done'&&s.dotDone,state==='now'&&s.dotNow,state==='late'&&s.dotLate,state==='skipped'&&s.dotSkipped]}>{state==='done'&&<Ionicons name="checkmark" size={10} color="#fff"/>}</View>{index<(day.schedule||[]).length-1&&<View style={s.line}/>}</View><View style={s.slot}><View style={s.slotHead}><Pressable style={s.slotTitleWrap} onPress={()=>onAction(item,index)}><Text style={[s.slotTitle,state==='done'&&s.doneText,state==='skipped'&&s.doneText]}>{item.title||'กิจกรรม'}</Text><StateBadge state={state}/></Pressable><Pressable style={s.more} onPress={()=>onAction(item,index)}><Ionicons name="ellipsis-horizontal" size={18} color={COLORS.primary}/></Pressable></View>{!!item.detail&&<Text style={s.detail}>{item.detail}</Text>}{!!item.notes?.length&&<View style={s.noteBox}>{item.notes.slice(0,3).map((x,i)=><Text key={i} style={s.note}>⚠ {x}</Text>)}</View>}<View style={s.timelineActions}><Mini icon={item.completed?'checkmark-circle':'ellipse-outline'} label={item.completed?'เสร็จ':'ถึงแล้ว'} onPress={()=>onDone(index,!item.completed)}/><Mini icon={item.skipped?'refresh-outline':'play-skip-forward-outline'} label={item.skipped?'คืน':'ข้าม'} onPress={()=>onSkip(index,!item.skipped)}/><Mini icon="arrow-up-outline" label="ขึ้น" onPress={()=>onMove(index,-1)}/><Mini icon="arrow-down-outline" label="ลง" onPress={()=>onMove(index,1)}/></View></View></View>})}</View>
}
function StateBadge({state}:{state:TimelineState}){const label=state==='done'?'เสร็จแล้ว':state==='skipped'?'ข้าม':state==='late'?'เลยเวลา':state==='now'?'กำลังเที่ยว':'กำลังจะถึง';return <View style={[s.stateBadge,s[`state_${state}`] as any]}><Text style={s.stateText}>{label}</Text></View>}
function Panel({title,icon,children}:{title:string;icon:string;children:React.ReactNode}){return <View style={s.panel}><View style={s.panelHead}><Ionicons name={icon as any} size={17} color={COLORS.primary}/><Text style={s.panelTitle}>{title}</Text></View>{children}</View>}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text numberOfLines={1} style={s.metricValue}>{value}</Text></View>}
function Tool({icon,label,value,onPress}:{icon:string;label:string;value:string;onPress:()=>void}){return <Pressable style={s.tool} onPress={onPress}><Ionicons name={icon as any} size={17} color={COLORS.primary}/><Text style={s.toolLabel}>{label}</Text><Text style={s.toolValue}>{value}</Text></Pressable>}
function Money({label,value,danger}:{label:string;value:number;danger?:boolean}){return <View style={s.money}><Text style={s.moneyLabel}>{label}</Text><Text style={[s.moneyValue,danger&&s.danger]}>{value.toLocaleString()}฿</Text></View>}
function Mini({icon,label,onPress}:{icon:string;label:string;onPress:()=>void}){return <Pressable style={s.mini} onPress={onPress}><Ionicons name={icon as any} size={14} color={COLORS.primary}/><Text style={s.miniText}>{label}</Text></Pressable>}
function SheetAction({icon,label,onPress}:{icon:string;label:string;onPress:()=>void}){return <Pressable style={s.sheetAction} onPress={onPress}><View style={s.sheetIcon}><Ionicons name={icon as any} size={20} color={COLORS.primary}/></View><Text style={s.sheetActionText}>{label}</Text></Pressable>}
function ChecklistGroup({title,items,done,onToggle}:{title:string;items:{key:string;text:string}[];done:string[];onToggle:(key:string)=>void}){return <View style={s.checkGroup}><Text style={s.checkGroupTitle}>{title}</Text>{items.length?items.map(x=>{const on=done.includes(x.key);return <Pressable key={x.key} style={s.checkRow} onPress={()=>onToggle(x.key)}><Ionicons name={on?'checkbox':'square-outline'} size={20} color={on?'#2FAE68':COLORS.primary}/><Text style={[s.checkText,on&&s.doneText]}>{x.text}</Text></Pressable>}):<Text style={s.helper}>ยังไม่มีรายการ</Text>}</View>}

const s=StyleSheet.create({
  card:{padding:13,borderRadius:18,backgroundColor:'rgba(255,255,255,.9)',borderWidth:1,borderColor:'rgba(255,255,255,.74)',gap:10,...SHADOW.card},flex:{flex:1,minWidth:0},top:{flexDirection:'row',alignItems:'center',gap:8},badge:{width:40,height:40,borderRadius:12,backgroundColor:'rgba(232,246,246,.96)',alignItems:'center',justifyContent:'center'},title:{fontSize:16,lineHeight:21,fontWeight:'900',color:COLORS.text},meta:{fontSize:10,color:COLORS.textMuted,marginTop:2},province:{fontSize:10.5,fontWeight:'800',color:COLORS.textMuted},status:{maxWidth:88,minHeight:28,paddingHorizontal:8,borderRadius:999,backgroundColor:'rgba(232,246,246,.94)',alignItems:'center',justifyContent:'center'},statusText:{fontSize:9,fontWeight:'900',color:COLORS.primary},
  metrics:{flexDirection:'row',gap:7},metric:{flex:1,minWidth:0,padding:8,borderRadius:11,backgroundColor:'rgba(248,252,252,.94)'},metricLabel:{fontSize:8.5,fontWeight:'800',color:COLORS.textMuted},metricValue:{fontSize:11.5,fontWeight:'900',color:COLORS.text,marginTop:2},progressTrack:{height:5,borderRadius:999,backgroundColor:'rgba(7,61,75,.08)',overflow:'hidden'},progressFill:{height:'100%',borderRadius:999,backgroundColor:COLORS.primary},
  primaryActions:{flexDirection:'row',gap:7},bigAction:{flex:1,minHeight:46,borderRadius:13,backgroundColor:'rgba(232,246,246,.96)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},bigActionOn:{backgroundColor:COLORS.dark},bigActionText:{fontSize:10.5,fontWeight:'900',color:COLORS.primary},bigActionTextOn:{color:'#fff'},squareAction:{width:46,height:46,borderRadius:13,backgroundColor:'rgba(232,246,246,.96)',alignItems:'center',justifyContent:'center'},
  toolGrid:{flexDirection:'row',gap:7},tool:{flex:1,minWidth:0,minHeight:68,borderRadius:12,padding:8,backgroundColor:'rgba(248,252,252,.94)',justifyContent:'space-between'},toolLabel:{fontSize:8.5,lineHeight:11,fontWeight:'800',color:COLORS.textMuted},toolValue:{fontSize:10.5,fontWeight:'900',color:COLORS.text},
  panel:{borderRadius:14,padding:11,gap:9,backgroundColor:'rgba(246,251,251,.96)',borderWidth:1,borderColor:'rgba(7,61,75,.08)'},panelHead:{flexDirection:'row',alignItems:'center',gap:6},panelTitle:{fontSize:11,fontWeight:'900',color:COLORS.text},helper:{fontSize:9.5,lineHeight:14,color:COLORS.textMuted},
  scoreBig:{fontSize:34,fontWeight:'900',color:COLORS.primary},scoreRow:{minHeight:30,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'rgba(7,61,75,.06)'},scoreLabel:{fontSize:9.5,fontWeight:'700',color:COLORS.text},scoreValue:{fontSize:9.5,fontWeight:'900',color:COLORS.primary},
  moneySummary:{flexDirection:'row',gap:6},money:{flex:1,minWidth:0,padding:8,borderRadius:10,backgroundColor:'#fff'},moneyLabel:{fontSize:8,fontWeight:'800',color:COLORS.textMuted},moneyValue:{fontSize:11,fontWeight:'900',color:COLORS.text,marginTop:2},danger:{color:COLORS.danger},chips:{gap:6,paddingRight:6},chip:{minHeight:34,paddingHorizontal:10,borderRadius:999,backgroundColor:'rgba(7,61,75,.06)',alignItems:'center',justifyContent:'center'},chipOn:{backgroundColor:COLORS.primary},chipText:{fontSize:9,fontWeight:'800',color:COLORS.textMuted},chipTextOn:{color:'#fff'},inputRow:{flexDirection:'row',gap:7},input:{minHeight:44,borderRadius:11,borderWidth:1,borderColor:'rgba(7,61,75,.10)',backgroundColor:'#fff',paddingHorizontal:11,fontSize:11,color:COLORS.text},dayExpense:{width:72,minHeight:44,borderRadius:11,backgroundColor:'rgba(7,90,110,.10)',alignItems:'center',justifyContent:'center'},dayExpenseText:{fontSize:9.5,fontWeight:'900',color:COLORS.primary},addButton:{minHeight:44,borderRadius:12,backgroundColor:COLORS.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},addButtonText:{fontSize:10.5,fontWeight:'900',color:'#fff'},expenseList:{gap:4},expenseRow:{minHeight:48,flexDirection:'row',alignItems:'center',gap:8,paddingVertical:5,borderBottomWidth:1,borderBottomColor:'rgba(7,61,75,.06)'},expenseTitle:{fontSize:9.5,fontWeight:'900',color:COLORS.text},expenseNote:{fontSize:8.5,color:COLORS.textMuted,marginTop:1},expenseAmount:{fontSize:10,fontWeight:'900',color:COLORS.text},
  checkGroup:{gap:5},checkGroupTitle:{fontSize:10,fontWeight:'900',color:COLORS.primary,marginTop:2},checkRow:{minHeight:38,flexDirection:'row',alignItems:'center',gap:7},checkText:{flex:1,fontSize:9.5,lineHeight:14,fontWeight:'700',color:COLORS.text},doneText:{textDecorationLine:'line-through',color:COLORS.textMuted},
  routeCard:{borderRadius:14,padding:10,gap:8,backgroundColor:'rgba(247,251,251,.96)',borderWidth:1,borderColor:'rgba(7,61,75,.08)'},sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},eyebrow:{fontSize:8,fontWeight:'900',letterSpacing:.8,color:COLORS.primary},sectionTitle:{fontSize:10.5,lineHeight:15,fontWeight:'900',color:COLORS.text,marginTop:2},linkText:{fontSize:9,fontWeight:'900',color:COLORS.primary},routeScroll:{alignItems:'center',gap:6,paddingRight:5},routeStop:{width:82,alignItems:'center',gap:4},routeNo:{width:24,height:24,borderRadius:12,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center'},routeNoText:{fontSize:9,fontWeight:'900',color:'#fff'},routeStopText:{fontSize:8.5,lineHeight:12,fontWeight:'800',textAlign:'center',color:COLORS.text},
  travelPanel:{borderRadius:15,padding:11,gap:10,backgroundColor:'rgba(236,248,248,.98)',borderWidth:1,borderColor:'rgba(7,90,110,.12)'},liveBadge:{fontSize:9,fontWeight:'900',color:COLORS.primary},nextCard:{padding:12,borderRadius:13,backgroundColor:'#fff',gap:4},nextLabel:{fontSize:8.5,fontWeight:'900',color:COLORS.primary},nextTime:{fontSize:10,fontWeight:'900',color:COLORS.textMuted},nextTitle:{fontSize:17,lineHeight:22,fontWeight:'900',color:COLORS.text},nextActions:{flexDirection:'row',gap:5,marginTop:5,flexWrap:'wrap'},completeCard:{minHeight:72,borderRadius:13,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',gap:3},completeText:{fontSize:11,fontWeight:'900',color:'#2FAE68'},
  timeline:{gap:3},timelineRow:{flexDirection:'row',minHeight:82,borderRadius:11,padding:6,backgroundColor:'rgba(255,255,255,.86)'},timelineMuted:{opacity:.58},timelineNow:{borderWidth:1,borderColor:'rgba(7,144,160,.34)',backgroundColor:'rgba(229,249,249,.98)'},timelineLate:{borderWidth:1,borderColor:'rgba(224,92,102,.16)'},timeCol:{width:58,alignItems:'center',position:'relative'},time:{fontSize:8.5,fontWeight:'900',color:COLORS.textMuted,textAlign:'center'},dot:{width:18,height:18,borderRadius:9,marginTop:4,backgroundColor:'rgba(7,90,110,.15)',alignItems:'center',justifyContent:'center',zIndex:2},dotDone:{backgroundColor:'#2FAE68'},dotNow:{backgroundColor:COLORS.primary},dotLate:{backgroundColor:COLORS.danger},dotSkipped:{backgroundColor:'#9BA1A6'},line:{position:'absolute',top:42,bottom:-10,width:2,backgroundColor:'rgba(7,61,75,.08)'},slot:{flex:1,minWidth:0,paddingLeft:3,gap:4},slotHead:{flexDirection:'row',alignItems:'flex-start',gap:5},slotTitleWrap:{flex:1,minWidth:0},slotTitle:{fontSize:11,lineHeight:15,fontWeight:'900',color:COLORS.text},more:{width:32,height:32,borderRadius:10,backgroundColor:'rgba(232,246,246,.92)',alignItems:'center',justifyContent:'center'},detail:{fontSize:9,lineHeight:14,color:COLORS.textMuted},noteBox:{padding:7,borderRadius:9,backgroundColor:'rgba(224,92,102,.06)'},note:{fontSize:8.5,lineHeight:13,color:COLORS.danger},timelineActions:{flexDirection:'row',gap:4,flexWrap:'wrap'},stateBadge:{alignSelf:'flex-start,minHeight:20,paddingHorizontal:6,borderRadius:999,justifyContent:'center',marginTop:2},state_done:{backgroundColor:'rgba(47,174,104,.12)'},state_skipped:{backgroundColor:'rgba(155,161,166,.15)'},state_late:{backgroundColor:'rgba(224,92,102,.10)'},state_now:{backgroundColor:'rgba(7,144,160,.13)'},state_upcoming:{backgroundColor:'rgba(233,185,91,.15)'},stateText:{fontSize:7.5,fontWeight:'900',color:COLORS.textMuted},mini:{minHeight:32,paddingHorizontal:7,borderRadius:9,backgroundColor:'rgba(232,246,246,.92)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:3},miniText:{fontSize:8,fontWeight:'900',color:COLORS.primary},
  infoLine:{minHeight:38,flexDirection:'row',alignItems:'center',gap:6,padding:8,borderRadius:10,backgroundColor:'rgba(232,246,246,.7)'},infoText:{flex:1,fontSize:9,lineHeight:14,color:COLORS.text},warning:{padding:9,borderRadius:10,backgroundColor:'rgba(224,92,102,.07)'},warningText:{fontSize:8.5,lineHeight:13,color:COLORS.danger},
  plan:{gap:10},dayBlock:{gap:7,paddingTop:4},dayHeader:{flexDirection:'row',alignItems:'center',gap:7},dayNo:{width:32,height:32,borderRadius:10,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center'},dayNoText:{fontSize:11,fontWeight:'900',color:'#fff'},dayTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},dayMeta:{fontSize:8.5,lineHeight:13,color:COLORS.textMuted,marginTop:2},
  bottomActions:{flexDirection:'row',gap:6},viewButton:{flex:1,minHeight:42,borderRadius:12,backgroundColor:'rgba(232,246,246,.94)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},viewText:{fontSize:9.5,fontWeight:'900',color:COLORS.primary},editButton:{flex:1.3,minHeight:42,borderRadius:12,backgroundColor:COLORS.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},editText:{fontSize:9.5,fontWeight:'900',color:'#fff'},deleteButton:{width:42,height:42,borderRadius:12,backgroundColor:'rgba(224,92,102,.08)',alignItems:'center',justifyContent:'center'},
  modalRoot:{flex:1,justifyContent:'flex-end'},backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,20,28,.48)'},sheet:{borderTopLeftRadius:24,borderTopRightRadius:24,backgroundColor:'#F4FBFB',padding:14,paddingBottom:28,gap:5},handle:{width:42,height:4,borderRadius:3,backgroundColor:'rgba(7,61,75,.18)',alignSelf:'center',marginBottom:5},sheetTitle:{fontSize:18,lineHeight:23,fontWeight:'900',color:COLORS.text},sheetMeta:{fontSize:9.5,fontWeight:'800',color:COLORS.textMuted},sheetGrid:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:7},sheetAction:{width:'48%',minHeight:70,borderRadius:13,backgroundColor:'#fff',padding:9,justifyContent:'center',gap:5},sheetIcon:{width:32,height:32,borderRadius:10,backgroundColor:'rgba(232,246,246,.96)',alignItems:'center',justifyContent:'center'},sheetActionText:{fontSize:9.5,lineHeight:13,fontWeight:'900',color:COLORS.text},
});
