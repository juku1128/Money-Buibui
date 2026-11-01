/**
 * Money Buddy — AI 情境式催款訊息生成器資料庫與本地情境演算引擎
 * 支援 9 大催款風格（含全新「垃圾話型／經濟學荒謬梗」與 2 款地獄催款模式）
 * 核心演算法：根據借款對象、金額、拖欠天數、人際關係、借款原因、拖欠現況，
 * 動態創作 3 則截然不同敘事視角、語氣結構與修辭風格的個人化催款訊息。
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
    description: '【全新特色】將機會成本、賽局理論、囚徒困境、沉沒成本等概念化作極度北爛的搞笑催款論述！',
    isHell: false,
    isTrash: true,
    theme: 'border-purple-300 bg-purple-50/50 text-purple-900'
  }
};

/**
 * 智慧情境催款訊息生成引擎 (Contextual Script Engine)
 * 具備情境感度權重：關係親疏、拖欠天數、拖欠現況、借款原因與金額量級
 */
class ContextualScriptEngine {
  constructor() {
    this.randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * 生成 3 則不同視角的催款訊息
   */
  generateThreeVersions(ctx, styleKey = 'gentle') {
    const cleanCtx = this.normalizeContext(ctx);
    return [
      this.generateSingleVersion(cleanCtx, styleKey, 1),
      this.generateSingleVersion(cleanCtx, styleKey, 2),
      this.generateSingleVersion(cleanCtx, styleKey, 3)
    ];
  }

  normalizeContext(ctx) {
    const amountNum = Math.max(1, Math.round(Number(ctx.amount) || 800));
    const daysNum = Math.max(1, Math.round(Number(ctx.days) || 7));
    return {
      name: (ctx.name || '朋友').trim(),
      amount: amountNum,
      amountStr: amountNum.toLocaleString(),
      days: daysNum,
      relationship: (ctx.relationship || '朋友').trim(),
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
   * 生成單則版本 (versionIndex: 1, 2, 3)
   */
  generateSingleVersion(c, styleKey, versionIndex = 1) {
    switch (styleKey) {
      case 'trash_talk':
        return this.buildTrashTalk(c, versionIndex);
      case 'gentle':
        return this.buildGentle(c, versionIndex);
      case 'cute':
        return this.buildCute(c, versionIndex);
      case 'humorous':
        return this.buildHumorous(c, versionIndex);
      case 'formal':
        return this.buildFormal(c, versionIndex);
      case 'firm_polite':
        return this.buildFirmPolite(c, versionIndex);
      case 'strong_polite':
        return this.buildStrongPolite(c, versionIndex);
      case 'hell_furious':
        return this.buildHellFurious(c, versionIndex);
      case 'hell_legal':
        return this.buildHellLegal(c, versionIndex);
      default:
        return this.buildGentle(c, versionIndex);
    }
  }

  // ================= 9. 垃圾話型 (北爛經濟學與無厘頭荒謬風格) =================

  buildTrashTalk(c, v) {
    if (v === 1) {
      // 角度 1：總體經濟、邊際效用與機會成本篇
      const economicsThemes = [
        {
          theory: '機會成本 (Opportunity Cost)',
          thesis: `根據微觀經濟學第一定律，你拖欠這筆 NT$ ${c.amountStr} 的每一秒，我的機會成本都在以指數級飆升。`,
          joke: `我原本可以用這筆錢去買加倍珍珠大杯奶茶，現在只能在飲水機前狂喝溫開水進行熱量代償。`
        },
        {
          theory: '邊際效用與效用最大化 (Marginal Utility)',
          thesis: `依據邊際效用遞減法則，這筆 NT$ ${c.amountStr} 留在你戶頭裡的邊際效用幾乎為零，但對快要吃土的我來說，邊際效用與總效用最大化正衝向無窮大！`,
          joke: `請立刻把邊際效用釋放給我，讓我完成今天的卡路里平衡！`
        },
        {
          theory: '跨期效用與時間配置 (Intertemporal Utility)',
          thesis: `在跨期效用模型與時間配置分析中，你跨期透支了我的現金流，這徹底破壞了我本月的跨期預算線！`,
          joke: `我們之間的折現率已經嚴重失衡，請火速轉帳導正市場均衡！`
        },
        {
          theory: '供需法則 (Supply and Demand)',
          thesis: `根據供需法則，我對 NT$ ${c.amountStr} 的剛性需求已經達到完全缺乏彈性，而你對還款的供給彈性竟然呈現無限期裝死狀態！`,
          joke: `市場價格機制即將崩潰，請立刻進場護盤完成交割！`
        },
        {
          theory: '帕累托改善 (Pareto Improvement)',
          thesis: `經過本人嚴密構建的效用函數推演，你只要立刻轉帳 NT$ ${c.amountStr}，就能在不損害你名譽的前提下大幅提升我的生存機率。`,
          joke: `這是一項完美的帕累托改善與最優解，請問你到底什麼時候要完成這項偉大的歷史任務？`
        },
        {
          theory: '通貨膨脹與貨幣時間價值',
          thesis: `同學，考量到台灣消費者物價指數 (CPI) 與中央銀行升息節奏，你那筆借了 ${c.days} 天的 NT$ ${c.amountStr} 購買力已經縮水了 3.8%。`,
          joke: `再拖下去，原本能買排骨便當的錢，拿回來大概只能在全家買一顆茶葉蛋。請不要惡意稀釋我的貨幣購買力！`
        }
      ];
      const pick = this.randomChoice(economicsThemes);
      const situationNote = c.situation.includes('已讀') ? '你持續已讀不回的行為，已被我校經濟學系正式列入重大市場失靈案例。'
        : (c.situation.includes('下星期') ? '每次都說下星期還，古德哈特定律 (Goodhart\'s Law) 明白指出：當下星期成為目標，它就再也不是個可衡量的承諾！' : '');

      return {
        version: 1,
        title: `經濟學視角：${pick.theory}`,
        text: `【學術研討警訊】親愛的 ${c.relationship} ${c.name}：\n\n${pick.thesis} 當初因為「${c.reason}」借給你的那筆 NT$ ${c.amountStr}，已經在你的資產負債表上沉睡了整整 ${c.days} 天。\n\n${pick.joke} ${situationNote}\n\n為避免引發我個人破產引發的連鎖金融風暴，請立刻使用 LINE Pay 或網銀向本中央銀行平倉結清！感恩惜福～`
      };
    } else if (v === 2) {
      // 角度 2：賽局理論與囚徒困境篇
      const gameTheories = [
        {
          concept: '賽局理論：囚徒困境 (Prisoner\'s Dilemma)',
          rant: `你現在的策略是「不還錢」，我的最佳應對策略只能從「裝沒事」轉變為「無限期轟炸」。結果就是雙方陷入奈許均衡中的最爛死局！`
        },
        {
          concept: '沉沒成本謬誤 (Sunk Cost Fallacy)',
          rant: `我已經等你還款等了 ${c.days} 天，我付出的時間與心理成本已經徹底沉沒成本化，沉到快把馬里亞納海溝填平了！`
        },
        {
          concept: '資訊不對稱 (Information Asymmetry)',
          rant: `你心裡明明知道什麼時候發薪水、什麼時候要還，我這邊卻像在看黑天鵝事件一樣天天瞎猜！這種嚴重的資訊不對稱正在摧毀我們的雙邊互信！`
        }
      ];
      const pick = this.randomChoice(gameTheories);
      const actionJoke = this.randomChoice([
        '請停止你的非合作賽局策略，立刻打開網銀！',
        '再不還錢，我就要去你限時動態留言「還錢效用最高」進行外部性內部化！',
        '為了全人類的福祉與我的午餐著想，現在立刻平倉！'
      ]);

      return {
        version: 2,
        title: `賽局博弈視角：${pick.concept}`,
        text: `同學 ${c.name}，我們嚴肅對質一下：\n\n那筆「${c.reason}」的 NT$ ${c.amountStr} 已經過了 ${c.days} 天。\n\n根據${pick.concept}：${pick.rant}\n\n身為兩位自稱具備完全理性的「理性行為者」(Rational Agents)，請你迅速證明你的信用評等沒有被調降為垃圾級別。${actionJoke} 戶頭等你！`
      };
    } else {
      // 角度 3：神經病大學生與荒謬爛梗篇
      const nonsensicalTropes = [
        `經過通靈大師開示，你口袋裡有一張面額 NT$ ${c.amountStr} 的鈔票正在幽怨地呼喚我。它托夢說跟著你每天只能看你發廢文，想回到我身邊繼續當它的善良老百姓。`,
        `我剛剛做了一個嚴謹的物理學實驗：將你欠我 NT$ ${c.amountStr} 的時間 (${c.days} 天) 乘以光速的平方，得出的能量足以引發第三次宇宙大爆炸。`,
        `根據 NASA 最新火星探測回報，連火星探測車都在土壤層探測到一筆未結清的「${c.reason}」欠款，標籤上寫著 ${c.name} 欠 NT$ ${c.amountStr}。`
      ];
      const absurdEnding = this.randomChoice([
        '求求你行行好，把這份神聖的法幣還給我，讓我去吃一頓像樣的白飯！',
        '若 10 分鐘內未轉帳，我將派出一隻無形的柴犬在你床頭跳踢踏舞！',
        '不要逼我啟動量子糾纏強制還款程序，感恩的心！'
      ]);

      return {
        version: 3,
        title: '宇宙荒謬視角：神秘學與超自然催款',
        text: `報告長官 ${c.name}：\n\n${this.randomChoice(nonsensicalTropes)}\n\n我們已經拖了 ${c.days} 天了，情境更顯示：「${c.situation}」。${absurdEnding}\n\n金額：NT$ ${c.amountStr}\n收款方式：LINE Pay、街口、直接塞現金皆可，急急如律令！`
      };
    }
  }

  // ================= 1. 溫柔提醒型 (gentle) =================

  buildGentle(c, v) {
    if (v === 1) {
      // 關心生活與日常對帳
      return {
        version: 1,
        title: '日常問候切入',
        text: `嗨 ${c.name}～最近這週過得還順利嗎？🌱\n想說順便跟你對一下帳，上次${c.reason ? `因為「${c.reason}」` : ''}借給你的那筆 NT$ ${c.amountStr}，不知道你這兩天手頭方不方便？如果 OK 的話再麻煩用 LINE Pay 或轉帳給我喔！謝謝你，祝你今天一切順心～✨`
      };
    } else if (v === 2) {
      // 藉口整理手帳預算
      const situationAddon = c.situation.includes('忘記') ? '我想說你最近比較忙可能不小心漏掉了，所以溫柔敲你一下～' : '最近我在整理每月的記帳手帳，剛好看到這一筆～';
      return {
        version: 2,
        title: '整理記帳手帳切入',
        text: `哈囉 ${c.name}！${situationAddon}☺️\n之前算的那筆 NT$ ${c.amountStr}（算下來大約過了 ${c.days} 天囉），看你這兩天方不方便匯款一下？再麻煩你看一下網銀囉，辛苦了，感謝！🍵`
      };
    } else {
      // 體貼詢問還款時間
      return {
        version: 3,
        title: '貼心確認時程',
        text: `嗨 ${c.name}～希望沒有打擾到你！想跟你確認一下之前「${c.reason}」的 NT$ ${c.amountStr}，你預計這週哪一天轉帳比較方便呢？你可以先跟我說一聲，我這邊記帳比較好排預算，謝謝你的幫忙喔！🌸`
      };
    }
  }

  // ================= 2. 可愛撒嬌型 (cute) =================

  buildCute(c, v) {
    if (v === 1) {
      // 哭窮求救
      return {
        version: 1,
        title: '錢包咕嚕叫賣萌',
        text: `${c.name} 寶貝～(｡･ω･｡)ﾉ♡\n你家小可憐的錢包已經在抗議咕嚕咕嚕叫了！上次借你的 NT$ ${c.amountStr} 可以支援救駕一下嗎～我的珍珠奶茶基金就全靠你惹！🥺🧋 叩謝大恩大德～`
      };
    } else if (v === 2) {
      // 小動物路過提醒
      const situationEmoji = c.situation.includes('已讀') ? '(つ´ω`)つ 不要再已讀人家了嘛嗚嗚～' : '敲敲門～🐾';
      return {
        version: 2,
        title: '柴柴小夥伴路過提醒',
        text: `${situationEmoji} 報告大俠 ${c.name}！\n有隻窮到在啃吐司邊的小室友路過提醒：還記得那筆散落在你那裡的 NT$ ${c.amountStr} 嗎？（已經過了 ${c.days} 天囉～）小弟肚子好餓，求施捨歸還！🍙💖`
      };
    } else {
      // 誇張賣慘撒嬌
      return {
        version: 3,
        title: '誇張賣慘破冰',
        text: `報告最帥/最美的 ${c.name}！(*/ω＼*)\n本月的窮鬼警報已經響起十級警報 🚨！再收不到之前那筆「${c.reason}」的 NT$ ${c.amountStr}，我就要去學餐門口賣藝賣笑了嗚嗚～方便隨手賞賜一下轉帳嗎？愛你唷！🥰✨`
      };
    }
  }

  // ================= 3. 幽默搞笑型 (humorous) =================

  buildHumorous(c, v) {
    if (v === 1) {
      // 鈔票尋人啟事
      return {
        version: 1,
        title: '鈔票尋人啟事迷因',
        text: `【緊急協尋鈔票啟事】🚨\n有一批面額總計 NT$ ${c.amountStr} 的新台幣在 ${c.name} 那裡迷路了 ${c.days} 天！它昨晚托夢跟我說它很想家，想回到原本的皮夾裡團聚。請問好心人什麼時候能安排它回家團圓？急，在線等！🤣✈️`
      };
    } else if (v === 2) {
      // 氣象局財務低壓帶
      const situationAddon = c.situation.includes('下星期') ? '你之前說的下星期，該不會是指西元 3000 年的下星期吧 🛸？' : '';
      return {
        version: 2,
        title: '氣象局破產警報',
        text: `親愛的 ${c.relationship} ${c.name}，根據氣象局最新觀測，我目前的戶頭餘額已經進入強烈暴風雨低壓帶 📉。\n\n為了避免引發破產海嘯，那筆「${c.reason}」的 NT$ ${c.amountStr} 差不多是時候該召回本島了！${situationAddon}感謝英雄即刻救援 🛟！`
      };
    } else {
      // 友情充值與 VIP 續費
      return {
        version: 3,
        title: 'VIP 友情續費通知',
        text: `叮咚！您的【${c.relationship}友好度 VIP 訂閱】即將因 NT$ ${c.amountStr} 的帳單到期而面臨降級風險 ⚡！\n距離上次「${c.reason}」已經過去 ${c.days} 天，請點擊網銀轉帳按鈕完成續費，即可享有繼續跟我打屁哈拉的高級權益 🎁！`
      };
    }
  }

  // ================= 4. 正式禮貌型 (formal) =================

  buildFormal(c, v) {
    if (v === 1) {
      // 標準商務對帳
      return {
        version: 1,
        title: '標準帳務確認',
        text: `您好 ${c.name}：\n希望沒有打擾到您。想向您確認先前${c.reason ? `因「${c.reason}」` : ''}代墊之款項新台幣 ${c.amountStr} 元整，至今已逾 ${c.days} 日。\n不知您目前是否方便安排轉帳？完成後再請拍照或告知末五碼以便核對，謝謝您的配合與協助。`
      };
    } else if (v === 2) {
      // 詢問確切匯款日期
      const dueInfo = c.dueDate ? `（原約定日期為 ${c.dueDate}）` : '';
      return {
        version: 2,
        title: '確認匯款日程',
        text: `${c.name} 您好：\n在此提醒您，先前借支之款項 NT$ ${c.amountStr} 尚未完成清償${dueInfo}。目前遇到的狀況為「${c.situation}」，想請教您方便於這兩日內確認並回覆預計匯款的具體時間嗎？感謝您的撥冗回覆。`
      };
    } else {
      // 保持距離之公事化信函
      return {
        version: 3,
        title: '書面清償提醒',
        text: `【款項清償提醒】致 ${c.name}：\n關於日前雙方約定之代墊款項 NT$ ${c.amountStr}（事由：${c.reason}），請於本週內撥空處理匯款作業。若款項已匯出，敬請提供交易明細以便銷帳，非常感謝您的協助。`
      };
    }
  }

  // ================= 5. 委婉但堅定型 (firm_polite) =================

  buildFirmPolite(c, v) {
    if (v === 1) {
      // 說明自身生活費緊縮需求
      return {
        version: 1,
        title: '生活開銷緊迫切入',
        text: `嗨 ${c.name}，因為我最近剛好要繳房租和生活費，手頭確實比較緊，必須跟你收回之前借的 NT$ ${c.amountStr} 了。想請問你預計哪一天可以轉給我呢？讓我也好精確抓一下這個月的開銷，謝謝你的體諒！`
      };
    } else if (v === 2) {
      // 直面拖延現況
      const sitText = c.situation.includes('已讀') ? '看到你之前訊息沒有回覆，我有點擔心，' : (c.situation.includes('下星期') ? '之前說好上週要處理，但我一直還沒收到，' : '');
      return {
        version: 2,
        title: '正視拖延現況直球',
        text: `${c.name}，這幾天我在認真整理個人財務，看到這筆「${c.reason}」的 NT$ ${c.amountStr} 已經借了整整 ${c.days} 天。${sitText}因為這筆錢對我目前的預算很重要，希望這週內能夠結清，再麻煩你明確跟我說一下確切時間，感謝！`
      };
    } else {
      // 設定最後還款約定
      return {
        version: 3,
        title: '設定明確日期期限',
        text: `嗨 ${c.name}，大家都是 ${c.relationship}，但我必須坦白說：這筆 NT$ ${c.amountStr} 拖的時間有點超出我原本的預期了。請你在後天（週五）前完成轉帳並通知我一聲。如果手頭真的有困難，也請直接跟我說清楚，謝謝。`
      };
    }
  }

  // ================= 6. 強硬但有禮貌型 (strong_polite) =================

  buildStrongPolite(c, v) {
    if (v === 1) {
      // 信用與承諾最後通牒
      return {
        version: 1,
        title: '承諾與誠信最後通牒',
        text: `${c.name}，之前已經提醒過你關於 NT$ ${c.amountStr} 的款項，算下來已經過了整整 ${c.days} 天。目前情況是「${c.situation}」。大家講求的是信用與承諾，請你在三天內完成還款並提供帳號末五碼，不要再有任何藉口，謝謝合作。`
      };
    } else if (v === 2) {
      // 嚴厲拒絕已讀不回
      return {
        version: 2,
        title: '拒絕迴避與藉口',
        text: `${c.name}，我必須嚴肅地跟你談這件事：借錢當初是出於信任，但你拖欠了 ${c.days} 天而且持續迴避，這讓我覺得很不受尊重。請你在明天晚上 24:00 前全額還清 NT$ ${c.amountStr}，請重視我們之間的關係與最基本的做人誠信。`
      };
    } else {
      // 明確劃下界線
      return {
        version: 3,
        title: '界線重申與最後期限',
        text: `${c.name}：這是最後一次透過私訊向你催討「${c.reason}」的 NT$ ${c.amountStr}。拖延不會讓問題消失，請於 48 小時內匯入指定帳戶。若逾期未處理，我將尋求其他適當管道親自找你確認，請不要把別人的好心當作隨便。`
      };
    }
  }

  // ================= 7. 粗口暴躁型 (hell_furious - 地獄模式 🔥) =================

  buildHellFurious(c, v) {
    if (v === 1) {
      // 咆哮質疑大風颳錢
      return {
        version: 1,
        title: '咆哮開轟：錢是大風颳來的嗎',
        text: `欸 ${c.name}！你到底三小時候才要還錢啦？欠了整整 ${c.days} 天、NT$ ${c.amountStr} 耶！幹，當老子的錢是大風颳來的是不是？我快連滷肉飯都吃不起了靠北！看到訊息不要再給我裝死裝瞎，現在立刻馬上給我轉過來，是在哈囉？？🤬🔥`
      };
    } else if (v === 2) {
      // 揭穿發限動人間蒸發
      return {
        version: 2,
        title: '戳破裝死：吃大餐發限動不還錢',
        text: `靠北喔 ${c.name}！那筆「${c.reason}」的 NT$ ${c.amountStr} 是要欠到跨年還是直接當遺產？每天看你發限動吃大餐去唱歌，問你還錢就突然人間蒸發已讀不回，幹真的不要把別人的好心當隨便！馬上打開網銀轉帳，不要逼我直接殺去堵你！💥👊`
      };
    } else {
      // 暴躁終極通牒
      return {
        version: 3,
        title: '極限暴怒：友情小船當場炸裂',
        text: `${c.name}，我忍你 ${c.days} 天真的忍夠了！當初借你 NT$ ${c.amountStr} 是看在 ${c.relationship} 面子，結果你現在給我在那邊拖拖拉拉、理由伯一堆！給你最後一小時轉帳，不然我就把我們對話紀錄直接貼在各大群組，看誰比較丟臉！幹！⚡🖕`
      };
    }
  }

  // ================= 8. 法律威嚇型 (hell_legal - 地獄模式 ⚖️) =================

  buildHellLegal(c, v) {
    if (v === 1) {
      // 存證信函格式
      return {
        version: 1,
        title: '存證信函式催告通知',
        text: `【正式催告書函】\n受文者：${c.name} 台端\n主旨：查台端向本人借貸新台幣 ${c.amountStr} 元整（借款原因：${c.reason}），至今已逾 ${c.days} 日仍未清償。本人已完整留存雙方通訊對話紀錄、借貸合意證明及銀行匯款流水明細。\n特此函告請於 48 小時內完成清償，逾期若未處置，本人將逕循民事督促程序聲請管轄法院核發支付命令，切勿自誤。`
      };
    } else if (v === 2) {
      // 調解委員會與法定利息追討
      return {
        version: 2,
        title: '保全債權與聲請調解通知',
        text: `致 ${c.name}：\n關於台端欠付新台幣 ${c.amountStr} 元之債務，經多次催告迄今仍未履行（現狀：${c.situation}）。\n在此鄭重聲明：本人已完成全案金流及通聯紀錄之證據保全。請於三日內將全款匯入指定帳戶。若屆期未結清，本人將依法向鄉鎮市區調解委員會聲請調解，並依法追討民法第二百三十三條之法定遲延利息，請儘速依法辦理。`
      };
    } else {
      // 詐欺侵占警告函
      return {
        version: 3,
        title: '債務清償最終通告',
        text: `【法務通告】${c.name} 君：\n台端借款 NT$ ${c.amountStr} 迄今拖欠 ${c.days} 日。若台端自始借貸即無還款意圖，或藉由通訊軟體持續隱匿已讀不回，恐涉民事不當得利與相關法律責任。請於明日下午 17:00 前提供匯款證明，逾期本人將委請專業法律諮詢啟動民事求償與保全處分程序，請自重。`
      };
    }
  }
}

// 實例化引擎
const contextualEngine = new ContextualScriptEngine();

// 向後相容既有模板格式（供舊代碼或測試讀取）
Object.keys(REMINDER_SCRIPTS).forEach(k => {
  const dummyCtx = { name: '{name}', amount: '{amount}', days: '{days}', relationship: '{relationship}', reason: '日常開銷', situation: '日常提醒' };
  const v1 = contextualEngine.buildGentle ? contextualEngine.generateSingleVersion(dummyCtx, k, 1).text : '';
  const v2 = contextualEngine.buildGentle ? contextualEngine.generateSingleVersion(dummyCtx, k, 2).text : '';
  REMINDER_SCRIPTS[k].templates = [v1, v2];
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { REMINDER_SCRIPTS, ContextualScriptEngine, contextualEngine };
}
