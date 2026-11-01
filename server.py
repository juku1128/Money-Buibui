import http.server
import socketserver
import os
import sys
import json
import urllib.request
import urllib.error

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

STYLE_PROMPT_GUIDES = {
    'gentle': '溫柔提醒型：像好友般親切貼心、自然友善，不給對方心理壓力，語氣溫和帶有祝願。',
    'cute': '可愛撒嬌型：加入軟萌顏文字、撒嬌賣萌、可愛比喻（如奶茶基金告急、錢包咕嚕咕嚕叫），化解尷尬。',
    'humorous': '幽默搞笑型：運用浮誇、好笑的迷因梗或生動比喻（如鈔票託夢想家、戶頭遇到破產海嘯），讓人會心一笑。',
    'formal': '正式禮貌型：謹慎客氣、保持公事公辦距離，適合同學分組或不熟友人，清楚核對款項與轉帳方式。',
    'firm_polite': '委婉但堅定型：清楚表明自己有繳房租/生活費等實際生活支出需求，立場明確並請對方給予確切還款日。',
    'strong_polite': '強硬但有禮貌型：立場強硬不容模糊，點明已經提醒多次或拖欠太久，設定清楚期限（如三天內），請對方重視信用。',
    'hell_furious': '粗口暴躁型（地獄模式）：台味暴躁、情緒拉滿、浮誇戲劇化咆哮（例如是在哈囉、錢大風颳來的嗎、快吃不起飯），直球對決！',
    'hell_legal': '法律威嚇型（地獄模式）：嚴肅法條口吻、存證信函與民事督促程序聲明，提及保留對話紀錄、金流明細與調解追討利息權利。',
    'trash_talk': '垃圾話型（北爛白痴風格）：非常北爛、白痴荒謬、一本正經地胡說八道！隨機融入經濟學理論（如機會成本、邊際效用、賽局理論、囚徒困境、沉沒成本、帕累托改善、跨期效用、資訊不對稱）或荒謬比喻與大學生爛梗。不能千篇一律，要好笑、荒謬、充滿創意！'
}

def generate_ai_scripts(api_key, data):
    """透過 Google Gemini REST API 生成 3 則情境式催款訊息"""
    ctx = data.get('context', data) if isinstance(data, dict) else {}
    style_key = ctx.get('style', 'gentle')
    style_guide = STYLE_PROMPT_GUIDES.get(style_key, STYLE_PROMPT_GUIDES['gentle'])
    
    name = ctx.get('name', '朋友')
    amount = ctx.get('amount', 800)
    days = ctx.get('days', 14)
    reason = ctx.get('reason', '日常開銷代墊')
    situation = ctx.get('situation', '正常聯繫')
    borrow_date = ctx.get('borrowDate', '')
    due_date = ctx.get('dueDate', '')

    prompt = f"""你是一位精通人際心理學與幽默文字創作的催款助手。請根據以下借貸情境，創作 3 則截然不同視角與敘事方式的催款訊息：

【借貸情境資訊】
- 對象稱呼：{name}
- 欠款金額：NT$ {amount:,} 元
- 借款時間：已借了約 {days} 天（借款日：{borrow_date}，約定到期日：{due_date or '未特別約定'}）
- 借款原因/事由：{reason}
- 目前遇到的拖欠狀況：{situation}
- 要求的催款風格：{style_guide}

【創作核心要求】
1. 3 則訊息必須呈現「明顯不同的創作視角與切入角度」（例如：角度一偏重生活實際需要或藉口幽默化解、角度二針對拖欠狀況直球溝通、角度三運用風格專屬特色/荒謬比喻/哲理推論）。
2. 絕對不能只是換句話說或換同義詞，3 則訊息結構與語氣長短要有顯著差異。
3. 繁體中文（台灣習慣用語，如 LINE Pay、轉帳、吃宵夜、網銀等）。
4. 請務必返回合法的 JSON 陣列格式，格式如下：
[
  {{ "version": 1, "title": "視角短標籤（例如：生活日常切入）", "text": "完整訊息內容" }},
  {{ "version": 2, "title": "視角短標籤（例如：直球對決現況）", "text": "完整訊息內容" }},
  {{ "version": 3, "title": "視角短標籤（例如：荒謬比喻）", "text": "完整訊息內容" }}
]
請勿輸出任何 JSON 以外的文字或 markdown 標籤。"""

    # 優先嘗試 gemini-2.0-flash 或 gemini-1.5-flash
    models = ['gemini-2.0-flash', 'gemini-1.5-flash']
    last_err = None

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.95,
                "topP": 0.95,
                "maxOutputTokens": 1500
            }
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                result = json.loads(response.read().decode('utf-8'))
                raw_text = result['candidates'][0]['content']['parts'][0]['text'].strip()
                if raw_text.startswith('```json'):
                    raw_text = raw_text[7:]
                if raw_text.startswith('```'):
                    raw_text = raw_text[3:]
                if raw_text.endswith('```'):
                    raw_text = raw_text[:-3]
                scripts = json.loads(raw_text.strip())
                if isinstance(scripts, list) and len(scripts) >= 1:
                    return scripts
        except Exception as e:
            last_err = e
            continue

    raise Exception(f"Gemini API 請求失敗: {last_err}")

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

    def do_GET(self):
        if self.path == '/api/ai-status':
            has_env_key = bool(os.environ.get('GEMINI_API_KEY'))
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({'hasServerKey': has_env_key}).encode('utf-8'))
            return
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/generate-scripts':
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_body)
            except Exception:
                data = {}

            # 優先使用傳入的 key，次之使用環境變數中的 GEMINI_API_KEY
            api_key = data.get('apiKey') or os.environ.get('GEMINI_API_KEY')
            if not api_key:
                # 無 key，回傳指示前端使用本地強大情境演算法引擎
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'source': 'local_engine',
                    'message': '伺服器未設定 GEMINI_API_KEY，使用本機情境演算引擎'
                }).encode('utf-8'))
                return

            try:
                scripts = generate_ai_scripts(api_key, data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'source': 'gemini_ai',
                    'scripts': scripts
                }, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'source': 'local_engine',
                    'message': f'AI 生成遇到暫時錯誤 ({str(e)})，已自動啟用本機情境演算引擎'
                }, ensure_ascii=False).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    port = PORT
    for _ in range(5):
        try:
            with socketserver.TCPServer(("", port), MoneyBuddyHandler) as httpd:
                print("=" * 60)
                print("🐾 Money-Buibui — 大學生的可愛理財管家 伺服器已啟動！")
                print(f"👉 請在瀏覽器打開： http://localhost:{port}")
                print("💡 本系統為 Zero-PII 零個資手帳，所有資料 100% 留存在本地裝置")
                if os.environ.get('GEMINI_API_KEY'):
                    print("✨ 檢測到 GEMINI_API_KEY，已啟用 Google Gemini AI 即時生成功能！")
                else:
                    print("🧠 未檢測到 GEMINI_API_KEY，採用內建「智慧情境動態演算引擎」（離線模式）")
                print("按下 Ctrl+C 可停止伺服器")
                print("=" * 60)
                httpd.serve_forever()
                break
        except OSError:
            print(f"⚠️ 連接埠 {port} 已被佔用，嘗試下一個埠號 {port + 1}...")
            port += 1

if __name__ == '__main__':
    run_server()
