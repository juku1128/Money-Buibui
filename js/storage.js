/**
 * Money Buddy — 零個資 Local-First 資料庫與存取管理模組
 * 完全保存在瀏覽器 LocalStorage，無伺服器隱私風險。
 * 支援多手帳切換、資料隔離、一鍵匯出與大學生示範資料載入。
 */

const DEFAULT_CATEGORIES = {
  income: ['生活費', '打工收入', '獎學金', '紅包', '其他收入'],
  expense: ['飲食', '交通', '住宿', '娛樂', '購物', '教育', '生活用品', '社交', '其他支出']
};

const DEFAULT_PLAN_CONFIG = {
  framework: '50_30_20',
  monthlyIncome: 18000,
  customItems: [
    { name: '餐飲生活', percent: 45, color: '#F4A261' },
    { name: '日常房租交通', percent: 25, color: '#E76F51' },
    { name: '自我提升學習', percent: 10, color: '#2A9D8F' },
    { name: '緊急儲蓄金', percent: 15, color: '#E9C46A' },
    { name: '休閒娛樂', percent: 5, color: '#D4A373' }
  ]
};

const CATEGORY_ICONS = {
  '飲食': '🍜',
  '交通': '🚇',
  '住宿': '🏠',
  '娛樂': '🎮',
  '購物': '🛍️',
  '教育': '📚',
  '生活用品': '🧴',
  '社交': '☕',
  '其他支出': '📦',
  '生活費': '💵',
  '打工收入': '💼',
  '獎學金': '🎓',
  '紅包': '🧧',
  '其他收入': '💰'
};

function getLocalDateString(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

class MoneyBuddyStorage {
  constructor() {
    this.PROFILES_KEY = 'mb_profiles_v1';
    this.ACTIVE_ID_KEY = 'mb_active_profile_id_v1';
  }

  // --- 手帳身分管理 (Zero-PII Profiles) ---

  getProfiles() {
    try {
      const data = localStorage.getItem(this.PROFILES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load profiles:', e);
      return [];
    }
  }

  getActiveProfileId() {
    return localStorage.getItem(this.ACTIVE_ID_KEY) || null;
  }

  getActiveProfile() {
    const activeId = this.getActiveProfileId();
    if (!activeId) return null;
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === activeId) || null;
  }

  createProfile(nickname, pin = '') {
    const cleanNick = (nickname || '我的理財手帳').trim();
    const profiles = this.getProfiles();
    const id = 'prof_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newProfile = {
      id,
      nickname: cleanNick,
      pin: pin ? pin.trim() : '',
      createdAt: new Date().toISOString()
    };
    profiles.push(newProfile);
    localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
    this.setActiveProfile(id);

    // 初始化該手帳的空資料
    this.saveData(id, {
      transactions: [],
      budgets: { '飲食': 6000, '交通': 1200, '娛樂': 2000, '生活用品': 1000 },
      financialPlan: { ...DEFAULT_PLAN_CONFIG },
      debts: [],
      customCategories: { income: [], expense: [] }
    });

    return newProfile;
  }

  setActiveProfile(profileId) {
    localStorage.setItem(this.ACTIVE_ID_KEY, profileId);
  }

  logout() {
    localStorage.removeItem(this.ACTIVE_ID_KEY);
  }

  deleteProfile(profileId) {
    let profiles = this.getProfiles();
    profiles = profiles.filter(p => p.id !== profileId);
    localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
    localStorage.removeItem('mb_data_' + profileId);
    if (this.getActiveProfileId() === profileId) {
      if (profiles.length > 0) {
        this.setActiveProfile(profiles[0].id);
      } else {
        this.logout();
      }
    }
  }

  // --- 資料隔離儲存與讀取 ---

  getDataKey(profileId = null) {
    const pid = profileId || this.getActiveProfileId();
    return 'mb_data_' + pid;
  }

  getData(profileId = null) {
    const key = this.getDataKey(profileId);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to get data for', key, e);
      return null;
    }
  }

  saveData(profileId, data) {
    const key = 'mb_data_' + profileId;
    localStorage.setItem(key, JSON.stringify(data));
  }

  ensureCurrentData() {
    let data = this.getData();
    if (!data) {
      data = {
        transactions: [],
        budgets: { '飲食': 6000, '交通': 1200, '娛樂': 2000, '生活用品': 1000 },
        financialPlan: { ...DEFAULT_PLAN_CONFIG },
        debts: [],
        customCategories: { income: [], expense: [] }
      };
      this.saveData(this.getActiveProfileId(), data);
    }
    return data;
  }

  // --- 分類操作 ---

  getCategories() {
    const data = this.ensureCurrentData();
    const custom = data.customCategories || { income: [], expense: [] };
    return {
      income: [...DEFAULT_CATEGORIES.income, ...(custom.income || [])],
      expense: [...DEFAULT_CATEGORIES.expense, ...(custom.expense || [])]
    };
  }

  addCustomCategory(type, categoryName) {
    const name = categoryName.trim();
    if (!name) return false;
    const data = this.ensureCurrentData();
    if (!data.customCategories) data.customCategories = { income: [], expense: [] };
    if (!data.customCategories[type]) data.customCategories[type] = [];

    const all = this.getCategories()[type];
    if (all.includes(name)) return false;

    data.customCategories[type].push(name);
    this.saveData(this.getActiveProfileId(), data);
    return true;
  }

  deleteCustomCategory(type, categoryName) {
    const data = this.ensureCurrentData();
    if (!data.customCategories || !data.customCategories[type]) return false;
    data.customCategories[type] = data.customCategories[type].filter(c => c !== categoryName);
    this.saveData(this.getActiveProfileId(), data);
    return true;
  }

  // --- 記帳 CRUD ---

  getTransactions(filter = {}) {
    const data = this.ensureCurrentData();
    let list = [...(data.transactions || [])];

    // 月份篩選 (YYYY-MM)，若為 'all' 或未指定則不限制月份
    if (filter.month && filter.month !== 'all') {
      list = list.filter(t => t.date && t.date.startsWith(filter.month));
    }
    // 類型篩選 (income / expense)
    if (filter.type && filter.type !== 'all') {
      list = list.filter(t => t.type === filter.type);
    }
    // 分類篩選
    if (filter.category && filter.category !== 'all') {
      list = list.filter(t => t.category === filter.category);
    }

    // 依日期與建立時間排序：最新優先
    list.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return list;
  }

  addTransaction(item) {
    const data = this.ensureCurrentData();
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: item.type === 'income' ? 'income' : 'expense',
      category: item.category || '其他支出',
      amount: Math.round(Number(item.amount) || 0),
      date: item.date || getLocalDateString(),
      note: (item.note || '').trim(),
      createdAt: Date.now()
    };
    if (newTx.amount <= 0) {
      throw new Error('金額必須大於 0');
    }
    data.transactions.push(newTx);
    this.saveData(this.getActiveProfileId(), data);
    return newTx;
  }

  updateTransaction(id, updates) {
    const data = this.ensureCurrentData();
    const index = data.transactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    const current = data.transactions[index];
    const updated = {
      ...current,
      ...updates,
      amount: updates.amount !== undefined ? Math.round(Number(updates.amount) || 0) : current.amount,
      updatedAt: Date.now()
    };
    if (updated.amount <= 0) {
      throw new Error('金額必須大於 0');
    }
    data.transactions[index] = updated;
    this.saveData(this.getActiveProfileId(), data);
    return updated;
  }

  deleteTransaction(id) {
    const data = this.ensureCurrentData();
    const beforeLen = data.transactions.length;
    data.transactions = data.transactions.filter(t => t.id !== id);
    if (data.transactions.length !== beforeLen) {
      this.saveData(this.getActiveProfileId(), data);
      return true;
    }
    return false;
  }

  // --- 統計計算 (月度總收支、餘額、分類比例) ---

  getMonthlySummary(yearMonth) {
    const txs = this.getTransactions({ month: yearMonth });
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenses = {};
    const categoryIncomes = {};

    txs.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
        categoryIncomes[t.category] = (categoryIncomes[t.category] || 0) + amt;
      } else {
        totalExpense += amt;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + amt;
      }
    });

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((balance / totalIncome) * 100)) : 0;

    return {
      yearMonth,
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
      categoryExpenses,
      categoryIncomes,
      count: txs.length
    };
  }


  // --- 預算管理與月份獨立追蹤 ---

  getMonthlyBudgets() {
    const data = this.ensureCurrentData();
    return data.monthlyBudgets || {};
  }

  getMonthlyBudget(yearMonth) {
    const budgets = this.getMonthlyBudgets();
    return budgets[yearMonth] || null;
  }

  confirmMonthlyBudget(yearMonth, framework, monthlyIncome, categoryBudgets) {
    const data = this.ensureCurrentData();
    if (!data.monthlyBudgets) data.monthlyBudgets = {};

    const cleanBudgets = {};
    Object.entries(categoryBudgets || {}).forEach(([cat, val]) => {
      const amt = Math.max(0, Math.round(Number(val) || 0));
      if (amt > 0) cleanBudgets[cat] = amt;
    });

    data.monthlyBudgets[yearMonth] = {
      confirmed: true,
      framework: framework || '50_30_20',
      monthlyIncome: Math.max(0, Math.round(Number(monthlyIncome) || 0)),
      categories: cleanBudgets,
      confirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 同步快取至通用 budgets
    data.budgets = { ...data.budgets, ...cleanBudgets };

    this.saveData(this.getActiveProfileId(), data);
    return data.monthlyBudgets[yearMonth];
  }

  getBudgets() {
    const data = this.ensureCurrentData();
    return data.budgets || {};
  }

  setBudget(category, amount) {
    const data = this.ensureCurrentData();
    if (!data.budgets) data.budgets = {};
    const amt = Math.round(Number(amount) || 0);
    if (amt <= 0) {
      delete data.budgets[category];
    } else {
      data.budgets[category] = amt;
    }
    this.saveData(this.getActiveProfileId(), data);
    return data.budgets;
  }

  /**
   * 取得指定月份的完整預算追蹤分析
   * 包含各分類累計支出、剩餘額度、使用率、超額狀態與顏色等級 (綠/黃/紅)
   */
  getMonthlyBudgetTracking(yearMonth) {
    const confirmedBudget = this.getMonthlyBudget(yearMonth);
    const hasConfirmedBudget = !!(confirmedBudget && confirmedBudget.confirmed);

    // 優先使用該月確認之預算；若無則回退通用預算
    const budgetMap = hasConfirmedBudget ? (confirmedBudget.categories || {}) : (this.getBudgets() || {});
    const summary = this.getMonthlySummary(yearMonth);

    // 支出分類清單 (包含預設分類、自訂分類與已有支出的分類)
    const allExpenseCats = this.getCategories().expense;
    const catSet = new Set([
      ...allExpenseCats,
      ...Object.keys(budgetMap),
      ...Object.keys(summary.categoryExpenses)
    ]);

    // 統計該月份各分類的支出筆數
    const monthTxs = this.getTransactions({ month: yearMonth, type: 'expense' });
    const categoryCounts = {};
    monthTxs.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    let totalBudget = 0;
    let totalSpent = 0;
    const categoriesTracking = [];

    catSet.forEach(cat => {
      const budget = Math.max(0, Math.round(Number(budgetMap[cat]) || 0));
      const spent = Math.max(0, Math.round(Number(summary.categoryExpenses[cat]) || 0));
      const spentCount = categoryCounts[cat] || 0;
      const hasBudget = budget > 0;

      if (hasBudget) {
        totalBudget += budget;
      }
      totalSpent += spent;

      const remaining = budget - spent;
      const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
      const visualPercent = Math.min(100, Math.max(0, percent));
      const isOver = hasBudget && spent > budget;
      const isExact = hasBudget && spent === budget;

      let colorLevel = 'green'; // 'green' (0-79%), 'orange' (80-99%), 'red' (>=100%), 'gray' (無設定)
      let statusText = '';

      if (!hasBudget) {
        colorLevel = 'gray';
        statusText = '尚未設定此分類預算';
      } else if (isOver) {
        colorLevel = 'red';
        const overAmount = spent - budget;
        statusText = `已超出預算 NT$ ${overAmount.toLocaleString()}，請留意這個分類的支出！`;
      } else if (isExact) {
        colorLevel = 'red';
        statusText = '本月預算已經用完！';
      } else if (percent >= 80) {
        colorLevel = 'orange';
        statusText = `剩餘預算 NT$ ${remaining.toLocaleString()}`;
      } else {
        colorLevel = 'green';
        statusText = `剩餘預算 NT$ ${remaining.toLocaleString()}`;
      }

      categoriesTracking.push({
        category: cat,
        icon: CATEGORY_ICONS[cat] || '🏷️',
        budget,
        spent,
        spentCount,
        remaining,
        percent,
        visualPercent,
        isOver,
        isExact,
        hasBudget,
        colorLevel,
        statusText
      });
    });

    // 排序：超支與高百分比優先排前
    categoriesTracking.sort((a, b) => {
      if (a.hasBudget !== b.hasBudget) return a.hasBudget ? -1 : 1;
      return b.percent - a.percent;
    });

    const totalRemaining = totalBudget - totalSpent;
    const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return {
      yearMonth,
      hasConfirmedBudget,
      confirmedBudget,
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercent,
      categories: categoriesTracking
    };
  }

  getBudgetStatuses(yearMonth) {
    const tracking = this.getMonthlyBudgetTracking(yearMonth);
    return tracking.categories.map(c => ({
      category: c.category,
      budget: c.budget,
      spent: c.spent,
      remaining: c.remaining,
      percent: c.percent,
      alertLevel: c.isOver ? 'danger' : (c.percent >= 80 ? 'warning' : 'normal')
    }));
  }

  getCategoryBudgetStatus(category, yearMonth) {
    const tracking = this.getMonthlyBudgetTracking(yearMonth);
    const found = tracking.categories.find(c => c.category === category);
    if (found) return found;

    return {
      category,
      icon: CATEGORY_ICONS[category] || '🏷️',
      budget: 0,
      spent: 0,
      remaining: 0,
      percent: 0,
      visualPercent: 0,
      isOver: false,
      isExact: false,
      hasBudget: false,
      colorLevel: 'gray',
      statusText: '尚未設定此分類預算'
    };
  }

  applyPlanToBudgets(framework, monthlyIncome, customItems = []) {
    const income = Math.max(0, Math.round(Number(monthlyIncome) || 0));
    const budgets = {};

    if (framework === '50_30_20') {
      const needs = income * 0.50;
      const wants = income * 0.30;
      budgets['飲食'] = Math.round(needs * 0.55);      // 餐費佔必要 55%
      budgets['交通'] = Math.round(needs * 0.15);      // 交通 15%
      budgets['住宿'] = Math.round(needs * 0.20);      // 住宿水電 20%
      budgets['生活用品'] = Math.round(needs * 0.10);  // 生活用品 10%

      budgets['娛樂'] = Math.round(wants * 0.40);      // 娛樂 40%
      budgets['購物'] = Math.round(wants * 0.35);      // 購物 35%
      budgets['社交'] = Math.round(wants * 0.25);      // 社交 25%
    } else if (framework === '6_jars') {
      const nec = income * 0.55;
      const play = income * 0.10;
      const edu = income * 0.10;
      const give = income * 0.05;

      budgets['飲食'] = Math.round(nec * 0.60);
      budgets['交通'] = Math.round(nec * 0.15);
      budgets['住宿'] = Math.round(nec * 0.15);
      budgets['生活用品'] = Math.round(nec * 0.10);

      budgets['娛樂'] = Math.round(play * 0.60);
      budgets['購物'] = Math.round(play * 0.40);
      budgets['教育'] = Math.round(edu);
      budgets['社交'] = Math.round(give);
    } else {
      const items = customItems.length > 0 ? customItems : DEFAULT_PLAN_CONFIG.customItems;
      items.forEach(it => {
        const amt = Math.round(income * (it.percent / 100));
        if (it.name.includes('餐') || it.name.includes('飲')) budgets['飲食'] = amt;
        else if (it.name.includes('娛樂')) budgets['娛樂'] = amt;
        else if (it.name.includes('交通')) budgets['交通'] = amt;
        else if (it.name.includes('生活')) budgets['生活用品'] = amt;
        else if (it.name.includes('學習') || it.name.includes('教育')) budgets['教育'] = amt;
      });
      if (!budgets['飲食']) budgets['飲食'] = Math.round(income * 0.3);
    }

    return budgets;
  }

  // --- 財務規劃 (50/30/20, 六個罐子, 自訂) ---

  getFinancialPlan() {
    const data = this.ensureCurrentData();
    return data.financialPlan || { ...DEFAULT_PLAN_CONFIG };
  }

  saveFinancialPlan(planConfig) {
    const data = this.ensureCurrentData();
    data.financialPlan = { ...data.financialPlan, ...planConfig };
    this.saveData(this.getActiveProfileId(), data);
    return data.financialPlan;
  }

  calculatePlanAllocations(framework, monthlyIncome, customItems = []) {
    const income = Math.max(0, Math.round(Number(monthlyIncome) || 0));
    let allocations = [];

    if (framework === '50_30_20') {
      allocations = [
        {
          key: 'needs',
          name: '必要支出 (50%)',
          subtext: '房租、餐費、水電、交通等基本開銷',
          percent: 50,
          color: '#E76F51',
          amount: Math.round(income * 0.50)
        },
        {
          key: 'wants',
          name: '想要支出 (30%)',
          subtext: '社交聚餐、手搖飲、購物娛樂、治裝',
          percent: 30,
          color: '#F4A261',
          amount: Math.round(income * 0.30)
        },
        {
          key: 'savings',
          name: '儲蓄與投資 (20%)',
          subtext: '緊急預備金、長期定存、ETF理財',
          percent: 20,
          color: '#2A9D8F',
          amount: Math.round(income * 0.20)
        }
      ];
    } else if (framework === '6_jars') {
      allocations = [
        {
          key: 'necessity',
          name: '生活必需 (55%)',
          subtext: '日常吃飯、交通、房租、電話費',
          percent: 55,
          color: '#E76F51',
          amount: Math.round(income * 0.55)
        },
        {
          key: 'lt_saving',
          name: '長期儲蓄 (10%)',
          subtext: '未來旅行基金、大額採購準備',
          percent: 10,
          color: '#F4A261',
          amount: Math.round(income * 0.10)
        },
        {
          key: 'financial_freedom',
          name: '財務自由 (10%)',
          subtext: '定期定額投資、股息累積生生不息',
          percent: 10,
          color: '#E9C46A',
          amount: Math.round(income * 0.10)
        },
        {
          key: 'education',
          name: '教育成長 (10%)',
          subtext: '購書、語言課程、技能培訓講座',
          percent: 10,
          color: '#2A9D8F',
          amount: Math.round(income * 0.10)
        },
        {
          key: 'play',
          name: '休閒娛樂 (10%)',
          subtext: '犒賞自己、電影聚會、隨興玩樂',
          percent: 10,
          color: '#A3B18A',
          amount: Math.round(income * 0.10)
        },
        {
          key: 'give',
          name: '贈與分享 (5%)',
          subtext: '朋友送禮、捐款公益、請客交流',
          percent: 5,
          color: '#D4A373',
          amount: Math.round(income * 0.05)
        }
      ];
    } else {
      // 自訂比例
      const items = (customItems && customItems.length > 0) ? customItems : DEFAULT_PLAN_CONFIG.customItems;
      allocations = items.map(item => ({
        key: item.name,
        name: `${item.name} (${item.percent}%)`,
        subtext: item.subtext || '自訂項目分配',
        percent: item.percent,
        color: item.color || '#F4A261',
        amount: Math.round(income * (item.percent / 100))
      }));
    }

    return allocations;
  }

  // --- 借貸管理與還款 CRUD ---

  getDebts() {
    const data = this.ensureCurrentData();
    const list = [...(data.debts || [])];
    list.sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
    return list;
  }

  addDebt(debt) {
    const data = this.ensureCurrentData();
    const amount = Math.round(Number(debt.amount) || 0);
    if (amount <= 0) throw new Error('借款金額必須大於 0');

    const newDebt = {
      id: 'debt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: (debt.name || '朋友').trim(),
      relationship: (debt.relationship || '朋友').trim(),
      amount,
      borrowDate: debt.borrowDate || getLocalDateString(),
      dueDate: debt.dueDate || '',
      note: (debt.note || '').trim(),
      paidAmount: 0,
      remainingAmount: amount,
      status: 'unpaid', // unpaid, partial, paid
      repayments: [],
      createdAt: Date.now()
    };

    data.debts.push(newDebt);
    this.saveData(this.getActiveProfileId(), data);
    return newDebt;
  }

  updateDebt(id, updates) {
    const data = this.ensureCurrentData();
    const index = data.debts.findIndex(d => d.id === id);
    if (index === -1) return null;

    const current = data.debts[index];
    const amount = updates.amount !== undefined ? Math.round(Number(updates.amount) || 0) : current.amount;
    const paidAmount = updates.paidAmount !== undefined ? Math.round(Number(updates.paidAmount) || 0) : current.paidAmount;
    const remainingAmount = Math.max(0, amount - paidAmount);

    let status = 'unpaid';
    if (remainingAmount === 0) status = 'paid';
    else if (paidAmount > 0) status = 'partial';

    const updated = {
      ...current,
      ...updates,
      amount,
      paidAmount,
      remainingAmount,
      status,
      updatedAt: Date.now()
    };

    data.debts[index] = updated;
    this.saveData(this.getActiveProfileId(), data);
    return updated;
  }

  addRepayment(debtId, repayAmount, note = '') {
    const data = this.ensureCurrentData();
    const debt = data.debts.find(d => d.id === debtId);
    if (!debt) throw new Error('找不到該借款紀錄');

    const amt = Math.round(Number(repayAmount) || 0);
    if (amt <= 0) throw new Error('還款金額必須大於 0');

    const repayment = {
      id: 'rep_' + Date.now(),
      amount: amt,
      date: getLocalDateString(),
      note: (note || '').trim()
    };

    if (!debt.repayments) debt.repayments = [];
    debt.repayments.push(repayment);

    debt.paidAmount = (debt.paidAmount || 0) + amt;
    debt.remainingAmount = Math.max(0, debt.amount - debt.paidAmount);

    if (debt.remainingAmount === 0) {
      debt.status = 'paid';
    } else {
      debt.status = 'partial';
    }

    this.saveData(this.getActiveProfileId(), data);
    return debt;
  }

  deleteDebt(id) {
    const data = this.ensureCurrentData();
    const beforeLen = data.debts.length;
    data.debts = data.debts.filter(d => d.id !== id);
    if (data.debts.length !== beforeLen) {
      this.saveData(this.getActiveProfileId(), data);
      return true;
    }
    return false;
  }

  getDebtStats() {
    const debts = this.getDebts();
    let totalUncollected = 0;
    let overdueCount = 0;
    const debtorMap = {};
    const today = getLocalDateString();

    debts.forEach(d => {
      const remaining = Number(d.remainingAmount) || 0;
      totalUncollected += remaining;

      if (remaining > 0 && d.dueDate && d.dueDate < today) {
        overdueCount++;
      }

      if (remaining > 0) {
        debtorMap[d.name] = (debtorMap[d.name] || 0) + remaining;
      }
    });

    const debtorRanking = Object.entries(debtorMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalUncollected,
      overdueCount,
      totalDebtsCount: debts.length,
      debtorRanking
    };
  }

  // --- 一鍵載入「大學生範本資料」 (Demo Mode) ---

  loadDemoData() {
    const profile = this.getActiveProfile();
    if (!profile) return false;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const thisMonth = `${yyyy}-${mm}`;

    // 上個月
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const demoTransactions = [
      // 本月收入
      { id: 'demo_1', type: 'income', category: '生活費', amount: 10000, date: `${thisMonth}-01`, note: '爸媽給的生活費轉帳' },
      { id: 'demo_2', type: 'income', category: '打工收入', amount: 8500, date: `${thisMonth}-05`, note: '校園咖啡廳兼職薪資' },
      { id: 'demo_3', type: 'income', category: '獎學金', amount: 3000, date: `${thisMonth}-10`, note: '系上學期書卷獎學金' },

      // 本月支出
      { id: 'demo_4', type: 'expense', category: '住宿', amount: 5500, date: `${thisMonth}-01`, note: '學生宿舍與水電分攤' },
      { id: 'demo_5', type: 'expense', category: '飲食', amount: 4800, date: `${thisMonth}-12`, note: '半個月校內學餐與日常外食' },
      { id: 'demo_6', type: 'expense', category: '交通', amount: 1200, date: `${thisMonth}-03`, note: '悠遊卡基北北桃 1200 定期票' },
      { id: 'demo_7', type: 'expense', category: '娛樂', amount: 1650, date: `${thisMonth}-08`, note: '期中考完與室友聚餐唱KTV' },
      { id: 'demo_8', type: 'expense', category: '教育', amount: 890, date: `${thisMonth}-06`, note: '微積分原文書影印與筆記本' },
      { id: 'demo_9', type: 'expense', category: '生活用品', amount: 620, date: `${thisMonth}-09`, note: '全聯採買洗衣精、衛生紙、洗髮精' },
      { id: 'demo_10', type: 'expense', category: '社交', amount: 750, date: `${thisMonth}-14`, note: '系學會學弟妹迎新宿營分攤' },

      // 上月支出 (供分析與對比)
      { id: 'demo_11', type: 'income', category: '生活費', amount: 10000, date: `${lastMonthStr}-01`, note: '上月生活費' },
      { id: 'demo_12', type: 'expense', category: '飲食', amount: 5600, date: `${lastMonthStr}-15`, note: '上月整月伙食費' },
      { id: 'demo_13', type: 'expense', category: '娛樂', amount: 2400, date: `${lastMonthStr}-20`, note: '上月看展覽與出遊' }
    ];

    const demoBudgets = {
      '飲食': 6000,
      '交通': 1200,
      '住宿': 5500,
      '娛樂': 1500, // 故意觸發超支提醒！(花 1650 > 1500)
      '生活用品': 800
    };

    // 示範借款
    const demoDebts = [
      {
        id: 'debt_demo_1',
        name: '阿豪',
        relationship: '分組同學',
        amount: 1200,
        borrowDate: `${thisMonth}-02`,
        dueDate: `${thisMonth}-10`,
        note: '一起買課本他網銀轉不過先幫墊',
        paidAmount: 400,
        remainingAmount: 800,
        status: 'partial',
        repayments: [{ id: 'rep_1', amount: 400, date: `${thisMonth}-08`, note: '還了現金四百' }]
      },
      {
        id: 'debt_demo_2',
        name: '小陳',
        relationship: '大學室友',
        amount: 450,
        borrowDate: `${thisMonth}-05`,
        dueDate: `${thisMonth}-06`,
        note: '半夜一起點永和豆漿宵夜外送',
        paidAmount: 450,
        remainingAmount: 0,
        status: 'paid',
        repayments: [{ id: 'rep_2', amount: 450, date: `${thisMonth}-06`, note: '隔天 LINE Pay 全額結清' }]
      },
      {
        id: 'debt_demo_3',
        name: '冠宇',
        relationship: '高中死黨',
        amount: 2500,
        borrowDate: `${lastMonthStr}-15`,
        dueDate: `${lastMonthStr}-30`,
        note: '說要換機車輪胎急借',
        paidAmount: 0,
        remainingAmount: 2500,
        status: 'unpaid',
        repayments: []
      }
    ];

    const demoData = {
      transactions: demoTransactions,
      budgets: demoBudgets,
      monthlyBudgets: {
        [thisMonth]: {
          confirmed: true,
          framework: '50_30_20',
          monthlyIncome: 21500,
          categories: demoBudgets,
          confirmedAt: new Date().toISOString()
        }
      },
      financialPlan: {
        framework: '50_30_20',
        monthlyIncome: 21500,
        customItems: DEFAULT_PLAN_CONFIG.customItems
      },
      debts: demoDebts,
      customCategories: { income: [], expense: [] }
    };

    this.saveData(profile.id, demoData);
    return true;
  }

  // --- 資料匯出與備份 (JSON / CSV) ---

  exportJSON() {
    const profile = this.getActiveProfile();
    const data = this.ensureCurrentData();
    const exportObj = {
      app: 'Money-Buibui — 大學生的可愛理財管家',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile: { nickname: profile ? profile.nickname : '我的手帳' },
      data
    };
    return JSON.stringify(exportObj, null, 2);
  }

  exportTransactionsCSV() {
    const txs = this.getTransactions();
    const headers = ['記帳ID', '類型', '分類', '金額(NT$)', '日期', '備註'];
    const rows = txs.map(t => [
      `"${t.id}"`,
      `"${t.type === 'income' ? '收入' : '支出'}"`,
      `"${t.category}"`,
      t.amount,
      `"${t.date}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);
    return '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) {
        throw new Error('檔案格式不符，找不到手帳核心數據');
      }
      this.saveData(this.getActiveProfileId(), parsed.data);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      throw new Error('匯入失敗：' + e.message);
    }
  }
}

// 建立全域單例
const mbStorage = new MoneyBuddyStorage();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MoneyBuddyStorage, mbStorage, DEFAULT_CATEGORIES, DEFAULT_PLAN_CONFIG, CATEGORY_ICONS };
}
