const fs = require("node:fs");
const path = require("node:path");

const projectDir = __dirname;
const distDir = path.join(projectDir, "dist");
const outputPath = path.resolve(projectDir, "../../outputs/個資假名化工具.html");

let html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
const css = fs.readFileSync(path.join(distDir, "styles.css"), "utf8");
const xlsxBase64 = fs.readFileSync(path.join(distDir, "vendor/xlsx.full.min.js")).toString("base64");
const scripts = [
  fs.readFileSync(path.join(distDir, "core.js"), "utf8"),
  fs.readFileSync(path.join(distDir, "app.js"), "utf8")
].map((code) => code.replace(/<\/script/gi, "<\\/script"));

html = html.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`);
html = html
  .replace('  <script src="vendor/xlsx.full.min.js" defer></script>\n', "")
  .replace('  <script src="core.js" defer></script>\n', "")
  .replace('  <script src="app.js" defer></script>\n', "");

const inlineScripts = [
  `<script src="data:application/javascript;base64,${xlsxBase64}"></script>`,
  ...scripts.map((code) => `<script>\n${code}\n</script>`)
].join("\n");
html = html.replace("</body>", `${inlineScripts}\n</body>`);
fs.writeFileSync(outputPath, html);
console.log(outputPath);
