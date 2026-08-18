import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { PLACES, PROVINCES } from '@/data/catalog';
import { GLASS, glassSurface } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';
import { Region } from '@/types';
import { GlassCard, GlassCircleButton, GlassHeader, GlassPageEnter, GlassPressable, GlassProgress, GlassScreen, GlassSection } from '@/components/glass';

const REGIONS:Region[]=['ภาคเหนือ','ภาคอีสาน','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];

export default function Analytics(){
 const router=useRouter();
 const {width}=useWindowDimensions();
 const wide=width>=980;
 const {visitedProvinceIds,visitedPlaceIds,trips,journals,wishlistPlaceIds}=useTravelStore();
 const regionData=useMemo(()=>REGIONS.map(r=>{const total=PROVINCES.filter(p=>p.region===r).length;const visited=PROVINCES.filter(p=>p.region===r&&visitedProvinceIds.includes(p.id)).length;return {r,total,visited,pct:Math.round(visited/total*100)}}),[visitedProvinceIds]);
 const categories=useMemo(()=>{const count:Record<string,number>={};PLACES.filter(p=>visitedPlaceIds.includes(p.id)).forEach(p=>count[p.category]=(count[p.category]||0)+1);return Object.entries(count).sort((a,b)=>b[1]-a[1]);},[visitedPlaceIds]);
 const expense=journals.reduce((sum,j)=>sum+j.expense,0);
 const overall=Math.round(visitedProvinceIds.length/77*100);
 const totalDays=trips.reduce((sum,t)=>sum+Math.max(1,t.days?.length||1),0);
 const monthly=useMemo(()=>{
  const now=new Date();
  return Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);const y=d.getFullYear(),m=d.getMonth();const count=trips.filter(t=>{const x=new Date(t.startDate);return x.getFullYear()===y&&x.getMonth()===m}).length;return {label:d.toLocaleString('th-TH',{month:'short'}),count}})
 },[trips]);
 const maxMonthly=Math.max(1,...monthly.map(x=>x.count));
 const points=monthly.map((x,i)=>`${20+i*52},${100-(x.count/maxMonthly)*72}`).join(' ');
 const topCategory=categories[0]?.[0]||'ยังไม่มีข้อมูล';
 const background=PLACES.find(x=>x.category==='ทะเล')?.image||PROVINCES[0].coverImage;

 return <GlassScreen image={background}>
  <SafeAreaView style={s.safe}>
   <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
    <View style={[s.page,wide&&s.pageWide]}>
     <GlassPageEnter><GlassHeader eyebrow="TRAVEL ANALYTICS · YOUR JOURNEY" title="สถิติการเดินทาง" subtitle="ภาพรวมจังหวัด ทริป หมวดที่ชอบ และค่าใช้จ่ายจากข้อมูลจริงของคุณ" right={<GlassCircleButton icon="chevron-back" label="กลับ" onPress={()=>router.back()}/>}/></GlassPageEnter>

     <GlassPageEnter delay={70}>
      <GlassCard strong style={s.hero}>
       <View style={s.heroCopy}><Text style={s.heroLabel}>ประเทศไทยที่คุณสำรวจแล้ว</Text><View style={s.heroValueRow}><Text style={s.heroValue}>{visitedProvinceIds.length}</Text><Text style={s.heroSlash}> / 77</Text><Text style={s.heroUnit}> จังหวัด</Text></View><Text style={s.heroSub}>{overall}% ของประเทศไทย · เป้าหมายต่อไป {Math.max(0,77-visitedProvinceIds.length)} จังหวัด</Text><View style={{marginTop:15}}><GlassProgress value={overall} height={8}/></View></View>
       <Donut value={overall}/>
      </GlassCard>
     </GlassPageEnter>

     <GlassPageEnter delay={110}><View style={s.metrics}><Metric icon="location" value={visitedPlaceIds.length} label="สถานที่ไปแล้ว"/><Metric icon="airplane" value={trips.length} label="Trip ทั้งหมด"/><Metric icon="calendar" value={totalDays} label="วันเดินทาง"/><Metric icon="wallet" value={expense.toLocaleString()} label="ค่าใช้จ่าย (บาท)"/></View></GlassPageEnter>

     <View style={[s.dashboard,wide&&s.dashboardWide]}>
      <View style={s.mainCol}>
       <GlassPageEnter delay={150}><GlassSection title="Travel Timeline" subtitle="จำนวนทริป 6 เดือนล่าสุด"/><GlassCard style={s.chartCard}><View style={s.chartTop}><View><Text style={s.chartValue}>{trips.length}</Text><Text style={s.chartLabel}>ทริปที่บันทึกทั้งหมด</Text></View><View style={s.chartBadge}><Ionicons name="trending-up" size={14} color={GLASS.aqua}/><Text style={s.chartBadgeText}>6 MONTHS</Text></View></View><Svg width="100%" height="120" viewBox="0 0 300 120"><Polyline points={points} fill="none" stroke={GLASS.aqua} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>{monthly.map((x,i)=><Circle key={i} cx={20+i*52} cy={100-(x.count/maxMonthly)*72} r="5" fill={GLASS.white} stroke={GLASS.aqua} strokeWidth="3"/>)}</Svg><View style={s.months}>{monthly.map(x=><Text key={x.label} style={s.month}>{x.label}</Text>)}</View></GlassCard></GlassPageEnter>

       <GlassPageEnter delay={190}><GlassSection title="ความคืบหน้าตามภาค" subtitle="Region progress"/><GlassCard style={s.regionCard}>{regionData.map(x=><View key={x.r} style={s.region}><View style={s.regionRow}><Text style={s.regionName}>{x.r}</Text><Text style={s.regionCount}>{x.visited}/{x.total} · {x.pct}%</Text></View><GlassProgress value={x.pct} height={6}/></View>)}</GlassCard></GlassPageEnter>
      </View>

      <View style={[s.sideCol,wide&&s.sideColWide]}>
       <GlassPageEnter delay={170}><GlassCard style={s.insight}><Text style={s.insightEyebrow}>TOP CATEGORY</Text><Text style={s.insightTitle}>{topCategory}</Text><Text style={s.insightText}>หมวดสถานที่ที่คุณทำเครื่องหมายว่าไปแล้วบ่อยที่สุด</Text><CategoryRing categories={categories}/></GlassCard></GlassPageEnter>
       <GlassPageEnter delay={210}><GlassSection title="หมวดที่เที่ยวบ่อย" subtitle="Visited categories"/><GlassCard style={s.categoryCard}>{categories.length?categories.slice(0,6).map(([cat,n],i)=><View key={cat} style={s.cat}><View style={s.rank}><Text style={s.rankText}>{i+1}</Text></View><Text style={s.catName}>{cat}</Text><Text style={s.catN}>{n} ที่</Text></View>):<Text style={s.muted}>ทำเครื่องหมายสถานที่ว่า “ไปแล้ว” เพื่อเริ่มสร้างสถิติหมวดที่ชอบ</Text>}</GlassCard></GlassPageEnter>
      </View>
     </View>

     <GlassPageEnter delay={250}><GlassSection title="Achievements" subtitle="Travel milestones"/><View style={s.badges}><Badge icon="compass" title="นักสำรวจ" unlocked={visitedProvinceIds.length>=5}/><Badge icon="heart" title="นักวางฝัน" unlocked={wishlistPlaceIds.length>=5}/><Badge icon="book" title="นักบันทึก" unlocked={journals.length>=3}/><Badge icon="map" title="ครบทุกภาค" unlocked={REGIONS.every(r=>regionData.find(x=>x.r===r)!.visited>0)}/></View></GlassPageEnter>
    </View>
   </ScrollView>
  </SafeAreaView>
 </GlassScreen>
}

function Metric({icon,value,label}:{icon:any;value:any;label:string}){return <GlassCard style={s.metric}><View style={s.metricIcon}><Ionicons name={icon} size={19} color={GLASS.white}/></View><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text></GlassCard>}
function Donut({value}:{value:number}){const c=2*Math.PI*36;return <View style={s.donut}><Svg width="96" height="96" viewBox="0 0 96 96"><Circle cx="48" cy="48" r="36" stroke="rgba(255,255,255,.16)" strokeWidth="8" fill="none"/><Circle cx="48" cy="48" r="36" stroke={GLASS.gold} strokeWidth="8" fill="none" strokeDasharray={`${c*value/100} ${c}`} strokeLinecap="round" rotation="-90" origin="48,48"/></Svg><View style={s.donutCenter}><Text style={s.donutValue}>{value}%</Text><Text style={s.donutLabel}>EXPLORED</Text></View></View>}
function CategoryRing({categories}:{categories:[string,number][]}){const total=Math.max(1,categories.reduce((s,[,n])=>s+n,0)),top=categories[0]?.[1]||0,pct=Math.round(top/total*100);return <View style={s.categoryRing}><Donut value={pct}/><View style={{flex:1}}><Text style={s.categoryRingValue}>{top}</Text><Text style={s.categoryRingLabel}>สถานที่ในหมวดอันดับ 1</Text></View></View>}
function Badge({icon,title,unlocked}:{icon:any;title:string;unlocked:boolean}){return <GlassCard style={[s.badge,!unlocked&&s.locked]}><View style={s.badgeIcon}><Ionicons name={icon} size={23} color={unlocked?GLASS.gold:'rgba(255,255,255,.42)'}/></View><Text style={s.badgeTitle}>{title}</Text><Text style={s.badgeState}>{unlocked?'ปลดล็อกแล้ว':'ยังไม่ปลดล็อก'}</Text></GlassCard>}

const s=StyleSheet.create({
 safe:{flex:1},scroll:{paddingBottom:80},page:{width:'100%',maxWidth:1320,alignSelf:'center',padding:16,gap:17},pageWide:{paddingHorizontal:28},
 hero:{minHeight:180,padding:20,flexDirection:'row',alignItems:'center',gap:18},heroCopy:{flex:1,minWidth:220},heroLabel:{fontSize:10,fontWeight:'900',letterSpacing:.6,color:GLASS.gold},heroValueRow:{flexDirection:'row',alignItems:'baseline',marginTop:6},heroValue:{fontSize:46,fontWeight:'900',color:GLASS.white,letterSpacing:-1.4},heroSlash:{fontSize:22,fontWeight:'800',color:'rgba(255,255,255,.75)'},heroUnit:{fontSize:10,fontWeight:'900',color:'rgba(255,255,255,.62)',marginLeft:4},heroSub:{fontSize:10,color:'rgba(255,255,255,.66)',marginTop:4},donut:{width:96,height:96,alignItems:'center',justifyContent:'center'},donutCenter:{position:'absolute',alignItems:'center'},donutValue:{fontSize:16,fontWeight:'900',color:GLASS.white},donutLabel:{fontSize:6,fontWeight:'900',letterSpacing:.7,color:'rgba(255,255,255,.55)',marginTop:2},
 metrics:{flexDirection:'row',flexWrap:'wrap',gap:9},metric:{flex:1,minWidth:145,padding:12},metricIcon:{width:36,height:36,borderRadius:13,backgroundColor:'rgba(255,255,255,.10)',alignItems:'center',justifyContent:'center'},metricValue:{fontSize:20,fontWeight:'900',color:GLASS.white,marginTop:7},metricLabel:{fontSize:8,fontWeight:'800',color:'rgba(255,255,255,.60)',marginTop:2},
 dashboard:{gap:16},dashboardWide:{flexDirection:'row',alignItems:'flex-start'},mainCol:{flex:1,gap:16},sideCol:{gap:16},sideColWide:{width:350},chartCard:{padding:14,marginTop:8},chartTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},chartValue:{fontSize:25,fontWeight:'900',color:GLASS.white},chartLabel:{fontSize:8,color:'rgba(255,255,255,.58)',marginTop:2},chartBadge:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(255,255,255,.09)',borderWidth:1,borderColor:'rgba(255,255,255,.16)',paddingHorizontal:8,paddingVertical:5,borderRadius:999},chartBadgeText:{fontSize:7,fontWeight:'900',letterSpacing:.7,color:GLASS.white},months:{flexDirection:'row',justifyContent:'space-between'},month:{fontSize:8,fontWeight:'800',color:'rgba(255,255,255,.54)'},
 regionCard:{padding:14,gap:12,marginTop:8},region:{gap:6},regionRow:{flexDirection:'row',justifyContent:'space-between',gap:10},regionName:{fontSize:10,fontWeight:'900',color:GLASS.white},regionCount:{fontSize:8,color:'rgba(255,255,255,.60)'},
 insight:{padding:14},insightEyebrow:{fontSize:8,fontWeight:'900',letterSpacing:1,color:GLASS.gold},insightTitle:{fontSize:22,fontWeight:'900',color:GLASS.white,marginTop:5},insightText:{fontSize:9,lineHeight:15,color:'rgba(255,255,255,.62)',marginTop:4},categoryRing:{flexDirection:'row',alignItems:'center',gap:12,marginTop:12},categoryRingValue:{fontSize:22,fontWeight:'900',color:GLASS.white},categoryRingLabel:{fontSize:8,color:'rgba(255,255,255,.58)',marginTop:2},categoryCard:{padding:13,gap:10,marginTop:8},cat:{flexDirection:'row',alignItems:'center',gap:8},rank:{width:29,height:29,borderRadius:10,backgroundColor:'rgba(255,255,255,.10)',alignItems:'center',justifyContent:'center'},rankText:{fontSize:9,fontWeight:'900',color:GLASS.gold},catName:{flex:1,fontSize:10,fontWeight:'900',color:GLASS.white},catN:{fontSize:8,color:'rgba(255,255,255,.58)'},muted:{fontSize:9,lineHeight:15,color:'rgba(255,255,255,.60)'},
 badges:{flexDirection:'row',flexWrap:'wrap',gap:9,marginTop:8},badge:{flex:1,minWidth:145,padding:13},locked:{opacity:.54},badgeIcon:{width:40,height:40,borderRadius:14,backgroundColor:'rgba(255,255,255,.09)',alignItems:'center',justifyContent:'center'},badgeTitle:{fontSize:11,fontWeight:'900',color:GLASS.white,marginTop:8},badgeState:{fontSize:8,color:'rgba(255,255,255,.56)',marginTop:2},
});
