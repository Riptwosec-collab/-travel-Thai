import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { GLASS, GLASS_RADIUS, GLASS_TEXT, glassSurface } from '@/constants/glassTheme';

export function GlassScreen({children,image}:{children:React.ReactNode;image:string}){
  const zoom=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    const loop=Animated.loop(Animated.sequence([
      Animated.timing(zoom,{toValue:1,duration:12000,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
      Animated.timing(zoom,{toValue:0,duration:12000,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
    ]));
    loop.start();
    return()=>loop.stop();
  },[zoom]);
  return <View style={styles.screen}>
    <View pointerEvents="none" style={styles.base}/>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:.96,transform:[{scale:zoom.interpolate({inputRange:[0,1],outputRange:[1.015,1.055]})}]}]}>
      <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={350} cachePolicy="memory-disk"/>
    </Animated.View>
    <View pointerEvents="none" style={styles.photoWash}/>
    <View pointerEvents="none" style={styles.topTint}/>
    <View pointerEvents="none" style={styles.midTint}/>
    <View pointerEvents="none" style={styles.bottomTint}/>
    <View pointerEvents="none" style={styles.edgeVignette}/>
    <View pointerEvents="none" style={styles.bloomA}/>
    <View pointerEvents="none" style={styles.bloomB}/>
    <View pointerEvents="none" style={styles.horizon}/>
    {children}
  </View>;
}

export function GlassCard({children,style,strong=false}:{children:React.ReactNode;style?:ViewStyle|ViewStyle[]|any;strong?:boolean}){
  return <View style={[styles.card,glassSurface(strong),style]}>
    <View pointerEvents="none" style={styles.reflection}/>
    <View pointerEvents="none" style={styles.cardShade}/>
    {children}
  </View>;
}

export function GlassPressable({children,onPress,style,accessibilityLabel}:{children:React.ReactNode;onPress:()=>void;style?:any;accessibilityLabel?:string}){
  const scale=useRef(new Animated.Value(1)).current;
  const lift=useRef(new Animated.Value(0)).current;
  const pressIn=()=>Animated.spring(scale,{toValue:.97,useNativeDriver:true,damping:15,stiffness:280,mass:.35}).start();
  const pressOut=()=>Animated.spring(scale,{toValue:1,useNativeDriver:true,damping:14,stiffness:240,mass:.4}).start();
  const hoverProps=Platform.OS==='web'?({
    onMouseEnter:()=>Animated.spring(lift,{toValue:1,useNativeDriver:true,damping:17,stiffness:190}).start(),
    onMouseLeave:()=>Animated.spring(lift,{toValue:0,useNativeDriver:true,damping:17,stiffness:190}).start(),
  } as any):{};
  return <Animated.View {...hoverProps} style={[style,{transform:[{scale},{translateY:lift.interpolate({inputRange:[0,1],outputRange:[0,-4]})}]}]}>
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={[styles.pressFill,style]}>{children}</Pressable>
  </Animated.View>;
}

export function GlassCircleButton({icon,onPress,size=44,active=false,label}:{icon:any;onPress:()=>void;size?:number;active?:boolean;label?:string}){
  return <GlassPressable onPress={onPress} accessibilityLabel={label} style={[styles.circle,{width:size,height:size,borderRadius:size/2},glassSurface(active)]}>
    <Ionicons name={icon} size={Math.round(size*.47)} color={active?GLASS.gold:GLASS.white}/>
  </GlassPressable>;
}

export function GlassSearch({value,onChangeText,placeholder,onPress,showFilter=true,...props}:{value?:string;onChangeText?:(v:string)=>void;placeholder:string;onPress?:()=>void;showFilter?:boolean}&TextInputProps){
  const body=<>
    <Ionicons name="search" size={20} color={GLASS.white}/>
    {onPress?<Text style={styles.searchPlaceholder}>{placeholder}</Text>:<TextInput {...props} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="rgba(255,255,255,.88)" style={styles.searchInput}/>} 
    {showFilter&&<View style={styles.searchTail}><Ionicons name="options-outline" size={19} color={GLASS.white}/></View>}
  </>;
  return onPress?<GlassPressable onPress={onPress} style={[styles.search,glassSurface(true)]}>{body}</GlassPressable>:<View style={[styles.search,glassSurface(true)]}>{body}</View>;
}

export function GlassChip({label,active=false,onPress}:{label:string;active?:boolean;onPress?:()=>void}){
  const inner=<View style={[styles.chip,active&&styles.chipActive]}><Text style={[styles.chipText,active&&styles.chipTextActive]}>{label}</Text></View>;
  return onPress?<GlassPressable onPress={onPress}>{inner}</GlassPressable>:inner;
}

export function GlassSection({title,subtitle,right}:{title:string;subtitle?:string;right?:React.ReactNode}){
  return <View style={styles.sectionHead}><View style={{flex:1,minWidth:0}}><Text style={styles.sectionTitle}>{title}</Text>{subtitle&&<Text style={styles.sectionSub}>{subtitle}</Text>}</View>{right}</View>;
}

export function GlassStatCard({icon,label,value,sub}:{icon:any;label:string;value:string|number;sub?:string}){
  return <GlassCard style={styles.stat}><View style={styles.statIcon}><Ionicons name={icon} size={20} color={GLASS.white}/></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text>{sub&&<Text style={styles.statSub}>{sub}</Text>}</GlassCard>;
}

export function GlassProgress({value,height=7}:{value:number;height?:number}){
  const anim=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.timing(anim,{toValue:Math.max(0,Math.min(100,value)),duration:700,easing:Easing.out(Easing.cubic),useNativeDriver:false}).start()},[value,anim]);
  return <View style={[styles.progress,{height}]}><Animated.View style={[styles.progressFill,{width:anim.interpolate({inputRange:[0,100],outputRange:['0%','100%']})}]}/></View>;
}

export function GlassPageEnter({children,delay=0,style}:{children:React.ReactNode;delay?:number;style?:any}){
  const v=useRef(new Animated.Value(0)).current;
  useEffect(()=>{Animated.timing(v,{toValue:1,duration:520,delay,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start()},[v,delay]);
  return <Animated.View style={[style,{opacity:v,transform:[{translateY:v.interpolate({inputRange:[0,1],outputRange:[16,0]})},{scale:v.interpolate({inputRange:[0,1],outputRange:[.985,1]})}]}]}>{children}</Animated.View>;
}

export function GlassHeader({eyebrow,title,subtitle,right}:{eyebrow?:string;title:string;subtitle?:string;right?:React.ReactNode}){
  return <View style={styles.header}><View style={{flex:1,minWidth:0}}>{eyebrow&&<Text style={styles.eyebrow}>{eyebrow}</Text>}<Text style={styles.headerTitle}>{title}</Text>{subtitle&&<Text style={styles.headerSub}>{subtitle}</Text>}</View>{right}</View>;
}

export const glassText = {
  primary: {color:GLASS_TEXT.primary} as const,
  secondary: {color:GLASS_TEXT.secondary} as const,
  tertiary: {color:GLASS_TEXT.tertiary} as const,
  dark: {color:GLASS.ink} as const,
};

const readableShadow = Platform.OS==='web'
  ? ({textShadow:'0 1px 10px rgba(0,24,33,.40)'} as any)
  : ({textShadowColor:'rgba(0,24,33,.40)',textShadowOffset:{width:0,height:1},textShadowRadius:5} as any);

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:GLASS.tealNight,overflow:'hidden'},
  base:{...StyleSheet.absoluteFillObject,backgroundColor:GLASS.tealNight},
  photoWash:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(40,189,207,.08)'},
  topTint:{...StyleSheet.absoluteFillObject,backgroundColor:GLASS.overlayTop},
  midTint:{position:'absolute',left:0,right:0,top:'30%',bottom:'20%',backgroundColor:GLASS.overlayMid},
  bottomTint:{position:'absolute',left:0,right:0,bottom:0,height:'44%',backgroundColor:GLASS.overlayBottom},
  edgeVignette:{...StyleSheet.absoluteFillObject,backgroundColor:GLASS.overlayVignette},
  bloomA:{position:'absolute',width:390,height:390,borderRadius:195,top:-142,right:-112,backgroundColor:'rgba(216,252,255,.19)'},
  bloomB:{position:'absolute',width:330,height:330,borderRadius:165,bottom:20,left:-135,backgroundColor:'rgba(255,226,167,.08)'},
  horizon:{position:'absolute',left:-80,right:-80,bottom:-130,height:240,borderRadius:240,backgroundColor:'rgba(28,188,204,.12)',borderTopWidth:1,borderTopColor:'rgba(236,255,255,.18)'},
  card:{borderRadius:GLASS_RADIUS.lg,overflow:'hidden'},
  reflection:{position:'absolute',left:18,right:18,top:0,height:1,backgroundColor:GLASS.highlight,zIndex:2},
  cardShade:{position:'absolute',left:0,right:0,bottom:0,height:'38%',backgroundColor:'rgba(3,74,91,.06)'},
  pressFill:{width:'100%',height:'100%',flexDirection:'row',alignItems:'center',justifyContent:'center'},
  circle:{alignItems:'center',justifyContent:'center',overflow:'hidden'},
  search:{minHeight:52,borderRadius:GLASS_RADIUS.md,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:15,overflow:'hidden'},
  searchInput:{flex:1,color:GLASS.white,fontSize:14,fontWeight:'600',paddingVertical:0,...readableShadow},
  searchPlaceholder:{flex:1,color:'rgba(255,255,255,.91)',fontSize:14,fontWeight:'600',...readableShadow},
  searchTail:{width:34,height:34,borderRadius:17,backgroundColor:'rgba(255,255,255,.13)',borderWidth:1,borderColor:'rgba(255,255,255,.16)',alignItems:'center',justifyContent:'center'},
  chip:{minHeight:36,borderRadius:GLASS_RADIUS.pill,paddingHorizontal:13,alignItems:'center',justifyContent:'center',backgroundColor:GLASS.glassSoft,borderWidth:1,borderColor:GLASS.border},
  chipActive:{backgroundColor:'rgba(53,223,235,.26)',borderColor:'rgba(255,255,255,.48)'},
  chipText:{fontSize:11,fontWeight:'800',color:GLASS_TEXT.secondary,...readableShadow},
  chipTextActive:{color:GLASS.white},
  sectionHead:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:12},
  sectionTitle:{fontSize:18,fontWeight:'900',color:GLASS.white,letterSpacing:-.2,...readableShadow},
  sectionSub:{fontSize:11,fontWeight:'600',color:GLASS_TEXT.secondary,marginTop:3,...readableShadow},
  stat:{flex:1,minWidth:130,minHeight:112,padding:14},
  statIcon:{width:38,height:38,borderRadius:14,backgroundColor:'rgba(255,255,255,.13)',borderWidth:1,borderColor:'rgba(255,255,255,.14)',alignItems:'center',justifyContent:'center'},
  statValue:{fontSize:22,fontWeight:'900',color:GLASS.white,marginTop:9,...readableShadow},
  statLabel:{fontSize:11,fontWeight:'800',color:GLASS_TEXT.secondary,marginTop:2,...readableShadow},
  statSub:{fontSize:9,fontWeight:'600',color:GLASS_TEXT.tertiary,marginTop:2,...readableShadow},
  progress:{width:'100%',borderRadius:999,backgroundColor:'rgba(255,255,255,.17)',overflow:'hidden'},
  progressFill:{height:'100%',borderRadius:999,backgroundColor:GLASS.aqua},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:14},
  eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:GLASS.gold,...readableShadow},
  headerTitle:{fontSize:30,fontWeight:'900',color:GLASS.white,letterSpacing:-.45,marginTop:2,...readableShadow},
  headerSub:{fontSize:13,fontWeight:'600',color:GLASS_TEXT.secondary,lineHeight:19,marginTop:4,...readableShadow},
});
