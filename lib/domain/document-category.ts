import type {DocumentCategory} from './types';
const clean=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const studyPattern=/tomograf|resonancia|ecograf|radiograf|endoscop|colonoscop|electrocard|doppler|biops|histolog|histopatolog|anatom[ií]a\s+patolog|inmunohisto|citolog|electroencefal|mamograf|densitometr|centellograf|\b(?:tc|tac|rm|rmn|pet)\b/i;
const labPattern=/\blaboratorio\b|\blab\b|hemograma|glucemia|glucosa|hemoglobina|hematocrito|creatinina|analisis|ionograma|hepatograma|coagulograma|sangre|orina|mg\s*\/\s*dl/i;
export function documentCategory(text:string,filename=''):DocumentCategory|null{
 const content=clean(text);const lines=content.split(/\n/).filter(line=>!/(?:antecedente|motivo|historia clinica|diagnostico previo|solicitado|se solicita|se sugiere)/.test(line));
 if(lines.some(line=>studyPattern.test(line)))return 'study';
 if(labPattern.test(content))return 'analysis';
 const name=clean(filename);if(studyPattern.test(name)||/recto.*sigmoide/.test(name))return 'study';if(labPattern.test(name))return 'analysis';return null;
}
