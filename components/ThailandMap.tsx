import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { G, Path } from 'react-native-svg';
import { PLACES, PROVINCES } from '@/data/catalog';
import { getProvinceInfo } from '@/data/provinceInfo';
import { COLORS, RADIUS } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';

const GEO_URL='https://raw.githubusercontent.com/chingchai/OpenGISData-Thailand/master/provinces.geojson';
const CACHE='travel-thai-provinces-geojson-v1';
const W=600,H=850;

type Feature={type:'Feature';properties:Record<string,any>;geometry:{type:'Polygon'|'MultiPolygon';coordinates:any}};
type FC={type:'FeatureCollection';features:Feature[]};
type PreparedProvince={id:string;nameTh:string;nameEn:string;area:number|null;d:string};
export type ThailandMapMode='all'|'visited'|'wishlist';

type Props={
  onSelectProvince:(provinceId:string)=>void;
  mode?:ThailandMapMode;
  compact?:boolean;
  showLegend?:boolean;
};

const normalize=(v:any)=>String(v??'').trim().replace(/^จังหวัด/,'').replace(/\s+/g,'');
const thaiName=(p:Record<string,any>)=>String(
  p.pro_th||p.PRO_TH||p.PROV_NAM_T||p.prov_nam_t||p.NAME_TH||p.name_th||p.provinceNameTh||p.NAME_1||p.name||''
).trim();
const englishName=(p:Record<string,any>)=>String(p.pro_en||p.PRO_EN||p.NAME_1||p.name_en||'').trim();
const areaSqKm=(p:Record<string,any>)=>Number.isFinite(Number(p.area_sqkm))?Number(p.area_sqkm):null;
const rings=(f:Feature):number[][][]=>f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates.flat();

export default function ThailandMap({onSelectProvince,mode='all',compact=false,showLegend=true}:Props){
  const {width}=useWindowDimensions();
  const [data,setData]=useState<FC|null>(null);
  const [error,setError]=useState('');
  const [zoom,setZoom]=useState(1);
  const [hoveredId,setHoveredId]=useState<string|null>(null);
  const tooltipAnim=useRef(new Animated.Value(0)).current;
  const mapEnter=useRef(new Animated.Value(0)).current;
  const {visitedProvinceIds,wishlistProvinceIds}=useTravelStore();
  const mapHeight=compact?(width<700?520:700):(width<700?500:620);

  useEffect(()=>{(async()=>{
    try{
      const cached=await AsyncStorage.getItem(CACHE);
      if(cached)setData(JSON.parse(cached));
      const r=await fetch(GEO_URL);
      if(!r.ok)throw new Error(String(r.status));
      const j=await r.json();
      setData(j);
      await AsyncStorage.setItem(CACHE,JSON.stringify(j));
    }catch(e){
      setData(current=>{
        if(!current)setError('โหลดขอบเขตจังหวัดไม่สำเร็จ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่');
        return current;
      });
    }
  })()},[]);

  useEffect(()=>{
    if(data)Animated.timing(mapEnter,{toValue:1,duration:420,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
  },[data,mapEnter]);

  useEffect(()=>{
    Animated.timing(tooltipAnim,{toValue:hoveredId?1:0,duration:hoveredId?180:120,easing:Easing.out(Easing.quad),useNativeDriver:true}).start();
  },[hoveredId,tooltipAnim]);

  const prepared=useMemo<PreparedProvince[]|null>(()=>{
    if(!data)return null;
    let minX=999,maxX=-999,minY=999,maxY=-999;
    data.features.forEach(f=>rings(f).forEach(r=>r.forEach(([x,y])=>{
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    })));
    const pad=18;
    const sx=(W-pad*2)/(maxX-minX),sy=(H-pad*2)/(maxY-minY),scale=Math.min(sx,sy);
    const px=(x:number)=>pad+(x-minX)*scale+(W-pad*2-(maxX-minX)*scale)/2;
    const py=(y:number)=>H-pad-(y-minY)*scale-(H-pad*2-(maxY-minY)*scale)/2;

    return data.features.flatMap((f)=>{
      const sourceName=thaiName(f.properties);
      const key=normalize(sourceName);
      const province=PROVINCES.find(p=>normalize(p.nameTh)===key);
      if(!province){
        if(__DEV__)console.warn('[ThailandMap] Unmatched GeoJSON province:',sourceName,f.properties);
        return [];
      }
      const d=rings(f).map(r=>r.map(([x,y],j)=>`${j?'L':'M'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ')+' Z').join(' ');
      return [{id:province.id,nameTh:province.nameTh,nameEn:englishName(f.properties)||province.nameEn,area:areaSqKm(f.properties),d}];
    });
  },[data]);

  const hoveredProvince=useMemo(()=>hoveredId?PROVINCES.find(p=>p.id===hoveredId):undefined,[hoveredId]);
  const hoveredPrepared=useMemo(()=>hoveredId?prepared?.find(p=>p.id===hoveredId):undefined,[hoveredId,prepared]);
  const hoveredPlaceCount=useMemo(()=>hoveredId?PLACES.filter(p=>p.provinceId===hoveredId).length:0,[hoveredId]);
  const hoveredInfo=useMemo(()=>hoveredProvince?getProvinceInfo(hoveredProvince.nameTh,hoveredProvince.region,hoveredProvince.description,hoveredProvince.bestMonths):undefined,[hoveredProvince]);

  const isVisited=(id:string)=>visitedProvinceIds.includes(id);
  const isWish=(id:string)=>wishlistProvinceIds.includes(id);
  const hoveredStatus=hoveredId
    ? mode==='visited' ? (isVisited(hoveredId)?'เลือกแล้ว':'คลิกเพื่อเพิ่ม')
    : mode==='wishlist' ? (isWish(hoveredId)?'เลือกแล้ว':'คลิกเพื่อเพิ่ม')
    : isVisited(hoveredId)?'ไปแล้ว':isWish(hoveredId)?'อยากไป':'ยังไม่ไป'
    : '';

  const palette=mode==='visited'
    ? {active:'#58A894',hover:'#7FC0AF',stroke:'#4E9786',hint:'คลิกจังหวัดเพื่อเพิ่ม/นำออกจาก “ที่ที่ไปแล้ว”'}
    : mode==='wishlist'
      ? {active:'#E7B85A',hover:'#F1CC83',stroke:'#C99334',hint:'คลิกจังหวัดเพื่อเพิ่ม/นำออกจาก “อยากไป”'}
      : {active:COLORS.visited,hover:'#37C8B4',stroke:'#086E68',hint:'ชี้จังหวัดเพื่อดูข้อมูลย่อ · คลิกเพื่อเปิดข้อมูลเพิ่มเติม'};

  if(!prepared&&!error)return <View style={[s.loading,{height:compact?(width<700?480:560):420}]}><ActivityIndicator color={COLORS.primary}/><Text style={s.muted}>กำลังโหลดแผนที่ 77 จังหวัด…</Text></View>;
  if(!prepared)return <View style={[s.loading,{height:compact?(width<700?480:560):420}]}><Text style={s.error}>{error}</Text></View>;

  return <Animated.View style={[s.wrap,compact&&s.wrapCompact,{height:mapHeight,opacity:mapEnter,transform:[{scale:mapEnter.interpolate({inputRange:[0,1],outputRange:[.992,1]})}]}]}>
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <G origin={`${W/2},${H/2}`} scale={zoom}>
        {prepared.map(p=>{
          const visited=isVisited(p.id);
          const wish=isWish(p.id);
          const active=mode==='visited'?visited:mode==='wishlist'?wish:(visited||wish);
          const hovered=hoveredId===p.id;
          let fill='#D7ECE8';
          if(mode==='visited') fill=active?palette.active:'#E3F0ED';
          else if(mode==='wishlist') fill=active?palette.active:'#EEF4F0';
          else fill=visited?COLORS.visited:wish?'#F0C96B':'#D7ECE8';
          if(hovered) fill=active?palette.active:palette.hover;
          const stroke=hovered?palette.stroke:active?'#FFFFFF':'#78AFA7';
          const hoverProps=Platform.OS==='web'?({
            onMouseEnter:()=>setHoveredId(p.id),
            onMouseLeave:()=>setHoveredId(current=>current===p.id?null:current),
            style:{cursor:'pointer'},
          } as any):{};
          return <Path
            key={p.id}
            d={p.d}
            fill={fill}
            stroke={stroke}
            strokeWidth={hovered?2.2:active?1.35:.75}
            onPress={()=>onSelectProvince(p.id)}
            {...hoverProps}
          />;
        })}
      </G>
    </Svg>

    {hoveredProvince&&Platform.OS==='web'&&(
      <Animated.View pointerEvents="none" style={[s.tooltip,{opacity:tooltipAnim,transform:[{translateY:tooltipAnim.interpolate({inputRange:[0,1],outputRange:[5,0]})},{scale:tooltipAnim.interpolate({inputRange:[0,1],outputRange:[.985,1]})}]}]}>
        <View style={s.tooltipTop}>
          <View style={[s.tooltipDot,{backgroundColor:mode==='wishlist'?'#E7B85A':mode==='visited'?'#58A894':'#37C8B4'}]}/>
          <View style={{flex:1}}>
            <Text style={s.tooltipTitle}>{hoveredProvince.nameTh}</Text>
            <Text style={s.tooltipEn}>{hoveredPrepared?.nameEn||hoveredProvince.nameEn}</Text>
          </View>
          <View style={[s.statusPill,mode==='wishlist'&&s.statusWish,mode==='visited'&&s.statusVisited]}><Text style={s.statusPillText}>{hoveredStatus}</Text></View>
        </View>
        <Text style={s.tooltipRegion}>{hoveredProvince.region}</Text>
        <Text style={s.tooltipSummary} numberOfLines={2}>{hoveredInfo?.shortSummary}</Text>
        <View style={s.metaRow}>
          <Text style={s.tooltipMeta}>📍 {hoveredPlaceCount} สถานที่ในระบบ</Text>
          {hoveredPrepared?.area?<Text style={s.tooltipMeta}>◫ {Math.round(hoveredPrepared.area).toLocaleString()} ตร.กม.</Text>:null}
        </View>
        <Text style={s.clickText}>{mode==='all'?'คลิกเพื่อเปิดข้อมูลจังหวัด':'คลิกเพื่อสลับสถานะจังหวัดนี้'}</Text>
      </Animated.View>
    )}

    <View style={s.hint} pointerEvents="none"><Text style={s.hintText}>{Platform.OS==='web'?palette.hint:'แตะจังหวัดเพื่อสลับสถานะ'}</Text></View>

    {showLegend&&<View style={s.legend}>
      {mode==='visited'?<>
        <View style={[s.dot,{backgroundColor:'#58A894'}]}/><Text style={s.legendText}>ไปแล้ว</Text>
        <View style={[s.dot,{backgroundColor:'#E3F0ED'}]}/><Text style={s.legendText}>ยังไม่ได้เลือก</Text>
      </>:mode==='wishlist'?<>
        <View style={[s.dot,{backgroundColor:'#E7B85A'}]}/><Text style={s.legendText}>อยากไป</Text>
        <View style={[s.dot,{backgroundColor:'#EEF4F0'}]}/><Text style={s.legendText}>ยังไม่ได้เลือก</Text>
      </>:<>
        <View style={[s.dot,{backgroundColor:COLORS.visited}]}/><Text style={s.legendText}>ไปแล้ว</Text>
        <View style={[s.dot,{backgroundColor:'#F0C96B'}]}/><Text style={s.legendText}>อยากไป</Text>
        <View style={[s.dot,{backgroundColor:'#D7ECE8'}]}/><Text style={s.legendText}>ยังไม่ไป</Text>
      </>}
    </View>}

    <View style={s.zoom}>
      <MotionMapButton onPress={()=>setZoom(z=>Math.min(2,z+.15))}><Text style={s.zoomText}>＋</Text></MotionMapButton>
      <View style={s.zoomDivider}/>
      <MotionMapButton onPress={()=>setZoom(z=>Math.max(.8,z-.15))}><Text style={s.zoomText}>−</Text></MotionMapButton>
      <View style={s.zoomDivider}/>
      <MotionMapButton onPress={()=>setZoom(1)}><Text style={s.resetText}>◎</Text></MotionMapButton>
    </View>
  </Animated.View>
}

function MotionMapButton({children,onPress}:{children:React.ReactNode;onPress:()=>void}){
  const scale=useRef(new Animated.Value(1)).current;
  const down=()=>Animated.spring(scale,{toValue:.9,useNativeDriver:true,damping:18,stiffness:280,mass:.35}).start();
  const up=()=>Animated.spring(scale,{toValue:1,useNativeDriver:true,damping:14,stiffness:240,mass:.4}).start();
  return <Animated.View style={{transform:[{scale}]}}><Pressable onPress={onPress} onPressIn={down} onPressOut={up}>{children}</Pressable></Animated.View>;
}

const s=StyleSheet.create({
  wrap:{height:620,backgroundColor:'#E8F5F3',borderRadius:RADIUS.lg,overflow:'hidden',borderWidth:1,borderColor:COLORS.border,position:'relative'},
  wrapCompact:{height:700,borderRadius:22},
  loading:{height:420,alignItems:'center',justifyContent:'center',gap:10},muted:{color:COLORS.textMuted},error:{color:COLORS.danger,textAlign:'center',padding:24},
  tooltip:{position:'absolute',left:16,top:16,minWidth:250,maxWidth:310,backgroundColor:'rgba(255,255,255,.98)',borderRadius:18,padding:14,borderWidth:1,borderColor:'rgba(8,126,139,.18)',shadowColor:'#14333A',shadowOffset:{width:0,height:10},shadowOpacity:.16,shadowRadius:22,elevation:10},
  tooltipTop:{flexDirection:'row',alignItems:'center',gap:9},tooltipDot:{width:10,height:10,borderRadius:5},tooltipTitle:{fontSize:18,fontWeight:'900',color:COLORS.text},tooltipEn:{fontSize:11,color:COLORS.textMuted,marginTop:1},statusPill:{backgroundColor:'#E8F7F4',borderRadius:999,paddingHorizontal:9,paddingVertical:5},statusVisited:{backgroundColor:'#E4F2ED'},statusWish:{backgroundColor:'#FFF1D2'},statusPillText:{fontSize:10,fontWeight:'900',color:'#087E8B'},tooltipRegion:{fontSize:12,color:COLORS.primary,fontWeight:'900',marginTop:8},tooltipSummary:{fontSize:12,color:COLORS.text,lineHeight:18,marginTop:5,fontWeight:'700'},metaRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:8},tooltipMeta:{fontSize:11,color:COLORS.textMuted},clickText:{fontSize:11,color:COLORS.primary,fontWeight:'900',marginTop:9},
  hint:{position:'absolute',top:16,alignSelf:'center',backgroundColor:'rgba(255,255,255,.9)',borderRadius:999,paddingHorizontal:12,paddingVertical:7,borderWidth:1,borderColor:'rgba(103,157,148,.18)',maxWidth:'76%'},hintText:{fontSize:11,color:'#527870',fontWeight:'800',textAlign:'center'},
  legend:{position:'absolute',left:14,bottom:14,flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'rgba(255,255,255,.95)',paddingHorizontal:12,paddingVertical:9,borderRadius:16,shadowColor:'#17332D',shadowOffset:{width:0,height:4},shadowOpacity:.08,shadowRadius:12,elevation:4,flexWrap:'wrap',maxWidth:'72%'},legendText:{fontSize:12,color:COLORS.textMuted,fontWeight:'700'},dot:{width:10,height:10,borderRadius:4,marginLeft:5},
  zoom:{position:'absolute',right:14,bottom:14,backgroundColor:'rgba(255,255,255,.96)',borderRadius:14,borderWidth:1,borderColor:COLORS.border,overflow:'hidden',shadowColor:'#17332D',shadowOffset:{width:0,height:4},shadowOpacity:.08,shadowRadius:10,elevation:3},zoomText:{fontSize:21,color:COLORS.text,paddingHorizontal:12,paddingVertical:5,textAlign:'center'},resetText:{fontSize:17,color:COLORS.text,paddingHorizontal:12,paddingVertical:8,textAlign:'center'},zoomDivider:{height:1,backgroundColor:COLORS.border},
});