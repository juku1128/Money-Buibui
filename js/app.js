/**
 * Money Buddy — 主應用程式控制器 (App Controller)
 * 串接 Local-first Storage、Chart.js、柴柴小助手與 8 大催款話術產生器
 */

class MoneyBuddyApp {
  constructor() {
    this.currentView = 'dashboard';
    this.activeStyle = 'gentle';
    this.pendingHellStyle = null;
    this.charts = {};
    this.mascot = new ShibaBuddy(mbStorage);

    // AI 催款話術狀態
    this.currentGeneratedScripts = [];
    this.scriptGenerationSource = 'local_engine';
    this.isAiGenerating = false;

    // 取得當前月份 (YYYY-MM)
    const now = new Date();
    this.currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.dashboardMonth = this.currentMonth;
    this.planningTargetMonth = this.currentMonth;
    this.isAllMonths = false;
  }

  init() {
    // 檢查是否有手帳，若無則預設建立一本
    let activeProfile = mbStorage.getActiveProfile();
    if (!activeProfile) {
      const profiles = mbStorage.getProfiles();
      if (profiles.length > 0) {
        mbStorage.setActiveProfile(profiles[0].id);
        activeProfile = profiles[0];
      } else {
        activeProfile = mbStorage.createProfile('我的手帳');
        // 預設填入示範資料以利第一次體驗
        mbStorage.loadDemoData();
      }
    }

    this.updateProfileDisplay();
    this.setupDateInputs();
    this.switchView('dashboard');
    this.initLucideIcons();
    this.checkAiStatus();
  }

  initLucideIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const isError = type === 'error';
    const bg = isError ? 'bg-red-500 text-white' : 'bg-stone-800 text-white';
    const icon = isError ? '⚠️' : '✨';

    toast.className = `toast-item px-4 py-2.5 rounded-2xl shadow-lg text-xs font-semibold flex items-center space-x-2 ${bg}`;
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  setupDateInputs() {
    // 預設月份選擇器
    const txMonth = document.getElementById('tx-filter-month');
    if (txMonth) txMonth.value = this.currentMonth;

    const anaMonth = document.getElementById('analysis-month');
    if (anaMonth) anaMonth.value = this.currentMonth;

    const planMonth = document.getElementById('plan-target-month');
    if (planMonth) planMonth.value = this.planningTargetMonth;

    const todayStr = typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().split('T')[0];
    const txDate = document.getElementById('tx-input-date');
    if (txDate) txDate.value = todayStr;

    const debtBorrowDate = document.getElementById('debt-input-borrow-date');
    if (debtBorrowDate) debtBorrowDate.value = todayStr;

    const scriptBorrowDate = document.getElementById('script-param-borrow-date');
    if (scriptBorrowDate && !scriptBorrowDate.value) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000);
      scriptBorrowDate.value = typeof getLocalDateString === 'function' ? getLocalDateString(fourteenDaysAgo) : fourteenDaysAgo.toISOString().split('T')[0];
    }
  }

  updateProfileDisplay() {
    const profile = mbStorage.getActiveProfile();
    const nameEl = document.getElementById('current-profile-name');
    if (nameEl) {
      nameEl.textContent = profile ? profile.nickname : '未選擇手帳';
    }
  }

  // --- 分頁切換 (View Switching) ---

  switchView(viewName) {
    this.currentView = viewName;

    const views = ['dashboard', 'transactions', 'planning', 'analysis', 'debts'];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.toggle('hidden', v !== viewName);

      // 電腦版分頁標籤樣式
      const navBtn = document.getElementById(`nav-btn-${v}`);
      if (navBtn) {
        if (v === viewName) {
          navBtn.className = 'nav-tab px-4 py-2 rounded-xl text-coral-500 bg-white shadow-sm transition-all flex items-center gap-1.5 font-bold';
        } else {
          navBtn.className = 'nav-tab px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 transition-all flex items-center gap-1.5 font-medium';
        }
      }

      // 底部導航分頁樣式
      const mobBtn = document.getElementById(`mob-nav-${v}`);
      if (mobBtn) {
        if (v === viewName) {
          mobBtn.className = 'handbook-nav-btn active';
        } else {
          mobBtn.className = 'handbook-nav-btn';
        }
      }
    });

    // 渲染特定頁面
    if (viewName === 'dashboard') this.renderDashboard();
    else if (viewName === 'transactions') this.renderTransactionsView();
    else if (viewName === 'planning') this.renderPlanningView();
    else if (viewName === 'analysis') this.renderAnalysisView();
    else if (viewName === 'debts') this.renderDebtsView();

    // 若切換至其他頁面，安全熄滅地獄之火視覺效果
    if (viewName !== 'debts' && document.body.classList.contains('hell-mode-active')) {
      this.enableHellModeVisuals(false);
    }

    this.initLucideIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= 1. 首頁 (Dashboard) =================

  shiftMonth(yearMonthStr, offset) {
    const parts = (yearMonthStr || this.currentMonth).split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = new Date(y, m - 1 + offset, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }

  prevDashboardMonth() {
    const cur = this.dashboardMonth || this.currentMonth;
    this.dashboardMonth = this.shiftMonth(cur, -1);
    this.renderDashboard();
  }

  nextDashboardMonth() {
    const cur = this.dashboardMonth || this.currentMonth;
    this.dashboardMonth = this.shiftMonth(cur, 1);
    this.renderDashboard();
  }

  resetDashboardToCurrentMonth() {
    this.dashboardMonth = this.currentMonth;
    this.renderDashboard();
  }

  onDashboardMonthPickerChange(val) {
    if (val) {
      this.dashboardMonth = val;
      this.renderDashboard();
    }
  }

  goToTransactionsForDashboardMonth() {
    const targetMonth = this.dashboardMonth || this.currentMonth;
    this.goToTransactionsForMonth(targetMonth);
  }

  goToTransactionsForMonth(month) {
    this.isAllMonths = false;
    const monthInput = document.getElementById('tx-filter-month');
    if (monthInput) {
      monthInput.value = month;
      monthInput.classList.remove('opacity-40');
    }
    const btn = document.getElementById('tx-filter-all-btn');
    if (btn) btn.className = 'px-2.5 py-1.5 rounded-xl border border-cream-200 text-xs font-medium text-stone-600 hover:text-stone-900 bg-cream-100 transition';
    this.switchView('transactions');
  }

  goToAnalysisForDashboardMonth() {
    const targetMonth = this.dashboardMonth || this.currentMonth;
    const anaMonth = document.getElementById('analysis-month');
    if (anaMonth) anaMonth.value = targetMonth;
    this.switchView('analysis');
  }

  renderDashboard() {
    const targetMonth = this.dashboardMonth || this.currentMonth;
    const isCurrent = targetMonth === this.currentMonth;
    const summary = mbStorage.getMonthlySummary(targetMonth);

    // 月份格式化 (例如：2026 年 11 月)
    const [year, mon] = targetMonth.split('-');
    const formattedMonth = `${year} 年 ${parseInt(mon, 10)} 月`;

    const monthDisplayEl = document.getElementById('dashboard-month-display');
    if (monthDisplayEl) monthDisplayEl.textContent = formattedMonth;

    const currentBadge = document.getElementById('dashboard-is-current-badge');
    if (currentBadge) currentBadge.classList.toggle('hidden', !isCurrent);

    const backTodayBtn = document.getElementById('dash-back-today-btn');
    if (backTodayBtn) backTodayBtn.classList.toggle('hidden', isCurrent);

    const monthPicker = document.getElementById('dashboard-month-picker');
    if (monthPicker) monthPicker.value = targetMonth;

    const monthEl = document.getElementById('dashboard-current-month');
    if (monthEl) monthEl.textContent = targetMonth;

    // 數字卡片與膠囊條更新
    const incEl = document.getElementById('dash-income');
    const expEl = document.getElementById('dash-expense');
    const balEl = document.getElementById('dash-balance');
    const savRateEl = document.getElementById('dash-savings-rate');
    const savBarEl = document.getElementById('dash-savings-bar');

    if (incEl) incEl.textContent = `NT$ ${summary.totalIncome.toLocaleString()}`;
    if (expEl) expEl.textContent = `NT$ ${summary.totalExpense.toLocaleString()}`;
    if (balEl) balEl.textContent = `NT$ ${summary.balance.toLocaleString()}`;
    if (savRateEl) savRateEl.textContent = `${summary.savingsRate}%`;
    if (savBarEl) savBarEl.style.width = `${Math.min(100, summary.savingsRate)}%`;

    // 雙色膠囊進度條更新
    const maxFlow = Math.max(summary.totalIncome, summary.totalExpense, 1000);
    const incBar = document.getElementById('dash-income-bar');
    const expBar = document.getElementById('dash-expense-bar');
    if (incBar) {
      const incPct = summary.totalIncome > 0 ? Math.min(100, Math.max(15, Math.round((summary.totalIncome / maxFlow) * 100))) : 0;
      incBar.style.width = `${incPct}%`;
    }
    if (expBar) {
      const expPct = summary.totalExpense > 0 ? Math.min(100, Math.max(15, Math.round((summary.totalExpense / maxFlow) * 100))) : 0;
      expBar.style.width = `${expPct}%`;
    }

    // 柴柴小助手互動回饋 (使用專屬溫暖圍巾萌柴柴頭像)
    const insight = this.mascot.generateInsight(targetMonth);
    const avatarEl = document.getElementById('shiba-avatar-container');
    if (avatarEl) {
      avatarEl.innerHTML = this.mascot.getAvatar('scarf');
    }
    const tagEl = document.getElementById('shiba-tag');
    if (tagEl) tagEl.textContent = isCurrent ? insight.tag : `📅 ${formattedMonth} 紀錄分析`;
    const msgEl = document.getElementById('shiba-message');
    if (msgEl) {
      msgEl.textContent = insight.text || '哈囉！快來記錄今天的生活開銷吧！！🌸';
    }

    // 渲染卡片一：迷你月度趨勢柱狀圖 (還原參考圖的 1~6 月粉彩長條圖)
    this.renderDashboardMiniTrendChart(targetMonth);

    // 渲染卡片二：學生主要生活分類預算列表
    this.renderStudentBudgetList(targetMonth);

    // 渲染卡片三：每日預算提醒動態儀表與錦囊
    this.renderDailyBudgetReminder(targetMonth);

    // 借貸警告橫幅
    const debtStats = mbStorage.getDebtStats();
    const alertBanner = document.getElementById('dash-debt-alert-banner');
    if (alertBanner) {
      if (debtStats.totalUncollected > 0) {
        alertBanner.classList.remove('hidden');
        const alertText = document.getElementById('dash-debt-alert-text');
        if (alertText) {
          alertText.textContent = `目前共有 NT$ ${debtStats.totalUncollected.toLocaleString()} 尚未收回，其中 ${debtStats.overdueCount} 筆已逾期！`;
        }
      } else {
        alertBanner.classList.add('hidden');
      }
    }

    // 本月消費分類甜甜圈圖
    this.renderDashboardCategoryChart(summary.categoryExpenses);

    // 該月份記帳 (取前 5 筆)
    const monthTxs = mbStorage.getTransactions({ month: targetMonth }).slice(0, 5);
    const recentList = document.getElementById('dash-recent-list');
    if (monthTxs.length === 0) {
      recentList.innerHTML = `<div class="py-6 text-center text-stone-400 text-xs">此月份（${targetMonth}）尚無記帳紀錄～</div>`;
    } else {
      recentList.innerHTML = monthTxs.map(t => {
        const isInc = t.type === 'income';
        const amtClass = isInc ? 'text-matcha-600' : 'text-coral-500';
        const sign = isInc ? '+' : '-';
        return `
          <div class="py-2.5 flex items-center justify-between hover:bg-cream-100/50 px-2 rounded-xl transition">
            <div class="flex items-center space-x-2.5">
              <span class="w-2 h-2 rounded-full ${isInc ? 'bg-matcha-500' : 'bg-coral-400'}"></span>
              <div>
                <p class="font-bold text-stone-800">${t.category} <span class="font-normal text-stone-400 text-[11px] ml-1">${t.note || ''}</span></p>
                <p class="text-[10px] text-stone-400">${t.date}</p>
              </div>
            </div>
            <div class="font-mono font-bold ${amtClass}">
              ${sign}NT$ ${t.amount.toLocaleString()}
            </div>
          </div>
        `;
      }).join('');
    }

    this.initLucideIcons();
  }

  renderDashboardCategoryChart(catExpenses) {
    const ctx = document.getElementById('dashCategoryChart');
    if (!ctx) return;

    const entries = Object.entries(catExpenses).filter(([_, amt]) => amt > 0);
    const emptyEl = document.getElementById('dashCategoryEmpty');

    if (entries.length === 0) {
      if (this.charts.dashCategory) this.charts.dashCategory.destroy();
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    const labels = entries.map(e => e[0]);
    const data = entries.map(e => e[1]);
    const colors = ['#F4A261', '#E76F51', '#2A9D8F', '#E9C46A', '#A3B18A', '#D4A373', '#FFCAD4', '#457B9D', '#6D6875'];

    if (this.charts.dashCategory) this.charts.dashCategory.destroy();

    this.charts.dashCategory = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#FFFDF9'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 10,
              font: { size: 10, family: 'system-ui' },
              color: '#4A4E69'
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  renderDashboardMiniTrendChart(targetMonth) {
    const canvas = document.getElementById('dashTrendMiniChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const [y, m] = targetMonth.split('-').map(Number);
    const months = [];
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const ymStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(ymStr);
      labels.push(`${d.getMonth() + 1}月`);
    }

    const dataPoints = months.map(ym => {
      const s = mbStorage.getMonthlySummary(ym);
      return s.totalExpense > 0 ? Math.round(s.totalExpense / 100) : 0;
    });

    const hasData = dataPoints.some(v => v > 0);
    const displayData = hasData ? dataPoints : [110, 220, 260, 140, 180, 255];

    if (this.charts.miniTrend) {
      this.charts.miniTrend.destroy();
    }

    const pastelColors = [
      '#94A886', // 1月 抹茶
      '#94A886', // 2月 抹茶
      '#D9C3A5', // 3月 奶茶
      '#E8ADA4', // 4月 櫻花
      '#E8ADA4', // 5月 櫻花
      '#E68A75'  // 6月 珊瑚
    ];

    this.charts.miniTrend = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: displayData,
          backgroundColor: pastelColors,
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.65
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: c => ` 支出約 NT$ ${(c.raw * 100).toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10, family: '-apple-system, sans-serif' },
              color: '#8A7E75'
            }
          },
          y: {
            min: 0,
            max: Math.max(300, ...displayData) + 20,
            grid: { color: '#F1ECE2' },
            ticks: {
              stepSize: 100,
              font: { size: 9, family: '-apple-system, sans-serif' },
              color: '#8A7E75'
            }
          }
        }
      }
    });
  }

  renderStudentBudgetList(targetMonth) {
    const summary = mbStorage.getMonthlySummary(targetMonth);
    const exp = summary.categoryExpenses || {};
    const totalExp = summary.totalExpense || 0;

    const foodSpent = exp['飲食'] || exp['拉麵'] || exp['餐費'] || 0;
    const drinkSpent = exp['飲料'] || exp['珍奶'] || exp['手搖'] || 0;
    const bookSpent = exp['書籍'] || exp['課本'] || exp['學習'] || exp['教育'] || 0;
    const transitSpent = exp['交通'] || exp['捷運'] || exp['公車'] || 0;

    const calcPct = (spent, defPct) => {
      if (totalExp > 0) return Math.min(100, Math.round((spent / totalExp) * 100));
      return defPct;
    };

    const foodPct = calcPct(foodSpent, 40);
    const drinkPct = calcPct(drinkSpent, 20);
    const bookPct = calcPct(bookSpent, 20);
    const transitPct = calcPct(transitSpent, 20);

    const setBar = (pctId, barId, pct) => {
      const pEl = document.getElementById(pctId);
      const bEl = document.getElementById(barId);
      if (pEl) pEl.textContent = `${pct}%`;
      if (bEl) bEl.style.width = `${Math.max(5, pct)}%`;
    };

    setBar('budget-pct-food', 'budget-bar-food', foodPct);
    setBar('budget-pct-drink', 'budget-bar-drink', drinkPct);
    setBar('budget-pct-books', 'budget-bar-books', bookPct);
    setBar('budget-pct-transit', 'budget-bar-transit', transitPct);
  }

  renderDailyBudgetReminder(targetMonth) {
    const todayStr = getLocalDateString();
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const todayDateNum = now.getDate();
    const daysRemaining = Math.max(1, daysInMonth - todayDateNum + 1);

    const summary = mbStorage.getMonthlySummary(targetMonth);
    const tracking = mbStorage.getMonthlyBudgetTracking(targetMonth);

    // Determine monthly budget baseline
    let monthlyBudget = 15000;
    if (tracking && tracking.hasConfirmedBudget && tracking.totalBudget > 0) {
      monthlyBudget = tracking.totalBudget;
    } else if (summary.totalIncome > 0) {
      monthlyBudget = summary.totalIncome;
    }

    // Today's total expenses
    const todayTxs = mbStorage.getTransactions().filter(t => t.date === todayStr && t.type === 'expense');
    const todaySpent = todayTxs.reduce((sum, t) => sum + t.amount, 0);

    // Calculate suggested daily budget
    const remainingMonthBudget = Math.max(0, monthlyBudget - summary.totalExpense);
    const dailyLimit = Math.max(150, Math.round(remainingMonthBudget / daysRemaining));
    const todayRemaining = dailyLimit - todaySpent;
    const dailyPercent = Math.min(100, Math.round((todaySpent / dailyLimit) * 100));

    // Update Card 3 DOM
    const dateEl = document.getElementById('daily-budget-today-date');
    if (dateEl) dateEl.textContent = `${now.getMonth() + 1}月${todayDateNum}日 (今天)`;

    const limitEl = document.getElementById('daily-budget-limit');
    if (limitEl) limitEl.textContent = dailyLimit.toLocaleString();

    const spentEl = document.getElementById('daily-budget-spent');
    if (spentEl) spentEl.textContent = todaySpent.toLocaleString();

    const barEl = document.getElementById('daily-budget-bar');
    if (barEl) {
      barEl.style.width = `${Math.max(5, dailyPercent)}%`;
      if (todaySpent > dailyLimit) {
        barEl.className = 'pill-fill pill-fill-coral';
      } else {
        barEl.className = 'pill-fill pill-fill-matcha';
      }
    }

    const remTextEl = document.getElementById('daily-budget-remaining-text');
    if (remTextEl) {
      if (todaySpent > dailyLimit) {
        remTextEl.innerHTML = `超額 NT$ <strong id="daily-budget-remaining" class="font-mono text-[#E68A75]">${(todaySpent - dailyLimit).toLocaleString()}</strong>`;
      } else {
        remTextEl.innerHTML = `剩餘 NT$ <strong id="daily-budget-remaining" class="font-mono text-[#588157]">${todayRemaining.toLocaleString()}</strong>`;
      }
    }

    const statusTag = document.getElementById('daily-budget-status-tag');
    if (statusTag) {
      if (todaySpent === 0) {
        statusTag.className = 'text-[10px] text-[#38512F] bg-[#E9F1E8] px-2 py-0.5 rounded-full inline-block font-semibold';
        statusTag.textContent = '🌱 今日尚未記帳，花了錢隨手記錄一下吧！';
      } else if (todaySpent > dailyLimit) {
        statusTag.className = 'text-[10px] text-[#C1121F] bg-[#FFEAE8] px-2 py-0.5 rounded-full inline-block font-semibold';
        statusTag.textContent = `⚠️ 今日已超額 NT$ ${(todaySpent - dailyLimit).toLocaleString()}，晚餐稍微克制一下荷包～💪`;
      } else {
        statusTag.className = 'text-[10px] text-[#38512F] bg-[#E9F1E8] px-2 py-0.5 rounded-full inline-block font-semibold';
        statusTag.textContent = '🌟 支出在安全範圍內，控制得很好喔！';
      }
    }

    // Friendly college student tips
    const tips = [
      '每天睡前花 30 秒隨手記帳，把固定開銷與生活費分開，月底荷包就不會莫名哭泣囉！🌸',
      '外食點手搖飲或加點甜點前停三秒，分辨是「想要」還是「需要」，一週輕鬆多存 300 元！🧋',
      '全聯採買生活用品前先列清單，避免在零食區被衝動誘惑，省錢超有感～🛒',
      '悠遊卡定期票省下通勤費，小錢累積成大確幸，期末還能吃頓大餐慶祝！🚇',
      '月初先把儲蓄金或必要房租扣除，剩下的才是可以安心自由運用的生活費喔！✨'
    ];
    const tipEl = document.getElementById('daily-budget-tip-text');
    if (tipEl) {
      tipEl.textContent = tips[todayDateNum % tips.length];
    }
  }

  triggerShibaWiggle() {
    const container = document.getElementById('shiba-avatar-container');
    if (!container) return;
    container.classList.add('animate-bounce');
    setTimeout(() => container.classList.remove('animate-bounce'), 1000);
    const cuteSounds = [
      '汪汪！今天也有好好記錄每一筆生活開銷嗎？🌸',
      '摸摸頭～柴柴會幫你守護好錢包的！🐾',
      '生活不容易，但今天吃碗熱拉麵還是很值得的～🍜',
      '省下一杯珍奶，離夢想基金又近了一小步！✨',
      '今天也很棒喔！柴柴永遠是你的理財神隊友！🐕'
    ];
    const rand = cuteSounds[Math.floor(Math.random() * cuteSounds.length)];
    const msg = document.getElementById('shiba-message');
    if (msg) msg.textContent = rand;
  }

  // ================= 2. 記帳列表 (Transactions) =================

  toggleAllMonthsFilter(forceAll = null) {
    if (forceAll !== null) {
      this.isAllMonths = forceAll;
    } else {
      this.isAllMonths = !this.isAllMonths;
    }
    const btn = document.getElementById('tx-filter-all-btn');
    const monthInput = document.getElementById('tx-filter-month');
    if (this.isAllMonths) {
      if (btn) btn.className = 'px-2.5 py-1.5 rounded-xl border border-coral-500 text-xs font-bold text-white bg-coral-500 shadow-sm transition';
      if (monthInput) monthInput.classList.add('opacity-40');
    } else {
      if (btn) btn.className = 'px-2.5 py-1.5 rounded-xl border border-cream-200 text-xs font-medium text-stone-600 hover:text-stone-900 bg-cream-100 transition';
      if (monthInput) {
        monthInput.classList.remove('opacity-40');
        if (!monthInput.value) monthInput.value = this.currentMonth;
      }
    }
    this.renderTransactionsView();
  }

  onTxMonthInputChange() {
    this.isAllMonths = false;
    const btn = document.getElementById('tx-filter-all-btn');
    const monthInput = document.getElementById('tx-filter-month');
    if (btn) btn.className = 'px-2.5 py-1.5 rounded-xl border border-cream-200 text-xs font-medium text-stone-600 hover:text-stone-900 bg-cream-100 transition';
    if (monthInput) monthInput.classList.remove('opacity-40');
    this.renderTransactionsView();
  }

  selectCategoryFilter(cat) {
    const select = document.getElementById('tx-filter-category');
    if (select) {
      select.value = cat;
    }
    this.renderTransactionsView();
  }

  renderCategoryChips(month, currentCat) {
    const chipsContainer = document.getElementById('tx-category-chips-bar');
    if (!chipsContainer) return;

    const tracking = mbStorage.getMonthlyBudgetTracking(month);
    const trackingMap = {};
    if (tracking && tracking.categories) {
      tracking.categories.forEach(c => {
        trackingMap[c.category] = c;
      });
    }

    const cats = mbStorage.getCategories();
    const allExpenseCats = cats.expense || [];

    // Chip for "全部"
    const isAllActive = !currentCat || currentCat === 'all';
    let html = `
      <button type="button" onclick="app.selectCategoryFilter('all')" class="category-chip ${isAllActive ? 'active' : ''}">
        <span>✨ 全部收支</span>
      </button>
    `;

    allExpenseCats.forEach(cat => {
      const isActive = currentCat === cat;
      const c = trackingMap[cat];
      const icon = CATEGORY_ICONS[cat] || '🏷️';
      let badgeHtml = '';
      let chipClass = '';

      if (c && c.hasBudget) {
        if (c.colorLevel === 'red') chipClass = 'chip-danger';
        else if (c.colorLevel === 'orange') chipClass = 'chip-warn';
        badgeHtml = `<span class="chip-badge">${c.percent}% · NT$ ${c.spent.toLocaleString()}</span>`;
      } else if (c && c.spent > 0) {
        badgeHtml = `<span class="chip-badge">NT$ ${c.spent.toLocaleString()}</span>`;
      }

      html += `
        <button type="button" onclick="app.selectCategoryFilter('${cat}')" class="category-chip ${isActive ? 'active' : ''} ${chipClass}">
          <span>${icon} ${cat}</span>
          ${badgeHtml}
        </button>
      `;
    });

    chipsContainer.innerHTML = html;
  }

  renderTransactionsView() {
    const monthInput = document.getElementById('tx-filter-month');
    const month = this.isAllMonths ? 'all' : ((monthInput && monthInput.value) ? monthInput.value : this.currentMonth);
    const type = document.getElementById('tx-filter-type').value;
    const category = document.getElementById('tx-filter-category').value;

    // 即時渲染本月預算追蹤面板 (全部月份模式下以當前月份為準)
    const trackingMonth = this.isAllMonths ? this.currentMonth : month;
    this.renderMonthlyBudgetTracking(trackingMonth);

    // 更新分類選單與上方互動式分類預算膠囊
    this.populateCategoryFilter();
    this.renderCategoryChips(trackingMonth, category);

    const txs = mbStorage.getTransactions({ month, type, category });
    const tableContainer = document.getElementById('tx-table-container');
    const countText = this.isAllMonths ? `全部月份共 ${txs.length} 筆` : `共 ${txs.length} 筆紀錄`;
    document.getElementById('tx-total-count').textContent = countText;

    // 檢查是否有跨月份或被篩選隱藏的紀錄
    const allProfileTxs = mbStorage.getTransactions();
    const noticeBanner = document.getElementById('tx-month-notice-banner');
    if (noticeBanner) {
      if (!this.isAllMonths && allProfileTxs.length > txs.length) {
        const otherCount = allProfileTxs.length - txs.length;
        noticeBanner.classList.remove('hidden');
        noticeBanner.innerHTML = `
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
            <div class="flex items-center gap-2">
              <span class="text-base">💡</span>
              <div>
                <span class="font-bold text-amber-900">提示：目前僅篩選 ${month} 月紀錄（${txs.length} 筆）</span>
                <p class="text-[11px] text-amber-700">手帳中其他月份或分類還有 <strong>${otherCount} 筆</strong> 記帳紀錄未列出。</p>
              </div>
            </div>
            <button onclick="app.toggleAllMonthsFilter(true)" class="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 rounded-xl text-amber-900 font-bold shrink-0 transition text-xs shadow-sm flex items-center gap-1 self-start sm:self-auto">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i> 查看所有月份
            </button>
          </div>
        `;
      } else {
        noticeBanner.classList.add('hidden');
        noticeBanner.innerHTML = '';
      }
    }

    // 計算小統計條
    let sumInc = 0, sumExp = 0;
    txs.forEach(t => {
      if (t.type === 'income') sumInc += t.amount;
      else sumExp += t.amount;
    });
    document.getElementById('tx-stat-income').textContent = `NT$ ${sumInc.toLocaleString()}`;
    document.getElementById('tx-stat-expense').textContent = `NT$ ${sumExp.toLocaleString()}`;
    document.getElementById('tx-stat-net').textContent = `NT$ ${(sumInc - sumExp).toLocaleString()}`;

    if (txs.length === 0) {
      tableContainer.innerHTML = `
        <div class="py-12 text-center text-stone-400 text-xs bg-[#FBF9F5] rounded-2xl border border-dashed border-cream-200">
          <p class="text-3xl mb-2">🍃</p>
          <p class="font-bold text-stone-600">此篩選條件下沒有找到任何記帳紀錄</p>
          <p class="text-[11px] text-stone-400 mt-1">點擊上方「記支出」或「記收入」開始記錄今天的生活花費吧！</p>
        </div>
      `;
      this.initLucideIcons();
      return;
    }

    // 按日期分組 (Daily Grouping Timeline)
    const dateGroups = {};
    txs.forEach(t => {
      const d = t.date || '未分類日期';
      if (!dateGroups[d]) dateGroups[d] = [];
      dateGroups[d].push(t);
    });

    const sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
    const todayStr = getLocalDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);
    const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

    tableContainer.innerHTML = sortedDates.map(dateKey => {
      const items = dateGroups[dateKey];
      let dayExp = 0, dayInc = 0;
      items.forEach(item => {
        if (item.type === 'income') dayInc += item.amount;
        else dayExp += item.amount;
      });

      // 格式化日期標籤
      let dateBadge = dateKey;
      let isToday = false;
      try {
        const dObj = new Date(dateKey + 'T00:00:00');
        const dayName = weekDays[dObj.getDay()] || '';
        const mm = dObj.getMonth() + 1;
        const dd = dObj.getDate();
        if (dateKey === todayStr) {
          dateBadge = `📅 今天 · ${mm}月${dd}日 (${dayName})`;
          isToday = true;
        } else if (dateKey === yesterdayStr) {
          dateBadge = `📅 昨天 · ${mm}月${dd}日 (${dayName})`;
        } else {
          dateBadge = `📅 ${dateKey} (${dayName})`;
        }
      } catch (e) {
        dateBadge = `📅 ${dateKey}`;
      }

      return `
        <div class="daily-group-card ${isToday ? 'ring-2 ring-[#94A886]/40' : ''}">
          <div class="daily-group-header flex-wrap sm:flex-nowrap gap-2">
            <span class="text-xs font-bold text-[#3D312A] flex items-center gap-1.5">
              ${dateBadge}
              ${isToday ? '<span class="text-[9px] bg-[#94A886] text-white px-1.5 py-0.5 rounded-full font-bold">TODAY</span>' : ''}
            </span>
            <div class="flex items-center gap-1.5 text-[11px] font-mono bg-white/95 px-2.5 py-1 rounded-xl border border-cream-200 shadow-2xs">
              <span class="text-[10px] font-bold text-[#7D6E66] font-sans">【每日收支】</span>
              ${dayExp > 0 ? `<span class="text-[#E68A75] font-bold">支出 NT$ ${dayExp.toLocaleString()}</span>` : '<span class="text-stone-400">支出 NT$ 0</span>'}
              <span class="text-stone-300">│</span>
              ${dayInc > 0 ? `<span class="text-[#588157] font-bold">收入 +NT$ ${dayInc.toLocaleString()}</span>` : '<span class="text-stone-400">收入 NT$ 0</span>'}
            </div>
          </div>
          <div>
            ${items.map(t => {
              const isInc = t.type === 'income';
              const sign = isInc ? '+' : '-';
              const color = isInc ? 'text-matcha-600' : 'text-coral-500';
              const badgeColor = isInc ? 'bg-matcha-100 text-matcha-700' : 'bg-coral-500/10 text-coral-600';
              const icon = CATEGORY_ICONS[t.category] || (isInc ? '💰' : '🏷️');

              return `
                <div class="daily-item-row text-xs">
                  <div class="flex items-center space-x-2.5">
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${badgeColor} flex items-center gap-1 shrink-0">
                      <span>${icon}</span>
                      <span>${t.category}</span>
                    </span>
                    <div>
                      <p class="font-bold text-[#3D312A] text-xs sm:text-sm">
                        ${t.note || t.category}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3 shrink-0">
                    <span class="font-mono font-bold text-xs sm:text-sm ${color}">
                      ${sign}NT$ ${t.amount.toLocaleString()}
                    </span>
                    <div class="flex items-center space-x-1">
                      <button onclick="app.editTransaction('${t.id}')" class="p-1 text-stone-400 hover:text-stone-700 hover:bg-cream-200 rounded-lg transition" title="編輯">
                        <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="app.deleteTransaction('${t.id}')" class="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="刪除">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    this.initLucideIcons();
  }

  renderMonthlyBudgetTracking(month) {
    const grid = document.getElementById('tx-budget-cards-grid');
    if (!grid) return;

    const tracking = mbStorage.getMonthlyBudgetTracking(month);

    if (!tracking.hasConfirmedBudget) {
      grid.innerHTML = `
        <div class="col-span-full p-6 text-center bg-cream-50 rounded-2xl border border-dashed border-cream-200">
          <p class="text-3xl mb-1">📅</p>
          <h4 class="font-bold text-stone-700 text-sm">尚未設定 ${month} 月預算</h4>
          <p class="text-xs text-stone-500 mt-1 mb-3">想要即時追蹤每筆消費是否超出額度嗎？快去理財規劃確認本月預算吧！</p>
          <button onclick="app.goToPlanningForMonth('${month}')" class="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5">
            <i data-lucide="pie-chart" class="w-4 h-4"></i> 前往確認 ${month} 月預算
          </button>
        </div>
      `;
      this.initLucideIcons();
      return;
    }

    grid.innerHTML = tracking.categories.map(c => {
      let cardStyle = 'border border-cream-200 bg-white';
      let progressColor = 'bg-matcha-500';
      let badgeStyle = 'bg-matcha-100 text-matcha-700';
      let statusTextColor = 'text-matcha-600';

      if (c.colorLevel === 'red') {
        cardStyle = 'border-2 border-red-500 bg-red-50/70 shadow-sm';
        progressColor = 'bg-red-500';
        badgeStyle = 'bg-red-100 text-red-700 font-bold';
        statusTextColor = 'text-red-600 font-bold';
      } else if (c.colorLevel === 'orange') {
        cardStyle = 'border border-amber-300 bg-amber-50/40';
        progressColor = 'bg-amber-500';
        badgeStyle = 'bg-amber-100 text-amber-800 font-bold';
        statusTextColor = 'text-amber-700 font-bold';
      } else if (c.colorLevel === 'gray') {
        cardStyle = 'border border-dashed border-cream-200 bg-cream-50/50';
        progressColor = 'bg-stone-300';
        badgeStyle = 'bg-cream-200 text-stone-500';
        statusTextColor = 'text-stone-400';
      }

      return `
        <div class="p-3.5 rounded-2xl ${cardStyle} transition-all space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-lg">${c.icon}</span>
              <span class="font-bold text-stone-800 text-xs sm:text-sm">${c.category}</span>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full ${badgeStyle}">
              ${c.hasBudget ? `${c.percent}%` : '未設額度'}
            </span>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-stone-500">
                已花 <strong class="${c.isOver ? 'text-red-600 font-mono' : 'text-stone-800 font-mono'}">NT$ ${c.spent.toLocaleString()}</strong>
                ${c.spentCount > 0 ? `<span class="text-[10px] text-stone-400 font-normal ml-0.5">(${c.spentCount} 筆)</span>` : ''}
              </span>
              <span class="text-stone-400 font-mono">
                ${c.hasBudget ? `預算 NT$ ${c.budget.toLocaleString()}` : '無預算上限'}
              </span>
            </div>

            <!-- 彩色進度條 (最大視覺寬度維持 100% 不跑版) -->
            <div class="w-full bg-cream-200/80 h-2 rounded-full overflow-hidden">
              <div class="${progressColor} h-full rounded-full transition-all duration-300" style="width: ${c.visualPercent}%"></div>
            </div>
          </div>

          <div class="pt-1 border-t border-cream-100 flex items-center justify-between text-[11px]">
            <span class="${statusTextColor} leading-tight">
              ${c.statusText}
            </span>
            ${c.hasBudget && !c.isOver && !c.isExact ? `
              <span class="text-stone-400 font-mono text-[10px] shrink-0 ml-1">
                剩餘 ${(100 - c.percent)}%
              </span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    this.initLucideIcons();
  }

  populateCategoryFilter() {
    const select = document.getElementById('tx-filter-category');
    if (!select) return;
    const currentVal = select.value;
    const cats = mbStorage.getCategories();
    const all = Array.from(new Set([...cats.income, ...cats.expense]));

    select.innerHTML = '<option value="all">所有分類</option>' +
      all.map(c => `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`).join('');
  }

  openTransactionModal(type = 'expense', editId = null) {
    const modal = document.getElementById('modal-transaction');
    const form = document.getElementById('tx-form');
    form.reset();

    const todayStr = typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().split('T')[0];
    document.getElementById('tx-edit-id').value = editId || '';
    document.getElementById('tx-input-date').value = todayStr;

    if (editId) {
      document.getElementById('tx-modal-title').innerHTML = '<i data-lucide="edit-3" class="w-4 h-4 text-coral-500"></i> 編輯記帳紀錄';
      const tx = mbStorage.getTransactions().find(t => t.id === editId);
      if (tx) {
        this.setTxModalType(tx.type);
        document.getElementById('tx-input-amount').value = tx.amount;
        document.getElementById('tx-input-category').value = tx.category;
        document.getElementById('tx-input-date').value = tx.date;
        document.getElementById('tx-input-note').value = tx.note || '';
      }
    } else {
      document.getElementById('tx-modal-title').innerHTML = '<i data-lucide="edit-3" class="w-4 h-4 text-coral-500"></i> 新增記帳紀錄';
      this.setTxModalType(type);
    }

    modal.classList.remove('hidden');
    this.initLucideIcons();
    this.updateTxModalBudgetHint();
    setTimeout(() => document.getElementById('tx-input-amount').focus(), 100);
  }

  closeTransactionModal() {
    document.getElementById('modal-transaction').classList.add('hidden');
    const editIdEl = document.getElementById('tx-edit-id');
    if (editIdEl) editIdEl.value = '';
  }

  updateTxModalBudgetHint() {
    const hint = document.getElementById('tx-modal-budget-hint');
    if (!hint) return;

    if (this.modalTxType !== 'expense') {
      hint.classList.add('hidden');
      return;
    }

    const todayStr = typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().split('T')[0];
    const dateVal = document.getElementById('tx-input-date')?.value || todayStr;
    const month = dateVal.slice(0, 7);
    const category = document.getElementById('tx-input-category')?.value;
    const amount = Number(document.getElementById('tx-input-amount')?.value) || 0;

    if (!category) {
      hint.classList.add('hidden');
      return;
    }

    const status = mbStorage.getCategoryBudgetStatus(category, month);

    if (status.hasBudget) {
      const newSpent = status.spent + amount;
      const newRemaining = status.budget - newSpent;

      if (newRemaining < 0) {
        hint.className = 'p-2.5 rounded-xl text-xs bg-red-50 border border-red-300 text-red-700 font-medium block animate-in fade-in';
        hint.innerHTML = `🚨 <strong>預算超支警示</strong>：本月「${category}」預算 NT$ ${status.budget.toLocaleString()}，目前已花 NT$ ${status.spent.toLocaleString()}。加入此筆 NT$ ${amount.toLocaleString()} 後將超額 <strong>NT$ ${Math.abs(newRemaining).toLocaleString()}</strong>（使用率 ${Math.round(newSpent / status.budget * 100)}%）！`;
      } else if (newRemaining === 0) {
        hint.className = 'p-2.5 rounded-xl text-xs bg-red-50 border border-red-300 text-red-700 font-medium block animate-in fade-in';
        hint.innerHTML = `⚠️ <strong>預算用完提示</strong>：加入此筆後，本月「${category}」預算將剛好達到 <strong>100%</strong> 全數用完！`;
      } else if ((newSpent / status.budget) >= 0.8) {
        hint.className = 'p-2.5 rounded-xl text-xs bg-amber-50 border border-amber-300 text-amber-800 font-medium block animate-in fade-in';
        hint.innerHTML = `💛 <strong>接近上限</strong>：加入此筆後將使用 ${Math.round(newSpent / status.budget * 100)}%，剩餘 NT$ ${newRemaining.toLocaleString()}。`;
      } else {
        hint.className = 'p-2.5 rounded-xl text-xs bg-cream-50 border border-cream-200 text-stone-700 block animate-in fade-in';
        hint.innerHTML = `💡 本月「${category}」預算 NT$ ${status.budget.toLocaleString()}，目前已花 NT$ ${status.spent.toLocaleString()}，記帳後將剩餘 <strong>NT$ ${newRemaining.toLocaleString()}</strong>。`;
      }
    } else {
      hint.className = 'p-2.5 rounded-xl text-xs bg-cream-50 border border-cream-200 text-stone-500 block animate-in fade-in';
      hint.innerHTML = `ℹ️ 本月「${category}」尚未設定預算額度，支出將正常記錄。`;
    }
  }

  setTxModalType(type) {
    this.modalTxType = type;
    const btnExp = document.getElementById('tx-type-btn-expense');
    const btnInc = document.getElementById('tx-type-btn-income');

    if (type === 'expense') {
      btnExp.className = 'py-1.5 rounded-lg text-xs font-bold transition bg-white text-coral-500 shadow-sm';
      btnInc.className = 'py-1.5 rounded-lg text-xs font-bold transition text-stone-500 hover:text-stone-800';
    } else {
      btnInc.className = 'py-1.5 rounded-lg text-xs font-bold transition bg-white text-matcha-600 shadow-sm';
      btnExp.className = 'py-1.5 rounded-lg text-xs font-bold transition text-stone-500 hover:text-stone-800';
    }

    // 更新分類選單
    const catSelect = document.getElementById('tx-input-category');
    const cats = mbStorage.getCategories()[type];
    catSelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');

    this.updateTxModalBudgetHint();
  }

  handleTransactionSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('tx-edit-id').value;
    const amount = Number(document.getElementById('tx-input-amount').value);
    const category = document.getElementById('tx-input-category').value;
    const date = document.getElementById('tx-input-date').value;
    const note = document.getElementById('tx-input-note').value;

    try {
      if (editId) {
        mbStorage.updateTransaction(editId, {
          type: this.modalTxType,
          amount,
          category,
          date,
          note
        });
        this.showToast('已成功更新這筆記帳紀錄！');
      } else {
        mbStorage.addTransaction({
          type: this.modalTxType,
          amount,
          category,
          date,
          note
        });
        this.showToast('記帳成功！柴柴已為您收錄進手帳～');
      }

      this.closeTransactionModal();
      this.renderTransactionsView();
      if (this.currentView === 'dashboard') this.renderDashboard();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  editTransaction(id) {
    const tx = mbStorage.getTransactions().find(t => t.id === id);
    if (!tx) return;
    this.openTransactionModal(tx.type, id);
  }

  deleteTransaction(id) {
    if (confirm('確定要刪除這筆記帳紀錄嗎？')) {
      mbStorage.deleteTransaction(id);
      this.showToast('已刪除該筆記帳紀錄');
      this.renderTransactionsView();
      if (this.currentView === 'dashboard') this.renderDashboard();
    }
  }

  promptAddCategory() {
    const newCat = prompt(`請輸入新的${this.modalTxType === 'income' ? '收入' : '支出'}分類名稱：`);
    if (newCat && newCat.trim()) {
      const ok = mbStorage.addCustomCategory(this.modalTxType, newCat.trim());
      if (ok) {
        this.setTxModalType(this.modalTxType);
        document.getElementById('tx-input-category').value = newCat.trim();
        this.showToast(`已新增分類「${newCat.trim()}」`);
      } else {
        this.showToast('該分類已存在或名稱無效', 'error');
      }
    }
  }

  // ================= 3. 理財規劃與分配試算 (Planning) =================

  goToPlanningForMonth(month) {
    this.planningTargetMonth = month;
    this.switchView('planning');
  }

  onPlanningMonthChange() {
    const input = document.getElementById('plan-target-month');
    if (input && input.value) {
      this.planningTargetMonth = input.value;
      this.renderPlanningView();
    }
  }

  renderPlanningView() {
    const targetMonth = this.planningTargetMonth || this.currentMonth;
    const monthInput = document.getElementById('plan-target-month');
    if (monthInput) monthInput.value = targetMonth;

    const confirmedBudget = mbStorage.getMonthlyBudget(targetMonth);
    const statusCard = document.getElementById('plan-confirm-status-card');
    const confirmBtnText = document.getElementById('plan-confirm-btn-text');
    const ctaTitle = document.getElementById('plan-confirm-cta-title');

    const plan = mbStorage.getFinancialPlan();
    const incomeInput = document.getElementById('plan-monthly-income');

    if (confirmedBudget && confirmedBudget.confirmed) {
      const frameworkName = confirmedBudget.framework === '50_30_20' ? '50/30/20 法則' :
                            confirmedBudget.framework === '6_jars' ? '六個罐子理財法' : '自訂比例';
      const totalCatBudget = Object.values(confirmedBudget.categories || {}).reduce((a, b) => a + Number(b || 0), 0);

      statusCard.className = 'mt-4 p-3.5 rounded-2xl border border-matcha-500 bg-matcha-100/60 text-matcha-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2';
      statusCard.innerHTML = `
        <div class="flex items-center space-x-2.5">
          <span class="text-xl">✅</span>
          <div>
            <h4 class="font-bold text-xs sm:text-sm text-matcha-800">${targetMonth} 月預算已確認！</h4>
            <p class="text-[11px] text-matcha-700">採用 ${frameworkName} | 支出預算總額 NT$ ${totalCatBudget.toLocaleString()} | 記帳自動扣款連動中</p>
          </div>
        </div>
        <span class="text-[11px] bg-matcha-600 text-white px-2.5 py-1 rounded-xl font-semibold self-start sm:self-auto shrink-0">
          已同步記帳
        </span>
      `;
      if (confirmBtnText) confirmBtnText.textContent = `重新確認 ${targetMonth} 月規劃`;
      if (ctaTitle) ctaTitle.textContent = `修改此規劃並重新套用至 ${targetMonth} 月？`;
      if (incomeInput) incomeInput.value = confirmedBudget.monthlyIncome;
    } else {
      statusCard.className = 'mt-4 p-3.5 rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2';
      statusCard.innerHTML = `
        <div class="flex items-center space-x-2.5">
          <span class="text-xl">⏳</span>
          <div>
            <h4 class="font-bold text-xs sm:text-sm text-stone-800">${targetMonth} 月尚未確認正式預算</h4>
            <p class="text-[11px] text-stone-500">請設定收入、分配架構並調整細項，按下「確認本月規劃」後將自動連動記帳頁面！</p>
          </div>
        </div>
        <span class="text-[11px] bg-amber-500 text-white px-2.5 py-1 rounded-xl font-semibold self-start sm:self-auto shrink-0">
          待確認
        </span>
      `;
      if (confirmBtnText) confirmBtnText.textContent = `確認 ${targetMonth} 月規劃`;
      if (ctaTitle) ctaTitle.textContent = `確認這份規劃為 ${targetMonth} 月正式預算？`;
      if (incomeInput && !incomeInput.value) incomeInput.value = plan.monthlyIncome || 18000;
    }

    const frameworkToUse = (confirmedBudget && confirmedBudget.framework) ? confirmedBudget.framework : (plan.framework || '50_30_20');
    this.selectPlanFramework(frameworkToUse, false);
    this.updatePlanningAllocations();
    this.renderPlanCategoryInputsGrid();
  }

  renderPlanCategoryInputsGrid() {
    const targetMonth = this.planningTargetMonth || this.currentMonth;
    const confirmedBudget = mbStorage.getMonthlyBudget(targetMonth);
    const plan = mbStorage.getFinancialPlan();
    const income = Number(document.getElementById('plan-monthly-income')?.value) || plan.monthlyIncome || 18000;

    const defaultBudgets = mbStorage.applyPlanToBudgets(this.activeFramework, income, plan.customItems);
    const currentBudgets = (confirmedBudget && confirmedBudget.categories) ? confirmedBudget.categories : defaultBudgets;

    const container = document.getElementById('plan-category-inputs-grid');
    if (!container) return;

    const expenseCats = mbStorage.getCategories().expense;

    container.innerHTML = expenseCats.map(cat => {
      const icon = CATEGORY_ICONS[cat] || '🏷️';
      const val = currentBudgets[cat] !== undefined ? currentBudgets[cat] : (defaultBudgets[cat] || 0);

      return `
        <div class="p-2.5 rounded-xl bg-white border border-cream-200 flex flex-col justify-between space-y-1">
          <div class="flex items-center justify-between text-xs font-semibold text-stone-700">
            <span>${icon} ${cat}</span>
            <span class="text-[10px] text-stone-400 font-normal">預算</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="text-stone-400 text-xs">NT$</span>
            <input type="number" min="0" step="100" data-cat="${cat}" value="${val}" class="plan-cat-budget-input w-full bg-cream-50 px-2 py-1 rounded-lg border border-cream-200 font-mono font-bold text-xs text-right outline-none focus:bg-white focus:border-coral-400 transition">
          </div>
        </div>
      `;
    }).join('');
  }

  resetPlanCategoryBudgetsToDefaults() {
    const plan = mbStorage.getFinancialPlan();
    const income = Number(document.getElementById('plan-monthly-income')?.value) || plan.monthlyIncome || 18000;
    const defaultBudgets = mbStorage.applyPlanToBudgets(this.activeFramework, income, plan.customItems);

    const inputs = document.querySelectorAll('.plan-cat-budget-input');
    inputs.forEach(input => {
      const cat = input.dataset.cat;
      input.value = defaultBudgets[cat] || 0;
    });

    this.showToast('已將各分類預算重置為理財架構建議分配值！');
  }

  confirmMonthlyPlan() {
    const targetMonth = this.planningTargetMonth || this.currentMonth;
    const income = Number(document.getElementById('plan-monthly-income')?.value) || 18000;

    const categoryBudgets = {};
    const inputs = document.querySelectorAll('.plan-cat-budget-input');
    inputs.forEach(input => {
      const cat = input.dataset.cat;
      const val = Math.max(0, Math.round(Number(input.value) || 0));
      categoryBudgets[cat] = val;
    });

    mbStorage.confirmMonthlyBudget(targetMonth, this.activeFramework, income, categoryBudgets);

    if (window.confetti) {
      window.confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }

    this.showToast(`🎉 ${targetMonth} 月理財規劃確認成功！已即時同步至記帳頁面`);
    this.renderPlanningView();
    if (this.currentView === 'transactions') {
      this.renderTransactionsView();
    }
  }

  selectPlanFramework(framework, shouldSave = true) {
    this.activeFramework = framework;

    ['50_30_20', '6_jars', 'custom'].forEach(fw => {
      const btn = document.getElementById(`plan-tab-${fw}`);
      if (btn) {
        if (fw === framework) {
          btn.className = 'plan-tab-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-stone-800 text-white shadow-sm transition border border-stone-800';
        } else {
          btn.className = 'plan-tab-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-stone-600 hover:bg-cream-100 transition border border-cream-200';
        }
      }
    });

    const customCtrl = document.getElementById('plan-custom-controls');
    if (framework === 'custom') {
      customCtrl.classList.remove('hidden');
      this.renderCustomPlanItemsEditor();
    } else {
      customCtrl.classList.add('hidden');
    }

    if (shouldSave) {
      mbStorage.saveFinancialPlan({ framework });
      this.showToast(`已切換為「${framework === '50_30_20' ? '50/30/20 法則' : framework === '6_jars' ? '六個罐子理財法' : '自訂比例'}」！`);
    }

    this.updatePlanningAllocations();
    this.resetPlanCategoryBudgetsToDefaults();
  }

  updatePlanningAllocations() {
    const incomeInput = document.getElementById('plan-monthly-income');
    const income = Math.max(0, Number(incomeInput ? incomeInput.value : 0) || 0);

    const plan = mbStorage.getFinancialPlan();
    const allocations = mbStorage.calculatePlanAllocations(this.activeFramework, income, plan.customItems);

    // 儲存輸入之收入
    mbStorage.saveFinancialPlan({ monthlyIncome: income });

    // 低收入暖心提醒 (若收入低於 8000，生活費可能較吃緊)
    const warnEl = document.getElementById('plan-low-income-warning');
    if (warnEl) {
      if (income > 0 && income <= 8000) warnEl.classList.remove('hidden');
      else warnEl.classList.add('hidden');
    }

    // 渲染項目分配卡片列表
    const listEl = document.getElementById('plan-allocations-list');
    listEl.innerHTML = allocations.map(item => `
      <div class="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 flex items-center justify-between hover:bg-white transition">
        <div class="flex items-center space-x-3">
          <span class="w-3.5 h-3.5 rounded-full shrink-0" style="background-color: ${item.color}"></span>
          <div>
            <h5 class="font-bold text-stone-800 text-xs sm:text-sm">${item.name}</h5>
            <p class="text-[11px] text-stone-400">${item.subtext}</p>
          </div>
        </div>
        <div class="text-right">
          <div class="font-mono font-bold text-sm sm:text-base text-stone-800">
            NT$ ${item.amount.toLocaleString()}
          </div>
          <span class="text-[10px] text-stone-400 font-medium">建議分配額度</span>
        </div>
      </div>
    `).join('');

    // 渲染圓餅圖
    this.renderPlanAllocationChart(allocations);

    // 更新架構對比試算表 (若存在)
    const comp50 = document.getElementById('compare-50-needs');
    if (comp50) {
      const alloc50 = mbStorage.calculatePlanAllocations('50_30_20', income);
      const alloc6 = mbStorage.calculatePlanAllocations('6_jars', income);
      comp50.textContent = `NT$ ${alloc50[0].amount.toLocaleString()}`;
      const c50w = document.getElementById('compare-50-wants');
      if (c50w) c50w.textContent = `NT$ ${alloc50[1].amount.toLocaleString()}`;
      const c50s = document.getElementById('compare-50-savings');
      if (c50s) c50s.textContent = `NT$ ${alloc50[2].amount.toLocaleString()}`;
      const c6n = document.getElementById('compare-6-needs');
      if (c6n) c6n.textContent = `NT$ ${alloc6[0].amount.toLocaleString()}`;
      const c6w = document.getElementById('compare-6-wants');
      if (c6w) c6w.textContent = `NT$ ${alloc6[4].amount.toLocaleString()}`;
      const c6s = document.getElementById('compare-6-savings');
      if (c6s) c6s.textContent = `NT$ ${(alloc6[1].amount + alloc6[2].amount).toLocaleString()}`;
    }
  }

  renderPlanAllocationChart(allocations) {
    const ctx = document.getElementById('planAllocationChart');
    if (!ctx) return;

    if (this.charts.planAllocation) this.charts.planAllocation.destroy();

    this.charts.planAllocation = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: allocations.map(a => a.name),
        datasets: [{
          data: allocations.map(a => a.amount),
          backgroundColor: allocations.map(a => a.color),
          borderWidth: 2,
          borderColor: '#FFFDF9'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  renderCustomPlanItemsEditor() {
    const plan = mbStorage.getFinancialPlan();
    const items = plan.customItems || [];
    const container = document.getElementById('custom-items-editor');

    let sum = items.reduce((acc, it) => acc + Number(it.percent || 0), 0);
    const sumEl = document.getElementById('custom-percent-sum');
    sumEl.textContent = `目前總計: ${sum}%`;
    sumEl.className = sum === 100 ? 'font-bold text-matcha-600 font-mono' : 'font-bold text-coral-500 font-mono';

    container.innerHTML = items.map((it, idx) => `
      <div class="flex items-center space-x-2 bg-white p-2 rounded-xl border border-cream-200">
        <input type="text" value="${it.name}" onchange="app.updateCustomPlanItemName(${idx}, this.value)" class="w-24 text-xs font-semibold text-stone-700 bg-transparent outline-none">
        <input type="range" min="1" max="100" value="${it.percent}" oninput="app.updateCustomPlanItemPercent(${idx}, this.value)" class="flex-1 accent-coral-500">
        <span class="w-12 text-right font-mono font-bold text-stone-700">${it.percent}%</span>
        <button onclick="app.removeCustomPlanItem(${idx})" class="text-stone-300 hover:text-red-500 p-1">
          <i data-lucide="trash" class="w-3 h-3"></i>
        </button>
      </div>
    `).join('');

    this.initLucideIcons();
  }

  updateCustomPlanItemName(idx, newName) {
    const plan = mbStorage.getFinancialPlan();
    if (plan.customItems[idx]) {
      plan.customItems[idx].name = newName.trim() || '自訂項目';
      mbStorage.saveFinancialPlan({ customItems: plan.customItems });
      this.updatePlanningAllocations();
    }
  }

  updateCustomPlanItemPercent(idx, newPercent) {
    const plan = mbStorage.getFinancialPlan();
    if (plan.customItems[idx]) {
      plan.customItems[idx].percent = Number(newPercent);
      mbStorage.saveFinancialPlan({ customItems: plan.customItems });
      this.renderCustomPlanItemsEditor();
      this.updatePlanningAllocations();
    }
  }

  addCustomPlanItem() {
    const plan = mbStorage.getFinancialPlan();
    const colors = ['#2A9D8F', '#E76F51', '#F4A261', '#E9C46A', '#D4A373', '#A3B18A'];
    plan.customItems.push({
      name: `新項目 ${plan.customItems.length + 1}`,
      percent: 10,
      color: colors[plan.customItems.length % colors.length]
    });
    mbStorage.saveFinancialPlan({ customItems: plan.customItems });
    this.renderCustomPlanItemsEditor();
    this.updatePlanningAllocations();
  }

  removeCustomPlanItem(idx) {
    const plan = mbStorage.getFinancialPlan();
    if (plan.customItems.length <= 1) {
      this.showToast('至少保留一個自訂分配項目喔！', 'error');
      return;
    }
    plan.customItems.splice(idx, 1);
    mbStorage.saveFinancialPlan({ customItems: plan.customItems });
    this.renderCustomPlanItemsEditor();
    this.updatePlanningAllocations();
  }

  // ================= 4. 消費分析與預算管理 (Analysis) =================

  renderAnalysisView() {
    const month = document.getElementById('analysis-month').value;
    const summary = mbStorage.getMonthlySummary(month);

    // 1. 收支柱狀圖
    this.renderAnalysisBarChart(summary.totalIncome, summary.totalExpense);

    // 2. 歷史消費趨勢折線圖 (取近 6 個月)
    this.renderAnalysisTrendChart();

    // 3. 預算進度條清單
    this.renderBudgetStatuses(month);

    // 4. 個人化財務診斷
    this.renderPersonalizedInsights(month, summary);
  }

  renderAnalysisBarChart(income, expense) {
    const ctx = document.getElementById('analysisBarChart');
    if (!ctx) return;
    if (this.charts.analysisBar) this.charts.analysisBar.destroy();

    this.charts.analysisBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['本月總收入', '本月總支出'],
        datasets: [{
          data: [income, expense],
          backgroundColor: ['#588157', '#E76F51'],
          borderRadius: 12,
          barThickness: 45
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => `NT$ ${val.toLocaleString()}`
            }
          }
        }
      }
    });
  }

  renderAnalysisTrendChart() {
    const ctx = document.getElementById('analysisTrendChart');
    if (!ctx) return;
    if (this.charts.analysisTrend) this.charts.analysisTrend.destroy();

    // 計算過去 6 個月標籤
    const months = [];
    const expenses = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(ym);
      const s = mbStorage.getMonthlySummary(ym);
      expenses.push(s.totalExpense);
    }

    this.charts.analysisTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: '每月總支出',
          data: expenses,
          borderColor: '#E76F51',
          backgroundColor: 'rgba(231, 111, 81, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#E76F51'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => `NT$ ${val.toLocaleString()}`
            }
          }
        }
      }
    });
  }

  renderBudgetStatuses(month) {
    const list = mbStorage.getBudgetStatuses(month);
    const container = document.getElementById('analysis-budget-list');

    if (list.length === 0) {
      container.innerHTML = `
        <div class="py-6 text-center text-stone-400 text-xs">
          尚未設定任何分類預算，點擊上方按鈕開始規劃預算吧！
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(b => {
      let badge = '';
      let barColor = 'bg-matcha-500';

      if (b.alertLevel === 'danger') {
        badge = `<span class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">🚨 已超支 NT$ ${Math.abs(b.remaining).toLocaleString()}</span>`;
        barColor = 'bg-red-500';
      } else if (b.alertLevel === 'warning') {
        badge = `<span class="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">💛 已達 80% 警戒</span>`;
        barColor = 'bg-amber-500';
      }

      return `
        <div class="p-3.5 rounded-2xl bg-cream-50 border border-cream-200">
          <div class="flex items-center justify-between text-xs mb-1.5">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-stone-800">${b.category}</span>
              ${badge}
            </div>
            <div class="font-mono text-stone-600">
              <strong class="text-stone-800">NT$ ${b.spent.toLocaleString()}</strong> / NT$ ${b.budget.toLocaleString()} (${b.percent}%)
            </div>
          </div>
          <div class="w-full bg-cream-200 h-2 rounded-full overflow-hidden">
            <div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${Math.min(100, b.percent)}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderPersonalizedInsights(month, summary) {
    const container = document.getElementById('analysis-insights-container');

    // 1. 最大花費項目
    const topExp = Object.entries(summary.categoryExpenses).sort((a, b) => b[1] - a[1])[0];
    let topExpHtml = `
      <div class="p-4 rounded-2xl bg-white border border-cream-200">
        <span class="font-bold text-coral-500">🏆 本月最大支出項目</span>
        <h4 class="text-base font-bold text-stone-800 mt-1">${topExp ? topExp[0] : '暫無'}</h4>
        <p class="text-stone-500 mt-1">
          ${topExp ? `總共花費 NT$ ${topExp[1].toLocaleString()}，佔總支出的 ${Math.round((topExp[1] / summary.totalExpense) * 100)}%` : '尚未有支出紀錄'}
        </p>
      </div>
    `;

    // 2. 預算健康度
    const budgetList = mbStorage.getBudgetStatuses(month);
    const dangerCount = budgetList.filter(b => b.alertLevel === 'danger').length;
    let budgetHealthHtml = `
      <div class="p-4 rounded-2xl bg-white border border-cream-200">
        <span class="font-bold text-purple-600">🎯 預算健康度</span>
        <h4 class="text-base font-bold text-stone-800 mt-1">${dangerCount === 0 ? '全數在掌控中' : `${dangerCount} 項分類已超支`}</h4>
        <p class="text-stone-500 mt-1">
          ${dangerCount === 0 ? '棒極了！本月所有設定的預算都沒有爆表～' : '建議針對超支分類稍微收斂非必要消費喔！'}
        </p>
      </div>
    `;

    // 3. 節流與理財小技巧
    let advice = '飲食若多選擇校內學餐、減少外送手搖飲，每個月可以輕鬆多存下 NT$ 1,500 ~ 2,500 喔！';
    if (summary.balance < 0) {
      advice = '本月暫時呈現赤字，建議先檢視「社交娛樂」與「購物」花費，讓收支盡快回到平衡～';
    } else if (summary.savingsRate >= 20) {
      advice = '儲蓄率達到 20% 以上！這筆結餘可以投入定期定額 ETF 或作為緊急預備金。';
    }

    let adviceHtml = `
      <div class="p-4 rounded-2xl bg-white border border-cream-200">
        <span class="font-bold text-matcha-600">💡 柴柴理財小錦囊</span>
        <p class="text-stone-700 font-medium mt-1">${advice}</p>
      </div>
    `;

    container.innerHTML = topExpHtml + budgetHealthHtml + adviceHtml;
  }

  openBudgetSettingsModal() {
    const modal = document.getElementById('modal-budget-settings');
    const container = document.getElementById('budget-settings-inputs');
    const budgets = mbStorage.getBudgets();
    const cats = mbStorage.getCategories().expense;

    container.innerHTML = cats.map(c => `
      <div class="flex items-center justify-between bg-cream-50 p-2.5 rounded-xl border border-cream-200 text-xs">
        <span class="font-bold text-stone-700">${c}</span>
        <div class="flex items-center space-x-1">
          <span class="text-stone-400">NT$</span>
          <input type="number" min="0" step="100" data-cat="${c}" value="${budgets[c] || 0}" class="budget-input w-28 bg-white px-2 py-1 rounded-lg border border-cream-200 font-mono font-bold text-right outline-none">
        </div>
      </div>
    `).join('');

    modal.classList.remove('hidden');
  }

  closeBudgetModal() {
    document.getElementById('modal-budget-settings').classList.add('hidden');
  }

  saveBudgetsFromModal() {
    const inputs = document.querySelectorAll('.budget-input');
    inputs.forEach(input => {
      const cat = input.dataset.cat;
      const amt = Number(input.value) || 0;
      mbStorage.setBudget(cat, amt);
    });

    this.closeBudgetModal();
    this.showToast('已更新分類預算設定！');
    this.renderAnalysisView();
  }

  // ================= 5. 借貸管理與還錢話術 (Debts & Scripts) =================

  renderDebtsView() {
    const stats = mbStorage.getDebtStats();
    document.getElementById('debt-stat-uncollected').textContent = `NT$ ${stats.totalUncollected.toLocaleString()}`;
    document.getElementById('debt-stat-overdue').textContent = `${stats.overdueCount} 筆`;

    const debts = mbStorage.getDebts();
    const container = document.getElementById('debts-list-container');

    if (debts.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center text-stone-400 text-xs">
          <p class="text-3xl mb-2">🤝</p>
          目前沒有任何借貸紀錄，大家的信用都一級棒！
        </div>
      `;
    } else {
      const today = typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().split('T')[0];

      container.innerHTML = debts.map(d => {
        const isPaid = d.status === 'paid';
        const isPartial = d.status === 'partial';
        const isOverdue = !isPaid && d.dueDate && d.dueDate < today;

        let statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">尚未還款</span>`;
        if (isPaid) {
          statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-matcha-100 text-matcha-600">已結清 🎉</span>`;
        } else if (isPartial) {
          statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">部分還款</span>`;
        }

        if (isOverdue) {
          statusBadge += ` <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 ml-1">已逾期 🚨</span>`;
        }

        return `
          <div class="p-4 rounded-2xl bg-cream-50 border border-cream-200 hover:bg-white transition text-xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-sm text-stone-800">${d.name}</span>
                <span class="text-stone-400">(${d.relationship})</span>
                ${statusBadge}
              </div>
              <div class="text-right">
                <span class="text-stone-400">尚欠金額</span>
                <p class="font-mono font-bold text-base text-coral-500">NT$ ${d.remainingAmount.toLocaleString()}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-500 text-[11px] bg-white p-2.5 rounded-xl border border-cream-100">
              <div>原始借款: <strong class="text-stone-700">NT$ ${d.amount.toLocaleString()}</strong></div>
              <div>已還款: <strong class="text-stone-700">NT$ ${(d.paidAmount || 0).toLocaleString()}</strong></div>
              <div>借出日: ${d.borrowDate}</div>
              <div>約定還款: ${d.dueDate || '無'}</div>
            </div>

            ${d.note ? `<p class="text-stone-500 italic text-[11px]">備註：${d.note}</p>` : ''}

            <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-cream-200">
              <div class="flex items-center space-x-2">
                ${!isPaid ? `
                  <button onclick="app.openRepayModal('${d.id}')" class="px-2.5 py-1 bg-matcha-100 hover:bg-matcha-200 text-matcha-700 font-semibold rounded-lg transition flex items-center gap-1">
                    <i data-lucide="check" class="w-3 h-3"></i> 紀錄還款
                  </button>
                  <button onclick="app.fillDebtIntoScript('${d.id}')" class="px-2.5 py-1 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-lg shadow-sm transition flex items-center gap-1">
                    <i data-lucide="message-square" class="w-3 h-3"></i> 產生催款話術
                  </button>
                ` : `
                  <span class="text-matcha-600 font-bold">✨ 款項已清償完畢</span>
                `}
              </div>

              <div class="flex items-center space-x-1">
                <button onclick="app.editDebt('${d.id}')" class="p-1 text-stone-400 hover:text-stone-700">
                  <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="app.deleteDebt('${d.id}')" class="p-1 text-stone-400 hover:text-red-500">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    this.initLucideIcons();
    this.generateScripts();
  }

  openDebtModal(editId = null) {
    const modal = document.getElementById('modal-debt');
    const form = document.getElementById('debt-form');
    form.reset();

    document.getElementById('debt-edit-id').value = editId || '';
    document.getElementById('debt-input-borrow-date').value = typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().split('T')[0];

    if (editId) {
      document.getElementById('debt-modal-title').innerHTML = '<i data-lucide="edit-3" class="w-4 h-4 text-milk-tea"></i> 編輯借款紀錄';
      const debt = mbStorage.getDebts().find(d => d.id === editId);
      if (debt) {
        document.getElementById('debt-input-name').value = debt.name;
        document.getElementById('debt-input-relationship').value = debt.relationship;
        document.getElementById('debt-input-amount').value = debt.amount;
        document.getElementById('debt-input-borrow-date').value = debt.borrowDate;
        document.getElementById('debt-input-due-date').value = debt.dueDate || '';
        document.getElementById('debt-input-note').value = debt.note || '';
      }
    } else {
      document.getElementById('debt-modal-title').innerHTML = '<i data-lucide="user-plus" class="w-4 h-4 text-milk-tea"></i> 新增借貸紀錄';
    }

    modal.classList.remove('hidden');
    this.initLucideIcons();
  }

  closeDebtModal() {
    document.getElementById('modal-debt').classList.add('hidden');
  }

  handleDebtSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('debt-edit-id').value;
    const name = document.getElementById('debt-input-name').value;
    const relationship = document.getElementById('debt-input-relationship').value || '朋友';
    const amount = Number(document.getElementById('debt-input-amount').value);
    const borrowDate = document.getElementById('debt-input-borrow-date').value;
    const dueDate = document.getElementById('debt-input-due-date').value;
    const note = document.getElementById('debt-input-note').value;

    try {
      if (editId) {
        mbStorage.updateDebt(editId, { name, relationship, amount, borrowDate, dueDate, note });
        this.showToast('已更新借貸紀錄！');
      } else {
        mbStorage.addDebt({ name, relationship, amount, borrowDate, dueDate, note });
        this.showToast('已新增借款紀錄！柴柴幫你盯緊這筆錢～🐾');
      }
      this.closeDebtModal();
      this.renderDebtsView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  editDebt(id) {
    this.openDebtModal(id);
  }

  deleteDebt(id) {
    if (confirm('確定要刪除這筆借款紀錄嗎？')) {
      mbStorage.deleteDebt(id);
      this.showToast('已刪除借款紀錄');
      this.renderDebtsView();
    }
  }

  openRepayModal(debtId) {
    const debt = mbStorage.getDebts().find(d => d.id === debtId);
    if (!debt) return;

    document.getElementById('repay-debt-id').value = debtId;
    document.getElementById('repay-modal-info').textContent =
      `對象：${debt.name} | 尚欠 NT$ ${debt.remainingAmount.toLocaleString()}`;
    document.getElementById('repay-input-amount').value = debt.remainingAmount;

    document.getElementById('modal-repay').classList.remove('hidden');
  }

  closeRepayModal() {
    document.getElementById('modal-repay').classList.add('hidden');
  }

  handleRepaySubmit(e) {
    e.preventDefault();
    const debtId = document.getElementById('repay-debt-id').value;
    const amount = Number(document.getElementById('repay-input-amount').value);
    const note = document.getElementById('repay-input-note').value;

    try {
      const updated = mbStorage.addRepayment(debtId, amount, note);
      this.closeRepayModal();
      this.showToast('已成功記錄還款！');

      // 若全額結清，施放拉炮特效！🎉
      if (updated.status === 'paid' && window.confetti) {
        window.confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      this.renderDebtsView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  fillDebtIntoScript(debtId) {
    const debt = mbStorage.getDebts().find(d => d.id === debtId);
    if (!debt) return;

    const nameInput = document.getElementById('script-param-name');
    const amountInput = document.getElementById('script-param-amount');
    const borrowDateInput = document.getElementById('script-param-borrow-date');
    const dueDateInput = document.getElementById('script-param-due-date');
    const daysInput = document.getElementById('script-param-days');
    const reasonInput = document.getElementById('script-param-reason');
    const situationInput = document.getElementById('script-param-situation');

    if (nameInput) nameInput.value = debt.name;
    if (amountInput) amountInput.value = debt.remainingAmount;
    if (borrowDateInput) borrowDateInput.value = debt.borrowDate || '';
    if (dueDateInput) dueDateInput.value = debt.dueDate || '';

    // 計算借款至今幾天
    const diffDays = Math.max(1, Math.floor((Date.now() - new Date(debt.borrowDate).getTime()) / (1000 * 3600 * 24)));
    if (daysInput) daysInput.value = diffDays;
    if (reasonInput) reasonInput.value = debt.note || '聚餐代墊款項';
    if (situationInput) situationInput.value = '想把帳目結清';

    this.generateScripts();

    // 平滑滾動至話術產生器
    if (nameInput) {
      nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    this.showToast(`已將 ${debt.name} 的欠款資訊帶入話術產生器！`);
  }

  recalcScriptDaysFromDate() {
    const dateInput = document.getElementById('script-param-borrow-date');
    const daysInput = document.getElementById('script-param-days');
    if (!dateInput || !daysInput || !dateInput.value) return;
    const borrowTime = new Date(dateInput.value).getTime();
    if (isNaN(borrowTime)) return;
    const now = Date.now();
    const diffDays = Math.max(1, Math.floor((now - borrowTime) / (1000 * 3600 * 24)));
    daysInput.value = diffDays;
  }

  // --- 還錢話術產生核心演算法 (9 大風格 + AI 引擎整合) ---

  selectScriptStyle(styleKey) {
    this.activeStyle = styleKey;

    const normalStyles = ['gentle', 'cute', 'humorous', 'formal', 'firm_polite', 'strong_polite'];
    normalStyles.forEach(k => {
      const btn = document.getElementById(`btn-style-${k}`);
      if (btn) {
        if (k === styleKey) {
          btn.className = 'script-style-btn py-2 px-3 rounded-xl text-xs font-bold border-2 border-stone-800 bg-stone-800 text-white shadow-sm transition';
        } else {
          btn.className = 'script-style-btn py-2 px-3 rounded-xl text-xs font-medium border border-cream-200 bg-white text-stone-700 hover:bg-cream-100 transition';
        }
      }
    });

    const trashBtn = document.getElementById('btn-style-trash_talk');
    if (trashBtn) {
      if (styleKey === 'trash_talk') {
        trashBtn.className = 'trash-mode-btn shrink-0 text-xs font-black px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md ring-2 ring-amber-500 bg-amber-500 text-stone-900 transition scale-105';
      } else {
        trashBtn.className = 'trash-mode-btn shrink-0 text-xs font-black px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition';
      }
    }

    const hellFuriousBtn = document.getElementById('btn-style-hell_furious');
    const hellLegalBtn = document.getElementById('btn-style-hell_legal');
    if (hellFuriousBtn) {
      if (styleKey === 'hell_furious') {
        hellFuriousBtn.classList.add('ring-2', 'ring-red-400', 'scale-105');
      } else {
        hellFuriousBtn.classList.remove('ring-2', 'ring-red-400', 'scale-105');
      }
    }
    if (hellLegalBtn) {
      if (styleKey === 'hell_legal') {
        hellLegalBtn.classList.add('ring-2', 'ring-red-400', 'scale-105');
      } else {
        hellLegalBtn.classList.remove('ring-2', 'ring-red-400', 'scale-105');
      }
    }

    // 啟動或解除極限地獄模式視覺系統 (烈焰、惡魔與黑曜石熔岩氛圍)
    if (styleKey === 'hell_furious' || styleKey === 'hell_legal') {
      this.enableHellModeVisuals(true);
    } else {
      this.enableHellModeVisuals(false);
    }

    this.generateScripts();
  }

  requestHellMode(styleKey) {
    this.pendingHellStyle = styleKey;
    document.getElementById('modal-hell-confirm').classList.remove('hidden');
  }

  closeHellModal() {
    document.getElementById('modal-hell-confirm').classList.add('hidden');
    this.pendingHellStyle = null;
  }

  confirmHellMode() {
    if (this.pendingHellStyle) {
      const chosen = this.pendingHellStyle;
      this.closeHellModal();
      this.selectScriptStyle(chosen);
      this.showToast('🔥 地獄催款模式已啟動！惡魔柴柴降臨，友情小船搖晃中～');
    }
  }

  enableHellModeVisuals(enabled) {
    const isHell = Boolean(enabled);
    const body = document.body;
    const banner = document.getElementById('hell-domain-banner');
    const flamesOverlay = document.getElementById('hell-flames-overlay');
    const demonMascot = document.getElementById('hell-demon-mascot');

    if (isHell) {
      body.classList.add('hell-mode-active');

      // 觸發全螢幕震撼微震衝擊
      body.classList.remove('hell-screen-shake');
      void body.offsetWidth; // 強制重繪
      body.classList.add('hell-screen-shake');
      setTimeout(() => body.classList.remove('hell-screen-shake'), 600);

      // 展開頂部地獄領域橫幅
      if (banner) banner.classList.remove('hidden');

      // 展開底部噴湧動態烈焰與浮動火星
      if (flamesOverlay) {
        flamesOverlay.classList.remove('hidden');
        this.renderHellFlames(flamesOverlay);
      }

      // 右下角冒出惡魔柴柴與發話泡泡
      if (demonMascot) {
        demonMascot.classList.remove('hidden');
        this.renderHellDemonMascot(demonMascot);
      }
    } else {
      body.classList.remove('hell-mode-active');
      body.classList.remove('hell-screen-shake');
      if (banner) banner.classList.add('hidden');
      if (flamesOverlay) flamesOverlay.classList.add('hidden');
      if (demonMascot) demonMascot.classList.add('hidden');
    }
  }

  renderHellFlames(container) {
    // 渲染多組火焰火舌 SVG
    let flameTongues = '';
    const colors = ['#C1121F', '#E63946', '#FF4D00', '#FF7900', '#FFB703', '#FFE600'];
    for (let i = 0; i < 28; i++) {
      const c1 = colors[i % colors.length];
      const c2 = colors[(i + 1) % colors.length];
      const heightPct = 60 + ((i * 17) % 40);
      flameTongues += `
        <div class="flame-tongue" style="height: ${heightPct}%;">
          <svg viewBox="0 0 40 100" class="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="flameGrad${i}" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="${c1}" stop-opacity="0.95"/>
                <stop offset="60%" stop-color="${c2}" stop-opacity="0.85"/>
                <stop offset="100%" stop-color="#FFF3B0" stop-opacity="0.4"/>
              </linearGradient>
            </defs>
            <path d="M 0 100 Q 15 ${50 - (i % 5) * 6} 20 0 Q 25 ${50 - (i % 5) * 6} 40 100 Z" fill="url(#flameGrad${i})" />
          </svg>
        </div>
      `;
    }

    // 渲染浮動火星粒子
    let embers = '';
    for (let j = 0; j < 16; j++) {
      const left = (j * 6.2 + 2).toFixed(1);
      const delay = ((j * 0.3) % 2).toFixed(2);
      const duration = (2.2 + (j % 4) * 0.4).toFixed(2);
      const size = 3 + (j % 4) * 2;
      const drift = -30 + (j % 5) * 15;
      embers += `<div class="hell-ember" style="left: ${left}%; width: ${size}px; height: ${size}px; animation-delay: ${delay}s; animation-duration: ${duration}s; --ember-drift: ${drift}px;"></div>`;
    }

    // 飄動小惡魔靈魂群 (😈, 👹, 👿, 💀, 🔥, 🔱)
    const demonIcons = ['😈', '👹', '👿', '💀', '🔥', '🔱', '😈', '🔥'];
    let imps = '';
    for (let k = 0; k < demonIcons.length; k++) {
      const left = 5 + k * 12 + ((k * 7) % 6);
      const delay = (0.2 + k * 0.4).toFixed(2);
      const rot = (k % 2 === 0 ? 1 : -1) * (10 + (k * 5) % 15);
      imps += `<div class="hell-floating-imp" style="left: ${left}%; animation-delay: ${delay}s; --imp-rot: ${rot}deg;">${demonIcons[k]}</div>`;
    }

    container.innerHTML = `
      <div class="flame-svg-container">
        ${flameTongues}
      </div>
      ${embers}
      ${imps}
    `;
  }

  renderHellDemonMascot(container) {
    const devilAvatar = (typeof SHIBA_AVATARS !== 'undefined' && SHIBA_AVATARS.devil) ? SHIBA_AVATARS.devil : (this.mascot ? this.mascot.getAvatar('devil') : '😈');
    const quotes = [
      '欠債還錢，天經地義！不還錢抓下地獄油炸！😈',
      '快點還錢！本惡魔已經在磨三叉戟了！🔱',
      '警告：地獄之火已鎖定債務人！🔥',
      '利息已經算到下輩子囉！💀',
      '再拖延，惡魔就要去你家按電鈴囉！👹',
      '不還錢？那你的靈魂就歸地獄管轄了！😈'
    ];
    const initialQuote = quotes[0];

    container.innerHTML = `
      <div class="relative">
        <div id="demon-speech-bubble" class="demon-bubble">
          ${initialQuote}
        </div>
        <div class="demon-character-box" onclick="app.pokeDemonMascot()" title="點我聽惡魔咆哮！">
          ${devilAvatar}
        </div>
      </div>
    `;
  }

  pokeDemonMascot() {
    const bubble = document.getElementById('demon-speech-bubble');
    const quotes = [
      '欠債還錢，天經地義！不還錢抓下地獄油炸！😈',
      '快點還錢！本惡魔已經在磨三叉戟了！🔱',
      '警告：地獄之火已鎖定債務人！🔥',
      '利息已經算到下輩子囉！💀',
      '再拖延，惡魔就要去你家按電鈴囉！👹',
      '不還錢？那你的靈魂就歸地獄管轄了！😈',
      '嗷嗚～～～地獄熔岩正在沸騰！🔥🔱'
    ];
    if (bubble) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      bubble.innerText = randomQuote;
      bubble.style.animation = 'none';
      void bubble.offsetWidth;
      bubble.style.animation = 'bubblePop 0.35s ease-out';
    }
    const mascot = document.getElementById('hell-demon-mascot');
    if (mascot) {
      mascot.classList.remove('hell-screen-shake');
      void mascot.offsetWidth;
      mascot.classList.add('hell-screen-shake');
      setTimeout(() => mascot.classList.remove('hell-screen-shake'), 500);
    }
  }

  exitHellMode() {
    this.enableHellModeVisuals(false);
    this.selectScriptStyle('gentle');
    this.showToast('🕊️ 地獄之火已撲滅，回歸溫柔手帳模式～');
  }

  getScriptContext() {
    const name = (document.getElementById('script-param-name')?.value || '朋友').trim();
    const amount = Number(document.getElementById('script-param-amount')?.value || 800);
    const borrowDate = document.getElementById('script-param-borrow-date')?.value || '';
    const days = Number(document.getElementById('script-param-days')?.value || 14);
    const dueDate = document.getElementById('script-param-due-date')?.value || '';
    const reason = (document.getElementById('script-param-reason')?.value || '').trim() || '日常代墊';
    const situation = (document.getElementById('script-param-situation')?.value || '').trim() || '月底手頭吃緊';

    return {
      name,
      amount,
      borrowDate,
      days,
      dueDate,
      reason,
      situation,
      style: this.activeStyle || 'gentle'
    };
  }

  async generateScripts() {
    const container = document.getElementById('script-results-container');
    if (!container) return;

    const context = this.getScriptContext();
    const styleKey = this.activeStyle || 'gentle';
    const styleData = REMINDER_SCRIPTS[styleKey] || REMINDER_SCRIPTS.gentle;

    // 顯示載入動畫
    this.isAiGenerating = true;
    container.innerHTML = `
      <div class="p-8 rounded-2xl bg-white border border-cream-200 text-center ai-generating shadow-sm">
        <div class="inline-block p-3 rounded-full bg-cream-100 text-purple-600 mb-3 animate-spin">
          <i data-lucide="loader-2" class="w-6 h-6"></i>
        </div>
        <h4 class="text-sm font-bold text-stone-800 mb-1">正在根據情境為您調製 3 種催款說法...</h4>
        <p class="text-xs text-stone-500">正在分析拖欠 ${context.days} 天、事由「${context.reason}」與「${context.situation}」情境</p>
      </div>
    `;
    this.initLucideIcons();

    const localKey = localStorage.getItem('mb_gemini_api_key') || '';
    let scripts = null;
    let source = 'local_engine';

    // 嘗試向後端請求 AI 生成
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      const res = await fetch('/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          apiKey: localKey
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.scripts) && data.scripts.length === 3) {
          scripts = data.scripts;
          source = data.source || 'gemini_ai';
        }
      }
    } catch (err) {
      // 網路超時或本機靜態檔案模式，平滑切換至本機情境引擎
    }

    // 若 AI 生成不可用或無回應，使用本地智慧情境引擎
    if (!scripts || scripts.length < 3) {
      scripts = contextualEngine.generateThreeVersions(context, styleKey);
      source = 'local_engine';
    }

    this.currentGeneratedScripts = scripts;
    this.scriptGenerationSource = source;
    this.isAiGenerating = false;

    this.renderScriptResults();
  }

  regenerateSingleScript(versionIndex) {
    if (versionIndex < 0 || versionIndex > 2) return;
    const context = this.getScriptContext();
    const styleKey = this.activeStyle || 'gentle';

    // 收集目前其他卡片正在使用的 variationIndex，避免重抽到重複的說法
    const currentIndices = (this.currentGeneratedScripts || [])
      .map(s => s.variationIndex)
      .filter(idx => typeof idx === 'number');

    const newVersion = contextualEngine.generateSingleVersion(context, styleKey, versionIndex + 1, currentIndices);
    this.currentGeneratedScripts[versionIndex] = newVersion;
    this.renderScriptResults();
    const varNum = typeof newVersion.variationIndex === 'number' ? `（第 ${newVersion.variationIndex + 1} 款/共 20 款）` : '';
    this.showToast(`已換一種說法${varNum}！`);
  }

  renderScriptResults() {
    const container = document.getElementById('script-results-container');
    if (!container) return;

    const styleKey = this.activeStyle || 'gentle';
    const styleData = REMINDER_SCRIPTS[styleKey] || REMINDER_SCRIPTS.gentle;
    const isHell = Boolean(styleData.isHell);
    const isTrash = styleKey === 'trash_talk';

    const tagBg = isHell
      ? 'bg-red-700 text-white font-black'
      : (isTrash ? 'bg-amber-400 text-amber-950 font-black' : 'bg-coral-500/10 text-coral-600 font-bold');

    const cardBg = isHell
      ? 'hell-mode-card shadow-md'
      : (isTrash ? 'bg-amber-50/70 border-2 border-amber-200/90 shadow-sm' : 'bg-white border border-cream-200/90 shadow-xs');

    const angleTitles = [
      '💡 視角一：日常情境切入',
      '🎯 視角二：拖欠行為直球對決',
      '🎪 視角三：荒謬哲理／比喻'
    ];

    container.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/80 border border-cream-200">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs px-2.5 py-0.5 rounded-full ${tagBg}">
            ${styleData.name} (${styleData.badge})
          </span>
          <span class="text-xs text-stone-500">${styleData.description}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="app.generateScripts()" class="text-xs px-3 py-1 rounded-xl bg-cream-100 hover:bg-cream-200 text-stone-700 font-bold flex items-center gap-1 transition">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> 全部換一批
          </button>
        </div>
      </div>

      <div class="space-y-3">
        ${this.currentGeneratedScripts.map((g, idx) => {
          const angleTitle = angleTitles[idx] || `說法 ${idx + 1}`;
          const escapedText = this.escapeHtml(g.text);
          return `
            <div class="p-4 rounded-2xl ${cardBg} relative transition-all duration-200 hover:shadow-md">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span class="text-xs font-bold ${isHell ? 'text-red-300' : (isTrash ? 'text-amber-900' : 'text-stone-600')} flex items-center gap-1">
                  ${angleTitle}
                </span>
                <div class="flex items-center space-x-2">
                  <button onclick="app.regenerateSingleScript(${idx})" class="px-2.5 py-1 rounded-xl text-xs font-medium ${isHell ? 'bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60' : 'bg-cream-100 hover:bg-cream-200 text-stone-600 border border-cream-200'} transition flex items-center gap-1">
                    <i data-lucide="refresh-cw" class="w-3 h-3"></i> 換一種說法
                  </button>
                  <button onclick="app.copyToClipboard('${escapedText}')" class="px-3 py-1 rounded-xl text-xs font-bold ${isHell ? 'bg-red-600 hover:bg-red-500 text-white' : (isTrash ? 'bg-amber-400 hover:bg-amber-500 text-amber-950' : 'bg-coral-500 hover:bg-coral-600 text-white')} transition flex items-center gap-1 shadow-xs">
                    <i data-lucide="copy" class="w-3 h-3"></i> 一鍵複製
                  </button>
                </div>
              </div>
              <p class="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${isHell ? 'text-red-100 font-medium' : (isTrash ? 'text-stone-800 font-medium font-sans' : 'text-stone-700 font-medium')}">
${g.text}
              </p>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.initLucideIcons();
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '\\n');
  }

  copyToClipboard(text) {
    const unescaped = text.replace(/\\n/g, '\n').replace(/\\'/g, "'");
    navigator.clipboard.writeText(unescaped).then(() => {
      this.showToast('📋 話術已複製到剪貼簿！快去發給對方吧～');
    }).catch(() => {
      // 備用方案
      const ta = document.createElement('textarea');
      ta.value = unescaped;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast('📋 話術已複製到剪貼簿！');
    });
  }

  // --- AI 金鑰管理方法 ---

  async checkAiStatus() {
    const badge = document.getElementById('ai-engine-badge');
    if (!badge) return;

    const localKey = localStorage.getItem('mb_gemini_api_key');
    let serverConfigured = false;

    try {
      const res = await fetch('/api/ai-status');
      if (res.ok) {
        const data = await res.json();
        serverConfigured = Boolean(data.configured);
      }
    } catch (e) {
      // offline
    }

    if (serverConfigured) {
      badge.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-green-500"></span> 雲端智能引擎 (已連線)`;
      badge.className = 'text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1.5 shadow-xs';
    } else if (localKey) {
      badge.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-purple-500"></span> 智能引擎 (已連線)`;
      badge.className = 'text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 shadow-xs';
    } else {
      badge.innerHTML = `🧠 本機智慧情境核心`;
      badge.className = 'text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cream-200/80 text-stone-700 flex items-center gap-1 border border-cream-300';
    }
  }

  openAiSettingsModal() {
    const modal = document.getElementById('modal-ai-settings');
    if (!modal) return;
    const keyInput = document.getElementById('ai-settings-key-input');
    if (keyInput) {
      keyInput.value = localStorage.getItem('mb_gemini_api_key') || '';
    }
    this.updateAiSettingsStatus();
    modal.classList.remove('hidden');
    this.initLucideIcons();
  }

  closeAiSettingsModal() {
    const modal = document.getElementById('modal-ai-settings');
    if (modal) modal.classList.add('hidden');
  }

  toggleApiKeyVisibility() {
    const input = document.getElementById('ai-settings-key-input');
    const icon = document.getElementById('ai-key-eye-icon');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      if (icon) icon.setAttribute('data-lucide', 'eye');
    }
    this.initLucideIcons();
  }

  saveAiSettings() {
    const keyInput = document.getElementById('ai-settings-key-input');
    const val = (keyInput ? keyInput.value : '').trim();
    if (val) {
      localStorage.setItem('mb_gemini_api_key', val);
      this.showToast('✨ Gemini API 金鑰已儲存！');
    } else {
      localStorage.removeItem('mb_gemini_api_key');
      this.showToast('已清除金鑰，切換至本機情境引擎');
    }
    this.closeAiSettingsModal();
    this.checkAiStatus();
  }

  clearAiSettings() {
    localStorage.removeItem('mb_gemini_api_key');
    const keyInput = document.getElementById('ai-settings-key-input');
    if (keyInput) keyInput.value = '';
    this.showToast('已清除 Gemini API 金鑰');
    this.updateAiSettingsStatus();
    this.checkAiStatus();
  }

  async updateAiSettingsStatus() {
    const statusEl = document.getElementById('ai-settings-current-status');
    if (!statusEl) return;
    const localKey = localStorage.getItem('mb_gemini_api_key');
    try {
      const res = await fetch('/api/ai-status');
      if (res.ok) {
        const data = await res.json();
        if (data.configured) {
          statusEl.innerHTML = '<span class="text-green-600 font-bold">● 伺服器端環境變數已啟用</span>';
          return;
        }
      }
    } catch (e) {
      // offline
    }
    if (localKey) {
      statusEl.innerHTML = '<span class="text-purple-600 font-bold">● 瀏覽器端 API Key 已啟用</span>';
    } else {
      statusEl.innerHTML = '<span class="text-stone-500 font-medium">○ 未啟用 (目前使用本機智慧引擎)</span>';
    }
  }

  // ================= 手帳身分 / 備份管理 (Zero-PII Profile Modal) =================

  openProfileModal() {
    const modal = document.getElementById('modal-profile');
    const container = document.getElementById('profile-list-container');
    const profiles = mbStorage.getProfiles();
    const activeId = mbStorage.getActiveProfileId();

    container.innerHTML = profiles.map(p => `
      <div class="p-2.5 rounded-xl border ${p.id === activeId ? 'border-coral-500 bg-coral-500/5 font-bold' : 'border-cream-200 bg-cream-50'} flex items-center justify-between text-xs">
        <div class="flex items-center space-x-2">
          <span>📖</span>
          <span class="text-stone-800">${p.nickname}</span>
          ${p.id === activeId ? '<span class="text-[10px] text-coral-500">(目前使用中)</span>' : ''}
        </div>
        <div class="flex items-center space-x-1">
          ${p.id !== activeId ? `
            <button onclick="app.switchProfile('${p.id}')" class="px-2 py-0.5 bg-white border border-cream-200 hover:bg-cream-100 rounded-lg text-stone-600 font-semibold">
              切換
            </button>
          ` : ''}
          ${profiles.length > 1 ? `
            <button onclick="app.deleteProfile('${p.id}')" class="p-1 text-stone-400 hover:text-red-500">
              <i data-lucide="trash" class="w-3.5 h-3.5"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    modal.classList.remove('hidden');
    this.initLucideIcons();
  }

  closeProfileModal() {
    document.getElementById('modal-profile').classList.add('hidden');
  }

  createNewProfile() {
    const input = document.getElementById('new-profile-nickname');
    const name = input.value.trim();
    if (!name) {
      this.showToast('請輸入手帳暱稱喔！', 'error');
      return;
    }
    mbStorage.createProfile(name);
    input.value = '';
    this.closeProfileModal();
    this.updateProfileDisplay();
    this.switchView('dashboard');
    this.showToast(`✨ 已翻開全新手帳「${name}」！`);
  }

  switchProfile(profileId) {
    mbStorage.setActiveProfile(profileId);
    this.closeProfileModal();
    this.updateProfileDisplay();
    this.switchView('dashboard');
    this.showToast('已切換手帳身份！');
  }

  deleteProfile(profileId) {
    if (confirm('確定要刪除這本手帳及其所有本機紀錄嗎？此操作無法復原喔！')) {
      mbStorage.deleteProfile(profileId);
      this.openProfileModal();
      this.updateProfileDisplay();
      this.showToast('已刪除該手帳');
    }
  }

  loadDemoProfile() {
    mbStorage.loadDemoData();
    this.closeProfileModal();
    this.switchView('dashboard');
    this.showToast('🎲 已成功為當前手帳載入大學生示範數據！');
  }

  // --- 備份與匯出 ---

  openBackupModal() {
    document.getElementById('modal-backup').classList.remove('hidden');
    this.initLucideIcons();
  }

  closeBackupModal() {
    document.getElementById('modal-backup').classList.add('hidden');
  }

  exportFullJSON() {
    const jsonStr = mbStorage.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money_buddy_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('📦 已下載完整手帳備份檔！');
  }

  exportCSV() {
    const csvStr = mbStorage.exportTransactionsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money_buddy_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('📊 已下載記帳明細 CSV！');
  }

  importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        mbStorage.importJSON(e.target.result);
        this.closeBackupModal();
        this.switchView('dashboard');
        this.showToast('🎉 手帳備份資料已成功還原！');
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    };
    reader.readAsText(file);
  }
}

// 建立全域 App 實例並啟動
const app = new MoneyBuddyApp();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
