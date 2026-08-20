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

  if (!src.includes("@/components/trip/TripTravelCard")) {
    src = src.replace(
      "import { useTravelStore } from '@/store/useTravelStore';",
      "import { useTravelStore } from '@/store/useTravelStore';\nimport TripTravelCard from '@/components/trip/TripTravelCard';"
    );
  }

  src = src.replace(
    "trips.map(trip=><TripCard key={trip.id} trip={trip} onEdit={()=>openEdit(trip)} onDelete={()=>confirmDelete(trip)}/>)",
    "trips.map(trip=><TripTravelCard key={trip.id} trip={trip} onEdit={()=>openEdit(trip)} onDelete={()=>confirmDelete(trip)} onChange={patch=>updateTrip(trip.id,patch)}/>)"
  );

  if (src !== original) write(rel, src);
  else console.log('[ui-patch] TripPlannerCore already enhanced');
}

function patchTripTravelCard() {
  const rel = 'components/trip/TripTravelCard.tsx';
  let src = read(rel);
  const original = src;

  if (!src.includes("@/components/trip/TripBudgetScorePanel")) {
    src = src.replace(
      "import { PROVINCES } from '@/data/catalog';",
      "import { PROVINCES } from '@/data/catalog';\nimport TripBudgetScorePanel from '@/components/trip/TripBudgetScorePanel';"
    );
  }

  if (!src.includes('<TripBudgetScorePanel trip={trip} onChange={onChange}/>')) {
    src = src.replace(
      '    <View style={s.bottomActions}>',
      '    <TripBudgetScorePanel trip={trip} onChange={onChange}/>\n\n    <View style={s.bottomActions}>'
    );
  }

  if (src !== original) write(rel, src);
  else console.log('[ui-patch] TripTravelCard already enhanced');
}

function patchGlassBackground() {
  const rel = 'components/glass/index.tsx';
  let src = read(rel);
  const original = src;

  src = src.replace('outputRange:[1.03,1.085]', 'outputRange:[1.015,1.045]');
  src = src.replace('style={StyleSheet.absoluteFill} contentFit="cover"', 'style={[StyleSheet.absoluteFill,{opacity:.92}]} contentFit="cover"');
  src = src.replace('    <View pointerEvents="none" style={styles.bloomA}/>\n    <View pointerEvents="none" style={styles.bloomB}/>\n', '');
  src = src.replace("  photoWash:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,82,104,.14)'},", "  photoWash:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,68,82,.22)'} ,");
  src = src.replace(/\n  bloomA:\{[^\n]+\},\n  bloomB:\{[^\n]+\},/, '');

  if (src !== original) write(rel, src);
  else console.log('[ui-patch] glass background already patched');
}

patchTripPlanner();
patchTripTravelCard();
patchGlassBackground();
