import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import type { Trip, TripActualExpense } from '@/types';

const CATEGORIES:TripActualExpense['category'][]=['เดินทาง','ที่พัก','อาหาร','กิจกรรม','อื่น ๆ'];
const uid=()=>`expense-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

export default function TripBudgetScorePanel({trip,onChange}:{trip:Trip;onChange:(patch:Partial<Trip>)=>void}){
  const [open,setOpen]=useState(false);
  const [amount,setAmount]=useState('');
  const [note,setNote]=useState('');
  const [category,setCategory]=useState<TripActualExpense['category']>('อาหาร');
  const expenses=trip.actualExpenses||[];
  const checklist=trip.packingList||[];
  const done=trip.checklistDone||[];
  const actual=expenses.reduce((sum,x)=>sum+(Number(x.amount)||0),0);
  const remaining=(trip.budget||0)-actual;
  const schedules=(trip.days||[]).flatMap(d=>d.schedule||[]);
  const scheduleDone=schedules.filter(x=>x.completed).length;
  const score=useMemo(()=>{
    const completion=schedules.length?Math.round(scheduleDone/schedules.length*45):0;
    const route=Math.min(15,(trip.routeStops?.length||0)*3);
    const days=Math.min(10,(trip.days?.length||0)*2);
    const checklistScore=checklist.length?Math.round(done.length/checklist.length*15):0;
    const expenseScore=expenses.length?10:0;
    const finished=trip.status==='จบทริป'?5:0;
    return Math.min(100,completion+route+days+checklistScore+expenseScore+finished);
  },[schedules.length,scheduleDone,trip.routeStops?.length,trip.days?.length,trip.status,checklist.length,done.length,expenses.length]);

  const addExpense=()=>{
    const value=Math.max(0,Number(amount.replace(/,/g,''))||0); if(!value)return;
    const item:TripActualExpense={id:uid(),category,amount:value,note:note.trim()||undefined,createdAt:new Date().toISOString()};
    onChange({actualExpenses:[item,...expenses]}); setAmount('');setNote('');
  };
  const removeExpense=(id:string)=>onChange({actualExpenses:expenses.filter(x=>x.id!==id)});
  const toggleChecklist=(name:string)=>onChange({checklistDone:done.includes(name)?done.filter(x=>x!==name):[...done,name]});

  return <View style={s.shell}>
    <Pressable style={s.header} onPress={()=>setOpen(v=>!v)}>
      <View style={s.scoreRing}><Text style={s.score}>{score}</Text></View>
      <View style={s.flex}><Text style={s.kicker}>TRAVEL SCORE</Text><Text style={s.title}>งบจริง + Checklist + คะแนนทริป</Text><Text style={s.sub}>{actual.toLocaleString()}฿ ใช้จริง · {remaining>=0?`เหลือ ${remaining.toLocaleString()}฿`:`เกิน ${Math.abs(remaining).toLocaleString()}฿`}</Text></View>
      <Ionicons name={open?'chevron-up':'chevron-down'} size={19} color={COLORS.primary}/>
    </Pressable>
    {open&&<View style={s.body}>
      <View style={s.budgetRow}><BudgetBox label="งบตั้งไว้" value={`${(trip.budget||0).toLocaleString()}฿`}/><BudgetBox label="จ่ายจริง" value={`${actual.toLocaleString()}฿`}/><BudgetBox label={remaining>=0?'คงเหลือ':'เกินงบ'} value={`${Math.abs(remaining).toLocaleString()}฿`} danger={remaining<0}/></View>
      <View style={s.progress}><View style={[s.progressFill,{width:`${Math.min(100,trip.budget?actual/trip.budget*100:0)}%`}]}/></View>

      <Text style={s.sectionTitle}>บันทึกค่าใช้จ่ายจริง</Text>
      <View style={s.chips}>{CATEGORIES.map(x=><Pressable key={x} style={[s.chip,category===x&&s.chipOn]} onPress={()=>setCategory(x)}><Text style={[s.chipText,category===x&&s.chipTextOn]}>{x}</Text></Pressable>)}</View>
      <TextInput value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="จำนวนเงิน เช่น 250" placeholderTextColor={COLORS.textMuted} style={s.input}/>
      <TextInput value={note} onChangeText={setNote} placeholder="หมายเหตุ เช่น ค่าอาหารกลางวัน" placeholderTextColor={COLORS.textMuted} style={s.input}/>
      <Pressable style={s.addButton} onPress={addExpense}><Ionicons name="add-circle-outline" size={18} color="#fff"/><Text style={s.addText}>เพิ่มค่าใช้จ่าย</Text></Pressable>
      {!!expenses.length&&<View style={s.expenseList}>{expenses.slice(0,8).map(x=><View key={x.id} style={s.expenseRow}><View style={s.expenseIcon}><Ionicons name="receipt-outline" size={16} color={COLORS.primary}/></View><View style={s.flex}><Text style={s.expenseTitle}>{x.category} · {x.amount.toLocaleString()}฿</Text>{!!x.note&&<Text style={s.expenseNote}>{x.note}</Text>}</View><Pressable style={s.remove} onPress={()=>removeExpense(x.id)}><Ionicons name="close" size={16} color={COLORS.danger}/></Pressable></View>)}</View>}

      <Text style={s.sectionTitle}>Trip Checklist</Text>
      {checklist.length?<View style={s.checkList}>{checklist.map((x,i)=>{const checked=done.includes(x);return <Pressable key={`${x}-${i}`} style={[s.checkRow,checked&&s.checkRowDone]} onPress={()=>toggleChecklist(x)}><Ionicons name={checked?'checkbox':'square-outline'} size={19} color={checked?'#2FAE68':COLORS.primary}/><Text style={[s.checkText,checked&&s.checkTextDone]}>{x}</Text></Pressable>})}</View>:<Text style={s.emptyText}>ยังไม่มีรายการของที่ต้องเตรียม — เพิ่มได้ใน “แก้ไขทั้งหมด”</Text>}

      <Text style={s.sectionTitle}>Travel Score Breakdown</Text>
      <View style={s.scoreGrid}><ScoreItem label="Timeline" value={`${scheduleDone}/${schedules.length}`}/><ScoreItem label="Route" value={`${trip.routeStops?.length||0} จุด`}/><ScoreItem label="Checklist" value={`${done.length}/${checklist.length}`}/><ScoreItem label="Expense" value={expenses.length?'เริ่มแล้ว':'ยัง'}/></View>
    </View>}
  </View>;
}

function BudgetBox({label,value,danger}:{label:string;value:string;danger?:boolean}){return <View style={s.budgetBox}><Text style={s.budgetLabel}>{label}</Text><Text style={[s.budgetValue,danger&&s.danger]}>{value}</Text></View>}
function ScoreItem({label,value}:{label:string;value:string}){return <View style={s.scoreItem}><Text style={s.scoreLabel}>{label}</Text><Text style={s.scoreValue}>{value}</Text></View>}

const s=StyleSheet.create({
  shell:{borderRadius:16,backgroundColor:'rgba(246,251,251,.94)',borderWidth:1,borderColor:'rgba(7,61,75,.08)',overflow:'hidden'},header:{minHeight:70,padding:10,flexDirection:'row',alignItems:'center',gap:9},scoreRing:{width:50,height:50,borderRadius:25,backgroundColor:COLORS.dark,alignItems:'center',justifyContent:'center'},score:{fontSize:18,fontWeight:'900',color:'#fff'},flex:{flex:1,minWidth:0},kicker:{fontSize:8.5,fontWeight:'900',letterSpacing:1,color:COLORS.primary},title:{fontSize:12.5,lineHeight:17,fontWeight:'900',color:COLORS.text,marginTop:2},sub:{fontSize:9.5,lineHeight:14,color:COLORS.textMuted,marginTop:2},body:{padding:10,paddingTop:0,gap:9},
  budgetRow:{flexDirection:'row',gap:6},budgetBox:{flex:1,minWidth:0,padding:8,borderRadius:11,backgroundColor:'rgba(255,255,255,.92)'},budgetLabel:{fontSize:8.5,fontWeight:'800',color:COLORS.textMuted},budgetValue:{fontSize:12,fontWeight:'900',color:COLORS.text,marginTop:2},danger:{color:COLORS.danger},progress:{height:6,borderRadius:999,backgroundColor:'rgba(7,61,75,.08)',overflow:'hidden'},progressFill:{height:'100%',backgroundColor:COLORS.primary,borderRadius:999},sectionTitle:{fontSize:11,fontWeight:'900',color:COLORS.text,marginTop:2},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:5},chip:{minHeight:31,paddingHorizontal:8,borderRadius:999,backgroundColor:'rgba(232,246,246,.94)',alignItems:'center',justifyContent:'center'},chipOn:{backgroundColor:COLORS.dark},chipText:{fontSize:8.5,fontWeight:'900',color:COLORS.primary},chipTextOn:{color:'#fff'},input:{minHeight:42,borderRadius:11,borderWidth:1,borderColor:'rgba(7,61,75,.10)',backgroundColor:'#fff',paddingHorizontal:10,fontSize:11.5,fontWeight:'700',color:COLORS.text},addButton:{minHeight:42,borderRadius:11,backgroundColor:COLORS.dark,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},addText:{fontSize:10.5,fontWeight:'900',color:'#fff'},
  expenseList:{gap:5},expenseRow:{minHeight:48,padding:7,borderRadius:11,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',gap:7},expenseIcon:{width:32,height:32,borderRadius:10,backgroundColor:'rgba(232,246,246,.94)',alignItems:'center',justifyContent:'center'},expenseTitle:{fontSize:10.5,fontWeight:'900',color:COLORS.text},expenseNote:{fontSize:9,lineHeight:13,color:COLORS.textMuted,marginTop:2},remove:{width:31,height:31,borderRadius:9,backgroundColor:'rgba(224,92,102,.07)',alignItems:'center',justifyContent:'center'},
  checkList:{gap:5},checkRow:{minHeight:42,paddingHorizontal:9,borderRadius:11,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',gap:7},checkRowDone:{backgroundColor:'rgba(47,174,104,.07)'},checkText:{flex:1,fontSize:10.5,lineHeight:15,fontWeight:'800',color:COLORS.text},checkTextDone:{textDecorationLine:'line-through',color:COLORS.textMuted},emptyText:{fontSize:9.5,lineHeight:15,color:COLORS.textMuted},scoreGrid:{flexDirection:'row',flexWrap:'wrap',gap:6},scoreItem:{width:'48%',flexGrow:1,padding:8,borderRadius:10,backgroundColor:'#fff'},scoreLabel:{fontSize:8.5,fontWeight:'800',color:COLORS.textMuted},scoreValue:{fontSize:11,fontWeight:'900',color:COLORS.text,marginTop:2},
});
