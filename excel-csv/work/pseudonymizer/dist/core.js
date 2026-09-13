(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PIIEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TYPES = {
    name: { label: "姓名", prefix: "NM" },
    national_id: { label: "身分證字號", prefix: "ID" },
    phone: { label: "電話", prefix: "TEL" },
    email: { label: "Email", prefix: "EML" },
    address: { label: "地址", prefix: "ADR" },
    birthdate: { label: "出生日期", prefix: "DOB" },
    passport: { label: "護照號碼", prefix: "PPT" },
    bank_account: { label: "銀行帳號", prefix: "BANK" },
    credit_card: { label: "信用卡號", prefix: "CARD" },
    employee_id: { label: "員工編號", prefix: "EMP" },
    customer_id: { label: "客戶編號", prefix: "CUS" },
    other_id: { label: "其他識別碼", prefix: "REF" }
  };

  const compactHeader = (value) => String(value == null ? "" : value)
    .trim().toLowerCase().replace(/[\s_\-–—()（）/\\]+/g, "");

  const textValue = (value) => {
    if (value == null) return "";
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).trim();
  };

  const digitsOnly = (value) => textValue(value).replace(/\D/g, "");

  function isTaiwanId(value) {
    return /^[A-Z][12]\d{8}$/i.test(textValue(value).replace(/\s/g, ""));
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(textValue(value));
  }

  function isPhone(value) {
    const raw = textValue(value);
    const digits = digitsOnly(raw);
    return (/^(?:\+?886)?0?9\d{8}$/.test(digits) || /^0\d{8,9}$/.test(digits)) && /[\d+()\-\s]/.test(raw);
  }

  function luhn(value) {
    const digits = digitsOnly(value);
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let doubleIt = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      let n = Number(digits[i]);
      if (doubleIt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      doubleIt = !doubleIt;
    }
    return sum % 10 === 0;
  }

  const rules = [
    {
      type: "national_id",
      exact: ["身分證字號", "身分證號", "身份證字號", "身份證號", "nationalid", "idnumber"],
      contains: ["身分證", "身份證", "統一證號"],
      test: isTaiwanId,
      valueWeight: 0.48
    },
    {
      type: "email",
      exact: ["email", "emailaddress", "電子郵件", "電子信箱", "信箱", "郵件"],
      contains: ["email", "電子郵件", "電子信箱"],
      test: isEmail,
      valueWeight: 0.46
    },
    {
      type: "phone",
      exact: ["電話", "手機", "手機號碼", "聯絡電話", "電話號碼", "mobile", "phone", "telephone"],
      contains: ["電話", "手機", "mobile", "phone", "tel"],
      test: isPhone,
      valueWeight: 0.42
    },
    {
      type: "credit_card",
      exact: ["信用卡號", "信用卡卡號", "cardnumber", "creditcard"],
      contains: ["信用卡", "creditcard", "cardnumber"],
      test: luhn,
      valueWeight: 0.48
    },
    {
      type: "passport",
      exact: ["護照", "護照號碼", "護照號", "passport", "passportnumber"],
      contains: ["護照", "passport"],
      test: (v) => /^[A-Z]{1,2}\d{6,9}$/i.test(textValue(v).replace(/\s/g, "")),
      valueWeight: 0.28
    },
    {
      type: "name",
      exact: ["姓名", "名字", "中文姓名", "英文姓名", "客戶姓名", "員工姓名", "name", "fullname", "customername", "employeename"],
      contains: ["姓名", "fullname", "customername", "employeename", "聯絡人"],
      test: (v) => /^[\u3400-\u9fff·‧]{2,6}$/.test(textValue(v)) || /^[A-Za-z][A-Za-z .'-]{2,50}$/.test(textValue(v)),
      valueWeight: 0.12
    },
    {
      type: "address",
      exact: ["地址", "住址", "通訊地址", "戶籍地址", "address", "mailingaddress"],
      contains: ["地址", "住址", "address"],
      test: (v) => /(?:縣|市|區|鄉|鎮|村|里|路|街|巷|弄|號|樓)/.test(textValue(v)) && textValue(v).length >= 6,
      valueWeight: 0.18
    },
    {
      type: "birthdate",
      exact: ["生日", "出生日期", "出生年月日", "birthdate", "dateofbirth", "dob"],
      contains: ["出生", "birthdate", "dateofbirth"],
      test: (v) => /^(?:19|20)\d{2}[/-](?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])$/.test(textValue(v)),
      valueWeight: 0.08
    },
    {
      type: "bank_account",
      exact: ["銀行帳號", "銀行賬號", "帳戶號碼", "匯款帳號", "bankaccount", "accountnumber"],
      contains: ["銀行帳", "銀行賬", "匯款帳", "bankaccount"],
      test: (v) => /^\d{8,16}$/.test(digitsOnly(v)),
      valueWeight: 0.08
    },
    {
      type: "employee_id",
      exact: ["員工編號", "員編", "工號", "employeeid", "staffid"],
      contains: ["員工編號", "員編", "工號", "employeeid", "staffid"],
      test: (v) => /^[A-Z0-9-]{3,20}$/i.test(textValue(v)),
      valueWeight: 0.06
    },
    {
      type: "customer_id",
      exact: ["客戶編號", "會員編號", "會員id", "customerid", "clientid", "memberid"],
      contains: ["客戶編號", "會員編號", "customerid", "clientid", "memberid"],
      test: (v) => /^[A-Z0-9-]{3,24}$/i.test(textValue(v)),
      valueWeight: 0.06
    },
    {
      type: "other_id",
      exact: ["識別碼", "唯一識別碼", "userid", "personid", "個人編號"],
      contains: ["識別碼", "personid", "userid"],
      test: (v) => /^[A-Z0-9-]{4,30}$/i.test(textValue(v)),
      valueWeight: 0.04
    }
  ];

  function detectColumn(header, values) {
    const normalizedHeader = compactHeader(header);
    const samples = (values || []).map(textValue).filter(Boolean).slice(0, 80);
    let best = { type: null, score: 0, evidence: "未發現明確敏感特徵" };

    for (const rule of rules) {
      let headerScore = 0;
      let headerEvidence = "";
      if (rule.exact.some((x) => normalizedHeader === compactHeader(x))) {
        headerScore = 0.88;
        headerEvidence = "欄名高度吻合";
      } else if (rule.contains.some((x) => normalizedHeader.includes(compactHeader(x)))) {
        headerScore = 0.72;
        headerEvidence = "欄名包含敏感詞";
      }

      const matched = samples.filter((value) => {
        try { return rule.test(value); } catch (_) { return false; }
      }).length;
      const ratio = samples.length ? matched / samples.length : 0;
      let valueScore = 0;
      if (ratio >= 0.8) valueScore = rule.valueWeight;
      else if (ratio >= 0.5) valueScore = rule.valueWeight * 0.8;
      else if (ratio >= 0.25) valueScore = rule.valueWeight * 0.55;
      else if (ratio >= 0.1) valueScore = rule.valueWeight * 0.3;

      const score = Math.min(0.99, headerScore + valueScore);
      if (score > best.score) {
        const evidence = [headerEvidence, ratio > 0 ? `內容格式吻合 ${Math.round(ratio * 100)}%` : ""]
          .filter(Boolean).join("，") || "僅弱格式特徵";
        best = { type: rule.type, score, evidence };
      }
    }

    if (best.score < 0.42) return { type: null, score: best.score, confidence: "none", evidence: "未發現明確敏感特徵" };
    const confidence = best.score >= 0.82 ? "high" : best.score >= 0.62 ? "medium" : "low";
    return { ...best, confidence };
  }

  function normalizeValue(type, value) {
    const text = textValue(value);
    if (["phone", "national_id", "passport", "credit_card", "bank_account"].includes(type)) {
      return text.replace(/[\s()\-]/g, "").toUpperCase();
    }
    if (type === "email") return text.toLowerCase();
    return text.replace(/\s+/g, " ").trim().toLocaleLowerCase("zh-Hant");
  }

  function maskValue(type, value) {
    const text = textValue(value);
    if (!text) return "";
    if (type === "email" && text.includes("@")) {
      const [local, domain] = text.split("@");
      return `${local.slice(0, 1)}***@${domain}`;
    }
    if (type === "name") return `${text.slice(0, 1)}${"○".repeat(Math.max(1, text.length - 1))}`;
    if (type === "address") return `${text.slice(0, 3)}＊＊＊`;
    if (type === "birthdate") return text.replace(/(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/, "$1-**-**");
    if (["national_id", "passport"].includes(type)) return `${text.slice(0, 1)}${"*".repeat(Math.max(3, text.length - 3))}${text.slice(-2)}`;
    if (["phone", "credit_card", "bank_account"].includes(type)) {
      const visible = Math.min(4, Math.max(2, Math.floor(text.length / 3)));
      return `${text.slice(0, 2)}${"*".repeat(Math.max(4, text.length - visible - 2))}${text.slice(-visible)}`;
    }
    return text.length <= 4 ? `${text.slice(0, 1)}***` : `${text.slice(0, 2)}***${text.slice(-2)}`;
  }

  function createTokenStore() {
    const counters = {};
    const tokens = new Map();
    return {
      tokenFor(type, value) {
        const normalized = normalizeValue(type, value);
        const key = `${type}\u0000${normalized}`;
        if (!tokens.has(key)) {
          counters[type] = (counters[type] || 0) + 1;
          const prefix = TYPES[type] ? TYPES[type].prefix : "REF";
          tokens.set(key, `${prefix}-${String(counters[type]).padStart(6, "0")}`);
        }
        return { key, token: tokens.get(key), normalized };
      },
      size() { return tokens.size; }
    };
  }

  function confidenceLabel(confidence) {
    return { high: "高", medium: "中", low: "低", none: "未辨識" }[confidence] || "未辨識";
  }

  return {
    TYPES,
    compactHeader,
    textValue,
    detectColumn,
    normalizeValue,
    maskValue,
    createTokenStore,
    confidenceLabel,
    isTaiwanId,
    isEmail,
    isPhone,
    luhn
  };
});
