/**
 * Quick test script for humanizer quality evaluation
 * Sends text directly to Ollama using the same prompts as MCP server
 * Optionally scores output via ZeroGPT AI detector
 *
 * Usage:
 *   node test-humanize.mjs en|uk|all         # humanize only
 *   node test-humanize.mjs en --zerogpt      # humanize + ZeroGPT scoring
 *   node test-humanize.mjs all --zerogpt     # all tests + ZeroGPT
 */

import { readFile } from 'fs/promises';
import { config } from 'dotenv';
import Handlebars from 'handlebars';

// Load .env.local from project root
config({ path: '.env.local' });

const ZEROGPT_URL = 'https://api.zerogpt.com/api/detect/detectText';

// Resolve backend: LLM_BACKEND explicit, or auto-detect (matches llm-factory.ts)
function makeOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');
  return { name: 'openrouter', model: process.env.OPENROUTER_MODEL ?? 'google/gemma-3-27b-it', apiKey, baseUrl: 'https://openrouter.ai/api/v1' };
}
function makeGoogle() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set');
  return { name: 'gemini', model: process.env.GOOGLE_AI_MODEL ?? 'gemma-3-27b-it', apiKey };
}
function makeOllama() {
  return { name: 'ollama', model: process.env.OLLAMA_MODEL ?? 'gemma3:27b', host: process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434' };
}

function resolveBackend() {
  const explicit = process.env.LLM_BACKEND?.trim().toLowerCase();
  if (explicit) {
    switch (explicit) {
      case 'openrouter': return makeOpenRouter();
      case 'google': return makeGoogle();
      case 'ollama': return makeOllama();
      default: throw new Error(`Unknown LLM_BACKEND="${explicit}". Use: openrouter, google, ollama`);
    }
  }
  if (process.env.OPENROUTER_API_KEY) return makeOpenRouter();
  if (process.env.GOOGLE_AI_API_KEY) return makeGoogle();
  return makeOllama();
}

// EN test texts
const enTests = [
  // === CASUAL ===
  {
    name: 'Casual: Instagram private accounts (2 sentences)',
    style: 'casual',
    text: 'Videolyti only works with public Instagram accounts. Private accounts require authentication which we don\'t support for privacy reasons.',
  },
  {
    name: 'Casual: TikTok transcription (3 sentences)',
    style: 'casual',
    text: 'Yes! Videolyti offers free AI transcription with every download. Simply enable the transcription option when downloading, and get accurate text in 90+ languages using OpenAI Whisper technology.',
  },
  // === PROFESSIONAL ===
  {
    name: 'Professional: repo sharing (5 sentences)',
    style: 'professional',
    text: 'About repo sharing. Repos ARE shared through the Team tab in settings. Go to Settings - Team tab - "Shared Repositories" section (scroll down past team members). The admin can add repos there, and all team members will see them automatically. Each member doesn\'t need to add repos manually - they just need to open the Team tab once.',
  },
  {
    name: 'Professional: legal FAQ (3 sentences)',
    style: 'professional',
    text: 'Downloading TikTok videos for personal use is generally allowed. However, re-uploading or using copyrighted content commercially may violate terms of service. Always respect creators\' rights.',
  },
  {
    name: 'Professional: 2FA setup how-to (6 sentences)',
    style: 'professional',
    text: 'Setting up two-factor authentication is important for account security. First, go to your account settings page. Then, click on the Security tab. Next, select Enable 2FA and choose your preferred method. You will receive a verification code on your device. Enter the code to complete the setup.',
  },
  {
    name: 'Professional: 2FA setup how-to TWO-PASS (6 sentences)',
    style: 'professional',
    passes: 2,
    text: 'Setting up two-factor authentication is important for account security. First, go to your account settings page. Then, click on the Security tab. Next, select Enable 2FA and choose your preferred method. You will receive a verification code on your device. Enter the code to complete the setup.',
  },
  // === ACADEMIC ===
  {
    name: 'Academic: AI transcription tech (2 sentences)',
    style: 'academic',
    text: 'Free AI video transcription tool. Convert TikTok, YouTube, Instagram videos to text powered by OpenAI Whisper with support for 90+ languages.',
  },
  {
    name: 'Academic: copyright (3 sentences)',
    style: 'academic',
    text: 'Downloading TikTok videos for personal use is generally allowed. However, re-uploading or using copyrighted content commercially may violate terms of service. Always respect creators\' rights.',
  },
  // === BLOG ===
  {
    name: 'Blog: transcription feature (3 sentences)',
    style: 'blog',
    text: 'Yes! Videolyti offers free AI transcription with every download. Simply enable the transcription option when downloading, and get accurate text in 90+ languages using OpenAI Whisper technology.',
  },
  {
    name: 'Blog: TikTok downloader (2 sentences)',
    style: 'blog',
    text: 'Videolyti is the only free TikTok downloader that includes AI transcription. Unlike SSSTik or SnapTik, Videolyti also supports YouTube and Instagram, with no watermarks and no registration required.',
  },
  // === JOURNALISTIC ===
  {
    name: 'Journalistic: TikTok downloader (2 sentences)',
    style: 'journalistic',
    text: 'Videolyti is the only free TikTok downloader that includes AI transcription. Unlike SSSTik or SnapTik, Videolyti also supports YouTube and Instagram, with no watermarks and no registration required.',
  },
  {
    name: 'Journalistic: YouTube FAQ (3 sentences)',
    style: 'journalistic',
    text: 'Use Videolyti to download YouTube videos in HD quality. Paste the video URL, click Download, and save the video instantly. No registration or software installation required.',
  },
];

// UK test texts
const ukTests = [
  // === CASUAL ===
  {
    name: 'Casual: приватні акаунти (2 речення)',
    style: 'casual',
    text: 'Videolyti працює лише з публічними акаунтами Instagram. Приватні акаунти потребують авторизації, яку ми не підтримуємо з міркувань конфіденційності.',
  },
  {
    name: 'Casual: транскрипція (3 речення)',
    style: 'casual',
    text: 'Так! Videolyti пропонує безкоштовну AI-транскрипцію з кожним завантаженням. Просто увімкніть опцію транскрипції під час завантаження і отримайте точний текст більш ніж 90 мовами за допомогою технології OpenAI Whisper.',
  },
  // === PROFESSIONAL ===
  {
    name: 'Professional: юридичне FAQ (3 речення)',
    style: 'professional',
    text: 'Завантаження відео з TikTok для особистого використання зазвичай дозволяється. Однак повторне завантаження або комерційне використання захищеного авторським правом контенту може порушувати умови обслуговування. Завжди поважайте права авторів.',
  },
  {
    name: 'Professional: опис продукту (2 речення)',
    style: 'professional',
    text: 'Videolyti є єдиним безкоштовним завантажувачем TikTok з AI-транскрипцією. На відміну від SSSTik чи SnapTik, Videolyti також підтримує YouTube та Instagram без водяних знаків та реєстрації.',
  },
  // === ACADEMIC ===
  {
    name: 'Academic: авторське право (3 речення)',
    style: 'academic',
    text: 'Завантаження відео з TikTok для особистого використання зазвичай дозволяється. Однак повторне завантаження або комерційне використання захищеного авторським правом контенту може порушувати умови обслуговування. Завжди поважайте права авторів.',
  },
  // === BLOG ===
  {
    name: 'Blog: TikTok завантажувач (2 речення)',
    style: 'blog',
    text: 'Videolyti є єдиним безкоштовним завантажувачем TikTok з AI-транскрипцією. На відміну від SSSTik чи SnapTik, Videolyti також підтримує YouTube та Instagram без водяних знаків та реєстрації.',
  },
  // === JOURNALISTIC ===
  {
    name: 'Journalistic: YouTube FAQ (3 речення)',
    style: 'journalistic',
    text: 'Використовуйте Videolyti для завантаження відео з YouTube у HD якості. Вставте URL відео, натисніть Завантажити та збережіть відео миттєво. Реєстрація або встановлення програмного забезпечення не потрібні.',
  },
];

async function loadPrompt(lang) {
  const raw = await readFile(`prompts/${lang}/system.md`, 'utf8');
  return Handlebars.compile(raw);
}

function splitMessages(systemPrompt) {
  const messages = [];
  const delimStart = '|||USER_INPUT_START|||';
  const delimEnd = '|||USER_INPUT_END|||';
  const startIdx = systemPrompt.indexOf(delimStart);
  const endIdx = systemPrompt.indexOf(delimEnd);

  if (startIdx !== -1 && endIdx !== -1) {
    const sysPart = systemPrompt.substring(0, startIdx).trim();
    const userPart = systemPrompt.substring(startIdx, endIdx + delimEnd.length).trim();
    const reminder = systemPrompt.substring(endIdx + delimEnd.length).trim();
    const fullSystem = reminder ? `${sysPart}\n\n${reminder}` : sysPart;
    messages.push({ role: 'system', content: fullSystem });
    messages.push({ role: 'user', content: userPart });
  } else {
    messages.push({ role: 'system', content: systemPrompt });
  }
  return messages;
}

async function callLLM(backend, systemPrompt) {
  const messages = splitMessages(systemPrompt);

  if (backend.name === 'openrouter') {
    const res = await fetch(`${backend.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${backend.apiKey}`,
      },
      body: JSON.stringify({
        model: backend.model,
        messages,
        temperature: 0.85,
        top_p: 0.9,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${JSON.stringify(data)}`);
    return data.choices?.[0]?.message?.content ?? '';
  }

  if (backend.name === 'gemini') {
    // Merge system into first user message (Gemma on AI Studio)
    const systemText = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const nonSystem = messages.filter(m => m.role !== 'system');
    const contents = nonSystem.length > 0
      ? nonSystem.map((m, i) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: i === 0 && systemText ? `${systemText}\n\n${m.content}` : m.content }],
        }))
      : [{ role: 'user', parts: [{ text: systemText }] }];

    const modelId = backend.model.startsWith('models/') ? backend.model : `models/${backend.model}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${backend.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.85, topP: 0.9 },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${JSON.stringify(data)}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  // Ollama (default)
  const res = await fetch(`${backend.host}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: backend.model,
      messages,
      stream: false,
      options: { temperature: 0.85, top_p: 0.9, repeat_penalty: 1.15 },
      think: false,
    }),
  });
  const data = await res.json();
  return data.message.content;
}

async function checkZeroGPT(text) {
  try {
    const res = await fetch(ZEROGPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.zerogpt.com',
        'Referer': 'https://www.zerogpt.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      body: JSON.stringify({ input_text: text }),
    });
    const data = await res.json();
    if (data.success && data.data) {
      return {
        aiPercent: data.data.fakePercentage,
        feedback: data.data.feedback,
        flaggedSentences: data.data.h?.length || 0,
        totalSentences: (data.data.h?.length || 0) + (data.data.hi?.length || 0),
      };
    }
    return { aiPercent: -1, feedback: 'API error', flaggedSentences: 0, totalSentences: 0 };
  } catch (e) {
    return { aiPercent: -1, feedback: e.message, flaggedSentences: 0, totalSentences: 0 };
  }
}

// AI vocabulary replacements — must match TextProcessor.AI_REPLACEMENTS
const AI_REPLACEMENTS = [
  [/\butilizing\b/gi, (m) => m[0] === 'U' ? 'Using' : 'using'],
  [/\butilize\b/gi, (m) => m[0] === 'U' ? 'Use' : 'use'],
  [/\bleveraging\b/gi, (m) => m[0] === 'L' ? 'Using' : 'using'],
  [/\bleverage\b/gi, (m) => m[0] === 'L' ? 'Use' : 'use'],
  [/\bfacilitat(?:e|es|ing)\b/gi, (m) => {
    const cap = m[0] === 'F';
    return /ing$/i.test(m) ? (cap ? 'Helping' : 'helping') : (cap ? 'Help' : 'help');
  }],
  [/\bstreamlin(?:e|es|ing)\b/gi, (m) => {
    const cap = m[0] === 'S';
    return /ing$/i.test(m) ? (cap ? 'Simplifying' : 'simplifying') : (cap ? 'Simplify' : 'simplify');
  }],
  [/\bstands out as\b/gi, 'is'],
  [/\bserves as\b/gi, 'is'],
  [/\bfunctions as\b/gi, 'is'],
  [/\bacts as\b/gi, 'is'],
  [/\bstraightforward\b/gi, (m) => m[0] === 'S' ? 'Simple' : 'simple'],
  [/\bcomprehensive\b/gi, (m) => m[0] === 'C' ? 'Full' : 'full'],
  [/\bseamless(?:ly)?\b/gi, (m) => {
    const cap = m[0] === 'S';
    return /ly$/i.test(m) ? (cap ? 'Smoothly' : 'smoothly') : (cap ? 'Smooth' : 'smooth');
  }],
  [/\brobust\b/gi, (m) => m[0] === 'R' ? 'Strong' : 'strong'],
  [/\bcrucial\b/gi, (m) => m[0] === 'C' ? 'Important' : 'important'],
  [/\bparamount\b/gi, (m) => m[0] === 'P' ? 'Important' : 'important'],
  [/\bessential\b/gi, (m) => m[0] === 'E' ? 'Important' : 'important'],
  [/\bvital\b/gi, (m) => m[0] === 'V' ? 'Important' : 'important'],
  [/\bdelve\b/gi, (m) => m[0] === 'D' ? 'Look into' : 'look into'],
];

function postProcess(text) {
  let result = text;
  result = result.replace(/^(?:okay[,.]?\s*)?here(?:'s| is) the rewritten text[^]*?:\s*\n+/i, '');
  result = result.replace(/—/g, '–');
  result = result.replace(/(\S)–(\S)/g, '$1 – $2');
  for (const [pattern, replacement] of AI_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  // Strip trailing superficial -ing clauses
  result = result.replace(/,\s*(?:simplifying|enhancing|streamlining|highlighting|showcasing|underscoring|facilitating|ensuring|enabling|empowering)\s+[^.!?]*([.!?])/gi, '$1');
  result = result.replace(/^["']|["']$/g, '').trim();
  return result;
}

async function runTests(lang, tests, useZeroGPT, backend) {
  const template = await loadPrompt(lang);
  let passed = 0;
  let total = tests.length;
  const zerogptResults = [];

  console.log(`\n${'#'.repeat(70)}`);
  console.log(`#  ${lang.toUpperCase()} HUMANIZER TESTS${useZeroGPT ? ' + ZeroGPT' : ''}  [${backend.name}: ${backend.model}]`);
  console.log(`${'#'.repeat(70)}`);

  for (const test of tests) {
    const inputSentences = test.text.split(/(?<=[.!?])\s+/).length;
    const passes = test.passes || 1;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`TEST: ${test.name}`);
    console.log(`STYLE: ${test.style} | INPUT SENTENCES: ${inputSentences} | PASSES: ${passes}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\nINPUT:\n${test.text}`);

    let currentText = test.text;

    for (let pass = 0; pass < passes; pass++) {
      const wrappedText = `|||SANITIZED_TEXT_START|||\n${currentText}\n|||SANITIZED_TEXT_END|||`;
      const currentSentences = currentText.split(/(?<=[.!?])\s+/).length;
      const rendered = template({ TEXT: wrappedText, STYLE: test.style, SENTENCE_COUNT: currentSentences });
      currentText = postProcess(await callLLM(backend, rendered));
      if (passes > 1) {
        console.log(`\n  [Pass ${pass + 1}/${passes}]: ${currentText.substring(0, 80)}...`);
      }
    }

    const output = currentText;
    const outputSentences = output.split(/(?<=[.!?])\s+/).length;

    console.log(`\nOUTPUT (${outputSentences} sentences):\n${output}`);

    let issues = [];

    if (inputSentences !== outputSentences) {
      issues.push(`SENTENCE COUNT MISMATCH: ${inputSentences} → ${outputSentences}`);
    }

    // Check for casual patterns in professional style
    if (test.style === 'professional') {
      const casualPatterns = lang === 'en'
        ? ['honestly', 'pretty much', 'a ton of', 'good to go', 'kind of', 'So,', 'Look,', 'I think', 'pretty straightforward', 'get you in trouble']
        : ['знаєш що', 'чесно кажучи', 'проблемка', 'трішечки', 'фішка', 'круто'];
      const found = casualPatterns.filter(p => output.toLowerCase().includes(p.toLowerCase()));
      if (found.length > 0) {
        issues.push(`CASUAL PATTERNS IN PROFESSIONAL: ${found.join(', ')}`);
      }
    }

    // Check for em dashes
    if (output.includes('—')) {
      issues.push('EM DASH FOUND (should be en dash)');
    }

    // Check for AI clichés
    const aiCliches = lang === 'en'
      ? ['leveraging', 'utilizing', 'comprehensive', 'robust', 'seamless', 'crucial', 'vital', 'game.changer', 'stands out as', 'serves as']
      : ['ключову роль', 'варто зазначити', 'важливо відмітити', 'всеосяжний', 'безпрецедентний', 'є свідченням'];
    const foundCliches = aiCliches.filter(p => new RegExp(p, 'i').test(output));
    if (foundCliches.length > 0) {
      issues.push(`AI CLICHES: ${foundCliches.join(', ')}`);
    }

    // Check for rusyzmy in UK
    if (lang === 'uk') {
      const rusyzmy = ['являється', 'слідуючий', 'приймати участь', 'на протязі', 'співпадати', 'любий'];
      const foundRus = rusyzmy.filter(p => output.toLowerCase().includes(p.toLowerCase()));
      if (foundRus.length > 0) {
        issues.push(`RUSYZMY: ${foundRus.join(', ')}`);
      }
    }

    // ZeroGPT scoring
    let zgResult = null;
    if (useZeroGPT) {
      zgResult = await checkZeroGPT(output);
      const emoji = zgResult.aiPercent === 0 ? '🟢' : zgResult.aiPercent <= 30 ? '🟡' : '🔴';
      console.log(`\n${emoji} ZeroGPT: ${zgResult.aiPercent}% AI | ${zgResult.feedback}`);
      if (zgResult.flaggedSentences > 0) {
        console.log(`   Flagged: ${zgResult.flaggedSentences}/${zgResult.totalSentences} sentences`);
      }
      zerogptResults.push({ name: test.name, passes, ...zgResult });
      // Rate limit: 1 req/sec
      await new Promise(r => setTimeout(r, 1500));
    }

    if (issues.length === 0) {
      console.log('\n✅ PASS');
      passed++;
    } else {
      for (const issue of issues) {
        console.log(`\n⚠️  ${issue}`);
      }
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`${lang.toUpperCase()} RESULTS: ${passed}/${total} passed`);
  console.log(`${'='.repeat(70)}`);

  // ZeroGPT summary table
  if (useZeroGPT && zerogptResults.length > 0) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`  ZeroGPT Summary (${lang.toUpperCase()})`);
    console.log(`${'─'.repeat(70)}`);
    console.log(`  ${'Test'.padEnd(48)} | Passes | AI %`);
    console.log(`  ${'─'.repeat(48)}-+--------+------`);
    for (const r of zerogptResults) {
      const emoji = r.aiPercent === 0 ? '🟢' : r.aiPercent <= 30 ? '🟡' : '🔴';
      console.log(`  ${emoji} ${r.name.padEnd(46)} | ${String(r.passes).padStart(6)} | ${r.aiPercent}%`);
    }
    const avg = zerogptResults.reduce((s, r) => s + r.aiPercent, 0) / zerogptResults.length;
    const zeros = zerogptResults.filter(r => r.aiPercent === 0).length;
    console.log(`  ${'─'.repeat(48)}-+--------+------`);
    console.log(`  Average: ${avg.toFixed(1)}% AI | ${zeros}/${zerogptResults.length} passed (0% AI)`);
  }

  return { passed, total };
}

async function main() {
  const args = process.argv.slice(2);
  const useZeroGPT = args.includes('--zerogpt');
  const lang = args.find(a => !a.startsWith('--')) || 'all';
  const backend = resolveBackend();

  console.log(`Backend: ${backend.name} | Model: ${backend.model}`);

  if (lang === 'en' || lang === 'all') {
    await runTests('en', enTests, useZeroGPT, backend);
  }
  if (lang === 'uk' || lang === 'all') {
    await runTests('uk', ukTests, useZeroGPT, backend);
  }
}

main().catch(console.error);
