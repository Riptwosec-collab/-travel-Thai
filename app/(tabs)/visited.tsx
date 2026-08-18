import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import StatusGlassDashboard from '@/components/StatusGlassDashboard';
import { GlassPressable, GlassScreen } from '@/components/glass';
import { glassSurface, GLASS, GLASS_TEXT } from '@/constants/glassTheme';
import { PLACES, PROVINCES } from '@/data/catalog';

export default function Visited(){
  const router=useRouter();
  const enter=useRef(new Animated.Value(0)).current;
  const background=PLACES.find(x=>x.category==='ธรรมชาติ')?.image||PROVINCES[0].coverImage;
  useEffect(()=>{Animated.timing(enter,{toValue:1,duration:460,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start()},[enter]);
  return <GlassScreen image={background}><SafeAreaView style={s.safe} edges={['top']}>
    <View style={[s.switch,glassSurface(true)]}>
      <GlassPressable style={s.switchBtn} onPress={()=>router.replace('/(tabs)/wishlist')}><Text style={s.switchText}>Wishlist</Text></GlassPressable>
      <GlassPressable style={[s.switchBtn,s.switchOn]} onPress={()=>{}}><Text style={[s.switchText,s.switchTextOn]}>Visited</Text></GlassPressable>
    </View>
    <Animated.View style={[s.fill,{opacity:enter,transform:[{translateY:enter.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}]}><StatusGlassDashboard mode="visited"/></Animated.View>
  </SafeAreaView></GlassScreen>;
}
const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'transparent'},fill:{flex:1},
  switch:{height:50,borderRadius:24,flexDirection:'row',padding:4,marginHorizontal:16,marginTop:7,marginBottom:2},
  switchBtn:{flex:1,borderRadius:20},
  switchOn:{backgroundColor:'rgba(40,213,199,.24)',borderWidth:1,borderColor:'rgba(255,255,255,.38)'},
  switchText:{fontSize:10,fontWeight:'900',color:GLASS_TEXT.tertiary},switchTextOn:{color:GLASS.white}
});
