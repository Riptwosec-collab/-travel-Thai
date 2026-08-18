import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

export default function TabLayout(){
 return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:COLORS.primary,tabBarInactiveTintColor:COLORS.textMuted,tabBarLabelStyle:{fontWeight:'700',fontSize:11},tabBarStyle:s.bar}}>
  <Tabs.Screen name="index" options={{title:'หน้าแรก',tabBarIcon:({color})=><Ionicons name="home" size={22} color={color}/>}}/>
  <Tabs.Screen name="map" options={{title:'แผนที่',tabBarIcon:({color})=><Ionicons name="map" size={22} color={color}/>}}/>
  <Tabs.Screen name="visited" options={{title:'ไปมาแล้ว',tabBarIcon:({color})=><Ionicons name="checkmark-circle" size={22} color={color}/>}}/>
  <Tabs.Screen name="wishlist" options={{title:'อยากไป',tabBarIcon:({color})=><Ionicons name="heart" size={22} color={color}/>}}/>
  <Tabs.Screen name="trips" options={{title:'ทริป',tabBarIcon:({color})=><Ionicons name="calendar" size={22} color={color}/>}}/>
 </Tabs>
}
const s=StyleSheet.create({bar:{height:Platform.OS==='ios'?86:68,paddingTop:7,paddingBottom:Platform.OS==='ios'?22:8,backgroundColor:'rgba(255,255,255,.97)',borderTopColor:COLORS.border,elevation:12,shadowColor:'#142033',shadowOpacity:.08,shadowRadius:18}});
