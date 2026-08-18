import React from 'react';
import SearchCore from '@/components/SearchCore';
import { GlassScreen } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';

export default function SearchGlass(){
  const background=PLACES.find(x=>x.category==='ทะเล')?.image||PLACES[0]?.image||PROVINCES[0].coverImage;
  return <GlassScreen image={background}><SearchCore/></GlassScreen>;
}
