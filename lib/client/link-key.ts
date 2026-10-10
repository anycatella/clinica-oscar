let activeKey:string|null=null;
export function resolveLinkKey(fragment:string,storedKey:string|null):string|null{
 const candidate=new URLSearchParams(fragment.replace(/^#/, '')).get('key');
 return candidate&&/^[a-f0-9]{64}$/.test(candidate)?candidate:storedKey&&/^[a-f0-9]{64}$/.test(storedKey)?storedKey:null;
}
export function buildShareLink(origin:string,key:string){return `${origin}/#key=${key}`;}
export function parseSharedLink(value:string,origin:string):string|null{
 try{const url=new URL(value.trim());return url.origin===origin?resolveLinkKey(url.hash,null):null;}catch{return null;}
}
export function rememberLinkKey(key:string|null){
 activeKey=key;
 if(typeof window==='undefined')return;
 try{if(key)localStorage.setItem('co-link-v1',key);else localStorage.removeItem('co-link-v1');}catch{}
}
export function readLinkKey(){
 if(typeof window==='undefined')return null;
 let stored:string|null=null;try{stored=localStorage.getItem('co-link-v1');}catch{}
 const key=resolveLinkKey(window.location.hash,activeKey??stored);
 if(key)rememberLinkKey(key);
 return key;
}
