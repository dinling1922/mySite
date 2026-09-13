const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const engine = require("../dist/core.js");

function testDetection() {
  const email = engine.detectColumn("電子郵件", ["amy@example.com", "bob@example.org"]);
  assert.equal(email.type, "email");
  assert.equal(email.confidence, "high");

  const nationalId = engine.detectColumn("證件", ["A123456789", "B223456789"]);
  assert.equal(nationalId.type, "national_id");
  assert.ok(nationalId.score >= 0.42);

  const amount = engine.detectColumn("消費金額", ["1200", "950", "3000"]);
  assert.equal(amount.type, null);

  const name = engine.detectColumn("客戶姓名", ["陳怡君", "林志明"]);
  assert.equal(name.type, "name");
  assert.equal(name.confidence, "high");
}

function testTokenRelationship() {
  const store = engine.createTokenStore();
  const first = store.tokenFor("email", "Amy@Example.com").token;
  const repeated = store.tokenFor("email", "amy@example.com").token;
  const other = store.tokenFor("email", "bob@example.com").token;
  const phone = store.tokenFor("phone", "Amy@Example.com").token;

  assert.equal(first, repeated);
  assert.notEqual(first, other);
  assert.match(first, /^EML-\d{6}$/);
  assert.match(phone, /^TEL-\d{6}$/);
  assert.equal(store.size(), 3);
}

function testMasking() {
  assert.equal(engine.maskValue("name", "陳怡君"), "陳○○");
  assert.equal(engine.maskValue("email", "amy@example.com"), "a***@example.com");
  assert.equal(engine.maskValue("birthdate", "1990-05-18"), "1990-**-**");
  assert.ok(engine.maskValue("phone", "0912-345-678").includes("*"));
}

function testWorkbookRoundTrip() {
  const rows = [
    ["姓名", "Email", "消費金額"],
    ["陳怡君", "amy@example.com", 1200],
    ["陳怡君", "amy@example.com", 300]
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "客戶資料");
  const store = engine.createTokenStore();

  for (const address of ["A2", "A3"]) ws[address].v = store.tokenFor("name", ws[address].v).token;
  for (const address of ["B2", "B3"]) ws[address].v = store.tokenFor("email", ws[address].v).token;

  const bytes = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  const restored = XLSX.read(bytes, { type: "buffer" });
  const values = XLSX.utils.sheet_to_json(restored.Sheets["客戶資料"], { header: 1 });
  assert.equal(values[1][0], values[2][0]);
  assert.equal(values[1][1], values[2][1]);
  assert.equal(values[1][2], 1200);
}

testDetection();
testTokenRelationship();
testMasking();
testWorkbookRoundTrip();
console.log("All core tests passed.");
