import { CalendarDays, ChevronRight } from 'lucide-react';
import { formatDate, sessionEndDate, treatmentOverview } from '../lib/domain/calendar';
import type { SessionRecord } from '../lib/domain/types';
export function TreatmentSummary({sessions,today,onCalendar}:{sessions:SessionRecord[];today:string;onCalendar:()=>void}){
 const treatment=treatmentOverview(sessions,today);
 return <article className="metric-card treatment-card"><div className="treatment-heading"><h2>Quimioterapias</h2><CalendarDays size={26}/></div>
 {treatment.current.map(session=><div className="treatment-current" key={session.id}><span className="status-badge in-progress">En proceso</span><h3>Sesión {session.number}</h3><p><strong>{formatDate(session.date)}</strong>{(session.durationDays??1)>1?` al ${formatDate(sessionEndDate(session))}`:''}</p>{session.location&&<p>{session.location}</p>}<p className="small muted">{session.status==='scheduled'?'Según las fechas del calendario.':'Estado confirmado al registrar la sesión.'}</p></div>)}
 <div className="treatment-details"><p className="treatment-count"><strong>{treatment.startedCount}</strong><span>{treatment.startedCount===1?'sesión iniciada registrada':'sesiones iniciadas registradas'}</span></p><div className="treatment-last"><span>Última realizada</span><strong>{treatment.latest?formatDate(treatment.latest.date):'Sin sesiones realizadas registradas'}</strong>{treatment.latest&&<span>Sesión {treatment.latest.number}</span>}</div>
 <div className="treatment-next"><span>Próxima quimioterapia</span><strong>{treatment.next?formatDate(treatment.next.date):'Sin próxima fecha programada'}</strong>{treatment.next&&<span>Sesión {treatment.next.number} · Programada</span>}</div></div>
 <span className="summary-link">Ver calendario <ChevronRight size={18}/></span><button type="button" className="card-navigation" aria-label="Ver calendario de quimioterapia" onClick={onCalendar}/></article>;
}
