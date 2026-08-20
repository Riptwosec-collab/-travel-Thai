import React, { Component, ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TripPlannerCore from '@/components/TripPlannerCore';
import TripTextImport from '@/components/TripTextImport';
import { GlassScreen } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';
import { COLORS } from '@/constants/theme';

type Mode='manual'|'import';
type BoundaryProps={children:ReactNode;onReset:()=>void};
type BoundaryState={error:string};

class TripModeBoundary extends Component<BoundaryProps,BoundaryState>{
  state:BoundaryState={error:''};
  static getDerivedStateFromError(error:any){return {error:error?.message||'เกิดข้อผิดพลาดในหน้าแผนทริป'};}
  componentDidCatch(error:any,info:any){console.error('Trip planner UI error',error,info);}
  render(){
    if(this.state.error)return <View style={s.crashCard}>
      <View style={s.crashIcon}><Ionicons name="alert-circle-outline" size={26} color={COLORS.danger}/></View>
      <Text style={s.crashTitle}>หน้าแผนทริปเกิดข้อผิดพลาด</Text>
      <Text style={s.crashText}>{this.state.error}</Text>
      <Text style={s.crashHelp}>ข้อมูลทริปยังอยู่ครบ กดกลับแล้วเปิดใหม่ได้</Text>
      <Pressable style={s.crashButton} onPress={()=>{this.setState({error:''});this.props.onReset();}}><Text style={s.crashButtonText}>กลับหน้าแผนทริป</Text></Pressable>
    </View>;
    return this.props.children;
  }
}

export default function TripsGlass(){
  const [mode,setMode]=useState<Mode>('manual');
  const [boundaryKey,setBoundaryKey]=useState(0);
  const background=PLACES.find(x=>x.category==='ธรรมชาติ')?.image||PLACES.find(x=>x.category==='วัด')?.image||PROVINCES[29]?.coverImage||PROVINCES[0].coverImage;
  const switchMode=(next:Mode)=>{setMode(next);setBoundaryKey(x=>x+1)};
  const reset=()=>switchMode('manual');

  return <GlassScreen image={background}>
    <View style={s.root}>
      <View style={s.modeBar}>
        <ModeButton active={mode==='manual'} icon="create-outline" title="ทำเองทั้งหมด" sub="สร้างและแก้ได้ทุกจุด" onPress={()=>switchMode('manual')}/>
        <ModeButton active={mode==='import'} icon="git-compare-outline" title="แยกแผนอัตโนมัติ" sub="ข้อความ → DAY / เวลา" onPress={()=>switchMode('import')}/>
      </View>
      <View style={s.body}>
        <TripModeBoundary key={boundaryKey} onReset={reset}>
          {mode==='manual'?<TripPlannerCore/>:<TripTextImport onViewPlans={()=>switchMode('manual')}/>} 
        </TripModeBoundary>
      </View>
    </View>
  </GlassScreen>;
}

function ModeButton({active,icon,title,sub,onPress}:{active:boolean;icon:any;title:string;sub:string;onPress:()=>void}){
  return <Pressable onPress={onPress} style={[s.modeButton,active&&s.modeButtonActive]}>
    <View style={[s.modeIcon,active&&s.modeIconActive]}><Ionicons name={icon} size={18} color={active?'#fff':COLORS.primary}/></View>
    <View style={s.modeCopy}><Text numberOfLines={2} style={[s.modeTitle,active&&s.modeTitleActive]}>{title}</Text><Text numberOfLines={1} style={[s.modeSub,active&&s.modeSubActive]}>{sub}</Text></View>
  </Pressable>;
}

const s=StyleSheet.create({
  root:{flex:1,minHeight:0},
  modeBar:{marginHorizontal:12,marginTop:8,marginBottom:3,padding:4,borderRadius:18,backgroundColor:'rgba(255,255,255,.80)',borderWidth:1,borderColor:'rgba(255,255,255,.66)',flexDirection:'row',gap:5},
  modeButton:{flex:1,minWidth:0,minHeight:64,borderRadius:14,paddingHorizontal:8,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:7},
  modeButtonActive:{backgroundColor:COLORS.dark},
  modeIcon:{width:34,height:34,borderRadius:11,backgroundColor:'rgba(232,246,246,.92)',alignItems:'center',justifyContent:'center',flexShrink:0},modeIconActive:{backgroundColor:'rgba(255,255,255,.13)'},
  modeCopy:{flex:1,minWidth:0},modeTitle:{fontSize:11.5,lineHeight:15,fontWeight:'900',color:COLORS.text},modeTitleActive:{color:'#fff'},modeSub:{fontSize:9,lineHeight:12,fontWeight:'700',color:COLORS.textMuted,marginTop:2},modeSubActive:{color:'rgba(255,255,255,.72)'},
  body:{flex:1,minHeight:0},
  crashCard:{margin:14,padding:17,borderRadius:20,backgroundColor:'rgba(255,255,255,.94)',borderWidth:1,borderColor:'rgba(255,255,255,.76)',alignItems:'center',gap:8},crashIcon:{width:48,height:48,borderRadius:16,backgroundColor:'rgba(224,92,102,.10)',alignItems:'center',justifyContent:'center'},crashTitle:{fontSize:17,fontWeight:'900',color:COLORS.text,textAlign:'center'},crashText:{fontSize:11,color:COLORS.danger,textAlign:'center',lineHeight:17},crashHelp:{fontSize:11,color:COLORS.textMuted,textAlign:'center',lineHeight:17},crashButton:{marginTop:3,minHeight:46,width:'100%',borderRadius:14,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},crashButtonText:{color:'#fff',fontWeight:'900'},
});
