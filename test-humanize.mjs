/**
 * Quick test script for humanizer quality evaluation
 * Sends text directly to Ollama using the same prompts as MCP server
 */

import { readFile } from 'fs/promises';
import Handlebars from 'handlebars';

const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
const MODEL = 'gemma3:27b';

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

async function callOllama(systemPrompt) {
  const messages = [];

  // Split at delimiters for system/user separation
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

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      options: {
        temperature: 0.85,
        top_p: 0.9,
        repeat_penalty: 1.15,
      },
      think: false,
    }),
  });

  const data = await res.json();
  return data.message.content;
}

async function runTests(lang, tests) {
  const template = await loadPrompt(lang);
  let passed = 0;
  let total = tests.length;

  console.log(`\n${'#'.repeat(70)}`);
  console.log(`#  ${lang.toUpperCase()} HUMANIZER TESTS`);
  console.log(`${'#'.repeat(70)}`);

  for (const test of tests) {
    const inputSentences = test.text.split(/(?<=[.!?])\s+/).length;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`TEST: ${test.name}`);
    console.log(`STYLE: ${test.style} | INPUT SENTENCES: ${inputSentences}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\nINPUT:\n${test.text}`);

    const wrappedText = `|||SANITIZED_TEXT_START|||\n${test.text}\n|||SANITIZED_TEXT_END|||`;
    const rendered = template({ TEXT: wrappedText, STYLE: test.style, SENTENCE_COUNT: inputSentences });

    const output = await callOllama(rendered);
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

  return { passed, total };
}

async function main() {
  const lang = process.argv[2] || 'all';

  if (lang === 'en' || lang === 'all') {
    await runTests('en', enTests);
  }
  if (lang === 'uk' || lang === 'all') {
    await runTests('uk', ukTests);
  }
}

main().catch(console.error);
