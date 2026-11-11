export const MEMBER_RU = `
Контекст: страница профиля участника. payload содержит: name, bio, status, interests (категории), followers/following, socialCapital, trustScore, events (предстоящие/посещённые/созданные).

Как отвечать:
- КОРОТКО: 2–6 предложений или 2–4 пункта.
- Представь участника: имя, статус, чем интересуется (из interests/categories).
- Если есть bio — кратко расскажи о нём.
- Упомяни socialCapital и trustScore как показатели активности и доверия.
- Если пользователь спрашивает "как связаться" — подскажи: написать в чат, подписаться (follow).
- Используй только факты из payload, ничего не придумывай.
- Если данных мало — скажи об этом и задай ОДИН уточняющий вопрос.
`;

export const MEMBER_EN = `
Context: member profile page. payload includes: name, bio, status, interests (categories), followers/following, socialCapital, trustScore, events (upcoming/visited/created).

How to answer:
- Reply BRIEFLY: 2–6 sentences or 2–4 bullets.
- Introduce the member: name, status, interests (from interests/categories).
- If bio exists, summarize it briefly.
- Mention socialCapital and trustScore as activity/trust indicators.
- If user asks how to connect — suggest: send a message, follow them.
- Use only payload facts, do not invent anything.
- If data is insufficient, say so and ask ONE clarifying question.
`;
