import { env } from 'cloudflare:workers';
import { SqlDataService } from './sql-data';
import { DocumentService } from './documents';
import type { FileStorageService } from '../services/contracts';
export function services(){const bindings=env as unknown as {DB:D1Database;BUCKET:R2Bucket;LINK_KEY_SHA256:string};if(!bindings.DB||!bindings.BUCKET)throw new Error('Shared storage unavailable');
 const data=new SqlDataService(bindings.DB);
 const files:FileStorageService={put:async(key,bytes,mime)=>{await bindings.BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});},get:async(key)=>{const object=await bindings.BUCKET.get(key);return object?new Uint8Array(await object.arrayBuffer()):null;},remove:async(key)=>{await bindings.BUCKET.delete(key);}};
 return {data,files,documents:new DocumentService(data,files),keyHash:bindings.LINK_KEY_SHA256};}
