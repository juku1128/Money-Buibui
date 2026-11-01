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
  `
};

class ShibaBuddy {
  constructor(storageInstance) {
    this.storage = storageInstance;
  }

  getAvatar(mood = 'happy') {
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
