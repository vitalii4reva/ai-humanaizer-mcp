/**
 * Enhanced humanization test with burstiness-focused prompts
 * Tests against ZeroGPT + Claude self-evaluation
 */
import { readFile, writeFile } from 'fs/promises';
import { config } from 'dotenv';
config({ path: '.env.local' });

const key = process.env.OPENROUTER_API_KEY;
const model = 'google/gemma-3-27b-it';

async function callOR(messages, temp = 0.9) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({ model, messages, temperature: temp, top_p: 0.92 }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(d));
  return d.choices[0].message.content;
}

async function checkZeroGPT(text) {
  const res = await fetch('https://api.zerogpt.com/api/detect/detectText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://www.zerogpt.com',
      Referer: 'https://www.zerogpt.com/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    body: JSON.stringify({ input_text: text }),
  });
  const d = await res.json();
  return d.data ? { ai: d.data.fakePercentage, feedback: d.data.feedback, flagged: d.data.h } : { ai: -1 };
}

// Enhanced EN prompt
const enSystemPrompt = `You are a human editor rewriting AI-generated text. Your ONLY job: make it read like a real person wrote it.

CRITICAL RULES FOR BEATING AI DETECTORS:

1. BURSTINESS IS KING: Mix sentence lengths aggressively.
   - Some sentences: 3-5 words. Blunt. Direct.
   - Others: 20-30 words with subordinate clauses, parenthetical asides, and nested thoughts that mirror how people actually think when writing.
   - NEVER write 3+ consecutive sentences of similar length.

2. SENTENCE STARTERS - vary wildly:
   - Start some with conjunctions: "But", "And", "Yet", "Still"
   - Start some with adverbial phrases: "In practice,", "Technically speaking,"
   - Start some with the subject directly
   - Use a rhetorical question somewhere in the middle
   - NEVER use sequential transitions (First/Then/Next/Finally)

3. PERPLEXITY BOOSTERS (unexpected word choices):
   - Use informal hedges in formal text: "generally", "more or less", "in most cases"
   - Throw in a concrete specific: a number, a law name, a real example
   - Use a mild colloquialism or idiom even in professional text
   - Interrupt a thought with a parenthetical (like this)

4. STRUCTURAL UNPREDICTABILITY:
   - Do NOT follow a pattern of claim-explanation-claim-explanation
   - Mix: statement, aside, question, short punch, long elaboration
   - One sentence should feel slightly out of place (human quirk)

5. VOICE MIXING:
   - Mostly active voice, but slip in 1-2 passive constructions
   - Use "you" directly addressing the reader in 1-2 places
   - Add a soft opinion marker: "arguably", "worth noting", "the reality is"

OUTPUT: Only the rewritten text. Same meaning, same facts, same number of sentences (+-1). No preambles, no quotes around the text.`;

// Enhanced UK prompt
const ukSystemPrompt = `Ти — людина-редактор, яка переписує AI-генерований текст українською. Твоя ЄДИНА задача: зробити так, щоб текст читався як написаний живою людиною.

КРИТИЧНІ ПРАВИЛА:

1. BURSTINESS (різноманітність довжин речень):
   - Деякі речення: 3-6 слів. Коротко. По суті.
   - Інші: 20-30 слів зі вставними конструкціями, підрядними реченнями, думками в дужках.
   - НІКОЛИ не пиши 3+ речення поспіль однакової довжини.

2. ПОЧАТКИ РЕЧЕНЬ — чергуй:
   - Починай з сполучників: "Але", "І", "Щоправда", "Втім"
   - Починай з прислівникових зворотів: "На практиці,", "Технічно кажучи,"
   - Починай з підмета напряму
   - Встав риторичне запитання десь посередині
   - НІКОЛИ не використовуй послідовні переходи (По-перше/По-друге/Далі)

3. ПЕРПЛЕКСІЯ (непередбачуваність):
   - Використовуй розмовні хеджі у формальному тексті: "загалом", "як правило", "більш-менш"
   - Встав конкретику: номер статті, назву закону, реальний приклад
   - Використай м'який колоквіалізм навіть у професійному тексті
   - Перерви думку вставкою в дужках

4. СТРУКТУРНА НЕПЕРЕДБАЧУВАНІСТЬ:
   - НЕ дотримуйся патерну твердження-пояснення-твердження-пояснення
   - Міксуй: факт, ремарка, запитання, короткий удар, довге пояснення

5. ГОЛОС:
   - Переважно активний стан, але 1-2 пасивні конструкції
   - Звертайся до читача на "ви" в 1-2 місцях
   - Додай маркер думки: "варто зазначити", "реальність така", "відверто кажучи"

ВИХІД: Тільки переписаний текст. Той самий зміст, ті ж факти, та ж кількість речень (+-1). Без преамбул, без лапок навколо тексту.`;

// Refine prompts
const enRefinePrompt = 'You are a human text editor. The text below was written to sound human but may still have AI patterns. Your job: increase burstiness further. Make some sentences shorter (3-6 words). Make one sentence longer and more complex with a parenthetical aside. Change 2-3 word choices to less common synonyms. Keep the same meaning and facts. Output only the text, no preambles.';
const ukRefinePrompt = 'Ти — редактор тексту. Текст нижче вже переписаний, але може мати патерни AI. Твоя задача: збільшити burstiness. Зроби деякі речення коротшими (3-6 слів). Одне речення зроби довшим і складнішим зі вставкою в дужках. Зміни 2-3 слова на менш поширені синоніми. Зберігай той самий зміст. Виведи тільки текст, без преамбул.';

function clean(text) {
  return text.replace(/^["'\u201C\u201D]|["'\u201C\u201D]$/g, '')
    .replace(/^(?:okay[,.]?\s*)?here(?:'s| is)[^]*?:\s*\n+/i, '')
    .replace(/\u2014/g, '\u2013') // em dash -> en dash
    .replace(/(\S)\u2013(\S)/g, '$1 \u2013 $2')
    .trim();
}

async function main() {
  const en = JSON.parse(await readFile('/Users/vitalii/Projects/my/videolyti/frontend/src/i18n/dictionaries/en.json', 'utf8'));
  const uk = JSON.parse(await readFile('/Users/vitalii/Projects/my/videolyti/frontend/src/i18n/dictionaries/uk.json', 'utf8'));
  const enText = en.blog.tiktokNoWatermark.sections.legalAspectsContent.substring(0, 1000);
  const ukText = uk.blog.tiktokNoWatermark.sections.legalAspectsContent.substring(0, 1000);

  // === EN ===
  console.log('=== EN Pass 1 (enhanced burstiness prompt) ===');
  let enResult = clean(await callOR([
    { role: 'system', content: enSystemPrompt },
    { role: 'user', content: 'Rewrite this professional/legal text:\n\n' + enText },
  ]));
  console.log(enResult);
  console.log('\nSentences:', enResult.split(/(?<=[.!?])\s+/).length, '| Chars:', enResult.length);

  console.log('\n=== EN Pass 2 (refine burstiness) ===');
  enResult = clean(await callOR([
    { role: 'system', content: enRefinePrompt },
    { role: 'user', content: enResult },
  ]));
  console.log(enResult);
  console.log('\nSentences:', enResult.split(/(?<=[.!?])\s+/).length, '| Chars:', enResult.length);

  // === UK ===
  console.log('\n=== UK Pass 1 (enhanced burstiness prompt) ===');
  let ukResult = clean(await callOR([
    { role: 'system', content: ukSystemPrompt },
    { role: 'user', content: 'Перепиши цей професійний/юридичний текст:\n\n' + ukText },
  ]));
  console.log(ukResult);
  console.log('\nSentences:', ukResult.split(/(?<=[.!?])\s+/).length, '| Chars:', ukResult.length);

  console.log('\n=== UK Pass 2 (refine burstiness) ===');
  ukResult = clean(await callOR([
    { role: 'system', content: ukRefinePrompt },
    { role: 'user', content: ukResult },
  ]));
  console.log(ukResult);
  console.log('\nSentences:', ukResult.split(/(?<=[.!?])\s+/).length, '| Chars:', ukResult.length);

  // === ZeroGPT ===
  console.log('\n=== ZeroGPT Scoring ===');
  const enZg = await checkZeroGPT(enResult);
  console.log('EN:', enZg.ai + '% AI |', enZg.feedback);
  if (enZg.flagged?.length) console.log('  Flagged sentences:', enZg.flagged);

  await new Promise(r => setTimeout(r, 2000));

  const ukZg = await checkZeroGPT(ukResult);
  console.log('UK:', ukZg.ai + '% AI |', ukZg.feedback);
  if (ukZg.flagged?.length) console.log('  Flagged sentences:', ukZg.flagged);

  // Save results
  await writeFile('/tmp/humanized-en.txt', enResult);
  await writeFile('/tmp/humanized-uk.txt', ukResult);
  await writeFile('/tmp/humanized-originals.txt', 'EN:\n' + enText + '\n\nUK:\n' + ukText);
  console.log('\nSaved to /tmp/humanized-en.txt, /tmp/humanized-uk.txt');
}

main().catch(console.error);
