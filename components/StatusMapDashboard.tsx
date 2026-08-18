import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ThailandMap from '@/components/ThailandMap';
import { PLACES, PROVINCES } from '@/data/catalog';
import { getProvinceInfo } from '@/data/provinceInfo';
import { COLORS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';

export type StatusMapMode='visited'|'wishlist';

type Props={mode:StatusMapMode};

const MODE={
  visited:{
    title:'ที่ที่ไปแล้ว',
    subtitle:'เก็บครบทุกความทรงจำจากการเดินทางของคุณ',
    accent:'#58A894',
    accentDark:'#2F806C',
    accentSoft:'#E6F2EE',
    icon:'checkmark-circle' as const,
    countLabel:'ไปแล้ว',
    statTitle:'สถิติการเดินทาง',
    recentTitle:'จังหวัดที่ไปล่าสุด',
    empty:'ยังไม่ได้เลือกจังหวัดที่ไปแล้ว',
    helper:'คลิกจังหวัดบนแผนที่เพื่อบันทึกว่า “ไปแล้ว” คลิกซ้ำเพื่อนำออก',
  },
  wishlist:{
    title:'อยากไป',
    subtitle:'รวมจังหวัดในฝันที่คุณวางแผนจะไปเยือน',
    accent:'#E7B85A',
    accentDark:'#B97A17',
    accentSoft:'#FFF3D8',
    icon:'heart' as const,
    countLabel:'อยากไป',
    statTitle:'สถิติการวางแผน',
    recentTitle:'จังหวัดที่อยากไปล่าสุด',
    empty:'ยังไม่ได้เลือกจังหวัดที่อยากไป',
    helper:'คลิกจังหวัดบนแผนที่เพื่อบันทึกว่า “อยากไป” คลิกซ้ำเพื่อนำออก',
  }
};

const REGIONS=['ภาคเหนือ','ภาคอีสาน','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'] as const;

export default function StatusMapDashboard({mode}:Props){
  const cfg=MODE[mode];
  const router=useRouter();
  const {width}=useWindowDimensions();
  const wide=width>=1100;
  const {
    visitedProvinceIds,wishlistProvinceIds,visitedPlaceIds,wishlistPlaceIds,
    journals,trips,toggleVisitedProvince,toggleWishlistProvince,
  }=useTravelStore();

  const selectedIds=mode==='visited'?visitedProvinceIds:wishlistProvinceIds;
  const selectedPlaceIds=mode==='visited'?visitedPlaceIds:wishlistPlaceIds;
  const toggle=mode==='visited'?toggleVisitedProvince:toggleWishlistProvince;
  const selected=useMemo(()=>PROVINCES.filter(p=>selectedIds.includes(p.id)),[selectedIds]);
  const recent=useMemo(()=>selectedIds.slice(-5).reverse().map(id=>PROVINCES.find(p=>p.id===id)).filter(Boolean) as typeof PROVINCES,[selectedIds]);
  const pct=Math.round((selectedIds.length/77)*1000)/10;

  const regionStats=useMemo(()=>REGIONS.map(region=>{
    const total=PROVINCES.filter(p=>p.region===region).length;
    const chosen=PROVINCES.filter(p=>p.region===region&&selectedIds.includes(p.id)).length;
    return {region,total,chosen};
  }),[selectedIds]);

  const uniqueHighlights=useMemo(()=>{
    const found:string[]=[];
    selected.slice(0,8).forEach(p=>{
      const info=getProvinceInfo(p.nameTh,p.region,p.description,p.bestMonths);
      info.highlights.slice(0,2).forEach(x=>{if(!found.includes(x))found.push(x)});
    });
    return found.slice(0,6);
  },[selected]);

  const handleProvince=(id:string)=>toggle(id);

  return <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
    <View style={s.headingRow}>
      <View style={{flex:1}}>
        <Text style={s.title}>{cfg.title}</Text>
        <Text style={s.subtitle}>{cfg.subtitle}</Text>
      </View>
      <View style={s.helperPill}>
        <Ionicons name="navigate-outline" size={16} color={cfg.accentDark}/>
        <Text style={s.helperText}>{cfg.helper}</Text>
      </View>
    </View>

    <View style={[s.dashboard,wide?s.dashboardWide:s.dashboardStack]}>
      <View style={[s.mapCard,wide&&s.mapCardWide]}>
        <View style={s.mapHeader}>
          <View>
            <Text style={s.mapTitle}>แผนที่ประเทศไทย 77 จังหวัด</Text>
            <Text style={s.mapSub}>เลือกได้โดยตรงจากพื้นที่จังหวัด สีจะถูกบันทึกค้างไว้ในเครื่อง</Text>
          </View>
          <View style={[s.liveBadge,{backgroundColor:cfg.accentSoft}]}>
            <View style={[s.liveDot,{backgroundColor:cfg.accent}]}/>
            <Text style={[s.liveText,{color:cfg.accentDark}]}>{selectedIds.length} จังหวัดที่เลือก</Text>
          </View>
        </View>
        <ThailandMap onSelectProvince={handleProvince} mode={mode} compact/>
      </View>

      <View style={[s.side,wide?s.sideWide:s.sideStack]}>
        <View style={s.summaryCard}>
          <View style={s.summaryTop}>
            <View style={[s.summaryIcon,{backgroundColor:cfg.accentSoft}]}>
              <Ionicons name={cfg.icon} size={30} color={cfg.accentDark}/>
            </View>
            <View style={{flex:1}}>
              <Text style={s.summaryLabel}>{cfg.countLabel}</Text>
              <View style={s.countRow}><Text style={s.summaryCount}>{selectedIds.length}</Text><Text style={s.summaryUnit}>จังหวัด</Text></View>
            </View>
          </View>
          <View style={s.progressMeta}><Text style={s.metaText}>จากทั้งหมด 77 จังหวัด</Text><Text style={s.metaStrong}>{pct}%</Text></View>
          <View style={s.progress}><View style={[s.progressFill,{width:`${Math.max(1,pct)}%`,backgroundColor:cfg.accent}]}/></View>
        </View>

        <View style={s.panel}>
          <Text style={s.panelTitle}>{cfg.statTitle}</Text>
          <View style={s.quickGrid}>
            <QuickStat icon="map-outline" n={selectedIds.length} label="จังหวัด" color={cfg.accentDark} soft={cfg.accentSoft}/>
            <QuickStat icon="location-outline" n={selectedPlaceIds.length} label={mode==='visited'?'สถานที่ที่ไป':'สถานที่ที่สนใจ'} color="#387C75" soft="#E7F2F0"/>
            <QuickStat icon={mode==='visited'?'book-outline':'calendar-outline'} n={mode==='visited'?journals.length:trips.length} label={mode==='visited'?'บันทึก':'ทริปที่วางแผน'} color="#B07B24" soft="#FFF3DB"/>
          </View>
        </View>

        <View style={s.panel}>
          <View style={s.panelTitleRow}><Text style={s.panelTitle}>ตามภูมิภาค</Text><Text style={s.tinyMuted}>{selectedIds.length}/77</Text></View>
          <View style={s.regionGrid}>
            {regionStats.map(x=><View key={x.region} style={s.regionItem}>
              <Text style={s.regionName}>{x.region}</Text>
              <Text style={s.regionCount}>{x.chosen} / {x.total}</Text>
              <View style={s.regionBar}><View style={[s.regionFill,{width:`${x.total?x.chosen/x.total*100:0}%`,backgroundColor:cfg.accent}]}/></View>
            </View>)}
          </View>
        </View>

        {uniqueHighlights.length>0&&<View style={s.panel}>
          <Text style={s.panelTitle}>{mode==='visited'?'ไฮไลต์จากจังหวัดที่ไป':'ไอเดียจากจังหวัดที่เลือก'}</Text>
          <View style={s.tags}>{uniqueHighlights.map(x=><View key={x} style={[s.tag,{backgroundColor:cfg.accentSoft}]}><Text style={[s.tagText,{color:cfg.accentDark}]}>{x}</Text></View>)}</View>
        </View>}

        <View style={s.panel}>
          <View style={s.panelTitleRow}><Text style={s.panelTitle}>{cfg.recentTitle}</Text><Pressable onPress={()=>router.push('/(tabs)/map')}><Text style={[s.link,{color:cfg.accentDark}]}>เปิดแผนที่หลัก</Text></Pressable></View>
          {recent.length?recent.map((p,index)=><Pressable key={p.id} style={[s.recent,index>0&&s.recentBorder]} onPress={()=>router.push({pathname:'/province-detail',params:{id:p.id}})}>
            <View style={[s.recentIcon,{backgroundColor:cfg.accentSoft}]}><Ionicons name={cfg.icon} size={17} color={cfg.accentDark}/></View>
            <View style={{flex:1}}><Text style={s.recentName}>{p.nameTh}</Text><Text style={s.recentMeta}>{p.region} · {p.nameEn}</Text></View>
            <Ionicons name="chevron-forward" size={17} color={COLORS.textMuted}/>
          </Pressable>):<View style={s.empty}><Ionicons name="map-outline" size={24} color={cfg.accent}/><Text style={s.emptyText}>{cfg.empty}</Text></View>}
        </View>
      </View>
    </View>

    <View style={s.footerCard}>
      <View style={{flex:1}}><Text style={s.footerTitle}>วิธีใช้งาน</Text><Text style={s.footerText}>ชี้เพื่อดูข้อมูลจังหวัด · คลิกหนึ่งครั้งเพื่อเลือก · คลิกซ้ำเพื่อยกเลิก สถานะจะถูกเก็บอัตโนมัติและแสดงตรงกันทุกหน้า</Text></View>
      <Pressable style={[s.footerBtn,{backgroundColor:cfg.accentDark}]} onPress={()=>router.push('/(tabs)/map')}><Text style={s.footerBtnText}>ดูแผนที่ทั้งหมด</Text><Ionicons name="arrow-forward" size={17} color="#fff"/></Pressable>
    </View>
  </ScrollView>
}

function QuickStat({icon,n,label,color,soft}:{icon:any;n:number;label:string;color:string;soft:string}){
  return <View style={s.quick}><View style={[s.quickIcon,{backgroundColor:soft}]}><Ionicons name={icon} size={19} color={color}/></View><Text style={s.quickN}>{n}</Text><Text style={s.quickLabel}>{label}</Text></View>
}

const s=StyleSheet.create({
  page:{padding:SPACING.lg,paddingBottom:130,gap:18,maxWidth:1540,width:'100%',alignSelf:'center'},
  headingRow:{flexDirection:'row',alignItems:'center',gap:16,flexWrap:'wrap'},title:{fontSize:31,fontWeight:'900',color:COLORS.text,letterSpacing:-.5},subtitle:{fontSize:14,color:COLORS.textMuted,marginTop:4},
  helperPill:{maxWidth:560,minHeight:42,flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:14,paddingVertical:9,backgroundColor:'rgba(255,255,255,.9)',borderWidth:1,borderColor:COLORS.border,borderRadius:999},helperText:{fontSize:12,color:COLORS.textMuted,fontWeight:'700',flexShrink:1},
  dashboard:{gap:18,alignItems:'stretch'},dashboardWide:{flexDirection:'row'},dashboardStack:{flexDirection:'column'},
  mapCard:{backgroundColor:'rgba(255,255,255,.74)',borderWidth:1,borderColor:COLORS.border,borderRadius:28,padding:14,...SHADOW},mapCardWide:{flex:1,minWidth:0},mapHeader:{paddingHorizontal:7,paddingVertical:5,marginBottom:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'},mapTitle:{fontSize:17,fontWeight:'900',color:COLORS.text},mapSub:{fontSize:11,color:COLORS.textMuted,marginTop:3},liveBadge:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,paddingVertical:7,borderRadius:999},liveDot:{width:7,height:7,borderRadius:4},liveText:{fontSize:11,fontWeight:'900'},
  side:{gap:12},sideWide:{width:360},sideStack:{width:'100%'},summaryCard:{backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border,borderRadius:24,padding:18,...SHADOW},summaryTop:{flexDirection:'row',alignItems:'center',gap:13},summaryIcon:{width:62,height:62,borderRadius:31,alignItems:'center',justifyContent:'center'},summaryLabel:{fontSize:13,color:COLORS.textMuted,fontWeight:'800'},countRow:{flexDirection:'row',alignItems:'baseline',gap:7},summaryCount:{fontSize:40,fontWeight:'900',color:COLORS.text},summaryUnit:{fontSize:13,color:COLORS.textMuted,fontWeight:'700'},progressMeta:{flexDirection:'row',justifyContent:'space-between',marginTop:16},metaText:{fontSize:11,color:COLORS.textMuted},metaStrong:{fontSize:11,color:COLORS.text,fontWeight:'900'},progress:{height:8,borderRadius:99,backgroundColor:'#EDF1F0',overflow:'hidden',marginTop:8},progressFill:{height:'100%',borderRadius:99},
  panel:{backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border,borderRadius:22,padding:16},panelTitle:{fontSize:14,fontWeight:'900',color:COLORS.text},panelTitleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},tinyMuted:{fontSize:10,color:COLORS.textMuted},
  quickGrid:{flexDirection:'row',gap:8,marginTop:12},quick:{flex:1,minHeight:104,borderWidth:1,borderColor:COLORS.border,borderRadius:16,alignItems:'center',justifyContent:'center',padding:8},quickIcon:{width:34,height:34,borderRadius:12,alignItems:'center',justifyContent:'center'},quickN:{fontSize:21,fontWeight:'900',color:COLORS.text,marginTop:5},quickLabel:{fontSize:9,color:COLORS.textMuted,textAlign:'center',marginTop:2},
  regionGrid:{gap:9,marginTop:12},regionItem:{gap:4},regionName:{fontSize:11,fontWeight:'800',color:COLORS.text},regionCount:{position:'absolute',right:0,top:0,fontSize:10,color:COLORS.textMuted,fontWeight:'700'},regionBar:{height:5,borderRadius:99,backgroundColor:'#EDF2F1',overflow:'hidden'},regionFill:{height:'100%',borderRadius:99},
  tags:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:11},tag:{paddingHorizontal:9,paddingVertical:6,borderRadius:999},tagText:{fontSize:10,fontWeight:'800'},
  recent:{minHeight:54,flexDirection:'row',alignItems:'center',gap:10,paddingVertical:9},recentBorder:{borderTopWidth:1,borderTopColor:'#EEF2F3'},recentIcon:{width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center'},recentName:{fontSize:13,fontWeight:'900',color:COLORS.text},recentMeta:{fontSize:10,color:COLORS.textMuted,marginTop:2},link:{fontSize:10,fontWeight:'900'},empty:{alignItems:'center',gap:7,paddingVertical:20},emptyText:{fontSize:12,color:COLORS.textMuted,textAlign:'center'},
  footerCard:{backgroundColor:'#FBFDFC',borderWidth:1,borderColor:COLORS.border,borderRadius:22,padding:16,flexDirection:'row',alignItems:'center',gap:14,flexWrap:'wrap'},footerTitle:{fontSize:14,fontWeight:'900',color:COLORS.text},footerText:{fontSize:11,color:COLORS.textMuted,lineHeight:17,marginTop:3},footerBtn:{minHeight:42,borderRadius:14,paddingHorizontal:15,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},footerBtnText:{color:'#fff',fontSize:12,fontWeight:'900'},
});