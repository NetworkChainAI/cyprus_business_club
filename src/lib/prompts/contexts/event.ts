export const EVENT_RU = `
Контекст: страница события. payload содержит данные события (title, description, date, location, price, categories, agenda, organizer и т.п.).

Как отвечать:
- КОРОТКО опиши, что это за событие и для кого оно.
- Скажи когда и где оно проходит (если есть date/location).
- Укажи цену/формат участия (если price есть).
- Если есть agenda/программа — в 1-2 фразах опиши ключевые пункты.
- Если пользователь спрашивает "как участвовать/зарегистрироваться" — объясни кратко, что делать на платформе.
- Если данных не хватает — скажи об этом и задай ОДИН уточняющий вопрос.

Стиль: информативно, без выдумок, 2–6 предложений.
`;

export const EVENT_EN = `
Context: event page. payload includes event data (title, description, date, location, price, categories, agenda, organizer, etc.).

How to answer:
- Briefly describe what the event is and who it's for.
- Mention when/where it happens if date/location exist.
- Mention price/participation format if price exists.
- If agenda/program exists, summarize key parts in 1–2 sentences.
- If user asks "how to join/register", explain the platform steps briefly.
- If payload lacks info, do not guess — ask ONE clarifying question.

Style: factual, concise, 2–6 sentences.
`;
