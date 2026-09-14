"use client";

import { useMemo, useState } from "react";

type Rule = {
  id: string;
  priority: string;
  title: string;
  short: string;
  description: string;
  source: string;
  author: string;
};

type Category = {
  id: string;
  name: string;
  items: string;
  ruleIds: string[];
  questions: Question[];
};

type Choice = {
  label: string;
  decision: "keep" | "discard" | "hold";
};

type Question = {
  text: string;
  choices: Choice[];
};

const rules: Rule[] = [
  {
    id: "use-now",
    priority: "優先離開",
    title: "現在的我有沒有在用？",
    short: "沒有真實使用，就先列入候選。",
    description:
      "不要替過去的購買理由辯護。若現在沒在用，也沒有明確、近期的使用計畫，它就值得優先離開你的空間。低頻用品仍要回到真實情境判斷。",
    source: "《斷捨離》",
    author: "山下英子",
  },
  {
    id: "buy-again",
    priority: "優先離開",
    title: "今天沒有它，我會再買一次嗎？",
    short: "不會回購，通常是不想再擁有。",
    description:
      "這題把注意力從「當初花了多少錢」拉回現在的選擇。如果今天再看見它，你不願意用同樣的錢買回來，代表它已不符合現在的生活。",
    source: "《The Minimalist Home》",
    author: "Joshua Becker",
  },
  {
    id: "real-plan",
    priority: "優先離開",
    title: "是低頻，還是根本沒有使用情境？",
    short: "只有「也許有一天」不算計畫。",
    description:
      "一年未使用是警訊，不是死規則。行李箱、冬衣、露營用品可能本來就低頻；關鍵是能否說出明確、合理、近期會發生的使用情境。",
    source: "《Decluttering at the Speed of Life》",
    author: "Dana K. White",
  },
  {
    id: "remember-it",
    priority: "優先離開",
    title: "需要時，我會記得自己有它嗎？",
    short: "想不起來或找不到，留著的價值很低。",
    description:
      "特別適合電線、轉接頭、零件與備用品。若真的需要時你既想不起它、也找不到它，到時仍會重新買；它現在只是在占用抽屜。",
    source: "《Decluttering at the Speed of Life》",
    author: "Dana K. White",
  },
  {
    id: "top-half",
    priority: "高優先",
    title: "同類只能留一半，它排得進前一半嗎？",
    short: "主動選出最值得留的，而非替每件找理由。",
    description:
      "面對很多相似物品時，逐一問「能不能留」很容易全部留下。改成設定容量或數量上限，先留下最常用、最喜歡、最合適的那一半。",
    source: "《怦然心動的人生整理魔法》",
    author: "近藤麻理惠",
  },
  {
    id: "ideal-self",
    priority: "高優先",
    title: "它服務現在的我，還是幻想中的我？",
    short: "別讓物品綁架未曾開始的身份。",
    description:
      "「等我瘦了就穿」、「以後會開始烘焙」常把物品留給一個一直沒有出現的未來版本。承認興趣已改變，不等於否定以前的自己。",
    source: "《我決定簡單的生活》",
    author: "佐佐木典士",
  },
  {
    id: "management-cost",
    priority: "再確認",
    title: "它的價值高過管理成本嗎？",
    short: "空間、清潔、尋找和注意力都是成本。",
    description:
      "物品不是免費放在家裡。除了收納空間，也會消耗清潔、整理、尋找、搬家與視覺注意力。保留它，要值得這些持續成本。",
    source: "《Decluttering at the Speed of Life》",
    author: "Dana K. White",
  },
  {
    id: "guilt",
    priority: "再確認",
    title: "留下它，只是因為很貴、可惜或別人送的嗎？",
    short: "有價值，不等於必須由你保管。",
    description:
      "昂貴、仍可用、收到禮物，都是常見的留物理由；但它們不等於你必須繼續承擔保管責任。可考慮送人、捐贈、二手出售或回收。",
    source: "《斷捨離》",
    author: "山下英子",
  },
  {
    id: "better-life",
    priority: "最後檢查",
    title: "留下它，真的讓生活更好嗎？",
    short: "能用不等於值得繼續擁有。",
    description:
      "這是最後的整體檢查：它是否讓你更方便、舒服、安心或更接近想過的生活？如果只是讓東西變多，它不需要靠「還能用」留下來。",
    source: "《The Minimalist Home》",
    author: "Joshua Becker",
  },
  {
    id: "memory",
    priority: "最後處理",
    title: "我要的是物品，還是它代表的記憶？",
    short: "紀念品不求全留，只留最具代表性的。",
    description:
      "紀念物的功能不是使用，因此不該用「一年沒用」判斷。可以問：拍照是否足夠？是否能只留最代表這段記憶的幾件？情感物品建議最後整理。",
    source: "《The Gentle Art of Swedish Death Cleaning》",
    author: "Margareta Magnusson",
  },
];

const fullRuleDetails: Record<
  string,
  { coreQuestion: string; explanation: string; examples: string; caution: string; action: string }
> = {
  "use-now": {
    coreQuestion: "現在的我，有沒有在用它？",
    explanation:
      "不要把「以前有用過」、「當初為什麼買」或「以後可能有一天用到」當成保留理由。現在沒有在用、又沒有明確近期計畫的物品，就是強烈的離開候選。",
    examples: "衣物、工具、廚房用品都可用這題先篩；不是問它能不能用，而是現在的生活有沒有真的在用。",
    caution: "行李箱、冬季外套、露營用品、特殊工具、節慶用品可能本來就是低頻，請再用「是否有真實情境」確認。",
    action: "沒有使用也沒有近期計畫：放入離開清單；有明確日期與情境：保留並標記用途。",
  },
  "buy-again": {
    coreQuestion: "如果今天它出現在店裡，我還願意花錢把它買回家嗎？",
    explanation:
      "這題是用來破解「當初很貴，丟掉很浪費」。錢已經花掉了，現在真正要決定的是：它是否仍值得占據空間與注意力。",
    examples: "一件 3,000 元、兩年沒穿的衣服，不問丟掉是否浪費 3,000 元；改問今天還會不會再花 3,000 元買它。",
    caution: "不回購不一定表示要立刻丟；若它是必要備品或有明確替代成本，請再檢查使用情境。",
    action: "明確不會回購：優先送人、二手出售、捐贈或回收；仍會回購：保留並放在好拿的位置。",
  },
  "real-plan": {
    coreQuestion: "它只是低頻使用，還是根本沒有真實使用情境？",
    explanation:
      "一年未使用是重要警訊，但不是死規則。判斷重點不在時間，而在你是否能說出一個明確、合理、近期會發生的使用情境。",
    examples: "「下個月出國會用行李箱」是情境；「也許有一天會開始烘焙」只是想像。",
    caution: "不要因為低頻就淘汰季節性、特殊用途或安全用途物品；它們需要的是清楚的保存位置與用途標籤。",
    action: "說得出時間與情境：偏向保留；只剩「可能、也許、說不定」：往下一個淘汰判斷走。",
  },
  "remember-it": {
    coreQuestion: "如果真的需要它，我會記得自己已經有它嗎？",
    explanation:
      "這題特別適合電線、轉接頭、小工具、備用品、零件與雜物。若需要時根本想不起它、也找不到它，到時仍會重新買一個，現在保留的價值就很低。",
    examples: "一條不知道用途的線、藏在深抽屜的轉接頭，常常在需要時仍找不到，最後又買了新的。",
    caution: "重要備品可以留，但應建立固定位置、標籤與合理數量；不是把「怕以後要用」當成無限囤積的理由。",
    action: "想不起來或找不到：先辨識用途；無法辨識且無近期需求，安排電子回收或淘汰。",
  },
  "top-half": {
    coreQuestion: "同類只能留一半，它排得進前一半嗎？",
    explanation:
      "逐一問「這個能不能留」很容易讓每件物品都有理由留下。更有效的是設定容量或數量上限，主動選出最值得留下的。",
    examples: "5 個保溫杯留最喜歡的 2 個；10 件黑色上衣留最常穿的 5 件；8 個包包先挑 3 個。",
    caution: "不要先從最難丟的開始。把同類集中、先挑最喜歡和最好用的，剩下的才比較看得清楚。",
    action: "排不進前一半：優先送出或淘汰；排得進：保留，但不要超過你設定的空間容量。",
  },
  "ideal-self": {
    coreQuestion: "這件物品服務現在真實的我，還是一直沒有出現的未來版自己？",
    explanation:
      "很多物品其實是在維持一個想像身份，例如瘦下來後的衣服、要開始烘焙的工具、退休後才看的整套書。承認現在不需要，不等於否定以前的自己。",
    examples: "「等我有空就健身」、「有一天會重新學畫畫」若多年未開始，物品可能帶來的已經是壓力，不是可能性。",
    caution: "若你已排定課程、活動或具體開始日期，這不是幻想；把日期、用途與最低保留數量寫下來。",
    action: "只是維持理想形象：優先送出；有已承諾的計畫：暫存到期限，期限內沒開始再處理。",
  },
  "management-cost": {
    coreQuestion: "它值得我繼續替它付空間與管理成本嗎？",
    explanation:
      "物品放在家裡並不是免費。它會消耗空間、清潔時間、整理時間、尋找時間、注意力與視覺空間；所以不能只問「還能不能用」。",
    examples: "難清洗的小家電、占據一整層櫃子的杯子、搬家時要特別處理的大型物件，都有持續成本。",
    caution: "高價值或安全用途物品的管理成本可能仍值得；請比較它帶來的實際便利，而不是只看購入價格。",
    action: "價值低於成本：優先離開；值得保留：指定固定位置、容量上限與整理頻率。",
  },
  guilt: {
    coreQuestion: "留下它的理由，是不是只有很可惜、很貴，或別人送的？",
    explanation:
      "「它還有價值」和「它必須由我繼續保管」不是同一件事。禮物代表的是關係，不是永久收納義務；昂貴也不能把過去花費變回來。",
    examples: "仍然好好的禮物、買貴但不合用的器材、沒用過的贈品，都可以交給真正需要的人。",
    caution: "若它有法律、家庭或明確紀念價值，請先改用紀念品原則，不要用愧疚感硬做決定。",
    action: "仍有價值但你不需要：送人、捐贈、二手出售或回收；只剩愧疚：替它安排一個離開方式。",
  },
  "better-life": {
    coreQuestion: "留下這件東西，真的讓我的生活更好嗎？",
    explanation:
      "這是最後的整體檢查。不同方法會說怦然心動、現在是否需要、是否符合生活目的、家裡有沒有空間；本質都是留下是否比沒有它更好。",
    examples: "它是否讓你更方便、更舒服、更安心、更常使用？還是只是讓櫃子更滿、清理更累？",
    caution: "「還能用」只代表它沒有壞，不代表你需要它。若物品有明確低頻用途，請回到真實使用情境再確認。",
    action: "生活沒有因此更好：離開；有清楚正面價值：保留，但避免與同類重複。",
  },
  memory: {
    coreQuestion: "我真正需要的是實體物品，還是它代表的記憶？",
    explanation:
      "紀念品的功能不是使用，所以不適合套用「一年沒用就丟」。重點是保留最能代表記憶的少數物品，而不是把所有實體都留下。",
    examples: "照片、信件、卡片、旅行紀念品、家族物品可先拍照數位化；同一時期很多物品時，選最具代表性的幾件。",
    caution: "紀念品建議最後整理，因為它最容易讓整理變成回憶馬拉松。若是遺物或家族物品，也可先和相關家人討論。",
    action: "保留最具代表性者；其餘拍照、數位化、送回家人或依物品狀態安排離開。",
  },
};

const decisionQuestion = (text: string, keepLabel: string, discardLabel: string): Question => ({
  text,
  choices: [
    { label: keepLabel, decision: "keep" },
    { label: discardLabel, decision: "discard" },
    { label: "不確定，先暫存", decision: "hold" },
  ],
});

const categories: Category[] = [
  {
    id: "clothes",
    name: "衣物／鞋包",
    items: "衣服、鞋子、包包、配件",
    ruleIds: ["use-now", "buy-again", "top-half", "ideal-self", "guilt", "better-life"],
    questions: [
      decisionQuestion("最近一年有穿／用過它嗎？", "有，常穿／常用", "沒有，幾乎沒用"),
      decisionQuestion("它適合你現在的身材與生活嗎？", "適合現在的我", "不適合現在的我"),
      decisionQuestion("同類物品中，它排得進前一半嗎？", "排得進前一半", "排不進前一半"),
    ],
  },
  {
    id: "books",
    name: "書籍／紙類",
    items: "書、講義、文件、帳單",
    ruleIds: ["use-now", "buy-again", "remember-it", "top-half", "memory"],
    questions: [
      decisionQuestion("你現在還會讀或查這份內容嗎？", "會，內容仍有用", "不會，內容已不用"),
      decisionQuestion("這份紙本一定要保留正本嗎？", "要，正本有必要", "不用，掃描即可"),
      decisionQuestion("它是同主題中最好用的一本嗎？", "是，值得留下", "不是，有更好的"),
    ],
  },
  {
    id: "beauty",
    name: "美容／衛生／醫藥",
    items: "保養品、化妝品、藥品、保健品",
    ruleIds: ["use-now", "buy-again", "top-half", "management-cost"],
    questions: [
      decisionQuestion("它目前安全、沒有過期或變質嗎？", "安全，可以繼續用", "過期／變質，應處理"),
      decisionQuestion("你能在期限前用完它嗎？", "用得完", "用不完"),
      decisionQuestion("如果今天用完，你還會買它嗎？", "會，值得回購", "不會，不想再買"),
    ],
  },
  {
    id: "kitchen",
    name: "廚房／飲食用品",
    items: "鍋具、杯子、餐具、小家電、食品",
    ruleIds: ["use-now", "real-plan", "top-half", "management-cost", "better-life"],
    questions: [
      decisionQuestion("最近半年到一年有使用它嗎？", "有，真的會用", "沒有，幾乎沒用"),
      decisionQuestion("它是家中最好用或唯一的工具嗎？", "是，值得保留", "不是，已被取代"),
      decisionQuestion("它值得占用廚房空間嗎？", "值得，使用很方便", "不值得，占空間"),
    ],
  },
  {
    id: "electronics",
    name: "3C／電線",
    items: "充電器、線材、轉接頭、舊設備",
    ruleIds: ["use-now", "remember-it", "top-half", "management-cost"],
    questions: [
      decisionQuestion("你清楚知道它是做什麼的嗎？", "知道用途，會用到", "不知道用途，沒在用"),
      decisionQuestion("它能搭配你現在的設備使用嗎？", "能，現在仍相容", "不能，已不相容"),
      decisionQuestion("它仍在使用，或有未備份的重要資料嗎？", "是，先保留處理", "否，已備份且不用"),
    ],
  },
  {
    id: "household",
    name: "生活雜貨／工具",
    items: "文具、清潔品、工具、備用品",
    ruleIds: ["use-now", "buy-again", "remember-it", "top-half", "management-cost"],
    questions: [
      decisionQuestion("它是家中唯一或必要的備用品嗎？", "是，確實需要", "不是，已有重複品"),
      decisionQuestion("需要時，你找得到它嗎？", "找得到，有固定位置", "找不到，常被遺忘"),
      decisionQuestion("同類數量仍在合理範圍嗎？", "是，數量剛好", "否，囤太多"),
    ],
  },
  {
    id: "hobby",
    name: "興趣／運動／旅行",
    items: "健身、露營、手作、旅行、收藏",
    ruleIds: ["use-now", "buy-again", "real-plan", "ideal-self", "guilt"],
    questions: [
      decisionQuestion("你現在仍有這個興趣嗎？", "有，近期會做", "沒有，已不再做"),
      decisionQuestion("它帶來的是期待，而不是罪惡感嗎？", "期待，想繼續用", "罪惡感，想逃避"),
      decisionQuestion("保留它比租借或重買更划算嗎？", "是，保留較划算", "否，需要再取得即可"),
    ],
  },
  {
    id: "furniture",
    name: "家具／大型物件",
    items: "桌椅、櫃子、家電、運動器材",
    ruleIds: ["use-now", "buy-again", "management-cost", "better-life"],
    questions: [
      decisionQuestion("如果今天搬家，你還會帶走它嗎？", "會，它仍需要", "不會，不想再帶"),
      decisionQuestion("它有實際用途，不只是收納雜物嗎？", "有，功能明確", "沒有，只是塞東西"),
      decisionQuestion("保留它比移除後的空間更舒服嗎？", "是，留著更好", "否，移除更舒服"),
    ],
  },
  {
    id: "memory-items",
    name: "紀念／情感物品",
    items: "照片、卡片、禮物、親友遺物",
    ruleIds: ["memory", "guilt", "better-life"],
    questions: [
      decisionQuestion("你珍惜的是物品本身，而不只是記憶嗎？", "是，物品本身重要", "不是，記憶更重要"),
      decisionQuestion("實體保存比拍照保存更有意義嗎？", "是，需要實體保留", "否，拍照就足夠"),
      decisionQuestion("它是這段記憶最具代表性的物品之一嗎？", "是，值得留下", "不是，可留更代表的"),
    ],
  },
];

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState("clothes");
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? categories[0];
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId);
  const selectedRuleDetails = selectedRule ? fullRuleDetails[selectedRule.id] : null;
  const activeRuleIds = useMemo(() => new Set(selectedCategory.ruleIds), [selectedCategory]);
  const recommendation = useMemo(() => {
    const choices = selectedCategory.questions
      .map((question, index) => question.choices.find((choice) => choice.decision === answers[`${selectedCategory.id}-${index}`]))
      .filter((choice): choice is Choice => Boolean(choice));
    const counts = choices.reduce(
      (result, choice) => ({ ...result, [choice.decision]: result[choice.decision] + 1 }),
      { keep: 0, discard: 0, hold: 0 },
    );

    if (choices.length < selectedCategory.questions.length) {
      return {
        label: "先暫存，補完問題再決定",
        tone: "bg-[#f6eadb] text-[#885d33] ring-[#e7c69c]",
        description: `目前已回答 ${choices.length}/${selectedCategory.questions.length} 題。先不要因為一題就下結論；未回答完前，把它放進猶豫區即可。`,
      };
    }

    if (counts.hold > 0 || (counts.keep > 0 && counts.discard > 0)) {
      return {
        label: "建議暫存觀察",
        tone: "bg-[#f6eadb] text-[#885d33] ring-[#e7c69c]",
        description: "答案仍有不確定或互相矛盾。放進猶豫箱，標日期；1～3 個月沒有真正使用，再優先安排送出、捐贈或回收。",
      };
    }

    if (counts.discard >= 2) {
      return {
        label: "建議離開：丟／送／捐／回收",
        tone: "bg-[#f7ddd7] text-[#8b4038] ring-[#e9b6aa]",
        description: "這件物品目前較像是在占空間，而不是支持你的生活。依物品狀況選擇丟棄、二手出售、送人、捐贈或回收。",
      };
    }

    return {
      label: "建議不丟：保留",
      tone: "bg-[#dff0e5] text-[#35674e] ring-[#b7ddc4]",
      description: "它仍有清楚用途、合適情境或真實價值。保留即可，但建議放在看得見、拿得到的位置，避免重複購買。",
    };
  }, [answers, selectedCategory]);

  function selectCategory(category: Category) {
    setSelectedCategoryId(category.id);
    setSelectedRuleId(null);
    setAnswers({});
  }

  return (
    <main className="relative isolate min-h-screen bg-[#eaf3f7] px-4 py-6 text-[#242534] sm:px-7 lg:px-10 lg:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat lg:bg-fixed"
        style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.16)), url('/images/liubai-air-sky-v2.png')" }}
      />
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-col gap-5 border-b border-[#1b1b1b]/15 pb-6 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold tracking-[0.18em] text-[#426188]">CLEAN DECISION ATLAS</p>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-[#1b1b1b] sm:text-5xl">留白</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#1b1b1b]">
              為自己的生命空間，騰出更多的清爽。
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#394653]">
              使用說明：先選物品分類，下方出現選擇題，快速為你判斷保留／丟棄／暫存；右方可看到對應的五塊積木，點擊後對應下方積木解釋。
            </p>
          </div>
          <div className="rounded-full bg-[#e7ddff] px-4 py-2 text-sm font-semibold text-[#5c508e]">10 個判斷原則 × 9 類物品</div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(400px,0.85fr)_minmax(500px,1.15fr)]">
          <div className="flex flex-col gap-6">
            <section aria-labelledby="category-title" className="rounded-[28px] border border-[#ded8d1] bg-[#fcfbf9] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#7569b3]">選擇整理對象</p>
                  <h2 id="category-title" className="mt-1 font-serif text-3xl">物品分類</h2>
                </div>
                <span className="text-sm text-[#6a6874]">點選後亮起適用積木</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {categories.map((category) => {
                  const isSelected = category.id === selectedCategory.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      data-testid={`category-${category.id}`}
                      aria-pressed={isSelected}
                      onClick={() => selectCategory(category)}
                      className={`rounded-full border px-4 py-2.5 text-sm font-bold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7569b3] ${
                        isSelected
                          ? "border-[#2b2a3c] bg-[#2b2a3c] text-white shadow-[0_5px_0_#c6b9fc]"
                          : "border-[#d9d3cb] bg-white text-[#4f4d58] hover:border-[#9b8fd1] hover:bg-[#f3efff]"
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-5 rounded-2xl bg-[#f1eeff] px-4 py-3 text-sm leading-6 text-[#565070]">
                <span className="font-bold">現在整理：</span>{selectedCategory.items}。已為你標出 {selectedCategory.ruleIds.length} 個較適用的判斷積木。
              </p>
            </section>

            <section aria-labelledby="quiz-title" className="rounded-[28px] border border-[#ded8d1] bg-[#fcfbf9] p-5 sm:p-6">
              <p className="text-sm font-bold text-[#7569b3]">把原則用在眼前物品</p>
              <h2 id="quiz-title" className="mt-1 font-serif text-3xl">{selectedCategory.name} 快速選擇題</h2>
              <p className="mt-3 rounded-xl bg-[#f1eeff] px-3 py-2 text-sm leading-6 text-[#565070]">
                每題都以「值得保留嗎？」的方向問：左邊選項＝保留，中間選項＝離開，右邊選項＝先暫存。
              </p>
              <div className="mt-5 space-y-4">
                {selectedCategory.questions.map((question, index) => {
                  const answerKey = `${selectedCategory.id}-${index}`;
                  return (
                    <fieldset key={question.text} className="rounded-2xl bg-[#f4f1ed] p-4">
                      <legend className="sr-only">{question.text}</legend>
                      <p className="font-semibold leading-6 text-[#363543]">{index + 1}. {question.text}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {question.choices.map((choice) => {
                          const isSelected = answers[answerKey] === choice.decision;
                          return (
                            <button
                              key={choice.decision}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => setAnswers((current) => ({ ...current, [answerKey]: choice.decision }))}
                              className={`rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7569b3] ${
                                isSelected
                                  ? "border-[#7569b3] bg-[#7569b3] text-white"
                                  : "border-[#d7d1ca] bg-white text-[#5d5a64] hover:border-[#9b8fd1]"
                              }`}
                            >
                              {choice.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
              <div data-testid="recommendation" className={`mt-5 rounded-2xl p-4 ring-1 ${recommendation.tone}`}>
                <p className="text-xs font-bold tracking-[0.14em]">判斷結果</p>
                <h3 className="mt-1 text-lg font-bold">{recommendation.label}</h3>
                <p className="mt-2 text-sm leading-6">{recommendation.description}</p>
              </div>
              <p className="mt-5 text-sm leading-6 text-[#706d76]">卡住時：先把物品放進「猶豫箱」，標記日期；1～3 個月未拿出來使用，再列為優先淘汰。</p>
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <section aria-labelledby="rules-title" className="rounded-[28px] bg-[#eee9e2] p-4 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#7569b3]">判斷層級</p>
                  <h2 id="rules-title" className="mt-1 font-serif text-3xl">十個方格積木</h2>
                </div>
                <span className="rounded-full bg-[#f9e2d8] px-3 py-1.5 text-xs font-bold text-[#915348]">由上到下：淘汰優先度降低</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {rules.map((rule, index) => {
                  const isRecommended = activeRuleIds.has(rule.id);
                  const isSelected = selectedRule?.id === rule.id;

                  return (
                    <button
                      key={rule.id}
                      type="button"
                      data-testid={`rule-${rule.id}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedRuleId(rule.id)}
                      className={`group relative rounded-2xl border p-5 text-left transition duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7569b3] ${
                        isSelected
                          ? "border-[#7161b7] bg-[#28273a] text-white shadow-[0_16px_30px_rgba(74,63,132,0.28)]"
                          : isRecommended
                            ? "border-[#a597e8] bg-white shadow-[inset_5px_0_0_#7c6cc6,0_10px_24px_rgba(115,99,175,0.14)]"
                            : "border-transparent bg-[#faf9f7] text-[#474652] opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`grid size-9 place-items-center rounded-full text-sm font-bold ${isSelected ? "bg-[#cfc3ff] text-[#39305f]" : "bg-[#ece8e3] text-[#706e78]"}`}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className={`text-xs font-bold tracking-wider ${isSelected ? "text-[#d8d0ff]" : "text-[#8778bc]"}`}>{rule.priority}</p>
                        {isRecommended && !isSelected && <span className="ml-auto rounded-full bg-[#eee9ff] px-2.5 py-1 text-[11px] font-bold text-[#6857aa]">適用此分類</span>}
                        {isSelected && <span className="ml-auto rounded-full bg-[#f2bcae] px-2.5 py-1 text-[11px] font-bold text-[#4e3041]">已選取</span>}
                      </div>
                      <h3 className="mt-5 text-lg font-bold leading-snug">{rule.title}</h3>
                      <p className={`mt-2 text-sm leading-6 ${isSelected ? "text-[#e4e1ed]" : "text-[#6c6a76]"}`}>{rule.short}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section aria-live="polite" className="rounded-[28px] bg-[#28273a] p-6 text-white shadow-[0_16px_32px_rgba(34,33,48,0.18)]">
              {selectedRule ? (
                <>
                  <p className="text-sm font-bold tracking-[0.16em] text-[#cfc3ff]">目前選取的判斷原則</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">{selectedRule.title}</h2>
                  <div className="mt-4 space-y-4 border-t border-white/20 pt-4 text-base leading-7 text-[#e4e1ed]">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs font-bold tracking-[0.14em] text-[#cfc3ff]">核心提問</p>
                      <p className="mt-1 font-semibold">{selectedRuleDetails?.coreQuestion}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-[0.14em] text-[#cfc3ff]">完整說明</p>
                      <p className="mt-1">{selectedRuleDetails?.explanation}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-[0.14em] text-[#cfc3ff]">常見情境</p>
                      <p className="mt-1">{selectedRuleDetails?.examples}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-[0.14em] text-[#cfc3ff]">例外提醒</p>
                      <p className="mt-1">{selectedRuleDetails?.caution}</p>
                    </div>
                    <div className="rounded-2xl bg-[#cfc3ff] p-4 text-[#302b4a]">
                      <p className="text-xs font-bold tracking-[0.14em]">建議下一步</p>
                      <p className="mt-1 font-semibold">{selectedRuleDetails?.action}</p>
                    </div>
                  </div>
                  <dl className="mt-5 grid gap-3 border-t border-white/20 pt-5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[#cfc3ff]">適用物品類別</dt>
                      <dd className="mt-1 font-semibold">{selectedCategory.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[#cfc3ff]">來源書籍與作者</dt>
                      <dd className="mt-1 font-semibold">{selectedRule.source}／{selectedRule.author}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs leading-5 text-[#beb9d2]">來源標示為此原則的主要參考書目；十項內容已依 cleanrule.md 的整理重述。</p>
                </>
              ) : (
                <div className="py-5">
                  <p className="text-sm font-bold tracking-[0.16em] text-[#cfc3ff]">下一步</p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">點選一個發亮積木</h2>
                  <p className="mt-4 max-w-xl border-t border-white/20 pt-4 text-base leading-7 text-[#e4e1ed]">
                    你已選擇「{selectedCategory.name}」。上方發亮的積木是這個分類最適用的判斷原則；點其中一顆，就會在這裡看到完整說明、物品類別與參考書目。
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
