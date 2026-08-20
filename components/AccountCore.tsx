import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { restoreFromCloud, syncToCloud } from '@/lib/cloudSync';
import {
  getTravelSession,
  loginTravelAccount,
  logoutTravelAccount,
  TRAVEL_USERNAME,
  TravelSession,
} from '@/lib/travelAuth';

export default function Account(){
  const router = useRouter();
  const [password,setPassword] = useState('');
  const [showPassword,setShowPassword] = useState(false);
  const [session,setSession] = useState<TravelSession|null>(null);
  const [loading,setLoading] = useState(false);
  const [booting,setBooting] = useState(true);

  useEffect(()=>{
    getTravelSession().then(setSession).finally(()=>setBooting(false));
  },[]);

  const run = async (fn:()=>Promise<any>, ok:string) => {
    try {
      setLoading(true);
      await fn();
      Alert.alert('สำเร็จ',ok);
    } catch(e:any) {
      Alert.alert('เกิดข้อผิดพลาด',e?.message||String(e));
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (loading) return;
    if (!password.trim()) {
      Alert.alert('กรอกรหัสผ่าน','กรุณากรอกรหัสผ่านก่อนเข้าสู่ระบบ');
      return;
    }
    await run(async()=>{
      const next = await loginTravelAccount(password);
      setSession(next);
      setPassword('');
      setShowPassword(false);
    },'เข้าสู่ระบบแล้ว');
  };

  const logout = async () => {
    await run(async()=>{
      await logoutTravelAccount();
      setSession(null);
      setPassword('');
      setShowPassword(false);
    },'ออกจากระบบแล้ว');
  };

  if (!isSupabaseConfigured) return <SafeAreaView style={s.safe}>
    <View style={s.top}><Pressable onPress={()=>router.back()}><Ionicons name="chevron-back" size={26} color={COLORS.text}/></Pressable><Text style={s.title}>บัญชีและ Cloud Sync</Text></View>
    <View style={s.empty}><Ionicons name="cloud-offline" size={34} color={COLORS.primary}/><Text style={s.emptyTitle}>ยังไม่ได้เชื่อม Supabase</Text></View>
  </SafeAreaView>;

  return <SafeAreaView style={s.safe}>
    <View style={s.top}>
      <Pressable onPress={()=>router.back()}><Ionicons name="chevron-back" size={26} color={COLORS.text}/></Pressable>
      <View><Text style={s.title}>บัญชีและ Cloud Sync</Text><Text style={s.topSub}>Single Account Mode</Text></View>
    </View>

    <View style={s.content}>
      {booting ? <View style={s.loadingBox}><ActivityIndicator color={COLORS.primary}/><Text style={s.muted}>กำลังตรวจสอบ Session...</Text></View> : session ? <>
        <View style={s.profile}>
          <View style={s.avatar}><Ionicons name="shield-checkmark" size={28} color={COLORS.primary}/></View>
          <View style={s.profileText}>
            <Text style={s.profileTitle}>เข้าสู่ระบบแล้ว</Text>
            <Text style={s.username}>{session.displayName}</Text>
            <Text style={s.muted}>บัญชีหลักเพียงบัญชีเดียวของ Travel Thai</Text>
          </View>
          <View style={s.onlineDot}/>
        </View>

        <View style={s.infoCard}>
          <Ionicons name="lock-closed" size={19} color={COLORS.primary}/>
          <View style={s.profileText}><Text style={s.infoTitle}>Cloud ส่วนตัว</Text><Text style={s.muted}>ทริป · Wishlist · Visited · Journal · Preferences</Text></View>
        </View>

        <Pressable style={s.primary} disabled={loading} onPress={()=>run(syncToCloud,'อัปโหลดข้อมูลขึ้น Cloud แล้ว')}>
          <Ionicons name="cloud-upload" size={20} color="#fff"/><Text style={s.primaryText}>Sync ข้อมูลขึ้น Cloud</Text>
        </Pressable>
        <Pressable style={s.secondary} disabled={loading} onPress={()=>run(restoreFromCloud,'กู้ข้อมูลจาก Cloud แล้ว')}>
          <Ionicons name="cloud-download" size={20} color={COLORS.primary}/><Text style={s.secondaryText}>Restore จาก Cloud</Text>
        </Pressable>
        <Pressable style={s.signout} disabled={loading} onPress={logout}><Ionicons name="log-out-outline" size={18} color={COLORS.danger}/><Text style={s.signoutText}>ออกจากระบบ</Text></Pressable>
      </> : <>
        <View style={s.readyCard}>
          <View style={s.readyIcon}><Ionicons name="person-circle" size={32} color={COLORS.primary}/></View>
          <View style={s.profileText}>
            <Text style={s.profileTitle}>บัญชีพร้อมใช้งาน</Text>
            <Text style={s.muted}>เข้าสู่ระบบด้วยบัญชี {TRAVEL_USERNAME} เท่านั้น</Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.visited}/>
        </View>

        <Text style={s.label}>Username</Text>
        <View style={s.fixedInput}><Ionicons name="person" size={18} color={COLORS.primary}/><Text style={s.fixedInputText}>{TRAVEL_USERNAME}</Text><Ionicons name="lock-closed" size={15} color={COLORS.textMuted}/></View>

        <Text style={s.label}>รหัสผ่าน</Text>
        <View style={s.passwordWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            placeholder="กรอกรหัสผ่าน"
            placeholderTextColor={COLORS.textMuted}
            style={s.passwordInput}
            onSubmitEditing={login}
            returnKeyType="go"
          />
          <Pressable hitSlop={10} style={s.eyeButton} onPress={()=>setShowPassword(v=>!v)}>
            <Ionicons name={showPassword?'eye-off-outline':'eye-outline'} size={21} color={COLORS.primary}/>
          </Pressable>
        </View>
        <Text style={s.helper}>แตะรูปตาเพื่อตรวจสอบตัวพิมพ์ใหญ่/เล็กก่อนเข้าสู่ระบบ ระบบจะตัดช่องว่างหน้า–ท้ายให้อัตโนมัติ</Text>

        <Pressable style={[s.primary,loading&&s.disabled]} disabled={loading} onPress={login}>
          {loading?<ActivityIndicator color="#fff"/>:<Ionicons name="log-in" size={20} color="#fff"/>}
          <Text style={s.primaryText}>{loading?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}</Text>
        </Pressable>

        <View style={s.securityNote}><Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary}/><Text style={s.securityText}>ไม่มี Email Login และไม่อนุญาตให้สร้าง Username อื่น</Text></View>
      </>}
    </View>
  </SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'transparent'},
  top:{minHeight:68,paddingHorizontal:SPACING.md,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'rgba(255,255,255,.72)',borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.55)'},
  title:{fontSize:20,fontWeight:'900',color:COLORS.text},
  topSub:{fontSize:10,fontWeight:'800',letterSpacing:1.1,color:COLORS.primary,marginTop:1},
  content:{padding:SPACING.lg,gap:11,maxWidth:620,width:'100%',alignSelf:'center'},
  empty:{margin:SPACING.lg,backgroundColor:'rgba(255,255,255,.8)',borderRadius:RADIUS.lg,padding:25,alignItems:'center',borderWidth:1,borderColor:'rgba(255,255,255,.7)'},
  emptyTitle:{fontWeight:'900',fontSize:18,color:COLORS.text,marginTop:10},
  muted:{color:COLORS.textMuted,lineHeight:20,marginTop:2},
  label:{fontSize:12,fontWeight:'900',color:COLORS.text,marginTop:5},
  fixedInput:{height:52,borderRadius:RADIUS.md,borderWidth:1,borderColor:'rgba(255,255,255,.75)',backgroundColor:'rgba(255,255,255,.64)',paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:9},
  fixedInputText:{flex:1,color:COLORS.text,fontSize:16,fontWeight:'900'},
  passwordWrap:{height:52,borderRadius:RADIUS.md,borderWidth:1,borderColor:'rgba(255,255,255,.75)',backgroundColor:'rgba(255,255,255,.74)',flexDirection:'row',alignItems:'center',overflow:'hidden'},
  passwordInput:{flex:1,height:'100%',paddingHorizontal:14,color:COLORS.text,fontSize:16,fontWeight:'700',outlineStyle:'none' as any},
  eyeButton:{width:52,height:52,alignItems:'center',justifyContent:'center'},
  helper:{color:COLORS.textMuted,fontSize:11,lineHeight:17,marginTop:-3},
  primary:{height:52,borderRadius:RADIUS.md,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,marginTop:7},
  primaryText:{color:'#fff',fontWeight:'900'},
  secondary:{height:52,borderRadius:RADIUS.md,backgroundColor:'rgba(255,255,255,.72)',borderWidth:1,borderColor:'rgba(255,255,255,.75)',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},
  secondaryText:{color:COLORS.primary,fontWeight:'900'},
  disabled:{opacity:.58},
  profile:{backgroundColor:'rgba(255,255,255,.76)',borderRadius:RADIUS.lg,padding:16,flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:'rgba(255,255,255,.72)'},
  profileText:{flex:1},
  avatar:{width:52,height:52,borderRadius:26,backgroundColor:'rgba(232,246,246,.9)',alignItems:'center',justifyContent:'center'},
  profileTitle:{fontWeight:'900',fontSize:17,color:COLORS.text},
  username:{fontWeight:'900',fontSize:15,color:COLORS.primary,marginTop:2},
  onlineDot:{width:10,height:10,borderRadius:5,backgroundColor:COLORS.visited},
  readyCard:{backgroundColor:'rgba(255,255,255,.78)',borderRadius:RADIUS.lg,padding:16,flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:'rgba(255,255,255,.78)',marginBottom:4},
  readyIcon:{width:48,height:48,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(232,246,246,.85)'},
  infoCard:{backgroundColor:'rgba(255,255,255,.64)',borderRadius:RADIUS.md,padding:14,flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderColor:'rgba(255,255,255,.62)'},
  infoTitle:{fontWeight:'900',color:COLORS.text},
  securityNote:{flexDirection:'row',alignItems:'center',gap:8,padding:12,borderRadius:RADIUS.md,backgroundColor:'rgba(255,255,255,.5)'},
  securityText:{flex:1,color:COLORS.textMuted,fontSize:12,fontWeight:'700',lineHeight:18},
  loadingBox:{minHeight:120,alignItems:'center',justifyContent:'center',gap:10,backgroundColor:'rgba(255,255,255,.7)',borderRadius:RADIUS.lg},
  signout:{height:46,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7},
  signoutText:{color:COLORS.danger,fontWeight:'900'},
});
