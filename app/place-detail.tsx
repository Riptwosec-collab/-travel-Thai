import React from 'react';
import { Linking, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PLACES } from '@/data/catalog';
import { GLASS, GLASS_RADIUS, glassSurface } from '@/constants/glassTheme';
import { useTravelStore } from '@/store/useTravelStore';
import PlaceCard from '@/components/PlaceCard';
import { GlassCard, GlassCircleButton, GlassPageEnter, GlassPressable, GlassScreen, GlassSection } from '@/components/glass';

export default function PlaceDetail(){
 const {id}=useLocalSearchParams<{id:string}>();
 const router=useRouter();
 const {width}=useWindowDimensions();
 const wide=width>=940;
 const place=PLACES.find(p=>p.id===id);
 const {visitedPlaceIds,wishlistPlaceIds,toggleVisitedPlace,toggleWishlistPlace}=useTravelStore();
 if(!place)return <SafeAreaView style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text>ไม่พบสถานที่</Text></SafeAreaView>;
 const visited=visitedPlaceIds.includes(place.id),wish=wishlistPlaceIds.includes(place.id);
 const nearby=PLACES.filter(p=>p.provinceId===place.provinceId&&p.id!==place.id).slice(0,3);
 const openMap=()=>Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`);
 const openReviews=()=>Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name+' '+place.province)}`);
 const openInfo=()=>Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(place.name+' '+place.province+' ข้อมูลท่องเที่ยว')}`);
 const share=()=>Share.share({message:`${place.name} · ${place.province}\n${place.description}`});

 return <GlassScreen image={place.image}>
  <SafeAreaView style={s.safe} edges={['top','bottom']}>
   <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
    <View style={[s.page,wide&&s.pageWide]}>
     <GlassPageEnter>
      <View style={s.hero}>
       <Image source={place.image} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={300}/>
       <View style={s.heroTint}/><View style={s.heroBottom}/>
       <View style={s.heroActions}><GlassCircleButton icon="chevron-back" label="ย้อนกลับ" onPress={()=>router.back()}/><View style={{flex:1}}/><GlassCircleButton icon={wish?'heart':'heart-outline'} active={wish} label="Wishlist" onPress={()=>toggleWishlistPlace(place.id)}/><GlassCircleButton icon="share-social-outline" label="แชร์" onPress={share}/></View>
       <View style={s.heroText}><Text style={s.category}>{place.category}</Text><Text style={s.title}>{place.name}</Text><Text style={s.titleEn}>{place.province.toUpperCase()} · THAILAND</Text><View style={s.heroMeta}><Text style={s.metaPill}>★ {place.rating}</Text><Text style={s.metaPill}>{place.reviewCount.toLocaleString()} รีวิว</Text><Text style={s.metaPill}><Ionicons name="location" size={11}/> {place.province}</Text></View></View>
      </View>
     </GlassPageEnter>

     <GlassPageEnter delay={80}>
      <View style={s.actionGrid}>
       <Action icon="information-circle" label="ข้อมูล" sub="Info" onPress={openInfo}/>
       <Action icon="walk" label="การเดินทาง" sub="How to go" onPress={openMap}/>
       <Action icon="chatbubble-ellipses" label="รีวิว" sub="Reviews" onPress={openReviews}/>
       <Action icon="create" label="บันทึก" sub="Journal" onPress={()=>router.push('/journal')}/>
      </View>
     </GlassPageEnter>

     <View style={[s.mainGrid,wide&&s.mainGridWide]}>
      <View style={s.mainCol}>
       <GlassPageEnter delay={120}><GlassCard strong style={s.about}><GlassSection title="เกี่ยวกับสถานที่" subtitle="About this place"/><Text style={s.desc}>{place.description}</Text></GlassCard></GlassPageEnter>

       <GlassPageEnter delay={160}><GlassSection title="ภาพบรรยากาศ" subtitle="Gallery"/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.galleryRow}>{place.images.map((img,i)=><Image key={i} source={img} style={s.gallery} contentFit="cover" cachePolicy="memory-disk" transition={250}/>)}</ScrollView></GlassPageEnter>

       <GlassPageEnter delay={200}><GlassSection title="ข้อมูลสำหรับการเดินทาง" subtitle="Travel information"/><View style={s.infoGrid}><Info icon="time" label="เวลาเปิด" value={place.openingHours}/><Info icon="cash" label="ค่าเข้า" value={place.ticketPrice}/><Info icon="sunny" label="ช่วงเวลาที่เหมาะ" value={place.bestTime}/><Info icon="hourglass" label="เวลาเที่ยว" value={place.duration}/></View></GlassPageEnter>

       <GlassPageEnter delay={240}><GlassCard style={s.address}><Ionicons name="navigate" size={20} color={GLASS.aqua}/><View style={{flex:1}}><Text style={s.blockTitle}>การเดินทาง</Text><Text style={s.blockText}>{place.address}</Text><Text style={s.blockSub}>พิกัด {place.lat.toFixed(4)}, {place.lng.toFixed(4)}</Text></View><GlassPressable style={s.smallCta} onPress={openMap}><Text style={s.smallCtaText}>เปิด Maps</Text><Ionicons name="arrow-forward" size={14} color={GLASS.white}/></GlassPressable></GlassCard></GlassPageEnter>
      </View>

      <View style={[s.sideCol,wide&&s.sideColWide]}>
       <GlassPageEnter delay={160}><GlassCard style={s.sideCard}><Text style={s.sideTitle}>ไฮไลต์</Text><View style={s.tags}>{place.tags.map(x=><View style={s.tag} key={x}><Ionicons name="sparkles" size={12} color={GLASS.gold}/><Text style={s.tagText}>{x}</Text></View>)}</View></GlassCard></GlassPageEnter>
       <GlassPageEnter delay={200}><GlassCard style={s.sideCard}><Text style={s.sideTitle}>สิ่งอำนวยความสะดวก</Text>{place.facilities.map(x=><View style={s.facility} key={x}><Ionicons name="checkmark-circle" size={15} color={GLASS.emerald}/><Text style={s.facilityText}>{x}</Text></View>)}</GlassCard></GlassPageEnter>
       <GlassPageEnter delay={240}><GlassCard style={s.sideCard}><Text style={s.sideTitle}>สถานะของคุณ</Text><GlassPressable style={[s.statusAction,visited&&s.statusVisited]} onPress={()=>toggleVisitedPlace(place.id)}><Ionicons name={visited?'checkmark-circle':'checkmark-circle-outline'} size={18} color={GLASS.white}/><Text style={s.statusText}>{visited?'ไปแล้ว':'ทำเครื่องหมายว่าไปแล้ว'}</Text></GlassPressable><GlassPressable style={[s.statusAction,wish&&s.statusWish]} onPress={()=>toggleWishlistPlace(place.id)}><Ionicons name={wish?'heart':'heart-outline'} size={18} color={GLASS.white}/><Text style={s.statusText}>{wish?'อยู่ใน Wishlist':'เพิ่ม Wishlist'}</Text></GlassPressable></GlassCard></GlassPageEnter>
      </View>
     </View>

     <GlassPageEnter delay={280}><GlassSection title="สถานที่ใกล้เคียง" subtitle="Nearby places"/>{nearby.length?<View style={[s.nearby,wide&&s.nearbyWide]}>{nearby.map(p=><View key={p.id} style={s.nearbyItem}><PlaceCard place={p} compact/></View>)}</View>:<GlassCard style={s.empty}><Text style={s.emptyText}>กำลังเพิ่มสถานที่ใกล้เคียงในจังหวัดนี้</Text></GlassCard>}</GlassPageEnter>
    </View>
   </ScrollView>
  </SafeAreaView>
 </GlassScreen>
}

function Action({icon,label,sub,onPress}:{icon:any;label:string;sub:string;onPress:()=>void}){return <GlassPressable style={[s.action,glassSurface(true)]} onPress={onPress}><View style={s.actionIcon}><Ionicons name={icon} size={21} color={GLASS.white}/></View><Text style={s.actionLabel}>{label}</Text><Text style={s.actionSub}>{sub}</Text></GlassPressable>}
function Info({icon,label,value}:{icon:any;label:string;value:string}){return <GlassCard style={s.info}><Ionicons name={icon} size={20} color={GLASS.aqua}/><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></GlassCard>}

const s=StyleSheet.create({
 safe:{flex:1},scroll:{paddingBottom:120},page:{width:'100%',maxWidth:1360,alignSelf:'center',padding:14,gap:18},pageWide:{paddingHorizontal:28},
 hero:{height:430,borderRadius:32,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,.30)',shadowColor:'#034B5A',shadowOpacity:.26,shadowRadius:30,elevation:12},heroTint:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,55,68,.18)'},heroBottom:{position:'absolute',left:0,right:0,bottom:0,height:190,backgroundColor:'rgba(3,45,56,.62)'},heroActions:{position:'absolute',left:14,right:14,top:14,flexDirection:'row',gap:8},heroText:{position:'absolute',left:20,right:20,bottom:22},category:{alignSelf:'flex-start',fontSize:9,fontWeight:'900',letterSpacing:.9,color:GLASS.gold,backgroundColor:'rgba(4,42,52,.42)',borderWidth:1,borderColor:'rgba(255,255,255,.20)',paddingHorizontal:9,paddingVertical:5,borderRadius:999},title:{fontSize:34,fontWeight:'900',color:GLASS.white,letterSpacing:-.7,marginTop:8},titleEn:{fontSize:9,fontWeight:'900',letterSpacing:1.3,color:'rgba(255,255,255,.68)',marginTop:2},heroMeta:{flexDirection:'row',gap:7,flexWrap:'wrap',marginTop:10},metaPill:{fontSize:9,fontWeight:'800',color:GLASS.white,backgroundColor:'rgba(255,255,255,.13)',borderWidth:1,borderColor:'rgba(255,255,255,.18)',paddingHorizontal:8,paddingVertical:5,borderRadius:999},
 actionGrid:{flexDirection:'row',gap:9,flexWrap:'wrap'},action:{flex:1,minWidth:145,minHeight:88,borderRadius:22,flexDirection:'column',alignItems:'flex-start',padding:12},actionIcon:{width:38,height:38,borderRadius:14,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center'},actionLabel:{fontSize:11,fontWeight:'900',color:GLASS.white,marginTop:7},actionSub:{fontSize:8,color:'rgba(255,255,255,.58)',marginTop:1},
 mainGrid:{gap:12},mainGridWide:{flexDirection:'row',alignItems:'flex-start'},mainCol:{flex:1,gap:16},sideCol:{gap:10},sideColWide:{width:320},about:{padding:17},desc:{fontSize:13,lineHeight:22,color:'rgba(255,255,255,.80)',marginTop:11},galleryRow:{gap:10,paddingTop:8,paddingBottom:2},gallery:{width:230,height:145,borderRadius:22,backgroundColor:'rgba(255,255,255,.10)',borderWidth:1,borderColor:'rgba(255,255,255,.18)'},
 infoGrid:{flexDirection:'row',flexWrap:'wrap',gap:9,marginTop:9},info:{flex:1,minWidth:145,padding:12},infoLabel:{fontSize:9,color:'rgba(255,255,255,.60)',marginTop:7},infoValue:{fontSize:12,fontWeight:'900',color:GLASS.white,marginTop:2},address:{padding:13,flexDirection:'row',alignItems:'center',gap:9},blockTitle:{fontSize:11,fontWeight:'900',color:GLASS.white},blockText:{fontSize:10,color:'rgba(255,255,255,.70)',marginTop:3},blockSub:{fontSize:8,color:'rgba(255,255,255,.50)',marginTop:2},smallCta:{minHeight:36,borderRadius:999,paddingHorizontal:10,backgroundColor:'rgba(255,255,255,.10)',borderWidth:1,borderColor:'rgba(255,255,255,.20)'},smallCtaText:{fontSize:9,fontWeight:'900',color:GLASS.white,marginRight:4},
 sideCard:{padding:14},sideTitle:{fontSize:12,fontWeight:'900',color:GLASS.white,marginBottom:9},tags:{flexDirection:'row',flexWrap:'wrap',gap:7},tag:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(255,255,255,.10)',borderWidth:1,borderColor:'rgba(255,255,255,.18)',paddingHorizontal:8,paddingVertical:6,borderRadius:999},tagText:{fontSize:9,fontWeight:'800',color:'rgba(255,255,255,.78)'},facility:{flexDirection:'row',alignItems:'center',gap:7,marginTop:7},facilityText:{fontSize:10,color:'rgba(255,255,255,.74)'},statusAction:{minHeight:44,borderRadius:16,backgroundColor:'rgba(255,255,255,.09)',borderWidth:1,borderColor:'rgba(255,255,255,.18)',marginTop:7},statusVisited:{backgroundColor:'rgba(37,213,178,.30)'},statusWish:{backgroundColor:'rgba(242,211,154,.22)'},statusText:{fontSize:10,fontWeight:'900',color:GLASS.white,marginLeft:6},
 nearby:{gap:10,marginTop:9},nearbyWide:{flexDirection:'row'},nearbyItem:{flex:1,minWidth:0},empty:{padding:16,marginTop:8},emptyText:{fontSize:10,color:'rgba(255,255,255,.64)'},
});
