#!/usr/bin/env node
'use strict';

// Renders one session's PROGRESS.md entries into a branded HTML report.
// Usage: node scripts/generateSessionChangelog.js <SessionID> [--no-open]

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const PROGRESS_PATH = path.join(REPO_ROOT, 'PROGRESS.md');
const TEMPLATE_PATH = path.join(REPO_ROOT, '.claude', 'skills', 'session-changelog', 'template.html');
const OUTPUT_DIR = path.join(REPO_ROOT, 'docs', 'sessions');

function fail(message) {
  console.error(`generateSessionChangelog: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const noOpen = args.includes('--no-open');
  const sessionId = args.find((a) => !a.startsWith('--'));
  return { sessionId, noOpen };
}

function parseEntries(markdown) {
  const blocks = markdown.split(/\n(?=- \[[ xX]\] )/);
  const entries = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;
    const titleMatch = lines[0].match(/^- \[([ xX])\]\s*(.+)$/);
    if (!titleMatch) continue;
    const entry = { done: titleMatch[1].toLowerCase() === 'x', title: titleMatch[2].trim(),
      date: '', session: '', whatChanged: '', verification: '', notes: '' };
    for (const line of lines.slice(1)) {
      const fieldMatch = line.match(/^\s*-\s*(Date|Session|What changed|Verification|Notes):\s*(.*)$/i);
      if (!fieldMatch) continue;
      const key = fieldMatch[1].toLowerCase();
      const value = fieldMatch[2].trim();
      if (key === 'date') entry.date = value;
      else if (key === 'session') entry.session = value;
      else if (key === 'what changed') entry.whatChanged = value;
      else if (key === 'verification') entry.verification = value;
      else if (key === 'notes') entry.notes = value;
    }
    entries.push(entry);
  }
  return entries;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Deliberately minimal: the only Markdown feature PROGRESS.md entries use
// inline is backtick code spans, so that's the only thing we render.
function renderInline(str) {
  return escapeHtml(str).replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderCard(entry) {
  const notesField = entry.notes
    ? `<div class="field"><span class="label">Notes</span><p>${renderInline(entry.notes)}</p></div>`
    : '';
  return [
    '<article class="card">',
    '  <header>',
    `    <h2>${renderInline(entry.title)}</h2>`,
    `    <span class="date">${escapeHtml(entry.date)}</span>`,
    '  </header>',
    `  <div class="field"><span class="label">What changed</span><p>${renderInline(entry.whatChanged)}</p></div>`,
    `  <div class="field"><span class="label">Verification</span><p>${renderInline(entry.verification)}</p></div>`,
    notesField,
    '</article>'
  ].join('\n');
}

function main() {
  const { sessionId, noOpen } = parseArgs(process.argv);
  if (!sessionId) fail('missing required <SessionID> argument, e.g. "node scripts/generateSessionChangelog.js CC-20260809-9f2k"');
  if (!fs.existsSync(PROGRESS_PATH)) fail(`PROGRESS.md not found at ${PROGRESS_PATH}`);
  if (!fs.existsSync(TEMPLATE_PATH)) fail(`template not found at ${TEMPLATE_PATH}`);

  const markdown = fs.readFileSync(PROGRESS_PATH, 'utf8');
  const entries = parseEntries(markdown).filter((e) => e.session === sessionId);

  if (entries.length === 0) {
    fail(`no PROGRESS.md entries found tagged with Session: ${sessionId}`);
  }

  const cardsHtml = entries.map(renderCard).join('\n');
  const entrySummary = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const html = template
    .replace(/__SESSION_ID__/g, escapeHtml(sessionId))
    .replace(/__ENTRY_SUMMARY__/g, entrySummary)
    .replace(/__GENERATED_AT__/g, new Date().toISOString())
    .replace('__CARDS__', cardsHtml);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outPath = path.join(OUTPUT_DIR, `SESSION_${sessionId}.html`);
  fs.writeFileSync(outPath, html, 'utf8');

  console.log(`Wrote ${entrySummary} for ${sessionId} to ${path.relative(REPO_ROOT, outPath)}`);

  if (!noOpen) {
    try {
      if (process.platform === 'win32') {
        execSync(`start "" "${outPath}"`, { shell: 'cmd.exe' });
      } else if (process.platform === 'darwin') {
        execSync(`open "${outPath}"`);
      } else {
        execSync(`xdg-open "${outPath}"`);
      }
    } catch (err) {
      console.warn(`Could not auto-open a browser (${err.message}). Open ${outPath} manually.`);
    }
  }
}

main();
