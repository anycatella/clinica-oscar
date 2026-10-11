// Explicit formatting equivalences only. Unknown/OCR tokens are never repaired here.
const units=['%','fL','pg','g/L','g/dL','mg/L','mg/dL','mg/mL','ng/mL','ng/L','µg/L','µg/dL','µg/mL','mmol/L','mol/L','µmol/L','mEq/L','U/L','U/mL','IU/L','IU/mL','UI/L','UI/mL','mUI/L','mIU/L','/mm³','/µL','mm','cm','m','mmHg','s','min','h','kg','g','mg','mL','L'];
function formatToken(unit:string){return unit.normalize('NFKC').replace(/[μµ]/g,'µ').replace(/[／⁄∕]/g,'/').replace(/\s+/g,'').replace(/\^3/g,'3');}
const dictionary=new Map(units.map(unit=>[formatToken(unit).toLowerCase(),unit]));
dictionary.set('/ul','/µL');dictionary.set('ul','µL');
export function canonicalUnit(unit:string|null):string|null{if(!unit?.trim())return null;return dictionary.get(formatToken(unit).toLowerCase())??null;}
export function isReferenceLabel(name:string):boolean{
 const plain=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 return plain==='suficiente'||plain==='limite de seguridad superior';
}
