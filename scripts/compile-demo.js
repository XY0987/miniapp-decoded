#!/usr/bin/env node
/**
 * @file 编译器演示脚本
 * @description 演示小程序编译流程的脚本
 *
 * 功能说明：
 * 将 native/apps/douyin-src/ 目录下的小程序"源码"
 * 使用 compile 包编译，产物输出到 native/apps/douyin/
 *
 * 编译链路演示：
 * 1. wxml  → view.js     （Vue render 函数）
 * 2. wxss  → style.css   （rpx→rem + scopeId）
 * 3. js    → logic.js    （AMD 风格的 modDefine）
 * 4. app.json + *.json → config.json
 *
 * 目录结构：
 * native/apps/
 * ├── douyin-src/        # 小程序源码（wxml/wxss/js/json）
 * │   ├── app.js
 * │   ├── app.json
 * │   ├── app.wxss
 * │   └── pages/
 * │       └── home/
 * │           ├── index.js
 * │           ├── index.wxml
 * │           └── index.wxss
 * └── douyin/            # 编译产物（供运行时加载）
 *     ├── config.json
 *     ├── logic.js
 *     ├── view.js
 *     └── style.css
 *
 * 使用方式：
 * $ pnpm compile:demo
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

/** 项目根目录 */
const ROOT = path.resolve(__dirname, '..');
/** 小程序源码目录 */
const SRC_DIR = path.join(ROOT, 'native/apps/douyin-src');
/** 编译产物输出目录 */
const OUT_DIR = path.join(ROOT, 'native/apps/douyin');
/** 编译器入口 */
const BIN = path.join(ROOT, 'compile/bin/index.js');

// 检查源码目录是否存在
if (!fs.existsSync(SRC_DIR)) {
  console.log(`[compile-demo] ${SRC_DIR} 不存在，跳过。(demo 源码仅用于演示编译过程)`);
  process.exit(0);
}

// 执行编译
// 注意：compile 包的 env 使用 process.cwd() 定位源码根目录
// 所以需要将 cwd 切换到 SRC_DIR
const child = spawn('node', [BIN, 'build'], {
  cwd: SRC_DIR,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error('[compile-demo] compile 包构建失败');
    process.exit(code);
  }

  // 编译成功，将 dist/ 目录内容复制到 OUT_DIR
  const distDir = path.join(SRC_DIR, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error(`[compile-demo] 期望的 ${distDir} 不存在`);
    process.exit(1);
  }

  // 确保输出目录存在
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 复制所有产物文件
  for (const f of fs.readdirSync(distDir)) {
    fs.copyFileSync(path.join(distDir, f), path.join(OUT_DIR, f));
  }

  console.log(`[compile-demo] 产物已同步到 ${OUT_DIR}`);
});
