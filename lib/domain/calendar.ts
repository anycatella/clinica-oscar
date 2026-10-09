import type { DocumentRecord, SessionRecord, DashboardSummary } from './types';
export function validateDate(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
export function localToday(now=new Date()):string{return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Tucuman',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function summarize(documents:DocumentRecord[],sessions:SessionRecord[],today:string):DashboardSummary{
 const analyses=documents.filter(d=>d.category==='analysis'&&d.processingStatus!=='deletion-pending');const studies=documents.filter(d=>d.category==='study'&&d.processingStatus!=='deletion-pending');
 const latest=(dates:string[])=>dates.sort().at(-1)??null;
 return {latestAnalysisDate:latest(analyses.map(d=>d.medicalDate)),latestStudyDate:latest(studies.map(d=>d.medicalDate)),analysisCount:analyses.length,studyCount:studies.length,lastChemoDate:latest(sessions.filter(s=>s.status==='completed').map(s=>s.date)),nextChemoDate:sessions.filter(s=>s.status==='scheduled'&&s.date>=today).map(s=>s.date).sort()[0]??null};
}
export function formatDate(date:string|null){return date?new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')):'Sin registros';}
