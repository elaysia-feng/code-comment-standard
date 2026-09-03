/**
 * ccs install / uninstall：把随 CLI 发布的 skill/ 安装到各目标目录。
 *
 * 安装即"整目录覆盖"：先清空旧目录再复制，保证远端删除过的文件不会残留。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const {
  TARGETS,
  targetDir,
  loadConfig,
  saveConfig,
  localSkillDir,
  localVersionInfo,
  resolveTargets,
} = require("./common");

/** 把 skill/ 复制到指定目标目录，并写入本地配置 */
function installTo(name) {
  const dir = targetDir(name);
  // 1. 清掉旧安装，避免上一版残留文件混进新目录
  fs.rmSync(dir, { recursive: true, force: true });
  // 2. 整目录复制（npm 包与 git clone 布局一致，都在包根的 skill/ 下）
  fs.cpSync(localSkillDir(), dir, { recursive: true });
  return dir;
}

/** ccs install [codex|claude|all] */
async function install(arg) {
  const names = resolveTargets(arg);
  const version = (localVersionInfo() || {}).version || "unknown";
  const config = loadConfig();

  console.log(`code-comment-standard ${version}\n`);
  for (const name of names) {
    const dir = installTo(name);
    config.targets[name] = version;
    console.log(`✓ ${TARGETS[name].label} 已安装 -> ${dir}`);
  }
  config.version = version;
  saveConfig(config);
}

/** ccs uninstall [codex|claude|all] */
async function uninstall(arg) {
  const names = resolveTargets(arg);
  const config = loadConfig();

  for (const name of names) {
    const dir = targetDir(name);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      delete config.targets[name];
      console.log(`✓ ${TARGETS[name].label} 已卸载 (${dir})`);
    } else {
      console.log(`- ${TARGETS[name].label} 本来就没有安装`);
    }
  }
  // targets 清空时同步清掉顶层版本号，避免 status 误显示"已安装"
  if (Object.keys(config.targets).length === 0) {
    config.version = null;
  }
  saveConfig(config);
}

module.exports = { install, uninstall };
