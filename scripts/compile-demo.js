#!/usr/bin/env node
/**
 * 把 native/apps/douyin-src/ 里的小程序"源码"用 compile 包编译一遍，
 * 产物直接覆盖 native/apps/douyin/{config.json, logic.js, view.js, style.css}
 * 作为 native 启动后要加载的运行时资源。
 *
 * 目的：演示博客里讲的"小程序编译链路"：
 *   wxml  → view.js     （Vue render 函数）
 *   wxss  → style.css   （加 scopeId + rpx→rem）
 *   js    → logic.js    （AMD 风格的 modDefine）
 *   app.json/*.json → config.json
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'native/apps/douyin-src');
const OUT_DIR = path.join(ROOT, 'native/apps/douyin');
const BIN = path.join(ROOT, 'compile/bin/index.js');

if (!fs.existsSync(SRC_DIR)) {
  console.log(
    `[compile-demo] ${SRC_DIR} 不存在，跳过。(demo 源码仅用于演示编译过程)`,
  );
  process.exit(0);
}

// compile 包的 env 是用 process.cwd() 来定位源码根的，所以要切过去
const child = spawn('node', [BIN, 'build'], {
  cwd: SRC_DIR,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error('[compile-demo] compile 包构建失败');
    process.exit(code);
  }

  // 把 dist/ 移到 OUT_DIR
  const distDir = path.join(SRC_DIR, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error(`[compile-demo] 期望的 ${distDir} 不存在`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(distDir)) {
    fs.copyFileSync(path.join(distDir, f), path.join(OUT_DIR, f));
  }
  console.log(`[compile-demo] 产物已同步到 ${OUT_DIR}`);
});
