'use client';
import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { SessionRecord } from '../lib/domain/types';
import { formatDate, sessionEndDate, sessionPhase, sessionCoversDate, validateDate } from '../lib/domain/calendar';
import { useLocalToday } from '../lib/client/use-local-today';
import { apiFetch } from '../lib/client/api';
import { Modal } from './modal';
const labels={scheduled:'Programada','in-progress':'En proceso',completed:'Finalizada',cancelled:'Cancelada'};
export function ChemoCalendar({readOnly=false,sessions,onSaved}:{readOnly?:boolean;sessions:SessionRecord[];onSaved:(message:string)=>void}){
 const today=useLocalToday();
 const [month,setMonth]=useState(today.slice(0,7)),[selected,setSelected]=useState(today),[editing,setEditing]=useState<SessionRecord|null|false>(false);
 const [year,number]=month.split('-').map(Number);
 const first=new Date(Date.UTC(year,number-1,1,12)),offset=(first.getUTCDay()+6)%7,days=new Date(Date.UTC(year,number,0,12)).getUTCDate();
 const cells=Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>new Date(Date.UTC(year,number-1,1-offset+i,12)).toISOString().slice(0,10));
 const selectedSessions=sessions.filter(s=>sessionCoversDate(s,selected)).sort((a,b)=>a.number-b.number);
 const upcoming=sessions.filter(s=>sessionPhase(s,today)==='scheduled').sort((a,b)=>a.date.localeCompare(b.date)||a.number-b.number);
 const nextId=upcoming[0]?.id;
 const stateLabel=(s:SessionRecord)=>sessionPhase(s,today)==='scheduled'&&s.id===nextId?'Próxima quimio':labels[sessionPhase(s,today)];
 const history=[...sessions].sort((a,b)=>b.date.localeCompare(a.date)||b.number-a.number);
 const selectDay=(date:string)=>{setSelected(date);setMonth(date.slice(0,7));};
 const move=(direction:number)=>{const d=new Date(Date.UTC(year,number-1+direction,1,12));const nextMonth=d.toISOString().slice(0,7);setMonth(nextMonth);setSelected(nextMonth+'-01');};
 const longDate=(date:string)=>new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 const list=(items:SessionRecord[])=> <div className="session-list">{items.map(s=><article className="session-row" key={s.id}><div className="session-number">{s.number}</div><div className="session-info"><h3>Sesión {s.number}</h3><p>{formatDate(s.date)}{(s.durationDays??1)>1?` al ${formatDate(sessionEndDate(s))}`:''}{s.time?` · ${s.time}`:''}</p>{s.location&&<p className="small muted">{s.location}</p>}{s.notes&&<p className="small muted">{s.notes}</p>}</div><span className={`status-badge ${sessionPhase(s,today)}`}>{stateLabel(s)}</span><button disabled={readOnly} onClick={()=>{selectDay(s.date);setEditing(s);}}>Editar sesión</button></article>)}</div>;
 return <>
 <section className="panel calendar-panel">
  <div className="section-heading"><div><h2>Calendario de quimioterapias</h2><p className="muted">Elegí un día para consultar sus sesiones o anotar una fecha.</p></div><button disabled={readOnly} className="primary" onClick={()=>setEditing(null)}><Plus size={19}/>Agregar fecha</button></div>
  <div className="calendar-layout">
   <div className="calendar-picker">
    <div className="month-header"><button className="icon-button" aria-label="Mes anterior" onClick={()=>move(-1)}><ChevronLeft/></button><h3>{new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric',timeZone:'UTC'}).format(first)}</h3><button className="icon-button" aria-label="Mes siguiente" onClick={()=>move(1)}><ChevronRight/></button></div>
    <div className="calendar-grid" aria-label="Días del mes">{['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=><div className="day-label" key={d}>{d}</div>)}{cells.map(date=>{const daySessions=sessions.filter(s=>sessionCoversDate(s,date));const hasSession=daySessions.length>0;const phases=daySessions.map(s=>sessionPhase(s,today));const dayPhase=phases.includes('in-progress')?'in-progress':phases.includes('scheduled')?'scheduled':phases.includes('completed')?'completed':'cancelled';return <button key={date} className={`calendar-date ${date.slice(0,7)!==month?'outside-month':''} ${date===today?'today':''} ${date===selected?'selected':''} ${hasSession?'has-session session-'+dayPhase:''}`} aria-pressed={date===selected} aria-current={date===today?'date':undefined} aria-label={`${longDate(date)}${hasSession?`, ${daySessions.map(s=>`sesión ${s.number} ${stateLabel(s)}`).join(', ')}`:''}`} onClick={()=>selectDay(date)}>{Number(date.slice(-2))}{hasSession&&<span className="day-markers" aria-hidden="true">{[...new Set(phases)].map(phase=><span key={phase} className={`session-marker ${phase}`}/>)}</span>}</button>;})}</div>
    <div className="calendar-legend status-legend"><span><i className="legend-marker in-progress" aria-hidden="true"/>En proceso</span><span><i className="legend-marker scheduled" aria-hidden="true"/>Programada / próxima</span><span><i className="legend-marker completed" aria-hidden="true"/>Finalizada</span></div><p className="small muted calendar-auto-note">Los estados cambian solos según la fecha de inicio y los días de duración.</p>
    <button className="today-button" onClick={()=>selectDay(today)}>Ir a hoy</button>
   </div>
   <div className="selected-day" aria-live="polite"><h3>{longDate(selected)}</h3>{selectedSessions.length?selectedSessions.map(s=><article className="selected-session" key={s.id}><span className={`status-badge ${sessionPhase(s,today)}`}>{stateLabel(s)}</span><h3>Quimioterapia · Sesión {s.number}</h3><p>{formatDate(s.date)}{(s.durationDays??1)>1?` al ${formatDate(sessionEndDate(s))}`:''}{s.time?` · ${s.time}`:''}</p>{s.location&&<p>{s.location}</p>}{s.notes&&<p className="pre-wrap">{s.notes}</p>}<button disabled={readOnly} onClick={()=>setEditing(s)}>Editar sesión</button></article>):<div className="selected-day-empty"><CalendarDays size={32}/><p>No hay sesiones anotadas para este día.</p></div>}<button disabled={readOnly} className="primary-soft" onClick={()=>setEditing(null)}><Plus size={18}/>Anotar en este día</button></div>
  </div>
 </section>
 <section className="panel"><div className="section-heading"><h2>Próximas quimioterapias</h2><span className="count-pill">{upcoming.length} programadas</span></div>{upcoming.length?list(upcoming):<p className="empty-inline">Todavía no hay próximas sesiones programadas.</p>}</section>
 <section className="panel"><h2>Historial de sesiones</h2>{history.length?list(history):<div className="empty-state"><CalendarDays size={36}/><p>Todavía no hay sesiones registradas.</p><button disabled={readOnly} onClick={()=>setEditing(null)}>Agregar primera sesión</button></div>}</section>
 {!readOnly&&editing!==false&&<SessionEditor session={editing} initialDate={selected} nextNumber={Math.max(0,...sessions.map(s=>s.number))+1} onClose={()=>setEditing(false)} onSaved={message=>{setEditing(false);onSaved(message);}}/>}
 </>;
}
function SessionEditor({session,nextNumber,initialDate,onClose,onSaved}:{session:SessionRecord|null;nextNumber:number;initialDate:string;onClose:()=>void;onSaved:(m:string)=>void}){
 const [form,setForm]=useState({number:String(session?.number??nextNumber),date:session?.date??initialDate,durationDays:String(session?.durationDays??1),time:session?.time??'',location:session?.location??'',status:session?.status??'scheduled',notes:session?.notes??''}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();const fields=new FormData(event.currentTarget);const data={number:Number(fields.get('number'))||nextNumber,date:String(fields.get('date')),durationDays:Number(fields.get('durationDays'))||1,time:String(fields.get('time'))||null,location:String(fields.get('location'))||null,status:String(fields.get('status')),notes:String(fields.get('notes'))};
  if(!validateDate(data.date)){setError('Elegí una fecha de inicio válida.');return;}setBusy(true);setError('');
  try{await apiFetch(session?`/api/sessions/${session.id}`:'/api/sessions',{method:session?'PATCH':'POST',body:JSON.stringify(data)});onSaved(session?'Sesión actualizada.':'Sesión registrada.');}catch(e){setError(e instanceof Error?e.message:'No pudimos guardar.');}finally{setBusy(false);}
 }
 const end=validateDate(form.date)?sessionEndDate({date:form.date,durationDays:Math.max(1,Math.min(365,Number(form.durationDays)||1))} as SessionRecord):null;
 return <Modal title="Fecha de quimioterapia" onClose={()=>{if(!busy)onClose();}}><form className="review-content chemo-form" onSubmit={save}>
 <p className="muted">Elegí la fecha de inicio. Los demás datos son opcionales.</p>
 <label>Fecha de inicio <span className="field-required">Obligatoria</span><input name="date" type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
 <label>Número de sesión<input name="number" type="number" inputMode="numeric" min={1} max={10000} value={form.number} onChange={e=>setForm({...form,number:e.target.value})}/><span className="field-help">Si lo dejás vacío, usamos el siguiente número disponible.</span></label>
 <label>Duración en días<input name="durationDays" type="number" inputMode="numeric" min={1} max={365} value={form.durationDays} onChange={e=>setForm({...form,durationDays:e.target.value})}/><span className="field-help">Contamos el día de inicio como día 1.{end?` Finaliza el ${formatDate(end)}.`:''}</span></label>
 <label>Hora <span className="field-optional">Opcional</span><input name="time" type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label>
 <label>Lugar <span className="field-optional">Opcional</span><input name="location" placeholder="Clínica, hospital o consultorio" maxLength={300} value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label>
 <label>Estado<select name="status" value={form.status==='cancelled'?'cancelled':'scheduled'} onChange={e=>setForm({...form,status:e.target.value as SessionRecord['status']})}><option value="scheduled">Automático según las fechas</option><option value="cancelled">Cancelada</option></select><span className="field-help">La app muestra Programada, En proceso o Finalizada automáticamente. Elegí Cancelada si la sesión no se realizará.</span></label>
 <label>Notas <span className="field-optional">Opcional</span><textarea name="notes" rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
 <p className="small muted">Contamos todos los días de duración. El estado se actualiza también al volver a abrir la app.</p>
 {error&&<p className="error-message" role="alert">{error}</p>}<div className="modal-actions"><button type="button" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="primary" disabled={busy}>{busy?'Guardando…':session?'Guardar cambios':'Guardar fecha'}</button></div>
 </form></Modal>;
}
