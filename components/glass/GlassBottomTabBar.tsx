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
 const bottom=Math.max(8,insets.bottom+3);
 return <>
  <View pointerEvents="box-none" style={[s.wrap,{bottom}]}>
   <View style={[s.bar,glassSurface(true)]}>
    <Nav icon="home" outline="home-outline" label="หน้าแรก" active={active==='index'} onPress={()=>navigation.navigate('index')}/>
    <Nav icon="map" outline="map-outline" label="แผนที่" active={active==='map'} onPress={()=>navigation.navigate('map')}/>
    <View style={s.addSlot}><SpringButton onPress={()=>setOpen(true)}><View style={s.add}><View style={s.addGlow}/><Ionicons name="add" size={27} color={GLASS.white}/></View></SpringButton></View>
    <Nav icon="briefcase" outline="briefcase-outline" label="ทริป" active={active==='trips'} onPress={()=>navigation.navigate('trips')}/>
    <Nav icon="person" outline="person-outline" label="ฉัน" active={false} onPress={()=>router.push('/account')}/>
   </View>
  </View>

  <Modal transparent visible={open} animationType="fade" onRequestClose={()=>setOpen(false)}>
   <View style={s.modalRoot}>
    <Pressable style={s.backdrop} onPress={()=>setOpen(false)}/>
    <View style={[s.sheet,glassSurface(true)]}>
     <View style={s.handle}/><Text style={s.sheetTitle}>เพิ่มอย่างรวดเร็ว</Text><Text style={s.sheetSub}>เลือกสิ่งที่ต้องการทำ</Text>
     <View style={s.quickGrid}>
      <Quick icon="location" title="เพิ่มสถานที่" sub="ค้นหาและบันทึก" onPress={()=>{setOpen(false);router.push('/search')}}/>
      <Quick icon="calendar" title="สร้างทริป" sub="ทำเอง / แยกข้อความ" onPress={()=>{setOpen(false);navigation.navigate('trips')}}/>
      <Quick icon="book" title="Journal" sub="บันทึกความทรงจำ" onPress={()=>{setOpen(false);router.push('/journal')}}/>
      <Quick icon="heart" title="Wishlist" sub="สถานที่ที่อยากไป" onPress={()=>{setOpen(false);navigation.navigate('wishlist')}}/>
     </View>
    </View>
   </View>
  </Modal>
 </>
}

function Nav({icon,outline,label,active,onPress}:{icon:any;outline:any;label:string;active:boolean;onPress:()=>void}){
 return <SpringButton onPress={onPress} style={s.nav}><View style={s.navContent}><View style={[s.navIcon,active&&s.navIconActive]}><Ionicons name={active?icon:outline} size={20} color={active?GLASS.aqua:GLASS_TEXT.secondary}/></View><Text style={[s.label,active&&s.labelActive]}>{label}</Text></View></SpringButton>
}

function Quick({icon,title,sub,onPress}:{icon:any;title:string;sub:string;onPress:()=>void}){
 return <SpringButton style={s.quick} onPress={onPress}><View style={s.quickIcon}><Ionicons name={icon} size={20} color={GLASS.white}/></View><View style={{flex:1,minWidth:0}}><Text style={s.quickTitle}>{title}</Text><Text style={s.quickSub}>{sub}</Text></View><Ionicons name="chevron-forward" size={16} color={GLASS_TEXT.tertiary}/></SpringButton>
}

function SpringButton({children,onPress,style}:{children:React.ReactNode;onPress:()=>void;style?:any}){
 const v=useRef(new Animated.Value(1)).current;
 return <Animated.View style={[style,{transform:[{scale:v}]}]}><Pressable style={s.pressFill} onPress={onPress} onPressIn={()=>Animated.spring(v,{toValue:.95,useNativeDriver:true,damping:14,stiffness:300}).start()} onPressOut={()=>Animated.spring(v,{toValue:1,useNativeDriver:true,damping:14,stiffness:240}).start()}>{children}</Pressable></Animated.View>
}

const s=StyleSheet.create({
 wrap:{position:'absolute',left:10,right:10,alignItems:'center'},bar:{width:'100%',maxWidth:402,height:64,borderRadius:24,flexDirection:'row',alignItems:'center',paddingHorizontal:4,overflow:'visible'},
 nav:{flex:1,minWidth:0,height:58},pressFill:{width:'100%',height:'100%',alignItems:'center',justifyContent:'center',flexDirection:'row'},navContent:{alignItems:'center',justifyContent:'center',gap:1},navIcon:{height:29,minWidth:32,borderRadius:13,alignItems:'center',justifyContent:'center'},navIconActive:{backgroundColor:'rgba(115,240,248,.15)',borderWidth:1,borderColor:'rgba(115,240,248,.18)'},label:{fontSize:9.5,fontWeight:'800',color:GLASS_TEXT.secondary,marginTop:1},labelActive:{color:GLASS.white},
 addSlot:{width:60,height:64,alignItems:'center',justifyContent:'center'},add:{width:52,height:52,borderRadius:26,backgroundColor:'rgba(53,223,235,.88)',borderWidth:1,borderColor:'rgba(255,255,255,.58)',alignItems:'center',justifyContent:'center',shadowColor:GLASS.aqua,shadowOpacity:.32,shadowRadius:17,elevation:10,overflow:'hidden'},addGlow:{position:'absolute',width:46,height:20,borderRadius:18,top:4,backgroundColor:'rgba(255,255,255,.18)'},
 modalRoot:{flex:1,justifyContent:'flex-end',alignItems:'center',padding:12},backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(1,25,34,.62)'},sheet:{width:'100%',maxWidth:402,borderRadius:GLASS_RADIUS.xl,padding:16,paddingBottom:20,overflow:'hidden',...(Platform.OS==='web'?({backdropFilter:'blur(30px)',WebkitBackdropFilter:'blur(30px)'} as any):{})},handle:{alignSelf:'center',width:40,height:4,borderRadius:2,backgroundColor:'rgba(255,255,255,.54)',marginBottom:12},sheetTitle:{fontSize:20,fontWeight:'900',color:GLASS.white},sheetSub:{fontSize:11,fontWeight:'600',color:GLASS_TEXT.secondary,marginTop:2},quickGrid:{gap:8,marginTop:13},quick:{height:62,borderRadius:16,backgroundColor:'rgba(255,255,255,.08)',borderWidth:1,borderColor:'rgba(255,255,255,.16)',paddingHorizontal:9},quickIcon:{width:38,height:38,borderRadius:13,backgroundColor:'rgba(115,240,248,.11)',alignItems:'center',justifyContent:'center',marginRight:9},quickTitle:{fontSize:12.5,fontWeight:'900',color:GLASS.white},quickSub:{fontSize:9.5,fontWeight:'600',color:GLASS_TEXT.tertiary,marginTop:2},
});
