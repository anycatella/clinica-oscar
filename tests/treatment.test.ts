import {describe,it,expect} from 'vitest';
import {sessionEndDate,sessionPhase,treatmentOverview} from '../lib/domain/calendar';
import {validateSession} from '../lib/server/validation';
import type {SessionRecord} from '../lib/domain/types';
const session=(extra:Partial<SessionRecord>={}):SessionRecord=>({id:'s',number:7,date:'2026-10-07',time:null,status:'scheduled',notes:'',updatedAt:'',durationDays:3,location:null,...extra});
describe('duration and treatment summary',()=>{
 it('includes the first day in duration and crosses month boundaries',()=>{expect(sessionEndDate(session())).toBe('2026-10-09');expect(sessionEndDate(session({date:'2026-12-31',durationDays:3}))).toBe('2027-01-02');});
 it('highlights a scheduled treatment within its duration without marking completion',()=>{expect(sessionPhase(session(),'2026-10-08')).toBe('in-progress');expect(sessionPhase(session(),'2026-10-10')).toBe('scheduled');});
 it('preserves explicit completion and cancellation',()=>{expect(sessionPhase(session({status:'completed'}),'2026-10-08')).toBe('completed');expect(sessionPhase(session({status:'cancelled'}),'2026-10-08')).toBe('cancelled');});
 it('summarizes completed, current and next sessions without counting cancelled ones',()=>{const r=treatmentOverview([session({id:'old',number:6,date:'2026-09-20',status:'completed'}),session(),session({id:'next',number:8,date:'2026-10-21'}),session({id:'cancel',number:9,date:'2026-10-10',status:'cancelled'})],'2026-10-08');expect(r.startedCount).toBe(2);expect(r.current[0].number).toBe(7);expect(r.latest?.number).toBe(6);expect(r.next?.number).toBe(8);});
 it('loads earlier sessions with a one-day duration',()=>{const legacy=session();delete legacy.durationDays;expect(sessionEndDate(legacy)).toBe('2026-10-07');expect(validateSession(legacy).durationDays).toBe(1);});
 it('rejects impossible durations',()=>expect(()=>validateSession({...session(),durationDays:0})).toThrow());
});
