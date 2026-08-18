import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout(){
 return <>
  <StatusBar style="light" translucent/>
  <Stack screenOptions={{
   headerShown:false,
   animation:'fade',
   gestureEnabled:true,
   fullScreenGestureEnabled:true,
   contentStyle:{backgroundColor:'#075A6E'},
  }}>
   <Stack.Screen name="(tabs)" options={{animation:'fade'}}/>
   <Stack.Screen name="place-detail" options={{presentation:'modal',animation:'slide_from_bottom',gestureEnabled:true}}/>
   <Stack.Screen name="province-detail" options={{animation:'slide_from_right',gestureEnabled:true}}/>
   <Stack.Screen name="search" options={{presentation:'modal',animation:'slide_from_bottom'}}/>
   <Stack.Screen name="journal" options={{presentation:'modal',animation:'slide_from_bottom'}}/>
   <Stack.Screen name="analytics" options={{presentation:'modal',animation:'slide_from_bottom'}}/>
   <Stack.Screen name="account" options={{presentation:'modal',animation:'slide_from_bottom'}}/>
   <Stack.Screen name="onboarding" options={{presentation:'fullScreenModal',animation:'fade_from_bottom'}}/>
  </Stack>
 </>;
}
