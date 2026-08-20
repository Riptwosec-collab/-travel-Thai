import React from 'react';
import { View } from 'react-native';
import AccountCore from '@/components/AccountCore';
import { GlassScreen } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';

export default function AccountGlass(){
  const background=PLACES.find(x=>x.category==='วัด')?.image||PLACES.find(x=>x.category==='ธรรมชาติ')?.image||PROVINCES[0].coverImage;
  return <GlassScreen image={background}>
    <View style={{flex:1}}><AccountCore/></View>
  </GlassScreen>;
}
