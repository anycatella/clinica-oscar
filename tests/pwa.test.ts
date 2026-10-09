import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
it('never caches protected APIs or original files',()=>{
 const handlers:Record<string,(e:unknown)=>void>={};let responded=false;
 runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{self:{addEventListener:(n:string,fn:(e:unknown)=>void)=>handlers[n]=fn,location:{origin:'https://test'}},URL,caches:{},fetch:()=>{throw Error('Protected request must bypass worker');}});
 handlers.fetch({request:new Request('https://test/api/documents/abc/file',{headers:{Authorization:'Bearer secret'}}),respondWith:()=>{responded=true;}});expect(responded).toBe(false);
 handlers.fetch({request:new Request('https://test/api/records'),respondWith:()=>{responded=true;}});expect(responded).toBe(false);
});
