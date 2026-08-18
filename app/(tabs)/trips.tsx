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
import { Trip, TripBudgetBreakdown } from '@/types';

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
const isoToday=()=>new Date().toISOString().slice(0,10);
const addDays=(date:string,count:number)=>{
  const d=new Date(`${date}T12:00:00`);
  if(Number.isNaN(d.getTime()))return '';
  d.setDate(d.getDate()+Math.max(0,count-1));
  return d.toISOString().slice(0,10);
};
const clampDays=(v:string)=>Math.max(1,Math.min(14,Number(v)||1));

export default function Trips(){
  const {width}=useWindowDimensions();
  const wide=width>=980;
  const {
    trips,createTrip,updateTrip,deleteTrip,wishlistPlaceIds,wishlistProvinceIds,preferences,
  }=useTravelStore();

  const [open,setOpen]=useState(false);
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
  const [budgetInputs,setBudgetInputs]=useState<Record<keyof TripBudgetBreakdown,string>>({transport:'',accommodation:'',food:'',activities:'',other:''});
  const [autoStatus,setAutoStatus]=useState('');
  const [autoSource,setAutoSource]=useState<string[]>([]);
  const [autoFilling,setAutoFilling]=useState(false);

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
  },[open,formIn]);

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
    selectedProvinceIds.length>0,transport,tripStyle,accommodation.trim(),totalBudget>0,note.trim(),
  ];
  const completion=Math.round(completionFields.filter(Boolean).length/completionFields.length*100);

  useEffect(()=>{
    Animated.timing(progressAnim,{toValue:completion,duration:520,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start();
  },[completion,progressAnim]);

  const resetDraft=()=>{
    setStep(1);setTitle('ทริปใหม่');setStartDate(isoToday());setDays('3');setTravelers('2');
    setTransport('รถยนต์');setAccommodation('');setTripStyle('ชิล ๆ');setProvinceSearch('');
    setSelectedProvinceIds(wishlistProvinceIds.slice(0,4));setNote('');
    setBudgetInputs({transport:'',accommodation:'',food:'',activities:'',other:''});
    setAutoStatus('');setAutoSource([]);setAutoFilling(false);
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

    if(!accommodation.trim()&&first){
      setAccommodation(`โซนตัวเมือง${first.nameTh} / ใกล้จุดเดินทางหลัก — เลือกโรงแรมตามงบอีกครั้งก่อนจอง`);
      sources.push('ข้อมูลจังหวัด');
    }

    if(totalBudget===0){
      const estimated=estimateBudget(provinceIds);
      setBudgetInputs({
        transport:String(estimated.transport),accommodation:String(estimated.accommodation),food:String(estimated.food),activities:String(estimated.activities),other:String(estimated.other),
      });
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
        'หมายเหตุ: งบและเวลาเป็นค่าประมาณสำหรับวางแผน ควรตรวจราคา เวลาเปิด–ปิด สภาพอากาศ และการเดินทางอีกครั้งก่อนจอง',
      ].join('\n'));
      sources.push('ข้อมูลเที่ยวจังหวัด');
    }

    if(!startDate)setStartDate(isoToday());
    if(!days||Number(days)<=0)setDays('3');
    if(!travelers||Number(travelers)<=0)setTravelers('2');

    sources.push('ค่าที่ระบบแนะนำ');
    setAutoSource(Array.from(new Set(sources)));
    setAutoStatus('เติมช่องที่ขาดเรียบร้อยแล้ว — ตรวจและแก้ได้ทุกช่องก่อนสร้างทริป');
    setStep(3);
  };

  const autoFill=()=>{
    if(autoFilling)return;
    setAutoFilling(true);
    setAutoStatus('กำลังจัดข้อมูลจาก Wishlist และข้อมูลจังหวัด...');
    Animated.sequence([
      Animated.timing(autoPulse,{toValue:1.025,duration:180,easing:Easing.out(Easing.quad),useNativeDriver:true}),
      Animated.timing(autoPulse,{toValue:1,duration:220,easing:Easing.out(Easing.quad),useNativeDriver:true}),
    ]).start();
    setTimeout(()=>{
      applyAutoFill();
      setAutoFilling(false);
    },520);
  };

  const buildDays=(provinceIds:string[])=>{
    const wish=PLACES.filter(p=>wishlistPlaceIds.includes(p.id)&&provinceIds.includes(p.provinceId));
    const catalog=PLACES.filter(p=>provinceIds.includes(p.provinceId)&&!wish.some(w=>w.id===p.id));
    const usable=[...wish,...catalog].slice(0,Math.max(nDays*3,6));
    return Array.from({length:nDays},(_,i)=>{
      const dayProvince=PROVINCES.find(p=>p.id===provinceIds[i%provinceIds.length]);
      const info=dayProvince?getProvinceInfo(dayProvince.nameTh,dayProvince.region,dayProvince.description,dayProvince.bestMonths):null;
      const dayPlaces=usable.filter((_,idx)=>idx%nDays===i).slice(0,3);
      const fallbackHighlight=info?.highlights?.[i%Math.max(1,info.highlights.length)]||'';
      return {
        day:i+1,date:addDays(startDate,i+1),title:dayProvince?`Day ${i+1} · ${dayProvince.nameTh}`:`Day ${i+1}`,
        placeIds:dayPlaces.map(p=>p.id),
        note:dayPlaces.length
          ? `แนะนำให้จัดลำดับตามระยะทางจริงก่อนออกเดินทาง · ${info?.travelTips?.[0]||'เผื่อเวลาเดินทางระหว่างจุด'}`
          : `แนะนำ: ${fallbackHighlight||'เลือกสถานที่เด่นในพื้นที่'} · ${info?.travelTips?.[0]||'ตรวจเวลาเปิด–ปิดก่อนเดินทาง'}`,
      };
    });
  };

  const save=()=>{
    const provinceIds=resolveProvinceIds();
    const endDate=addDays(startDate,nDays);
    const budgetBreakdown={
      transport:money(budgetInputs.transport),accommodation:money(budgetInputs.accommodation),food:money(budgetInputs.food),activities:money(budgetInputs.activities),other:money(budgetInputs.other),
    };
    const budget=Object.values(budgetBreakdown).reduce((sum,v)=>sum+(v||0),0);
    const provinceNames=provinceIds.map(id=>PROVINCES.find(p=>p.id===id)?.nameTh).filter(Boolean).join(' • ');
    const plan:Trip={
      id:String(Date.now()),title:title.trim()||`${provinceNames||'ทริปใหม่'} ${nDays} วัน`,startDate:startDate||isoToday(),endDate,budget,provinceIds,
      travelers:Math.max(1,Number(travelers)||1),transport,accommodation:accommodation.trim(),tripStyle,budgetBreakdown,note:note.trim(),status:'วางแผน',
      destinationSummary:provinceNames,autoFilled:autoSource.length>0,autoFillSource:autoSource.join(' + '),days:buildDays(provinceIds),
    };
    createTrip(plan);
    setOpen(false);
    resetDraft();
  };

  const pageStyle={
    opacity:pageIn,
    transform:[{translateY:pageIn.interpolate({inputRange:[0,1],outputRange:[16,0]})}],
  };
  const ambientStyle={
    opacity:ambient.interpolate({inputRange:[0,1],outputRange:[.28,.55]}),
    transform:[{translateY:ambient.interpolate({inputRange:[0,1],outputRange:[0,-10]})}],
  };
  const progressWidth=progressAnim.interpolate({inputRange:[0,100],outputRange:['0%','100%']});

  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Animated.View style={[s.hero,pageStyle]}>
        <Animated.View pointerEvents="none" style={[s.heroOrb,s.heroOrbA,ambientStyle]}/>
        <Animated.View pointerEvents="none" style={[s.heroOrb,s.heroOrbB,{opacity:ambient.interpolate({inputRange:[0,1],outputRange:[.18,.38]})}]}/>
        <View style={s.heroContent}>
          <View style={{flex:1,minWidth:260}}>
            <View style={s.eyebrow}><Ionicons name="route-outline" size={14} color={COLORS.primaryDark}/><Text style={s.eyebrowText}>SMART TRIP PLANNER</Text></View>
            <Text style={s.title}>แผนการเดินทาง</Text>
            <Text style={s.sub}>สร้างทริปได้เร็วขึ้นด้วย Auto Fill แล้วปรับรายละเอียดเองได้ทุกส่วน</Text>
          </View>
          <MotionPressable style={[s.heroCreate,open&&s.heroCreateOn]} onPress={()=>{setOpen(v=>!v);setStep(1)}}>
            <View style={s.heroCreateIcon}><Ionicons name={open?'close':'add'} size={22} color="#fff"/></View>
            <View><Text style={s.heroCreateText}>{open?'ปิดตัวสร้าง':'สร้างทริปใหม่'}</Text><Text style={s.heroCreateSub}>{open?'กลับไปดูทริปด้านล่าง':'Auto Fill ได้ในคลิกเดียว'}</Text></View>
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
        <View style={{flex:1}}><Text style={s.createTitle}>เริ่มวางแผนทริปในไม่กี่วินาที</Text><Text style={s.createSub}>เลือกจังหวัดเอง หรือปล่อยให้ Auto Fill ดึง Wishlist + Preference + ข้อมูลจังหวัดมาจัดให้</Text></View>
        <View style={s.arrowCircle}><Ionicons name="arrow-forward" size={18} color={COLORS.primaryDark}/></View>
      </MotionPressable>}

      {open&&<Animated.View style={[s.form,{opacity:formIn,transform:[{translateY:formIn.interpolate({inputRange:[0,1],outputRange:[24,0]})},{scale:formIn.interpolate({inputRange:[0,1],outputRange:[.985,1]})}]}]}>
        <View style={s.formTop}>
          <View style={{flex:1}}><Text style={s.formTitle}>สร้างแผนทริป</Text><Text style={s.formSub}>กรอกเอง หรือให้ระบบเติมข้อมูลที่ขาดก่อน แล้วค่อยตรวจแก้</Text></View>
          <View style={s.completeBadge}><Text style={s.completeValue}>{completion}%</Text><Text style={s.completeLabel}>ความพร้อม</Text></View>
        </View>
        <View style={s.progressTrack}><Animated.View style={[s.progressFill,{width:progressWidth}]}/></View>

        <Animated.View style={{transform:[{scale:autoPulse}]}}>
          <MotionPressable style={[s.autoFillBtn,autoFilling&&s.autoFillBtnBusy]} onPress={autoFill} disabled={autoFilling}>
            <View style={s.autoFillGlow}/>
            <View style={s.autoFillIcon}><Ionicons name={autoFilling?'sync':'sparkles'} size={22} color="#fff"/></View>
            <View style={{flex:1}}>
              <Text style={s.autoFillTitle}>{autoFilling?'กำลัง AUTO FILL...':'AUTO FILL · เติมช่องที่ขาด'}</Text>
              <Text style={s.autoFillSub}>{autoFilling?'กำลังรวมข้อมูลและจัดลำดับให้เหมาะกับทริป':'Wishlist → Preference → จังหวัด → งบประมาณแนะนำ'}</Text>
            </View>
            <View style={s.autoFillBadge}><Ionicons name="flash" size={15} color={COLORS.gold}/><Text style={s.autoFillBadgeText}>SMART</Text></View>
          </MotionPressable>
        </Animated.View>

        {!!autoStatus&&<FadeBlock key={autoStatus}>
          <View style={[s.autoResult,autoFilling&&s.autoResultBusy]}>
            <Ionicons name={autoFilling?'hourglass-outline':'checkmark-circle'} size={19} color={autoFilling?COLORS.rating:COLORS.visited}/>
            <View style={{flex:1}}><Text style={s.autoResultText}>{autoStatus}</Text>{autoSource.length>0&&<View style={s.sourceWrap}>{autoSource.map(x=><View key={x} style={s.sourceChip}><Text style={s.sourceChipText}>{x}</Text></View>)}</View>}</View>
          </View>
        </FadeBlock>}

        <View style={s.steps}>
          {[1,2,3].map(x=><MotionPressable key={x} style={[s.stepTab,step===x&&s.stepTabOn]} onPress={()=>setStep(x)}>
            <View style={[s.stepNo,step===x&&s.stepNoOn]}><Text style={[s.stepNoText,step===x&&s.stepNoTextOn]}>{x}</Text></View>
            <Text style={[s.stepTabText,step===x&&s.stepTabTextOn]}>{x===1?'ข้อมูลทริป':x===2?'จุดหมาย':'งบและสรุป'}</Text>
          </MotionPressable>)}
        </View>

        <StepTransition trigger={step}>
          {step===1&&<View style={s.stepContent}>
            <SectionHeader icon="create-outline" title="ข้อมูลทริป" subtitle="กรอกเท่าที่รู้ ที่เหลือให้ Auto Fill ช่วยได้"/>
            <Field label="ชื่อทริป"><TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="เช่น เชียงใหม่ 4 วัน 3 คืน" placeholderTextColor="#9AA8B4"/></Field>
            <View style={s.inline}>
              <Field label="วันเริ่มเดินทาง" flex><TextInput style={s.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9AA8B4"/></Field>
              <Field label="จำนวนวัน" flex><TextInput style={s.input} value={days} onChangeText={setDays} keyboardType="number-pad" placeholder="3" placeholderTextColor="#9AA8B4"/></Field>
              <Field label="ผู้เดินทาง" flex><TextInput style={s.input} value={travelers} onChangeText={setTravelers} keyboardType="number-pad" placeholder="2" placeholderTextColor="#9AA8B4"/></Field>
            </View>
            <View style={s.previewBox}><View style={s.previewIcon}><Ionicons name="calendar" size={17} color={COLORS.primary}/></View><Text style={s.previewText}>{startDate||'ยังไม่ระบุ'} → {addDays(startDate,nDays)||'ยังไม่ระบุ'} · {nDays} วัน · {Math.max(1,Number(travelers)||1)} คน</Text></View>
          </View>}

          {step===2&&<View style={s.stepContent}>
            <SectionHeader icon="location-outline" title="จุดหมายและรูปแบบทริป" subtitle="เลือกหลายจังหวัดได้ หรือปล่อยให้ Auto Fill ดึงจาก Wishlist"/>
            <Field label="ค้นหาจังหวัด"><TextInput style={s.input} value={provinceSearch} onChangeText={setProvinceSearch} placeholder="ค้นหา เชียงใหม่, กระบี่, น่าน..." placeholderTextColor="#9AA8B4"/></Field>
            {selectedProvinceIds.length>0&&<View style={s.selectedWrap}>{selectedProvinceIds.map(id=>{const p=PROVINCES.find(x=>x.id===id);return p?<MotionPressable key={id} style={s.selectedChip} onPress={()=>toggleProvince(id)}><Ionicons name="checkmark-circle" size={15} color={COLORS.primary}/><Text style={s.selectedChipText}>{p.nameTh}</Text><Ionicons name="close" size={13} color={COLORS.textMuted}/></MotionPressable>:null})}</View>}
            <View style={s.provinceGrid}>{provinceResults.map(p=>{const on=selectedProvinceIds.includes(p.id);return <MotionPressable key={p.id} style={[s.provinceOption,on&&s.provinceOptionOn]} onPress={()=>toggleProvince(p.id)}><Text style={[s.provinceOptionText,on&&s.provinceOptionTextOn]}>{p.nameTh}</Text><Text style={s.provinceRegion}>{p.region}</Text>{on&&<View style={s.provinceCheck}><Ionicons name="checkmark" size={11} color="#fff"/></View>}</MotionPressable>})}</View>
            <Field label="เดินทางหลัก"><View style={s.choiceWrap}>{TRANSPORTS.map(x=><Choice key={x} text={x} active={transport===x} onPress={()=>setTransport(x)}/>)}</View></Field>
            <Field label="สไตล์ทริป"><View style={s.choiceWrap}>{STYLES.map(x=><Choice key={x} text={x} active={tripStyle===x} onPress={()=>setTripStyle(x)}/>)}</View></Field>
            <Field label="ที่พัก / โซนที่พัก"><TextInput style={s.input} value={accommodation} onChangeText={setAccommodation} placeholder="เช่น ย่านนิมมาน / ตัวเมือง / ยังไม่จอง" placeholderTextColor="#9AA8B4"/></Field>
            <View style={s.wishBox}><View style={s.wishIcon}><Ionicons name="heart" size={17} color={COLORS.wishlist}/></View><View style={{flex:1}}><Text style={s.wishTitle}>{selectedPlaces.length} Wishlist · {fallbackPlaces.length} สถานที่ใน Catalog</Text><Text style={s.wishText}>ระบบจะใช้ Wishlist ก่อน แล้วเติมสถานที่ในจังหวัดเมื่อข้อมูลยังไม่พอ</Text></View></View>
          </View>}

          {step===3&&<View style={s.stepContent}>
            <SectionHeader icon="wallet-outline" title="งบประมาณและข้อมูลเสริม" subtitle="เห็นงบแต่ละหมวดชัดเจน และแก้ได้ก่อนบันทึก"/>
            <View style={s.budgetGrid}>{BUDGET_FIELDS.map(([key,label,icon])=><View key={key} style={s.budgetBox}><View style={s.budgetLabelRow}><View style={s.budgetIcon}><Ionicons name={icon as any} size={15} color={COLORS.primary}/></View><Text style={s.budgetLabel}>{label}</Text></View><TextInput style={s.budgetInput} value={budgetInputs[key]} onChangeText={v=>setBudget(key,v)} keyboardType="number-pad" placeholder="0" placeholderTextColor="#9AA8B4"/><Text style={s.baht}>บาท</Text></View>)}</View>
            <View style={s.totalBox}><View><Text style={s.totalLabel}>งบประมาณรวม</Text><Text style={s.totalHint}>อัปเดตตามทุกหมวดแบบทันที</Text></View><Text style={s.totalMoney}>{totalBudget.toLocaleString()} <Text style={s.totalUnit}>บาท</Text></Text></View>
            <Field label="โน้ต / สิ่งที่ต้องรู้ก่อนเดินทาง"><TextInput style={[s.input,s.noteInput]} value={note} onChangeText={setNote} multiline placeholder="Auto Fill จะใส่จุดเด่น ของกิน คำแนะนำ และสิ่งที่ควรเช็กให้" placeholderTextColor="#9AA8B4"/></Field>
            <View style={s.planPreview}><View style={s.planPreviewIcon}><Ionicons name="sparkles" size={18} color="#fff"/></View><View style={{flex:1}}><Text style={s.planPreviewTitle}>พร้อมสร้างแผนรายวัน</Text><Text style={s.planPreviewText}>{nDays} วัน · {selectedProvinceIds.length||resolveProvinceIds().length} จังหวัด · Wishlist ก่อน · Catalog เสริม · {transport} · {Math.max(1,Number(travelers)||1)} คน</Text></View></View>
          </View>}
        </StepTransition>

        <View style={s.formActions}>
          {step>1?<MotionPressable style={s.backBtn} onPress={()=>setStep(x=>x-1)}><Ionicons name="arrow-back" size={18} color={COLORS.text}/><Text style={s.backText}>ย้อนกลับ</Text></MotionPressable>:<MotionPressable style={s.backBtn} onPress={()=>{setOpen(false);resetDraft()}}><Text style={s.backText}>ยกเลิก</Text></MotionPressable>}
          {step<3?<MotionPressable style={s.nextBtn} onPress={()=>setStep(x=>x+1)}><Text style={s.nextText}>ถัดไป</Text><Ionicons name="arrow-forward" size={18} color="#fff"/></MotionPressable>:<MotionPressable style={s.saveBtn} onPress={save}><Ionicons name="checkmark-circle" size={19} color="#fff"/><Text style={s.saveText}>สร้างแผนทริป</Text></MotionPressable>}
        </View>
      </Animated.View>}

      {!trips.length?<FadeBlock><View style={s.empty}><View style={s.emptyIcon}><Ionicons name="calendar-outline" size={30} color={COLORS.primary}/></View><Text style={s.emptyTitle}>ยังไม่มีแผนทริป</Text><Text style={s.emptyText}>เริ่มด้วย “สร้างทริปใหม่” แล้วกด Auto Fill เพื่อให้ระบบจัดโครงทริปให้ก่อน</Text></View></FadeBlock>:
        <View style={[s.tripGrid,wide&&s.tripGridWide]}>{trips.map((t,index)=><TripCard key={t.id} trip={t} delay={index*70} onDelete={()=>Alert.alert('ลบทริป',`ลบ ${t.title}?`,[{text:'ยกเลิก'},{text:'ลบ',style:'destructive',onPress:()=>deleteTrip(t.id)}])} onUpdate={patch=>updateTrip(t.id,patch)}/>)}</View>}
    </ScrollView>
  </SafeAreaView>
}

function TripCard({trip,onDelete,onUpdate,delay}:{trip:Trip;onDelete:()=>void;onUpdate:(patch:Partial<Trip>)=>void;delay:number}){
  const [expanded,setExpanded]=useState(false);
  const [edit,setEdit]=useState(false);
  const [name,setName]=useState(trip.title);
  const [hotel,setHotel]=useState(trip.accommodation||'');
  const [tripNote,setTripNote]=useState(trip.note||'');
  const enter=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.timing(enter,{toValue:1,duration:450,delay,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
  },[enter,delay]);
  const provinces=trip.provinceIds.map(id=>PROVINCES.find(p=>p.id===id)).filter(Boolean) as typeof PROVINCES;
  const readiness=Math.round([
    trip.title,trip.startDate,trip.endDate,trip.provinceIds.length>0,trip.transport,trip.accommodation,trip.budget>0,trip.days.length>0,
  ].filter(Boolean).length/8*100);
  const saveEdit=()=>{onUpdate({title:name.trim()||trip.title,accommodation:hotel.trim(),note:tripNote.trim()});setEdit(false)};
  return <Animated.View style={[s.card,{opacity:enter,transform:[{translateY:enter.interpolate({inputRange:[0,1],outputRange:[18,0]})}]}]}>
    <View style={s.cardAccent}/>
    <View style={s.cardTop}>
      <View style={{flex:1}}>
        <View style={s.cardTitleRow}><Text style={s.cardTitle}>{trip.title}</Text>{trip.autoFilled&&<View style={s.autoBadge}><Ionicons name="sparkles" size={10} color={COLORS.primaryDark}/><Text style={s.autoBadgeText}>AUTO</Text></View>}</View>
        <Text style={s.cardSub}>{trip.days.length} วัน · {trip.travelers||1} คน · {trip.transport||'ไม่ระบุ'} · งบ {trip.budget.toLocaleString()} บาท</Text>
      </View>
      <View style={s.cardActions}><MotionPressable style={s.iconBtn} onPress={()=>setEdit(v=>!v)}><Ionicons name="create-outline" size={18} color={COLORS.primary}/></MotionPressable><MotionPressable style={[s.iconBtn,s.iconBtnDanger]} onPress={onDelete}><Ionicons name="trash-outline" size={18} color={COLORS.danger}/></MotionPressable></View>
    </View>

    <View style={s.readinessRow}><Text style={s.readinessLabel}>ความพร้อมทริป</Text><Text style={s.readinessValue}>{readiness}%</Text></View>
    <View style={s.readinessTrack}><View style={[s.readinessFill,{width:`${readiness}%`}]}/></View>

    <View style={s.tripMetaRow}><View style={s.metaPill}><Ionicons name="calendar-outline" size={13} color={COLORS.primary}/><Text style={s.tripMeta}>{trip.startDate} → {trip.endDate||'-'}</Text></View><View style={s.metaPill}><Ionicons name="sparkles-outline" size={13} color={COLORS.rating}/><Text style={s.tripMeta}>{trip.tripStyle||'ทั่วไป'}</Text></View></View>
    {provinces.length>0&&<View style={s.chips}>{provinces.map(p=><View key={p.id} style={s.chip}><Ionicons name="location" size={11} color={COLORS.primaryDark}/><Text style={s.chipText}>{p.nameTh}</Text></View>)}</View>}
    {!!trip.accommodation&&<View style={s.detailLine}><Ionicons name="bed-outline" size={14} color={COLORS.textMuted}/><Text style={s.detailLineText}>{trip.accommodation}</Text></View>}
    {!!trip.autoFillSource&&<View style={s.sourceLine}><Ionicons name="flash-outline" size={12} color={COLORS.primaryDark}/><Text style={s.sourceLineText}>Auto Fill: {trip.autoFillSource}</Text></View>}

    {edit&&<FadeBlock><View style={s.editBox}><Text style={s.editTitle}>แก้ไขข้อมูลทริป</Text><TextInput style={s.input} value={name} onChangeText={setName} placeholder="ชื่อทริป"/><TextInput style={s.input} value={hotel} onChangeText={setHotel} placeholder="ที่พัก / โซนที่พัก"/><TextInput style={[s.input,s.noteInput]} multiline value={tripNote} onChangeText={setTripNote} placeholder="โน้ตทริป"/><MotionPressable style={s.miniSave} onPress={saveEdit}><Ionicons name="save-outline" size={16} color="#fff"/><Text style={s.miniSaveText}>บันทึกการแก้ไข</Text></MotionPressable></View></FadeBlock>}

    <MotionPressable style={[s.expandBtn,expanded&&s.expandBtnOn]} onPress={()=>setExpanded(v=>!v)}><Text style={[s.expandText,expanded&&s.expandTextOn]}>{expanded?'ซ่อนแผนรายวัน':'ดูแผนรายวัน'}</Text><Ionicons name={expanded?'chevron-up':'chevron-down'} size={17} color={expanded?'#fff':COLORS.primary}/></MotionPressable>
    {expanded&&<FadeBlock><View style={s.timeline}>{trip.days.map((d,index)=><View key={d.day} style={s.day}><View style={s.timelineRail}>{index<trip.days.length-1&&<View style={s.railLine}/>}<View style={s.dayBadge}><Text style={s.dayNo}>{d.day}</Text></View></View><View style={s.dayBody}><View style={s.dayHead}><View><Text style={s.dayTitle}>{d.title||`วันที่ ${d.day}`}</Text>{d.date&&<Text style={s.dayDate}>{d.date}</Text>}</View><View style={s.dayCount}><Text style={s.dayCountText}>{d.placeIds.length} จุด</Text></View></View>{d.placeIds.length?d.placeIds.map(id=>{const p=PLACES.find(x=>x.id===id);return p?<View key={id} style={s.placeRow}><View style={s.placeDot}/><View style={{flex:1}}><Text style={s.placeName}>{p.name}</Text><Text style={s.placeMeta}>{p.province} · {p.category}</Text></View><Text style={s.placeRating}>★ {p.rating}</Text></View>:null}):<Text style={s.placeMuted}>ยังไม่มีสถานที่ใน Catalog</Text>}{d.note&&<View style={s.dayNote}><Ionicons name="bulb-outline" size={14} color={COLORS.primaryDark}/><Text style={s.dayNoteText}>{d.note}</Text></View>}</View></View>)}</View></FadeBlock>}
  </Animated.View>
}

function MotionPressable({children,style,onPress,disabled}:{children:React.ReactNode;style?:any;onPress?:()=>void;disabled?:boolean}){
  const scale=useRef(new Animated.Value(1)).current;
  const down=()=>Animated.spring(scale,{toValue:.975,useNativeDriver:true,damping:18,stiffness:260,mass:.4}).start();
  const up=()=>Animated.spring(scale,{toValue:1,useNativeDriver:true,damping:15,stiffness:220,mass:.5}).start();
  return <Animated.View style={[style,{transform:[{scale}]}]}><Pressable disabled={disabled} onPress={onPress} onPressIn={down} onPressOut={up} style={s.pressFill}>{children}</Pressable></Animated.View>
}

function StepTransition({trigger,children}:{trigger:number;children:React.ReactNode}){
  const anim=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    anim.setValue(0);
    Animated.timing(anim,{toValue:1,duration:300,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
  },[trigger,anim]);
  return <Animated.View style={{opacity:anim,transform:[{translateX:anim.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}}>{children}</Animated.View>
}

function FadeBlock({children}:{children:React.ReactNode}){
  const anim=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.timing(anim,{toValue:1,duration:320,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start()},[anim]);
  return <Animated.View style={{opacity:anim,transform:[{translateY:anim.interpolate({inputRange:[0,1],outputRange:[8,0]})}]}}>{children}</Animated.View>
}

function AnimatedStat({icon,n,label,delay=0,moneyValue=false}:{icon:any;n:number;label:string;delay?:number;moneyValue?:boolean}){
  const anim=useRef(new Animated.Value(0)).current;
  const [display,setDisplay]=useState(0);
  useEffect(()=>{
    const sub=anim.addListener(({value})=>setDisplay(Math.round(value)));
    anim.setValue(0);
    Animated.timing(anim,{toValue:n,duration:650,delay,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start();
    return()=>anim.removeListener(sub);
  },[n,delay,anim]);
  return <View style={s.stat}><View style={s.statIcon}><Ionicons name={icon} size={18} color={COLORS.primary}/></View><Text style={s.statN}>{moneyValue?display.toLocaleString():display}</Text><Text style={s.statLabel}>{label}</Text></View>
}

function Field({label,children,flex}:{label:string;children:React.ReactNode;flex?:boolean}){return <View style={[s.field,flex&&{flex:1,minWidth:150}]}><Text style={s.fieldLabel}>{label}</Text>{children}</View>}
function Choice({text,active,onPress}:{text:string;active:boolean;onPress:()=>void}){return <MotionPressable style={[s.choice,active&&s.choiceOn]} onPress={onPress}>{active&&<Ionicons name="checkmark" size={13} color="#fff"/>}<Text style={[s.choiceText,active&&s.choiceTextOn]}>{text}</Text></MotionPressable>}
function SectionHeader({icon,title,subtitle}:{icon:any;title:string;subtitle:string}){return <View style={s.sectionHeader}><View style={s.sectionIcon}><Ionicons name={icon} size={18} color={COLORS.primaryDark}/></View><View style={{flex:1}}><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionSub}>{subtitle}</Text></View></View>}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F1F7F7'},content:{padding:SPACING.lg,paddingBottom:130,gap:16,maxWidth:1420,width:'100%',alignSelf:'center'},
  pressFill:{width:'100%',height:'100%',alignItems:'stretch',justifyContent:'center'},

  hero:{overflow:'hidden',borderRadius:28,backgroundColor:'#E8F5F3',borderWidth:1,borderColor:'#CBE5E2',padding:22,minHeight:132},
  heroContent:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:18,flexWrap:'wrap'},
  heroOrb:{position:'absolute',borderRadius:999,backgroundColor:'#B9E4DF'},heroOrbA:{width:220,height:220,right:-60,top:-120},heroOrbB:{width:150,height:150,right:220,bottom:-105,backgroundColor:'#F7DC9A'},
  eyebrow:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'rgba(255,255,255,.72)',paddingHorizontal:10,paddingVertical:6,borderRadius:999,borderWidth:1,borderColor:'#D7E9E7'},eyebrowText:{fontSize:9,fontWeight:'900',letterSpacing:1.1,color:COLORS.primaryDark},
  title:{fontSize:31,fontWeight:'900',color:COLORS.text,marginTop:7,letterSpacing:-.4},sub:{color:COLORS.textMuted,marginTop:4,lineHeight:20,maxWidth:680},
  heroCreate:{minWidth:220,minHeight:66,borderRadius:20,backgroundColor:COLORS.dark,padding:10,paddingRight:16,...SHADOW},heroCreateOn:{backgroundColor:'#173A31'},heroCreateIcon:{width:44,height:44,borderRadius:15,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',position:'absolute',left:10,top:11},heroCreateText:{marginLeft:56,color:'#fff',fontSize:13,fontWeight:'900'},heroCreateSub:{marginLeft:56,color:'#BFD6CF',fontSize:9,marginTop:3},

  overview:{flexDirection:'row',gap:10,flexWrap:'wrap'},stat:{minWidth:150,flex:1,backgroundColor:'rgba(255,255,255,.94)',borderWidth:1,borderColor:'#DDEAEA',borderRadius:20,padding:14,...SHADOW},statIcon:{width:36,height:36,borderRadius:13,backgroundColor:'#E8F6F5',alignItems:'center',justifyContent:'center'},statN:{fontSize:22,fontWeight:'900',color:COLORS.text,marginTop:8},statLabel:{fontSize:10,color:COLORS.textMuted,marginTop:2,fontWeight:'700'},

  createBanner:{minHeight:78,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#D5E8E6',borderRadius:22,padding:14,...SHADOW},createIcon:{width:46,height:46,borderRadius:16,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',position:'absolute',left:14,top:15},createTitle:{fontSize:15,fontWeight:'900',color:COLORS.text,marginLeft:58},createSub:{fontSize:11,color:COLORS.textMuted,marginTop:4,lineHeight:16,marginLeft:58,marginRight:42},arrowCircle:{position:'absolute',right:14,top:20,width:36,height:36,borderRadius:18,backgroundColor:'#E8F5F3',alignItems:'center',justifyContent:'center'},

  form:{backgroundColor:'rgba(255,255,255,.98)',borderRadius:28,padding:20,borderWidth:1,borderColor:'#D7E7E6',gap:15,...SHADOW},formTop:{flexDirection:'row',alignItems:'center',gap:12},formTitle:{fontSize:22,fontWeight:'900',color:COLORS.text},formSub:{fontSize:11,color:COLORS.textMuted,marginTop:3},completeBadge:{width:68,height:60,borderRadius:18,backgroundColor:'#EAF7F6',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#CDE7E4'},completeValue:{fontWeight:'900',fontSize:18,color:COLORS.primaryDark},completeLabel:{fontSize:8,color:COLORS.textMuted,marginTop:1},progressTrack:{height:5,borderRadius:99,backgroundColor:'#ECF2F2',overflow:'hidden'},progressFill:{height:'100%',borderRadius:99,backgroundColor:COLORS.primary},

  autoFillBtn:{minHeight:84,borderRadius:21,backgroundColor:COLORS.dark,padding:14,overflow:'hidden'},autoFillBtnBusy:{opacity:.94},autoFillGlow:{position:'absolute',width:180,height:180,borderRadius:90,backgroundColor:'rgba(15,166,184,.18)',right:-45,top:-60},autoFillIcon:{width:48,height:48,borderRadius:16,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',position:'absolute',left:14,top:18},autoFillTitle:{color:'#fff',fontSize:14,fontWeight:'900',marginLeft:61},autoFillSub:{color:'#C6DAD5',fontSize:10,marginTop:4,lineHeight:15,marginLeft:61,marginRight:66},autoFillBadge:{position:'absolute',right:14,top:29,flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(255,255,255,.08)',paddingHorizontal:9,paddingVertical:6,borderRadius:999},autoFillBadgeText:{fontSize:8,color:'#F5D98D',fontWeight:'900',letterSpacing:.6},
  autoResult:{flexDirection:'row',gap:9,backgroundColor:'#F0FAF5',borderWidth:1,borderColor:'#D3EFE0',borderRadius:16,padding:12},autoResultBusy:{backgroundColor:'#FFF9ED',borderColor:'#F3DFC0'},autoResultText:{fontSize:11,color:'#2F6F50',fontWeight:'800'},sourceWrap:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:7},sourceChip:{backgroundColor:'#E3F3F1',paddingHorizontal:8,paddingVertical:4,borderRadius:999},sourceChipText:{fontSize:8,color:COLORS.primaryDark,fontWeight:'800'},

  steps:{flexDirection:'row',gap:8},stepTab:{flex:1,minHeight:46,borderRadius:14,borderWidth:1,borderColor:COLORS.border,backgroundColor:'#FAFCFD'},stepTabOn:{backgroundColor:'#EAF7F6',borderColor:'#A9D7D2'},stepNo:{position:'absolute',left:10,width:24,height:24,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#EDF2F3'},stepNoOn:{backgroundColor:COLORS.primary},stepNoText:{fontSize:10,fontWeight:'900',color:COLORS.textMuted},stepNoTextOn:{color:'#fff'},stepTabText:{fontSize:10,color:COLORS.textMuted,fontWeight:'800',marginLeft:30},stepTabTextOn:{color:COLORS.primaryDark},stepContent:{gap:13},

  sectionHeader:{flexDirection:'row',alignItems:'center',gap:10,marginTop:2},sectionIcon:{width:38,height:38,borderRadius:14,backgroundColor:'#EAF7F6',alignItems:'center',justifyContent:'center'},sectionTitle:{fontSize:15,fontWeight:'900',color:COLORS.text},sectionSub:{fontSize:10,color:COLORS.textMuted,marginTop:2},
  field:{gap:6},fieldLabel:{fontSize:11,fontWeight:'800',color:COLORS.text},input:{minHeight:49,borderRadius:15,borderWidth:1,borderColor:'#D9E5E7',paddingHorizontal:13,paddingVertical:10,color:COLORS.text,backgroundColor:'#FBFDFD'},inline:{flexDirection:'row',gap:10,flexWrap:'wrap'},previewBox:{minHeight:48,borderRadius:15,backgroundColor:'#F1F8F8',paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:9,borderWidth:1,borderColor:'#E1EEEE'},previewIcon:{width:30,height:30,borderRadius:10,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},previewText:{fontSize:11,color:COLORS.textMuted,fontWeight:'700',flex:1},

  selectedWrap:{flexDirection:'row',flexWrap:'wrap',gap:7},selectedChip:{height:32,paddingHorizontal:9,borderRadius:999,backgroundColor:'#E7F5F5'},selectedChipText:{fontSize:10,color:COLORS.primaryDark,fontWeight:'800'},provinceGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},provinceOption:{minWidth:132,minHeight:52,borderWidth:1,borderColor:COLORS.border,borderRadius:15,paddingHorizontal:11,paddingVertical:9,backgroundColor:'#FAFCFD'},provinceOptionOn:{borderColor:'#86CCC5',backgroundColor:'#EAF7F6'},provinceOptionText:{fontSize:11,fontWeight:'800',color:COLORS.text},provinceOptionTextOn:{color:COLORS.primaryDark},provinceRegion:{fontSize:8,color:COLORS.textMuted,marginTop:2},provinceCheck:{position:'absolute',right:7,top:7,width:18,height:18,borderRadius:9,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center'},
  choiceWrap:{flexDirection:'row',flexWrap:'wrap',gap:7},choice:{height:34,paddingHorizontal:12,borderRadius:999,borderWidth:1,borderColor:COLORS.border,backgroundColor:'#fff'},choiceOn:{backgroundColor:COLORS.dark,borderColor:COLORS.dark},choiceText:{fontSize:10,color:COLORS.textMuted,fontWeight:'800'},choiceTextOn:{color:'#fff'},
  wishBox:{flexDirection:'row',gap:10,backgroundColor:'#FFF5F7',borderRadius:17,padding:12,borderWidth:1,borderColor:'#F7E1E6'},wishIcon:{width:34,height:34,borderRadius:12,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},wishTitle:{fontSize:11,fontWeight:'900',color:COLORS.text},wishText:{fontSize:9,color:COLORS.textMuted,marginTop:3,lineHeight:14},

  budgetGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},budgetBox:{minWidth:160,flex:1,borderWidth:1,borderColor:'#DCE7E9',borderRadius:17,padding:11,backgroundColor:'#FBFDFD'},budgetLabelRow:{flexDirection:'row',alignItems:'center',gap:7},budgetIcon:{width:29,height:29,borderRadius:10,backgroundColor:'#EAF7F6',alignItems:'center',justifyContent:'center'},budgetLabel:{fontSize:10,fontWeight:'800',color:COLORS.text},budgetInput:{fontSize:22,fontWeight:'900',color:COLORS.text,paddingVertical:7},baht:{fontSize:8,color:COLORS.textMuted},totalBox:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,backgroundColor:'#FFF7E8',borderRadius:17,padding:14,borderWidth:1,borderColor:'#F2E0B9'},totalLabel:{fontSize:12,fontWeight:'900',color:COLORS.text},totalHint:{fontSize:9,color:COLORS.textMuted,marginTop:2},totalMoney:{fontSize:25,fontWeight:'900',color:'#9B6B20'},totalUnit:{fontSize:10},noteInput:{minHeight:106,textAlignVertical:'top'},planPreview:{backgroundColor:'#EAF7F6',borderRadius:17,padding:12,flexDirection:'row',gap:10,alignItems:'center'},planPreviewIcon:{width:38,height:38,borderRadius:13,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center'},planPreviewTitle:{fontSize:11,fontWeight:'900',color:COLORS.primaryDark},planPreviewText:{fontSize:10,color:COLORS.textMuted,lineHeight:15,marginTop:3},

  formActions:{flexDirection:'row',justifyContent:'space-between',gap:10,marginTop:2},backBtn:{minHeight:47,paddingHorizontal:16,borderRadius:14,borderWidth:1,borderColor:COLORS.border,backgroundColor:'#fff'},backText:{fontSize:11,fontWeight:'900',color:COLORS.text},nextBtn:{minHeight:47,paddingHorizontal:20,borderRadius:14,backgroundColor:COLORS.primary},nextText:{fontSize:11,fontWeight:'900',color:'#fff'},saveBtn:{minHeight:47,paddingHorizontal:20,borderRadius:14,backgroundColor:COLORS.dark},saveText:{fontSize:11,fontWeight:'900',color:'#fff'},

  empty:{backgroundColor:COLORS.surface,borderRadius:24,padding:32,alignItems:'center',borderWidth:1,borderColor:COLORS.border},emptyIcon:{width:64,height:64,borderRadius:22,backgroundColor:'#EAF7F6',alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:18,fontWeight:'900',color:COLORS.text,marginTop:10},emptyText:{color:COLORS.textMuted,textAlign:'center',marginTop:5,maxWidth:460,lineHeight:18},
  tripGrid:{gap:13},tripGridWide:{},card:{backgroundColor:COLORS.surface,borderRadius:24,padding:17,borderWidth:1,borderColor:'#DCE8E8',overflow:'hidden',...SHADOW},cardAccent:{position:'absolute',left:0,top:0,bottom:0,width:4,backgroundColor:COLORS.primary},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:12},cardTitleRow:{flexDirection:'row',alignItems:'center',gap:7,flexWrap:'wrap'},cardTitle:{fontSize:18,fontWeight:'900',color:COLORS.text},autoBadge:{flexDirection:'row',alignItems:'center',gap:3,backgroundColor:'#EAF7F6',paddingHorizontal:7,paddingVertical:4,borderRadius:999},autoBadgeText:{fontSize:8,fontWeight:'900',color:COLORS.primaryDark},cardSub:{color:COLORS.textMuted,fontSize:10,marginTop:4},cardActions:{flexDirection:'row',gap:7},iconBtn:{width:36,height:36,borderRadius:12,backgroundColor:'#F1F8F8',alignItems:'center',justifyContent:'center'},iconBtnDanger:{backgroundColor:'#FFF2F2'},
  readinessRow:{flexDirection:'row',justifyContent:'space-between',marginTop:13},readinessLabel:{fontSize:9,color:COLORS.textMuted,fontWeight:'700'},readinessValue:{fontSize:9,color:COLORS.primaryDark,fontWeight:'900'},readinessTrack:{height:5,borderRadius:99,backgroundColor:'#EDF2F2',overflow:'hidden',marginTop:5},readinessFill:{height:'100%',borderRadius:99,backgroundColor:COLORS.primary},
  tripMetaRow:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:11},metaPill:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:8,paddingVertical:5,borderRadius:999,backgroundColor:'#F7FAFB'},tripMeta:{fontSize:9,color:COLORS.textMuted,fontWeight:'700'},chips:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:10},chip:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:8,paddingVertical:5,borderRadius:999,backgroundColor:'#E7F5F5'},chipText:{color:COLORS.primaryDark,fontWeight:'800',fontSize:10},detailLine:{flexDirection:'row',alignItems:'center',gap:6,marginTop:9},detailLineText:{fontSize:10,color:COLORS.textMuted,flex:1},sourceLine:{flexDirection:'row',alignItems:'center',gap:5,marginTop:7},sourceLineText:{fontSize:8,color:COLORS.primaryDark,flex:1},
  editBox:{gap:8,marginTop:12,padding:12,borderRadius:16,backgroundColor:'#F7FAFB',borderWidth:1,borderColor:'#E3ECEE'},editTitle:{fontSize:11,fontWeight:'900',color:COLORS.text},miniSave:{height:42,borderRadius:12,backgroundColor:COLORS.primary},miniSaveText:{color:'#fff',fontWeight:'900',fontSize:10},expandBtn:{height:43,borderRadius:13,backgroundColor:'#F1F8F8',marginTop:12},expandBtnOn:{backgroundColor:COLORS.dark},expandText:{fontSize:10,fontWeight:'900',color:COLORS.primaryDark},expandTextOn:{color:'#fff'},
  timeline:{marginTop:12},day:{flexDirection:'row',gap:11},timelineRail:{width:34,alignItems:'center'},railLine:{position:'absolute',top:31,bottom:-6,width:2,backgroundColor:'#D7E8E6'},dayBadge:{width:32,height:32,borderRadius:16,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center',zIndex:2},dayNo:{color:'#fff',fontWeight:'900',fontSize:11},dayBody:{flex:1,paddingBottom:14},dayHead:{flexDirection:'row',justifyContent:'space-between',gap:10},dayTitle:{fontWeight:'900',color:COLORS.text,fontSize:12},dayDate:{fontSize:8,color:COLORS.textMuted,marginTop:2},dayCount:{backgroundColor:'#EDF7F6',paddingHorizontal:7,paddingVertical:4,borderRadius:999},dayCountText:{fontSize:8,color:COLORS.primaryDark,fontWeight:'900'},placeRow:{flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'#FAFCFD',borderRadius:12,padding:9,marginTop:7,borderWidth:1,borderColor:'#E5EDEE'},placeDot:{width:7,height:7,borderRadius:4,backgroundColor:COLORS.primary},placeName:{fontSize:10,fontWeight:'900',color:COLORS.text},placeMeta:{fontSize:8,color:COLORS.textMuted,marginTop:2},placeRating:{fontSize:9,color:'#9A6C21',fontWeight:'900'},placeMuted:{color:'#9AA8B4',fontSize:10,marginTop:5,fontStyle:'italic'},dayNote:{flexDirection:'row',gap:6,backgroundColor:'#F1F8F8',padding:9,borderRadius:11,marginTop:7},dayNoteText:{fontSize:9,color:COLORS.primaryDark,lineHeight:14,flex:1},
});
