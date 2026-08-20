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
      <View style={s.crashIcon}><Ionicons name="alert-circle-outline" size={28} color={COLORS.danger}/></View>
      <Text style={s.crashTitle}>หน้าแผนทริปเกิดข้อผิดพลาด</Text>
      <Text style={s.crashText}>{this.state.error}</Text>
      <Text style={s.crashHelp}>ข้อมูลทริปไม่ได้ถูกลบ กดกลับไปหน้า Manual แล้วลองเปิดใหม่ได้</Text>
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
        <Pressable onPress={()=>switchMode('manual')} style={[s.modeButton,mode==='manual'&&s.modeButtonActive]}>
          <Ionicons name="create-outline" size={17} color={mode==='manual'?'#fff':COLORS.text}/>
          <View style={s.modeCopy}><Text style={[s.modeTitle,mode==='manual'&&s.modeTitleActive]}>ทำเองทั้งหมด</Text><Text style={[s.modeSub,mode==='manual'&&s.modeSubActive]}>สร้าง + แก้ไขทุกจุด</Text></View>
        </Pressable>
        <Pressable onPress={()=>switchMode('import')} style={[s.modeButton,mode==='import'&&s.modeButtonActive]}>
          <Ionicons name="git-compare-outline" size={17} color={mode==='import'?'#fff':COLORS.text}/>
          <View style={s.modeCopy}><Text style={[s.modeTitle,mode==='import'&&s.modeTitleActive]}>แยกแผนอัตโนมัติ</Text><Text style={[s.modeSub,mode==='import'&&s.modeSubActive]}>ข้อความ → DAY / เวลา / งบ</Text></View>
        </Pressable>
      </View>
      <View style={s.body}>
        <TripModeBoundary key={boundaryKey} onReset={reset}>
          {mode==='manual'?<TripPlannerCore/>:<TripTextImport onViewPlans={()=>switchMode('manual')}/>} 
        </TripModeBoundary>
      </View>
    </View>
  </GlassScreen>;
}

const s=StyleSheet.create({
  root:{flex:1,minHeight:0},
  modeBar:{marginHorizontal:14,marginTop:9,marginBottom:2,padding:5,borderRadius:20,backgroundColor:'rgba(255,255,255,.72)',borderWidth:1,borderColor:'rgba(255,255,255,.60)',flexDirection:'row',gap:5},
  modeButton:{flex:1,minWidth:0,minHeight:52,borderRadius:16,paddingHorizontal:8,paddingVertical:8,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},
  modeButtonActive:{backgroundColor:COLORS.dark},modeCopy:{flexShrink:1,minWidth:0},
  modeTitle:{fontSize:10.5,fontWeight:'900',color:COLORS.text},modeTitleActive:{color:'#fff'},
  modeSub:{fontSize:8.5,fontWeight:'700',color:COLORS.textMuted,marginTop:1},modeSubActive:{color:'rgba(255,255,255,.74)'},
  body:{flex:1,minHeight:0},
  crashCard:{margin:16,padding:18,borderRadius:22,backgroundColor:'rgba(255,255,255,.92)',borderWidth:1,borderColor:'rgba(255,255,255,.74)',alignItems:'center',gap:9},crashIcon:{width:52,height:52,borderRadius:17,backgroundColor:'rgba(224,92,102,.10)',alignItems:'center',justifyContent:'center'},crashTitle:{fontSize:18,fontWeight:'900',color:COLORS.text,textAlign:'center'},crashText:{fontSize:11,color:COLORS.danger,textAlign:'center',lineHeight:17},crashHelp:{fontSize:11,color:COLORS.textMuted,textAlign:'center',lineHeight:17},crashButton:{marginTop:3,minHeight:46,paddingHorizontal:18,borderRadius:14,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},crashButtonText:{color:'#fff',fontWeight:'900'},
});
