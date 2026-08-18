import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

export default function TabLayout(){
 return <Tabs
  screenOptions={{
   headerShown:false,
   animation:'fade',
   tabBarHideOnKeyboard:true,
   tabBarActiveTintColor:COLORS.primary,
   tabBarInactiveTintColor:COLORS.textMuted,
   tabBarLabelStyle:s.label,
   tabBarIconStyle:s.icon,
   tabBarItemStyle:s.item,
   tabBarStyle:s.bar,
   sceneStyle:s.scene,
  }}
 >
  <Tabs.Screen name="index" options={{title:'หน้าแรก',tabBarIcon:({color,focused})=><Ionicons name={focused?'home':'home-outline'} size={focused?23:22} color={color}/>}}/>
  <Tabs.Screen name="map" options={{title:'แผนที่',tabBarIcon:({color,focused})=><Ionicons name={focused?'map':'map-outline'} size={focused?23:22} color={color}/>}}/>
  <Tabs.Screen name="visited" options={{title:'ไปมาแล้ว',tabBarIcon:({color,focused})=><Ionicons name={focused?'checkmark-circle':'checkmark-circle-outline'} size={focused?23:22} color={color}/>}}/>
  <Tabs.Screen name="wishlist" options={{title:'อยากไป',tabBarIcon:({color,focused})=><Ionicons name={focused?'heart':'heart-outline'} size={focused?23:22} color={color}/>}}/>
  <Tabs.Screen name="trips" options={{title:'ทริป',tabBarIcon:({color,focused})=><Ionicons name={focused?'calendar':'calendar-outline'} size={focused?23:22} color={color}/>}}/>
 </Tabs>
}

const s=StyleSheet.create({
 scene:{backgroundColor:COLORS.background},
 bar:{
  height:Platform.OS==='ios'?88:72,
  paddingTop:7,
  paddingBottom:Platform.OS==='ios'?22:9,
  paddingHorizontal:Platform.OS==='web'?10:4,
  backgroundColor:'rgba(255,255,255,.97)',
  borderTopColor:COLORS.border,
  elevation:12,
  shadowColor:'#142033',shadowOpacity:.08,shadowRadius:18,
 },
 item:{borderRadius:14,marginHorizontal:Platform.OS==='web'?3:0},
 icon:{marginBottom:1},
 label:{fontWeight:'800',fontSize:11,letterSpacing:.05},
});