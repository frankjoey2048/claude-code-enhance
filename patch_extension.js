#!/usr/bin/env node
/**
 * Claude Code 扩展补丁脚本 v8
 * 支持 VSCode / Cursor / VSCode Insiders
 */

const fs = require('fs');
const path = require('path');

// 自动检测扩展目录
function findExtensionDir() {
  const home = process.env.USERPROFILE || process.env.HOME;
  const candidates = ['.vscode/extensions', '.cursor/extensions', '.vscode-insiders/extensions'];

  for (const rel of candidates) {
    const extBase = path.join(home, rel);
    if (!fs.existsSync(extBase)) continue;
    const dirs = fs.readdirSync(extBase).filter(d => d.startsWith('anthropic.claude-code-'));
    if (dirs.length > 0) {
      const latest = dirs.sort().pop();
      console.log(`[Patch] Found in ${rel}`);
      return path.join(extBase, latest);
    }
  }

  console.error('[Patch] Claude Code extension not found in any editor');
  process.exit(1);
}

const extDir = findExtensionDir();
const extensionJs = path.join(extDir, 'extension.js');
const enhanceJs = path.join(__dirname, 'webview', 'enhance.js');

console.log('[Patch] Extension dir:', extDir);
console.log('[Patch] Applying patch v7...');

// 复制 enhance.js
const targetEnhance = path.join(extDir, 'webview', 'enhance.js');
fs.copyFileSync(enhanceJs, targetEnhance);
console.log('[Patch] Copied enhance.js');

// 读取 extension.js
let content = fs.readFileSync(extensionJs, 'utf8');
let modified = false;

// ========== 修改 1: style-src 添加 CDN ==========
if (!content.includes("style-src") || content.includes("style-src") && !content.match(/style-src[^`]*cdnjs/)) {
  const stylePattern = /(\w)=`style-src \$\{(\w)\.cspSource\} 'unsafe-inline'`/;
  const styleMatch = content.match(stylePattern);
  if (styleMatch) {
    const [full, varName, objName] = styleMatch;
    const replacement = `${varName}=\`style-src \${${objName}.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com\``;
    content = content.replace(full, replacement);
    modified = true;
    console.log('[Patch] Updated style-src CSP');
  }
} else {
  console.log('[Patch] style-src: already patched');
}

// ========== 修改 2: script-src 添加 CDN ==========
if (!content.match(/script-src 'nonce-\$\{[^}]+\}' https:\/\/cdnjs/)) {
  content = content.replace(
    /script-src 'nonce-\$\{(\w)\}'/g,
    "script-src 'nonce-${$1}' https://cdnjs.cloudflare.com"
  );
  modified = true;
  console.log('[Patch] Updated script-src CSP');
} else {
  console.log('[Patch] script-src: already patched');
}

// ========== 修改 3: font-src 添加 CDN + data: ==========
const fontPattern = /(\w)=`font-src \$\{(\w)\.cspSource\}`/;
const fontMatch = content.match(fontPattern);
if (fontMatch) {
  const [full, varName, objName] = fontMatch;
  const replacement = `${varName}=\`font-src \${${objName}.cspSource} https://cdnjs.cloudflare.com data:\``;
  content = content.replace(full, replacement);
  modified = true;
  console.log('[Patch] Updated font-src CSP');
} else {
  console.log('[Patch] font-src: already patched or not found');
}

// ========== 修改 4: 注入 enhance.js ==========
if (!content.includes('enhance.js')) {
  // 找到 script 标签模式
  const scriptMatch = content.match(/nonce="\$\{(\w)\}" src="\$\{(\w)\}" type="module"><\/script>/);
  if (scriptMatch) {
    const [full, nonceVar, srcVar] = scriptMatch;
    const replacement = `nonce="\${${nonceVar}}" src="\${${srcVar}}" type="module"></script><script nonce="\${${nonceVar}}" src="\${z.asWebviewUri(F0.Uri.joinPath(this.extensionUri,"webview","enhance.js"))}"></script>`;
    content = content.replace(full, replacement);
    modified = true;
    console.log('[Patch] Injected enhance.js');
  }
} else {
  console.log('[Patch] enhance.js: already injected');
}

// 修改 5: 修复 diff 视图铺满窗口问题 - 在侧边栏打开
// 查找 let v={preview:!1} 模式并添加 viewColumn:Beside
content = content.replace(
  /let v=\{preview:!1\}/g,
  'let v={preview:!1,viewColumn:tr.ViewColumn.Beside}'
);

// 同时修改另一个可能的变量名 N
content = content.replace(
  /let N=\{preview:!1,preserveFocus:!0\}/g,
  'let N={preview:!1,preserveFocus:!0,viewColumn:Gt.ViewColumn.Beside}'
);

// 写回文件
if (modified) {
  fs.writeFileSync(extensionJs, content, 'utf8');
  console.log('[Patch] Done! Please reload VSCode window.');
} else {
  console.log('[Patch] No changes made.');
}
