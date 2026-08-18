import { Tabs } from 'expo-router';
import GlassBottomTabBar from '@/components/glass/GlassBottomTabBar';

export default function TabLayout(){
 return <Tabs
  tabBar={(props)=><GlassBottomTabBar {...props}/>} 
  screenOptions={{
   headerShown:false,
   animation:'fade',
   tabBarHideOnKeyboard:true,
   sceneStyle:{backgroundColor:'transparent'},
  }}
 >
  <Tabs.Screen name="index" options={{title:'หน้าแรก'}}/>
  <Tabs.Screen name="map" options={{title:'แผนที่'}}/>
  <Tabs.Screen name="visited" options={{title:'ไปมาแล้ว'}}/>
  <Tabs.Screen name="wishlist" options={{title:'อยากไป'}}/>
  <Tabs.Screen name="trips" options={{title:'ทริป'}}/>
 </Tabs>
}
