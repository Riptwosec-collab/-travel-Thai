import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PLACES, PROVINCES } from '@/data/catalog';
import { GLASS, GLASS_RADIUS, glassSurface } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';
import { GlassCard, GlassCircleButton, GlassHeader, GlassPageEnter, GlassPressable, GlassScreen, GlassSection } from '@/components/glass';

const MOODS=['😍','😊','😌','🤩','🥹'];

export default function Journal(){
 const router=useRouter();
 const {width}=useWindowDimensions();
 const wide=width>=900;
 const {journals,addJournal,deleteJournal,visitedPlaceIds}=useTravelStore();
 const [open,setOpen]=useState(false);
 const [title,setTitle]=useState('ความทรงจำจากทริป');
 const [note,setNote]=useState('');
 const [expense,setExpense]=useState('0');
 const [mood,setMood]=useState('😊');
 const [rating,setRating]=useState(5);
 const [placeId,setPlaceId]=useState(visitedPlaceIds[0]||PLACES[0].id);
 const selectedPlace=PLACES.find(p=>p.id===placeId)||PLACES[0];
 const background=selectedPlace?.image||PROVINCES[0].coverImage;
 const save=()=>{addJournal({id:String(Date.now()),placeId,date:new Date().toISOString().slice(0,10),title:title.trim()||'บันทึกการเดินทาง',note,mood,rating,expense:Number(expense)||0});setNote('');setOpen(false)};

 return <GlassScreen image={background}>
  <SafeAreaView style={s.safe}>
   <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <View style={[s.page,wide&&s.pageWide]}>
     <GlassPageEnter>
      <GlassHeader eyebrow="TRAVEL JOURNAL · MEMORIES" title="บันทึกความทรงจำ" subtitle="เก็บสถานที่ ความรู้สึก คะแนน และค่าใช้จ่ายจากทุกทริป" right={<GlassCircleButton icon={open?'close':'add'} label={open?'ปิดฟอร์ม':'เพิ่มบันทึก'} onPress={()=>setOpen(v=>!v)}/>}/>
     </GlassPageEnter>

     {open&&<GlassPageEnter delay={60}>
      <GlassCard strong style={s.form}>
       <View style={s.formHead}><View><Text style={s.formTitle}>บันทึกใหม่</Text><Text style={s.formSub}>NEW MEMORY</Text></View><View style={s.formBadge}><Text style={s.formBadgeText}>{new Date().toISOString().slice(0,10)}</Text></View></View>
       <Field label="หัวข้อ"><TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="หัวข้อบันทึก" placeholderTextColor="rgba(255,255,255,.55)"/></Field>
       <Field label="สถานที่"><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{PLACES.slice(0,10).map(p=><GlassPressable key={p.id} onPress={()=>setPlaceId(p.id)} style={[s.chip,placeId===p.id&&s.chipOn]}><Text style={[s.chipText,placeId===p.id&&s.chipTextOn]}>{p.name}</Text></GlassPressable>)}</ScrollView></Field>
       <Field label="ความประทับใจ"><TextInput style={[s.input,s.note]} value={note} onChangeText={setNote} placeholder="เขียนเรื่องราวจากทริป..." placeholderTextColor="rgba(255,255,255,.55)" multiline/></Field>
       <View style={[s.formGrid,wide&&s.formGridWide]}>
        <Field label="ความรู้สึก"><View style={s.moods}>{MOODS.map(x=><GlassPressable key={x} onPress={()=>setMood(x)} style={[s.mood,mood===x&&s.moodOn]}><Text style={s.moodText}>{x}</Text></GlassPressable>)}</View></Field>
        <Field label={`คะแนน ${rating}/5`}><View style={s.stars}>{[1,2,3,4,5].map(n=><GlassPressable key={n} onPress={()=>setRating(n)}><Ionicons name={n<=rating?'star':'star-outline'} size={24} color={GLASS.gold}/></GlassPressable>)}</View></Field>
       </View>
       <Field label="ค่าใช้จ่าย"><TextInput style={s.input} value={expense} onChangeText={setExpense} keyboardType="number-pad" placeholder="ค่าใช้จ่าย (บาท)" placeholderTextColor="rgba(255,255,255,.55)"/></Field>
       <GlassPressable style={s.save} onPress={save}><Ionicons name="checkmark-circle" size={18} color={GLASS.white}/><Text style={s.saveText}>บันทึก Journal</Text></GlassPressable>
      </GlassCard>
     </GlassPageEnter>}

     <GlassPageEnter delay={100}><GlassSection title="ความทรงจำของคุณ" subtitle={`${journals.length} บันทึก`}/></GlassPageEnter>

     {!journals.length?<GlassPageEnter delay={140}><GlassCard style={s.empty}><View style={s.emptyIcon}><Ionicons name="book-outline" size={28} color={GLASS.aqua}/></View><Text style={s.emptyTitle}>ยังไม่มีบันทึกการเดินทาง</Text><Text style={s.emptyText}>กด + เพื่อเก็บความทรงจำจากทริปแรกของคุณ</Text></GlassCard></GlassPageEnter>:<View style={[s.grid,wide&&s.gridWide]}>{journals.map((j,index)=>{
      const place=PLACES.find(p=>p.id===j.placeId);return <GlassPageEnter key={j.id} delay={Math.min(280,140+index*55)} style={s.cardWrap}><GlassCard strong style={s.memory}>
       {place&&<Image source={place.image} style={s.memoryImage} contentFit="cover" cachePolicy="memory-disk"/>}<View style={s.memoryShade}/>
       <View style={s.memoryTop}><View style={s.datePill}><Text style={s.dateText}>{j.date}</Text></View><GlassPressable style={s.delete} onPress={()=>Alert.alert('ลบบันทึก','ยืนยันการลบ?',[{text:'ยกเลิก'},{text:'ลบ',style:'destructive',onPress:()=>deleteJournal(j.id)}])}><Ionicons name="trash-outline" size={17} color={GLASS.white}/></GlassPressable></View>
       <View style={s.memoryBody}><Text style={s.memoryMood}>{j.mood}</Text><Text style={s.memoryTitle}>{j.title}</Text><Text style={s.memoryPlace}>{place?.name||'ทริปทั่วไป'} · {place?.province||'ประเทศไทย'}</Text><Text style={s.memoryNote} numberOfLines={4}>{j.note||'ไม่มีโน้ตเพิ่มเติม'}</Text><View style={s.memoryFoot}><Text style={s.memoryRating}>{'★'.repeat(j.rating)}{'☆'.repeat(5-j.rating)}</Text><View style={s.expensePill}><Text style={s.expense}>{j.expense.toLocaleString()} บาท</Text></View></View></View>
      </GlassCard></GlassPageEnter>})}</View>}

     <GlassPageEnter delay={320}><GlassPressable style={[s.back,glassSurface()]} onPress={()=>router.back()}><Ionicons name="chevron-back" size={17} color={GLASS.white}/><Text style={s.backText}>กลับ</Text></GlassPressable></GlassPageEnter>
    </View>
   </ScrollView>
  </SafeAreaView>
 </GlassScreen>
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <View style={s.field}><Text style={s.label}>{label}</Text>{children}</View>}

const s=StyleSheet.create({
 safe:{flex:1},scroll:{paddingBottom:80},page:{width:'100%',maxWidth:1260,alignSelf:'center',padding:16,gap:16},pageWide:{paddingHorizontal:28},
 form:{padding:16},formHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:12},formTitle:{fontSize:18,fontWeight:'900',color:GLASS.white},formSub:{fontSize:8,fontWeight:'900',letterSpacing:1.1,color:'rgba(255,255,255,.55)',marginTop:2},formBadge:{backgroundColor:'rgba(255,255,255,.10)',borderWidth:1,borderColor:'rgba(255,255,255,.18)',paddingHorizontal:8,paddingVertical:5,borderRadius:999},formBadgeText:{fontSize:8,fontWeight:'800',color:'rgba(255,255,255,.72)'},field:{gap:6,marginTop:10},label:{fontSize:9,fontWeight:'900',letterSpacing:.45,color:'rgba(255,255,255,.70)'},input:{minHeight:48,borderRadius:17,borderWidth:1,borderColor:'rgba(255,255,255,.20)',backgroundColor:'rgba(255,255,255,.09)',paddingHorizontal:12,color:GLASS.white,fontSize:12},note:{height:110,paddingTop:12,textAlignVertical:'top'},chips:{gap:7,paddingRight:4},chip:{minHeight:36,paddingHorizontal:10,borderRadius:999,backgroundColor:'rgba(255,255,255,.08)',borderWidth:1,borderColor:'rgba(255,255,255,.16)'},chipOn:{backgroundColor:'rgba(99,232,244,.28)',borderColor:'rgba(255,255,255,.40)'},chipText:{fontSize:9,fontWeight:'800',color:'rgba(255,255,255,.64)'},chipTextOn:{color:GLASS.white},formGrid:{gap:10},formGridWide:{flexDirection:'row'},moods:{flexDirection:'row',gap:7,flexWrap:'wrap'},mood:{width:44,height:44,borderRadius:15,backgroundColor:'rgba(255,255,255,.08)',borderWidth:1,borderColor:'rgba(255,255,255,.15)'},moodOn:{backgroundColor:'rgba(99,232,244,.18)',borderColor:'rgba(99,232,244,.68)'},moodText:{fontSize:23},stars:{flexDirection:'row',gap:5},save:{minHeight:50,borderRadius:18,marginTop:14,backgroundColor:'rgba(33,213,228,.28)',borderWidth:1,borderColor:'rgba(255,255,255,.30)'},saveText:{fontSize:11,fontWeight:'900',color:GLASS.white,marginLeft:7},
 empty:{padding:28,alignItems:'center'},emptyIcon:{width:58,height:58,borderRadius:20,backgroundColor:'rgba(255,255,255,.10)',alignItems:'center',justifyContent:'center'},emptyTitle:{fontSize:16,fontWeight:'900',color:GLASS.white,marginTop:10},emptyText:{fontSize:10,color:'rgba(255,255,255,.62)',marginTop:4,textAlign:'center'},
 grid:{gap:11},gridWide:{flexDirection:'row',flexWrap:'wrap'},cardWrap:{flex:1,minWidth:300},memory:{minHeight:310,padding:0,overflow:'hidden'},memoryImage:{position:'absolute',left:0,right:0,top:0,height:150},memoryShade:{position:'absolute',left:0,right:0,top:0,height:170,backgroundColor:'rgba(4,48,58,.34)'},memoryTop:{position:'absolute',left:12,right:12,top:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},datePill:{backgroundColor:'rgba(3,43,52,.44)',borderWidth:1,borderColor:'rgba(255,255,255,.18)',paddingHorizontal:8,paddingVertical:5,borderRadius:999},dateText:{fontSize:8,fontWeight:'800',color:GLASS.white},delete:{width:36,height:36,borderRadius:18,backgroundColor:'rgba(3,43,52,.44)',borderWidth:1,borderColor:'rgba(255,255,255,.18)'},memoryBody:{padding:14,paddingTop:126},memoryMood:{fontSize:30},memoryTitle:{fontSize:16,fontWeight:'900',color:GLASS.white,marginTop:3},memoryPlace:{fontSize:9,fontWeight:'800',color:GLASS.gold,marginTop:3},memoryNote:{fontSize:10,lineHeight:16,color:'rgba(255,255,255,.68)',marginTop:9},memoryFoot:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10,marginTop:12,paddingTop:10,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.14)'},memoryRating:{fontSize:10,color:GLASS.gold},expensePill:{backgroundColor:'rgba(255,255,255,.09)',paddingHorizontal:8,paddingVertical:5,borderRadius:999},expense:{fontSize:9,fontWeight:'900',color:GLASS.white},
 back:{alignSelf:'flex-start',minHeight:40,borderRadius:999,paddingHorizontal:12},backText:{fontSize:10,fontWeight:'900',color:GLASS.white,marginLeft:4},
});
