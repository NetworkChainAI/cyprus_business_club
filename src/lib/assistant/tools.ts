// OpenAI function calling tool definitions for the AI assistant
// These let the model decide when a DB search is needed

export const ASSISTANT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_members",
      description:
        "Search platform members by name, interests, skills, or keywords. Use when the user asks about people on the platform. You can pass a text query AND/OR categoryIds from the available categories list. The query searches names, bios, AND interest names — so approximate keywords work (e.g. 'API' will find members with 'API Development' interest). Use requireAllCategories=true when the user wants members matching ALL listed categories (AND logic). Use excludeCategoryIds or excludeQuery to filter out unwanted interests.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Text to search by — matches member names, bios, and interest/category names. Use short keywords for best results.",
          },
          categoryIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Category IDs from the available platform categories list. Use when you can match the user's query to specific categories.",
          },
          requireAllCategories: {
            type: "boolean",
            description:
              "If true, members must have ALL of the provided categoryIds (AND logic). If false or omitted, members need at least one (OR logic). Use true when the user says 'and' between interests, e.g. 'blockchain AND AI'.",
          },
          excludeCategoryIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Category IDs to exclude. Members with ANY of these interests will be filtered out. Use when the user says 'not', 'except', 'but not', e.g. 'blockchain but not crypto'.",
          },
          excludeQuery: {
            type: "string",
            description:
              "Text keyword to exclude — members whose name, bio, or interests contain this text will be filtered out.",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_events",
      description:
        "Search platform events by topic, category, date, or keywords. Use when the user asks about events or meetups. The query searches titles, descriptions, AND category names.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Text to search by — matches event titles, descriptions, and category names.",
          },
          categoryIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Category IDs from the available platform categories list.",
          },
          upcoming: {
            type: "boolean",
            description: "Only return future events",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_brands",
      description:
        "Search partner brands/companies by name, category, or keywords. Use when the user asks about companies or partners. The query searches brand names AND category names.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Text to search by — matches brand names and category names.",
          },
          categoryIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Category IDs from the available platform categories list.",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_communities",
      description:
        "Search platform communities by name. Use when the user asks about communities or groups.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Community name or keyword",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "suggest_form_value",
      description:
        "Suggest a value for a form field (brand creation or event creation). ALWAYS use this tool when the user asks ANY question that could result in form field values — don't just explain, provide concrete Apply-able suggestions. Call once per suggested item. The suggestion appears as a green card with an Apply button that inserts the value into the form.",
      parameters: {
        type: "object",
        properties: {
          field: {
            type: "string",
            enum: [
              "description",
              "products",
              "geo",
              "interests",
              "pains",
              "solutions",
              "clients",
              "monetization",
              "event_title",
              "event_description",
              "agenda_item",
            ],
            description: "The form field to suggest a value for. Brand fields: description, products, geo, interests, pains, solutions, clients, monetization. Event fields: event_title, event_description, agenda_item.",
          },
          value: {
            type: "string",
            description:
              "The suggested value — concrete text ready to insert into the form. For array fields, suggest ONE item per call.",
          },
          label: {
            type: "string",
            description:
              "Short human-readable label for the suggestion card (e.g. 'Brand description', 'Pain point')",
          },
        },
        required: ["field", "value", "label"],
      },
    },
  },
];
