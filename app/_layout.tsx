import 'react-native-reanimated';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { GLASS } from '@/constants/glassTheme';

const WEB_APP_WIDTH = 402;

export default function RootLayout(){
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
    backgroundColor:GLASS.tealNight,
    overflow:'hidden',
  },
});
