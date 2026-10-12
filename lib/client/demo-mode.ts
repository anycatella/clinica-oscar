export function isDemoPath(pathname:string){return pathname==='/demo'||pathname==='/demo/';}
export function apiTarget(path:string,pathname:string){return isDemoPath(pathname)&&path.startsWith('/api/')?'/api/demo/'+path.slice(5):path;}
