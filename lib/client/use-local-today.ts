'use client';
import { useSyncExternalStore } from 'react';
import { localToday } from '../domain/calendar';
import { subscribeCalendarClock } from './calendar-clock';
export function useLocalToday(){return useSyncExternalStore(subscribeCalendarClock,localToday,localToday);}
