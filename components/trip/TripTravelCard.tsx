import React, { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '@/constants/theme';
import { PROVINCES } from '@/data/catalog';
import type { Trip, TripDay, TripScheduleItem } from '@/types';

type Props={
  trip:Trip;
  onEdit:()=>void;
  onDelete:()=>void;
  onChange:(patch:Partial<Trip>)=>void;
};

const clean=(value?:string)=>(value||'').trim();
const encode=(value:string)=>encodeURIComponent(value);

async function copyText(value:string){
  const text=clean(value); if(!text)return false;
  try{
    if(Platform.OS==='web'){
      const nav=(globalThis as any).navigator;
      if(nav?.clipboard?.writeText){await nav.clipboard.writeText(text);return true;}
      const win=(globalThis as any).window;
      if(win?.prompt){win.prompt('คัดลอกข้อความ',text);return true;}
    }
    await Share.share({message:text});
    return true;
  }catch{return false;}
}

async function openMapsSearch(name:string){
  const q=clean(name); if(!q)return;
  await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encode(q)}`);
}

async function openGoogleSearch(name:string){
  const q=clean(name); if(!q)return;
  await Linking.openURL(`https://www.google.com/search?q=${encode(q)}`);
}

async function sharePlace(name:string,detail?:string){
  const title=clean(name); if(!title)return;
  await Share.share({message:[title,clean(detail)].filter(Boolean).join('\n')});
}

function makeRouteStops(trip:Trip){
  const explicit=(trip.routeStops||[]).map(clean).filter(Boolean);
  if(explicit.length)return explicit;
  const fromDays=(trip.days||[]).flatMap(d=>(d.schedule||[]).map(x=>clean(x.title))).filter(Boolean);
  const unique:string[]=[];
  for(const name of fromDays){if(!unique.includes(name))unique.push(name);if(unique.length>=10)break;}
  return unique;
}

async function openRoute(trip:Trip){
  const stops=makeRouteStops(trip);
  const origin=clean(trip.origin)||stops[0]||'';
  const destination=stops[stops.length-1]||clean(trip.destinationSummary)||'';
  if(!origin&&!destination)return;
  const middle=stops.slice(origin===stops[0]?1:0,-1).slice(0,8);
  const url=`https://www.google.com/maps/dir/?api=1&origin=${encode(origin)}&destination=${encode(destination)}${middle.length?`&waypoints=${encode(middle.join('|'))}`:''}&travelmode=driving`;
  await Linking.openURL(url);
}

function isDone(item:TripScheduleItem){return !!item.completed;}

export default function TripTravelCard({trip,onEdit,onDelete,onChange}:Props){
  const [open,setOpen]=useState(false);
  const [travelMode,setTravelMode]=useState(false);
  const [copied,setCopied]=useState('');
  const firstIncompleteDay=Math.max(0,(trip.days||[]).findIndex(d=>(d.schedule||[]).some(x=>!isDone(x))));
  const [selectedDay,setSelectedDay]=useState(firstIncompleteDay);
  const provinceNames=(trip.provinceIds||[]).map(id=>PROVINCES.find(p=>p.id===id)?.nameTh).filter(Boolean).join(' · ');
  const schedules=(trip.days||[]).flatMap(d=>d.schedule||[]);
  const doneCount=schedules.filter(isDone).length;
  const progress=schedules.length?Math.round(doneCount/schedules.length*100):0;
  const routeStops=useMemo(()=>makeRouteStops(trip),[trip]);
  const activeDay=(trip.days||[])[Math.min(selectedDay,Math.max(0,(trip.days||[]).length-1))];
  const nextStop=(activeDay?.schedule||[]).find(x=>!isDone(x));

  const markDone=(dayIndex:number,slotIndex:number)=>{
    const days=(trip.days||[]).map((d,di)=>di!==dayIndex?d:{...d,schedule:(d.schedule||[]).map((x,si)=>si!==slotIndex?x:{...x,completed:!x.completed})});
    onChange({days});
  };

  const copyName=async(name:string)=>{if(await copyText(name)){setCopied(name);setTimeout(()=>setCopied(''),1100)}};

  return <View style={s.card}>
    <View style={s.top}>
      <View style={s.badge}><Ionicons name="briefcase-outline" size={18} color={COLORS.primary}/></View>
      <View style={s.flex}><Text style={s.title}>{trip.title}</Text><Text style={s.meta}>{trip.startDate} → {trip.endDate}</Text></View>
      <View style={s.status}><Text style={s.statusText}>{trip.status||'วางแผน'}</Text></View>
    </View>
    {!!provinceNames&&<Text style={s.province}>{provinceNames}</Text>}

    <View style={s.metrics}>
      <Metric label="วัน" value={String(trip.days?.length||0)}/>
      <Metric label="งบ" value={`${(trip.budget||0).toLocaleString()}฿`}/>
      <Metric label="ไปแล้ว" value={`${doneCount}/${schedules.length}`}/>
    </View>

    <View style={s.progressTrack}><View style={[s.progressFill,{width:`${progress}%`}]}/></View>

    <View style={s.mainActions}>
      <Pressable style={[s.travelButton,travelMode&&s.travelButtonOn]} onPress={()=>{setTravelMode(v=>!v);setOpen(true)}}>
        <Ionicons name={travelMode?'stop-circle-outline':'navigate-circle-outline'} size={18} color={travelMode?'#fff':COLORS.primary}/>
        <Text style={[s.travelText,travelMode&&s.travelTextOn]}>{travelMode?'ออกจาก Travel Mode':'เริ่ม Travel Mode'}</Text>
      </Pressable>
      <Pressable style={s.routeButton} onPress={()=>openRoute(trip)}><Ionicons name="map-outline" size={18} color={COLORS.primary}/><Text style={s.routeButtonText}>เส้นทาง</Text></Pressable>
    </View>

    {!!routeStops.length&&<View style={s.routeCard}>
      <View style={s.sectionHead}><Text style={s.sectionTitle}>ROUTE OVERVIEW</Text><Pressable onPress={()=>openRoute(trip)}><Text style={s.linkText}>เปิด Maps</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.routeScroll}>
        {routeStops.map((name,i)=><React.Fragment key={`${name}-${i}`}>
          <View style={s.routeStop}><View style={s.routeNo}><Text style={s.routeNoText}>{i+1}</Text></View><Text numberOfLines={2} style={s.routeStopText}>{name}</Text></View>
          {i<routeStops.length-1&&<View style={s.routeLine}/>} 
        </React.Fragment>)}
      </ScrollView>
    </View>}

    {travelMode&&<View style={s.travelPanel}>
      <View style={s.sectionHead}><View><Text style={s.sectionEyebrow}>LIVE TRIP</Text><Text style={s.sectionTitle}>โหมดเดินทาง</Text></View><Text style={s.progressText}>{progress}%</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayChips}>
        {(trip.days||[]).map((day,i)=><Pressable key={day.day||i} style={[s.dayChip,selectedDay===i&&s.dayChipOn]} onPress={()=>setSelectedDay(i)}><Text style={[s.dayChipText,selectedDay===i&&s.dayChipTextOn]}>DAY {i+1}</Text></Pressable>)}
      </ScrollView>
      {nextStop?<View style={s.nextCard}><Text style={s.nextLabel}>จุดถัดไป</Text><Text style={s.nextTime}>{nextStop.time||'ไม่ระบุเวลา'}</Text><Text style={s.nextTitle}>{nextStop.title}</Text><View style={s.nextActions}><Quick icon="copy-outline" label="Copy" onPress={()=>copyName(nextStop.title)}/><Quick icon="navigate-outline" label="Maps" onPress={()=>openMapsSearch(nextStop.title)}/><Quick icon="checkmark-circle-outline" label="ถึงแล้ว" onPress={()=>{const idx=(activeDay?.schedule||[]).findIndex(x=>x.id===nextStop.id);if(idx>=0)markDone(selectedDay,idx)}}/></View></View>:<View style={s.completeCard}><Ionicons name="checkmark-done-circle" size={27} color="#2FAE68"/><Text style={s.completeText}>DAY นี้ครบแล้ว</Text></View>}
      {!!activeDay&&<Timeline day={activeDay} dayIndex={selectedDay} copied={copied} onCopy={copyName} onToggle={markDone}/>} 
    </View>}

    {open&&!travelMode&&<View style={s.plan}>
      {(trip.days||[]).map((day,dayIndex)=><View key={day.day||dayIndex} style={s.dayBlock}>
        <View style={s.dayHeader}><View style={s.dayNoBig}><Text style={s.dayNoBigText}>{dayIndex+1}</Text></View><View style={s.flex}><Text style={s.dayTitle}>{day.title||`DAY ${dayIndex+1}`}</Text>{!!day.route&&<Text style={s.dayRoute}>{day.route}</Text>}</View></View>
        <Timeline day={day} dayIndex={dayIndex} copied={copied} onCopy={copyName} onToggle={markDone}/>
        {!!day.accommodation&&<View style={s.infoLine}><Ionicons name="bed-outline" size={15} color={COLORS.primary}/><Text style={s.infoText}>ที่พัก: {day.accommodation}</Text></View>}
      </View>)}
      {!!trip.budgetSummaryLines?.length&&<View style={s.summary}><Text style={s.summaryTitle}>งบรวมทั้งทริป</Text>{trip.budgetSummaryLines.map((x,i)=><Text key={i} style={s.summaryText}>• {x}</Text>)}</View>}
      {!!trip.importantNotes?.length&&<View style={s.warning}><Text style={s.summaryTitle}>หมายเหตุสำคัญ</Text>{trip.importantNotes.map((x,i)=><Text key={i} style={s.warningText}>⚠ {x}</Text>)}</View>}
    </View>}

    <View style={s.bottomActions}>
      <Pressable style={s.viewButton} onPress={()=>setOpen(v=>!v)}><Ionicons name={open?'chevron-up':'eye-outline'} size={17} color={COLORS.primary}/><Text style={s.viewText}>{open?'ย่อ':'ดูแผน'}</Text></Pressable>
      <Pressable style={s.editButton} onPress={onEdit}><Ionicons name="create-outline" size={17} color="#fff"/><Text style={s.editText}>แก้ไขทั้งหมด</Text></Pressable>
      <Pressable style={s.deleteButton} onPress={onDelete}><Ionicons name="trash-outline" size={18} color={COLORS.danger}/></Pressable>
    </View>
  </View>;
}

function Timeline({day,dayIndex,copied,onCopy,onToggle}:{day:TripDay;dayIndex:number;copied:string;onCopy:(name:string)=>void;onToggle:(dayIndex:number,slotIndex:number)=>void}){
  return <View style={s.timeline}>{(day.schedule||[]).map((item,index)=>{
    const done=isDone(item);
    return <View key={item.id||index} style={[s.timelineRow,done&&s.timelineRowDone]}>
      <View style={s.timeCol}><Text style={[s.time,done&&s.doneText]}>{item.time||'--:--'}</Text><View style={[s.dot,done&&s.dotDone]}>{done&&<Ionicons name="checkmark" size={11} color="#fff"/>}</View>{index<(day.schedule||[]).length-1&&<View style={s.verticalLine}/>}</View>
      <View style={s.slot}>
        <View style={s.slotHead}><Text style={[s.slotTitle,done&&s.doneText]}>{item.title||'กิจกรรม'}</Text><Pressable style={[s.checkButton,done&&s.checkButtonDone]} onPress={()=>onToggle(dayIndex,index)}><Ionicons name={done?'checkmark-circle':'ellipse-outline'} size={19} color={done?'#2FAE68':COLORS.primary}/></Pressable></View>
        {!!item.detail&&<Text style={s.detail}>{item.detail}</Text>}
        {!!item.activities?.length&&item.activities.map((x,i)=><Text key={i} style={s.detail}>• {x}</Text>)}
        {!!item.notes?.length&&<View style={s.noteBox}>{item.notes.map((x,i)=><Text key={i} style={s.note}>⚠ {x}</Text>)}</View>}
        <View style={s.quickRow}>
          <Quick icon={copied===item.title?'checkmark':'copy-outline'} label={copied===item.title?'คัดลอกแล้ว':'Copy'} onPress={()=>onCopy(item.title)}/>
          <Quick icon="navigate-outline" label="Maps" onPress={()=>openMapsSearch(item.title)}/>
          <Quick icon="search-outline" label="Google" onPress={()=>openGoogleSearch(item.title)}/>
          <Quick icon="share-outline" label="Share" onPress={()=>sharePlace(item.title,item.detail)}/>
        </View>
      </View>
    </View>})}</View>;
}

function Quick({icon,label,onPress}:{icon:string;label:string;onPress:()=>void}){return <Pressable style={s.quick} onPress={onPress}><Ionicons name={icon as any} size={14} color={COLORS.primary}/><Text style={s.quickText}>{label}</Text></Pressable>}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text numberOfLines={1} style={s.metricValue}>{value}</Text></View>}

const s=StyleSheet.create({
  card:{padding:13,borderRadius:20,backgroundColor:'rgba(255,255,255,.88)',borderWidth:1,borderColor:'rgba(255,255,255,.76)',gap:10,...SHADOW.card},flex:{flex:1,minWidth:0},
  top:{flexDirection:'row',alignItems:'center',gap:8},badge:{width:40,height:40,borderRadius:13,backgroundColor:'rgba(232,246,246,.96)',alignItems:'center',justifyContent:'center'},title:{fontSize:16,fontWeight:'900',color:COLORS.text},meta:{fontSize:10.5,color:COLORS.textMuted,marginTop:2},province:{fontSize:11,fontWeight:'800',color:COLORS.textMuted},status:{maxWidth:88,minHeight:28,paddingHorizontal:8,borderRadius:999,backgroundColor:'rgba(232,246,246,.94)',alignItems:'center',justifyContent:'center'},statusText:{fontSize:9.5,fontWeight:'900',color:COLORS.primary},
  metrics:{flexDirection:'row',gap:7},metric:{flex:1,minWidth:0,padding:8,borderRadius:12,backgroundColor:'rgba(248,252,252,.92)'},metricLabel:{fontSize:9,fontWeight:'800',color:COLORS.textMuted},metricValue:{fontSize:12,fontWeight:'900',color:COLORS.text,marginTop:2},progressTrack:{height:5,borderRadius:999,backgroundColor:'rgba(7,61,75,.08)',overflow:'hidden'},progressFill:{height:'100%',borderRadius:999,backgroundColor:COLORS.primary},
  mainActions:{flexDirection:'row',gap:7},travelButton:{flex:1,minHeight:44,borderRadius:13,backgroundColor:'rgba(232,246,246,.94)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},travelButtonOn:{backgroundColor:COLORS.dark},travelText:{fontSize:11,fontWeight:'900',color:COLORS.primary},travelTextOn:{color:'#fff'},routeButton:{minHeight:44,paddingHorizontal:12,borderRadius:13,backgroundColor:'rgba(232,246,246,.94)',flexDirection:'row',alignItems:'center',gap:5},routeButtonText:{fontSize:11,fontWeight:'900',color:COLORS.primary},
  routeCard:{padding:10,borderRadius:14,backgroundColor:'rgba(242,250,250,.94)',borderWidth:1,borderColor:'rgba(7,61,75,.07)',gap:8},sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},sectionTitle:{fontSize:11,fontWeight:'900',color:COLORS.text},sectionEyebrow:{fontSize:8.5,fontWeight:'900',letterSpacing:1,color:COLORS.primary},linkText:{fontSize:10,fontWeight:'900',color:COLORS.primary},routeScroll:{alignItems:'center',paddingRight:10},routeStop:{width:78,alignItems:'center',gap:5},routeNo:{width:27,height:27,borderRadius:9,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},routeNoText:{fontSize:10,fontWeight:'900',color:'#fff'},routeStopText:{fontSize:9,lineHeight:12,fontWeight:'800',textAlign:'center',color:COLORS.text},routeLine:{width:20,height:2,backgroundColor:'rgba(7,61,75,.18)',marginHorizontal:1},
  travelPanel:{padding:11,borderRadius:16,backgroundColor:'rgba(7,90,110,.96)',gap:10},progressText:{fontSize:20,fontWeight:'900',color:'#fff'},dayChips:{gap:6,paddingRight:10},dayChip:{minHeight:34,paddingHorizontal:11,borderRadius:999,backgroundColor:'rgba(255,255,255,.10)',alignItems:'center',justifyContent:'center'},dayChipOn:{backgroundColor:'rgba(255,255,255,.92)'},dayChipText:{fontSize:9.5,fontWeight:'900',color:'rgba(255,255,255,.72)'},dayChipTextOn:{color:COLORS.dark},nextCard:{padding:12,borderRadius:14,backgroundColor:'rgba(255,255,255,.96)',gap:3},nextLabel:{fontSize:9,fontWeight:'900',letterSpacing:.8,color:COLORS.primary},nextTime:{fontSize:11,fontWeight:'900',color:COLORS.textMuted,marginTop:3},nextTitle:{fontSize:18,lineHeight:23,fontWeight:'900',color:COLORS.text},nextActions:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:7},completeCard:{minHeight:72,borderRadius:14,backgroundColor:'rgba(255,255,255,.94)',alignItems:'center',justifyContent:'center',gap:4},completeText:{fontSize:12,fontWeight:'900',color:COLORS.text},
  plan:{gap:12,paddingTop:8,borderTopWidth:1,borderTopColor:'rgba(7,61,75,.07)'},dayBlock:{gap:7},dayHeader:{flexDirection:'row',alignItems:'center',gap:8},dayNoBig:{width:32,height:32,borderRadius:10,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},dayNoBigText:{fontSize:10,fontWeight:'900',color:'#fff'},dayTitle:{fontSize:12.5,fontWeight:'900',color:COLORS.text},dayRoute:{fontSize:9.5,lineHeight:14,color:COLORS.textMuted,marginTop:2},
  timeline:{gap:0},timelineRow:{flexDirection:'row',alignItems:'stretch'},timelineRowDone:{opacity:.66},timeCol:{width:69,alignItems:'center',position:'relative',paddingTop:9},time:{fontSize:9.5,fontWeight:'900',color:COLORS.primary,alignSelf:'flex-start'},dot:{width:21,height:21,borderRadius:11,borderWidth:2,borderColor:COLORS.primary,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',marginTop:5,zIndex:2},dotDone:{backgroundColor:'#2FAE68',borderColor:'#2FAE68'},verticalLine:{position:'absolute',width:2,backgroundColor:'rgba(7,61,75,.12)',top:42,bottom:-8,left:34},slot:{flex:1,minWidth:0,padding:9,borderRadius:13,backgroundColor:'rgba(248,252,252,.94)',borderWidth:1,borderColor:'rgba(7,61,75,.07)',gap:5,marginBottom:7},slotHead:{flexDirection:'row',alignItems:'flex-start',gap:6},slotTitle:{flex:1,fontSize:11,lineHeight:16,fontWeight:'900',color:COLORS.text},checkButton:{width:28,height:28,alignItems:'center',justifyContent:'center'},checkButtonDone:{backgroundColor:'rgba(47,174,104,.08)',borderRadius:9},doneText:{textDecorationLine:'line-through'},detail:{fontSize:9.5,lineHeight:15,color:COLORS.textMuted},noteBox:{padding:7,borderRadius:9,backgroundColor:'rgba(242,211,154,.16)',gap:2},note:{fontSize:9.5,lineHeight:15,fontWeight:'700',color:COLORS.text},quickRow:{flexDirection:'row',flexWrap:'wrap',gap:5,marginTop:3},quick:{minHeight:30,paddingHorizontal:7,borderRadius:9,backgroundColor:'rgba(232,246,246,.95)',flexDirection:'row',alignItems:'center',gap:4},quickText:{fontSize:8.5,fontWeight:'900',color:COLORS.primary},
  infoLine:{padding:8,borderRadius:10,backgroundColor:'rgba(232,246,246,.84)',flexDirection:'row',gap:6},infoText:{flex:1,fontSize:9.5,lineHeight:15,fontWeight:'800',color:COLORS.text},summary:{padding:10,borderRadius:12,backgroundColor:'rgba(232,246,246,.88)',gap:3},warning:{padding:10,borderRadius:12,backgroundColor:'rgba(242,211,154,.16)',gap:3},summaryTitle:{fontSize:10.5,fontWeight:'900',color:COLORS.text},summaryText:{fontSize:9.5,lineHeight:15,color:COLORS.textMuted},warningText:{fontSize:9.5,lineHeight:15,fontWeight:'700',color:COLORS.text},
  bottomActions:{flexDirection:'row',gap:7},viewButton:{height:44,paddingHorizontal:11,borderRadius:13,backgroundColor:'rgba(232,246,246,.92)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4},viewText:{fontSize:11,fontWeight:'900',color:COLORS.primary},editButton:{flex:1,minWidth:0,minHeight:44,borderRadius:13,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},editText:{fontSize:11,fontWeight:'900',color:'#fff'},deleteButton:{width:44,height:44,borderRadius:13,backgroundColor:'rgba(255,255,255,.82)',alignItems:'center',justifyContent:'center'},
});
