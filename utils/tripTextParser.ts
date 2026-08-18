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

const clean=(value:string)=>value.replace(/\r/g,'').replace(/\u00a0/g,' ').trim();
const usefulLines=(value:string)=>clean(value).split('\n').map(x=>x.trim()).filter(x=>x&&!/^={3,}$/.test(x));
const stripBullet=(value:string)=>value.replace(/^[-•]\s*/, '').trim();
const amount=(value:string)=>Number(value.replace(/,/g,''))||0;

export const parseMoneyRange=(value:string):TripMoneyRange|undefined=>{
  const normalized=value.replace(/,/g,'');
  const range=normalized.match(/(\d{2,})\s*[–—-]\s*(\d{2,})\s*บาท/);
  if(range)return {min:amount(range[1]),max:amount(range[2])};
  const single=normalized.match(/(?:ประมาณ\s*)?(\d{2,})\s*บาท/);
  if(single){const n=amount(single[1]);return {min:n,max:n};}
  return undefined;
};

const section=(text:string,start:string,endMarkers:string[])=>{
  const source=clean(text);
  const startIndex=source.indexOf(start);
  if(startIndex<0)return '';
  const after=source.slice(startIndex+start.length);
  let end=after.length;
  endMarkers.forEach(marker=>{
    const i=after.indexOf(marker);
    if(i>=0&&i<end)end=i;
  });
  return after.slice(0,end).trim();
};

const isTimeLine=(line:string)=>{
  const x=line.trim();
  return /^(?:ประมาณ\s*)?\d{1,2}[.:]\d{2}(?:\s*[–—-]\s*\d{1,2}[.:]\d{2})?\s*น\.?$/i.test(x)
    || /^ช่วง(?:เช้า|สาย|เที่ยง|บ่าย|เย็น|ค่ำ|กลางคืน)$/i.test(x);
};

const normalizeTime=(line:string)=>line.replace(/(\d{1,2})\.(\d{2})/g,'$1:$2').replace(/\s+/g,' ').trim();

const parseScheduleBlock=(time:string,lines:string[],day:number,index:number):TripScheduleItem=>{
  const content=lines.map(stripBullet).filter(Boolean);
  const activities:string[]=[];
  const notes:string[]=[];
  const detail:string[]=[];
  let title='กิจกรรม';
  let mode:'detail'|'activities'|'notes'='detail';
  let gotTitle=false;

  for(const raw of content){
    const line=raw.trim();
    if(/^กิจกรรม\s*:$/i.test(line)){mode='activities';continue;}
    if(/^(?:แนะนำ|หมายเหตุ|ควรระวัง|ถ้าเป็นช่วง|ก่อนออกไป.*แนะนำให้ซื้อ)\s*:/i.test(line)){
      mode='notes';
      const tail=line.split(':').slice(1).join(':').trim();
      if(tail)notes.push(tail);
      continue;
    }
    if(!gotTitle&&!/^(?:ใช้เวลาประมาณ|พักผ่อน|แวะ)\b/.test(line)){
      title=line;
      gotTitle=true;
      continue;
    }
    if(mode==='activities')activities.push(line);
    else if(mode==='notes')notes.push(line);
    else detail.push(line);
  }

  return {
    id:`day-${day}-slot-${index}`,
    time:normalizeTime(time),
    title,
    detail:detail.length?detail.join('\n'):undefined,
    activities:activities.length?activities:undefined,
    notes:notes.length?notes:undefined,
  };
};

const parseBudgetItems=(lines:string[]):{range?:TripMoneyRange;items:TripDayBudgetItem[];notes:string[]}=>{
  const items:TripDayBudgetItem[]=[];
  const notes:string[]=[];
  let range:TripMoneyRange|undefined;
  lines.forEach(line=>{
    const cleanLine=stripBullet(line);
    if(/^รวมประมาณ/i.test(cleanLine)){
      range=parseMoneyRange(cleanLine)||range;
      return;
    }
    const r=parseMoneyRange(cleanLine);
    if(r){
      const label=cleanLine.split(/\d/)[0].replace(/[:：]/g,'').trim()||'ค่าใช้จ่าย';
      items.push({label,min:r.min,max:r.max,text:cleanLine});
    }else if(cleanLine)notes.push(cleanLine);
  });
  return {range,items,notes};
};

const parseDay=(dayNo:number,rawBody:string):TripDay=>{
  const stopMarkers=['สรุปสถานที่เที่ยว','สรุปที่พัก','งบประมาณรวม','ของที่ควรเตรียม','หมายเหตุสำคัญ'];
  let body=rawBody;
  let stop=body.length;
  stopMarkers.forEach(marker=>{
    const i=body.indexOf(marker);
    if(i>=0&&i<stop)stop=i;
  });
  body=body.slice(0,stop);

  const lines=usefulLines(body);
  const title=lines[0]||`DAY ${dayNo}`;
  const work=lines.slice(1);
  const budgetIndex=work.findIndex(x=>/^งบวันที่\s*\d+/i.test(x));
  const scheduleLines=(budgetIndex>=0?work.slice(0,budgetIndex):work);
  const budgetLines=budgetIndex>=0?work.slice(budgetIndex+1):[];

  const accommodationLine=scheduleLines.find(x=>/^พัก.+คืนที่\s*\d+/i.test(x));
  const accommodation=accommodationLine?.replace(/\s*คืนที่\s*\d+.*$/i,'').replace(/^พัก/,'').trim();

  const schedule:TripScheduleItem[]=[];
  let currentTime='';
  let buffer:string[]=[];
  const flush=()=>{
    if(currentTime&&buffer.length)schedule.push(parseScheduleBlock(currentTime,buffer,dayNo,schedule.length+1));
    buffer=[];
  };

  scheduleLines.forEach(line=>{
    if(isTimeLine(line)){
      flush();
      currentTime=line;
      return;
    }
    if(/^พัก.+คืนที่\s*\d+/i.test(line))return;
    if(currentTime)buffer.push(line);
  });
  flush();

  const parsedBudget=parseBudgetItems(budgetLines);
  const routeGuess=schedule.find(x=>/เดินทาง|ออกจาก|กลับ/.test(x.title))?.title;
  const notes=[...parsedBudget.notes];

  return {
    day:dayNo,
    title,
    placeIds:[],
    route:routeGuess,
    schedule,
    accommodation,
    budgetRange:parsedBudget.range,
    budgetItems:parsedBudget.items,
    note:notes.length?notes.join(' · '):undefined,
  };
};

const parseDays=(text:string)=>{
  const split=clean(text).split(/(?:^|\n)\s*=*\s*DAY\s+(\d+)\s*(?:\n|$)/i);
  const days:TripDay[]=[];
  for(let i=1;i<split.length;i+=2){
    const dayNo=Number(split[i]);
    const body=split[i+1]||'';
    if(dayNo)days.push(parseDay(dayNo,body));
  }
  return days;
};

const parseNumberedList=(value:string)=>usefulLines(value)
  .map(x=>x.replace(/^\d+[.)]\s*/,'').trim())
  .filter(Boolean);

const parseAccommodationPlan=(value:string):TripAccommodationNight[]=>{
  const lines=usefulLines(value);
  const result:TripAccommodationNight[]=[];
  for(let i=0;i<lines.length;i++){
    const m=lines[i].match(/^คืนที่\s*(\d+)\s*:?\s*(.*)$/i);
    if(!m)continue;
    let location=m[2].trim();
    if(!location&&lines[i+1]&&!/^คืนที่/i.test(lines[i+1]))location=lines[++i].trim();
    if(location)result.push({night:Number(m[1]),location});
  }
  return result;
};

const parseBudgetTiers=(lines:string[]):TripBudgetTier[]=>{
  const result:TripBudgetTier[]=[];
  lines.forEach((line,index)=>{
    const range=parseMoneyRange(line);
    if(!range)return;
    let label=line.split(':')[0].trim();
    if(/^ประมาณ/.test(label)&&index>0)label=lines[index-1].replace(/:$/,'').trim();
    const perPerson=/ต่อคน|\/\s*คน/.test(line);
    if(/งบประหยัด|งบแนะนำ|เฉลี่ย|โรงแรมดีขึ้น|เตรียมประมาณ/i.test(line)||/งบประหยัด|งบแนะนำ|เฉลี่ย/i.test(label)){
      result.push({label,min:range.min,max:range.max,perPerson,text:line});
    }
  });
  return result;
};

export const parseDetailedTripText=(raw:string):ParsedTripText=>{
  const text=clean(raw);
  const lines=usefulLines(text);
  const title=lines.find(x=>/^แผนเที่ยว/i.test(x))||lines[0];

  const budgetLine=lines.find(x=>/^งบประมาณสำหรับ/i.test(x));
  const travelersMatch=budgetLine?.match(/สำหรับ\s*(\d+)\s*คน/);
  const overviewBudgetRange=budgetLine?parseMoneyRange(budgetLine):undefined;
  const transportLine=lines.find(x=>/^รูปแบบการเดินทาง\s*:/i.test(x));
  const transport=transportLine?.split(':').slice(1).join(':').trim();

  const routeText=section(text,'เส้นทางหลัก:',['หมายเหตุ:','DAY 1','====================\nDAY 1']);
  const routeStops=routeText
    ? routeText.split(/→|->|=>/).map(x=>x.replace(/\n/g,' ').trim()).filter(Boolean)
    : [];

  const topNote=section(text,'หมายเหตุ:',['DAY 1','====================\nDAY 1']);
  const days=parseDays(text);

  const attractionsSection=section(text,'สรุปสถานที่เที่ยว',['สรุปที่พัก','งบประมาณรวม','ของที่ควรเตรียม','หมายเหตุสำคัญ']);
  const accommodationSection=section(text,'สรุปที่พัก',['งบประมาณรวม','ของที่ควรเตรียม','หมายเหตุสำคัญ']);
  const budgetSection=section(text,'งบประมาณรวม',['ของที่ควรเตรียม','หมายเหตุสำคัญ']);
  const packingSection=section(text,'ของที่ควรเตรียม',['หมายเหตุสำคัญ']);
  const importantSection=section(text,'หมายเหตุสำคัญ: ',[])
    || section(text,'หมายเหตุสำคัญ:',[]);

  const budgetSummaryLines=usefulLines(budgetSection).filter(x=>!/^(?:สำหรับ\s*\d+\s*คน)$/i.test(x));

  return {
    title,
    travelers:travelersMatch?Number(travelersMatch[1]):undefined,
    overviewBudgetRange,
    transport,
    routeText:routeText.replace(/\n+/g,' ').trim()||undefined,
    routeStops,
    note:topNote.replace(/\n+/g,' ').trim()||undefined,
    days,
    attractionsSummary:parseNumberedList(attractionsSection),
    accommodationPlan:parseAccommodationPlan(accommodationSection),
    budgetSummaryLines,
    budgetTiers:parseBudgetTiers(budgetSummaryLines),
    packingList:usefulLines(packingSection).map(stripBullet).filter(Boolean),
    importantNotes:usefulLines(importantSection).map(stripBullet).filter(Boolean),
  };
};
