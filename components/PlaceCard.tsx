import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOW } from '@/constants/theme';
import { Place } from '@/types';
import { useTravelStore } from '@/store/useTravelStore';

export default function PlaceCard({place,compact=false}:{place:Place;compact?:boolean}){
 const router=useRouter();
 const scale=useRef(new Animated.Value(1)).current;
 const lift=useRef(new Animated.Value(0)).current;
 const heartScale=useRef(new Animated.Value(1)).current;
 const {wishlistPlaceIds,visitedPlaceIds,toggleWishlistPlace}=useTravelStore();
 const wish=wishlistPlaceIds.includes(place.id),visited=visitedPlaceIds.includes(place.id);

 const press=(to:number)=>Animated.spring(scale,{toValue:to,useNativeDriver:true,damping:17,stiffness:260,mass:.45}).start();
 const hover=(to:number)=>Animated.spring(lift,{toValue:to,useNativeDriver:true,damping:18,stiffness:220,mass:.55}).start();
 const toggleWish=()=>{
   toggleWishlistPlace(place.id);
   Animated.sequence([
     Animated.spring(heartScale,{toValue:1.22,useNativeDriver:true,damping:12,stiffness:300,mass:.35}),
     Animated.spring(heartScale,{toValue:1,useNativeDriver:true,damping:14,stiffness:260,mass:.4}),
   ]).start();
 };

 const webHover=Platform.OS==='web'?({onMouseEnter:()=>hover(1),onMouseLeave:()=>hover(0)} as any):{};
 return <Animated.View
  {...webHover}
  style={[
    s.card,
    compact&&s.compact,
    {
      transform:[
        {scale},
        {translateY:lift.interpolate({inputRange:[0,1],outputRange:[0,-5]})},
      ],
    },
  ]}
 >
  <Pressable
   style={StyleSheet.absoluteFill}
   onPressIn={()=>press(.985)}
   onPressOut={()=>press(1)}
   onPress={()=>router.push({pathname:'/place-detail',params:{id:place.id}})}
   accessibilityRole="button"
   accessibilityLabel={`${place.name} จังหวัด${place.province}`}
  >
   <Image source={place.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk"/>
   <View style={s.overlay}/>
   <View style={s.info}>
    <Text style={s.title} numberOfLines={1}>{place.name}</Text>
    <Text style={s.location} numberOfLines={1}><Ionicons name="location" size={12}/> {place.province}</Text>
    <View style={s.meta}><Text style={s.rating}>★ {place.rating}</Text><Text style={s.category}>{place.category}</Text></View>
   </View>
  </Pressable>
  <Animated.View style={[s.heartWrap,{transform:[{scale:heartScale}]}]}>
   <Pressable style={s.heart} onPress={toggleWish} hitSlop={8} accessibilityRole="button" accessibilityLabel={wish?'นำออกจากอยากไป':'เพิ่มในอยากไป'}>
    <Ionicons name={wish?'heart':'heart-outline'} size={20} color={wish?COLORS.wishlist:'#fff'}/>
   </Pressable>
  </Animated.View>
  {visited&&<View style={s.visited}><Ionicons name="checkmark-circle" color={COLORS.visited} size={15}/><Text style={s.visitedText}>ไปแล้ว</Text></View>}
 </Animated.View>
}

const s=StyleSheet.create({
 card:{height:238,borderRadius:RADIUS.lg,overflow:'hidden',backgroundColor:'#DDE5E8',...SHADOW},
 compact:{height:190},
 overlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,14,18,.18)',borderBottomWidth:90,borderBottomColor:'rgba(3,14,18,.56)'},
 heartWrap:{position:'absolute',right:14,top:14},
 heart:{width:38,height:38,borderRadius:19,backgroundColor:'rgba(10,20,24,.38)',alignItems:'center',justifyContent:'center'},
 visited:{position:'absolute',left:14,top:14,flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'rgba(255,255,255,.94)',paddingHorizontal:10,paddingVertical:6,borderRadius:999},
 visitedText:{fontWeight:'800',fontSize:12,color:COLORS.visited},
 info:{position:'absolute',left:16,right:16,bottom:15},
 title:{color:'#fff',fontSize:20,fontWeight:'900'},
 location:{color:'rgba(255,255,255,.88)',fontSize:13,marginTop:3},
 meta:{flexDirection:'row',gap:8,marginTop:8,flexWrap:'wrap'},
 rating:{backgroundColor:'rgba(0,0,0,.48)',color:'#fff',fontWeight:'800',fontSize:12,paddingHorizontal:8,paddingVertical:4,borderRadius:999},
 category:{backgroundColor:'rgba(255,255,255,.2)',color:'#fff',fontWeight:'800',fontSize:12,paddingHorizontal:8,paddingVertical:4,borderRadius:999},
});