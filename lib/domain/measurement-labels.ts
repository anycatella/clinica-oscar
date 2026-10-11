export function canonicalUnit(unit:string|null):string|null{
 if(!unit?.trim())return null;
 const compact=unit.replace(/\s+/g,'');
 if(/^\/mm(?:3|³|\^3|[?:])$/i.test(compact))return '/mm³';
 if(/^fl$/i.test(compact))return 'fL';
 return compact;
}

export function isReferenceLabel(name:string):boolean{
 const plain=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 return plain==='suficiente'||plain==='limite de seguridad superior';
}
