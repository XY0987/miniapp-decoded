#!/usr/bin/env node
/**
 * @file 一键启动脚本
 * @description 启动整个小程序模拟环境的便捷脚本
 *
 * 启动流程：
 * 1. 检查各子包是否已构建（public/ 目录是否存在）
 * 2. 如果未构建，自动执行 build
 * 3. 并行启动 4 个静态服务器
 * 4. 等待所有服务就绪
 * 5. 自动打开浏览器
 *
 * 服务端口：
 * - native:      3077  - 入口页面、pageframe、小程序资源
 * - logic_sdk:   3100  - 逻辑层 SDK（Worker 加载）
 * - ui_sdk:      3200  - 渲染层 SDK（iframe 加载）
 * - components:  3600  - Vue 运行时 + 组件库
 *
 * 使用方式：
 * $ pnpm start
 *
 * 注意：此脚本不支持热更新，如需热更新请另开终端运行 `pnpm dev`
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const waitOn = require('wait-on');
const open = require('open');

/** 项目根目录 */
const ROOT = path.resolve(__dirname, '..');

/**
 * 构建目标检测配置
 * name: 子包名称
 * probe: 检测文件路径（存在则认为已构建）
 */
const BUILD_TARGETS = [
  { name: 'components', probe: 'components/public/js/index.js' },
  { name: 'ui_sdk', probe: 'ui/public/core.js' },
  { name: 'logic_sdk', probe: 'logic/public/core.js' },
  { name: 'native', probe: 'native/public/index.html' },
];

/** 各服务的端口配置 */
const SERVE_PORTS = {
  native: 3077,
  ui_sdk: 3200,
  logic_sdk: 3100,
  components: 3600,
};

/**
 * 带颜色的日志输出
 */
function log(...args) {
  console.log('\x1b[36m[start]\x1b[0m', ...args);
}

/**
 * 执行 pnpm 命令
 * @param {string[]} args - 命令参数
 * @param {Object} opts - spawn 选项
 * @returns {Promise}
 */
function runPnpm(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...opts,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pnpm ${args.join(' ')} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

/**
 * 确保所有子包已构建
 * 检测产物是否存在，不存在则自动构建
 */
async function ensureBuilt() {
  // 先确保 Vue 副本存在
  const vuePath = path.join(ROOT, 'components/lib/vue.js');
  if (!fs.existsSync(vuePath)) {
    log('首次运行，拷贝 vue.js 到 components/lib/ ...');
    await runPnpm(['run', 'build:vendor']);
  }

  // 检查哪些包还没有构建产物
  const missing = BUILD_TARGETS.filter((t) => !fs.existsSync(path.join(ROOT, t.probe)));

  if (missing.length === 0) {
    log('产物已存在，跳过 build。如需强制重新构建：pnpm run clean && pnpm start');
    return;
  }

  log(`检测到以下包还没有构建产物，正在构建：${missing.map((m) => m.name).join(', ')}`);

  // 逐个构建缺失的包
  for (const t of missing) {
    log(`→ building ${t.name}`);
    await runPnpm(['--filter', t.name, 'run', 'build']);
  }
}

/**
 * 启动所有静态服务
 * @returns {ChildProcess} 子进程句柄
 */
function serveAll() {
  const child = spawn('pnpm', ['run', 'serve'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  // 主进程退出时一并带走 serve 子进程
  const shutdown = () => {
    if (!child.killed) child.kill('SIGTERM');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  child.on('exit', (code) => process.exit(code || 0));

  return child;
}

/**
 * 主函数
 */
async function main() {
  log('== miniapp-decoded: 小程序双线程架构 Web 模拟 ==');

  // 1. 确保所有子包已构建
  await ensureBuilt();

  // 2. 启动静态服务
  log('启动 4 个静态资源服务 ...');
  serveAll();

  // 3. 等待所有服务就绪
  const urls = [
    `http-get://127.0.0.1:${SERVE_PORTS.native}/native/index.html`,
    `http-get://127.0.0.1:${SERVE_PORTS.ui_sdk}/ui_sdk/core.js`,
    `http-get://127.0.0.1:${SERVE_PORTS.logic_sdk}/logic/core.js`,
    `http-get://127.0.0.1:${SERVE_PORTS.components}/components/js/index.js`,
  ];

  try {
    await waitOn({ resources: urls, timeout: 30000, interval: 300 });
  } catch (err) {
    log('等待服务就绪失败：', err.message);
    log('请手动确认端口 3077/3100/3200/3600 是否被占用。');
    return;
  }

  // 4. 打开浏览器
  const entry = `http://127.0.0.1:${SERVE_PORTS.native}/native/index.html`;
  log(`全部就绪，打开浏览器：${entry}`);
  try {
    await open(entry);
  } catch (_) {
    log(`自动打开失败，请手动访问：${entry}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
