import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '@/constants/theme';
import { Place } from '@/types';
import { useTravelStore } from '@/store/useTravelStore';

export default function PlaceCard({place,compact=false}:{place:Place;compact?:boolean}){
 const router=useRouter();const scale=useRef(new Animated.Value(1)).current;
 const {wishlistPlaceIds,visitedPlaceIds,toggleWishlistPlace}=useTravelStore();
 const wish=wishlistPlaceIds.includes(place.id),visited=visitedPlaceIds.includes(place.id);
 const animate=(to:number)=>Animated.spring(scale,{toValue:to,useNativeDriver:true,speed:28,bounciness:5}).start();
 return <Animated.View style={[s.card,compact&&s.compact,{transform:[{scale}]}]}>
  <Pressable style={StyleSheet.absoluteFill} onPressIn={()=>animate(.97)} onPressOut={()=>animate(1)} onPress={()=>router.push({pathname:'/place-detail',params:{id:place.id}})}>
   <Image source={place.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk"/>
   <View style={s.overlay}/>
   <View style={s.info}><Text style={s.title} numberOfLines={1}>{place.name}</Text><Text style={s.location}><Ionicons name="location" size={12}/> {place.province}</Text><View style={s.meta}><Text style={s.rating}>★ {place.rating}</Text><Text style={s.category}>{place.category}</Text></View></View>
  </Pressable>
  <Pressable style={s.heart} onPress={()=>toggleWishlistPlace(place.id)}><Ionicons name={wish?'heart':'heart-outline'} size={20} color={wish?COLORS.wishlist:'#fff'}/></Pressable>
  {visited&&<View style={s.visited}><Ionicons name="checkmark-circle" color={COLORS.visited} size={15}/><Text style={s.visitedText}>ไปแล้ว</Text></View>}
 </Animated.View>
}
const s=StyleSheet.create({card:{height:238,borderRadius:RADIUS.lg,overflow:'hidden',backgroundColor:'#DDE5E8',...SHADOW},compact:{height:190},overlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,14,18,.18)',borderBottomWidth:90,borderBottomColor:'rgba(3,14,18,.56)'},heart:{position:'absolute',right:14,top:14,width:38,height:38,borderRadius:19,backgroundColor:'rgba(10,20,24,.38)',alignItems:'center',justifyContent:'center'},visited:{position:'absolute',left:14,top:14,flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'rgba(255,255,255,.94)',paddingHorizontal:10,paddingVertical:6,borderRadius:999},visitedText:{fontWeight:'800',fontSize:12,color:COLORS.visited},info:{position:'absolute',left:16,right:16,bottom:15},title:{color:'#fff',fontSize:20,fontWeight:'900'},location:{color:'rgba(255,255,255,.88)',fontSize:13,marginTop:3},meta:{flexDirection:'row',gap:8,marginTop:8},rating:{backgroundColor:'rgba(0,0,0,.48)',color:'#fff',fontWeight:'800',fontSize:12,paddingHorizontal:8,paddingVertical:4,borderRadius:999},category:{backgroundColor:'rgba(255,255,255,.2)',color:'#fff',fontWeight:'800',fontSize:12,paddingHorizontal:8,paddingVertical:4,borderRadius:999}});
