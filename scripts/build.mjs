import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import packageJson from '../package.json' with { type: 'json' };

const source = await readFile('src/ha3d-floor-plan-card.mjs', 'utf8');
const banner = `/* HA3D Floor Plan Card v${packageJson.version} | MIT License | https://github.com/ */\n`;
const output = banner + source.replaceAll('__HA3D_VERSION__', packageJson.version);
await mkdir(dirname('dist/ha3d-floor-plan-card.js'), { recursive: true });
await writeFile('dist/ha3d-floor-plan-card.js', output);
console.log(`Built dist/ha3d-floor-plan-card.js (${output.length.toLocaleString()} bytes)`);
