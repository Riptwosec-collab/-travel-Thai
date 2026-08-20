const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function write(rel, content) {
  fs.writeFileSync(path.join(root, rel), content, 'utf8');
  console.log(`[ui-patch] updated ${rel}`);
}

function patchTripPlanner() {
  const rel = 'components/TripPlannerCore.tsx';
  let src = read(rel);
  const original = src;

  src = src.replace(
    "import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';",
    "import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';"
  );

  if (!src.includes('async function copyTripPlaceName')) {
    src = src.replace(
      "const blankSchedule=():TripScheduleItem=>({id:uid('slot'),time:'',title:'',detail:'',activities:[],notes:[]});",
      "async function copyTripPlaceName(name:string){\n  const clean=(name||'').trim();\n  if(!clean)return false;\n  try{\n    if(Platform.OS==='web'){\n      const nav=(globalThis as any).navigator;\n      if(nav?.clipboard?.writeText){\n        await nav.clipboard.writeText(clean);\n        return true;\n      }\n      const win=(globalThis as any).window;\n      if(win?.prompt){\n        win.prompt('คัดลอกชื่อสถานที่',clean);\n        return true;\n      }\n    }\n    await Share.share({message:clean});\n    return true;\n  }catch{\n    Alert.alert('คัดลอกไม่สำเร็จ',clean);\n    return false;\n  }\n}\n\nconst blankSchedule=():TripScheduleItem=>({id:uid('slot'),time:'',title:'',detail:'',activities:[],notes:[]});"
    );
  }

  if (!src.includes('copiedPlace')) {
    src = src.replace(
      "  const [open,setOpen]=useState(false);",
      "  const [open,setOpen]=useState(false);\n  const [copiedPlace,setCopiedPlace]=useState('');\n  const copyName=async(name:string)=>{const ok=await copyTripPlaceName(name);if(ok){setCopiedPlace(name);setTimeout(()=>setCopiedPlace(''),1200)}};"
    );
  }

  src = src.replace(
    "<View style={s.previewSlotMain}><Text style={s.previewTime}>{x.time||'--:--'}</Text><Text style={s.previewSlotText}>{x.title||'กิจกรรม'}</Text></View>",
    "<View style={s.previewSlotMain}><Text style={s.previewTime}>{x.time||'--:--'}</Text><Text style={s.previewSlotText}>{x.title||'กิจกรรม'}</Text><Pressable accessibilityLabel={'คัดลอก '+(x.title||'กิจกรรม')} style={[s.copyPlaceButton,copiedPlace===(x.title||'กิจกรรม')&&s.copyPlaceButtonDone]} onPress={()=>copyName(x.title||'กิจกรรม')}><Ionicons name={copiedPlace===(x.title||'กิจกรรม')?'checkmark':'copy-outline'} size={14} color={copiedPlace===(x.title||'กิจกรรม')?'#2FAE68':COLORS.primary}/></Pressable></View>"
  );

  if (!src.includes('copyPlaceButton:{')) {
    src = src.replace(
      "previewSlotText:{flex:1,fontSize:10.5,lineHeight:15,fontWeight:'800',color:COLORS.text},previewDetail:",
      "previewSlotText:{flex:1,fontSize:10.5,lineHeight:15,fontWeight:'800',color:COLORS.text},copyPlaceButton:{width:32,height:32,borderRadius:10,backgroundColor:'rgba(232,246,246,.92)',borderWidth:1,borderColor:'rgba(7,61,75,.08)',alignItems:'center',justifyContent:'center',flexShrink:0},copyPlaceButtonDone:{backgroundColor:'rgba(47,174,104,.10)',borderColor:'rgba(47,174,104,.24)'},previewDetail:"
    );
  }

  if (src !== original) write(rel, src);
  else console.log('[ui-patch] TripPlannerCore already patched');
}

function patchGlassBackground() {
  const rel = 'components/glass/index.tsx';
  let src = read(rel);
  const original = src;

  src = src.replace('outputRange:[1.03,1.085]', 'outputRange:[1.015,1.045]');
  src = src.replace('style={StyleSheet.absoluteFill} contentFit="cover"', 'style={[StyleSheet.absoluteFill,{opacity:.92}]} contentFit="cover"');
  src = src.replace('    <View pointerEvents="none" style={styles.bloomA}/>\n    <View pointerEvents="none" style={styles.bloomB}/>\n', '');
  src = src.replace("  photoWash:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,82,104,.14)'},", "  photoWash:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,68,82,.22)'},");
  src = src.replace(/\n  bloomA:\{[^\n]+\},\n  bloomB:\{[^\n]+\},/, '');

  if (src !== original) write(rel, src);
  else console.log('[ui-patch] glass background already patched');
}

patchTripPlanner();
patchGlassBackground();
