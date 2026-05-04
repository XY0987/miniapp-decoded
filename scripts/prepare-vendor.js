#!/usr/bin/env node
/**
 * 拷贝 Vue 2 运行时到 components/lib/vue.js。
 * pageframe 用 <script> 直接引入 vue.js（模拟小程序基础库里的 Exparser 运行时）。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'components/lib/vue.js');

const CANDIDATES = [
  'components/node_modules/vue/dist/vue.js',
  'node_modules/vue/dist/vue.js',
];

function main() {
  if (fs.existsSync(TARGET)) {
    console.log(`[vendor] ${TARGET} 已存在，跳过。`);
    return;
  }

  const source = CANDIDATES.map((p) => path.join(ROOT, p)).find(fs.existsSync);

  if (!source) {
    console.error(
      '[vendor] 未找到 vue.js 源文件。请先在 components 包内安装 vue@2：',
    );
    console.error('  pnpm --filter components add vue@2');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.copyFileSync(source, TARGET);
  console.log(`[vendor] copy ${source} -> ${TARGET}`);
}

main();
