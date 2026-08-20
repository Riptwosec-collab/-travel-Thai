import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GLASS, GLASS_RADIUS, glassSurface } from '@/constants/glassTheme';
import { Place } from '@/types';
import { useTravelStore } from '@/store/useTravelStore';

export default function PlaceCard({place,compact=false,mini=false}:{place:Place;compact?:boolean;mini?:boolean}){
 const router=useRouter();
 const scale=useRef(new Animated.Value(1)).current;
 const lift=useRef(new Animated.Value(0)).current;
 const heartScale=useRef(new Animated.Value(1)).current;
 const {wishlistPlaceIds,visitedPlaceIds,toggleWishlistPlace}=useTravelStore();
 const wish=wishlistPlaceIds.includes(place.id),visited=visitedPlaceIds.includes(place.id);
 const press=(to:number)=>Animated.spring(scale,{toValue:to,useNativeDriver:true,damping:16,stiffness:270,mass:.38}).start();
 const hover=(to:number)=>Animated.spring(lift,{toValue:to,useNativeDriver:true,damping:18,stiffness:210,mass:.5}).start();
 const toggleWish=()=>{
   toggleWishlistPlace(place.id);
   Animated.sequence([
     Animated.spring(heartScale,{toValue:1.25,useNativeDriver:true,damping:10,stiffness:300,mass:.32}),
     Animated.spring(heartScale,{toValue:1,useNativeDriver:true,damping:14,stiffness:250,mass:.38}),
   ]).start();
 };
 const webHover=Platform.OS==='web'?({onMouseEnter:()=>hover(1),onMouseLeave:()=>hover(0)} as any):{};
 return <Animated.View {...webHover} style={[s.card,compact&&s.compact,mini&&s.mini,glassSurface(true),{transform:[{scale},{translateY:lift.interpolate({inputRange:[0,1],outputRange:[0,-6]})}]}]}>
  <Pressable
   style={StyleSheet.absoluteFill}
   onPressIn={()=>press(.97)}
   onPressOut={()=>press(1)}
   onPress={()=>router.push({pathname:'/place-detail',params:{id:place.id}})}
   accessibilityRole="button"
   accessibilityLabel={`${place.name} จังหวัด${place.province}`}
  >
   <Image source={place.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={280} cachePolicy="memory-disk"/>
   <View style={s.topGlow}/><View style={s.overlay}/><View style={s.glassFooter}/>
   <View style={[s.info,mini&&s.infoMini]}>
    <Text style={s.province}>{place.province}</Text>
    <Text style={[s.title,mini&&s.titleMini]} numberOfLines={1}>{place.name}</Text>
    <View style={s.meta}><Text style={[s.rating,mini&&s.pillMini]}>★ {place.rating}</Text>{!mini&&<Text style={s.category}>{place.category}</Text>}</View>
   </View>
  </Pressable>
  <Animated.View style={[s.heartWrap,mini&&s.heartWrapMini,{transform:[{scale:heartScale}]}]}>
   <Pressable style={[s.heart,mini&&s.heartMini,glassSurface()]} onPress={toggleWish} hitSlop={8} accessibilityRole="button" accessibilityLabel={wish?'นำออกจากอยากไป':'เพิ่มในอยากไป'}>
    <Ionicons name={wish?'heart':'heart-outline'} size={mini?15:19} color={wish?GLASS.gold:GLASS.white}/>
   </Pressable>
  </Animated.View>
  {visited&&<View style={[s.visited,glassSurface(true)]}><Ionicons name="checkmark-circle" color={GLASS.emerald} size={14}/><Text style={s.visitedText}>ไปแล้ว</Text></View>}
 </Animated.View>
}

const s=StyleSheet.create({
 card:{height:244,borderRadius:GLASS_RADIUS.lg,overflow:'hidden',backgroundColor:'rgba(4,80,96,.18)',borderWidth:1,borderColor:'rgba(255,255,255,.32)'},compact:{height:198},mini:{height:154,borderRadius:18},
 topGlow:{position:'absolute',left:14,right:14,top:0,height:1,backgroundColor:'rgba(255,255,255,.70)'},
 overlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(4,30,42,.10)',borderBottomWidth:105,borderBottomColor:'rgba(3,44,56,.65)'},
 glassFooter:{position:'absolute',left:9,right:9,bottom:9,height:87,borderRadius:20,backgroundColor:'rgba(255,255,255,.10)',borderWidth:1,borderColor:'rgba(255,255,255,.18)',...(Platform.OS==='web'?({backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'} as any):{})},
 heartWrap:{position:'absolute',right:13,top:13},heartWrapMini:{right:8,top:8},heart:{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center'},heartMini:{width:30,height:30,borderRadius:15},
 visited:{position:'absolute',left:13,top:13,flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:9,paddingVertical:6,borderRadius:999},visitedText:{fontWeight:'900',fontSize:10,color:GLASS.white},
 info:{position:'absolute',left:20,right:20,bottom:18},infoMini:{left:10,right:8,bottom:10},province:{fontSize:9,fontWeight:'900',letterSpacing:.7,color:'rgba(255,255,255,.78)'},title:{color:GLASS.white,fontSize:19,fontWeight:'900',marginTop:2,letterSpacing:-.25},titleMini:{fontSize:12},meta:{flexDirection:'row',gap:7,marginTop:8,flexWrap:'wrap'},
 rating:{backgroundColor:'rgba(2,41,51,.46)',color:GLASS.white,fontWeight:'900',fontSize:10,paddingHorizontal:8,paddingVertical:4,borderRadius:999,borderWidth:1,borderColor:'rgba(255,255,255,.16)'},
 pillMini:{fontSize:8,paddingHorizontal:6,paddingVertical:3},category:{backgroundColor:'rgba(255,255,255,.14)',color:GLASS.white,fontWeight:'900',fontSize:10,paddingHorizontal:8,paddingVertical:4,borderRadius:999,borderWidth:1,borderColor:'rgba(255,255,255,.16)'},
});
