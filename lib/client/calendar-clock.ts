// Refresh at midnight and when returning to a tab or installed app.
export function subscribeCalendarClock(update:()=>void){
 const timer=window.setInterval(update,30_000);
 const visible=()=>{if(document.visibilityState==='visible')update();};
 window.addEventListener('focus',update);
 document.addEventListener('visibilitychange',visible);
 return ()=>{window.clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',visible);};
}
