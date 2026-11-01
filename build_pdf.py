#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Money-Buibui — PDF 報告與簡報產生器
將 docs/*.md 文件轉換為精美排版的 A4 PDF 檔案
依賴：Google Chrome Headless
"""

import os
import re
import subprocess
import html

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(BASE_DIR, 'docs')
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def parse_markdown_to_html(md_text):
    """將 Markdown 文字轉換為簡潔美觀的 HTML 片段"""
    lines = md_text.splitlines()
    html_lines = []
    in_code_block = False
    code_lang = ""
    code_lines = []
    in_table = False
    table_lines = []
    in_list = False
    list_type = None

    def close_list():
        nonlocal in_list, list_type
        if in_list:
            html_lines.append(f"</{list_type}>")
            in_list = False
            list_type = None

    def close_table():
        nonlocal in_table, table_lines
        if in_table:
            if table_lines:
                html_lines.append("<table>")
                header = table_lines[0]
                html_lines.append("<thead><tr>")
                for cell in header:
                    html_lines.append(f"<th>{cell}</th>")
                html_lines.append("</tr></thead>")
                
                rows = table_lines[1:]
                if rows:
                    html_lines.append("<tbody>")
                    for row in rows:
                        html_lines.append("<tr>")
                        for cell in row:
                            html_lines.append(f"<td>{cell}</td>")
                        html_lines.append("</tr>")
                    html_lines.append("tbody>")
                html_lines.append("</table>")
            in_table = False
            table_lines = []

    for line in lines:
        stripped = line.strip()

        # 程式碼區塊
        if stripped.startswith("```"):
            close_list()
            close_table()
            if in_code_block:
                escaped_code = html.escape("\n".join(code_lines))
                html_lines.append(f"<pre><code class=\"language-{code_lang}\">{escaped_code}</code></pre>")
                in_code_block = False
                code_lines = []
                code_lang = ""
            else:
                in_code_block = True
                code_lang = stripped[3:].strip()
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # 表格處理
        if stripped.startswith("|") and stripped.endswith("|"):
            close_list()
            # 檢查是否為分割線 |:---|:---|
            if re.match(r"^\|[\s\-:]+(\|[\s\-:]+)+\|$", stripped):
                continue
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            # 格式化儲存格行內語法
            cells = [inline_format(c) for c in cells]
            if not in_table:
                in_table = True
                table_lines = [cells]
            else:
                table_lines.append(cells)
            continue
        else:
            close_table()

        # 空行
        if not stripped:
            close_list()
            continue

        # 標題
        if stripped.startswith("#"):
            close_list()
            m = re.match(r"^(#{1,6})\s+(.*)$", stripped)
            if m:
                level = len(m.group(1))
                text = inline_format(m.group(2))
                html_lines.append(f"<h{level}>{text}</h{level}>")
                continue

        # 水平分割線
        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", stripped):
            close_list()
            html_lines.append("<hr>")
            continue

        # 引用區塊
        if stripped.startswith(">"):
            close_list()
            content = inline_format(stripped.lstrip(">").strip())
            html_lines.append(f"<blockquote>{content}</blockquote>")
            continue

        # 無序列表
        if re.match(r"^[-*]\s+", stripped):
            content = inline_format(re.sub(r"^[-*]\s+", "", stripped))
            if not in_list or list_type != "ul":
                close_list()
                in_list = True
                list_type = "ul"
                html_lines.append("<ul>")
            html_lines.append(f"<li>{content}</li>")
            continue

        # 有序列表
        if re.match(r"^\d+\.\s+", stripped):
            content = inline_format(re.sub(r"^\d+\.\s+", "", stripped))
            if not in_list or list_type != "ol":
                close_list()
                in_list = True
                list_type = "ol"
                html_lines.append("<ol>")
            html_lines.append(f"<li>{content}</li>")
            continue

        close_list()

        # 一般段落
        p_content = inline_format(stripped)
        html_lines.append(f"<p>{p_content}</p>")

    close_list()
    close_table()
    return "\n".join(html_lines)

def inline_format(text):
    """處理粗體、斜體、行內 code、連結等語法"""
    # 粗體 **text**
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    # 斜體 *text*
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    # 行內程式碼 `code`
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    # 連結 [text](url)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2" target="_blank">\1</a>', text)
    return text

def build_html_document(title, body_content, doc_badge="Money-Buibui 成果提交"):
    return f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <style>
    @page {{
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
    }}
    * {{
      box-sizing: border-box;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
      color: #2D3748;
      line-height: 1.68;
      font-size: 13.5px;
      background-color: #FFFFFF;
      margin: 0;
      padding: 0;
    }}
    .document-header {{
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    .badge {{
      display: inline-block;
      background-color: #FFF0EB;
      color: #E76F51;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid #F8B5A5;
      letter-spacing: 0.5px;
    }}
    .doc-meta {{
      font-size: 11.5px;
      color: #718096;
    }}
    h1 {{
      font-size: 22px;
      font-weight: 800;
      color: #1A202C;
      margin-top: 20px;
      margin-bottom: 14px;
      border-bottom: 2.5px solid #E76F51;
      padding-bottom: 6px;
      page-break-after: avoid;
    }}
    h2 {{
      font-size: 16px;
      font-weight: 700;
      color: #2D3748;
      border-left: 4px solid #E76F51;
      padding-left: 8px;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }}
    h3 {{
      font-size: 14px;
      font-weight: 700;
      color: #4A5568;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }}
    h4 {{
      font-size: 13px;
      font-weight: 700;
      color: #718096;
      margin-top: 10px;
      margin-bottom: 4px;
    }}
    p {{
      margin: 8px 0;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 12px;
      page-break-inside: avoid;
    }}
    th, td {{
      border: 1px solid #E2E8F0;
      padding: 7px 10px;
      text-align: left;
    }}
    th {{
      background-color: #F7FAFC;
      font-weight: 700;
      color: #2D3748;
      border-bottom: 2px solid #CBD5E0;
    }}
    tr:nth-child(even) {{
      background-color: #FAFAFA;
    }}
    code {{
      background-color: #F7FAFC;
      color: #C53030;
      border: 1px solid #EDF2F7;
      padding: 1.5px 5px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
    }}
    pre {{
      background-color: #1A202C;
      color: #E2E8F0;
      padding: 12px 14px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      overflow-x: auto;
      page-break-inside: avoid;
      line-height: 1.5;
    }}
    pre code {{
      background-color: transparent;
      color: inherit;
      border: none;
      padding: 0;
    }}
    blockquote {{
      border-left: 4px solid #F4A261;
      background-color: #FFFDF9;
      padding: 8px 14px;
      margin: 10px 0;
      border-radius: 0 6px 6px 0;
      color: #4A5568;
      font-size: 13px;
    }}
    ul, ol {{
      padding-left: 22px;
      margin: 6px 0;
    }}
    li {{
      margin-bottom: 3px;
    }}
    hr {{
      border: none;
      border-top: 1px solid #E2E8F0;
      margin: 18px 0;
    }}
    strong {{
      color: #1A202C;
    }}
    a {{
      color: #E76F51;
      text-decoration: none;
    }}
    .footer-note {{
      margin-top: 30px;
      border-top: 1px dashed #CBD5E0;
      padding-top: 10px;
      font-size: 11px;
      color: #A0AEC0;
      text-align: center;
    }}
  </style>
</head>
<body>
  <div class="document-header">
    <span class="badge">{doc_badge}</span>
    <span class="doc-meta">Money-Buibui 專題成果報告 │ 2026</span>
  </div>

  {body_content}

  <div class="footer-note">
    Money-Buibui — 大學生的可愛理財手帳管家 │ Local-First 零個資設計
  </div>
</body>
</html>
"""

def generate_pdf_from_html(html_path, pdf_path):
    """呼叫 Chrome Headless 將 HTML 渲染轉為 PDF"""
    temp_user_data = os.path.join(DOCS_DIR, '.chrome-temp')
    os.makedirs(temp_user_data, exist_ok=True)
    
    cmd = [
        CHROME_BIN,
        "--headless",
        "--disable-gpu",
        f"--user-data-dir={temp_user_data}",
        f"--print-to-pdf={pdf_path}",
        "--no-pdf-header-footer",
        html_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.isfile(pdf_path) and os.path.getsize(pdf_path) > 0:
        return True, os.path.getsize(pdf_path)
    return False, result.stderr

def main():
    files_to_convert = [
        {
            'md': 'PROJECT_REPORT.md',
            'html': 'PROJECT_REPORT.html',
            'pdf': 'PROJECT_REPORT.pdf',
            'title': 'Money-Buibui — 期中專題成果報告書',
            'badge': '📄 期中專題報告書'
        },
        {
            'md': 'AI_COLLABORATION_SUMMARY.md',
            'html': 'AI_COLLABORATION_SUMMARY.html',
            'pdf': 'AI_COLLABORATION_SUMMARY.pdf',
            'title': 'Money-Buibui — AI 對話與人機協作歷程摘要',
            'badge': '🤖 AI 協作開發歷程摘要'
        },
        {
            'md': 'SLIDES_AND_DEMO_SCRIPT.md',
            'html': 'SLIDES_AND_DEMO_SCRIPT.html',
            'pdf': 'SLIDES_AND_DEMO_SCRIPT.pdf',
            'title': 'Money-Buibui — 簡報大綱與 90 秒展示講稿',
            'badge': '🎬 簡報大綱與展示講稿'
        }
    ]

    print("🚀 開始將 Markdown 檔案轉換為精美排版 PDF...\n")

    for item in files_to_convert:
        md_file = os.path.join(DOCS_DIR, item['md'])
        html_file = os.path.join(DOCS_DIR, item['html'])
        pdf_file = os.path.join(DOCS_DIR, item['pdf'])

        if not os.path.isfile(md_file):
            print(f"❌ 找不到來源 Markdown 檔案：{item['md']}")
            continue

        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()

        body_html = parse_markdown_to_html(md_content)
        full_html = build_html_document(item['title'], body_html, item['badge'])

        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(full_html)
        print(f"  ✅ 已生成 HTML 中介檔：docs/{item['html']}")

        # 呼叫 Chrome 生成 PDF
        ok, res = generate_pdf_from_html(html_file, pdf_file)
        if ok:
            print(f"  🎉 成功產出 PDF：docs/{item['pdf']} ({res:,} bytes)")
        else:
            print(f"  ⚠️ PDF 產出失敗：{res}")

    print("\n✨ 所有作業 PDF 檔案已準備完成！")

if __name__ == '__main__':
    main()
