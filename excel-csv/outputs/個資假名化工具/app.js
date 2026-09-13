(function () {
  "use strict";

  const MAX_FILE_SIZE = 30 * 1024 * 1024;
  const ACCEPTED = ["csv", "xlsx", "xls"];
  const state = {
    file: null,
    sourceBuffer: null,
    workbook: null,
    columns: [],
    processedBlob: null,
    mappingBlob: null,
    processedName: "",
    mappingName: ""
  };

  const $ = (selector) => document.querySelector(selector);
  const els = {
    fileInput: $("#file-input"),
    dropzone: $("#dropzone"),
    chooseBtn: $("#choose-file"),
    demoBtn: $("#load-demo"),
    fileSummary: $("#file-summary"),
    error: $("#error-message"),
    review: $("#review-section"),
    columnRows: $("#column-rows"),
    stats: $("#detection-stats"),
    previewHead: $("#preview-head"),
    previewBody: $("#preview-body"),
    previewSheet: $("#preview-sheet"),
    processBtn: $("#process-data"),
    selectDetected: $("#select-detected"),
    resetBtn: $("#reset-tool"),
    result: $("#result-section"),
    resultSummary: $("#result-summary"),
    downloadData: $("#download-data"),
    downloadMap: $("#download-map"),
    startOver: $("#start-over"),
    stepUpload: $("#step-upload"),
    stepReview: $("#step-review"),
    stepExport: $("#step-export")
  };

  function showError(message) {
    els.error.textContent = message;
    els.error.hidden = !message;
  }

  function setStep(step) {
    [els.stepUpload, els.stepReview, els.stepExport].forEach((el, index) => {
      el.classList.toggle("is-active", index + 1 === step);
      el.classList.toggle("is-done", index + 1 < step);
    });
  }

  function extension(name) {
    return name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  }

  function baseName(name) {
    return name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]/g, "_");
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function displayCell(sheet, row, col) {
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
    if (!cell) return "";
    try { return XLSX.utils.format_cell(cell); } catch (_) { return PIIEngine.textValue(cell.v); }
  }

  function readWorkbook(buffer, ext) {
    if (ext === "csv") {
      let text;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch (_) {
        try { text = new TextDecoder("big5").decode(buffer); }
        catch (_) { text = new TextDecoder("utf-8").decode(buffer); }
      }
      return XLSX.read(text.replace(/^\uFEFF/, ""), { type: "string", raw: true, dense: false });
    }
    return XLSX.read(buffer, { type: "array", cellDates: true, cellStyles: true, dense: false });
  }

  function findHeaderRow(sheet, range) {
    const maxRow = Math.min(range.e.r, range.s.r + 9);
    let best = { row: range.s.r, score: -1 };
    for (let r = range.s.r; r <= maxRow; r += 1) {
      const values = [];
      for (let c = range.s.c; c <= range.e.c; c += 1) {
        const value = displayCell(sheet, r, c).trim();
        if (value) values.push(value);
      }
      if (!values.length) continue;
      const unique = new Set(values.map(PIIEngine.compactHeader)).size;
      const sensitiveHints = values.filter((value) => PIIEngine.detectColumn(value, []).score >= 0.62).length;
      const score = values.length + unique * 0.35 + sensitiveHints * 3 - (values.length === 1 ? 2 : 0);
      if (score > best.score) best = { row: r, score };
    }
    return best.row;
  }

  function inspectWorkbook(workbook) {
    const columns = [];
    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet || !sheet["!ref"]) return;
      const range = XLSX.utils.decode_range(sheet["!ref"]);
      const headerRow = findHeaderRow(sheet, range);
      for (let c = range.s.c; c <= range.e.c; c += 1) {
        const header = displayCell(sheet, headerRow, c).trim() || `第 ${c + 1} 欄`;
        const values = [];
        for (let r = headerRow + 1; r <= Math.min(range.e.r, headerRow + 80); r += 1) {
          const value = displayCell(sheet, r, c).trim();
          if (value) values.push(value);
        }
        const detection = PIIEngine.detectColumn(header, values);
        columns.push({
          key: `${sheetIndex}:${c}`,
          sheetName,
          headerRow,
          col: c,
          header,
          sampleValues: values.slice(0, 3),
          detectedType: detection.type,
          type: detection.type || "other_id",
          score: detection.score,
          confidence: detection.confidence,
          evidence: detection.evidence,
          action: detection.confidence === "high" || detection.confidence === "medium" ? "code" : "keep"
        });
      }
    });
    return columns;
  }

  function typeOptions(selected) {
    return Object.entries(PIIEngine.TYPES).map(([value, meta]) =>
      `<option value="${value}"${value === selected ? " selected" : ""}>${meta.label}</option>`
    ).join("");
  }

  function sampleFor(column) {
    if (!column.sampleValues.length) return "無資料";
    const type = column.detectedType || (column.action !== "keep" ? column.type : null);
    return column.sampleValues.map((value) => type ? PIIEngine.maskValue(type, value) : value).join("、");
  }

  function confidencePill(column) {
    if (!column.detectedType) return '<span class="pill neutral">未辨識</span>';
    const label = PIIEngine.confidenceLabel(column.confidence);
    return `<span class="pill ${column.confidence}">${label} ${Math.round(column.score * 100)}%</span>`;
  }

  function renderColumns() {
    els.columnRows.innerHTML = state.columns.map((column) => `
      <tr data-key="${escapeHtml(column.key)}">
        <td><span class="sheet-name">${escapeHtml(column.sheetName)}</span><span class="row-hint">標題列 ${column.headerRow + 1}</span></td>
        <td><strong>${escapeHtml(column.header)}</strong><span class="sample">${escapeHtml(sampleFor(column))}</span></td>
        <td><span>${column.detectedType ? PIIEngine.TYPES[column.detectedType].label : "一般欄位"}</span><span class="evidence">${escapeHtml(column.evidence)}</span></td>
        <td>${confidencePill(column)}</td>
        <td>
          <select class="type-select" aria-label="${escapeHtml(column.header)} 的敏感資料類型" ${column.action === "keep" ? "disabled" : ""}>
            ${typeOptions(column.type)}
          </select>
        </td>
        <td>
          <select class="action-select" aria-label="${escapeHtml(column.header)} 的處理方式">
            <option value="code"${column.action === "code" ? " selected" : ""}>代碼取代</option>
            <option value="mask"${column.action === "mask" ? " selected" : ""}>部分遮罩</option>
            <option value="clear"${column.action === "clear" ? " selected" : ""}>清空</option>
            <option value="keep"${column.action === "keep" ? " selected" : ""}>保留原值</option>
          </select>
        </td>
      </tr>
    `).join("");

    els.columnRows.querySelectorAll("tr").forEach((row) => {
      const column = state.columns.find((item) => item.key === row.dataset.key);
      const actionSelect = row.querySelector(".action-select");
      const typeSelect = row.querySelector(".type-select");
      actionSelect.addEventListener("change", () => {
        column.action = actionSelect.value;
        typeSelect.disabled = column.action === "keep";
        updateStats();
        renderPreview();
      });
      typeSelect.addEventListener("change", () => {
        column.type = typeSelect.value;
        renderPreview();
      });
    });
    updateStats();
  }

  function updateStats() {
    const detected = state.columns.filter((c) => c.detectedType).length;
    const selected = state.columns.filter((c) => c.action !== "keep").length;
    const sheets = new Set(state.columns.map((c) => c.sheetName)).size;
    els.stats.innerHTML = `
      <span><strong>${sheets}</strong> 個工作表</span>
      <span><strong>${state.columns.length}</strong> 個欄位</span>
      <span><strong>${detected}</strong> 個疑似敏感欄位</span>
      <span><strong>${selected}</strong> 個將處理</span>
    `;
    els.processBtn.disabled = selected === 0;
  }

  function renderPreview() {
    const first = state.workbook && state.workbook.SheetNames.find((name) =>
      state.columns.some((column) => column.sheetName === name)
    );
    if (!first) return;
    const sheet = state.workbook.Sheets[first];
    const cols = state.columns.filter((column) => column.sheetName === first).slice(0, 8);
    const headerRow = cols[0] ? cols[0].headerRow : 0;
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    els.previewSheet.textContent = `${first}（前 ${Math.min(5, Math.max(0, range.e.r - headerRow))} 筆）`;
    els.previewHead.innerHTML = `<tr>${cols.map((column) => `<th>${escapeHtml(column.header)}</th>`).join("")}</tr>`;
    const rows = [];
    for (let r = headerRow + 1; r <= Math.min(range.e.r, headerRow + 5); r += 1) {
      rows.push(`<tr>${cols.map((column) => {
        const raw = displayCell(sheet, r, column.col);
        let preview = raw;
        if (raw && column.action === "code") preview = `${PIIEngine.TYPES[column.type].prefix}-######`;
        else if (raw && column.action === "mask") preview = PIIEngine.maskValue(column.type, raw);
        else if (raw && column.action === "clear") preview = "（空白）";
        else if (raw && column.detectedType) preview = PIIEngine.maskValue(column.detectedType, raw);
        return `<td>${escapeHtml(preview)}</td>`;
      }).join("")}</tr>`);
    }
    els.previewBody.innerHTML = rows.join("") || '<tr><td colspan="8">沒有可預覽的資料列</td></tr>';
  }

  async function handleFile(file) {
    showError("");
    const ext = extension(file.name);
    if (!ACCEPTED.includes(ext)) {
      showError("請選擇 .xlsx、.xls 或 .csv 檔案。");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showError("檔案超過 30 MB。請先拆分檔案後再處理。");
      return;
    }
    try {
      els.dropzone.classList.add("is-loading");
      const buffer = await file.arrayBuffer();
      const workbook = readWorkbook(buffer, ext);
      if (!workbook.SheetNames.length) throw new Error("找不到工作表");
      const columns = inspectWorkbook(workbook);
      if (!columns.length) throw new Error("找不到可處理的欄位，請確認第一個資料區域包含標題列");

      state.file = file;
      state.sourceBuffer = buffer;
      state.workbook = workbook;
      state.columns = columns;
      state.processedBlob = null;
      state.mappingBlob = null;

      els.fileSummary.innerHTML = `<strong>${escapeHtml(file.name)}</strong><span>${formatBytes(file.size)} · ${workbook.SheetNames.length} 個工作表</span>`;
      els.fileSummary.hidden = false;
      renderColumns();
      renderPreview();
      els.review.hidden = false;
      els.result.hidden = true;
      setStep(2);
      els.review.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error(error);
      showError(`無法讀取檔案：${error.message || "檔案格式可能不完整"}`);
    } finally {
      els.dropzone.classList.remove("is-loading");
    }
  }

  function actionLabel(action) {
    return { code: "代碼取代", mask: "部分遮罩", clear: "清空" }[action] || "保留原值";
  }

  function addMapping(mappingMap, details) {
    const normalized = PIIEngine.normalizeValue(details.type, details.original);
    const key = `${details.action}\u0000${details.type}\u0000${normalized}`;
    if (!mappingMap.has(key)) {
      mappingMap.set(key, {
        code: details.processed,
        type: PIIEngine.TYPES[details.type].label,
        action: actionLabel(details.action),
        original: PIIEngine.textValue(details.original),
        count: 0,
        sheets: new Set(),
        columns: new Set()
      });
    }
    const item = mappingMap.get(key);
    item.count += 1;
    item.sheets.add(details.sheetName);
    item.columns.add(`${details.sheetName}：${details.header}`);
  }

  function cloneWorkbook() {
    return readWorkbook(state.sourceBuffer.slice(0), extension(state.file.name));
  }

  function createMappingWorkbook(mappingMap, sourceName) {
    const rows = [["代碼／處理結果", "資料類型", "處理方式", "原始值", "出現次數", "來源工作表", "來源欄位"]];
    mappingMap.forEach((item) => {
      rows.push([
        item.code,
        item.type,
        item.action,
        item.original,
        item.count,
        Array.from(item.sheets).join("、"),
        Array.from(item.columns).join("、")
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 18 }, { wch: 34 }
    ];
    ws["!autofilter"] = { ref: `A1:G${Math.max(1, rows.length)}` };
    const info = XLSX.utils.aoa_to_sheet([
      ["對照表用途", "將代碼還原為原始資料。請與假名化檔案分開保存並限制存取權限。"],
      ["來源檔案", sourceName],
      ["建立時間", new Date().toLocaleString("zh-TW")],
      ["關聯規則", "同一資料類型的相同原始值，在本次處理中會取得相同代碼。"]
    ]);
    info["!cols"] = [{ wch: 14 }, { wch: 70 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "對照表");
    XLSX.utils.book_append_sheet(wb, info, "使用說明");
    return wb;
  }

  function makeBlob(data, type) {
    return new Blob([data], { type });
  }

  async function processData() {
    try {
      showError("");
      els.processBtn.disabled = true;
      els.processBtn.textContent = "處理中…";
      await new Promise((resolve) => setTimeout(resolve, 30));

      const workbook = cloneWorkbook();
      const tokenStore = PIIEngine.createTokenStore();
      const mappingMap = new Map();
      let changedCells = 0;

      state.columns.filter((column) => column.action !== "keep").forEach((column) => {
        const sheet = workbook.Sheets[column.sheetName];
        if (!sheet || !sheet["!ref"]) return;
        const range = XLSX.utils.decode_range(sheet["!ref"]);
        for (let r = column.headerRow + 1; r <= range.e.r; r += 1) {
          const address = XLSX.utils.encode_cell({ r, c: column.col });
          const cell = sheet[address];
          if (!cell || cell.v == null || PIIEngine.textValue(cell.v) === "") continue;
          const original = cell.v;
          let processed = "";
          if (column.action === "code") processed = tokenStore.tokenFor(column.type, original).token;
          else if (column.action === "mask") processed = PIIEngine.maskValue(column.type, original);
          else if (column.action === "clear") processed = "";

          addMapping(mappingMap, {
            action: column.action,
            type: column.type,
            original,
            processed,
            sheetName: column.sheetName,
            header: column.header
          });
          cell.v = processed;
          cell.t = "s";
          delete cell.f;
          delete cell.w;
          changedCells += 1;
        }
      });

      const base = baseName(state.file.name);
      const isCsv = extension(state.file.name) === "csv";
      if (isCsv) {
        const csv = `\uFEFF${XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]])}`;
        state.processedBlob = makeBlob(csv, "text/csv;charset=utf-8");
        state.processedName = `${base}_假名化.csv`;
      } else {
        const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array", cellStyles: true, compression: true });
        state.processedBlob = makeBlob(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        state.processedName = `${base}_假名化.xlsx`;
      }

      const mappingWorkbook = createMappingWorkbook(mappingMap, state.file.name);
      const mappingBytes = XLSX.write(mappingWorkbook, { bookType: "xlsx", type: "array", compression: true });
      state.mappingBlob = makeBlob(mappingBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      state.mappingName = `${base}_對照表.xlsx`;

      const handledColumns = state.columns.filter((column) => column.action !== "keep").length;
      els.resultSummary.innerHTML = `
        <div><strong>${changedCells.toLocaleString("zh-TW")}</strong><span>個儲存格已處理</span></div>
        <div><strong>${handledColumns}</strong><span>個欄位套用規則</span></div>
        <div><strong>${mappingMap.size.toLocaleString("zh-TW")}</strong><span>筆對照關係</span></div>
      `;
      els.downloadData.textContent = `下載 ${state.processedName}`;
      els.downloadMap.textContent = `下載 ${state.mappingName}`;
      els.result.hidden = false;
      setStep(3);
      els.result.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error(error);
      showError(`處理失敗：${error.message || "請重新載入檔案後再試"}`);
    } finally {
      els.processBtn.disabled = false;
      els.processBtn.textContent = "執行假名化";
    }
  }

  function downloadBlob(blob, name) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function reset() {
    state.file = null;
    state.sourceBuffer = null;
    state.workbook = null;
    state.columns = [];
    state.processedBlob = null;
    state.mappingBlob = null;
    state.processedName = "";
    state.mappingName = "";
    els.fileInput.value = "";
    els.fileSummary.hidden = true;
    els.review.hidden = true;
    els.result.hidden = true;
    els.columnRows.innerHTML = "";
    showError("");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }

  function buildDemoFile() {
    const rows = [
      ["客戶編號", "姓名", "手機", "Email", "地址", "會員等級", "消費金額"],
      ["C-1001", "陳怡君", "0912-345-678", "yijun.chen@example.com", "台北市中山區南京東路100號", "金卡", 12800],
      ["C-1002", "林志明", "0922-111-526", "chihming.lin@example.com", "新北市板橋區文化路二段88號", "銀卡", 4200],
      ["C-1001", "陳怡君", "0912-345-678", "yijun.chen@example.com", "台北市中山區南京東路100號", "金卡", 3500]
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "客戶資料");
    const bytes = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return new File([bytes], "示範客戶資料.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  els.chooseBtn.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", () => {
    if (els.fileInput.files && els.fileInput.files[0]) handleFile(els.fileInput.files[0]);
  });
  els.demoBtn.addEventListener("click", () => handleFile(buildDemoFile()));
  els.dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    els.dropzone.classList.add("is-dragging");
  });
  els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("is-dragging"));
  els.dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    els.dropzone.classList.remove("is-dragging");
    if (event.dataTransfer.files && event.dataTransfer.files[0]) handleFile(event.dataTransfer.files[0]);
  });
  els.selectDetected.addEventListener("click", () => {
    state.columns.forEach((column) => {
      column.action = column.detectedType ? "code" : "keep";
      if (column.detectedType) column.type = column.detectedType;
    });
    renderColumns();
    renderPreview();
  });
  els.processBtn.addEventListener("click", processData);
  els.resetBtn.addEventListener("click", reset);
  els.startOver.addEventListener("click", reset);
  els.downloadData.addEventListener("click", () => downloadBlob(state.processedBlob, state.processedName));
  els.downloadMap.addEventListener("click", () => downloadBlob(state.mappingBlob, state.mappingName));
})();
