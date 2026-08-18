import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatusMapDashboard from '@/components/StatusMapDashboard';
import { COLORS } from '@/constants/theme';

export default function Wishlist(){
  return <SafeAreaView style={s.safe} edges={['top']}>
    <StatusMapDashboard mode="wishlist"/>
  </SafeAreaView>;
}

const s=StyleSheet.create({safe:{flex:1,backgroundColor:COLORS.background}});
