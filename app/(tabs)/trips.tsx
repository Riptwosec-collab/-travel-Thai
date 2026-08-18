import React from 'react';
import TripPlannerCore from '@/components/TripPlannerCore';
import { GlassScreen } from '@/components/glass';
import { PLACES, PROVINCES } from '@/data/catalog';

export default function TripsGlass(){
  const background=PLACES.find(x=>x.category==='ธรรมชาติ')?.image||PLACES.find(x=>x.category==='วัด')?.image||PROVINCES[29]?.coverImage||PROVINCES[0].coverImage;
  return <GlassScreen image={background}><TripPlannerCore/></GlassScreen>;
}
