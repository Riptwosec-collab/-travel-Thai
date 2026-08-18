import React from 'react';
import OnboardingCore from '@/components/OnboardingCore';
import { GlassScreen } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';

export default function OnboardingGlass(){
  const background=PLACES.find(x=>x.category==='ธรรมชาติ')?.image||PLACES.find(x=>x.category==='ทะเล')?.image||PROVINCES[0].coverImage;
  return <GlassScreen image={background}><OnboardingCore/></GlassScreen>;
}
