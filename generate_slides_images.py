#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Money Buddy — 橫向 16:9 簡報投影片高解析圖片生成器
使用 Google Chrome Headless 渲染 1920x1080 高解析 PNG 簡報圖片
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
    """從 mascot.js 提取特定頭像 SVG"""
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
    radial-gradient(#E8D8C8 1px, transparent 1px),
    linear-gradient(to bottom, #FFFDF9 0%, #FAF5EE 100%);
  background-size: 24px 24px, 100% 100%;
  color: #3D312A;
  padding: 60px 80px;
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
  padding-bottom: 20px;
}
.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 800;
  color: #E76F51;
  background: #FFE8E0;
  padding: 6px 20px;
  border-radius: 9999px;
  border: 1.5px solid #F8B5A5;
}
.slide-counter {
  font-size: 18px;
  font-weight: 700;
  color: #A89F91;
  font-family: ui-monospace, monospace;
}
.washi-tape {
  position: absolute;
  height: 32px;
  opacity: 0.88;
  transform: rotate(-2deg);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.tape-matcha { background-color: #A8C3A0; width: 140px; top: -16px; left: 40px; }
.tape-sakura { background-color: #F8CAD4; width: 140px; top: -16px; right: 40px; }
.tape-coral { background-color: #F4A261; width: 140px; top: -16px; left: 40px; }
.card {
  background: #FFFFFF;
  border: 2px solid #EFE6D8;
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 8px 30px rgba(74, 52, 37, 0.05);
  position: relative;
}
.slide-footer {
  border-top: 2px solid #EFE6D8;
  padding-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
  color: #A89F91;
  font-weight: 600;
}
"""

SLIDES_DATA = [
    # Slide 1: 封面
    {
        "id": "slide_01_cover",
        "title": "封面",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .cover-container {{
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 40px 20px;
          gap: 60px;
        }}
        .hero-left {{
          flex: 1.2;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }}
        .main-title {{
          font-size: 68px;
          font-weight: 900;
          line-height: 1.15;
          color: #2E2018;
          letter-spacing: -1px;
        }}
        .main-title span {{
          color: #E76F51;
        }}
        .sub-title {{
          font-size: 28px;
          font-weight: 600;
          color: #7D6E66;
          line-height: 1.4;
        }}
        .pitch-box {{
          background: #FFF5F2;
          border-left: 6px solid #E76F51;
          padding: 20px 28px;
          border-radius: 0 20px 20px 0;
          font-size: 22px;
          font-weight: 700;
          color: #A03D26;
        }}
        .hero-meta {{
          display: flex;
          gap: 16px;
          margin-top: 10px;
        }}
        .meta-chip {{
          background: #FAF6EF;
          border: 1.5px solid #E5DACD;
          padding: 10px 22px;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 700;
          color: #5C4B40;
          display: flex;
          align-items: center;
          gap: 8px;
        }}
        .hero-right {{
          flex: 0.9;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }}
        .shiba-circle {{
          width: 440px;
          height: 440px;
          background: radial-gradient(circle, #FFEAD9 0%, #FFF8F0 70%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px dashed #F4A261;
          padding: 30px;
          box-shadow: 0 20px 50px rgba(244, 162, 97, 0.25);
        }}
        .floating-badge {{
          position: absolute;
          background: #FFFFFF;
          border: 2px solid #E76F51;
          padding: 12px 24px;
          border-radius: 20px;
          font-size: 18px;
          font-weight: 800;
          color: #E76F51;
          box-shadow: 0 8px 24px rgba(231, 111, 81, 0.2);
        }}
        .fb-1 {{ top: 20px; right: 20px; }}
        .fb-2 {{ bottom: 30px; left: 10px; }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">🐾 Money Buddy</div>
            <div class="slide-counter">01 / 05</div>
          </div>

          <div class="cover-container">
            <div class="hero-left">
              <div class="main-title">
                Money Buddy<br>
                <span>大學生的可愛理財手帳管家</span>
              </div>
              <div class="sub-title">
                讓記帳變得溫暖簡單，讓友情催款不再尷尬！
              </div>
              <div class="pitch-box">
                「一個陪伴大學生度過財務危機的可愛理財管家。<br>
                有時溫柔療癒，有時嘴賤北爛，但永遠不會放棄你。」
              </div>
              <div class="hero-meta">
                <div class="meta-chip">⏱️ 90 秒快閃展示</div>
                <div class="meta-chip">🔒 Local-First 零個資</div>
                <div class="meta-chip">🧪 34 項自動化測試</div>
              </div>
            </div>

            <div class="hero-right">
              <div class="shiba-circle">
                {scarf_shiba}
              </div>
              <div class="floating-badge fb-1">🐶 圍巾萌柴柴助手</div>
              <div class="floating-badge fb-2">✨ 日系手帳美學</div>
            </div>
          </div>

          <div class="slide-footer">
            <span>期中專題成果發表 │ 2026</span>
            <span>現場即時 Demo 準備就緒 👉</span>
          </div>
        </body></html>
        """
    },

    # Slide 2: 大學生三大財務痛點
    {
        "id": "slide_02_painpoints",
        "title": "三大痛點與客群",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .header-title {{
          font-size: 44px;
          font-weight: 900;
          color: #2E2018;
          margin: 10px 0 30px 0;
        }}
        .header-title span {{ color: #E76F51; }}
        .cards-grid {{
          flex: 1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 36px;
          align-items: stretch;
          margin-bottom: 20px;
        }}
        .pain-card {{
          background: #FFFFFF;
          border: 2px solid #EFE6D8;
          border-radius: 28px;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          box-shadow: 0 10px 30px rgba(74, 52, 37, 0.05);
        }}
        .pain-icon {{
          font-size: 56px;
          margin-bottom: 16px;
        }}
        .pain-title {{
          font-size: 26px;
          font-weight: 800;
          color: #2E2018;
          margin-bottom: 14px;
        }}
        .pain-desc {{
          font-size: 19px;
          line-height: 1.6;
          color: #7D6E66;
          flex: 1;
        }}
        .pain-pill {{
          margin-top: 24px;
          padding: 10px 16px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
        }}
        .card-1 .pain-pill {{ background: #FFE8E8; color: #D90429; }}
        .card-2 .pain-pill {{ background: #EBF4FF; color: #1D4ED8; }}
        .card-3 .pain-pill {{ background: #FEF3C7; color: #B45309; }}
        .bottom-banner {{
          background: linear-gradient(135deg, #FFF5F2 0%, #FAF0E4 100%);
          border: 2px dashed #E76F51;
          border-radius: 20px;
          padding: 18px 30px;
          font-size: 20px;
          font-weight: 800;
          color: #E76F51;
          text-align: center;
        }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">🎯 目標使用者與痛點</div>
            <div class="slide-counter">02 / 05</div>
          </div>

          <div class="header-title">
            大學生生活費有限，市面記帳 App 總是讓人<span>「堅持不下去」</span>
          </div>

          <div class="cards-grid">
            <!-- 痛點 1 -->
            <div class="pain-card card-1">
              <div class="washi-tape tape-sakura"></div>
              <div>
                <div class="pain-icon">💔</div>
                <div class="pain-title">痛點一：記帳冰冷且說教</div>
                <div class="pain-desc">
                  介面生硬、冷冰冰報表滿滿說教感，缺乏陪伴與成就感，往往記了兩天就放棄。
                </div>
              </div>
              <div class="pain-pill">❌ 傳統 App：缺乏溫度與持續動力</div>
            </div>

            <!-- 痛點 2 -->
            <div class="pain-card card-2">
              <div class="washi-tape tape-matcha"></div>
              <div>
                <div class="pain-icon">🔒</div>
                <div class="pain-title">痛點二：個資疑慮與門檻</div>
                <div class="pain-desc">
                  強迫綁定手機號碼、Email 甚至連動銀行帳號，對於大學生產生沉重心理與個資隱私負擔。
                </div>
              </div>
              <div class="pain-pill">❌ 傳統 App：個資雲端儲存有外洩風險</div>
            </div>

            <!-- 痛點 3 -->
            <div class="pain-card card-3">
              <div class="washi-tape tape-coral"></div>
              <div>
                <div class="pain-icon">💸</div>
                <div class="pain-title">痛點三：聚餐催款超尷尬</div>
                <div class="pain-desc">
                  同學吃火鍋飲料常代墊，朋友忘記還錢又礙於友情難以開口，催款太兇翻船、不催自己吃土！
                </div>
              </div>
              <div class="pain-pill">❌ 傳統 App：完全沒有借貸社交話術支援</div>
            </div>
          </div>

          <div class="bottom-banner">
            💡 Money Buddy 解法：溫暖手帳美學 ＋ Local-First 零個資 ＋ 獨創 180 款情境催款神器！
          </div>

          <div class="slide-footer">
            <span>目標受眾：預算有限、課業人際壓力大、需要管理日常支出的大學生</span>
            <span>核心定位：陪伴型可愛理財管家</span>
          </div>
        </body></html>
        """
    },

    # Slide 3: 核心功能與手帳美學
    {
        "id": "slide_03_features",
        "title": "核心功能與手帳美學",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .header-title {{
          font-size: 40px;
          font-weight: 900;
          color: #2E2018;
          margin: 10px 0 24px 0;
        }}
        .header-title span {{ color: #E76F51; }}
        .features-grid {{
          flex: 1;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 36px;
          margin-bottom: 20px;
        }}
        .feat-card {{
          background: #FFFFFF;
          border: 2px solid #EFE6D8;
          border-radius: 28px;
          padding: 36px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(74, 52, 37, 0.05);
          position: relative;
        }}
        .feat-badge {{
          font-size: 16px;
          font-weight: 800;
          padding: 6px 16px;
          border-radius: 12px;
          display: inline-block;
          margin-bottom: 16px;
          width: fit-content;
        }}
        .badge-1 {{ background: #E8F5E9; color: #2E7D32; }}
        .badge-2 {{ background: #FFF3E0; color: #E65100; }}
        .feat-title {{
          font-size: 28px;
          font-weight: 800;
          color: #2E2018;
          margin-bottom: 16px;
        }}
        .tier-list {{
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }}
        .tier-item {{
          background: #FAF6EF;
          border: 1.5px solid #EAE0D2;
          padding: 16px 20px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 16px;
        }}
        .tier-tag {{
          font-size: 15px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 8px;
          white-space: nowrap;
        }}
        .tag-top {{ background: #A8C3A0; color: #1E3A1A; }}
        .tag-mid {{ background: #F8CAD4; color: #5C1D2A; }}
        .tag-bot {{ background: #F4A261; color: #5C2D0C; }}
        .tier-text {{
          font-size: 17px;
          font-weight: 600;
          color: #4A3E37;
        }}
        .side-mascot-box {{
          display: flex;
          align-items: center;
          gap: 24px;
          background: #FFFDF9;
          border: 2px dashed #E5DACD;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 20px;
        }}
        .mascot-avatar {{
          width: 130px;
          height: 130px;
          flex-shrink: 0;
        }}
        .speech-bubble {{
          background: #FFF5F2;
          border: 1.5px solid #F8B5A5;
          padding: 14px 18px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          color: #8C2E1A;
          line-height: 1.5;
        }}
        .planning-chips {{
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }}
        .p-chip {{
          background: #FAF6EF;
          border: 1.5px solid #E5DACD;
          padding: 10px 16px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          color: #5C4B40;
          flex: 1;
          text-align: center;
        }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">📖 清晰記帳與理財架構</div>
            <div class="slide-counter">03 / 05</div>
          </div>

          <div class="header-title">
            專為大學生設計的<span>「三層級清晰記帳」</span>與三大理財法則
          </div>

          <div class="features-grid">
            <!-- 左欄：三層記帳 -->
            <div class="feat-card">
              <div class="washi-tape tape-matcha"></div>
              <div class="feat-badge badge-1">清晰動線設計</div>
              <div class="feat-title">記帳頁三層級視圖重構</div>
              
              <div class="tier-list">
                <div class="tier-item">
                  <span class="tier-tag tag-top">最上方置頂</span>
                  <div class="tier-text">
                    <strong>【檢視每日記帳項目】</strong>：逐日時間軸流水帳，搭配右上角快速記帳按鈕，開銷一眼全掌握。
                  </div>
                </div>
                <div class="tier-item">
                  <span class="tier-tag tag-mid">每日標註</span>
                  <div class="tier-text">
                    <strong>【每日收支】統計徽章</strong>：每張日期卡片清楚顯示「支出 NT$ 120 │ 收入 +NT$ 100」，不再混淆。
                  </div>
                </div>
                <div class="tier-item">
                  <span class="tier-tag tag-bot">下方整合</span>
                  <div class="tier-text">
                    <strong>【檢視每月收支】與分類預算</strong>：月份切換、三大收支指標、各類別預算額度扣抵膠囊。
                  </div>
                </div>
              </div>
            </div>

            <!-- 右欄：柴柴與理財架構 -->
            <div class="feat-card">
              <div class="washi-tape tape-coral"></div>
              <div class="feat-badge badge-2">溫暖陪伴管家</div>
              <div class="feat-title">圍巾柴柴與三大理財規劃</div>

              <div class="side-mascot-box">
                <div class="mascot-avatar">
                  {scarf_shiba}
                </div>
                <div class="speech-bubble">
                  「汪！柴柴筆記本顯示：這個月飲食預算還剩 42%，今天宵夜喝奶茶完全沒問題喔！🐾」
                </div>
              </div>

              <div style="font-size: 16px; font-weight: 700; color: #5C4B40; margin-bottom: 8px;">
                📐 三大經典理財架構即時試算（零浮點數誤差）：
              </div>
              <div class="planning-chips">
                <div class="p-chip">50/30/20 法則<br><small style="color:#8C7B70;">50%需 30%想 20%存</small></div>
                <div class="p-chip">六個罐子理財<br><small style="color:#8C7B70;">財務自由與教育分配</small></div>
                <div class="p-chip">自訂比例調整<br><small style="color:#8C7B70;">防呆 100% 總和校驗</small></div>
              </div>
            </div>
          </div>

          <div class="slide-footer">
            <span>即時聯動：每筆記帳即時自預算扣抵，達 80% 溫柔提醒、100% 醒目通知</span>
            <span>大學生最需要的日常財務儀表</span>
          </div>
        </body></html>
        """
    },

    # Slide 4: 殺手功能：催款神器與地獄模式
    {
        "id": "slide_04_hellmode",
        "title": "殺手功能：地獄催款模式",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .header-title {{
          font-size: 40px;
          font-weight: 900;
          color: #2E2018;
          margin: 10px 0 24px 0;
        }}
        .header-title span {{ color: #D90429; }}
        .hell-split {{
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 36px;
          margin-bottom: 20px;
        }}
        .normal-side {{
          background: #FFFFFF;
          border: 2px solid #EFE6D8;
          border-radius: 28px;
          padding: 36px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(74, 52, 37, 0.05);
        }}
        .hell-side {{
          background: radial-gradient(circle at 50% 30%, #350505 0%, #170002 60%, #0d0001 100%);
          border: 3px solid #EF4444;
          border-radius: 28px;
          padding: 36px;
          display: flex;
          flex-direction: column;
          color: #FFF5EB;
          box-shadow: 0 0 50px rgba(239, 68, 68, 0.45);
          position: relative;
          overflow: hidden;
        }}
        .side-tag {{
          font-size: 15px;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 10px;
          display: inline-block;
          margin-bottom: 14px;
          width: fit-content;
        }}
        .tag-peace {{ background: #FFE8E0; color: #E76F51; }}
        .tag-hell {{ background: #D90429; color: #FFFFFF; letter-spacing: 1px; }}
        .styles-grid {{
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin: 16px 0;
        }}
        .style-pill {{
          background: #FAF6EF;
          border: 1px solid #E5DACD;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #4A3E37;
        }}
        .trash-box {{
          background: #FFFBEB;
          border: 2px dashed #F59E0B;
          border-radius: 16px;
          padding: 14px 18px;
          font-size: 15px;
          color: #92400E;
          font-weight: 700;
          margin-top: 10px;
        }}
        .hell-visual-list {{
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 14px;
          z-index: 2;
        }}
        .hell-item {{
          background: rgba(80, 5, 8, 0.7);
          border: 1.5px solid rgba(239, 68, 68, 0.6);
          padding: 12px 18px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          color: #FFE4E6;
          display: flex;
          align-items: center;
          gap: 12px;
        }}
        .hell-devil-mascot-box {{
          position: absolute;
          right: 20px;
          bottom: 20px;
          width: 170px;
          height: 170px;
          filter: drop-shadow(0 0 25px rgba(255, 30, 0, 0.8));
          z-index: 1;
        }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge" style="background:#FFE4E6; border-color:#FDA4AF; color:#E11D48;">🔥 核心殺手功能</div>
            <div class="slide-counter">04 / 05</div>
          </div>

          <div class="header-title">
            告別開口尷尬！<span>9 大風格 180 款催款話術</span> ＋ 極致地獄模式
          </div>

          <div class="hell-split">
            <!-- 一般話術與經濟學垃圾話 -->
            <div class="normal-side">
              <div class="side-tag tag-peace">🌱 社交友善話術庫</div>
              <h3 style="font-size: 26px; font-weight: 800; color: #2E2018; margin-bottom: 8px;">
                個人化情境動態代入
              </h3>
              <p style="font-size: 16px; color: #7D6E66; line-height: 1.5;">
                自動帶入欠款對象、金額、借款天數、代墊事由，隨機抽取不重複！
              </p>

              <div class="styles-grid">
                <div class="style-pill">🌱 溫柔提醒型 (20款)</div>
                <div class="style-pill">🐾 可愛撒嬌型 (20款)</div>
                <div class="style-pill">🎪 幽默搞笑型 (20款)</div>
                <div class="style-pill">👔 正式禮貌型 (20款)</div>
                <div class="style-pill">🎯 委婉堅定型 (20款)</div>
                <div class="style-pill">⚡ 強硬禮貌型 (20款)</div>
              </div>

              <div class="trash-box">
                🤓 <strong>12 大經濟學公式垃圾話 (20款)</strong>：<br>
                融入機會成本、賽局理論、沉沒成本、囚徒困境，用高階學理荒謬爆擊！
              </div>
            </div>

            <!-- 地獄催款模式 -->
            <div class="hell-side">
              <div class="side-tag tag-hell">🔥 HELL MODE</div>
              <h3 style="font-size: 26px; font-weight: 900; color: #FEE2E2; margin-bottom: 6px;">
                極限地獄催款模式（非常非常地獄！）
              </h3>
              <p style="font-size: 15px; color: #FCA5A5;">
                粗口暴躁型 (20款) ＋ 法律威嚇型 (20款) ｜ 友情小船即將翻覆！
              </p>

              <div class="hell-visual-list">
                <div class="hell-item">⚡ <strong>啟動全螢幕震撼微晃</strong>：強烈衝擊波轉場</div>
                <div class="hell-item">🌋 <strong>黑曜石熔岩深淵背景</strong>：熾熱紅光外發光</div>
                <div class="hell-item">🔥 <strong>底部噴湧 28 組動態烈焰</strong>：火舌火星與飄動小惡魔</div>
                <div class="hell-item">🔱 <strong>三叉戟惡魔柴柴現身</strong>：露出虎牙、點擊咆哮</div>
                <div class="hell-item" style="background:rgba(20,2,4,0.85); border-color:#F87171;">
                  🕊️ <strong>專屬滅火按鈕</strong>：點擊「撲滅地獄之火」一秒回復手帳！
                </div>
              </div>

              <div class="hell-devil-mascot-box">
                {devil_shiba}
              </div>
            </div>
          </div>

          <div class="slide-footer">
            <span>誠實設計：徹底移除令人存疑的 Gemini AI 徽章，回歸純粹實用話術生成</span>
            <span>90 秒現場實體 Demo 震撼高潮！</span>
          </div>
        </body></html>
        """
    },

    # Slide 5: 架構、驗證與未來展望
    {
        "id": "slide_05_summary",
        "title": "架構、測試與總結",
        "html": f"""
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        {COMMON_CSS}
        .header-title {{
          font-size: 40px;
          font-weight: 900;
          color: #2E2018;
          margin: 10px 0 24px 0;
        }}
        .header-title span {{ color: #2E7D32; }}
        .summary-grid {{
          flex: 1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-bottom: 20px;
        }}
        .sum-card {{
          background: #FFFFFF;
          border: 2px solid #EFE6D8;
          border-radius: 28px;
          padding: 36px 28px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(74, 52, 37, 0.05);
          position: relative;
        }}
        .sum-header {{
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }}
        .sum-icon {{
          font-size: 36px;
          background: #FAF6EF;
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #E5DACD;
        }}
        .sum-title {{
          font-size: 24px;
          font-weight: 800;
          color: #2E2018;
        }}
        .sum-list {{
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 16px;
          color: #5C4B40;
          line-height: 1.5;
        }}
        .test-badge-box {{
          background: #ECFDF5;
          border: 2px solid #10B981;
          border-radius: 18px;
          padding: 16px;
          text-align: center;
          margin-top: auto;
        }}
        .test-badge-num {{
          font-size: 32px;
          font-weight: 900;
          color: #047857;
        }}
        .bottom-demo-bar {{
          background: linear-gradient(135deg, #E76F51 0%, #C1121F 100%);
          border-radius: 20px;
          padding: 20px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #FFFFFF;
          box-shadow: 0 10px 30px rgba(231, 111, 81, 0.3);
        }}
        .demo-text {{
          font-size: 22px;
          font-weight: 800;
        }}
        .repo-link {{
          background: rgba(255,255,255,0.2);
          border: 1.5px solid rgba(255,255,255,0.4);
          padding: 8px 20px;
          border-radius: 12px;
          font-size: 17px;
          font-family: ui-monospace, monospace;
          font-weight: 700;
        }}
        </style></head><body>
          <div class="slide-top-bar">
            <div class="brand-badge">🧪 技術驗收與結語</div>
            <div class="slide-counter">05 / 05</div>
          </div>

          <div class="header-title">
            技術架構、<span>34 項自動化測試 100% 通過</span> 與未來展望
          </div>

          <div class="summary-grid">
            <!-- 1. 系統架構 -->
            <div class="sum-card">
              <div class="washi-tape tape-matcha"></div>
              <div class="sum-header">
                <div class="sum-icon">🛡️</div>
                <div class="sum-title">Local-First 零個資</div>
              </div>
              <div class="sum-list">
                <div>• <strong>零依賴原生架構</strong>：HTML5 + CSS3 + ES6+ JS，跨瀏覽器即開即用。</div>
                <div>• <strong>純本地存儲</strong>：所有帳目 100% 留存在使用者本地端，絕不上傳。</div>
                <div>• <strong>多手帳身分隔離</strong>：同裝置多使用者各自獨立，支援 JSON/CSV 備份。</div>
              </div>
            </div>

            <!-- 2. 品質驗收 -->
            <div class="sum-card">
              <div class="washi-tape tape-sakura"></div>
              <div class="sum-header">
                <div class="sum-icon">🧪</div>
                <div class="sum-title">測試驅動開發 (TDD)</div>
              </div>
              <div class="sum-list">
                <div>• <strong>理財演算校驗</strong>：50/30/20 與六個罐子無浮點數誤差。</div>
                <div>• <strong>借貸狀態機扣抵</strong>：未還 ➔ 部分還款 ➔ 結清無痛狀態轉移。</div>
                <div>• <strong>預算 80%/100% 警戒</strong>：動態警示色與超額計算。</div>
              </div>
              <div class="test-badge-box">
                <div class="test-badge-num">34 / 34 PASS</div>
                <div style="font-size: 13px; font-weight:700; color:#065F46;">python3 test_app.py 全數通過 (0.029s)</div>
              </div>
            </div>

            <!-- 3. 未來展望 -->
            <div class="sum-card">
              <div class="washi-tape tape-coral"></div>
              <div class="sum-header">
                <div class="sum-icon">🚀</div>
                <div class="sum-title">下一步 (Next Steps)</div>
              </div>
              <div class="sum-list">
                <div>• <strong>PWA 手機桌面免安裝</strong>：加入離線快取，體驗如原生 App。</div>
                <div>• <strong>同儕出遊分帳計算機</strong>：自動算帳並串接個人化催款話術。</div>
                <div>• <strong>發票載具 OCR 辨識</strong>：拍照自動分類記帳，更省時省力。</div>
              </div>
            </div>
          </div>

          <div class="bottom-demo-bar">
            <div class="demo-text">
              ✨ 感謝聆聽！請看 Money Buddy 實體動態 Demo 成果展示 👉
            </div>
            <div class="repo-link">
              GitHub: juku1128/Money-Buibui
            </div>
          </div>

          <div class="slide-footer">
            <span>Money Buddy — 大學生的可愛理財管家 © 2026</span>
            <span>期中專題發表完畢，進入 90 秒實機演示！</span>
          </div>
        </body></html>
        """
    }
]

def main():
    print("🎨 開始生成 16:9 橫向高解析投影片圖片...\n")

    generated_pngs = []

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
            print(f"  🎉 投影片 {idx + 1}/5 生成成功：docs/slides/{slide_id}.png ({size_kb} KB)")
            generated_pngs.append(png_file)

            # 同步複製一份至 Artifacts 目錄以利聊天視窗即時檢視
            if os.path.isdir(ARTIFACTS_DIR):
                artifact_dest = os.path.join(ARTIFACTS_DIR, f"{slide_id}.png")
                shutil.copyfile(png_file, artifact_dest)
        else:
            print(f"  ❌ 投影片 {idx + 1}/5 失敗：{result.stderr}")

    # 清除暫存目錄
    temp_dir = os.path.join(SLIDES_DIR, '.chrome-temp')
    if os.path.isdir(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)

    # 製作一份可全螢幕播放的互動簡報網頁 docs/slides.html
    build_interactive_slides_viewer()

    print(f"\n✨ 5 張 16:9 投影片高畫質圖片全部產出完畢！")

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
  <title>Money Buddy — 16:9 橫向簡報展示</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #1A1A1A;
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
      animation: fadeIn 0.3s ease;
    }}
    .slide-wrap img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }}
    @keyframes fadeIn {{
      from {{ opacity: 0; transform: scale(0.99); }}
      to {{ opacity: 1; transform: scale(1); }}
    }}
    .controls {{
      position: fixed;
      bottom: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(0,0,0,0.7);
      padding: 10px 24px;
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
      top: 16px;
      right: 20px;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
    }}
  </style>
</head>
<body>
  <div class="hint">按鍵盤 ⬅️ / ➡️ 或點擊按鈕切換 │ 按 F11 全螢幕</div>
  <div class="slides-container">
    {slides_img_tags}
  </div>

  <div class="controls">
    <button class="btn" onclick="prevSlide()">◀ 上一張</button>
    <span class="page-info" id="page-num">1 / 5</span>
    <button class="btn" onclick="nextSlide()">下一張 ▶</button>
    <a href="../" class="btn" style="text-decoration:none; background:#E76F51;">🚀 開始 Demo</a>
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
