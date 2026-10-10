import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const dir=new URL('../public/icons/',import.meta.url);
const svg=await readFile(new URL('clinica-oscar-v2.svg',dir));
for(const size of [192,512,180])await sharp(svg).resize(size,size).png().toFile(new URL(`clinica-oscar-v2-${size}.png`,dir).pathname);
await sharp(svg).resize(512,512).png().toFile(new URL('clinica-oscar-v2-maskable-512.png',dir).pathname);
const favicon=svg.toString().replace('width="512" height="512" fill=', 'width="512" height="512" rx="90" fill=');
await writeFile(new URL('../public/favicon.svg',import.meta.url),favicon);
