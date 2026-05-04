#!/usr/bin/env node
/**
 * @file 编译器命令行入口
 * @description 小程序编译器的 CLI 工具
 *
 * 使用方式：
 * $ miniapp-compile build [path]
 *
 * 功能说明：
 * 将小程序源码（wxml/wxss/js/json）编译成运行时产物：
 * - wxml → view.js    （Vue render 函数）
 * - wxss → style.css  （rpx→rem + scoped 样式）
 * - js   → logic.js   （AMD 风格模块）
 * - json → config.json（应用配置）
 */

const cmd = require('commander');
const version = require('../package.json').version;
const { build } = require('../src/commanders/build');

cmd.version(version).usage('[command] [options]');

// build 命令：编译小程序源码
cmd
  .command('build [path]')
  .description('编译小程序源码')
  .action((path) => {
    build(path);
  });

cmd.parse(process.argv);
