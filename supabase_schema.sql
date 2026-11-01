-- ========================================================
-- Money Buddy — 大學生的可愛理財管家 Supabase 資料庫綱要
-- 包含完整的資料表定義、外鍵關聯、索引與 Row Level Security (RLS) 政策
-- ========================================================

-- 1. 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 使用者個人手帳基本資訊表 (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '我的手帳',
  avatar_mood TEXT DEFAULT 'happy',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 啟用 Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "使用者只能查看與修改自己的個人資料"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id);

-- 3. 收支記帳紀錄表 (Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引加速月份與類型查詢
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);

-- 啟用 Transactions RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "使用者只能存取自己的記帳資料"
  ON public.transactions
  FOR ALL
  USING (auth.uid() = user_id);

-- 4. 每月分類預算表 (Budgets)
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  year_month TEXT NOT NULL, -- e.g. '2026-11'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, year_month)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "使用者只能存取自己的預算資料"
  ON public.budgets
  FOR ALL
  USING (auth.uid() = user_id);

-- 5. 財務規劃偏好表 (Financial Plans)
CREATE TABLE IF NOT EXISTS public.financial_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  framework TEXT NOT NULL DEFAULT '50_30_20' CHECK (framework IN ('50_30_20', '6_jars', 'custom')),
  monthly_income NUMERIC(12, 2) DEFAULT 18000,
  custom_config JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "使用者只能存取自己的理財規劃"
  ON public.financial_plans
  FOR ALL
  USING (auth.uid() = user_id);

-- 6. 借貸紀錄表 (Debts)
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT DEFAULT '朋友',
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  note TEXT DEFAULT '',
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debts_user_status ON public.debts(user_id, status);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "使用者只能存取自己的借貸紀錄"
  ON public.debts
  FOR ALL
  USING (auth.uid() = user_id);

-- 7. 還款紀錄明細表 (Repayments)
CREATE TABLE IF NOT EXISTS public.repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "使用者只能存取自己的還款紀錄"
  ON public.repayments
  FOR ALL
  USING (auth.uid() = user_id);
