# Claude Code Enhance

初始代码来自 https://github.com/Sophomoresty/claude-code-enhance

为 Claude Code 扩展添加代码高亮, LaTeX 公式渲染, UI 优化, AI 对话复制等功能.

## 功能特性

- **代码语法高亮** - Highlight.js, 支持 180+ 种语言
- **LaTeX 公式渲染** - KaTeX, 段落级渲染, 支持被 markdown 打散的公式
- **AI 对话复制** - 一键复制 AI 回复内容 (不含思维链和工具调用)
- **DOM 探测工具** - Ctrl+Shift+D 导出 DOM 结构用于分析
- **表格暗色主题** - 渐变表头, 悬停高亮, 圆角边框
- **代码自动换行** - 长命令行自动换行显示
- **滚轮缩放** - Ctrl/Cmd + 滚轮缩放界面 (50%-200%)
- **列表样式修复** - 有序列表数字正常显示

## 兼容版本

- Claude Code Extension: **2.1.x** (已测试 2.1.31 / 2.1.69)
- 平台: macOS (darwin-arm64), Windows (win32-x64), Linux (linux-x64)
- 编辑器: VSCode, Cursor, VSCode Insiders

## 安装

### 方式一: 补丁脚本 (推荐)

```bash
cd claude-code-enhance
node patch_extension.js
```

脚本会自动:
1. 查找已安装的 Claude Code 扩展 (依次搜索 `.vscode`, `.cursor`, `.vscode-insiders`)
2. 复制 enhance.js 到扩展目录
3. 修改 CSP 策略允许加载 CDN 资源
4. 注入增强脚本

> **注意**: 补丁脚本中的变量名是基于特定版本的混淆代码, 扩展大版本更新后可能需要手动调整注入代码中的变量名 (参考 `getHtmlForWebview` 函数签名).

### 方式二: 手动安装

1. 找到扩展目录:
   - macOS VSCode: `~/.vscode/extensions/anthropic.claude-code-*/`
   - macOS Cursor: `~/.cursor/extensions/anthropic.claude-code-*/`
   - Windows: `%USERPROFILE%\.vscode\extensions\anthropic.claude-code-*\`
2. 复制 `webview/enhance.js` 到扩展的 `webview/` 目录
3. 修改 `extension.js` 中的 CSP 策略 (添加 cdnjs.cloudflare.com)
4. 在 HTML 模板中注入 enhance.js 脚本标签

## 安装后

重载编辑器窗口: `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux) → `Developer: Reload Window`

## 使用说明

### AI 对话复制

- 鼠标悬停在 AI 回复末尾, 右下角会出现「复制」按钮
- 点击复制按钮, AI 回复内容以 Markdown 格式复制到剪贴板
- **自动排除**: 思维链 (Thinking) 和工具调用内容
- **保留格式**: 代码块, 表格, LaTeX 公式, 列表等

### DOM 探测工具

- 按 `Ctrl+Shift+D` 导出当前页面的 DOM 结构
- 自动分析消息容器, 类名, 文本内容等
- 用于开发调试和 DOM 结构分析

### 滚轮缩放

- `Ctrl/Cmd + 滚轮上` - 放大
- `Ctrl/Cmd + 滚轮下` - 缩小
- 缩放范围: 50% - 200%
- 缩放比例自动保存

### LaTeX 公式

| 语法 | 类型 | 示例 |
|------|------|------|
| `$$...$$` | 块级公式 | `$$\sum_{i=1}^n i$$` |
| `$...$` | 行内公式 | `$x^2 + y^2$` |
| `\[...\]` | 块级公式 | `\[\int_0^1 x dx\]` |
| `\(...\)` | 行内公式 | `\(e^{i\pi} + 1 = 0\)` |
| 裸 LaTeX | 行内 (code 内) | `\pi_\theta(y|x)` |

渲染采用段落级处理: 先用 `textContent` 重组被 markdown 渲染器打散的公式 (如 `_` 被解析为斜体), 再统一渲染.

## 更新增强脚本

修改 `webview/enhance.js` 后, 需要重新运行补丁脚本将文件复制到扩展目录:

```bash
node patch_extension.js
```

然后重载编辑器窗口: `Cmd+Shift+P` → `Developer: Reload Window`

> **注意**: 补丁脚本会检测已有补丁并跳过重复操作, 但每次都会重新复制 `enhance.js`.
> 如果输出 "No changes made", 说明 `extension.js` 无需修改, 但 `enhance.js` 已更新到位.

## 扩展更新后

Claude Code 扩展更新会覆盖补丁, 重新运行即可:

```bash
node patch_extension.js
```

## 项目结构

```
claude-code-enhance/
├── patch_extension.js  # 补丁脚本 (支持 VSCode/Cursor/Insiders)
├── webview/
│   └── enhance.js      # 增强脚本 (核心)
└── README.md
```

## 技术细节

### CSP 修改

补丁脚本修改以下 CSP 策略:

- `style-src`: 添加 `https://cdnjs.cloudflare.com`
- `script-src`: 添加 `https://cdnjs.cloudflare.com`
- `font-src`: 添加 `https://cdnjs.cloudflare.com data:`

### 外部依赖

- [Highlight.js](https://highlightjs.org/) 11.9.0 (vs2015 主题)
- [KaTeX](https://katex.org/) 0.16.9

## License

MIT
# claude-code-enhance
# claude-code-enhance
