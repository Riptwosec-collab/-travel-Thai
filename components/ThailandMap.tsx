import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { G, Path } from 'react-native-svg';
import { PLACES, PROVINCES } from '@/data/catalog';
import { getProvinceInfo } from '@/data/provinceInfo';
import { GLASS, GLASS_RADIUS, glassSurface } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';

const GEO_URL='https://raw.githubusercontent.com/chingchai/OpenGISData-Thailand/master/provinces.geojson';
const CACHE='travel-thai-provinces-geojson-v1';
const W=600,H=850;

type Feature={type:'Feature';properties:Record<string,any>;geometry:{type:'Polygon'|'MultiPolygon';coordinates:any}};
type FC={type:'FeatureCollection';features:Feature[]};
type PreparedProvince={id:string;nameTh:string;nameEn:string;area:number|null;d:string};
export type ThailandMapMode='all'|'visited'|'wishlist';
type Props={onSelectProvince:(provinceId:string)=>void;mode?:ThailandMapMode;compact?:boolean;showLegend?:boolean};

const normalize=(v:any)=>String(v??'').trim().replace(/^จังหวัด/,'').replace(/\s+/g,'');
const thaiName=(p:Record<string,any>)=>String(p.pro_th||p.PRO_TH||p.PROV_NAM_T||p.prov_nam_t||p.NAME_TH||p.name_th||p.provinceNameTh||p.NAME_1||p.name||'').trim();
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
 const pulse=useRef(new Animated.Value(0)).current;
 const {visitedProvinceIds,wishlistProvinceIds}=useTravelStore();
 const mapHeight=compact?(width<700?520:700):(width<700?500:650);

 useEffect(()=>{(async()=>{
  try{
   const cached=await AsyncStorage.getItem(CACHE);if(cached)setData(JSON.parse(cached));
   const r=await fetch(GEO_URL);if(!r.ok)throw new Error(String(r.status));
   const j=await r.json();setData(j);await AsyncStorage.setItem(CACHE,JSON.stringify(j));
  }catch(e){setData(current=>{if(!current)setError('โหลดขอบเขตจังหวัดไม่สำเร็จ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่');return current})}
 })()},[]);

 useEffect(()=>{if(data)Animated.timing(mapEnter,{toValue:1,duration:520,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start()},[data,mapEnter]);
 useEffect(()=>{Animated.timing(tooltipAnim,{toValue:hoveredId?1:0,duration:hoveredId?190:120,easing:Easing.out(Easing.quad),useNativeDriver:true}).start()},[hoveredId,tooltipAnim]);
 useEffect(()=>{const loop=Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1,duration:1500,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),Animated.timing(pulse,{toValue:0,duration:1500,easing:Easing.inOut(Easing.sin),useNativeDriver:true})]));loop.start();return()=>loop.stop()},[pulse]);

 const prepared=useMemo<PreparedProvince[]|null>(()=>{
  if(!data)return null;
  let minX=999,maxX=-999,minY=999,maxY=-999;
  data.features.forEach(f=>rings(f).forEach(r=>r.forEach(([x,y])=>{minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)})));
  const pad=18,sx=(W-pad*2)/(maxX-minX),sy=(H-pad*2)/(maxY-minY),scale=Math.min(sx,sy);
  const px=(x:number)=>pad+(x-minX)*scale+(W-pad*2-(maxX-minX)*scale)/2;
  const py=(y:number)=>H-pad-(y-minY)*scale-(H-pad*2-(maxY-minY)*scale)/2;
  return data.features.flatMap(f=>{
   const sourceName=thaiName(f.properties),key=normalize(sourceName),province=PROVINCES.find(p=>normalize(p.nameTh)===key);
   if(!province){if(__DEV__)console.warn('[ThailandMap] Unmatched GeoJSON province:',sourceName,f.properties);return []}
   const d=rings(f).map(r=>r.map(([x,y],j)=>`${j?'L':'M'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ')+' Z').join(' ');
   return [{id:province.id,nameTh:province.nameTh,nameEn:englishName(f.properties)||province.nameEn,area:areaSqKm(f.properties),d}];
  });
 },[data]);

 const hoveredProvince=useMemo(()=>hoveredId?PROVINCES.find(p=>p.id===hoveredId):undefined,[hoveredId]);
 const hoveredPrepared=useMemo(()=>hoveredId?prepared?.find(p=>p.id===hoveredId):undefined,[hoveredId,prepared]);
 const hoveredPlaceCount=useMemo(()=>hoveredId?PLACES.filter(p=>p.provinceId===hoveredId).length:0,[hoveredId]);
 const hoveredInfo=useMemo(()=>hoveredProvince?getProvinceInfo(hoveredProvince.nameTh,hoveredProvince.region,hoveredProvince.description,hoveredProvince.bestMonths):undefined,[hoveredProvince]);
 const isVisited=(id:string)=>visitedProvinceIds.includes(id),isWish=(id:string)=>wishlistProvinceIds.includes(id);
 const hoveredStatus=hoveredId?mode==='visited'?(isVisited(hoveredId)?'เลือกแล้ว':'คลิกเพื่อเพิ่ม'):mode==='wishlist'?(isWish(hoveredId)?'เลือกแล้ว':'คลิกเพื่อเพิ่ม'):isVisited(hoveredId)?'ไปแล้ว':isWish(hoveredId)?'อยากไป':'ยังไม่ไป':'';
 const palette=mode==='visited'?{active:GLASS.turquoise,hover:'#7AF0DE',stroke:'#E8FFFB',hint:'คลิกจังหวัดเพื่อเพิ่ม/นำออกจาก “ที่ที่ไปแล้ว”'}:mode==='wishlist'?{active:GLASS.goldStrong,hover:'#F6DA9E',stroke:'#FFF6E1',hint:'คลิกจังหวัดเพื่อเพิ่ม/นำออกจาก “อยากไป”'}:{active:GLASS.turquoise,hover:GLASS.aqua,stroke:'#F4FFFF',hint:'ชี้จังหวัดเพื่อดูข้อมูลย่อ · คลิกเพื่อเปิดข้อมูลเพิ่มเติม'};

 if(!prepared&&!error)return <View style={[s.loading,{height:compact?(width<700?480:560):420}]}><ActivityIndicator color={GLASS.aqua}/><Text style={s.muted}>กำลังโหลดแผนที่ 77 จังหวัด…</Text></View>;
 if(!prepared)return <View style={[s.loading,{height:compact?(width<700?480:560):420}]}><Text style={s.error}>{error}</Text></View>;

 return <Animated.View style={[s.wrap,compact&&s.wrapCompact,{height:mapHeight,opacity:mapEnter,transform:[{scale:mapEnter.interpolate({inputRange:[0,1],outputRange:[.992,1]})}]}]}>
  <View pointerEvents="none" style={s.mapBloom}/><View pointerEvents="none" style={s.mapBloom2}/>
  <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
   <G origin={`${W/2},${H/2}`} scale={zoom}>
    {prepared.map(p=>{
     const visited=isVisited(p.id),wish=isWish(p.id),active=mode==='visited'?visited:mode==='wishlist'?wish:(visited||wish),hovered=hoveredId===p.id;
     let fill='rgba(202,231,235,.48)';
     if(mode==='visited')fill=active?palette.active:'rgba(210,238,238,.48)';
     else if(mode==='wishlist')fill=active?palette.active:'rgba(218,237,239,.46)';
     else fill=visited?GLASS.turquoise:wish?GLASS.goldStrong:'rgba(202,231,235,.48)';
     if(hovered)fill=active?palette.active:palette.hover;
     const stroke=hovered?palette.stroke:active?'rgba(255,255,255,.95)':'rgba(255,255,255,.62)';
     const hoverProps=Platform.OS==='web'?({onMouseEnter:()=>setHoveredId(p.id),onMouseLeave:()=>setHoveredId(current=>current===p.id?null:current),style:{cursor:'pointer'}} as any):{};
     return <Path key={p.id} d={p.d} fill={fill} stroke={stroke} strokeWidth={hovered?2.25:active?1.45:.85} onPress={()=>onSelectProvince(p.id)} {...hoverProps}/>;
    })}
   </G>
  </Svg>

  {hoveredProvince&&Platform.OS==='web'&&<Animated.View pointerEvents="none" style={[s.tooltip,glassSurface(true),{opacity:tooltipAnim,transform:[{translateY:tooltipAnim.interpolate({inputRange:[0,1],outputRange:[6,0]})},{scale:tooltipAnim.interpolate({inputRange:[0,1],outputRange:[.98,1]})}]}]}>
   <View style={s.tooltipTop}><View style={[s.tooltipDot,{backgroundColor:mode==='wishlist'?GLASS.goldStrong:GLASS.turquoise}]}/><View style={{flex:1}}><Text style={s.tooltipTitle}>{hoveredProvince.nameTh}</Text><Text style={s.tooltipEn}>{hoveredPrepared?.nameEn||hoveredProvince.nameEn}</Text></View><View style={s.statusPill}><Text style={s.statusPillText}>{hoveredStatus}</Text></View></View>
   <Text style={s.tooltipRegion}>{hoveredProvince.region}</Text><Text style={s.tooltipSummary} numberOfLines={2}>{hoveredInfo?.shortSummary}</Text>
   <View style={s.metaRow}><Text style={s.tooltipMeta}>📍 {hoveredPlaceCount} สถานที่</Text>{hoveredPrepared?.area?<Text style={s.tooltipMeta}>◫ {Math.round(hoveredPrepared.area).toLocaleString()} ตร.กม.</Text>:null}</View><Text style={s.clickText}>{mode==='all'?'คลิกเพื่อเปิดข้อมูลจังหวัด':'คลิกเพื่อสลับสถานะจังหวัดนี้'}</Text>
  </Animated.View>}

  <Animated.View pointerEvents="none" style={[s.hint,{opacity:pulse.interpolate({inputRange:[0,1],outputRange:[.74,1]})}]}><Text style={s.hintText}>{Platform.OS==='web'?palette.hint:'แตะจังหวัดเพื่อเปิดข้อมูล'}</Text></Animated.View>

  {showLegend&&<View style={[s.legend,glassSurface()]}>{mode==='visited'?<><Dot color={GLASS.turquoise} label="ไปแล้ว"/><Dot color="rgba(255,255,255,.28)" label="ยังไม่ได้เลือก"/></>:mode==='wishlist'?<><Dot color={GLASS.goldStrong} label="อยากไป"/><Dot color="rgba(255,255,255,.28)" label="ยังไม่ได้เลือก"/></>:<><Dot color={GLASS.turquoise} label="ไปแล้ว"/><Dot color={GLASS.goldStrong} label="อยากไป"/><Dot color="rgba(255,255,255,.28)" label="ยังไม่ไป"/></>}</View>}

  <View style={[s.zoom,glassSurface(true)]}><MotionMapButton onPress={()=>setZoom(z=>Math.min(2,z+.15))}><Text style={s.zoomText}>＋</Text></MotionMapButton><View style={s.zoomDivider}/><MotionMapButton onPress={()=>setZoom(z=>Math.max(.8,z-.15))}><Text style={s.zoomText}>−</Text></MotionMapButton><View style={s.zoomDivider}/><MotionMapButton onPress={()=>setZoom(1)}><Text style={s.resetText}>◎</Text></MotionMapButton></View>
 </Animated.View>
}

function Dot({color,label}:{color:string;label:string}){return <View style={s.dotRow}><View style={[s.dot,{backgroundColor:color}]}/><Text style={s.legendText}>{label}</Text></View>}
function MotionMapButton({children,onPress}:{children:React.ReactNode;onPress:()=>void}){const scale=useRef(new Animated.Value(1)).current;return <Animated.View style={{transform:[{scale}]}}><Pressable onPress={onPress} onPressIn={()=>Animated.spring(scale,{toValue:.88,useNativeDriver:true,damping:16,stiffness:290}).start()} onPressOut={()=>Animated.spring(scale,{toValue:1,useNativeDriver:true,damping:14,stiffness:240}).start()}>{children}</Pressable></Animated.View>}

const s=StyleSheet.create({
 wrap:{height:650,backgroundColor:'rgba(7,91,108,.18)',borderRadius:GLASS_RADIUS.lg,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,.22)',position:'relative'},wrapCompact:{height:700,borderRadius:24},loading:{alignItems:'center',justifyContent:'center',gap:10},muted:{color:'rgba(255,255,255,.74)'},error:{color:'#FFD5D8',textAlign:'center',padding:24},
 mapBloom:{position:'absolute',width:300,height:300,borderRadius:150,right:-80,top:-100,backgroundColor:'rgba(99,232,244,.10)'},mapBloom2:{position:'absolute',width:260,height:260,borderRadius:130,left:-100,bottom:-80,backgroundColor:'rgba(242,211,154,.08)'},
 tooltip:{position:'absolute',left:14,top:14,minWidth:250,maxWidth:320,borderRadius:20,padding:13,overflow:'hidden'},tooltipTop:{flexDirection:'row',alignItems:'center',gap:9},tooltipDot:{width:9,height:9,borderRadius:5},tooltipTitle:{fontSize:17,fontWeight:'900',color:GLASS.white},tooltipEn:{fontSize:9,color:'rgba(255,255,255,.62)',marginTop:1},statusPill:{backgroundColor:'rgba(255,255,255,.12)',borderRadius:999,paddingHorizontal:8,paddingVertical:5,borderWidth:1,borderColor:'rgba(255,255,255,.18)'},statusPillText:{fontSize:8,fontWeight:'900',color:GLASS.white},tooltipRegion:{fontSize:9,fontWeight:'800',color:GLASS.gold,marginTop:8},tooltipSummary:{fontSize:10,lineHeight:15,color:'rgba(255,255,255,.74)',marginTop:4},metaRow:{flexDirection:'row',gap:9,flexWrap:'wrap',marginTop:8},tooltipMeta:{fontSize:8,color:'rgba(255,255,255,.60)'},clickText:{fontSize:8,fontWeight:'900',color:GLASS.aqua,marginTop:8},
 hint:{position:'absolute',left:14,bottom:14,backgroundColor:'rgba(4,58,72,.42)',borderWidth:1,borderColor:'rgba(255,255,255,.18)',borderRadius:999,paddingHorizontal:11,paddingVertical:7},hintText:{fontSize:8,fontWeight:'800',color:GLASS.white},
 legend:{position:'absolute',right:14,bottom:14,borderRadius:16,paddingHorizontal:10,paddingVertical:8,gap:5},dotRow:{flexDirection:'row',alignItems:'center',gap:5},dot:{width:7,height:7,borderRadius:4,borderWidth:.5,borderColor:'rgba(255,255,255,.65)'},legendText:{fontSize:8,fontWeight:'800',color:'rgba(255,255,255,.78)'},
 zoom:{position:'absolute',right:14,top:14,borderRadius:18,paddingVertical:3,overflow:'hidden'},zoomText:{width:38,height:34,textAlign:'center',textAlignVertical:'center',lineHeight:34,fontSize:20,fontWeight:'500',color:GLASS.white},resetText:{width:38,height:34,textAlign:'center',lineHeight:34,fontSize:17,color:GLASS.white},zoomDivider:{height:1,backgroundColor:'rgba(255,255,255,.16)',marginHorizontal:7},
});
