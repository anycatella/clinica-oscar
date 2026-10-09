import type { DocumentRecord, SessionRecord } from '../domain/types';
export interface DataService{
 listDocuments():Promise<DocumentRecord[]>;
 findDocument(id:string):Promise<DocumentRecord|null>;
 findByHash(hash:string):Promise<{record:DocumentRecord;state:string}|null>;
 claimDocument(record:DocumentRecord):Promise<boolean>;
 activateDocument(id:string):Promise<void>;
 updateDocument(record:DocumentRecord,expectedVersion:number,hash?:string):Promise<boolean>;
 removeDocument(id:string,expectedVersion?:number):Promise<boolean>;
 listSessions():Promise<SessionRecord[]>;
 saveSession(record:SessionRecord,create:boolean):Promise<void>;
}
export interface FileStorageService{put(key:string,bytes:Uint8Array,mime:string):Promise<void>;get(key:string):Promise<Uint8Array|null>;remove(key:string):Promise<void>;}
