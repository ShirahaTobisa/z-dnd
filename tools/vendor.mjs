// 把前端依赖复制到 assets/vendor，网页直接引用本地文件，不依赖外部 CDN。
// 升级 package.json 里的依赖版本后运行：pnpm vendor
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendorRoot = path.join(projectRoot, 'assets', 'vendor');

const vendorFiles = new Map([
    ['node_modules/vue/dist/vue.global.prod.js', 'vue.global.prod.js'],
    ['node_modules/marked/lib/marked.umd.js', 'marked.umd.js'],
    ['node_modules/dompurify/dist/purify.min.js', 'purify.min.js'],
    ['node_modules/mammoth/mammoth.browser.min.js', 'mammoth.browser.min.js'],
    ['node_modules/file-saver/dist/FileSaver.min.js', 'FileSaver.min.js'],
    ['node_modules/html-docx-js/dist/html-docx.js', 'html-docx.js'],
    ['node_modules/localforage/dist/localforage.min.js', 'localforage.min.js'],
    ['node_modules/daisyui/dist/full.css', 'daisyui.full.css'],
    // pdf.js 只在导入 PDF 时按需加载；改成 .js 后缀，免得服务器不认 .mjs
    ['node_modules/pdfjs-dist/build/pdf.min.mjs', 'pdf.min.js'],
    ['node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'pdf.worker.min.js'],
]);

await mkdir(vendorRoot, { recursive: true });
for (const [source, target] of vendorFiles) {
    await copyFile(path.join(projectRoot, source), path.join(vendorRoot, target));
}
console.log(`Vendor files copied to ${vendorRoot}`);
