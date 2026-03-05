/**
 * Claude Code UI 增强脚本 v11
 * 功能: 滚轮缩放, 字体, 表格, LaTeX, 换行, 代码高亮, AI对话复制
 */

(function() {
  'use strict';

  console.log('[Claude Enhance] Loading...');

  // 注入样式
  function injectStyles() {
    const styleId = 'claude-enhance-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 代码块字体 */
      pre code, .hljs {
        font-family: 'JetBrains Mono NL', 'LXGW WenKai GB Screen R', 'Consolas', 'Monaco', 'Ubuntu Mono', 'Source Code Pro', 'Fira Code', 'DejaVu Sans Mono', 'Courier New', monospace !important;
      }

      /* KaTeX 样式 */
      .katex {
        font-size: 1.1em;
      }
      .katex-display {
        margin: 1em 0;
        overflow-x: auto;
      }

      /* 列表样式 - 修复数字被截断 */
      ol, ul {
        padding-left: 2em !important;
        list-style-position: outside !important;
      }
      ol {
        list-style-type: decimal !important;
      }

      /* 表格样式 - 暗色主题 */
      table {
        border-collapse: separate;
        border-spacing: 0;
        width: 100%;
        margin: 1em 0;
        font-size: 0.95em;
        color: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        border: 3px solid #707070;
      }
      table thead {
        background: linear-gradient(to bottom, #2d2d2d, #252525);
      }
      table th {
        padding: 10px 14px;
        text-align: left;
        font-weight: 600;
        border: 3px solid #707070;
        color: #ffffff;
      }
      table th:first-child {
        border-top-left-radius: 4px;
      }
      table th:last-child {
        border-top-right-radius: 4px;
      }
      table td {
        padding: 10px 14px;
        border: 3px solid #707070;
        border-top: none;
        border-left: none;
      }
      table td:last-child {
        border-right: none;
      }
      table tbody tr:last-child td:first-child {
        border-bottom-left-radius: 4px;
      }
      table tbody tr:last-child td:last-child {
        border-bottom-right-radius: 4px;
      }
      table tbody tr:nth-child(even) {
        background-color: rgba(255, 255, 255, 0.03);
      }
      table tbody tr:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }

      /* 代码块换行 */
      pre {
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        max-width: 100% !important;
      }
      pre code {
        white-space: pre-wrap !important;
        word-break: break-word !important;
      }

      /* AI 消息复制按钮样式 */
      .claude-copy-btn {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(60, 60, 60, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: #e0e0e0;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s, background 0.2s;
        z-index: 100;
      }
      .claude-copy-btn:hover {
        background: rgba(80, 80, 80, 0.95);
        color: #fff;
      }
      .claude-copy-btn.copied {
        background: rgba(74, 222, 128, 0.9);
        color: #000;
      }
      [class*="timelineMessage"]:hover .claude-copy-btn {
        opacity: 1;
      }
      [class*="timelineMessage"] {
        position: relative;
      }
    `;
    document.head.appendChild(style);
  }

  // 注入 Highlight.js
  function injectHighlightJS() {
    if (window.hljsLoaded) return;

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
    script.onload = () => {
      console.log('[Claude Enhance] Highlight.js loaded');
      window.hljsLoaded = true;
      highlightAllCode();
    };
    document.head.appendChild(script);
  }

  // 注入 KaTeX
  function injectKaTeX() {
    if (window.katexLoaded) return;

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
    script.onload = () => {
      // 等待 katex 挂载到 window
      const checkKatex = () => {
        if (typeof katex !== 'undefined') {
          window.katexLoaded = true;
          console.log('[Claude Enhance] KaTeX ready:', typeof katex);
        } else {
          console.log('[Claude Enhance] KaTeX not on window, retrying...');
          setTimeout(checkKatex, 100);
        }
      };
      checkKatex();
    };
    script.onerror = (e) => {
      console.error('[Claude Enhance] KaTeX load error:', e);
    };
    document.head.appendChild(script);
  }

  // 高亮代码块
  function highlightAllCode() {
    if (typeof hljs === 'undefined') return;

    document.querySelectorAll('pre code').forEach((block) => {
      if (block.classList.contains('language-latex')) return;
      if (!block.classList.contains('hljs')) {
        hljs.highlightElement(block);
      }
    });
  }

  // 尝试渲染单段 LaTeX 文本, 返回 { html, hasFormula }
  function renderLatexText(text) {
    let resultHTML = text;
    let hasFormula = false;

    // $$...$$ 块级公式
    resultHTML = resultHTML.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      hasFormula = true;
      try {
        let fixed = formula;
        fixed = fixed.replace(/\\\s*\n/g, '\\\\\n');
        fixed = fixed.replace(/\\ (?=[a-zA-Z0-9_{}])/g, '\\\\ ');
        fixed = fixed.replace(/\\\[(\d+(?:\.\d+)?[a-z]*)\]/gi, '\\\\[$1]');
        fixed = fixed.replace(/&\s*\\\[6pt\]/g, '& \\\\');
        fixed = fixed.replace(/\\(sum|prod|int|lim|inf|sup|max|min)\{([^}]+)\}/g, '\\$1_{$2}');
        fixed = fixed.replace(/\\operatorname\{(\w+)\}(\()/g, '\\operatorname{$1}$2');
        return katex.renderToString(fixed, { displayMode: true, throwOnError: false });
      } catch { return match; }
    });

    // \(...\) 行内公式
    resultHTML = resultHTML.replace(/\\\(([\s\S]+?)\\\)/g, (match, formula) => {
      hasFormula = true;
      try {
        return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
      } catch { return match; }
    });

    // \[...\] 块级公式
    resultHTML = resultHTML.replace(/\\\[([\s\S]+?)\\\]/g, (match, formula) => {
      hasFormula = true;
      try {
        return katex.renderToString(formula, { displayMode: true, throwOnError: false });
      } catch { return match; }
    });

    // $...$ 行内公式
    resultHTML = resultHTML.replace(/\$([\s\S]+?)\$/g, (match, formula) => {
      const cleaned = formula.trim().replace(/\s+/g, ' ').trim();
      if (!cleaned || /^\d+([.,]\d+)?$/.test(cleaned)) return match; // 跳过纯数字 (价格如 $5)
      hasFormula = true;
      try {
        let fixed = cleaned.replace(/\\ (?=[a-zA-Z0-9_{}])/g, '\\\\ ');
        return katex.renderToString(fixed, { displayMode: false, throwOnError: false });
      } catch { return match; }
    });

    return { html: resultHTML, hasFormula };
  }

  // 检测文本是否包含 LaTeX 特征
  const LATEX_CMD_RE = /\\(frac|sum|prod|int|pi|alpha|beta|gamma|delta|theta|lambda|mu|sigma|omega|mathbb|mathcal|text|left|right|begin|end|log|exp|max|min|operatorname|cdot|sim|lim|inf|sup|sqrt|vec|hat|bar|tilde|partial|nabla|forall|exists|in|notin|subset|cup|cap|times|leq|geq|neq|approx|equiv|quad)\b/;

  function looksLikeLatex(text) {
    if (!text) return false;
    return text.includes('$$') || text.includes('\\(') || text.includes('\\[') ||
      /\$[^$]+\$/.test(text) || LATEX_CMD_RE.test(text);
  }

  // 在段落级别渲染 LaTeX
  // 关键: markdown 渲染器会把 \pi_\theta 的 _ 解析为 <em>, 拆散公式到多个 DOM 节点
  // 所以必须在段落级别用 textContent 重组完整文本再渲染
  function renderLaTeX() {
    if (typeof katex === 'undefined') return;
    if (window._claudeRenderingLaTeX) return;
    window._claudeRenderingLaTeX = true;

    try {
      const root = document.getElementById('root') || document.body;
      const skip = (el) => el.closest('.katex') ||
        el.closest('[class*="sessionsList"]') ||
        el.closest('[class*="sessionItem"]');

      // 1. 段落级元素: 用 textContent 重组被 markdown 打散的公式
      root.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, td, th').forEach((el) => {
        if (skip(el)) return;
        if (el.dataset.katexDone) return;

        const text = el.textContent;
        if (!looksLikeLatex(text)) return;

        try {
          const { html, hasFormula } = renderLatexText(text);
          if (hasFormula && html.includes('katex')) {
            el.innerHTML = html;
            el.dataset.katexDone = '1';
          }
        } catch (e) {}
      });

      // 2. <code> 中的裸 LaTeX (不在 <pre> 内)
      Array.from(root.querySelectorAll('code:not(pre code)')).forEach((codeEl) => {
        if (skip(codeEl)) return;
        if (codeEl.dataset.katexDone) return;

        const text = codeEl.textContent;
        if (!looksLikeLatex(text)) return;

        try {
          let html, hasFormula;
          if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
            ({ html, hasFormula } = renderLatexText(text));
          } else {
            html = katex.renderToString(text, { displayMode: false, throwOnError: false });
            hasFormula = true;
          }
          if (hasFormula && html && html.includes('katex')) {
            const span = document.createElement('span');
            span.innerHTML = html;
            codeEl.replaceWith(span);
          } else {
            codeEl.dataset.katexDone = '1';
          }
        } catch (e) {
          codeEl.dataset.katexDone = '1';
        }
      });

      // 3. 独立 div/span 叶子容器 (有些公式不在 <p> 内)
      root.querySelectorAll('div, span').forEach((el) => {
        if (skip(el)) return;
        if (el.dataset.katexDone) return;
        if (el.querySelector('p, div, pre, table, ul, ol, h1, h2, h3, h4, h5, h6')) return;
        if (el.closest('[data-katex-done]')) return;

        const text = el.textContent;
        if (!looksLikeLatex(text)) return;

        try {
          const { html, hasFormula } = renderLatexText(text);
          if (hasFormula && html !== text && html.includes('katex')) {
            el.innerHTML = html;
            el.dataset.katexDone = '1';
          }
        } catch (e) {}
      });
    } finally {
      window._claudeRenderingLaTeX = false;
    }
  }

  // ========== AI 对话复制功能 ==========

  // 需要排除的类名前缀 (思维链和工具调用)
  const EXCLUDE_PREFIXES = [
    'thinking_',
    'thinkingContent_',
    'thinkingSummary_',
    'toolUse_',
    'toolResult_',
    'toolBody_',
    'toolBodyGrid_',
    'toolBodyRow_',
    'toolSummary_',
    'root_ZUQaOA',
    'userMessage_',
    'userMessageContainer_'
  ];

  // 检查元素是否应该被排除
  function shouldExclude(element) {
    if (!element || !element.className) return false;
    const className = typeof element.className === 'string' ? element.className : '';
    return EXCLUDE_PREFIXES.some(prefix => className.includes(prefix));
  }

  // 从 HTML 元素提取 Markdown 格式内容 (紧凑版)
  function htmlToMarkdown(element) {
    if (!element) return '';

    const IGNORE_TAGS = new Set(['BUTTON', 'STYLE', 'SCRIPT', 'SVG', 'MAT-ICON']);

    function traverse(node, context = {}) {
      // 文本节点
      if (node.nodeType === 3) {
        const text = node.textContent;
        if (context.inPre) return text;
        return text.replace(/\s+/g, ' ');
      }

      // 非元素节点跳过
      if (node.nodeType !== 1) return '';
      if (IGNORE_TAGS.has(node.tagName)) return '';
      if (shouldExclude(node)) return '';

      const tag = node.tagName;
      const children = Array.from(node.childNodes);
      const newContext = {
        ...context,
        inPre: context.inPre || tag === 'PRE',
        inList: context.inList || tag === 'LI',
      };

      // 先递归处理子节点
      const childrenContent = children
        .map(c => traverse(c, newContext))
        .join('');

      // KaTeX 公式处理
      if (tag === 'SPAN' && node.classList?.contains('katex')) {
        const annotation = node.querySelector('annotation[encoding="application/x-tex"]');
        if (annotation) {
          const tex = annotation.textContent;
          // 清理换行和多余空格, 保持单行 (Obsidian 兼容)
          const cleaned = tex.replace(/\s+/g, ' ').trim();
          const isDisplay = node.closest('.katex-display') !== null;
          return isDisplay ? `$$${cleaned}$$` : `$${cleaned}$`;
        }
      }

      // 根据标签类型返回格式化内容
      switch (tag) {
        case 'H1': return '\n# ' + childrenContent + '\n';
        case 'H2': return '\n## ' + childrenContent + '\n';
        case 'H3': return '\n### ' + childrenContent + '\n';
        case 'H4': return '\n#### ' + childrenContent + '\n';
        case 'H5': return '\n##### ' + childrenContent + '\n';
        case 'H6': return '\n###### ' + childrenContent + '\n';

        case 'P':
          return context.inList ? childrenContent : '\n' + childrenContent.trim() + '\n';

        case 'BR':
          return '\n';

        case 'STRONG':
        case 'B':
          return `**${childrenContent}**`;

        case 'EM':
        case 'I':
          return `*${childrenContent}*`;

        case 'CODE':
          if (context.inPre) return childrenContent;
          return `\`${childrenContent}\``;

        case 'PRE': {
          const codeEl = node.querySelector('code');
          const lang = codeEl?.className?.match(/language-(\w+)/)?.[1] || '';
          const content = codeEl ? codeEl.textContent : node.textContent;
          return `\`\`\`${lang}\n${content}\n\`\`\``;
        }

        case 'A': {
          const href = node.getAttribute('href') || '';
          return `[${childrenContent}](${href})`;
        }

        case 'UL': {
          const items = children
            .filter(c => c.tagName === 'LI')
            .map(li => {
              const nested = li.querySelector('ul, ol');
              if (nested) {
                const liContent = Array.from(li.childNodes)
                  .filter(c => c !== nested)
                  .map(c => traverse(c, newContext))
                  .join('').trim();
                const nestedMd = traverse(nested, newContext);
                return `- ${liContent}\n  ${nestedMd}`;
              }
              return `- ${traverse(li, newContext).trim()}`;
            })
            .join('\n');
          return '\n' + items + '\n';
        }

        case 'OL': {
          let idx = 1;
          const items = children
            .filter(c => c.tagName === 'LI')
            .map(li => {
              return `${idx++}. ${traverse(li, newContext).trim()}`;
            })
            .join('\n');
          return '\n' + items + '\n';
        }

        case 'LI':
          return childrenContent.trim();

        case 'TABLE': {
          const rows = node.querySelectorAll('tr');
          if (rows.length === 0) return '';
          let result = '';
          rows.forEach((row, rowIdx) => {
            const cells = row.querySelectorAll('th, td');
            const cellTexts = Array.from(cells).map(c =>
              traverse(c, newContext).trim().replace(/\|/g, '\\|')
            );
            result += `| ${cellTexts.join(' | ')} |\n`;
            if (rowIdx === 0) {
              result += `| ${cellTexts.map(() => '---').join(' | ')} |\n`;
            }
          });
          return '\n' + result.trim() + '\n';
        }

        case 'BLOCKQUOTE': {
          const quoteContent = childrenContent.trim();
          const quoteLines = quoteContent.split('\n');
          return '\n' + quoteLines.map(l => `> ${l}`).join('\n') + '\n';
        }

        case 'HR':
          return '\n\n---\n\n';

        case 'DIV':
        case 'SECTION':
        case 'ARTICLE':
        case 'SPAN':
        default:
          return childrenContent;
      }
    }

    // 执行转换并紧凑化换行
    return traverse(element)
      .replace(/\n{3,}/g, '\n\n')      // 3+ 个换行 → 最多1个空行
      .replace(/^\n+/, '')             // 移除开头换行
      .replace(/\n+$/, '')             // 移除末尾换行
      .replace(/[ \t]+$/gm, '')        // 移除行尾空格
      .trim();
  }

  // 按轮次分组消息
  function groupMessagesByTurn() {
    const container = document.querySelector('[class*="messagesContainer_"]');
    if (!container) return [];

    const turns = [];
    let currentTurn = [];

    for (const child of container.children) {
      const className = child.className || '';

      if (className.includes('userMessage')) {
        if (currentTurn.length > 0) {
          turns.push([...currentTurn]);
          currentTurn = [];
        }
      } else if (className.includes('timelineMessage')) {
        currentTurn.push(child);
      }
    }

    if (currentTurn.length > 0) {
      turns.push(currentTurn);
    }

    return turns;
  }

  // 为消息添加复制按钮
  function addCopyButton(messageEl) {
    if (messageEl.querySelector('.claude-copy-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'claude-copy-btn';
    btn.textContent = '复制';
    btn.title = '复制完整 Markdown 内容 (不含思维链和工具调用)';

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();

      // 获取整轮消息
      const turnMessages = messageEl._turnMessages || [messageEl];

      // 合并所有消息的 Markdown 内容
      const contents = turnMessages.map(msg => htmlToMarkdown(msg)).filter(c => c.trim());
      const finalContent = contents.join('\n\n');

      try {
        await navigator.clipboard.writeText(finalContent);
        btn.textContent = '已复制';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '复制';
          btn.classList.remove('copied');
        }, 1500);
      } catch (err) {
        console.error('[Claude Enhance] Copy failed:', err);
        btn.textContent = '失败';
        setTimeout(() => { btn.textContent = '复制'; }, 1500);
      }
    });

    messageEl.appendChild(btn);
  }

  // 扫描并添加复制按钮 (只在每轮末尾添加)
  function scanAndAddCopyButtons() {
    const turns = groupMessagesByTurn();

    turns.forEach(turnMessages => {
      if (turnMessages.length === 0) return;

      // 只在每轮最后一个消息上添加按钮
      const lastMessage = turnMessages[turnMessages.length - 1];

      // 存储整轮消息的引用
      lastMessage._turnMessages = turnMessages;

      addCopyButton(lastMessage);
    });
  }

  // ========== 滚轮缩放功能 ==========

  function setupZoom() {
    let zoom = parseFloat(localStorage.getItem('claude-zoom') || '1.0');
    document.body.style.zoom = zoom;

    document.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoom = Math.max(0.5, Math.min(2.0, zoom + delta));
        document.body.style.zoom = zoom;
        localStorage.setItem('claude-zoom', zoom.toString());
        showZoomIndicator(zoom);
      }
    }, { passive: false });
  }

  function showZoomIndicator(zoom) {
    let indicator = document.getElementById('zoom-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'zoom-indicator';
      indicator.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: rgba(40, 40, 40, 0.95); color: #fff;
        padding: 8px 16px; border-radius: 6px; font-size: 14px;
        z-index: 10000; transition: opacity 0.3s;
      `;
      document.body.appendChild(indicator);
    }
    indicator.textContent = `缩放: ${Math.round(zoom * 100)}%`;
    indicator.style.opacity = '1';
    setTimeout(() => { indicator.style.opacity = '0'; }, 1000);
  }

  // DOM 监听 - 纯防抖, 流式输出期间不渲染, 输出停止后统一渲染
  function setupObserver() {
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 1500; // 等 1.5s 无变化后再渲染

    const observer = new MutationObserver((mutations) => {
      let hasRealChange = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            const cls = node.className?.toString() || '';
            if (!cls.includes('hljs') && !cls.includes('katex') && !cls.includes('zoom-indicator') && !cls.includes('claude-copy-btn')) {
              hasRealChange = true;
              break;
            }
          }
        }
        if (hasRealChange) break;
      }

      if (!hasRealChange) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        highlightAllCode();
        renderLaTeX();
        scanAndAddCopyButtons();
      }, DEBOUNCE_DELAY);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // DOM 探测工具 - 按 Ctrl+Shift+D 导出 DOM 结构
  function setupDOMInspector() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+D 触发 DOM 导出
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        exportDOMStructure();
      }
    });
  }

  function exportDOMStructure() {
    console.log('[Claude Enhance] Exporting DOM structure...');

    const result = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      rootClasses: [],
      messageContainers: [],
      allClassNames: new Set(),
      potentialMessageSelectors: []
    };

    // 收集所有类名
    document.querySelectorAll('*').forEach(el => {
      if (el.className && typeof el.className === 'string') {
        el.className.split(/\s+/).forEach(cls => {
          if (cls) result.allClassNames.add(cls);
        });
      }
    });

    // 查找可能的消息容器 (基于常见模式)
    const messagePatterns = [
      '[class*="message"]', '[class*="Message"]',
      '[class*="chat"]', '[class*="Chat"]',
      '[class*="response"]', '[class*="Response"]',
      '[class*="assistant"]', '[class*="Assistant"]',
      '[class*="human"]', '[class*="Human"]',
      '[class*="user"]', '[class*="User"]',
      '[class*="turn"]', '[class*="Turn"]',
      '[class*="content"]', '[class*="Content"]',
      '[role="article"]', '[role="listitem"]',
      '[data-message]', '[data-turn]'
    ];

    messagePatterns.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          result.potentialMessageSelectors.push({
            selector,
            count: elements.length,
            sampleClasses: Array.from(elements).slice(0, 3).map(el => el.className)
          });
        }
      } catch (e) {}
    });

    // 分析 #root 下的结构
    const root = document.getElementById('root');
    if (root) {
      result.rootStructure = analyzeElement(root, 0, 4);
    }

    // 查找包含大量文本的容器
    const textContainers = [];
    document.querySelectorAll('div, section, article').forEach(el => {
      const text = el.innerText || '';
      if (text.length > 200 && text.length < 50000) {
        const children = el.children.length;
        if (children < 50) {
          textContainers.push({
            tag: el.tagName,
            className: el.className,
            textLength: text.length,
            childCount: children,
            preview: text.substring(0, 100) + '...'
          });
        }
      }
    });
    result.textContainers = textContainers.slice(0, 20);

    // 转换 Set 为数组
    result.allClassNames = Array.from(result.allClassNames).sort();

    // 复制到剪贴板
    const output = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(output).then(() => {
      showNotification('DOM 结构已复制到剪贴板! 请粘贴给 Claude 分析~');
      console.log('[Claude Enhance] DOM structure copied to clipboard');
    }).catch(err => {
      console.error('[Claude Enhance] Failed to copy:', err);
      // 降级: 打印到控制台
      console.log('[Claude Enhance] DOM Structure:\n', output);
      showNotification('复制失败, 请查看控制台 (F12)');
    });
  }

  function analyzeElement(el, depth, maxDepth) {
    if (depth > maxDepth) return { truncated: true };

    const info = {
      tag: el.tagName,
      className: el.className || null,
      id: el.id || null,
      childCount: el.children.length
    };

    // 检查特殊属性
    const attrs = ['role', 'data-message', 'data-turn', 'data-type', 'data-testid'];
    attrs.forEach(attr => {
      if (el.hasAttribute(attr)) {
        info[attr] = el.getAttribute(attr);
      }
    });

    // 递归分析子元素 (只分析前几个)
    if (el.children.length > 0 && depth < maxDepth) {
      info.children = Array.from(el.children)
        .slice(0, 5)
        .map(child => analyzeElement(child, depth + 1, maxDepth));
      if (el.children.length > 5) {
        info.moreChildren = el.children.length - 5;
      }
    }

    return info;
  }

  function showNotification(message) {
    let notification = document.getElementById('claude-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'claude-notification';
      notification.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(30, 30, 30, 0.95); color: #4ade80;
        padding: 16px 24px; border-radius: 8px; font-size: 14px;
        z-index: 10001; border: 1px solid #4ade80;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      `;
      document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.opacity = '1';
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => { notification.style.display = 'none'; }, 300);
    }, 2000);
  }

  // 初始化
  function init() {
    console.log('[Claude Enhance] Initializing...');
    injectStyles();
    injectHighlightJS();
    injectKaTeX();
    setupZoom();
    setupObserver();
    setupDOMInspector();
    highlightAllCode();
    renderLaTeX();
    scanAndAddCopyButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
