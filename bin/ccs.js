#!/usr/bin/env node
/**
 * ccs —— code-comment-standard skill 的安装与更新管理器。
 *
 * Skill 规则内容走 GitHub 更新（ccs check / update），
 * CLI 本体走 npm 更新（npm update -g code-comment-standard）。
 */

"use strict";

const pkg = require("../package.json");
const { localVersionInfo, loadConfig } = require("../cli/common");
const { install, uninstall } = require("../cli/install");
const { check, status } = require("../cli/check");
const { update } = require("../cli/update");

/** 使用帮助 */
const HELP = `ccs ${pkg.version} —— 代码注释规范 skill 管理器

用法:
  ccs install [codex|claude|all]   安装 skill 到目标（缺省 all）
  ccs uninstall [codex|claude|all] 卸载目标上的 skill
  ccs check                        对比本地与 GitHub 最新版本
  ccs update                       下载最新 skill 并同步到已安装目标
  ccs status                       查看各目标安装状态与版本
  ccs version                      查看 CLI 与已装 skill 版本
  ccs help                         显示本帮助

安装位置:
  codex  -> ~/.agents/skills/code-comment-standard
  claude -> ~/.claude/skills/code-comment-standard

配置文件:
  ~/.code-comment-standard/config.json

仓库:
  https://github.com/elaysia-feng/code-comment-standard
`;

/** ccs version：CLI 版本 + 已安装 skill 版本 */
async function version() {
  const config = loadConfig();
  const local = (localVersionInfo() || {}).version || "unknown";
  console.log(`ccs CLI:        ${pkg.version}`);
  console.log(`本地 skill 包:  ${local}`);
  console.log(`已安装版本:     ${config.version || "未安装"}`);
  return 0;
}

/** 主入口：解析子命令并分发，未知命令给出帮助 */
async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  try {
    switch (cmd) {
      case "install":
        await install(rest[0]);
        return 0;
      case "uninstall":
        await uninstall(rest[0]);
        return 0;
      case "check":
        return await check();
      case "update":
        return await update();
      case "status":
        return await status();
      case "version":
        return await version();
      case "help":
      case "--help":
      case "-h":
      case undefined:
        console.log(HELP);
        return 0;
      default:
        console.error(`未知命令: ${cmd}\n`);
        console.log(HELP);
        return 1;
    }
  } catch (err) {
    console.error(`✗ ${err.message}`);
    return 1;
  }
}

// CJS 不支持顶层 await，用 Promise 链把返回码写回退出码
main().then((code) => {
  process.exitCode = code;
});
