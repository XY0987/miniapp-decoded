#!/usr/bin/env node
/**
 * 一键启动：
 *   1. 检查各子包是否已经 build 过（public/ 目录在不在），不在就跑一次 build
 *   2. 并行启动 4 个静态服务（native / ui / logic / components）
 *   3. 等 native 端口就绪，打开浏览器
 *
 * 不做热更新（想要热更新请额外开终端跑 `pnpm dev`）。
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const waitOn = require('wait-on');
const open = require('open');

const ROOT = path.resolve(__dirname, '..');

const BUILD_TARGETS = [
  { name: 'components', probe: 'components/public/js/index.js' },
  { name: 'ui_sdk', probe: 'ui/public/core.js' },
  { name: 'logic_sdk', probe: 'logic/public/core.js' },
  { name: 'native', probe: 'native/public/index.html' },
];

const SERVE_PORTS = {
  native: 3077,
  ui_sdk: 3200,
  logic_sdk: 3100,
  components: 3600,
};

function log(...args) {
  console.log('\x1b[36m[start]\x1b[0m', ...args);
}

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

async function ensureBuilt() {
  // 先保证 vendor（Vue 副本）在位
  const vuePath = path.join(ROOT, 'components/lib/vue.js');
  if (!fs.existsSync(vuePath)) {
    log('首次运行，拷贝 vue.js 到 components/lib/ ...');
    await runPnpm(['run', 'build:vendor']);
  }

  const missing = BUILD_TARGETS.filter(
    (t) => !fs.existsSync(path.join(ROOT, t.probe)),
  );

  if (missing.length === 0) {
    log('产物已存在，跳过 build。如需强制重新构建：pnpm run clean && pnpm start');
    return;
  }

  log(
    `检测到以下包还没有构建产物，正在构建：${missing.map((m) => m.name).join(', ')}`,
  );

  for (const t of missing) {
    log(`→ building ${t.name}`);
    await runPnpm(['--filter', t.name, 'run', 'build']);
  }
}

function serveAll() {
  const child = spawn('pnpm', ['run', 'serve'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  // 关键：主进程退出时一并带走 serve 子进程
  const shutdown = () => {
    if (!child.killed) child.kill('SIGTERM');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  child.on('exit', (code) => process.exit(code || 0));
  return child;
}

async function main() {
  log('== miniapp-decoded: 小程序双线程架构 Web 模拟 ==');
  await ensureBuilt();

  log('启动 4 个静态资源服务 ...');
  serveAll();

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
