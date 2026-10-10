import { ArrowUpRight, ClipboardList, FileHeart } from 'lucide-react';
import { formatDate } from '../lib/domain/calendar';
import type { DashboardSummary, DocumentCategory } from '../lib/domain/types';

export function HistorySummary({summary,onOpen}:{summary:DashboardSummary;onOpen:(category:DocumentCategory)=>void}){
 const cards=[
  {category:'analysis' as const,label:'Análisis de laboratorio',count:summary.analysisCount,date:summary.latestAnalysisDate,latest:'Último análisis',icon:ClipboardList,action:'Ver mis análisis'},
  {category:'study' as const,label:'Estudios médicos',count:summary.studyCount,date:summary.latestStudyDate,latest:'Último estudio',icon:FileHeart,action:'Ver mis estudios'},
 ];
 return cards.map(card=><article className={`metric-card history-summary ${card.category}`} key={card.category}>
  <div className="summary-heading"><span className="summary-icon"><card.icon size={26}/></span><h2>{card.label}</h2></div>
  <div className="summary-count"><strong>{card.count}</strong><span>{card.count===1?'documento guardado':'documentos guardados'}</span></div>
  <div className="summary-date"><span>{card.latest}</span><strong>{card.date?formatDate(card.date):'Sin fecha registrada'}</strong></div>
  <span className="summary-link">{card.action}<ArrowUpRight size={22}/></span>
  <button type="button" className="card-navigation" aria-label={card.action} onClick={()=>onOpen(card.category)}/>
 </article>);
}
