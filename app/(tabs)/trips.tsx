import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TripPlannerCore from '@/components/TripPlannerCore';
import TripTextImport from '@/components/TripTextImport';
import { GlassScreen } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';
import { COLORS } from '@/constants/theme';

type Mode='manual'|'import';

export default function TripsGlass(){
  const [mode,setMode]=useState<Mode>('manual');
  const background=PLACES.find(x=>x.category==='ธรรมชาติ')?.image||PLACES.find(x=>x.category==='วัด')?.image||PROVINCES[29]?.coverImage||PROVINCES[0].coverImage;
  return <GlassScreen image={background}>
    <View style={s.root}>
      <View style={s.modeBar}>
        <Pressable onPress={()=>setMode('manual')} style={[s.modeButton,mode==='manual'&&s.modeButtonActive]}>
          <Ionicons name="create-outline" size={17} color={mode==='manual'?'#fff':COLORS.text}/>
          <View><Text style={[s.modeTitle,mode==='manual'&&s.modeTitleActive]}>ทำเองทั้งหมด</Text><Text style={[s.modeSub,mode==='manual'&&s.modeSubActive]}>สร้าง + แก้ไขทุกจุด</Text></View>
        </Pressable>
        <Pressable onPress={()=>setMode('import')} style={[s.modeButton,mode==='import'&&s.modeButtonActive]}>
          <Ionicons name="git-compare-outline" size={17} color={mode==='import'?'#fff':COLORS.text}/>
          <View><Text style={[s.modeTitle,mode==='import'&&s.modeTitleActive]}>แยกแผนอัตโนมัติ</Text><Text style={[s.modeSub,mode==='import'&&s.modeSubActive]}>ข้อความ → DAY / เวลา / งบ</Text></View>
        </Pressable>
      </View>
      <View style={s.body}>
        {mode==='manual'?<TripPlannerCore/>:<TripTextImport onDone={()=>setMode('manual')}/>} 
      </View>
    </View>
  </GlassScreen>;
}

const s=StyleSheet.create({
  root:{flex:1},
  modeBar:{marginHorizontal:18,marginTop:10,marginBottom:2,padding:5,borderRadius:20,backgroundColor:'rgba(255,255,255,.68)',borderWidth:1,borderColor:'rgba(255,255,255,.58)',flexDirection:'row',gap:5},
  modeButton:{flex:1,minHeight:52,borderRadius:16,paddingHorizontal:11,paddingVertical:8,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
  modeButtonActive:{backgroundColor:COLORS.dark},
  modeTitle:{fontSize:11,fontWeight:'900',color:COLORS.text},
  modeTitleActive:{color:'#fff'},
  modeSub:{fontSize:9,fontWeight:'700',color:COLORS.textMuted,marginTop:1},
  modeSubActive:{color:'rgba(255,255,255,.72)'},
  body:{flex:1},
});
