import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getSystemPrompt, type ContextKey } from "$lib/prompts/assistant";
import { ASSISTANT_TOOLS } from "$lib/assistant/tools";
import { executeToolQuery } from "$lib/assistant/executor";
import prisma from "$lib/prisma";

function detectLang(text: string): "ru" | "en" {
  return /[а-яё]/i.test(text) ? "ru" : "en";
}

async function callOpenAI(
  fetchFn: typeof fetch,
  messages: any[],
  opts: { tools?: any[]; model?: string } = {}
) {
  const body: any = {
    model: opts.model ?? "gpt-4.1-mini",
    messages,
    temperature: 0.5,
    max_tokens: 700,
  };

  if (opts.tools?.length) {
    body.tools = opts.tools;
  }

  const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    },
    body: JSON.stringify(body),
  });

  return res.json();
}

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const {
      prompt,
      lang,
      contextKey = "global",
      payload = {},
      history = [],
    } = await request.json();

    if (!prompt) {
      return json({ error: "Missing prompt" }, { status: 400 });
    }

    const finalLang = (lang ?? detectLang(prompt)) as "ru" | "en";
    const ctxKey = contextKey as ContextKey;

    const systemPrompt = getSystemPrompt(finalLang, ctxKey);

    const categories = await prisma.eventCategory.findMany({
      select: { id: true, name: true },
    });

    const platformInfo =
      finalLang === "ru"
        ? `Ты — AI-ассистент платформы CBC (Cyprus Business Club). CBC — это бизнес-нетворкинг платформа на Кипре, которая объединяет предпринимателей, стартапы, инвесторов и профессионалов. Основные разделы: события (events), сообщества (communities), партнёры/бренды (partners), кастодиальный кошелёк (Polygon), система репутации (Social Capital + Trust Score), профили участников. Отвечай на русском языке.`
        : `You are the AI assistant of the CBC (Cyprus Business Club) platform. CBC is a business networking platform based in Cyprus that connects entrepreneurs, startups, investors, and professionals. Key sections: events, communities, partners/brands, custodial wallet (Polygon), reputation system (Social Capital + Trust Score), member profiles. Respond in English.`;

    const linkRules =
      finalLang === "ru"
        ? `Когда упоминаешь мемберов, ивенты, бренды или комьюнити из результатов поиска — ОБЯЗАТЕЛЬНО оформляй кликабельные markdown-ссылки с языковым префиксом. Формат: [Имя](/${finalLang}/путь/id)

Примеры:
- Мембер: [Иван Петров](/${finalLang}/members/clxyz123abc)
- Ивент: [Web3 Summit 2026](/${finalLang}/events/clxyz456def)
- Бренд: [TechCorp](/${finalLang}/partners/clxyz789ghi)
- Комьюнити: [Limassol Entrepreneurs](/${finalLang}/communities/clxyz000jkl)

Никогда не пиши голый id. Всегда /${finalLang}/ + путь + id.`
        : `When mentioning members, events, brands, or communities from search results — ALWAYS format clickable markdown links with language prefix. Format: [Name](/${finalLang}/path/id)

Examples:
- Member: [John Smith](/${finalLang}/members/clxyz123abc)
- Event: [Web3 Summit 2026](/${finalLang}/events/clxyz456def)
- Brand: [TechCorp](/${finalLang}/partners/clxyz789ghi)
- Community: [Limassol Entrepreneurs](/${finalLang}/communities/clxyz000jkl)

Never output a bare id. Always use /${finalLang}/ + path + id.`;

    const searchResultsRule =
      finalLang === "ru"
        ? `Если в контексте есть результаты поиска по базе данных — используй их для ответа. Перечисли релевантные результаты с краткими описаниями и ссылками.`
        : `If the context includes database search results, use them in your answer. List relevant results with brief descriptions and links.`;

    const messages: any[] = [
      { role: "system", content: platformInfo },
      { role: "system", content: systemPrompt },
      { role: "system", content: `${linkRules}\n\n${searchResultsRule}` },
      {
        role: "system",
        content: `Page context (JSON): ${JSON.stringify(payload)}`,
      },
      {
        role: "system",
        content: `Available platform categories (use their IDs when calling search tools with categoryIds): ${JSON.stringify(categories)}`,
      },
      ...history,
      { role: "user", content: prompt },
    ];

    const res1 = await callOpenAI(fetch, messages, {
      tools: ASSISTANT_TOOLS,
    });

    const choice = res1?.choices?.[0];

    if (!choice) {
      console.error("OpenAI error (call 1):", res1);
      return json({ error: "OpenAI error" }, { status: 500 });
    }

    if (choice.finish_reason === "stop") {
      const reply = choice.message?.content?.trim();
      if (!reply) {
        return json({ error: "Empty response" }, { status: 500 });
      }
      return json({ reply, lang: finalLang });
    }

    if (
      choice.finish_reason === "tool_calls" &&
      choice.message?.tool_calls?.length
    ) {
      messages.push(choice.message);

      const suggestions: { field: string; value: string; label: string }[] = [];

      for (const toolCall of choice.message.tool_calls) {
        let toolArgs: Record<string, any> = {};
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          toolArgs = {};
        }

        if (toolCall.function.name === "suggest_form_value") {
          suggestions.push({
            field: toolArgs.field,
            value: toolArgs.value,
            label: toolArgs.label ?? toolArgs.field,
          });
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ ok: true, suggestion_saved: toolArgs.field }),
          });
        } else {
          const results = await executeToolQuery(
            toolCall.function.name,
            toolArgs
          );
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(results),
          });
        }
      }

      const res2 = await callOpenAI(fetch, messages);

      const reply = res2?.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        console.error("OpenAI error (call 2):", res2);
        return json({ error: "OpenAI error" }, { status: 500 });
      }

      return json({
        reply,
        lang: finalLang,
        ...(suggestions.length > 0 && { suggestions }),
      });
    }

    const fallbackReply = choice.message?.content?.trim();
    if (fallbackReply) {
      return json({ reply: fallbackReply, lang: finalLang });
    }

    return json({ error: "Unexpected response" }, { status: 500 });
  } catch (err) {
    console.error("Assistant API error:", err);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
