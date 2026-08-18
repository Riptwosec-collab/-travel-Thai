import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { G, Path } from 'react-native-svg';
import { PROVINCES } from '@/data/catalog';
import { COLORS, RADIUS } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';

const GEO_URL='https://raw.githubusercontent.com/chingchai/OpenGISData-Thailand/master/provinces.geojson';
const CACHE='travel-thai-provinces-geojson-v1';
const W=600,H=850;

type Feature={type:'Feature';properties:Record<string,any>;geometry:{type:'Polygon'|'MultiPolygon';coordinates:any}};
type FC={type:'FeatureCollection';features:Feature[]};
const featureName=(p:Record<string,any>)=>String(p.PROV_NAM_T||p.prov_nam_t||p.NAME_1||p.name_th||p.provinceNameTh||p.NAME_TH||p.name||'').trim();
const rings=(f:Feature):number[][][]=>f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates.flat();

export default function ThailandMap({onSelectProvince}:{onSelectProvince:(provinceId:string)=>void}){
  const [data,setData]=useState<FC|null>(null); const [error,setError]=useState(''); const [zoom,setZoom]=useState(1);
  const {visitedProvinceIds,wishlistProvinceIds}=useTravelStore();
  useEffect(()=>{(async()=>{try{const cached=await AsyncStorage.getItem(CACHE);if(cached)setData(JSON.parse(cached));const r=await fetch(GEO_URL);if(!r.ok)throw new Error(String(r.status));const j=await r.json();setData(j);await AsyncStorage.setItem(CACHE,JSON.stringify(j));}catch(e){if(!data)setError('โหลดขอบเขตจังหวัดไม่สำเร็จ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่');}})()},[]);
  const prepared=useMemo(()=>{if(!data)return null;let minX=999,maxX=-999,minY=999,maxY=-999;data.features.forEach(f=>rings(f).forEach(r=>r.forEach(([x,y])=>{minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)})));const pad=18;const sx=(W-pad*2)/(maxX-minX),sy=(H-pad*2)/(maxY-minY),s=Math.min(sx,sy);const px=(x:number)=>pad+(x-minX)*s+(W-pad*2-(maxX-minX)*s)/2;const py=(y:number)=>H-pad-(y-minY)*s-(H-pad*2-(maxY-minY)*s)/2;return data.features.map((f,i)=>{const name=featureName(f.properties);const province=PROVINCES.find(p=>p.nameTh===name)||PROVINCES[i];const d=rings(f).map(r=>r.map(([x,y],j)=>`${j?'L':'M'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ')+' Z').join(' ');return {id:province?.id||String(i+1),name:name||province?.nameTh||`จังหวัด ${i+1}`,d};});},[data]);
  if(!prepared&&!error)return <View style={s.loading}><ActivityIndicator color={COLORS.primary}/><Text style={s.muted}>กำลังโหลดแผนที่ 77 จังหวัด…</Text></View>;
  if(!prepared)return <View style={s.loading}><Text style={s.error}>{error}</Text></View>;
  return <View style={s.wrap}>
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <G origin={`${W/2},${H/2}`} scale={zoom}>
        {prepared.map(p=>{const visited=visitedProvinceIds.includes(p.id),wish=wishlistProvinceIds.includes(p.id);return <Path key={p.id} d={p.d} fill={visited?COLORS.visited:wish?'#F0C96B':'#D7ECE8'} stroke={visited||wish?'#FFFFFF':'#679D94'} strokeWidth={visited||wish?1.4:.75} onPress={()=>onSelectProvince(p.id)}/>})}
      </G>
    </Svg>
    <View style={s.legend}><View style={[s.dot,{backgroundColor:COLORS.visited}]}/><Text>ไปแล้ว</Text><View style={[s.dot,{backgroundColor:'#F0C96B'}]}/><Text>อยากไป</Text><View style={[s.dot,{backgroundColor:'#D7ECE8'}]}/><Text>ยังไม่ไป</Text></View>
    <View style={s.zoom}><Pressable onPress={()=>setZoom(z=>Math.min(2,z+.15))}><Text style={s.zoomText}>＋</Text></Pressable><Pressable onPress={()=>setZoom(z=>Math.max(.8,z-.15))}><Text style={s.zoomText}>−</Text></Pressable></View>
  </View>
}
const s=StyleSheet.create({wrap:{height:620,backgroundColor:'#E8F5F3',borderRadius:RADIUS.lg,overflow:'hidden',borderWidth:1,borderColor:COLORS.border},loading:{height:420,alignItems:'center',justifyContent:'center',gap:10},muted:{color:COLORS.textMuted},error:{color:COLORS.danger,textAlign:'center',padding:24},legend:{position:'absolute',left:14,bottom:14,flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'rgba(255,255,255,.94)',paddingHorizontal:12,paddingVertical:8,borderRadius:999},dot:{width:10,height:10,borderRadius:5,marginLeft:5},zoom:{position:'absolute',right:14,top:14,backgroundColor:'white',borderRadius:14,borderWidth:1,borderColor:COLORS.border,overflow:'hidden'},zoomText:{fontSize:24,color:COLORS.text,paddingHorizontal:12,paddingVertical:6}});
