import React, { useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GLASS, GLASS_RADIUS, GLASS_TEXT, glassSurface } from '@/constants/glassTheme';

export default function GlassBottomTabBar({state,navigation}:{state:any;navigation:any}){
 const router=useRouter();
 const insets=useSafeAreaInsets();
 const [open,setOpen]=useState(false);
 const active=state?.routeNames?.[state.index];
 const bottom=Math.max(8,insets.bottom+2);
 return <>
  <View pointerEvents="box-none" style={[s.wrap,{bottom}]}>
   <View style={[s.bar,glassSurface(true)]}>
    <Nav icon="home" outline="home-outline" label="หน้าแรก" active={active==='index'} onPress={()=>navigation.navigate('index')}/>
    <Nav icon="map" outline="map-outline" label="แผนที่" active={active==='map'} onPress={()=>navigation.navigate('map')}/>
    <View style={s.addSlot}><SpringButton onPress={()=>setOpen(true)}><View style={s.add}><View style={s.addGlow}/><Ionicons name="add" size={31} color={GLASS.white}/></View></SpringButton></View>
    <Nav icon="briefcase" outline="briefcase-outline" label="ทริป" active={active==='trips'} onPress={()=>navigation.navigate('trips')}/>
    <Nav icon="person" outline="person-outline" label="ฉัน" active={false} onPress={()=>router.push('/account')}/>
   </View>
  </View>

  <Modal transparent visible={open} animationType="fade" onRequestClose={()=>setOpen(false)}>
   <View style={s.modalRoot}>
    <Pressable style={s.backdrop} onPress={()=>setOpen(false)}/>
    <View style={[s.sheet,glassSurface(true)]}>
     <View style={s.handle}/><Text style={s.sheetTitle}>Quick Add</Text><Text style={s.sheetSub}>เพิ่มสิ่งที่ต้องการได้ทันที</Text>
     <View style={s.quickGrid}>
      <Quick icon="location" title="เพิ่มสถานที่" sub="ค้นหาและบันทึก" onPress={()=>{setOpen(false);router.push('/search')}}/>
      <Quick icon="calendar" title="สร้างทริป" sub="Smart / Import" onPress={()=>{setOpen(false);navigation.navigate('trips')}}/>
      <Quick icon="book" title="Journal" sub="บันทึกความทรงจำ" onPress={()=>{setOpen(false);router.push('/journal')}}/>
      <Quick icon="heart" title="Wishlist" sub="สถานที่ที่อยากไป" onPress={()=>{setOpen(false);navigation.navigate('wishlist')}}/>
     </View>
    </View>
   </View>
  </Modal>
 </>
}

function Nav({icon,outline,label,active,onPress}:{icon:any;outline:any;label:string;active:boolean;onPress:()=>void}){
 return <SpringButton onPress={onPress} style={s.nav}><View style={s.navContent}><View style={[s.navIcon,active&&s.navIconActive]}><Ionicons name={active?icon:outline} size={21} color={active?GLASS.aqua:GLASS_TEXT.secondary}/></View><Text style={[s.label,active&&s.labelActive]}>{label}</Text></View></SpringButton>
}

function Quick({icon,title,sub,onPress}:{icon:any;title:string;sub:string;onPress:()=>void}){
 return <SpringButton style={s.quick} onPress={onPress}><View style={s.quickIcon}><Ionicons name={icon} size={21} color={GLASS.white}/></View><View style={{flex:1}}><Text style={s.quickTitle}>{title}</Text><Text style={s.quickSub}>{sub}</Text></View><Ionicons name="chevron-forward" size={16} color={GLASS_TEXT.tertiary}/></SpringButton>
}

function SpringButton({children,onPress,style}:{children:React.ReactNode;onPress:()=>void;style?:any}){
 const v=useRef(new Animated.Value(1)).current;
 return <Animated.View style={[style,{transform:[{scale:v}]}]}><Pressable style={s.pressFill} onPress={onPress} onPressIn={()=>Animated.spring(v,{toValue:.94,useNativeDriver:true,damping:14,stiffness:300}).start()} onPressOut={()=>Animated.spring(v,{toValue:1,useNativeDriver:true,damping:14,stiffness:240}).start()}>{children}</Pressable></Animated.View>
}

const s=StyleSheet.create({
 wrap:{position:'absolute',left:10,right:10,alignItems:'center'},bar:{width:'100%',maxWidth:690,height:74,borderRadius:31,flexDirection:'row',alignItems:'center',paddingHorizontal:5,overflow:'visible'},
 nav:{flex:1,height:66},pressFill:{width:'100%',height:'100%',alignItems:'center',justifyContent:'center',flexDirection:'row'},navContent:{alignItems:'center',justifyContent:'center',gap:2},navIcon:{height:33,minWidth:38,borderRadius:16,alignItems:'center',justifyContent:'center'},navIconActive:{backgroundColor:'rgba(130,244,251,.17)',borderWidth:1,borderColor:'rgba(130,244,251,.23)'},label:{fontSize:9,fontWeight:'800',color:GLASS_TEXT.secondary,marginTop:1},labelActive:{color:GLASS.white},
 addSlot:{width:78,height:74,alignItems:'center',justifyContent:'center'},add:{width:62,height:62,borderRadius:31,backgroundColor:'rgba(69,229,241,.90)',borderWidth:1,borderColor:'rgba(255,255,255,.64)',alignItems:'center',justifyContent:'center',shadowColor:GLASS.aqua,shadowOpacity:.45,shadowRadius:24,elevation:12,overflow:'hidden'},addGlow:{position:'absolute',width:56,height:25,borderRadius:20,top:4,backgroundColor:'rgba(255,255,255,.20)'},
 modalRoot:{flex:1,justifyContent:'flex-end',alignItems:'center',padding:14},backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(1,25,34,.62)'},sheet:{width:'100%',maxWidth:620,borderRadius:GLASS_RADIUS.xl,padding:18,paddingBottom:24,overflow:'hidden',...(Platform.OS==='web'?({backdropFilter:'blur(34px)',WebkitBackdropFilter:'blur(34px)'} as any):{})},handle:{alignSelf:'center',width:44,height:4,borderRadius:2,backgroundColor:'rgba(255,255,255,.54)',marginBottom:14},sheetTitle:{fontSize:22,fontWeight:'900',color:GLASS.white},sheetSub:{fontSize:11,fontWeight:'600',color:GLASS_TEXT.secondary,marginTop:3},quickGrid:{gap:9,marginTop:15},quick:{height:66,borderRadius:18,backgroundColor:'rgba(255,255,255,.08)',borderWidth:1,borderColor:'rgba(255,255,255,.16)',paddingHorizontal:10},quickIcon:{width:40,height:40,borderRadius:14,backgroundColor:'rgba(115,240,248,.11)',alignItems:'center',justifyContent:'center',marginRight:10},quickTitle:{fontSize:13,fontWeight:'900',color:GLASS.white},quickSub:{fontSize:9,fontWeight:'600',color:GLASS_TEXT.tertiary,marginTop:2},
});
