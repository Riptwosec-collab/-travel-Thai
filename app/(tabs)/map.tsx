import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ThailandMap from '@/components/ThailandMap';
import { PLACES, PROVINCES } from '@/data/catalog';
import { getProvinceInfo } from '@/data/provinceInfo';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';
import { Region } from '@/types';

const REGIONS:(Region|'ทั้งหมด')[]=['ทั้งหมด','ภาคเหนือ','ภาคอีสาน','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];

export default function MapScreen(){
  const router=useRouter();
  const {width}=useWindowDimensions();
  const tablet=width>=760;
  const desktop=width>=1120;
  const [q,setQ]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const {visitedProvinceIds,wishlistProvinceIds,toggleVisitedProvince,toggleWishlistProvince}=useTravelStore();
  const [region,setRegion]=useState<Region|'ทั้งหมด'>('ทั้งหมด');
  const pageIn=useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    Animated.timing(pageIn,{toValue:1,duration:520,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
  },[pageIn]);

  const filtered=useMemo(()=>PROVINCES.filter(p=>(region==='ทั้งหมด'||p.region===region)&&(p.nameTh.includes(q)||p.nameEn.toLowerCase().includes(q.toLowerCase()))),[q,region]);
  const selected=useMemo(()=>selectedId?PROVINCES.find(p=>p.id===selectedId):undefined,[selectedId]);
  const selectedPlaces=useMemo(()=>selectedId?PLACES.filter(p=>p.provinceId===selectedId):[],[selectedId]);
  const selectedInfo=useMemo(()=>selected?getProvinceInfo(selected.nameTh,selected.region,selected.description,selected.bestMonths):undefined,[selected]);
  const selectedVisited=selectedId?visitedProvinceIds.includes(selectedId):false;
  const selectedWish=selectedId?wishlistProvinceIds.includes(selectedId):false;

  const openFullDetail=()=>{
    if(!selectedId)return;
    const id=selectedId;
    setSelectedId(null);
    router.push({pathname:'/province-detail',params:{id}});
  };

  const pageStyle={opacity:pageIn,transform:[{translateY:pageIn.interpolate({inputRange:[0,1],outputRange:[14,0]})}]};

  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Animated.View style={[s.page,pageStyle]}>
        <View style={s.headerRow}>
          <View style={s.headerCopy}>
            <Text style={s.title}>แผนที่เที่ยวไทย</Text>
            <Text style={s.sub}>ชี้จังหวัดเพื่อดูข้อมูลย่อที่ถูกต้องตามพื้นที่ แล้วคลิกเพื่อเปิดข้อมูลจังหวัดเพิ่มเติม</Text>
          </View>
          <View style={[s.stats,tablet&&s.statsTablet]}>
            <Stat n={visitedProvinceIds.length} label="ไปแล้ว" color={COLORS.visited}/>
            <Stat n={wishlistProvinceIds.length} label="อยากไป" color="#E6B851"/>
            <Stat n={77-visitedProvinceIds.length} label="เหลือ" color={COLORS.primary}/>
          </View>
        </View>

        <View style={s.mapShell}>
          <View style={s.mapShellHead}>
            <View style={{flex:1,minWidth:180}}><Text style={s.mapShellTitle}>ประเทศไทย · 77 จังหวัด</Text><Text style={s.mapShellSub}>Hover เพื่อดูข้อมูล · คลิกจังหวัดเพื่อเปิดรายละเอียด</Text></View>
            <View style={s.mapShellBadge}><Ionicons name="navigate-outline" size={14} color={COLORS.primary}/><Text style={s.mapShellBadgeText}>{visitedProvinceIds.length+wishlistProvinceIds.length} สถานะที่บันทึก</Text></View>
          </View>
          <ThailandMap onSelectProvince={setSelectedId}/>
        </View>

        <View style={s.toolbar}>
          <View style={[s.search,desktop&&s.searchWide]}>
            <Ionicons name="search" size={19} color={COLORS.textMuted}/>
            <TextInput value={q} onChangeText={setQ} placeholder="ค้นหาจังหวัด เช่น เชียงใหม่, ระยอง, สงขลา" placeholderTextColor={COLORS.textMuted} style={s.input}/>
            {!!q&&<Pressable onPress={()=>setQ('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={COLORS.textMuted}/></Pressable>}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.regionScroll}>
            {REGIONS.map(r=><MotionPressable key={r} onPress={()=>setRegion(r)} style={[s.chip,region===r&&s.chipActive]}><Text style={[s.chipText,region===r&&s.chipTextActive]}>{r}</Text></MotionPressable>)}
          </ScrollView>
        </View>

        <View style={s.listHead}><View><Text style={s.section}>จังหวัดทั้งหมด</Text><Text style={s.sectionSub}>พบ {filtered.length} จังหวัดตามตัวกรองปัจจุบัน</Text></View><Text style={s.resultCount}>{filtered.length}</Text></View>
        <View style={[s.grid,tablet&&s.gridTablet,desktop&&s.gridDesktop]}>
          {filtered.map(p=>{
            const v=visitedProvinceIds.includes(p.id),w=wishlistProvinceIds.includes(p.id);
            const info=getProvinceInfo(p.nameTh,p.region,p.description,p.bestMonths);
            return <MotionPressable key={p.id} style={s.province} onPress={()=>setSelectedId(p.id)}>
              <View style={[s.status,{backgroundColor:v?COLORS.visited:w?'#E6B851':'#D9E7E8'}]}/>
              <View style={s.provinceBody}>
                <View style={s.provinceHead}><Text style={s.pname}>{p.nameTh}</Text><Text style={s.pen} numberOfLines={1}>{p.nameEn}</Text></View>
                <Text style={s.pregion}>{p.region} · {info.recommendedDays}</Text>
                <Text numberOfLines={1} style={s.psummary}>{info.highlights.slice(0,2).join(' · ')}</Text>
              </View>
              <View style={s.provinceArrow}><Ionicons name="chevron-forward" size={17} color={COLORS.textMuted}/></View>
            </MotionPressable>;
          })}
        </View>
      </Animated.View>
    </ScrollView>

    <Modal transparent visible={!!selected} animationType="fade" onRequestClose={()=>setSelectedId(null)}>
      <View style={s.modalRoot}>
        <Pressable style={s.backdrop} onPress={()=>setSelectedId(null)}/>
        {selected&&selectedInfo&&<View style={s.sheet}>
          <View style={s.sheetHandle}/>
          <View style={s.heroWrap}>
            <Image source={{uri:selected.coverImage}} style={s.heroImage}/>
            <View style={s.heroShade}/>
            <MotionPressable style={s.closeBtn} onPress={()=>setSelectedId(null)}><Ionicons name="close" size={22} color="#fff"/></MotionPressable>
            <View style={s.heroText}>
              <View style={s.regionBadge}><Text style={s.regionBadgeText}>{selected.region}</Text></View>
              <Text style={s.sheetTitle}>{selected.nameTh}</Text>
              <Text style={s.sheetEn}>{selected.nameEn}</Text>
            </View>
          </View>

          <ScrollView style={s.sheetScroll} contentContainerStyle={s.sheetBody} showsVerticalScrollIndicator={false}>
            <Text style={s.description}>{selectedInfo.shortSummary}</Text>

            <View style={s.miniStats}>
              <Mini icon="location" value={`${selectedPlaces.length}`} label="สถานที่ในระบบ"/>
              <Mini icon="time" value={selectedInfo.recommendedDays} label="เวลาที่แนะนำ"/>
              <Mini icon="bookmark" value={selectedVisited?'ไปแล้ว':selectedWish?'อยากไป':'ยังไม่ไป'} label="สถานะ"/>
            </View>

            <InfoBlock icon="sparkles" title="ไฮไลต์" items={selectedInfo.highlights.slice(0,4)}/>
            <InfoBlock icon="compass" title="เหมาะกับ" items={selectedInfo.bestFor.slice(0,3)}/>
            <View style={s.seasonBox}><Ionicons name="calendar" size={18} color={COLORS.primary}/><View style={{flex:1}}><Text style={s.blockTitle}>ช่วงน่าเที่ยว</Text><Text style={s.blockText}>{selectedInfo.seasonNote}</Text></View></View>

            {selectedPlaces.length>0&&<View>
              <Text style={s.recommendTitle}>สถานที่ที่มีข้อมูลแล้ว</Text>
              <View style={s.placeChips}>{selectedPlaces.slice(0,4).map(place=><View key={place.id} style={s.placeChip}><Ionicons name="location" size={13} color={COLORS.primary}/><Text style={s.placeChipText}>{place.name}</Text></View>)}</View>
            </View>}

            <View style={s.actions}>
              <MotionPressable onPress={()=>selectedId&&toggleVisitedProvince(selectedId)} style={[s.actionBtn,selectedVisited&&s.actionVisited]}>
                <Ionicons name={selectedVisited?'checkmark-circle':'checkmark-circle-outline'} size={19} color={selectedVisited?'#fff':COLORS.visited}/><Text style={[s.actionText,selectedVisited&&s.actionTextOn]}>ไปแล้ว</Text>
              </MotionPressable>
              <MotionPressable onPress={()=>selectedId&&toggleWishlistProvince(selectedId)} style={[s.actionBtn,selectedWish&&s.actionWish]}>
                <Ionicons name={selectedWish?'heart':'heart-outline'} size={19} color={selectedWish?'#fff':'#D49C38'}/><Text style={[s.actionText,selectedWish&&s.actionTextOn]}>อยากไป</Text>
              </MotionPressable>
            </View>

            <MotionPressable style={s.detailBtn} onPress={openFullDetail}><Text style={s.detailBtnText}>ดูข้อมูลจังหวัดแบบเต็ม</Text><Ionicons name="arrow-forward" size={18} color="#fff"/></MotionPressable>
          </ScrollView>
        </View>}
      </View>
    </Modal>
  </SafeAreaView>;
}

function Stat({n,label,color}:{n:number;label:string;color:string}){return <View style={s.stat}><View style={[s.statDot,{backgroundColor:color}]}/><View><Text style={s.statN}>{n}</Text><Text style={s.statLabel}>{label}</Text></View></View>}
function Mini({icon,value,label}:{icon:any;value:string;label:string}){return <View style={s.miniStat}><Ionicons name={icon} size={17} color={COLORS.primary}/><Text style={s.miniN}>{value}</Text><Text style={s.miniLabel}>{label}</Text></View>}
function InfoBlock({icon,title,items}:{icon:any;title:string;items:string[]}){return <View style={s.infoBlock}><View style={s.blockHead}><Ionicons name={icon} size={18} color={COLORS.primary}/><Text style={s.blockTitle}>{title}</Text></View><View style={s.bullets}>{items.map(x=><View key={x} style={s.bullet}><View style={s.bulletDot}/><Text style={s.blockText}>{x}</Text></View>)}</View></View>}

function MotionPressable({children,style,onPress}:{children:React.ReactNode;style?:any;onPress:()=>void}){
 const scale=useRef(new Animated.Value(1)).current;
 const lift=useRef(new Animated.Value(0)).current;
 const down=()=>Animated.spring(scale,{toValue:.98,useNativeDriver:true,damping:18,stiffness:260,mass:.4}).start();
 const up=()=>Animated.spring(scale,{toValue:1,useNativeDriver:true,damping:15,stiffness:220,mass:.45}).start();
 const hoverProps=Platform.OS==='web'?({onMouseEnter:()=>Animated.spring(lift,{toValue:1,useNativeDriver:true,damping:18,stiffness:220}).start(),onMouseLeave:()=>Animated.spring(lift,{toValue:0,useNativeDriver:true,damping:18,stiffness:220}).start()} as any):{};
 return <Animated.View {...hoverProps} style={[style,{transform:[{scale},{translateY:lift.interpolate({inputRange:[0,1],outputRange:[0,-2]})}]}]}><Pressable onPress={onPress} onPressIn={down} onPressOut={up} style={s.pressFill}>{children}</Pressable></Animated.View>
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.background},content:{paddingBottom:120},page:{padding:SPACING.lg,gap:18,maxWidth:1440,width:'100%',alignSelf:'center'},pressFill:{width:'100%',height:'100%',flexDirection:'row',alignItems:'center',justifyContent:'center'},
  headerRow:{gap:14},headerCopy:{flex:1,minWidth:240},title:{fontSize:30,fontWeight:'900',color:COLORS.text,letterSpacing:-.45},sub:{color:COLORS.textMuted,lineHeight:21,marginTop:4,maxWidth:720},
  stats:{flexDirection:'row',gap:8,flexWrap:'wrap'},statsTablet:{alignSelf:'flex-start'},stat:{minWidth:116,flex:1,backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:11,borderWidth:1,borderColor:COLORS.border,flexDirection:'row',alignItems:'center',gap:9},statDot:{width:9,height:34,borderRadius:5},statN:{fontSize:20,fontWeight:'900',color:COLORS.text},statLabel:{fontSize:11,color:COLORS.textMuted,marginTop:1},
  mapShell:{backgroundColor:COLORS.surface,borderRadius:RADIUS.lg,padding:10,borderWidth:1,borderColor:COLORS.border},mapShellHead:{paddingHorizontal:6,paddingVertical:5,marginBottom:7,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'},mapShellTitle:{fontSize:16,fontWeight:'900',color:COLORS.text},mapShellSub:{fontSize:10,color:COLORS.textMuted,marginTop:3},mapShellBadge:{minHeight:34,borderRadius:999,backgroundColor:'#EAF7F5',flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10},mapShellBadgeText:{fontSize:10,fontWeight:'800',color:COLORS.primary},
  toolbar:{backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:10,borderWidth:1,borderColor:COLORS.border,gap:9},search:{height:50,borderRadius:RADIUS.md,backgroundColor:COLORS.surface,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:14,borderWidth:1,borderColor:COLORS.border},searchWide:{maxWidth:720},input:{flex:1,color:COLORS.text},regionScroll:{gap:8,paddingRight:8},chip:{borderRadius:999,paddingHorizontal:13,paddingVertical:8,backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border,minHeight:36},chipActive:{backgroundColor:COLORS.dark,borderColor:COLORS.dark},chipText:{color:COLORS.textMuted,fontWeight:'700'},chipTextActive:{color:'#fff'},
  listHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginTop:2},section:{fontSize:20,fontWeight:'900',color:COLORS.text},sectionSub:{fontSize:10,color:COLORS.textMuted,marginTop:3},resultCount:{fontSize:24,fontWeight:'900',color:COLORS.text},grid:{gap:9},gridTablet:{flexDirection:'row',flexWrap:'wrap'},gridDesktop:{gap:10},province:{backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:12,borderWidth:1,borderColor:COLORS.border,minHeight:78,flex:1,minWidth:320},status:{position:'absolute',left:10,top:12,bottom:12,width:8,borderRadius:9},provinceBody:{flex:1,marginLeft:15,marginRight:28},provinceHead:{flexDirection:'row',alignItems:'baseline',gap:7},pname:{fontWeight:'900',fontSize:15,color:COLORS.text},pen:{fontSize:10,color:COLORS.textMuted,flexShrink:1},pregion:{fontSize:11,color:COLORS.primary,fontWeight:'700',marginTop:3},psummary:{fontSize:10,color:COLORS.textMuted,marginTop:4},provinceArrow:{position:'absolute',right:10,width:30,height:30,borderRadius:15,alignItems:'center',justifyContent:'center'},
  modalRoot:{flex:1,justifyContent:'center',alignItems:'center',padding:18},backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(8,20,24,.5)'},sheet:{width:'100%',maxWidth:620,maxHeight:'92%',backgroundColor:COLORS.surface,borderRadius:26,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,.38)',shadowColor:'#08171A',shadowOffset:{width:0,height:18},shadowOpacity:.28,shadowRadius:34,elevation:18},sheetHandle:{position:'absolute',top:9,alignSelf:'center',width:42,height:4,borderRadius:99,backgroundColor:'rgba(255,255,255,.72)',zIndex:4},heroWrap:{height:205,position:'relative'},heroImage:{width:'100%',height:'100%'},heroShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(5,22,24,.38)'},closeBtn:{position:'absolute',top:16,right:16,width:40,height:40,borderRadius:20,backgroundColor:'rgba(4,15,18,.55)'},heroText:{position:'absolute',left:20,right:20,bottom:18},regionBadge:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:5,borderRadius:999,backgroundColor:'rgba(255,255,255,.9)'},regionBadgeText:{fontSize:11,fontWeight:'900',color:COLORS.primary},sheetTitle:{fontSize:32,fontWeight:'900',color:'#fff',marginTop:8},sheetEn:{fontSize:13,color:'rgba(255,255,255,.82)',marginTop:2},sheetScroll:{flexShrink:1},sheetBody:{padding:20,gap:14,paddingBottom:26},description:{fontSize:14,lineHeight:22,color:COLORS.text,fontWeight:'700'},miniStats:{flexDirection:'row',gap:8},miniStat:{flex:1,backgroundColor:COLORS.background,borderRadius:14,padding:10,borderWidth:1,borderColor:COLORS.border,minHeight:82},miniN:{fontSize:13,fontWeight:'900',color:COLORS.text,marginTop:6},miniLabel:{fontSize:10,color:COLORS.textMuted,marginTop:3},infoBlock:{backgroundColor:COLORS.background,borderRadius:15,padding:13,borderWidth:1,borderColor:COLORS.border},blockHead:{flexDirection:'row',alignItems:'center',gap:7},blockTitle:{fontSize:13,fontWeight:'900',color:COLORS.text},bullets:{gap:6,marginTop:8},bullet:{flexDirection:'row',alignItems:'flex-start',gap:7},bulletDot:{width:5,height:5,borderRadius:3,backgroundColor:COLORS.primary,marginTop:7},blockText:{fontSize:12,color:COLORS.textMuted,lineHeight:18,flex:1},seasonBox:{flexDirection:'row',gap:9,backgroundColor:'#EAF7F5',borderRadius:15,padding:13},recommendTitle:{fontSize:14,fontWeight:'900',color:COLORS.text,marginBottom:8},placeChips:{flexDirection:'row',flexWrap:'wrap',gap:7},placeChip:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#EAF7F5',paddingHorizontal:9,paddingVertical:7,borderRadius:999},placeChipText:{fontSize:11,fontWeight:'700',color:'#426C66'},actions:{flexDirection:'row',gap:10},actionBtn:{flex:1,height:48,borderRadius:14,borderWidth:1,borderColor:COLORS.border,backgroundColor:COLORS.surface},actionVisited:{backgroundColor:COLORS.visited,borderColor:COLORS.visited},actionWish:{backgroundColor:'#D7A441',borderColor:'#D7A441'},actionText:{fontWeight:'900',color:COLORS.text,marginLeft:7},actionTextOn:{color:'#fff'},detailBtn:{height:52,borderRadius:15,backgroundColor:COLORS.dark},detailBtnText:{color:'#fff',fontWeight:'900',fontSize:15,marginRight:8},
});