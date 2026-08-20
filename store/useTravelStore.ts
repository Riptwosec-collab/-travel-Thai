import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { JournalEntry, Region, TravelPreferences, Trip } from '@/types';

interface TravelState {
  searchQuery: string;
  selectedCategory: string;
  selectedRegion: Region | 'ทั้งหมด';
  visitedPlaceIds: string[];
  wishlistPlaceIds: string[];
  visitedProvinceIds: string[];
  wishlistProvinceIds: string[];
  trips: Trip[];
  journals: JournalEntry[];
  preferences: TravelPreferences;
  setSearchQuery: (q:string)=>void;
  setSelectedCategory: (v:string)=>void;
  setSelectedRegion: (v:Region|'ทั้งหมด')=>void;
  toggleVisitedPlace: (id:string)=>void;
  toggleWishlistPlace: (id:string)=>void;
  toggleVisitedProvince: (id:string)=>void;
  toggleWishlistProvince: (id:string)=>void;
  createTrip: (trip:Trip)=>void;
  updateTrip: (id:string, patch:Partial<Trip>)=>void;
  deleteTrip: (id:string)=>void;
  addJournal: (entry:JournalEntry)=>void;
  deleteJournal: (id:string)=>void;
  setPreferences: (patch:Partial<TravelPreferences>)=>void;
  resetAll: ()=>void;
}

const initialPreferences: TravelPreferences = {
  interests: ['ธรรมชาติ','คาเฟ่'], budget:'กลาง', travelStyle:'คู่', favoriteRegions:['ภาคเหนือ'], onboardingDone:false,
};

const toggle=(arr:string[],id:string)=>arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];
const stringArray=(value:unknown):string[]=>Array.isArray(value)?value.filter((x):x is string=>typeof x==='string'):[];

function sanitizePreferences(value:any):TravelPreferences{
  return {
    ...initialPreferences,
    ...(value&&typeof value==='object'?value:{}),
    interests:Array.isArray(value?.interests)?stringArray(value.interests):initialPreferences.interests,
    favoriteRegions:Array.isArray(value?.favoriteRegions)?stringArray(value.favoriteRegions) as Region[]:initialPreferences.favoriteRegions,
    budget:typeof value?.budget==='string'?value.budget as TravelPreferences['budget']:initialPreferences.budget,
    travelStyle:typeof value?.travelStyle==='string'?value.travelStyle as TravelPreferences['travelStyle']:initialPreferences.travelStyle,
    onboardingDone:typeof value?.onboardingDone==='boolean'?value.onboardingDone:initialPreferences.onboardingDone,
  };
}

function sanitizePersisted(value:any){
  const raw=value&&typeof value==='object'?value:{};
  return {
    visitedPlaceIds:stringArray(raw.visitedPlaceIds),
    wishlistPlaceIds:stringArray(raw.wishlistPlaceIds),
    visitedProvinceIds:stringArray(raw.visitedProvinceIds),
    wishlistProvinceIds:stringArray(raw.wishlistProvinceIds),
    trips:Array.isArray(raw.trips)?raw.trips:[],
    journals:Array.isArray(raw.journals)?raw.journals:[],
    preferences:sanitizePreferences(raw.preferences),
  };
}

export const useTravelStore = create<TravelState>()(persist((set)=>({
  searchQuery:'', selectedCategory:'ทั้งหมด', selectedRegion:'ทั้งหมด',
  visitedPlaceIds:[], wishlistPlaceIds:[], visitedProvinceIds:[], wishlistProvinceIds:[],
  trips:[], journals:[], preferences:initialPreferences,
  setSearchQuery:(searchQuery)=>set({searchQuery}),
  setSelectedCategory:(selectedCategory)=>set({selectedCategory}),
  setSelectedRegion:(selectedRegion)=>set({selectedRegion}),
  toggleVisitedPlace:(id)=>set(s=>({visitedPlaceIds:toggle(s.visitedPlaceIds,id)})),
  toggleWishlistPlace:(id)=>set(s=>({wishlistPlaceIds:toggle(s.wishlistPlaceIds,id)})),
  toggleVisitedProvince:(id)=>set(s=>({visitedProvinceIds:toggle(s.visitedProvinceIds,id)})),
  toggleWishlistProvince:(id)=>set(s=>({wishlistProvinceIds:toggle(s.wishlistProvinceIds,id)})),
  createTrip:(trip)=>set(s=>({trips:[trip,...s.trips]})),
  updateTrip:(id,patch)=>set(s=>({trips:s.trips.map(t=>t.id===id?{...t,...patch}:t)})),
  deleteTrip:(id)=>set(s=>({trips:s.trips.filter(t=>t.id!==id)})),
  addJournal:(entry)=>set(s=>({journals:[entry,...s.journals]})),
  deleteJournal:(id)=>set(s=>({journals:s.journals.filter(j=>j.id!==id)})),
  setPreferences:(patch)=>set(s=>({preferences:sanitizePreferences({...s.preferences,...patch})})),
  resetAll:()=>set({searchQuery:'',selectedCategory:'ทั้งหมด',selectedRegion:'ทั้งหมด',visitedPlaceIds:[],wishlistPlaceIds:[],visitedProvinceIds:[],wishlistProvinceIds:[],trips:[],journals:[],preferences:initialPreferences}),
}),{
  name:'travel-thai-v2',
  version:3,
  storage:createJSONStorage(()=>AsyncStorage),
  partialize:(s)=>({visitedPlaceIds:s.visitedPlaceIds,wishlistPlaceIds:s.wishlistPlaceIds,visitedProvinceIds:s.visitedProvinceIds,wishlistProvinceIds:s.wishlistProvinceIds,trips:s.trips,journals:s.journals,preferences:s.preferences}),
  migrate:(persistedState)=>sanitizePersisted(persistedState),
  merge:(persistedState,currentState)=>{
    const safe=sanitizePersisted(persistedState);
    return {...currentState,...safe,preferences:sanitizePreferences(safe.preferences)};
  },
}));
