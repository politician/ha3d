import { mkdir, copyFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await copyFile('src/ha3d-floorplan-card.js', 'dist/ha3d-floorplan-card.js');
await copyFile('src/plan-utils.js', 'dist/plan-utils.js');
console.log('Built dist/ha3d-floorplan-card.js');
