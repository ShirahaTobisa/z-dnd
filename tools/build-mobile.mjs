import { cp, copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, 'www');

if (path.dirname(outputRoot) !== projectRoot || path.basename(outputRoot) !== 'www') {
    throw new Error(`Refusing to clear unexpected mobile output path: ${outputRoot}`);
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

// 前端依赖已在 assets/vendor 中（见 tools/vendor.mjs），页面直接引用本地文件
for (const directory of ['assets', 'dl', 'Library', 'Workshop']) {
    await cp(path.join(projectRoot, directory), path.join(outputRoot, directory), { recursive: true });
}

for (const file of ['index.html', '404.html', 'favicon.svg', 'manifest.json']) {
    await copyFile(path.join(projectRoot, file), path.join(outputRoot, file));
}

console.log(`Mobile web bundle created at ${outputRoot}`);
