import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { restoreFromCloud, syncToCloud } from '@/lib/cloudSync';
import { GLASS, GLASS_RADIUS, GLASS_TEXT, glassSurface } from '@/constants/glassTheme';
import { GlassCard, GlassCircleButton, GlassHeader, GlassPageEnter, GlassPressable } from '@/components/glass';

export default function AccountCore(){
 const router=useRouter();
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [userEmail,setUserEmail]=useState<string|null>(null);
 const [loading,setLoading]=useState(false);

 useEffect(()=>{
  if(!supabase)return;
  supabase.auth.getUser().then(({data})=>setUserEmail(data.user?.email||null));
  const {data}=supabase.auth.onAuthStateChange((_event,session)=>setUserEmail(session?.user.email||null));
  return()=>data.subscription.unsubscribe();
 },[]);

 const run=async(fn:()=>Promise<any>,ok:string)=>{
  try{setLoading(true);await fn();Alert.alert('สำเร็จ',ok)}
  catch(error:any){Alert.alert('เกิดข้อผิดพลาด',error.message||String(error))}
  finally{setLoading(false)}
 };

 const content=!isSupabaseConfigured ? <GlassCard strong style={s.empty}>
   <View style={s.emptyIcon}><Ionicons name="cloud-offline-outline" size={29} color={GLASS.aqua}/></View>
   <Text style={s.emptyTitle}>ยังไม่ได้เชื่อม Cloud Sync</Text>
   <Text style={s.copy}>เพิ่ม EXPO_PUBLIC_SUPABASE_URL และ EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ในไฟล์ .env แล้วรัน supabase/schema.sql เพื่อเปิดระบบ Sync</Text>
   <GlassPressable style={s.backBtn} onPress={()=>router.back()}><Ionicons name="arrow-back" size={17} color={GLASS.white}/><Text style={s.backText}>กลับหน้าก่อนหน้า</Text></GlassPressable>
  </GlassCard> : userEmail ? <View style={s.stack}>
   <GlassCard strong style={s.profile}>
    <View style={s.avatar}><Ionicons name="person" size={28} color={GLASS.white}/></View>
    <View style={{flex:1,minWidth:0}}><Text style={s.profileEyebrow}>ACCOUNT CONNECTED</Text><Text style={s.profileTitle}>เชื่อมบัญชีแล้ว</Text><Text style={s.copy} numberOfLines={1}>{userEmail}</Text></View>
    <View style={s.online}><View style={s.onlineDot}/><Text style={s.onlineText}>SYNC READY</Text></View>
   </GlassCard>
   <Action icon="cloud-upload-outline" title="Sync ข้อมูลขึ้น Cloud" sub="เก็บ Wishlist, ทริป และบันทึกของคุณ" loading={loading} onPress={()=>run(syncToCloud,'อัปโหลดข้อมูลขึ้น Cloud แล้ว')}/>
   <Action icon="cloud-download-outline" title="Restore จาก Cloud" sub="กู้ข้อมูลล่าสุดกลับมายังอุปกรณ์นี้" loading={loading} onPress={()=>run(restoreFromCloud,'กู้ข้อมูลจาก Cloud แล้ว')}/>
   <GlassPressable style={s.signout} onPress={()=>run(()=>supabase!.auth.signOut(),'ออกจากระบบแล้ว')}><Ionicons name="log-out-outline" size={18} color="#FFD0D7"/><Text style={s.signoutText}>ออกจากระบบ</Text></GlassPressable>
  </View> : <GlassCard strong style={s.form}>
   <View style={s.formMark}><Ionicons name="shield-checkmark-outline" size={23} color={GLASS.gold}/></View>
   <Text style={s.formTitle}>เข้าสู่ระบบ Travel Thai</Text>
   <Text style={s.copy}>สำรองแผนที่ ทริป และความทรงจำไว้กับบัญชีของคุณ</Text>
   <Field label="อีเมล"><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="name@email.com" placeholderTextColor="rgba(255,255,255,.42)" style={s.input}/></Field>
   <Field label="รหัสผ่าน"><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="อย่างน้อย 6 ตัวอักษร" placeholderTextColor="rgba(255,255,255,.42)" style={s.input}/></Field>
   <GlassPressable style={[s.primary,loading&&s.disabled]} onPress={()=>loading?undefined:run(async()=>{const {error}=await supabase!.auth.signInWithPassword({email,password});if(error)throw error},'เข้าสู่ระบบแล้ว')}><Ionicons name="log-in-outline" size={19} color={GLASS.white}/><Text style={s.primaryText}>{loading?'กำลังดำเนินการ…':'เข้าสู่ระบบ'}</Text></GlassPressable>
   <GlassPressable style={[s.secondary,loading&&s.disabled]} onPress={()=>loading?undefined:run(async()=>{const {error}=await supabase!.auth.signUp({email,password});if(error)throw error},'สร้างบัญชีแล้ว โปรดตรวจสอบอีเมลหากระบบกำหนดให้ยืนยัน')}><Text style={s.secondaryText}>สร้างบัญชีใหม่</Text><Ionicons name="arrow-forward" size={17} color={GLASS.aqua}/></GlassPressable>
  </GlassCard>;

 return <SafeAreaView style={s.safe} edges={['top','bottom']}><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
  <GlassPageEnter><GlassHeader eyebrow="ACCOUNT · CLOUD SYNC" title="บัญชีของฉัน" subtitle="เข้าถึงแผนเดินทางของคุณได้ทุกอุปกรณ์" right={<GlassCircleButton icon="chevron-back" label="กลับ" onPress={()=>router.back()}/>}/></GlassPageEnter>
  <GlassPageEnter delay={90}>{content}</GlassPageEnter>
 </ScrollView></SafeAreaView>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <View style={s.field}><Text style={s.label}>{label}</Text>{children}</View>}
function Action({icon,title,sub,loading,onPress}:{icon:any;title:string;sub:string;loading:boolean;onPress:()=>void}){return <GlassPressable style={[s.action,glassSurface(true),loading&&s.disabled]} onPress={()=>loading?undefined:onPress()}><View style={s.actionIcon}><Ionicons name={icon} size={22} color={GLASS.white}/></View><View style={{flex:1,minWidth:0}}><Text style={s.actionTitle}>{title}</Text><Text style={s.actionSub}>{sub}</Text></View><Ionicons name="chevron-forward" size={18} color={GLASS_TEXT.tertiary}/></GlassPressable>}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'transparent'},content:{padding:18,paddingBottom:48,gap:20,maxWidth:720,width:'100%',alignSelf:'center'},
 empty:{padding:25,alignItems:'center'},emptyIcon:{width:62,height:62,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(130,244,251,.13)',borderWidth:1,borderColor:'rgba(130,244,251,.24)'},emptyTitle:{fontSize:19,fontWeight:'900',color:GLASS.white,marginTop:12},copy:{fontSize:11,lineHeight:18,color:GLASS_TEXT.tertiary,marginTop:4},backBtn:{height:45,borderRadius:16,marginTop:18,paddingHorizontal:15,backgroundColor:'rgba(69,229,241,.22)',borderWidth:1,borderColor:'rgba(255,255,255,.30)'},backText:{fontSize:11,fontWeight:'900',color:GLASS.white,marginLeft:7},
 stack:{gap:11},profile:{padding:16,flexDirection:'row',alignItems:'center',gap:12},avatar:{width:52,height:52,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(69,229,241,.22)',borderWidth:1,borderColor:'rgba(255,255,255,.24)'},profileEyebrow:{fontSize:8,fontWeight:'900',letterSpacing:1,color:GLASS.gold},profileTitle:{fontSize:17,fontWeight:'900',color:GLASS.white,marginTop:2},online:{alignItems:'flex-end',gap:4},onlineDot:{width:7,height:7,borderRadius:4,backgroundColor:GLASS.emerald},onlineText:{fontSize:7,fontWeight:'900',letterSpacing:.6,color:GLASS_TEXT.tertiary},
 action:{minHeight:78,borderRadius:GLASS_RADIUS.md,padding:12,alignItems:'center'},actionIcon:{width:43,height:43,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.12)',marginRight:10},actionTitle:{fontSize:13,fontWeight:'900',color:GLASS.white},actionSub:{fontSize:9,color:GLASS_TEXT.tertiary,marginTop:3},signout:{height:48,borderRadius:17,marginTop:4,backgroundColor:'rgba(193,61,90,.17)',borderWidth:1,borderColor:'rgba(255,178,191,.22)'},signoutText:{fontSize:11,fontWeight:'900',color:'#FFD0D7',marginLeft:7},
 form:{padding:20},formMark:{width:48,height:48,borderRadius:17,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(244,214,155,.13)',borderWidth:1,borderColor:'rgba(244,214,155,.22)'},formTitle:{fontSize:20,fontWeight:'900',color:GLASS.white,marginTop:13},field:{gap:6,marginTop:16},label:{fontSize:10,fontWeight:'900',letterSpacing:.4,color:GLASS_TEXT.secondary},input:{height:51,borderRadius:17,borderWidth:1,borderColor:'rgba(255,255,255,.20)',backgroundColor:'rgba(255,255,255,.09)',paddingHorizontal:13,color:GLASS.white,fontSize:12},primary:{height:52,borderRadius:18,marginTop:18,backgroundColor:'rgba(69,229,241,.30)',borderWidth:1,borderColor:'rgba(255,255,255,.36)'},primaryText:{fontSize:12,fontWeight:'900',color:GLASS.white,marginLeft:7},secondary:{height:48,borderRadius:17,marginTop:9,backgroundColor:'rgba(255,255,255,.08)',borderWidth:1,borderColor:'rgba(255,255,255,.18)'},secondaryText:{fontSize:11,fontWeight:'900',color:GLASS.aqua,marginRight:7},disabled:{opacity:.55},
});
