import {
  TripAccommodationNight,
  TripBudgetTier,
  TripDay,
  TripDayBudgetItem,
  TripMoneyRange,
  TripScheduleItem,
} from '@/types';

export type ParsedTripText = {
  title?: string;
  travelers?: number;
  overviewBudgetRange?: TripMoneyRange;
  transport?: string;
  routeText?: string;
  routeStops: string[];
  note?: string;
  days: TripDay[];
  attractionsSummary: string[];
  accommodationPlan: TripAccommodationNight[];
  budgetSummaryLines: string[];
  budgetTiers: TripBudgetTier[];
  packingList: string[];
  importantNotes: string[];
};

type DayHeader={day:number;title?:string};
type TimeParts={time:string;rest:string};

const clean=(value:string)=>value
  .replace(/\r/g,'')
  .replace(/\u00a0/g,' ')
  .replace(/```[a-z0-9_-]*\s*/gi,'')
  .replace(/```/g,'')
  .replace(/[ \t]+$/gm,'')
  .trim();

const stripMarkdown=(value:string)=>value
  .replace(/^\s{0,3}#{1,6}\s*/,'')
  .replace(/\*\*/g,'')
  .replace(/__/g,'')
  .replace(/^>\s*/,'')
  .trim();

const stripBullet=(value:string)=>stripMarkdown(value)
  .replace(/^[-•▪▫◦●○✓✔☑]\s*/,'')
  .trim();

const usefulLines=(value:string)=>clean(value)
  .split('\n')
  .map(stripMarkdown)
  .filter(x=>x&&!/^(?:={3,}|-{3,}|_{3,})$/.test(x));

const amount=(value:string)=>Number(value.replace(/,/g,''))||0;

export const parseMoneyRange=(value:string):TripMoneyRange|undefined=>{
  const normalized=value.replace(/,/g,'').replace(/\s+/g,' ');
  const hasMoneyHint=/(?:บาท|฿|THB|งบ|ค่าใช้จ่าย|ค่าเดินทาง|ค่าที่พัก|ค่าอาหาร|ค่าเข้า|ค่าเรือ|ค่ารถ|ค่าเที่ยว|กิจกรรม|อาหาร|น้ำมัน|ของฝาก|กาแฟ|สระ|ห้อง|คืน|คัน)/i.test(value);
  const range=normalized.match(/(\d{1,})\s*(?:–|—|-|ถึง|to)\s*(\d{1,})\s*\+?(?:\s*(?:บาท|฿|THB))?/i);
  if(range&&hasMoneyHint)return {min:amount(range[1]),max:amount(range[2])};
  const single=normalized.match(/(?:ประมาณ\s*)?(\d{1,})\s*(?:บาท|฿|THB)/i)
    || (hasMoneyHint?normalized.match(/(?:งบ|ประมาณ|ค่าใช้จ่าย|ค่าเข้า|ค่าเรือ|ค่ารถ|ค่าอาหาร|น้ำมัน)\D{0,16}(\d{1,})/i):null);
  if(single){const n=amount(single[1]);return {min:n,max:n};}
  return undefined;
};

const THAI_DAY_WORDS:Record<string,number>={
  'แรก':1,'หนึ่ง':1,'สอง':2,'สาม':3,'สี่':4,'ห้า':5,'หก':6,'เจ็ด':7,'แปด':8,'เก้า':9,'สิบ':10,
};

const getDayHeader=(raw:string):DayHeader|null=>{
  const line=stripMarkdown(raw).replace(/^[-•]\s*/,'').trim();
  let m=line.match(/^(?:DAY|D)\s*0*(\d{1,2})(?:\s*\/\s*\d{1,2})?(?:\s*(?:[-–—:|]\s*)?(.+))?$/i);
  if(m)return {day:Number(m[1]),title:m[2]?.trim()||undefined};
  m=line.match(/^วันที่\s*0*(\d{1,2})(?:\s*(?:[-–—:|]\s*)?(.+))?$/i);
  if(m)return {day:Number(m[1]),title:m[2]?.trim()||undefined};
  m=line.match(/^วัน(?:ที่)?\s*(แรก|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)(?:\s*(?:[-–—:|]\s*)?(.+))?$/i);
  if(m)return {day:THAI_DAY_WORDS[m[1]]||1,title:m[2]?.trim()||undefined};
  return null;
};

const normalizeTimeToken=(value:string)=>value
  .replace(/(\d{1,2})\.(\d{2})/g,'$1:$2')
  .replace(/\s*น\.?/gi,'')
  .replace(/\s+/g,' ')
  .trim();

const extractTime=(raw:string):TimeParts|null=>{
  const line=stripBullet(raw);
  const period=line.match(/^(ช่วง(?:เช้า|สาย|เที่ยง|บ่าย|เย็น|ค่ำ|กลางคืน))(?:\s*(?:[-–—:|]\s*)?(.+))?$/i);
  if(period)return {time:period[1],rest:period[2]?.trim()||''};

  const m=line.match(/^(?:ประมาณ\s*)?(\d{1,2}[.:]\d{2})(?:\s*น\.?)?(?:\s*(?:[-–—]|ถึง)\s*(\d{1,2}[.:]\d{2})(?:\s*น\.?)?)?(?:\s*(?:[-–—:|]\s*)?(.+))?$/i);
  if(!m)return null;
  const start=normalizeTimeToken(m[1]);
  const end=m[2]?normalizeTimeToken(m[2]):'';
  return {time:end?`${start}–${end}`:start,rest:m[3]?.trim()||''};
};

const isGlobalSectionHeading=(line:string)=>/^(?:สรุปสถานที่เที่ยว|สถานที่เที่ยวทั้งหมด|สรุปที่พัก|ที่พักรายคืน|งบรวม|งบประมาณรวม|สรุปงบ|ค่าใช้จ่ายรวม|ของที่ควรเตรียม|Checklist|เช็กลิสต์|หมายเหตุสำคัญ|ข้อควรระวังสำคัญ)\s*[:：]?$/i.test(stripBullet(line));

const isSectionHeading=(line:string)=>/^(?:กิจกรรม|รายละเอียด|หมายเหตุ|แนะนำ|ข้อควรระวัง|งบ(?:ประมาณ)?(?:วันที่|วัน|DAY)?|ค่าใช้จ่าย|ที่พัก|สรุป|ของที่ควรเตรียม|Checklist)\s*[:：]?$/i.test(stripBullet(line));

const isTipOrWarning=(line:string)=>/(?:^แนะนำ|^ควร|^ต้อง|^เตรียม|^ตรวจสอบ|^เช็ก|ข้อควรระวัง|ควรระวัง|หน้าฝน|ค่อนข้างชัน|ทางลูกรัง|รองเท้า.*เกาะพื้น|น้ำอย่างน้อย)/i.test(line);

const parseScheduleBlock=(time:string,rawLines:string[],day:number,index:number):TripScheduleItem=>{
  const content=rawLines.map(stripBullet).filter(Boolean);
  const activities:string[]=[];
  const notes:string[]=[];
  const detail:string[]=[];
  let title='กิจกรรม';
  let mode:'detail'|'activities'|'notes'='detail';
  let gotTitle=false;

  for(const raw of content){
    const line=raw.trim();
    if(/^กิจกรรม\s*[:：]?$/i.test(line)){mode='activities';continue;}
    if(/^(?:รายละเอียด)\s*[:：]?$/i.test(line)){mode='detail';continue;}
    if(/^(?:แนะนำ|หมายเหตุ|ข้อควรระวัง|ควรระวัง)\s*[:：]?$/i.test(line)){mode='notes';continue;}
    const noteInline=line.match(/^(?:แนะนำ|หมายเหตุ|ข้อควรระวัง|ควรระวัง)\s*[:：]\s*(.+)$/i);
    if(noteInline){mode='notes';notes.push(noteInline[1].trim());continue;}
    if(!gotTitle&&!isSectionHeading(line)){
      title=line;
      gotTitle=true;
      continue;
    }
    if(mode==='activities')activities.push(line);
    else if(mode==='notes'||isTipOrWarning(line))notes.push(line);
    else if(!isSectionHeading(line))detail.push(line);
  }

  return {
    id:`day-${day}-slot-${index}`,
    time:time||undefined,
    title,
    detail:detail.length?detail.join('\n'):undefined,
    activities:activities.length?activities:undefined,
    notes:notes.length?Array.from(new Set(notes)):undefined,
  };
};

const parseBudgetItems=(sourceLines:string[]):{range?:TripMoneyRange;items:TripDayBudgetItem[];notes:string[]}=>{
  const items:TripDayBudgetItem[]=[];
  const notes:string[]=[];
  let explicitRange:TripMoneyRange|undefined;
  sourceLines.forEach(raw=>{
    const line=stripBullet(raw);
    if(!line)return;
    const r=parseMoneyRange(line);
    if(/^(?:รวม|รวมประมาณ|งบรวม|ยอดรวม)/i.test(line)&&r){explicitRange=r;return;}
    if(r){
      const label=line.split(/\d/)[0].replace(/[:：=-]/g,'').trim()||'ค่าใช้จ่าย';
      items.push({label,min:r.min,max:r.max,text:line});
    }else if(!/^(?:งบ|ค่าใช้จ่าย)\s*[:：]?$/i.test(line))notes.push(line);
  });
  const sumMin=items.reduce((sum,x)=>sum+(x.min||x.max||0),0);
  const sumMax=items.reduce((sum,x)=>sum+(x.max||x.min||0),0);
  const range=explicitRange||(sumMin||sumMax?{min:sumMin||undefined,max:sumMax||undefined}:undefined);
  return {range,items,notes};
};

const findAccommodation=(sourceLines:string[],schedule:TripScheduleItem[])=>{
  const line=sourceLines.map(stripBullet).find(x=>/^(?:พัก(?:ที่)?|ที่พัก(?:คืนนี้)?|โรงแรม)\s*[:：-]?/i.test(x));
  if(line){
    return line
      .replace(/^(?:พัก(?:ที่)?|ที่พัก(?:คืนนี้)?|โรงแรม)\s*[:：-]?\s*/i,'')
      .replace(/\s*คืนที่\s*\d+.*$/i,'')
      .trim()||undefined;
  }
  const checkIn=schedule.find(x=>/(?:check\s*-?\s*in|เช็กอิน|เข้าที่พัก)/i.test(x.title));
  if(checkIn)return checkIn.title;
  const backToHotel=schedule.find(x=>/กลับที่พัก/i.test(x.title));
  return backToHotel?.title;
};

const parseDay=(dayNo:number,rawBody:string,headerTitle?:string):TripDay=>{
  const all=usefulLines(rawBody);
  const stopIndex=all.findIndex(x=>isGlobalSectionHeading(stripBullet(x)));
  const sourceLines=stopIndex>=0?all.slice(0,stopIndex):all;

  const budgetStart=sourceLines.findIndex(x=>/^(?:งบ(?:ประมาณ)?(?:วันที่|วัน|DAY)?\s*\d*|ค่าใช้จ่าย(?:ของ)?(?:วัน)?\s*\d*)\s*[:：]?$/i.test(stripBullet(x)));
  const scheduleSource=budgetStart>=0?sourceLines.slice(0,budgetStart):sourceLines;
  const budgetSource=budgetStart>=0?sourceLines.slice(budgetStart+1):sourceLines.filter(x=>!!parseMoneyRange(stripBullet(x)));

  let title=headerTitle?.trim()||'';
  let titleIndex=-1;
  if(!title){
    titleIndex=scheduleSource.findIndex(x=>!extractTime(x)&&!isSectionHeading(x)&&!/^(?:เส้นทาง|พัก(?:ที่)?|ที่พัก|โรงแรม)\b/i.test(stripBullet(x)));
    if(titleIndex>=0)title=stripBullet(scheduleSource[titleIndex]);
  }
  if(!title)title=`DAY ${dayNo}`;

  const schedule:TripScheduleItem[]=[];
  let currentTime='';
  let buffer:string[]=[];
  const flush=()=>{
    if(currentTime&&(buffer.length||currentTime))schedule.push(parseScheduleBlock(currentTime,buffer,dayNo,schedule.length+1));
    buffer=[];
  };

  scheduleSource.forEach((line,index)=>{
    if(index===titleIndex)return;
    if(/^(?:พัก(?:ที่)?|ที่พัก(?:คืนนี้)?|โรงแรม)\s*[:：-]?/i.test(stripBullet(line)))return;
    const time=extractTime(line);
    if(time){
      flush();
      currentTime=time.time;
      if(time.rest)buffer.push(time.rest);
      return;
    }
    if(currentTime&&!isGlobalSectionHeading(line))buffer.push(line);
  });
  flush();

  if(!schedule.length){
    const fallback=scheduleSource
      .filter((_,i)=>i!==titleIndex)
      .map(stripBullet)
      .filter(x=>x&&!isSectionHeading(x)&&!isGlobalSectionHeading(x)&&!/^(?:พัก(?:ที่)?|ที่พัก|โรงแรม|เส้นทาง)\b/i.test(x));
    if(fallback.length)schedule.push(parseScheduleBlock('',fallback,dayNo,1));
  }

  const parsedBudget=parseBudgetItems(budgetSource);
  const explicitRoute=sourceLines.map(stripBullet).find(x=>/^เส้นทาง(?:วันนี้)?\s*[:：-]/i.test(x));
  const travelSteps=schedule
    .map(x=>x.title)
    .filter(x=>/(?:^ออก|ออกเดินทาง|เดินทางไป|ไป(?:ยัง|ที่)?|ถึง|กลับ|ขึ้นเขา|ลงเขา)/i.test(x));
  const route=explicitRoute?.replace(/^เส้นทาง(?:วันนี้)?\s*[:：-]?\s*/i,'').trim()
    || (travelSteps.length?travelSteps.join(' → '):undefined);
  const accommodation=findAccommodation(sourceLines,schedule);
  const dayNotes=Array.from(new Set(schedule.flatMap(x=>x.notes||[])));

  return {
    day:dayNo,
    title,
    placeIds:[],
    route,
    schedule,
    accommodation,
    budgetRange:parsedBudget.range,
    budgetItems:parsedBudget.items,
    note:dayNotes.length?dayNotes.join(' · '):(parsedBudget.notes.length?parsedBudget.notes.join(' · '):undefined),
  };
};

const parseDays=(text:string)=>{
  const rawLines=clean(text).split('\n');
  const days:TripDay[]=[];
  let current:DayHeader|null=null;
  let buffer:string[]=[];

  const flush=()=>{
    if(!current)return;
    days.push(parseDay(current.day,buffer.join('\n'),current.title));
    buffer=[];
  };

  rawLines.forEach(raw=>{
    const header=getDayHeader(raw);
    if(header){
      flush();
      current=header;
      return;
    }
    if(current)buffer.push(raw);
  });
  flush();

  if(days.length)return days.sort((a,b)=>a.day-b.day).map((d,i)=>({...d,day:i+1}));

  const fallback=parseDay(1,text);
  return [{...fallback,title:fallback.title==='DAY 1'?'แผนวันที่ 1':fallback.title}];
};

const findSection=(sourceLines:string[],start:RegExp,end:RegExp[])=>{
  const startIndex=sourceLines.findIndex(x=>start.test(stripBullet(x)));
  if(startIndex<0)return [] as string[];
  const first=stripBullet(sourceLines[startIndex]);
  const inline=first.replace(start,'').replace(/^\s*[:：-]\s*/,'').trim();
  const out:string[]=[];
  if(inline)out.push(inline);
  for(let i=startIndex+1;i<sourceLines.length;i++){
    const line=stripBullet(sourceLines[i]);
    if(end.some(rx=>rx.test(line))||getDayHeader(line))break;
    if(line)out.push(line);
  }
  return out;
};

const parseNumberedList=(sourceLines:string[])=>sourceLines
  .map(stripBullet)
  .map(x=>x.replace(/^\d+[.)]\s*/,'').trim())
  .filter(Boolean);

const parseAccommodationPlan=(sourceLines:string[]):TripAccommodationNight[]=>{
  const result:TripAccommodationNight[]=[];
  for(let i=0;i<sourceLines.length;i++){
    const line=stripBullet(sourceLines[i]);
    const m=line.match(/^คืนที่\s*(\d+)\s*[:：-]?\s*(.*)$/i);
    if(!m)continue;
    let location=m[2].trim();
    if(!location&&sourceLines[i+1]&&!/^คืนที่/i.test(stripBullet(sourceLines[i+1])))location=stripBullet(sourceLines[++i]);
    if(location)result.push({night:Number(m[1]),location});
  }
  return result;
};

const parseBudgetTiers=(sourceLines:string[]):TripBudgetTier[]=>{
  const result:TripBudgetTier[]=[];
  sourceLines.forEach((line,index)=>{
    const cleanLine=stripBullet(line);
    const range=parseMoneyRange(cleanLine);
    if(!range)return;
    let label=cleanLine.split(/[:：]/)[0].trim();
    if(/^ประมาณ/.test(label)&&index>0)label=stripBullet(sourceLines[index-1]).replace(/:$/,'').trim();
    const perPerson=/ต่อคน|\/\s*คน/.test(cleanLine);
    if(/งบประหยัด|งบแนะนำ|งบสบาย|เฉลี่ย|รวม\s*\d+\s*คน|เตรียมประมาณ/i.test(cleanLine)||/งบประหยัด|งบแนะนำ|งบสบาย|เฉลี่ย/i.test(label)){
      result.push({label,min:range.min,max:range.max,perPerson,text:cleanLine});
    }
  });
  return result;
};

const deriveAttractions=(days:TripDay[])=>Array.from(new Set(days.flatMap(day=>(day.schedule||[])
  .map(x=>x.title?.trim())
  .filter((x):x is string=>!!x)
  .filter(x=>!/(?:^ออก|ออกเดินทาง|เดินทาง|^ไป(?:ยัง|ที่)?|^ถึง|^กลับ|ตื่น|Breakfast|Lunch|Dinner|กินข้าว|Check-?in|Check-?out|ขึ้นเขา|ลงเขา)/i.test(x))
)));

const deriveImportantNotes=(days:TripDay[])=>Array.from(new Set(days.flatMap(day=>(day.schedule||[]).flatMap(x=>x.notes||[]))));

const derivePacking=(importantNotes:string[])=>importantNotes.filter(x=>/(?:รองเท้า|เตรียมน้ำ|น้ำอย่างน้อย|เสื้อกันฝน|หมวก|ไฟฉาย)/i.test(x));

const findOverviewBudget=(sourceLines:string[],budgetLines:string[])=>{
  const preferred=[
    ...budgetLines.filter(x=>/^รวม\s*\d+\s*คน/i.test(stripBullet(x))),
    ...budgetLines.filter(x=>/^(?:รวม|รวมประมาณ|ยอดรวม|งบรวม)/i.test(stripBullet(x))),
    ...sourceLines.filter(x=>/^รวม\s*\d+\s*คน/i.test(stripBullet(x))),
  ];
  for(const line of preferred){
    const range=parseMoneyRange(stripBullet(line));
    if(range)return range;
  }
  const fallback=budgetLines.map(stripBullet).map(parseMoneyRange).find(Boolean);
  return fallback||undefined;
};

export const parseDetailedTripText=(raw:string):ParsedTripText=>{
  const text=clean(raw);
  const sourceLines=usefulLines(text);
  const firstDayIndex=sourceLines.findIndex(x=>!!getDayHeader(x));
  const preamble=firstDayIndex>=0?sourceLines.slice(0,firstDayIndex):sourceLines.slice(0,12);

  const title=preamble.find(x=>/^แผน(?:เที่ยว|การเดินทาง)|^ทริป/i.test(stripBullet(x)))
    || preamble.find(x=>!/(?:งบ|เส้นทาง|การเดินทาง|เดินทางโดย|หมายเหตุ|(?:สำหรับ|จำนวน|รวม)\s*\d+\s*คน)/i.test(stripBullet(x)))
    || sourceLines[0];

  const routeLines=findSection(sourceLines,/^เส้นทาง(?:หลัก)?\s*[:：]?/i,[/^หมายเหตุ\b/i,/^งบ(?:รวม|ประมาณรวม)?\b/i,/^สรุป/i,/^ของที่ควรเตรียม/i]);
  let routeText=routeLines.join(' ').trim();
  if(!routeText){
    const arrowLine=preamble.find(x=>/(?:→|->|=>)/.test(x));
    routeText=arrowLine?stripBullet(arrowLine).replace(/^เส้นทาง(?:หลัก)?\s*[:：-]?\s*/i,'').trim():'';
  }
  const routeStops=routeText?routeText.split(/→|->|=>/).map(x=>x.trim()).filter(Boolean):[];

  const noteLine=preamble.find(x=>/^หมายเหตุ\s*[:：-]/i.test(stripBullet(x)));
  const note=noteLine?.replace(/^หมายเหตุ\s*[:：-]\s*/i,'').trim();
  const days=parseDays(text);

  const attractionsLines=findSection(sourceLines,/^สรุปสถานที่เที่ยว\b|^สถานที่เที่ยวทั้งหมด\b/i,[/^สรุปที่พัก/i,/^งบ(?:รวม|ประมาณรวม)\b/i,/^สรุปงบ/i,/^ของที่ควรเตรียม/i,/^Checklist/i,/^หมายเหตุสำคัญ/i]);
  const accommodationLines=findSection(sourceLines,/^สรุปที่พัก\b|^ที่พักรายคืน\b/i,[/^งบ(?:รวม|ประมาณรวม)\b/i,/^สรุปงบ/i,/^ของที่ควรเตรียม/i,/^Checklist/i,/^หมายเหตุสำคัญ/i]);
  const budgetLines=findSection(sourceLines,/^งบรวม\b|^งบประมาณรวม\b|^สรุปงบ\b|^ค่าใช้จ่ายรวม\b/i,[/^ของที่ควรเตรียม/i,/^Checklist/i,/^หมายเหตุสำคัญ/i]);
  const packingLines=findSection(sourceLines,/^ของที่ควรเตรียม\b|^Checklist\b|^เช็กลิสต์\b/i,[/^หมายเหตุสำคัญ/i]);
  const importantLines=findSection(sourceLines,/^หมายเหตุสำคัญ\b|^ข้อควรระวังสำคัญ\b/i,[]);

  const travelerLine=sourceLines.find(x=>/(?:สำหรับ|จำนวน|รวม)\s*\d+\s*คน/i.test(stripBullet(x)));
  const travelersMatch=travelerLine?.match(/(?:สำหรับ|จำนวน|รวม)\s*(\d+)\s*คน/i);
  const overviewBudgetRange=findOverviewBudget(sourceLines,budgetLines);

  const transportLine=sourceLines.find(x=>/^(?:รูปแบบการเดินทาง|การเดินทาง|เดินทางโดย)\s*[:：-]/i.test(stripBullet(x)));
  let transport=transportLine?.replace(/^(?:รูปแบบการเดินทาง|การเดินทาง|เดินทางโดย)\s*[:：-]\s*/i,'').trim();
  if(!transport&&/(?:เวลาขับ|น้ำมัน|ขับประมาณ|ระยะทาง.*กม)/i.test(text))transport='รถยนต์ส่วนตัว';
  if(/4WD/i.test(text))transport=transport?`${transport} + 4WD`:'4WD';

  const accommodationPlan=parseAccommodationPlan(accommodationLines);
  if(!accommodationPlan.length){
    days.forEach((day,index)=>{if(day.accommodation)accommodationPlan.push({night:index+1,location:day.accommodation});});
  }

  const explicitAttractions=parseNumberedList(attractionsLines);
  const derivedImportant=deriveImportantNotes(days);
  const explicitImportant=parseNumberedList(importantLines);
  const importantNotes=Array.from(new Set([...explicitImportant,...derivedImportant]));
  const explicitPacking=parseNumberedList(packingLines);
  const packingList=explicitPacking.length?explicitPacking:derivePacking(importantNotes);
  const budgetSummaryLines=budgetLines.map(stripBullet).filter(Boolean);

  return {
    title:stripBullet(title||'แผนเที่ยวใหม่'),
    travelers:travelersMatch?Number(travelersMatch[1]):undefined,
    overviewBudgetRange,
    transport,
    routeText:routeText||undefined,
    routeStops,
    note:note||undefined,
    days,
    attractionsSummary:explicitAttractions.length?explicitAttractions:deriveAttractions(days),
    accommodationPlan,
    budgetSummaryLines,
    budgetTiers:parseBudgetTiers(budgetSummaryLines),
    packingList,
    importantNotes,
  };
};
