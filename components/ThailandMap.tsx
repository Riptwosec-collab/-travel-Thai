import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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

const normalize=(v:any)=>String(v??'').trim().replace(/^จังหวัด/,'').replace(/\s+/g,'');
const thaiName=(p:Record<string,any>)=>String(
  p.pro_th||p.PRO_TH||p.PROV_NAM_T||p.prov_nam_t||p.NAME_TH||p.name_th||p.provinceNameTh||p.NAME_1||p.name||''
).trim();
const englishName=(p:Record<string,any>)=>String(p.pro_en||p.PRO_EN||p.NAME_1||p.name_en||'').trim();
const areaSqKm=(p:Record<string,any>)=>Number.isFinite(Number(p.area_sqkm))?Number(p.area_sqkm):null;
const rings=(f:Feature):number[][][]=>f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates.flat();

export default function ThailandMap({onSelectProvince}:{onSelectProvince:(provinceId:string)=>void}){
  const [data,setData]=useState<FC|null>(null);
  const [error,setError]=useState('');
  const [zoom,setZoom]=useState(1);
  const [hoveredId,setHoveredId]=useState<string|null>(null);
  const {visitedProvinceIds,wishlistProvinceIds}=useTravelStore();

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
  const hoveredStatus=hoveredId
    ? visitedProvinceIds.includes(hoveredId)?'ไปแล้ว':wishlistProvinceIds.includes(hoveredId)?'อยากไป':'ยังไม่ไป'
    : '';

  if(!prepared&&!error)return <View style={s.loading}><ActivityIndicator color={COLORS.primary}/><Text style={s.muted}>กำลังโหลดแผนที่ 77 จังหวัด…</Text></View>;
  if(!prepared)return <View style={s.loading}><Text style={s.error}>{error}</Text></View>;

  return <View style={s.wrap}>
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <G origin={`${W/2},${H/2}`} scale={zoom}>
        {prepared.map(p=>{
          const visited=visitedProvinceIds.includes(p.id);
          const wish=wishlistProvinceIds.includes(p.id);
          const hovered=hoveredId===p.id;
          const fill=hovered?'#37C8B4':visited?COLORS.visited:wish?'#F0C96B':'#D7ECE8';
          const stroke=hovered?'#086E68':visited||wish?'#FFFFFF':'#78AFA7';
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
            strokeWidth={hovered?2.2:visited||wish?1.35:.75}
            onPress={()=>onSelectProvince(p.id)}
            {...hoverProps}
          />;
        })}
      </G>
    </Svg>

    {hoveredProvince&&Platform.OS==='web'&&(
      <View pointerEvents="none" style={s.tooltip}>
        <View style={s.tooltipTop}>
          <View style={s.tooltipDot}/>
          <View style={{flex:1}}>
            <Text style={s.tooltipTitle}>{hoveredProvince.nameTh}</Text>
            <Text style={s.tooltipEn}>{hoveredPrepared?.nameEn||hoveredProvince.nameEn}</Text>
          </View>
          <View style={s.statusPill}><Text style={s.statusPillText}>{hoveredStatus}</Text></View>
        </View>
        <Text style={s.tooltipRegion}>{hoveredProvince.region}</Text>
        <Text style={s.tooltipSummary} numberOfLines={2}>{hoveredInfo?.shortSummary}</Text>
        <View style={s.metaRow}>
          <Text style={s.tooltipMeta}>📍 {hoveredPlaceCount} สถานที่ในระบบ</Text>
          {hoveredPrepared?.area?<Text style={s.tooltipMeta}>◫ {Math.round(hoveredPrepared.area).toLocaleString()} ตร.กม.</Text>:null}
        </View>
        <Text style={s.clickText}>คลิกเพื่อเปิดข้อมูลจังหวัด</Text>
      </View>
    )}

    <View style={s.hint} pointerEvents="none">
      <Text style={s.hintText}>{Platform.OS==='web'?'ชี้จังหวัดเพื่อดูข้อมูลย่อ · คลิกเพื่อเปิดข้อมูลเพิ่มเติม':'แตะจังหวัดเพื่อเปิดข้อมูล'}</Text>
    </View>

    <View style={s.legend}>
      <View style={[s.dot,{backgroundColor:COLORS.visited}]}/><Text style={s.legendText}>ไปแล้ว</Text>
      <View style={[s.dot,{backgroundColor:'#F0C96B'}]}/><Text style={s.legendText}>อยากไป</Text>
      <View style={[s.dot,{backgroundColor:'#D7ECE8'}]}/><Text style={s.legendText}>ยังไม่ไป</Text>
    </View>
    <View style={s.zoom}>
      <Pressable onPress={()=>setZoom(z=>Math.min(2,z+.15))}><Text style={s.zoomText}>＋</Text></Pressable>
      <View style={s.zoomDivider}/>
      <Pressable onPress={()=>setZoom(z=>Math.max(.8,z-.15))}><Text style={s.zoomText}>−</Text></Pressable>
    </View>
  </View>
}

const s=StyleSheet.create({
  wrap:{height:620,backgroundColor:'#E8F5F3',borderRadius:RADIUS.lg,overflow:'hidden',borderWidth:1,borderColor:COLORS.border,position:'relative'},
  loading:{height:420,alignItems:'center',justifyContent:'center',gap:10},muted:{color:COLORS.textMuted},error:{color:COLORS.danger,textAlign:'center',padding:24},
  tooltip:{position:'absolute',left:16,top:16,minWidth:250,maxWidth:310,backgroundColor:'rgba(255,255,255,.98)',borderRadius:18,padding:14,borderWidth:1,borderColor:'rgba(8,126,139,.18)',shadowColor:'#14333A',shadowOffset:{width:0,height:10},shadowOpacity:.16,shadowRadius:22,elevation:10},
  tooltipTop:{flexDirection:'row',alignItems:'center',gap:9},tooltipDot:{width:10,height:10,borderRadius:5,backgroundColor:'#37C8B4'},tooltipTitle:{fontSize:18,fontWeight:'900',color:COLORS.text},tooltipEn:{fontSize:11,color:COLORS.textMuted,marginTop:1},statusPill:{backgroundColor:'#E8F7F4',borderRadius:999,paddingHorizontal:9,paddingVertical:5},statusPillText:{fontSize:10,fontWeight:'900',color:'#087E8B'},tooltipRegion:{fontSize:12,color:COLORS.primary,fontWeight:'900',marginTop:8},tooltipSummary:{fontSize:12,color:COLORS.text,lineHeight:18,marginTop:5,fontWeight:'700'},metaRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:8},tooltipMeta:{fontSize:11,color:COLORS.textMuted},clickText:{fontSize:11,color:COLORS.primary,fontWeight:'900',marginTop:9},
  hint:{position:'absolute',top:16,alignSelf:'center',backgroundColor:'rgba(255,255,255,.86)',borderRadius:999,paddingHorizontal:11,paddingVertical:6,borderWidth:1,borderColor:'rgba(103,157,148,.18)'},hintText:{fontSize:11,color:'#527870',fontWeight:'700'},
  legend:{position:'absolute',left:14,bottom:14,flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'rgba(255,255,255,.94)',paddingHorizontal:12,paddingVertical:8,borderRadius:999},legendText:{fontSize:12,color:COLORS.textMuted,fontWeight:'700'},dot:{width:10,height:10,borderRadius:5,marginLeft:5},
  zoom:{position:'absolute',right:14,top:14,backgroundColor:'white',borderRadius:14,borderWidth:1,borderColor:COLORS.border,overflow:'hidden'},zoomText:{fontSize:22,color:COLORS.text,paddingHorizontal:12,paddingVertical:6,textAlign:'center'},zoomDivider:{height:1,backgroundColor:COLORS.border},
});