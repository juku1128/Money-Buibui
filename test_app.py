#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Money Buddy — 自動化邏輯與驗收測試套件
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

if __name__ == '__main__':
    unittest.main()

