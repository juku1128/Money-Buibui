/**
 * Money Buddy — AI 情境式催款訊息生成器資料庫與本地情境演算引擎
 * 支援 9 大催款風格（每種風格均提供 20 種完全不同的回應方式，共 180 種獨立情境話術）
 * 具備情境感度：對象稱呼、欠款金額、拖欠天數、借款事由、拖欠現況
 */

const REMINDER_SCRIPTS = {
  // 1. 溫柔提醒型
  gentle: {
    id: 'gentle',
    name: '溫柔提醒型',
    badge: '🌱 貼心友善',
    tagline: '像好友般自然親切，不造成任何心理負擔',
    description: '適合剛借不久或感情深厚的好友，用關心問候開場，自然融入還款對帳。',
    isHell: false,
    isTrash: false,
    theme: 'border-matcha-200 bg-matcha-50/30 text-matcha-800'
  },

  // 2. 可愛撒嬌型
  cute: {
    id: 'cute',
    name: '可愛撒嬌型',
    badge: '🐾 軟萌撒嬌',
    tagline: '顏文字滿滿，用賣萌化解要錢的尷尬氣氛',
    description: '適合好閨蜜、親近室友或同溫層，用哭窮、珍奶基金與無辜表情迅速破冰。',
    isHell: false,
    isTrash: false,
    theme: 'border-pink-200 bg-pink-50/40 text-pink-700'
  },

  // 3. 幽默搞笑型
  humorous: {
    id: 'humorous',
    name: '幽默搞笑型',
    badge: '🎪 迷因搞笑',
    tagline: '浮誇迷因、鈔票尋人啟事，笑著把錢收回來',
    description: '適合常互虧的朋友與同學，把欠款轉化成好笑的荒謬小劇場，不傷感情又記憶點深刻。',
    isHell: false,
    isTrash: false,
    theme: 'border-amber-200 bg-amber-50/40 text-amber-800'
  },

  // 4. 正式禮貌型
  formal: {
    id: 'formal',
    name: '正式禮貌型',
    badge: '👔 謹慎客氣',
    tagline: '公事公辦、清晰條理，保持舒適禮貌距離',
    description: '適合分組組員、不熟同學、學長姐或代購分攤，清楚核對金額與轉帳帳號。',
    isHell: false,
    isTrash: false,
    theme: 'border-stone-300 bg-stone-50/60 text-stone-700'
  },

  // 5. 委婉但堅定型
  firm_polite: {
    id: 'firm_polite',
    name: '委婉但堅定型',
    badge: '🎯 清楚明確',
    tagline: '說明自己的實際生活需求，立場明確給出期限',
    description: '適合拖欠一陣子但仍想維持交情時，以房租、水電或生活費為由要求確定還款日。',
    isHell: false,
    isTrash: false,
    theme: 'border-blue-200 bg-blue-50/40 text-blue-800'
  },

  // 6. 強硬但有禮貌型
  strong_polite: {
    id: 'strong_polite',
    name: '強硬但有禮貌型',
    badge: '⚡ 最後通牒',
    tagline: '不再容許藉口拖延，設定具體截止日與原則',
    description: '適合多次承諾跳票、已讀不回或藉故拖延者，語氣堅定強硬，訴諸承諾與誠信。',
    isHell: false,
    isTrash: false,
    theme: 'border-orange-300 bg-orange-50/50 text-orange-900'
  },

  // 7. 粗口暴躁型（地獄催款模式 🔥）
  hell_furious: {
    id: 'hell_furious',
    name: '粗口暴躁型 🔥',
    badge: '🔥 地獄模式',
    tagline: '台味暴躁、情緒拉滿、咆哮直球對決！',
    description: '【地獄模式】友誼小船翻覆預警！滿滿台味直球狂轟，適合裝死到極致、非開罵不還錢的對象。',
    isHell: true,
    isTrash: false,
    theme: 'border-red-500 bg-red-950 text-red-100'
  },

  // 8. 法律威嚇型（地獄催款模式 ⚖️）
  hell_legal: {
    id: 'hell_legal',
    name: '法律威嚇型 ⚖️',
    badge: '⚖️ 法槌降臨',
    tagline: '存證信函口吻、保全證據、循法律程序追討',
    description: '【地獄模式】正式法律催告通知，點明通訊對話保全、督促程序支付命令與遲延利息。',
    isHell: true,
    isTrash: false,
    theme: 'border-red-700 bg-stone-900 text-stone-200'
  },

  // 9. 垃圾話型（全新北爛白痴風格 🤡）
  trash_talk: {
    id: 'trash_talk',
    name: '垃圾話型 🤡',
    badge: '🤡 北爛經濟學',
    tagline: '一本正經地胡說八道！經濟學荒謬梗大集合',
    description: '【全新特色】將機會成本、邊際效用、賽局理論、囚徒困境、沉沒成本等概念化作極度北爛的搞笑催款論述！',
    isHell: false,
    isTrash: true,
    theme: 'border-purple-300 bg-purple-50/50 text-purple-900'
  }
};

/**
 * 9 大風格、各 20 種完全不同的生成器陣列（共 180 種獨立回應方式）
 */
const STYLE_VARIATIONS = {
  // ================= 1. 溫柔提醒型 (gentle) 20 種 =================
  gentle: [
    c => ({
      title: '日常問候切入',
      text: `嗨 ${c.name}～最近這週過得還順利嗎？🌱\n想說順便跟你對一下帳，上次${c.reason ? `因為「${c.reason}」` : ''}借給你的那筆 NT$ ${c.amountStr}，不知道你這兩天手頭方不方便？如果 OK 的話再麻煩用 LINE Pay 或轉帳給我喔！謝謝你，祝你今天一切順心～✨`
    }),
    c => ({
      title: '整理記帳手帳',
      text: `哈囉 ${c.name}！最近我在整理每月的記帳手帳，剛好看到之前代墊的 NT$ ${c.amountStr}（算下來大約過了 ${c.days} 天囉）～目前手頭狀況是「${c.situation}」，想說這兩天看你方不方便匯款一下？再麻煩你看一下網銀囉，辛苦了，感謝！🍵`
    }),
    c => ({
      title: '貼心確認時程',
      text: `嗨 ${c.name}～希望沒有打擾到你！想跟你確認一下之前「${c.reason}」的 NT$ ${c.amountStr}，你預計這週哪一天轉帳比較方便呢？你可以先跟我說一聲，我這邊記帳比較好排預算，謝謝你的幫忙喔！🌸`
    }),
    c => ({
      title: '網銀順手對帳',
      text: `嗨 ${c.name}，剛好在用網銀順便對一下這陣子的帳目，上次幫忙代墊的 NT$ ${c.amountStr} 還沒銷帳。不急，你有空的時候再幫我轉過來就可以囉～謝謝你！🍀`
    }),
    c => ({
      title: '聚會閒聊關心',
      text: `嗨 ${c.name}！上次一起聚會很開心～順便提一下那天「${c.reason}」的代墊款 NT$ ${c.amountStr}，看你這兩天方不方便用街口或 LINE Pay 轉給我，感謝你唷！☕`
    }),
    c => ({
      title: '整理皮夾發票',
      text: `哈囉 ${c.name}，今天整理皮夾發票看到之前代墊「${c.reason}」的收據明細，金額是 NT$ ${c.amountStr}。想說先敲你一下留個紀錄，有空再麻煩處理一下囉！😊`
    }),
    c => ({
      title: '月初預算重整',
      text: `嗨 ${c.name}～新的一個月開始在抓整體生活預算，想起上個月借出約 ${c.days} 天的那筆 NT$ ${c.amountStr}。目前手頭剛好「${c.situation}」，方便的話這兩天再麻煩你匯款囉，謝謝！`
    }),
    c => ({
      title: '零錢對齊順手轉',
      text: `哈囉 ${c.name}，這幾天買東西剛好看到戶頭餘額，之前那筆 NT$ ${c.amountStr} 看你這週什麼時候方便再轉給我～有勞了！🌿`
    }),
    c => ({
      title: '溫暖問候順帶提',
      text: `嗨 ${c.name}，最近天氣轉變（期中期末也加油喔）～記得多保重身體！另外順便溫柔提醒一下上次「${c.reason}」的 NT$ ${c.amountStr}，方便時再幫我轉帳，感恩！✨`
    }),
    c => ({
      title: '自嘲金魚腦備忘',
      text: `嗨 ${c.name}～怕我自己的金魚腦時間久了會忘記，所以先傳個訊息提醒我們之間還有這筆 NT$ ${c.amountStr} 的代墊款，等你方便時再隨手轉給我就可以囉！😄`
    }),
    c => ({
      title: '週五放假好心情',
      text: `嗨 ${c.name}！祝你週末愉快～想說趁放假前把帳目對齊一下，之前那筆 NT$ ${c.amountStr} 如果手頭方便的話再麻煩轉帳囉，祝你有個美好的週末！🌈`
    }),
    c => ({
      title: '生活開銷分攤',
      text: `哈囉 ${c.name}，剛好在採買生活用品，想起上次「${c.reason}」的代墊款 NT$ ${c.amountStr}（大約借了 ${c.days} 天）。這兩天如果有空再麻煩轉給我，謝謝幫忙！🛒`
    }),
    c => ({
      title: '寬容貼心不催促',
      text: `嗨 ${c.name}～上次借的 NT$ ${c.amountStr} 不知道你最近手頭轉得開嗎？如果剛好遇到困難可以先跟我說一聲，若方便的話這週再幫我結清喔，謝謝你的體諒！🤝`
    }),
    c => ({
      title: '簡單打招呼留訊',
      text: `嗨嗨 ${c.name}！敲敲門提醒一下～上次「${c.reason}」的款項 NT$ ${c.amountStr}，有空再麻煩幫我轉帳一下囉，謝謝你～🌟`
    }),
    c => ({
      title: '感謝平時照顧',
      text: `哈囉 ${c.name}，平時謝謝你的照顧與幫忙！順便對一下帳目，上次借出的 NT$ ${c.amountStr} 已經過了 ${c.days} 天，方便的話請在這兩天幫我轉個帳喔，感謝！✨`
    }),
    c => ({
      title: '外食午餐想起',
      text: `嗨 ${c.name}～剛吃完午餐剛好在核對個人開銷，想起先前代墊「${c.reason}」的 NT$ ${c.amountStr}。等你有空再幫我轉帳即可，祝你今天順心！🍱`
    }),
    c => ({
      title: '超商繳費提醒',
      text: `哈囉 ${c.name}，剛好準備要去超商繳費，想到還有這筆 NT$ ${c.amountStr} 的款項，看你這兩天方不方便順手用網銀轉過來，謝謝你囉！`
    }),
    c => ({
      title: '行事曆備忘通知',
      text: `嗨 ${c.name}，行事曆跳出提醒～上次那筆 NT$ ${c.amountStr} 算下來已經過了約 ${c.days} 天囉。想說先跟你對一下，看什麼時候方便轉帳，辛苦囉！📅`
    }),
    c => ({
      title: '下午茶點心時光',
      text: `嗨 ${c.name}～買飲料時想到這筆代墊款 NT$ ${c.amountStr}，現況是「${c.situation}」，如果方便的話這週再麻煩你幫我轉個帳喔，謝謝！🧋`
    }),
    c => ({
      title: '體貼確認總結',
      text: `哈囉 ${c.name}，想跟你確認一下先前「${c.reason}」代墊金額是 NT$ ${c.amountStr} 正確無誤嗎？如果確認的話看這兩天方不方便轉帳，非常感謝你！💐`
    })
  ],

  // ================= 2. 可愛撒嬌型 (cute) 20 種 =================
  cute: [
    c => ({
      title: '錢包咕嚕叫賣萌',
      text: `${c.name} 寶貝～(｡･ω･｡)ﾉ♡\n你家小可憐的錢包已經在抗議咕嚕咕嚕叫了！上次借你的 NT$ ${c.amountStr} 可以支援救駕一下嗎～我的珍珠奶茶基金就全靠你惹！🥺🧋 叩謝大恩大德～`
    }),
    c => ({
      title: '柴柴小夥伴敲門',
      text: `報告大俠 ${c.name}！🐾\n有隻窮到在啃吐司邊的小室友路過提醒：還記得那筆散落在你那裡的 NT$ ${c.amountStr} 嗎？（已經過了 ${c.days} 天囉～）小弟肚子好餓，求施捨歸還！🍙💖`
    }),
    c => ({
      title: '誇張賣慘破冰',
      text: `報告最帥/最美的 ${c.name}！(*/ω＼*)\n本月的窮鬼警報已經響起十級警報 🚨！再收不到之前那筆「${c.reason}」的 NT$ ${c.amountStr}，我就要去學餐門口賣藝賣笑了嗚嗚～方便隨手賞賜一下轉帳嗎？愛你唷！🥰✨`
    }),
    c => ({
      title: '地上打滾撒嬌',
      text: `_(:3」∠)_ ${c.name}～我在地上滾來滾去滾來滾去！欠款 NT$ ${c.amountStr} 的時鐘已經滴答滴答跑了 ${c.days} 天啦～求求大好人動動手指轉個帳，把我從地上拉起來吧！💖`
    }),
    c => ({
      title: '珍奶微冰微糖支援',
      text: `嗶嗶嗶～呼叫 ${c.name}！今日生命體徵維持急需一杯珍奶微糖微冰！上次借你的 NT$ ${c.amountStr} 就是我的救命仙丹呀～快快施展網銀轉帳術召喚它回來叭！🥤✨`
    }),
    c => ({
      title: '貓咪肉球拍拍',
      text: `(=^･ω･^=) 貓爪肉球輕輕拍拍 ${c.name} 的肩膀～主人主人，上次「${c.reason}」借出去的 NT$ ${c.amountStr} 什麼時候可以回家買罐罐呀？喵嗚～🐾`
    }),
    c => ({
      title: '哭哭顏文字攻勢',
      text: `(つД;) 嗚嗚嗚 ${c.name}～錢錢你在哪裡呀！已經過了 ${c.days} 天，錢錢肯定很想念我！看在小的一片赤誠，今天賞賜一下轉帳 NT$ ${c.amountStr} 救救我叭！🥺`
    }),
    c => ({
      title: '討債小幽靈降臨',
      text: `👻 飄啊飄～有一隻可愛的討債小幽靈悄悄降落在 ${c.name} 身邊：「不給 NT$ ${c.amountStr} 就搗蛋！現況：${c.situation}～」嘻嘻，方便的話今天幫我轉一下嘛！🍬`
    }),
    c => ({
      title: '魔法小仙子施法',
      text: `🪄 咻咻咻～仙女棒揮舞！對著 ${c.name} 的手機施法：自動開啟網銀、自動輸入我的帳號、自動匯出 NT$ ${c.amountStr}！叮！魔法已生效，就等您確認囉！✨`
    }),
    c => ({
      title: '無辜狗狗眼神',
      text: `🥺 ${c.name} 看著我水汪汪的大眼睛！上次借你的 NT$ ${c.amountStr}，能不能施捨給貧困的在下呢？我保證轉帳完會用最燦爛的笑容迎接你！🐶💕`
    }),
    c => ({
      title: '愛心電波嗶嗶嗶',
      text: `(ﾉ>ω<)ﾉ 嗶嗶嗶！發射超強力愛心催款電波接收器！目標：${c.name}！任務：將 NT$ ${c.amountStr} 匯入指定帳戶！完成任務即可獲得一整年份的好運唷！🍀`
    }),
    c => ({
      title: '今晚泡麵求加蛋',
      text: `${c.name} 大恩人！小的今天晚餐吃泡麵，究竟能不能加一顆 15 元的茶葉蛋，全看您這筆「${c.reason}」的 NT$ ${c.amountStr} 什麼時候能入帳啦～跪求轉帳加蛋！🍜🥚`
    }),
    c => ({
      title: '抱大腿不放撒嬌',
      text: `抱住 ${c.name} 的大腿開始撒嬌哭哭！欠了 ${c.days} 天的 NT$ ${c.amountStr}～好心的大人行行好，動動手指賞個轉帳吧，我願意幫你搥背 10 分鐘！🙇‍♀️💖`
    }),
    c => ({
      title: '企鵝搖擺登場',
      text: `🐧 企鵝小碎步搖擺滑進來！親愛的 ${c.name}，請簽收今日份的可愛通知單：欠款 NT$ ${c.amountStr} 請撥空轉帳～企鵝在此鞠躬致謝！❄️`
    }),
    c => ({
      title: '甜甜圈咬一口誘惑',
      text: `🍩 ${c.name}～只要你今天帥氣/美麗地把 NT$ ${c.amountStr} 轉給我，下次見面我分你咬一口最好吃的甜甜圈！成交的話現在立刻打開網銀叭～好不好嘛！`
    }),
    c => ({
      title: '倒地不起貧血警告',
      text: `😵‍💫 報告 ${c.name}！因戶頭嚴重失血，小弟目前處於貧血休克狀態！急需一筆 NT$ ${c.amountStr} 的強心針急救～再不轉帳我就要在地上賴著不起來惹！`
    }),
    c => ({
      title: '專屬催款小精靈',
      text: `🧚‍♀️ 叮咚！您訂閱的專屬催款小精靈已上線！今日提醒項目：「${c.reason}」共 NT$ ${c.amountStr}！請 ${c.name} 給個面子隨手轉轉，祝小天使永遠青春美麗！`
    }),
    c => ({
      title: '存款告急小警笛',
      text: `🚨 嗶波嗶波！血量只剩 1 滴！${c.name} 快來當拯救世界的超級英雄，用 NT$ ${c.amountStr} 幫我補血！英雄大人請受小的一拜！🦸‍♂️`
    }),
    c => ({
      title: '一百個飛吻大禮包',
      text: `😘 預支一百個飛吻與感謝大禮包給 ${c.name}！上次代墊的 NT$ ${c.amountStr} 如果今天方便的話再麻煩轉過來囉～愛你愛你！💋`
    }),
    c => ({
      title: '捏捏臉頰溫馨提示',
      text: `🤏 伸手捏捏 ${c.name} 的小臉頰～提醒一下：那筆 NT$ ${c.amountStr} 已經在外面流浪 ${c.days} 天囉！快放它回我的皮夾團圓吧，拜託拜託～🥰`
    })
  ],

  // ================= 3. 幽默搞笑型 (humorous) 20 種 =================
  humorous: [
    c => ({
      title: '鈔票尋人啟事',
      text: `【緊急協尋鈔票啟事】🚨\n有一批面額總計 NT$ ${c.amountStr} 的新台幣在 ${c.name} 那裡迷路了 ${c.days} 天！它昨晚托夢跟我說它很想家，想回到原本的皮夾裡團聚。請問好心人什麼時候能安排它回家團圓？急，在線等！🤣✈️`
    }),
    c => ({
      title: '氣象局破產警報',
      text: `親愛的 ${c.name}，根據氣象局最新觀測，我目前的戶頭餘額已經進入強烈暴風雨低壓帶 📉。\n為了避免引發破產海嘯，那筆「${c.reason}」的 NT$ ${c.amountStr} 差不多是時候該召回本島了！感謝英雄即刻救援 ⛵！`
    }),
    c => ({
      title: 'VIP 友情續費通知',
      text: `叮咚！您的【友好度 VIP 頂級訂閱】即將因 NT$ ${c.amountStr} 的帳單到期而面臨降級風險 ⚡！距離上次「${c.reason}」已經過去 ${c.days} 天，請點擊網銀轉帳按鈕完成續費，即可享有繼續跟我打屁哈拉的高級權益 🎁！`
    }),
    c => ({
      title: '時光機穿越梗',
      text: `嗨 ${c.name}！你之前說的「過兩天就轉」，該不會是指搭乘時光機穿越到西元 3000 年的過兩天吧 🛸？那筆 NT$ ${c.amountStr} 已經借了 ${c.days} 天，請立刻降落地球打開網銀！`
    }),
    c => ({
      title: '遺產預約通知書',
      text: `親愛的 ${c.name}，這筆「${c.reason}」的 NT$ ${c.amountStr} 再拖下去，我可能得寫進個人遺囑，交代我未來的孫子拿著借據去找你的孫子要了！為了世界和平，今天先轉給我吧！📜`
    }),
    c => ({
      title: '尋寶獵人模式',
      text: `報告 ${c.name}！我剛剛買了一把金屬探測器與尋寶地圖，準備去你房間尋找那張失蹤了 ${c.days} 天的 NT$ ${c.amountStr} 鈔票。不想被尋寶獵人打擾的話，請火速用 LINE Pay 平倉！🗺️`
    }),
    c => ({
      title: '網銀失憶症診斷',
      text: `哈囉 ${c.name}！經醫學鑑定，你的手機很可能感染了一種罕見病毒——只要想打開網銀轉 NT$ ${c.amountStr} 給我就會自動閃退！需要我親自幫你輸入密碼治療嗎？🩺`
    }),
    c => ({
      title: '友情股票跌停板',
      text: `報告投資人 ${c.name}！本友情證券交易所今日發出公告：由於應收帳款 NT$ ${c.amountStr} 逾期 ${c.days} 天，本檔友情概念股已連續三根跌停，請立刻注資避免強制下市！📉`
    }),
    c => ({
      title: '國稅局查稅小劇場',
      text: `【國稅局稽徵通知】納稅義務人 ${c.name} 台端：您有一筆未申報的「${c.reason}」代墊款 NT$ ${c.amountStr}，滯納天數已達 ${c.days} 日，請立刻打開轉帳頁面完成申報，免受滯納金處分！🏛️`
    }),
    c => ({
      title: '私家偵探調查報告',
      text: `報告長官！我的私家偵探回報：${c.name} 剛剛點了一杯 70 元大冰奶，而且還加了布丁！這證明資金鏈健全！那筆欠了 ${c.days} 天的 NT$ ${c.amountStr} 是不是可以順便結算一下了？🕵️‍♂️`
    }),
    c => ({
      title: '醫學奇蹟祈禱中',
      text: `嗨 ${c.name}！我現在每天早上醒來的第一件事，不是刷牙洗臉，而是看網銀有沒有發生「${c.name} 突然良心發現轉了 NT$ ${c.amountStr}」的醫學奇蹟！今天能讓奇蹟降臨嗎？🌟`
    }),
    c => ({
      title: '白日夢冒險王',
      text: `昨晚我做了一個夢：夢見 ${c.name} 在路上撿到 NT$ ${c.amountStr}，然後英姿颯爽地甩了一張轉帳明細在我臉上，帥到全場鼓掌！想請問這個夢什麼時候會在現實世界上映？🍿`
    }),
    c => ({
      title: 'NASA 火星探測訊號',
      text: `報告總部！NASA 火星探測車傳回最新訊號：火星地表發現冰層，但依然沒有發現 ${c.name} 還款 NT$ ${c.amountStr} 的蹤跡！全宇宙都在等您轉帳，請立即連線！🚀`
    }),
    c => ({
      title: '轉發錦鯉大吉大利',
      text: `轉發這張討債錦鯉 🐟！今天凡是轉帳 NT$ ${c.amountStr} 給我的善心人士，期末考全過、出門不踩雷、感情順風順水！${c.name} 你就是天選之人，衝啊！`
    }),
    c => ({
      title: '奧運拖延金牌得主',
      text: `如果國際奧委會把「拖延還錢」列入正式比賽項目，憑藉這筆拖了 ${c.days} 天的 NT$ ${c.amountStr}，${c.name} 你絕對是為國爭光的奧運金牌得主！金牌選手快去領獎順便轉帳吧！🥇`
    }),
    c => ({
      title: '靈魂出竅敲碗討債',
      text: `叮咚！我的肉體雖然在宿舍吃空氣，但靈魂已經飄到 ${c.name} 的頭頂上拿著鐵碗瘋狂敲擊：還我 NT$ ${c.amountStr}！還我「${c.reason}」！再不轉帳我今晚就托夢唱歌給你聽！🥣`
    }),
    c => ({
      title: '自動扣款失敗提示',
      text: `【系統提示】您的帳戶扣款失敗！錯誤碼 404：找不到還款意願。對象：${c.name}，金額：NT$ ${c.amountStr}。請手動修復該錯誤，輸入金額並點擊發送！⚠️`
    }),
    c => ({
      title: '在吃土與吃空氣之間',
      text: `親愛的 ${c.name}，在吃土與吃西北風之間，我痛苦地掙扎了 ${c.days} 天。為了拯救一名瀕臨絕種的大學生，那筆 NT$ ${c.amountStr} 請火速支援前線！🍲`
    }),
    c => ({
      title: '頭條誠徵轉帳超人',
      text: `本人鄭重在報紙頭條刊登徵人啟事：誠徵一位名為「${c.name}」的勇者，手持網銀 App 擊退欠款大魔王 NT$ ${c.amountStr}！獎勵是獲得我的永久崇拜！🦸‍♀️`
    }),
    c => ({
      title: '催款脫口秀特別來賓',
      text: `各位觀眾大家晚安！歡迎收看最新一期的脫口秀《那一筆消失了 ${c.days} 天的代墊款》。本集特別來賓是我們最愛的 ${c.name}！讓我們用熱烈掌聲歡迎他現場轉帳 NT$ ${c.amountStr}！👏`
    })
  ],

  // ================= 4. 正式禮貌型 (formal) 20 種 =================
  formal: [
    c => ({
      title: '標準帳務確認',
      text: `您好 ${c.name}：希望沒有打擾到您。想向您確認先前代墊之款項新台幣 ${c.amountStr} 元整（事由：${c.reason}），至今已逾 ${c.days} 日。不知您目前是否方便安排轉帳？完成後再請拍照或告知末五碼以便核對，謝謝您的配合與協助。`
    }),
    c => ({
      title: '確認匯款日程',
      text: `${c.name} 您好：在此提醒您，先前借支之款項 NT$ ${c.amountStr} 尚未完成清償${c.dueDate ? `（約定日期為 ${c.dueDate}）` : ''}。目前現況為「${c.situation}」，想請教您方便於這兩日內確認並回覆預計匯款的具體時間嗎？感謝您的撥冗回覆。`
    }),
    c => ({
      title: '書面清償提醒',
      text: `【款項清償提醒】致 ${c.name}：關於日前雙方約定之代墊款項 NT$ ${c.amountStr}（事由：${c.reason}），請於本週內撥空處理匯款作業。若款項已匯出，敬請提供交易明細以便銷帳，非常感謝您的協助。`
    }),
    c => ({
      title: '帳務結算週期通知',
      text: `${c.name} 您好：謹以此訊通知，先前因「${c.reason}」由本人代墊之費用 NT$ ${c.amountStr}，已屆結算週期。為利帳目核銷，煩請於三日內完成匯付作業，謝謝您。`
    }),
    c => ({
      title: '帳戶資訊附錄通知',
      text: `致 ${c.name}：關於先前代墊之 NT$ ${c.amountStr} 款項，附上本人匯款帳號（可使用 LINE Pay 或銀行轉帳）。請於轉帳完成後回傳訊息以便核對銷帳，感謝您的配合。`
    }),
    c => ({
      title: '分組代墊共同支出',
      text: `${c.name} 您好：有關先前分組活動/共同支出所代墊之款項 NT$ ${c.amountStr}，目前全組帳務正進行最後核銷。煩請抽空處理該筆款項，謝謝您的協助。`
    }),
    c => ({
      title: '月度個人收支核算',
      text: `您好 ${c.name}：本人目前正進行本月份之收支核算，查有先前借出之款項 NT$ ${c.amountStr} 尚未結清（已歷時約 ${c.days} 日）。尚祈於近日安排匯款，至感德便。`
    }),
    c => ({
      title: '逾期補正催告函',
      text: `致 ${c.name} 台端：先前曾向您提及「${c.reason}」之代墊費用 NT$ ${c.amountStr}，至今尚未收到匯入通知。特此再次提醒，敬請於本週五前完成清償作業，感謝。`
    }),
    c => ({
      title: '預算排程確認函',
      text: `${c.name} 您好：因應個人近期預算調配需求，需確認先前代墊之 NT$ ${c.amountStr} 之入帳日程。不知您方便於何時完成匯出？請不吝告知具體日期，謝謝。`
    }),
    c => ({
      title: '款項收訖狀態查詢',
      text: `您好 ${c.name}：向您確認先前借支之 NT$ ${c.amountStr} 是否已經安排匯出？若您已完成轉帳，煩請提供明細以便本人銷帳；若尚未處理，亦請撥冗辦理，謝謝。`
    }),
    c => ({
      title: '例行性帳務核實',
      text: `${c.name} 您好：這是一則例行性帳務核實訊息。借款日期約為 ${c.days} 天前，項目為「${c.reason}」，未結金額為 NT$ ${c.amountStr}。請抽空撥冗核對並處理匯款，感謝。`
    }),
    c => ({
      title: '營業日結算提醒',
      text: `致 ${c.name}：因應週末銀行結算，敬請於週五營業時間結束前，將代墊之款項 NT$ ${c.amountStr} 匯入指定帳戶，以利帳目清整，謝謝您的理解與配合。`
    }),
    c => ({
      title: '代墊清單憑證檢附',
      text: `您好 ${c.name}：檢附先前代墊項目「${c.reason}」，金額總計新台幣 ${c.amountStr} 元整。為維持彼此帳務清晰，尚祈於這兩天內完成匯款，感謝您的合作。`
    }),
    c => ({
      title: '重要繳款期限告知',
      text: `【重要帳務通知】${c.name} 您好：先前所代墊之款項 NT$ ${c.amountStr}，敬請於本週內撥冗結清。若有任何帳目疑問，歡迎隨時與本人核對，謝謝。`
    }),
    c => ({
      title: '多元支付管道說明',
      text: `致 ${c.name}：關於 NT$ ${c.amountStr} 之代墊款，本人支援網銀轉帳、LINE Pay 及台灣 Pay 等多種支付管道。請選擇您方便之方式完成清償，謝謝。`
    }),
    c => ({
      title: '操作問題技術關懷',
      text: `您好 ${c.name}：距離借款已逾 ${c.days} 日，目前狀態為「${c.situation}」。想了解您在轉帳操作上是否有遇到任何困難？若需要其他匯款資訊請隨時告知，感謝。`
    }),
    c => ({
      title: '財務紀錄清爽維護',
      text: `${c.name} 您好：為確保雙方財務紀錄清楚完整，特此發訊提醒未結款項 NT$ ${c.amountStr}。若方便請於今日或明日安排轉帳，十分感謝您的幫忙。`
    }),
    c => ({
      title: '24小時回覆邀請',
      text: `致 ${c.name}：關於先前代墊之款項 NT$ ${c.amountStr}，煩請於 24 小時內回覆預計匯款時間，以便本人排定相關帳務日程，謝謝配合。`
    }),
    c => ({
      title: '電子對帳單確認',
      text: `您好 ${c.name}：電子對帳提醒——對象：${c.name}，事由：${c.reason}，尚欠：NT$ ${c.amountStr}。若款項確認無誤，敬請撥空匯付，感謝您的協助。`
    }),
    c => ({
      title: '結清收據預先通告',
      text: `${c.name} 您好：待您完成先前代墊款 NT$ ${c.amountStr} 之匯出作業並通知本人後，本人將立即於帳上標記結清。預先感謝您的迅速配合，祝一切順利。`
    })
  ],

  // ================= 5. 委婉但堅定型 (firm_polite) 20 種 =================
  firm_polite: [
    c => ({
      title: '生活開銷緊迫切入',
      text: `嗨 ${c.name}，因為我最近剛好要繳房租和生活費，手頭確實比較緊，必須跟你收回之前借的 NT$ ${c.amountStr} 了。想請問你預計哪一天可以轉給我呢？讓我也好精確抓一下這個月的開銷，謝謝你的體諒！`
    }),
    c => ({
      title: '正視拖延現況直球',
      text: `${c.name}，這幾天我在認真整理個人財務，看到這筆「${c.reason}」的 NT$ ${c.amountStr} 已經借了整整 ${c.days} 天。因為這筆錢對我目前的預算很重要，希望這週內能夠結清，再麻煩你明確跟我說一下確切時間，感謝！`
    }),
    c => ({
      title: '設定明確日期期限',
      text: `嗨 ${c.name}，這筆 NT$ ${c.amountStr} 拖的時間有點超出我原本的預期了。請你在後天（週五）前完成轉帳並通知我一聲。如果手頭真的有困難，也請直接跟我說清楚，謝謝。`
    }),
    c => ({
      title: '親兄弟明算帳坦白溝通',
      text: `${c.name}，大家感情好，但親兄弟也得明算帳。之前代墊的 NT$ ${c.amountStr} 已經過了 ${c.days} 天，請不要再藉故推遲，今天請給我一個具體的還款時間，謝謝。`
    }),
    c => ({
      title: '預算被打亂嚴肅說明',
      text: `嗨 ${c.name}，坦白跟你說，因為這筆 NT$ ${c.amountStr} 一直沒進來，導致我這星期的生活預算完全被卡住。目前現況是「${c.situation}」，希望你能體諒我的處境，儘快把款項轉過來。`
    }),
    c => ({
      title: '拒絕迴避誠實告知',
      text: `${c.name}，如果手頭真的有困難，我希望你能誠實告訴我，而不是已讀不回或避而不談。借你的 NT$ ${c.amountStr} 是出於信任，請在今天回覆我你的還款計畫。`
    }),
    c => ({
      title: '承諾多次落空嚴正提醒',
      text: `嗨 ${c.name}，之前你承諾過要轉帳，但我一直沒收到。這筆「${c.reason}」的 NT$ ${c.amountStr} 已經拖延滿久了，希望這是最後一次提醒，請於明天中午前完成匯款。`
    }),
    c => ({
      title: '不希望影響彼此交情',
      text: `${c.name}，我非常重視我們之間的交情，正因如此，我不希望這筆 NT$ ${c.amountStr} 成為我們之間的疙瘩。請你在這兩天把帳目結清，讓彼此都安心，謝謝。`
    }),
    c => ({
      title: '今晚最後回覆底線',
      text: `嗨 ${c.name}，請在今晚 22:00 前給我一個明確的答覆：這筆 NT$ ${c.amountStr} 你打算哪一天轉？我需要排定我的開銷，請不要再回覆「有空再說」，謝謝合作。`
    }),
    c => ({
      title: '維持借貸基本原則',
      text: `${c.name}，當初借錢給你是一種互助，但按時還錢是一種基本原則。距離借款已經過了 ${c.days} 天，請遵守約定，於這週內全額清償 NT$ ${c.amountStr}。`
    }),
    c => ({
      title: '無法再主動寬限通知',
      text: `嗨 ${c.name}，這筆 NT$ ${c.amountStr} 我已經寬限過好幾次了。目前我的生活費已經見底，真的無法再寬限，請在明天之內完成轉帳手續，感謝。`
    }),
    c => ({
      title: '房東水電催繳壓力',
      text: `${c.name}，實不相瞞，房東和水電費都在催繳了，我非常需要收回這筆「${c.reason}」的 NT$ ${c.amountStr}。請你在明天下午前完成轉帳，不要讓我為難，拜託了。`
    }),
    c => ({
      title: '開口要錢的心理負擔',
      text: `嗨 ${c.name}，每一次開口向你催這筆 NT$ ${c.amountStr}，其實我也覺得尷尬和有壓力。既然事情已經過了 ${c.days} 天，希望你能體諒我，主動並儘速把款項結清，謝謝。`
    }),
    c => ({
      title: '設定停損點週日底線',
      text: `${c.name}，這週日是我的最後底線。請務必在週日晚上 24:00 前把這筆 NT$ ${c.amountStr} 轉到我的戶頭。這對我非常重要，謝謝配合。`
    }),
    c => ({
      title: '認真看待債務態度',
      text: `嗨 ${c.name}，我一直很認真對待我們之間的約定，也希望你對這筆 NT$ ${c.amountStr} 的債務抱持同樣的態度。請抽空打開網銀完成轉帳，感謝你的合作。`
    }),
    c => ({
      title: '財務與友情保持清晰',
      text: `${c.name}，友情歸友情，金錢借貸歸金錢借貸。代墊「${c.reason}」的 NT$ ${c.amountStr} 已經拖欠太久，請於 48 小時內匯款，維持我們之間健康的互動。`
    }),
    c => ({
      title: '只需一個確定答覆',
      text: `嗨 ${c.name}，我不需要複雜的解釋，我只需要知道：這筆 NT$ ${c.amountStr} 你今天能不能轉？如果不能，請給我一個確切的日期，謝謝。`
    }),
    c => ({
      title: '拒絕模糊推託下週再說',
      text: `${c.name}，請不要再跟我說「下週有空再算」，這筆款項已經借了 ${c.days} 天。請在今天給我一個確定轉帳的時間點，謝謝你的配合。`
    }),
    c => ({
      title: '提醒遵守自己承諾',
      text: `嗨 ${c.name}，當初約定好借款時間，現在已經過期了。既然當初答應了，就請遵守自己的承諾，在今天把這筆 NT$ ${c.amountStr} 匯過來，謝謝。`
    }),
    c => ({
      title: '嚴正結語維護互信',
      text: `${c.name}，信任建立很難，摧毀卻很容易。為了維護我們之間的彼此信任，請你在今天之內把 NT$ ${c.amountStr} 結清，感謝理解。`
    })
  ],

  // ================= 6. 強硬但有禮貌型 (strong_polite) 20 種 =================
  strong_polite: [
    c => ({
      title: '承諾與誠信最後通牒',
      text: `${c.name}，之前已經提醒過你關於 NT$ ${c.amountStr} 的款項，算下來已經過了整整 ${c.days} 天。目前情況是「${c.situation}」。大家講求的是信用與承諾，請你在三天內完成還款並提供帳號末五碼，不要再有任何藉口，謝謝合作。`
    }),
    c => ({
      title: '拒絕迴避與已讀不回',
      text: `${c.name}，我必須嚴肅地跟你談這件事：借錢當初是出於信任，但你拖欠了 ${c.days} 天而且持續迴避，這讓我覺得很不受尊重。請你在明天晚上 24:00 前全額還清 NT$ ${c.amountStr}，請重視最基本的做人誠信。`
    }),
    c => ({
      title: '界線重申與最後期限',
      text: `${c.name}：這是最後一次透過私訊向你催討「${c.reason}」的 NT$ ${c.amountStr}。拖延不會讓問題消失，請於 48 小時內匯入指定帳戶。若逾期未處理，我將尋求其他適當管道親自找你確認，請不要把別人的好心當作隨便。`
    }),
    c => ({
      title: '信用額度正式歸零',
      text: `${c.name}，我對你的耐心與信用額度已經正式歸零。借款 NT$ ${c.amountStr} 拖了 ${c.days} 天，請立刻在今日之內全額結清，不要再考驗我的底線。`
    }),
    c => ({
      title: '當面碰面核實告知',
      text: `${c.name}，若你在明天中午 12:00 前仍未完成 NT$ ${c.amountStr} 的轉帳，我將親自到你常出現的教室或宿舍找你當面核對。請珍惜彼此最後的體面。`
    }),
    c => ({
      title: '逃避無法解決問題',
      text: `${c.name}，已讀不回與逃避是極度不負責任的行為。欠款 NT$ ${c.amountStr} 請在 24 小時內匯出並出示明細，謝謝配合。`
    }),
    c => ({
      title: '公開群組對帳警告',
      text: `${c.name}，我一直顧及你的面子沒有在共同群組公開這件事，但你的拖欠態度讓我無法接受。請在今天內把 NT$ ${c.amountStr} 結清，否則我只能公開尋求大家協助。`
    }),
    c => ({
      title: '借錢爽快還錢推託告誡',
      text: `${c.name}，借錢的時候言之鑿鑿，還錢的時候一拖再拖，這完全不是對待朋友該有的態度。請在明天之前全額匯入 NT$ ${c.amountStr}，請自重。`
    }),
    c => ({
      title: '24小時倒數限期清償',
      text: `【最後清償通知】致 ${c.name}：欠付之款項 NT$ ${c.amountStr}，倒數 24 小時清償。逾期未收到匯款，我將直接採取下一步行動，絕不再另行提醒。`
    }),
    c => ({
      title: '第三方知會協助通報',
      text: `${c.name}，這筆「${c.reason}」的 NT$ ${c.amountStr} 拖了 ${c.days} 天。若今日未獲解決，我將直接聯繫系辦或雙方家長協助處理，請勿自誤。`
    }),
    c => ({
      title: '好意不容隨便踐踏',
      text: `${c.name}，我的好心是建立在彼此誠信上，不是讓你無條件揮霍的。請立刻打開網銀匯出 NT$ ${c.amountStr}，現在！`
    }),
    c => ({
      title: '拒絕分期與推拖藉口',
      text: `${c.name}，我不接受任何形式的分期或理由推託。請在今天晚上 23:59 前將 NT$ ${c.amountStr} 全額匯入，謝謝合作。`
    }),
    c => ({
      title: '對話紀錄留存告誡',
      text: `${c.name}，當初借貸的所有對話紀錄與金額明細我已全數截圖存檔。請在兩天內結清 NT$ ${c.amountStr}，不要逼雙方走到難看的地步。`
    }),
    c => ({
      title: '保留最後體面機會',
      text: `${c.name}，這是我給你最後保留體面的機會。拖欠 ${c.days} 天的 NT$ ${c.amountStr}，請於今日完成轉帳，不要讓彼此連見面打招呼的餘地都沒有。`
    }),
    c => ({
      title: '直接致電催討通知',
      text: `${c.name}，如果你繼續忽略文字訊息，我將從今天傍晚開始每隔一小時直接致電向你確認款項。請立刻轉帳 NT$ ${c.amountStr}。`
    }),
    c => ({
      title: '成年人應有誠信擔當',
      text: `${c.name}，踐踏別人誠意的人，不配得到二次寬容。請在明早 09:00 前匯出 NT$ ${c.amountStr}，請展現一個成年人應有的擔當。`
    }),
    c => ({
      title: '無展延空間最後通牒',
      text: `${c.name}，今天是我容許的最後截止日，絕無展延空間。請立刻清償 NT$ ${c.amountStr}，切勿心存僥倖。`
    }),
    c => ({
      title: '人際信任破裂後果自負',
      text: `${c.name}，拖欠這筆款項所導致的一切人際與信任破裂後果，請你完全自行承擔。請即刻轉帳 NT$ ${c.amountStr}。`
    }),
    c => ({
      title: '停止軟弱欠債還錢天經地義',
      text: `${c.name}，不要再把我的有禮貌當成好欺負。欠債還錢，天經地義！請立刻把借了 ${c.days} 天的 NT$ ${c.amountStr} 轉回來！`
    }),
    c => ({
      title: '實體追討程序前最終警告',
      text: `${c.name}：此為本帳務最終通告。請於本日 24:00 前匯入新台幣 ${c.amountStr} 元整，否則本案將即刻進入實體追討程序，請自重。`
    })
  ],

  // ================= 7. 垃圾話型 (trash_talk) 20 種 (含 12 大經濟學原理與荒謬爛梗) =================
  trash_talk: [
    c => ({
      title: '機會成本 (Opportunity Cost)',
      text: `【學術研討警訊】親愛的 ${c.name}：\n根據微觀經濟學第一定律，你拖欠這筆 NT$ ${c.amountStr} 的每一秒，我的機會成本都在以指數級飆升！我原本可以用這筆錢去買加倍珍珠大杯奶茶，現在只能在飲水機前狂喝溫開水進行熱量代償！為避免引發我個人破產導致的連鎖金融風暴，請立刻使用 LINE Pay 平倉結清！感恩惜福～`
    }),
    c => ({
      title: '邊際效用與效用最大化 (Marginal Utility)',
      text: `${c.name} 同學，依據邊際效用遞減法則，這筆 NT$ ${c.amountStr} 留在你戶頭裡的邊際效用幾乎為零，但對快要吃土的我來說，邊際效用與總效用最大化正衝向無窮大！請立刻把邊際效用釋放給我，讓我完成今天的卡路里平衡！戶頭等你！`
    }),
    c => ({
      title: '跨期效用與時間配置 (Intertemporal Utility)',
      text: `在跨期效用模型與時間配置分析中，${c.name} 你跨期透支了我的現金流，這徹底破壞了我本月的跨期預算線！我們之間的折現率已經嚴重失衡，請火速轉帳 NT$ ${c.amountStr} 導正市場均衡，阿門！`
    }),
    c => ({
      title: '供需法則 (Supply and Demand)',
      text: `報告 ${c.name}！根據供需法則，我對這筆代墊款 NT$ ${c.amountStr} 的剛性需求已經達到完全缺乏彈性，而你對還款的供給彈性竟然呈現無限期裝死狀態！市場價格機制即將崩潰，請立刻進場護盤完成交割！`
    }),
    c => ({
      title: '帕累托改善 (Pareto Improvement)',
      text: `經過本人嚴密構建的效用函數推演，${c.name} 你只要立刻轉帳 NT$ ${c.amountStr}，就能在不損害你名譽的前提下大幅提升我的生存機率！這是一項完美的帕累托改善與最優解，請問你到底什麼時候要完成這項偉大的歷史任務？`
    }),
    c => ({
      title: '賽局理論：囚徒困境 (Prisoner\'s Dilemma)',
      text: `同學 ${c.name}，我們嚴肅對質一下：那筆「${c.reason}」的 NT$ ${c.amountStr} 已經過了 ${c.days} 天。根據賽局理論：囚徒困境，你現在的策略是「不還錢」，我的最佳應對策略只能從「裝沒事」轉變為「無限期轟炸」！結果就是雙方陷入奈許均衡中的最爛死局！請停止你的非合作博弈，立刻打開網銀！`
    }),
    c => ({
      title: '沉沒成本謬誤 (Sunk Cost Fallacy)',
      text: `${c.name}，我已經等你還款等了整整 ${c.days} 天！根據沉沒成本謬誤，我付出的等待時間與心理成本已經徹底沉沒成本化，沉到快把馬里亞納海溝給填平了！不要再讓我繼續追加沉沒成本，立刻把 NT$ ${c.amountStr} 吐出來！`
    }),
    c => ({
      title: '資訊不對稱 (Information Asymmetry)',
      text: `${c.name} 君，你心裡明明知道什麼時候發薪水、什麼時候要還，我這邊卻像在看黑天鵝事件一樣天天瞎猜！這種嚴重的資訊不對稱正在摧毀我們的雙邊互信！為了避免引發次貸危機，現在立刻轉帳 NT$ ${c.amountStr} 平倉！`
    }),
    c => ({
      title: '古德哈特定律 (Goodhart\'s Law)',
      text: `每次問你什麼時候還，你都說「下星期」，古德哈特定律 (Goodhart's Law) 明白指出：當下星期成為目標，它就再也不是個可衡量的承諾！${c.name}，我們不看下星期，我們看今天！NT$ ${c.amountStr} 請立刻執行轉帳！`
    }),
    c => ({
      title: '理性行為者 (Rational Agents)',
      text: `身為兩位自稱具備完全理性的「理性行為者」(Rational Agents)，${c.name} 請你迅速證明你的信用評等沒有被調降為垃圾級別！拖欠 ${c.days} 天已經完全背離理性人假說，請立刻用 NT$ ${c.amountStr} 重塑你的理性光輝！`
    }),
    c => ({
      title: '通貨膨脹與貨幣時間價值',
      text: `同學 ${c.name}，考量到台灣消費者物價指數 (CPI) 與中央銀行升息節奏，你那筆借了 ${c.days} 天的 NT$ ${c.amountStr} 購買力已經縮水了 3.8%！再拖下去，原本能買排骨便當的錢拿回來大概只能買顆茶葉蛋！請不要惡意稀釋我的法幣購買力，火速轉帳！`
    }),
    c => ({
      title: '外部性內部化 (Pigovian Tax)',
      text: `警告 ${c.name}：你拖欠 NT$ ${c.amountStr} 的行為已經對我的精神世界造成嚴重的負外部性！依據福利經濟學原理，再不還錢我就要去你的 IG 限時動態留言「還錢效用最高」進行外部性內部化，順便徵收庇古稅！立刻平倉！`
    }),
    c => ({
      title: '道德風險代理人危機 (Moral Hazard)',
      text: `根據資訊經濟學代理人理論，借錢給 ${c.name} 產生了嚴重的道德風險！借款人開始每天喝手搖杯吃香喝辣，債權人卻在吃土！為了導正委託人與代理人的利益衝突，請在今日 18:00 前把 NT$ ${c.amountStr} 匯入！`
    }),
    c => ({
      title: '逆向選擇檸檬市場 (Adverse Selection)',
      text: `當初借你「${c.reason}」是出於好心，沒想到竟然觸發了二手車檸檬市場效應，把我的善意直接變成了不良資產！${c.name} 請立刻用 NT$ ${c.amountStr} 贖回你的信用資產，拒當檸檬借款人！`
    }),
    c => ({
      title: '量子疊加還款態坍縮',
      text: `經過現代量子力學計算，你的網銀帳戶餘額與我的皮夾目前處於量子疊加態！但只要 ${c.name} 點擊轉帳，波函數就會瞬間坍縮成「欠款 NT$ ${c.amountStr} 已結清」的唯一真理態！請施展量子糾纏還款術！`
    }),
    c => ({
      title: '超自然鈔票托夢大師',
      text: `經過通靈大師開示，${c.name} 你口袋裡有一張面額 NT$ ${c.amountStr} 的鈔票正在幽怨地呼喚我。它托夢說跟著你每天只能看你發廢文，想回到我身邊繼續當它的善良老百姓。求求你行行好，放它回家吧！`
    }),
    c => ({
      title: '光速平方引發宇宙大爆炸',
      text: `我剛剛做了一個嚴謹的物理學實驗：將 ${c.name} 欠我 NT$ ${c.amountStr} 的時間 (${c.days} 天) 乘以光速的平方，得出的能量足以引發第三次宇宙大爆炸！為了地球的安危，請立刻打開網銀平息這場浩劫！`
    }),
    c => ({
      title: 'NASA 火星土壤探測回報',
      text: `報告長官！根據 NASA 最新火星探測回報，連火星探測車都在土壤層探測到一筆未結清的「${c.reason}」欠款，標籤上寫著 ${c.name} 欠 NT$ ${c.amountStr}！外星人都在笑我們了，快點轉帳啦！`
    }),
    c => ({
      title: '柴犬踢踏舞天譴符咒',
      text: `奉天承運，玉皇大帝敕令：凡拖欠「${c.reason}」款項 NT$ ${c.amountStr} 達 ${c.days} 日者，若 10 分鐘內未轉帳，將派出一隻無形的柴犬在 ${c.name} 床頭跳踢踏舞！急急如律令，LINE Pay 轉帳保平安！`
    }),
    c => ({
      title: '前線空投糧餉最後召喚',
      text: `報告 ${c.name} 大將軍！現況顯示「${c.situation}」，前線庫存告急！請將 NT$ ${c.amountStr} 的糧餉空投至指定帳戶！若再延誤軍機，本人將依法啟動精神念力強制扣款程式！感恩的心，戶頭見！`
    })
  ],

  // ================= 8. 粗口暴躁型 (hell_furious - 地獄模式 🔥) 20 種 =================
  hell_furious: [
    c => ({
      title: '咆哮開轟：錢是大風颳來的嗎',
      text: `欸 ${c.name}！你到底三小時候才要還錢啦？欠了整整 ${c.days} 天、NT$ ${c.amountStr} 耶！幹，當老子的錢是大風颳來的是不是？我快連滷肉飯都吃不起了靠北！看到訊息不要再給我裝死裝瞎，現在立刻馬上給我轉過來，是在哈囉？？🤬🔥`
    }),
    c => ({
      title: '戳破裝死：吃大餐發限動不還錢',
      text: `靠北喔 ${c.name}！那筆「${c.reason}」的 NT$ ${c.amountStr} 是要欠到跨年還是直接當遺產？每天看你發限動吃大餐去唱歌，問你還錢就突然人間蒸發已讀不回，幹真的不要把別人的好心當隨便！馬上打開網銀轉帳，不要逼我直接殺去堵你！💥👊`
    }),
    c => ({
      title: '極限暴怒：友情小船當場炸裂',
      text: `${c.name}，我忍你 ${c.days} 天真的忍夠了！當初借你 NT$ ${c.amountStr} 是看在交情面子，結果你現在給我在那邊拖拖拉拉、理由伯一堆！給你最後一小時轉帳，不然我就把我們對話紀錄直接貼在各大群組，看誰比較丟臉！幹！⚡🖕`
    }),
    c => ({
      title: '網銀壞掉還是手斷了',
      text: `幹 ${c.name}，你是手斷了還是手機網銀 App 壞掉？轉個帳 30 秒的事情是在拖幾點的？欠了 NT$ ${c.amountStr} 拖了 ${c.days} 天，每次問都說明天下週，你乾脆說等下輩子好了？立刻給我轉過來！`
    }),
    c => ({
      title: '裝死金牌馬里亞納海溝',
      text: `傳訊息不回、打電話不接，${c.name} 你是掉進馬里亞納海溝是不是？老子現在吃土吃到快吐血，你欠我那筆 NT$ ${c.amountStr} 到底什麼時候要還？再裝死我就直接去你家敲門！`
    }),
    c => ({
      title: '借錢孫子還錢當大爺',
      text: `當初借錢的時候哭爸哭母說多急，現在要你還 NT$ ${c.amountStr} 搞得像老子在求你施捨一樣，幹到底誰欠誰錢啊？不要臉天下無敵是不是？十分鐘內給我匯過來！`
    }),
    c => ({
      title: '直接殺去教室門口堵人',
      text: `${c.name}，我警告你，不要逼我直接去你教室門口堵你！當初「${c.reason}」欠的 NT$ ${c.amountStr} 已經拖了 ${c.days} 天，今天沒收到錢，明天大家就走著瞧，幹！`
    }),
    c => ({
      title: '月底吃土火大開罵',
      text: `靠北！老子現在戶頭剩兩位數在啃白吐司，你天天在外面吃香喝辣喝手搖杯，良心是被野狗叼走了是不是？把借我的 NT$ ${c.amountStr} 馬上還來，少在那邊廢話！`
    }),
    c => ({
      title: '開局一張嘴還錢全靠鬼',
      text: `每次催款你就說「明天轉、週末轉」，你是跟鬼約定好轉帳喔？${c.name}，欠了 ${c.days} 天的 NT$ ${c.amountStr}，少在那邊畫大餅，現在打開手機立刻轉，不然我直接翻臉！`
    }),
    c => ({
      title: '這點小錢看清一個人',
      text: `幹，NT$ ${c.amountStr} 這點小錢看清一個人，當老子交學費啦！但錢還是要給我吐出來，欠債還錢天經地義，少在那邊裝可憐，現在立刻匯款！`
    }),
    c => ({
      title: '怒火燒破天靈蓋問候',
      text: `看到訊息立刻給我回覆！${c.name}，你欠的 NT$ ${c.amountStr} 是要等投胎是不是？再敢已讀不回試試看，老子直接把你電話號碼貼在交友軟體上！`
    }),
    c => ({
      title: '藉口多到可以出百科全書',
      text: `手機沒電、忘記密碼、網銀維修、家裡有事⋯幹，${c.name} 你的藉口多到可以出整套百科全書了靠北！少跟我扯這些五四三，NT$ ${c.amountStr} 現、在、立、刻、轉！`
    }),
    c => ({
      title: '全世界就你最忙是不是',
      text: `每次問你就說「在忙」，幹全世界就你最忙？分組報告裝忙、催款還錢裝死，欠了 ${c.days} 天 NT$ ${c.amountStr} 還敢那麼秋？立刻轉帳少廢話！`
    }),
    c => ({
      title: '皮夾比臉還乾淨暴怒',
      text: `老子現在窮到皮夾比臉還乾淨，現況是「${c.situation}」！你給我立刻馬上把那筆「${c.reason}」的 NT$ ${c.amountStr} 吐回來，不然我直接去你打工的地方找你收帳！`
    }),
    c => ({
      title: 'Dcard 尋人爆料預備',
      text: `${c.name}，你再給我已讀裝死試試看！老子直接截圖完整對話放上 Dcard 尋找欠款 NT$ ${c.amountStr} 失蹤人口，讓全校好好認識你！有種就繼續拖！`
    }),
    c => ({
      title: '拿老子當盤子在薛',
      text: `當初看你可憐借你，現在你拿我當盤子在薛是不是？欠了 ${c.days} 天連一通電話都沒有，把我的好心踩在地上摩擦？立刻把 NT$ ${c.amountStr} 匯過來，幹！`
    }),
    c => ({
      title: '欠錢不還當陪葬品',
      text: `幹你是打算把這筆 NT$ ${c.amountStr} 欠到入土當陪葬品是不是？借了 ${c.days} 天不聞不問，不要逼老子動真格的，現在打開網銀，馬上轉！`
    }),
    c => ({
      title: '狂暴連發立刻動起來',
      text: `少廢話！打開手機！打開網銀！輸入帳號！轉出 NT$ ${c.amountStr}！截圖！回傳！一秒鐘都不要給我拖，動起來！`
    }),
    c => ({
      title: '友情永久黑名單',
      text: `從今天起你就是我的永久黑名單，連朋友都別做了！把那筆 NT$ ${c.amountStr} 還給我，大家各走各的路，少在那邊給我裝無辜，滾去轉帳！`
    }),
    c => ({
      title: '火山終極大爆發',
      text: `幹！老子今天就跟你槓上了！欠了整整 ${c.days} 天的 NT$ ${c.amountStr}，限你 15 分鐘之內匯進來，逾期老子說到做到，直接殺去你家找你父母談！`
    })
  ],

  // ================= 9. 法律威嚇型 (hell_legal - 地獄模式 ⚖️) 20 種 =================
  hell_legal: [
    c => ({
      title: '存證信函式催告通知',
      text: `【正式催告書函】\n受文者：${c.name} 台端\n主旨：查台端向本人借貸新台幣 ${c.amountStr} 元整（借款原因：${c.reason}），至今已逾 ${c.days} 日仍未清償。本人已完整留存雙方通訊對話紀錄、借貸合意證明及銀行匯款流水明細。\n特此函告請於 48 小時內完成清償，逾期若未處置，本人將逕循民事督促程序聲請管轄法院核發支付命令，切勿自誤。`
    }),
    c => ({
      title: '保全債權與聲請調解通知',
      text: `致 ${c.name}：\n關於台端欠付新台幣 ${c.amountStr} 元之債務，經多次催告迄今仍未履行（現狀：${c.situation}）。\n在此鄭重聲明：本人已完成全案金流及通聯紀錄之證據保全。請於三日內將全款匯入指定帳戶。若屆期未結清，本人將依法向鄉鎮市區調解委員會聲請調解，並依法追討民法第二百三十三條之法定遲延利息，請儘速依法辦理。`
    }),
    c => ({
      title: '債務清償通告涉詐欺侵占評估',
      text: `【法務通告】${c.name} 君：\n台端借款 NT$ ${c.amountStr} 迄今拖欠 ${c.days} 日。若台端自始借貸即無還款意圖，或藉由通訊軟體持續隱匿已讀不回，恐涉民事不當得利與相關法律責任。請於明日下午 17:00 前提供匯款證明，逾期本人將委請專業法律諮詢啟動民事求償與保全處分程序，請自重。`
    }),
    c => ({
      title: '支付命令與強制執行預告',
      text: `致 ${c.name} 台端：依民事訴訟法第五百零八條規定，債權人得向法院聲請發支付命令。台端積欠之 NT$ ${c.amountStr} 款項已屆清償期，若於收信後 48 小時內未完成清償，本人將直接向管轄地方法院提出聲請，嗣後取得執行名義將強制執行台端名下財產與存款。`
    }),
    c => ({
      title: '民法年息5%遲延利息追討',
      text: `【利息追討通知】${c.name} 台端：依民法第二百零三條及第二百三十三條，給付有確定期限者，債務人自期限屆滿時起負遲延責任，並應依法計付年息百分之五之遲延利息。台端積欠 NT$ ${c.amountStr} 已逾 ${c.days} 日，請連同法定利息於三日內全額清償。`
    }),
    c => ({
      title: '聲請假扣押保全處分告知',
      text: `致 ${c.name}：為防止債務人脫產或持續規避清償責任，本人已備妥民事假扣押聲請狀，將向法院聲請查封凍結台端名下金融機構帳戶，直至新台幣 ${c.amountStr} 元清償完畢為止。請於今日 24:00 前匯款，免招司法扣押之累。`
    }),
    c => ({
      title: '委任法務接管通告',
      text: `【法務存證公告】${c.name} 君：本案欠款 NT$ ${c.amountStr} 事由「${c.reason}」久懸未決，本人已完成證據固定並委請法務代理人接管。後續一切還款程序請直接出具正式匯款單據，逾期將逕行遞狀進入訴訟程序。`
    }),
    c => ({
      title: '電子通訊合法送達告知',
      text: `致 ${c.name} 台端：依民事訴訟法送達規定及電子商務司法判例，本通訊軟體之對話與已讀紀錄均具完全證據能力並視為合法催告。請於二日內將欠款 NT$ ${c.amountStr} 匯入，切勿心存僥倖藉故拖延。`
    }),
    c => ({
      title: '聯徵中心信用不良紀錄警訊',
      text: `${c.name} 君：債務不履行經法院裁判確定後，將依法登錄個人債信紀錄，嚴重影響未來金融機構信用卡、個人信貸及購屋貸款之核准。為 NT$ ${c.amountStr} 毀棄個人一生信用實屬不智，請儘速於明日清償。`
    }),
    c => ({
      title: '強制執行每月薪資三分之一扣押',
      text: `致 ${c.name}：強制執行法第一百十五條規定，法院得扣押債務人對第三人之每月薪資三分之一至清償日止。若台端持續拒付 NT$ ${c.amountStr}，本人將依法聲請扣押台端工讀及受薪所得，請知悉並速速處理。`
    }),
    c => ({
      title: '清償期屆滿履行抗辯權消滅',
      text: `【債務履行函】${c.name} 台端：查本件借貸金額 NT$ ${c.amountStr}，約定清償期限已屆滿。台端已喪失期限利益，無任何正當抗辯事由。請於 24 小時內結清全款，否則依法訴究。`
    }),
    c => ({
      title: '指定管轄法院遞狀告知',
      text: `致 ${c.name}：依民事訴訟法合意管轄及侵權管轄原則，本人已擇定管轄地方法院民事庭。本件欠款 NT$ ${c.amountStr} 經 ${c.days} 天催告無效，若今日未收到匯款，明日上午即向法院遞交民事起訴狀。`
    }),
    c => ({
      title: '查封拍賣動產警告',
      text: `${c.name} 君：取得執行名義後，民事執行處得逕赴債務人處所查封機車、電腦等動產並進行變價拍賣。為免名譽與財產受損，請於 48 小時內匯還 NT$ ${c.amountStr} 代墊款項。`
    }),
    c => ({
      title: '訴前和解協商最後期日',
      text: `【訴前和解通告】受文者：${c.name}。本訊為正式起訴前之最後和解通告。請於今日下午 18:00 前將欠付之 NT$ ${c.amountStr} 匯入。逾期視為協商破裂，即刻進入訴訟程序，不再受領分期請求。`
    }),
    c => ({
      title: '裁判費規費全額求償通知',
      text: `致 ${c.name} 台端：因台端惡意拖欠 NT$ ${c.amountStr}，本案若涉訟，本人依法聲請法院命敗訴方負擔裁判費、保全程序費及執行費。請勿因小失大，即刻清償為宜。`
    }),
    c => ({
      title: '通聯匯款單據公證聲明',
      text: `【證據保全聲明】${c.name} 君：查本案包含借貸約定截圖、銀行存摺流水、代墊單據（事由：${c.reason}）均已由法務固化。請於明日中午前匯付 NT$ ${c.amountStr}，切莫自誤前程。`
    }),
    c => ({
      title: '重大違約與不當得利返還',
      text: `致 ${c.name}：台端無法律上原因受領利益致本人受損，已構成民法第一百七十九條不當得利與重大違約。請限期於二日內返還新台幣 ${c.amountStr} 元整，否則逕行提起民事返還訴訟。`
    }),
    c => ({
      title: '喪失期限利益立即到期函',
      text: `【正式函告】${c.name} 台端：台端於借貸期間多次毀棄承諾，依法視同喪失期限利益，全部款項 NT$ ${c.amountStr} 立即視為到期，請於本日 24:00 前全數匯還。`
    }),
    c => ({
      title: '刑事詐欺告訴評估預告',
      text: `致 ${c.name}：若台端自始無償還資力仍向本人借款，或借款後旋即更換通訊方式逃匿，恐涉刑法第三百三十九條詐欺取財罪。本人已保留向地檢署提起刑事告訴之權利，限期於明晚前結清款項。`
    }),
    c => ({
      title: '終局民事與強制執行通知書',
      text: `【終局民事通知書】受文者：${c.name} 台端。台端積欠新台幣 ${c.amountStr} 元整，經多次催告均置之不理。本訊為最後通告，期限屆滿本人將全面向法院聲請支付命令、假扣押並聲明強制執行。切勿心存僥倖，請即刻匯款辦理。`
    })
  ]
};

/**
 * 智慧情境催款訊息生成引擎 (Contextual Script Engine)
 * 內建 9 大風格、每風格各 20 種完全獨立的情境演繹回覆
 */
class ContextualScriptEngine {
  constructor() {
    this.variations = STYLE_VARIATIONS;
  }

  normalizeContext(ctx) {
    const amountNum = Math.max(1, Math.round(Number(ctx.amount) || 800));
    const daysNum = Math.max(1, Math.round(Number(ctx.days) || 7));
    return {
      name: (ctx.name || '朋友').trim(),
      amount: amountNum,
      amountStr: amountNum.toLocaleString(),
      days: daysNum,
      borrowDate: ctx.borrowDate || '',
      dueDate: ctx.dueDate || '',
      reason: (ctx.reason || '').trim() || '上次代墊的開銷',
      situation: (ctx.situation || '').trim() || '日常提醒',
      isOverdue: daysNum >= 14,
      isSevere: daysNum >= 30,
      isSmallAmount: amountNum <= 300,
      isBigAmount: amountNum >= 3000
    };
  }

  /**
   * 生成 3 則不同視角/款式的催款訊息（保證三者不重複）
   */
  generateThreeVersions(ctx, styleKey = 'gentle') {
    const cleanCtx = this.normalizeContext(ctx);
    const pool = this.variations[styleKey] || this.variations.gentle;
    const total = pool.length;

    // 隨機選取 3 個互不重複的索引
    const pickedIndices = [];
    while (pickedIndices.length < 3 && pickedIndices.length < total) {
      const r = Math.floor(Math.random() * total);
      if (!pickedIndices.includes(r)) {
        pickedIndices.push(r);
      }
    }

    return pickedIndices.map((idx, vIdx) => {
      const fn = pool[idx];
      const res = fn(cleanCtx);
      return {
        version: vIdx + 1,
        variationIndex: idx,
        title: res.title || `說法 ${vIdx + 1}`,
        text: res.text
      };
    });
  }

  /**
   * 生成單則版本（可傳入 excludeIndices 避免抽到已在畫面上出現的說法）
   */
  generateSingleVersion(ctx, styleKey, versionIndex = 1, excludeIndices = []) {
    const cleanCtx = this.normalizeContext(ctx);
    const pool = this.variations[styleKey] || this.variations.gentle;
    const total = pool.length;

    let available = [];
    for (let i = 0; i < total; i++) {
      if (!excludeIndices.includes(i)) {
        available.push(i);
      }
    }
    if (available.length === 0) {
      available = Array.from({ length: total }, (_, i) => i);
    }

    const pickedIdx = available[Math.floor(Math.random() * available.length)];
    const fn = pool[pickedIdx];
    const res = fn(cleanCtx);

    return {
      version: versionIndex,
      variationIndex: pickedIdx,
      title: res.title || `說法 ${versionIndex}`,
      text: res.text
    };
  }
}

// 實例化引擎
const contextualEngine = new ContextualScriptEngine();

// 向後相容既有模板格式（供舊代碼或測試讀取，現在每種風格皆有 20 個模板！）
Object.keys(REMINDER_SCRIPTS).forEach(k => {
  const dummyCtx = {
    name: '{name}',
    amount: '{amount}',
    amountStr: '{amount}',
    days: '{days}',
    reason: '日常開銷',
    situation: '日常提醒'
  };
  const pool = STYLE_VARIATIONS[k] || STYLE_VARIATIONS.gentle;
  REMINDER_SCRIPTS[k].templates = pool.map(fn => fn(dummyCtx).text);
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { REMINDER_SCRIPTS, STYLE_VARIATIONS, ContextualScriptEngine, contextualEngine };
}
