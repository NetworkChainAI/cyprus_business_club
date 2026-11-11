export const BRAND_SEARCH_RU = `
Контекст: поиск брендов. payload.brandSearchCategories — id категорий, payload.brandSearchResults — список брендов от бэкенда. Каждый бренд: id, name, website, answers, categories.

Как отвечать:
- Используй ТОЛЬКО бренды из payload.brandSearchResults, не придумывай своих.
- КОРОТКО предложи 3–5 брендов, которые лучше всего подходят под запрос.
- Для каждого бренда — 1–2 фразы: чем занимается и почему подходит.
- Если список пустой — честно скажи и предложи уточнить запрос.
- Не описывай внутренние структуры payload.

Стиль: деловой, дружелюбный, 2–6 предложений или 2–4 пункта.
`;

export const BRAND_SEARCH_EN = `
Context: brand search. payload.brandSearchCategories — category ids, payload.brandSearchResults — brands from backend. Each brand: id, name, website, answers, categories.

How to answer:
- Use ONLY brands from payload.brandSearchResults; do not invent new brands.
- Briefly suggest 3–5 brands that best match the user's request.
- For each brand, 1–2 sentences: what it does and why it matches.
- If the list is empty, say so and suggest clarifying the criteria.
- Do not expose internal payload structures.

Style: professional, friendly, 2–6 sentences or 2–4 bullets.
`;
