import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ThailandMap from '@/components/ThailandMap';
import { PLACES, PROVINCES } from '@/data/catalog';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { useTravelStore } from '@/store/useTravelStore';
import { Region } from '@/types';

const REGIONS:(Region|'ทั้งหมด')[]=['ทั้งหมด','ภาคเหนือ','ภาคอีสาน','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้'];

export default function MapScreen(){
  const router=useRouter();
  const [q,setQ]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const {visitedProvinceIds,wishlistProvinceIds,toggleVisitedProvince,toggleWishlistProvince}=useTravelStore();
  const [region,setRegion]=useState<Region|'ทั้งหมด'>('ทั้งหมด');

  const filtered=useMemo(()=>PROVINCES.filter(p=>(region==='ทั้งหมด'||p.region===region)&&(p.nameTh.includes(q)||p.nameEn.toLowerCase().includes(q.toLowerCase()))),[q,region]);
  const selected=useMemo(()=>selectedId?PROVINCES.find(p=>p.id===selectedId):undefined,[selectedId]);
  const selectedPlaces=useMemo(()=>selectedId?PLACES.filter(p=>p.provinceId===selectedId):[],[selectedId]);
  const selectedVisited=selectedId?visitedProvinceIds.includes(selectedId):false;
  const selectedWish=selectedId?wishlistProvinceIds.includes(selectedId):false;

  const openFullDetail=()=>{
    if(!selectedId)return;
    const id=selectedId;
    setSelectedId(null);
    router.push({pathname:'/province-detail',params:{id}});
  };

  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>แผนที่เที่ยวไทย</Text>
      <Text style={s.sub}>ชี้จังหวัดเพื่อดูข้อมูลสั้น ๆ แล้วคลิกเพื่อเปิดรายละเอียดจังหวัด</Text>

      <View style={s.stats}>
        <Stat n={visitedProvinceIds.length} label="ไปแล้ว" color={COLORS.visited}/>
        <Stat n={wishlistProvinceIds.length} label="อยากไป" color="#E6B851"/>
        <Stat n={77-visitedProvinceIds.length} label="เหลือ" color={COLORS.primary}/>
      </View>

      <ThailandMap onSelectProvince={setSelectedId}/>

      <View style={s.search}>
        <Ionicons name="search" size={19} color={COLORS.textMuted}/>
        <TextInput value={q} onChangeText={setQ} placeholder="ค้นหาจังหวัด" style={s.input}/>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>
        {REGIONS.map(r=><Pressable key={r} onPress={()=>setRegion(r)} style={[s.chip,region===r&&s.chipActive]}><Text style={[s.chipText,region===r&&s.chipTextActive]}>{r}</Text></Pressable>)}
      </ScrollView>

      <Text style={s.section}>จังหวัดทั้งหมด ({filtered.length})</Text>
      <View style={s.grid}>
        {filtered.map(p=>{
          const v=visitedProvinceIds.includes(p.id),w=wishlistProvinceIds.includes(p.id);
          return <Pressable key={p.id} style={s.province} onPress={()=>setSelectedId(p.id)}>
            <View style={[s.status,{backgroundColor:v?COLORS.visited:w?'#E6B851':'#D9E7E8'}]}/>
            <View style={{flex:1}}><Text style={s.pname}>{p.nameTh}</Text><Text style={s.pregion}>{p.region}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted}/>
          </Pressable>;
        })}
      </View>
    </ScrollView>

    <Modal transparent visible={!!selected} animationType="fade" onRequestClose={()=>setSelectedId(null)}>
      <View style={s.modalRoot}>
        <Pressable style={s.backdrop} onPress={()=>setSelectedId(null)}/>
        {selected&&<View style={s.sheet}>
          <View style={s.sheetHandle}/>
          <View style={s.heroWrap}>
            <Image source={{uri:selected.coverImage}} style={s.heroImage}/>
            <View style={s.heroShade}/>
            <Pressable style={s.closeBtn} onPress={()=>setSelectedId(null)}>
              <Ionicons name="close" size={22} color="#fff"/>
            </Pressable>
            <View style={s.heroText}>
              <View style={s.regionBadge}><Text style={s.regionBadgeText}>{selected.region}</Text></View>
              <Text style={s.sheetTitle}>{selected.nameTh}</Text>
              <Text style={s.sheetEn}>{selected.nameEn}</Text>
            </View>
          </View>

          <View style={s.sheetBody}>
            <Text style={s.description}>{selected.description}</Text>

            <View style={s.miniStats}>
              <View style={s.miniStat}><Text style={s.miniN}>{selectedPlaces.length}</Text><Text style={s.miniLabel}>สถานที่แนะนำ</Text></View>
              <View style={s.miniStat}><Text style={s.miniN}>{selected.bestMonths.slice(0,3).join(' · ')||'-'}</Text><Text style={s.miniLabel}>ช่วงน่าเที่ยว</Text></View>
              <View style={s.miniStat}><Text style={s.miniN}>{selectedVisited?'ไปแล้ว':selectedWish?'อยากไป':'ยังไม่ไป'}</Text><Text style={s.miniLabel}>สถานะ</Text></View>
            </View>

            {selectedPlaces.length>0&&<View>
              <Text style={s.recommendTitle}>ตัวอย่างสถานที่</Text>
              <View style={s.placeChips}>
                {selectedPlaces.slice(0,3).map(place=><View key={place.id} style={s.placeChip}><Ionicons name="location" size={13} color={COLORS.primary}/><Text style={s.placeChipText}>{place.name}</Text></View>)}
              </View>
            </View>}

            <View style={s.actions}>
              <Pressable onPress={()=>selectedId&&toggleVisitedProvince(selectedId)} style={[s.actionBtn,selectedVisited&&s.actionVisited]}>
                <Ionicons name={selectedVisited?'checkmark-circle':'checkmark-circle-outline'} size={19} color={selectedVisited?'#fff':COLORS.visited}/>
                <Text style={[s.actionText,selectedVisited&&s.actionTextOn]}>ไปแล้ว</Text>
              </Pressable>
              <Pressable onPress={()=>selectedId&&toggleWishlistProvince(selectedId)} style={[s.actionBtn,selectedWish&&s.actionWish]}>
                <Ionicons name={selectedWish?'heart':'heart-outline'} size={19} color={selectedWish?'#fff':'#D49C38'}/>
                <Text style={[s.actionText,selectedWish&&s.actionTextOn]}>อยากไป</Text>
              </Pressable>
            </View>

            <Pressable style={s.detailBtn} onPress={openFullDetail}>
              <Text style={s.detailBtnText}>ดูรายละเอียดจังหวัด</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff"/>
            </Pressable>
          </View>
        </View>}
      </View>
    </Modal>
  </SafeAreaView>;
}

function Stat({n,label,color}:{n:number;label:string;color:string}){
  return <View style={s.stat}><View style={[s.statDot,{backgroundColor:color}]}/><Text style={s.statN}>{n}</Text><Text style={s.statLabel}>{label}</Text></View>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.background},
  content:{padding:SPACING.lg,paddingBottom:120,gap:14},
  title:{fontSize:28,fontWeight:'900',color:COLORS.text},
  sub:{color:COLORS.textMuted,lineHeight:21},
  stats:{flexDirection:'row',gap:10},
  stat:{flex:1,backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:12,borderWidth:1,borderColor:COLORS.border},
  statDot:{width:9,height:9,borderRadius:5},
  statN:{fontSize:22,fontWeight:'900',color:COLORS.text,marginTop:5},
  statLabel:{fontSize:12,color:COLORS.textMuted},
  search:{height:50,borderRadius:RADIUS.md,backgroundColor:COLORS.surface,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:14,borderWidth:1,borderColor:COLORS.border},
  input:{flex:1,color:COLORS.text},
  chip:{borderRadius:999,paddingHorizontal:13,paddingVertical:8,backgroundColor:COLORS.surface,borderWidth:1,borderColor:COLORS.border},
  chipActive:{backgroundColor:COLORS.dark,borderColor:COLORS.dark},
  chipText:{color:COLORS.textMuted,fontWeight:'700'},
  chipTextActive:{color:'#fff'},
  section:{fontSize:19,fontWeight:'900',color:COLORS.text,marginTop:3},
  grid:{gap:8},
  province:{backgroundColor:COLORS.surface,borderRadius:RADIUS.md,padding:13,borderWidth:1,borderColor:COLORS.border,flexDirection:'row',alignItems:'center',gap:11},
  status:{width:10,height:42,borderRadius:9},
  pname:{fontWeight:'900',fontSize:15,color:COLORS.text},
  pregion:{fontSize:12,color:COLORS.textMuted,marginTop:2},

  modalRoot:{flex:1,justifyContent:'center',alignItems:'center',padding:18},
  backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(8,20,24,.48)'},
  sheet:{width:'100%',maxWidth:560,maxHeight:'88%',backgroundColor:COLORS.surface,borderRadius:26,overflow:'hidden',borderWidth:1,borderColor:'rgba(255,255,255,.38)',shadowColor:'#08171A',shadowOffset:{width:0,height:18},shadowOpacity:.28,shadowRadius:34,elevation:18},
  sheetHandle:{position:'absolute',top:9,alignSelf:'center',width:42,height:4,borderRadius:99,backgroundColor:'rgba(255,255,255,.72)',zIndex:4},
  heroWrap:{height:190,position:'relative'},
  heroImage:{width:'100%',height:'100%'},
  heroShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(5,22,24,.35)'},
  closeBtn:{position:'absolute',top:16,right:16,width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(4,15,18,.55)'},
  heroText:{position:'absolute',left:20,right:20,bottom:18},
  regionBadge:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:5,borderRadius:999,backgroundColor:'rgba(255,255,255,.9)'},
  regionBadgeText:{fontSize:11,fontWeight:'900',color:COLORS.primary},
  sheetTitle:{fontSize:30,fontWeight:'900',color:'#fff',marginTop:8},
  sheetEn:{fontSize:13,color:'rgba(255,255,255,.82)',marginTop:2},
  sheetBody:{padding:20,gap:15},
  description:{fontSize:14,lineHeight:22,color:COLORS.textMuted},
  miniStats:{flexDirection:'row',gap:8},
  miniStat:{flex:1,backgroundColor:COLORS.background,borderRadius:14,padding:10,borderWidth:1,borderColor:COLORS.border,minHeight:66},
  miniN:{fontSize:14,fontWeight:'900',color:COLORS.text},
  miniLabel:{fontSize:10,color:COLORS.textMuted,marginTop:4},
  recommendTitle:{fontSize:14,fontWeight:'900',color:COLORS.text,marginBottom:8},
  placeChips:{flexDirection:'row',flexWrap:'wrap',gap:7},
  placeChip:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#EAF7F5',paddingHorizontal:9,paddingVertical:7,borderRadius:999},
  placeChipText:{fontSize:11,fontWeight:'700',color:'#426C66'},
  actions:{flexDirection:'row',gap:10},
  actionBtn:{flex:1,height:46,borderRadius:14,borderWidth:1,borderColor:COLORS.border,backgroundColor:COLORS.surface,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
  actionVisited:{backgroundColor:COLORS.visited,borderColor:COLORS.visited},
  actionWish:{backgroundColor:'#D7A441',borderColor:'#D7A441'},
  actionText:{fontWeight:'900',color:COLORS.text},
  actionTextOn:{color:'#fff'},
  detailBtn:{height:50,borderRadius:15,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
  detailBtnText:{color:'#fff',fontWeight:'900',fontSize:15},
});