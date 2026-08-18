import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
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
import { getProvinceInfo } from '@/data/provinceInfo';
import { COLORS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';
import {
  Trip,
  TripBudgetBreakdown,
  TripDay,
  TripMoneyRange,
} from '@/types';
import {
  ParsedTripText,
  parseDetailedTripText,
  parseMoneyRange,
} from '@/utils/tripTextParser';

const TRANSPORTS=['รถยนต์','รถไฟ','เครื่องบิน','รถบัส','มอเตอร์ไซค์'];
const STYLES=['ชิล ๆ','ธรรมชาติ','คาเฟ่','วัฒนธรรม','กินเที่ยว','ครอบครัว'];
const BUDGET_FIELDS:[keyof TripBudgetBreakdown,string,string][]=[
  ['transport','เดินทาง','car-outline'],
  ['accommodation','ที่พัก','bed-outline'],
  ['food','อาหาร','restaurant-outline'],
  ['activities','กิจกรรม','ticket-outline'],
  ['other','อื่น ๆ','wallet-outline'],
];

const money=(v:string)=>Math.max(0,Number(String(v).replace(/,/g,''))||0);
const midpoint=(range?:TripMoneyRange)=>range?Math.round(((range.min||0)+(range.max||range.min||0))/2):0;
const formatMoney=(n?:number)=>typeof n==='number'?n.toLocaleString():'-';
const formatRange=(range?:TripMoneyRange)=>{
  if(!range)return '-';
  if(range.min===range.max)return `${formatMoney(range.min)} บาท`;
  return `${formatMoney(range.min)}–${formatMoney(range.max)} บาท`;
};
const isoToday=()=>new Date().toISOString().slice(0,10);
const addDays=(date:string,count:number)=>{
  const d=new Date(`${date}T12:00:00`);
  if(Number.isNaN(d.getTime()))return '';
  d.setDate(d.getDate()+Math.max(0,count-1));
  return d.toISOString().slice(0,10);
};
const clampDays=(v:string)=>Math.max(1,Math.min(30,Number(v)||1));
const listFromText=(value:string)=>value.split('\n').map(x=>x.replace(/^[-•]\s*/,'').trim()).filter(Boolean);

export default function Trips(){
  const {width}=useWindowDimensions();
  const wide=width>=980;
  const {
    trips,createTrip,updateTrip,deleteTrip,wishlistPlaceIds,wishlistProvinceIds,preferences,
  }=useTravelStore();

  const [open,setOpen]=useState(false);
  const [createMode,setCreateMode]=useState<'smart'|'import'>('smart');
  const [step,setStep]=useState(1);
  const [title,setTitle]=useState('ทริปใหม่');
  const [startDate,setStartDate]=useState(isoToday());
  const [days,setDays]=useState('3');
  const [travelers,setTravelers]=useState('2');
  const [transport,setTransport]=useState('รถยนต์');
  const [accommodation,setAccommodation]=useState('');
  const [tripStyle,setTripStyle]=useState('ชิล ๆ');
  const [provinceSearch,setProvinceSearch]=useState('');
  const [selectedProvinceIds,setSelectedProvinceIds]=useState<string[]>(wishlistProvinceIds.slice(0,4));
  const [note,setNote]=useState('');
  const [routeText,setRouteText]=useState('');
  const [packingText,setPackingText]=useState('');
  const [importantText,setImportantText]=useState('');
  const [budgetInputs,setBudgetInputs]=useState<Record<keyof TripBudgetBreakdown,string>>({transport:'',accommodation:'',food:'',activities:'',other:''});
  const [autoStatus,setAutoStatus]=useState('');
  const [autoSource,setAutoSource]=useState<string[]>([]);
  const [autoFilling,setAutoFilling]=useState(false);

  const [importText,setImportText]=useState('');
  const [parsedImport,setParsedImport]=useState<ParsedTripText|null>(null);
  const [importStatus,setImportStatus]=useState('');

  const pageIn=useRef(new Animated.Value(0)).current;
  const ambient=useRef(new Animated.Value(0)).current;
  const formIn=useRef(new Animated.Value(0)).current;
  const progressAnim=useRef(new Animated.Value(0)).current;
  const autoPulse=useRef(new Animated.Value(1)).current;

  useEffect(()=>{
    Animated.timing(pageIn,{toValue:1,duration:620,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
    const loop=Animated.loop(Animated.sequence([
      Animated.timing(ambient,{toValue:1,duration:2600,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
      Animated.timing(ambient,{toValue:0,duration:2600,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
    ]));
    loop.start();
    return()=>loop.stop();
  },[pageIn,ambient]);

  useEffect(()=>{
    if(open){
      formIn.setValue(0);
      Animated.spring(formIn,{toValue:1,damping:18,stiffness:150,mass:.8,useNativeDriver:true}).start();
    }
  },[open,createMode,formIn]);

  const wishPlaces=useMemo(()=>PLACES.filter(p=>wishlistPlaceIds.includes(p.id)),[wishlistPlaceIds]);
  const nDays=clampDays(days);
  const totalBudget=Object.values(budgetInputs).reduce((sum,v)=>sum+money(v),0);
  const provinceResults=useMemo(()=>{
    const q=provinceSearch.trim().toLowerCase();
    const source=q?PROVINCES.filter(p=>`${p.nameTh} ${p.nameEn}`.toLowerCase().includes(q)):PROVINCES.filter(p=>wishlistProvinceIds.includes(p.id));
    return (source.length?source:PROVINCES).slice(0,q?12:8);
  },[provinceSearch,wishlistProvinceIds]);
  const selectedPlaces=useMemo(()=>selectedProvinceIds.length?wishPlaces.filter(p=>selectedProvinceIds.includes(p.provinceId)):wishPlaces,[wishPlaces,selectedProvinceIds]);
  const fallbackPlaces=useMemo(()=>PLACES.filter(p=>selectedProvinceIds.includes(p.provinceId)),[selectedProvinceIds]);
  const totalDays=trips.reduce((sum,t)=>sum+t.days.length,0);
  const totalTripBudget=trips.reduce((sum,t)=>sum+t.budget,0);

  const completionFields=[
    title.trim()&&title.trim()!=='ทริปใหม่',startDate,Number(days)>0,Number(travelers)>0,
    selectedProvinceIds.length>0,transport,tripStyle,accommodation.trim(),totalBudget>0,note.trim(),routeText.trim(),
  ];
  const completion=Math.round(completionFields.filter(Boolean).length/completionFields.length*100);

  useEffect(()=>{
    Animated.timing(progressAnim,{toValue:completion,duration:520,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start();
  },[completion,progressAnim]);

  const resetDraft=()=>{
    setStep(1);setCreateMode('smart');setTitle('ทริปใหม่');setStartDate(isoToday());setDays('3');setTravelers('2');
    setTransport('รถยนต์');setAccommodation('');setTripStyle('ชิล ๆ');setProvinceSearch('');
    setSelectedProvinceIds(wishlistProvinceIds.slice(0,4));setNote('');setRouteText('');setPackingText('');setImportantText('');
    setBudgetInputs({transport:'',accommodation:'',food:'',activities:'',other:''});
    setAutoStatus('');setAutoSource([]);setAutoFilling(false);setImportText('');setParsedImport(null);setImportStatus('');
  };

  const toggleProvince=(id:string)=>setSelectedProvinceIds(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);
  const setBudget=(key:keyof TripBudgetBreakdown,value:string)=>setBudgetInputs(current=>({...current,[key]:value}));

  const resolveProvinceIds=()=>{
    if(selectedProvinceIds.length)return selectedProvinceIds;
    if(wishlistProvinceIds.length)return wishlistProvinceIds.slice(0,4);
    const favRegion=preferences.favoriteRegions?.[0];
    if(favRegion){
      const ids=PROVINCES.filter(p=>p.region===favRegion).slice(0,2).map(p=>p.id);
      if(ids.length)return ids;
    }
    return [PROVINCES[0].id];
  };

  const suggestTransport=(provinceIds:string[])=>{
    const regions=Array.from(new Set(provinceIds.map(id=>PROVINCES.find(p=>p.id===id)?.region).filter(Boolean)));
    if(regions.includes('ภาคใต้'))return 'เครื่องบิน';
    if(regions.length>1)return 'รถยนต์';
    if(regions[0]==='ภาคเหนือ'&&clampDays(days)>=3)return 'เครื่องบิน';
    return 'รถยนต์';
  };

  const suggestStyle=()=>{
    const interest=(preferences.interests||[]).find(x=>STYLES.includes(x));
    if(interest)return interest;
    if(preferences.travelStyle==='ครอบครัว')return 'ครอบครัว';
    return 'ชิล ๆ';
  };

  const estimateBudget=(provinceIds:string[])=>{
    const people=Math.max(1,Number(travelers)||1);
    const daysCount=clampDays(days);
    const nights=Math.max(0,daysCount-1);
    const tier=preferences.budget||'กลาง';
    const rates=tier==='ประหยัด'
      ? {transport:900,room:900,food:450,activities:250,other:350}
      : tier==='พรีเมียม'
        ? {transport:4500,room:3500,food:1500,activities:1200,other:1500}
        : {transport:2200,room:1800,food:800,activities:600,other:800};
    const far=provinceIds.some(id=>['ภาคเหนือ','ภาคใต้','ภาคอีสาน'].includes(PROVINCES.find(p=>p.id===id)?.region||''));
    return {
      transport:Math.round(rates.transport*people*(far?1:.65)),
      accommodation:Math.round(rates.room*nights*Math.max(1,Math.ceil(people/2))),
      food:Math.round(rates.food*daysCount*people),
      activities:Math.round(rates.activities*daysCount*people),
      other:Math.round(rates.other*Math.max(1,people*.7)),
    };
  };

  const applyAutoFill=()=>{
    const provinceIds=resolveProvinceIds();
    const provinces=provinceIds.map(id=>PROVINCES.find(p=>p.id===id)).filter(Boolean) as typeof PROVINCES;
    const first=provinces[0];
    const sources:string[]=[];

    if(selectedProvinceIds.length)sources.push('จังหวัดที่เลือก');
    else if(wishlistProvinceIds.length)sources.push('Wishlist จังหวัด');
    else sources.push('Preference ผู้ใช้');

    if(!selectedProvinceIds.length)setSelectedProvinceIds(provinceIds);
    const names=provinces.slice(0,3).map(p=>p.nameTh);
    if(!title.trim()||title.trim()==='ทริปใหม่')setTitle(`${names.join(' • ')} ${clampDays(days)} วัน ${Math.max(0,clampDays(days)-1)} คืน`);

    const suggestedTransport=suggestTransport(provinceIds);
    if(!transport||transport==='รถยนต์')setTransport(suggestedTransport);
    if(!tripStyle||tripStyle==='ชิล ๆ')setTripStyle(suggestStyle());

    if(!routeText.trim()&&provinces.length){
      setRouteText(['กรุงเทพฯ',...provinces.map(p=>p.nameTh),'กรุงเทพฯ'].join(' → '));
      sources.push('เส้นทางแนะนำ');
    }

    if(!accommodation.trim()&&first){
      setAccommodation(`โซนตัวเมือง${first.nameTh} / ใกล้จุดเดินทางหลัก — เลือกโรงแรมตามงบอีกครั้งก่อนจอง`);
      sources.push('ข้อมูลจังหวัด');
    }

    if(totalBudget===0){
      const estimated=estimateBudget(provinceIds);
      setBudgetInputs({transport:String(estimated.transport),accommodation:String(estimated.accommodation),food:String(estimated.food),activities:String(estimated.activities),other:String(estimated.other)});
      sources.push(`งบประมาณ ${preferences.budget||'กลาง'}`);
    }

    if(!note.trim()&&first){
      const info=getProvinceInfo(first.nameTh,first.region,first.description,first.bestMonths);
      const highlights=provinces.flatMap(p=>getProvinceInfo(p.nameTh,p.region,p.description,p.bestMonths).highlights.slice(0,3)).slice(0,6);
      const foods=provinces.flatMap(p=>getProvinceInfo(p.nameTh,p.region,p.description,p.bestMonths).localFoods.slice(0,2)).slice(0,4);
      setNote([
        `จุดเด่นแนะนำ: ${highlights.join(', ')||'เลือกจากสถานที่ยอดนิยมในจังหวัด'}`,
        `ของกินที่ควรลอง: ${foods.join(', ')||'อาหารท้องถิ่น'}`,
        `คำแนะนำ: ${info.travelTips.slice(0,2).join(' · ')}`,
      ].join('\n'));
      if(!importantText.trim())setImportantText('ควรตรวจราคา เวลาเปิด–ปิด สภาพอากาศ และประกาศพื้นที่ก่อนเดินทางจริง');
      sources.push('ข้อมูลเที่ยวจังหวัด');
    }

    if(!packingText.trim())setPackingText('เสื้อผ้า\nรองเท้าสำหรับเดิน\nร่ม / เสื้อกันฝน\nครีมกันแดด\nPower Bank\nยาประจำตัว\nน้ำดื่ม\nเงินสดเล็กน้อย');
    sources.push('ค่าที่ระบบแนะนำ');
    setAutoSource(Array.from(new Set(sources)));
    setAutoStatus('เติมข้อมูลพื้นฐาน เส้นทาง งบ และ Checklist แล้ว — ตรวจแก้ได้ทุกช่อง');
    setStep(3);
  };

  const autoFill=()=>{
    if(autoFilling)return;
    setAutoFilling(true);setAutoStatus('กำลังจัดข้อมูลจาก Wishlist และข้อมูลจังหวัด...');
    Animated.sequence([
      Animated.timing(autoPulse,{toValue:1.025,duration:180,easing:Easing.out(Easing.quad),useNativeDriver:true}),
      Animated.timing(autoPulse,{toValue:1,duration:220,easing:Easing.out(Easing.quad),useNativeDriver:true}),
    ]).start();
    setTimeout(()=>{applyAutoFill();setAutoFilling(false)},520);
  };

  const buildDays=(provinceIds:string[]):TripDay[]=>{
    const wish=PLACES.filter(p=>wishlistPlaceIds.includes(p.id)&&provinceIds.includes(p.provinceId));
    const catalog=PLACES.filter(p=>provinceIds.includes(p.provinceId)&&!wish.some(w=>w.id===p.id));
    const usable=[...wish,...catalog].slice(0,Math.max(nDays*3,6));
    const times=['09:00 น.','13:00 น.','16:00 น.'];
    return Array.from({length:nDays},(_,i)=>{
      const dayProvince=PROVINCES.find(p=>p.id===provinceIds[i%provinceIds.length]);
      const info=dayProvince?getProvinceInfo(dayProvince.nameTh,dayProvince.region,dayProvince.description,dayProvince.bestMonths):null;
      const dayPlaces=usable.filter((_,idx)=>idx%nDays===i).slice(0,3);
      const fallbackHighlight=info?.highlights?.[i%Math.max(1,info.highlights.length)]||'';
      return {
        day:i+1,date:addDays(startDate,i+1),title:dayProvince?`DAY ${i+1} · ${dayProvince.nameTh}`:`DAY ${i+1}`,
        placeIds:dayPlaces.map(p=>p.id),
        schedule:dayPlaces.map((p,index)=>({id:`auto-${i+1}-${index+1}`,time:times[index]||'',title:p.name,detail:`${p.province} · ${p.category}`,activities:['เที่ยวชม','ถ่ายรูป','พักผ่อน'],notes:[p.bestTime?`ช่วงเวลาที่แนะนำ: ${p.bestTime}`:'ตรวจเวลาเปิด–ปิดก่อนเดินทาง']})),
        accommodation:dayProvince&&i<nDays-1?`โซน${dayProvince.nameTh}`:undefined,
        note:dayPlaces.length?info?.travelTips?.[0]:`แนะนำ: ${fallbackHighlight||'เลือกสถานที่เด่นในพื้นที่'}`,
      };
    });
  };

  const saveSmart=()=>{
    const provinceIds=resolveProvinceIds();
    const endDate=addDays(startDate,nDays);
    const budgetBreakdown={transport:money(budgetInputs.transport),accommodation:money(budgetInputs.accommodation),food:money(budgetInputs.food),activities:money(budgetInputs.activities),other:money(budgetInputs.other)};
    const budget=Object.values(budgetBreakdown).reduce((sum,v)=>sum+(v||0),0);
    const provinceNames=provinceIds.map(id=>PROVINCES.find(p=>p.id===id)?.nameTh).filter(Boolean).join(' • ');
    const routeStops=routeText.trim()?routeText.split(/→|->|=>/).map(x=>x.trim()).filter(Boolean):[];
    const plan:Trip={
      id:String(Date.now()),title:title.trim()||`${provinceNames||'ทริปใหม่'} ${nDays} วัน`,startDate:startDate||isoToday(),endDate,budget,provinceIds,
      travelers:Math.max(1,Number(travelers)||1),transport,accommodation:accommodation.trim(),tripStyle,budgetBreakdown,note:note.trim(),status:'วางแผน',
      destinationSummary:provinceNames,autoFilled:autoSource.length>0,autoFillSource:autoSource.join(' + '),days:buildDays(provinceIds),routeText:routeText.trim(),routeStops,
      packingList:listFromText(packingText),importantNotes:listFromText(importantText),importMode:autoSource.length?'autofill':'manual',
    };
    createTrip(plan);setOpen(false);resetDraft();
  };

  const extractBudgetInputs=(parsed:ParsedTripText)=>{
    const next:Record<keyof TripBudgetBreakdown,string>={transport:'',accommodation:'',food:'',activities:'',other:''};
    parsed.budgetSummaryLines.forEach(line=>{
      const r=parseMoneyRange(line);if(!r)return;
      const value=String(midpoint(r));
      if(/ที่พัก/.test(line))next.accommodation=value;
      else if(/อาหาร/.test(line))next.food=value;
      else if(/น้ำมัน|เดินทาง|รถ/.test(line))next.transport=value;
      else if(/เที่ยว|ทำบุญ|กาแฟ|จอดรถ|จิปาถะ/.test(line))next.activities=value;
    });
    return next;
  };

  const parseImport=()=>{
    if(!importText.trim()){Alert.alert('ยังไม่มีข้อความ','วางแผนทริปแบบข้อความก่อน แล้วกดแยกแผนอัตโนมัติ');return;}
    const parsed=parseDetailedTripText(importText);
    if(!parsed.days.length){Alert.alert('ยังแยก DAY ไม่ได้','ควรมีหัวข้อ DAY 1, DAY 2 ... ในข้อความ');return;}
    setParsedImport(parsed);
    if(parsed.title)setTitle(parsed.title);
    if(parsed.travelers)setTravelers(String(parsed.travelers));
    if(parsed.transport)setTransport(parsed.transport);
    if(parsed.routeText)setRouteText(parsed.routeText);
    if(parsed.note)setNote(parsed.note);
    setDays(String(parsed.days.length));
    setPackingText(parsed.packingList.join('\n'));
    setImportantText(parsed.importantNotes.join('\n'));
    setBudgetInputs(extractBudgetInputs(parsed));
    const source=importText.toLowerCase();
    const ids=PROVINCES.filter(p=>source.includes(p.nameTh.toLowerCase())).map(p=>p.id);
    if(ids.length)setSelectedProvinceIds(ids);
    setAccommodation(parsed.accommodationPlan.map(x=>`คืนที่ ${x.night}: ${x.location}`).join(' · '));
    setImportStatus(`แยกสำเร็จ ${parsed.days.length} วัน · ${parsed.days.reduce((sum,d)=>sum+(d.schedule?.length||0),0)} ช่วงเวลา · ${parsed.attractionsSummary.length} สถานที่ · ${parsed.packingList.length} รายการเตรียมตัว`);
  };

  const saveImported=()=>{
    if(!parsedImport){parseImport();return;}
    const provinceIds=selectedProvinceIds.length?selectedProvinceIds:resolveProvinceIds();
    const parsed=parsedImport;
    const count=parsed.days.length||nDays;
    const budgetBreakdown={transport:money(budgetInputs.transport),accommodation:money(budgetInputs.accommodation),food:money(budgetInputs.food),activities:money(budgetInputs.activities),other:money(budgetInputs.other)};
    const sumBudget=Object.values(budgetBreakdown).reduce((sum,v)=>sum+(v||0),0);
    const budget=midpoint(parsed.overviewBudgetRange)||sumBudget;
    const enrichedDays=parsed.days.map((day,i)=>{
      const searchable=(day.schedule||[]).map(x=>x.title).join(' ');
      const placeIds=PLACES.filter(p=>searchable.includes(p.name)||p.name.includes(searchable)).map(p=>p.id);
      return {...day,date:addDays(startDate,i+1),placeIds};
    });
    const plan:Trip={
      id:String(Date.now()),title:parsed.title||title.trim()||'ทริปละเอียด',startDate:startDate||isoToday(),endDate:addDays(startDate,count),budget,provinceIds,
      travelers:parsed.travelers||Math.max(1,Number(travelers)||1),transport:parsed.transport||transport,accommodation:accommodation.trim(),tripStyle,status:'วางแผน',note:parsed.note||note.trim(),
      budgetBreakdown,days:enrichedDays,destinationSummary:provinceIds.map(id=>PROVINCES.find(p=>p.id===id)?.nameTh).filter(Boolean).join(' • '),
      routeText:parsed.routeText,routeStops:parsed.routeStops,overviewBudgetRange:parsed.overviewBudgetRange,attractionsSummary:parsed.attractionsSummary,
      accommodationPlan:parsed.accommodationPlan,budgetSummaryLines:parsed.budgetSummaryLines,budgetTiers:parsed.budgetTiers,packingList:parsed.packingList,
      importantNotes:parsed.importantNotes,sourceText:importText,importMode:'text-import',autoFilled:true,autoFillSource:'นำเข้าข้อความและแยกโครงสร้างอัตโนมัติ',
    };
    createTrip(plan);setOpen(false);resetDraft();
  };

  const pageStyle={opacity:pageIn,transform:[{translateY:pageIn.interpolate({inputRange:[0,1],outputRange:[16,0]})}]};
  const ambientStyle={opacity:ambient.interpolate({inputRange:[0,1],outputRange:[.28,.55]}),transform:[{translateY:ambient.interpolate({inputRange:[0,1],outputRange:[0,-10]})}]};
  const progressWidth=progressAnim.interpolate({inputRange:[0,100],outputRange:['0%','100%']});

  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Animated.View style={[s.hero,pageStyle]}>
        <Animated.View pointerEvents="none" style={[s.heroOrb,s.heroOrbA,ambientStyle]}/>
        <Animated.View pointerEvents="none" style={[s.heroOrb,s.heroOrbB,{opacity:ambient.interpolate({inputRange:[0,1],outputRange:[.18,.38]})}]}/>
        <View style={s.heroContent}>
          <View style={{flex:1,minWidth:260}}>
            <View style={s.eyebrow}><Ionicons name="route-outline" size={14} color={COLORS.primaryDark}/><Text style={s.eyebrowText}>SMART TRIP PLANNER · DETAIL READY</Text></View>
            <Text style={s.title}>แผนการเดินทาง</Text>
            <Text style={s.sub}>รองรับทั้งทริปแบบง่าย และแผนละเอียดระดับเวลา กิจกรรม งบรายวัน ที่พัก และ Checklist</Text>
          </View>
          <MotionPressable style={[s.heroCreate,open&&s.heroCreateOn]} onPress={()=>setOpen(v=>!v)}>
            <View style={s.heroCreateIcon}><Ionicons name={open?'close':'add'} size={22} color="#fff"/></View>
            <View><Text style={s.heroCreateText}>{open?'ปิดตัวสร้าง':'สร้างทริปใหม่'}</Text><Text style={s.heroCreateSub}>{open?'กลับไปดูทริปด้านล่าง':'Smart Auto Fill + Text Import'}</Text></View>
          </MotionPressable>
        </View>
      </Animated.View>

      <Animated.View style={[s.overview,pageStyle]}>
        <AnimatedStat icon="calendar-outline" n={trips.length} label="ทริปทั้งหมด" delay={70}/>
        <AnimatedStat icon="time-outline" n={totalDays} label="วันเดินทาง" delay={130}/>
        <AnimatedStat icon="heart-outline" n={wishlistPlaceIds.length} label="Wishlist" delay={190}/>
        <AnimatedStat icon="wallet-outline" n={totalTripBudget} label="งบรวม (บาท)" delay={250} moneyValue/>
      </Animated.View>

      {!open&&<MotionPressable style={s.createBanner} onPress={()=>setOpen(true)}>
        <View style={s.createIcon}><Ionicons name="sparkles" size={22} color="#fff"/></View>
        <View style={{flex:1}}><Text style={s.createTitle}>สร้างเอง หรือวางแผนยาวให้ระบบแยกให้อัตโนมัติ</Text><Text style={s.createSub}>รองรับ DAY 1–30 · ตารางเวลา · กิจกรรม · งบช่วงราคา · ที่พักแต่ละคืน · Packing List</Text></View>
        <View style={s.arrowCircle}><Ionicons name="arrow-forward" size={18} color={COLORS.primaryDark}/></View>
      </MotionPressable>}

      {open&&<Animated.View style={[s.form,{opacity:formIn,transform:[{translateY:formIn.interpolate({inputRange:[0,1],outputRange:[24,0]})},{scale:formIn.interpolate({inputRange:[0,1],outputRange:[.985,1]})}]}]}>
        <View style={s.modeTabs}>
          <MotionPressable style={[s.modeTab,createMode==='smart'&&s.modeTabOn]} onPress={()=>setCreateMode('smart')}><Ionicons name="sparkles-outline" size={17} color={createMode==='smart'?'#fff':COLORS.primaryDark}/><View><Text style={[s.modeTitle,createMode==='smart'&&s.modeTitleOn]}>สร้างแบบ Smart</Text><Text style={[s.modeSub,createMode==='smart'&&s.modeSubOn]}>กรอกเอง + Auto Fill</Text></View></MotionPressable>
          <MotionPressable style={[s.modeTab,createMode==='import'&&s.modeTabImport]} onPress={()=>setCreateMode('import')}><Ionicons name="document-text-outline" size={17} color={createMode==='import'?'#fff':COLORS.primaryDark}/><View><Text style={[s.modeTitle,createMode==='import'&&s.modeTitleOn]}>นำเข้าแผนละเอียด</Text><Text style={[s.modeSub,createMode==='import'&&s.modeSubOn]}>วางข้อความ DAY 1, DAY 2...</Text></View></MotionPressable>
        </View>

        {createMode==='import'?<ImportPlanner
          importText={importText} setImportText={setImportText} parsed={parsedImport} status={importStatus} onParse={parseImport} onSave={saveImported}
          startDate={startDate} setStartDate={setStartDate} selectedProvinceIds={selectedProvinceIds}
        />:<>
          <View style={s.formTop}>
            <View style={{flex:1}}><Text style={s.formTitle}>สร้างแผนทริป</Text><Text style={s.formSub}>กรอกเอง หรือให้ระบบเติมข้อมูลที่ขาดก่อน แล้วค่อยตรวจแก้</Text></View>
            <View style={s.completeBadge}><Text style={s.completeValue}>{completion}%</Text><Text style={s.completeLabel}>ความพร้อม</Text></View>
          </View>
          <View style={s.progressTrack}><Animated.View style={[s.progressFill,{width:progressWidth}]}/></View>

          <Animated.View style={{transform:[{scale:autoPulse}]}}>
            <MotionPressable style={[s.autoFillBtn,autoFilling&&s.autoFillBtnBusy]} onPress={autoFill} disabled={autoFilling}>
              <View style={s.autoFillGlow}/><View style={s.autoFillIcon}><Ionicons name={autoFilling?'sync':'sparkles'} size={22} color="#fff"/></View>
              <View style={{flex:1}}><Text style={s.autoFillTitle}>{autoFilling?'กำลัง AUTO FILL...':'AUTO FILL · เติมช่องที่ขาด'}</Text><Text style={s.autoFillSub}>{autoFilling?'กำลังรวมข้อมูลและจัดโครงทริป':'Wishlist → Preference → จังหวัด → เส้นทาง → งบ → Checklist'}</Text></View>
              <View style={s.autoFillBadge}><Ionicons name="flash" size={15} color={COLORS.gold}/><Text style={s.autoFillBadgeText}>SMART</Text></View>
            </MotionPressable>
          </Animated.View>

          {!!autoStatus&&<FadeBlock><View style={[s.autoResult,autoFilling&&s.autoResultBusy]}><Ionicons name={autoFilling?'hourglass-outline':'checkmark-circle'} size={19} color={autoFilling?COLORS.rating:COLORS.visited}/><View style={{flex:1}}><Text style={s.autoResultText}>{autoStatus}</Text><View style={s.sourceWrap}>{autoSource.map(x=><View key={x} style={s.sourceChip}><Text style={s.sourceChipText}>{x}</Text></View>)}</View></View></View></FadeBlock>}

          <View style={s.steps}>{[1,2,3].map(x=><MotionPressable key={x} style={[s.stepTab,step===x&&s.stepTabOn]} onPress={()=>setStep(x)}><View style={[s.stepNo,step===x&&s.stepNoOn]}><Text style={[s.stepNoText,step===x&&s.stepNoTextOn]}>{x}</Text></View><Text style={[s.stepTabText,step===x&&s.stepTabTextOn]}>{x===1?'ข้อมูลทริป':x===2?'เส้นทาง':'งบ + Checklist'}</Text></MotionPressable>)}</View>

          <StepTransition trigger={step}>
            {step===1&&<View style={s.stepContent}>
              <SectionHeader icon="create-outline" title="ข้อมูลทริป" subtitle="รองรับทริปสั้นและยาวสูงสุด 30 วัน"/>
              <Field label="ชื่อทริป"><TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="เช่น ศรีสะเกษ 5 วัน 4 คืน" placeholderTextColor="#9AA8B4"/></Field>
              <View style={s.inline}><Field label="วันเริ่มเดินทาง" flex><TextInput style={s.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9AA8B4"/></Field><Field label="จำนวนวัน" flex><TextInput style={s.input} value={days} onChangeText={setDays} keyboardType="number-pad" placeholder="5" placeholderTextColor="#9AA8B4"/></Field><Field label="ผู้เดินทาง" flex><TextInput style={s.input} value={travelers} onChangeText={setTravelers} keyboardType="number-pad" placeholder="2" placeholderTextColor="#9AA8B4"/></Field></View>
              <View style={s.previewBox}><Ionicons name="calendar" size={17} color={COLORS.primary}/><Text style={s.previewText}>{startDate} → {addDays(startDate,nDays)} · {nDays} วัน · {Math.max(1,Number(travelers)||1)} คน</Text></View>
            </View>}

            {step===2&&<View style={s.stepContent}>
              <SectionHeader icon="map-outline" title="จุดหมายและเส้นทางหลัก" subtitle="เลือกจังหวัด แล้วระบุเส้นทางหลายอำเภอได้ละเอียด"/>
              <Field label="ค้นหาจังหวัด"><TextInput style={s.input} value={provinceSearch} onChangeText={setProvinceSearch} placeholder="ศรีสะเกษ, เชียงใหม่, กระบี่..." placeholderTextColor="#9AA8B4"/></Field>
              {selectedProvinceIds.length>0&&<View style={s.selectedWrap}>{selectedProvinceIds.map(id=>{const p=PROVINCES.find(x=>x.id===id);return p?<MotionPressable key={id} style={s.selectedChip} onPress={()=>toggleProvince(id)}><Ionicons name="checkmark-circle" size={15} color={COLORS.primary}/><Text style={s.selectedChipText}>{p.nameTh}</Text><Ionicons name="close" size={13} color={COLORS.textMuted}/></MotionPressable>:null})}</View>}
              <View style={s.provinceGrid}>{provinceResults.map(p=>{const on=selectedProvinceIds.includes(p.id);return <MotionPressable key={p.id} style={[s.provinceOption,on&&s.provinceOptionOn]} onPress={()=>toggleProvince(p.id)}><Text style={[s.provinceOptionText,on&&s.provinceOptionTextOn]}>{p.nameTh}</Text><Text style={s.provinceRegion}>{p.region}</Text></MotionPressable>})}</View>
              <Field label="เส้นทางหลัก"><TextInput style={[s.input,s.routeInput]} value={routeText} onChangeText={setRouteText} multiline placeholder="กรุงเทพฯ → ตัวเมืองศรีสะเกษ → ขุนหาญ → ภูสิงห์ → กรุงเทพฯ" placeholderTextColor="#9AA8B4"/></Field>
              <Field label="เดินทางหลัก"><View style={s.choiceWrap}>{TRANSPORTS.map(x=><Choice key={x} text={x} active={transport===x} onPress={()=>setTransport(x)}/>)}</View></Field>
              <Field label="สไตล์ทริป"><View style={s.choiceWrap}>{STYLES.map(x=><Choice key={x} text={x} active={tripStyle===x} onPress={()=>setTripStyle(x)}/>)}</View></Field>
              <Field label="ที่พัก / โซนที่พัก"><TextInput style={s.input} value={accommodation} onChangeText={setAccommodation} placeholder="เช่น คืน 1–2 ตัวเมือง / คืน 3 ขุนหาญ" placeholderTextColor="#9AA8B4"/></Field>
              <View style={s.wishBox}><Ionicons name="heart" size={17} color={COLORS.wishlist}/><View style={{flex:1}}><Text style={s.wishTitle}>{selectedPlaces.length} Wishlist · {fallbackPlaces.length} Catalog</Text><Text style={s.wishText}>Auto Fill จะใช้สถานที่ที่อยากไปก่อน แล้วเติมจากจังหวัดที่เลือก</Text></View></View>
            </View>}

            {step===3&&<View style={s.stepContent}>
              <SectionHeader icon="wallet-outline" title="งบประมาณ + Checklist" subtitle="เก็บงบ สิ่งที่ต้องเตรียม และคำเตือนสำคัญไว้ในทริปเดียว"/>
              <View style={s.budgetGrid}>{BUDGET_FIELDS.map(([key,label,icon])=><View key={key} style={s.budgetBox}><View style={s.budgetLabelRow}><Ionicons name={icon as any} size={15} color={COLORS.primary}/><Text style={s.budgetLabel}>{label}</Text></View><TextInput style={s.budgetInput} value={budgetInputs[key]} onChangeText={v=>setBudget(key,v)} keyboardType="number-pad" placeholder="0" placeholderTextColor="#9AA8B4"/><Text style={s.baht}>บาท</Text></View>)}</View>
              <View style={s.totalBox}><View><Text style={s.totalLabel}>งบประมาณรวม</Text><Text style={s.totalHint}>ยอดกลางสำหรับวางแผน</Text></View><Text style={s.totalMoney}>{totalBudget.toLocaleString()} <Text style={s.totalUnit}>บาท</Text></Text></View>
              <Field label="โน้ตทริป"><TextInput style={[s.input,s.noteInput]} value={note} onChangeText={setNote} multiline placeholder="รายละเอียดเพิ่มเติมของทริป" placeholderTextColor="#9AA8B4"/></Field>
              <View style={[s.inline,{alignItems:'stretch'}]}><Field label="ของที่ควรเตรียม" flex><TextInput style={[s.input,s.noteInput]} value={packingText} onChangeText={setPackingText} multiline placeholder="หนึ่งรายการต่อหนึ่งบรรทัด" placeholderTextColor="#9AA8B4"/></Field><Field label="หมายเหตุสำคัญ" flex><TextInput style={[s.input,s.noteInput]} value={importantText} onChangeText={setImportantText} multiline placeholder="เช่น ตรวจประกาศพื้นที่ก่อนเดินทาง" placeholderTextColor="#9AA8B4"/></Field></View>
            </View>}
          </StepTransition>

          <View style={s.formActions}>{step>1?<MotionPressable style={s.backBtn} onPress={()=>setStep(x=>x-1)}><Ionicons name="arrow-back" size={18} color={COLORS.text}/><Text style={s.backText}>ย้อนกลับ</Text></MotionPressable>:<MotionPressable style={s.backBtn} onPress={()=>{setOpen(false);resetDraft()}}><Text style={s.backText}>ยกเลิก</Text></MotionPressable>}{step<3?<MotionPressable style={s.nextBtn} onPress={()=>setStep(x=>x+1)}><Text style={s.nextText}>ถัดไป</Text><Ionicons name="arrow-forward" size={18} color="#fff"/></MotionPressable>:<MotionPressable style={s.saveBtn} onPress={saveSmart}><Ionicons name="checkmark-circle" size={19} color="#fff"/><Text style={s.saveText}>สร้างแผนทริป</Text></MotionPressable>}</View>
        </>}
      </Animated.View>}

      {!trips.length?<FadeBlock><View style={s.empty}><View style={s.emptyIcon}><Ionicons name="map-outline" size={30} color={COLORS.primary}/></View><Text style={s.emptyTitle}>ยังไม่มีแผนทริป</Text><Text style={s.emptyText}>สร้างแบบ Smart หรือวางแผนข้อความยาวเพื่อแยกเป็น Timeline อัตโนมัติ</Text></View></FadeBlock>:trips.map((t,index)=><TripCard key={t.id} trip={t} delay={Math.min(index*70,350)} onDelete={()=>Alert.alert('ลบทริป',`ลบ ${t.title}?`,[{text:'ยกเลิก'},{text:'ลบ',style:'destructive',onPress:()=>deleteTrip(t.id)}])} onUpdate={patch=>updateTrip(t.id,patch)}/>) }
    </ScrollView>
  </SafeAreaView>
}

function ImportPlanner({importText,setImportText,parsed,status,onParse,onSave,startDate,setStartDate,selectedProvinceIds}:{importText:string;setImportText:(v:string)=>void;parsed:ParsedTripText|null;status:string;onParse:()=>void;onSave:()=>void;startDate:string;setStartDate:(v:string)=>void;selectedProvinceIds:string[]}){
  return <View style={s.importWrap}>
    <View style={s.importHero}><View style={s.importIcon}><Ionicons name="document-text" size={24} color="#fff"/></View><View style={{flex:1}}><Text style={s.importTitle}>วางแผนทริปแบบละเอียดได้ทั้งก้อน</Text><Text style={s.importSub}>ระบบอ่าน DAY, เวลา, กิจกรรม, งบรายวัน, ที่พัก, สรุปสถานที่, Packing List และหมายเหตุสำคัญ</Text></View></View>
    <Field label="ข้อความแผนทริป"><TextInput style={[s.input,s.importInput]} value={importText} onChangeText={v=>{setImportText(v)}} multiline placeholder={'ตัวอย่าง:\nแผนเที่ยวศรีสะเกษ 5 วัน 4 คืน\n...\nDAY 1\n05.00 น.\nออกเดินทาง...'} placeholderTextColor="#8FA2AA"/></Field>
    <View style={s.importActions}><MotionPressable style={s.parseBtn} onPress={onParse}><Ionicons name="scan-outline" size={18} color="#fff"/><Text style={s.parseBtnText}>แยกแผนอัตโนมัติ</Text></MotionPressable>{parsed&&<MotionPressable style={s.importSaveBtn} onPress={onSave}><Ionicons name="save-outline" size={18} color="#fff"/><Text style={s.parseBtnText}>บันทึกเป็นทริป</Text></MotionPressable>}</View>
    {!!status&&<FadeBlock><View style={s.importStatus}><Ionicons name="checkmark-circle" size={18} color={COLORS.visited}/><Text style={s.importStatusText}>{status}</Text></View></FadeBlock>}
    {parsed&&<FadeBlock><View style={s.parsePreview}>
      <View style={s.parsePreviewTop}><View><Text style={s.parseEyebrow}>PARSED ITINERARY</Text><Text style={s.parseTitle}>{parsed.title}</Text></View><View style={s.parsedBadge}><Text style={s.parsedBadgeN}>{parsed.days.length}</Text><Text style={s.parsedBadgeL}>DAYS</Text></View></View>
      <View style={s.parsedStats}><MiniStat icon="people-outline" value={`${parsed.travelers||'-'} คน`} label="ผู้เดินทาง"/><MiniStat icon="wallet-outline" value={formatRange(parsed.overviewBudgetRange)} label="งบรวม"/><MiniStat icon="location-outline" value={`${parsed.routeStops.length} จุด`} label="เส้นทาง"/><MiniStat icon="bed-outline" value={`${parsed.accommodationPlan.length} คืน`} label="ที่พัก"/></View>
      <Field label="วันเริ่มเดินทาง (ข้อความนำเข้าไม่มีวันที่จริง ให้กำหนดตรงนี้)"><TextInput style={s.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9AA8B4"/></Field>
      {parsed.routeStops.length>0&&<RouteStrip stops={parsed.routeStops}/>} 
      <View style={s.previewDays}>{parsed.days.map(day=><View key={day.day} style={s.previewDay}><View style={s.previewDayNo}><Text style={s.previewDayNoText}>{day.day}</Text></View><View style={{flex:1}}><Text style={s.previewDayTitle}>{day.title}</Text><Text style={s.previewDayMeta}>{day.schedule?.length||0} ช่วงเวลา · {day.accommodation?`พัก ${day.accommodation}`:'ไม่ระบุที่พัก'} · {formatRange(day.budgetRange)}</Text></View></View>)}</View>
      <Text style={s.parseHint}>จังหวัดที่ตรวจพบในข้อความ: {selectedProvinceIds.length} จังหวัด · บันทึกแล้วสามารถเปิดดูรายละเอียด Timeline ทั้งหมดได้</Text>
    </View></FadeBlock>}
  </View>
}

function TripCard({trip,onDelete,onUpdate,delay}:{trip:Trip;onDelete:()=>void;onUpdate:(patch:Partial<Trip>)=>void;delay:number}){
  const [expanded,setExpanded]=useState(false);
  const [edit,setEdit]=useState(false);
  const [name,setName]=useState(trip.title);
  const [hotel,setHotel]=useState(trip.accommodation||'');
  const [tripNote,setTripNote]=useState(trip.note||'');
  const enter=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.timing(enter,{toValue:1,duration:450,delay,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start()},[enter,delay]);
  const provinces=trip.provinceIds.map(id=>PROVINCES.find(p=>p.id===id)).filter(Boolean) as typeof PROVINCES;
  const readiness=Math.round([trip.title,trip.startDate,trip.endDate,trip.provinceIds.length>0,trip.transport,trip.budget>0,trip.days.length>0,(trip.routeStops?.length||0)>0].filter(Boolean).length/8*100);
  const saveEdit=()=>{onUpdate({title:name.trim()||trip.title,accommodation:hotel.trim(),note:tripNote.trim()});setEdit(false)};
  const detailed=trip.importMode==='text-import'||trip.days.some(d=>(d.schedule?.length||0)>0);

  return <Animated.View style={[s.card,{opacity:enter,transform:[{translateY:enter.interpolate({inputRange:[0,1],outputRange:[18,0]})}]}]}>
    <View style={s.cardAccent}/>
    <View style={s.cardTop}><View style={{flex:1}}><View style={s.cardTitleRow}><Text style={s.cardTitle}>{trip.title}</Text>{trip.importMode==='text-import'?<View style={s.detailBadge}><Text style={s.detailBadgeText}>DETAIL</Text></View>:trip.autoFilled?<View style={s.autoBadge}><Text style={s.autoBadgeText}>AUTO</Text></View>:null}</View><Text style={s.cardSub}>{trip.days.length} วัน · {trip.travelers||1} คน · {trip.transport||'ไม่ระบุ'} · {trip.overviewBudgetRange?formatRange(trip.overviewBudgetRange):`งบ ${trip.budget.toLocaleString()} บาท`}</Text></View><View style={s.cardActions}><MotionPressable style={s.iconBtn} onPress={()=>setEdit(v=>!v)}><Ionicons name="create-outline" size={18} color={COLORS.primary}/></MotionPressable><MotionPressable style={[s.iconBtn,s.iconBtnDanger]} onPress={onDelete}><Ionicons name="trash-outline" size={18} color={COLORS.danger}/></MotionPressable></View></View>
    <View style={s.readinessRow}><Text style={s.readinessLabel}>ความพร้อมทริป</Text><Text style={s.readinessValue}>{readiness}%</Text></View><View style={s.readinessTrack}><View style={[s.readinessFill,{width:`${readiness}%`}]}/></View>
    <View style={s.tripMetaRow}><Meta icon="calendar-outline" text={`${trip.startDate} → ${trip.endDate||'-'}`}/><Meta icon="navigate-outline" text={trip.transport||'ไม่ระบุ'}/><Meta icon="people-outline" text={`${trip.travelers||1} คน`}/></View>
    {provinces.length>0&&<View style={s.chips}>{provinces.map(p=><View key={p.id} style={s.chip}><Ionicons name="location" size={11} color={COLORS.primaryDark}/><Text style={s.chipText}>{p.nameTh}</Text></View>)}</View>}
    {trip.routeStops&&trip.routeStops.length>0&&<RouteStrip stops={trip.routeStops}/>} 
    {!!trip.autoFillSource&&<View style={s.sourceLine}><Ionicons name="flash-outline" size={12} color={COLORS.primaryDark}/><Text style={s.sourceLineText}>{trip.autoFillSource}</Text></View>}

    {edit&&<FadeBlock><View style={s.editBox}><Text style={s.editTitle}>แก้ไขข้อมูลทริป</Text><TextInput style={s.input} value={name} onChangeText={setName} placeholder="ชื่อทริป"/><TextInput style={s.input} value={hotel} onChangeText={setHotel} placeholder="ที่พัก / โซนที่พัก"/><TextInput style={[s.input,s.noteInput]} multiline value={tripNote} onChangeText={setTripNote} placeholder="โน้ตทริป"/><MotionPressable style={s.miniSave} onPress={saveEdit}><Ionicons name="save-outline" size={16} color="#fff"/><Text style={s.miniSaveText}>บันทึกการแก้ไข</Text></MotionPressable></View></FadeBlock>}

    <MotionPressable style={[s.expandBtn,expanded&&s.expandBtnOn]} onPress={()=>setExpanded(v=>!v)}><Text style={[s.expandText,expanded&&s.expandTextOn]}>{expanded?'ซ่อนแผนเต็ม':detailed?'ดูแผนเต็มแบบละเอียด':'ดูแผนรายวัน'}</Text><Ionicons name={expanded?'chevron-up':'chevron-down'} size={17} color={expanded?'#fff':COLORS.primary}/></MotionPressable>

    {expanded&&<FadeBlock><View style={s.detailStack}>
      {trip.note&&<InfoPanel icon="information-circle-outline" title="ภาพรวม / หมายเหตุ" text={trip.note}/>} 
      <View style={s.timeline}>{trip.days.map((day,index)=><DetailedDay key={day.day} day={day} last={index===trip.days.length-1}/>)}</View>
      {trip.attractionsSummary&&trip.attractionsSummary.length>0&&<SummaryList title="สรุปสถานที่เที่ยว" icon="location-outline" items={trip.attractionsSummary}/>} 
      {trip.accommodationPlan&&trip.accommodationPlan.length>0&&<View style={s.summaryPanel}><SectionMiniTitle icon="bed-outline" title="สรุปที่พัก"/><View style={s.accommodationGrid}>{trip.accommodationPlan.map(x=><View key={x.night} style={s.nightCard}><Text style={s.nightNo}>คืน {x.night}</Text><Text style={s.nightLocation}>{x.location}</Text></View>)}</View></View>}
      {trip.budgetSummaryLines&&trip.budgetSummaryLines.length>0&&<View style={s.summaryPanel}><SectionMiniTitle icon="wallet-outline" title="งบประมาณรวม"/>{trip.overviewBudgetRange&&<View style={s.heroBudget}><Text style={s.heroBudgetLabel}>งบที่แนะนำ</Text><Text style={s.heroBudgetValue}>{formatRange(trip.overviewBudgetRange)}</Text></View>}<View style={s.budgetSummaryLines}>{trip.budgetSummaryLines.map((x,i)=><Text key={i} style={s.summaryLine}>{x}</Text>)}</View></View>}
      {trip.packingList&&trip.packingList.length>0&&<SummaryList title="ของที่ควรเตรียม" icon="bag-handle-outline" items={trip.packingList} chips/>}
      {trip.importantNotes&&trip.importantNotes.length>0&&<View style={s.warningPanel}><View style={s.warningHead}><Ionicons name="warning-outline" size={18} color="#A36F1F"/><Text style={s.warningTitle}>หมายเหตุสำคัญ</Text></View>{trip.importantNotes.map((x,i)=><Text key={i} style={s.warningText}>• {x}</Text>)}</View>}
    </View></FadeBlock>}
  </Animated.View>
}

function DetailedDay({day,last}:{day:TripDay;last:boolean}){
  return <View style={s.dayWrap}>
    <View style={s.dayRail}>{!last&&<View style={s.dayRailLine}/>}<View style={s.dayBubble}><Text style={s.dayBubbleText}>{day.day}</Text></View></View>
    <View style={s.dayCard}>
      <View style={s.dayHeader}><View><Text style={s.dayEyebrow}>DAY {day.day}</Text><Text style={s.dayTitle}>{day.title||`วันที่ ${day.day}`}</Text>{day.date&&<Text style={s.dayDate}>{day.date}</Text>}</View>{day.budgetRange&&<View style={s.dayBudgetBadge}><Text style={s.dayBudgetBadgeText}>{formatRange(day.budgetRange)}</Text></View>}</View>
      {day.schedule&&day.schedule.length>0?<View style={s.schedule}>{day.schedule.map((slot,index)=><View key={slot.id||`${day.day}-${index}`} style={s.slot}><View style={s.timeCol}><Text style={s.timeText}>{slot.time||'—'}</Text><View style={s.timeDot}/>{index<day.schedule!.length-1&&<View style={s.timeLine}/>}</View><View style={s.slotBody}><Text style={s.slotTitle}>{slot.title}</Text>{slot.detail&&<Text style={s.slotDetail}>{slot.detail}</Text>}{slot.activities&&slot.activities.length>0&&<View style={s.activityList}>{slot.activities.map((x,i)=><View key={i} style={s.activityRow}><Ionicons name="checkmark-circle-outline" size={14} color={COLORS.primary}/><Text style={s.activityText}>{x}</Text></View>)}</View>}{slot.notes&&slot.notes.length>0&&<View style={s.slotNote}>{slot.notes.map((x,i)=><Text key={i} style={s.slotNoteText}>• {x}</Text>)}</View>}</View></View>)}</View>:day.placeIds.length>0?<View style={s.fallbackPlaces}>{day.placeIds.map(id=>{const p=PLACES.find(x=>x.id===id);return p?<View key={id} style={s.placeRow}><Ionicons name="location" size={14} color={COLORS.primary}/><View style={{flex:1}}><Text style={s.placeName}>{p.name}</Text><Text style={s.placeMeta}>{p.province} · {p.category}</Text></View></View>:null})}</View>:<Text style={s.placeMuted}>ยังไม่มีช่วงเวลาในวันนี้</Text>}
      {day.accommodation&&<View style={s.dayFooterRow}><Ionicons name="bed-outline" size={15} color={COLORS.primaryDark}/><Text style={s.dayFooterText}>พัก: {day.accommodation}</Text></View>}
      {day.budgetItems&&day.budgetItems.length>0&&<View style={s.dayBudgetBox}><Text style={s.dayBudgetTitle}>งบวันนี้</Text>{day.budgetItems.map((x,i)=><View key={i} style={s.dayBudgetRow}><Text style={s.dayBudgetLabel}>{x.label}</Text><Text style={s.dayBudgetValue}>{x.min===x.max?`${formatMoney(x.min)} บาท`:`${formatMoney(x.min)}–${formatMoney(x.max)} บาท`}</Text></View>)}</View>}
      {day.note&&<View style={s.dayNote}><Ionicons name="bulb-outline" size={14} color={COLORS.primaryDark}/><Text style={s.dayNoteText}>{day.note}</Text></View>}
    </View>
  </View>
}

function RouteStrip({stops}:{stops:string[]}){return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.routeStrip}>{stops.map((stop,i)=><React.Fragment key={`${stop}-${i}`}><View style={s.routeStop}><Text style={s.routeStopNo}>{i+1}</Text><Text style={s.routeStopText}>{stop}</Text></View>{i<stops.length-1&&<Ionicons name="arrow-forward" size={14} color={COLORS.primary}/>}</React.Fragment>)}</ScrollView>}
function SummaryList({title,icon,items,chips=false}:{title:string;icon:any;items:string[];chips?:boolean}){return <View style={s.summaryPanel}><SectionMiniTitle icon={icon} title={title}/><View style={chips?s.summaryChips:s.summaryList}>{items.map((x,i)=>chips?<View key={i} style={s.summaryChip}><Ionicons name="checkmark" size={12} color={COLORS.primaryDark}/><Text style={s.summaryChipText}>{x}</Text></View>:<View key={i} style={s.summaryItem}><Text style={s.summaryNo}>{i+1}</Text><Text style={s.summaryItemText}>{x}</Text></View>)}</View></View>}
function SectionMiniTitle({icon,title}:{icon:any;title:string}){return <View style={s.miniTitleRow}><View style={s.miniTitleIcon}><Ionicons name={icon} size={16} color={COLORS.primaryDark}/></View><Text style={s.miniTitle}>{title}</Text></View>}
function InfoPanel({icon,title,text}:{icon:any;title:string;text:string}){return <View style={s.infoPanel}><Ionicons name={icon} size={18} color={COLORS.primaryDark}/><View style={{flex:1}}><Text style={s.infoTitle}>{title}</Text><Text style={s.infoText}>{text}</Text></View></View>}
function Meta({icon,text}:{icon:any;text:string}){return <View style={s.metaPill}><Ionicons name={icon} size={13} color={COLORS.primary}/><Text style={s.tripMeta}>{text}</Text></View>}
function MiniStat({icon,value,label}:{icon:any;value:string;label:string}){return <View style={s.miniStat}><Ionicons name={icon} size={15} color={COLORS.primary}/><Text style={s.miniStatValue}>{value}</Text><Text style={s.miniStatLabel}>{label}</Text></View>}

function MotionPressable({children,style,onPress,disabled}:{children:React.ReactNode;style?:any;onPress?:()=>void;disabled?:boolean}){
  const scale=useRef(new Animated.Value(1)).current;
  const down=()=>Animated.spring(scale,{toValue:.975,useNativeDriver:true,damping:18,stiffness:260,mass:.4}).start();
  const up=()=>Animated.spring(scale,{toValue:1,useNativeDriver:true,damping:15,stiffness:220,mass:.5}).start();
  return <Animated.View style={[style,{transform:[{scale}]}]}><Pressable disabled={disabled} onPress={onPress} onPressIn={down} onPressOut={up} style={s.pressFill}>{children}</Pressable></Animated.View>
}
function StepTransition({trigger,children}:{trigger:number;children:React.ReactNode}){const anim=useRef(new Animated.Value(0)).current;useEffect(()=>{anim.setValue(0);Animated.timing(anim,{toValue:1,duration:300,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start()},[trigger,anim]);return <Animated.View style={{opacity:anim,transform:[{translateX:anim.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}}>{children}</Animated.View>}
function FadeBlock({children}:{children:React.ReactNode}){const anim=useRef(new Animated.Value(0)).current;useEffect(()=>{Animated.timing(anim,{toValue:1,duration:320,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start()},[anim]);return <Animated.View style={{opacity:anim,transform:[{translateY:anim.interpolate({inputRange:[0,1],outputRange:[8,0]})}]}}>{children}</Animated.View>}
function AnimatedStat({icon,n,label,delay=0,moneyValue=false}:{icon:any;n:number;label:string;delay?:number;moneyValue?:boolean}){const anim=useRef(new Animated.Value(0)).current;const [display,setDisplay]=useState(0);useEffect(()=>{const sub=anim.addListener(({value})=>setDisplay(Math.round(value)));anim.setValue(0);Animated.timing(anim,{toValue:n,duration:650,delay,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start();return()=>anim.removeListener(sub)},[n,delay,anim]);return <View style={s.stat}><View style={s.statIcon}><Ionicons name={icon} size={18} color={COLORS.primary}/></View><Text style={s.statN}>{moneyValue?display.toLocaleString():display}</Text><Text style={s.statLabel}>{label}</Text></View>}
function Field({label,children,flex}:{label:string;children:React.ReactNode;flex?:boolean}){return <View style={[s.field,flex&&{flex:1,minWidth:150}]}><Text style={s.fieldLabel}>{label}</Text>{children}</View>}
function Choice({text,active,onPress}:{text:string;active:boolean;onPress:()=>void}){return <MotionPressable style={[s.choice,active&&s.choiceOn]} onPress={onPress}>{active&&<Ionicons name="checkmark" size={13} color="#fff"/>}<Text style={[s.choiceText,active&&s.choiceTextOn]}>{text}</Text></MotionPressable>}
function SectionHeader({icon,title,subtitle}:{icon:any;title:string;subtitle:string}){return <View style={s.sectionHeader}><View style={s.sectionIcon}><Ionicons name={icon} size={18} color={COLORS.primaryDark}/></View><View style={{flex:1}}><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionSub}>{subtitle}</Text></View></View>}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F1F7F7'},content:{padding:SPACING.lg,paddingBottom:130,gap:16,maxWidth:1420,width:'100%',alignSelf:'center'},pressFill:{width:'100%',height:'100%',alignItems:'stretch',justifyContent:'center'},
  hero:{overflow:'hidden',borderRadius:28,backgroundColor:'#E8F5F3',borderWidth:1,borderColor:'#CBE5E2',padding:22,minHeight:132},heroContent:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:18,flexWrap:'wrap'},heroOrb:{position:'absolute',borderRadius:999,backgroundColor:'#B9E4DF'},heroOrbA:{width:220,height:220,right:-60,top:-120},heroOrbB:{width:150,height:150,right:220,bottom:-105,backgroundColor:'#F7DC9A'},eyebrow:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'rgba(255,255,255,.72)',paddingHorizontal:10,paddingVertical:6,borderRadius:999,borderWidth:1,borderColor:'#D7E9E7'},eyebrowText:{fontSize:9,fontWeight:'900',letterSpacing:1.1,color:COLORS.primaryDark},title:{fontSize:31,fontWeight:'900',color:COLORS.text,marginTop:7},sub:{color:COLORS.textMuted,marginTop:4,lineHeight:20,maxWidth:760},heroCreate:{minWidth:235,minHeight:66,borderRadius:20,backgroundColor:COLORS.dark,padding:10,paddingRight:16,...SHADOW},heroCreateOn:{backgroundColor:'#173A31'},heroCreateIcon:{width:44,height:44,borderRadius:15,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',position:'absolute',left:10,top:11},heroCreateText:{marginLeft:56,color:'#fff',fontSize:13,fontWeight:'900'},heroCreateSub:{marginLeft:56,color:'#BFD6CF',fontSize:9,marginTop:3},
  overview:{flexDirection:'row',gap:10,flexWrap:'wrap'},stat:{minWidth:150,flex:1,backgroundColor:'rgba(255,255,255,.94)',borderWidth:1,borderColor:'#DDEAEA',borderRadius:20,padding:14,...SHADOW},statIcon:{width:36,height:36,borderRadius:13,backgroundColor:'#E8F6F5',alignItems:'center',justifyContent:'center'},statN:{fontSize:22,fontWeight:'900',color:COLORS.text,marginTop:8},statLabel:{fontSize:10,color:COLORS.textMuted,marginTop:2,fontWeight:'700'},
  createBanner:{minHeight:78,backgroundColor:'#fff',borderWidth:1,borderColor:'#D5E8E6',borderRadius:22,padding:14,...SHADOW},createIcon:{width:46,height:46,borderRadius:16,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',position:'absolute',left:14,top:15},createTitle:{fontSize:15,fontWeight:'900',color:COLORS.text,marginLeft:58},createSub:{fontSize:11,color:COLORS.textMuted,marginTop:4,lineHeight:16,marginLeft:58,marginRight:42},arrowCircle:{position:'absolute',right:14,top:20,width:36,height:36,borderRadius:18,backgroundColor:'#E8F5F3',alignItems:'center',justifyContent:'center'},
  form:{backgroundColor:'rgba(255,255,255,.98)',borderRadius:28,padding:20,borderWidth:1,borderColor:'#D7E7E6',gap:15,...SHADOW},modeTabs:{flexDirection:'row',gap:9,flexWrap:'wrap'},modeTab:{flex:1,minWidth:220,minHeight:62,borderRadius:18,borderWidth:1,borderColor:'#D7E7E6',backgroundColor:'#F7FBFB',paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},modeTabOn:{backgroundColor:COLORS.primary,borderColor:COLORS.primary},modeTabImport:{backgroundColor:COLORS.dark,borderColor:COLORS.dark},modeTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},modeTitleOn:{color:'#fff'},modeSub:{fontSize:9,color:COLORS.textMuted,marginTop:2},modeSubOn:{color:'#C7DAD5'},
  formTop:{flexDirection:'row',alignItems:'center',gap:12},formTitle:{fontSize:22,fontWeight:'900',color:COLORS.text},formSub:{fontSize:11,color:COLORS.textMuted,marginTop:3},completeBadge:{width:68,height:60,borderRadius:18,backgroundColor:'#EAF7F6',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#CDE7E4'},completeValue:{fontWeight:'900',fontSize:18,color:COLORS.primaryDark},completeLabel:{fontSize:8,color:COLORS.textMuted},progressTrack:{height:5,borderRadius:99,backgroundColor:'#ECF2F2',overflow:'hidden'},progressFill:{height:'100%',borderRadius:99,backgroundColor:COLORS.primary},
  autoFillBtn:{minHeight:84,borderRadius:21,backgroundColor:COLORS.dark,padding:14,overflow:'hidden'},autoFillBtnBusy:{opacity:.94},autoFillGlow:{position:'absolute',width:180,height:180,borderRadius:90,backgroundColor:'rgba(15,166,184,.18)',right:-45,top:-60},autoFillIcon:{width:48,height:48,borderRadius:16,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',position:'absolute',left:14,top:18},autoFillTitle:{color:'#fff',fontSize:14,fontWeight:'900',marginLeft:61},autoFillSub:{color:'#C6DAD5',fontSize:10,marginTop:4,lineHeight:15,marginLeft:61,marginRight:66},autoFillBadge:{position:'absolute',right:14,top:29,flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(255,255,255,.08)',paddingHorizontal:9,paddingVertical:6,borderRadius:999},autoFillBadgeText:{fontSize:8,color:'#F5D98D',fontWeight:'900'},autoResult:{flexDirection:'row',gap:9,backgroundColor:'#F0FAF5',borderWidth:1,borderColor:'#D3EFE0',borderRadius:16,padding:12},autoResultBusy:{backgroundColor:'#FFF9ED',borderColor:'#F3DFC0'},autoResultText:{fontSize:11,color:'#2F6F50',fontWeight:'800'},sourceWrap:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:7},sourceChip:{backgroundColor:'#E3F3F1',paddingHorizontal:8,paddingVertical:4,borderRadius:999},sourceChipText:{fontSize:8,color:COLORS.primaryDark,fontWeight:'800'},
  steps:{flexDirection:'row',gap:8},stepTab:{flex:1,minHeight:46,borderRadius:14,borderWidth:1,borderColor:COLORS.border,backgroundColor:'#FAFCFD'},stepTabOn:{backgroundColor:'#EAF7F6',borderColor:'#A9D7D2'},stepNo:{position:'absolute',left:10,width:24,height:24,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#EDF2F3'},stepNoOn:{backgroundColor:COLORS.primary},stepNoText:{fontSize:10,fontWeight:'900',color:COLORS.textMuted},stepNoTextOn:{color:'#fff'},stepTabText:{fontSize:10,color:COLORS.textMuted,fontWeight:'900',marginLeft:32},stepTabTextOn:{color:COLORS.primaryDark},stepContent:{gap:13,paddingTop:3},
  sectionHeader:{flexDirection:'row',alignItems:'center',gap:10},sectionIcon:{width:38,height:38,borderRadius:14,backgroundColor:'#EAF7F6',alignItems:'center',justifyContent:'center'},sectionTitle:{fontSize:15,fontWeight:'900',color:COLORS.text},sectionSub:{fontSize:10,color:COLORS.textMuted,marginTop:2},field:{gap:6},fieldLabel:{fontSize:11,fontWeight:'900',color:COLORS.text},input:{minHeight:48,borderRadius:16,borderWidth:1,borderColor:'#DCE8EA',paddingHorizontal:13,paddingVertical:10,color:COLORS.text,backgroundColor:'#FBFDFD'},inline:{flexDirection:'row',gap:10,flexWrap:'wrap'},routeInput:{minHeight:72,textAlignVertical:'top'},noteInput:{minHeight:96,textAlignVertical:'top'},previewBox:{minHeight:44,borderRadius:14,backgroundColor:'#F1F8F8',paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:8},previewText:{fontSize:11,color:COLORS.textMuted,fontWeight:'700'},
  selectedWrap:{flexDirection:'row',flexWrap:'wrap',gap:7},selectedChip:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:9,paddingVertical:6,borderRadius:999,backgroundColor:'#E7F5F5'},selectedChipText:{fontSize:11,color:COLORS.primaryDark,fontWeight:'800'},provinceGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},provinceOption:{minWidth:130,borderWidth:1,borderColor:COLORS.border,borderRadius:14,paddingHorizontal:11,paddingVertical:9,backgroundColor:'#FAFCFD'},provinceOptionOn:{borderColor:'#95D3CE',backgroundColor:'#EAF7F6'},provinceOptionText:{fontSize:12,fontWeight:'800',color:COLORS.text},provinceOptionTextOn:{color:COLORS.primaryDark},provinceRegion:{fontSize:9,color:COLORS.textMuted,marginTop:2},choiceWrap:{flexDirection:'row',flexWrap:'wrap',gap:7},choice:{paddingHorizontal:12,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:COLORS.border,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',gap:5},choiceOn:{backgroundColor:COLORS.dark,borderColor:COLORS.dark},choiceText:{fontSize:11,color:COLORS.textMuted,fontWeight:'800'},choiceTextOn:{color:'#fff'},wishBox:{flexDirection:'row',gap:9,backgroundColor:'#FFF3F6',borderRadius:16,padding:12},wishTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},wishText:{fontSize:10,color:COLORS.textMuted,marginTop:3},
  budgetGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},budgetBox:{minWidth:155,flex:1,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:11,backgroundColor:'#FAFCFD'},budgetLabelRow:{flexDirection:'row',alignItems:'center',gap:6},budgetLabel:{fontSize:11,fontWeight:'800',color:COLORS.text},budgetInput:{fontSize:20,fontWeight:'900',color:COLORS.text,paddingVertical:7},baht:{fontSize:9,color:COLORS.textMuted},totalBox:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,backgroundColor:'#FFF6E6',borderRadius:16,padding:14},totalLabel:{fontSize:13,fontWeight:'900',color:COLORS.text},totalHint:{fontSize:10,color:COLORS.textMuted,marginTop:2},totalMoney:{fontSize:23,fontWeight:'900',color:'#A36F1F'},totalUnit:{fontSize:11},formActions:{flexDirection:'row',justifyContent:'space-between',gap:10},backBtn:{minHeight:46,paddingHorizontal:16,borderRadius:14,borderWidth:1,borderColor:COLORS.border,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},backText:{fontSize:12,fontWeight:'900',color:COLORS.text},nextBtn:{minHeight:46,paddingHorizontal:18,borderRadius:14,backgroundColor:COLORS.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},nextText:{fontSize:12,fontWeight:'900',color:'#fff'},saveBtn:{minHeight:46,paddingHorizontal:18,borderRadius:14,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},saveText:{fontSize:12,fontWeight:'900',color:'#fff'},
  importWrap:{gap:14},importHero:{backgroundColor:'#EAF7F6',borderRadius:20,padding:14,flexDirection:'row',alignItems:'center',gap:11,borderWidth:1,borderColor:'#CDE7E4'},importIcon:{width:48,height:48,borderRadius:16,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},importTitle:{fontSize:15,fontWeight:'900',color:COLORS.text},importSub:{fontSize:10,color:COLORS.textMuted,lineHeight:15,marginTop:3},importInput:{minHeight:250,textAlignVertical:'top',fontSize:12,lineHeight:18},importActions:{flexDirection:'row',gap:9,flexWrap:'wrap'},parseBtn:{minHeight:48,paddingHorizontal:18,borderRadius:15,backgroundColor:COLORS.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},importSaveBtn:{minHeight:48,paddingHorizontal:18,borderRadius:15,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},parseBtnText:{color:'#fff',fontSize:12,fontWeight:'900'},importStatus:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#F0FAF5',padding:11,borderRadius:14},importStatusText:{fontSize:11,fontWeight:'800',color:'#2F6F50'},parsePreview:{borderWidth:1,borderColor:'#D7E7E6',borderRadius:20,padding:14,gap:12,backgroundColor:'#FBFDFD'},parsePreviewTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},parseEyebrow:{fontSize:8,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1},parseTitle:{fontSize:17,color:COLORS.text,fontWeight:'900',marginTop:3},parsedBadge:{width:58,height:58,borderRadius:18,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},parsedBadgeN:{fontSize:19,fontWeight:'900',color:'#fff'},parsedBadgeL:{fontSize:8,color:'#BFD6CF'},parsedStats:{flexDirection:'row',gap:8,flexWrap:'wrap'},miniStat:{minWidth:135,flex:1,backgroundColor:'#F1F8F8',borderRadius:14,padding:10},miniStatValue:{fontSize:12,fontWeight:'900',color:COLORS.text,marginTop:5},miniStatLabel:{fontSize:9,color:COLORS.textMuted,marginTop:2},previewDays:{gap:7},previewDay:{flexDirection:'row',alignItems:'center',gap:9,padding:10,borderRadius:14,backgroundColor:'#F5FAFA'},previewDayNo:{width:30,height:30,borderRadius:15,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center'},previewDayNoText:{color:'#fff',fontWeight:'900'},previewDayTitle:{fontSize:11,fontWeight:'900',color:COLORS.text},previewDayMeta:{fontSize:9,color:COLORS.textMuted,marginTop:3},parseHint:{fontSize:9,color:COLORS.textMuted,fontStyle:'italic'},
  empty:{backgroundColor:'#fff',borderRadius:24,padding:32,alignItems:'center',borderWidth:1,borderColor:COLORS.border},emptyIcon:{width:64,height:64,borderRadius:22,backgroundColor:'#EAF7F6',alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:18,fontWeight:'900',color:COLORS.text,marginTop:10},emptyText:{color:COLORS.textMuted,textAlign:'center',marginTop:5,maxWidth:460},
  card:{backgroundColor:'#fff',borderRadius:24,padding:17,borderWidth:1,borderColor:'#DCE9E9',...SHADOW,overflow:'hidden'},cardAccent:{position:'absolute',left:0,top:0,bottom:0,width:4,backgroundColor:COLORS.primary},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:12},cardTitleRow:{flexDirection:'row',alignItems:'center',gap:7,flexWrap:'wrap'},cardTitle:{fontSize:19,fontWeight:'900',color:COLORS.text},autoBadge:{backgroundColor:'#EAF7F6',paddingHorizontal:7,paddingVertical:4,borderRadius:999},autoBadgeText:{fontSize:8,fontWeight:'900',color:COLORS.primaryDark},detailBadge:{backgroundColor:COLORS.dark,paddingHorizontal:8,paddingVertical:4,borderRadius:999},detailBadgeText:{fontSize:8,fontWeight:'900',color:'#fff'},cardSub:{color:COLORS.textMuted,fontSize:11,marginTop:4},cardActions:{flexDirection:'row',gap:8},iconBtn:{width:38,height:38,borderRadius:13,backgroundColor:'#F1F8F8',alignItems:'center',justifyContent:'center'},iconBtnDanger:{backgroundColor:'#FFF2F2'},readinessRow:{flexDirection:'row',justifyContent:'space-between',marginTop:12},readinessLabel:{fontSize:9,color:COLORS.textMuted,fontWeight:'800'},readinessValue:{fontSize:9,color:COLORS.primaryDark,fontWeight:'900'},readinessTrack:{height:4,backgroundColor:'#EDF2F2',borderRadius:99,overflow:'hidden',marginTop:5},readinessFill:{height:'100%',backgroundColor:COLORS.primary},tripMetaRow:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:10},metaPill:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:8,paddingVertical:6,borderRadius:999,backgroundColor:'#F5F9FA'},tripMeta:{fontSize:9,color:COLORS.textMuted,fontWeight:'700'},chips:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:10},chip:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:8,paddingVertical:5,borderRadius:999,backgroundColor:'#E7F5F5'},chipText:{fontSize:10,color:COLORS.primaryDark,fontWeight:'800'},sourceLine:{flexDirection:'row',alignItems:'center',gap:5,marginTop:9},sourceLineText:{fontSize:9,color:COLORS.primaryDark},routeStrip:{alignItems:'center',gap:7,paddingTop:11,paddingBottom:3},routeStop:{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#F1F8F8',borderRadius:999,paddingHorizontal:9,paddingVertical:6},routeStopNo:{fontSize:8,color:'#fff',fontWeight:'900',backgroundColor:COLORS.primary,width:17,height:17,borderRadius:9,textAlign:'center',lineHeight:17},routeStopText:{fontSize:9,fontWeight:'800',color:COLORS.text},editBox:{gap:8,marginTop:12,padding:12,borderRadius:16,backgroundColor:'#F7FAFB'},editTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},miniSave:{height:42,borderRadius:12,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},miniSaveText:{color:'#fff',fontWeight:'900',fontSize:11},expandBtn:{height:44,borderRadius:13,backgroundColor:'#F1F8F8',alignItems:'center',justifyContent:'center',marginTop:12,flexDirection:'row',gap:7},expandBtnOn:{backgroundColor:COLORS.dark},expandText:{fontSize:11,fontWeight:'900',color:COLORS.primaryDark},expandTextOn:{color:'#fff'},
  detailStack:{gap:12,marginTop:12},infoPanel:{flexDirection:'row',gap:9,backgroundColor:'#F1F8F8',borderRadius:16,padding:12},infoTitle:{fontSize:10,fontWeight:'900',color:COLORS.primaryDark},infoText:{fontSize:10,color:COLORS.textMuted,lineHeight:16,marginTop:3},timeline:{gap:0},dayWrap:{flexDirection:'row',gap:10},dayRail:{width:34,alignItems:'center'},dayRailLine:{position:'absolute',top:32,bottom:-10,width:2,backgroundColor:'#CFE7E4'},dayBubble:{width:32,height:32,borderRadius:16,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center',zIndex:2},dayBubbleText:{color:'#fff',fontWeight:'900',fontSize:11},dayCard:{flex:1,borderWidth:1,borderColor:'#E2ECEC',borderRadius:18,padding:13,marginBottom:12,backgroundColor:'#FCFEFE'},dayHeader:{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'flex-start'},dayEyebrow:{fontSize:8,color:COLORS.primary,fontWeight:'900',letterSpacing:.8},dayTitle:{fontSize:14,fontWeight:'900',color:COLORS.text,marginTop:2},dayDate:{fontSize:9,color:COLORS.textMuted,marginTop:2},dayBudgetBadge:{backgroundColor:'#FFF4DF',borderRadius:999,paddingHorizontal:9,paddingVertical:6},dayBudgetBadgeText:{fontSize:8,fontWeight:'900',color:'#9A6C21'},schedule:{marginTop:12,gap:0},slot:{flexDirection:'row',gap:10},timeCol:{width:82,alignItems:'flex-end',paddingRight:12,position:'relative'},timeText:{fontSize:9,fontWeight:'900',color:COLORS.primaryDark},timeDot:{position:'absolute',right:1,top:4,width:8,height:8,borderRadius:4,backgroundColor:COLORS.primary},timeLine:{position:'absolute',right:4,top:12,bottom:-8,width:1,backgroundColor:'#CEE6E3'},slotBody:{flex:1,paddingBottom:14},slotTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},slotDetail:{fontSize:10,color:COLORS.textMuted,lineHeight:15,marginTop:3},activityList:{gap:4,marginTop:7},activityRow:{flexDirection:'row',gap:6,alignItems:'flex-start'},activityText:{fontSize:10,color:COLORS.textMuted,flex:1,lineHeight:15},slotNote:{backgroundColor:'#FFF8E9',borderRadius:10,padding:8,marginTop:7},slotNoteText:{fontSize:9,color:'#8A6524',lineHeight:14},dayFooterRow:{flexDirection:'row',alignItems:'center',gap:6,marginTop:9,paddingTop:9,borderTopWidth:1,borderTopColor:'#E8EEEE'},dayFooterText:{fontSize:10,color:COLORS.primaryDark,fontWeight:'800'},dayBudgetBox:{marginTop:9,backgroundColor:'#F6FAFA',borderRadius:12,padding:9},dayBudgetTitle:{fontSize:10,fontWeight:'900',color:COLORS.text,marginBottom:5},dayBudgetRow:{flexDirection:'row',justifyContent:'space-between',gap:10,paddingVertical:3},dayBudgetLabel:{fontSize:9,color:COLORS.textMuted},dayBudgetValue:{fontSize:9,fontWeight:'900',color:COLORS.text},dayNote:{flexDirection:'row',gap:6,backgroundColor:'#F1F8F8',padding:8,borderRadius:10,marginTop:8},dayNoteText:{fontSize:9,color:COLORS.primaryDark,lineHeight:14,flex:1},fallbackPlaces:{gap:7,marginTop:10},placeRow:{flexDirection:'row',alignItems:'center',gap:7,padding:8,borderRadius:10,backgroundColor:'#F5F9FA'},placeName:{fontSize:10,fontWeight:'900',color:COLORS.text},placeMeta:{fontSize:8,color:COLORS.textMuted,marginTop:2},placeMuted:{fontSize:10,color:COLORS.textMuted,fontStyle:'italic',marginTop:10},
  summaryPanel:{borderWidth:1,borderColor:'#E2ECEC',borderRadius:18,padding:13,backgroundColor:'#FCFEFE'},miniTitleRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:10},miniTitleIcon:{width:31,height:31,borderRadius:11,backgroundColor:'#EAF7F6',alignItems:'center',justifyContent:'center'},miniTitle:{fontSize:13,fontWeight:'900',color:COLORS.text},summaryList:{gap:7},summaryItem:{flexDirection:'row',alignItems:'center',gap:8},summaryNo:{width:22,height:22,borderRadius:11,backgroundColor:COLORS.dark,color:'#fff',fontSize:9,fontWeight:'900',textAlign:'center',lineHeight:22},summaryItemText:{fontSize:10,color:COLORS.text,flex:1},summaryChips:{flexDirection:'row',flexWrap:'wrap',gap:7},summaryChip:{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#F1F8F8',borderRadius:999,paddingHorizontal:9,paddingVertical:6},summaryChipText:{fontSize:9,color:COLORS.primaryDark,fontWeight:'800'},accommodationGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},nightCard:{minWidth:150,flex:1,backgroundColor:'#F5F9FA',borderRadius:12,padding:9},nightNo:{fontSize:8,color:COLORS.primaryDark,fontWeight:'900'},nightLocation:{fontSize:10,color:COLORS.text,fontWeight:'800',marginTop:3},heroBudget:{backgroundColor:'#FFF4DF',borderRadius:14,padding:11,marginBottom:8},heroBudgetLabel:{fontSize:9,color:'#8A6524',fontWeight:'800'},heroBudgetValue:{fontSize:18,color:'#9A6C21',fontWeight:'900',marginTop:2},budgetSummaryLines:{gap:3},summaryLine:{fontSize:9,color:COLORS.textMuted,lineHeight:14},warningPanel:{backgroundColor:'#FFF8E9',borderWidth:1,borderColor:'#F1DFB8',borderRadius:18,padding:13},warningHead:{flexDirection:'row',alignItems:'center',gap:7,marginBottom:7},warningTitle:{fontSize:12,fontWeight:'900',color:'#8A6524'},warningText:{fontSize:9,color:'#8A6524',lineHeight:15},
});
