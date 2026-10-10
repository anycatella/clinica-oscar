import {afterEach,describe,it,expect,vi} from 'vitest';
import {subscribeCalendarClock} from '../lib/client/calendar-clock';
import {localToday} from '../lib/domain/calendar';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
describe('calendar day refresh',()=>{
 it('updates the Tucuman date across midnight and cleans up when unmounted',()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-11T02:59:50Z'));
  const win=new EventTarget();const doc=new EventTarget();
  Object.assign(win,{setInterval,clearInterval});Object.assign(doc,{visibilityState:'visible'});
  vi.stubGlobal('window',win);vi.stubGlobal('document',doc);
  let day=localToday();const update=vi.fn(()=>{day=localToday();});const unsubscribe=subscribeCalendarClock(update);
  expect(day).toBe('2026-10-10');vi.advanceTimersByTime(30_000);expect(day).toBe('2026-10-11');
  win.dispatchEvent(new Event('focus'));doc.dispatchEvent(new Event('visibilitychange'));expect(update).toHaveBeenCalledTimes(3);
  unsubscribe();vi.advanceTimersByTime(60_000);win.dispatchEvent(new Event('focus'));doc.dispatchEvent(new Event('visibilitychange'));expect(update).toHaveBeenCalledTimes(3);
 });
});
