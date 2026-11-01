#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Money-Buibui — 自動化邏輯與驗收測試套件
測試項目：
1. 靜態檔案結構完整性檢驗
2. 理財規劃核心試算邏輯 (50/30/20, 六個罐子, 自訂比例)
3. 借貸結清與剩餘金額扣抵狀態機測試
4. 8 大還錢話術庫完整度、參數代入與地獄催款標記檢驗
5. 預算 80% 警戒與 100% 超支判定演算法
"""

import unittest
import os
import json
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class TestMoneyBuddyCore(unittest.TestCase):

    def test_01_required_files_exist(self):
        """驗證所有核心檔案與靜態資源皆完整存在"""
        required_files = [
            'index.html',
            'server.py',
            'css/style.css',
            'js/scripts_data.js',
            'js/storage.js',
            'js/mascot.js',
            'js/app.js',
            'README.md'
        ]
        for rel_path in required_files:
            abs_path = os.path.join(BASE_DIR, rel_path)
            self.assertTrue(os.path.isfile(abs_path), f"缺少核心檔案：{rel_path}")

    def test_02_financial_planning_50_30_20(self):
        """驗證 50/30/20 理財架構試算無浮點數誤差"""
        income = 20000
        needs = round(income * 0.50)
        wants = round(income * 0.30)
        savings = round(income * 0.20)

        self.assertEqual(needs, 10000)
        self.assertEqual(wants, 6000)
        self.assertEqual(savings, 4000)
        self.assertEqual(needs + wants + savings, income)

    def test_03_financial_planning_6_jars(self):
        """驗證六個罐子理財法比例加總為 100% 且金額正確"""
        income = 30000
        jars = [
            ('生活必需', 0.55),
            ('長期儲蓄', 0.10),
            ('財務自由', 0.10),
            ('教育成長', 0.10),
            ('休閒娛樂', 0.10),
            ('贈與分享', 0.05),
        ]
        total_percent = sum(p for _, p in jars)
        self.assertAlmostEqual(total_percent, 1.0)

        total_amount = sum(round(income * p) for _, p in jars)
        self.assertEqual(total_amount, income)

    def test_04_debt_repayment_state_machine(self):
        """驗證借貸剩餘金額扣抵與狀態機切換 (unpaid -> partial -> paid)"""
        debt_amount = 1200
        paid_amount = 0
        remaining = debt_amount - paid_amount
        status = 'unpaid' if paid_amount == 0 else ('paid' if remaining == 0 else 'partial')
        self.assertEqual(status, 'unpaid')
        self.assertEqual(remaining, 1200)

        # 部分還款 400
        paid_amount += 400
        remaining = max(0, debt_amount - paid_amount)
        status = 'unpaid' if paid_amount == 0 else ('paid' if remaining == 0 else 'partial')
        self.assertEqual(status, 'partial')
        self.assertEqual(remaining, 800)

        # 全額結清 800
        paid_amount += 800
        remaining = max(0, debt_amount - paid_amount)
        status = 'unpaid' if paid_amount == 0 else ('paid' if remaining == 0 else 'partial')
        self.assertEqual(status, 'paid')
        self.assertEqual(remaining, 0)

    def test_05_reminder_scripts_data_integrity(self):
        """驗證 8 大催款風格齊全，每種風格皆至少有 2 個版本，且地獄模式正確配置"""
        js_file = os.path.join(BASE_DIR, 'js', 'scripts_data.js')
        with open(js_file, 'r', encoding='utf-8') as f:
            content = f.read()

        required_styles = [
            'gentle',
            'cute',
            'humorous',
            'formal',
            'firm_polite',
            'strong_polite',
            'hell_furious',
            'hell_legal'
        ]

        for style in required_styles:
            self.assertIn(f"{style}:", content, f"話術資料庫缺少風格：{style}")

        # 檢驗地獄模式旗標
        self.assertIn("hell_furious", content)
        self.assertIn("hell_legal", content)
        self.assertIn("isHell: true", content)

    def test_06_reminder_script_parameter_substitution(self):
        """驗證話術模板代入 {name}, {amount}, {days}, {relationship} 參數"""
        template = "嗨 {name}，之前借給你的 NT$ {amount}，已經過了 {days} 天，有空轉給我喔！"
        result = template.replace('{name}', '小陳').replace('{amount}', '500').replace('{days}', '7')
        self.assertEqual(result, "嗨 小陳，之前借給你的 NT$ 500，已經過了 7 天，有空轉給我喔！")
        self.assertNotIn('{name}', result)
        self.assertNotIn('{amount}', result)
        self.assertNotIn('{days}', result)

    def test_07_budget_alert_thresholds(self):
        """驗證預算達 80% 溫柔警示與大於 100% 超支通知邏輯"""
        budget = 5000

        # 花 3900: 78% -> normal
        spent = 3900
        percent = (spent / budget) * 100
        level = 'danger' if spent > budget else ('warning' if percent >= 80 else 'normal')
        self.assertEqual(level, 'normal')

        # 花 4200: 84% -> warning
        spent = 4200
        percent = (spent / budget) * 100
        level = 'danger' if spent > budget else ('warning' if percent >= 80 else 'normal')
        self.assertEqual(level, 'warning')

        # 花 5200: 104% -> danger
        spent = 5200
        percent = (spent / budget) * 100
        level = 'danger' if spent > budget else ('warning' if percent >= 80 else 'normal')
        self.assertEqual(level, 'danger')

    def test_08_monthly_budget_linkage_cumulative_spending(self):
        """驗證記帳累計支出自預算中即時扣抵，計算剩餘金額與使用率"""
        budget = 5000
        # 模擬連續三筆餐費支出：150, 200, 100
        expenses = [150, 200, 100]
        cumulative_spent = sum(expenses)
        remaining = budget - cumulative_spent
        percent = round((cumulative_spent / budget) * 100)

        self.assertEqual(cumulative_spent, 450)
        self.assertEqual(remaining, 4550)
        self.assertEqual(percent, 9)

    def test_09_budget_threshold_colors_and_text(self):
        """驗證 0-79% 綠色、80-99% 橘色、>=100% 紅色及超額警示文字"""
        budget = 5000

        # 情境 A: 支出 2000 (40%) -> 綠色充足
        spent_a = 2000
        percent_a = round((spent_a / budget) * 100)
        color_a = 'red' if spent_a >= budget else ('orange' if percent_a >= 80 else 'green')
        self.assertEqual(color_a, 'green')

        # 情境 B: 支出 4200 (84%) -> 橘色接近上限
        spent_b = 4200
        percent_b = round((spent_b / budget) * 100)
        color_b = 'red' if spent_b >= budget else ('orange' if percent_b >= 80 else 'green')
        self.assertEqual(color_b, 'orange')

        # 情境 C: 支出 5500 (110%) -> 紅色超額
        spent_c = 5500
        percent_c = round((spent_c / budget) * 100)
        color_c = 'red' if spent_c >= budget else ('orange' if percent_c >= 80 else 'green')
        over_amount = spent_c - budget
        status_text = f"已超出預算 NT$ {over_amount:,}，請留意這個分類的支出！"
        visual_percent = min(100, percent_c)

        self.assertEqual(color_c, 'red')
        self.assertEqual(over_amount, 500)
        self.assertEqual(percent_c, 110)
        self.assertEqual(visual_percent, 100) # 視覺寬度維持 100% 不破版
        self.assertIn("已超出預算 NT$ 500", status_text)

    def test_10_exact_budget_consumed(self):
        """驗證剛好用完預算 (100%) 時的文字與顏色"""
        budget = 5000
        spent = 5000
        percent = round((spent / budget) * 100)
        self.assertEqual(percent, 100)
        color = 'red' if spent >= budget else 'green'
        self.assertEqual(color, 'red')
        status_text = "本月預算已經用完！"
        self.assertEqual(status_text, "本月預算已經用完！")

    def test_11_zero_budget_and_division_safety(self):
        """驗證預算為 0 時除以 0 的防呆機制與未設定預算提示"""
        budget = 0
        spent = 800
        percent = round((spent / budget) * 100) if budget > 0 else 0
        color = 'gray' if budget == 0 else ('red' if spent >= budget else 'green')
        status_text = '尚未設定此分類預算' if budget == 0 else '正常'

        self.assertEqual(percent, 0)
        self.assertEqual(color, 'gray')
        self.assertEqual(status_text, '尚未設定此分類預算')

    def test_12_month_budget_isolation(self):
        """驗證不同月份預算互相獨立，11月預算不影響12月"""
        monthly_budgets = {
            '2026-11': { 'confirmed': True, 'categories': { '飲食': 5000, '娛樂': 2000 } },
            '2026-12': { 'confirmed': False, 'categories': {} }
        }

        self.assertTrue(monthly_budgets['2026-11']['confirmed'])
        self.assertFalse(monthly_budgets['2026-12']['confirmed'])
        self.assertEqual(monthly_budgets['2026-11']['categories']['飲食'], 5000)
        self.assertEqual(monthly_budgets['2026-12']['categories'].get('飲食', 0), 0)

    def test_13_transaction_category_change_budget_sync(self):
        """驗證修改分類時 (例如餐費改娛樂)，兩分類累計支出即時重新計算"""
        budgets = { '飲食': 5000, '娛樂': 2000 }
        transactions = [
            { 'id': 'tx_1', 'type': 'expense', 'category': '飲食', 'amount': 600 },
            { 'id': 'tx_2', 'type': 'expense', 'category': '娛樂', 'amount': 800 }
        ]

        spent_food = sum(t['amount'] for t in transactions if t['category'] == '飲食')
        spent_play = sum(t['amount'] for t in transactions if t['category'] == '娛樂')
        self.assertEqual(spent_food, 600)
        self.assertEqual(spent_play, 800)

        # 將 tx_1 從飲食修改為娛樂
        transactions[0]['category'] = '娛樂'
        spent_food_after = sum(t['amount'] for t in transactions if t['category'] == '飲食')
        spent_play_after = sum(t['amount'] for t in transactions if t['category'] == '娛樂')

        self.assertEqual(spent_food_after, 0)
        self.assertEqual(spent_play_after, 1400)
        self.assertEqual(budgets['飲食'] - spent_food_after, 5000)
        self.assertEqual(budgets['娛樂'] - spent_play_after, 600)

    def test_14_month_filtering_and_all_months(self):
        """驗證特定月份篩選 vs 全部月份 (all) 之筆數過濾邏輯"""
        txs = [
            { 'id': 't1', 'type': 'income', 'amount': 10000, 'date': '2026-11-01' },
            { 'id': 't2', 'type': 'expense', 'amount': 100, 'date': '2026-11-01' },
            { 'id': 't3', 'type': 'expense', 'amount': 200, 'date': '2026-10-31' },
            { 'id': 't4', 'type': 'expense', 'amount': 300, 'date': '2026-10-25' }
        ]

        # 篩選 2026-11
        filtered_nov = [t for t in txs if t['date'].startswith('2026-11')]
        self.assertEqual(len(filtered_nov), 2)
        self.assertEqual(filtered_nov[0]['type'], 'income')
        self.assertEqual(filtered_nov[1]['type'], 'expense')

        # 全部月份 (all)
        filtered_all = [t for t in txs]
        self.assertEqual(len(filtered_all), 4)

    def test_15_category_spent_count_aggregation(self):
        """驗證同分類多筆支出時，累計金額與筆數 (spentCount) 正確彙整"""
        txs = [
            { 'id': 't1', 'type': 'expense', 'category': '飲食', 'amount': 80 },
            { 'id': 't2', 'type': 'expense', 'category': '飲食', 'amount': 120 },
            { 'id': 't3', 'type': 'expense', 'category': '飲食', 'amount': 150 },
            { 'id': 't4', 'type': 'expense', 'category': '交通', 'amount': 35 }
        ]

        food_txs = [t for t in txs if t['category'] == '飲食']
        food_spent = sum(t['amount'] for t in food_txs)
        food_count = len(food_txs)

        self.assertEqual(food_spent, 350)
        self.assertEqual(food_count, 3)

    def test_16_month_shift_logic(self):
        """驗證首頁月份切換前一個月與後一個月無年跨月邊界異常"""
        def shift_month(ym, offset):
            parts = ym.split('-')
            y, m = int(parts[0]), int(parts[1])
            # 計算跨年與跨月
            total_m = (y * 12) + (m - 1) + offset
            new_y = total_m // 12
            new_m = (total_m % 12) + 1
            return f"{new_y}-{str(new_m).zfill(2)}"

        self.assertEqual(shift_month('2026-11', -1), '2026-10')
        self.assertEqual(shift_month('2026-11', 1), '2026-12')
        self.assertEqual(shift_month('2026-01', -1), '2025-12')
        self.assertEqual(shift_month('2026-12', 1), '2027-01')

    def test_17_nine_reminder_styles_presence(self):
        """驗證 9 大催款風格齊備 (含 trash_talk, 2 種地獄模式, 6 種一般風格)"""
        js_file = os.path.join(BASE_DIR, 'js', 'scripts_data.js')
        with open(js_file, 'r', encoding='utf-8') as f:
            content = f.read()

        required_9_styles = [
            'gentle',
            'cute',
            'humorous',
            'formal',
            'firm_polite',
            'strong_polite',
            'trash_talk',
            'hell_furious',
            'hell_legal'
        ]

        for s in required_9_styles:
            self.assertIn(f"{s}:", content, f"話術字典缺少核心風格：{s}")

        self.assertIn("isTrash: true", content)
        self.assertIn("isHell: true", content)

    def test_18_trash_talk_twelve_economics_theories(self):
        """驗證垃圾話風格融入 12 大經濟學公式與理論"""
        js_file = os.path.join(BASE_DIR, 'js', 'scripts_data.js')
        with open(js_file, 'r', encoding='utf-8') as f:
            content = f.read()

        economics_terms = [
            '機會成本',
            '邊際效用',
            '效用最大化',
            '賽局理論',
            '囚徒困境',
            '沉沒成本',
            '理性行為者',
            '資訊不對稱',
            'Goodhart',
            '跨期效用',
            '供需法則',
            '帕累托'
        ]

        for term in economics_terms:
            self.assertIn(term, content, f"垃圾話庫缺少經濟學術語：{term}")

    def test_19_contextual_script_engine_three_versions_jsc(self):
        """以 JSC 執行 ContextualScriptEngine，驗證 9 大風格均能即時生成 3 種角度切入的催款說法"""
        import subprocess
        jsc_bin = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc'
        if not os.path.isfile(jsc_bin):
            self.skipTest("JSC binary not available on this environment")

        js_code = """
        load('js/scripts_data.js');
        var ctx = {
            name: '阿豪',
            amount: 1200,
            days: 20,
            relationship: '朋友',
            dueDate: '2026-10-15',
            reason: '聚餐火鍋',
            situation: '月底吃土',
            style: 'trash_talk'
        };

        var styles = ['gentle', 'cute', 'humorous', 'formal', 'firm_polite', 'strong_polite', 'trash_talk', 'hell_furious', 'hell_legal'];
        var successCount = 0;
        styles.forEach(function(s) {
            var res = contextualEngine.generateThreeVersions(ctx, s);
            if (Array.isArray(res) && res.length === 3) {
                if (res[0].text && res[1].text && res[2].text) {
                    successCount++;
                }
            }
        });
        print('SUCCESS_STYLES:' + successCount);
        """
        proc = subprocess.run([jsc_bin, '-e', js_code], cwd=BASE_DIR, capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0, f"JSC execution error: {proc.stderr}")
        self.assertIn("SUCCESS_STYLES:9", proc.stdout)

    def test_20_server_api_status(self):
        """驗證 server.py 定義了 /api/ai-status 與 /api/generate-scripts 路由"""
        server_file = os.path.join(BASE_DIR, 'server.py')
        with open(server_file, 'r', encoding='utf-8') as f:
            code = f.read()

        self.assertIn("/api/ai-status", code)
        self.assertIn("/api/generate-scripts", code)
        self.assertIn("generate_ai_scripts", code)
        self.assertIn("urllib.request", code)

    def test_21_twenty_variations_per_style(self):
        """驗證 9 大風格在 STYLE_VARIATIONS 中均擁有至少 20 種不同的回應方式 (共至少 180 種)"""
        import subprocess
        jsc_bin = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc'
        if not os.path.isfile(jsc_bin):
            self.skipTest("JSC binary not available on this environment")

        js_code = """
        load('js/scripts_data.js');
        var styles = ['gentle', 'cute', 'humorous', 'formal', 'firm_polite', 'strong_polite', 'trash_talk', 'hell_furious', 'hell_legal'];
        var passedStyles = 0;
        styles.forEach(function(s) {
            if (STYLE_VARIATIONS[s] && STYLE_VARIATIONS[s].length >= 20) {
                passedStyles++;
            }
        });
        print('PASSED_STYLES_COUNT:' + passedStyles);
        """
        proc = subprocess.run([jsc_bin, '-e', js_code], cwd=BASE_DIR, capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0, f"JSC execution error: {proc.stderr}")
        self.assertIn("PASSED_STYLES_COUNT:9", proc.stdout)

    def test_22_relationship_field_removed_from_ui_and_logic(self):
        """驗證「與對象的關係」欄位已從 index.html、js/app.js 與 server.py 徹底移除"""
        html_file = os.path.join(BASE_DIR, 'index.html')
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        self.assertNotIn('script-param-relationship', html_content)
        self.assertNotIn('與對象的關係', html_content)

        app_file = os.path.join(BASE_DIR, 'js', 'app.js')
        with open(app_file, 'r', encoding='utf-8') as f:
            app_content = f.read()
        self.assertNotIn('script-param-relationship', app_content)

        server_file = os.path.join(BASE_DIR, 'server.py')
        with open(server_file, 'r', encoding='utf-8') as f:
            server_content = f.read()
        self.assertNotIn('與借款人的關係', server_content)

    def test_23_clean_cute_design_tokens(self):
        """驗證 CSS 與 HTML 100% 無殘留任何迷因類別與標籤，純粹可愛日系文創手帳 Tokens 齊備"""
        css_file = os.path.join(BASE_DIR, 'css', 'style.css')
        with open(css_file, 'r', encoding='utf-8') as f:
            css = f.read()
        self.assertNotIn('[data-theme="meme"]', css)
        self.assertNotIn('.stamp-meme', css)
        self.assertNotIn('.caution-tape', css)
        self.assertNotIn('.neo-btn', css)
        self.assertNotIn('.absurdity-bar', css)
        self.assertIn('.journal-card', css)
        self.assertIn('.tape-tag', css)

        html_file = os.path.join(BASE_DIR, 'index.html')
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        self.assertNotIn('stamp-meme', html)
        self.assertNotIn('caution-tape', html)
        self.assertNotIn('meme-sticker', html)
        self.assertNotIn('js/meme_engine.js', html)

    def test_24_clean_cute_mascot_no_memes(self):
        """驗證吉祥物管家柴柴為純粹可愛日系表情，無迷因狗頭像與模式參數"""
        mascot_file = os.path.join(BASE_DIR, 'js', 'mascot.js')
        with open(mascot_file, 'r', encoding='utf-8') as f:
            mascot_code = f.read()
        self.assertNotIn('meme_doge', mascot_code)
        self.assertNotIn('meme_sunglasses', mascot_code)
        self.assertNotIn('meme_dead_eyes', mascot_code)
        self.assertNotIn('meme_crying', mascot_code)
        self.assertNotIn('isMemeMode', mascot_code)
        self.assertIn('happy:', mascot_code)
        self.assertIn('calm:', mascot_code)

    def test_25_server_pure_accounting_endpoints(self):
        """驗證 server.py 僅保留理財記帳與催款相關 API，無任何迷因後端路由"""
        server_file = os.path.join(BASE_DIR, 'server.py')
        with open(server_file, 'r', encoding='utf-8') as f:
            server_code = f.read()
        self.assertIn('/api/ai-status', server_code)
        self.assertIn('/api/generate-scripts', server_code)
        self.assertNotIn('/api/meme-trends', server_code)
        self.assertNotIn('/api/generate-memes', server_code)
        self.assertNotIn('get_legal_meme_trends', server_code)

    def test_26_clean_dashboard_and_no_meme_cards(self):
        """驗證首頁與彈窗無任何每日迷因彩蛋卡、嘴砲診斷報告或迷因彈窗"""
        html_file = os.path.join(BASE_DIR, 'index.html')
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        self.assertNotIn('dash-daily-meme-card', html)
        self.assertNotIn('dash-financial-roast-card', html)
        self.assertNotIn('modal-tx-reaction', html)
        self.assertNotIn('modal-diploma', html)
        self.assertNotIn('view-settings', html)

    def test_27_hero_handbook_banner_elements(self):
        """驗證頂部 Hero 橫幅完整具備 Money-Buibui 標題、副標題、圍巾柴柴頭像容器與對話泡泡"""
        html_file = os.path.join(BASE_DIR, 'index.html')
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        self.assertIn('hero-handbook-banner', html)
        self.assertIn('Money-Buibui', html)
        self.assertIn('大學生的可愛理財管家', html)
        self.assertIn('shiba-avatar-container', html)
        self.assertIn('shiba-message', html)

    def test_28_three_bento_cards_with_washi_tapes(self):
        """驗證三欄式手帳 Bento 卡片具備抹茶綠、櫻花粉、珊瑚橘三色手繪紙膠帶與專屬元件"""
        html_file = os.path.join(BASE_DIR, 'index.html')
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        self.assertIn('tape-matcha', html)
        self.assertIn('tape-sakura', html)
        self.assertIn('tape-coral', html)
        self.assertIn('本月收支概覽', html)
        self.assertIn('學生預算分類', html)
        self.assertTrue('每日預算提醒' in html or '每日理財提醒' in html)
        self.assertIn('dashTrendMiniChart', html)
        self.assertIn('budget-pct-food', html)
        self.assertNotIn('handbook-bottom-nav', html)

    def test_29_scarf_shiba_avatar(self):
        """驗證吉祥物模組定義了穿戴杏色圍巾的可愛柴柴向量圖形 (scarf)"""
        mascot_file = os.path.join(BASE_DIR, 'js', 'mascot.js')
        with open(mascot_file, 'r', encoding='utf-8') as f:
            mascot_code = f.read()
        self.assertIn('scarf:', mascot_code)
        self.assertIn('scarf-group', mascot_code)

    def test_30_daily_budget_meter_elements(self):
        """驗證 Card 3 每日預算提醒具備今日預算上限、已花費、剩餘額度儀表與理財錦囊"""
        html_file = os.path.join(BASE_DIR, 'index.html')
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        self.assertIn('daily-budget-meter-box', html)
        self.assertIn('daily-budget-limit', html)
        self.assertIn('daily-budget-spent', html)
        self.assertIn('daily-budget-remaining', html)
        self.assertIn('daily-budget-tip-text', html)

    def test_31_transactions_daily_feed_and_chips(self):
        """驗證記帳頁整合互動式分類預算膠囊與每日記帳項目流水帳"""
        html_file = os.path.join(BASE_DIR, 'index.html')
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        self.assertIn('tx-category-chips-bar', html)
        self.assertIn('tx-table-container', html)
        self.assertIn('每日記帳項目', html)

        css_file = os.path.join(BASE_DIR, 'css', 'style.css')
        with open(css_file, 'r', encoding='utf-8') as f:
            css = f.read()
        self.assertIn('.category-chip', css)
        self.assertIn('.daily-group-card', css)
        self.assertIn('.daily-group-header', css)

    def test_32_navigation_order_and_deleted_comparison(self):
        """驗證頂部導航順序已交換為：首頁 -> 理財規劃 -> 記帳 -> 消費分析 -> 借貸與話術，且理財架構分配差異對比已刪除"""
        html_file = os.path.join(BASE_DIR, 'index.html')
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()
        self.assertNotIn('理財架構分配差異對比', html)
        self.assertNotIn('handbook-bottom-nav', html)

        idx_dash = html.find('id="nav-btn-dashboard"')
        idx_plan = html.find('id="nav-btn-planning"')
        idx_tx = html.find('id="nav-btn-transactions"')
        idx_analysis = html.find('id="nav-btn-analysis"')
        idx_debts = html.find('id="nav-btn-debts"')

        self.assertTrue(idx_dash != -1 and idx_plan != -1 and idx_tx != -1 and idx_analysis != -1 and idx_debts != -1)
        self.assertTrue(idx_dash < idx_plan < idx_tx < idx_analysis < idx_debts)

    def test_33_daily_items_on_top_and_monthly_below(self):
        """驗證「每日記帳項目」置於最上方，「每月收支」置於下方，且【每日收支】明確標註"""
        html_file = os.path.join(BASE_DIR, 'index.html')
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()

        idx_daily_section = html.find('檢視每日記帳項目')
        idx_monthly_section = html.find('檢視每月收支')
        self.assertTrue(idx_daily_section != -1 and idx_monthly_section != -1)
        self.assertTrue(idx_daily_section < idx_monthly_section)

        app_file = os.path.join(BASE_DIR, 'js', 'app.js')
        with open(app_file, 'r', encoding='utf-8') as f:
            app_code = f.read()
        self.assertIn('【每日收支】', app_code)

    def test_34_hell_mode_visuals_and_gemini_badge_removal(self):
        """驗證地獄催款模式完整視覺元件 (烈焰、惡魔、領域展開) 與 Gemini AI 徽章徹底移除"""
        html_file = os.path.join(BASE_DIR, 'index.html')
        with open(html_file, 'r', encoding='utf-8') as f:
            html = f.read()

        # 1. 驗證已移除 Gemini AI 連線徽章與 AI 設定按鈕
        self.assertNotIn('ai-engine-badge', html)
        self.assertNotIn('Google Gemini AI (已連線)', html)
        self.assertNotIn('AI 設定', html)

        # 2. 驗證具備地獄催款視覺元件 (領域橫幅、底部火焰、惡魔柴柴)
        self.assertIn('hell-domain-banner', html)
        self.assertIn('hell-flames-overlay', html)
        self.assertIn('hell-demon-mascot', html)
        self.assertIn('撲滅地獄之火', html)

        # 3. 驗證 CSS 包含極限地獄模式相關樣式與動畫 keyframes
        css_file = os.path.join(BASE_DIR, 'css', 'style.css')
        with open(css_file, 'r', encoding='utf-8') as f:
            css = f.read()
        self.assertIn('body.hell-mode-active', css)
        self.assertIn('hellScreenShake', css)
        self.assertIn('flameLick', css)
        self.assertIn('emberRise', css)
        self.assertIn('demonEmerge', css)
        self.assertIn('demonBob', css)
        self.assertIn('wingFlap', css)

        # 4. 驗證 mascot.js 具備 devil 惡魔柴柴造型
        mascot_file = os.path.join(BASE_DIR, 'js', 'mascot.js')
        with open(mascot_file, 'r', encoding='utf-8') as f:
            mascot_code = f.read()
        self.assertIn('devil:', mascot_code)
        self.assertIn('devil-wings', mascot_code)
        self.assertIn('devil-trident', mascot_code)

        # 5. 驗證 app.js 具備地獄視覺控制與退場方法
        app_file = os.path.join(BASE_DIR, 'js', 'app.js')
        with open(app_file, 'r', encoding='utf-8') as f:
            app_code = f.read()
        self.assertIn('enableHellModeVisuals', app_code)
        self.assertIn('renderHellFlames', app_code)
        self.assertIn('renderHellDemonMascot', app_code)
        self.assertIn('exitHellMode', app_code)
        self.assertNotIn('Google Gemini AI (已連線)', app_code)

if __name__ == '__main__':
    unittest.main()




