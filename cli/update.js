/**
 * ccs update：从 GitHub 拉取最新 skill 并同步到所有已安装目标。
 *
 * 流程：取远端 version.json -> 版本比较 -> 按清单逐个下载到内存
 * -> 全部成功后才覆写各目标目录 -> 更新本地配置。
 * 先下载后写入，保证中途断网不会留下半成品安装。
 */

"use strict";

const fs = require("fs");
const path = require("path");
const {
  TARGETS,
  targetDir,
  loadConfig,
  saveConfig,
  fetchRemoteVersionInfo,
  downloadSkillFile,
  compareVersions,
} = require("./common");

/** 把内存中的文件清单写到某个目标目录（先清空再写入，删除的文件不残留） */
function writeFilesTo(dir, files) {
  fs.rmSync(dir, { recursive: true, force: true });
  for (const relPath of Object.keys(files)) {
    const dest = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, files[relPath], "utf8");
  }
}

/** ccs update */
async function update() {
  const config = loadConfig();
  const installed = Object.keys(config.targets);
  if (installed.length === 0) {
    console.log("尚未安装任何目标，请先运行: ccs install codex|claude|all");
    return 1;
  }

  const remote = await fetchRemoteVersionInfo();
  const current = config.version || "unknown";
  const latest = remote.version || "unknown";

  console.log("code-comment-standard\n");
  console.log(`Current: ${current}`);
  console.log(`Latest:  ${latest}\n`);

  if (compareVersions(current, latest) >= 0) {
    console.log("✓ Already up to date");
    return 0;
  }

  const manifest = remote.files;
  if (!Array.isArray(manifest) || manifest.length === 0) {
    console.error("远端 version.json 缺少 files 清单，无法更新");
    console.error(`请检查 https://github.com/elaysia-feng/code-comment-standard 的 version.json`);
    return 1;
  }

  // 1. 按远端清单把所有文件先下载到内存，任何一个失败都不动磁盘
  console.log("Downloading...");
  const files = {};
  for (const relPath of manifest) {
    files[relPath] = await downloadSkillFile(latest, relPath);
  }
  console.log("✓ Download complete\n");

  // 2. 逐个目标覆写并记录版本
  console.log("Updating:");
  for (const name of installed) {
    writeFilesTo(targetDir(name), files);
    config.targets[name] = latest;
    console.log(`✓ ${TARGETS[name].label}`);
  }
  config.version = latest;
  saveConfig(config);

  console.log(`\nUpdated ${current} -> ${latest}`);
  return 0;
}

module.exports = { update };
