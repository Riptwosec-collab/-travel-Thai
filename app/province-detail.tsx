import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlaceCard from '@/components/PlaceCard';
import { PLACES, PROVINCES } from '@/data/catalog';
import { getProvinceInfo } from '@/data/provinceInfo';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';

export default function ProvinceDetail(){
  const {id}=useLocalSearchParams<{id:string}>();
  const router=useRouter();
  const p=PROVINCES.find(x=>x.id===id);
  const {visitedProvinceIds,wishlistProvinceIds,toggleVisitedProvince,toggleWishlistProvince}=useTravelStore();
  if(!p)return <SafeAreaView style={s.safe}><View style={s.notFound}><Text style={s.notFoundTitle}>ไม่พบจังหวัด</Text><Pressable onPress={()=>router.back()}><Text style={s.link}>กลับไปหน้าแผนที่</Text></Pressable></View></SafeAreaView>;

  const visited=visitedProvinceIds.includes(p.id),wish=wishlistProvinceIds.includes(p.id);
  const places=PLACES.filter(x=>x.provinceId===p.id);
  const info=getProvinceInfo(p.nameTh,p.region,p.description,p.bestMonths);

  return <SafeAreaView style={s.safe} edges={['bottom']}>
    <ScrollView contentContainerStyle={{paddingBottom:118}} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <Image source={p.coverImage} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk"/>
        <View style={s.shade}/>
        <Pressable style={s.back} onPress={()=>router.back()}><Ionicons name="chevron-back" size={23} color="#fff"/></Pressable>
        <View style={s.heroText}><Text style={s.region}>{p.region}</Text><Text style={s.title}>{p.nameTh}</Text><Text style={s.en}>{p.nameEn}</Text></View>
      </View>

      <View style={s.content}>
        <View style={s.introCard}>
          <Text style={s.eyebrow}>ภาพรวมจังหวัด</Text>
          <Text style={s.intro}>{info.fullDescription}</Text>
        </View>

        <View style={s.stats}>
          <Stat icon="location" value={`${places.length}`} label="สถานที่ในระบบ"/>
          <Stat icon="time" value={info.recommendedDays} label="ระยะเวลาที่แนะนำ"/>
          <Stat icon="calendar" value={p.bestMonths.slice(0,3).join(' ')} label="ช่วงแนะนำ"/>
        </View>

        <Section title="ไฮไลต์ที่ควรรู้" icon="sparkles">
          <View style={s.grid}>{info.highlights.map(x=><InfoChip key={x} icon="location-outline" text={x}/>)}</View>
        </Section>

        <Section title="เหมาะกับทริปแบบไหน" icon="compass">
          <View style={s.grid}>{info.bestFor.map(x=><InfoChip key={x} icon="checkmark-circle-outline" text={x}/>)}</View>
        </Section>

        <Section title="ช่วงเวลาและฤดูกาล" icon="calendar">
          <View style={s.noteCard}><Text style={s.noteText}>{info.seasonNote}</Text></View>
        </Section>

        <Section title="คำแนะนำก่อนเดินทาง" icon="information-circle">
          <BulletList items={info.travelTips}/>
        </Section>

        <Section title="การเดินทางในจังหวัด" icon="car-sport">
          <BulletList items={info.transportTips}/>
        </Section>

        <Section title="ของกินและของฝาก" icon="restaurant">
          <View style={s.tags}>{info.localFoods.map(x=><View key={x} style={s.foodTag}><Text style={s.foodText}>{x}</Text></View>)}</View>
        </Section>

        <Section title={`สถานที่แนะนำใน ${p.nameTh}`} icon="map">
          {places.length?<View style={{gap:12}}>{places.map(x=><PlaceCard key={x.id} place={x} compact/>)}</View>:<View style={s.empty}><Text style={s.emptyTitle}>กำลังเพิ่มสถานที่แบบละเอียด</Text><Text style={s.emptyText}>ข้อมูลจังหวัดพร้อมใช้งานแล้ว ส่วนสถานที่เที่ยว ร้านอาหาร คาเฟ่ และกิจกรรมจะเพิ่มเข้าฐานข้อมูลเป็นลำดับ</Text></View>}
        </Section>

        <Pressable style={s.plan} onPress={()=>router.push('/(tabs)/trips')}><Ionicons name="calendar" size={19} color="#fff"/><Text style={s.planText}>วางแผนทริปไป {p.nameTh}</Text></Pressable>
      </View>
    </ScrollView>

    <View style={s.bottom}>
      <Pressable style={[s.action,visited?s.visited:s.outline]} onPress={()=>toggleVisitedProvince(p.id)}><Ionicons name="checkmark-circle" size={19} color={visited?'#fff':COLORS.text}/><Text style={[s.actionText,{color:visited?'#fff':COLORS.text}]}>{visited?'บันทึกว่าไปแล้ว':'ไปแล้ว'}</Text></Pressable>
      <Pressable style={[s.action,s.wish]} onPress={()=>toggleWishlistProvince(p.id)}><Ionicons name={wish?'heart':'heart-outline'} size={19} color="#fff"/><Text style={[s.actionText,{color:'#fff'}]}>{wish?'อยู่ในอยากไป':'อยากไป'}</Text></Pressable>
    </View>
  </SafeAreaView>;
}

function Stat({icon,value,label}:{icon:any;value:any;label:string}){return <View style={s.stat}><Ionicons name={icon} size={19} color={COLORS.primary}/><Text style={s.statValue}>{value||'-'}</Text><Text style={s.statLabel}>{label}</Text></View>}
function Section({title,icon,children}:{title:string;icon:any;children:React.ReactNode}){return <View style={s.sectionWrap}><View style={s.sectionHead}><Ionicons name={icon} size={19} color={COLORS.primary}/><Text style={s.section}>{title}</Text></View>{children}</View>}
function InfoChip({icon,text}:{icon:any;text:string}){return <View style={s.highlight}><Ionicons name={icon} size={18} color={COLORS.primary}/><Text style={s.highlightText}>{text}</Text></View>}
function BulletList({items}:{items:string[]}){return <View style={s.bulletCard}>{items.map(x=><View key={x} style={s.bulletRow}><View style={s.bulletDot}/><Text style={s.bulletText}>{x}</Text></View>)}</View>}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.background},notFound:{flex:1,alignItems:'center',justifyContent:'center',gap:10},notFoundTitle:{fontSize:22,fontWeight:'900',color:COLORS.text},link:{color:COLORS.primary,fontWeight:'800'},
  hero:{height:350,position:'relative'},shade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(5,18,22,.38)',borderBottomWidth:125,borderBottomColor:'rgba(5,18,22,.52)'},back:{position:'absolute',top:50,left:18,width:44,height:44,borderRadius:22,backgroundColor:'rgba(0,0,0,.35)',alignItems:'center',justifyContent:'center'},heroText:{position:'absolute',left:22,right:22,bottom:25},region:{alignSelf:'flex-start',backgroundColor:'rgba(255,255,255,.2)',color:'#fff',fontWeight:'800',fontSize:12,paddingHorizontal:10,paddingVertical:5,borderRadius:999},title:{fontSize:36,fontWeight:'900',color:'#fff',marginTop:8},en:{color:'rgba(255,255,255,.84)',marginTop:2},
  content:{padding:SPACING.lg,gap:20},introCard:{backgroundColor:COLORS.surface,borderRadius:RADIUS.lg,padding:18,borderWidth:1,borderColor:COLORS.border},eyebrow:{fontSize:11,fontWeight:'900',color:COLORS.primary,letterSpacing:.6},intro:{fontSize:15,color:COLORS.text,lineHeight:25,marginTop:7,fontWeight:'600'},stats:{flexDirection:'row',gap:9},stat:{flex:1,backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border,borderRadius:RADIUS.md,padding:12},statValue:{fontWeight:'900',color:COLORS.text,marginTop:7,fontSize:13},statLabel:{fontSize:10,color:COLORS.textMuted,marginTop:2},
  sectionWrap:{gap:10},sectionHead:{flexDirection:'row',alignItems:'center',gap:7},section:{fontSize:19,fontWeight:'900',color:COLORS.text},grid:{flexDirection:'row',flexWrap:'wrap',gap:9},highlight:{width:'48%',backgroundColor:COLORS.surface,borderRadius:RADIUS.md,borderWidth:1,borderColor:COLORS.border,padding:14,flexDirection:'row',alignItems:'center',gap:8},highlightText:{fontWeight:'800',color:COLORS.text,flex:1,fontSize:13},noteCard:{backgroundColor:'#EAF7F5',borderRadius:RADIUS.md,padding:15},noteText:{fontSize:13,lineHeight:21,color:'#426C66',fontWeight:'700'},bulletCard:{backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:15,borderWidth:1,borderColor:COLORS.border,gap:9},bulletRow:{flexDirection:'row',alignItems:'flex-start',gap:9},bulletDot:{width:6,height:6,borderRadius:3,backgroundColor:COLORS.primary,marginTop:7},bulletText:{flex:1,fontSize:13,lineHeight:20,color:COLORS.textMuted},tags:{flexDirection:'row',flexWrap:'wrap',gap:8},foodTag:{backgroundColor:'#FFF4DF',borderRadius:999,paddingHorizontal:12,paddingVertical:8,borderWidth:1,borderColor:'#F3DFC0'},foodText:{fontSize:12,fontWeight:'800',color:'#8A6524'},
  empty:{backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:20,borderWidth:1,borderColor:COLORS.border},emptyTitle:{fontWeight:'900',color:COLORS.text},emptyText:{fontSize:13,color:COLORS.textMuted,marginTop:5,lineHeight:20},plan:{height:52,borderRadius:RADIUS.md,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},planText:{color:'#fff',fontWeight:'900'},
  bottom:{position:'absolute',left:0,right:0,bottom:0,padding:14,paddingBottom:22,flexDirection:'row',gap:10,backgroundColor:'rgba(255,255,255,.98)',borderTopWidth:1,borderTopColor:COLORS.border},action:{flex:1,height:50,borderRadius:RADIUS.md,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},visited:{backgroundColor:COLORS.visited},outline:{backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border},wish:{backgroundColor:COLORS.wishlist},actionText:{fontWeight:'900'}
});