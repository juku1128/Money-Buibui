/**
 * Money Buddy — 柴柴理財小助手 (Shiba Buddy) 模組
 * 提供可愛互動頭像、情緒狀態與基於真實數據的動態金句分析。
 */

const SHIBA_AVATARS = {
  happy: `
    <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md transition-all duration-300">
      <!-- 柴犬頭部 -->
      <circle cx="50" cy="52" r="38" fill="#F4A261" />
      <path d="M 22 28 L 32 46 L 16 42 Z" fill="#E76F51" />
      <path d="M 78 28 L 68 46 L 84 42 Z" fill="#E76F51" />
      <path d="M 25 32 L 32 44 L 20 42 Z" fill="#F4A261" />
      <path d="M 75 32 L 68 44 L 80 42 Z" fill="#F4A261" />
      <!-- 白色臉頰斑塊 -->
      <path d="M 28 55 C 28 75 42 85 50 85 C 58 85 72 75 72 55 C 65 62 50 62 50 62 C 50 62 35 62 28 55 Z" fill="#FFFDF9" />
      <!-- 眼睛 (笑瞇瞇彎眼) -->
      <path d="M 34 50 Q 40 45 44 50" stroke="#2B2D42" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M 66 50 Q 60 45 56 50" stroke="#2B2D42" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- 腮紅 -->
      <ellipse cx="28" cy="58" rx="6" ry="4" fill="#FFCAD4" opacity="0.8" />
      <ellipse cx="72" cy="58" rx="6" ry="4" fill="#FFCAD4" opacity="0.8" />
      <!-- 鼻子與小嘴巴 -->
      <polygon points="50,60 46,56 54,56" fill="#2B2D42" />
      <path d="M 46 63 Q 50 68 54 63" stroke="#2B2D42" stroke-width="2.5" stroke-linecap="round" fill="#E76F51" />
      <!-- 閃亮小星星 -->
      <polygon points="85,25 87,30 92,32 87,34 85,39 83,34 78,32 83,30" fill="#E9C46A" />
    </svg>
  `,

  calm: `
    <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md transition-all duration-300">
      <circle cx="50" cy="52" r="38" fill="#F4A261" />
      <path d="M 22 28 L 32 46 L 16 42 Z" fill="#E76F51" />
      <path d="M 78 28 L 68 46 L 84 42 Z" fill="#E76F51" />
      <!-- 白色臉頰斑塊 -->
      <path d="M 28 55 C 28 75 42 85 50 85 C 58 85 72 75 72 55 C 65 62 50 62 50 62 C 50 62 35 62 28 55 Z" fill="#FFFDF9" />
      <!-- 眼睛 (圓滾滾明亮眼) -->
      <circle cx="38" cy="50" r="4.5" fill="#2B2D42" />
      <circle cx="62" cy="50" r="4.5" fill="#2B2D42" />
      <circle cx="36" cy="48" r="1.5" fill="#FFF" />
      <circle cx="60" cy="48" r="1.5" fill="#FFF" />
      <ellipse cx="28" cy="58" rx="5" ry="3" fill="#FFCAD4" opacity="0.7" />
      <ellipse cx="72" cy="58" rx="5" ry="3" fill="#FFCAD4" opacity="0.7" />
      <!-- 鼻子與安心微笑 -->
      <polygon points="50,60 46,56 54,56" fill="#2B2D42" />
      <path d="M 45 63 Q 50 67 55 63" stroke="#2B2D42" stroke-width="2.5" stroke-linecap="round" fill="none" />
    </svg>
  `,

  warning: `
    <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md transition-all duration-300">
      <circle cx="50" cy="52" r="38" fill="#F4A261" />
      <!-- 垂耳/微縮 -->
      <path d="M 20 32 L 32 48 L 16 46 Z" fill="#E76F51" />
      <path d="M 80 32 L 68 48 L 84 46 Z" fill="#E76F51" />
      <path d="M 28 55 C 28 75 42 85 50 85 C 58 85 72 75 72 55 C 65 62 50 62 50 62 C 50 62 35 62 28 55 Z" fill="#FFFDF9" />
      <!-- 驚訝小圓眼 -->
      <ellipse cx="38" cy="49" rx="5" ry="6" fill="#2B2D42" />
      <ellipse cx="62" cy="49" rx="5" ry="6" fill="#2B2D42" />
      <circle cx="36" cy="46" r="2" fill="#FFF" />
      <circle cx="60" cy="46" r="2" fill="#FFF" />
      <!-- 冷汗滴 -->
      <path d="M 78 40 C 78 40 82 46 80 49 C 78 52 74 50 75 46 Z" fill="#A8DADC" />
      <polygon points="50,60 46,56 54,56" fill="#2B2D42" />
      <!-- O型小嘴 -->
      <ellipse cx="50" cy="67" rx="3.5" ry="4.5" fill="#2B2D42" />
    </svg>
  `,

  fire: `
    <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-lg transition-all duration-300 animate-pulse">
      <!-- 燃燒柴犬頭像 (地獄模式專用) -->
      <circle cx="50" cy="52" r="38" fill="#E76F51" />
      <path d="M 22 24 L 34 44 L 14 40 Z" fill="#C1121F" />
      <path d="M 78 24 L 66 44 L 86 40 Z" fill="#C1121F" />
      <path d="M 28 55 C 28 75 42 85 50 85 C 58 85 72 75 72 55 C 65 62 50 62 50 62 C 50 62 35 62 28 55 Z" fill="#FFE5D9" />
      <!-- 憤怒斜眼 -->
      <line x1="32" y1="44" x2="44" y2="52" stroke="#2B2D42" stroke-width="4" stroke-linecap="round" />
      <circle cx="38" cy="52" r="3.5" fill="#780000" />
      <line x1="68" y1="44" x2="56" y2="52" stroke="#2B2D42" stroke-width="4" stroke-linecap="round" />
      <circle cx="62" cy="52" r="3.5" fill="#780000" />
      <polygon points="50,61 46,57 54,57" fill="#780000" />
      <!-- 咬牙切齒 -->
      <path d="M 44 67 Q 50 64 56 67" stroke="#780000" stroke-width="3" stroke-linecap="round" fill="none" />
      <!-- 怒火特效 -->
      <path d="M 45 15 Q 50 6 55 15 Q 60 22 50 25 Q 40 22 45 15 Z" fill="#FFB703" />
      <path d="M 48 18 Q 50 12 52 18 Q 55 22 50 24 Q 45 22 48 18 Z" fill="#FB8500" />
    </svg>
  `,

  devil: `
    <svg viewBox="0 0 110 110" class="w-full h-full drop-shadow-2xl transition-all duration-300 overflow-visible">
      <defs>
        <radialGradient id="devilGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FF3B30" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#780000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- 紅色惡魔烈焰光環 -->
      <circle cx="55" cy="58" r="46" fill="url(#devilGlow)" class="animate-pulse" />

      <!-- 惡魔蝙蝠翅膀 (拍動動畫) -->
      <g class="devil-wings">
        <!-- 左翅膀 -->
        <path d="M 28 58 C 8 40 0 55 2 68 C 12 60 20 66 26 68 Z" fill="#4A0505" stroke="#C1121F" stroke-width="1.8" />
        <!-- 右翅膀 -->
        <path d="M 82 58 C 102 40 110 55 108 68 C 98 60 90 66 84 68 Z" fill="#4A0505" stroke="#C1121F" stroke-width="1.8" />
      </g>

      <!-- 柴犬身體與尾巴 (深紅惡魔化) -->
      <path d="M 85 70 C 98 62 108 60 106 72 C 104 80 94 84 86 80 Z" fill="#C1121F" stroke="#4A0505" stroke-width="2" />
      <circle cx="55" cy="60" r="36" fill="#D90429" stroke="#590D22" stroke-width="2.5" />

      <!-- 尖銳惡魔雙角 -->
      <path d="M 36 34 Q 24 12 16 18 Q 24 30 32 38 Z" fill="#780000" stroke="#FF4D4D" stroke-width="1.5" />
      <path d="M 74 34 Q 86 12 94 18 Q 86 30 78 38 Z" fill="#780000" stroke="#FF4D4D" stroke-width="1.5" />

      <!-- 柴犬尖耳朵 -->
      <path d="M 28 32 L 38 12 L 46 28 Z" fill="#A4161A" stroke="#590D22" stroke-width="2" />
      <path d="M 82 32 L 72 12 L 64 28 Z" fill="#A4161A" stroke="#590D22" stroke-width="2" />

      <!-- 臉頰火紅漸層花紋 -->
      <path d="M 34 62 C 34 80 48 88 55 88 C 62 88 76 80 76 62 C 70 68 55 68 55 68 C 55 68 40 68 34 62 Z" fill="#FFCCD5" opacity="0.9" />

      <!-- 邪惡燃燒金黃魔瞳 -->
      <ellipse cx="44" cy="54" rx="5" ry="6" fill="#FFD166" />
      <circle cx="44" cy="54" r="2.5" fill="#780000" />
      <line x1="38" y1="46" x2="49" y2="52" stroke="#4A0505" stroke-width="3" stroke-linecap="round" />

      <ellipse cx="66" cy="54" rx="5" ry="6" fill="#FFD166" />
      <circle cx="66" cy="54" r="2.5" fill="#780000" />
      <line x1="72" y1="46" x2="61" y2="52" stroke="#4A0505" stroke-width="3" stroke-linecap="round" />

      <!-- 黑色倒三角鼻子 -->
      <polygon points="55,64 51,59 59,59" fill="#2B0606" />

      <!-- 露出尖尖惡魔虎牙的小壞笑嘴巴 -->
      <path d="M 48 68 Q 55 75 62 68" stroke="#4A0505" stroke-width="2.5" stroke-linecap="round" fill="#590D22" />
      <!-- 小虎牙 -->
      <polygon points="49,69 51,73 53,69" fill="#FFFDF8" />
      <polygon points="57,69 59,73 61,69" fill="#FFFDF8" />

      <!-- 惡魔黃金三叉戟 (Trident 🔱) -->
      <g class="devil-trident" transform="translate(10, 0)">
        <line x1="86" y1="36" x2="86" y2="98" stroke="#FFB703" stroke-width="3.5" stroke-linecap="round" />
        <path d="M 76 46 Q 86 52 96 46 L 96 36 M 86 48 L 86 30 M 76 36 L 76 46" stroke="#FFB703" stroke-width="3" fill="none" stroke-linecap="round" />
        <!-- 三叉戟頂端尖刺 -->
        <polygon points="76,34 74,38 78,38" fill="#FFB703" />
        <polygon points="86,28 84,32 88,32" fill="#FFB703" />
        <polygon points="96,34 94,38 98,38" fill="#FFB703" />
      </g>
    </svg>
  `,

  scarf: `
    <svg viewBox="0 0 120 108" class="w-full h-full drop-shadow-sm transition-all duration-300 overflow-visible">
      <!-- 尾巴 (右側向上捲曲的柴柴尾巴) -->
      <path d="M 85 68 C 96 60 107 58 108 68 C 109 78 98 84 89 79 Z" fill="#E89E53" stroke="#4A3425" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 97 64 C 102 62 105 66 103 71" fill="none" stroke="#FFF7ED" stroke-width="3" stroke-linecap="round" />

      <!-- 身體 (圍巾下方的小小身軀) -->
      <path d="M 38 74 L 36 94 L 84 94 L 82 74 Z" fill="#E89E53" stroke="#4A3425" stroke-width="2.5" />
      <rect x="44" y="76" width="32" height="18" rx="8" fill="#FFFDF8" stroke="#4A3425" stroke-width="1.5" />
      <!-- 前腳細節 -->
      <line x1="53" y1="84" x2="53" y2="94" stroke="#4A3425" stroke-width="2" stroke-linecap="round" />
      <line x1="67" y1="84" x2="67" y2="94" stroke="#4A3425" stroke-width="2" stroke-linecap="round" />

      <!-- 圍巾 (米杏色溫暖針織圍巾，厚厚包裹) -->
      <g id="scarf-group">
        <path d="M 30 62 C 30 55 42 52 60 52 C 78 52 90 55 90 62 C 90 71 78 74 60 74 C 42 74 30 71 30 62 Z" fill="#D9C3A5" stroke="#4A3425" stroke-width="2.5" />
        <!-- 圍巾針織紋理線 -->
        <path d="M 40 58 Q 60 56 80 58" fill="none" stroke="#B8A082" stroke-width="1.5" stroke-linecap="round" />
        <path d="M 38 66 Q 60 68 82 66" fill="none" stroke="#B8A082" stroke-width="1.5" stroke-linecap="round" />
        <!-- 圍巾垂墜打結部分 (右側) -->
        <path d="M 72 64 L 76 82 L 86 80 L 82 62 Z" fill="#CBB292" stroke="#4A3425" stroke-width="2.2" />
        <line x1="77" y1="82" x2="85" y2="80" stroke="#4A3425" stroke-width="2" stroke-dasharray="1.5 1.5" />
      </g>

      <!-- 柴犬耳朵 (左耳與右耳) -->
      <path d="M 32 28 L 44 6 L 54 24 Z" fill="#E89E53" stroke="#4A3425" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 36 24 L 44 12 L 50 22 Z" fill="#FFFDF8" />
      <path d="M 88 28 L 76 6 L 66 24 Z" fill="#E89E53" stroke="#4A3425" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 84 24 L 76 12 L 70 22 Z" fill="#FFFDF8" />

      <!-- 柴犬大圓頭 -->
      <ellipse cx="60" cy="36" rx="30" ry="26" fill="#E89E53" stroke="#4A3425" stroke-width="2.5" />

      <!-- 臉頰兩側白色毛斑 -->
      <path d="M 35 38 C 35 52 48 58 60 58 C 72 58 85 52 85 38 C 80 44 72 45 60 45 C 48 45 40 44 35 38 Z" fill="#FFFDF8" stroke="#4A3425" stroke-width="1.5" />

      <!-- 兩顆超大亮晶晶水汪汪眼睛 (完全還原參考圖) -->
      <ellipse cx="48" cy="34" rx="5.5" ry="6.5" fill="#2E2018" />
      <circle cx="46.5" cy="32" r="2.2" fill="#FFFFFF" />
      <circle cx="50" cy="36" r="1.2" fill="#FFFFFF" />

      <ellipse cx="72" cy="34" rx="5.5" ry="6.5" fill="#2E2018" />
      <circle cx="70.5" cy="32" r="2.2" fill="#FFFFFF" />
      <circle cx="74" cy="36" r="1.2" fill="#FFFFFF" />

      <!-- 眉毛 (溫柔小短弧) -->
      <path d="M 44 24 Q 48 22 52 24" fill="none" stroke="#B87333" stroke-width="2" stroke-linecap="round" />
      <path d="M 68 24 Q 72 22 76 24" fill="none" stroke="#B87333" stroke-width="2" stroke-linecap="round" />

      <!-- 圓滾滾粉紅腮紅 (兩頰) -->
      <ellipse cx="38" cy="42" rx="5.5" ry="3.5" fill="#F8B5A5" opacity="0.85" />
      <ellipse cx="82" cy="42" rx="5.5" ry="3.5" fill="#F8B5A5" opacity="0.85" />

      <!-- 小巧可愛黑鼻子與微笑嘴型 -->
      <ellipse cx="60" cy="41" rx="2.5" ry="2" fill="#2E2018" />
      <path d="M 56 44 Q 60 47 64 44" fill="none" stroke="#2E2018" stroke-width="2" stroke-linecap="round" />
      <path d="M 57 45 Q 60 50 63 45" fill="#E26D5C" stroke="#2E2018" stroke-width="1.2" />
    </svg>
  `
};

class ShibaBuddy {
  constructor(storageInstance) {
    this.storage = storageInstance;
  }

  getAvatar(mood = 'happy') {
    if (mood === 'scarf' || mood === 'hero') return SHIBA_AVATARS.scarf;
    return SHIBA_AVATARS[mood] || SHIBA_AVATARS.happy;
  }

  /**
   * 根據使用者的真實財務數據，動態分析並生成溫暖、幽默的金句與建議
   */
  generateInsight(yearMonth) {
    const summary = this.storage.getMonthlySummary(yearMonth);
    const budgetStatuses = this.storage.getBudgetStatuses(yearMonth);
    const debtStats = this.storage.getDebtStats();

    // 0. 空資料狀態
    if (summary.count === 0) {
      return {
        mood: 'calm',
        tag: '🌱 歡迎來到 Money Buddy',
        text: '這本手帳目前還是全新的呢！記錄下今天的第一杯奶茶或午餐吧～如果想快速看看功能，也可以點擊右上角「載入示範資料」喔！🐾'
      };
    }

    // 1. 檢查是否有超支嚴重的預算
    const dangerBudget = budgetStatuses.find(b => b.alertLevel === 'danger');
    if (dangerBudget) {
      return {
        mood: 'warning',
        tag: '🚨 預算超支警示',
        text: `汪嗚！這個月的「${dangerBudget.category}」已經花了 NT$ ${dangerBudget.spent.toLocaleString()}，超出原本設定的預算 NT$ ${Math.abs(dangerBudget.remaining).toLocaleString()} 囉！月底柴柴陪你一起吃學餐省省荷包～💪`
      };
    }

    // 2. 檢查是否有即將達到 80% 的預算
    const warningBudget = budgetStatuses.find(b => b.alertLevel === 'warning');
    if (warningBudget) {
      return {
        mood: 'warning',
        tag: '💛 預算溫柔提醒',
        text: `注意到了嗎？「${warningBudget.category}」預算已經使用了 ${warningBudget.percent}%！還剩下 NT$ ${warningBudget.remaining.toLocaleString()} 可以運用，記得稍微踩個煞車喔！👀`
      };
    }

    // 3. 檢查逾期借款
    if (debtStats.overdueCount > 0) {
      return {
        mood: 'warning',
        tag: '💸 借貸追蹤提醒',
        text: `柴柴筆記本顯示：目前有 ${debtStats.overdueCount} 筆朋友借款已經超過預計還款日囉！總共還有 NT$ ${debtStats.totalUncollected.toLocaleString()} 還沒收回，快去「借貸管理」挑個合適的話術提醒對方吧！`
      };
    }

    // 4. 收支赤字 (支出 > 收入)
    if (summary.totalIncome > 0 && summary.totalExpense > summary.totalIncome) {
      const deficit = summary.totalExpense - summary.totalIncome;
      return {
        mood: 'warning',
        tag: '📉 本月開銷稍微赤字',
        text: `這個月支出比收入多出了 NT$ ${deficit.toLocaleString()} 喔！別慌，先看看最大筆花費在哪裡，如果是剛好繳交學雜費或房租就不用太自責，下個月再補回來～🐾`
      };
    }

    // 5. 優秀的儲蓄進度
    if (summary.totalIncome > 0 && summary.savingsRate >= 30) {
      return {
        mood: 'happy',
        tag: '🎉 理財高手就是你',
        text: `太厲害了汪！這個月的儲蓄率竟然高達 ${summary.savingsRate}%，淨存下了 NT$ ${summary.balance.toLocaleString()}！你離財務自由又前進了一大步，柴柴為你瘋狂搖尾巴！🐶✨`
      };
    }

    // 6. 一般良好收支狀況
    const topExpCategory = Object.entries(summary.categoryExpenses).sort((a, b) => b[1] - a[1])[0];
    if (topExpCategory) {
      const percent = Math.round((topExpCategory[1] / summary.totalExpense) * 100);
      return {
        mood: 'happy',
        tag: '☕ 柴柴消費洞察',
        text: `本月目前花最多的是「${topExpCategory[0]}」，佔了總支出的 ${percent}%（NT$ ${topExpCategory[1].toLocaleString()}）。整體收支仍在健康範圍，繼續保持記帳好習慣喔！🐾`
      };
    }

    return {
      mood: 'calm',
      tag: '✨ 每日小叮嚀',
      text: '「每一筆記帳，都是未來實現夢想的磚塊。」今天也要開心過生活、聰明管荷包喔！'
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ShibaBuddy, SHIBA_AVATARS };
}
