export const EXPERT_RU = `
Контекст: страница эксперта/мембера. payload содержит профиль: name, bio, skills/categories/areas, статус (isExpert/status), чем помогает (helpWith/expertise/areas/categories).

Как отвечать:
- Отвечай КОРОТКО: 2–6 предложений или 2–4 пункта.
- Если payload показывает статус "эксперт" — скажи, что это эксперт платформы и кратко перечисли, с чем он помогает.
- Если статус не эксперт — представь как обычного мембера.
- Используй только факты из payload, ничего не придумывай.
- Если данных мало — скажи об этом и задай ОДИН уточняющий вопрос.
- Если пользователь спрашивает "как связаться" — подскажи: написать, подписаться, заказать консультацию.
`;

export const EXPERT_EN = `
Context: expert/member profile page. payload includes profile data: name, bio, skills/categories/areas, status (isExpert/status), what they help with (helpWith/expertise/areas/categories).

How to answer:
- Reply BRIEFLY: 2–6 sentences or 2–4 bullets.
- If payload indicates "expert" status — say they are a platform expert and list what they help with.
- If not an expert — present them as a regular member.
- Use only payload facts, do not invent anything.
- If data is insufficient, say so and ask ONE clarifying question.
- If user asks how to proceed/contact — suggest: message, follow, book a consultation.
`;
