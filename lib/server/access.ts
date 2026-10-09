export async function sha256(bytes:Uint8Array|string){
 const data=typeof bytes==='string'?new TextEncoder().encode(bytes):bytes;
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data as BufferSource)),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function authorize(request:Request,keyHash:string):Promise<boolean>{
 const match=/^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('Authorization')??'');
 if(!match||!keyHash||!/^[a-f0-9]{64}$/.test(keyHash))return false;
 const actual=await sha256(match[1]);let difference=0;
 for(let i=0;i<64;i++)difference|=actual.charCodeAt(i)^keyHash.charCodeAt(i);
 return difference===0;
}
