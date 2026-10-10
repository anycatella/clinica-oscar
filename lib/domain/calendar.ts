import type { DocumentRecord, SessionRecord, DashboardSummary } from './types';
export function validateDate(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
export function localToday(now=new Date()):string{return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Tucuman',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function summarize(documents:DocumentRecord[],sessions:SessionRecord[],today:string):DashboardSummary{
 const analyses=documents.filter(d=>d.category==='analysis'&&d.processingStatus!=='deletion-pending');const studies=documents.filter(d=>d.category==='study'&&d.processingStatus!=='deletion-pending');
 const latest=(dates:string[])=>dates.sort().at(-1)??null;
 return {latestAnalysisDate:latest(analyses.map(d=>d.medicalDate)),latestStudyDate:latest(studies.map(d=>d.medicalDate)),analysisCount:analyses.length,studyCount:studies.length,lastChemoDate:latest(sessions.filter(s=>sessionPhase(s,today)==='completed').map(s=>s.date)),nextChemoDate:sessions.filter(s=>sessionPhase(s,today)==='scheduled').map(s=>s.date).sort()[0]??null};
}
export function formatDate(date:string|null){return date?new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')):'Sin registros';}

export function sessionEndDate(session:SessionRecord):string{
 const date=new Date(session.date+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+Math.max(1,session.durationDays??1)-1);return date.toISOString().slice(0,10);
}
export function sessionPhase(session:SessionRecord,today:string):SessionRecord['status']{
 if(session.status==='cancelled')return 'cancelled';
 if(session.date>today)return 'scheduled';
 return sessionEndDate(session)>=today?'in-progress':'completed';
}
export function sessionCoversDate(session:SessionRecord,date:string){return session.date<=date&&sessionEndDate(session)>=date;}
export function treatmentOverview(sessions:SessionRecord[],today:string){
 const current=sessions.filter(s=>sessionPhase(s,today)==='in-progress').sort((a,b)=>a.date.localeCompare(b.date));
 const completed=sessions.filter(s=>sessionPhase(s,today)==='completed').sort((a,b)=>b.date.localeCompare(a.date));
 const next=sessions.filter(s=>sessionPhase(s,today)==='scheduled').sort((a,b)=>a.date.localeCompare(b.date)||a.number-b.number)[0]??null;
 return {current,latest:completed[0]??null,next,startedCount:completed.length+current.length,completedCount:completed.length};
}
