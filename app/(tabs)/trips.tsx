import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PLACES, PROVINCES } from '@/data/catalog';
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

export default function Trips(){
  const {trips,createTrip,updateTrip,deleteTrip,wishlistPlaceIds,wishlistProvinceIds}=useTravelStore();
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

  const wishPlaces=useMemo(()=>PLACES.filter(p=>wishlistPlaceIds.includes(p.id)),[wishlistPlaceIds]);
  const nDays=Math.max(1,Math.min(14,Number(days)||1));
  const totalBudget=Object.values(budgetInputs).reduce((sum,v)=>sum+money(v),0);
  const provinceResults=useMemo(()=>{
    const q=provinceSearch.trim().toLowerCase();
    const source=q?PROVINCES.filter(p=>`${p.nameTh} ${p.nameEn}`.toLowerCase().includes(q)):PROVINCES.filter(p=>wishlistProvinceIds.includes(p.id));
    return (source.length?source:PROVINCES).slice(0,q?12:8);
  },[provinceSearch,wishlistProvinceIds]);
  const selectedPlaces=useMemo(()=>selectedProvinceIds.length?wishPlaces.filter(p=>selectedProvinceIds.includes(p.provinceId)):wishPlaces,[wishPlaces,selectedProvinceIds]);
  const totalDays=trips.reduce((sum,t)=>sum+t.days.length,0);
  const totalTripBudget=trips.reduce((sum,t)=>sum+t.budget,0);

  const resetDraft=()=>{
    setStep(1);setTitle('ทริปใหม่');setStartDate(isoToday());setDays('3');setTravelers('2');setTransport('รถยนต์');setAccommodation('');setTripStyle('ชิล ๆ');setProvinceSearch('');setSelectedProvinceIds(wishlistProvinceIds.slice(0,4));setNote('');setBudgetInputs({transport:'',accommodation:'',food:'',activities:'',other:''});
  };
  const toggleProvince=(id:string)=>setSelectedProvinceIds(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);
  const setBudget=(key:keyof TripBudgetBreakdown,value:string)=>setBudgetInputs(current=>({...current,[key]:value}));
  const save=()=>{
    const endDate=addDays(startDate,nDays);
    const plan:Trip={
      id:String(Date.now()),
      title:title.trim()||'ทริปใหม่',
      startDate:startDate||isoToday(),
      endDate,
      budget:totalBudget,
      provinceIds:selectedProvinceIds,
      travelers:Math.max(1,Number(travelers)||1),
      transport,
      accommodation:accommodation.trim(),
      tripStyle,
      budgetBreakdown:{
        transport:money(budgetInputs.transport),
        accommodation:money(budgetInputs.accommodation),
        food:money(budgetInputs.food),
        activities:money(budgetInputs.activities),
        other:money(budgetInputs.other),
      },
      note:note.trim(),
      status:'วางแผน',
      days:Array.from({length:nDays},(_,i)=>({
        day:i+1,
        date:addDays(startDate,i+1),
        title:`Day ${i+1}`,
        placeIds:selectedPlaces.filter((_,idx)=>idx%nDays===i).map(p=>p.id),
        note:'',
      })),
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
          <Text style={s.sub}>สร้างทริปละเอียดขึ้น แต่กรอกง่ายเป็นขั้นตอน และดึง Wishlist มาใส่ได้อัตโนมัติ</Text>
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
        <View style={{flex:1}}><Text style={s.createTitle}>สร้างทริปใหม่แบบง่าย</Text><Text style={s.createSub}>3 ขั้นตอน: ข้อมูลทริป → จุดหมาย → งบและแผนรายวัน</Text></View>
        <Ionicons name="arrow-forward" size={20} color={COLORS.primary}/>
      </Pressable>}

      {open&&<View style={s.form}>
        <View style={s.formTop}>
          <View><Text style={s.formTitle}>สร้างแผนทริป</Text><Text style={s.formSub}>กรอกเฉพาะที่รู้ก่อนก็ได้ แก้ทีหลังได้ทุกส่วน</Text></View>
          <Text style={s.stepCounter}>ขั้นตอน {step}/3</Text>
        </View>
        <View style={s.steps}>
          {[1,2,3].map(x=><View key={x} style={[s.stepLine,x<=step&&s.stepLineOn]}/>) }
        </View>

        {step===1&&<>
          <SectionHeader icon="create-outline" title="ข้อมูลทริป" subtitle="ตั้งชื่อและกำหนดช่วงเดินทาง"/>
          <Field label="ชื่อทริป"><TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="เช่น เชียงใหม่ 4 วัน 3 คืน" placeholderTextColor="#9AA8B4"/></Field>
          <View style={s.inline}>
            <Field label="วันเริ่มเดินทาง" flex><TextInput style={s.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9AA8B4"/></Field>
            <Field label="จำนวนวัน" flex><TextInput style={s.input} value={days} onChangeText={setDays} keyboardType="number-pad" placeholder="3" placeholderTextColor="#9AA8B4"/></Field>
            <Field label="ผู้เดินทาง" flex><TextInput style={s.input} value={travelers} onChangeText={setTravelers} keyboardType="number-pad" placeholder="2" placeholderTextColor="#9AA8B4"/></Field>
          </View>
          <View style={s.previewBox}>
            <Ionicons name="calendar" size={18} color={COLORS.primary}/><Text style={s.previewText}>{startDate||'ยังไม่ระบุ'} → {addDays(startDate,nDays)||'ยังไม่ระบุ'} · {nDays} วัน · {Math.max(1,Number(travelers)||1)} คน</Text>
          </View>
        </>}

        {step===2&&<>
          <SectionHeader icon="location-outline" title="จุดหมายและรูปแบบทริป" subtitle="เลือกได้หลายจังหวัด ค้นหาเพิ่มได้ทันที"/>
          <Field label="ค้นหาจังหวัด"><TextInput style={s.input} value={provinceSearch} onChangeText={setProvinceSearch} placeholder="ค้นหา เชียงใหม่, กระบี่, น่าน..." placeholderTextColor="#9AA8B4"/></Field>
          {selectedProvinceIds.length>0&&<View style={s.selectedWrap}>{selectedProvinceIds.map(id=>{const p=PROVINCES.find(x=>x.id===id);return p?<Pressable key={id} style={s.selectedChip} onPress={()=>toggleProvince(id)}><Ionicons name="checkmark-circle" size={15} color={COLORS.primary}/><Text style={s.selectedChipText}>{p.nameTh}</Text><Ionicons name="close" size={13} color={COLORS.textMuted}/></Pressable>:null})}</View>}
          <View style={s.provinceGrid}>{provinceResults.map(p=>{const on=selectedProvinceIds.includes(p.id);return <Pressable key={p.id} style={[s.provinceOption,on&&s.provinceOptionOn]} onPress={()=>toggleProvince(p.id)}><Text style={[s.provinceOptionText,on&&s.provinceOptionTextOn]}>{p.nameTh}</Text><Text style={s.provinceRegion}>{p.region}</Text></Pressable>})}</View>

          <Field label="เดินทางหลัก"><View style={s.choiceWrap}>{TRANSPORTS.map(x=><Choice key={x} text={x} active={transport===x} onPress={()=>setTransport(x)}/>)}</View></Field>
          <Field label="สไตล์ทริป"><View style={s.choiceWrap}>{STYLES.map(x=><Choice key={x} text={x} active={tripStyle===x} onPress={()=>setTripStyle(x)}/>)}</View></Field>
          <Field label="ที่พัก / โรงแรม (ถ้ามี)"><TextInput style={s.input} value={accommodation} onChangeText={setAccommodation} placeholder="เช่น Nimman Hotel หรือยังไม่จอง" placeholderTextColor="#9AA8B4"/></Field>
          <View style={s.wishBox}><Ionicons name="heart" size={18} color={COLORS.wishlist}/><View style={{flex:1}}><Text style={s.wishTitle}>{selectedPlaces.length} สถานที่จาก Wishlist พร้อมใช้</Text><Text style={s.wishText}>ตอนสร้างทริป ระบบจะกระจายสถานที่เหล่านี้ลงแต่ละวันให้อัตโนมัติ</Text></View></View>
        </>}

        {step===3&&<>
          <SectionHeader icon="wallet-outline" title="งบประมาณและโน้ต" subtitle="แยกงบเป็นหมวด เพื่อดูง่ายและแก้ภายหลังได้"/>
          <View style={s.budgetGrid}>{BUDGET_FIELDS.map(([key,label,icon])=><View key={key} style={s.budgetBox}><View style={s.budgetLabelRow}><Ionicons name={icon as any} size={16} color={COLORS.primary}/><Text style={s.budgetLabel}>{label}</Text></View><TextInput style={s.budgetInput} value={budgetInputs[key]} onChangeText={v=>setBudget(key,v)} keyboardType="number-pad" placeholder="0" placeholderTextColor="#9AA8B4"/><Text style={s.baht}>บาท</Text></View>)}</View>
          <View style={s.totalBox}><View><Text style={s.totalLabel}>งบประมาณรวม</Text><Text style={s.totalHint}>รวมจากทุกหมวดด้านบน</Text></View><Text style={s.totalMoney}>{totalBudget.toLocaleString()} <Text style={s.totalUnit}>บาท</Text></Text></View>
          <Field label="โน้ตทริป"><TextInput style={[s.input,s.noteInput]} value={note} onChangeText={setNote} multiline placeholder="เช่น เช่ารถรับที่สนามบิน, ต้องจองร้านอาหาร, อยากดูพระอาทิตย์ขึ้น..." placeholderTextColor="#9AA8B4"/></Field>
          <View style={s.planPreview}>
            <View style={s.planPreviewHead}><Ionicons name="sparkles-outline" size={18} color={COLORS.primaryDark}/><Text style={s.planPreviewTitle}>แผนที่จะสร้างให้</Text></View>
            <Text style={s.planPreviewText}>{nDays} วัน · {selectedProvinceIds.length} จังหวัด · {selectedPlaces.length} สถานที่จาก Wishlist · {transport} · {Math.max(1,Number(travelers)||1)} คน</Text>
          </View>
        </>}

        <View style={s.formActions}>
          {step>1?<Pressable style={s.backBtn} onPress={()=>setStep(x=>x-1)}><Ionicons name="arrow-back" size={18} color={COLORS.text}/><Text style={s.backText}>ย้อนกลับ</Text></Pressable>:<Pressable style={s.backBtn} onPress={()=>{setOpen(false);resetDraft()}}><Text style={s.backText}>ยกเลิก</Text></Pressable>}
          {step<3?<Pressable style={s.nextBtn} onPress={()=>setStep(x=>x+1)}><Text style={s.nextText}>ถัดไป</Text><Ionicons name="arrow-forward" size={18} color="#fff"/></Pressable>:<Pressable style={s.nextBtn} onPress={save}><Ionicons name="checkmark-circle" size={19} color="#fff"/><Text style={s.nextText}>สร้างแผนทริป</Text></Pressable>}
        </View>
      </View>}

      <View style={s.listHeader}><View><Text style={s.listTitle}>ทริปของฉัน</Text><Text style={s.listSub}>เปิดดูรายละเอียด แก้ข้อมูล หรือเพิ่มสถานที่ภายหลังได้</Text></View><Text style={s.tripCount}>{trips.length} ทริป</Text></View>
      {!trips.length?<View style={s.empty}><View style={s.emptyIcon}><Ionicons name="calendar-outline" size={34} color={COLORS.primary}/></View><Text style={s.emptyTitle}>ยังไม่มีแผนทริป</Text><Text style={s.emptyText}>สร้างทริปแรกได้ใน 3 ขั้นตอน และระบบจะนำ Wishlist มาช่วยจัดแผนให้</Text><Pressable style={s.emptyBtn} onPress={()=>setOpen(true)}><Ionicons name="add" size={18} color="#fff"/><Text style={s.emptyBtnText}>สร้างทริปแรก</Text></Pressable></View>:trips.map(t=><TripCard key={t.id} trip={t} wishPlaces={wishPlaces} onUpdate={patch=>updateTrip(t.id,patch)} onDelete={()=>Alert.alert('ลบทริป',`ลบ ${t.title}?`,[{text:'ยกเลิก'},{text:'ลบ',style:'destructive',onPress:()=>deleteTrip(t.id)}])}/>)}
    </ScrollView>
  </SafeAreaView>;
}

function TripCard({trip,wishPlaces,onUpdate,onDelete}:{trip:Trip;wishPlaces:typeof PLACES;onUpdate:(patch:Partial<Trip>)=>void;onDelete:()=>void}){
  const [expanded,setExpanded]=useState(false);
  const [editing,setEditing]=useState(false);
  const [editTitle,setEditTitle]=useState(trip.title);
  const [editAccommodation,setEditAccommodation]=useState(trip.accommodation||'');
  const [editNote,setEditNote]=useState(trip.note||'');
  const allPlaceIds=trip.days.flatMap(d=>d.placeIds);
  const availableWish=wishPlaces.filter(p=>!allPlaceIds.includes(p.id));
  const addPlace=(placeId:string)=>{
    const target=[...trip.days].sort((a,b)=>a.placeIds.length-b.placeIds.length)[0];
    if(!target)return;
    onUpdate({days:trip.days.map(d=>d.day===target.day?{...d,placeIds:[...d.placeIds,placeId]}:d)});
  };
  const removePlace=(day:number,placeId:string)=>onUpdate({days:trip.days.map(d=>d.day===day?{...d,placeIds:d.placeIds.filter(id=>id!==placeId)}:d)});
  const updateDayNote=(day:number,value:string)=>onUpdate({days:trip.days.map(d=>d.day===day?{...d,note:value}:d)});
  const saveEdit=()=>{onUpdate({title:editTitle.trim()||trip.title,accommodation:editAccommodation.trim(),note:editNote.trim()});setEditing(false)};

  return <View style={s.card}>
    <View style={s.cardAccent}/>
    <View style={s.cardTop}>
      <View style={{flex:1}}><View style={s.statusRow}><Text style={s.status}>{trip.status||'วางแผน'}</Text><Text style={s.cardDate}>{trip.startDate}{trip.endDate?` → ${trip.endDate}`:''}</Text></View><Text style={s.cardTitle}>{trip.title}</Text><Text style={s.cardSub}>{trip.days.length} วัน · {trip.travelers||1} คน · {trip.transport||'ยังไม่ระบุการเดินทาง'}</Text></View>
      <View style={s.cardActions}><Pressable style={s.iconBtn} onPress={()=>setEditing(v=>!v)}><Ionicons name="create-outline" size={18} color={COLORS.primaryDark}/></Pressable><Pressable style={s.iconBtn} onPress={onDelete}><Ionicons name="trash-outline" size={18} color={COLORS.danger}/></Pressable></View>
    </View>

    <View style={s.summaryStrip}>
      <Mini icon="location-outline" value={`${trip.provinceIds.length}`} label="จังหวัด"/>
      <Mini icon="map-outline" value={`${allPlaceIds.length}`} label="สถานที่"/>
      <Mini icon="wallet-outline" value={trip.budget.toLocaleString()} label="บาท"/>
      <Mini icon="bed-outline" value={trip.accommodation?'มี':'—'} label="ที่พัก"/>
    </View>

    {trip.provinceIds.length>0&&<View style={s.chips}>{trip.provinceIds.map(id=><Text key={id} style={s.chip}>{PROVINCES.find(p=>p.id===id)?.nameTh}</Text>)}</View>}
    {(trip.tripStyle||trip.accommodation)&&<View style={s.tripMeta}>{trip.tripStyle&&<Text style={s.metaChip}>✦ {trip.tripStyle}</Text>}{trip.accommodation&&<Text style={s.metaText}>ที่พัก: {trip.accommodation}</Text>}</View>}

    {editing&&<View style={s.editBox}>
      <Text style={s.editTitle}>แก้ข้อมูลทริปแบบเร็ว</Text>
      <TextInput style={s.input} value={editTitle} onChangeText={setEditTitle} placeholder="ชื่อทริป"/>
      <TextInput style={s.input} value={editAccommodation} onChangeText={setEditAccommodation} placeholder="ที่พัก / โรงแรม"/>
      <TextInput style={[s.input,s.noteInput]} value={editNote} onChangeText={setEditNote} multiline placeholder="โน้ตทริป"/>
      <View style={s.editActions}><Pressable style={s.smallGhost} onPress={()=>setEditing(false)}><Text style={s.smallGhostText}>ยกเลิก</Text></Pressable><Pressable style={s.smallSave} onPress={saveEdit}><Text style={s.smallSaveText}>บันทึก</Text></Pressable></View>
    </View>}

    <Pressable style={s.expandBtn} onPress={()=>setExpanded(v=>!v)}><Text style={s.expandText}>{expanded?'ซ่อนแผนรายวัน':'ดูแผนรายวัน'}</Text><Ionicons name={expanded?'chevron-up':'chevron-down'} size={18} color={COLORS.primary}/></Pressable>

    {expanded&&<>
      <View style={s.timeline}>{trip.days.map(d=><View key={d.day} style={s.day}>
        <View style={s.dayRail}><View style={s.dayBadge}><Text style={s.dayNo}>{d.day}</Text></View><View style={s.rail}/></View>
        <View style={s.dayBody}><View style={s.dayHead}><View><Text style={s.dayTitle}>วันที่ {d.day}</Text><Text style={s.dayDate}>{d.date||''}</Text></View><Text style={s.dayCount}>{d.placeIds.length} สถานที่</Text></View>
          {d.placeIds.length?d.placeIds.map(id=>{const p=PLACES.find(x=>x.id===id);return p?<View key={id} style={s.placeRow}><View style={s.placeDot}/><View style={{flex:1}}><Text style={s.placeName}>{p.name}</Text><Text style={s.placeMeta}>{p.province} · {p.category} · ★ {p.rating}</Text></View><Pressable onPress={()=>removePlace(d.day,id)}><Ionicons name="close-circle-outline" size={19} color={COLORS.textMuted}/></Pressable></View>:null}):<Text style={s.placeMuted}>ยังไม่มีสถานที่ในวันนี้</Text>}
          <TextInput style={s.dayNote} value={d.note||''} onChangeText={v=>updateDayNote(d.day,v)} placeholder="เพิ่มโน้ตวันนี้ เช่น เวลาออกเดินทาง / ร้านที่จอง..." placeholderTextColor="#9AA8B4"/>
        </View>
      </View>)}</View>
      {availableWish.length>0&&<View style={s.addWish}><Text style={s.addWishTitle}>เพิ่มจาก Wishlist</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.addWishScroll}>{availableWish.map(p=><Pressable key={p.id} style={s.addWishChip} onPress={()=>addPlace(p.id)}><Ionicons name="add-circle-outline" size={16} color={COLORS.primary}/><Text style={s.addWishText}>{p.name}</Text></Pressable>)}</ScrollView></View>}
      {trip.note?<View style={s.tripNote}><Ionicons name="document-text-outline" size={17} color={COLORS.primary}/><Text style={s.tripNoteText}>{trip.note}</Text></View>:null}
    </>}
  </View>;
}

function SectionHeader({icon,title,subtitle}:{icon:any;title:string;subtitle:string}){return <View style={s.sectionHeader}><View style={s.sectionIcon}><Ionicons name={icon} size={19} color={COLORS.primary}/></View><View><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionSub}>{subtitle}</Text></View></View>}
function Field({label,children,flex}:{label:string;children:React.ReactNode;flex?:boolean}){return <View style={[s.field,flex&&{flex:1}]}><Text style={s.fieldLabel}>{label}</Text>{children}</View>}
function Choice({text,active,onPress}:{text:string;active:boolean;onPress:()=>void}){return <Pressable style={[s.choice,active&&s.choiceOn]} onPress={onPress}><Text style={[s.choiceText,active&&s.choiceTextOn]}>{text}</Text></Pressable>}
function Stat({icon,n,label}:{icon:any;n:number|string;label:string}){return <View style={s.stat}><View style={s.statIcon}><Ionicons name={icon} size={18} color={COLORS.primary}/></View><View><Text style={s.statN}>{n}</Text><Text style={s.statLabel}>{label}</Text></View></View>}
function Mini({icon,value,label}:{icon:any;value:string;label:string}){return <View style={s.mini}><Ionicons name={icon} size={16} color={COLORS.primary}/><Text style={s.miniValue}>{value}</Text><Text style={s.miniLabel}>{label}</Text></View>}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.background},content:{padding:SPACING.lg,paddingBottom:120,gap:16,maxWidth:1280,width:'100%',alignSelf:'center'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:16},title:{fontSize:30,fontWeight:'900',color:COLORS.text},sub:{color:COLORS.textMuted,marginTop:4,lineHeight:20},add:{width:48,height:48,borderRadius:24,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',...SHADOW},addClose:{backgroundColor:COLORS.dark},
  overview:{flexDirection:'row',flexWrap:'wrap',gap:10},stat:{minWidth:150,flex:1,backgroundColor:COLORS.surface,borderRadius:RADIUS.md,borderWidth:1,borderColor:COLORS.border,padding:13,flexDirection:'row',alignItems:'center',gap:10},statIcon:{width:38,height:38,borderRadius:12,backgroundColor:'#E7F5F5',alignItems:'center',justifyContent:'center'},statN:{fontSize:18,fontWeight:'900',color:COLORS.text},statLabel:{fontSize:10,color:COLORS.textMuted,marginTop:1},
  createBanner:{backgroundColor:'#EAF7F6',borderRadius:RADIUS.lg,borderWidth:1,borderColor:'#CFE9E6',padding:16,flexDirection:'row',alignItems:'center',gap:12},createIcon:{width:46,height:46,borderRadius:15,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},createTitle:{fontSize:16,fontWeight:'900',color:COLORS.text},createSub:{fontSize:12,color:COLORS.textMuted,marginTop:3},
  form:{backgroundColor:COLORS.surface,borderRadius:RADIUS.lg,padding:20,borderWidth:1,borderColor:COLORS.border,gap:14,...SHADOW},formTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},formTitle:{fontSize:21,fontWeight:'900',color:COLORS.text},formSub:{fontSize:12,color:COLORS.textMuted,marginTop:3},stepCounter:{fontSize:12,color:COLORS.primaryDark,fontWeight:'900',backgroundColor:'#E7F5F5',paddingHorizontal:10,paddingVertical:6,borderRadius:999},steps:{flexDirection:'row',gap:7},stepLine:{height:5,flex:1,borderRadius:99,backgroundColor:'#E6ECEE'},stepLineOn:{backgroundColor:COLORS.primary},
  sectionHeader:{flexDirection:'row',alignItems:'center',gap:10,marginTop:2},sectionIcon:{width:38,height:38,borderRadius:12,backgroundColor:'#E7F5F5',alignItems:'center',justifyContent:'center'},sectionTitle:{fontSize:17,fontWeight:'900',color:COLORS.text},sectionSub:{fontSize:11,color:COLORS.textMuted,marginTop:2},field:{gap:6},fieldLabel:{fontSize:12,fontWeight:'800',color:COLORS.text},input:{minHeight:48,borderRadius:RADIUS.md,borderWidth:1,borderColor:COLORS.border,paddingHorizontal:13,paddingVertical:10,color:COLORS.text,backgroundColor:'#FAFCFD'},inline:{flexDirection:'row',gap:10,flexWrap:'wrap'},noteInput:{minHeight:88,textAlignVertical:'top'},previewBox:{minHeight:46,borderRadius:RADIUS.md,backgroundColor:'#F4FAFA',borderWidth:1,borderColor:'#DCEDEC',paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:8},previewText:{fontSize:12,color:COLORS.textMuted,fontWeight:'700'},
  selectedWrap:{flexDirection:'row',flexWrap:'wrap',gap:7},selectedChip:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:7,borderRadius:999,backgroundColor:'#E7F5F5'},selectedChipText:{fontSize:12,fontWeight:'800',color:COLORS.primaryDark},provinceGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},provinceOption:{minWidth:120,borderRadius:14,borderWidth:1,borderColor:COLORS.border,paddingHorizontal:12,paddingVertical:9,backgroundColor:'#FAFCFD'},provinceOptionOn:{borderColor:COLORS.primary,backgroundColor:'#E7F5F5'},provinceOptionText:{fontSize:13,fontWeight:'800',color:COLORS.text},provinceOptionTextOn:{color:COLORS.primaryDark},provinceRegion:{fontSize:9,color:COLORS.textMuted,marginTop:2},choiceWrap:{flexDirection:'row',flexWrap:'wrap',gap:7},choice:{borderRadius:999,borderWidth:1,borderColor:COLORS.border,paddingHorizontal:12,paddingVertical:8,backgroundColor:'#FAFCFD'},choiceOn:{borderColor:COLORS.primary,backgroundColor:'#E7F5F5'},choiceText:{fontSize:12,fontWeight:'700',color:COLORS.textMuted},choiceTextOn:{color:COLORS.primaryDark},wishBox:{borderRadius:RADIUS.md,backgroundColor:'#FFF3F6',padding:13,flexDirection:'row',gap:9,alignItems:'flex-start'},wishTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},wishText:{fontSize:11,color:COLORS.textMuted,lineHeight:17,marginTop:2},
  budgetGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},budgetBox:{minWidth:145,flex:1,borderRadius:16,borderWidth:1,borderColor:COLORS.border,padding:12,backgroundColor:'#FAFCFD',position:'relative'},budgetLabelRow:{flexDirection:'row',alignItems:'center',gap:6},budgetLabel:{fontSize:11,fontWeight:'800',color:COLORS.text},budgetInput:{fontSize:20,fontWeight:'900',color:COLORS.text,paddingVertical:8,paddingRight:38},baht:{position:'absolute',right:12,bottom:18,fontSize:10,color:COLORS.textMuted},totalBox:{borderRadius:RADIUS.md,backgroundColor:COLORS.dark,padding:15,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},totalLabel:{fontSize:13,fontWeight:'900',color:'#fff'},totalHint:{fontSize:10,color:'#B9CEC9',marginTop:2},totalMoney:{fontSize:25,fontWeight:'900',color:'#fff'},totalUnit:{fontSize:11,color:'#B9CEC9'},planPreview:{borderRadius:RADIUS.md,borderWidth:1,borderColor:'#D9EAE8',backgroundColor:'#F5FAF9',padding:13},planPreviewHead:{flexDirection:'row',alignItems:'center',gap:7},planPreviewTitle:{fontSize:12,fontWeight:'900',color:COLORS.text},planPreviewText:{fontSize:11,color:COLORS.textMuted,lineHeight:17,marginTop:6},
  formActions:{flexDirection:'row',justifyContent:'space-between',gap:10,marginTop:2},backBtn:{height:48,minWidth:110,borderRadius:RADIUS.md,borderWidth:1,borderColor:COLORS.border,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6,paddingHorizontal:16},backText:{fontWeight:'800',color:COLORS.text},nextBtn:{height:48,minWidth:145,borderRadius:RADIUS.md,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7,paddingHorizontal:18},nextText:{color:'#fff',fontWeight:'900'},
  listHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginTop:4},listTitle:{fontSize:20,fontWeight:'900',color:COLORS.text},listSub:{fontSize:11,color:COLORS.textMuted,marginTop:2},tripCount:{fontSize:11,fontWeight:'900',color:COLORS.primaryDark,backgroundColor:'#E7F5F5',paddingHorizontal:10,paddingVertical:6,borderRadius:999},
  empty:{backgroundColor:COLORS.surface,borderRadius:RADIUS.lg,padding:32,alignItems:'center',borderWidth:1,borderColor:COLORS.border},emptyIcon:{width:66,height:66,borderRadius:22,backgroundColor:'#E7F5F5',alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:19,fontWeight:'900',color:COLORS.text,marginTop:12},emptyText:{color:COLORS.textMuted,textAlign:'center',marginTop:5,maxWidth:420,lineHeight:20},emptyBtn:{marginTop:14,height:44,borderRadius:999,backgroundColor:COLORS.primary,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:16},emptyBtnText:{color:'#fff',fontWeight:'900'},
  card:{backgroundColor:COLORS.surface,borderRadius:RADIUS.lg,padding:18,borderWidth:1,borderColor:COLORS.border,overflow:'hidden',...SHADOW},cardAccent:{position:'absolute',left:0,top:0,bottom:0,width:4,backgroundColor:COLORS.primary},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:12},statusRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:5},status:{fontSize:9,fontWeight:'900',color:COLORS.primaryDark,backgroundColor:'#E7F5F5',paddingHorizontal:8,paddingVertical:4,borderRadius:999},cardDate:{fontSize:10,color:COLORS.textMuted},cardTitle:{fontSize:21,fontWeight:'900',color:COLORS.text},cardSub:{color:COLORS.textMuted,fontSize:12,marginTop:3},cardActions:{flexDirection:'row',gap:6},iconBtn:{width:36,height:36,borderRadius:12,borderWidth:1,borderColor:COLORS.border,alignItems:'center',justifyContent:'center'},summaryStrip:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:14},mini:{minWidth:100,flex:1,borderRadius:14,backgroundColor:'#F7FAFB',padding:10,alignItems:'center'},miniValue:{fontSize:15,fontWeight:'900',color:COLORS.text,marginTop:4},miniLabel:{fontSize:9,color:COLORS.textMuted,marginTop:1},chips:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:12},chip:{paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:'#E7F5F5',color:COLORS.primaryDark,fontWeight:'700',fontSize:11},tripMeta:{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'center',marginTop:10},metaChip:{fontSize:10,fontWeight:'800',color:'#8A6524',backgroundColor:'#FFF3DB',paddingHorizontal:9,paddingVertical:5,borderRadius:999},metaText:{fontSize:11,color:COLORS.textMuted},
  editBox:{marginTop:14,borderRadius:RADIUS.md,backgroundColor:'#F7FAFB',padding:13,gap:9,borderWidth:1,borderColor:COLORS.border},editTitle:{fontSize:13,fontWeight:'900',color:COLORS.text},editActions:{flexDirection:'row',justifyContent:'flex-end',gap:8},smallGhost:{height:38,paddingHorizontal:14,borderRadius:12,borderWidth:1,borderColor:COLORS.border,alignItems:'center',justifyContent:'center'},smallGhostText:{fontSize:11,fontWeight:'800',color:COLORS.text},smallSave:{height:38,paddingHorizontal:15,borderRadius:12,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center'},smallSaveText:{fontSize:11,fontWeight:'900',color:'#fff'},expandBtn:{height:44,marginTop:13,borderRadius:14,backgroundColor:'#F5FAFA',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},expandText:{fontSize:12,fontWeight:'900',color:COLORS.primaryDark},
  timeline:{marginTop:12,gap:0},day:{flexDirection:'row',gap:10},dayRail:{width:34,alignItems:'center'},dayBadge:{width:32,height:32,borderRadius:16,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},dayNo:{color:'#fff',fontWeight:'900'},rail:{width:2,flex:1,minHeight:36,backgroundColor:'#DCE7E8',marginVertical:3},dayBody:{flex:1,paddingBottom:14},dayHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,minHeight:32},dayTitle:{fontWeight:'900',color:COLORS.text},dayDate:{fontSize:9,color:COLORS.textMuted,marginTop:1},dayCount:{fontSize:9,color:COLORS.textMuted},placeRow:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#EEF2F3'},placeDot:{width:7,height:7,borderRadius:4,backgroundColor:COLORS.primary},placeName:{fontSize:12,fontWeight:'800',color:COLORS.text},placeMeta:{fontSize:9,color:COLORS.textMuted,marginTop:2},placeMuted:{color:'#9AA8B4',fontSize:11,marginVertical:8,fontStyle:'italic'},dayNote:{minHeight:42,borderRadius:12,backgroundColor:'#F7FAFB',borderWidth:1,borderColor:COLORS.border,paddingHorizontal:10,paddingVertical:8,fontSize:10,color:COLORS.text,marginTop:8},
  addWish:{marginTop:4,borderTopWidth:1,borderTopColor:COLORS.border,paddingTop:12},addWishTitle:{fontSize:11,fontWeight:'900',color:COLORS.text},addWishScroll:{gap:7,paddingTop:8,paddingBottom:2},addWishChip:{flexDirection:'row',alignItems:'center',gap:5,borderRadius:999,backgroundColor:'#E7F5F5',paddingHorizontal:10,paddingVertical:7},addWishText:{fontSize:10,fontWeight:'800',color:COLORS.primaryDark},tripNote:{marginTop:12,borderRadius:14,backgroundColor:'#FFF8E9',padding:12,flexDirection:'row',gap:8,alignItems:'flex-start'},tripNoteText:{flex:1,fontSize:11,color:COLORS.textMuted,lineHeight:17},
});
