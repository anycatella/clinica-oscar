import {it,expect} from 'vitest';
import {parseReport} from '../lib/domain/parse-report';
it('classifies pathology reports from a laboratory as studies',()=>{expect(parseReport('Laboratorio Rodríguez\nESTUDIOS HISTOLOGICOS\nMaterial: BIOPSIA RECTO SIGMOIDE\nFecha: 14/05/26').categorySuggestion).toBe('study');});
it('recognizes imaging abbreviations and endoscopy',()=>{for(const text of ['TC de tórax','RM cerebro con contraste','Videocolonoscopía','Anatomía patológica','Informe histopatológico'])expect(parseReport(text).categorySuggestion).toBe('study');});
it('does not turn laboratory analysis into a study because of a clinical antecedent',()=>{expect(parseReport('Laboratorio Auad\nHemograma\nAntecedente: tomografía de tórax\nGlucosa 96 mg/dL 70 - 99').categorySuggestion).toBe('analysis');});
it('uses a meaningful filename when the document text has no type',()=>{expect(parseReport('Fecha: 14/05/26\nInforme médico','biopsia recto.pdf').categorySuggestion).toBe('study');expect(parseReport('Fecha: 14/05/26','Laboratorio auad.pdf').categorySuggestion).toBe('analysis');});
