export function resolveLinkKey(fragment:string,storedKey:string|null):string|null{
 const candidate=new URLSearchParams(fragment.replace(/^#/, '')).get('key');
 return candidate&&/^[a-f0-9]{64}$/.test(candidate)?candidate:storedKey&&/^[a-f0-9]{64}$/.test(storedKey)?storedKey:null;
}
export function buildShareLink(origin:string,key:string){return `${origin}/#key=${key}`;}
export function readLinkKey(){if(typeof window==='undefined')return null;try{return resolveLinkKey(window.location.hash,localStorage.getItem('co-link-v1'));}catch{return resolveLinkKey(window.location.hash,null);}}
