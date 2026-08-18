import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout(){
 return <><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,animation:'fade'}}>
  <Stack.Screen name="(tabs)"/>
  <Stack.Screen name="place-detail" options={{presentation:'modal',animation:'slide_from_bottom'}}/>
  <Stack.Screen name="province-detail" options={{animation:'slide_from_right'}}/>
  <Stack.Screen name="search" options={{presentation:'modal'}}/>
  <Stack.Screen name="journal" options={{presentation:'modal'}}/>
  <Stack.Screen name="analytics" options={{presentation:'modal'}}/>
  <Stack.Screen name="account" options={{presentation:'modal'}}/>
  <Stack.Screen name="onboarding" options={{presentation:'fullScreenModal'}}/>
 </Stack></>;
}
