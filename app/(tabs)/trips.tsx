import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
    title.trim()&&title.trim()!=='ทริปใหม่', startDate, Number(days)>0, Number(travelers)>0,
    selectedProvinceIds.length>0, transport, tripStyle, accommodation.trim(), totalBudget>0, note.trim(),
  ];
  const completion=Math.round(completionFields.filter(Boolean).length/completionFields.length*100);

  const resetDraft=()=>{
    setStep(1);setTitle('ทริปใหม่');setStartDate(isoToday());setDays('3');setTravelers('2');setTransport('รถยนต์');setAccommodation('');setTripStyle('ชิล ๆ');setProvinceSearch('');setSelectedProvinceIds(wishlistProvinceIds.slice(0,4));setNote('');setBudgetInputs({transport:'',accommodation:'',food:'',activities:'',other:''});setAutoStatus('');setAutoSource([]);
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
    const transportCost=Math.round(rates.transport*people*(far?1:0.65));
    return {
      transport:transportCost,
      accommodation:Math.round(rates.room*nights*Math.max(1,Math.ceil(people/2))),
      food:Math.round(rates.food*daysCount*people),
      activities:Math.round(rates.activities*daysCount*people),
      other:Math.round(rates.other*Math.max(1,people*.7)),
    };
  };

  const autoFill=()=>{
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
        transport:String(estimated.transport),
        accommodation:String(estimated.accommodation),
        food:String(estimated.food),
        activities:String(estimated.activities),
        other:String(estimated.other),
      });
      sources.push(`งบประมาณ ${preferences.budget||'กลาง'}`);
    }

    if(!note.trim()&&first){
      const info=getProvinceInfo(first.nameTh,first.region,first.description,first.bestMonths);
      const highlights=provinces.flatMap(p=>getProvinceInfo(p.nameTh,p.region,p.description,p.bestMonths).highlights.slice(0,3)).slice(0,6);
      const foods=provinces.flatMap(p=>getProvinceInfo(p.nameTh,p.region,p.description,p.bestMonths).localFoods.slice(0,2)).slice(0,4);
      const tips=info.travelTips.slice(0,2);
      setNote([
        `จุดเด่นแนะนำ: ${highlights.join(', ')||'เลือกจากสถานที่ยอดนิยมในจังหวัด'}`,
        `ของกินที่ควรลอง: ${foods.join(', ')||'อาหารท้องถิ่น'}`,
        `คำแนะนำ: ${tips.join(' · ')}`,
        `หมายเหตุ: งบและเวลาเป็นค่าประมาณสำหรับวางแผน ควรตรวจราคา เวลาเปิด–ปิด สภาพอากาศ และการเดินทางอีกครั้งก่อนจอง`,
      ].join('\n'));
      sources.push('ข้อมูลเที่ยวจังหวัด');
    }

    if(!startDate)setStartDate(isoToday());
    if(!days||Number(days)<=0)setDays('3');
    if(!travelers||Number(travelers)<=0)setTravelers('2');

    sources.push('ค่าที่ระบบแนะนำ');
    setAutoSource(Array.from(new Set(sources)));
    setAutoStatus('Auto Fill เติมช่องที่ขาดแล้ว — คุณยังแก้ทุกช่องได้ก่อนสร้างทริป');
    setStep(3);
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
        day:i+1,
        date:addDays(startDate,i+1),
        title:dayProvince?`Day ${i+1} · ${dayProvince.nameTh}`:`Day ${i+1}`,
        placeIds:dayPlaces.map(p=>p.id),
        note:dayPlaces.length
          ? `แนะนำให้จัดลำดับตามระยะทางจริงก่อนออกเดินทาง · ${info?.travelTips?.[0]||'เผื่อเวลาเดินทางระหว่างจุด'}`
          : `แนะนำ: ${fallbackHighlight||'เลือกสถานที่เด่นในพื้นที่'} · ${info?.travelTips?.[0]||'ตรวจเวลาเปิด–ปิดก่อนเดินทาง'}`,
      };
    });
  };

  const save=()=>{
    const provinceIds=resolveProvinceIds();
    if(!selectedProvinceIds.length)setSelectedProvinceIds(provinceIds);
    const endDate=addDays(startDate,nDays);
    const budgetBreakdown={
      transport:money(budgetInputs.transport),
      accommodation:money(budgetInputs.accommodation),
      food:money(budgetInputs.food),
      activities:money(budgetInputs.activities),
      other:money(budgetInputs.other),
    };
    const budget=Object.values(budgetBreakdown).reduce((sum,v)=>sum+(v||0),0);
    const provinceNames=provinceIds.map(id=>PROVINCES.find(p=>p.id===id)?.nameTh).filter(Boolean).join(' • ');
    const plan:Trip={
      id:String(Date.now()),
      title:title.trim()||`${provinceNames||'ทริปใหม่'} ${nDays} วัน`,
      startDate:startDate||isoToday(),
      endDate,
      budget,
      provinceIds,
      travelers:Math.max(1,Number(travelers)||1),
      transport,
      accommodation:accommodation.trim(),
      tripStyle,
      budgetBreakdown,
      note:note.trim(),
      status:'วางแผน',
      destinationSummary:provinceNames,
      autoFilled:autoSource.length>0,
      autoFillSource:autoSource.join(' + '),
      days:buildDays(provinceIds),
    };
    createTrip(plan);
    setOpen(false);
    resetDraft();
  };

  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View style={{flex:1}}>
          <Text style={s.title}>แผนการเดินทาง</Text>
          <Text style={s.sub}>กรอกเองได้ หรือกด Auto Fill ให้ระบบเติมช่องที่ขาดจาก Wishlist + ข้อมูลจังหวัด + ค่าแนะนำ</Text>
        </View>
        <Pressable style={[s.add,open&&s.addClose]} onPress={()=>{setOpen(v=>!v);setStep(1)}}>
          <Ionicons name={open?'close':'add'} size={24} color="#fff"/>
        </Pressable>
      </View>

      <View style={s.overview}>
        <Stat icon="calendar-outline" n={trips.length} label="ทริปทั้งหมด"/>
        <Stat icon="time-outline" n={totalDays} label="วันเดินทาง"/>
        <Stat icon="heart-outline" n={wishlistPlaceIds.length} label="Wishlist"/>
        <Stat icon="wallet-outline" n={totalTripBudget.toLocaleString()} label="งบรวม (บาท)"/>
      </View>

      {!open&&<Pressable style={s.createBanner} onPress={()=>setOpen(true)}>
        <View style={s.createIcon}><Ionicons name="sparkles-outline" size={23} color={COLORS.primaryDark}/></View>
        <View style={{flex:1}}><Text style={s.createTitle}>สร้างทริปใหม่</Text><Text style={s.createSub}>กด Auto Fill ได้ทันที หรือกรอกเองแบบ 3 ขั้นตอน</Text></View>
        <Ionicons name="arrow-forward" size={20} color={COLORS.primary}/>
      </Pressable>}

      {open&&<View style={s.form}>
        <View style={s.formTop}>
          <View style={{flex:1}}><Text style={s.formTitle}>สร้างแผนทริป</Text><Text style={s.formSub}>ข้อมูลที่ระบบเติมให้อัตโนมัติสามารถแก้ไขได้ทุกช่อง</Text></View>
          <View style={s.completeBadge}><Text style={s.completeValue}>{completion}%</Text><Text style={s.completeLabel}>ครบ</Text></View>
        </View>

        <Pressable style={s.autoFillBtn} onPress={autoFill}>
          <View style={s.autoFillIcon}><Ionicons name="sparkles" size={21} color="#fff"/></View>
          <View style={{flex:1}}><Text style={s.autoFillTitle}>AUTO FILL · เติมช่องที่ขาด</Text><Text style={s.autoFillSub}>ใช้ข้อมูลที่เลือกก่อน → Wishlist → Preference → ข้อมูลจังหวัด → งบประมาณแนะนำ</Text></View>
          <Ionicons name="flash" size={19} color={COLORS.gold}/>
        </Pressable>

        {!!autoStatus&&<View style={s.autoResult}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.visited}/>
          <View style={{flex:1}}><Text style={s.autoResultText}>{autoStatus}</Text><View style={s.sourceWrap}>{autoSource.map(x=><Text key={x} style={s.sourceChip}>{x}</Text>)}</View></View>
        </View>}

        <View style={s.steps}>{[1,2,3].map(x=><Pressable key={x} style={[s.stepTab,step===x&&s.stepTabOn]} onPress={()=>setStep(x)}><Text style={[s.stepTabText,step===x&&s.stepTabTextOn]}>{x}. {x===1?'ข้อมูลทริป':x===2?'จุดหมาย':'งบและสรุป'}</Text></Pressable>)}</View>

        {step===1&&<>
          <SectionHeader icon="create-outline" title="ข้อมูลทริป" subtitle="กรอกเท่าที่รู้ ที่เหลือให้ Auto Fill ช่วยได้"/>
          <Field label="ชื่อทริป"><TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="เช่น เชียงใหม่ 4 วัน 3 คืน" placeholderTextColor="#9AA8B4"/></Field>
          <View style={s.inline}>
            <Field label="วันเริ่มเดินทาง" flex><TextInput style={s.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9AA8B4"/></Field>
            <Field label="จำนวนวัน" flex><TextInput style={s.input} value={days} onChangeText={setDays} keyboardType="number-pad" placeholder="3" placeholderTextColor="#9AA8B4"/></Field>
            <Field label="ผู้เดินทาง" flex><TextInput style={s.input} value={travelers} onChangeText={setTravelers} keyboardType="number-pad" placeholder="2" placeholderTextColor="#9AA8B4"/></Field>
          </View>
          <View style={s.previewBox}><Ionicons name="calendar" size={18} color={COLORS.primary}/><Text style={s.previewText}>{startDate||'ยังไม่ระบุ'} → {addDays(startDate,nDays)||'ยังไม่ระบุ'} · {nDays} วัน · {Math.max(1,Number(travelers)||1)} คน</Text></View>
        </>}

        {step===2&&<>
          <SectionHeader icon="location-outline" title="จุดหมายและรูปแบบทริป" subtitle="เลือกหลายจังหวัดได้ หรือปล่อยว่างแล้ว Auto Fill จาก Wishlist"/>
          <Field label="ค้นหาจังหวัด"><TextInput style={s.input} value={provinceSearch} onChangeText={setProvinceSearch} placeholder="ค้นหา เชียงใหม่, กระบี่, น่าน..." placeholderTextColor="#9AA8B4"/></Field>
          {selectedProvinceIds.length>0&&<View style={s.selectedWrap}>{selectedProvinceIds.map(id=>{const p=PROVINCES.find(x=>x.id===id);return p?<Pressable key={id} style={s.selectedChip} onPress={()=>toggleProvince(id)}><Ionicons name="checkmark-circle" size={15} color={COLORS.primary}/><Text style={s.selectedChipText}>{p.nameTh}</Text><Ionicons name="close" size={13} color={COLORS.textMuted}/></Pressable>:null})}</View>}
          <View style={s.provinceGrid}>{provinceResults.map(p=>{const on=selectedProvinceIds.includes(p.id);return <Pressable key={p.id} style={[s.provinceOption,on&&s.provinceOptionOn]} onPress={()=>toggleProvince(p.id)}><Text style={[s.provinceOptionText,on&&s.provinceOptionTextOn]}>{p.nameTh}</Text><Text style={s.provinceRegion}>{p.region}</Text></Pressable>})}</View>
          <Field label="เดินทางหลัก"><View style={s.choiceWrap}>{TRANSPORTS.map(x=><Choice key={x} text={x} active={transport===x} onPress={()=>setTransport(x)}/>)}</View></Field>
          <Field label="สไตล์ทริป"><View style={s.choiceWrap}>{STYLES.map(x=><Choice key={x} text={x} active={tripStyle===x} onPress={()=>setTripStyle(x)}/>)}</View></Field>
          <Field label="ที่พัก / โซนที่พัก"><TextInput style={s.input} value={accommodation} onChangeText={setAccommodation} placeholder="เช่น ย่านนิมมาน / ตัวเมือง / ยังไม่จอง" placeholderTextColor="#9AA8B4"/></Field>
          <View style={s.wishBox}><Ionicons name="heart" size={18} color={COLORS.wishlist}/><View style={{flex:1}}><Text style={s.wishTitle}>{selectedPlaces.length} สถานที่จาก Wishlist · {fallbackPlaces.length} สถานที่ใน Catalog</Text><Text style={s.wishText}>ระบบจะใช้ Wishlist ก่อน และเติมด้วยสถานที่ในจังหวัดเมื่อยังไม่พอ</Text></View></View>
        </>}

        {step===3&&<>
          <SectionHeader icon="wallet-outline" title="งบประมาณและข้อมูลเสริม" subtitle="Auto Fill จะประมาณงบเพื่อวางแผนเบื้องต้น ไม่ใช่ราคาจองแบบเรียลไทม์"/>
          <View style={s.budgetGrid}>{BUDGET_FIELDS.map(([key,label,icon])=><View key={key} style={s.budgetBox}><View style={s.budgetLabelRow}><Ionicons name={icon as any} size={16} color={COLORS.primary}/><Text style={s.budgetLabel}>{label}</Text></View><TextInput style={s.budgetInput} value={budgetInputs[key]} onChangeText={v=>setBudget(key,v)} keyboardType="number-pad" placeholder="0" placeholderTextColor="#9AA8B4"/><Text style={s.baht}>บาท</Text></View>)}</View>
          <View style={s.totalBox}><View><Text style={s.totalLabel}>งบประมาณรวม</Text><Text style={s.totalHint}>คำนวณจากทุกหมวด</Text></View><Text style={s.totalMoney}>{totalBudget.toLocaleString()} <Text style={s.totalUnit}>บาท</Text></Text></View>
          <Field label="โน้ต / สิ่งที่ต้องรู้ก่อนเดินทาง"><TextInput style={[s.input,s.noteInput]} value={note} onChangeText={setNote} multiline placeholder="Auto Fill จะใส่จุดเด่น ของกิน คำแนะนำ และสิ่งที่ควรเช็กให้" placeholderTextColor="#9AA8B4"/></Field>
          <View style={s.planPreview}><View style={s.planPreviewHead}><Ionicons name="sparkles-outline" size={18} color={COLORS.primaryDark}/><Text style={s.planPreviewTitle}>แผนที่จะสร้าง</Text></View><Text style={s.planPreviewText}>{nDays} วัน · {selectedProvinceIds.length||resolveProvinceIds().length} จังหวัด · ใช้ Wishlist ก่อน · เติมสถานที่จาก Catalog เมื่อขาด · {transport} · {Math.max(1,Number(travelers)||1)} คน</Text></View>
        </>}

        <View style={s.formActions}>
          {step>1?<Pressable style={s.backBtn} onPress={()=>setStep(x=>x-1)}><Ionicons name="arrow-back" size={18} color={COLORS.text}/><Text style={s.backText}>ย้อนกลับ</Text></Pressable>:<Pressable style={s.backBtn} onPress={()=>{setOpen(false);resetDraft()}}><Text style={s.backText}>ยกเลิก</Text></Pressable>}
          {step<3?<Pressable style={s.nextBtn} onPress={()=>setStep(x=>x+1)}><Text style={s.nextText}>ถัดไป</Text><Ionicons name="arrow-forward" size={18} color="#fff"/></Pressable>:<Pressable style={s.saveBtn} onPress={save}><Ionicons name="checkmark-circle" size={19} color="#fff"/><Text style={s.saveText}>สร้างแผนทริป</Text></Pressable>}
        </View>
      </View>}

      {!trips.length?<View style={s.empty}><Ionicons name="calendar-outline" size={34} color={COLORS.primary}/><Text style={s.emptyTitle}>ยังไม่มีแผนทริป</Text><Text style={s.emptyText}>กด “สร้างทริปใหม่” แล้วใช้ Auto Fill เพื่อเริ่มได้เร็วที่สุด</Text></View>:trips.map(t=><TripCard key={t.id} trip={t} onDelete={()=>Alert.alert('ลบทริป',`ลบ ${t.title}?`,[{text:'ยกเลิก'},{text:'ลบ',style:'destructive',onPress:()=>deleteTrip(t.id)}])} onUpdate={patch=>updateTrip(t.id,patch)}/>) }
    </ScrollView>
  </SafeAreaView>
}

function TripCard({trip,onDelete,onUpdate}:{trip:Trip;onDelete:()=>void;onUpdate:(patch:Partial<Trip>)=>void}){
  const [expanded,setExpanded]=useState(false);
  const [edit,setEdit]=useState(false);
  const [name,setName]=useState(trip.title);
  const [hotel,setHotel]=useState(trip.accommodation||'');
  const [tripNote,setTripNote]=useState(trip.note||'');
  const provinces=trip.provinceIds.map(id=>PROVINCES.find(p=>p.id===id)).filter(Boolean) as typeof PROVINCES;
  const saveEdit=()=>{onUpdate({title:name.trim()||trip.title,accommodation:hotel.trim(),note:tripNote.trim()});setEdit(false)};
  return <View style={s.card}>
    <View style={s.cardTop}>
      <View style={{flex:1}}><View style={s.cardTitleRow}><Text style={s.cardTitle}>{trip.title}</Text>{trip.autoFilled&&<Text style={s.autoBadge}>AUTO</Text>}</View><Text style={s.cardSub}>{trip.days.length} วัน · {trip.travelers||1} คน · {trip.transport||'ไม่ระบุ'} · งบ {trip.budget.toLocaleString()} บาท</Text></View>
      <View style={s.cardActions}><Pressable onPress={()=>setEdit(v=>!v)}><Ionicons name="create-outline" size={20} color={COLORS.primary}/></Pressable><Pressable onPress={onDelete}><Ionicons name="trash-outline" size={20} color={COLORS.danger}/></Pressable></View>
    </View>
    <View style={s.tripMetaRow}><Text style={s.tripMeta}><Ionicons name="calendar-outline" size={13}/> {trip.startDate} → {trip.endDate||'-'}</Text><Text style={s.tripMeta}><Ionicons name="sparkles-outline" size={13}/> {trip.tripStyle||'ทั่วไป'}</Text></View>
    {provinces.length>0&&<View style={s.chips}>{provinces.map(p=><Text key={p.id} style={s.chip}>{p.nameTh}</Text>)}</View>}
    {!!trip.accommodation&&<Text style={s.detailLine}>🏨 {trip.accommodation}</Text>}
    {!!trip.autoFillSource&&<Text style={s.sourceLine}>Auto Fill: {trip.autoFillSource}</Text>}

    {edit&&<View style={s.editBox}><TextInput style={s.input} value={name} onChangeText={setName} placeholder="ชื่อทริป"/><TextInput style={s.input} value={hotel} onChangeText={setHotel} placeholder="ที่พัก / โซนที่พัก"/><TextInput style={[s.input,s.noteInput]} multiline value={tripNote} onChangeText={setTripNote} placeholder="โน้ตทริป"/><Pressable style={s.miniSave} onPress={saveEdit}><Text style={s.miniSaveText}>บันทึกการแก้ไข</Text></Pressable></View>}

    <Pressable style={s.expandBtn} onPress={()=>setExpanded(v=>!v)}><Text style={s.expandText}>{expanded?'ซ่อนแผนรายวัน':'ดูแผนรายวัน'}</Text><Ionicons name={expanded?'chevron-up':'chevron-down'} size={17} color={COLORS.primary}/></Pressable>
    {expanded&&<View style={s.timeline}>{trip.days.map(d=><View key={d.day} style={s.day}><View style={s.dayBadge}><Text style={s.dayNo}>{d.day}</Text></View><View style={{flex:1}}><Text style={s.dayTitle}>{d.title||`วันที่ ${d.day}`}</Text>{d.date&&<Text style={s.dayDate}>{d.date}</Text>}{d.placeIds.length?d.placeIds.map(id=>{const p=PLACES.find(x=>x.id===id);return p?<Text key={id} style={s.place}>• {p.name} · {p.province}</Text>:null}):<Text style={s.placeMuted}>ยังไม่มีสถานที่ใน Catalog</Text>}{d.note&&<Text style={s.dayNote}>{d.note}</Text>}</View></View>)}</View>}
  </View>
}

function Field({label,children,flex}:{label:string;children:React.ReactNode;flex?:boolean}){return <View style={[s.field,flex&&{flex:1,minWidth:150}]}><Text style={s.fieldLabel}>{label}</Text>{children}</View>}
function Choice({text,active,onPress}:{text:string;active:boolean;onPress:()=>void}){return <Pressable style={[s.choice,active&&s.choiceOn]} onPress={onPress}><Text style={[s.choiceText,active&&s.choiceTextOn]}>{text}</Text></Pressable>}
function SectionHeader({icon,title,subtitle}:{icon:any;title:string;subtitle:string}){return <View style={s.sectionHeader}><View style={s.sectionIcon}><Ionicons name={icon} size={18} color={COLORS.primaryDark}/></View><View><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionSub}>{subtitle}</Text></View></View>}
function Stat({icon,n,label}:{icon:any;n:string|number;label:string}){return <View style={s.stat}><Ionicons name={icon} size={18} color={COLORS.primary}/><Text style={s.statN}>{n}</Text><Text style={s.statLabel}>{label}</Text></View>}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.background},content:{padding:SPACING.lg,paddingBottom:120,gap:14,maxWidth:1400,width:'100%',alignSelf:'center'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:14},title:{fontSize:28,fontWeight:'900',color:COLORS.text},sub:{color:COLORS.textMuted,marginTop:3,lineHeight:20},add:{width:46,height:46,borderRadius:23,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',...SHADOW},addClose:{backgroundColor:COLORS.dark},
  overview:{flexDirection:'row',gap:10,flexWrap:'wrap'},stat:{minWidth:150,flex:1,backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.md,padding:14},statN:{fontSize:21,fontWeight:'900',color:COLORS.text,marginTop:6},statLabel:{fontSize:11,color:COLORS.textMuted,marginTop:2},
  createBanner:{backgroundColor:'#EAF7F6',borderWidth:1,borderColor:'#CFE9E7',borderRadius:RADIUS.lg,padding:16,flexDirection:'row',alignItems:'center',gap:12},createIcon:{width:44,height:44,borderRadius:16,backgroundColor:'#D7F1EE',alignItems:'center',justifyContent:'center'},createTitle:{fontSize:16,fontWeight:'900',color:COLORS.text},createSub:{fontSize:12,color:COLORS.textMuted,marginTop:3},
  form:{backgroundColor:COLORS.surface,borderRadius:RADIUS.lg,padding:18,borderWidth:1,borderColor:COLORS.border,gap:14,...SHADOW},formTop:{flexDirection:'row',alignItems:'center',gap:12},formTitle:{fontSize:21,fontWeight:'900',color:COLORS.text},formSub:{fontSize:12,color:COLORS.textMuted,marginTop:3},completeBadge:{width:58,height:58,borderRadius:29,backgroundColor:'#EAF7F6',alignItems:'center',justifyContent:'center'},completeValue:{fontWeight:'900',fontSize:16,color:COLORS.primaryDark},completeLabel:{fontSize:9,color:COLORS.textMuted},
  autoFillBtn:{minHeight:74,borderRadius:18,backgroundColor:COLORS.dark,padding:14,flexDirection:'row',alignItems:'center',gap:12},autoFillIcon:{width:44,height:44,borderRadius:15,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center'},autoFillTitle:{color:'#fff',fontSize:15,fontWeight:'900'},autoFillSub:{color:'#C6DAD5',fontSize:11,marginTop:4,lineHeight:16},autoResult:{flexDirection:'row',gap:9,backgroundColor:'#F0FAF5',borderWidth:1,borderColor:'#D3EFE0',borderRadius:16,padding:12},autoResultText:{fontSize:12,color:'#2F6F50',fontWeight:'800'},sourceWrap:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:7},sourceChip:{fontSize:9,color:COLORS.primaryDark,backgroundColor:'#E3F3F1',paddingHorizontal:8,paddingVertical:4,borderRadius:999},
  steps:{flexDirection:'row',gap:8},stepTab:{flex:1,minHeight:38,borderRadius:12,borderWidth:1,borderColor:COLORS.border,alignItems:'center',justifyContent:'center',backgroundColor:'#FAFCFD'},stepTabOn:{backgroundColor:'#EAF7F6',borderColor:'#BFDCD9'},stepTabText:{fontSize:11,color:COLORS.textMuted,fontWeight:'800'},stepTabTextOn:{color:COLORS.primaryDark},
  sectionHeader:{flexDirection:'row',alignItems:'center',gap:10,marginTop:2},sectionIcon:{width:36,height:36,borderRadius:13,backgroundColor:'#EAF7F6',alignItems:'center',justifyContent:'center'},sectionTitle:{fontSize:15,fontWeight:'900',color:COLORS.text},sectionSub:{fontSize:11,color:COLORS.textMuted,marginTop:2},
  field:{gap:6},fieldLabel:{fontSize:12,fontWeight:'800',color:COLORS.text},input:{minHeight:48,borderRadius:RADIUS.md,borderWidth:1,borderColor:COLORS.border,paddingHorizontal:13,paddingVertical:10,color:COLORS.text,backgroundColor:'#FAFCFD'},inline:{flexDirection:'row',gap:10,flexWrap:'wrap'},previewBox:{minHeight:44,borderRadius:14,backgroundColor:'#F1F8F8',paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:8},previewText:{fontSize:12,color:COLORS.textMuted,fontWeight:'700'},
  selectedWrap:{flexDirection:'row',flexWrap:'wrap',gap:7},selectedChip:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:9,paddingVertical:6,borderRadius:999,backgroundColor:'#E7F5F5'},selectedChipText:{fontSize:11,color:COLORS.primaryDark,fontWeight:'800'},provinceGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},provinceOption:{minWidth:130,borderWidth:1,borderColor:COLORS.border,borderRadius:14,paddingHorizontal:11,paddingVertical:9,backgroundColor:'#FAFCFD'},provinceOptionOn:{borderColor:'#95D3CE',backgroundColor:'#EAF7F6'},provinceOptionText:{fontSize:12,fontWeight:'800',color:COLORS.text},provinceOptionTextOn:{color:COLORS.primaryDark},provinceRegion:{fontSize:9,color:COLORS.textMuted,marginTop:2},choiceWrap:{flexDirection:'row',flexWrap:'wrap',gap:7},choice:{paddingHorizontal:12,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:COLORS.border,backgroundColor:'#fff'},choiceOn:{backgroundColor:COLORS.dark,borderColor:COLORS.dark},choiceText:{fontSize:11,color:COLORS.textMuted,fontWeight:'800'},choiceTextOn:{color:'#fff'},wishBox:{flexDirection:'row',gap:9,backgroundColor:'#FFF3F6',borderRadius:16,padding:12},wishTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},wishText:{fontSize:10,color:COLORS.textMuted,marginTop:3,lineHeight:15},
  budgetGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},budgetBox:{minWidth:160,flex:1,borderWidth:1,borderColor:COLORS.border,borderRadius:16,padding:11,backgroundColor:'#FAFCFD'},budgetLabelRow:{flexDirection:'row',alignItems:'center',gap:6},budgetLabel:{fontSize:11,fontWeight:'800',color:COLORS.text},budgetInput:{fontSize:21,fontWeight:'900',color:COLORS.text,paddingVertical:7},baht:{fontSize:9,color:COLORS.textMuted},totalBox:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,backgroundColor:'#FFF6E6',borderRadius:16,padding:14},totalLabel:{fontSize:13,fontWeight:'900',color:COLORS.text},totalHint:{fontSize:10,color:COLORS.textMuted,marginTop:2},totalMoney:{fontSize:24,fontWeight:'900',color:'#A36F1F'},totalUnit:{fontSize:11},noteInput:{minHeight:100,textAlignVertical:'top'},planPreview:{backgroundColor:'#EAF7F6',borderRadius:16,padding:13},planPreviewHead:{flexDirection:'row',alignItems:'center',gap:7},planPreviewTitle:{fontSize:12,fontWeight:'900',color:COLORS.primaryDark},planPreviewText:{fontSize:11,color:COLORS.textMuted,lineHeight:17,marginTop:5},
  formActions:{flexDirection:'row',justifyContent:'space-between',gap:10,marginTop:2},backBtn:{minHeight:46,paddingHorizontal:16,borderRadius:14,borderWidth:1,borderColor:COLORS.border,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},backText:{fontSize:12,fontWeight:'900',color:COLORS.text},nextBtn:{minHeight:46,paddingHorizontal:18,borderRadius:14,backgroundColor:COLORS.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},nextText:{fontSize:12,fontWeight:'900',color:'#fff'},saveBtn:{minHeight:46,paddingHorizontal:18,borderRadius:14,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},saveText:{fontSize:12,fontWeight:'900',color:'#fff'},
  empty:{backgroundColor:COLORS.surface,borderRadius:RADIUS.lg,padding:30,alignItems:'center',borderWidth:1,borderColor:COLORS.border},emptyTitle:{fontSize:18,fontWeight:'900',color:COLORS.text,marginTop:9},emptyText:{color:COLORS.textMuted,textAlign:'center',marginTop:5},
  card:{backgroundColor:COLORS.surface,borderRadius:RADIUS.lg,padding:17,borderWidth:1,borderColor:COLORS.border,...SHADOW},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:12},cardTitleRow:{flexDirection:'row',alignItems:'center',gap:7,flexWrap:'wrap'},cardTitle:{fontSize:19,fontWeight:'900',color:COLORS.text},autoBadge:{fontSize:9,fontWeight:'900',color:COLORS.primaryDark,backgroundColor:'#EAF7F6',paddingHorizontal:7,paddingVertical:4,borderRadius:999},cardSub:{color:COLORS.textMuted,fontSize:12,marginTop:3},cardActions:{flexDirection:'row',gap:12},tripMetaRow:{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:10},tripMeta:{fontSize:10,color:COLORS.textMuted,fontWeight:'700'},chips:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:12},chip:{paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:'#E7F5F5',color:COLORS.primaryDark,fontWeight:'700',fontSize:12},detailLine:{fontSize:11,color:COLORS.textMuted,marginTop:9},sourceLine:{fontSize:9,color:COLORS.primaryDark,marginTop:7},editBox:{gap:8,marginTop:12,padding:12,borderRadius:16,backgroundColor:'#F7FAFB'},miniSave:{height:42,borderRadius:12,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center'},miniSaveText:{color:'#fff',fontWeight:'900',fontSize:12},expandBtn:{height:42,borderRadius:13,backgroundColor:'#F1F8F8',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,marginTop:12},expandText:{fontSize:11,fontWeight:'900',color:COLORS.primaryDark},timeline:{marginTop:10,gap:10},day:{flexDirection:'row',gap:10,paddingTop:10,borderTopWidth:1,borderTopColor:COLORS.border},dayBadge:{width:32,height:32,borderRadius:16,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},dayNo:{color:'#fff',fontWeight:'900'},dayTitle:{fontWeight:'900',color:COLORS.text},dayDate:{fontSize:9,color:COLORS.textMuted,marginTop:1},place:{color:COLORS.textMuted,fontSize:12,marginTop:4},placeMuted:{color:'#9AA8B4',fontSize:11,marginTop:4,fontStyle:'italic'},dayNote:{fontSize:10,color:COLORS.primaryDark,backgroundColor:'#F1F8F8',padding:8,borderRadius:10,marginTop:7,lineHeight:15},
});
