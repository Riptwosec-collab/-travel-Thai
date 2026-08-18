import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import AccountCore from '@/components/AccountCore';
import { GlassScreen } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';

export default function AccountGlass(){
  const background=PLACES.find(x=>x.category==='วัด')?.image||PLACES.find(x=>x.category==='ธรรมชาติ')?.image||PROVINCES[0].coverImage;
  return <GlassScreen image={background}>
    <View style={s.readabilityLayer}><AccountCore/></View>
  </GlassScreen>;
}

const s=StyleSheet.create({
  readabilityLayer:{
    flex:1,
    backgroundColor:'rgba(225,246,248,.38)',
    ...(Platform.OS==='web'?({backdropFilter:'blur(6px) saturate(120%)',WebkitBackdropFilter:'blur(6px) saturate(120%)'} as any):{}),
  },
});
