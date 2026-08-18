import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatusMapDashboard from '@/components/StatusMapDashboard';
import { COLORS } from '@/constants/theme';

export default function Wishlist(){
  const enter=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.timing(enter,{toValue:1,duration:460,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
  },[enter]);
  return <SafeAreaView style={s.safe} edges={['top']}>
    <Animated.View style={[s.fill,{opacity:enter,transform:[{translateY:enter.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}]}>
      <StatusMapDashboard mode="wishlist"/>
    </Animated.View>
  </SafeAreaView>;
}

const s=StyleSheet.create({safe:{flex:1,backgroundColor:COLORS.background},fill:{flex:1}});
