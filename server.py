#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Money Buddy — 大學生的可愛理財管家 本機伺服器
採用 Python 3 標準庫 (無須額外 pip install 依賴，開箱即用)
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MoneyBuddyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # 停用快取以便開發與實時預覽
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        # 確保正確認識 JS 與 CSS MIME 類型
        if path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        elif path.endswith('.css'):
            return 'text/css; charset=utf-8'
        elif path.endswith('.json'):
            return 'application/json; charset=utf-8'
        return super().guess_type(path)

def run_server():
    port = PORT
    for _ in range(5):
        try:
            with socketserver.TCPServer(("", port), MoneyBuddyHandler) as httpd:
                print("=" * 60)
                print("🐾 Money Buddy — 大學生的可愛理財管家 伺服器已啟動！")
                print(f"👉 請在瀏覽器打開： http://localhost:{port}")
                print("💡 本系統為 Zero-PII 零個資手帳，所有資料 100% 留存在本地裝置")
                print("按下 Ctrl+C 可停止伺服器")
                print("=" * 60)
                httpd.serve_forever()
                break
        except OSError:
            print(f"⚠️ 連接埠 {port} 已被佔用，嘗試下一個埠號 {port + 1}...")
            port += 1

if __name__ == '__main__':
    run_server()
