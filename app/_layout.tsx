import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { GLASS } from '@/constants/glassTheme';

const WEB_APP_WIDTH = 402;

function syncMobileWebDimensions(){
  if(Platform.OS !== 'web' || typeof window === 'undefined') return;

  const width = Math.min(window.innerWidth, WEB_APP_WIDTH);
  const height = window.innerHeight;
  const scale = window.devicePixelRatio || 1;

  // Keep every useWindowDimensions() consumer in the app on the mobile branch,
  // even when the website is opened on a desktop monitor.
  Dimensions.set({
    window: { width, height, scale, fontScale: 1 },
    screen: { width, height, scale, fontScale: 1 },
  });
}

if(Platform.OS === 'web' && typeof window !== 'undefined'){
  syncMobileWebDimensions();
}

export default function RootLayout(){
  useEffect(()=>{
    if(Platform.OS !== 'web' || typeof window === 'undefined') return;
    syncMobileWebDimensions();
    window.addEventListener('resize', syncMobileWebDimensions);
    return ()=>window.removeEventListener('resize', syncMobileWebDimensions);
  },[]);

  const navigation = <>
    <StatusBar style="light" translucent/>
    <Stack screenOptions={{
      headerShown:false,
      animation:'fade',
      gestureEnabled:true,
      fullScreenGestureEnabled:true,
      contentStyle:{backgroundColor:GLASS.tealNight},
    }}>
      <Stack.Screen name="(tabs)" options={{animation:'fade'}}/>
      <Stack.Screen name="place-detail" options={{presentation:'modal',animation:'slide_from_bottom',gestureEnabled:true}}/>
      <Stack.Screen name="province-detail" options={{animation:'slide_from_right',gestureEnabled:true}}/>
      <Stack.Screen name="search" options={{presentation:'modal',animation:'slide_from_bottom'}}/>
      <Stack.Screen name="journal" options={{presentation:'modal',animation:'slide_from_bottom'}}/>
      <Stack.Screen name="analytics" options={{presentation:'modal',animation:'slide_from_bottom'}}/>
      <Stack.Screen name="account" options={{presentation:'modal',animation:'slide_from_bottom'}}/>
      <Stack.Screen name="onboarding" options={{presentation:'fullScreenModal',animation:'fade_from_bottom'}}/>
    </Stack>
  </>;

  if(Platform.OS !== 'web') return navigation;

  return <View style={styles.webStage}>
    <View style={styles.mobileAppFrame}>
      {navigation}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  webStage:{
    flex:1,
    width:'100%',
    height:'100%',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:GLASS.tealNight,
    overflow:'hidden',
  },
  mobileAppFrame:{
    flex:1,
    width:'100%',
    maxWidth:WEB_APP_WIDTH,
    height:'100%',
    alignSelf:'center',
    overflow:'hidden',
  },
});
