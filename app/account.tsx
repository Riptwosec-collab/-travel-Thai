import React from 'react';
import AccountCore from '@/components/AccountCore';
import { GlassScreen } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';

export default function AccountGlass(){
  const background=PLACES.find(x=>x.category==='วัด')?.image||PLACES.find(x=>x.category==='ธรรมชาติ')?.image||PROVINCES[0].coverImage;
  return <GlassScreen image={background}><AccountCore/></GlassScreen>;
}
