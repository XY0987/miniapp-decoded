#!/usr/bin/env node

const cmd = require('commander');
const version = require('../package.json').version;
const { build } = require('../src/commanders/build');

cmd
	.version(version)
	.usage('[command] [options]');

cmd
	.command('build [path]')
	.description('编译小程序源码')
	.action((path) => {
		build(path);
	});

cmd.parse(process.argv);