#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Money-Buibui — 16:9 橫向高解析度簡報投影片圖片生成器（程式新手視角版）
嚴格依據使用者指定的五大架構與實測展示頁面：
1. 封面（程式新手的期中專題初體驗）
2. 專題做什麼、給誰用
3. 開發過程（簡易摘要：新手如何與 AI 協同開發）
4. 功能介紹（粗略總覽：本機紀錄、首頁、理財規劃、記帳、消費分析、借貸與話術）
5. 展示功能（實測展示：首頁本機紀錄、三層記帳、理財規劃、借貸話術、極限地獄模式）
6. 怎麼測、下一步會走到哪裡與新手心得
"""

import os
import shutil
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SLIDES_DIR = os.path.join(BASE_DIR, 'docs', 'slides')
ARTIFACTS_DIR = "/Users/juku1128/.gemini/antigravity/brain/9f93f27e-2595-418a-9208-7675fe5547b1"
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

os.makedirs(SLIDES_DIR, exist_ok=True)

# 讀取 mascot.js 中的向量圖形
with open(os.path.join(BASE_DIR, 'js', 'mascot.js'), 'r', encoding='utf-8') as f:
    mascot_code = f.read()

def get_avatar_svg(name):
    import re
    match = re.search(rf"{name}:\s*`([^`]+)`", mascot_code)
    if match:
        return match.group(1).strip()
    return ""

scarf_shiba = get_avatar_svg('scarf')
devil_shiba = get_avatar_svg('devil')
warning_shiba = get_avatar_svg('warning')
happy_shiba = get_avatar_svg('happy')

# 共用 16:9 CSS 樣式
COMMON_CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 1920px;
  height: 1080px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
  background-color: #FFFDF9;
  background-image: 
    radial-gradient(#E8D8C8 1.2px, transparent 1.2px),
    linear-gradient(to bottom, #FFFDF9 0%, #FAF5EE 100%);
  background-size: 24px 24px, 100% 100%;
  color: #3D312A;
  padding: 50px 70px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}
.slide-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #EFE6D8;
  padding-bottom: 16px;
}
.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
  color: #E76F51;
  background: #FFE8E0;
  padding: 6px 18px;
  border-radius: 9999px;
  border: 1.5px solid #F8B5A5;
}
.beginner-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #2E7D32;
  background: #E8F5E9;
  padding: 6px 16px;
  border-radius: 12px;
  border: 1px solid #C8E6C9;
}
.slide-counter {
  font-size: 18px;
  font-weight: 700;
  color: #A89F91;
  font-family: ui-monospace, monospace;
}
.washi-tape {
  position: absolute;
  height: 28px;
  opacity: 0.9;
  transform: rotate(-2deg);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}
.tape-matcha { background-color: #A8C3A0; width: 130px; top: -14px; left: 30px; }
.tape-sakura { background-color: #F8CAD4; width: 130px; top: -14px; right: 30px; }
.tape-coral { background-color: #F4A261; width: 130px; top: -14px; left: 30px; }
.card {
  background: #FFFFFF;
  border: 2px solid #EFE6D8;
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 8px 25px rgba(74, 52, 37, 0.05);
  position: relative;
}
.slide-footer {
  border-top: 2px solid #EFE6D8;
  padding-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 17px;
  color: #A89F91;
  font-weight: 600;
}
.tag-pill {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
}
"""

SLIDES_DATA = [
    # 1. 封面
    {
        "id": "slide_01_cover",
        "title": "封面",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .cover-box {{
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 30px 10px;
          gap: 50px;
        }}
        .cover-left {{
          flex: 1.25;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }}
        .main-title {{
          font-size: 64px;
          font-weight: 900;
          color: #2E2018;
          line-height: 1.15;
        }}
        .main-title span {{ color: #E76F51; }}
        .sub-title {{
          font-size: 26px;
          font-weight: 700;
          color: #7D6E66;
        }}
        .beginner-callout {{
          background: #FFF5F2;
          border-left: 6px solid #E76F51;
          padding: 18px 24px;
          border-radius: 0 16px 16px 0;
          font-size: 20px;
          font-weight: 600;
          color: #5C4B40;
          line-height: 1.5;
        }}
        .chips-row {{
          display: flex;
          gap: 14px;
          margin-top: 6px;
        }}
        .chip {{
          background: #FAF6EF;
          border: 1.5px solid #E5DACD;
          padding: 8px 18px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          color: #5C4B40;
        }}
        .cover-right {{
          flex: 0.85;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }}
        .shiba-circle {{
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #FFEAD9 0%, #FFF8F0 70%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px dashed #F4A261;
          padding: 30px;
          box-shadow: 0 20px 50px rgba(244, 162, 97, 0.25);
        }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">🐾 Money-Buibui</div>
            <div class="beginner-badge">🌱 程式新手的專題初體驗</div>
            <div class="slide-counter">01 / 10</div>
          </div>

          <div class="cover-box">
            <div class="cover-left">
              <div class="main-title">
                Money-Buibui<br>
                <span>大學生的可愛理財手帳管家</span>
              </div>
              <div class="sub-title">
                一位程式新手的冒險：如何用 AI 打造解決自己生活痛點的真實專題
              </div>
              <div class="beginner-callout">
                「身為初學者，我常覺得傳統記帳軟體好冰冷，借錢給朋友又超難開口。<br>
                於是我決定跟 AI 一起做一個兼具溫暖陪伴與地獄催款樂趣的可愛手帳！」
              </div>
              <div class="chips-row">
                <div class="chip">⏱️ 90 秒重點展示</div>
                <div class="chip">🛡️ Local-First 零個資</div>
                <div class="chip">🧪 34 項自動化測試保證</div>
              </div>
            </div>

            <div class="cover-right">
              <div class="shiba-circle">
                {scarf_shiba}
              </div>
              <div style="margin-top: 16px; font-size: 18px; font-weight: 800; color: #E76F51;">
                🐶 陪你度過財務危機的柴柴助手
              </div>
            </div>
          </div>

          <div class="slide-footer">
            <span>期中專題成果發表 │ 2026</span>
            <span>報告細節：做什麼、給誰用、怎麼做、怎麼測、下一步 👉</span>
          </div>
        </body></html>
        """
    },

    # 2. 專題做什麼、給誰用
    {
        "id": "slide_02_what_who",
        "title": "做什麼、給誰用",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .main-heading {{
          font-size: 38px;
          font-weight: 900;
          color: #2E2018;
          margin: 6px 0 20px 0;
        }}
        .main-heading span {{ color: #E76F51; }}
        .split-grid {{
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          margin-bottom: 16px;
        }}
        .column-card {{
          background: #FFFFFF;
          border: 2px solid #EFE6D8;
          border-radius: 24px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 8px 25px rgba(74, 52, 37, 0.05);
          position: relative;
        }}
        .col-badge {{
          font-size: 15px;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 10px;
          width: fit-content;
        }}
        .col-title {{
          font-size: 26px;
          font-weight: 900;
          color: #2E2018;
        }}
        .point-item {{
          background: #FAF6EF;
          border: 1px solid #EAE0D2;
          padding: 14px 18px;
          border-radius: 14px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }}
        .point-icon {{ font-size: 24px; flex-shrink: 0; }}
        .point-text {{ font-size: 17px; font-weight: 600; color: #4A3E37; line-height: 1.45; }}
        .point-text strong {{ color: #2E2018; font-weight: 800; }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">🎯 專題核心定位</div>
            <div class="slide-counter">02 / 10</div>
          </div>

          <div class="main-heading">
            做什麼？給誰用？<span>從身邊最真實的困擾出發</span>
          </div>

          <div class="split-grid">
            <!-- 做什麼 -->
            <div class="column-card">
              <div class="washi-tape tape-matcha"></div>
              <div class="col-badge" style="background:#E8F5E9; color:#2E7D32;">📌 做什麼 (What)</div>
              <div class="col-title">一本溫暖、實用、不說教的日系手帳</div>
              
              <div class="point-item">
                <div class="point-icon">🌸</div>
                <div class="point-text"><strong>溫暖陪伴記帳</strong>：拋棄冷冰冰的報表！用手帳便當盒排版與圍巾柴柴，讓記帳有成就感。</div>
              </div>
              <div class="point-item">
                <div class="point-icon">📊</div>
                <div class="point-text"><strong>三大理財規劃</strong>：50/30/20、六個罐子理財法，自動算出每月合理開銷與儲蓄金額。</div>
              </div>
              <div class="point-item">
                <div class="point-icon">😈</div>
                <div class="point-text"><strong>情境催款神器</strong>：內建 180 款話術＋極限地獄模式，化解聚餐代墊借錢難開口的社交痛點！</div>
              </div>
            </div>

            <!-- 給誰用 -->
            <div class="column-card">
              <div class="washi-tape tape-coral"></div>
              <div class="col-badge" style="background:#FFE8E0; color:#E76F51;">👥 給誰用 (Target Audience)</div>
              <div class="col-title">專為預算有限的大學生量身打造</div>

              <div class="point-item">
                <div class="point-icon">🎓</div>
                <div class="point-text"><strong>生活費有限的大學生</strong>：每月固定零用錢或打工薪水，月底總是擔心吃土、透支。</div>
              </div>
              <div class="point-item">
                <div class="point-icon">💸</div>
                <div class="point-text"><strong>常被同學代墊飲料錢的人</strong>：朋友忘記還錢又不好意思開口催討，急需體面又幽默的話術支援。</div>
              </div>
              <div class="point-item">
                <div class="point-icon">🔒</div>
                <div class="point-text"><strong>討厭被綁定個資的使用者</strong>：不願透露電話信箱、不想註冊帳號，只想純粹在本機安心記帳。</div>
              </div>
            </div>
          </div>

          <div class="slide-footer">
            <span>核心主張：陪伴大學生度過財務危機，有時療癒、有時嘴賤，但永遠不放棄你！</span>
            <span>簡單直覺，零學習門檻</span>
          </div>
        </body></html>
        """
    },

    # 3. 開發過程（簡易摘要）
    {
        "id": "slide_03_process",
        "title": "開發過程（簡易摘要）",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .main-heading {{
          font-size: 38px;
          font-weight: 900;
          color: #2E2018;
          margin: 6px 0 20px 0;
        }}
        .main-heading span {{ color: #E76F51; }}
        .process-steps {{
          flex: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 16px;
        }}
        .step-card {{
          background: #FFFFFF;
          border: 2px solid #EFE6D8;
          border-radius: 22px;
          padding: 26px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 8px 25px rgba(74, 52, 37, 0.05);
          position: relative;
        }}
        .step-num {{
          font-size: 14px;
          font-weight: 900;
          color: #E76F51;
          background: #FFE8E0;
          width: fit-content;
          padding: 4px 12px;
          border-radius: 8px;
          font-family: ui-monospace, monospace;
        }}
        .step-title {{
          font-size: 20px;
          font-weight: 800;
          color: #2E2018;
        }}
        .step-desc {{
          font-size: 15px;
          color: #6B5E55;
          line-height: 1.5;
        }}
        .step-highlight {{
          margin-top: auto;
          background: #FAF6EF;
          border: 1px dashed #D9CEBF;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #8C4A2F;
        }}
        .mentor-box {{
          background: #FFFDF8;
          border: 2px solid #F4A261;
          border-radius: 18px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">🛠️ 怎麼做：開發歷程</div>
            <div class="slide-counter">03 / 10</div>
          </div>

          <div class="main-heading">
            程式新手如何克服卡關？<span>「我定邏輯審美，AI 幫寫代碼驗收」</span>
          </div>

          <div class="process-steps">
            <!-- 步驟 1 -->
            <div class="step-card">
              <div class="step-num">STEP 01</div>
              <div class="step-title">痛點發想與定義</div>
              <div class="step-desc">
                不追求天花亂墜的複雜功能，專注解決自己真實遇到的痛點：記帳麻煩、朋友欠錢不知道怎麼討。
              </div>
              <div class="step-highlight">💡 決策：不做雲端登入，做純前端 Local-First</div>
            </div>

            <!-- 步驟 2 -->
            <div class="step-card">
              <div class="step-num">STEP 02</div>
              <div class="step-title">零依賴輕量架構</div>
              <div class="step-desc">
                初學者常被 npm、Node 環境配置折騰。我們選擇原生 HTML5 + CSS + JS，雙擊就能跑！
              </div>
              <div class="step-highlight">⚡ 成果：跨平台零依賴，點開即用</div>
            </div>

            <!-- 步驟 3 -->
            <div class="step-card">
              <div class="step-num">STEP 03</div>
              <div class="step-title">人機協同 Pair-Coding</div>
              <div class="step-desc">
                我給需求與審美修正（如：拿掉迷因回歸日系手帳、新增地獄烈焰），AI 即時重構並補齊邏輯。
              </div>
              <div class="step-highlight">🤖 角色：我是導演，AI 是得力助教工程師</div>
            </div>

            <!-- 步驟 4 -->
            <div class="step-card">
              <div class="step-num">STEP 04</div>
              <div class="step-title">測試驅動安心交付</div>
              <div class="step-desc">
                新手最怕改了 A 壞了 B！我們建立了 34 項自動化測試，每次修改按下測試立即保證 0 錯誤。
              </div>
              <div class="step-highlight">🧪 信心：34 項單元測試 100% PASS</div>
            </div>
          </div>

          <div class="mentor-box">
            <div style="font-size: 36px;">🤝</div>
            <div style="font-size: 16px; color: #4A3E37; font-weight: 600; line-height: 1.4;">
              <strong>新手的真實體悟</strong>：不用害怕自己是初學者！只要有清楚的問題意識，善用 AI 工具結對編程，並堅持做好單元測試，新手也能獨立完成一個具備商業級完成度的好專題！
            </div>
          </div>

          <div class="slide-footer">
            <span>開發技術棧：HTML5, CSS3 Animations, 原生 ES6+ JavaScript, Python 3 輕量本機伺服器</span>
            <span>零外部金鑰依賴</span>
          </div>
        </body></html>
        """
    },

    # 4. 功能介紹（粗略總覽）
    {
        "id": "slide_04_features_overview",
        "title": "功能介紹總覽",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .main-heading {{
          font-size: 38px;
          font-weight: 900;
          color: #2E2018;
          margin: 6px 0 20px 0;
        }}
        .main-heading span {{ color: #E76F51; }}
        .overview-grid {{
          flex: 1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 16px;
        }}
        .feat-box {{
          background: #FFFFFF;
          border: 2px solid #EFE6D8;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          gap: 16px;
          box-shadow: 0 6px 20px rgba(74, 52, 37, 0.04);
        }}
        .feat-icon-box {{
          width: 56px;
          height: 56px;
          background: #FAF6EF;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
          border: 1.5px solid #E5DACD;
        }}
        .feat-info {{
          display: flex;
          flex-direction: column;
          gap: 6px;
        }}
        .feat-name {{
          font-size: 19px;
          font-weight: 800;
          color: #2E2018;
        }}
        .feat-text {{
          font-size: 14.5px;
          color: #6B5E55;
          line-height: 1.45;
        }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">📋 功能架構總覽</div>
            <div class="slide-counter">04 / 10</div>
          </div>

          <div class="main-heading">
            全站六大核心功能模組<span>「粗略總覽：麻雀雖小，五臟俱全」</span>
          </div>

          <div class="overview-grid">
            <!-- 1. 本機紀錄特色 -->
            <div class="feat-box">
              <div class="feat-icon-box">🛡️</div>
              <div class="feat-info">
                <div class="feat-name">1. 本機紀錄特色 (Local-First)</div>
                <div class="feat-text">完全免註冊！資料 100% 保存在個人電腦瀏覽器，支援多手帳切換與一鍵 JSON/CSV 備份。</div>
              </div>
            </div>

            <!-- 2. 畫面首頁 -->
            <div class="feat-box">
              <div class="feat-icon-box">🏠</div>
              <div class="feat-info">
                <div class="feat-name">2. 畫面首頁 (Dashboard)</div>
                <div class="feat-text">日系手帳 Bento 便當盒佈局，圍巾萌柴柴助手根據真實財務數據給予溫暖金句建議。</div>
              </div>
            </div>

            <!-- 3. 理財規劃 -->
            <div class="feat-box">
              <div class="feat-icon-box">📊</div>
              <div class="feat-info">
                <div class="feat-name">3. 理財規劃 (Planning)</div>
                <div class="feat-text">內建 50/30/20 法則、六個罐子理財法與自訂比例即時試算，整數分配零浮點誤差。</div>
              </div>
            </div>

            <!-- 4. 記帳視圖 -->
            <div class="feat-box">
              <div class="feat-icon-box">📝</div>
              <div class="feat-info">
                <div class="feat-name">4. 記帳視圖 (Transactions)</div>
                <div class="feat-text">三層級動線：置頂每日流水帳、清楚標註【每日收支】、下方整合每月收支與預算扣抵。</div>
              </div>
            </div>

            <!-- 5. 消費分析 -->
            <div class="feat-box">
              <div class="feat-icon-box">📈</div>
              <div class="feat-info">
                <div class="feat-name">5. 消費分析 (Analysis)</div>
                <div class="feat-text">直觀的收支長條圖、支出分類圓餅圖、近半年開銷趨勢，以及 80%/100% 預算警示燈號。</div>
              </div>
            </div>

            <!-- 6. 借貸與話術 -->
            <div class="feat-box">
              <div class="feat-icon-box">💸</div>
              <div class="feat-info">
                <div class="feat-name">6. 借貸與話術 (Debts)</div>
                <div class="feat-text">借款扣抵狀態機、9 大風格 180 款情境催款話術、經濟學垃圾話，以及極限地獄催款模式！</div>
              </div>
            </div>
          </div>

          <div class="slide-footer">
            <span>接下來讓我們看實測畫面，一一印證這六大功能的具體表現！👉</span>
            <span>實測展示：看得到、用得到、跑得動</span>
          </div>
        </body></html>
        """
    },

    # 5. 實測展示 1：首頁與本機紀錄
    {
        "id": "slide_05_demo_dash",
        "title": "實測 1：首頁與本機紀錄",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .main-heading {{
          font-size: 36px;
          font-weight: 900;
          color: #2E2018;
          margin: 4px 0 16px 0;
        }}
        .main-heading span {{ color: #E76F51; }}
        .demo-layout {{
          flex: 1;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 36px;
          align-items: center;
          margin-bottom: 12px;
        }}
        .screenshot-frame {{
          background: #FFFFFF;
          border: 3px solid #E5DACD;
          border-radius: 20px;
          padding: 10px;
          box-shadow: 0 12px 35px rgba(74, 52, 37, 0.1);
        }}
        .screenshot-frame img {{
          width: 100%;
          border-radius: 12px;
          display: block;
        }}
        .demo-desc {{
          display: flex;
          flex-direction: column;
          gap: 16px;
        }}
        .desc-card {{
          background: #FFFFFF;
          border: 1.5px solid #EFE6D8;
          border-radius: 18px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }}
        .desc-card h4 {{ font-size: 19px; color: #E76F51; font-weight: 800; }}
        .desc-card p {{ font-size: 15px; color: #5C4B40; line-height: 1.45; }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">📸 實測展示 (1/5)</div>
            <div class="slide-counter">05 / 10</div>
          </div>

          <div class="main-heading">
            功能實測一：<span>首頁 Bento 手帳與 Local-First 本機隱私</span>
          </div>

          <div class="demo-layout">
            <div class="screenshot-frame">
              <img src="ui_dash.png" alt="首頁實測畫面">
            </div>

            <div class="demo-desc">
              <div class="desc-card">
                <h4>🐾 溫暖圍巾萌柴柴助手</h4>
                <p>柴柴頭頂的對話框絕不是隨機罐頭文字！它會即時讀取本月預算，超支時驚慌提醒（如上圖娛樂超支 NT$ 150），存到錢時熱烈慶祝。</p>
              </div>

              <div class="desc-card">
                <h4>🍱 手帳 Bento 便當盒佈局</h4>
                <p>左卡呈現本月總收支概覽、中卡顯示學生主要預算分類（拉麵飲食、珍奶手搖）、右卡配置今日可用額度動態儀表與理財錦囊。</p>
              </div>

              <div class="desc-card">
                <h4>🛡️ Local-First 零個資承諾</h4>
                <p>無需註冊、無密碼外洩風險，資料全在瀏覽器 LocalStorage。右上角支援一鍵「載入示範資料」，方便隨時展示完整圖表！</p>
              </div>
            </div>
          </div>

          <div class="slide-footer">
            <span>打開就能用，離線也能跑，最懂大學生隱私與陪伴的理財管家</span>
            <span>下一頁：理財規劃即時試算 👉</span>
          </div>
        </body></html>
        """
    },

    # 6. 實測展示 2：理財規劃即時試算
    {
        "id": "slide_06_demo_planning",
        "title": "實測 2：理財規劃試算",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .main-heading {{
          font-size: 36px;
          font-weight: 900;
          color: #2E2018;
          margin: 4px 0 16px 0;
        }}
        .main-heading span {{ color: #2E7D32; }}
        .demo-layout {{
          flex: 1;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 36px;
          align-items: center;
          margin-bottom: 12px;
        }}
        .screenshot-frame {{
          background: #FFFFFF;
          border: 3px solid #E5DACD;
          border-radius: 20px;
          padding: 10px;
          box-shadow: 0 12px 35px rgba(74, 52, 37, 0.1);
        }}
        .screenshot-frame img {{
          width: 100%;
          border-radius: 12px;
          display: block;
        }}
        .demo-desc {{
          display: flex;
          flex-direction: column;
          gap: 16px;
        }}
        .desc-card {{
          background: #FFFFFF;
          border: 1.5px solid #EFE6D8;
          border-radius: 18px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }}
        .desc-card h4 {{ font-size: 19px; color: #2E7D32; font-weight: 800; }}
        .desc-card p {{ font-size: 15px; color: #5C4B40; line-height: 1.45; }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">📸 實測展示 (2/5)</div>
            <div class="slide-counter">06 / 10</div>
          </div>

          <div class="main-heading">
            功能實測二：<span>三大理財規劃架構即時試算（零浮點誤差）</span>
          </div>

          <div class="demo-layout">
            <div class="screenshot-frame">
              <img src="ui_planning.png" alt="理財規劃實測畫面">
            </div>

            <div class="demo-desc">
              <div class="desc-card">
                <h4>📐 50/30/20 與六個罐子理財法</h4>
                <p>輸入每月生活費（如打工 20,000 元），系統瞬間以整數算出各項金額，圓餅圖視覺化展示（50%生活必需 10,000、30%想要 6,000、20%儲蓄 4,000）。</p>
              </div>

              <div class="desc-card">
                <h4>🎛️ 自由自訂比例調整</h4>
                <p>支援拖拉滑桿自由調整比例，具備防呆 100% 總和校驗。超過或不足 100% 時會溫柔提醒，保證每一筆錢都有清楚的去處。</p>
              </div>

              <div class="desc-card">
                <h4>💡 程式新手的收穫</h4>
                <p>以前手算常有小數點誤差，我們寫了嚴謹的四捨五入校驗演算法，確保所有分配項目加總 100% 完美等於總收入！</p>
              </div>
            </div>
          </div>

          <div class="slide-footer">
            <span>科學規劃收支分配，從大學就建立一生受用的財務觀念</span>
            <span>下一頁：三層級清晰記帳視圖 👉</span>
          </div>
        </body></html>
        """
    },

    # 7. 實測展示 3：三層級清晰記帳視圖
    {
        "id": "slide_07_demo_transactions",
        "title": "實測 3：三層級記帳視圖",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .main-heading {{
          font-size: 36px;
          font-weight: 900;
          color: #2E2018;
          margin: 4px 0 16px 0;
        }}
        .main-heading span {{ color: #E76F51; }}
        .demo-layout {{
          flex: 1;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 36px;
          align-items: center;
          margin-bottom: 12px;
        }}
        .screenshot-frame {{
          background: #FFFFFF;
          border: 3px solid #E5DACD;
          border-radius: 20px;
          padding: 10px;
          box-shadow: 0 12px 35px rgba(74, 52, 37, 0.1);
        }}
        .screenshot-frame img {{
          width: 100%;
          border-radius: 12px;
          display: block;
        }}
        .demo-desc {{
          display: flex;
          flex-direction: column;
          gap: 16px;
        }}
        .desc-card {{
          background: #FFFFFF;
          border: 1.5px solid #EFE6D8;
          border-radius: 18px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }}
        .desc-card h4 {{ font-size: 19px; color: #E76F51; font-weight: 800; }}
        .desc-card p {{ font-size: 15px; color: #5C4B40; line-height: 1.45; }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">📸 實測展示 (3/5)</div>
            <div class="slide-counter">07 / 10</div>
          </div>

          <div class="main-heading">
            功能實測三：<span>三層級清晰記帳視圖（徹底告別找不到項目）</span>
          </div>

          <div class="demo-layout">
            <div class="screenshot-frame">
              <img src="ui_transactions.png" alt="記帳頁實測畫面">
            </div>

            <div class="demo-desc">
              <div class="desc-card">
                <h4>🌿 頂部置頂【檢視每日記帳項目】</h4>
                <p>一打開記帳頁，最上面就是當天記錄的花費明細（手搖 -30、拉麵 -180），搭配右上角顯眼的「＋記支出」「＋記收入」，隨手記錄零延遲。</p>
              </div>

              <div class="desc-card">
                <h4>🏷️ 每日卡片清楚標註【每日收支】</h4>
                <p>日期標題旁清楚列出「【每日收支】 支出 NT$ 210 │ 收入 +NT$ 0」，一眼分出個別開銷與當天累計，對帳超輕鬆。</p>
              </div>

              <div class="desc-card">
                <h4>🍊 下方整合【檢視每月收支】與預算膠囊</h4>
                <p>月份切換與分類膠囊置於下方，點擊「飲食」或「娛樂」可即時篩選上方明細，並看到剩餘預算百分比。</p>
              </div>
            </div>
          </div>

          <div class="slide-footer">
            <span>依據使用者回饋重構動線：先看每日細項，再看全月預算，邏輯最清晰！</span>
            <span>下一頁：借貸管理與催款話術 👉</span>
          </div>
        </body></html>
        """
    },

    # 8. 實測展示 4：借貸管理與 180 款催款話術
    {
        "id": "slide_08_demo_debts",
        "title": "實測 4：借貸與催款話術",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .main-heading {{
          font-size: 36px;
          font-weight: 900;
          color: #2E2018;
          margin: 4px 0 16px 0;
        }}
        .main-heading span {{ color: #E76F51; }}
        .demo-layout {{
          flex: 1;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 36px;
          align-items: center;
          margin-bottom: 12px;
        }}
        .screenshot-frame {{
          background: #FFFFFF;
          border: 3px solid #E5DACD;
          border-radius: 20px;
          padding: 10px;
          box-shadow: 0 12px 35px rgba(74, 52, 37, 0.1);
        }}
        .screenshot-frame img {{
          width: 100%;
          border-radius: 12px;
          display: block;
        }}
        .demo-desc {{
          display: flex;
          flex-direction: column;
          gap: 16px;
        }}
        .desc-card {{
          background: #FFFFFF;
          border: 1.5px solid #EFE6D8;
          border-radius: 18px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }}
        .desc-card h4 {{ font-size: 19px; color: #E76F51; font-weight: 800; }}
        .desc-card p {{ font-size: 15px; color: #5C4B40; line-height: 1.45; }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">📸 實測展示 (4/5)</div>
            <div class="slide-counter">08 / 10</div>
          </div>

          <div class="main-heading">
            功能實測四：<span>借貸扣抵狀態機 ＋ 180 款催款話術生成器</span>
          </div>

          <div class="demo-layout">
            <div class="screenshot-frame">
              <img src="ui_debts.png" alt="借貸清單實測畫面">
            </div>

            <div class="demo-desc">
              <div class="desc-card">
                <h4>🔄 部分還款動態狀態機</h4>
                <p>如實測圖：阿豪借 1,200 元，還了 400 元，系統自動扣抵剩餘 800 元並標記「部分還款」；室友小陳結清自動掛上「已結清 ✨」勳章。</p>
              </div>

              <div class="desc-card">
                <h4>🎯 一鍵帶入催款話術產生器</h4>
                <p>點擊「產生催款話術」，系統自動將欠款人暱稱、金額、拖欠天數代入下方產生器，完全省去重複輸入的麻煩。</p>
              </div>

              <div class="desc-card">
                <h4>🤓 12 大經濟學公式垃圾話</h4>
                <p>內建「機會成本、賽局理論、沉沒成本、囚徒困境」搞笑話術，用高階學理荒謬爆擊對方，化解催款尷尬！</p>
              </div>
            </div>
          </div>

          <div class="slide-footer">
            <span>人際關係不尷尬，欠款清清楚楚</span>
            <span>下一頁：震撼全場的地獄催款模式！ 👉</span>
          </div>
        </body></html>
        """
    },

    # 9. 實測展示 5：極限地獄催款模式
    {
        "id": "slide_09_demo_hell",
        "title": "實測 5：極限地獄催款模式",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .main-heading {{
          font-size: 36px;
          font-weight: 900;
          color: #2E2018;
          margin: 4px 0 16px 0;
        }}
        .main-heading span {{ color: #D90429; }}
        .demo-layout {{
          flex: 1;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 36px;
          align-items: center;
          margin-bottom: 12px;
        }}
        .screenshot-frame {{
          background: #1A0103;
          border: 3px solid #EF4444;
          border-radius: 20px;
          padding: 10px;
          box-shadow: 0 0 40px rgba(239, 68, 68, 0.4);
        }}
        .screenshot-frame img {{
          width: 100%;
          border-radius: 12px;
          display: block;
        }}
        .demo-desc {{
          display: flex;
          flex-direction: column;
          gap: 16px;
        }}
        .desc-card {{
          background: #FFFFFF;
          border: 1.5px solid #EFE6D8;
          border-radius: 18px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }}
        .desc-card h4 {{ font-size: 19px; color: #D90429; font-weight: 800; }}
        .desc-card p {{ font-size: 15px; color: #5C4B40; line-height: 1.45; }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge" style="background:#FFE4E6; border-color:#FDA4AF; color:#E11D48;">🔥 實測展示 (5/5)</div>
            <div class="slide-counter">09 / 10</div>
          </div>

          <div class="main-heading">
            功能實測五：<span>極限地獄催款模式（火與惡魔冒出來！）</span>
          </div>

          <div class="demo-layout">
            <div class="screenshot-frame">
              <img src="ui_hell.png" alt="地獄模式實測畫面">
            </div>

            <div class="demo-desc">
              <div class="desc-card" style="border-left: 5px solid #EF4444;">
                <h4>⚡ 啟動全螢幕微震與熔岩深淵</h4>
                <p>點擊「確定啟動」瞬間全畫面震撼微晃 0.5 秒！全站切換為黑曜石熔岩深淵暗紅漸層，紅光外發光拉滿。</p>
              </div>

              <div class="desc-card" style="border-left: 5px solid #F59E0B;">
                <h4>🔥 底部噴湧烈焰與浮動小惡魔</h4>
                <p>28 組多層次 SVG 燃燒火舌動態噴湧，浮動火星與小惡魔靈魂冉冉升起，帶來身臨其境的地獄追債震撼！</p>
              </div>

              <div class="desc-card" style="border-left: 5px solid #7C3AED;">
                <h4>🔱 惡魔柴柴現身 ＋ 一鍵滅火</h4>
                <p>右下角冒出戴惡魔角、拍打翅膀、手持黃金三叉戟的惡魔柴柴，點它會生氣咆哮！隨時點「撲滅地獄之火」一秒回復手帳！</p>
              </div>
            </div>
          </div>

          <div class="slide-footer">
            <span>直球對決拖欠不還！粗口暴躁型 20 款 ＋ 法律威嚇型 20 款</span>
            <span>下一頁：怎麼測、下一步走到哪裡 👉</span>
          </div>
        </body></html>
        """
    },

    # 10. 怎麼測、下一步與新手總結
    {
        "id": "slide_10_testing_next_summary",
        "title": "怎麼測與下一步",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .main-heading {{
          font-size: 38px;
          font-weight: 900;
          color: #2E2018;
          margin: 6px 0 20px 0;
        }}
        .main-heading span {{ color: #2E7D32; }}
        .summary-grid {{
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          margin-bottom: 16px;
        }}
        .sum-card {{
          background: #FFFFFF;
          border: 2px solid #EFE6D8;
          border-radius: 24px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 8px 25px rgba(74, 52, 37, 0.05);
          position: relative;
        }}
        .sum-badge {{
          font-size: 15px;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 10px;
          width: fit-content;
        }}
        .test-banner {{
          background: #ECFDF5;
          border: 2px solid #10B981;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }}
        .test-num {{
          font-size: 36px;
          font-weight: 900;
          color: #047857;
          font-family: ui-monospace, monospace;
        }}
        .next-list {{
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 16px;
          color: #4A3E37;
          line-height: 1.45;
        }}
        .next-item {{
          background: #FAF6EF;
          border: 1px solid #EAE0D2;
          padding: 12px 16px;
          border-radius: 12px;
        }}
        .bottom-thanks-bar {{
          background: linear-gradient(135deg, #E76F51 0%, #C1121F 100%);
          border-radius: 18px;
          padding: 18px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #FFFFFF;
        }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">🧪 品質保證與未來</div>
            <div class="slide-counter">10 / 10</div>
          </div>

          <div class="main-heading">
            怎麼測？下一步走到哪裡？<span>「新手的成果結語」</span>
          </div>

          <div class="summary-grid">
            <!-- 怎麼測 -->
            <div class="sum-card">
              <div class="washi-tape tape-matcha"></div>
              <div class="sum-badge" style="background:#E8F5E9; color:#2E7D32;">🧪 怎麼測 (Verification)</div>
              <div style="font-size: 22px; font-weight:800; color:#2E2018;">34 項自動化單元測試全覆蓋</div>

              <div class="test-banner">
                <div>
                  <div style="font-size:14px; font-weight:700; color:#065F46;">python3 test_app.py</div>
                  <div style="font-size:13px; color:#047857;">耗時僅 0.029s，100% 全數通過</div>
                </div>
                <div class="test-num">34 / 34 PASS</div>
              </div>

              <div style="font-size: 15px; color:#5C4B40; line-height: 1.5;">
                • <strong>演算法無浮點誤差</strong>：50/30/20 與六個罐子加總完美等於 100%。<br>
                • <strong>借貸狀態機完整性</strong>：未還 ➔ 部分還款 ➔ 已結清扣抵無誤。<br>
                • <strong>視覺規範測試</strong>：驗證動線置頂、火焰惡魔動畫、零殘留金鑰。
              </div>
            </div>

            <!-- 下一步 -->
            <div class="sum-card">
              <div class="washi-tape tape-coral"></div>
              <div class="sum-badge" style="background:#FFE8E0; color:#E76F51;">🚀 下一步會走到哪裡 (Next Steps)</div>
              <div style="font-size: 22px; font-weight:800; color:#2E2018;">未來擴充功能規劃</div>

              <div class="next-list">
                <div class="next-item">📱 <strong>PWA 手機桌面免安裝</strong>：加入離線快取，點開就像原生 App 一樣順暢記帳。</div>
                <div class="next-item">🍕 <strong>同儕出遊分帳計算機</strong>：多人聚餐一鍵算好誰該付誰多少錢，並串接催款話術。</div>
                <div class="next-item">🧾 <strong>電子發票掃描 OCR</strong>：拍下紙本發票自動辨識品項與金額，記帳更省力。</div>
              </div>
            </div>
          </div>

          <div class="bottom-thanks-bar">
            <div style="font-size: 20px; font-weight: 800;">
              ✨ 感謝老師與同學聆聽！Money-Buibui 已隨時準備好為大家現場 Demo！🐾
            </div>
            <div style="background:rgba(255,255,255,0.2); padding:6px 16px; border-radius:10px; font-family:monospace; font-weight:bold;">
              GitHub: juku1128/Money-Buibui
            </div>
          </div>

          <div class="slide-footer">
            <span>Money-Buibui — 大學生的可愛理財手帳管家 © 2026</span>
            <span>報告完畢，進入實機展示！</span>
          </div>
        </body></html>
        """
    }
]

def refresh_ui_screenshots():
    """從已更新 Money-Buibui 的本機伺服器擷取最新實機畫面"""
    print("📸 正在擷取包含 Money-Buibui 品牌的新版實機截圖...")
    targets = [
        ("ui_dash.png", "http://localhost:8000"),
        ("ui_planning.png", "http://localhost:8000/#planning"),
        ("ui_transactions.png", "http://localhost:8000/#transactions"),
        ("ui_debts.png", "http://localhost:8000/#debts"),
        ("ui_hell.png", "http://localhost:8000/#hell")
    ]
    temp_dir = os.path.join(SLIDES_DIR, '.chrome-temp-ui')
    os.makedirs(temp_dir, exist_ok=True)
    for filename, url in targets:
        dest = os.path.join(SLIDES_DIR, filename)
        cmd = [
            CHROME_BIN,
            "--headless",
            "--disable-gpu",
            f"--user-data-dir={temp_dir}",
            "--window-size=1200,800",
            f"--screenshot={dest}",
            url
        ]
        subprocess.run(cmd, capture_output=True, text=True)
        if os.path.isfile(dest):
            print(f"  ✅ 截圖完成：docs/slides/{filename}")
    if os.path.isdir(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)

def main():
    refresh_ui_screenshots()
    print("\n🎨 開始生成 10 張 16:9 橫向高解析度投影片圖片（程式新手視角版）...\n")

    for idx, slide in enumerate(SLIDES_DATA):
        slide_id = slide["id"]
        html_file = os.path.join(SLIDES_DIR, f"{slide_id}.html")
        png_file = os.path.join(SLIDES_DIR, f"{slide_id}.png")

        # 寫入單頁 HTML
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(slide["html"].strip())

        # 呼叫 Chrome Headless 截圖為 1920x1080 16:9 PNG
        temp_dir = os.path.join(SLIDES_DIR, '.chrome-temp')
        os.makedirs(temp_dir, exist_ok=True)

        cmd = [
            CHROME_BIN,
            "--headless",
            "--disable-gpu",
            f"--user-data-dir={temp_dir}",
            "--window-size=1920,1080",
            f"--screenshot={png_file}",
            html_file
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if os.path.isfile(png_file) and os.path.getsize(png_file) > 0:
            size_kb = os.path.getsize(png_file) // 1024
            print(f"  🎉 投影片 {idx + 1}/10 生成成功：docs/slides/{slide_id}.png ({size_kb} KB)")

            # 同步複製一份至 Artifacts 目錄以利聊天視窗即時檢視
            if os.path.isdir(ARTIFACTS_DIR):
                artifact_dest = os.path.join(ARTIFACTS_DIR, f"{slide_id}.png")
                shutil.copyfile(png_file, artifact_dest)
        else:
            print(f"  ❌ 投影片 {idx + 1}/10 失敗：{result.stderr}")

    # 清除暫存目錄
    temp_dir = os.path.join(SLIDES_DIR, '.chrome-temp')
    if os.path.isdir(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)

    # 建立全螢幕放映網頁
    build_interactive_slides_viewer()

    print(f"\n✨ 10 張 16:9 投影片高畫質圖片全部產出完畢！")

def build_interactive_slides_viewer():
    """產生可用鍵盤左右鍵全螢幕放映的 slides.html"""
    viewer_file = os.path.join(BASE_DIR, 'docs', 'slides.html')
    slides_img_tags = "\n".join([
        f'<div class="slide-wrap {"active" if i == 0 else ""}"><img src="slides/{s["id"]}.png" alt="{s["title"]}"></div>'
        for i, s in enumerate(SLIDES_DATA)
    ])

    viewer_html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>Money-Buibui — 16:9 橫向簡報放映 (程式新手版)</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #141414;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      color: white;
    }}
    .slides-container {{
      width: 100vw;
      height: 100vh;
      max-width: 177.78vh; /* 16:9 */
      max-height: 56.25vw;
      position: relative;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      background: #000;
    }}
    .slide-wrap {{
      display: none;
      width: 100%;
      height: 100%;
    }}
    .slide-wrap.active {{
      display: block;
      animation: fadeIn 0.25s ease;
    }}
    .slide-wrap img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }}
    @keyframes fadeIn {{
      from {{ opacity: 0; transform: scale(0.995); }}
      to {{ opacity: 1; transform: scale(1); }}
    }}
    .controls {{
      position: fixed;
      bottom: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(0,0,0,0.75);
      padding: 8px 24px;
      border-radius: 9999px;
      backdrop-blur: 8px;
      border: 1px solid rgba(255,255,255,0.2);
      z-index: 99;
    }}
    .btn {{
      background: rgba(255,255,255,0.15);
      border: none;
      color: white;
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: background 0.2s;
    }}
    .btn:hover {{
      background: #E76F51;
    }}
    .page-info {{
      font-size: 14px;
      font-weight: bold;
      font-family: monospace;
    }}
    .hint {{
      position: fixed;
      top: 14px;
      right: 20px;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }}
  </style>
</head>
<body>
  <div class="hint">按鍵盤 ⬅️ / ➡️ 或點擊按鈕切換 │ 按 F11 全螢幕放映</div>
  <div class="slides-container">
    {slides_img_tags}
  </div>

  <div class="controls">
    <button class="btn" onclick="prevSlide()">◀ 上一張</button>
    <span class="page-info" id="page-num">1 / 10</span>
    <button class="btn" onclick="nextSlide()">下一張 ▶</button>
    <a href="../" class="btn" style="text-decoration:none; background:#E76F51;">🚀 切換到現場 Demo</a>
  </div>

  <script>
    let current = 0;
    const slides = document.querySelectorAll('.slide-wrap');
    const pageNum = document.getElementById('page-num');

    function showSlide(index) {{
      slides.forEach(s => s.classList.remove('active'));
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      pageNum.innerText = (current + 1) + ' / ' + slides.length;
    }}

    function prevSlide() {{ showSlide(current - 1); }}
    function nextSlide() {{ showSlide(current + 1); }}

    window.addEventListener('keydown', e => {{
      if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    }});
  </script>
</body>
</html>
"""
    with open(viewer_file, 'w', encoding='utf-8') as f:
        f.write(viewer_html)
    print(f"  🎬 已建立全螢幕放映網頁：docs/slides.html")

if __name__ == '__main__':
    main()
