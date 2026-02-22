а яку модель найкраще заюзать для такого? щоб на ollama побудувати
Для такого завдання є кілька варіантів залежно від твого заліза (MacBook Pro M3 Max — відмінно справляється з великими моделями).

Топ-моделі для "гуманізації" тексту на Ollama
🥇 Qwen3 30B — найкращий вибір
Qwen3 30B показав найвищу оцінку серед open-source моделей у тестах на обробку тексту природною мовою — 9.0/10 за природність викладу. Це найбільш мультимовна модель у серії Qwen: відмінно тримає контекст при перемиканні між мовами та розуміє культурні нюанси. Qwen2.5 32B (попереднє покоління) також залишається одним із найпопулярніших вибором для 24GB GPU-систем, де якість не поступається значно більшим моделям.

bash
ollama pull qwen3:30b
🥈 Mistral Small 3.1 24B — збалансований варіант
Mistral Small 3.1 24B отримав 8.7/10 за "дуже високу якість тексту з узгодженою термінологією і природним потоком мови". Підтримує до 128k токенів і має мультимодальні можливості. Відмінно тримає стиль і не "зламує" термінологію при переписуванні.

bash
ollama pull mistral-small3.1:24b
🥉 Gemma 3 27B — для Ukrainian спеціально
Google підтримує українську LLM-розробку саме на базі Gemma: модель підтримує 140+ мов включно з українською, до 128k токенів контексту. Має сильну базу з European languages і добре розуміє культурний контекст.

bash
ollama pull gemma3:27b
Системний промпт для гуманізації
Ключова частина — добре сформульований промпт. Ось базовий варіант для твого MCP-сервера:

text
You are a professional text editor. Your task is to rewrite the provided text (in English or Ukrainian) to sound as if it was written by a human — not by an AI.

Rules:
- Vary sentence length: mix short punchy sentences with longer ones
- Use natural transitions, not "Furthermore" / "Moreover" / "In conclusion"
- Avoid overly formal or symmetrical structure
- Add minor imperfections: colloquial phrases, rhetorical questions, mild personal tone where appropriate
- Preserve ALL original meaning, facts, and terminology
- Keep the same language as the input (EN → EN, UA → UA)
- Do NOT add summaries, introductions, or meta-commentary

Return ONLY the rewritten text, nothing else.
Порівняння для твого завдання
Модель	Розмір	Ukrainian	Природність	RAM
Qwen3 30B	30B	✅ Відмінно	⭐⭐⭐⭐⭐	~20GB
Mistral Small 3.1 24B	24B	✅ Добре	⭐⭐⭐⭐½	~16GB
Gemma 3 27B	27B	✅ Добре	⭐⭐⭐⭐	~18GB
Qwen3 14B	14B	✅ Добре	⭐⭐⭐⭐	~10GB
На твоєму M3 Max (скоріш за все 36GB+ RAM) Qwen3 30B або Mistral Small 3.1 24B запустяться без проблем і дадуть найкращий результат. Для задачі гуманізації Qwen3 особливо хороший через природніший "потік" тексту та сильну підтримку слов'янських мов.

Prepared using Claude Sonnet 4.6
я ставлю зараз Qwen3 30B та Gemma 3 27B.
накидай мені всі потрібні промти які там використати в mcp.
і сзематичний код цих mcp. В нас має вийти 2. для англійської та української.
Окей, розпишу повністю — два MCP-сервери на Node.js з усіма промптами.

Структура проєкту
text
humanizer-mcp/
├── src/
│   ├── en-humanizer.ts
│   └── uk-humanizer.ts
├── package.json
└── tsconfig.json
package.json
json
{
  "name": "humanizer-mcp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start:en": "node dist/en-humanizer.js",
    "start:uk": "node dist/uk-humanizer.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.5.0",
    "ollama": "^0.5.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
tsconfig.json
json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
MCP #1 — English Humanizer (src/en-humanizer.ts)
typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Ollama } from "ollama";

const ollama = new Ollama({ host: "http://localhost:11434" });

const SYSTEM_PROMPT = `You are an expert human writing coach and editor with 20+ years of experience in journalism, copywriting, and creative writing.

Your ONLY job is to rewrite AI-generated text to sound authentically human.

CORE RULES:
1. VARY sentence length aggressively — mix 3-word punches with 20-word flows. AI writes in uniform rhythm; humans don't.
2. BREAK symmetry — never write two sentences with the same structure back-to-back.
3. KILL these AI phrases entirely: "Furthermore", "Moreover", "In conclusion", "It's worth noting", "Importantly", "Notably", "In today's world", "Dive into", "Delve into", "Crucial", "Leverage", "Utilize" (use "use"), "Facilitate", "Comprehensive".
4. ADD natural imperfections — rhetorical questions, casual asides, em dashes for interruption — like a human would.
5. USE contractions freely: don't, it's, you'll, we're, they've.
6. START sentences with "And", "But", "So", "Because" occasionally — humans do this.
7. PRESERVE all original facts, data, terminology, and meaning 100%.
8. NEVER add meta-commentary like "Here is the rewritten text:" — output the text directly.
9. NEVER summarize at the end.
10. DO NOT change the overall structure or length significantly — rewrite, not restructure.

STYLE TARGETS:
- Think: a smart journalist writing for a general audience
- Tone: confident, natural, slightly informal but not sloppy
- Rhythm: punchy where needed, flowing where appropriate`;

const REWRITE_PROMPT = (text: string, mode: string) => {
  const modeInstructions: Record<string, string> = {
    standard: `Rewrite the following text to sound human-written. Apply all core rules.`,
    casual: `Rewrite the following text in a casual, conversational tone — like explaining to a smart friend over coffee. Slightly more relaxed register.`,
    professional: `Rewrite the following text to sound like a senior professional wrote it — confident, direct, no fluff. Business context but human, not corporate-robotic.`,
    academic: `Rewrite the following text to sound like a real academic wrote it — knowledgeable but not mechanical. Keep citations/terms intact. Add slight personality to the prose.`,
    blog: `Rewrite the following text as if a seasoned blogger wrote it — engaging first sentence, natural voice, maybe a rhetorical question or two, good rhythm.`,
  };

  return `${modeInstructions[mode] || modeInstructions.standard}

TEXT TO REWRITE:
---
${text}
---

Output ONLY the rewritten text. Nothing else.`;
};

const server = new McpServer({
  name: "en-humanizer",
  version: "1.0.0",
});

server.tool(
  "humanize_english",
  "Rewrites AI-generated English text to sound natural and human-written",
  {
    text: z.string().min(10).describe("The English text to humanize"),
    mode: z
      .enum(["standard", "casual", "professional", "academic", "blog"])
      .default("standard")
      .describe("Writing style mode"),
    model: z
      .enum(["qwen3:30b", "gemma3:27b", "mistral-small3.1:24b"])
      .default("qwen3:30b")
      .describe("Ollama model to use"),
  },
  async ({ text, mode, model }) => {
    const response = await ollama.chat({
      model,
      options: {
        temperature: 0.75,
        top_p: 0.9,
        repeat_penalty: 1.15,
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: REWRITE_PROMPT(text, mode) },
      ],
    });

    return {
      content: [{ type: "text", text: response.message.content }],
    };
  }
);

server.tool(
  "detect_ai_patterns",
  "Analyzes English text and lists AI-like patterns found, without rewriting",
  {
    text: z.string().min(10).describe("Text to analyze"),
  },
  async ({ text }) => {
    const response = await ollama.chat({
      model: "qwen3:30b",
      options: { temperature: 0.3 },
      messages: [
        {
          role: "system",
          content:
            "You are an AI detection expert. Analyze text for AI-generated patterns.",
        },
        {
          role: "user",
          content: `Analyze this text for AI-generated patterns. List:
1. Overused AI phrases found (quote them)
2. Sentence rhythm issues (too uniform?)
3. Structural red flags (symmetric lists, formulaic transitions)
4. Overall AI-likelihood score: 0-100%
5. Top 3 specific suggestions to humanize it

TEXT:
---
${text}
---`,
        },
      ],
    });

    return {
      content: [{ type: "text", text: response.message.content }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
MCP #2 — Ukrainian Humanizer (src/uk-humanizer.ts)
typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Ollama } from "ollama";

const ollama = new Ollama({ host: "http://localhost:11434" });

const SYSTEM_PROMPT_UK = `Ти — досвідчений редактор і копірайтер з 20+ роками досвіду в українській журналістиці, публіцистиці та науковому письмі.

Твоє єдине завдання — переписувати AI-генерований текст так, щоб він звучав автентично по-людськи, природною українською мовою.

ОСНОВНІ ПРАВИЛА:
1. ВАРІЮЙ довжину речень агресивно — чергуй короткі (3-5 слів) з довшими. ШІ пише рівномірним ритмом, людина — ні.
2. ЛАМАЙ симетрію — ніколи два речення підряд з однаковою структурою.
3. ВИДАЛЯЙ ці AI-кліше повністю: "Варто зазначити", "Важливо відмітити", "У сучасному світі", "Слід підкреслити", "Таким чином", "Підсумовуючи", "Зазначимо, що", "Необхідно відмітити", "Відіграє ключову роль", "На сьогоднішній день".
4. ДОДАВАЙ природні елементи — риторичні питання, вставні слова типу "власне", "мабуть", "звісно", "до речі" — там де доречно.
5. ВИКОРИСТОВУЙ розмовні звороти де доречно — це, до речі, і відрізняє живий текст від машинного.
6. ПОЧИНАЙ речення з "І", "Але", "Бо", "Та" інколи — люди так роблять.
7. ЗБЕРІГАЙ всі оригінальні факти, дані, терміни та зміст на 100%.
8. НІКОЛИ не додавай коментарі типу "Ось переписаний текст:" — виводь одразу сам текст.
9. НЕ ДОДАВАЙ підсумків наприкінці.
10. НЕ ЗМІНЮЙ суттєво загальну структуру чи обсяг — переписуй, а не реструктуруй.

ЦІЛЬОВИЙ СТИЛЬ:
- Думай: розумний журналіст пише для широкої аудиторії
- Тон: впевнений, природний, трохи невимушений але не недбалий
- Ритм: де треба — чіткий і стислий, де треба — плавний`;

const REWRITE_PROMPT_UK = (text: string, mode: string) => {
  const modeInstructions: Record<string, string> = {
    standard: `Перепиши наступний текст так, щоб він звучав як написаний людиною. Застосуй усі основні правила.`,
    casual: `Перепиши наступний текст у розмовному, невимушеному стилі — ніби пояснюєш другу за кавою. Трохи розслабленіший регістр, але грамотно.`,
    professional: `Перепиши наступний текст як написав би досвідчений фахівець — впевнено, по суті, без зайвого. Діловий контекст, але живий, не корпоративно-роботизований.`,
    academic: `Перепиши наступний текст як написав би справжній науковець — компетентно, але не механічно. Збережи терміни та посилання. Додай трохи авторської особистості в виклад.`,
    blog: `Перепиши наступний текст у стилі досвідченого блогера — чіпляючий перший рядок, жива авторська манера, можливо риторичне питання, гарний ритм.`,
    journalistic: `Перепиши наступний текст у стилі якісної української журналістики — факти чіткі, мова жива, речення різноманітні. Як у хорошому матеріалі "Ukrainska Pravda" чи "Zaborona".`,
  };

  return `${modeInstructions[mode] || modeInstructions.standard}

ТЕКСТ ДЛЯ ПЕРЕПИСУВАННЯ:
---
${text}
---

Виводь ТІЛЬКИ переписаний текст. Нічого більше.`;
};

const server = new McpServer({
  name: "uk-humanizer",
  version: "1.0.0",
});

server.tool(
  "humanize_ukrainian",
  "Переписує AI-генерований текст українською так, щоб звучав природно і по-людськи",
  {
    text: z.string().min(10).describe("Текст українською для гуманізації"),
    mode: z
      .enum(["standard", "casual", "professional", "academic", "blog", "journalistic"])
      .default("standard")
      .describe("Стиль переписування"),
    model: z
      .enum(["qwen3:30b", "gemma3:27b", "mistral-small3.1:24b"])
      .default("gemma3:27b")
      .describe("Модель Ollama (для укр. рекомендується gemma3:27b)"),
  },
  async ({ text, mode, model }) => {
    const response = await ollama.chat({
      model,
      options: {
        temperature: 0.75,
        top_p: 0.9,
        repeat_penalty: 1.15,
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT_UK },
        { role: "user", content: REWRITE_PROMPT_UK(text, mode) },
      ],
    });

    return {
      content: [{ type: "text", text: response.message.content }],
    };
  }
);

server.tool(
  "detect_ai_patterns_uk",
  "Аналізує текст і знаходить AI-шаблони без переписування",
  {
    text: z.string().min(10).describe("Текст для аналізу"),
  },
  async ({ text }) => {
    const response = await ollama.chat({
      model: "gemma3:27b",
      options: { temperature: 0.3 },
      messages: [
        {
          role: "system",
          content:
            "Ти — експерт з виявлення AI-генерованого тексту. Аналізуй українські тексти на ознаки машинного генерування.",
        },
        {
          role: "user",
          content: `Проаналізуй цей текст на ознаки AI-генерації. Вкажи:
1. Знайдені AI-кліше (процитуй їх)
2. Проблеми ритміки речень (занадто однорідний?)
3. Структурні індикатори (симетричні списки, шаблонні переходи)
4. Загальна оцінка AI-схожості: 0-100%
5. Топ-3 конкретні поради для гуманізації

ТЕКСТ:
---
${text}
---`,
        },
      ],
    });

    return {
      content: [{ type: "text", text: response.message.content }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
Конфіг для Windsurf / Claude Code
~/.codeium/windsurf/mcp_config.json:

json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["/absolute/path/to/humanizer-mcp/dist/en-humanizer.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["/absolute/path/to/humanizer-mcp/dist/uk-humanizer.js"]
    }
  }
}
Запуск
bash
npm install
npm run build
# потім додаєш конфіг і перезапускаєш Windsurf/Claude Code
Параметри temperature та repeat_penalty
Ці два параметри найважливіші для "гуманізації":

Параметр	Значення	Ефект
temperature	0.75	Достатня варіативність без галюцинацій
top_p	0.9	Обмежує занадто дикі варіанти
repeat_penalty	1.15	Запобігає повторенню фраз — типовій AI-звичці
Для detect_ai_patterns використовую temperature: 0.3 — там потрібна точність, не творчість. Для EN рекомендую qwen3:30b як дефолт, для UK — gemma3:27b через кращу підтримку слов'янських мов.

Prepared using Claude Sonnet 4.6
gemma3:27b - реально найкраща для української буде ?
Чесна відповідь — не обов'язково, і тут є важливі нюанси.

Що реально показують дані
Gemma 3 27B є найкращою серед open-source моделей для багатомовного тексту і лідирує на українських benchmarks — саме тому Мінцифра та Київстар вибрали Gemma як базу для тренування офіційної української LLM. Gemma підтримує 140+ мов проти 100+ у Qwen3.

Але є суттєвий нюанс від реальних користувачів на LocalLLaMA: Gemma 3 12B обходить Qwen3 14B і 30B у рідних (не-англійських/китайських) мовах, що натякає на сильніший multilingual training. Qwen3, своєю чергою, коли входить в режим "thinking", розмірковує тільки англійською або китайською — і це руйнує якість для мов типу української.
​

Реальне порівняння для твоєї задачі
Gemma 3 27B	Qwen3 30B
Українська якість	✅ Відмінно — база офіційної UA LLM	⚠️ Добре, але thinking mode = EN/ZH
Природність тексту	✅ Сильна	✅ Сильна
Стабільність в Ollama	⚠️ QAT версія іноді крашає	✅ Стабільніший
Швидкість	Повільніший	✅ Швидший (особливо MoE)
Ліцензія	Google Gemma (обмеження)	✅ Apache 2.0
Рекомендація для тебе
Для гуманізації українського тексту залишай Gemma 3 27B — дефолтом, але вимикай thinking mode (у Qwen3 він є, у Gemma його немає — це вже добре). У Ollama конфігурі для Gemma використовуй Q5_K_M квантизацію — вона дуже близька до BF16 за якістю:
​

bash
ollama pull gemma3:27b
Якщо Gemma нестабільна або крашає — Qwen3 30B як fallback, але тоді в промпті явно вказуй think: false або системний інструктаж "respond only in Ukrainian, do not use internal reasoning chains". Для English тексту — навпаки, Qwen3 30B буде трохи кращим через сильніший reasoning.
​

Prepared using Claude Sonnet 4.6
