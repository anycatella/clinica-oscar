type TextItem={str:string;transform?:number[];hasEOL?:boolean};
export function pdfPageText(items:unknown[]):string{
 const text=items.filter((item):item is TextItem=>typeof item==='object'&&item!==null&&'str' in item&&typeof item.str==='string');
 if(text.some(item=>!item.transform))return text.map(item=>item.str+(item.hasEOL?'\n':' ')).join('');
 const rows:{y:number;items:TextItem[]}[]=[];
 for(const item of text){if(!item.str.trim())continue;const y=item.transform![5];let row=rows.find(row=>Math.abs(row.y-y)<3);if(!row){row={y,items:[]};rows.push(row);}row.items.push(item);}
 return rows.sort((a,b)=>b.y-a.y).map(row=>row.items.sort((a,b)=>a.transform![4]-b.transform![4]).map(item=>item.str).join('\t')).join('\n');
}
