import type { MeasurementInput } from '../lib/domain/types';
import { referenceStatus } from '../lib/domain/comparisons';
const labels={normal:'Normal',low:'Bajo',high:'Alto',unknown:'Sin referencia numérica'};
export function MeasurementValue({row}:{row:MeasurementInput|null}){
 if(!row)return <span className="muted">Sin dato</span>;
 const status=referenceStatus(row);
 return <span className={`measurement-value ${status}`}><strong>{row.rawValue}</strong>{row.unit&&<span>{row.unit}</span>}<span className="value-status">{labels[status]}</span></span>;
}
