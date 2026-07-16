import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';

const cwd = process.cwd();
const reportDir = path.join(cwd, 'reports');
const jsonPath = path.join(reportDir, 'eslint-report.json');
const htmlPath = path.join(reportDir, 'eslint-report.html');

const eslint = new ESLint({ cwd });
const results = await eslint.lintFiles(['src/**/*.{ts,html}']);
const jsonFormatter = await eslint.loadFormatter('json');
const json = jsonFormatter.format(results);

await fs.mkdir(reportDir, { recursive: true });
await fs.writeFile(jsonPath, json, 'utf8');

const filesLinted = results.length;
const errorCount = results.reduce((sum, file) => sum + file.errorCount, 0);
const warningCount = results.reduce((sum, file) => sum + file.warningCount, 0);
const fixableErrorCount = results.reduce((sum, file) => sum + file.fixableErrorCount, 0);
const fixableWarningCount = results.reduce((sum, file) => sum + file.fixableWarningCount, 0);
const filesWithMessages = results.filter((file) => file.messages.length > 0).length;
const ruleCounts = new Map();
const messages = [];

for (const file of results) {
    const relativeFilePath = path.relative(cwd, file.filePath).replaceAll(path.sep, '/');

    for (const message of file.messages) {
        const rule = message.ruleId || 'config/parser';

        ruleCounts.set(rule, (ruleCounts.get(rule) || 0) + 1);
        messages.push({
            file: relativeFilePath,
            line: message.line || 0,
            column: message.column || 0,
            severity: message.severity === 2 ? 'Error' : 'Warning',
            rule,
            message: message.message || ''
        });
    }
}

messages.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);

const topRules = [...ruleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
const generatedAt = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima'
}).format(new Date());
const statusText = errorCount > 0 ? 'No conforme' : warningCount > 0 ? 'Con advertencias' : 'Conforme';
const statusClass = errorCount > 0 ? 'danger' : warningCount > 0 ? 'warn' : 'ok';

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

const topRulesRows = topRules.map(([rule, count]) => `<tr><td><code>${escapeHtml(rule)}</code></td><td>${count}</td></tr>`).join('');
const messageRows = messages
    .map(
        (item) => `<tr>
<td>${escapeHtml(item.severity)}</td>
<td><code>${escapeHtml(item.file)}</code></td>
<td>${item.line}:${item.column}</td>
<td><code>${escapeHtml(item.rule)}</code></td>
<td>${escapeHtml(item.message)}</td>
</tr>`
    )
    .join('');

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Informe ESLint - plataforma-caballero</title>
<style>
:root { color-scheme: light; --bg:#f7f8fb; --panel:#ffffff; --ink:#1f2937; --muted:#64748b; --border:#d8dee9; --danger:#b42318; --warn:#b54708; --ok:#067647; --accent:#155eef; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, Segoe UI, Arial, sans-serif; color: var(--ink); background: var(--bg); }
main { max-width: 1180px; margin: 0 auto; padding: 32px 24px 48px; }
header { margin-bottom: 24px; }
h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.2; }
p { margin: 4px 0; color: var(--muted); }
.badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; color: white; font-weight: 700; font-size: 13px; }
.badge.danger { background: var(--danger); }
.badge.warn { background: var(--warn); }
.badge.ok { background: var(--ok); }
.grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin: 20px 0 24px; }
.card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
.card strong { display:block; font-size: 24px; line-height: 1.1; }
.card span { color: var(--muted); font-size: 13px; }
section { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 18px; margin-top: 18px; }
h2 { font-size: 18px; margin: 0 0 14px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { border-top: 1px solid var(--border); padding: 9px 10px; text-align: left; vertical-align: top; }
th { color: #334155; background: #f8fafc; position: sticky; top: 0; }
code { font-family: Consolas, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.table-wrap { max-height: 760px; overflow: auto; border: 1px solid var(--border); border-radius: 6px; }
.note { color: var(--muted); font-size: 13px; }
@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } main { padding: 20px 14px; } }
</style>
</head>
<body>
<main>
<header>
<h1>Informe de autoevaluacion del codigo fuente con ESLint</h1>
<p>Proyecto: <strong>plataforma-caballero</strong></p>
<p>Guia aplicada: ESLint 9 + angular-eslint 21 + typescript-eslint 8 + reglas recomendadas para Angular y templates.</p>
<p>Generado: ${escapeHtml(generatedAt)} (America/Lima) <span class="badge ${statusClass}">${statusText}</span></p>
</header>
<div class="grid">
<div class="card"><strong>${filesLinted}</strong><span>Archivos evaluados</span></div>
<div class="card"><strong>${filesWithMessages}</strong><span>Archivos con hallazgos</span></div>
<div class="card"><strong>${errorCount}</strong><span>Errores</span></div>
<div class="card"><strong>${warningCount}</strong><span>Advertencias</span></div>
<div class="card"><strong>${fixableErrorCount + fixableWarningCount}</strong><span>Corregibles automaticamente</span></div>
</div>
<section>
<h2>Resultado ejecutivo</h2>
<p class="note">La ejecucion del linter finalizo y produjo este reporte. Un estado "No conforme" significa que hay errores que deben corregirse antes de considerar aprobada la autoevaluacion.</p>
</section>
<section>
<h2>Reglas con mas hallazgos</h2>
<table><thead><tr><th>Regla</th><th>Cantidad</th></tr></thead><tbody>${topRulesRows || '<tr><td colspan="2">Sin hallazgos.</td></tr>'}</tbody></table>
</section>
<section>
<h2>Detalle de hallazgos</h2>
<div class="table-wrap"><table><thead><tr><th>Severidad</th><th>Archivo</th><th>Linea</th><th>Regla</th><th>Mensaje</th></tr></thead><tbody>${messageRows || '<tr><td colspan="5">Sin hallazgos.</td></tr>'}</tbody></table></div>
</section>
</main>
</body>
</html>`;

await fs.writeFile(htmlPath, html, 'utf8');

console.log(`ESLint HTML report: ${htmlPath}`);
console.log(`ESLint JSON report: ${jsonPath}`);
console.log(`${errorCount} errors, ${warningCount} warnings across ${filesWithMessages} files with findings.`);

if (errorCount > 0) {
    process.exitCode = 1;
}
