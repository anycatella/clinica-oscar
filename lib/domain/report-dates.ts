import {validateDate} from './calendar';
const months:Record<string,number>={ene:1,enero:1,jan:1,january:1,feb:2,febrero:2,february:2,mar:3,marzo:3,march:3,abr:4,abril:4,apr:4,april:4,may:5,mayo:5,jun:6,junio:6,june:6,jul:7,julio:7,july:7,ago:8,agosto:8,aug:8,august:8,sep:9,sept:9,set:9,septiembre:9,setiembre:9,september:9,oct:10,octubre:10,october:10,nov:11,noviembre:11,november:11,dic:12,diciembre:12,dec:12,december:12};
export function datesInText(text:string){
 const found:{date:string,index:number}[]=[];
 const add=(day:string,month:string|number,year:string,index:number)=>{const y=year.length===2?(Number(year)<=49?'20':'19')+year:year;const date=`${y}-${String(month).padStart(2,'0')}-${day.padStart(2,'0')}`;if(validateDate(date))found.push({date,index});};
 for(const m of text.matchAll(/\b(\d{4})\s*-\s*(\d{1,2})\s*-\s*(\d{1,2})\b/g))add(m[3],m[2],m[1],m.index!);
 for(const m of text.matchAll(/\b(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{4}|\d{2})\b/g))add(m[1],m[2],m[3],m.index!);
 for(const m of text.matchAll(/\b(\d{1,2})\s*(?:[-/.]|de\s+)?\s*([a-záéíóú]+)\.?\s*(?:[-/.]|de\s+)?\s*(\d{4}|\d{2})\b/gi)){const month=months[m[2].toLowerCase()];if(month)add(m[1],month,m[3],m.index!);}
 return found.sort((a,b)=>a.index-b.index);
}
export function reportDates(text:string){
 const lines=text.split(/\n/).map(x=>x.trim()).filter(Boolean);
 const excluded=/nacim|birth|impresi[oó]n|emisi[oó]n|firma|validaci[oó]n|\d:\d{2}\s*(?:[ap]\.?m\.?)|https?:\/\//i;
 const medical=/protocolo|extracci[oó]n|toma|muestra|realiza|fecha.*(?:estudio|an[aá]lisis|ingreso|atenci[oó]n)/i;
 const ranked:{date:string,rank:number}[]=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i];if(excluded.test(line))continue;
  let dates=datesInText(line);const rank=medical.test(line)?3:/fecha|date/i.test(line)?2:1;
  if(!dates.length&&rank>1&&lines[i+1]&&!excluded.test(lines[i+1])&&!/fecha|protocolo|nacim/i.test(lines[i+1]))dates=datesInText(lines[i+1]);
  for(const d of dates)ranked.push({date:d.date,rank});
 }
 const best=ranked.filter(x=>x.rank===Math.max(0,...ranked.map(x=>x.rank)));
 const top=[...new Set(best.map(x=>x.date))];
 return {dateCandidates:[...new Set(datesInText(text).map(x=>x.date))],medicalDateSuggestion:top.length===1?top[0]:null};
}
