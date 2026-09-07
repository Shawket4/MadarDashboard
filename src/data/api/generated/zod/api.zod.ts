/* eslint-disable */
// @ts-nocheck
import * as zod from 'zod';


export const ListAddonItemsQueryParams = zod.object({
  "org_id": zod.uuid(),
  "addon_type": zod.string().optional(),
  "branch_id": zod.uuid().optional().describe('When set, prices are branch-effective (override replaces default_price) and\naddons disabled at this branch are excluded — the per-branch addon list the\nPOS consumes. Omitted → the plain org list (legacy behaviour).')
})

export const ListAddonItemsResponseItem = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_price": zod.number(),
  "id": zod.uuid(),
  "ingredients": zod.array(zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number()
})).optional(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "primary_ingredient_id": zod.uuid().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListAddonItemsResponse = zod.array(ListAddonItemsResponseItem)


export const CreateAddonItemBody = zod.object({
  "addon_type": zod.string(),
  "default_price": zod.number(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}).nullish(),
  "org_id": zod.uuid()
})

export const CreateAddonItemResponse = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_price": zod.number(),
  "id": zod.uuid(),
  "ingredients": zod.array(zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number()
})).optional(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "primary_ingredient_id": zod.uuid().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const ListAddonCatalogQueryParams = zod.object({
  "org_id": zod.uuid(),
  "addon_type": zod.string().optional(),
  "search": zod.string().optional().describe('Case-insensitive filter on the addon name.'),
  "page": zod.number().optional(),
  "per_page": zod.number().optional(),
  "branch_id": zod.uuid().optional().describe('Enables the per-branch override filter\/sort (LEFT JOINs the branch\'s overrides).'),
  "overridden": zod.boolean().optional().describe('With `branch_id`: true → only addons overridden at the branch; false → only\nun-overridden; null → all.'),
  "sort": zod.string().optional().describe('`\"overridden\"` → overridden addons first (needs `branch_id`); otherwise by type\/name.')
})

export const ListAddonCatalogResponse = zod.object({
  "data": zod.array(zod.object({
  "addon_type": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_price": zod.number(),
  "id": zod.uuid(),
  "ingredients": zod.array(zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number()
})).optional(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "primary_ingredient_id": zod.uuid().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})),
  "page": zod.number(),
  "per_page": zod.number(),
  "total": zod.number(),
  "total_pages": zod.number()
})


export const DeleteAddonItemParams = zod.object({
  "id": zod.uuid().describe('Addon item ID')
})

export const DeleteAddonItemResponse = zod.void()


export const UpdateAddonItemParams = zod.object({
  "id": zod.uuid().describe('Addon item ID')
})

export const UpdateAddonItemBody = zod.object({
  "addon_type": zod.string().nullish(),
  "default_price": zod.number().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.looseObject({

}).nullish()
})

export const UpdateAddonItemResponse = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_price": zod.number(),
  "id": zod.uuid(),
  "ingredients": zod.array(zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number()
})).optional(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "primary_ingredient_id": zod.uuid().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const chatBodyHistoryItemSpecTwoLimitMin = 0;

export const chatBodyHistoryItemSpecTwoTransformTopPerTwoNMin = 0;



export const ChatBody = zod.object({
  "conversation_id": zod.uuid().nullish().describe('Continue a stored conversation. When set, history is loaded from the\nserver and `history` below is ignored — this is the path that gives\nresumable chats and unlimited, compacted context.\n\nOmit it to start a new conversation; the response says which one was\ncreated.'),
  "history": zod.array(zod.object({
  "answer": zod.string().nullish().describe('What the assistant replied. Optional so a client can send a partial log.'),
  "question": zod.string(),
  "spec": zod.union([zod.null(),zod.object({
  "branch": zod.string().nullish().describe('Narrow to ONE branch by name. Fuzzy-matched \*within\* the caller\'s\naccessible branches, so it can only ever narrow, never widen. Dashboards\nuse the request-level scope instead and leave this unset.'),
  "compare": zod.enum(['none', 'previous_period', 'previous_year']).optional().describe('Period-over-period comparison.'),
  "dataset": zod.string().describe('Dataset id — fixes the grain. See `GET \/metrics\/schema`.'),
  "dimensions": zod.array(zod.string()).optional().describe('GROUP BY axes, outermost first. Empty = a single total row.'),
  "filters": zod.record(zod.string(), zod.string()).optional().describe('Filter id → chosen value. Each value selects a pre-written predicate.'),
  "having_min": zod.number().nullish().describe('Only keep groups whose sort measure reaches this value.'),
  "limit": zod.number().min(chatBodyHistoryItemSpecTwoLimitMin).nullish().describe('Row cap, clamped to [`MAX_LIMIT`].'),
  "measures": zod.array(zod.string()).optional().describe('Aggregates to compute. Empty = the dataset\'s headline measures.'),
  "period": zod.object({
  "from": zod.string().nullish().describe('Explicit inclusive lower bound.'),
  "preset": zod.union([zod.null(),zod.enum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'last_7_days', 'last_30_days', 'last_90_days', 'last_12_months', 'all_time']).describe('A named relative window. Takes precedence over `from`\/`to`.')]).optional(),
  "to": zod.string().nullish().describe('Explicit inclusive upper bound.')
}).optional().describe('The reporting window.\n\nPrefer a [`PeriodPreset`]: it is resolved server-side against the merchant\'s\ntimezone at query time, which means a dashboard widget saying \"last 30 days\"\nstays correct forever, and a language model never has to do calendar\narithmetic — historically the single largest source of wrong answers.'),
  "sort": zod.union([zod.null(),zod.object({
  "dir": zod.enum(['asc', 'desc']).optional().describe('Sort direction. `Asc` is what unlocks \"worst\", \"slowest\", \"least\" questions.'),
  "measure": zod.string().describe('A measure id from `measures`.')
}).describe('Which measure orders the result, and in which direction.')]).optional(),
  "transform": zod.object({
  "cumulative": zod.boolean().optional().describe('Add a running total in time order. Needs a time dimension.'),
  "share": zod.boolean().optional().describe('Add each row\'s percentage of the grand total.'),
  "top_per": zod.union([zod.null(),zod.object({
  "dimension": zod.string().describe('Which of the chosen dimensions to rank within.'),
  "n": zod.number().min(chatBodyHistoryItemSpecTwoTransformTopPerTwoNMin).optional().describe('How many rows to keep per group.')
}).describe('Keep only the top N rows \*within\* each value of a dimension — \"the best\nseller in every branch\".')]).optional()
}).optional().describe('Post-aggregation shaping.'),
  "viz": zod.union([zod.null(),zod.enum(['auto', 'kpi', 'line', 'area', 'bar', 'row', 'pie', 'donut', 'table', 'heatmap']).describe('Preferred visualization. Omitted or [`Viz::Auto`] lets the backend pick\nfrom the result shape.')]).optional()
}).describe('The query that produced that answer, from `results[].spec`. Optional so\nan older client, or a turn that ran no query, still works.')]).optional()
}).describe('One earlier exchange, in compact form.\n\nResult \*tables\* are never replayed — they are large, and the model does not\nneed last week\'s rows to answer this week\'s question. What it does need is\nthe \*\*query\*\* that answered before, which is why `spec` is here: a follow-up\nlike \"and last month?\" or \"same thing for Marina\" is that spec with one\nfield changed. Prose alone forces the model to re-derive the whole query\nfrom its own summary, which is exactly where a follow-up silently drifts\ninto answering a different question.\n\nClients get the spec back on every result block (`results[].spec`) and\nshould echo it here.')).nullish().describe('Recent prior turns, oldest first. The stateless fallback, kept for\nclients that manage their own window and for one-off questions. Ignored\nwhen `conversation_id` is set. The server caps it regardless.'),
  "locale": zod.string().nullish().describe('Answer language — \"en\" or \"ar\" (default \"en\"). Drives translated labels\nand the reply language.'),
  "question": zod.string().describe('The merchant\'s plain-language question, e.g. \"top 5 products last month\"\nor \"أعلى ٥ منتجات الشهر الماضي\".')
})

export const chatResponseOneOneResultsItemRowCountMin = 0;

export const chatResponseOneOneResultsItemSpecLimitMin = 0;

export const chatResponseOneOneResultsItemSpecTransformTopPerTwoNMin = 0;

export const chatResponseOneThreeResultsItemRowCountMin = 0;

export const chatResponseOneThreeResultsItemSpecLimitMin = 0;

export const chatResponseOneThreeResultsItemSpecTransformTopPerTwoNMin = 0;



export const ChatResponse = zod.union([zod.object({
  "kind": zod.enum(['answer']),
  "results": zod.array(zod.object({
  "columns": zod.array(zod.object({
  "key": zod.string().describe('SQL alias \/ JSON key.'),
  "kind": zod.enum(['money', 'count', 'label', 'date', 'number', 'minutes']).describe('The renderable kind of an output column, so a client can format it and pick\na sensible chart without knowing anything about the underlying SQL.'),
  "label": zod.string().describe('Human label for a header or legend.')
}).describe('One output column: the SQL alias (also the JSON key on every row) plus how\nto render it.')),
  "facet_by": zod.string().nullish(),
  "grain": zod.enum(['scalar', 'series', 'categorical', 'table']).describe('The \*shape\* of a result set, derived from the dimensions a query groups by.\nThis is what lets a dashboard render any metric with no per-metric code: a\nscalar becomes a KPI card, a series becomes a line, a breakdown becomes a\nbar or pie.'),
  "period_from": zod.string().nullish(),
  "period_to": zod.string().nullish(),
  "preset_id": zod.string().nullish(),
  "row_count": zod.number().min(chatResponseOneOneResultsItemRowCountMin),
  "rows": zod.array(zod.record(zod.string(), zod.unknown())),
  "scope": zod.object({
  "all_branches": zod.boolean().describe('True when the answer spans every branch the caller can access.'),
  "branches": zod.array(zod.string()),
  "label": zod.string().describe('Human-readable label, e.g. \"All branches (3)\" or \"Sidi Henish\".'),
  "unmatched_branch": zod.string().nullish().describe('Set when a branch was named but could not be matched. The answer then\nfalls back to the full accessible set, and this flags the mismatch rather\nthan silently answering a different question.')
}).describe('Which branches this block covers.'),
  "spec": zod.object({
  "branch": zod.string().nullish().describe('Narrow to ONE branch by name. Fuzzy-matched \*within\* the caller\'s\naccessible branches, so it can only ever narrow, never widen. Dashboards\nuse the request-level scope instead and leave this unset.'),
  "compare": zod.enum(['none', 'previous_period', 'previous_year']).optional().describe('Period-over-period comparison.'),
  "dataset": zod.string().describe('Dataset id — fixes the grain. See `GET \/metrics\/schema`.'),
  "dimensions": zod.array(zod.string()).optional().describe('GROUP BY axes, outermost first. Empty = a single total row.'),
  "filters": zod.record(zod.string(), zod.string()).optional().describe('Filter id → chosen value. Each value selects a pre-written predicate.'),
  "having_min": zod.number().nullish().describe('Only keep groups whose sort measure reaches this value.'),
  "limit": zod.number().min(chatResponseOneOneResultsItemSpecLimitMin).nullish().describe('Row cap, clamped to [`MAX_LIMIT`].'),
  "measures": zod.array(zod.string()).optional().describe('Aggregates to compute. Empty = the dataset\'s headline measures.'),
  "period": zod.object({
  "from": zod.string().nullish().describe('Explicit inclusive lower bound.'),
  "preset": zod.union([zod.null(),zod.enum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'last_7_days', 'last_30_days', 'last_90_days', 'last_12_months', 'all_time']).describe('A named relative window. Takes precedence over `from`\/`to`.')]).optional(),
  "to": zod.string().nullish().describe('Explicit inclusive upper bound.')
}).optional().describe('The reporting window.\n\nPrefer a [`PeriodPreset`]: it is resolved server-side against the merchant\'s\ntimezone at query time, which means a dashboard widget saying \"last 30 days\"\nstays correct forever, and a language model never has to do calendar\narithmetic — historically the single largest source of wrong answers.'),
  "sort": zod.union([zod.null(),zod.object({
  "dir": zod.enum(['asc', 'desc']).optional().describe('Sort direction. `Asc` is what unlocks \"worst\", \"slowest\", \"least\" questions.'),
  "measure": zod.string().describe('A measure id from `measures`.')
}).describe('Which measure orders the result, and in which direction.')]).optional(),
  "transform": zod.object({
  "cumulative": zod.boolean().optional().describe('Add a running total in time order. Needs a time dimension.'),
  "share": zod.boolean().optional().describe('Add each row\'s percentage of the grand total.'),
  "top_per": zod.union([zod.null(),zod.object({
  "dimension": zod.string().describe('Which of the chosen dimensions to rank within.'),
  "n": zod.number().min(chatResponseOneOneResultsItemSpecTransformTopPerTwoNMin).optional().describe('How many rows to keep per group.')
}).describe('Keep only the top N rows \*within\* each value of a dimension — \"the best\nseller in every branch\".')]).optional()
}).optional().describe('Post-aggregation shaping.'),
  "viz": zod.union([zod.null(),zod.enum(['auto', 'kpi', 'line', 'area', 'bar', 'row', 'pie', 'donut', 'table', 'heatmap']).describe('Preferred visualization. Omitted or [`Viz::Auto`] lets the backend pick\nfrom the result shape.')]).optional()
}).describe('The exact query that produced this. Sending it back is what makes\n\"pin this answer to my dashboard\" a single client-side action: the spec\nis already a valid widget definition.'),
  "title": zod.string().nullish().describe('Set when the data came from a curated metric.'),
  "truncated": zod.boolean(),
  "viz": zod.enum(['auto', 'kpi', 'line', 'area', 'bar', 'row', 'pie', 'donut', 'table', 'heatmap']).describe('How a result is best visualized. A hint: the client may always override, and\n[`Viz::Auto`] asks the backend to choose from the [`Grain`].')
}).describe('One dataset the assistant pulled while answering. A turn may carry several —\n\"compare this month to last\" is two.')),
  "text": zod.string()
}).describe('A finding, with the data behind it.'),zod.object({
  "kind": zod.enum(['clarify']),
  "question": zod.string()
}).describe('One question back before the assistant can proceed.'),zod.object({
  "kind": zod.enum(['incomplete']),
  "results": zod.array(zod.object({
  "columns": zod.array(zod.object({
  "key": zod.string().describe('SQL alias \/ JSON key.'),
  "kind": zod.enum(['money', 'count', 'label', 'date', 'number', 'minutes']).describe('The renderable kind of an output column, so a client can format it and pick\na sensible chart without knowing anything about the underlying SQL.'),
  "label": zod.string().describe('Human label for a header or legend.')
}).describe('One output column: the SQL alias (also the JSON key on every row) plus how\nto render it.')),
  "facet_by": zod.string().nullish(),
  "grain": zod.enum(['scalar', 'series', 'categorical', 'table']).describe('The \*shape\* of a result set, derived from the dimensions a query groups by.\nThis is what lets a dashboard render any metric with no per-metric code: a\nscalar becomes a KPI card, a series becomes a line, a breakdown becomes a\nbar or pie.'),
  "period_from": zod.string().nullish(),
  "period_to": zod.string().nullish(),
  "preset_id": zod.string().nullish(),
  "row_count": zod.number().min(chatResponseOneThreeResultsItemRowCountMin),
  "rows": zod.array(zod.record(zod.string(), zod.unknown())),
  "scope": zod.object({
  "all_branches": zod.boolean().describe('True when the answer spans every branch the caller can access.'),
  "branches": zod.array(zod.string()),
  "label": zod.string().describe('Human-readable label, e.g. \"All branches (3)\" or \"Sidi Henish\".'),
  "unmatched_branch": zod.string().nullish().describe('Set when a branch was named but could not be matched. The answer then\nfalls back to the full accessible set, and this flags the mismatch rather\nthan silently answering a different question.')
}).describe('Which branches this block covers.'),
  "spec": zod.object({
  "branch": zod.string().nullish().describe('Narrow to ONE branch by name. Fuzzy-matched \*within\* the caller\'s\naccessible branches, so it can only ever narrow, never widen. Dashboards\nuse the request-level scope instead and leave this unset.'),
  "compare": zod.enum(['none', 'previous_period', 'previous_year']).optional().describe('Period-over-period comparison.'),
  "dataset": zod.string().describe('Dataset id — fixes the grain. See `GET \/metrics\/schema`.'),
  "dimensions": zod.array(zod.string()).optional().describe('GROUP BY axes, outermost first. Empty = a single total row.'),
  "filters": zod.record(zod.string(), zod.string()).optional().describe('Filter id → chosen value. Each value selects a pre-written predicate.'),
  "having_min": zod.number().nullish().describe('Only keep groups whose sort measure reaches this value.'),
  "limit": zod.number().min(chatResponseOneThreeResultsItemSpecLimitMin).nullish().describe('Row cap, clamped to [`MAX_LIMIT`].'),
  "measures": zod.array(zod.string()).optional().describe('Aggregates to compute. Empty = the dataset\'s headline measures.'),
  "period": zod.object({
  "from": zod.string().nullish().describe('Explicit inclusive lower bound.'),
  "preset": zod.union([zod.null(),zod.enum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'last_7_days', 'last_30_days', 'last_90_days', 'last_12_months', 'all_time']).describe('A named relative window. Takes precedence over `from`\/`to`.')]).optional(),
  "to": zod.string().nullish().describe('Explicit inclusive upper bound.')
}).optional().describe('The reporting window.\n\nPrefer a [`PeriodPreset`]: it is resolved server-side against the merchant\'s\ntimezone at query time, which means a dashboard widget saying \"last 30 days\"\nstays correct forever, and a language model never has to do calendar\narithmetic — historically the single largest source of wrong answers.'),
  "sort": zod.union([zod.null(),zod.object({
  "dir": zod.enum(['asc', 'desc']).optional().describe('Sort direction. `Asc` is what unlocks \"worst\", \"slowest\", \"least\" questions.'),
  "measure": zod.string().describe('A measure id from `measures`.')
}).describe('Which measure orders the result, and in which direction.')]).optional(),
  "transform": zod.object({
  "cumulative": zod.boolean().optional().describe('Add a running total in time order. Needs a time dimension.'),
  "share": zod.boolean().optional().describe('Add each row\'s percentage of the grand total.'),
  "top_per": zod.union([zod.null(),zod.object({
  "dimension": zod.string().describe('Which of the chosen dimensions to rank within.'),
  "n": zod.number().min(chatResponseOneThreeResultsItemSpecTransformTopPerTwoNMin).optional().describe('How many rows to keep per group.')
}).describe('Keep only the top N rows \*within\* each value of a dimension — \"the best\nseller in every branch\".')]).optional()
}).optional().describe('Post-aggregation shaping.'),
  "viz": zod.union([zod.null(),zod.enum(['auto', 'kpi', 'line', 'area', 'bar', 'row', 'pie', 'donut', 'table', 'heatmap']).describe('Preferred visualization. Omitted or [`Viz::Auto`] lets the backend pick\nfrom the result shape.')]).optional()
}).describe('The exact query that produced this. Sending it back is what makes\n\"pin this answer to my dashboard\" a single client-side action: the spec\nis already a valid widget definition.'),
  "title": zod.string().nullish().describe('Set when the data came from a curated metric.'),
  "truncated": zod.boolean(),
  "viz": zod.enum(['auto', 'kpi', 'line', 'area', 'bar', 'row', 'pie', 'donut', 'table', 'heatmap']).describe('How a result is best visualized. A hint: the client may always override, and\n[`Viz::Auto`] asks the backend to choose from the [`Grain`].')
}).describe('One dataset the assistant pulled while answering. A turn may carry several —\n\"compare this month to last\" is two.')),
  "text": zod.string()
}).describe('It could not get to an answer. Any data it did gather is still returned.')]).describe('How the turn ended. Every variant is a 200.').and(zod.object({
  "conversation_id": zod.uuid().nullish().describe('The conversation this turn belongs to. Present whenever the turn was\nstored — send it back on the next message to continue.'),
  "provider": zod.string().describe('Which model answered.'),
  "timezone": zod.string().describe('The timezone every date in the answer is expressed in.')
}))


export const chatStreamBodyHistoryItemSpecTwoLimitMin = 0;

export const chatStreamBodyHistoryItemSpecTwoTransformTopPerTwoNMin = 0;



export const ChatStreamBody = zod.object({
  "conversation_id": zod.uuid().nullish().describe('Continue a stored conversation. When set, history is loaded from the\nserver and `history` below is ignored — this is the path that gives\nresumable chats and unlimited, compacted context.\n\nOmit it to start a new conversation; the response says which one was\ncreated.'),
  "history": zod.array(zod.object({
  "answer": zod.string().nullish().describe('What the assistant replied. Optional so a client can send a partial log.'),
  "question": zod.string(),
  "spec": zod.union([zod.null(),zod.object({
  "branch": zod.string().nullish().describe('Narrow to ONE branch by name. Fuzzy-matched \*within\* the caller\'s\naccessible branches, so it can only ever narrow, never widen. Dashboards\nuse the request-level scope instead and leave this unset.'),
  "compare": zod.enum(['none', 'previous_period', 'previous_year']).optional().describe('Period-over-period comparison.'),
  "dataset": zod.string().describe('Dataset id — fixes the grain. See `GET \/metrics\/schema`.'),
  "dimensions": zod.array(zod.string()).optional().describe('GROUP BY axes, outermost first. Empty = a single total row.'),
  "filters": zod.record(zod.string(), zod.string()).optional().describe('Filter id → chosen value. Each value selects a pre-written predicate.'),
  "having_min": zod.number().nullish().describe('Only keep groups whose sort measure reaches this value.'),
  "limit": zod.number().min(chatStreamBodyHistoryItemSpecTwoLimitMin).nullish().describe('Row cap, clamped to [`MAX_LIMIT`].'),
  "measures": zod.array(zod.string()).optional().describe('Aggregates to compute. Empty = the dataset\'s headline measures.'),
  "period": zod.object({
  "from": zod.string().nullish().describe('Explicit inclusive lower bound.'),
  "preset": zod.union([zod.null(),zod.enum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'last_7_days', 'last_30_days', 'last_90_days', 'last_12_months', 'all_time']).describe('A named relative window. Takes precedence over `from`\/`to`.')]).optional(),
  "to": zod.string().nullish().describe('Explicit inclusive upper bound.')
}).optional().describe('The reporting window.\n\nPrefer a [`PeriodPreset`]: it is resolved server-side against the merchant\'s\ntimezone at query time, which means a dashboard widget saying \"last 30 days\"\nstays correct forever, and a language model never has to do calendar\narithmetic — historically the single largest source of wrong answers.'),
  "sort": zod.union([zod.null(),zod.object({
  "dir": zod.enum(['asc', 'desc']).optional().describe('Sort direction. `Asc` is what unlocks \"worst\", \"slowest\", \"least\" questions.'),
  "measure": zod.string().describe('A measure id from `measures`.')
}).describe('Which measure orders the result, and in which direction.')]).optional(),
  "transform": zod.object({
  "cumulative": zod.boolean().optional().describe('Add a running total in time order. Needs a time dimension.'),
  "share": zod.boolean().optional().describe('Add each row\'s percentage of the grand total.'),
  "top_per": zod.union([zod.null(),zod.object({
  "dimension": zod.string().describe('Which of the chosen dimensions to rank within.'),
  "n": zod.number().min(chatStreamBodyHistoryItemSpecTwoTransformTopPerTwoNMin).optional().describe('How many rows to keep per group.')
}).describe('Keep only the top N rows \*within\* each value of a dimension — \"the best\nseller in every branch\".')]).optional()
}).optional().describe('Post-aggregation shaping.'),
  "viz": zod.union([zod.null(),zod.enum(['auto', 'kpi', 'line', 'area', 'bar', 'row', 'pie', 'donut', 'table', 'heatmap']).describe('Preferred visualization. Omitted or [`Viz::Auto`] lets the backend pick\nfrom the result shape.')]).optional()
}).describe('The query that produced that answer, from `results[].spec`. Optional so\nan older client, or a turn that ran no query, still works.')]).optional()
}).describe('One earlier exchange, in compact form.\n\nResult \*tables\* are never replayed — they are large, and the model does not\nneed last week\'s rows to answer this week\'s question. What it does need is\nthe \*\*query\*\* that answered before, which is why `spec` is here: a follow-up\nlike \"and last month?\" or \"same thing for Marina\" is that spec with one\nfield changed. Prose alone forces the model to re-derive the whole query\nfrom its own summary, which is exactly where a follow-up silently drifts\ninto answering a different question.\n\nClients get the spec back on every result block (`results[].spec`) and\nshould echo it here.')).nullish().describe('Recent prior turns, oldest first. The stateless fallback, kept for\nclients that manage their own window and for one-off questions. Ignored\nwhen `conversation_id` is set. The server caps it regardless.'),
  "locale": zod.string().nullish().describe('Answer language — \"en\" or \"ar\" (default \"en\"). Drives translated labels\nand the reply language.'),
  "question": zod.string().describe('The merchant\'s plain-language question, e.g. \"top 5 products last month\"\nor \"أعلى ٥ منتجات الشهر الماضي\".')
})

export const ChatStreamResponse = zod.unknown()


export const ListConversationsQueryParams = zod.object({
  "limit": zod.number().nullish().describe('Page size (default 30, max 100).'),
  "offset": zod.number().nullish()
})

export const ListConversationsResponse = zod.object({
  "conversations": zod.array(zod.object({
  "compacted": zod.boolean().describe('True once older turns have been folded into a summary — surfaced so a\nclient can say \"earlier messages condensed\" rather than appearing to\nhave lost them.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "last_turn_at": zod.iso.datetime({"offset":true}).nullish(),
  "title": zod.string(),
  "turn_count": zod.number()
}).describe('A conversation without its turns, for the list view.'))
})


export const GetConversationParams = zod.object({
  "id": zod.uuid().describe('Conversation id')
})

export const GetConversationQueryParams = zod.object({
  "limit": zod.number().nullish().describe('How many of the most recent turns to return (default 50, max 200).')
})

export const GetConversationResponse = zod.object({
  "compacted": zod.boolean().describe('True once older turns have been folded into a summary — surfaced so a\nclient can say \"earlier messages condensed\" rather than appearing to\nhave lost them.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "last_turn_at": zod.iso.datetime({"offset":true}).nullish(),
  "title": zod.string(),
  "turn_count": zod.number()
}).describe('A conversation without its turns, for the list view.').and(zod.object({
  "condensed": zod.string().nullish().describe('The running summary of everything before the verbatim window. Returned\nso the UI can show what was condensed instead of a silent gap.'),
  "turns": zod.array(zod.object({
  "answer": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "kind": zod.string().describe('`answer` | `clarify` | `incomplete`.'),
  "provider": zod.string().nullish(),
  "question": zod.string(),
  "seq": zod.number(),
  "specs": zod.unknown().describe('The queries that produced the answer — `[{title, preset_id, spec}]`.\nRe-running these is how a reopened conversation shows CURRENT figures\nrather than the numbers that were true when it was first asked.')
}).describe('One stored exchange.'))
})).describe('A conversation with its turns.')


export const DeleteConversationParams = zod.object({
  "id": zod.uuid().describe('Conversation id')
})

export const DeleteConversationResponse = zod.void()


export const RenameConversationParams = zod.object({
  "id": zod.uuid().describe('Conversation id')
})

export const RenameConversationBody = zod.object({
  "title": zod.string()
})

export const RenameConversationResponse = zod.void()


export const loginBodyPinMin = 4;
export const loginBodyPinMax = 6;


export const loginBodyPinRegExp = new RegExp('^[0-9]{4,6}$');


export const LoginBody = zod.object({
  "branch_id": zod.uuid().nullish().describe('Required for PIN login. The org is derived from this branch server-side.'),
  "email": zod.email().nullish(),
  "name": zod.string().nullish().describe('Teller\'s display name (required for PIN login, unused otherwise).'),
  "org_id": zod.uuid().nullish(),
  "password": zod.string().nullish(),
  "pin": zod.string().min(loginBodyPinMin).max(loginBodyPinMax).regex(loginBodyPinRegExp).nullish()
}).describe('Login is dual-mode:\n\n- \*\*Email + password\*\* (admins, managers, super-admins): supply\n  `email` and `password`. `org_id` is optional — if provided, the\n  user must belong to that org; if omitted, lookup is by email only.\n- \*\*PIN + name\*\* (tellers): supply `name`, `pin`, and \*\*`branch_id`\*\*\n  (required). The teller must be assigned to that branch. `org_id` is\n  derived server-side from the branch — never trusted from the client.')

export const LoginResponse = zod.object({
  "currency_code": zod.string(),
  "tax_rate": zod.number().describe('Org tax rate as a decimal (e.g. 0.14 = 14% VAT); 0.0 when no org. Mirrors\n\/auth\/me so the POS has it immediately after login.'),
  "token": zod.string().describe('JWT to send as `Authorization: Bearer <token>` on subsequent requests.'),
  "user": zod.object({
  "branch_id": zod.uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller', 'waiter', 'kitchen'])
})
})


export const MeResponse = zod.object({
  "currency_code": zod.string().describe('Org currency code (e.g. \"EGP\").'),
  "tax_rate": zod.number().describe('Org tax rate as a decimal (e.g. 0.14 = 14% VAT); 0.0 when the user has no\norg. Exposed so the POS can compute a tax-inclusive cart total client-side.'),
  "user": zod.object({
  "branch_id": zod.uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller', 'waiter', 'kitchen'])
})
})


export const GetMyPermissionsResponse = zod.object({
  "permissions": zod.array(zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "resource": zod.string()
}))
})


export const ResolveBranchBody = zod.object({
  "latitude": zod.number().describe('Device GPS latitude (WGS-84).'),
  "longitude": zod.number().describe('Device GPS longitude (WGS-84).'),
  "org_id": zod.uuid().describe('Organization to search within.')
})

export const ResolveBranchResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "distance_meters": zod.number().describe('Straight-line distance from the supplied coordinates to the branch, in metres.')
})


export const ListBookingsQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "date": zod.string().optional().describe('Service date (`YYYY-MM-DD`, branch-local, 05:00→05:00). Defaults to today.'),
  "from": zod.iso.datetime({"offset":true}).optional().describe('Explicit window (overrides `date`).'),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "active": zod.boolean().optional().describe('Only `confirmed` \/ `seated`.'),
  "status": zod.string().optional()
})

export const ListBookingsResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cancelled_by": zod.string().nullish(),
  "completed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "guest_phone": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('The floor shows the claimed tables as held from here (branch\n`hold_minutes` before the start). Clients compare with their clock.'),
  "id": zod.uuid(),
  "locale": zod.string(),
  "needs_table": zod.boolean().describe('Active but holding no table: the host must assign one.'),
  "no_show_at": zod.iso.datetime({"offset":true}).nullish(),
  "notes": zod.string().nullish(),
  "open_ticket_id": zod.uuid().nullish(),
  "party_size": zod.number(),
  "phone_verified": zod.boolean(),
  "reminder_sent_at": zod.iso.datetime({"offset":true}).nullish(),
  "seated_at": zod.iso.datetime({"offset":true}).nullish(),
  "section_id": zod.uuid().nullish(),
  "source": zod.string().describe('`public` | `host`.'),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated` | `completed` | `no_show` | `cancelled`.'),
  "table_ids": zod.array(zod.uuid()),
  "table_labels": zod.array(zod.string()),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListBookingsResponse = zod.array(ListBookingsResponseItem)


export const CreateBookingBody = zod.object({
  "branch_id": zod.uuid(),
  "duration_minutes": zod.number().nullish().describe('Defaults to the branch\'s `default_duration_minutes`.'),
  "force": zod.boolean().nullish().describe('Create even when no table fits (the booking shows as \"needs a table\").'),
  "guest_name": zod.string(),
  "guest_phone": zod.string(),
  "locale": zod.string().nullish().describe('`en` | `ar` for the guest\'s messages.'),
  "notes": zod.string().nullish(),
  "party_size": zod.number(),
  "section_id": zod.uuid().nullish().describe('Seating preference for the auto-assigner.'),
  "send_confirmation": zod.boolean().nullish().describe('Send the WhatsApp confirmation (default true).'),
  "starts_at": zod.iso.datetime({"offset":true}),
  "table_ids": zod.array(zod.uuid()).nullish().describe('Explicit tables (skips auto-assignment). Empty = deliberately none.')
})

export const CreateBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cancelled_by": zod.string().nullish(),
  "completed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "guest_phone": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('The floor shows the claimed tables as held from here (branch\n`hold_minutes` before the start). Clients compare with their clock.'),
  "id": zod.uuid(),
  "locale": zod.string(),
  "needs_table": zod.boolean().describe('Active but holding no table: the host must assign one.'),
  "no_show_at": zod.iso.datetime({"offset":true}).nullish(),
  "notes": zod.string().nullish(),
  "open_ticket_id": zod.uuid().nullish(),
  "party_size": zod.number(),
  "phone_verified": zod.boolean(),
  "reminder_sent_at": zod.iso.datetime({"offset":true}).nullish(),
  "seated_at": zod.iso.datetime({"offset":true}).nullish(),
  "section_id": zod.uuid().nullish(),
  "source": zod.string().describe('`public` | `host`.'),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated` | `completed` | `no_show` | `cancelled`.'),
  "table_ids": zod.array(zod.uuid()),
  "table_labels": zod.array(zod.string()),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const BookingAvailabilityQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "date": zod.string(),
  "party_size": zod.number(),
  "section_id": zod.uuid().optional(),
  "exclude_booking_id": zod.uuid().optional().describe('Ignore this booking\'s own claims (when moving it).')
})

export const BookingAvailabilityResponse = zod.object({
  "date": zod.string(),
  "slots": zod.array(zod.object({
  "available": zod.boolean(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "starts_at": zod.iso.datetime({"offset":true}),
  "table_ids": zod.array(zod.uuid()).describe('The tables the auto-assigner would pick (host view only; empty when\nunavailable).')
})),
  "timezone": zod.string()
})


export const GetBookingSettingsQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const getBookingSettingsResponseHoursItemDowMin = 0;



export const GetBookingSettingsResponse = zod.object({
  "auto_no_show_minutes": zod.number().nullish().describe('Unseated this long after `starts_at` → `no_show` automatically. `null`\n= only when the window ends.'),
  "blackout_dates": zod.array(zod.string()).describe('ISO dates (`YYYY-MM-DD`) with no online slots.'),
  "branch_id": zod.uuid(),
  "default_duration_minutes": zod.number(),
  "enabled": zod.boolean().describe('Online (public) booking switch. Host bookings work regardless.'),
  "hold_minutes": zod.number().describe('The floor shows the table as held from `starts_at - hold_minutes`.'),
  "horizon_days": zod.number(),
  "hours": zod.array(zod.object({
  "close": zod.string(),
  "dow": zod.number().min(getBookingSettingsResponseHoursItemDowMin),
  "open": zod.string()
}).describe('One weekly booking window. `dow`: 0 = Sunday … 6 = Saturday. `open`\/`close`\nare `HH:MM` local; a close at or before open means \"closes after midnight\".')),
  "lead_time_minutes": zod.number(),
  "max_covers_per_slot": zod.number().nullish().describe('Optional ceiling on guests whose bookings start in one slot.'),
  "max_party": zod.number(),
  "min_party": zod.number(),
  "reminder_lead_minutes": zod.number().nullish().describe('WhatsApp reminder lead. `null` = no reminder.'),
  "require_otp": zod.boolean().describe('Online guests must verify their phone by WhatsApp code.'),
  "slot_minutes": zod.number()
})


export const putBookingSettingsBodyHoursItemDowMin = 0;



export const PutBookingSettingsBody = zod.object({
  "auto_no_show_minutes": zod.number().nullish().describe('Unseated this long after `starts_at` → `no_show` automatically. `null`\n= only when the window ends.'),
  "blackout_dates": zod.array(zod.string()).describe('ISO dates (`YYYY-MM-DD`) with no online slots.'),
  "branch_id": zod.uuid(),
  "default_duration_minutes": zod.number(),
  "enabled": zod.boolean().describe('Online (public) booking switch. Host bookings work regardless.'),
  "hold_minutes": zod.number().describe('The floor shows the table as held from `starts_at - hold_minutes`.'),
  "horizon_days": zod.number(),
  "hours": zod.array(zod.object({
  "close": zod.string(),
  "dow": zod.number().min(putBookingSettingsBodyHoursItemDowMin),
  "open": zod.string()
}).describe('One weekly booking window. `dow`: 0 = Sunday … 6 = Saturday. `open`\/`close`\nare `HH:MM` local; a close at or before open means \"closes after midnight\".')),
  "lead_time_minutes": zod.number(),
  "max_covers_per_slot": zod.number().nullish().describe('Optional ceiling on guests whose bookings start in one slot.'),
  "max_party": zod.number(),
  "min_party": zod.number(),
  "reminder_lead_minutes": zod.number().nullish().describe('WhatsApp reminder lead. `null` = no reminder.'),
  "require_otp": zod.boolean().describe('Online guests must verify their phone by WhatsApp code.'),
  "slot_minutes": zod.number()
})

export const putBookingSettingsResponseHoursItemDowMin = 0;



export const PutBookingSettingsResponse = zod.object({
  "auto_no_show_minutes": zod.number().nullish().describe('Unseated this long after `starts_at` → `no_show` automatically. `null`\n= only when the window ends.'),
  "blackout_dates": zod.array(zod.string()).describe('ISO dates (`YYYY-MM-DD`) with no online slots.'),
  "branch_id": zod.uuid(),
  "default_duration_minutes": zod.number(),
  "enabled": zod.boolean().describe('Online (public) booking switch. Host bookings work regardless.'),
  "hold_minutes": zod.number().describe('The floor shows the table as held from `starts_at - hold_minutes`.'),
  "horizon_days": zod.number(),
  "hours": zod.array(zod.object({
  "close": zod.string(),
  "dow": zod.number().min(putBookingSettingsResponseHoursItemDowMin),
  "open": zod.string()
}).describe('One weekly booking window. `dow`: 0 = Sunday … 6 = Saturday. `open`\/`close`\nare `HH:MM` local; a close at or before open means \"closes after midnight\".')),
  "lead_time_minutes": zod.number(),
  "max_covers_per_slot": zod.number().nullish().describe('Optional ceiling on guests whose bookings start in one slot.'),
  "max_party": zod.number(),
  "min_party": zod.number(),
  "reminder_lead_minutes": zod.number().nullish().describe('WhatsApp reminder lead. `null` = no reminder.'),
  "require_otp": zod.boolean().describe('Online guests must verify their phone by WhatsApp code.'),
  "slot_minutes": zod.number()
})


export const BookingStatsQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "from": zod.iso.datetime({"offset":true}),
  "to": zod.iso.datetime({"offset":true})
})

export const BookingStatsResponse = zod.object({
  "cancelled": zod.number(),
  "completed": zod.number(),
  "covers": zod.number().describe('Guests across bookings that were seated or completed.'),
  "host_count": zod.number(),
  "no_show": zod.number(),
  "no_show_rate": zod.number().describe('no_show \/ (no_show + seated + completed), 0 when nothing happened.'),
  "public_count": zod.number(),
  "seated": zod.number(),
  "total": zod.number()
})


export const GetBookingParams = zod.object({
  "id": zod.uuid().describe('Booking ID')
})

export const GetBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cancelled_by": zod.string().nullish(),
  "completed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "guest_phone": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('The floor shows the claimed tables as held from here (branch\n`hold_minutes` before the start). Clients compare with their clock.'),
  "id": zod.uuid(),
  "locale": zod.string(),
  "needs_table": zod.boolean().describe('Active but holding no table: the host must assign one.'),
  "no_show_at": zod.iso.datetime({"offset":true}).nullish(),
  "notes": zod.string().nullish(),
  "open_ticket_id": zod.uuid().nullish(),
  "party_size": zod.number(),
  "phone_verified": zod.boolean(),
  "reminder_sent_at": zod.iso.datetime({"offset":true}).nullish(),
  "seated_at": zod.iso.datetime({"offset":true}).nullish(),
  "section_id": zod.uuid().nullish(),
  "source": zod.string().describe('`public` | `host`.'),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated` | `completed` | `no_show` | `cancelled`.'),
  "table_ids": zod.array(zod.uuid()),
  "table_labels": zod.array(zod.string()),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const UpdateBookingParams = zod.object({
  "id": zod.uuid().describe('Booking ID')
})

export const UpdateBookingBody = zod.object({
  "duration_minutes": zod.number().nullish(),
  "force": zod.boolean().nullish().describe('Keep the booking when no table fits after a move (default true).'),
  "guest_name": zod.string().nullish(),
  "guest_phone": zod.string().nullish(),
  "notes": zod.string().nullish(),
  "party_size": zod.number().nullish(),
  "section_id": zod.uuid().nullish(),
  "starts_at": zod.iso.datetime({"offset":true}).nullish(),
  "table_ids": zod.array(zod.uuid()).nullish().describe('Present = reassign to exactly these tables (empty = unassign).')
})

export const UpdateBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cancelled_by": zod.string().nullish(),
  "completed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "guest_phone": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('The floor shows the claimed tables as held from here (branch\n`hold_minutes` before the start). Clients compare with their clock.'),
  "id": zod.uuid(),
  "locale": zod.string(),
  "needs_table": zod.boolean().describe('Active but holding no table: the host must assign one.'),
  "no_show_at": zod.iso.datetime({"offset":true}).nullish(),
  "notes": zod.string().nullish(),
  "open_ticket_id": zod.uuid().nullish(),
  "party_size": zod.number(),
  "phone_verified": zod.boolean(),
  "reminder_sent_at": zod.iso.datetime({"offset":true}).nullish(),
  "seated_at": zod.iso.datetime({"offset":true}).nullish(),
  "section_id": zod.uuid().nullish(),
  "source": zod.string().describe('`public` | `host`.'),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated` | `completed` | `no_show` | `cancelled`.'),
  "table_ids": zod.array(zod.uuid()),
  "table_labels": zod.array(zod.string()),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const CancelBookingParams = zod.object({
  "id": zod.uuid().describe('Booking ID')
})

export const CancelBookingBody = zod.object({
  "notify_guest": zod.boolean().nullish().describe('Message the guest (default true).'),
  "reason": zod.string().nullish()
})

export const CancelBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cancelled_by": zod.string().nullish(),
  "completed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "guest_phone": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('The floor shows the claimed tables as held from here (branch\n`hold_minutes` before the start). Clients compare with their clock.'),
  "id": zod.uuid(),
  "locale": zod.string(),
  "needs_table": zod.boolean().describe('Active but holding no table: the host must assign one.'),
  "no_show_at": zod.iso.datetime({"offset":true}).nullish(),
  "notes": zod.string().nullish(),
  "open_ticket_id": zod.uuid().nullish(),
  "party_size": zod.number(),
  "phone_verified": zod.boolean(),
  "reminder_sent_at": zod.iso.datetime({"offset":true}).nullish(),
  "seated_at": zod.iso.datetime({"offset":true}).nullish(),
  "section_id": zod.uuid().nullish(),
  "source": zod.string().describe('`public` | `host`.'),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated` | `completed` | `no_show` | `cancelled`.'),
  "table_ids": zod.array(zod.uuid()),
  "table_labels": zod.array(zod.string()),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const CompleteBookingParams = zod.object({
  "id": zod.uuid().describe('Booking ID')
})

export const CompleteBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cancelled_by": zod.string().nullish(),
  "completed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "guest_phone": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('The floor shows the claimed tables as held from here (branch\n`hold_minutes` before the start). Clients compare with their clock.'),
  "id": zod.uuid(),
  "locale": zod.string(),
  "needs_table": zod.boolean().describe('Active but holding no table: the host must assign one.'),
  "no_show_at": zod.iso.datetime({"offset":true}).nullish(),
  "notes": zod.string().nullish(),
  "open_ticket_id": zod.uuid().nullish(),
  "party_size": zod.number(),
  "phone_verified": zod.boolean(),
  "reminder_sent_at": zod.iso.datetime({"offset":true}).nullish(),
  "seated_at": zod.iso.datetime({"offset":true}).nullish(),
  "section_id": zod.uuid().nullish(),
  "source": zod.string().describe('`public` | `host`.'),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated` | `completed` | `no_show` | `cancelled`.'),
  "table_ids": zod.array(zod.uuid()),
  "table_labels": zod.array(zod.string()),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const NoShowBookingParams = zod.object({
  "id": zod.uuid().describe('Booking ID')
})

export const NoShowBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cancelled_by": zod.string().nullish(),
  "completed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "guest_phone": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('The floor shows the claimed tables as held from here (branch\n`hold_minutes` before the start). Clients compare with their clock.'),
  "id": zod.uuid(),
  "locale": zod.string(),
  "needs_table": zod.boolean().describe('Active but holding no table: the host must assign one.'),
  "no_show_at": zod.iso.datetime({"offset":true}).nullish(),
  "notes": zod.string().nullish(),
  "open_ticket_id": zod.uuid().nullish(),
  "party_size": zod.number(),
  "phone_verified": zod.boolean(),
  "reminder_sent_at": zod.iso.datetime({"offset":true}).nullish(),
  "seated_at": zod.iso.datetime({"offset":true}).nullish(),
  "section_id": zod.uuid().nullish(),
  "source": zod.string().describe('`public` | `host`.'),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated` | `completed` | `no_show` | `cancelled`.'),
  "table_ids": zod.array(zod.uuid()),
  "table_labels": zod.array(zod.string()),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const SeatBookingParams = zod.object({
  "id": zod.uuid().describe('Booking ID')
})

export const SeatBookingBody = zod.object({
  "table_ids": zod.array(zod.uuid()).nullish().describe('Seat the party on these tables instead (a walk-in took theirs, or the\nhost prefers another). Omit to keep the claim.')
})

export const SeatBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cancelled_by": zod.string().nullish(),
  "completed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "guest_phone": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('The floor shows the claimed tables as held from here (branch\n`hold_minutes` before the start). Clients compare with their clock.'),
  "id": zod.uuid(),
  "locale": zod.string(),
  "needs_table": zod.boolean().describe('Active but holding no table: the host must assign one.'),
  "no_show_at": zod.iso.datetime({"offset":true}).nullish(),
  "notes": zod.string().nullish(),
  "open_ticket_id": zod.uuid().nullish(),
  "party_size": zod.number(),
  "phone_verified": zod.boolean(),
  "reminder_sent_at": zod.iso.datetime({"offset":true}).nullish(),
  "seated_at": zod.iso.datetime({"offset":true}).nullish(),
  "section_id": zod.uuid().nullish(),
  "source": zod.string().describe('`public` | `host`.'),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated` | `completed` | `no_show` | `cancelled`.'),
  "table_ids": zod.array(zod.uuid()),
  "table_labels": zod.array(zod.string()),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const ListBranchAddonOverridesQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const ListBranchAddonOverridesResponseItem = zod.object({
  "addon_item_id": zod.uuid(),
  "branch_id": zod.uuid(),
  "is_available": zod.boolean().describe('False disables the addon at this branch (excluded from the branch addon list).'),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org default_price.'),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListBranchAddonOverridesResponse = zod.array(ListBranchAddonOverridesResponseItem)


export const UpsertBranchAddonOverrideBody = zod.object({
  "addon_item_id": zod.uuid(),
  "branch_id": zod.uuid(),
  "is_available": zod.boolean().optional(),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org default_price.')
})

export const UpsertBranchAddonOverrideResponse = zod.object({
  "addon_item_id": zod.uuid(),
  "branch_id": zod.uuid(),
  "is_available": zod.boolean().describe('False disables the addon at this branch (excluded from the branch addon list).'),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org default_price.'),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteBranchAddonOverrideQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "addon_item_id": zod.uuid()
})

export const DeleteBranchAddonOverrideResponse = zod.void()


export const ListBranchMenuOverridesQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const ListBranchMenuOverridesResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "is_available": zod.boolean().describe('False disables the item at this branch (excluded from the branch menu).'),
  "menu_item_id": zod.uuid(),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org catalog base_price.'),
  "sizes": zod.array(zod.object({
  "price_override": zod.number().describe('Branch price for this size in piastres.'),
  "size_label": zod.string()
})).optional().describe('Per-size branch prices for this item (empty when none). Availability is item-level.'),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListBranchMenuOverridesResponse = zod.array(ListBranchMenuOverridesResponseItem)


export const UpsertBranchMenuOverrideBody = zod.object({
  "branch_id": zod.uuid(),
  "is_available": zod.boolean().optional(),
  "menu_item_id": zod.uuid(),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org catalog base_price.'),
  "sizes": zod.array(zod.object({
  "price_override": zod.number(),
  "size_label": zod.string()
})).nullish().describe('Per-size branch prices. `null`\/omitted → leave existing size overrides untouched;\na list → REPLACE the item\'s size overrides with exactly that set (empty clears them).')
})

export const UpsertBranchMenuOverrideResponse = zod.object({
  "branch_id": zod.uuid(),
  "is_available": zod.boolean().describe('False disables the item at this branch (excluded from the branch menu).'),
  "menu_item_id": zod.uuid(),
  "price_override": zod.number().nullish().describe('Branch price in piastres; null inherits the org catalog base_price.'),
  "sizes": zod.array(zod.object({
  "price_override": zod.number().describe('Branch price for this size in piastres.'),
  "size_label": zod.string()
})).optional().describe('Per-size branch prices for this item (empty when none). Availability is item-level.'),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteBranchMenuOverrideQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "menu_item_id": zod.uuid()
})

export const DeleteBranchMenuOverrideResponse = zod.void()


export const ListBranchesQueryParams = zod.object({
  "org_id": zod.uuid().describe('Organization whose branches to list. Must match the caller\'s JWT org.')
})

export const ListBranchesResponseItem = zod.object({
  "address": zod.string().nullish(),
  "code": zod.string().nullish().describe('Short org-unique branch prefix (A-Z0-9) embedded in every order_ref\n(`<CODE>-YYMMDD-…`). Exposed so an offline device can mint the same ref the\nserver would, from first boot, without waiting for a synced order.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "geo_radius_meters": zod.number().nullish().describe('Radius in meters within which this branch is considered a match. Defaults to 200.'),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "latitude": zod.number().nullish().describe('WGS-84 latitude for geofenced branch resolution.'),
  "longitude": zod.number().nullish().describe('WGS-84 longitude for geofenced branch resolution.'),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "org_logo_url": zod.string().nullish().describe('Convenience field — populated from the parent org\'s `logo_url`.'),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "timezone": zod.string().describe('Effective IANA timezone name for this branch, resolved as\n`branch.timezone → org.timezone → Africa\/Cairo`. Always present;\nclients should format all of this branch\'s timestamps in this zone.'),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListBranchesResponse = zod.array(ListBranchesResponseItem)


export const CreateBranchBody = zod.object({
  "address": zod.string().nullish(),
  "geo_radius_meters": zod.number().nullish().describe('Geofence radius in meters. Defaults to 200.'),
  "latitude": zod.number().nullish(),
  "longitude": zod.number().nullish(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish().describe('TCP port for the receipt printer. Defaults to `9100` if absent.'),
  "timezone": zod.string().nullish().describe('IANA timezone name. If absent, the branch inherits the org\'s timezone.')
})

export const CreateBranchResponse = zod.object({
  "address": zod.string().nullish(),
  "code": zod.string().nullish().describe('Short org-unique branch prefix (A-Z0-9) embedded in every order_ref\n(`<CODE>-YYMMDD-…`). Exposed so an offline device can mint the same ref the\nserver would, from first boot, without waiting for a synced order.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "geo_radius_meters": zod.number().nullish().describe('Radius in meters within which this branch is considered a match. Defaults to 200.'),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "latitude": zod.number().nullish().describe('WGS-84 latitude for geofenced branch resolution.'),
  "longitude": zod.number().nullish().describe('WGS-84 longitude for geofenced branch resolution.'),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "org_logo_url": zod.string().nullish().describe('Convenience field — populated from the parent org\'s `logo_url`.'),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "timezone": zod.string().describe('Effective IANA timezone name for this branch, resolved as\n`branch.timezone → org.timezone → Africa\/Cairo`. Always present;\nclients should format all of this branch\'s timestamps in this zone.'),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const GetBranchParams = zod.object({
  "id": zod.uuid().describe('Branch ID')
})

export const GetBranchResponse = zod.object({
  "address": zod.string().nullish(),
  "code": zod.string().nullish().describe('Short org-unique branch prefix (A-Z0-9) embedded in every order_ref\n(`<CODE>-YYMMDD-…`). Exposed so an offline device can mint the same ref the\nserver would, from first boot, without waiting for a synced order.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "geo_radius_meters": zod.number().nullish().describe('Radius in meters within which this branch is considered a match. Defaults to 200.'),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "latitude": zod.number().nullish().describe('WGS-84 latitude for geofenced branch resolution.'),
  "longitude": zod.number().nullish().describe('WGS-84 longitude for geofenced branch resolution.'),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "org_logo_url": zod.string().nullish().describe('Convenience field — populated from the parent org\'s `logo_url`.'),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "timezone": zod.string().describe('Effective IANA timezone name for this branch, resolved as\n`branch.timezone → org.timezone → Africa\/Cairo`. Always present;\nclients should format all of this branch\'s timestamps in this zone.'),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const UpdateBranchParams = zod.object({
  "id": zod.uuid().describe('Branch ID')
})

export const UpdateBranchBody = zod.object({
  "address": zod.string().nullish(),
  "geo_radius_meters": zod.number().nullish(),
  "is_active": zod.boolean().nullish(),
  "latitude": zod.number().nullish(),
  "longitude": zod.number().nullish(),
  "name": zod.string().nullish(),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "timezone": zod.string().nullish()
}).describe('PATCH-style update. Fields fall into three categories:\n\n- \*\*Absent\*\* from JSON → keep existing value.\n- \*\*Present as `null`\*\* (only the `printer_\*` fields) → clear the column.\n- \*\*Present as a value\*\* → set to that value.\n\nOpenAPI cannot express the absent-vs-null distinction cleanly, so all\nfields are documented as optional and nullable. Clients targeting this\nendpoint should send only the fields they want to change.')

export const UpdateBranchResponse = zod.object({
  "address": zod.string().nullish(),
  "code": zod.string().nullish().describe('Short org-unique branch prefix (A-Z0-9) embedded in every order_ref\n(`<CODE>-YYMMDD-…`). Exposed so an offline device can mint the same ref the\nserver would, from first boot, without waiting for a synced order.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "geo_radius_meters": zod.number().nullish().describe('Radius in meters within which this branch is considered a match. Defaults to 200.'),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "latitude": zod.number().nullish().describe('WGS-84 latitude for geofenced branch resolution.'),
  "longitude": zod.number().nullish().describe('WGS-84 longitude for geofenced branch resolution.'),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "org_logo_url": zod.string().nullish().describe('Convenience field — populated from the parent org\'s `logo_url`.'),
  "phone": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "timezone": zod.string().describe('Effective IANA timezone name for this branch, resolved as\n`branch.timezone → org.timezone → Africa\/Cairo`. Always present;\nclients should format all of this branch\'s timestamps in this zone.'),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteBranchParams = zod.object({
  "id": zod.uuid().describe('Branch ID')
})

export const DeleteBranchResponse = zod.void()


export const BranchBookingQrParams = zod.object({
  "id": zod.uuid().describe('Branch ID')
})

export const branchBookingQrQueryDpiMin = 0;

export const branchBookingQrQueryModulePxMin = 0;



export const BranchBookingQrQueryParams = zod.object({
  "card": zod.boolean().optional().describe('`true` (default) → branded A6 card PNG; `false` → plain receipt QR PNG.'),
  "caption": zod.string().optional().describe('Dynamic caption line beneath the tagline (A6 card only).'),
  "dpi": zod.number().min(branchBookingQrQueryDpiMin).optional().describe('Raster DPI for the A6 card (clamped 72–2400). Default 600.'),
  "bleed_mm": zod.number().optional().describe('Print bleed in mm (A6 card only). Default 0.'),
  "crop_marks": zod.boolean().optional().describe('Draw crop marks (A6 card, only meaningful when `bleed_mm > 0`).'),
  "svg": zod.boolean().optional().describe('Return the A6 card as SVG (`data:image\/svg+xml;base64,…`). Default false.'),
  "module_px": zod.number().min(branchBookingQrQueryModulePxMin).optional().describe('Pixels per module for the plain receipt QR (1–40). Default 16.'),
  "slug": zod.string().optional()
})

export const BranchBookingQrResponse = zod.object({
  "kind": zod.string(),
  "long_url": zod.string(),
  "qr_data_url": zod.string().describe('`data:image\/png;base64,…` (or `data:image\/svg+xml;base64,…` when\n`svg=true`).  Paste into a browser `<img src=\"…\">` to verify.'),
  "short_code": zod.string(),
  "short_url": zod.string()
}).describe('JSON returned from every QR-generation endpoint.')


export const BranchQrParams = zod.object({
  "id": zod.uuid().describe('Branch ID')
})

export const branchQrQueryDpiMin = 0;

export const branchQrQueryModulePxMin = 0;



export const BranchQrQueryParams = zod.object({
  "card": zod.boolean().optional().describe('`true` (default) → branded A6 card PNG; `false` → plain receipt QR PNG.'),
  "caption": zod.string().optional().describe('Dynamic caption line beneath the tagline (A6 card only).'),
  "dpi": zod.number().min(branchQrQueryDpiMin).optional().describe('Raster DPI for the A6 card (clamped 72–2400). Default 600.'),
  "bleed_mm": zod.number().optional().describe('Print bleed in mm (A6 card only). Default 0.'),
  "crop_marks": zod.boolean().optional().describe('Draw crop marks (A6 card, only meaningful when `bleed_mm > 0`).'),
  "svg": zod.boolean().optional().describe('Return the A6 card as SVG (`data:image\/svg+xml;base64,…`). Default false.'),
  "module_px": zod.number().min(branchQrQueryModulePxMin).optional().describe('Pixels per module for the plain receipt QR (1–40). Default 16.'),
  "slug": zod.string().optional(),
  "place_name": zod.string().optional().describe('Shop or company name inside the mall (e.g. \"Starbucks Kiosk 3\").'),
  "floor": zod.string().optional().describe('Floor (e.g. \"Ground Floor\").'),
  "unit_number": zod.string().optional().describe('Unit or office number (e.g. \"Unit 42\").')
})

export const BranchQrResponse = zod.object({
  "kind": zod.string(),
  "long_url": zod.string(),
  "qr_data_url": zod.string().describe('`data:image\/png;base64,…` (or `data:image\/svg+xml;base64,…` when\n`svg=true`).  Paste into a browser `<img src=\"…\">` to verify.'),
  "short_code": zod.string(),
  "short_url": zod.string()
}).describe('JSON returned from every QR-generation endpoint.')


export const ListTablesParams = zod.object({
  "id": zod.uuid().describe('Branch ID')
})

export const ListTablesResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListTablesResponse = zod.array(ListTablesResponseItem)


export const CreateTableParams = zod.object({
  "id": zod.uuid().describe('Branch ID')
})

export const CreateTableBody = zod.object({
  "label": zod.string()
})

export const CreateTableResponse = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteTableParams = zod.object({
  "id": zod.uuid().describe('Branch ID'),
  "tid": zod.uuid().describe('Table ID')
})

export const DeleteTableResponse = zod.void()


export const TableQrParams = zod.object({
  "id": zod.uuid().describe('Branch ID'),
  "tid": zod.uuid().describe('Table ID')
})

export const tableQrQueryDpiMin = 0;

export const tableQrQueryModulePxMin = 0;



export const TableQrQueryParams = zod.object({
  "card": zod.boolean().optional().describe('`true` (default) → branded A6 card PNG; `false` → plain receipt QR PNG.'),
  "caption": zod.string().optional().describe('Dynamic caption line beneath the tagline (A6 card only).'),
  "dpi": zod.number().min(tableQrQueryDpiMin).optional().describe('Raster DPI for the A6 card (clamped 72–2400). Default 600.'),
  "bleed_mm": zod.number().optional().describe('Print bleed in mm (A6 card only). Default 0.'),
  "crop_marks": zod.boolean().optional().describe('Draw crop marks (A6 card, only meaningful when `bleed_mm > 0`).'),
  "svg": zod.boolean().optional().describe('Return the A6 card as SVG (`data:image\/svg+xml;base64,…`). Default false.'),
  "module_px": zod.number().min(tableQrQueryModulePxMin).optional().describe('Pixels per module for the plain receipt QR (1–40). Default 16.')
})

export const TableQrResponse = zod.object({
  "kind": zod.string(),
  "long_url": zod.string(),
  "qr_data_url": zod.string().describe('`data:image\/png;base64,…` (or `data:image\/svg+xml;base64,…` when\n`svg=true`).  Paste into a browser `<img src=\"…\">` to verify.'),
  "short_code": zod.string(),
  "short_url": zod.string()
}).describe('JSON returned from every QR-generation endpoint.')


export const ListBundlesQueryParams = zod.object({
  "org_id": zod.uuid().optional(),
  "status": zod.enum(['draft', 'active', 'archived']).optional(),
  "branch_id": zod.uuid().optional(),
  "search": zod.string().optional(),
  "page": zod.number().optional(),
  "per_page": zod.number().optional(),
  "sort": zod.string().optional().describe('Sort: name_asc | name_desc | price_asc | price_desc | created_asc |\ncreated_desc (default).')
})

export const ListBundlesResponse = zod.object({
  "data": zod.array(zod.object({
  "available_from_date": zod.iso.date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.iso.date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "id": zod.uuid(),
  "item_cost": zod.number().describe('Cost of the component (at its base size) in piastres. When\n`item_cost_missing` is true this is a PARTIAL figure (unknown = 0 on the\nwire for old-client compat) — display it as unknown, not as money.'),
  "item_cost_missing": zod.boolean().nullish().describe('True when the component\'s cost could not be fully resolved.'),
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number().describe('Sum of the KNOWN component costs × quantity, in piastres. When\n`cost_missing` is true this is a partial rollup (old-wire semantics) —\nrender it as unknown, never as 0.'),
  "cost_missing": zod.boolean().nullish().describe('True when at least one component\'s cost is unknown.')
}))),
  "page": zod.number(),
  "per_page": zod.number(),
  "total": zod.number(),
  "total_pages": zod.number()
})


export const CreateBundleBody = zod.object({
  "available_from_date": zod.iso.date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.iso.date().nullish(),
  "available_until_time": zod.string().nullish(),
  "branch_ids": zod.array(zod.uuid()).nullish(),
  "components": zod.array(zod.object({
  "item_id": zod.uuid(),
  "position": zod.number().nullish(),
  "quantity": zod.number()
})),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown().optional(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown().optional(),
  "org_id": zod.uuid(),
  "price": zod.number()
})

export const CreateBundleResponse = zod.object({
  "available_from_date": zod.iso.date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.iso.date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "id": zod.uuid(),
  "item_cost": zod.number().describe('Cost of the component (at its base size) in piastres. When\n`item_cost_missing` is true this is a PARTIAL figure (unknown = 0 on the\nwire for old-client compat) — display it as unknown, not as money.'),
  "item_cost_missing": zod.boolean().nullish().describe('True when the component\'s cost could not be fully resolved.'),
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number().describe('Sum of the KNOWN component costs × quantity, in piastres. When\n`cost_missing` is true this is a partial rollup (old-wire semantics) —\nrender it as unknown, never as 0.'),
  "cost_missing": zod.boolean().nullish().describe('True when at least one component\'s cost is unknown.')
}))


export const AvailableBundlesQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "at": zod.iso.datetime({"offset":true}).optional()
})

export const AvailableBundlesResponseItem = zod.object({
  "available_from_date": zod.iso.date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.iso.date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "id": zod.uuid(),
  "item_cost": zod.number().describe('Cost of the component (at its base size) in piastres. When\n`item_cost_missing` is true this is a PARTIAL figure (unknown = 0 on the\nwire for old-client compat) — display it as unknown, not as money.'),
  "item_cost_missing": zod.boolean().nullish().describe('True when the component\'s cost could not be fully resolved.'),
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number().describe('Sum of the KNOWN component costs × quantity, in piastres. When\n`cost_missing` is true this is a partial rollup (old-wire semantics) —\nrender it as unknown, never as 0.'),
  "cost_missing": zod.boolean().nullish().describe('True when at least one component\'s cost is unknown.')
}))
export const AvailableBundlesResponse = zod.array(AvailableBundlesResponseItem)


export const GetBundleParams = zod.object({
  "id": zod.uuid().describe('Bundle ID')
})

export const GetBundleResponse = zod.object({
  "available_from_date": zod.iso.date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.iso.date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "id": zod.uuid(),
  "item_cost": zod.number().describe('Cost of the component (at its base size) in piastres. When\n`item_cost_missing` is true this is a PARTIAL figure (unknown = 0 on the\nwire for old-client compat) — display it as unknown, not as money.'),
  "item_cost_missing": zod.boolean().nullish().describe('True when the component\'s cost could not be fully resolved.'),
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number().describe('Sum of the KNOWN component costs × quantity, in piastres. When\n`cost_missing` is true this is a partial rollup (old-wire semantics) —\nrender it as unknown, never as 0.'),
  "cost_missing": zod.boolean().nullish().describe('True when at least one component\'s cost is unknown.')
}))


export const DeleteBundleParams = zod.object({
  "id": zod.uuid().describe('Bundle ID')
})

export const DeleteBundleResponse = zod.unknown()


export const UpdateBundleParams = zod.object({
  "id": zod.uuid().describe('Bundle ID')
})

export const UpdateBundleBody = zod.object({
  "available_from_date": zod.iso.date().nullish(),
  "available_from_time": zod.string().nullish().describe('`null`  → clear the field (no start time restriction)\nomitted → keep the existing value\na value → set to that time'),
  "available_until_date": zod.iso.date().nullish(),
  "available_until_time": zod.string().nullish(),
  "branch_ids": zod.array(zod.uuid()).nullish(),
  "components": zod.array(zod.object({
  "item_id": zod.uuid(),
  "position": zod.number().nullish(),
  "quantity": zod.number()
})).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown().optional(),
  "image_url": zod.string().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.unknown().optional(),
  "price": zod.number().nullish()
})

export const UpdateBundleResponse = zod.object({
  "available_from_date": zod.iso.date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.iso.date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "id": zod.uuid(),
  "item_cost": zod.number().describe('Cost of the component (at its base size) in piastres. When\n`item_cost_missing` is true this is a PARTIAL figure (unknown = 0 on the\nwire for old-client compat) — display it as unknown, not as money.'),
  "item_cost_missing": zod.boolean().nullish().describe('True when the component\'s cost could not be fully resolved.'),
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number().describe('Sum of the KNOWN component costs × quantity, in piastres. When\n`cost_missing` is true this is a partial rollup (old-wire semantics) —\nrender it as unknown, never as 0.'),
  "cost_missing": zod.boolean().nullish().describe('True when at least one component\'s cost is unknown.')
}))


export const ActivateBundleParams = zod.object({
  "id": zod.uuid().describe('Bundle ID')
})

export const ActivateBundleResponse = zod.object({
  "available_from_date": zod.iso.date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.iso.date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "id": zod.uuid(),
  "item_cost": zod.number().describe('Cost of the component (at its base size) in piastres. When\n`item_cost_missing` is true this is a PARTIAL figure (unknown = 0 on the\nwire for old-client compat) — display it as unknown, not as money.'),
  "item_cost_missing": zod.boolean().nullish().describe('True when the component\'s cost could not be fully resolved.'),
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number().describe('Sum of the KNOWN component costs × quantity, in piastres. When\n`cost_missing` is true this is a partial rollup (old-wire semantics) —\nrender it as unknown, never as 0.'),
  "cost_missing": zod.boolean().nullish().describe('True when at least one component\'s cost is unknown.')
}))


export const ArchiveBundleParams = zod.object({
  "id": zod.uuid().describe('Bundle ID')
})

export const ArchiveBundleResponse = zod.object({
  "available_from_date": zod.iso.date().nullish(),
  "available_from_time": zod.string().nullish(),
  "available_until_date": zod.iso.date().nullish(),
  "available_until_time": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.unknown(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.uuid(),
  "price": zod.number(),
  "status": zod.enum(['draft', 'active', 'archived']),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "branch_ids": zod.array(zod.uuid()),
  "components": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "id": zod.uuid(),
  "item_cost": zod.number().describe('Cost of the component (at its base size) in piastres. When\n`item_cost_missing` is true this is a PARTIAL figure (unknown = 0 on the\nwire for old-client compat) — display it as unknown, not as money.'),
  "item_cost_missing": zod.boolean().nullish().describe('True when the component\'s cost could not be fully resolved.'),
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "item_price": zod.number(),
  "position": zod.number(),
  "quantity": zod.number()
})),
  "computed_cost": zod.number().describe('Sum of the KNOWN component costs × quantity, in piastres. When\n`cost_missing` is true this is a partial rollup (old-wire semantics) —\nrender it as unknown, never as 0.'),
  "cost_missing": zod.boolean().nullish().describe('True when at least one component\'s cost is unknown.')
}))


export const BundlePerformanceParams = zod.object({
  "id": zod.uuid()
})

export const BundlePerformanceQueryParams = zod.object({
  "start_date": zod.iso.datetime({"offset":true}).optional(),
  "end_date": zod.iso.datetime({"offset":true}).optional()
})

export const BundlePerformanceResponse = zod.object({
  "component_popularity": zod.array(zod.object({
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "quantity_sold": zod.number()
})),
  "gross_revenue": zod.number(),
  "net_profit": zod.number(),
  "sales_volume": zod.number()
})


export const CatalogSyncQueryParams = zod.object({
  "branch_id": zod.uuid().describe('Branch whose resolved prices\/availability to return'),
  "channel": zod.string().optional().describe('delivery_channel: in_mall | outside | umbrella | pickup — omit for branch-only resolution (in-store POS)'),
  "since": zod.number().optional().describe('Device\'s cached catalog_revision; == current ⇒ changed:false, no payload')
})

export const CatalogSyncResponse = zod.object({
  "catalog_revision": zod.number(),
  "changed": zod.boolean().describe('`false` when `since` equals the current revision (client is up to date;\n`items`\/`ingredients` are then empty). `true` ⇒ the full payload follows.'),
  "ingredients": zod.array(zod.object({
  "id": zod.uuid(),
  "name": zod.string(),
  "unit": zod.string()
}).describe('An org ingredient referenced by a returned option recipe.')).optional(),
  "items": zod.array(zod.object({
  "category_id": zod.uuid().nullish(),
  "id": zod.uuid(),
  "modifier_groups": zod.array(zod.object({
  "group_id": zod.uuid(),
  "is_required": zod.boolean(),
  "legacy_addon_type": zod.string().nullish(),
  "max": zod.number().nullish(),
  "min": zod.number(),
  "name": zod.string().describe('The group\'s authored display name (custom groups have no legacy type —\nthis is what the POS renders as the section title).'),
  "name_translations": zod.looseObject({

}),
  "options": zod.array(zod.object({
  "id": zod.uuid(),
  "is_available": zod.boolean().describe('Effective availability (branch_channel → branch → channel → TRUE).'),
  "name": zod.string(),
  "price": zod.number().describe('Effective price in piastres (branch_channel → branch → channel → catalog default).'),
  "recipe": zod.array(zod.object({
  "ingredient_id": zod.uuid(),
  "quantity": zod.string().describe('Base-unit quantity, serialized as a string for numeric fidelity.'),
  "unit": zod.string()
}).describe('One recipe line of a modifier option: which ingredient the option deducts\n(or swaps in, when `quantity = 0`). Base-unit, yield-normalized values.')),
  "replaces_ingredient_id": zod.uuid().nullish().describe('The org_ingredient this option swaps out, if it is a swap-style option.')
}).describe('A modifier option, with price\/availability resolved for `(branch, channel)`.')),
  "selection_type": zod.string()
}).describe('A modifier group attached to an item, with min\/max\/required resolved from the\nattachment overrides (falling back to the group defaults).')),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "sizes": zod.array(zod.object({
  "id": zod.uuid(),
  "is_available": zod.boolean().describe('Effective availability (branch_channel → branch → channel → TRUE).'),
  "label": zod.string(),
  "price": zod.number().describe('Effective price in piastres (branch_channel → branch → channel → catalog default).')
}).describe('A size (menu_item_sizes row) with its price\/availability resolved for the\nrequested `(branch, channel)`.'))
}).describe('One menu item with its sizes and attached modifier groups.')).optional()
}).describe('The full catalog snapshot for a POS device.')


export const ListCategoriesQueryParams = zod.object({
  "org_id": zod.uuid()
})

export const ListCategoriesResponseItem = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "deleted_at": zod.iso.datetime({"offset":true}).nullish(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListCategoriesResponse = zod.array(ListCategoriesResponseItem)


export const CreateCategoryBody = zod.object({
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}).nullish(),
  "org_id": zod.uuid()
})

export const CreateCategoryResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "deleted_at": zod.iso.datetime({"offset":true}).nullish(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteCategoryParams = zod.object({
  "id": zod.uuid().describe('Category ID')
})

export const DeleteCategoryResponse = zod.void()


export const UpdateCategoryParams = zod.object({
  "id": zod.uuid().describe('Category ID')
})

export const UpdateCategoryBody = zod.object({
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.looseObject({

}).nullish()
})

export const UpdateCategoryResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "deleted_at": zod.iso.datetime({"offset":true}).nullish(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const ListAddonCostsQueryParams = zod.object({
  "org_id": zod.uuid(),
  "branch_id": zod.uuid().nullish().describe('Optional: resolve costs at this branch\'s actual cost (falling back to the\norg default per ingredient). Omit for the org default \/ standard cost.')
})

export const ListAddonCostsResponseItem = zod.object({
  "addon_item_id": zod.uuid(),
  "addon_type": zod.string(),
  "cost": zod.number().nullish().describe('Ingredient cost rollup in piastres over the ingredients that \*are\*\npriced. A partial rollup still returns the sum so far, with\n`cost_missing = true`; `null` only when nothing is priced.'),
  "cost_missing": zod.boolean().describe('`true` when at least one ingredient is unlinked or has no cost, so `cost`\n(if any) is partial rather than the full figure.'),
  "margin_pct": zod.number().nullish().describe('`(price - cost) \/ price` — only when the cost is \*complete\* and price > 0.'),
  "name": zod.string(),
  "price": zod.number().describe('Default price in piastres.')
}).describe('Computed cost for one addon item.')
export const ListAddonCostsResponse = zod.array(ListAddonCostsResponseItem)


export const ListMenuCatalogQueryParams = zod.object({
  "org_id": zod.uuid(),
  "category_id": zod.uuid().optional(),
  "search": zod.string().optional().describe('Case-insensitive filter on the item name.'),
  "page": zod.number().optional().describe('1-based page number (default 1).'),
  "per_page": zod.number().optional().describe('Page size (default 50, max 500).'),
  "branch_id": zod.uuid().optional().describe('When set, enables the per-branch override filter\/sort (LEFT JOINs the\nbranch\'s overrides). Prices in the response stay org-level.'),
  "overridden": zod.boolean().optional().describe('With `branch_id`: true → only items overridden at the branch; false →\nonly un-overridden; null → all.'),
  "sort": zod.string().optional().describe('`\"overridden\"` → overridden items first (needs `branch_id`); otherwise A–Z.')
})

export const ListMenuCatalogResponse = zod.object({
  "data": zod.array(zod.object({
  "base_price": zod.number(),
  "category_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.iso.datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.looseObject({

}),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "sku_costs": zod.array(zod.object({
  "category_id": zod.uuid().nullish(),
  "cost": zod.number().nullish().describe('Recipe cost rollup in piastres over the ingredients that \*are\* priced.\n`null` only when there is no recipe, or no recipe ingredient has a known\ncost at all. A partial rollup (some ingredients unpriced) still returns\nthe sum so far, with `cost_missing = true` flagging it as incomplete.'),
  "cost_missing": zod.boolean().describe('`true` when at least one recipe ingredient is unlinked or has no cost, so\n`cost` (if any) is a partial figure rather than the full COGS.'),
  "food_cost_pct": zod.number().nullish().describe('`cost \/ price` — only when the cost is \*complete\* and price > 0.'),
  "item_name": zod.string(),
  "margin_pct": zod.number().nullish().describe('`(price - cost) \/ price` — only when the cost is \*complete\* and price > 0.\nSuppressed (`null`) for partial rollups so an incomplete cost is never\ngraded as a food-cost percentage.'),
  "menu_item_id": zod.uuid(),
  "price": zod.number().describe('Current price in piastres for this SKU.'),
  "size_label": zod.string().describe('`\"one_size\"` when the item has no sizes.')
}).describe('Computed cost for one sellable SKU (menu item × size).'))
})).describe('A menu item with its per-SKU recipe-cost rollup embedded, so the catalog\nlist needs no separate `\/costing\/menu-items` round trip. `sku_costs` is one\nrow per sellable size (or a single `one_size` row); empty when the item is\ninactive or has no recipe.')),
  "page": zod.number(),
  "per_page": zod.number(),
  "total": zod.number(),
  "total_pages": zod.number()
})


export const ListSkuCostsQueryParams = zod.object({
  "org_id": zod.uuid(),
  "branch_id": zod.uuid().nullish().describe('Optional: resolve costs at this branch\'s actual cost (falling back to the\norg default per ingredient). Omit for the org default \/ standard cost.')
})

export const ListSkuCostsResponseItem = zod.object({
  "category_id": zod.uuid().nullish(),
  "cost": zod.number().nullish().describe('Recipe cost rollup in piastres over the ingredients that \*are\* priced.\n`null` only when there is no recipe, or no recipe ingredient has a known\ncost at all. A partial rollup (some ingredients unpriced) still returns\nthe sum so far, with `cost_missing = true` flagging it as incomplete.'),
  "cost_missing": zod.boolean().describe('`true` when at least one recipe ingredient is unlinked or has no cost, so\n`cost` (if any) is a partial figure rather than the full COGS.'),
  "food_cost_pct": zod.number().nullish().describe('`cost \/ price` — only when the cost is \*complete\* and price > 0.'),
  "item_name": zod.string(),
  "margin_pct": zod.number().nullish().describe('`(price - cost) \/ price` — only when the cost is \*complete\* and price > 0.\nSuppressed (`null`) for partial rollups so an incomplete cost is never\ngraded as a food-cost percentage.'),
  "menu_item_id": zod.uuid(),
  "price": zod.number().describe('Current price in piastres for this SKU.'),
  "size_label": zod.string().describe('`\"one_size\"` when the item has no sizes.')
}).describe('Computed cost for one sellable SKU (menu item × size).')
export const ListSkuCostsResponse = zod.array(ListSkuCostsResponseItem)


export const ListDeliveryOrdersQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "status": zod.string().nullish().describe('Comma-separated statuses to include (default: all).'),
  "limit": zod.number().nullish()
})

export const ListDeliveryOrdersResponseItem = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cart": zod.looseObject({

}).describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.iso.datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.uuid().nullish(),
  "discount_amount": zod.number().optional(),
  "discount_id": zod.uuid().nullish().describe('Frozen channel discount on the item subtotal (`total == subtotal -\ndiscount_amount + delivery_fee`). `discount_amount` is 0 when none.'),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().optional(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "org_id": zod.uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.iso.datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.iso.datetime({"offset":true}).nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.iso.datetime({"offset":true}).nullish(),
  "rejected_at": zod.iso.datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListDeliveryOrdersResponse = zod.array(ListDeliveryOrdersResponseItem)


export const GetDeliveryOrderParams = zod.object({
  "id": zod.uuid()
})

export const GetDeliveryOrderResponse = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cart": zod.looseObject({

}).describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.iso.datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.uuid().nullish(),
  "discount_amount": zod.number().optional(),
  "discount_id": zod.uuid().nullish().describe('Frozen channel discount on the item subtotal (`total == subtotal -\ndiscount_amount + delivery_fee`). `discount_amount` is 0 when none.'),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().optional(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "org_id": zod.uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.iso.datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.iso.datetime({"offset":true}).nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.iso.datetime({"offset":true}).nullish(),
  "rejected_at": zod.iso.datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const CancelDeliveryOrderParams = zod.object({
  "id": zod.uuid()
})

export const CancelDeliveryOrderBody = zod.object({
  "reason": zod.string().nullish(),
  "restore_inventory": zod.boolean().optional().describe('true (default): ingredients stay available. false: the food was made and is\nwasted — the frozen plan is deducted from stock and logged as `waste`.')
})

export const CancelDeliveryOrderResponse = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cart": zod.looseObject({

}).describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.iso.datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.uuid().nullish(),
  "discount_amount": zod.number().optional(),
  "discount_id": zod.uuid().nullish().describe('Frozen channel discount on the item subtotal (`total == subtotal -\ndiscount_amount + delivery_fee`). `discount_amount` is 0 when none.'),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().optional(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "org_id": zod.uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.iso.datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.iso.datetime({"offset":true}).nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.iso.datetime({"offset":true}).nullish(),
  "rejected_at": zod.iso.datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const FinalizeDeliveryOrderParams = zod.object({
  "id": zod.uuid()
})

export const FinalizeDeliveryOrderBody = zod.object({
  "payment_method": zod.string().describe('The actual method the customer paid (overrides the hint). Must be an org method.'),
  "shift_id": zod.uuid()
})

export const FinalizeDeliveryOrderResponse = zod.object({
  "delivery_order": zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cart": zod.looseObject({

}).describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.iso.datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.uuid().nullish(),
  "discount_amount": zod.number().optional(),
  "discount_id": zod.uuid().nullish().describe('Frozen channel discount on the item subtotal (`total == subtotal -\ndiscount_amount + delivery_fee`). `discount_amount` is 0 when none.'),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().optional(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "org_id": zod.uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.iso.datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.iso.datetime({"offset":true}).nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.iso.datetime({"offset":true}).nullish(),
  "rejected_at": zod.iso.datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
}),
  "order_id": zod.uuid(),
  "order_ref": zod.string().nullish(),
  "warnings": zod.array(zod.string())
})


export const SetPrepTimeParams = zod.object({
  "id": zod.uuid()
})

export const SetPrepTimeBody = zod.object({
  "extra_prep_minutes": zod.number().describe('Minutes the teller adds on top of the branch base prep time. Must be a\nnon-negative multiple of 5.')
})

export const SetPrepTimeResponse = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cart": zod.looseObject({

}).describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.iso.datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.uuid().nullish(),
  "discount_amount": zod.number().optional(),
  "discount_id": zod.uuid().nullish().describe('Frozen channel discount on the item subtotal (`total == subtotal -\ndiscount_amount + delivery_fee`). `discount_amount` is 0 when none.'),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().optional(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "org_id": zod.uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.iso.datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.iso.datetime({"offset":true}).nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.iso.datetime({"offset":true}).nullish(),
  "rejected_at": zod.iso.datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeliveryOrderQrParams = zod.object({
  "id": zod.uuid().describe('Delivery order ID')
})

export const deliveryOrderQrQueryDpiMin = 0;

export const deliveryOrderQrQueryModulePxMin = 0;



export const DeliveryOrderQrQueryParams = zod.object({
  "card": zod.boolean().optional().describe('`true` (default) → branded A6 card PNG; `false` → plain receipt QR PNG.'),
  "caption": zod.string().optional().describe('Dynamic caption line beneath the tagline (A6 card only).'),
  "dpi": zod.number().min(deliveryOrderQrQueryDpiMin).optional().describe('Raster DPI for the A6 card (clamped 72–2400). Default 600.'),
  "bleed_mm": zod.number().optional().describe('Print bleed in mm (A6 card only). Default 0.'),
  "crop_marks": zod.boolean().optional().describe('Draw crop marks (A6 card, only meaningful when `bleed_mm > 0`).'),
  "svg": zod.boolean().optional().describe('Return the A6 card as SVG (`data:image\/svg+xml;base64,…`). Default false.'),
  "module_px": zod.number().min(deliveryOrderQrQueryModulePxMin).optional().describe('Pixels per module for the plain receipt QR (1–40). Default 16.')
})

export const DeliveryOrderQrResponse = zod.object({
  "kind": zod.string(),
  "long_url": zod.string(),
  "qr_data_url": zod.string().describe('`data:image\/png;base64,…` (or `data:image\/svg+xml;base64,…` when\n`svg=true`).  Paste into a browser `<img src=\"…\">` to verify.'),
  "short_code": zod.string(),
  "short_url": zod.string()
}).describe('JSON returned from every QR-generation endpoint.')


export const SetStatusParams = zod.object({
  "id": zod.uuid()
})

export const SetStatusBody = zod.object({
  "status": zod.string().describe('Target line step: \"confirmed\" | \"preparing\" | \"ready\" | \"out_for_delivery\".\nThe teller may jump to ANY of these from any non-terminal state (forward or\nback); the landed step is stamped and all other step stamps are cleared, and\nat most one customer WhatsApp fires (the last newly-crossed step that has one).')
})

export const SetStatusResponse = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cart": zod.looseObject({

}).describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.iso.datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.uuid().nullish(),
  "discount_amount": zod.number().optional(),
  "discount_id": zod.uuid().nullish().describe('Frozen channel discount on the item subtotal (`total == subtotal -\ndiscount_amount + delivery_fee`). `discount_amount` is 0 when none.'),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().optional(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "org_id": zod.uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.iso.datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.iso.datetime({"offset":true}).nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.iso.datetime({"offset":true}).nullish(),
  "rejected_at": zod.iso.datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const SetAcceptingBody = zod.object({
  "branch_id": zod.uuid(),
  "channel": zod.string().describe('\"in_mall\" | \"outside\"'),
  "mode": zod.string().describe('\"auto\" | \"open\" | \"closed\". Named `mode` (not `override`) because a bare\n`override` field is a reserved word in Dart and breaks the POS client\ncode generator.')
})

export const SetAcceptingResponse = zod.object({
  "branch_id": zod.uuid(),
  "in_mall_close_time": zod.string().nullish(),
  "in_mall_discount_id": zod.uuid().nullish().describe('Optional discount applied to each channel\'s item subtotal (reuses the\norg `discounts` table). Frozen onto the order at intake. `null` = none.'),
  "in_mall_enabled": zod.boolean(),
  "in_mall_fee": zod.number(),
  "in_mall_open_time": zod.string().nullish(),
  "in_mall_override": zod.string(),
  "in_mall_require_location": zod.boolean().describe('When false, in-mall orders may be placed without a device GPS location\n(\"confirm you\'re at the branch\"). Shop\/company + floor + unit are always\nrequired regardless. Default true.'),
  "max_road_distance_meters": zod.number().nullish(),
  "otp_required": zod.boolean().describe('When false, the public checkout skips OTP phone verification for this\nbranch and accepts orders without a device token. Default true.'),
  "outside_close_time": zod.string().nullish(),
  "outside_discount_id": zod.uuid().nullish(),
  "outside_enabled": zod.boolean(),
  "outside_open_time": zod.string().nullish(),
  "outside_override": zod.string(),
  "pickup_close_time": zod.string().nullish(),
  "pickup_discount_id": zod.uuid().nullish(),
  "pickup_enabled": zod.boolean(),
  "pickup_fee": zod.number(),
  "pickup_open_time": zod.string().nullish(),
  "pickup_override": zod.string(),
  "prep_time_minutes": zod.number(),
  "umbrella_close_time": zod.string().nullish(),
  "umbrella_discount_id": zod.uuid().nullish(),
  "umbrella_enabled": zod.boolean(),
  "umbrella_fee": zod.number().describe('Flat per-branch fees (piastres). Pickup defaults to free.'),
  "umbrella_open_time": zod.string().nullish(),
  "umbrella_override": zod.string()
})


export const ListChannelAddonOverridesQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "channel": zod.string()
})

export const ListChannelAddonOverridesResponseItem = zod.object({
  "addon_item_id": zod.uuid(),
  "branch_id": zod.uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "price_override": zod.number().nullish()
})
export const ListChannelAddonOverridesResponse = zod.array(ListChannelAddonOverridesResponseItem)


export const UpsertChannelAddonOverrideBody = zod.object({
  "addon_item_id": zod.uuid(),
  "branch_id": zod.uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "price_override": zod.number().nullish()
})

export const UpsertChannelAddonOverrideResponse = zod.object({
  "addon_item_id": zod.uuid(),
  "branch_id": zod.uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "price_override": zod.number().nullish()
})


export const DeleteChannelAddonOverrideQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "addon_item_id": zod.uuid(),
  "channel": zod.string()
})

export const DeleteChannelAddonOverrideResponse = zod.void()


export const ListChannelOverridesQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "channel": zod.string()
})

export const ListChannelOverridesResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "menu_item_id": zod.uuid(),
  "price_override": zod.number().nullish()
})
export const ListChannelOverridesResponse = zod.array(ListChannelOverridesResponseItem)


export const UpsertChannelOverrideBody = zod.object({
  "branch_id": zod.uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "menu_item_id": zod.uuid(),
  "price_override": zod.number().nullish()
})

export const UpsertChannelOverrideResponse = zod.object({
  "branch_id": zod.uuid(),
  "channel": zod.string(),
  "is_available": zod.boolean().nullish(),
  "menu_item_id": zod.uuid(),
  "price_override": zod.number().nullish()
})


export const DeleteChannelOverrideQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "menu_item_id": zod.uuid(),
  "channel": zod.string()
})

export const DeleteChannelOverrideResponse = zod.void()


export const GetBranchSettingsQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const GetBranchSettingsResponse = zod.object({
  "branch_id": zod.uuid(),
  "in_mall_close_time": zod.string().nullish(),
  "in_mall_discount_id": zod.uuid().nullish().describe('Optional discount applied to each channel\'s item subtotal (reuses the\norg `discounts` table). Frozen onto the order at intake. `null` = none.'),
  "in_mall_enabled": zod.boolean(),
  "in_mall_fee": zod.number(),
  "in_mall_open_time": zod.string().nullish(),
  "in_mall_override": zod.string(),
  "in_mall_require_location": zod.boolean().describe('When false, in-mall orders may be placed without a device GPS location\n(\"confirm you\'re at the branch\"). Shop\/company + floor + unit are always\nrequired regardless. Default true.'),
  "max_road_distance_meters": zod.number().nullish(),
  "otp_required": zod.boolean().describe('When false, the public checkout skips OTP phone verification for this\nbranch and accepts orders without a device token. Default true.'),
  "outside_close_time": zod.string().nullish(),
  "outside_discount_id": zod.uuid().nullish(),
  "outside_enabled": zod.boolean(),
  "outside_open_time": zod.string().nullish(),
  "outside_override": zod.string(),
  "pickup_close_time": zod.string().nullish(),
  "pickup_discount_id": zod.uuid().nullish(),
  "pickup_enabled": zod.boolean(),
  "pickup_fee": zod.number(),
  "pickup_open_time": zod.string().nullish(),
  "pickup_override": zod.string(),
  "prep_time_minutes": zod.number(),
  "umbrella_close_time": zod.string().nullish(),
  "umbrella_discount_id": zod.uuid().nullish(),
  "umbrella_enabled": zod.boolean(),
  "umbrella_fee": zod.number().describe('Flat per-branch fees (piastres). Pickup defaults to free.'),
  "umbrella_open_time": zod.string().nullish(),
  "umbrella_override": zod.string()
})


export const PutBranchSettingsBody = zod.object({
  "branch_id": zod.uuid(),
  "in_mall_close_time": zod.string().nullish(),
  "in_mall_discount_id": zod.uuid().nullish().describe('Optional per-channel discount ids (must be active discounts in the\ncaller\'s org). `null` clears the channel\'s discount.'),
  "in_mall_enabled": zod.boolean(),
  "in_mall_fee": zod.number(),
  "in_mall_open_time": zod.string().nullish(),
  "in_mall_require_location": zod.boolean().optional().describe('When false, in-mall orders are accepted without a device GPS location.\nDefaults to true so an omitting client keeps the location check on.'),
  "max_road_distance_meters": zod.number().nullish(),
  "otp_required": zod.boolean().optional().describe('When false, the public checkout skips OTP for this branch. Defaults to\ntrue so an omitting client keeps verification on.'),
  "outside_close_time": zod.string().nullish(),
  "outside_discount_id": zod.uuid().nullish(),
  "outside_enabled": zod.boolean(),
  "outside_open_time": zod.string().nullish(),
  "pickup_close_time": zod.string().nullish(),
  "pickup_discount_id": zod.uuid().nullish(),
  "pickup_enabled": zod.boolean().optional(),
  "pickup_fee": zod.number().optional(),
  "pickup_open_time": zod.string().nullish(),
  "prep_time_minutes": zod.number(),
  "umbrella_close_time": zod.string().nullish(),
  "umbrella_discount_id": zod.uuid().nullish(),
  "umbrella_enabled": zod.boolean().optional(),
  "umbrella_fee": zod.number().optional(),
  "umbrella_open_time": zod.string().nullish()
})

export const PutBranchSettingsResponse = zod.object({
  "branch_id": zod.uuid(),
  "in_mall_close_time": zod.string().nullish(),
  "in_mall_discount_id": zod.uuid().nullish().describe('Optional discount applied to each channel\'s item subtotal (reuses the\norg `discounts` table). Frozen onto the order at intake. `null` = none.'),
  "in_mall_enabled": zod.boolean(),
  "in_mall_fee": zod.number(),
  "in_mall_open_time": zod.string().nullish(),
  "in_mall_override": zod.string(),
  "in_mall_require_location": zod.boolean().describe('When false, in-mall orders may be placed without a device GPS location\n(\"confirm you\'re at the branch\"). Shop\/company + floor + unit are always\nrequired regardless. Default true.'),
  "max_road_distance_meters": zod.number().nullish(),
  "otp_required": zod.boolean().describe('When false, the public checkout skips OTP phone verification for this\nbranch and accepts orders without a device token. Default true.'),
  "outside_close_time": zod.string().nullish(),
  "outside_discount_id": zod.uuid().nullish(),
  "outside_enabled": zod.boolean(),
  "outside_open_time": zod.string().nullish(),
  "outside_override": zod.string(),
  "pickup_close_time": zod.string().nullish(),
  "pickup_discount_id": zod.uuid().nullish(),
  "pickup_enabled": zod.boolean(),
  "pickup_fee": zod.number(),
  "pickup_open_time": zod.string().nullish(),
  "pickup_override": zod.string(),
  "prep_time_minutes": zod.number(),
  "umbrella_close_time": zod.string().nullish(),
  "umbrella_discount_id": zod.uuid().nullish(),
  "umbrella_enabled": zod.boolean(),
  "umbrella_fee": zod.number().describe('Flat per-branch fees (piastres). Pickup defaults to free.'),
  "umbrella_open_time": zod.string().nullish(),
  "umbrella_override": zod.string()
})


export const ListZonesQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const ListZonesResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "fee": zod.number(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "max_road_distance_meters": zod.number(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

})
})
export const ListZonesResponse = zod.array(ListZonesResponseItem)


export const CreateZoneBody = zod.object({
  "branch_id": zod.uuid(),
  "fee": zod.number(),
  "is_active": zod.boolean().optional(),
  "max_road_distance_meters": zod.number(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}).optional()
})

export const CreateZoneResponse = zod.object({
  "branch_id": zod.uuid(),
  "fee": zod.number(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "max_road_distance_meters": zod.number(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

})
})


export const DeleteZoneParams = zod.object({
  "id": zod.uuid()
})

export const DeleteZoneQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const DeleteZoneResponse = zod.void()


export const UpdateZoneParams = zod.object({
  "id": zod.uuid()
})

export const UpdateZoneBody = zod.object({
  "branch_id": zod.uuid(),
  "fee": zod.number(),
  "is_active": zod.boolean().optional(),
  "max_road_distance_meters": zod.number(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}).optional()
})

export const UpdateZoneResponse = zod.object({
  "branch_id": zod.uuid(),
  "fee": zod.number(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "max_road_distance_meters": zod.number(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

})
})


export const ListDiscountsQueryParams = zod.object({
  "org_id": zod.uuid()
})

export const ListDiscountsResponseItem = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "dtype": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "value": zod.number()
})
export const ListDiscountsResponse = zod.array(ListDiscountsResponseItem)


export const CreateDiscountBody = zod.object({
  "dtype": zod.string(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}).nullish(),
  "org_id": zod.uuid(),
  "value": zod.number()
})

export const CreateDiscountResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "dtype": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "value": zod.number()
})


export const DeleteDiscountParams = zod.object({
  "id": zod.uuid().describe('Discount ID')
})

export const DeleteDiscountResponse = zod.void()


export const UpdateDiscountParams = zod.object({
  "id": zod.uuid().describe('Discount ID')
})

export const UpdateDiscountBody = zod.object({
  "dtype": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.looseObject({

}).nullish(),
  "value": zod.number().nullish()
})

export const UpdateDiscountResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "dtype": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "value": zod.number()
})


export const SaveLayoutBody = zod.object({
  "branch_id": zod.uuid(),
  "tables": zod.array(zod.object({
  "expected_updated_at": zod.iso.datetime({"offset":true}).nullish().describe('Optimistic-concurrency token: the `updated_at` the client last saw for\nthis table.\n\nThe dashboard autosaves every gesture, so two managers arranging the\nsame room no longer collide rarely and visibly -- they collide often and\nsilently, each overwriting the other\'s last drag. When this is sent, the\nwrite only lands if the row has not moved since; otherwise the whole\nrequest is rejected and the caller is told exactly which tables changed.\n\nOptional so existing clients (and the POS) keep working unchanged: absent\nmeans \"no guard\", which is the previous last-write-wins behaviour.'),
  "height": zod.number(),
  "id": zod.uuid(),
  "pos_x": zod.number(),
  "pos_y": zod.number(),
  "rotation": zod.number(),
  "section_id": zod.uuid().nullish(),
  "width": zod.number()
}).describe('One table\'s geometry in a bulk drag-save. `section_id` lets a drag move a\ntable between sections in the same save.'))
})

export const SaveLayoutResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "height": zod.number(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "next_booking": zod.union([zod.null(),zod.object({
  "booking_id": zod.uuid(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('`starts_at - hold_minutes`: from here the table reads as held.'),
  "party_size": zod.number(),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated`.')
}).describe('The next active booking claiming this table (today\'s service, or the\none in progress). The floor renders \"held\" from `held_from` by its own\nclock; nothing here is written to `status`. Only the list endpoint fills\nit — single-row writes return `null`.')]).optional(),
  "org_id": zod.uuid(),
  "pos_x": zod.number(),
  "pos_y": zod.number(),
  "rotation": zod.number(),
  "seats": zod.number(),
  "section_id": zod.uuid().nullish(),
  "shape": zod.string(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "width": zod.number()
})
export const SaveLayoutResponse = zod.array(SaveLayoutResponseItem)


export const ListSectionsQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const ListSectionsResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "canvas_h": zod.number(),
  "canvas_w": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "name": zod.string(),
  "ordering": zod.number(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListSectionsResponse = zod.array(ListSectionsResponseItem)


export const CreateSectionBody = zod.object({
  "branch_id": zod.uuid(),
  "canvas_h": zod.number().nullish(),
  "canvas_w": zod.number().nullish(),
  "name": zod.string(),
  "ordering": zod.number().nullish()
})

export const CreateSectionResponse = zod.object({
  "branch_id": zod.uuid(),
  "canvas_h": zod.number(),
  "canvas_w": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "name": zod.string(),
  "ordering": zod.number(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteSectionParams = zod.object({
  "id": zod.uuid().describe('Section ID')
})

export const DeleteSectionResponse = zod.void()


export const UpdateSectionParams = zod.object({
  "id": zod.uuid().describe('Section ID')
})

export const UpdateSectionBody = zod.object({
  "canvas_h": zod.number().nullish(),
  "canvas_w": zod.number().nullish(),
  "name": zod.string().nullish(),
  "ordering": zod.number().nullish()
})

export const UpdateSectionResponse = zod.object({
  "branch_id": zod.uuid(),
  "canvas_h": zod.number(),
  "canvas_w": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "name": zod.string(),
  "ordering": zod.number(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const ListFloorTablesQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const ListFloorTablesResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "height": zod.number(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "next_booking": zod.union([zod.null(),zod.object({
  "booking_id": zod.uuid(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('`starts_at - hold_minutes`: from here the table reads as held.'),
  "party_size": zod.number(),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated`.')
}).describe('The next active booking claiming this table (today\'s service, or the\none in progress). The floor renders \"held\" from `held_from` by its own\nclock; nothing here is written to `status`. Only the list endpoint fills\nit — single-row writes return `null`.')]).optional(),
  "org_id": zod.uuid(),
  "pos_x": zod.number(),
  "pos_y": zod.number(),
  "rotation": zod.number(),
  "seats": zod.number(),
  "section_id": zod.uuid().nullish(),
  "shape": zod.string(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "width": zod.number()
})
export const ListFloorTablesResponse = zod.array(ListFloorTablesResponseItem)


export const CreateFloorTableBody = zod.object({
  "branch_id": zod.uuid(),
  "height": zod.number().nullish(),
  "label": zod.string(),
  "pos_x": zod.number().nullish(),
  "pos_y": zod.number().nullish(),
  "rotation": zod.number().nullish(),
  "seats": zod.number().nullish(),
  "section_id": zod.uuid().nullish(),
  "shape": zod.string().nullish(),
  "width": zod.number().nullish()
})

export const CreateFloorTableResponse = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "height": zod.number(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "next_booking": zod.union([zod.null(),zod.object({
  "booking_id": zod.uuid(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('`starts_at - hold_minutes`: from here the table reads as held.'),
  "party_size": zod.number(),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated`.')
}).describe('The next active booking claiming this table (today\'s service, or the\none in progress). The floor renders \"held\" from `held_from` by its own\nclock; nothing here is written to `status`. Only the list endpoint fills\nit — single-row writes return `null`.')]).optional(),
  "org_id": zod.uuid(),
  "pos_x": zod.number(),
  "pos_y": zod.number(),
  "rotation": zod.number(),
  "seats": zod.number(),
  "section_id": zod.uuid().nullish(),
  "shape": zod.string(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "width": zod.number()
})


export const SwapTablesBody = zod.object({
  "branch_id": zod.uuid(),
  "table_a": zod.uuid(),
  "table_b": zod.uuid()
})

export const SwapTablesResponse = zod.unknown()


export const DeleteFloorTableParams = zod.object({
  "id": zod.uuid().describe('Table ID')
})

export const DeleteFloorTableResponse = zod.void()


export const UpdateFloorTableParams = zod.object({
  "id": zod.uuid().describe('Table ID')
})

export const UpdateFloorTableBody = zod.object({
  "height": zod.number().nullish(),
  "is_active": zod.boolean().nullish(),
  "label": zod.string().nullish(),
  "pos_x": zod.number().nullish(),
  "pos_y": zod.number().nullish(),
  "rotation": zod.number().nullish(),
  "seats": zod.number().nullish(),
  "section_id": zod.uuid().nullish(),
  "shape": zod.string().nullish(),
  "width": zod.number().nullish()
})

export const UpdateFloorTableResponse = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "height": zod.number(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "next_booking": zod.union([zod.null(),zod.object({
  "booking_id": zod.uuid(),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "held_from": zod.iso.datetime({"offset":true}).describe('`starts_at - hold_minutes`: from here the table reads as held.'),
  "party_size": zod.number(),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string().describe('`confirmed` | `seated`.')
}).describe('The next active booking claiming this table (today\'s service, or the\none in progress). The floor renders \"held\" from `held_from` by its own\nclock; nothing here is written to `status`. Only the list endpoint fills\nit — single-row writes return `null`.')]).optional(),
  "org_id": zod.uuid(),
  "pos_x": zod.number(),
  "pos_y": zod.number(),
  "rotation": zod.number(),
  "seats": zod.number(),
  "section_id": zod.uuid().nullish(),
  "shape": zod.string(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "width": zod.number()
})


/**
 * The ONE human act the derived-status model needs. Everything else about a
 * table's status follows from the ticket on it: seated when one lands, free
 * when nobody vacated, dirty after a checkout. But no server can see that the
 * plates have been cleared, so a person says so.
 *
 * Deliberately not a set-status endpoint. Its predecessor took any status and
 * wrote it with no lock and no occupancy check, so it could declare a table
 * free while a ticket was open on it. This performs exactly one transition,
 * `dirty` -> `free`, and refuses anything else.
 * @summary Mark a bussed table ready for the next party.
 */
export const ClearTableParams = zod.object({
  "id": zod.uuid().describe('Table ID')
})

export const ClearTableBody = zod.object({
  "branch_id": zod.uuid()
})

export const ClearTableResponse = zod.unknown()


export const ListFloorTransfersQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "since": zod.iso.datetime({"offset":true}).optional().describe('Sync cursor (as on \/held-orders). Omit for the waiting queue only.')
})

export const ListFloorTransfersResponse = zod.object({
  "server_time": zod.iso.datetime({"offset":true}),
  "transfers": zod.array(zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "from_table_id": zod.uuid().nullish(),
  "fulfilled_table_id": zod.uuid().nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "occupant_id": zod.uuid(),
  "occupant_kind": zod.string().describe('Always `open_ticket`. Kept on the wire so the rebuilt booking flow\ncan queue into the same waitlist without a schema change.'),
  "occupant_label": zod.string().nullish().describe('Display label for the queue: the held order\'s name \/ the ticket\'s ref.'),
  "requested_by": zod.uuid().nullish(),
  "resolved_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string().describe('`waiting` | `fulfilled` | `cancelled`.'),
  "target_section_id": zod.uuid().nullish(),
  "target_table_id": zod.uuid().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
}))
})


export const CreateFloorTransferBody = zod.object({
  "branch_id": zod.uuid(),
  "id": zod.uuid().describe('Client-minted id (offline-first identity; retries dedup on it).'),
  "note": zod.string().nullish(),
  "occupant_id": zod.uuid(),
  "occupant_kind": zod.string().describe('`held_order` | `open_ticket`.'),
  "target_section_id": zod.uuid().nullish().describe('The wish: any table in this section…'),
  "target_table_id": zod.uuid().nullish().describe('…or exactly this table. At least one of the two is required.')
}).describe('Operational table-state edit from the POS: the layout (geometry\/shape) is\ndashboard-authored, but STATE — status walks (bussing a dirty table) and\nwhich zone the physical table currently sits in — belongs to the floor\nstaff. Both fields optional; `clear_section` moves the table out of every\nsection (`section_id` wins when both are sent).')

export const CreateFloorTransferResponse = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "from_table_id": zod.uuid().nullish(),
  "fulfilled_table_id": zod.uuid().nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "occupant_id": zod.uuid(),
  "occupant_kind": zod.string().describe('Always `open_ticket`. Kept on the wire so the rebuilt booking flow\ncan queue into the same waitlist without a schema change.'),
  "occupant_label": zod.string().nullish().describe('Display label for the queue: the held order\'s name \/ the ticket\'s ref.'),
  "requested_by": zod.uuid().nullish(),
  "resolved_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string().describe('`waiting` | `fulfilled` | `cancelled`.'),
  "target_section_id": zod.uuid().nullish(),
  "target_table_id": zod.uuid().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const CancelTransferParams = zod.object({
  "id": zod.uuid().describe('Transfer request ID')
})

export const CancelTransferResponse = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "from_table_id": zod.uuid().nullish(),
  "fulfilled_table_id": zod.uuid().nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "occupant_id": zod.uuid(),
  "occupant_kind": zod.string().describe('Always `open_ticket`. Kept on the wire so the rebuilt booking flow\ncan queue into the same waitlist without a schema change.'),
  "occupant_label": zod.string().nullish().describe('Display label for the queue: the held order\'s name \/ the ticket\'s ref.'),
  "requested_by": zod.uuid().nullish(),
  "resolved_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string().describe('`waiting` | `fulfilled` | `cancelled`.'),
  "target_section_id": zod.uuid().nullish(),
  "target_table_id": zod.uuid().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const FulfillTransferParams = zod.object({
  "id": zod.uuid().describe('Transfer request ID')
})

export const FulfillTransferBody = zod.object({
  "table_id": zod.uuid().describe('The table the party actually moves to (must satisfy the wish).')
})

export const FulfillTransferResponse = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "from_table_id": zod.uuid().nullish(),
  "fulfilled_table_id": zod.uuid().nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "occupant_id": zod.uuid(),
  "occupant_kind": zod.string().describe('Always `open_ticket`. Kept on the wire so the rebuilt booking flow\ncan queue into the same waitlist without a schema change.'),
  "occupant_label": zod.string().nullish().describe('Display label for the queue: the held order\'s name \/ the ticket\'s ref.'),
  "requested_by": zod.uuid().nullish(),
  "resolved_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string().describe('`waiting` | `fulfilled` | `cancelled`.'),
  "target_section_id": zod.uuid().nullish(),
  "target_table_id": zod.uuid().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const MarginWatchParams = zod.object({
  "branch_id": zod.uuid().describe('Branch id, or the nil UUID for org-wide')
})

export const MarginWatchQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "cost_basis": zod.string().optional().describe('`snapshot` (default) | `current`.')
})

export const MarginWatchResponse = zod.object({
  "bottom": zod.array(zod.object({
  "category_id": zod.uuid().nullish(),
  "category_name": zod.string().nullish(),
  "class": zod.string().nullish().describe('Classic menu-engineering class (Kasavana–Smith): `star` | `workhorse` |\n`challenge` | `dog`. High\/low popularity splits at the 70%-rule\nthreshold (0.70\/n of tracked units); high\/low profit splits at the\nweighted-average unit contribution margin. `null` for rows that can\'t\nbe classified (no sales in the period, or cost unknown).'),
  "cost": zod.number().nullish().describe('Piastres under the chosen basis; `null` = unknown (never 0).'),
  "flags": zod.array(zod.object({
  "kind": zod.string().describe('below_cost | below_target | cost_spike | price_candidate |\nremoval_candidate | recipe_incomplete'),
  "link": zod.string().describe('Where the fix lives: `pricing` | `studio` | `studio_recipe`.'),
  "params": zod.looseObject({

})
}).describe('One advisory flag on a ledger row. `params` carries the evidence numbers the\nclient templates into a localized reason; `link` names the fix surface.')),
  "item_name": zod.string(),
  "margin": zod.number().nullish(),
  "margin_pct": zod.number().nullish(),
  "margin_share_pct": zod.number().nullish().describe('This row\'s share of the total KNOWN margin (null when margin unknown\nor total margin ≤ 0).'),
  "menu_item_id": zod.uuid(),
  "on_menu": zod.boolean().describe('False when this SKU no longer exists on the active menu (historical\nsales under a removed size\/item).'),
  "popularity_pct": zod.number().nullish().describe('This SKU\'s share of tracked units (the popularity axis), when classified.'),
  "prev_margin": zod.number().nullish(),
  "prev_quantity": zod.number().describe('Previous equal-length period, for the trend column.'),
  "quantity_sold": zod.number(),
  "revenue": zod.number(),
  "size_label": zod.string().describe('`\"one_size\"` for items without sizes.')
})).describe('Worst contributors (asc, only rows with known margin), max 3.'),
  "branch_id": zod.uuid(),
  "from": zod.iso.datetime({"offset":true}).nullish(),
  "open_signals": zod.number(),
  "rows_cost_unknown": zod.number(),
  "target_pct": zod.number(),
  "to": zod.iso.datetime({"offset":true}).nullish(),
  "top": zod.array(zod.object({
  "category_id": zod.uuid().nullish(),
  "category_name": zod.string().nullish(),
  "class": zod.string().nullish().describe('Classic menu-engineering class (Kasavana–Smith): `star` | `workhorse` |\n`challenge` | `dog`. High\/low popularity splits at the 70%-rule\nthreshold (0.70\/n of tracked units); high\/low profit splits at the\nweighted-average unit contribution margin. `null` for rows that can\'t\nbe classified (no sales in the period, or cost unknown).'),
  "cost": zod.number().nullish().describe('Piastres under the chosen basis; `null` = unknown (never 0).'),
  "flags": zod.array(zod.object({
  "kind": zod.string().describe('below_cost | below_target | cost_spike | price_candidate |\nremoval_candidate | recipe_incomplete'),
  "link": zod.string().describe('Where the fix lives: `pricing` | `studio` | `studio_recipe`.'),
  "params": zod.looseObject({

})
}).describe('One advisory flag on a ledger row. `params` carries the evidence numbers the\nclient templates into a localized reason; `link` names the fix surface.')),
  "item_name": zod.string(),
  "margin": zod.number().nullish(),
  "margin_pct": zod.number().nullish(),
  "margin_share_pct": zod.number().nullish().describe('This row\'s share of the total KNOWN margin (null when margin unknown\nor total margin ≤ 0).'),
  "menu_item_id": zod.uuid(),
  "on_menu": zod.boolean().describe('False when this SKU no longer exists on the active menu (historical\nsales under a removed size\/item).'),
  "popularity_pct": zod.number().nullish().describe('This SKU\'s share of tracked units (the popularity axis), when classified.'),
  "prev_margin": zod.number().nullish(),
  "prev_quantity": zod.number().describe('Previous equal-length period, for the trend column.'),
  "quantity_sold": zod.number(),
  "revenue": zod.number(),
  "size_label": zod.string().describe('`\"one_size\"` for items without sizes.')
})).describe('Top contributors by known margin (desc), max 3.'),
  "totals": zod.object({
  "below_target_gap": zod.number().describe('Σ(target·revenue − margin) over below-target rows — \"margin left on\nthe table\" this period, in piastres.'),
  "cost_known": zod.number().describe('Cost summed over rows where it is known.'),
  "margin_known": zod.number(),
  "margin_pct": zod.number().nullish(),
  "prev_margin_known": zod.number(),
  "prev_revenue": zod.number(),
  "revenue": zod.number(),
  "revenue_cost_unknown": zod.number().describe('Revenue sitting on rows whose cost is unknown (visibly reconciles).')
})
})


export const MenuMarginLedgerParams = zod.object({
  "branch_id": zod.uuid().describe('Branch id, or the nil UUID for every branch in the org')
})

export const MenuMarginLedgerQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "cost_basis": zod.string().optional().describe('`snapshot` (default) | `current`.')
})

export const MenuMarginLedgerResponse = zod.object({
  "branch_id": zod.uuid(),
  "cost_basis": zod.string(),
  "from": zod.iso.datetime({"offset":true}).nullish(),
  "rows": zod.array(zod.object({
  "category_id": zod.uuid().nullish(),
  "category_name": zod.string().nullish(),
  "class": zod.string().nullish().describe('Classic menu-engineering class (Kasavana–Smith): `star` | `workhorse` |\n`challenge` | `dog`. High\/low popularity splits at the 70%-rule\nthreshold (0.70\/n of tracked units); high\/low profit splits at the\nweighted-average unit contribution margin. `null` for rows that can\'t\nbe classified (no sales in the period, or cost unknown).'),
  "cost": zod.number().nullish().describe('Piastres under the chosen basis; `null` = unknown (never 0).'),
  "flags": zod.array(zod.object({
  "kind": zod.string().describe('below_cost | below_target | cost_spike | price_candidate |\nremoval_candidate | recipe_incomplete'),
  "link": zod.string().describe('Where the fix lives: `pricing` | `studio` | `studio_recipe`.'),
  "params": zod.looseObject({

})
}).describe('One advisory flag on a ledger row. `params` carries the evidence numbers the\nclient templates into a localized reason; `link` names the fix surface.')),
  "item_name": zod.string(),
  "margin": zod.number().nullish(),
  "margin_pct": zod.number().nullish(),
  "margin_share_pct": zod.number().nullish().describe('This row\'s share of the total KNOWN margin (null when margin unknown\nor total margin ≤ 0).'),
  "menu_item_id": zod.uuid(),
  "on_menu": zod.boolean().describe('False when this SKU no longer exists on the active menu (historical\nsales under a removed size\/item).'),
  "popularity_pct": zod.number().nullish().describe('This SKU\'s share of tracked units (the popularity axis), when classified.'),
  "prev_margin": zod.number().nullish(),
  "prev_quantity": zod.number().describe('Previous equal-length period, for the trend column.'),
  "quantity_sold": zod.number(),
  "revenue": zod.number(),
  "size_label": zod.string().describe('`\"one_size\"` for items without sizes.')
})),
  "rows_cost_unknown": zod.number().describe('Rows whose cost is unknown under the chosen basis (they ARE in `rows`).'),
  "target_pct": zod.number(),
  "target_source": zod.string().describe('`branch` | `org` | `default`.'),
  "to": zod.iso.datetime({"offset":true}).nullish(),
  "totals": zod.object({
  "below_target_gap": zod.number().describe('Σ(target·revenue − margin) over below-target rows — \"margin left on\nthe table\" this period, in piastres.'),
  "cost_known": zod.number().describe('Cost summed over rows where it is known.'),
  "margin_known": zod.number(),
  "margin_pct": zod.number().nullish(),
  "prev_margin_known": zod.number(),
  "prev_revenue": zod.number(),
  "revenue": zod.number(),
  "revenue_cost_unknown": zod.number().describe('Revenue sitting on rows whose cost is unknown (visibly reconciles).')
})
})


export const RepricingParams = zod.object({
  "branch_id": zod.uuid().describe('Branch id (branch-actual costs), or the nil UUID for org-wide (org-standard costs)')
})

export const RepricingResponse = zod.object({
  "branch_id": zod.uuid(),
  "skus_considered": zod.number().describe('Active priced SKUs considered in total.'),
  "skus_cost_unknown": zod.number().describe('Active priced SKUs whose cost is not fully known — NOT suggested (no\nguessed cost); surfaced so coverage is transparent.'),
  "suggestions": zod.array(zod.object({
  "below_cost": zod.boolean().describe('True when the item currently sells BELOW cost (negative margin).'),
  "cost": zod.number().describe('Complete recipe cost, piastres.'),
  "current_price": zod.number().describe('Current selling price, piastres.'),
  "item_name": zod.string(),
  "margin_pct": zod.number().describe('`(price − cost) \/ price`, current.'),
  "menu_item_id": zod.uuid(),
  "size_label": zod.string().describe('`\"one_size\"` for items without sizes.'),
  "suggested_price": zod.number().describe('Target-restoring price `ceil(cost \/ (1 − target))` to whole EGP, piastres.'),
  "target_pct": zod.number().describe('The org\/branch target margin this suggestion aims for.'),
  "uplift": zod.number().describe('`suggested_price − current_price`, piastres.')
}).describe('One repricing suggestion: an underpriced SKU + the price that would restore\nthe target margin.')).describe('Underpriced SKUs with a target-restoring suggestion, biggest uplift first.'),
  "target_pct": zod.number(),
  "target_source": zod.string().describe('`branch` | `org` | `default`.')
}).describe('The repricing surface for a branch (or org-wide).')


export const ListDecisionsQueryParams = zod.object({
  "org_id": zod.uuid(),
  "branch_id": zod.uuid().optional(),
  "limit": zod.number().optional()
})

export const ListDecisionsResponseItem = zod.object({
  "action": zod.string(),
  "baseline": zod.looseObject({

}),
  "branch_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "detail": zod.looseObject({

}),
  "id": zod.uuid(),
  "impact": zod.looseObject({

}).describe('Measured after-window aggregate; `null` until ≥1 day of after-data.'),
  "impact_complete": zod.boolean().describe('True once the full baseline window has elapsed since the decision.'),
  "item_name": zod.string(),
  "menu_item_id": zod.uuid(),
  "signal_kind": zod.string(),
  "size_label": zod.string()
})
export const ListDecisionsResponse = zod.array(ListDecisionsResponseItem)


export const CreateDecisionQueryParams = zod.object({
  "org_id": zod.uuid()
})

export const CreateDecisionBody = zod.object({
  "action": zod.string().describe('`acted` | `dismissed` | `snoozed`.'),
  "branch_id": zod.uuid().nullish(),
  "detail": zod.looseObject({

}).optional(),
  "menu_item_id": zod.uuid(),
  "signal_kind": zod.string(),
  "size_label": zod.string().optional()
})

export const CreateDecisionResponse = zod.object({
  "action": zod.string(),
  "baseline": zod.looseObject({

}),
  "branch_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "detail": zod.looseObject({

}),
  "id": zod.uuid(),
  "impact": zod.looseObject({

}).describe('Measured after-window aggregate; `null` until ≥1 day of after-data.'),
  "impact_complete": zod.boolean().describe('True once the full baseline window has elapsed since the decision.'),
  "item_name": zod.string(),
  "menu_item_id": zod.uuid(),
  "signal_kind": zod.string(),
  "size_label": zod.string()
})


export const GetMarginTargetsQueryParams = zod.object({
  "org_id": zod.uuid()
})

export const GetMarginTargetsResponse = zod.object({
  "branches": zod.array(zod.object({
  "branch_id": zod.uuid(),
  "target_pct": zod.number()
})),
  "builtin_default_pct": zod.number(),
  "org_default_pct": zod.number().nullish()
})


export const PutMarginTargetQueryParams = zod.object({
  "org_id": zod.uuid()
})

export const PutMarginTargetBody = zod.object({
  "branch_id": zod.uuid().nullish().describe('Omit for the org default; set for a branch override.'),
  "target_pct": zod.number()
})

export const PutMarginTargetResponse = zod.object({
  "branches": zod.array(zod.object({
  "branch_id": zod.uuid(),
  "target_pct": zod.number()
})),
  "builtin_default_pct": zod.number(),
  "org_default_pct": zod.number().nullish()
})


export const AnalyticsOrdersQueryParams = zod.object({
  "from": zod.iso.date().describe('First business day to include, `YYYY-MM-DD`, in the branch\'s timezone.'),
  "to": zod.iso.date().describe('Last business day to include, `YYYY-MM-DD`, INCLUSIVE.'),
  "limit": zod.number().optional().describe('Optional page size (max 5000). Omit for the whole window.'),
  "offset": zod.number().optional().describe('Optional row offset, used with `limit`. Defaults to 0.')
})

export const AnalyticsOrdersResponse = zod.object({
  "avg_order_total": zod.number().describe('`total_revenue \/ total_orders`, truncated to whole piastres. 0 when the\nwindow is empty.'),
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "from": zod.iso.date(),
  "from_utc": zod.iso.datetime({"offset":true}).describe('The exact half-open instant window `[from_utc, to_utc)` the figures\ncover, echoed so there is never a question about what was included.'),
  "limit": zod.number().nullish().describe('Echo of the paging actually applied, and how many rows came back.'),
  "offset": zod.number(),
  "orders": zod.array(zod.object({
  "business_date": zod.iso.date().describe('Calendar day the order belongs to, in the branch\'s timezone. Derived\nfrom `created_at` — the SAME derivation the receipt\'s `order_ref` uses,\nso the date here always matches the date embedded in that reference.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "discount_amount": zod.number(),
  "order_id": zod.uuid(),
  "order_number": zod.number().describe('Per-shift sequence number shown on the POS.'),
  "order_ref": zod.string().nullish().describe('The human-readable reference printed on the receipt\n(`<BRANCHCODE>-<YYMMDD>-<NNNN>`). Null for orders predating it.'),
  "service_charge": zod.number().describe('Always 0: Madar has no service-charge concept. Present so the field is\nstable if one is ever introduced.'),
  "status": zod.string(),
  "subtotal": zod.number().describe('Piastres. Sum of the line items before discount and tax.'),
  "tax_amount": zod.number(),
  "total_amount": zod.number().describe('`subtotal - discount_amount + tax_amount`. Deliberately COMPUTED rather\nthan read from `orders.total_amount`, which also carries the delivery\nfee — this figure is the order\'s own value and nothing else. Tips are\nexcluded too (they are not part of `total_amount` in the first place).')
}).describe('One order, reduced to the money that belongs to the order itself.')),
  "returned": zod.number(),
  "subtotal": zod.number(),
  "timezone": zod.string().describe('IANA zone the business days were resolved in.'),
  "to": zod.iso.date(),
  "to_utc": zod.iso.datetime({"offset":true}),
  "total_discount": zod.number(),
  "total_orders": zod.number().describe('Orders in the window. Voided and refunded orders are excluded here and\neverywhere below, as are orders tendered with a payment method the\nmerchant has hidden from partners — none are returned at all.'),
  "total_revenue": zod.number().describe('Sum of the per-order `total_amount`.'),
  "total_service_charge": zod.number(),
  "total_tax": zod.number()
})


export const ListCredentialsResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "last_used_at": zod.iso.datetime({"offset":true}).nullish().describe('Last successful authentication, or null if the partner has never pulled.'),
  "name": zod.string(),
  "revoked_at": zod.iso.datetime({"offset":true}).nullish(),
  "username": zod.string()
})
export const ListCredentialsResponse = zod.array(ListCredentialsResponseItem)


export const CreateCredentialBody = zod.object({
  "branch_id": zod.uuid().describe('The single branch this credential may read.'),
  "name": zod.string().describe('Operator-facing label, e.g. \"Rue — One Ninety\".'),
  "username": zod.string().describe('Basic-auth username. Unique across all orgs, case-insensitively.')
})

export const CreateCredentialResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "last_used_at": zod.iso.datetime({"offset":true}).nullish().describe('Last successful authentication, or null if the partner has never pulled.'),
  "name": zod.string(),
  "revoked_at": zod.iso.datetime({"offset":true}).nullish(),
  "username": zod.string()
}).and(zod.object({
  "secret": zod.string()
})).describe('Returned ONLY by create and rotate. The secret is bcrypt-hashed on the way\nin and is not recoverable afterwards, so the dashboard must show it once and\ntell the operator to copy it.')


export const RevokeCredentialParams = zod.object({
  "id": zod.uuid().describe('Credential ID')
})

export const RevokeCredentialResponse = zod.void()


export const RotateCredentialParams = zod.object({
  "id": zod.uuid().describe('Credential ID')
})

export const RotateCredentialResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "last_used_at": zod.iso.datetime({"offset":true}).nullish().describe('Last successful authentication, or null if the partner has never pulled.'),
  "name": zod.string(),
  "revoked_at": zod.iso.datetime({"offset":true}).nullish(),
  "username": zod.string()
}).and(zod.object({
  "secret": zod.string()
})).describe('Returned ONLY by create and rotate. The secret is bcrypt-hashed on the way\nin and is not recoverable afterwards, so the dashboard must show it once and\ntell the operator to copy it.')


export const ListMovementsParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const ListMovementsQueryParams = zod.object({
  "org_ingredient_id": zod.uuid().optional(),
  "type": zod.string().optional(),
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "page": zod.number().optional(),
  "per_page": zod.number().optional()
})

export const ListMovementsResponseItem = zod.object({
  "balance_after": zod.number(),
  "below_zero": zod.boolean(),
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch name; only populated by the all-branches waste roll-up (nil\n{branch_id}). `None` for single-branch queries that do not select it.'),
  "branch_stock_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "created_by_name": zod.string().nullish(),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "movement_type": zod.string().describe('inventory_movement_type: sale | void_restock | adjustment_add |\nadjustment_remove | waste | transfer_out | transfer_in | purchase_in |\npurchase_return | stock_count'),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.uuid(),
  "quantity": zod.number().describe('Signed delta applied to stock (consumption negative, replenishment positive).'),
  "reason": zod.string().nullish(),
  "source_id": zod.uuid().nullish(),
  "source_type": zod.string().nullish(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit at movement time; `null` ⟺ unknown.')
})
export const ListMovementsResponse = zod.array(ListMovementsResponseItem)


export const ListBranchStockParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const ListBranchStockResponseItem = zod.object({
  "below_par": zod.boolean(),
  "branch_id": zod.uuid(),
  "category_id": zod.uuid(),
  "category_name": zod.string(),
  "category_slug": zod.string(),
  "cost_per_unit": zod.number().nullish().describe('This branch\'s actual (weighted-average) cost, falling back to the org\nstandard cost. Piastres per unit; `null` ⟺ unknown.'),
  "description": zod.string().nullish(),
  "has_activity": zod.boolean(),
  "ingredient_name": zod.string(),
  "last_counted_at": zod.iso.datetime({"offset":true}).nullish().describe('Last finalized stock count that included this ingredient; `null` = never.'),
  "last_movement_at": zod.iso.datetime({"offset":true}).nullish().describe('Last ledger movement of any kind; `null` = never.'),
  "on_hand": zod.number().describe('Book stock in the base unit. May be negative (sold past zero, flagged).'),
  "org_ingredient_id": zod.uuid(),
  "par_max": zod.number().nullish().describe('Order-up-to level for reorder suggestions.'),
  "par_min": zod.number().nullish().describe('Reorder point: below-par when `on_hand <= par_min` and `par_min > 0`.'),
  "unit": zod.string()
}).describe('One catalog ingredient as seen from a branch. Every live catalog ingredient\nappears exactly once; `has_activity = false` means the branch has never\nmoved or counted it (on hand is 0 and every date is null).')
export const ListBranchStockResponse = zod.array(ListBranchStockResponseItem)


export const SetParLevelsParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID'),
  "org_ingredient_id": zod.uuid().describe('Ingredient ID')
})

export const SetParLevelsBody = zod.object({
  "par_max": zod.number().nullish(),
  "par_min": zod.number().nullish()
}).describe('Par levels for one ingredient at one branch. `null` clears a level.')

export const SetParLevelsResponse = zod.object({
  "below_par": zod.boolean(),
  "branch_id": zod.uuid(),
  "category_id": zod.uuid(),
  "category_name": zod.string(),
  "category_slug": zod.string(),
  "cost_per_unit": zod.number().nullish().describe('This branch\'s actual (weighted-average) cost, falling back to the org\nstandard cost. Piastres per unit; `null` ⟺ unknown.'),
  "description": zod.string().nullish(),
  "has_activity": zod.boolean(),
  "ingredient_name": zod.string(),
  "last_counted_at": zod.iso.datetime({"offset":true}).nullish().describe('Last finalized stock count that included this ingredient; `null` = never.'),
  "last_movement_at": zod.iso.datetime({"offset":true}).nullish().describe('Last ledger movement of any kind; `null` = never.'),
  "on_hand": zod.number().describe('Book stock in the base unit. May be negative (sold past zero, flagged).'),
  "org_ingredient_id": zod.uuid(),
  "par_max": zod.number().nullish().describe('Order-up-to level for reorder suggestions.'),
  "par_min": zod.number().nullish().describe('Reorder point: below-par when `on_hand <= par_min` and `par_min > 0`.'),
  "unit": zod.string()
}).describe('One catalog ingredient as seen from a branch. Every live catalog ingredient\nappears exactly once; `has_activity = false` means the branch has never\nmoved or counted it (on hand is 0 and every date is null).')


export const ListTransfersParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const ListTransfersQueryParams = zod.object({
  "direction": zod.string().optional(),
  "limit": zod.number().optional(),
  "offset": zod.number().optional()
})

export const ListTransfersResponseItem = zod.object({
  "destination_branch_id": zod.uuid(),
  "destination_branch_name": zod.string(),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "initiated_at": zod.iso.datetime({"offset":true}),
  "initiated_by": zod.uuid(),
  "initiated_by_name": zod.string(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "org_ingredient_id": zod.uuid(),
  "quantity": zod.number(),
  "source_branch_id": zod.uuid(),
  "source_branch_name": zod.string(),
  "unit": zod.string()
})
export const ListTransfersResponse = zod.array(ListTransfersResponseItem)


export const ListWasteParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const ListWasteQueryParams = zod.object({
  "limit": zod.number().optional(),
  "offset": zod.number().optional()
})

export const ListWasteResponseItem = zod.object({
  "balance_after": zod.number(),
  "below_zero": zod.boolean(),
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch name; only populated by the all-branches waste roll-up (nil\n{branch_id}). `None` for single-branch queries that do not select it.'),
  "branch_stock_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "created_by_name": zod.string().nullish(),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "movement_type": zod.string().describe('inventory_movement_type: sale | void_restock | adjustment_add |\nadjustment_remove | waste | transfer_out | transfer_in | purchase_in |\npurchase_return | stock_count'),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.uuid(),
  "quantity": zod.number().describe('Signed delta applied to stock (consumption negative, replenishment positive).'),
  "reason": zod.string().nullish(),
  "source_id": zod.uuid().nullish(),
  "source_type": zod.string().nullish(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit at movement time; `null` ⟺ unknown.')
})
export const ListWasteResponse = zod.array(ListWasteResponseItem)


export const CreateWasteParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const CreateWasteBody = zod.object({
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.uuid(),
  "quantity": zod.number(),
  "reason": zod.string().describe('expired | spoiled | damaged | overproduction | order_cancelled | theft | other\n(`order_cancelled` is normally auto-logged by void\/cancel, not entered here)')
})

export const CreateWasteResponse = zod.object({
  "balance_after": zod.number(),
  "below_zero": zod.boolean(),
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch name; only populated by the all-branches waste roll-up (nil\n{branch_id}). `None` for single-branch queries that do not select it.'),
  "branch_stock_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "created_by_name": zod.string().nullish(),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "movement_type": zod.string().describe('inventory_movement_type: sale | void_restock | adjustment_add |\nadjustment_remove | waste | transfer_out | transfer_in | purchase_in |\npurchase_return | stock_count'),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.uuid(),
  "quantity": zod.number().describe('Signed delta applied to stock (consumption negative, replenishment positive).'),
  "reason": zod.string().nullish(),
  "source_id": zod.uuid().nullish(),
  "source_type": zod.string().nullish(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit at movement time; `null` ⟺ unknown.')
})


export const ListCatalogParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const ListCatalogResponseItem = zod.object({
  "category_id": zod.uuid(),
  "category_name": zod.string(),
  "category_slug": zod.string(),
  "cost_per_unit": zod.number().nullish().describe('Standard (org default) cost, piastres per unit. `null` ⟺ never entered\n(unknown, NOT free) — recipes using this ingredient are cost-missing.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "density_g_per_ml": zod.number().nullish().describe('Grams per millilitre, bridging weight↔volume in recipes; `null` = none.'),
  "description": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "pack_size": zod.number().nullish().describe('How many BASE STOCK units one `pack_unit` yields; `null` = none.'),
  "pack_unit": zod.string().nullish().describe('Named purchase pack (e.g. \"case\", \"sack\"); `null` = none.'),
  "supplier_id": zod.uuid().nullish().describe('Default supplier for reordering this ingredient; `null` = none set.'),
  "supplier_name": zod.string().nullish(),
  "unit": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "yield_pct": zod.number().nullish().describe('Usable % after trim\/cook loss (e.g. 70 = 70%); `null` = 100%.')
})
export const ListCatalogResponse = zod.array(ListCatalogResponseItem)


export const CreateCatalogItemParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const CreateCatalogItemBody = zod.object({
  "category_id": zod.uuid().nullish().describe('Omitted ⟹ the org\'s `general` category.'),
  "cost_per_unit": zod.number().nullish(),
  "density_g_per_ml": zod.number().nullish(),
  "description": zod.string().nullish(),
  "name": zod.string(),
  "pack_size": zod.number().nullish(),
  "pack_unit": zod.string().nullish(),
  "supplier_id": zod.uuid().nullish(),
  "unit": zod.string(),
  "yield_pct": zod.number().nullish()
})

export const CreateCatalogItemResponse = zod.object({
  "category_id": zod.uuid(),
  "category_name": zod.string(),
  "category_slug": zod.string(),
  "cost_per_unit": zod.number().nullish().describe('Standard (org default) cost, piastres per unit. `null` ⟺ never entered\n(unknown, NOT free) — recipes using this ingredient are cost-missing.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "density_g_per_ml": zod.number().nullish().describe('Grams per millilitre, bridging weight↔volume in recipes; `null` = none.'),
  "description": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "pack_size": zod.number().nullish().describe('How many BASE STOCK units one `pack_unit` yields; `null` = none.'),
  "pack_unit": zod.string().nullish().describe('Named purchase pack (e.g. \"case\", \"sack\"); `null` = none.'),
  "supplier_id": zod.uuid().nullish().describe('Default supplier for reordering this ingredient; `null` = none set.'),
  "supplier_name": zod.string().nullish(),
  "unit": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "yield_pct": zod.number().nullish().describe('Usable % after trim\/cook loss (e.g. 70 = 70%); `null` = 100%.')
})


export const DeleteCatalogItemParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID'),
  "id": zod.uuid().describe('Ingredient ID')
})

export const DeleteCatalogItemResponse = zod.void()


export const UpdateCatalogItemParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID'),
  "id": zod.uuid().describe('Ingredient ID')
})

export const UpdateCatalogItemBody = zod.object({
  "category_id": zod.uuid().nullish(),
  "cost_per_unit": zod.number().nullish(),
  "density_g_per_ml": zod.number().nullish(),
  "description": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "pack_size": zod.number().nullish(),
  "pack_unit": zod.string().nullish(),
  "supplier_id": zod.uuid().nullish().describe('Set\/replace the default supplier (omitted = unchanged).'),
  "unit": zod.string().nullish(),
  "yield_pct": zod.number().nullish()
})

export const UpdateCatalogItemResponse = zod.object({
  "category_id": zod.uuid(),
  "category_name": zod.string(),
  "category_slug": zod.string(),
  "cost_per_unit": zod.number().nullish().describe('Standard (org default) cost, piastres per unit. `null` ⟺ never entered\n(unknown, NOT free) — recipes using this ingredient are cost-missing.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "density_g_per_ml": zod.number().nullish().describe('Grams per millilitre, bridging weight↔volume in recipes; `null` = none.'),
  "description": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "pack_size": zod.number().nullish().describe('How many BASE STOCK units one `pack_unit` yields; `null` = none.'),
  "pack_unit": zod.string().nullish().describe('Named purchase pack (e.g. \"case\", \"sack\"); `null` = none.'),
  "supplier_id": zod.uuid().nullish().describe('Default supplier for reordering this ingredient; `null` = none set.'),
  "supplier_name": zod.string().nullish(),
  "unit": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "yield_pct": zod.number().nullish().describe('Usable % after trim\/cook loss (e.g. 70 = 70%); `null` = 100%.')
})


export const ListIngredientCategoriesParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const ListIngredientCategoriesResponseItem = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_count": zod.number().describe('Live (non-deleted) ingredients in this category.'),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "slug": zod.string().describe('Stable machine key (`general`, `milk`, `coffee_bean`, …). `milk` and\n`coffee_bean` carry swap semantics in the menu; the slug never changes.'),
  "sort_order": zod.number(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListIngredientCategoriesResponse = zod.array(ListIngredientCategoriesResponseItem)


export const CreateIngredientCategoryParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const CreateIngredientCategoryBody = zod.object({
  "name": zod.string(),
  "slug": zod.string().nullish().describe('Optional explicit slug (`[a-z0-9_]`); derived from the name when omitted.'),
  "sort_order": zod.number().nullish()
})

export const CreateIngredientCategoryResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_count": zod.number().describe('Live (non-deleted) ingredients in this category.'),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "slug": zod.string().describe('Stable machine key (`general`, `milk`, `coffee_bean`, …). `milk` and\n`coffee_bean` carry swap semantics in the menu; the slug never changes.'),
  "sort_order": zod.number(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteIngredientCategoryParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID'),
  "id": zod.uuid().describe('Category ID')
})

export const DeleteIngredientCategoryQueryParams = zod.object({
  "reassign_to": zod.uuid().optional().describe('Category that ingredients in the deleted one move to. Required when the\ncategory still has ingredients.')
})

export const DeleteIngredientCategoryResponse = zod.void()


export const UpdateIngredientCategoryParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID'),
  "id": zod.uuid().describe('Category ID')
})

export const UpdateIngredientCategoryBody = zod.object({
  "name": zod.string().nullish(),
  "sort_order": zod.number().nullish()
})

export const UpdateIngredientCategoryResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_count": zod.number().describe('Live (non-deleted) ingredients in this category.'),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "slug": zod.string().describe('Stable machine key (`general`, `milk`, `coffee_bean`, …). `milk` and\n`coffee_bean` carry swap semantics in the menu; the slug never changes.'),
  "sort_order": zod.number(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const GetInventorySettingsParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const GetInventorySettingsResponse = zod.object({
  "stocktake_variance_threshold_pct": zod.number().describe('Stock-count variance tolerance (percent). A counted row whose |difference|\nis at least this percent of book stock is flagged and needs a reason.')
})


export const UpdateInventorySettingsParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const UpdateInventorySettingsBody = zod.object({
  "stocktake_variance_threshold_pct": zod.number()
})

export const UpdateInventorySettingsResponse = zod.object({
  "stocktake_variance_threshold_pct": zod.number().describe('Stock-count variance tolerance (percent). A counted row whose |difference|\nis at least this percent of book stock is flagged and needs a reason.')
})


export const CreateTransferBody = zod.object({
  "source_branch_id": zod.uuid(),
  "destination_branch_id": zod.uuid(),
  "org_ingredient_id": zod.uuid(),
  "quantity": zod.number(),
  "note": zod.string().nullish()
})

export const CreateTransferResponse = zod.object({
  "destination_branch_id": zod.uuid(),
  "destination_branch_name": zod.string(),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "initiated_at": zod.iso.datetime({"offset":true}),
  "initiated_by": zod.uuid(),
  "initiated_by_name": zod.string(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "org_ingredient_id": zod.uuid(),
  "quantity": zod.number(),
  "source_branch_id": zod.uuid(),
  "source_branch_name": zod.string(),
  "unit": zod.string()
})


export const DeleteTransferParams = zod.object({
  "id": zod.uuid().describe('Transfer ID')
})

export const DeleteTransferResponse = zod.void()


export const UpdateTransferParams = zod.object({
  "id": zod.uuid().describe('Transfer ID')
})

export const UpdateTransferBody = zod.object({
  "note": zod.string().nullish()
})

export const UpdateTransferResponse = zod.object({
  "destination_branch_id": zod.uuid(),
  "destination_branch_name": zod.string(),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "initiated_at": zod.iso.datetime({"offset":true}),
  "initiated_by": zod.uuid(),
  "initiated_by_name": zod.string(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "org_ingredient_id": zod.uuid(),
  "quantity": zod.number(),
  "source_branch_id": zod.uuid(),
  "source_branch_name": zod.string(),
  "unit": zod.string()
})


export const BumpParams = zod.object({
  "item_id": zod.uuid().describe('Kitchen line ID')
})

export const BumpResponse = zod.void()


export const UnbumpParams = zod.object({
  "item_id": zod.uuid().describe('Kitchen line ID')
})

export const UnbumpResponse = zod.void()


/**
 * @summary Outstanding kitchen tickets for a branch (those with at least one un-bumped,
un-voided line — for the given station if provided), oldest first. Seed for
the KDS; live updates arrive on `/realtime/stream?topics=kitchen`.
 */
export const FeedQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "station_id": zod.uuid().optional().describe('Optional station filter — only tickets with pending work for this station.\n(Items are returned in full; the client greys\/filters by station.)')
})

export const FeedResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "items": zod.array(zod.object({
  "bumped": zod.boolean(),
  "id": zod.uuid(),
  "line": zod.unknown(),
  "qty": zod.number(),
  "station_id": zod.uuid().nullish(),
  "station_name": zod.string().nullish()
}).describe('A KDS line as displayed\/bumped.')),
  "kitchen_ref": zod.string().nullish(),
  "round_number": zod.number(),
  "source_id": zod.uuid(),
  "source_type": zod.string(),
  "status": zod.string(),
  "table_label": zod.string().nullish()
}).describe('One fire event projected for the kitchen (a round or a counter order).')
export const FeedResponse = zod.array(FeedResponseItem)


export const ListRoutesQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const ListRoutesResponse = zod.object({
  "categories": zod.array(zod.object({
  "category_id": zod.uuid(),
  "station_id": zod.uuid()
})),
  "items": zod.array(zod.object({
  "menu_item_id": zod.uuid(),
  "station_id": zod.uuid()
}))
})


export const PutCategoryRouteBody = zod.object({
  "branch_id": zod.uuid(),
  "category_id": zod.uuid(),
  "station_id": zod.uuid()
})

export const PutCategoryRouteResponse = zod.void()


export const DeleteCategoryRouteQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "category_id": zod.uuid()
})

export const DeleteCategoryRouteResponse = zod.void()


export const PutItemRouteBody = zod.object({
  "branch_id": zod.uuid(),
  "menu_item_id": zod.uuid(),
  "station_id": zod.uuid()
})

export const PutItemRouteResponse = zod.void()


export const DeleteItemRouteQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "menu_item_id": zod.uuid()
})

export const DeleteItemRouteResponse = zod.void()


export const GetRoutingModeQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const GetRoutingModeResponse = zod.object({
  "effective": zod.string().describe('What actually applies right now (auto resolves to kds-if-stations-else-till).'),
  "mode": zod.string().nullish().describe('Stored override (`kds` | `till` | `both`), or null when auto.')
})


export const SetRoutingModeBody = zod.object({
  "branch_id": zod.uuid(),
  "mode": zod.string().nullish().describe('`kds` | `till` | `both`, or null to clear the override (back to auto).')
})

export const SetRoutingModeResponse = zod.object({
  "effective": zod.string().describe('What actually applies right now (auto resolves to kds-if-stations-else-till).'),
  "mode": zod.string().nullish().describe('Stored override (`kds` | `till` | `both`), or null when auto.')
})


export const ListStationsQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const ListStationsResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.uuid(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "sort_order": zod.number(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListStationsResponse = zod.array(ListStationsResponseItem)


export const CreateStationBody = zod.object({
  "branch_id": zod.uuid(),
  "is_active": zod.boolean().nullish(),
  "is_default": zod.boolean().nullish(),
  "name": zod.string(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "sort_order": zod.number().nullish()
})

export const CreateStationResponse = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.uuid(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "sort_order": zod.number(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteStationParams = zod.object({
  "id": zod.uuid().describe('Station ID')
})

export const DeleteStationResponse = zod.void()


export const UpdateStationParams = zod.object({
  "id": zod.uuid().describe('Station ID')
})

export const UpdateStationBody = zod.object({
  "is_active": zod.boolean().nullish(),
  "is_default": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "sort_order": zod.number().nullish()
})

export const UpdateStationResponse = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "org_id": zod.uuid(),
  "printer_brand": zod.union([zod.null(),zod.enum(['star', 'epson'])]).optional(),
  "printer_ip": zod.string().nullish(),
  "printer_port": zod.number().nullish(),
  "sort_order": zod.number(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const PutSizeRecipeParams = zod.object({
  "size_id": zod.uuid().describe('menu_item_sizes ID')
})

export const PutSizeRecipeBody = zod.object({
  "lines": zod.array(zod.object({
  "ingredient_id": zod.uuid(),
  "quantity": zod.number().describe('Submitted quantity (in `unit`); server normalizes to the ingredient base unit.'),
  "unit": zod.string()
}))
})

export const PutSizeRecipeResponse = zod.object({
  "catalog_revision": zod.number(),
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.')),
  "size_id": zod.uuid()
}).describe('Result of a recipe replace: the recomputed size cost.')


export const ListMenuItemsQueryParams = zod.object({
  "org_id": zod.uuid(),
  "category_id": zod.uuid().optional(),
  "full": zod.boolean().optional().describe('When true, embed sizes + addon slots + optionals + recipes per item\n(the shape the POS\/teller consumes). Always returns a plain, unpaginated\narray — the POS depends on this contract.'),
  "branch_id": zod.uuid().optional().describe('When set, prices are branch-effective (branch override replaces base_price)\nand items disabled at this branch are excluded — the per-branch menu the POS\nconsumes. Omitted → the plain org catalog (legacy behaviour).')
})

export const ListMenuItemsResponseItem = zod.object({
  "base_price": zod.number(),
  "category_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.iso.datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.looseObject({

}),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListMenuItemsResponse = zod.array(ListMenuItemsResponseItem)


export const CreateMenuItemBody = zod.object({
  "base_price": zod.number(),
  "category_id": zod.uuid(),
  "description": zod.string().nullish(),
  "description_translations": zod.looseObject({

}).nullish(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}).nullish(),
  "org_id": zod.uuid()
})

export const CreateMenuItemResponse = zod.object({
  "base_price": zod.number(),
  "category_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.iso.datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.looseObject({

}),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "addon_slots": zod.array(zod.object({
  "addon_type": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "label_translations": zod.looseObject({

}),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.uuid(),
  "min_selections": zod.number()
})),
  "allowed_addon_ids": zod.array(zod.uuid()).describe('Explicit per-item addon allowlist. Empty = no restriction (use org catalog).'),
  "optional_fields": zod.array(zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.uuid(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_ingredient_id": zod.uuid().nullish(),
  "price": zod.number(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})),
  "recipe_steps": zod.array(zod.object({
  "animation_sha256": zod.string().nullish(),
  "animation_url": zod.string().nullish().describe('Present only for a preset whose animation still ships. `None` on a\ncustom step, and on a retired preset — clients show the name alone.'),
  "kind": zod.string().describe('`preset` | `custom`.'),
  "name": zod.string().describe('The preset\'s name, or the typed name of a custom step.'),
  "name_ar": zod.string(),
  "note": zod.string().nullish(),
  "note_ar": zod.string().nullish(),
  "position": zod.number(),
  "preset_slug": zod.string().nullish().describe('The preset this step uses, if any.')
}).describe('One step, resolved for display: whatever its kind, it has a name, and a\npreset step also carries its note and the animation to play.')).optional().describe('How the item is made, in order. Each preset step carries its animation\'s\naddress and fingerprint, so a device downloads only what its own menu\nuses and never the whole library.'),
  "recipes": zod.array(zod.object({
  "category": zod.string(),
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number(),
  "size_label": zod.string()
})),
  "sizes": zod.array(zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "menu_item_id": zod.uuid(),
  "price_override": zod.number()
}))
}))


export const GetMenuItemParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const GetMenuItemResponse = zod.object({
  "base_price": zod.number(),
  "category_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.iso.datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.looseObject({

}),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "addon_slots": zod.array(zod.object({
  "addon_type": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "label_translations": zod.looseObject({

}),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.uuid(),
  "min_selections": zod.number()
})),
  "allowed_addon_ids": zod.array(zod.uuid()).describe('Explicit per-item addon allowlist. Empty = no restriction (use org catalog).'),
  "optional_fields": zod.array(zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.uuid(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_ingredient_id": zod.uuid().nullish(),
  "price": zod.number(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})),
  "recipe_steps": zod.array(zod.object({
  "animation_sha256": zod.string().nullish(),
  "animation_url": zod.string().nullish().describe('Present only for a preset whose animation still ships. `None` on a\ncustom step, and on a retired preset — clients show the name alone.'),
  "kind": zod.string().describe('`preset` | `custom`.'),
  "name": zod.string().describe('The preset\'s name, or the typed name of a custom step.'),
  "name_ar": zod.string(),
  "note": zod.string().nullish(),
  "note_ar": zod.string().nullish(),
  "position": zod.number(),
  "preset_slug": zod.string().nullish().describe('The preset this step uses, if any.')
}).describe('One step, resolved for display: whatever its kind, it has a name, and a\npreset step also carries its note and the animation to play.')).optional().describe('How the item is made, in order. Each preset step carries its animation\'s\naddress and fingerprint, so a device downloads only what its own menu\nuses and never the whole library.'),
  "recipes": zod.array(zod.object({
  "category": zod.string(),
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number(),
  "size_label": zod.string()
})),
  "sizes": zod.array(zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "menu_item_id": zod.uuid(),
  "price_override": zod.number()
}))
}))


export const DeleteMenuItemParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const DeleteMenuItemResponse = zod.void()


export const UpdateMenuItemParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const UpdateMenuItemBody = zod.object({
  "base_price": zod.number().nullish(),
  "category_id": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.looseObject({

}).nullish(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.looseObject({

}).nullish()
})

export const UpdateMenuItemResponse = zod.object({
  "base_price": zod.number(),
  "category_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_milk_addon_id": zod.string().nullish(),
  "deleted_at": zod.iso.datetime({"offset":true}).nullish(),
  "description": zod.string().nullish(),
  "description_translations": zod.looseObject({

}),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const ListAddonSlotsParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const ListAddonSlotsResponseItem = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "label_translations": zod.looseObject({

}),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.uuid(),
  "min_selections": zod.number()
})
export const ListAddonSlotsResponse = zod.array(ListAddonSlotsResponseItem)


export const CreateAddonSlotParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const CreateAddonSlotBody = zod.object({
  "addon_type": zod.string().nullish(),
  "is_required": zod.boolean().nullish(),
  "label": zod.string().nullish(),
  "label_translations": zod.looseObject({

}).nullish(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number().nullish()
})

export const CreateAddonSlotResponse = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "label_translations": zod.looseObject({

}),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.uuid(),
  "min_selections": zod.number()
})


export const DeleteAddonSlotParams = zod.object({
  "id": zod.uuid().describe('Menu item ID'),
  "slot_id": zod.uuid().describe('Addon slot ID')
})

export const DeleteAddonSlotResponse = zod.void()


export const UpdateAddonSlotParams = zod.object({
  "id": zod.uuid().describe('Menu item ID'),
  "slot_id": zod.uuid().describe('Addon slot ID')
})

export const UpdateAddonSlotBody = zod.object({
  "is_required": zod.boolean().nullish(),
  "label": zod.string().nullish(),
  "label_translations": zod.looseObject({

}).nullish(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number().nullish()
})

export const UpdateAddonSlotResponse = zod.object({
  "addon_type": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_required": zod.boolean(),
  "label": zod.string().nullish(),
  "label_translations": zod.looseObject({

}),
  "max_selections": zod.number().nullish(),
  "menu_item_id": zod.uuid(),
  "min_selections": zod.number()
})


export const PutAllowedAddonsParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const PutAllowedAddonsBody = zod.object({
  "addon_item_ids": zod.array(zod.uuid()).describe('Full replacement set of addon item IDs allowed on this menu item.\nSend an empty array to clear the restriction (falls back to org catalog).')
})

export const PutAllowedAddonsResponseItem = zod.string()
export const PutAllowedAddonsResponse = zod.array(PutAllowedAddonsResponseItem)


export const GetItemCostParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const GetItemCostResponseItem = zod.object({
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish().describe('Recipe cost rollup in piastres. `null` = unknown (no priced ingredient),\nnever 0. A partial rollup returns the sum-so-far with `cost_incomplete=true`.'),
  "label": zod.string(),
  "size_id": zod.uuid()
}).describe('Live per-size cost of an item from the NEW tables.')
export const GetItemCostResponse = zod.array(GetItemCostResponseItem)


export const DuplicateItemParams = zod.object({
  "id": zod.uuid().describe('Menu item ID to duplicate')
})

export const DuplicateItemResponse = zod.object({
  "availability": zod.object({
  "branches": zod.array(zod.object({
  "branch_id": zod.uuid(),
  "channels": zod.array(zod.object({
  "channel": zod.string(),
  "sizes": zod.array(zod.object({
  "is_available": zod.boolean().nullish().describe('Override availability; `null` = inherit (defaults to available).'),
  "price": zod.number().nullish().describe('Override price in piastres; `null` = inherit the catalog default.'),
  "size_id": zod.uuid()
}).describe('Per-branch\/channel availability & price overrides for a single size.'))
})),
  "sizes": zod.array(zod.object({
  "is_available": zod.boolean().nullish().describe('Override availability; `null` = inherit (defaults to available).'),
  "price": zod.number().nullish().describe('Override price in piastres; `null` = inherit the catalog default.'),
  "size_id": zod.uuid()
}).describe('Per-branch\/channel availability & price overrides for a single size.'))
})),
  "org_active": zod.boolean()
}),
  "catalog_revision": zod.number(),
  "category_id": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "modifier_groups": zod.array(zod.object({
  "attachment_id": zod.uuid(),
  "group_id": zod.uuid(),
  "is_required": zod.boolean(),
  "legacy_addon_type": zod.string().nullish(),
  "max": zod.number().nullish(),
  "min": zod.number(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish().describe('Option recipe cost in piastres (swap markers cost 0). `null` = unknown.'),
  "id": zod.uuid(),
  "included": zod.boolean().describe('`false` = the group offers this option but it is not enabled on this item\n(item\'s `included_option_ids` allowlist excludes it).'),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.')),
  "replaces_ingredient_id": zod.uuid().nullish()
}).describe('A modifier option inside an attached group.')),
  "selection_type": zod.string(),
  "sort": zod.number()
}).describe('A reusable modifier group attached to this item, with min\/max\/required resolved\nfrom the attachment overrides (falling back to the group defaults).')),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.'))
}).describe('A priced optional — a member of the item-private `Options` group\n(a modifier_group with `legacy_addon_type IS NULL` owned by this item).')),
  "org_id": zod.uuid(),
  "recipe_steps": zod.array(zod.object({
  "animation_sha256": zod.string().nullish(),
  "animation_url": zod.string().nullish().describe('Present only for a preset whose animation still ships. `None` on a\ncustom step, and on a retired preset — clients show the name alone.'),
  "kind": zod.string().describe('`preset` | `custom`.'),
  "name": zod.string().describe('The preset\'s name, or the typed name of a custom step.'),
  "name_ar": zod.string(),
  "note": zod.string().nullish(),
  "note_ar": zod.string().nullish(),
  "position": zod.number(),
  "preset_slug": zod.string().nullish().describe('The preset this step uses, if any.')
}).describe('One step, resolved for display: whatever its kind, it has a name, and a\npreset step also carries its note and the animation to play.')).describe('How the item is made, in order. Edited through `PUT \/recipes\/steps\/{id}`\nand saved by the studio alongside the recipe lines.'),
  "sizes": zod.array(zod.object({
  "cost_incomplete": zod.boolean().describe('`true` when at least one recipe line is unlinked\/uncosted (so `cost_piastres`, if\npresent, is a partial figure rather than the full COGS).'),
  "cost_piastres": zod.number().nullish().describe('Recipe cost rollup in piastres over the priced ingredients. `null` when there is\nno recipe or nothing is priced; a partial rollup returns the sum-so-far with\n`cost_incomplete = true`.'),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.')),
  "sort": zod.number()
}).describe('A size (menu_item_sizes row) with its recipe and live cost.')),
  "used_in_bundles": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "name": zod.string()
}))
}).describe('The full item aggregate the one-page Menu Studio editor renders.')


export const PutModifierGroupsParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const PutModifierGroupsBody = zod.object({
  "groups": zod.array(zod.object({
  "group_id": zod.uuid(),
  "included_option_ids": zod.array(zod.uuid()).nullish().describe('`null` = offer all of the group\'s options; else the allowlisted subset.'),
  "is_required_override": zod.boolean().nullish(),
  "max_override": zod.number().nullish(),
  "min_override": zod.number().nullish(),
  "sort": zod.number().optional()
}))
})

export const PutModifierGroupsResponse = zod.object({
  "availability": zod.object({
  "branches": zod.array(zod.object({
  "branch_id": zod.uuid(),
  "channels": zod.array(zod.object({
  "channel": zod.string(),
  "sizes": zod.array(zod.object({
  "is_available": zod.boolean().nullish().describe('Override availability; `null` = inherit (defaults to available).'),
  "price": zod.number().nullish().describe('Override price in piastres; `null` = inherit the catalog default.'),
  "size_id": zod.uuid()
}).describe('Per-branch\/channel availability & price overrides for a single size.'))
})),
  "sizes": zod.array(zod.object({
  "is_available": zod.boolean().nullish().describe('Override availability; `null` = inherit (defaults to available).'),
  "price": zod.number().nullish().describe('Override price in piastres; `null` = inherit the catalog default.'),
  "size_id": zod.uuid()
}).describe('Per-branch\/channel availability & price overrides for a single size.'))
})),
  "org_active": zod.boolean()
}),
  "catalog_revision": zod.number(),
  "category_id": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "modifier_groups": zod.array(zod.object({
  "attachment_id": zod.uuid(),
  "group_id": zod.uuid(),
  "is_required": zod.boolean(),
  "legacy_addon_type": zod.string().nullish(),
  "max": zod.number().nullish(),
  "min": zod.number(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish().describe('Option recipe cost in piastres (swap markers cost 0). `null` = unknown.'),
  "id": zod.uuid(),
  "included": zod.boolean().describe('`false` = the group offers this option but it is not enabled on this item\n(item\'s `included_option_ids` allowlist excludes it).'),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.')),
  "replaces_ingredient_id": zod.uuid().nullish()
}).describe('A modifier option inside an attached group.')),
  "selection_type": zod.string(),
  "sort": zod.number()
}).describe('A reusable modifier group attached to this item, with min\/max\/required resolved\nfrom the attachment overrides (falling back to the group defaults).')),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.'))
}).describe('A priced optional — a member of the item-private `Options` group\n(a modifier_group with `legacy_addon_type IS NULL` owned by this item).')),
  "org_id": zod.uuid(),
  "recipe_steps": zod.array(zod.object({
  "animation_sha256": zod.string().nullish(),
  "animation_url": zod.string().nullish().describe('Present only for a preset whose animation still ships. `None` on a\ncustom step, and on a retired preset — clients show the name alone.'),
  "kind": zod.string().describe('`preset` | `custom`.'),
  "name": zod.string().describe('The preset\'s name, or the typed name of a custom step.'),
  "name_ar": zod.string(),
  "note": zod.string().nullish(),
  "note_ar": zod.string().nullish(),
  "position": zod.number(),
  "preset_slug": zod.string().nullish().describe('The preset this step uses, if any.')
}).describe('One step, resolved for display: whatever its kind, it has a name, and a\npreset step also carries its note and the animation to play.')).describe('How the item is made, in order. Edited through `PUT \/recipes\/steps\/{id}`\nand saved by the studio alongside the recipe lines.'),
  "sizes": zod.array(zod.object({
  "cost_incomplete": zod.boolean().describe('`true` when at least one recipe line is unlinked\/uncosted (so `cost_piastres`, if\npresent, is a partial figure rather than the full COGS).'),
  "cost_piastres": zod.number().nullish().describe('Recipe cost rollup in piastres over the priced ingredients. `null` when there is\nno recipe or nothing is priced; a partial rollup returns the sum-so-far with\n`cost_incomplete = true`.'),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.')),
  "sort": zod.number()
}).describe('A size (menu_item_sizes row) with its recipe and live cost.')),
  "used_in_bundles": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "name": zod.string()
}))
}).describe('The full item aggregate the one-page Menu Studio editor renders.')


export const ListOptionalFieldsParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const ListOptionalFieldsResponseItem = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.uuid(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_ingredient_id": zod.uuid().nullish(),
  "price": zod.number(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListOptionalFieldsResponse = zod.array(ListOptionalFieldsResponseItem)


export const CreateOptionalFieldParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const CreateOptionalFieldBody = zod.object({
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}).nullish(),
  "org_ingredient_id": zod.uuid().nullish(),
  "price": zod.number().nullish(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish()
})

export const CreateOptionalFieldResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.uuid(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_ingredient_id": zod.uuid().nullish(),
  "price": zod.number(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteOptionalFieldParams = zod.object({
  "id": zod.uuid().describe('Menu item ID'),
  "field_id": zod.uuid().describe('Field ID')
})

export const DeleteOptionalFieldResponse = zod.void()


export const UpdateOptionalFieldParams = zod.object({
  "id": zod.uuid().describe('Menu item ID'),
  "field_id": zod.uuid().describe('Field ID')
})

export const UpdateOptionalFieldBody = zod.object({
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.looseObject({

}).nullish(),
  "org_ingredient_id": zod.uuid().nullish(),
  "price": zod.number().nullish(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish()
})

export const UpdateOptionalFieldResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "is_active": zod.boolean(),
  "menu_item_id": zod.uuid(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "org_ingredient_id": zod.uuid().nullish(),
  "price": zod.number(),
  "quantity_used": zod.number().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const PutItemOptionsParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const PutItemOptionsBody = zod.object({
  "options": zod.array(zod.object({
  "id": zod.uuid().nullish(),
  "is_active": zod.boolean().optional(),
  "name": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "ingredient_id": zod.uuid(),
  "quantity": zod.number(),
  "unit": zod.string()
}).describe('One recipe line as submitted to the option-recipe replace endpoint. `quantity`\nmay be 0 (a swap marker). Server normalizes to the ingredient base unit.')).nullish().describe('`null` = keep no recipe; else the option\'s replace-set of recipe lines.')
}).describe('One priced optional in the item\'s per-item `Options` set. `id` present ⇒ update\nthat option; absent ⇒ create a new one. `recipe` null ⇒ leave the option with no\nrecipe lines; else the replace-set of its lines.'))
})

export const PutItemOptionsResponseItem = zod.object({
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.'))
}).describe('A priced optional — a member of the item-private `Options` group\n(a modifier_group with `legacy_addon_type IS NULL` owned by this item).')
export const PutItemOptionsResponse = zod.array(PutItemOptionsResponseItem)


export const ListAddonOverridesParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const ListAddonOverridesResponseItem = zod.object({
  "addon_item_id": zod.uuid(),
  "addon_item_name": zod.string(),
  "combo_addon_item_id": zod.uuid().nullish(),
  "combo_addon_item_name": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "menu_item_id": zod.uuid(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number(),
  "replaces_ingredient_name": zod.string().nullish(),
  "replaces_org_ingredient_id": zod.uuid().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListAddonOverridesResponse = zod.array(ListAddonOverridesResponseItem)


export const UpsertAddonOverrideParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const UpsertAddonOverrideBody = zod.object({
  "addon_item_id": zod.uuid(),
  "combo_addon_item_id": zod.uuid().nullish(),
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number(),
  "replaces_org_ingredient_id": zod.uuid().nullish(),
  "size_label": zod.string().nullish()
})

export const UpsertAddonOverrideResponse = zod.object({
  "addon_item_id": zod.uuid(),
  "addon_item_name": zod.string(),
  "combo_addon_item_id": zod.uuid().nullish(),
  "combo_addon_item_name": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "menu_item_id": zod.uuid(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number(),
  "replaces_ingredient_name": zod.string().nullish(),
  "replaces_org_ingredient_id": zod.uuid().nullish(),
  "size_label": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteAddonOverrideParams = zod.object({
  "id": zod.uuid().describe('Menu item ID'),
  "override_id": zod.uuid().describe('Override ID')
})

export const DeleteAddonOverrideResponse = zod.void()


export const PutSizesParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const PutSizesBody = zod.object({
  "sizes": zod.array(zod.object({
  "is_active": zod.boolean().optional(),
  "label": zod.string(),
  "price": zod.number(),
  "sort": zod.number().optional()
}))
})

export const PutSizesResponse = zod.object({
  "availability": zod.object({
  "branches": zod.array(zod.object({
  "branch_id": zod.uuid(),
  "channels": zod.array(zod.object({
  "channel": zod.string(),
  "sizes": zod.array(zod.object({
  "is_available": zod.boolean().nullish().describe('Override availability; `null` = inherit (defaults to available).'),
  "price": zod.number().nullish().describe('Override price in piastres; `null` = inherit the catalog default.'),
  "size_id": zod.uuid()
}).describe('Per-branch\/channel availability & price overrides for a single size.'))
})),
  "sizes": zod.array(zod.object({
  "is_available": zod.boolean().nullish().describe('Override availability; `null` = inherit (defaults to available).'),
  "price": zod.number().nullish().describe('Override price in piastres; `null` = inherit the catalog default.'),
  "size_id": zod.uuid()
}).describe('Per-branch\/channel availability & price overrides for a single size.'))
})),
  "org_active": zod.boolean()
}),
  "catalog_revision": zod.number(),
  "category_id": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "modifier_groups": zod.array(zod.object({
  "attachment_id": zod.uuid(),
  "group_id": zod.uuid(),
  "is_required": zod.boolean(),
  "legacy_addon_type": zod.string().nullish(),
  "max": zod.number().nullish(),
  "min": zod.number(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish().describe('Option recipe cost in piastres (swap markers cost 0). `null` = unknown.'),
  "id": zod.uuid(),
  "included": zod.boolean().describe('`false` = the group offers this option but it is not enabled on this item\n(item\'s `included_option_ids` allowlist excludes it).'),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.')),
  "replaces_ingredient_id": zod.uuid().nullish()
}).describe('A modifier option inside an attached group.')),
  "selection_type": zod.string(),
  "sort": zod.number()
}).describe('A reusable modifier group attached to this item, with min\/max\/required resolved\nfrom the attachment overrides (falling back to the group defaults).')),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.'))
}).describe('A priced optional — a member of the item-private `Options` group\n(a modifier_group with `legacy_addon_type IS NULL` owned by this item).')),
  "org_id": zod.uuid(),
  "recipe_steps": zod.array(zod.object({
  "animation_sha256": zod.string().nullish(),
  "animation_url": zod.string().nullish().describe('Present only for a preset whose animation still ships. `None` on a\ncustom step, and on a retired preset — clients show the name alone.'),
  "kind": zod.string().describe('`preset` | `custom`.'),
  "name": zod.string().describe('The preset\'s name, or the typed name of a custom step.'),
  "name_ar": zod.string(),
  "note": zod.string().nullish(),
  "note_ar": zod.string().nullish(),
  "position": zod.number(),
  "preset_slug": zod.string().nullish().describe('The preset this step uses, if any.')
}).describe('One step, resolved for display: whatever its kind, it has a name, and a\npreset step also carries its note and the animation to play.')).describe('How the item is made, in order. Edited through `PUT \/recipes\/steps\/{id}`\nand saved by the studio alongside the recipe lines.'),
  "sizes": zod.array(zod.object({
  "cost_incomplete": zod.boolean().describe('`true` when at least one recipe line is unlinked\/uncosted (so `cost_piastres`, if\npresent, is a partial figure rather than the full COGS).'),
  "cost_piastres": zod.number().nullish().describe('Recipe cost rollup in piastres over the priced ingredients. `null` when there is\nno recipe or nothing is priced; a partial rollup returns the sum-so-far with\n`cost_incomplete = true`.'),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.')),
  "sort": zod.number()
}).describe('A size (menu_item_sizes row) with its recipe and live cost.')),
  "used_in_bundles": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "name": zod.string()
}))
}).describe('The full item aggregate the one-page Menu Studio editor renders.')


export const UpsertSizeParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const UpsertSizeBody = zod.object({
  "label": zod.string(),
  "price_override": zod.number()
})

export const UpsertSizeResponse = zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "menu_item_id": zod.uuid(),
  "price_override": zod.number()
})


export const DeleteSizeParams = zod.object({
  "id": zod.uuid().describe('Menu item ID'),
  "sid": zod.uuid().describe('Size ID')
})

export const DeleteSizeResponse = zod.void()


export const GetStudioParams = zod.object({
  "id": zod.uuid().describe('Menu item ID')
})

export const GetStudioResponse = zod.object({
  "availability": zod.object({
  "branches": zod.array(zod.object({
  "branch_id": zod.uuid(),
  "channels": zod.array(zod.object({
  "channel": zod.string(),
  "sizes": zod.array(zod.object({
  "is_available": zod.boolean().nullish().describe('Override availability; `null` = inherit (defaults to available).'),
  "price": zod.number().nullish().describe('Override price in piastres; `null` = inherit the catalog default.'),
  "size_id": zod.uuid()
}).describe('Per-branch\/channel availability & price overrides for a single size.'))
})),
  "sizes": zod.array(zod.object({
  "is_available": zod.boolean().nullish().describe('Override availability; `null` = inherit (defaults to available).'),
  "price": zod.number().nullish().describe('Override price in piastres; `null` = inherit the catalog default.'),
  "size_id": zod.uuid()
}).describe('Per-branch\/channel availability & price overrides for a single size.'))
})),
  "org_active": zod.boolean()
}),
  "catalog_revision": zod.number(),
  "category_id": zod.uuid().nullish(),
  "description": zod.string().nullish(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "is_active": zod.boolean(),
  "modifier_groups": zod.array(zod.object({
  "attachment_id": zod.uuid(),
  "group_id": zod.uuid(),
  "is_required": zod.boolean(),
  "legacy_addon_type": zod.string().nullish(),
  "max": zod.number().nullish(),
  "min": zod.number(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish().describe('Option recipe cost in piastres (swap markers cost 0). `null` = unknown.'),
  "id": zod.uuid(),
  "included": zod.boolean().describe('`false` = the group offers this option but it is not enabled on this item\n(item\'s `included_option_ids` allowlist excludes it).'),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.')),
  "replaces_ingredient_id": zod.uuid().nullish()
}).describe('A modifier option inside an attached group.')),
  "selection_type": zod.string(),
  "sort": zod.number()
}).describe('A reusable modifier group attached to this item, with min\/max\/required resolved\nfrom the attachment overrides (falling back to the group defaults).')),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "cost_incomplete": zod.boolean(),
  "cost_piastres": zod.number().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.'))
}).describe('A priced optional — a member of the item-private `Options` group\n(a modifier_group with `legacy_addon_type IS NULL` owned by this item).')),
  "org_id": zod.uuid(),
  "recipe_steps": zod.array(zod.object({
  "animation_sha256": zod.string().nullish(),
  "animation_url": zod.string().nullish().describe('Present only for a preset whose animation still ships. `None` on a\ncustom step, and on a retired preset — clients show the name alone.'),
  "kind": zod.string().describe('`preset` | `custom`.'),
  "name": zod.string().describe('The preset\'s name, or the typed name of a custom step.'),
  "name_ar": zod.string(),
  "note": zod.string().nullish(),
  "note_ar": zod.string().nullish(),
  "position": zod.number(),
  "preset_slug": zod.string().nullish().describe('The preset this step uses, if any.')
}).describe('One step, resolved for display: whatever its kind, it has a name, and a\npreset step also carries its note and the animation to play.')).describe('How the item is made, in order. Edited through `PUT \/recipes\/steps\/{id}`\nand saved by the studio alongside the recipe lines.'),
  "sizes": zod.array(zod.object({
  "cost_incomplete": zod.boolean().describe('`true` when at least one recipe line is unlinked\/uncosted (so `cost_piastres`, if\npresent, is a partial figure rather than the full COGS).'),
  "cost_piastres": zod.number().nullish().describe('Recipe cost rollup in piastres over the priced ingredients. `null` when there is\nno recipe or nothing is priced; a partial rollup returns the sum-so-far with\n`cost_incomplete = true`.'),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "label": zod.string(),
  "price": zod.number(),
  "recipe": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_id": zod.uuid(),
  "ingredient_name": zod.string(),
  "line_cost_piastres": zod.number().nullish().describe('Cost of this line in piastres. `null` = UNKNOWN (ingredient unlinked\/uncosted),\nnever shown as 0. A priced line with `quantity = 0` (swap marker) costs 0.'),
  "quantity": zod.string().describe('Base-unit, yield-normalized quantity, serialized as a string (numeric fidelity).'),
  "unit": zod.string()
}).describe('One recipe line, hydrated with the ingredient name and a per-line cost.')),
  "sort": zod.number()
}).describe('A size (menu_item_sizes row) with its recipe and live cost.')),
  "used_in_bundles": zod.array(zod.object({
  "bundle_id": zod.uuid(),
  "name": zod.string()
}))
}).describe('The full item aggregate the one-page Menu Studio editor renders.')


export const PutPriceOverrideBody = zod.object({
  "branch_id": zod.uuid().nullish(),
  "channel": zod.string().nullish().describe('delivery_channel: \'in_mall\' | \'outside\' | \'umbrella\' | \'pickup\'.'),
  "is_available": zod.boolean().nullish(),
  "price": zod.number().nullish(),
  "scope": zod.string().describe('\'branch\' | \'channel\' | \'branch_channel\'.'),
  "target_id": zod.uuid(),
  "target_type": zod.string().describe('\'menu_item_size\' | \'modifier_option\'.')
})

export const PutPriceOverrideResponse = zod.object({
  "branch_id": zod.uuid().nullish(),
  "channel": zod.string().nullish(),
  "id": zod.uuid(),
  "is_available": zod.boolean().nullish(),
  "price": zod.number().nullish(),
  "scope": zod.string(),
  "target_id": zod.uuid(),
  "target_type": zod.string()
}).describe('The persisted override row (returned by the upsert).')


export const DeletePriceOverrideBody = zod.object({
  "branch_id": zod.uuid().nullish(),
  "channel": zod.string().nullish().describe('delivery_channel: \'in_mall\' | \'outside\' | \'umbrella\' | \'pickup\'.'),
  "is_available": zod.boolean().nullish(),
  "price": zod.number().nullish(),
  "scope": zod.string().describe('\'branch\' | \'channel\' | \'branch_channel\'.'),
  "target_id": zod.uuid(),
  "target_type": zod.string().describe('\'menu_item_size\' | \'modifier_option\'.')
})

export const DeletePriceOverrideResponse = zod.void()


export const runMetricsQueryBodyWidgetsItemSpecTwoLimitMin = 0;

export const runMetricsQueryBodyWidgetsItemSpecTwoTransformTopPerTwoNMin = 0;



export const RunMetricsQueryBody = zod.object({
  "locale": zod.string().nullish().describe('Answer language for translated labels (\"en\" or \"ar\").'),
  "period": zod.union([zod.null(),zod.object({
  "from": zod.string().nullish().describe('Explicit inclusive lower bound.'),
  "preset": zod.union([zod.null(),zod.enum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'last_7_days', 'last_30_days', 'last_90_days', 'last_12_months', 'all_time']).describe('A named relative window. Takes precedence over `from`\/`to`.')]).optional(),
  "to": zod.string().nullish().describe('Explicit inclusive upper bound.')
}).describe('Default window for every widget that does not set its own.')]).optional(),
  "widgets": zod.array(zod.object({
  "key": zod.string().describe('Caller-chosen key, echoed back so results can be matched to widgets.'),
  "period": zod.union([zod.null(),zod.object({
  "from": zod.string().nullish().describe('Explicit inclusive lower bound.'),
  "preset": zod.union([zod.null(),zod.enum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'last_7_days', 'last_30_days', 'last_90_days', 'last_12_months', 'all_time']).describe('A named relative window. Takes precedence over `from`\/`to`.')]).optional(),
  "to": zod.string().nullish().describe('Explicit inclusive upper bound.')
}).describe('Overrides the batch-level period for this widget alone.')]).optional(),
  "preset": zod.string().nullish().describe('A curated metric id from `GET \/metrics\/schema`.'),
  "spec": zod.union([zod.null(),zod.object({
  "branch": zod.string().nullish().describe('Narrow to ONE branch by name. Fuzzy-matched \*within\* the caller\'s\naccessible branches, so it can only ever narrow, never widen. Dashboards\nuse the request-level scope instead and leave this unset.'),
  "compare": zod.enum(['none', 'previous_period', 'previous_year']).optional().describe('Period-over-period comparison.'),
  "dataset": zod.string().describe('Dataset id — fixes the grain. See `GET \/metrics\/schema`.'),
  "dimensions": zod.array(zod.string()).optional().describe('GROUP BY axes, outermost first. Empty = a single total row.'),
  "filters": zod.record(zod.string(), zod.string()).optional().describe('Filter id → chosen value. Each value selects a pre-written predicate.'),
  "having_min": zod.number().nullish().describe('Only keep groups whose sort measure reaches this value.'),
  "limit": zod.number().min(runMetricsQueryBodyWidgetsItemSpecTwoLimitMin).nullish().describe('Row cap, clamped to [`MAX_LIMIT`].'),
  "measures": zod.array(zod.string()).optional().describe('Aggregates to compute. Empty = the dataset\'s headline measures.'),
  "period": zod.object({
  "from": zod.string().nullish().describe('Explicit inclusive lower bound.'),
  "preset": zod.union([zod.null(),zod.enum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'last_7_days', 'last_30_days', 'last_90_days', 'last_12_months', 'all_time']).describe('A named relative window. Takes precedence over `from`\/`to`.')]).optional(),
  "to": zod.string().nullish().describe('Explicit inclusive upper bound.')
}).optional().describe('The reporting window.\n\nPrefer a [`PeriodPreset`]: it is resolved server-side against the merchant\'s\ntimezone at query time, which means a dashboard widget saying \"last 30 days\"\nstays correct forever, and a language model never has to do calendar\narithmetic — historically the single largest source of wrong answers.'),
  "sort": zod.union([zod.null(),zod.object({
  "dir": zod.enum(['asc', 'desc']).optional().describe('Sort direction. `Asc` is what unlocks \"worst\", \"slowest\", \"least\" questions.'),
  "measure": zod.string().describe('A measure id from `measures`.')
}).describe('Which measure orders the result, and in which direction.')]).optional(),
  "transform": zod.object({
  "cumulative": zod.boolean().optional().describe('Add a running total in time order. Needs a time dimension.'),
  "share": zod.boolean().optional().describe('Add each row\'s percentage of the grand total.'),
  "top_per": zod.union([zod.null(),zod.object({
  "dimension": zod.string().describe('Which of the chosen dimensions to rank within.'),
  "n": zod.number().min(runMetricsQueryBodyWidgetsItemSpecTwoTransformTopPerTwoNMin).optional().describe('How many rows to keep per group.')
}).describe('Keep only the top N rows \*within\* each value of a dimension — \"the best\nseller in every branch\".')]).optional()
}).optional().describe('Post-aggregation shaping.'),
  "viz": zod.union([zod.null(),zod.enum(['auto', 'kpi', 'line', 'area', 'bar', 'row', 'pie', 'donut', 'table', 'heatmap']).describe('Preferred visualization. Omitted or [`Viz::Auto`] lets the backend pick\nfrom the result shape.')]).optional()
}).describe('A fully custom query. Same IR the AI agent produces.')]).optional()
}).describe('One widget in a batch. Exactly one of `preset` or `spec`.'))
})

export const runMetricsQueryResponseResultsOneOneRowCountMin = 0;



export const RunMetricsQueryResponse = zod.object({
  "results": zod.record(zod.string(), zod.union([zod.object({
  "columns": zod.array(zod.object({
  "key": zod.string().describe('SQL alias \/ JSON key.'),
  "kind": zod.enum(['money', 'count', 'label', 'date', 'number', 'minutes']).describe('The renderable kind of an output column, so a client can format it and pick\na sensible chart without knowing anything about the underlying SQL.'),
  "label": zod.string().describe('Human label for a header or legend.')
}).describe('One output column: the SQL alias (also the JSON key on every row) plus how\nto render it.')),
  "facet_by": zod.string().nullish(),
  "grain": zod.enum(['scalar', 'series', 'categorical', 'table']).describe('The \*shape\* of a result set, derived from the dimensions a query groups by.\nThis is what lets a dashboard render any metric with no per-metric code: a\nscalar becomes a KPI card, a series becomes a line, a breakdown becomes a\nbar or pie.'),
  "period": zod.object({
  "from": zod.string().nullish(),
  "to": zod.string().nullish()
}).describe('The resolved window, echoed so a client can label an answer without\nre-deriving \"last month\" itself.'),
  "row_count": zod.number().min(runMetricsQueryResponseResultsOneOneRowCountMin),
  "rows": zod.array(zod.record(zod.string(), zod.unknown())),
  "title": zod.string().nullish(),
  "truncated": zod.boolean(),
  "viz": zod.enum(['auto', 'kpi', 'line', 'area', 'bar', 'row', 'pie', 'donut', 'table', 'heatmap']).describe('How a result is best visualized. A hint: the client may always override, and\n[`Viz::Auto`] asks the backend to choose from the [`Grain`].')
}).and(zod.object({
  "status": zod.enum(['ok'])
})),zod.object({
  "error": zod.string(),
  "status": zod.enum(['error'])
})]).describe('A widget either produced a result or an explanation. Never both, never\nneither — and a failure here is a 200 with an `error`, not a failed batch.')),
  "scope": zod.object({
  "all_branches": zod.boolean().describe('True when the answer spans every branch the caller can access.'),
  "branches": zod.array(zod.string()),
  "label": zod.string().describe('Human-readable label, e.g. \"All branches (3)\" or \"Sidi Henish\".'),
  "unmatched_branch": zod.string().nullish().describe('Set when a branch was named but could not be matched. The answer then\nfalls back to the full accessible set, and this flags the mismatch rather\nthan silently answering a different question.')
}).describe('Which branches every result covers.'),
  "timezone": zod.string().describe('The timezone all time buckets were computed in.')
})


export const SchemaResponse = zod.object({
  "boards": zod.array(zod.object({
  "description": zod.string(),
  "key": zod.string(),
  "title": zod.string(),
  "widgets": zod.array(zod.string())
})).describe('Built-in dashboard layouts a merchant can use or fork.'),
  "datasets": zod.array(zod.object({
  "default_measures": zod.array(zod.string()),
  "dimensions": zod.array(zod.object({
  "help": zod.string().nullish().describe('One line on exactly what it counts. Absent for dimensions, whose label\nis self-explanatory.'),
  "id": zod.string(),
  "kind": zod.enum(['money', 'count', 'label', 'date', 'number', 'minutes']).describe('The renderable kind of an output column, so a client can format it and pick\na sensible chart without knowing anything about the underlying SQL.'),
  "label": zod.string(),
  "time": zod.boolean().optional().describe('True for time axes.')
})),
  "filters": zod.array(zod.object({
  "default": zod.string(),
  "help": zod.string(),
  "id": zod.string(),
  "label": zod.string(),
  "values": zod.array(zod.string())
})),
  "help": zod.string().describe('What one row is, and when to use this dataset instead of another.'),
  "id": zod.string(),
  "measures": zod.array(zod.object({
  "help": zod.string().nullish().describe('One line on exactly what it counts. Absent for dimensions, whose label\nis self-explanatory.'),
  "id": zod.string(),
  "kind": zod.enum(['money', 'count', 'label', 'date', 'number', 'minutes']).describe('The renderable kind of an output column, so a client can format it and pick\na sensible chart without knowing anything about the underlying SQL.'),
  "label": zod.string(),
  "time": zod.boolean().optional().describe('True for time axes.')
})),
  "title": zod.string()
})),
  "period_presets": zod.array(zod.string()).describe('Named relative windows accepted in `period.preset`.'),
  "presets": zod.array(zod.object({
  "category": zod.string(),
  "dataset": zod.string(),
  "default_period": zod.enum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'last_7_days', 'last_30_days', 'last_90_days', 'last_12_months', 'all_time']).describe('Named relative windows, resolved in the merchant\'s timezone.'),
  "description": zod.string(),
  "grain": zod.enum(['scalar', 'series', 'categorical', 'table']).describe('Result shape, so a widget picker knows a KPI card from a line chart\nbefore running anything.'),
  "id": zod.string(),
  "permission": zod.string().describe('Permission resource required, with the `read` action.'),
  "title": zod.string(),
  "viz": zod.enum(['auto', 'kpi', 'line', 'area', 'bar', 'row', 'pie', 'donut', 'table', 'heatmap']).describe('How a result is best visualized. A hint: the client may always override, and\n[`Viz::Auto`] asks the backend to choose from the [`Grain`].')
}))
}).describe('The complete registry, as served to a dashboard.')


export const ListGroupsQueryParams = zod.object({
  "org_id": zod.uuid().describe('Organization whose reusable modifier groups to list')
})

export const ListGroupsResponseItem = zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_required": zod.boolean(),
  "legacy_addon_type": zod.string().nullish(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "price": zod.number(),
  "replaces_ingredient_id": zod.uuid().nullish(),
  "sort": zod.number()
}).describe('A modifier option as returned by the reusable-group endpoints (org-scoped,\nno per-item `included`\/cost context — that belongs to the studio aggregate).')),
  "org_id": zod.uuid(),
  "selection_type": zod.string(),
  "sort": zod.number()
}).describe('A reusable modifier group with its options (org-scoped catalog view).')
export const ListGroupsResponse = zod.array(ListGroupsResponseItem)


export const CreateGroupBody = zod.object({
  "is_required": zod.boolean().optional(),
  "legacy_addon_type": zod.string().nullish().describe('The legacy addon type this group is presented as to OLD clients through\nthe compat shim (the managed addon-type dropdown, e.g. `milk_type` \/\n`coffee_type` \/ `extra`). Swap-family behavior keys on it. `null` = a\ncustom group with no legacy lineage — INVISIBLE to old clients (the shim\nprojects `type` from this value, and the old wire requires it), so set\nit whenever the pre-teardown fleet must see the group\'s options.'),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number().optional(),
  "name": zod.string(),
  "name_translations": zod.unknown().optional(),
  "selection_type": zod.string().describe('\'single\' | \'multi\'.'),
  "sort": zod.number().optional()
})

export const CreateGroupResponse = zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_required": zod.boolean(),
  "legacy_addon_type": zod.string().nullish(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "price": zod.number(),
  "replaces_ingredient_id": zod.uuid().nullish(),
  "sort": zod.number()
}).describe('A modifier option as returned by the reusable-group endpoints (org-scoped,\nno per-item `included`\/cost context — that belongs to the studio aggregate).')),
  "org_id": zod.uuid(),
  "selection_type": zod.string(),
  "sort": zod.number()
}).describe('A reusable modifier group with its options (org-scoped catalog view).')


export const DeleteGroupParams = zod.object({
  "gid": zod.uuid().describe('Modifier group ID')
})

export const DeleteGroupResponse = zod.void()


export const PatchGroupParams = zod.object({
  "gid": zod.uuid().describe('Modifier group ID')
})

export const PatchGroupBody = zod.object({
  "is_required": zod.boolean().nullish(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.unknown().optional(),
  "selection_type": zod.string().nullish(),
  "sort": zod.number().nullish()
}).describe('Every field optional — only present keys are updated. `Option<Option<T>>` (with\n`deserialize_with`) is avoided; nullable columns that must be clearable\n(`max_selections`) are handled by a dedicated presence flag pattern below.')

export const PatchGroupResponse = zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_required": zod.boolean(),
  "legacy_addon_type": zod.string().nullish(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "options": zod.array(zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "price": zod.number(),
  "replaces_ingredient_id": zod.uuid().nullish(),
  "sort": zod.number()
}).describe('A modifier option as returned by the reusable-group endpoints (org-scoped,\nno per-item `included`\/cost context — that belongs to the studio aggregate).')),
  "org_id": zod.uuid(),
  "selection_type": zod.string(),
  "sort": zod.number()
}).describe('A reusable modifier group with its options (org-scoped catalog view).')


export const CreateOptionParams = zod.object({
  "gid": zod.uuid().describe('Modifier group ID')
})

export const CreateOptionBody = zod.object({
  "is_active": zod.boolean().optional(),
  "is_default": zod.boolean().optional(),
  "name": zod.string(),
  "name_translations": zod.unknown().optional(),
  "price": zod.number(),
  "replaces_ingredient_id": zod.uuid().nullish()
})

export const CreateOptionResponse = zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "price": zod.number(),
  "replaces_ingredient_id": zod.uuid().nullish(),
  "sort": zod.number()
}).describe('A modifier option as returned by the reusable-group endpoints (org-scoped,\nno per-item `included`\/cost context — that belongs to the studio aggregate).')


export const DeleteOptionParams = zod.object({
  "oid": zod.uuid().describe('Modifier option ID')
})

export const DeleteOptionResponse = zod.void()


export const PatchOptionParams = zod.object({
  "oid": zod.uuid().describe('Modifier option ID')
})

export const PatchOptionBody = zod.object({
  "is_active": zod.boolean().nullish(),
  "is_default": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "name_translations": zod.looseObject({

}).optional(),
  "price": zod.number().nullish(),
  "replaces_ingredient_id": zod.uuid().nullish()
})

export const PatchOptionResponse = zod.object({
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.unknown(),
  "price": zod.number(),
  "replaces_ingredient_id": zod.uuid().nullish(),
  "sort": zod.number()
}).describe('A modifier option as returned by the reusable-group endpoints (org-scoped,\nno per-item `included`\/cost context — that belongs to the studio aggregate).')


export const PutOptionRecipeParams = zod.object({
  "oid": zod.uuid().describe('Modifier option ID')
})

export const PutOptionRecipeBodyItem = zod.object({
  "ingredient_id": zod.uuid(),
  "quantity": zod.number(),
  "unit": zod.string()
}).describe('One recipe line as submitted to the option-recipe replace endpoint. `quantity`\nmay be 0 (a swap marker). Server normalizes to the ingredient base unit.')
export const PutOptionRecipeBody = zod.array(PutOptionRecipeBodyItem)

export const PutOptionRecipeResponseItem = zod.object({
  "ingredient_id": zod.uuid(),
  "quantity": zod.number(),
  "unit": zod.string()
}).describe('One recipe line as submitted to the option-recipe replace endpoint. `quantity`\nmay be 0 (a swap marker). Server normalizes to the ingredient base unit.')
export const PutOptionRecipeResponse = zod.array(PutOptionRecipeResponseItem)


export const ListOpenTicketsQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "status": zod.string().optional()
})

export const ListOpenTicketsResponseItem = zod.object({
  "booking_id": zod.uuid().nullish().describe('The booking this ticket seated, if the party had one.'),
  "branch_id": zod.uuid(),
  "customer_name": zod.string().nullish(),
  "guest_count": zod.number().nullish(),
  "id": zod.uuid(),
  "items": zod.array(zod.object({
  "id": zod.uuid(),
  "line": zod.unknown().describe('The frozen priced SnapshotLine (name, size, addons, totals).'),
  "line_total": zod.number(),
  "menu_item_id": zod.uuid().nullish(),
  "round_number": zod.number(),
  "voided": zod.boolean()
})),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opened_by": zod.uuid(),
  "opened_by_name": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "settled_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "table_id": zod.uuid().nullish(),
  "ticket_ref": zod.string().nullish()
})
export const ListOpenTicketsResponse = zod.array(ListOpenTicketsResponseItem)


export const CreateOpenTicketBody = zod.object({
  "booking_id": zod.uuid().nullish().describe('The booking this party arrived under: the ticket links to it and the\nbooking moves to `seated` in the same transaction.'),
  "branch_id": zod.uuid(),
  "customer_name": zod.string().nullish(),
  "discount_id": zod.uuid().nullish().describe('Optional discount the waiter applied at order time (overridable at settle).'),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().nullish(),
  "guest_count": zod.number().nullish(),
  "idempotency_key": zod.uuid().nullish().describe('Client-minted dedup key for the ticket (exactly-once across LAN + cloud).'),
  "items": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "quantity": zod.number().optional(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this addon. When present\nit is RECORDED as the addon\'s unit_price; absent → the server\'s expected\n(catalog) price is used. Bundle-component addons ignore this (server-priced).')
})).optional(),
  "bundle_components": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "quantity": zod.number().optional(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this addon. When present\nit is RECORDED as the addon\'s unit_price; absent → the server\'s expected\n(catalog) price is used. Bundle-component addons ignore this (server-priced).')
})).optional(),
  "item_id": zod.uuid(),
  "optional_field_ids": zod.array(zod.uuid()).optional(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "bundle_id": zod.uuid().nullish(),
  "menu_item_id": zod.uuid().nullish(),
  "notes": zod.string().nullish(),
  "optional_field_ids": zod.array(zod.uuid()).optional(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this item\/bundle line. When\npresent it is RECORDED as the line\'s unit_price; absent → the server\'s expected\n(catalog + branch override) price is used. Recording what the customer was\nactually charged keeps the DB equal to the printed receipt even when the POS\'s\nsynced menu\/override prices are stale or it was offline at sale time.')
})).describe('Client-priced items (same shape as a POS order line) — recorded verbatim.'),
  "notes": zod.string().nullish(),
  "round_idempotency_key": zod.uuid().nullish().describe('Per-round dedup key for the first round.'),
  "table_id": zod.uuid().nullish()
})

export const CreateOpenTicketResponse = zod.object({
  "booking_id": zod.uuid().nullish().describe('The booking this ticket seated, if the party had one.'),
  "branch_id": zod.uuid(),
  "customer_name": zod.string().nullish(),
  "guest_count": zod.number().nullish(),
  "id": zod.uuid(),
  "items": zod.array(zod.object({
  "id": zod.uuid(),
  "line": zod.unknown().describe('The frozen priced SnapshotLine (name, size, addons, totals).'),
  "line_total": zod.number(),
  "menu_item_id": zod.uuid().nullish(),
  "round_number": zod.number(),
  "voided": zod.boolean()
})),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opened_by": zod.uuid(),
  "opened_by_name": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "settled_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "table_id": zod.uuid().nullish(),
  "ticket_ref": zod.string().nullish()
})


export const GetOpenTicketParams = zod.object({
  "id": zod.uuid().describe('Open ticket ID')
})

export const GetOpenTicketResponse = zod.object({
  "booking_id": zod.uuid().nullish().describe('The booking this ticket seated, if the party had one.'),
  "branch_id": zod.uuid(),
  "customer_name": zod.string().nullish(),
  "guest_count": zod.number().nullish(),
  "id": zod.uuid(),
  "items": zod.array(zod.object({
  "id": zod.uuid(),
  "line": zod.unknown().describe('The frozen priced SnapshotLine (name, size, addons, totals).'),
  "line_total": zod.number(),
  "menu_item_id": zod.uuid().nullish(),
  "round_number": zod.number(),
  "voided": zod.boolean()
})),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opened_by": zod.uuid(),
  "opened_by_name": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "settled_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "table_id": zod.uuid().nullish(),
  "ticket_ref": zod.string().nullish()
})


export const AddRoundParams = zod.object({
  "id": zod.uuid().describe('Open ticket ID')
})

export const AddRoundBody = zod.object({
  "idempotency_key": zod.uuid().nullish(),
  "items": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "quantity": zod.number().optional(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this addon. When present\nit is RECORDED as the addon\'s unit_price; absent → the server\'s expected\n(catalog) price is used. Bundle-component addons ignore this (server-priced).')
})).optional(),
  "bundle_components": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "quantity": zod.number().optional(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this addon. When present\nit is RECORDED as the addon\'s unit_price; absent → the server\'s expected\n(catalog) price is used. Bundle-component addons ignore this (server-priced).')
})).optional(),
  "item_id": zod.uuid(),
  "optional_field_ids": zod.array(zod.uuid()).optional(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "bundle_id": zod.uuid().nullish(),
  "menu_item_id": zod.uuid().nullish(),
  "notes": zod.string().nullish(),
  "optional_field_ids": zod.array(zod.uuid()).optional(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this item\/bundle line. When\npresent it is RECORDED as the line\'s unit_price; absent → the server\'s expected\n(catalog + branch override) price is used. Recording what the customer was\nactually charged keeps the DB equal to the printed receipt even when the POS\'s\nsynced menu\/override prices are stale or it was offline at sale time.')
}))
})

export const AddRoundResponse = zod.object({
  "booking_id": zod.uuid().nullish().describe('The booking this ticket seated, if the party had one.'),
  "branch_id": zod.uuid(),
  "customer_name": zod.string().nullish(),
  "guest_count": zod.number().nullish(),
  "id": zod.uuid(),
  "items": zod.array(zod.object({
  "id": zod.uuid(),
  "line": zod.unknown().describe('The frozen priced SnapshotLine (name, size, addons, totals).'),
  "line_total": zod.number(),
  "menu_item_id": zod.uuid().nullish(),
  "round_number": zod.number(),
  "voided": zod.boolean()
})),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opened_by": zod.uuid(),
  "opened_by_name": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "settled_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "table_id": zod.uuid().nullish(),
  "ticket_ref": zod.string().nullish()
})


export const SettleOpenTicketParams = zod.object({
  "id": zod.uuid().describe('Open ticket ID')
})

export const SettleOpenTicketBody = zod.object({
  "amount_tendered": zod.number().nullish(),
  "discount_id": zod.uuid().nullish().describe('Settle-time overrides (else the ticket\'s own discount \/ no tip).'),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().nullish(),
  "payment_method": zod.string(),
  "shift_id": zod.uuid(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish()
})

export const SettleOpenTicketResponse = zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_name": zod.string().nullish(),
  "delivery_channel": zod.string().nullish().describe('Delivery channel (\"in_mall\" | \"outside\") of the linked delivery order,\nsurfaced on the list so clients can flag + segment delivery orders\nwithout a per-order detail fetch. `null` for dine-in orders.'),
  "delivery_fee": zod.number().describe('Delivery charge in piastres, shown separately from the item subtotal.\nAlways 0 for dine-in orders; for delivery orders\n`total_amount == subtotal + tax_amount + delivery_fee` (minus discount).'),
  "delivery_lat": zod.number().nullish().describe('Customer location of the linked delivery order, so clients can link out\nto a map (e.g. Google Maps) without a per-order detail fetch. `null` for\ndine-in orders or delivery orders without captured coordinates.'),
  "delivery_lng": zod.number().nullish(),
  "delivery_order_id": zod.uuid().nullish().describe('Links a finalized delivery order back to its `delivery_orders` row\n(customer, address, channel, zone). `null` for dine-in orders.'),
  "discount_amount": zod.number(),
  "discount_id": zod.uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "order_number": zod.number(),
  "order_ref": zod.string().nullish().describe('Human-readable, org-unique reference (e.g. \"DT-260614-0042\"). Additive\nalongside the per-shift order_number. Optional only during the rollout\nwindow before the historical backfill runs; never null afterwards.'),
  "order_type": zod.string().describe('Order origin: \"dine_in\" (POS sale) or \"delivery\" (finalized delivery\norder). Defaults to \"dine_in\" for every POS sale.'),
  "payment_legs": zod.array(zod.object({
  "amount": zod.number(),
  "method": zod.string()
}).describe('One tender against an order (`order_payments`). A split sale has several.')).describe('What was ACTUALLY tendered, one entry per `order_payments` row — the same\nrows every money report buckets by. A single-tender order has one leg; a\nsplit order has one per leg (e.g. card 285.00 + cash 255.00). Empty on the\nresponse to order creation, where the legs are written just after the row\nthis statement returns; every read hydrates it.'),
  "payment_method": zod.string().describe('The order\'s NOMINAL payment label. For a split order this is the literal\n`\'mixed\'` — a label that exists in no money report, because reports bucket\nby what was actually tendered. Use [`Order::payment_legs`] for the real\nmethods; treat this as a display badge only.'),
  "shift_id": zod.uuid(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "tax_amount": zod.number(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number(),
  "void_note": zod.string().nullish(),
  "void_reason": zod.string().nullish(),
  "voided_at": zod.iso.datetime({"offset":true}).nullish(),
  "voided_by": zod.uuid().nullish(),
  "waiter_id": zod.uuid().nullish().describe('The WAITER who opened this order\'s ticket (`open_tickets.opened_by`),\nstamped server-side at settle time. `null` for direct teller sales and\ndelivery orders (they never pass through a waiter\'s ticket).'),
  "waiter_name": zod.string().nullish()
})


/**
 * @summary Switch an open ticket to a different table (the "move table" button). Works
for any live ticket — walk-in dine-in or one auto-opened from a booking. The
old table is flagged `dirty` (bus it), the new one `seated`; if the ticket
came from a booking, the booking's assignment is kept in sync.
 */
export const MoveTicketTableParams = zod.object({
  "id": zod.uuid().describe('Open ticket ID')
})

export const MoveTicketTableBody = zod.object({
  "table_id": zod.uuid().describe('The table to move this ticket onto.')
})

export const MoveTicketTableResponse = zod.object({
  "booking_id": zod.uuid().nullish().describe('The booking this ticket seated, if the party had one.'),
  "branch_id": zod.uuid(),
  "customer_name": zod.string().nullish(),
  "guest_count": zod.number().nullish(),
  "id": zod.uuid(),
  "items": zod.array(zod.object({
  "id": zod.uuid(),
  "line": zod.unknown().describe('The frozen priced SnapshotLine (name, size, addons, totals).'),
  "line_total": zod.number(),
  "menu_item_id": zod.uuid().nullish(),
  "round_number": zod.number(),
  "voided": zod.boolean()
})),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opened_by": zod.uuid(),
  "opened_by_name": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "settled_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "table_id": zod.uuid().nullish(),
  "ticket_ref": zod.string().nullish()
})


export const VoidOpenTicketParams = zod.object({
  "id": zod.uuid().describe('Open ticket ID')
})

export const VoidOpenTicketBody = zod.object({
  "reason": zod.string().nullish()
})

export const VoidOpenTicketResponse = zod.object({
  "booking_id": zod.uuid().nullish().describe('The booking this ticket seated, if the party had one.'),
  "branch_id": zod.uuid(),
  "customer_name": zod.string().nullish(),
  "guest_count": zod.number().nullish(),
  "id": zod.uuid(),
  "items": zod.array(zod.object({
  "id": zod.uuid(),
  "line": zod.unknown().describe('The frozen priced SnapshotLine (name, size, addons, totals).'),
  "line_total": zod.number(),
  "menu_item_id": zod.uuid().nullish(),
  "round_number": zod.number(),
  "voided": zod.boolean()
})),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opened_by": zod.uuid(),
  "opened_by_name": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "settled_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "table_id": zod.uuid().nullish(),
  "ticket_ref": zod.string().nullish()
})


export const ListOrdersQueryParams = zod.object({
  "branch_id": zod.uuid().optional(),
  "shift_id": zod.uuid().optional(),
  "updated_after": zod.iso.datetime({"offset":true}).optional(),
  "page": zod.number().optional(),
  "per_page": zod.number().optional(),
  "teller_name": zod.string().optional(),
  "waiter_name": zod.string().optional().describe('Filter by the WAITER who opened the ticket (ILIKE, partial match). Matches\nonly orders that carry a waiter (dine-in settled from a waiter\'s ticket).'),
  "payment_method": zod.string().optional(),
  "status": zod.string().optional(),
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "order_type": zod.string().optional().describe('Filter by order origin: \"dine_in\" or \"delivery\".'),
  "channel": zod.string().optional().describe('Filter delivery orders by channel: \"in_mall\" or \"outside\".'),
  "include_items": zod.boolean().optional().describe('When true, each order in `data` embeds its full line items\n(addons\/optionals\/bundle components) — the response shape becomes\n[PaginatedOrdersFull]. Lets offline-first clients cache complete\norders in one round trip instead of fetching each order separately.'),
  "exclude_items": zod.string().optional().describe('Comma-separated menu_item\/bundle UUIDs left out of the summary\'s\n`line_items` count (units sold) — e.g. water bottles or service\npseudo-items that inflate it. Affects ONLY that KPI: revenue, order\ncounts, and the order rows themselves are untouched.')
})

export const ListOrdersResponse = zod.object({
  "data": zod.array(zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_name": zod.string().nullish(),
  "delivery_channel": zod.string().nullish().describe('Delivery channel (\"in_mall\" | \"outside\") of the linked delivery order,\nsurfaced on the list so clients can flag + segment delivery orders\nwithout a per-order detail fetch. `null` for dine-in orders.'),
  "delivery_fee": zod.number().describe('Delivery charge in piastres, shown separately from the item subtotal.\nAlways 0 for dine-in orders; for delivery orders\n`total_amount == subtotal + tax_amount + delivery_fee` (minus discount).'),
  "delivery_lat": zod.number().nullish().describe('Customer location of the linked delivery order, so clients can link out\nto a map (e.g. Google Maps) without a per-order detail fetch. `null` for\ndine-in orders or delivery orders without captured coordinates.'),
  "delivery_lng": zod.number().nullish(),
  "delivery_order_id": zod.uuid().nullish().describe('Links a finalized delivery order back to its `delivery_orders` row\n(customer, address, channel, zone). `null` for dine-in orders.'),
  "discount_amount": zod.number(),
  "discount_id": zod.uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "order_number": zod.number(),
  "order_ref": zod.string().nullish().describe('Human-readable, org-unique reference (e.g. \"DT-260614-0042\"). Additive\nalongside the per-shift order_number. Optional only during the rollout\nwindow before the historical backfill runs; never null afterwards.'),
  "order_type": zod.string().describe('Order origin: \"dine_in\" (POS sale) or \"delivery\" (finalized delivery\norder). Defaults to \"dine_in\" for every POS sale.'),
  "payment_legs": zod.array(zod.object({
  "amount": zod.number(),
  "method": zod.string()
}).describe('One tender against an order (`order_payments`). A split sale has several.')).describe('What was ACTUALLY tendered, one entry per `order_payments` row — the same\nrows every money report buckets by. A single-tender order has one leg; a\nsplit order has one per leg (e.g. card 285.00 + cash 255.00). Empty on the\nresponse to order creation, where the legs are written just after the row\nthis statement returns; every read hydrates it.'),
  "payment_method": zod.string().describe('The order\'s NOMINAL payment label. For a split order this is the literal\n`\'mixed\'` — a label that exists in no money report, because reports bucket\nby what was actually tendered. Use [`Order::payment_legs`] for the real\nmethods; treat this as a display badge only.'),
  "shift_id": zod.uuid(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "tax_amount": zod.number(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number(),
  "void_note": zod.string().nullish(),
  "void_reason": zod.string().nullish(),
  "voided_at": zod.iso.datetime({"offset":true}).nullish(),
  "voided_by": zod.uuid().nullish(),
  "waiter_id": zod.uuid().nullish().describe('The WAITER who opened this order\'s ticket (`open_tickets.opened_by`),\nstamped server-side at settle time. `null` for direct teller sales and\ndelivery orders (they never pass through a waiter\'s ticket).'),
  "waiter_name": zod.string().nullish()
})),
  "page": zod.number(),
  "per_page": zod.number(),
  "summary": zod.object({
  "completed": zod.number(),
  "delivery_fees": zod.number().optional().describe('Total delivery charges (piastres) across completed orders in scope.\nLets the dashboard surface delivery revenue separately from item sales.'),
  "delivery_orders": zod.number().optional().describe('Count of completed delivery orders.'),
  "delivery_revenue": zod.number().optional().describe('Gross revenue (total_amount) of completed delivery orders.'),
  "discounts": zod.number(),
  "in_mall_fees": zod.number().optional(),
  "in_mall_orders": zod.number().optional().describe('In-mall channel: order count \/ gross revenue \/ delivery fees.'),
  "in_mall_revenue": zod.number().optional(),
  "line_items": zod.number().optional().describe('Units sold (SUM of order_items.quantity) across completed orders in\nscope. Counts units, not distinct lines, matching the item-sales\nreports (\"3× burger\" contributes 3).'),
  "outside_fees": zod.number().optional(),
  "outside_orders": zod.number().optional().describe('Outside channel: order count \/ gross revenue \/ delivery fees.'),
  "outside_revenue": zod.number().optional(),
  "revenue": zod.number(),
  "tips": zod.number(),
  "voided": zod.number()
}),
  "total": zod.number(),
  "total_pages": zod.number()
})


export const CreateOrderBody = zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}).nullish(),
  "customer_name": zod.string().nullish(),
  "discount_amount": zod.number().nullish(),
  "discount_id": zod.uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().nullish(),
  "idempotency_key": zod.uuid().nullish(),
  "items": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "quantity": zod.number().optional(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this addon. When present\nit is RECORDED as the addon\'s unit_price; absent → the server\'s expected\n(catalog) price is used. Bundle-component addons ignore this (server-priced).')
})).optional(),
  "bundle_components": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "quantity": zod.number().optional(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this addon. When present\nit is RECORDED as the addon\'s unit_price; absent → the server\'s expected\n(catalog) price is used. Bundle-component addons ignore this (server-priced).')
})).optional(),
  "item_id": zod.uuid(),
  "optional_field_ids": zod.array(zod.uuid()).optional(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "bundle_id": zod.uuid().nullish(),
  "menu_item_id": zod.uuid().nullish(),
  "notes": zod.string().nullish(),
  "optional_field_ids": zod.array(zod.uuid()).optional(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this item\/bundle line. When\npresent it is RECORDED as the line\'s unit_price; absent → the server\'s expected\n(catalog + branch override) price is used. Recording what the customer was\nactually charged keeps the DB equal to the printed receipt even when the POS\'s\nsynced menu\/override prices are stale or it was offline at sale time.')
})),
  "notes": zod.string().nullish(),
  "order_number": zod.number().nullish().describe('IGNORED by the server (accepted for backward compatibility only). The\nauthoritative per-shift number is ALWAYS `MAX(order_number)+1` computed under\nthe shift advisory lock — never the client value, which is used only on the\ndevice\'s local receipt. The byte-identical-at-reprint guarantee rides on\n`order_ref`, not this field. Two tills on one shift get distinct numbers\n(UNIQUE(shift_id, order_number) + the lock).'),
  "order_ref": zod.string().nullish().describe('Client-minted order reference (`<BRANCH>-<YYMMDD>-<DEVICE>-<NNNN>`). Stored\nverbatim when present; absent → the server mints the deterministic\nshift-based ref. The global `UNIQUE(order_ref)` index keeps both paths\ncollision-safe (a managed per-device code makes concurrent tills unique).'),
  "payment_method": zod.string(),
  "payment_splits": zod.array(zod.object({
  "amount": zod.number(),
  "method": zod.string(),
  "reference": zod.string().nullish()
})).nullish(),
  "shift_id": zod.uuid(),
  "subtotal": zod.number().nullish(),
  "tax_amount": zod.number().nullish(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number().nullish()
})

export const CreateOrderResponse = zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_name": zod.string().nullish(),
  "delivery_channel": zod.string().nullish().describe('Delivery channel (\"in_mall\" | \"outside\") of the linked delivery order,\nsurfaced on the list so clients can flag + segment delivery orders\nwithout a per-order detail fetch. `null` for dine-in orders.'),
  "delivery_fee": zod.number().describe('Delivery charge in piastres, shown separately from the item subtotal.\nAlways 0 for dine-in orders; for delivery orders\n`total_amount == subtotal + tax_amount + delivery_fee` (minus discount).'),
  "delivery_lat": zod.number().nullish().describe('Customer location of the linked delivery order, so clients can link out\nto a map (e.g. Google Maps) without a per-order detail fetch. `null` for\ndine-in orders or delivery orders without captured coordinates.'),
  "delivery_lng": zod.number().nullish(),
  "delivery_order_id": zod.uuid().nullish().describe('Links a finalized delivery order back to its `delivery_orders` row\n(customer, address, channel, zone). `null` for dine-in orders.'),
  "discount_amount": zod.number(),
  "discount_id": zod.uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "order_number": zod.number(),
  "order_ref": zod.string().nullish().describe('Human-readable, org-unique reference (e.g. \"DT-260614-0042\"). Additive\nalongside the per-shift order_number. Optional only during the rollout\nwindow before the historical backfill runs; never null afterwards.'),
  "order_type": zod.string().describe('Order origin: \"dine_in\" (POS sale) or \"delivery\" (finalized delivery\norder). Defaults to \"dine_in\" for every POS sale.'),
  "payment_legs": zod.array(zod.object({
  "amount": zod.number(),
  "method": zod.string()
}).describe('One tender against an order (`order_payments`). A split sale has several.')).describe('What was ACTUALLY tendered, one entry per `order_payments` row — the same\nrows every money report buckets by. A single-tender order has one leg; a\nsplit order has one per leg (e.g. card 285.00 + cash 255.00). Empty on the\nresponse to order creation, where the legs are written just after the row\nthis statement returns; every read hydrates it.'),
  "payment_method": zod.string().describe('The order\'s NOMINAL payment label. For a split order this is the literal\n`\'mixed\'` — a label that exists in no money report, because reports bucket\nby what was actually tendered. Use [`Order::payment_legs`] for the real\nmethods; treat this as a display badge only.'),
  "shift_id": zod.uuid(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "tax_amount": zod.number(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number(),
  "void_note": zod.string().nullish(),
  "void_reason": zod.string().nullish(),
  "voided_at": zod.iso.datetime({"offset":true}).nullish(),
  "voided_by": zod.uuid().nullish(),
  "waiter_id": zod.uuid().nullish().describe('The WAITER who opened this order\'s ticket (`open_tickets.opened_by`),\nstamped server-side at settle time. `null` for direct teller sales and\ndelivery orders (they never pass through a waiter\'s ticket).'),
  "waiter_name": zod.string().nullish()
}).and(zod.object({
  "delivery": zod.union([zod.null(),zod.object({
  "address_line": zod.string().nullish(),
  "channel": zod.string().describe('\"in_mall\" or \"outside\".'),
  "customer_phone": zod.string(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish().describe('Human-readable delivery reference (e.g. \"D-DT-260614-0042\").'),
  "floor": zod.string().nullish(),
  "landmark": zod.string().nullish(),
  "payment_method_hint": zod.string().nullish().describe('Payment method the customer indicated at intake (\"cash\"\/\"card\"); the\nteller confirms the actual method at finalize.'),
  "place_name": zod.string().nullish(),
  "road_distance_meters": zod.number().nullish().describe('Road distance (meters) used to price the delivery, when known.'),
  "unit_number": zod.string().nullish(),
  "zone_name": zod.string().nullish().describe('Name of the matched delivery zone ring, when an outside order matched one.')
}).describe('Delivery context (customer phone, address, channel, zone), populated\nonly on the single-order detail endpoint and only when the order\noriginated from a delivery order. `null`\/absent for dine-in orders.')]).optional(),
  "items": zod.array(zod.object({
  "bundle_id": zod.uuid().nullish(),
  "bundle_unit_price": zod.number().nullish(),
  "cost_missing": zod.boolean().describe('True when any cost component could not be resolved.'),
  "deductions_snapshot": zod.unknown(),
  "id": zod.uuid(),
  "item_name": zod.string(),
  "line_cost": zod.number().nullish().describe('Full line COGS in piastres (recipe + addons + optionals + components).\n`null` ⟺ unknown.'),
  "line_total": zod.number(),
  "menu_item_id": zod.uuid().nullish(),
  "name_translations": zod.looseObject({

}),
  "notes": zod.string().nullish(),
  "order_id": zod.uuid(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_cost": zod.number().nullish().describe('Recipe-only cost per unit in piastres (incl. swaps). `null` ⟺ unknown\nor bundle line.'),
  "unit_price": zod.number()
}).and(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "addon_name": zod.string(),
  "id": zod.uuid(),
  "line_cost": zod.number().nullish().describe('Ingredient cost of this addon line in piastres. `null` ⟺ unknown, or\na swap addon (its cost lives in the item\'s recipe cost).'),
  "line_total": zod.number(),
  "name_translations": zod.looseObject({

}),
  "order_item_id": zod.uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "bundle_components": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "addon_name": zod.string(),
  "component_item_id": zod.uuid(),
  "id": zod.uuid(),
  "line_total": zod.number(),
  "name_translations": zod.looseObject({

}),
  "order_line_id": zod.uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "optionals": zod.array(zod.object({
  "component_item_id": zod.uuid(),
  "field_name": zod.string(),
  "id": zod.uuid(),
  "name_translations": zod.looseObject({

}),
  "optional_field_id": zod.uuid().nullish(),
  "order_line_id": zod.uuid(),
  "price": zod.number()
})),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "optionals": zod.array(zod.object({
  "cost": zod.number().nullish().describe('Ingredient cost per parent-item unit in piastres. `null` ⟺ unknown or\nno ingredient linked.'),
  "field_name": zod.string(),
  "id": zod.uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "name_translations": zod.looseObject({

}),
  "optional_field_id": zod.uuid().nullish(),
  "order_item_id": zod.uuid(),
  "org_ingredient_id": zod.uuid().nullish(),
  "price": zod.number(),
  "quantity_deducted": zod.number().nullish()
}))
}))),
  "warnings": zod.array(zod.string()).optional().describe('Non-fatal warnings raised while placing the order — currently used to\nflag ingredients that were oversold (stock driven below zero). Empty\nfor reads\/refunds.')
}))


export const ExportOrdersQueryParams = zod.object({
  "branch_id": zod.uuid().optional(),
  "shift_id": zod.uuid().optional(),
  "teller_name": zod.string().optional(),
  "waiter_name": zod.string().optional().describe('Filter by the WAITER who opened the ticket (ILIKE, partial match).'),
  "payment_method": zod.string().optional(),
  "status": zod.string().optional(),
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional()
})

export const ExportOrdersResponse = zod.object({
  "data": zod.array(zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_name": zod.string().nullish(),
  "delivery_channel": zod.string().nullish().describe('Delivery channel (\"in_mall\" | \"outside\") of the linked delivery order,\nsurfaced on the list so clients can flag + segment delivery orders\nwithout a per-order detail fetch. `null` for dine-in orders.'),
  "delivery_fee": zod.number().describe('Delivery charge in piastres, shown separately from the item subtotal.\nAlways 0 for dine-in orders; for delivery orders\n`total_amount == subtotal + tax_amount + delivery_fee` (minus discount).'),
  "delivery_lat": zod.number().nullish().describe('Customer location of the linked delivery order, so clients can link out\nto a map (e.g. Google Maps) without a per-order detail fetch. `null` for\ndine-in orders or delivery orders without captured coordinates.'),
  "delivery_lng": zod.number().nullish(),
  "delivery_order_id": zod.uuid().nullish().describe('Links a finalized delivery order back to its `delivery_orders` row\n(customer, address, channel, zone). `null` for dine-in orders.'),
  "discount_amount": zod.number(),
  "discount_id": zod.uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "order_number": zod.number(),
  "order_ref": zod.string().nullish().describe('Human-readable, org-unique reference (e.g. \"DT-260614-0042\"). Additive\nalongside the per-shift order_number. Optional only during the rollout\nwindow before the historical backfill runs; never null afterwards.'),
  "order_type": zod.string().describe('Order origin: \"dine_in\" (POS sale) or \"delivery\" (finalized delivery\norder). Defaults to \"dine_in\" for every POS sale.'),
  "payment_legs": zod.array(zod.object({
  "amount": zod.number(),
  "method": zod.string()
}).describe('One tender against an order (`order_payments`). A split sale has several.')).describe('What was ACTUALLY tendered, one entry per `order_payments` row — the same\nrows every money report buckets by. A single-tender order has one leg; a\nsplit order has one per leg (e.g. card 285.00 + cash 255.00). Empty on the\nresponse to order creation, where the legs are written just after the row\nthis statement returns; every read hydrates it.'),
  "payment_method": zod.string().describe('The order\'s NOMINAL payment label. For a split order this is the literal\n`\'mixed\'` — a label that exists in no money report, because reports bucket\nby what was actually tendered. Use [`Order::payment_legs`] for the real\nmethods; treat this as a display badge only.'),
  "shift_id": zod.uuid(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "tax_amount": zod.number(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number(),
  "void_note": zod.string().nullish(),
  "void_reason": zod.string().nullish(),
  "voided_at": zod.iso.datetime({"offset":true}).nullish(),
  "voided_by": zod.uuid().nullish(),
  "waiter_id": zod.uuid().nullish().describe('The WAITER who opened this order\'s ticket (`open_tickets.opened_by`),\nstamped server-side at settle time. `null` for direct teller sales and\ndelivery orders (they never pass through a waiter\'s ticket).'),
  "waiter_name": zod.string().nullish()
}).and(zod.object({
  "items": zod.array(zod.object({
  "bundle_id": zod.uuid().nullish(),
  "bundle_unit_price": zod.number().nullish(),
  "cost_missing": zod.boolean().describe('True when any cost component could not be resolved.'),
  "deductions_snapshot": zod.unknown(),
  "id": zod.uuid(),
  "item_name": zod.string(),
  "line_cost": zod.number().nullish().describe('Full line COGS in piastres (recipe + addons + optionals + components).\n`null` ⟺ unknown.'),
  "line_total": zod.number(),
  "menu_item_id": zod.uuid().nullish(),
  "name_translations": zod.looseObject({

}),
  "notes": zod.string().nullish(),
  "order_id": zod.uuid(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_cost": zod.number().nullish().describe('Recipe-only cost per unit in piastres (incl. swaps). `null` ⟺ unknown\nor bundle line.'),
  "unit_price": zod.number()
}).and(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "addon_name": zod.string(),
  "id": zod.uuid(),
  "line_cost": zod.number().nullish().describe('Ingredient cost of this addon line in piastres. `null` ⟺ unknown, or\na swap addon (its cost lives in the item\'s recipe cost).'),
  "line_total": zod.number(),
  "name_translations": zod.looseObject({

}),
  "order_item_id": zod.uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "bundle_components": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "addon_name": zod.string(),
  "component_item_id": zod.uuid(),
  "id": zod.uuid(),
  "line_total": zod.number(),
  "name_translations": zod.looseObject({

}),
  "order_line_id": zod.uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "optionals": zod.array(zod.object({
  "component_item_id": zod.uuid(),
  "field_name": zod.string(),
  "id": zod.uuid(),
  "name_translations": zod.looseObject({

}),
  "optional_field_id": zod.uuid().nullish(),
  "order_line_id": zod.uuid(),
  "price": zod.number()
})),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "optionals": zod.array(zod.object({
  "cost": zod.number().nullish().describe('Ingredient cost per parent-item unit in piastres. `null` ⟺ unknown or\nno ingredient linked.'),
  "field_name": zod.string(),
  "id": zod.uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "name_translations": zod.looseObject({

}),
  "optional_field_id": zod.uuid().nullish(),
  "order_item_id": zod.uuid(),
  "org_ingredient_id": zod.uuid().nullish(),
  "price": zod.number(),
  "quantity_deducted": zod.number().nullish()
}))
}))),
  "payments": zod.array(zod.object({
  "amount": zod.number(),
  "id": zod.uuid(),
  "method": zod.string(),
  "order_id": zod.uuid(),
  "reference": zod.string().nullish()
}))
}))),
  "generated_at": zod.iso.datetime({"offset":true}),
  "ingredient_costs": zod.record(zod.string(), zod.number()),
  "summary": zod.object({
  "completed": zod.number(),
  "delivery_fees": zod.number().optional().describe('Total delivery charges (piastres) across completed orders in scope.\nLets the dashboard surface delivery revenue separately from item sales.'),
  "delivery_orders": zod.number().optional().describe('Count of completed delivery orders.'),
  "delivery_revenue": zod.number().optional().describe('Gross revenue (total_amount) of completed delivery orders.'),
  "discounts": zod.number(),
  "in_mall_fees": zod.number().optional(),
  "in_mall_orders": zod.number().optional().describe('In-mall channel: order count \/ gross revenue \/ delivery fees.'),
  "in_mall_revenue": zod.number().optional(),
  "line_items": zod.number().optional().describe('Units sold (SUM of order_items.quantity) across completed orders in\nscope. Counts units, not distinct lines, matching the item-sales\nreports (\"3× burger\" contributes 3).'),
  "outside_fees": zod.number().optional(),
  "outside_orders": zod.number().optional().describe('Outside channel: order count \/ gross revenue \/ delivery fees.'),
  "outside_revenue": zod.number().optional(),
  "revenue": zod.number(),
  "tips": zod.number(),
  "voided": zod.number()
}),
  "total": zod.number()
})


export const PreviewRecipeBody = zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "quantity": zod.number().optional()
})),
  "menu_item_id": zod.uuid(),
  "optional_field_ids": zod.array(zod.uuid()),
  "size_label": zod.string().nullish()
})

export const PreviewRecipeResponseItem = zod.object({
  "category": zod.string(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity": zod.number(),
  "source": zod.string(),
  "unit": zod.string()
})
export const PreviewRecipeResponse = zod.array(PreviewRecipeResponseItem)


export const GetOrderParams = zod.object({
  "order_id": zod.uuid().describe('Order ID')
})

export const GetOrderResponse = zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_name": zod.string().nullish(),
  "delivery_channel": zod.string().nullish().describe('Delivery channel (\"in_mall\" | \"outside\") of the linked delivery order,\nsurfaced on the list so clients can flag + segment delivery orders\nwithout a per-order detail fetch. `null` for dine-in orders.'),
  "delivery_fee": zod.number().describe('Delivery charge in piastres, shown separately from the item subtotal.\nAlways 0 for dine-in orders; for delivery orders\n`total_amount == subtotal + tax_amount + delivery_fee` (minus discount).'),
  "delivery_lat": zod.number().nullish().describe('Customer location of the linked delivery order, so clients can link out\nto a map (e.g. Google Maps) without a per-order detail fetch. `null` for\ndine-in orders or delivery orders without captured coordinates.'),
  "delivery_lng": zod.number().nullish(),
  "delivery_order_id": zod.uuid().nullish().describe('Links a finalized delivery order back to its `delivery_orders` row\n(customer, address, channel, zone). `null` for dine-in orders.'),
  "discount_amount": zod.number(),
  "discount_id": zod.uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "order_number": zod.number(),
  "order_ref": zod.string().nullish().describe('Human-readable, org-unique reference (e.g. \"DT-260614-0042\"). Additive\nalongside the per-shift order_number. Optional only during the rollout\nwindow before the historical backfill runs; never null afterwards.'),
  "order_type": zod.string().describe('Order origin: \"dine_in\" (POS sale) or \"delivery\" (finalized delivery\norder). Defaults to \"dine_in\" for every POS sale.'),
  "payment_legs": zod.array(zod.object({
  "amount": zod.number(),
  "method": zod.string()
}).describe('One tender against an order (`order_payments`). A split sale has several.')).describe('What was ACTUALLY tendered, one entry per `order_payments` row — the same\nrows every money report buckets by. A single-tender order has one leg; a\nsplit order has one per leg (e.g. card 285.00 + cash 255.00). Empty on the\nresponse to order creation, where the legs are written just after the row\nthis statement returns; every read hydrates it.'),
  "payment_method": zod.string().describe('The order\'s NOMINAL payment label. For a split order this is the literal\n`\'mixed\'` — a label that exists in no money report, because reports bucket\nby what was actually tendered. Use [`Order::payment_legs`] for the real\nmethods; treat this as a display badge only.'),
  "shift_id": zod.uuid(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "tax_amount": zod.number(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number(),
  "void_note": zod.string().nullish(),
  "void_reason": zod.string().nullish(),
  "voided_at": zod.iso.datetime({"offset":true}).nullish(),
  "voided_by": zod.uuid().nullish(),
  "waiter_id": zod.uuid().nullish().describe('The WAITER who opened this order\'s ticket (`open_tickets.opened_by`),\nstamped server-side at settle time. `null` for direct teller sales and\ndelivery orders (they never pass through a waiter\'s ticket).'),
  "waiter_name": zod.string().nullish()
}).and(zod.object({
  "delivery": zod.union([zod.null(),zod.object({
  "address_line": zod.string().nullish(),
  "channel": zod.string().describe('\"in_mall\" or \"outside\".'),
  "customer_phone": zod.string(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish().describe('Human-readable delivery reference (e.g. \"D-DT-260614-0042\").'),
  "floor": zod.string().nullish(),
  "landmark": zod.string().nullish(),
  "payment_method_hint": zod.string().nullish().describe('Payment method the customer indicated at intake (\"cash\"\/\"card\"); the\nteller confirms the actual method at finalize.'),
  "place_name": zod.string().nullish(),
  "road_distance_meters": zod.number().nullish().describe('Road distance (meters) used to price the delivery, when known.'),
  "unit_number": zod.string().nullish(),
  "zone_name": zod.string().nullish().describe('Name of the matched delivery zone ring, when an outside order matched one.')
}).describe('Delivery context (customer phone, address, channel, zone), populated\nonly on the single-order detail endpoint and only when the order\noriginated from a delivery order. `null`\/absent for dine-in orders.')]).optional(),
  "items": zod.array(zod.object({
  "bundle_id": zod.uuid().nullish(),
  "bundle_unit_price": zod.number().nullish(),
  "cost_missing": zod.boolean().describe('True when any cost component could not be resolved.'),
  "deductions_snapshot": zod.unknown(),
  "id": zod.uuid(),
  "item_name": zod.string(),
  "line_cost": zod.number().nullish().describe('Full line COGS in piastres (recipe + addons + optionals + components).\n`null` ⟺ unknown.'),
  "line_total": zod.number(),
  "menu_item_id": zod.uuid().nullish(),
  "name_translations": zod.looseObject({

}),
  "notes": zod.string().nullish(),
  "order_id": zod.uuid(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish(),
  "unit_cost": zod.number().nullish().describe('Recipe-only cost per unit in piastres (incl. swaps). `null` ⟺ unknown\nor bundle line.'),
  "unit_price": zod.number()
}).and(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "addon_name": zod.string(),
  "id": zod.uuid(),
  "line_cost": zod.number().nullish().describe('Ingredient cost of this addon line in piastres. `null` ⟺ unknown, or\na swap addon (its cost lives in the item\'s recipe cost).'),
  "line_total": zod.number(),
  "name_translations": zod.looseObject({

}),
  "order_item_id": zod.uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "bundle_components": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "addon_name": zod.string(),
  "component_item_id": zod.uuid(),
  "id": zod.uuid(),
  "line_total": zod.number(),
  "name_translations": zod.looseObject({

}),
  "order_line_id": zod.uuid(),
  "quantity": zod.number(),
  "unit_price": zod.number()
})),
  "item_id": zod.uuid(),
  "item_name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "optionals": zod.array(zod.object({
  "component_item_id": zod.uuid(),
  "field_name": zod.string(),
  "id": zod.uuid(),
  "name_translations": zod.looseObject({

}),
  "optional_field_id": zod.uuid().nullish(),
  "order_line_id": zod.uuid(),
  "price": zod.number()
})),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
})).optional(),
  "optionals": zod.array(zod.object({
  "cost": zod.number().nullish().describe('Ingredient cost per parent-item unit in piastres. `null` ⟺ unknown or\nno ingredient linked.'),
  "field_name": zod.string(),
  "id": zod.uuid(),
  "ingredient_name": zod.string().nullish(),
  "ingredient_unit": zod.string().nullish(),
  "name_translations": zod.looseObject({

}),
  "optional_field_id": zod.uuid().nullish(),
  "order_item_id": zod.uuid(),
  "org_ingredient_id": zod.uuid().nullish(),
  "price": zod.number(),
  "quantity_deducted": zod.number().nullish()
}))
}))),
  "warnings": zod.array(zod.string()).optional().describe('Non-fatal warnings raised while placing the order — currently used to\nflag ingredients that were oversold (stock driven below zero). Empty\nfor reads\/refunds.')
}))


export const VoidOrderParams = zod.object({
  "order_id": zod.uuid().describe('Order ID')
})

export const VoidOrderBody = zod.object({
  "note": zod.string().nullish().describe('Free-text explanation. Required when `reason` is \"other\".'),
  "reason": zod.string(),
  "restore_inventory": zod.boolean().nullish(),
  "voided_at": zod.iso.datetime({"offset":true}).nullish()
})

export const VoidOrderResponse = zod.object({
  "amount_tendered": zod.number().nullish(),
  "branch_id": zod.uuid(),
  "change_given": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_name": zod.string().nullish(),
  "delivery_channel": zod.string().nullish().describe('Delivery channel (\"in_mall\" | \"outside\") of the linked delivery order,\nsurfaced on the list so clients can flag + segment delivery orders\nwithout a per-order detail fetch. `null` for dine-in orders.'),
  "delivery_fee": zod.number().describe('Delivery charge in piastres, shown separately from the item subtotal.\nAlways 0 for dine-in orders; for delivery orders\n`total_amount == subtotal + tax_amount + delivery_fee` (minus discount).'),
  "delivery_lat": zod.number().nullish().describe('Customer location of the linked delivery order, so clients can link out\nto a map (e.g. Google Maps) without a per-order detail fetch. `null` for\ndine-in orders or delivery orders without captured coordinates.'),
  "delivery_lng": zod.number().nullish(),
  "delivery_order_id": zod.uuid().nullish().describe('Links a finalized delivery order back to its `delivery_orders` row\n(customer, address, channel, zone). `null` for dine-in orders.'),
  "discount_amount": zod.number(),
  "discount_id": zod.uuid().nullish(),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "order_number": zod.number(),
  "order_ref": zod.string().nullish().describe('Human-readable, org-unique reference (e.g. \"DT-260614-0042\"). Additive\nalongside the per-shift order_number. Optional only during the rollout\nwindow before the historical backfill runs; never null afterwards.'),
  "order_type": zod.string().describe('Order origin: \"dine_in\" (POS sale) or \"delivery\" (finalized delivery\norder). Defaults to \"dine_in\" for every POS sale.'),
  "payment_legs": zod.array(zod.object({
  "amount": zod.number(),
  "method": zod.string()
}).describe('One tender against an order (`order_payments`). A split sale has several.')).describe('What was ACTUALLY tendered, one entry per `order_payments` row — the same\nrows every money report buckets by. A single-tender order has one leg; a\nsplit order has one per leg (e.g. card 285.00 + cash 255.00). Empty on the\nresponse to order creation, where the legs are written just after the row\nthis statement returns; every read hydrates it.'),
  "payment_method": zod.string().describe('The order\'s NOMINAL payment label. For a split order this is the literal\n`\'mixed\'` — a label that exists in no money report, because reports bucket\nby what was actually tendered. Use [`Order::payment_legs`] for the real\nmethods; treat this as a display badge only.'),
  "shift_id": zod.uuid(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "tax_amount": zod.number(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "tip_amount": zod.number().nullish(),
  "tip_payment_method": zod.string().nullish(),
  "total_amount": zod.number(),
  "void_note": zod.string().nullish(),
  "void_reason": zod.string().nullish(),
  "voided_at": zod.iso.datetime({"offset":true}).nullish(),
  "voided_by": zod.uuid().nullish(),
  "waiter_id": zod.uuid().nullish().describe('The WAITER who opened this order\'s ticket (`open_tickets.opened_by`),\nstamped server-side at settle time. `null` for direct teller sales and\ndelivery orders (they never pass through a waiter\'s ticket).'),
  "waiter_name": zod.string().nullish()
})


export const ListOrgsResponseItem = zod.object({
  "currency_code": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "logo_url": zod.string().nullish(),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().describe('Tax rate as a decimal (e.g. `0.14` for 14% VAT).\nStored as `BigDecimal` internally; transmitted as a JSON number.'),
  "timezone": zod.string().describe('IANA timezone name. The org-level default that branches inherit when\ntheir own timezone is unset. Defaults to `Africa\/Cairo`.')
})
export const ListOrgsResponse = zod.array(ListOrgsResponseItem)


export const CreateOrgBody = zod.object({
  "currency_code": zod.string().nullish(),
  "logo": zod.instanceof(File).nullish().describe('Logo image file. PNG, JPEG, or WebP. Optional — omit the field\nentirely to create the org without a logo.'),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().nullish(),
  "timezone": zod.string().nullish()
})

export const CreateOrgResponse = zod.object({
  "currency_code": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "logo_url": zod.string().nullish(),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().describe('Tax rate as a decimal (e.g. `0.14` for 14% VAT).\nStored as `BigDecimal` internally; transmitted as a JSON number.'),
  "timezone": zod.string().describe('IANA timezone name. The org-level default that branches inherit when\ntheir own timezone is unset. Defaults to `Africa\/Cairo`.')
})


export const GetOrgParams = zod.object({
  "id": zod.uuid().describe('Organization ID')
})

export const GetOrgResponse = zod.object({
  "currency_code": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "logo_url": zod.string().nullish(),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().describe('Tax rate as a decimal (e.g. `0.14` for 14% VAT).\nStored as `BigDecimal` internally; transmitted as a JSON number.'),
  "timezone": zod.string().describe('IANA timezone name. The org-level default that branches inherit when\ntheir own timezone is unset. Defaults to `Africa\/Cairo`.')
})


export const DeleteOrgParams = zod.object({
  "id": zod.uuid().describe('Organization ID')
})

export const DeleteOrgResponse = zod.void()


export const UpdateOrgParams = zod.object({
  "id": zod.uuid().describe('Organization ID')
})

export const UpdateOrgBody = zod.object({
  "currency_code": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "logo_url": zod.string().nullish().describe('`null` clears the logo; absent leaves it unchanged. To set a new\nlogo, use `PUT \/orgs\/{id}\/logo` (multipart) instead — JSON updates\nonly accept the clear-to-null case here.'),
  "name": zod.string().nullish(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string().nullish(),
  "tax_rate": zod.number().nullish(),
  "timezone": zod.string().nullish().describe('IANA timezone name (e.g. `Africa\/Cairo`). Validated against the\nPostgreSQL timezone database. Branches inherit this when their own\ntimezone is unset.')
})

export const UpdateOrgResponse = zod.object({
  "currency_code": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "logo_url": zod.string().nullish(),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().describe('Tax rate as a decimal (e.g. `0.14` for 14% VAT).\nStored as `BigDecimal` internally; transmitted as a JSON number.'),
  "timezone": zod.string().describe('IANA timezone name. The org-level default that branches inherit when\ntheir own timezone is unset. Defaults to `Africa\/Cairo`.')
})


export const OrgBookingQrParams = zod.object({
  "id": zod.uuid().describe('Organisation ID')
})

export const orgBookingQrQueryDpiMin = 0;

export const orgBookingQrQueryModulePxMin = 0;



export const OrgBookingQrQueryParams = zod.object({
  "card": zod.boolean().optional().describe('`true` (default) → branded A6 card PNG; `false` → plain receipt QR PNG.'),
  "caption": zod.string().optional().describe('Dynamic caption line beneath the tagline (A6 card only).'),
  "dpi": zod.number().min(orgBookingQrQueryDpiMin).optional().describe('Raster DPI for the A6 card (clamped 72–2400). Default 600.'),
  "bleed_mm": zod.number().optional().describe('Print bleed in mm (A6 card only). Default 0.'),
  "crop_marks": zod.boolean().optional().describe('Draw crop marks (A6 card, only meaningful when `bleed_mm > 0`).'),
  "svg": zod.boolean().optional().describe('Return the A6 card as SVG (`data:image\/svg+xml;base64,…`). Default false.'),
  "module_px": zod.number().min(orgBookingQrQueryModulePxMin).optional().describe('Pixels per module for the plain receipt QR (1–40). Default 16.')
})

export const OrgBookingQrResponse = zod.object({
  "kind": zod.string(),
  "long_url": zod.string(),
  "qr_data_url": zod.string().describe('`data:image\/png;base64,…` (or `data:image\/svg+xml;base64,…` when\n`svg=true`).  Paste into a browser `<img src=\"…\">` to verify.'),
  "short_code": zod.string(),
  "short_url": zod.string()
}).describe('JSON returned from every QR-generation endpoint.')


export const UploadOrgLogoParams = zod.object({
  "id": zod.uuid().describe('Organization ID')
})

export const UploadOrgLogoBody = zod.object({
  "logo": zod.instanceof(File)
})

export const UploadOrgLogoResponse = zod.object({
  "currency_code": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "logo_url": zod.string().nullish(),
  "name": zod.string(),
  "receipt_footer": zod.string().nullish(),
  "slug": zod.string(),
  "tax_rate": zod.number().describe('Tax rate as a decimal (e.g. `0.14` for 14% VAT).\nStored as `BigDecimal` internally; transmitted as a JSON number.'),
  "timezone": zod.string().describe('IANA timezone name. The org-level default that branches inherit when\ntheir own timezone is unset. Defaults to `Africa\/Cairo`.')
})


export const OfflineAuthBundleParams = zod.object({
  "id": zod.uuid().describe('Organization ID')
})

export const OfflineAuthBundleResponse = zod.object({
  "generated_at": zod.iso.datetime({"offset":true}),
  "lan_secret": zod.string().describe('The org\'s stable LAN-relay secret, hex-encoded. Devices derive a per-branch\nHMAC-SHA256 subkey from it to sign every LAN message (Phase E), so only\nbranch-provisioned devices are trusted on the shared Wi-Fi.'),
  "org_id": zod.uuid(),
  "tellers": zod.array(zod.object({
  "is_active": zod.boolean(),
  "name": zod.string(),
  "offline_pin_hash": zod.string().nullish().describe('argon2id verifier of the user\'s PIN (derived at online login). `null`\nuntil the user has logged in online at least once.'),
  "role": zod.string().describe('PIN-login role: `teller`, `waiter`, or `kitchen`. The device uses this to\nroute the offline session (a waiter lands on tickets, a kitchen device on\nthe KDS) without re-querying the backend.'),
  "user_id": zod.uuid()
})).describe('All PIN-login credentials for the org (tellers, waiters, and kitchen\ndevices). Field name kept as `tellers` for wire compatibility; it carries\nevery offline-capable role, distinguished by `role`.')
})


export const GetOnboardingParams = zod.object({
  "id": zod.uuid().describe('Organization ID')
})

export const GetOnboardingResponse = zod.object({
  "can_complete": zod.boolean().describe('True when every `required` step is done (the Finish button enabler).'),
  "completed": zod.boolean().describe('Derived terminal flag (`completed_at IS NOT NULL`) — the dashboard\nroutes into the wizard while this is false.'),
  "completed_at": zod.iso.datetime({"offset":true}).nullish(),
  "org_id": zod.uuid(),
  "recipe_coverage": zod.number().describe('Recipe coverage across active menu items (0..1) — drives the cost\nengine; surfaced separately because it\'s a percentage, not a bool.'),
  "steps": zod.array(zod.object({
  "count": zod.number().describe('Supporting count (branches created, items added, …).'),
  "done": zod.boolean().describe('True when the underlying data exists.'),
  "key": zod.string().describe('Stable key the dashboard switches on — never localized.'),
  "required": zod.boolean().describe('Steps that are encouraged but not blocking (`required = false`\nnever gates `can_complete`).')
}).describe('One derived setup step.'))
})


export const CompleteOnboardingParams = zod.object({
  "id": zod.uuid().describe('Organization ID')
})

export const CompleteOnboardingResponse = zod.object({
  "can_complete": zod.boolean().describe('True when every `required` step is done (the Finish button enabler).'),
  "completed": zod.boolean().describe('Derived terminal flag (`completed_at IS NOT NULL`) — the dashboard\nroutes into the wizard while this is false.'),
  "completed_at": zod.iso.datetime({"offset":true}).nullish(),
  "org_id": zod.uuid(),
  "recipe_coverage": zod.number().describe('Recipe coverage across active menu items (0..1) — drives the cost\nengine; surfaced separately because it\'s a percentage, not a bool.'),
  "steps": zod.array(zod.object({
  "count": zod.number().describe('Supporting count (branches created, items added, …).'),
  "done": zod.boolean().describe('True when the underlying data exists.'),
  "key": zod.string().describe('Stable key the dashboard switches on — never localized.'),
  "required": zod.boolean().describe('Steps that are encouraged but not blocking (`required = false`\nnever gates `can_complete`).')
}).describe('One derived setup step.'))
})


export const OrgQrParams = zod.object({
  "id": zod.uuid().describe('Organisation ID')
})

export const orgQrQueryDpiMin = 0;

export const orgQrQueryModulePxMin = 0;



export const OrgQrQueryParams = zod.object({
  "card": zod.boolean().optional().describe('`true` (default) → branded A6 card PNG; `false` → plain receipt QR PNG.'),
  "caption": zod.string().optional().describe('Dynamic caption line beneath the tagline (A6 card only).'),
  "dpi": zod.number().min(orgQrQueryDpiMin).optional().describe('Raster DPI for the A6 card (clamped 72–2400). Default 600.'),
  "bleed_mm": zod.number().optional().describe('Print bleed in mm (A6 card only). Default 0.'),
  "crop_marks": zod.boolean().optional().describe('Draw crop marks (A6 card, only meaningful when `bleed_mm > 0`).'),
  "svg": zod.boolean().optional().describe('Return the A6 card as SVG (`data:image\/svg+xml;base64,…`). Default false.'),
  "module_px": zod.number().min(orgQrQueryModulePxMin).optional().describe('Pixels per module for the plain receipt QR (1–40). Default 16.')
})

export const OrgQrResponse = zod.object({
  "kind": zod.string(),
  "long_url": zod.string(),
  "qr_data_url": zod.string().describe('`data:image\/png;base64,…` (or `data:image\/svg+xml;base64,…` when\n`svg=true`).  Paste into a browser `<img src=\"…\">` to verify.'),
  "short_code": zod.string(),
  "short_url": zod.string()
}).describe('JSON returned from every QR-generation endpoint.')


export const ListPaymentMethodsResponseItem = zod.object({
  "color": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "icon": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_cash": zod.boolean(),
  "label_translations": zod.unknown(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "visible_in_integrations": zod.boolean().describe('When false, orders tendered with this method are excluded entirely\nfrom the partner analytics API (`\/integrations\/analytics\/orders`) —\nrows and aggregates alike. Defaults to true.')
})
export const ListPaymentMethodsResponse = zod.array(ListPaymentMethodsResponseItem)


export const CreatePaymentMethodBody = zod.object({
  "color": zod.string(),
  "icon": zod.string(),
  "is_active": zod.boolean().nullish(),
  "is_cash": zod.boolean(),
  "label_translations": zod.record(zod.string(), zod.string()),
  "name": zod.string(),
  "visible_in_integrations": zod.boolean().nullish().describe('Defaults to true — see [`OrgPaymentMethod::visible_in_integrations`].')
})

export const CreatePaymentMethodResponse = zod.object({
  "color": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "icon": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_cash": zod.boolean(),
  "label_translations": zod.unknown(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "visible_in_integrations": zod.boolean().describe('When false, orders tendered with this method are excluded entirely\nfrom the partner analytics API (`\/integrations\/analytics\/orders`) —\nrows and aggregates alike. Defaults to true.')
})


export const UpdatePaymentMethodParams = zod.object({
  "id": zod.uuid().describe('Payment Method ID')
})

export const UpdatePaymentMethodBody = zod.object({
  "color": zod.string().nullish(),
  "icon": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "is_cash": zod.boolean().nullish(),
  "label_translations": zod.record(zod.string(), zod.string()).nullish(),
  "name": zod.string().nullish(),
  "visible_in_integrations": zod.boolean().nullish()
})

export const UpdatePaymentMethodResponse = zod.object({
  "color": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "icon": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_cash": zod.boolean(),
  "label_translations": zod.unknown(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "visible_in_integrations": zod.boolean().describe('When false, orders tendered with this method are excluded entirely\nfrom the partner analytics API (`\/integrations\/analytics\/orders`) —\nrows and aggregates alike. Defaults to true.')
})


export const ActivatePaymentMethodParams = zod.object({
  "id": zod.uuid().describe('Payment Method ID')
})

export const ActivatePaymentMethodResponse = zod.object({
  "color": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "icon": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_cash": zod.boolean(),
  "label_translations": zod.unknown(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "visible_in_integrations": zod.boolean().describe('When false, orders tendered with this method are excluded entirely\nfrom the partner analytics API (`\/integrations\/analytics\/orders`) —\nrows and aggregates alike. Defaults to true.')
})


export const DeactivatePaymentMethodParams = zod.object({
  "id": zod.uuid().describe('Payment Method ID')
})

export const DeactivatePaymentMethodResponse = zod.object({
  "color": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "icon": zod.string(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_cash": zod.boolean(),
  "label_translations": zod.unknown(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "visible_in_integrations": zod.boolean().describe('When false, orders tendered with this method are excluded entirely\nfrom the partner analytics API (`\/integrations\/analytics\/orders`) —\nrows and aggregates alike. Defaults to true.')
})


export const GetPermissionMatrixParams = zod.object({
  "user_id": zod.uuid().describe('User ID')
})

export const GetPermissionMatrixResponseItem = zod.object({
  "action": zod.string(),
  "effective": zod.boolean(),
  "resource": zod.string(),
  "role_default": zod.boolean().nullish(),
  "user_override": zod.boolean().nullish()
}).describe('One cell of the resolved permission matrix for a user.\n`effective` = `user_override` if present, else `role_default`, else false.')
export const GetPermissionMatrixResponse = zod.array(GetPermissionMatrixResponseItem)


export const GetRolePermissionsResponseItem = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "resource": zod.string(),
  "role": zod.string()
})
export const GetRolePermissionsResponse = zod.array(GetRolePermissionsResponseItem)


export const UpsertRolePermissionBody = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "resource": zod.string(),
  "role": zod.string()
})

export const UpsertRolePermissionResponse = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "resource": zod.string(),
  "role": zod.string()
})


export const GetUserPermissionsParams = zod.object({
  "user_id": zod.uuid().describe('User ID')
})

export const GetUserPermissionsResponseItem = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "id": zod.uuid(),
  "resource": zod.string(),
  "user_id": zod.uuid()
})
export const GetUserPermissionsResponse = zod.array(GetUserPermissionsResponseItem)


export const UpsertUserPermissionParams = zod.object({
  "user_id": zod.uuid().describe('User ID')
})

export const UpsertUserPermissionBody = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "resource": zod.string()
})

export const UpsertUserPermissionResponse = zod.object({
  "action": zod.string(),
  "granted": zod.boolean(),
  "id": zod.uuid(),
  "resource": zod.string(),
  "user_id": zod.uuid()
})


export const DeleteUserPermissionParams = zod.object({
  "user_id": zod.uuid().describe('User ID'),
  "resource": zod.string().describe('Resource name (e.g. menu_items, orders)'),
  "action": zod.string().describe('Action (create | read | update | delete)')
})

export const DeleteUserPermissionResponse = zod.void()


export const BookingBranchesQueryParams = zod.object({
  "org_id": zod.uuid()
})

export const BookingBranchesResponseItem = zod.object({
  "code": zod.string(),
  "id": zod.uuid(),
  "name": zod.string()
})
export const BookingBranchesResponse = zod.array(BookingBranchesResponseItem)


export const CreatePublicBookingBody = zod.object({
  "branch_id": zod.uuid(),
  "device_token": zod.string().nullish().describe('From `\/public\/otp\/verify`; required when the branch requires OTP.'),
  "guest_name": zod.string(),
  "locale": zod.string().nullish(),
  "notes": zod.string().nullish(),
  "party_size": zod.number(),
  "phone": zod.string(),
  "starts_at": zod.iso.datetime({"offset":true})
})

export const CreatePublicBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "can_modify": zod.boolean().describe('Still confirmed and further away than the branch\'s lead time.'),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "id": zod.uuid(),
  "manage_token": zod.string(),
  "notes": zod.string().nullish(),
  "party_size": zod.number(),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string(),
  "timezone": zod.string()
}).describe('What a guest sees on the manage page — no table ids, no staff fields.')


export const GetPublicBookingParams = zod.object({
  "token": zod.string().describe('Manage token from the confirmation link')
})

export const GetPublicBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "can_modify": zod.boolean().describe('Still confirmed and further away than the branch\'s lead time.'),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "id": zod.uuid(),
  "manage_token": zod.string(),
  "notes": zod.string().nullish(),
  "party_size": zod.number(),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string(),
  "timezone": zod.string()
}).describe('What a guest sees on the manage page — no table ids, no staff fields.')


export const UpdatePublicBookingParams = zod.object({
  "token": zod.string().describe('Manage token')
})

export const UpdatePublicBookingBody = zod.object({
  "notes": zod.string().nullish(),
  "party_size": zod.number().nullish(),
  "starts_at": zod.iso.datetime({"offset":true}).nullish()
})

export const UpdatePublicBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "can_modify": zod.boolean().describe('Still confirmed and further away than the branch\'s lead time.'),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "id": zod.uuid(),
  "manage_token": zod.string(),
  "notes": zod.string().nullish(),
  "party_size": zod.number(),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string(),
  "timezone": zod.string()
}).describe('What a guest sees on the manage page — no table ids, no staff fields.')


export const CancelPublicBookingParams = zod.object({
  "token": zod.string().describe('Manage token')
})

export const CancelPublicBookingResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "can_modify": zod.boolean().describe('Still confirmed and further away than the branch\'s lead time.'),
  "ends_at": zod.iso.datetime({"offset":true}),
  "guest_name": zod.string(),
  "id": zod.uuid(),
  "manage_token": zod.string(),
  "notes": zod.string().nullish(),
  "party_size": zod.number(),
  "starts_at": zod.iso.datetime({"offset":true}),
  "status": zod.string(),
  "timezone": zod.string()
}).describe('What a guest sees on the manage page — no table ids, no staff fields.')


export const PublicBranchesQueryParams = zod.object({
  "org_id": zod.uuid()
})

export const PublicBranchesResponseItem = zod.object({
  "code": zod.string(),
  "id": zod.uuid(),
  "in_mall_enabled": zod.boolean(),
  "in_mall_open_now": zod.boolean().describe('Effective-open right now (enabled + open shift + override + window).'),
  "in_mall_require_location": zod.boolean().describe('When false, in-mall ordering does not require a device GPS location.'),
  "name": zod.string(),
  "otp_required": zod.boolean().describe('When false, the public checkout skips OTP verification for this branch.'),
  "outside_enabled": zod.boolean(),
  "outside_open_now": zod.boolean(),
  "pickup_enabled": zod.boolean(),
  "pickup_open_now": zod.boolean(),
  "umbrella_enabled": zod.boolean(),
  "umbrella_open_now": zod.boolean()
})
export const PublicBranchesResponse = zod.array(PublicBranchesResponseItem)


export const BookingInfoParams = zod.object({
  "id": zod.uuid().describe('Branch ID')
})

export const bookingInfoResponseHoursItemDowMin = 0;



export const BookingInfoResponse = zod.object({
  "blackout_dates": zod.array(zod.string()),
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "default_duration_minutes": zod.number(),
  "enabled": zod.boolean(),
  "horizon_days": zod.number(),
  "hours": zod.array(zod.object({
  "close": zod.string(),
  "dow": zod.number().min(bookingInfoResponseHoursItemDowMin),
  "open": zod.string()
}).describe('One weekly booking window. `dow`: 0 = Sunday … 6 = Saturday. `open`\/`close`\nare `HH:MM` local; a close at or before open means \"closes after midnight\".')),
  "lead_time_minutes": zod.number(),
  "max_party": zod.number(),
  "min_party": zod.number(),
  "org_name": zod.string(),
  "require_otp": zod.boolean(),
  "slot_minutes": zod.number(),
  "timezone": zod.string(),
  "today": zod.string().describe('Today\'s service date in the branch zone (the picker\'s floor).')
})


export const BookingSlotsParams = zod.object({
  "id": zod.uuid().describe('Branch ID')
})

export const BookingSlotsQueryParams = zod.object({
  "date": zod.string(),
  "party_size": zod.number()
})

export const BookingSlotsResponse = zod.object({
  "date": zod.string(),
  "slots": zod.array(zod.object({
  "available": zod.boolean(),
  "starts_at": zod.iso.datetime({"offset":true})
})),
  "timezone": zod.string()
})


export const DeliveryQuoteParams = zod.object({
  "id": zod.uuid()
})

export const DeliveryQuoteQueryParams = zod.object({
  "lat": zod.number(),
  "lng": zod.number(),
  "channel": zod.string()
})

export const DeliveryQuoteResponse = zod.object({
  "distance_meters": zod.number().nullish(),
  "fee": zod.number().nullish(),
  "status": zod.string().describe('\"ok\" | \"out_of_range\" | \"unavailable\"'),
  "zone_id": zod.uuid().nullish(),
  "zone_name": zod.string().nullish()
})


export const PublicMenuParams = zod.object({
  "id": zod.uuid()
})

export const PublicMenuQueryParams = zod.object({
  "channel": zod.string(),
  "preview": zod.boolean().nullish().describe('Read-only browse preview. When `true`, the menu is returned even if the\nchannel is closed right now, so customers can browse while a branch is\nclosed. This NEVER relaxes the channel-\*enabled\* check, and the\ndelivery-quote \/ order-intake endpoints stay gated on open-now — so a\npreview can never become a real order against a closed channel.')
})

export const PublicMenuResponse = zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "is_available": zod.boolean(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "price": zod.number().describe('Channel-effective surcharge (piastres). Always present (resolved here).'),
  "type": zod.string().describe('`milk_type` | `coffee_type` | `extra` — the option\'s category.')
}).describe('One option in the org-wide addon catalog. The catalog is global (the POS\nmodel): every item can use any addon; swap-vs-additive is decided server-side\nfrom the addon `type` + the item recipe at order time. `price` is the\nchannel-effective surcharge in piastres (branch_channel → branch → catalog\ndefault). Channel-unavailable options are excluded from the catalog entirely.')).describe('Org-wide addon catalog (global, POS model): channel-effective, grouped by\n`type`, applicable to every item. Channel-unavailable options are excluded.'),
  "categories": zod.array(zod.object({
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

})
})),
  "discount": zod.union([zod.null(),zod.object({
  "dtype": zod.string().describe('\"percentage\" | \"fixed\".'),
  "id": zod.uuid(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "value": zod.number().describe('Percentage points (0-100) for `percentage`; piastres for `fixed`.')
}).describe('The active discount for this channel (customer-facing) or `null`. Applies\nto the item subtotal only — the delivery fee is always charged in full.')]).optional(),
  "items": zod.array(zod.object({
  "allowed_addon_ids": zod.array(zod.uuid()).describe('Explicit per-item addon allowlist (IDs from `menu_item_allowed_addons`).\nWhen non-empty the customizer filters the global catalog to these IDs by\ndefault, with a \"show all\" escape hatch. Empty = no restriction.'),
  "category_id": zod.uuid().nullish(),
  "default_milk_addon_id": zod.uuid().nullish().describe('The item\'s base\/default milk: the `milk_type` addon whose ingredient\nmatches the item recipe\'s milk ingredient. The online customizer\npre-selects it (mirrors the POS default-milk selection). `None` when the\nitem has no milk in its recipe or no matching milk addon exists.'),
  "description": zod.string().nullish(),
  "id": zod.uuid(),
  "image_url": zod.string().nullish(),
  "modifier_groups": zod.array(zod.object({
  "addon_type": zod.string().nullish().describe('The group\'s legacy addon type (`milk_type` \/ `coffee_type` \/ `extra` \/\ncustom) — the swap-family hint the customizer keys its delta-price\nestimate on. `None` for groups with no legacy lineage.'),
  "group_id": zod.uuid(),
  "is_required": zod.boolean(),
  "max_selections": zod.number().nullish(),
  "min_selections": zod.number(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "options": zod.array(zod.object({
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "option_id": zod.uuid(),
  "price": zod.number().describe('Channel-effective surcharge (piastres): branch_channel → branch →\nchannel → catalog default. Unavailable options are excluded entirely.')
}).describe('One option inside a per-item modifier group. `option_id` is the STABLE id —\nit equals the legacy `addon_item_id`, so order intake accepts it unchanged in\n`addons[].addon_item_id` (menu-unification stable-id rule).')),
  "selection_type": zod.string().describe('\"single\" | \"multi\".')
}).describe('A per-item modifier group from the unified model (`menu_item_modifier_groups`\n→ `modifier_groups`\/`modifier_options`), constraints resolved (attachment\noverrides beat group defaults) and options already filtered to the\nattachment\'s `included_option_ids`. Only addon-sourced options appear here —\nthe item\'s priced optionals stay in `optionals`. Empty until the org\'s\ncatalog is backfilled onto the unified tables; the customizer falls back to\nthe flat `addons` catalog + `allowed_addon_ids` in that case.')).describe('The item\'s modifier groups (unified model), channel-effective. Empty ⇒\nthe customizer falls back to `addons` + `allowed_addon_ids`.'),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "optionals": zod.array(zod.object({
  "id": zod.uuid(),
  "name": zod.string(),
  "name_translations": zod.looseObject({

}),
  "price": zod.number(),
  "size_label": zod.string().nullish()
}).describe('A per-item optional toggle (e.g. \"Extra hot\", \"No sugar\"). `price` is the\npiastres surcharge; `size_label` is set when the optional only applies to a\nspecific size.')),
  "price": zod.number(),
  "sizes": zod.array(zod.object({
  "label": zod.string(),
  "price": zod.number()
}))
}))
})


export const CreateDeliveryOrderBody = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.uuid(),
  "channel": zod.string(),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivery_notes": zod.string().nullish(),
  "device_token": zod.string().describe('Device-trust token from OTP verify (proves the phone).'),
  "floor": zod.string().nullish(),
  "items": zod.array(zod.object({
  "addons": zod.array(zod.object({
  "addon_item_id": zod.uuid(),
  "quantity": zod.number().optional(),
  "unit_price": zod.number().nullish().describe('Charged unit price (piastres) the POS applied for this addon. When present\nit is RECORDED as the addon\'s unit_price; absent → the server\'s expected\n(catalog) price is used. Bundle-component addons ignore this (server-priced).')
})).optional(),
  "menu_item_id": zod.uuid(),
  "notes": zod.string().nullish(),
  "optional_field_ids": zod.array(zod.uuid()).optional(),
  "quantity": zod.number(),
  "size_label": zod.string().nullish()
}).describe('One line of a public cart. Prices are NOT taken from the client — the server\nresolves them. `addons` reuses [`AddonInput`] but its `unit_price` is ignored.')),
  "landmark": zod.string().nullish(),
  "payment_method_hint": zod.string().describe('\"cash\" | \"card\" — a hint the teller can change at finalize.'),
  "place_name": zod.string().nullish(),
  "unit_number": zod.string().nullish()
})

export const CreateDeliveryOrderResponse = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.uuid(),
  "cancel_reason": zod.string().nullish(),
  "cancel_restocked": zod.boolean().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "cart": zod.looseObject({

}).describe('The frozen priced line snapshot the POS renders before finalize.'),
  "channel": zod.string(),
  "confirmed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "customer_phone": zod.string(),
  "delivered_at": zod.iso.datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_notes": zod.string().nullish(),
  "delivery_ref": zod.string().nullish(),
  "delivery_zone_id": zod.uuid().nullish(),
  "discount_amount": zod.number().optional(),
  "discount_id": zod.uuid().nullish().describe('Frozen channel discount on the item subtotal (`total == subtotal -\ndiscount_amount + delivery_fee`). `discount_amount` is 0 when none.'),
  "discount_type": zod.string().nullish(),
  "discount_value": zod.number().optional(),
  "extra_prep_minutes": zod.number().describe('Extra prep minutes the teller added on top of the branch base (multiples of 5).'),
  "floor": zod.string().nullish(),
  "id": zod.uuid(),
  "landmark": zod.string().nullish(),
  "order_id": zod.uuid().nullish(),
  "org_id": zod.uuid(),
  "otp_verified": zod.boolean(),
  "out_for_delivery_at": zod.iso.datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.iso.datetime({"offset":true}).nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "receipt_printed_at": zod.iso.datetime({"offset":true}).nullish(),
  "rejected_at": zod.iso.datetime({"offset":true}).nullish(),
  "road_distance_meters": zod.number().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const GuestOrderHistoryQueryParams = zod.object({
  "phone": zod.string(),
  "org_id": zod.uuid(),
  "device_token": zod.string().nullish()
})

export const GuestOrderHistoryResponseItem = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "channel": zod.string(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "customer_name": zod.string(),
  "delivery_fee": zod.number(),
  "delivery_ref": zod.string().nullish(),
  "discount_amount": zod.number(),
  "id": zod.uuid(),
  "items": zod.unknown().describe('Frozen cart snapshot: the items at the time of the order (for display).'),
  "place_name": zod.string().nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number()
})
export const GuestOrderHistoryResponse = zod.array(GuestOrderHistoryResponseItem)


export const GuestPastLocationsQueryParams = zod.object({
  "phone": zod.string(),
  "org_id": zod.uuid(),
  "branch_id": zod.uuid().nullish(),
  "device_token": zod.string().nullish()
})

export const GuestPastLocationsResponseItem = zod.object({
  "address_line": zod.string().nullish(),
  "branch_id": zod.uuid(),
  "channel": zod.string(),
  "customer_lat": zod.number().nullish(),
  "customer_lng": zod.number().nullish(),
  "floor": zod.string().nullish(),
  "landmark": zod.string().nullish(),
  "last_used_at": zod.iso.datetime({"offset":true}),
  "place_name": zod.string().nullish(),
  "unit_number": zod.string().nullish()
})
export const GuestPastLocationsResponse = zod.array(GuestPastLocationsResponseItem)


export const TrackDeliveryOrderParams = zod.object({
  "id": zod.uuid()
})

export const TrackDeliveryOrderResponse = zod.object({
  "address_line": zod.string().nullish(),
  "branch_name": zod.string(),
  "cancel_reason": zod.string().nullish(),
  "cancelled_at": zod.iso.datetime({"offset":true}).nullish(),
  "channel": zod.string(),
  "confirmed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "customer_name": zod.string(),
  "delivered_at": zod.iso.datetime({"offset":true}).nullish(),
  "delivery_fee": zod.number(),
  "delivery_ref": zod.string().nullish(),
  "discount_amount": zod.number(),
  "estimated_prep_minutes": zod.number().describe('Branch base prep time + the teller\'s per-order addition (minutes).'),
  "floor": zod.string().nullish(),
  "id": zod.uuid(),
  "org_id": zod.uuid(),
  "out_for_delivery_at": zod.iso.datetime({"offset":true}).nullish(),
  "payment_method_hint": zod.string().nullish(),
  "place_name": zod.string().nullish(),
  "preparing_at": zod.iso.datetime({"offset":true}).nullish(),
  "ready_at": zod.iso.datetime({"offset":true}).nullish(),
  "rejected_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "subtotal": zod.number(),
  "total": zod.number(),
  "unit_number": zod.string().nullish()
}).describe('Customer-safe tracking view of a delivery order, keyed by its opaque UUID\n(same capability-URL trust model as the device-token flow). No phone number\nis exposed; the destination fields are the customer\'s own inputs. Powers the\npublic `\/track\/{id}` page (polled, since the public surface has no SSE).')


export const ListPublicOrgsResponseItem = zod.object({
  "address": zod.string().nullish(),
  "branch_count": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "logo_url": zod.string().nullish(),
  "name": zod.string()
})
export const ListPublicOrgsResponse = zod.array(ListPublicOrgsResponseItem)


export const OtpRequestBody = zod.object({
  "phone": zod.string()
})

export const OtpRequestResponse = zod.object({
  "sent": zod.boolean()
})


export const OtpVerifyBody = zod.object({
  "code": zod.string(),
  "phone": zod.string()
})

export const OtpVerifyResponse = zod.object({
  "device_token": zod.string()
})


export const ListPurchaseOrdersParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const ListPurchaseOrdersQueryParams = zod.object({
  "status": zod.string().optional().describe('Filter by status: draft | ordered | partially_received | received | cancelled.'),
  "expected_before": zod.iso.datetime({"offset":true}).optional().describe('Only orders expected on or before this instant (for \"arriving by\" views).')
})

export const ListPurchaseOrdersResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid(),
  "expected_at": zod.iso.datetime({"offset":true}).nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "received_at": zod.iso.datetime({"offset":true}).nullish(),
  "received_by": zod.uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListPurchaseOrdersResponse = zod.array(ListPurchaseOrdersResponseItem)


export const CreatePurchaseOrderParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const CreatePurchaseOrderBody = zod.object({
  "expected_at": zod.iso.datetime({"offset":true}).nullish(),
  "lines": zod.array(zod.object({
  "org_ingredient_id": zod.uuid(),
  "purchase_unit": zod.string(),
  "quantity_ordered": zod.number(),
  "unit_cost": zod.number().describe('Piastres per purchase unit.'),
  "units_per_purchase_unit": zod.number().nullish().describe('Stock units per purchase unit. Ignored when `purchase_unit` is a known\ninventory unit (the factor is derived from the ingredient\'s base unit).')
})),
  "note": zod.string().nullish(),
  "reference": zod.string().nullish(),
  "supplier_id": zod.uuid().nullish()
})

export const CreatePurchaseOrderResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid(),
  "expected_at": zod.iso.datetime({"offset":true}).nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "received_at": zod.iso.datetime({"offset":true}).nullish(),
  "received_by": zod.uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "lines": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "purchase_order_id": zod.uuid(),
  "purchase_unit": zod.string(),
  "quantity_ordered": zod.number(),
  "quantity_received": zod.number(),
  "unit": zod.string().describe('Ingredient\'s base stock unit.'),
  "unit_cost": zod.number().describe('Piastres per PURCHASE unit.'),
  "units_per_purchase_unit": zod.number()
}))
}))


/**
 * @summary Ingredients at/below their reorder point (par_min, else reorder_threshold),
with the quantity to reach the order-up-to level (par_max), grouped by the
ingredient's default supplier — the basis for one-click "create PO".
 */
export const ReorderSuggestionsParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const ReorderSuggestionsResponseItem = zod.object({
  "lines": zod.array(zod.object({
  "ingredient_name": zod.string(),
  "on_hand": zod.number(),
  "org_ingredient_id": zod.uuid(),
  "suggested_qty": zod.number().describe('Quantity (in base units) to bring stock up to the order-up-to level.'),
  "unit": zod.string()
}).describe('One ingredient to reorder, with the quantity needed to reach its order-up-to\nlevel (par_max, else the reorder point).')),
  "supplier_id": zod.uuid().nullish(),
  "supplier_name": zod.string().nullish()
}).describe('Reorder suggestions grouped by the ingredient\'s default supplier so the\ndashboard can raise one draft PO per supplier.')
export const ReorderSuggestionsResponse = zod.array(ReorderSuggestionsResponseItem)


/**
 * @summary Return stock to a supplier: decrements branch stock and posts a
'purchase_return' movement per line, recorded as a goods receipt with
is_return = true. Returns remove stock at its current cost (WAC unchanged).
 */
export const CreateReturnParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const CreateReturnBody = zod.object({
  "lines": zod.array(zod.object({
  "org_ingredient_id": zod.uuid(),
  "quantity": zod.number().describe('Base stock units to return (must be ≤ on hand).'),
  "unit_cost": zod.number().nullish().describe('Piastres per base stock unit; defaults to the branch\'s actual cost.')
})),
  "note": zod.string().nullish(),
  "purchase_order_id": zod.uuid().nullish(),
  "reference": zod.string().nullish(),
  "supplier_id": zod.uuid().nullish()
})

export const CreateReturnResponse = zod.object({
  "branch_id": zod.uuid(),
  "id": zod.uuid(),
  "is_return": zod.boolean().describe('true ⟹ a return to supplier (negative stock effect).'),
  "lines": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "purchase_order_line_id": zod.uuid().nullish(),
  "quantity": zod.number().describe('Base stock units received (+) or returned (−).'),
  "unit_cost": zod.number().nullish().describe('Piastres per base stock unit (actual).')
})),
  "note": zod.string().nullish(),
  "purchase_order_id": zod.uuid().nullish(),
  "received_at": zod.iso.datetime({"offset":true}),
  "received_by": zod.uuid(),
  "received_by_name": zod.string().nullish(),
  "reference": zod.string().nullish(),
  "supplier_id": zod.uuid().nullish(),
  "supplier_name": zod.string().nullish()
})


export const GetPurchaseOrderParams = zod.object({
  "id": zod.uuid().describe('Purchase order ID')
})

export const GetPurchaseOrderResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid(),
  "expected_at": zod.iso.datetime({"offset":true}).nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "received_at": zod.iso.datetime({"offset":true}).nullish(),
  "received_by": zod.uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "lines": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "purchase_order_id": zod.uuid(),
  "purchase_unit": zod.string(),
  "quantity_ordered": zod.number(),
  "quantity_received": zod.number(),
  "unit": zod.string().describe('Ingredient\'s base stock unit.'),
  "unit_cost": zod.number().describe('Piastres per PURCHASE unit.'),
  "units_per_purchase_unit": zod.number()
}))
}))


export const CancelPurchaseOrderParams = zod.object({
  "id": zod.uuid().describe('Purchase order ID')
})

export const CancelPurchaseOrderResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid(),
  "expected_at": zod.iso.datetime({"offset":true}).nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "received_at": zod.iso.datetime({"offset":true}).nullish(),
  "received_by": zod.uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


/**
 * @summary Per-delivery goods-receipt records for a purchase order (multi-shipment audit
trail, each with the actual received quantity + cost per line).
 */
export const ListPoReceiptsParams = zod.object({
  "id": zod.uuid().describe('Purchase order ID')
})

export const ListPoReceiptsResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "id": zod.uuid(),
  "is_return": zod.boolean().describe('true ⟹ a return to supplier (negative stock effect).'),
  "lines": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "purchase_order_line_id": zod.uuid().nullish(),
  "quantity": zod.number().describe('Base stock units received (+) or returned (−).'),
  "unit_cost": zod.number().nullish().describe('Piastres per base stock unit (actual).')
})),
  "note": zod.string().nullish(),
  "purchase_order_id": zod.uuid().nullish(),
  "received_at": zod.iso.datetime({"offset":true}),
  "received_by": zod.uuid(),
  "received_by_name": zod.string().nullish(),
  "reference": zod.string().nullish(),
  "supplier_id": zod.uuid().nullish(),
  "supplier_name": zod.string().nullish()
})
export const ListPoReceiptsResponse = zod.array(ListPoReceiptsResponseItem)


export const ReceivePurchaseOrderParams = zod.object({
  "id": zod.uuid().describe('Purchase order ID')
})

export const ReceivePurchaseOrderBody = zod.object({
  "lines": zod.array(zod.object({
  "line_id": zod.uuid(),
  "quantity_received": zod.number(),
  "unit_cost": zod.number().nullish().describe('Optional ACTUAL invoice cost (piastres per purchase unit) for this\ndelivery, when it differs from the ordered price. Drives weighted-average\ncost + the ledger; omitted ⟹ the PO line\'s ordered cost is used.')
}))
})

export const ReceivePurchaseOrderResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid(),
  "expected_at": zod.iso.datetime({"offset":true}).nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "received_at": zod.iso.datetime({"offset":true}).nullish(),
  "received_by": zod.uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
}).and(zod.object({
  "lines": zod.array(zod.object({
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "purchase_order_id": zod.uuid(),
  "purchase_unit": zod.string(),
  "quantity_ordered": zod.number(),
  "quantity_received": zod.number(),
  "unit": zod.string().describe('Ingredient\'s base stock unit.'),
  "unit_cost": zod.number().describe('Piastres per PURCHASE unit.'),
  "units_per_purchase_unit": zod.number()
}))
}))


/**
 * @summary Place a draft PO with the supplier: `draft → ordered`. Makes "ordered,
awaiting goods" a distinct, queryable state (outstanding-orders views) vs a
draft still being built. Receiving is still allowed directly from draft for
workflows that don't formally place orders first.
 */
export const SubmitPurchaseOrderParams = zod.object({
  "id": zod.uuid().describe('Purchase order ID')
})

export const SubmitPurchaseOrderResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid(),
  "expected_at": zod.iso.datetime({"offset":true}).nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "received_at": zod.iso.datetime({"offset":true}).nullish(),
  "received_by": zod.uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const ListOrgPurchaseOrdersParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const ListOrgPurchaseOrdersQueryParams = zod.object({
  "status": zod.string().optional().describe('Filter by status: draft | ordered | partially_received | received | cancelled.'),
  "expected_before": zod.iso.datetime({"offset":true}).optional().describe('Only orders expected on or before this instant (for \"arriving by\" views).')
})

export const ListOrgPurchaseOrdersResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — populated by the order lists so the \"All branches\" view\ncan show which branch each PO belongs to; other endpoints leave it null.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid(),
  "expected_at": zod.iso.datetime({"offset":true}).nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "received_at": zod.iso.datetime({"offset":true}).nullish(),
  "received_by": zod.uuid().nullish(),
  "reference": zod.string().nullish(),
  "status": zod.string(),
  "supplier_id": zod.uuid().nullish(),
  "supplier_name": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListOrgPurchaseOrdersResponse = zod.array(ListOrgPurchaseOrdersResponseItem)


export const ListSuppliersParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const ListSuppliersResponseItem = zod.object({
  "contact_name": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "email": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "phone": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListSuppliersResponse = zod.array(ListSuppliersResponseItem)


export const CreateSupplierParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const CreateSupplierBody = zod.object({
  "contact_name": zod.string().nullish(),
  "email": zod.string().nullish(),
  "name": zod.string(),
  "phone": zod.string().nullish()
})

export const CreateSupplierResponse = zod.object({
  "contact_name": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "email": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "phone": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteSupplierParams = zod.object({
  "id": zod.uuid().describe('Supplier ID')
})

export const DeleteSupplierResponse = zod.void()


export const UpdateSupplierParams = zod.object({
  "id": zod.uuid().describe('Supplier ID')
})

export const UpdateSupplierBody = zod.object({
  "contact_name": zod.string().nullish(),
  "email": zod.string().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "phone": zod.string().nullish()
})

export const UpdateSupplierResponse = zod.object({
  "contact_name": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "email": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "phone": zod.string().nullish(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const ListMarketingLinksResponseItem = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "kind": zod.string(),
  "label": zod.string().nullish(),
  "long_url": zod.string(),
  "short_code": zod.string(),
  "short_url": zod.string(),
  "target_ref": zod.string()
})
export const ListMarketingLinksResponse = zod.array(ListMarketingLinksResponseItem)


export const CreateMarketingLinkBody = zod.object({
  "custom_slug": zod.string().nullish(),
  "label": zod.string(),
  "path": zod.string()
})

export const CreateMarketingLinkResponse = zod.object({
  "kind": zod.string(),
  "long_url": zod.string(),
  "qr_data_url": zod.string().describe('`data:image\/png;base64,…` (or `data:image\/svg+xml;base64,…` when\n`svg=true`).  Paste into a browser `<img src=\"…\">` to verify.'),
  "short_code": zod.string(),
  "short_url": zod.string()
}).describe('JSON returned from every QR-generation endpoint.')


/**
 * @summary SSE stream of all realtime events for a branch, filtered by topic + permission.
**Updates-only**: the client seeds current state from the per-feature list
endpoints (or `/realtime/snapshot`) first, then connects. On any error/close it
re-seeds and reconnects.
 */
export const StreamQueryParams = zod.object({
  "branch_id": zod.uuid(),
  "topics": zod.string().nullish().describe('Comma-separated topics: `delivery,tickets,kitchen,orders`. Omit to receive\nevery topic the caller is permitted to read.')
})

export const StreamResponse = zod.unknown()


export const ListAddonIngredientsParams = zod.object({
  "addon_item_id": zod.uuid().describe('Addon item ID')
})

export const ListAddonIngredientsResponseItem = zod.object({
  "addon_item_id": zod.uuid(),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number(),
  "unit": zod.string()
})
export const ListAddonIngredientsResponse = zod.array(ListAddonIngredientsResponseItem)


export const UpsertAddonIngredientParams = zod.object({
  "addon_item_id": zod.uuid().describe('Addon item ID')
})

export const UpsertAddonIngredientBody = zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number()
})

export const UpsertAddonIngredientResponse = zod.object({
  "addon_item_id": zod.uuid(),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number(),
  "unit": zod.string()
})


export const DeleteAddonIngredientParams = zod.object({
  "addon_item_id": zod.uuid()
})

export const DeleteAddonIngredientQueryParams = zod.object({
  "ingredient_name": zod.string()
})

export const DeleteAddonIngredientResponse = zod.void()


export const ListDrinkRecipesParams = zod.object({
  "menu_item_id": zod.uuid().describe('Menu item ID')
})

export const ListDrinkRecipesResponseItem = zod.object({
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "menu_item_id": zod.uuid(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number(),
  "size_label": zod.string(),
  "unit": zod.string()
})
export const ListDrinkRecipesResponse = zod.array(ListDrinkRecipesResponseItem)


export const UpsertDrinkRecipeParams = zod.object({
  "menu_item_id": zod.uuid().describe('Menu item ID')
})

export const UpsertDrinkRecipeBody = zod.object({
  "ingredient_name": zod.string(),
  "ingredient_unit": zod.string(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number(),
  "size_label": zod.string()
})

export const UpsertDrinkRecipeResponse = zod.object({
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "menu_item_id": zod.uuid(),
  "org_ingredient_id": zod.uuid().nullish(),
  "quantity_used": zod.number(),
  "size_label": zod.string(),
  "unit": zod.string()
})


export const DeleteDrinkRecipeParams = zod.object({
  "menu_item_id": zod.uuid(),
  "size": zod.string()
})

export const DeleteDrinkRecipeQueryParams = zod.object({
  "ingredient_name": zod.string()
})

export const DeleteDrinkRecipeResponse = zod.void()


export const ListStepPresetsResponseItem = zod.object({
  "animation_sha256": zod.string(),
  "animation_url": zod.string().describe('Path to the animation, relative to the API base.'),
  "bytes": zod.number(),
  "name": zod.string(),
  "name_ar": zod.string(),
  "note": zod.string().nullish(),
  "note_ar": zod.string().nullish(),
  "slug": zod.string(),
  "sort_order": zod.number()
}).describe('One curated step the dashboard offers.')
export const ListStepPresetsResponse = zod.array(ListStepPresetsResponseItem)


export const ListRecipeStepsParams = zod.object({
  "menu_item_id": zod.uuid().describe('Menu item ID')
})

export const ListRecipeStepsResponseItem = zod.object({
  "animation_sha256": zod.string().nullish(),
  "animation_url": zod.string().nullish().describe('Present only for a preset whose animation still ships. `None` on a\ncustom step, and on a retired preset — clients show the name alone.'),
  "kind": zod.string().describe('`preset` | `custom`.'),
  "name": zod.string().describe('The preset\'s name, or the typed name of a custom step.'),
  "name_ar": zod.string(),
  "note": zod.string().nullish(),
  "note_ar": zod.string().nullish(),
  "position": zod.number(),
  "preset_slug": zod.string().nullish().describe('The preset this step uses, if any.')
}).describe('One step, resolved for display: whatever its kind, it has a name, and a\npreset step also carries its note and the animation to play.')
export const ListRecipeStepsResponse = zod.array(ListRecipeStepsResponseItem)


/**
 * @summary Replace an item's steps, in one transaction.
 */
export const PutRecipeStepsParams = zod.object({
  "menu_item_id": zod.uuid().describe('Menu item ID')
})

export const PutRecipeStepsBody = zod.object({
  "steps": zod.array(zod.object({
  "kind": zod.string().describe('`preset` | `custom`.'),
  "preset_slug": zod.string().nullish().describe('Required for `preset`.'),
  "title": zod.string().nullish().describe('The typed name, for `custom`. Either language will do.'),
  "title_ar": zod.string().nullish()
})).describe('The whole list, in order. Replaces what was there.')
})

export const PutRecipeStepsResponseItem = zod.object({
  "animation_sha256": zod.string().nullish(),
  "animation_url": zod.string().nullish().describe('Present only for a preset whose animation still ships. `None` on a\ncustom step, and on a retired preset — clients show the name alone.'),
  "kind": zod.string().describe('`preset` | `custom`.'),
  "name": zod.string().describe('The preset\'s name, or the typed name of a custom step.'),
  "name_ar": zod.string(),
  "note": zod.string().nullish(),
  "note_ar": zod.string().nullish(),
  "position": zod.number(),
  "preset_slug": zod.string().nullish().describe('The preset this step uses, if any.')
}).describe('One step, resolved for display: whatever its kind, it has a name, and a\npreset step also carries its note and the animation to play.')
export const PutRecipeStepsResponse = zod.array(PutRecipeStepsResponseItem)


export const BranchAddonSalesParams = zod.object({
  "branch_id": zod.uuid()
})

export const BranchAddonSalesQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchAddonSalesResponseItem = zod.object({
  "addon_item_id": zod.uuid(),
  "addon_name": zod.string(),
  "addon_name_translations": zod.looseObject({

}),
  "addon_type": zod.string(),
  "quantity_sold": zod.number(),
  "revenue": zod.number()
})
export const BranchAddonSalesResponse = zod.array(BranchAddonSalesResponseItem)


export const BranchBundleSalesParams = zod.object({
  "branch_id": zod.uuid()
})

export const BranchBundleSalesQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchBundleSalesResponseItem = zod.object({
  "bundle_id": zod.uuid().nullish(),
  "bundle_name": zod.string(),
  "quantity_sold": zod.number(),
  "revenue": zod.number()
})
export const BranchBundleSalesResponse = zod.array(BranchBundleSalesResponseItem)


export const BranchConsumptionParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const BranchConsumptionQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchConsumptionResponseItem = zod.object({
  "consumed_qty": zod.number(),
  "consumed_value": zod.number().nullish().describe('Consumption valued in piastres; `null` if any contributing cost unknown.'),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "unit": zod.string()
})
export const BranchConsumptionResponse = zod.array(BranchConsumptionResponseItem)


export const BranchDeliverySalesParams = zod.object({
  "branch_id": zod.uuid()
})

export const BranchDeliverySalesQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchDeliverySalesResponse = zod.object({
  "avg_order_value": zod.number(),
  "cancelled_orders": zod.number(),
  "channels": zod.array(zod.object({
  "avg_order_value": zod.number(),
  "cancelled_orders": zod.number(),
  "channel": zod.string().describe('Delivery channel: `in_mall` or `outside`.'),
  "delivery_fees": zod.number().describe('Sum of `delivery_fee` (piastres) over delivered orders.'),
  "orders": zod.number(),
  "revenue": zod.number().describe('Sum of `total` (piastres) over delivered orders on this channel.')
}).describe('Delivery sales for one delivery channel (`in_mall` \/ `outside`). Revenue and\norder counts are over \*\*delivered\*\* orders only; `cancelled_orders` is shown\nseparately so the UI can surface drop-off without inflating revenue.')),
  "from": zod.iso.datetime({"offset":true}).nullish(),
  "to": zod.iso.datetime({"offset":true}).nullish(),
  "total_delivery_fees": zod.number(),
  "total_orders": zod.number(),
  "total_revenue": zod.number()
}).describe('Delivery sales rolled up across channels, plus a per-channel breakdown.\nAlways returns both `in_mall` and `outside` channels (zero-filled) so the\ndashboard renders a stable shape.')


export const BranchInventoryValuationParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const BranchInventoryValuationResponse = zod.object({
  "items": zod.array(zod.object({
  "cost_per_unit": zod.number().nullish().describe('Piastres per unit; `null` ⟺ unknown.'),
  "ingredient_name": zod.string(),
  "on_hand": zod.number(),
  "org_ingredient_id": zod.uuid(),
  "unit": zod.string(),
  "value": zod.number().nullish().describe('on_hand × cost_per_unit in piastres; `null` when cost unknown.')
})),
  "total_value": zod.number(),
  "unknown_cost_count": zod.number()
})


export const BranchCombinedItemSalesParams = zod.object({
  "branch_id": zod.uuid()
})

export const BranchCombinedItemSalesQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchCombinedItemSalesResponseItem = zod.object({
  "bundle_qty": zod.number(),
  "item_id": zod.uuid().nullish(),
  "item_name": zod.string(),
  "item_name_translations": zod.looseObject({

}),
  "standalone_qty": zod.number(),
  "total_qty": zod.number()
})
export const BranchCombinedItemSalesResponse = zod.array(BranchCombinedItemSalesResponseItem)


export const BranchLowStockParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID, or the all-zeros UUID for every branch in the org')
})

export const BranchLowStockResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "ingredient_name": zod.string(),
  "on_hand": zod.number(),
  "org_ingredient_id": zod.uuid(),
  "par_max": zod.number().nullish().describe('Order-up-to level; `null` when only a reorder point is set.'),
  "par_min": zod.number().describe('Reorder point the item is at or below.'),
  "suggested_qty": zod.number().describe('Quantity to bring stock back to par_max (or par_min when no max is set).'),
  "supplier_id": zod.uuid().nullish().describe('Default supplier for this ingredient (for one-click \"create PO\"); may be null.'),
  "supplier_name": zod.string().nullish(),
  "unit": zod.string()
})
export const BranchLowStockResponse = zod.array(BranchLowStockResponseItem)


export const BranchSalesParams = zod.object({
  "branch_id": zod.uuid()
})

export const BranchSalesQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional(),
  "exclude_items": zod.string().optional().describe('Comma-separated menu_item\/bundle UUIDs left out of `total_line_items`\n(units sold) ONLY — revenue, top items, and categories are untouched.')
})

export const BranchSalesResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "by_category": zod.array(zod.object({
  "category_id": zod.uuid().nullish(),
  "category_name": zod.string().nullish(),
  "category_name_translations": zod.looseObject({

}),
  "item_count": zod.number(),
  "items": zod.array(zod.object({
  "item_name": zod.string(),
  "item_name_translations": zod.looseObject({

}),
  "menu_item_id": zod.uuid(),
  "quantity_sold": zod.number(),
  "revenue": zod.number()
})),
  "quantity_sold": zod.number(),
  "revenue": zod.number()
})),
  "cash_tips": zod.number().optional().describe('The cash slice of `total_tips` (snapshotted `tip_is_cash`).'),
  "from": zod.iso.datetime({"offset":true}).nullish(),
  "revenue_by_method": zod.unknown().describe('Money collected FOR GOODS, bucketed by the method actually tendered\n(`order_payments`). Tips are not in here — see `total_tips`.'),
  "subtotal": zod.number(),
  "to": zod.iso.datetime({"offset":true}).nullish(),
  "top_items": zod.array(zod.object({
  "item_name": zod.string(),
  "item_name_translations": zod.looseObject({

}),
  "menu_item_id": zod.uuid(),
  "quantity_sold": zod.number(),
  "revenue": zod.number()
})),
  "total_discount": zod.number(),
  "total_line_items": zod.number().optional().describe('Units sold (SUM of order_items.quantity) across non-voided orders in\nrange. Counts units, not distinct lines (\"3× burger\" contributes 3),\nmatching quantity_sold in the item\/category breakdowns.'),
  "total_orders": zod.number(),
  "total_revenue": zod.number(),
  "total_tax": zod.number(),
  "total_tips": zod.number().optional().describe('Tips, standalone — never folded into a method bucket and never part of\n`total_revenue`. Same definition as `total_tips` on the shift report, so\nthe two screens can be reconciled line for line.'),
  "voided_orders": zod.number()
})


export const BranchSalesPeakHoursParams = zod.object({
  "branch_id": zod.uuid()
})

export const BranchSalesPeakHoursQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchSalesPeakHoursResponseItem = zod.object({
  "avg_orders_per_day": zod.number().describe('Orders averaged over the number of calendar days (may be fractional).'),
  "avg_revenue_per_day": zod.number().describe('Revenue in piastres averaged over the number of calendar days in the queried range.'),
  "discount": zod.number(),
  "hour": zod.number(),
  "orders": zod.number(),
  "orders_pct": zod.number().describe('This hour\'s orders as a percentage of the period total (0–100, 1 dp).'),
  "revenue": zod.number(),
  "revenue_pct": zod.number().describe('This hour\'s revenue as a percentage of the period total (0–100, 1 dp).'),
  "tax": zod.number(),
  "voided": zod.number()
})
export const BranchSalesPeakHoursResponse = zod.array(BranchSalesPeakHoursResponseItem)


export const BranchSalesTimeseriesParams = zod.object({
  "branch_id": zod.uuid()
})

export const BranchSalesTimeseriesQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "granularity": zod.string().optional()
})

export const BranchSalesTimeseriesResponseItem = zod.object({
  "discount": zod.number(),
  "orders": zod.number(),
  "period": zod.string(),
  "revenue": zod.number(),
  "revenue_by_method": zod.unknown(),
  "tax": zod.number(),
  "voided": zod.number()
})
export const BranchSalesTimeseriesResponse = zod.array(BranchSalesTimeseriesResponseItem)


export const BranchShrinkageParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const BranchShrinkageQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchShrinkageResponseItem = zod.object({
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "reason": zod.string().describe('The variance reason captured at finalize, or `unexplained` when none.'),
  "shrinkage_qty": zod.number().describe('Quantity lost (positive number) from negative stock-count differences.'),
  "shrinkage_value": zod.number().nullish().describe('Valued shrinkage in piastres; `null` when any contributing cost unknown.'),
  "unit": zod.string()
})
export const BranchShrinkageResponse = zod.array(BranchShrinkageResponseItem)


export const BranchStockParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const BranchStockResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "items": zod.array(zod.object({
  "below_par": zod.boolean(),
  "cost_per_unit": zod.number().nullish().describe('Piastres per unit; `null` ⟺ cost never entered.'),
  "ingredient_name": zod.string(),
  "on_hand": zod.number(),
  "org_ingredient_id": zod.uuid(),
  "par_min": zod.number().nullish().describe('Reorder point; `null` = not set at this branch.'),
  "unit": zod.string()
}))
})


export const BranchTellerStatsParams = zod.object({
  "branch_id": zod.uuid()
})

export const BranchTellerStatsQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchTellerStatsResponseItem = zod.object({
  "avg_order_value": zod.number(),
  "orders": zod.number(),
  "revenue": zod.number(),
  "shifts": zod.number(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "voided": zod.number()
})
export const BranchTellerStatsResponse = zod.array(BranchTellerStatsResponseItem)


export const BranchWaiterStatsParams = zod.object({
  "branch_id": zod.uuid()
})

export const BranchWaiterStatsQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchWaiterStatsResponse = zod.object({
  "attributed_orders": zod.number().describe('Non-voided orders in range that carry a waiter.'),
  "total_orders": zod.number().describe('All non-voided orders in range (waiter or not).'),
  "waiters": zod.array(zod.object({
  "avg_items_per_order": zod.number().describe('line_items \/ orders; 0 when the waiter has no non-voided orders.'),
  "avg_order_value": zod.number(),
  "line_items": zod.number().describe('Units sold (SUM of order_items.quantity) on this waiter\'s non-voided\norders — the upsell signal behind avg_items_per_order.'),
  "orders": zod.number(),
  "revenue": zod.number(),
  "voided": zod.number(),
  "waiter_id": zod.uuid(),
  "waiter_name": zod.string()
}).describe('Per-waiter sales split. Only waiter-attributed orders appear (dine-in\nsettled from a waiter\'s ticket — `orders.waiter_id IS NOT NULL`); direct\nteller sales and delivery orders are out of scope, so totals here are a\nsubset of the branch overview. `attributed_orders`\/`attributed_revenue`\non the report envelope let the UI caption that gap.'))
}).describe('Envelope for the waiters split: rows plus the branch-level totals needed\nto caption coverage (\"X of Y orders came through waiters\").')


export const BranchWasteReportParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const BranchWasteReportQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const BranchWasteReportResponseItem = zod.object({
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "reason": zod.string(),
  "unit": zod.string(),
  "waste_qty": zod.number(),
  "waste_value": zod.number().nullish()
})
export const BranchWasteReportResponse = zod.array(BranchWasteReportResponseItem)


export const OrgBranchComparisonParams = zod.object({
  "org_id": zod.uuid()
})

export const OrgBranchComparisonQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const OrgBranchComparisonResponse = zod.object({
  "branches": zod.array(zod.object({
  "avg_order_value": zod.number(),
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "cash_tips": zod.number().optional().describe('The cash slice of `total_tips`.'),
  "revenue_by_method": zod.unknown().describe('Goods only, by method actually tendered. Tips are in `total_tips`.'),
  "total_orders": zod.number(),
  "total_revenue": zod.number(),
  "total_tips": zod.number().optional().describe('Tips, standalone — same definition as on the branch sales + shift reports.'),
  "void_rate_pct": zod.number(),
  "voided_orders": zod.number()
})),
  "from": zod.iso.datetime({"offset":true}).nullish(),
  "org_id": zod.uuid(),
  "to": zod.iso.datetime({"offset":true}).nullish()
})


export const OrgConsumptionParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const OrgConsumptionQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const OrgConsumptionResponseItem = zod.object({
  "consumed_qty": zod.number(),
  "consumed_value": zod.number().nullish().describe('Consumption valued in piastres; `null` if any contributing cost unknown.'),
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "unit": zod.string()
})
export const OrgConsumptionResponse = zod.array(OrgConsumptionResponseItem)


export const OrgInventoryValuationParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const OrgInventoryValuationResponse = zod.object({
  "items": zod.array(zod.object({
  "cost_per_unit": zod.number().nullish().describe('Piastres per unit; `null` ⟺ unknown.'),
  "ingredient_name": zod.string(),
  "on_hand": zod.number(),
  "org_ingredient_id": zod.uuid(),
  "unit": zod.string(),
  "value": zod.number().nullish().describe('on_hand × cost_per_unit in piastres; `null` when cost unknown.')
})),
  "total_value": zod.number(),
  "unknown_cost_count": zod.number()
})


export const OrgLowStockParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const OrgLowStockResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "ingredient_name": zod.string(),
  "on_hand": zod.number(),
  "org_ingredient_id": zod.uuid(),
  "par_max": zod.number().nullish().describe('Order-up-to level; `null` when only a reorder point is set.'),
  "par_min": zod.number().describe('Reorder point the item is at or below.'),
  "suggested_qty": zod.number().describe('Quantity to bring stock back to par_max (or par_min when no max is set).'),
  "supplier_id": zod.uuid().nullish().describe('Default supplier for this ingredient (for one-click \"create PO\"); may be null.'),
  "supplier_name": zod.string().nullish(),
  "unit": zod.string()
})
export const OrgLowStockResponse = zod.array(OrgLowStockResponseItem)


export const OrgShrinkageParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const OrgShrinkageQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const OrgShrinkageResponseItem = zod.object({
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "reason": zod.string().describe('The variance reason captured at finalize, or `unexplained` when none.'),
  "shrinkage_qty": zod.number().describe('Quantity lost (positive number) from negative stock-count differences.'),
  "shrinkage_value": zod.number().nullish().describe('Valued shrinkage in piastres; `null` when any contributing cost unknown.'),
  "unit": zod.string()
})
export const OrgShrinkageResponse = zod.array(OrgShrinkageResponseItem)


export const OrgWasteReportParams = zod.object({
  "org_id": zod.uuid().describe('Organization ID')
})

export const OrgWasteReportQueryParams = zod.object({
  "from": zod.iso.datetime({"offset":true}).optional(),
  "to": zod.iso.datetime({"offset":true}).optional(),
  "limit": zod.number().optional()
})

export const OrgWasteReportResponseItem = zod.object({
  "ingredient_name": zod.string(),
  "org_ingredient_id": zod.uuid(),
  "reason": zod.string(),
  "unit": zod.string(),
  "waste_qty": zod.number(),
  "waste_value": zod.number().nullish()
})
export const OrgWasteReportResponse = zod.array(OrgWasteReportResponseItem)


export const ShiftDeductionsParams = zod.object({
  "shift_id": zod.uuid().describe('Shift ID')
})

export const ShiftDeductionsResponseItem = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "inventory_item_id": zod.uuid(),
  "item_name": zod.string(),
  "order_id": zod.uuid().nullish(),
  "order_item_id": zod.uuid().nullish(),
  "quantity_deducted": zod.number(),
  "source": zod.string(),
  "unit": zod.string()
})
export const ShiftDeductionsResponse = zod.array(ShiftDeductionsResponseItem)


export const ShiftSummaryParams = zod.object({
  "shift_id": zod.uuid().describe('Shift ID')
})

export const ShiftSummaryResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string(),
  "cash_discrepancy": zod.number().nullish(),
  "cash_tips": zod.number().optional().describe('The cash slice of `total_tips`.'),
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opening_cash": zod.number(),
  "revenue_by_method": zod.unknown().describe('Goods only, by method actually tendered. Tips are in `total_tips`.'),
  "shift_id": zod.uuid(),
  "status": zod.string(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "total_discount": zod.number(),
  "total_orders": zod.number(),
  "total_revenue": zod.number(),
  "total_tax": zod.number(),
  "total_tips": zod.number().optional().describe('Tips, standalone — matches `total_tips` on `GET \/shifts\/{id}\/report`.'),
  "voided_orders": zod.number()
})


export const ListShiftsParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID (nil UUID = all branches in org)')
})

export const ListShiftsQueryParams = zod.object({
  "page": zod.number().optional().describe('1-based page number. Omit (along with `per_page`) to fetch every shift.'),
  "per_page": zod.number().optional().describe('Page size (clamped to [1, 200]). Omit to fetch every shift in one page.')
})

export const ListShiftsResponse = zod.object({
  "data": zod.array(zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "closed_by": zod.uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "force_closed_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "till_id": zod.uuid().nullish().describe('The till (drawer) this shift is on. Populated by the read\/list\/open\nendpoints; mutation responses that build the row via RETURNING may leave\n`till_name` null (same convention as `branch_name`).'),
  "till_name": zod.string().nullish()
})),
  "page": zod.number(),
  "per_page": zod.number(),
  "total": zod.number(),
  "total_pages": zod.number()
}).describe('Paginated envelope for the shifts list. When the request omits `page`\/`per_page`,\n`data` holds every matching shift in one page (back-compat for the dashboard);\nwhen they are present, `data` is one bounded page ordered newest-first.')


export const GetCurrentShiftParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const GetCurrentShiftQueryParams = zod.object({
  "till_id": zod.uuid().optional().describe('The device\'s till (drawer). Narrows the open-shift lookup for managers and\nscopes the suggested opening cash to that drawer\'s carryover. Optional —\nomit to fall back to the branch\'s default till for the suggestion.')
})

export const GetCurrentShiftResponse = zod.object({
  "has_open_shift": zod.boolean(),
  "open_shift": zod.union([zod.null(),zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "closed_by": zod.uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "force_closed_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "till_id": zod.uuid().nullish().describe('The till (drawer) this shift is on. Populated by the read\/list\/open\nendpoints; mutation responses that build the row via RETURNING may leave\n`till_name` null (same convention as `branch_name`).'),
  "till_name": zod.string().nullish()
})]).optional(),
  "suggested_opening_cash": zod.number()
})


export const OpenShiftParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const OpenShiftBody = zod.object({
  "edit_reason": zod.string().nullish(),
  "id": zod.uuid().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}).nullish(),
  "opening_cash": zod.number(),
  "opening_cash_edited": zod.boolean().nullish().describe('Ignored by the server — the carryover edit is DERIVED from the previous\nshift\'s declared closing. Kept only for API\/back-compat with clients.'),
  "till_id": zod.uuid().nullish().describe('The till (drawer) this shift opens on. Optional for back-compat: when\nomitted the server falls back to the branch\'s default till. Newer\ndevice-bound clients send their configured till explicitly.')
})

export const OpenShiftResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "closed_by": zod.uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "force_closed_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "till_id": zod.uuid().nullish().describe('The till (drawer) this shift is on. Populated by the read\/list\/open\nendpoints; mutation responses that build the row via RETURNING may leave\n`till_name` null (same convention as `branch_name`).'),
  "till_name": zod.string().nullish()
})


export const GetShiftParams = zod.object({
  "shift_id": zod.uuid().describe('Shift ID')
})

export const GetShiftResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "closed_by": zod.uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "force_closed_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "till_id": zod.uuid().nullish().describe('The till (drawer) this shift is on. Populated by the read\/list\/open\nendpoints; mutation responses that build the row via RETURNING may leave\n`till_name` null (same convention as `branch_name`).'),
  "till_name": zod.string().nullish()
})


export const DeleteShiftParams = zod.object({
  "shift_id": zod.uuid().describe('Shift ID')
})

export const DeleteShiftResponse = zod.void()


export const ListCashMovementsParams = zod.object({
  "shift_id": zod.uuid().describe('Shift ID')
})

export const ListCashMovementsResponseItem = zod.object({
  "amount": zod.number(),
  "client_ref": zod.uuid().nullish().describe('Client-minted idempotency \/ reconciliation key, echoed back so an\noffline client can map its queued movement to the server row. NULL for\nlive online movements.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "moved_by": zod.uuid(),
  "moved_by_name": zod.string(),
  "note": zod.string(),
  "shift_id": zod.uuid()
})
export const ListCashMovementsResponse = zod.array(ListCashMovementsResponseItem)


export const AddCashMovementParams = zod.object({
  "shift_id": zod.uuid().describe('Shift ID')
})

export const AddCashMovementBody = zod.object({
  "amount": zod.number(),
  "client_ref": zod.uuid().nullish().describe('Client-minted idempotency \/ reconciliation key. The POS sends a stable\nUUID per movement so a replayed offline movement dedupes instead of\ndouble-applying. Omit for live online movements.'),
  "created_at": zod.iso.datetime({"offset":true}).nullish().describe('When the movement actually happened. Omit for live (online) movements —\nthe server stamps `now()`. The POS sends this for movements made OFFLINE\nso they keep their real time after syncing. Future values are rejected.'),
  "note": zod.string()
})

export const AddCashMovementResponse = zod.object({
  "amount": zod.number(),
  "client_ref": zod.uuid().nullish().describe('Client-minted idempotency \/ reconciliation key, echoed back so an\noffline client can map its queued movement to the server row. NULL for\nlive online movements.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "moved_by": zod.uuid(),
  "moved_by_name": zod.string(),
  "note": zod.string(),
  "shift_id": zod.uuid()
})


export const CloseShiftParams = zod.object({
  "shift_id": zod.uuid().describe('Shift ID')
})

export const CloseShiftBody = zod.object({
  "cash_note": zod.string().nullish(),
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "closing_cash_declared": zod.number()
})

export const CloseShiftResponse = zod.object({
  "shift": zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "closed_by": zod.uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "force_closed_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "till_id": zod.uuid().nullish().describe('The till (drawer) this shift is on. Populated by the read\/list\/open\nendpoints; mutation responses that build the row via RETURNING may leave\n`till_name` null (same convention as `branch_name`).'),
  "till_name": zod.string().nullish()
})
})


export const ForceCloseShiftParams = zod.object({
  "shift_id": zod.uuid().describe('Shift ID')
})

export const ForceCloseShiftBody = zod.object({
  "reason": zod.string().nullish()
})

export const ForceCloseShiftResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "closed_by": zod.uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "force_closed_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "till_id": zod.uuid().nullish().describe('The till (drawer) this shift is on. Populated by the read\/list\/open\nendpoints; mutation responses that build the row via RETURNING may leave\n`till_name` null (same convention as `branch_name`).'),
  "till_name": zod.string().nullish()
})


export const GetShiftReportParams = zod.object({
  "shift_id": zod.uuid().describe('Shift ID')
})

export const GetShiftReportResponse = zod.object({
  "cash_movements": zod.array(zod.object({
  "amount": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "moved_by_name": zod.string(),
  "note": zod.string()
})),
  "cash_movements_in": zod.number(),
  "cash_movements_net": zod.number().describe('Net of all cash movements (in - out) as a signed integer'),
  "cash_movements_out": zod.number(),
  "cash_tips": zod.number().describe('The cash slice of `total_tips` (snapshotted `tip_is_cash`). This IS in\nthe drawer, so it is counted by `expected_cash` even though it is not\npart of `net_payments`.'),
  "expected_cash": zod.number().describe('Authoritative system (expected) cash in the drawer. For a closed shift\nthis is the snapshot taken at close (`closing_cash_system`); for an open\nshift it is computed live via the same formula. Clients should display\nthis directly instead of re-deriving it from the payment breakdown.'),
  "net_payments": zod.number(),
  "non_cash_tips": zod.number().describe('`total_tips - cash_tips` — tips added onto a card\/wallet tender.'),
  "payment_summary": zod.array(zod.object({
  "is_cash": zod.boolean(),
  "order_count": zod.number(),
  "payment_method": zod.string(),
  "total": zod.number()
})).describe('Money COLLECTED FOR GOODS, bucketed by the method actually tendered\n(`order_payments`, so a split order contributes to each leg it really\nused). Tips are NOT in here — see `total_tips`.'),
  "printed_at": zod.iso.datetime({"offset":true}),
  "shift": zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the shifts list (so the \"All branches\"\nview can show which branch each shift belongs to). Other shift endpoints\nleave it `null`.'),
  "cash_discrepancy": zod.number().nullish(),
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "closed_by": zod.uuid().nullish(),
  "closing_cash_declared": zod.number().nullish(),
  "closing_cash_system": zod.number().nullish(),
  "force_close_reason": zod.string().nullish(),
  "force_closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "force_closed_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "notes": zod.string().nullish(),
  "opened_at": zod.iso.datetime({"offset":true}),
  "opening_cash": zod.number(),
  "opening_cash_edit_reason": zod.string().nullish(),
  "opening_cash_original": zod.number().nullish(),
  "opening_cash_was_edited": zod.boolean(),
  "status": zod.string(),
  "teller_id": zod.uuid(),
  "teller_name": zod.string(),
  "till_id": zod.uuid().nullish().describe('The till (drawer) this shift is on. Populated by the read\/list\/open\nendpoints; mutation responses that build the row via RETURNING may leave\n`till_name` null (same convention as `branch_name`).'),
  "till_name": zod.string().nullish()
}),
  "total_payments": zod.number(),
  "total_tips": zod.number().describe('Tips, as a standalone figure — never folded into a method bucket, and\nnever part of `total_payments`\/`net_payments`. Mirrors `total_tips` on\nthe sales reports so the two screens agree on what \"revenue\" means.'),
  "voided_amount": zod.number()
})


export const ListAttendanceQueryParams = zod.object({
  "from": zod.iso.date(),
  "to": zod.iso.date(),
  "branch_id": zod.uuid().optional(),
  "user_id": zod.uuid().optional(),
  "status": zod.string().optional()
})

export const ListAttendanceResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "business_date": zod.iso.date(),
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_in_distance_meters": zod.number().nullish(),
  "check_in_latitude": zod.number().nullish(),
  "check_in_longitude": zod.number().nullish(),
  "check_in_method": zod.string().nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_distance_meters": zod.number().nullish(),
  "check_out_latitude": zod.number().nullish(),
  "check_out_longitude": zod.number().nullish(),
  "check_out_method": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "early_leave_minutes": zod.number(),
  "edit_reason": zod.string().nullish(),
  "edited_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "is_manual": zod.boolean(),
  "late_minutes": zod.number(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}).nullish(),
  "scheduled_start_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "work_shift_id": zod.uuid().nullish(),
  "work_shift_name": zod.string().nullish(),
  "worked_minutes": zod.number()
})
export const ListAttendanceResponse = zod.array(ListAttendanceResponseItem)


export const CreateManualRecordBody = zod.object({
  "branch_id": zod.uuid(),
  "business_date": zod.iso.date(),
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "notes": zod.string().nullish(),
  "reason": zod.string().describe('Required: a hand-written attendance row always says why it exists.'),
  "status": zod.string().nullish().describe('Force a status instead of deriving one — the only way to record an\n`absent` or `on_leave` day by hand.'),
  "user_id": zod.uuid(),
  "work_shift_id": zod.uuid().nullish()
})

export const CreateManualRecordResponse = zod.object({
  "branch_id": zod.uuid(),
  "business_date": zod.iso.date(),
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_in_distance_meters": zod.number().nullish(),
  "check_in_latitude": zod.number().nullish(),
  "check_in_longitude": zod.number().nullish(),
  "check_in_method": zod.string().nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_distance_meters": zod.number().nullish(),
  "check_out_latitude": zod.number().nullish(),
  "check_out_longitude": zod.number().nullish(),
  "check_out_method": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "early_leave_minutes": zod.number(),
  "edit_reason": zod.string().nullish(),
  "edited_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "is_manual": zod.boolean(),
  "late_minutes": zod.number(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}).nullish(),
  "scheduled_start_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "work_shift_id": zod.uuid().nullish(),
  "work_shift_name": zod.string().nullish(),
  "worked_minutes": zod.number()
})


export const GetAttendanceSettingsQueryParams = zod.object({
  "branch_id": zod.uuid().optional()
})

export const GetAttendanceSettingsResponse = zod.object({
  "absence_deduction_days": zod.number(),
  "auto_checkout_buffer_minutes": zod.number(),
  "branch_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_overtime_multiplier": zod.number(),
  "excused_time_paid_default": zod.boolean().describe('Whether an approved mid-shift permission or early departure is PAID by\ndefault. The approver may override it on any individual request.'),
  "id": zod.uuid(),
  "late_deduction_tiers": zod.unknown(),
  "org_id": zod.uuid(),
  "require_geofence": zod.boolean(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "weekend_days": zod.array(zod.number()),
  "working_days_per_month": zod.number()
})


export const PutAttendanceSettingsBody = zod.object({
  "absence_deduction_days": zod.number().nullish(),
  "auto_checkout_buffer_minutes": zod.number().nullish(),
  "branch_id": zod.uuid().nullish().describe('`None` = the org-wide default row.'),
  "default_overtime_multiplier": zod.number().nullish(),
  "excused_time_paid_default": zod.boolean().nullish(),
  "late_deduction_tiers": zod.array(zod.object({
  "from_minutes": zod.number(),
  "kind": zod.enum(['minutes', 'piastres', 'day_fraction']).describe('What a tier costs the employee.'),
  "to_minutes": zod.number().nullish(),
  "value": zod.number()
}).describe('One rung of the late-penalty ladder. Ranges are inclusive at both ends;\n`to_minutes = None` is the open-ended top rung.')).nullish(),
  "require_geofence": zod.boolean().nullish(),
  "weekend_days": zod.array(zod.number()).nullish(),
  "working_days_per_month": zod.number().nullish()
})

export const PutAttendanceSettingsResponse = zod.object({
  "absence_deduction_days": zod.number(),
  "auto_checkout_buffer_minutes": zod.number(),
  "branch_id": zod.uuid().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "default_overtime_multiplier": zod.number(),
  "excused_time_paid_default": zod.boolean().describe('Whether an approved mid-shift permission or early departure is PAID by\ndefault. The approver may override it on any individual request.'),
  "id": zod.uuid(),
  "late_deduction_tiers": zod.unknown(),
  "org_id": zod.uuid(),
  "require_geofence": zod.boolean(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "weekend_days": zod.array(zod.number()),
  "working_days_per_month": zod.number()
})


export const AttendanceSummaryQueryParams = zod.object({
  "from": zod.iso.date(),
  "to": zod.iso.date(),
  "branch_id": zod.uuid().optional(),
  "user_id": zod.uuid().optional(),
  "status": zod.string().optional()
})

export const AttendanceSummaryResponseItem = zod.object({
  "absent_days": zod.number(),
  "half_days": zod.number(),
  "late_days": zod.number(),
  "leave_days": zod.number(),
  "present_days": zod.number(),
  "total_late_minutes": zod.number(),
  "total_overtime_minutes": zod.number(),
  "total_worked_minutes": zod.number(),
  "user_id": zod.uuid(),
  "user_name": zod.string()
}).describe('One employee\'s totals over a reporting window.')
export const AttendanceSummaryResponse = zod.array(AttendanceSummaryResponseItem)


export const DeleteRecordParams = zod.object({
  "id": zod.uuid().describe('Attendance record ID')
})

export const DeleteRecordResponse = zod.void()


export const CorrectRecordParams = zod.object({
  "id": zod.uuid().describe('Attendance record ID')
})

export const CorrectRecordBody = zod.object({
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "notes": zod.string().nullish(),
  "reason": zod.string().describe('Required — corrections are audited.'),
  "status": zod.string().nullish()
})

export const CorrectRecordResponse = zod.object({
  "branch_id": zod.uuid(),
  "business_date": zod.iso.date(),
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_in_distance_meters": zod.number().nullish(),
  "check_in_latitude": zod.number().nullish(),
  "check_in_longitude": zod.number().nullish(),
  "check_in_method": zod.string().nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_distance_meters": zod.number().nullish(),
  "check_out_latitude": zod.number().nullish(),
  "check_out_longitude": zod.number().nullish(),
  "check_out_method": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "early_leave_minutes": zod.number(),
  "edit_reason": zod.string().nullish(),
  "edited_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "is_manual": zod.boolean(),
  "late_minutes": zod.number(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}).nullish(),
  "scheduled_start_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "work_shift_id": zod.uuid().nullish(),
  "work_shift_name": zod.string().nullish(),
  "worked_minutes": zod.number()
})


export const ListDepartmentsResponseItem = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "employee_count": zod.number().describe('Live employees currently assigned. Not stored.'),
  "id": zod.uuid(),
  "manager_name": zod.string().nullish().describe('Denormalised for the dashboard list; not stored.'),
  "manager_user_id": zod.uuid().nullish(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListDepartmentsResponse = zod.array(ListDepartmentsResponseItem)


export const CreateDepartmentBody = zod.object({
  "manager_user_id": zod.uuid().nullish(),
  "name": zod.string()
})

export const CreateDepartmentResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "employee_count": zod.number().describe('Live employees currently assigned. Not stored.'),
  "id": zod.uuid(),
  "manager_name": zod.string().nullish().describe('Denormalised for the dashboard list; not stored.'),
  "manager_user_id": zod.uuid().nullish(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteDepartmentParams = zod.object({
  "id": zod.uuid().describe('Department ID')
})

export const DeleteDepartmentResponse = zod.void()


export const UpdateDepartmentParams = zod.object({
  "id": zod.uuid().describe('Department ID')
})

export const UpdateDepartmentBody = zod.object({
  "manager_user_id": zod.uuid().nullish(),
  "name": zod.string()
})

export const UpdateDepartmentResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "employee_count": zod.number().describe('Live employees currently assigned. Not stored.'),
  "id": zod.uuid(),
  "manager_name": zod.string().nullish().describe('Denormalised for the dashboard list; not stored.'),
  "manager_user_id": zod.uuid().nullish(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteDocumentParams = zod.object({
  "id": zod.uuid().describe('Document ID')
})

export const DeleteDocumentResponse = zod.void()


export const ListEmployeesQueryParams = zod.object({
  "department_id": zod.uuid().optional(),
  "employment_status": zod.string().optional().describe('`active` | `suspended` | `terminated`. Omitted = every status.'),
  "search": zod.string().optional().describe('Case-insensitive substring over name, employee code, and job title.')
})

export const ListEmployeesResponseItem = zod.object({
  "base_salary_piastres": zod.number().nullish().describe('`None` when the caller lacks `payroll:read` — see the module docs.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "department_id": zod.uuid().nullish(),
  "department_name": zod.string().nullish(),
  "email": zod.string().nullish(),
  "emergency_contact_name": zod.string().nullish(),
  "emergency_contact_phone": zod.string().nullish(),
  "employee_code": zod.string().nullish(),
  "employment_status": zod.string(),
  "hire_date": zod.iso.date().nullish(),
  "is_active": zod.boolean(),
  "job_title": zod.string().nullish(),
  "name": zod.string().describe('From `users` — the employee\'s name IS their user name; there is no\nsecond copy to drift.'),
  "national_id": zod.string().nullish(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "phone": zod.string().nullish(),
  "photo_url": zod.string().nullish(),
  "role": zod.string().describe('The POS role. Orthogonal to employment: a cleaner is a `teller`-role user\nwith the POS permissions revoked.'),
  "termination_date": zod.iso.date().nullish(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid()
})
export const ListEmployeesResponse = zod.array(ListEmployeesResponseItem)


export const GetEmployeeParams = zod.object({
  "user_id": zod.uuid().describe('The employee\'s user ID')
})

export const GetEmployeeResponse = zod.object({
  "base_salary_piastres": zod.number().nullish().describe('`None` when the caller lacks `payroll:read` — see the module docs.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "department_id": zod.uuid().nullish(),
  "department_name": zod.string().nullish(),
  "email": zod.string().nullish(),
  "emergency_contact_name": zod.string().nullish(),
  "emergency_contact_phone": zod.string().nullish(),
  "employee_code": zod.string().nullish(),
  "employment_status": zod.string(),
  "hire_date": zod.iso.date().nullish(),
  "is_active": zod.boolean(),
  "job_title": zod.string().nullish(),
  "name": zod.string().describe('From `users` — the employee\'s name IS their user name; there is no\nsecond copy to drift.'),
  "national_id": zod.string().nullish(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "phone": zod.string().nullish(),
  "photo_url": zod.string().nullish(),
  "role": zod.string().describe('The POS role. Orthogonal to employment: a cleaner is a `teller`-role user\nwith the POS permissions revoked.'),
  "termination_date": zod.iso.date().nullish(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid()
})


export const PutEmployeeParams = zod.object({
  "user_id": zod.uuid().describe('The employee\'s user ID')
})

export const PutEmployeeBody = zod.object({
  "base_salary_piastres": zod.number().nullish().describe('Piastres. Ignored unless the caller has `payroll:update` — a branch\nmanager editing a job title must not be able to award a raise.'),
  "department_id": zod.uuid().nullish(),
  "emergency_contact_name": zod.string().nullish(),
  "emergency_contact_phone": zod.string().nullish(),
  "employee_code": zod.string().nullish(),
  "employment_status": zod.string().nullish().describe('`active` | `suspended` | `terminated`. Defaults to `active`.'),
  "hire_date": zod.iso.date().nullish(),
  "job_title": zod.string().nullish(),
  "national_id": zod.string().nullish(),
  "notes": zod.string().nullish(),
  "photo_url": zod.string().nullish(),
  "termination_date": zod.iso.date().nullish()
}).describe('Full replace of an employee\'s HR profile. A PUT rather than a POST because\nthe key is the user id: writing a profile for a user who has none promotes\nthem to staff, and writing it again edits them.')

export const PutEmployeeResponse = zod.object({
  "base_salary_piastres": zod.number().nullish().describe('`None` when the caller lacks `payroll:read` — see the module docs.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "department_id": zod.uuid().nullish(),
  "department_name": zod.string().nullish(),
  "email": zod.string().nullish(),
  "emergency_contact_name": zod.string().nullish(),
  "emergency_contact_phone": zod.string().nullish(),
  "employee_code": zod.string().nullish(),
  "employment_status": zod.string(),
  "hire_date": zod.iso.date().nullish(),
  "is_active": zod.boolean(),
  "job_title": zod.string().nullish(),
  "name": zod.string().describe('From `users` — the employee\'s name IS their user name; there is no\nsecond copy to drift.'),
  "national_id": zod.string().nullish(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "phone": zod.string().nullish(),
  "photo_url": zod.string().nullish(),
  "role": zod.string().describe('The POS role. Orthogonal to employment: a cleaner is a `teller`-role user\nwith the POS permissions revoked.'),
  "termination_date": zod.iso.date().nullish(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid()
})


export const DeleteEmployeeParams = zod.object({
  "user_id": zod.uuid().describe('The employee\'s user ID')
})

export const DeleteEmployeeResponse = zod.void()


export const ListDocumentsParams = zod.object({
  "user_id": zod.uuid().describe('The employee\'s user ID')
})

export const ListDocumentsResponseItem = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "expires_on": zod.iso.date().nullish(),
  "file_url": zod.string().nullish(),
  "id": zod.uuid(),
  "kind": zod.string(),
  "org_id": zod.uuid(),
  "title": zod.string(),
  "uploaded_by": zod.uuid().nullish(),
  "user_id": zod.uuid()
})
export const ListDocumentsResponse = zod.array(ListDocumentsResponseItem)


export const CreateDocumentParams = zod.object({
  "user_id": zod.uuid().describe('The employee\'s user ID')
})

export const CreateDocumentBody = zod.object({
  "expires_on": zod.iso.date().nullish(),
  "file_url": zod.string().describe('A path returned by the existing `\/uploads` endpoints.'),
  "kind": zod.string().nullish(),
  "title": zod.string()
})

export const CreateDocumentResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "expires_on": zod.iso.date().nullish(),
  "file_url": zod.string().nullish(),
  "id": zod.uuid(),
  "kind": zod.string(),
  "org_id": zod.uuid(),
  "title": zod.string(),
  "uploaded_by": zod.uuid().nullish(),
  "user_id": zod.uuid()
})


export const ListBalancesQueryParams = zod.object({
  "user_id": zod.uuid().optional(),
  "year": zod.number().optional().describe('Defaults to the current calendar year.')
})

export const ListBalancesResponseItem = zod.object({
  "carried_over_days": zod.number(),
  "entitled_days": zod.number(),
  "id": zod.uuid(),
  "leave_type_id": zod.uuid(),
  "leave_type_name": zod.string().nullish(),
  "org_id": zod.uuid(),
  "remaining_days": zod.number().describe('`entitled + carried_over − used`. Computed, not stored.'),
  "used_days": zod.number(),
  "user_id": zod.uuid(),
  "year": zod.number()
})
export const ListBalancesResponse = zod.array(ListBalancesResponseItem)


export const PutBalanceBody = zod.object({
  "carried_over_days": zod.number().nullish(),
  "entitled_days": zod.number(),
  "leave_type_id": zod.uuid(),
  "user_id": zod.uuid(),
  "year": zod.number()
})

export const PutBalanceResponse = zod.object({
  "carried_over_days": zod.number(),
  "entitled_days": zod.number(),
  "id": zod.uuid(),
  "leave_type_id": zod.uuid(),
  "leave_type_name": zod.string().nullish(),
  "org_id": zod.uuid(),
  "remaining_days": zod.number().describe('`entitled + carried_over − used`. Computed, not stored.'),
  "used_days": zod.number(),
  "user_id": zod.uuid(),
  "year": zod.number()
})


export const ListLeaveTypesResponseItem = zod.object({
  "annual_quota_days": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_paid": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "requires_approval": zod.boolean(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListLeaveTypesResponse = zod.array(ListLeaveTypesResponseItem)


export const CreateLeaveTypeBody = zod.object({
  "annual_quota_days": zod.number().nullish(),
  "is_active": zod.boolean().nullish(),
  "is_paid": zod.boolean().nullish(),
  "name": zod.string(),
  "requires_approval": zod.boolean().nullish()
})

export const CreateLeaveTypeResponse = zod.object({
  "annual_quota_days": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_paid": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "requires_approval": zod.boolean(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteLeaveTypeParams = zod.object({
  "id": zod.uuid().describe('Leave type ID')
})

export const DeleteLeaveTypeResponse = zod.void()


export const UpdateLeaveTypeParams = zod.object({
  "id": zod.uuid().describe('Leave type ID')
})

export const UpdateLeaveTypeBody = zod.object({
  "annual_quota_days": zod.number().nullish(),
  "is_active": zod.boolean().nullish(),
  "is_paid": zod.boolean().nullish(),
  "name": zod.string(),
  "requires_approval": zod.boolean().nullish()
})

export const UpdateLeaveTypeResponse = zod.object({
  "annual_quota_days": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_paid": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "requires_approval": zod.boolean(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const MyAdvancesResponseItem = zod.object({
  "amount_piastres": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "decided_at": zod.iso.datetime({"offset":true}).nullish(),
  "decided_by": zod.uuid().nullish(),
  "decision_note": zod.string().nullish(),
  "id": zod.uuid(),
  "installments": zod.number(),
  "monthly_installment_piastres": zod.number(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "remaining_piastres": zod.number(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish()
})
export const MyAdvancesResponse = zod.array(MyAdvancesResponseItem)


export const CreateMyAdvanceBody = zod.object({
  "amount_piastres": zod.number(),
  "installments": zod.number().nullish().describe('Defaults to 1 — repaid in full from the next payslip.'),
  "reason": zod.string().nullish(),
  "user_id": zod.uuid().nullish().describe('Admin-only; omitted on `\/staff\/me\/\*`.')
})

export const CreateMyAdvanceResponse = zod.object({
  "amount_piastres": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "decided_at": zod.iso.datetime({"offset":true}).nullish(),
  "decided_by": zod.uuid().nullish(),
  "decision_note": zod.string().nullish(),
  "id": zod.uuid(),
  "installments": zod.number(),
  "monthly_installment_piastres": zod.number(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "remaining_piastres": zod.number(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish()
})


export const MyAttendanceQueryParams = zod.object({
  "from": zod.iso.date(),
  "to": zod.iso.date()
})

export const MyAttendanceResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "business_date": zod.iso.date(),
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_in_distance_meters": zod.number().nullish(),
  "check_in_latitude": zod.number().nullish(),
  "check_in_longitude": zod.number().nullish(),
  "check_in_method": zod.string().nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_distance_meters": zod.number().nullish(),
  "check_out_latitude": zod.number().nullish(),
  "check_out_longitude": zod.number().nullish(),
  "check_out_method": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "early_leave_minutes": zod.number(),
  "edit_reason": zod.string().nullish(),
  "edited_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "is_manual": zod.boolean(),
  "late_minutes": zod.number(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}).nullish(),
  "scheduled_start_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "work_shift_id": zod.uuid().nullish(),
  "work_shift_name": zod.string().nullish(),
  "worked_minutes": zod.number()
})
export const MyAttendanceResponse = zod.array(MyAttendanceResponseItem)


export const CheckInBody = zod.object({
  "branch_id": zod.uuid(),
  "latitude": zod.number().nullish().describe('Device coordinates. Required whenever the org enforces the geofence.'),
  "longitude": zod.number().nullish()
})

export const CheckInResponse = zod.object({
  "branch_id": zod.uuid(),
  "business_date": zod.iso.date(),
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_in_distance_meters": zod.number().nullish(),
  "check_in_latitude": zod.number().nullish(),
  "check_in_longitude": zod.number().nullish(),
  "check_in_method": zod.string().nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_distance_meters": zod.number().nullish(),
  "check_out_latitude": zod.number().nullish(),
  "check_out_longitude": zod.number().nullish(),
  "check_out_method": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "early_leave_minutes": zod.number(),
  "edit_reason": zod.string().nullish(),
  "edited_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "is_manual": zod.boolean(),
  "late_minutes": zod.number(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}).nullish(),
  "scheduled_start_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "work_shift_id": zod.uuid().nullish(),
  "work_shift_name": zod.string().nullish(),
  "worked_minutes": zod.number()
})


export const CheckOutBody = zod.object({
  "latitude": zod.number().nullish(),
  "longitude": zod.number().nullish()
})

export const CheckOutResponse = zod.object({
  "branch_id": zod.uuid(),
  "business_date": zod.iso.date(),
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_in_distance_meters": zod.number().nullish(),
  "check_in_latitude": zod.number().nullish(),
  "check_in_longitude": zod.number().nullish(),
  "check_in_method": zod.string().nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_distance_meters": zod.number().nullish(),
  "check_out_latitude": zod.number().nullish(),
  "check_out_longitude": zod.number().nullish(),
  "check_out_method": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "early_leave_minutes": zod.number(),
  "edit_reason": zod.string().nullish(),
  "edited_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "is_manual": zod.boolean(),
  "late_minutes": zod.number(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}).nullish(),
  "scheduled_start_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "work_shift_id": zod.uuid().nullish(),
  "work_shift_name": zod.string().nullish(),
  "worked_minutes": zod.number()
})


export const MyLeaveBalancesQueryParams = zod.object({
  "user_id": zod.uuid().optional(),
  "year": zod.number().optional().describe('Defaults to the current calendar year.')
})

export const MyLeaveBalancesResponseItem = zod.object({
  "carried_over_days": zod.number(),
  "entitled_days": zod.number(),
  "id": zod.uuid(),
  "leave_type_id": zod.uuid(),
  "leave_type_name": zod.string().nullish(),
  "org_id": zod.uuid(),
  "remaining_days": zod.number().describe('`entitled + carried_over − used`. Computed, not stored.'),
  "used_days": zod.number(),
  "user_id": zod.uuid(),
  "year": zod.number()
})
export const MyLeaveBalancesResponse = zod.array(MyLeaveBalancesResponseItem)


export const MyPayslipsResponseItem = zod.object({
  "absent_days": zod.number(),
  "advance_installment_piastres": zod.number(),
  "base_salary_piastres": zod.number(),
  "bonuses_piastres": zod.number(),
  "breakdown": zod.unknown(),
  "deductions_piastres": zod.number(),
  "generated_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "late_minutes": zod.number(),
  "leave_days": zod.number(),
  "net_piastres": zod.number(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "overtime_piastres": zod.number(),
  "payroll_period_id": zod.uuid(),
  "period_end": zod.iso.date().nullish(),
  "period_name": zod.string().nullish().describe('The period this covers, denormalised. A payslip identified only by its\ngeneration timestamp is unreadable — two months run on the same day would\nbe indistinguishable to the employee looking at them.'),
  "period_start": zod.iso.date().nullish(),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "worked_days": zod.number()
})
export const MyPayslipsResponse = zod.array(MyPayslipsResponseItem)


export const MyRequestsResponseItem = zod.object({
  "attendance_record_id": zod.uuid().nullish().describe('The record a `correction` proposes to fix. `None` for every other kind.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "decided_at": zod.iso.datetime({"offset":true}).nullish(),
  "decided_by": zod.uuid().nullish(),
  "decision_note": zod.string().nullish(),
  "end_date": zod.iso.date().nullish().describe('Set for `leave` and `mission`; the span\'s last day.'),
  "from_time": zod.string().nullish().describe('Start of the excused window. `None` = open to the shift\'s start.'),
  "id": zod.uuid(),
  "is_half_day": zod.boolean(),
  "is_paid": zod.boolean().nullish().describe('Whether the excused time is paid. `None` until decided.'),
  "kind": zod.string().describe('`leave` | `late_arrival` | `early_departure` | `excuse` | `mission`.'),
  "leave_type_id": zod.uuid().nullish(),
  "leave_type_name": zod.string().nullish(),
  "location": zod.string().nullish(),
  "on_date": zod.iso.date(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "status": zod.string(),
  "title": zod.string().nullish(),
  "to_time": zod.string().nullish().describe('End of the excused window. `None` = open to the shift\'s end.'),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish()
})
export const MyRequestsResponse = zod.array(MyRequestsResponseItem)


export const CreateMyRequestBody = zod.object({
  "attendance_record_id": zod.uuid().nullish().describe('`correction` only — the record whose punch is wrong.'),
  "end_date": zod.iso.date().nullish(),
  "from_time": zod.string().nullish(),
  "is_half_day": zod.boolean().nullish(),
  "kind": zod.string().describe('One of `leave`, `late_arrival`, `early_departure`, `excuse`, `mission`,\n`correction`.'),
  "leave_type_id": zod.uuid().nullish(),
  "location": zod.string().nullish(),
  "on_date": zod.iso.date(),
  "reason": zod.string().nullish(),
  "title": zod.string().nullish(),
  "to_time": zod.string().nullish(),
  "user_id": zod.uuid().nullish().describe('Admin-only. Omitted on `\/staff\/me\/\*`, where it is always the caller.')
})

export const CreateMyRequestResponse = zod.object({
  "attendance_record_id": zod.uuid().nullish().describe('The record a `correction` proposes to fix. `None` for every other kind.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "decided_at": zod.iso.datetime({"offset":true}).nullish(),
  "decided_by": zod.uuid().nullish(),
  "decision_note": zod.string().nullish(),
  "end_date": zod.iso.date().nullish().describe('Set for `leave` and `mission`; the span\'s last day.'),
  "from_time": zod.string().nullish().describe('Start of the excused window. `None` = open to the shift\'s start.'),
  "id": zod.uuid(),
  "is_half_day": zod.boolean(),
  "is_paid": zod.boolean().nullish().describe('Whether the excused time is paid. `None` until decided.'),
  "kind": zod.string().describe('`leave` | `late_arrival` | `early_departure` | `excuse` | `mission`.'),
  "leave_type_id": zod.uuid().nullish(),
  "leave_type_name": zod.string().nullish(),
  "location": zod.string().nullish(),
  "on_date": zod.iso.date(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "status": zod.string(),
  "title": zod.string().nullish(),
  "to_time": zod.string().nullish().describe('End of the excused window. `None` = open to the shift\'s end.'),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish()
})


/**
 * Own-row scoped like the rest of `/staff/me/*`: it needs no permission grant,
 * because seeing when you are expected at work is not an admin capability.
 * @summary The employee's OWN roster for a date range — what the app's Shifts tab shows.
 */
export const MyScheduleQueryParams = zod.object({
  "from": zod.iso.date(),
  "to": zod.iso.date()
})

export const MyScheduleResponseItem = zod.object({
  "branch_name": zod.string().nullish().describe('The branch each shift is worked at, when the employee has one assignment.'),
  "date": zod.iso.date(),
  "shifts": zod.array(zod.object({
  "break_minutes": zod.number(),
  "checkin_window_minutes": zod.number(),
  "grace_minutes": zod.number(),
  "half_day_threshold_minutes": zod.number().nullish(),
  "name": zod.string(),
  "overtime_multiplier": zod.number(),
  "overtime_threshold_minutes": zod.number(),
  "paid_break": zod.boolean(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}),
  "scheduled_start_at": zod.iso.datetime({"offset":true}),
  "work_shift_id": zod.uuid()
}).describe('A work shift resolved onto a concrete calendar date, with its window already\nconverted to UTC instants.')).describe('Empty = a rest day.')
}).describe('One day of an employee\'s own upcoming roster.')
export const MyScheduleResponse = zod.array(MyScheduleResponseItem)


export const MyTodayResponse = zod.object({
  "blocked_reason": zod.string().nullish().describe('Why `can_check_in` is false, in words the app can show verbatim.'),
  "branch_id": zod.uuid().nullish().describe('WHERE to clock in today. Resolved server-side — from the open record, the\nrostered shift\'s branch, or the employee\'s single branch assignment — so\nthe app never has to ask. A branch picker would make the geofence\nanswerable to a dropdown, which defeats the point of having one.\n`None` means we cannot tell, and the app should say so rather than guess.'),
  "branch_name": zod.string().nullish().describe('That branch\'s name, so the app\'s geofence chip can say WHERE it is about\nto clock in rather than merely that it can.'),
  "business_date": zod.iso.date().describe('The business date in the relevant branch\'s timezone — not the device\'s.'),
  "can_check_in": zod.boolean(),
  "can_check_out": zod.boolean(),
  "closed_records": zod.array(zod.object({
  "branch_id": zod.uuid(),
  "business_date": zod.iso.date(),
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_in_distance_meters": zod.number().nullish(),
  "check_in_latitude": zod.number().nullish(),
  "check_in_longitude": zod.number().nullish(),
  "check_in_method": zod.string().nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_distance_meters": zod.number().nullish(),
  "check_out_latitude": zod.number().nullish(),
  "check_out_longitude": zod.number().nullish(),
  "check_out_method": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "early_leave_minutes": zod.number(),
  "edit_reason": zod.string().nullish(),
  "edited_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "is_manual": zod.boolean(),
  "late_minutes": zod.number(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}).nullish(),
  "scheduled_start_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "work_shift_id": zod.uuid().nullish(),
  "work_shift_name": zod.string().nullish(),
  "worked_minutes": zod.number()
})).describe('Records already closed today.'),
  "open_record": zod.union([zod.null(),zod.object({
  "branch_id": zod.uuid(),
  "business_date": zod.iso.date(),
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_in_distance_meters": zod.number().nullish(),
  "check_in_latitude": zod.number().nullish(),
  "check_in_longitude": zod.number().nullish(),
  "check_in_method": zod.string().nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_distance_meters": zod.number().nullish(),
  "check_out_latitude": zod.number().nullish(),
  "check_out_longitude": zod.number().nullish(),
  "check_out_method": zod.string().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "early_leave_minutes": zod.number(),
  "edit_reason": zod.string().nullish(),
  "edited_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "is_manual": zod.boolean(),
  "late_minutes": zod.number(),
  "notes": zod.string().nullish(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}).nullish(),
  "scheduled_start_at": zod.iso.datetime({"offset":true}).nullish(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "work_shift_id": zod.uuid().nullish(),
  "work_shift_name": zod.string().nullish(),
  "worked_minutes": zod.number()
}).describe('The still-open record, when the employee is currently clocked in.')]).optional(),
  "scheduled": zod.array(zod.object({
  "break_minutes": zod.number(),
  "checkin_window_minutes": zod.number(),
  "grace_minutes": zod.number(),
  "half_day_threshold_minutes": zod.number().nullish(),
  "name": zod.string(),
  "overtime_multiplier": zod.number(),
  "overtime_threshold_minutes": zod.number(),
  "paid_break": zod.boolean(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}),
  "scheduled_start_at": zod.iso.datetime({"offset":true}),
  "work_shift_id": zod.uuid()
}).describe('A work shift resolved onto a concrete calendar date, with its window already\nconverted to UTC instants.')).describe('Shifts rostered for today. Empty = a rest day.')
}).describe('What the mobile app shows on its home screen.')


export const ListAdvancesQueryParams = zod.object({
  "user_id": zod.uuid().optional(),
  "from": zod.iso.date().optional(),
  "to": zod.iso.date().optional()
})

export const ListAdvancesResponseItem = zod.object({
  "amount_piastres": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "decided_at": zod.iso.datetime({"offset":true}).nullish(),
  "decided_by": zod.uuid().nullish(),
  "decision_note": zod.string().nullish(),
  "id": zod.uuid(),
  "installments": zod.number(),
  "monthly_installment_piastres": zod.number(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "remaining_piastres": zod.number(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish()
})
export const ListAdvancesResponse = zod.array(ListAdvancesResponseItem)


export const CreateAdvanceAdminBody = zod.object({
  "amount_piastres": zod.number(),
  "installments": zod.number().nullish().describe('Defaults to 1 — repaid in full from the next payslip.'),
  "reason": zod.string().nullish(),
  "user_id": zod.uuid().nullish().describe('Admin-only; omitted on `\/staff\/me\/\*`.')
})

export const CreateAdvanceAdminResponse = zod.object({
  "amount_piastres": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "decided_at": zod.iso.datetime({"offset":true}).nullish(),
  "decided_by": zod.uuid().nullish(),
  "decision_note": zod.string().nullish(),
  "id": zod.uuid(),
  "installments": zod.number(),
  "monthly_installment_piastres": zod.number(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "remaining_piastres": zod.number(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish()
})


export const DecideAdvanceParams = zod.object({
  "id": zod.uuid().describe('Advance ID')
})

export const DecideAdvanceBody = zod.object({
  "note": zod.string().nullish(),
  "status": zod.string().describe('`approved` | `rejected` | `cancelled`.')
}).describe('Deciding a SALARY ADVANCE. Deliberately not called `DecisionRequest`: staff\nrequests have their own decision body carrying `is_paid`, and two structs\nsharing a name collapse into one OpenAPI schema — which silently gave every\ngenerated client the wrong shape for one of them.')

export const DecideAdvanceResponse = zod.object({
  "amount_piastres": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "decided_at": zod.iso.datetime({"offset":true}).nullish(),
  "decided_by": zod.uuid().nullish(),
  "decision_note": zod.string().nullish(),
  "id": zod.uuid(),
  "installments": zod.number(),
  "monthly_installment_piastres": zod.number(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "remaining_piastres": zod.number(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish()
})


export const ListBonusesQueryParams = zod.object({
  "user_id": zod.uuid().optional(),
  "from": zod.iso.date().optional(),
  "to": zod.iso.date().optional()
})

export const ListBonusesResponseItem = zod.object({
  "amount_piastres": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "effective_date": zod.iso.date(),
  "id": zod.uuid(),
  "org_id": zod.uuid(),
  "original_amount_piastres": zod.number().nullish().describe('What the RULE computed, before any human touched it. `None` on a\nhand-entered row — nothing was overridden, so there is no \"original\".'),
  "overridden_at": zod.iso.datetime({"offset":true}).nullish(),
  "override_reason": zod.string().nullish(),
  "percent_of_base": zod.number().nullish(),
  "reason": zod.string(),
  "source": zod.string(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "waive_reason": zod.string().nullish(),
  "waived_at": zod.iso.datetime({"offset":true}).nullish().describe('A waived deduction keeps its amount and stays visible; payroll skips it.')
})
export const ListBonusesResponse = zod.array(ListBonusesResponseItem)


export const CreateBonusBody = zod.object({
  "amount_piastres": zod.number().nullish().describe('Exactly one of `amount_piastres` or `percent_of_base`.'),
  "effective_date": zod.iso.date(),
  "percent_of_base": zod.number().nullish(),
  "reason": zod.string(),
  "user_id": zod.uuid()
})

export const CreateBonusResponse = zod.object({
  "amount_piastres": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "effective_date": zod.iso.date(),
  "id": zod.uuid(),
  "org_id": zod.uuid(),
  "original_amount_piastres": zod.number().nullish().describe('What the RULE computed, before any human touched it. `None` on a\nhand-entered row — nothing was overridden, so there is no \"original\".'),
  "overridden_at": zod.iso.datetime({"offset":true}).nullish(),
  "override_reason": zod.string().nullish(),
  "percent_of_base": zod.number().nullish(),
  "reason": zod.string(),
  "source": zod.string(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "waive_reason": zod.string().nullish(),
  "waived_at": zod.iso.datetime({"offset":true}).nullish().describe('A waived deduction keeps its amount and stays visible; payroll skips it.')
})


export const DeleteBonusParams = zod.object({
  "id": zod.uuid().describe('Bonus ID')
})

export const DeleteBonusResponse = zod.void()


export const ListDeductionsQueryParams = zod.object({
  "user_id": zod.uuid().optional(),
  "from": zod.iso.date().optional(),
  "to": zod.iso.date().optional()
})

export const ListDeductionsResponseItem = zod.object({
  "amount_piastres": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "effective_date": zod.iso.date(),
  "id": zod.uuid(),
  "org_id": zod.uuid(),
  "original_amount_piastres": zod.number().nullish().describe('What the RULE computed, before any human touched it. `None` on a\nhand-entered row — nothing was overridden, so there is no \"original\".'),
  "overridden_at": zod.iso.datetime({"offset":true}).nullish(),
  "override_reason": zod.string().nullish(),
  "percent_of_base": zod.number().nullish(),
  "reason": zod.string(),
  "source": zod.string(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "waive_reason": zod.string().nullish(),
  "waived_at": zod.iso.datetime({"offset":true}).nullish().describe('A waived deduction keeps its amount and stays visible; payroll skips it.')
})
export const ListDeductionsResponse = zod.array(ListDeductionsResponseItem)


export const CreateDeductionBody = zod.object({
  "amount_piastres": zod.number().nullish().describe('Exactly one of `amount_piastres` or `percent_of_base`.'),
  "effective_date": zod.iso.date(),
  "percent_of_base": zod.number().nullish(),
  "reason": zod.string(),
  "user_id": zod.uuid()
})

export const CreateDeductionResponse = zod.object({
  "amount_piastres": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "effective_date": zod.iso.date(),
  "id": zod.uuid(),
  "org_id": zod.uuid(),
  "original_amount_piastres": zod.number().nullish().describe('What the RULE computed, before any human touched it. `None` on a\nhand-entered row — nothing was overridden, so there is no \"original\".'),
  "overridden_at": zod.iso.datetime({"offset":true}).nullish(),
  "override_reason": zod.string().nullish(),
  "percent_of_base": zod.number().nullish(),
  "reason": zod.string(),
  "source": zod.string(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "waive_reason": zod.string().nullish(),
  "waived_at": zod.iso.datetime({"offset":true}).nullish().describe('A waived deduction keeps its amount and stays visible; payroll skips it.')
})


export const DeleteDeductionParams = zod.object({
  "id": zod.uuid().describe('Deduction ID')
})

export const DeleteDeductionResponse = zod.void()


export const OverrideDeductionParams = zod.object({
  "id": zod.uuid().describe('Deduction ID')
})

export const OverrideDeductionBody = zod.object({
  "amount_piastres": zod.number().describe('The figure to charge instead of the computed one. Zero is allowed — it\nmeans \"charge nothing\" while keeping the row and its history.'),
  "reason": zod.string().describe('Required. An override with no stated reason is indistinguishable from a\nmistake six months later.')
})

export const OverrideDeductionResponse = zod.object({
  "amount_piastres": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "effective_date": zod.iso.date(),
  "id": zod.uuid(),
  "org_id": zod.uuid(),
  "original_amount_piastres": zod.number().nullish().describe('What the RULE computed, before any human touched it. `None` on a\nhand-entered row — nothing was overridden, so there is no \"original\".'),
  "overridden_at": zod.iso.datetime({"offset":true}).nullish(),
  "override_reason": zod.string().nullish(),
  "percent_of_base": zod.number().nullish(),
  "reason": zod.string(),
  "source": zod.string(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "waive_reason": zod.string().nullish(),
  "waived_at": zod.iso.datetime({"offset":true}).nullish().describe('A waived deduction keeps its amount and stays visible; payroll skips it.')
})


export const WaiveDeductionParams = zod.object({
  "id": zod.uuid().describe('Deduction ID')
})

export const WaiveDeductionBody = zod.object({
  "reason": zod.string()
})

export const WaiveDeductionResponse = zod.object({
  "amount_piastres": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "effective_date": zod.iso.date(),
  "id": zod.uuid(),
  "org_id": zod.uuid(),
  "original_amount_piastres": zod.number().nullish().describe('What the RULE computed, before any human touched it. `None` on a\nhand-entered row — nothing was overridden, so there is no \"original\".'),
  "overridden_at": zod.iso.datetime({"offset":true}).nullish(),
  "override_reason": zod.string().nullish(),
  "percent_of_base": zod.number().nullish(),
  "reason": zod.string(),
  "source": zod.string(),
  "status": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "waive_reason": zod.string().nullish(),
  "waived_at": zod.iso.datetime({"offset":true}).nullish().describe('A waived deduction keeps its amount and stays visible; payroll skips it.')
})


export const ListPeriodsResponseItem = zod.object({
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "employee_count": zod.number(),
  "end_date": zod.iso.date(),
  "generated_at": zod.iso.datetime({"offset":true}).nullish(),
  "generated_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "paid_at": zod.iso.datetime({"offset":true}).nullish(),
  "start_date": zod.iso.date(),
  "status": zod.string(),
  "total_net_piastres": zod.number(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListPeriodsResponse = zod.array(ListPeriodsResponseItem)


export const CreatePeriodBody = zod.object({
  "end_date": zod.iso.date(),
  "name": zod.string(),
  "start_date": zod.iso.date()
})

export const CreatePeriodResponse = zod.object({
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "employee_count": zod.number(),
  "end_date": zod.iso.date(),
  "generated_at": zod.iso.datetime({"offset":true}).nullish(),
  "generated_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "paid_at": zod.iso.datetime({"offset":true}).nullish(),
  "start_date": zod.iso.date(),
  "status": zod.string(),
  "total_net_piastres": zod.number(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeletePeriodParams = zod.object({
  "id": zod.uuid().describe('Period ID')
})

export const DeletePeriodResponse = zod.void()


/**
 * Deliberately serves the PAYSLIPS, not a fresh computation: the file handed to
 * a bank must be exactly what was approved, even if a deduction has been edited
 * since. A period that has not been generated has nothing to export.
 * @summary The generated period as a bank-ready CSV.
 */
export const ExportPeriodCsvParams = zod.object({
  "id": zod.uuid().describe('Period ID')
})

export const ExportPeriodCsvResponse = zod.unknown()


export const GeneratePeriodParams = zod.object({
  "id": zod.uuid().describe('Period ID')
})

export const GeneratePeriodResponseItem = zod.object({
  "absent_days": zod.number(),
  "advance_installment_piastres": zod.number(),
  "base_salary_piastres": zod.number(),
  "bonuses_piastres": zod.number(),
  "breakdown": zod.unknown(),
  "deductions_piastres": zod.number(),
  "generated_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "late_minutes": zod.number(),
  "leave_days": zod.number(),
  "net_piastres": zod.number(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "overtime_piastres": zod.number(),
  "payroll_period_id": zod.uuid(),
  "period_end": zod.iso.date().nullish(),
  "period_name": zod.string().nullish().describe('The period this covers, denormalised. A payslip identified only by its\ngeneration timestamp is unreadable — two months run on the same day would\nbe indistinguishable to the employee looking at them.'),
  "period_start": zod.iso.date().nullish(),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "worked_days": zod.number()
})
export const GeneratePeriodResponse = zod.array(GeneratePeriodResponseItem)


export const ListPayslipsParams = zod.object({
  "id": zod.uuid().describe('Period ID')
})

export const ListPayslipsResponseItem = zod.object({
  "absent_days": zod.number(),
  "advance_installment_piastres": zod.number(),
  "base_salary_piastres": zod.number(),
  "bonuses_piastres": zod.number(),
  "breakdown": zod.unknown(),
  "deductions_piastres": zod.number(),
  "generated_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "late_minutes": zod.number(),
  "leave_days": zod.number(),
  "net_piastres": zod.number(),
  "org_id": zod.uuid(),
  "overtime_minutes": zod.number(),
  "overtime_piastres": zod.number(),
  "payroll_period_id": zod.uuid(),
  "period_end": zod.iso.date().nullish(),
  "period_name": zod.string().nullish().describe('The period this covers, denormalised. A payslip identified only by its\ngeneration timestamp is unreadable — two months run on the same day would\nbe indistinguishable to the employee looking at them.'),
  "period_start": zod.iso.date().nullish(),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish(),
  "worked_days": zod.number()
})
export const ListPayslipsResponse = zod.array(ListPayslipsResponseItem)


export const PreviewPeriodParams = zod.object({
  "id": zod.uuid().describe('Period ID')
})

export const PreviewPeriodResponseItem = zod.object({
  "absent_days": zod.number(),
  "advance_installment_piastres": zod.number().describe('What the advances WANT versus what the payslip can afford differ when net\npay would go negative; this is the affordable figure, the one collected.'),
  "base_piastres": zod.number().describe('After the attendance proration — what the days actually worked earn.'),
  "base_salary_piastres": zod.number(),
  "bonuses_piastres": zod.number(),
  "breakdown": zod.unknown().describe('Line-by-line, so a preview can name each deduction rather than showing a\nlump sum nobody can argue with.'),
  "deductions_piastres": zod.number(),
  "late_minutes": zod.number(),
  "leave_days": zod.number(),
  "name": zod.string(),
  "net_piastres": zod.number(),
  "overtime_minutes": zod.number(),
  "overtime_piastres": zod.number(),
  "user_id": zod.uuid(),
  "worked_days": zod.number()
}).describe('One employee\'s pay for a period, computed but not yet written.\n\nPREVIEW AND GENERATE SHARE THIS. The preview endpoint exists so a manager can\nsee what payroll is about to do — a figure that would be worthless if it came\nfrom a second implementation that could drift from the real one. So the\ngenerator computes these first and then persists them, and the preview\ncomputes exactly the same values and persists nothing.')
export const PreviewPeriodResponse = zod.array(PreviewPeriodResponseItem)


export const SetPeriodStatusParams = zod.object({
  "id": zod.uuid().describe('Period ID')
})

export const SetPeriodStatusBody = zod.object({
  "status": zod.string().describe('`draft` | `generated` | `paid` | `closed`.')
})

export const SetPeriodStatusResponse = zod.object({
  "closed_at": zod.iso.datetime({"offset":true}).nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "employee_count": zod.number(),
  "end_date": zod.iso.date(),
  "generated_at": zod.iso.datetime({"offset":true}).nullish(),
  "generated_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "paid_at": zod.iso.datetime({"offset":true}).nullish(),
  "start_date": zod.iso.date(),
  "status": zod.string(),
  "total_net_piastres": zod.number(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const ListRequestsQueryParams = zod.object({
  "user_id": zod.uuid().optional(),
  "kind": zod.string().optional(),
  "status": zod.string().optional(),
  "from": zod.iso.date().optional(),
  "to": zod.iso.date().optional()
})

export const ListRequestsResponseItem = zod.object({
  "attendance_record_id": zod.uuid().nullish().describe('The record a `correction` proposes to fix. `None` for every other kind.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "decided_at": zod.iso.datetime({"offset":true}).nullish(),
  "decided_by": zod.uuid().nullish(),
  "decision_note": zod.string().nullish(),
  "end_date": zod.iso.date().nullish().describe('Set for `leave` and `mission`; the span\'s last day.'),
  "from_time": zod.string().nullish().describe('Start of the excused window. `None` = open to the shift\'s start.'),
  "id": zod.uuid(),
  "is_half_day": zod.boolean(),
  "is_paid": zod.boolean().nullish().describe('Whether the excused time is paid. `None` until decided.'),
  "kind": zod.string().describe('`leave` | `late_arrival` | `early_departure` | `excuse` | `mission`.'),
  "leave_type_id": zod.uuid().nullish(),
  "leave_type_name": zod.string().nullish(),
  "location": zod.string().nullish(),
  "on_date": zod.iso.date(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "status": zod.string(),
  "title": zod.string().nullish(),
  "to_time": zod.string().nullish().describe('End of the excused window. `None` = open to the shift\'s end.'),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish()
})
export const ListRequestsResponse = zod.array(ListRequestsResponseItem)


export const CreateRequestAdminBody = zod.object({
  "attendance_record_id": zod.uuid().nullish().describe('`correction` only — the record whose punch is wrong.'),
  "end_date": zod.iso.date().nullish(),
  "from_time": zod.string().nullish(),
  "is_half_day": zod.boolean().nullish(),
  "kind": zod.string().describe('One of `leave`, `late_arrival`, `early_departure`, `excuse`, `mission`,\n`correction`.'),
  "leave_type_id": zod.uuid().nullish(),
  "location": zod.string().nullish(),
  "on_date": zod.iso.date(),
  "reason": zod.string().nullish(),
  "title": zod.string().nullish(),
  "to_time": zod.string().nullish(),
  "user_id": zod.uuid().nullish().describe('Admin-only. Omitted on `\/staff\/me\/\*`, where it is always the caller.')
})

export const CreateRequestAdminResponse = zod.object({
  "attendance_record_id": zod.uuid().nullish().describe('The record a `correction` proposes to fix. `None` for every other kind.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "decided_at": zod.iso.datetime({"offset":true}).nullish(),
  "decided_by": zod.uuid().nullish(),
  "decision_note": zod.string().nullish(),
  "end_date": zod.iso.date().nullish().describe('Set for `leave` and `mission`; the span\'s last day.'),
  "from_time": zod.string().nullish().describe('Start of the excused window. `None` = open to the shift\'s start.'),
  "id": zod.uuid(),
  "is_half_day": zod.boolean(),
  "is_paid": zod.boolean().nullish().describe('Whether the excused time is paid. `None` until decided.'),
  "kind": zod.string().describe('`leave` | `late_arrival` | `early_departure` | `excuse` | `mission`.'),
  "leave_type_id": zod.uuid().nullish(),
  "leave_type_name": zod.string().nullish(),
  "location": zod.string().nullish(),
  "on_date": zod.iso.date(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "status": zod.string(),
  "title": zod.string().nullish(),
  "to_time": zod.string().nullish().describe('End of the excused window. `None` = open to the shift\'s end.'),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish()
})


export const DecideRequestParams = zod.object({
  "id": zod.uuid().describe('Request ID')
})

export const DecideRequestBody = zod.object({
  "is_paid": zod.boolean().nullish().describe('Whether the excused time is paid. Applies to `excuse` and\n`early_departure`; omitted falls back to the org\'s\n`excused_time_paid_default`.'),
  "note": zod.string().nullish(),
  "status": zod.string().describe('`approved` | `rejected` | `cancelled`.')
})

export const DecideRequestResponse = zod.object({
  "attendance_record_id": zod.uuid().nullish().describe('The record a `correction` proposes to fix. `None` for every other kind.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "decided_at": zod.iso.datetime({"offset":true}).nullish(),
  "decided_by": zod.uuid().nullish(),
  "decision_note": zod.string().nullish(),
  "end_date": zod.iso.date().nullish().describe('Set for `leave` and `mission`; the span\'s last day.'),
  "from_time": zod.string().nullish().describe('Start of the excused window. `None` = open to the shift\'s start.'),
  "id": zod.uuid(),
  "is_half_day": zod.boolean(),
  "is_paid": zod.boolean().nullish().describe('Whether the excused time is paid. `None` until decided.'),
  "kind": zod.string().describe('`leave` | `late_arrival` | `early_departure` | `excuse` | `mission`.'),
  "leave_type_id": zod.uuid().nullish(),
  "leave_type_name": zod.string().nullish(),
  "location": zod.string().nullish(),
  "on_date": zod.iso.date(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "status": zod.string(),
  "title": zod.string().nullish(),
  "to_time": zod.string().nullish().describe('End of the excused window. `None` = open to the shift\'s end.'),
  "updated_at": zod.iso.datetime({"offset":true}),
  "user_id": zod.uuid(),
  "user_name": zod.string().nullish()
})


export const ListAssignmentsQueryParams = zod.object({
  "user_id": zod.uuid().optional().describe('Omit for the WHOLE org\'s roster — what a schedule grid needs, and the\nonly way to draw one without a request per employee.')
})

export const ListAssignmentsResponseItem = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "day_of_week": zod.number().nullish().describe('Postgres `EXTRACT(DOW)` convention: 0 = Sunday … 6 = Saturday.\n`None` = every day of the week.'),
  "effective_from": zod.iso.date(),
  "effective_to": zod.iso.date().nullish(),
  "id": zod.uuid(),
  "org_id": zod.uuid(),
  "user_id": zod.uuid(),
  "work_shift_id": zod.uuid(),
  "work_shift_name": zod.string().nullish()
})
export const ListAssignmentsResponse = zod.array(ListAssignmentsResponseItem)


export const CreateAssignmentBody = zod.object({
  "day_of_week": zod.number().nullish().describe('0 = Sunday … 6 = Saturday. Omit for \"every day\".'),
  "effective_from": zod.iso.date().nullish(),
  "effective_to": zod.iso.date().nullish(),
  "user_id": zod.uuid(),
  "work_shift_id": zod.uuid()
})

export const CreateAssignmentResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "day_of_week": zod.number().nullish().describe('Postgres `EXTRACT(DOW)` convention: 0 = Sunday … 6 = Saturday.\n`None` = every day of the week.'),
  "effective_from": zod.iso.date(),
  "effective_to": zod.iso.date().nullish(),
  "id": zod.uuid(),
  "org_id": zod.uuid(),
  "user_id": zod.uuid(),
  "work_shift_id": zod.uuid(),
  "work_shift_name": zod.string().nullish()
})


export const GetScheduledDayQueryParams = zod.object({
  "user_id": zod.uuid(),
  "date": zod.iso.date(),
  "branch_id": zod.uuid().optional().describe('Which branch\'s timezone the day is measured in. Defaults to the\nemployee\'s only branch assignment when they have exactly one.')
})

export const GetScheduledDayResponseItem = zod.object({
  "break_minutes": zod.number(),
  "checkin_window_minutes": zod.number(),
  "grace_minutes": zod.number(),
  "half_day_threshold_minutes": zod.number().nullish(),
  "name": zod.string(),
  "overtime_multiplier": zod.number(),
  "overtime_threshold_minutes": zod.number(),
  "paid_break": zod.boolean(),
  "scheduled_end_at": zod.iso.datetime({"offset":true}),
  "scheduled_start_at": zod.iso.datetime({"offset":true}),
  "work_shift_id": zod.uuid()
}).describe('A work shift resolved onto a concrete calendar date, with its window already\nconverted to UTC instants.')
export const GetScheduledDayResponse = zod.array(GetScheduledDayResponseItem)


export const PutOverrideBody = zod.object({
  "on_date": zod.iso.date(),
  "reason": zod.string().nullish(),
  "user_id": zod.uuid(),
  "work_shift_id": zod.uuid().nullish().describe('Omit (or send null) to mark the date an explicit day off.')
})

export const PutOverrideResponse = zod.object({
  "created_at": zod.iso.datetime({"offset":true}),
  "created_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "on_date": zod.iso.date(),
  "org_id": zod.uuid(),
  "reason": zod.string().nullish(),
  "user_id": zod.uuid(),
  "work_shift_id": zod.uuid().nullish().describe('`None` = an explicit day off.'),
  "work_shift_name": zod.string().nullish()
})


export const DeleteOverrideParams = zod.object({
  "id": zod.uuid().describe('Override ID')
})

export const DeleteOverrideResponse = zod.void()


export const DeleteAssignmentParams = zod.object({
  "id": zod.uuid().describe('Assignment ID')
})

export const DeleteAssignmentResponse = zod.void()


/**
 * Computed from TODAY'S attendance rows joined against the roster, so someone
 * rostered with no row yet is `absent` only once their shift has actually
 * started — before that they are simply `off`, not a red number on a manager's
 * dashboard at 6am.
 * @summary Who is in, late, absent or on leave right now.
 */
export const TeamPresenceQueryParams = zod.object({
  "branch_id": zod.uuid().optional().describe('Omit for every branch in the org.')
})

export const TeamPresenceResponse = zod.object({
  "absent": zod.number(),
  "business_date": zod.iso.date().describe('The branch\'s business date, in ITS timezone — not the manager\'s device.'),
  "late": zod.number(),
  "on_leave": zod.number(),
  "planned_minutes": zod.number().describe('Minutes rostered for today across the team.'),
  "present": zod.number(),
  "rows": zod.array(zod.object({
  "branch_name": zod.string().nullish(),
  "check_in_at": zod.iso.datetime({"offset":true}).nullish(),
  "check_out_at": zod.iso.datetime({"offset":true}).nullish(),
  "job_title": zod.string().nullish(),
  "late_minutes": zod.number(),
  "scheduled_minutes": zod.number().describe('Minutes this person is rostered for today — the denominator of the\nlabour-vs-plan bar.'),
  "state": zod.string().describe('`in` | `late` | `absent` | `on_leave` | `off` | `done`.'),
  "user_id": zod.uuid(),
  "user_name": zod.string(),
  "worked_minutes": zod.number()
}).describe('One person\'s state right now, for the manager\'s live team list.')),
  "worked_minutes": zod.number().describe('Minutes actually worked so far today across the team.')
}).describe('The whole team\'s state right now, plus the day\'s labour against plan.')


export const ListWorkShiftsResponseItem = zod.object({
  "branch_id": zod.uuid().nullish().describe('`None` = an org-wide template usable at any branch.'),
  "break_minutes": zod.number(),
  "checkin_window_minutes": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "crosses_midnight": zod.boolean().describe('Derived by the database from `end_time <= start_time`.'),
  "end_time": zod.string(),
  "grace_minutes": zod.number(),
  "half_day_threshold_minutes": zod.number().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "overtime_multiplier": zod.number(),
  "overtime_threshold_minutes": zod.number(),
  "paid_break": zod.boolean(),
  "start_time": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListWorkShiftsResponse = zod.array(ListWorkShiftsResponseItem)


export const CreateWorkShiftBody = zod.object({
  "branch_id": zod.uuid().nullish(),
  "break_minutes": zod.number().nullish(),
  "checkin_window_minutes": zod.number().nullish(),
  "end_time": zod.string(),
  "grace_minutes": zod.number().nullish(),
  "half_day_threshold_minutes": zod.number().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string(),
  "overtime_multiplier": zod.number().nullish(),
  "overtime_threshold_minutes": zod.number().nullish(),
  "paid_break": zod.boolean().nullish(),
  "start_time": zod.string()
})

export const CreateWorkShiftResponse = zod.object({
  "branch_id": zod.uuid().nullish().describe('`None` = an org-wide template usable at any branch.'),
  "break_minutes": zod.number(),
  "checkin_window_minutes": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "crosses_midnight": zod.boolean().describe('Derived by the database from `end_time <= start_time`.'),
  "end_time": zod.string(),
  "grace_minutes": zod.number(),
  "half_day_threshold_minutes": zod.number().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "overtime_multiplier": zod.number(),
  "overtime_threshold_minutes": zod.number(),
  "paid_break": zod.boolean(),
  "start_time": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteWorkShiftParams = zod.object({
  "id": zod.uuid().describe('Work shift ID')
})

export const DeleteWorkShiftResponse = zod.void()


export const UpdateWorkShiftParams = zod.object({
  "id": zod.uuid().describe('Work shift ID')
})

export const UpdateWorkShiftBody = zod.object({
  "branch_id": zod.uuid().nullish(),
  "break_minutes": zod.number().nullish(),
  "checkin_window_minutes": zod.number().nullish(),
  "end_time": zod.string(),
  "grace_minutes": zod.number().nullish(),
  "half_day_threshold_minutes": zod.number().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string(),
  "overtime_multiplier": zod.number().nullish(),
  "overtime_threshold_minutes": zod.number().nullish(),
  "paid_break": zod.boolean().nullish(),
  "start_time": zod.string()
})

export const UpdateWorkShiftResponse = zod.object({
  "branch_id": zod.uuid().nullish().describe('`None` = an org-wide template usable at any branch.'),
  "break_minutes": zod.number(),
  "checkin_window_minutes": zod.number(),
  "created_at": zod.iso.datetime({"offset":true}),
  "crosses_midnight": zod.boolean().describe('Derived by the database from `end_time <= start_time`.'),
  "end_time": zod.string(),
  "grace_minutes": zod.number(),
  "half_day_threshold_minutes": zod.number().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "overtime_multiplier": zod.number(),
  "overtime_threshold_minutes": zod.number(),
  "paid_break": zod.boolean(),
  "start_time": zod.string(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const ListStocktakesParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID, or the all-zeros UUID for every branch in the org')
})

export const ListStocktakesResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to).'),
  "counted_items": zod.number().nullish().describe('Items counted \/ items in scope; populated by the list endpoint only.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "finalized_at": zod.iso.datetime({"offset":true}).nullish(),
  "finalized_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "scope": zod.looseObject({

}).describe('`{\"kind\":\"full\"}`, `{\"kind\":\"category\",\"category_id\":…}` or\n`{\"kind\":\"items\",\"org_ingredient_ids\":[…]}`.'),
  "started_at": zod.iso.datetime({"offset":true}),
  "started_by": zod.uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string(),
  "total_items": zod.number().nullish()
})
export const ListStocktakesResponse = zod.array(ListStocktakesResponseItem)


export const CreateStocktakeParams = zod.object({
  "branch_id": zod.uuid().describe('Branch ID')
})

export const CreateStocktakeBody = zod.object({
  "category_id": zod.uuid().nullish().describe('Cycle-count scope: only ingredients in this category.'),
  "note": zod.string().nullish(),
  "org_ingredient_ids": zod.array(zod.uuid()).nullish().describe('Cycle-count scope: only these ingredients.')
})

export const CreateStocktakeResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to).'),
  "counted_items": zod.number().nullish().describe('Items counted \/ items in scope; populated by the list endpoint only.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "finalized_at": zod.iso.datetime({"offset":true}).nullish(),
  "finalized_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "scope": zod.looseObject({

}).describe('`{\"kind\":\"full\"}`, `{\"kind\":\"category\",\"category_id\":…}` or\n`{\"kind\":\"items\",\"org_ingredient_ids\":[…]}`.'),
  "started_at": zod.iso.datetime({"offset":true}),
  "started_by": zod.uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string(),
  "total_items": zod.number().nullish()
}).and(zod.object({
  "items": zod.array(zod.object({
  "book_qty": zod.number().describe('The baseline the difference is measured against: live book stock while\nthe count is open, frozen at finalize.'),
  "category_id": zod.uuid(),
  "category_name": zod.string(),
  "counted_by": zod.uuid().nullish(),
  "counted_qty": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "is_new": zod.boolean().describe('True when the branch had no stock activity for this ingredient when the\ncount opened — counting it is what starts tracking it here.'),
  "note": zod.string().nullish(),
  "opening_qty": zod.number().describe('Book stock when the count was opened (reference only).'),
  "org_ingredient_id": zod.uuid(),
  "stocktake_id": zod.uuid(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit snapshot; `null` ⟺ unknown.'),
  "variance": zod.number().nullish().describe('counted − book; `null` until counted.'),
  "variance_reason": zod.string().nullish().describe('theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.')
})),
  "variance_threshold_pct": zod.number().describe('Org tolerance: a counted row whose |difference| is >= this percent of\nbook stock (or that appears-from \/ vanishes-to zero) is flagged and\nrequires a `variance_reason` before the count can be finalized.')
}))


export const GetStocktakeParams = zod.object({
  "id": zod.uuid().describe('Stocktake ID')
})

export const GetStocktakeResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to).'),
  "counted_items": zod.number().nullish().describe('Items counted \/ items in scope; populated by the list endpoint only.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "finalized_at": zod.iso.datetime({"offset":true}).nullish(),
  "finalized_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "scope": zod.looseObject({

}).describe('`{\"kind\":\"full\"}`, `{\"kind\":\"category\",\"category_id\":…}` or\n`{\"kind\":\"items\",\"org_ingredient_ids\":[…]}`.'),
  "started_at": zod.iso.datetime({"offset":true}),
  "started_by": zod.uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string(),
  "total_items": zod.number().nullish()
}).and(zod.object({
  "items": zod.array(zod.object({
  "book_qty": zod.number().describe('The baseline the difference is measured against: live book stock while\nthe count is open, frozen at finalize.'),
  "category_id": zod.uuid(),
  "category_name": zod.string(),
  "counted_by": zod.uuid().nullish(),
  "counted_qty": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "is_new": zod.boolean().describe('True when the branch had no stock activity for this ingredient when the\ncount opened — counting it is what starts tracking it here.'),
  "note": zod.string().nullish(),
  "opening_qty": zod.number().describe('Book stock when the count was opened (reference only).'),
  "org_ingredient_id": zod.uuid(),
  "stocktake_id": zod.uuid(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit snapshot; `null` ⟺ unknown.'),
  "variance": zod.number().nullish().describe('counted − book; `null` until counted.'),
  "variance_reason": zod.string().nullish().describe('theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.')
})),
  "variance_threshold_pct": zod.number().describe('Org tolerance: a counted row whose |difference| is >= this percent of\nbook stock (or that appears-from \/ vanishes-to zero) is flagged and\nrequires a `variance_reason` before the count can be finalized.')
}))


export const CancelStocktakeParams = zod.object({
  "id": zod.uuid().describe('Stocktake ID')
})

export const CancelStocktakeResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to).'),
  "counted_items": zod.number().nullish().describe('Items counted \/ items in scope; populated by the list endpoint only.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "finalized_at": zod.iso.datetime({"offset":true}).nullish(),
  "finalized_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "scope": zod.looseObject({

}).describe('`{\"kind\":\"full\"}`, `{\"kind\":\"category\",\"category_id\":…}` or\n`{\"kind\":\"items\",\"org_ingredient_ids\":[…]}`.'),
  "started_at": zod.iso.datetime({"offset":true}),
  "started_by": zod.uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string(),
  "total_items": zod.number().nullish()
})


export const FinalizeStocktakeParams = zod.object({
  "id": zod.uuid().describe('Stocktake ID')
})

export const FinalizeStocktakeResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to).'),
  "counted_items": zod.number().nullish().describe('Items counted \/ items in scope; populated by the list endpoint only.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "finalized_at": zod.iso.datetime({"offset":true}).nullish(),
  "finalized_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "scope": zod.looseObject({

}).describe('`{\"kind\":\"full\"}`, `{\"kind\":\"category\",\"category_id\":…}` or\n`{\"kind\":\"items\",\"org_ingredient_ids\":[…]}`.'),
  "started_at": zod.iso.datetime({"offset":true}),
  "started_by": zod.uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string(),
  "total_items": zod.number().nullish()
}).and(zod.object({
  "items": zod.array(zod.object({
  "book_qty": zod.number().describe('The baseline the difference is measured against: live book stock while\nthe count is open, frozen at finalize.'),
  "category_id": zod.uuid(),
  "category_name": zod.string(),
  "counted_by": zod.uuid().nullish(),
  "counted_qty": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "is_new": zod.boolean().describe('True when the branch had no stock activity for this ingredient when the\ncount opened — counting it is what starts tracking it here.'),
  "note": zod.string().nullish(),
  "opening_qty": zod.number().describe('Book stock when the count was opened (reference only).'),
  "org_ingredient_id": zod.uuid(),
  "stocktake_id": zod.uuid(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit snapshot; `null` ⟺ unknown.'),
  "variance": zod.number().nullish().describe('counted − book; `null` until counted.'),
  "variance_reason": zod.string().nullish().describe('theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.')
})),
  "variance_threshold_pct": zod.number().describe('Org tolerance: a counted row whose |difference| is >= this percent of\nbook stock (or that appears-from \/ vanishes-to zero) is flagged and\nrequires a `variance_reason` before the count can be finalized.')
}))


export const UpsertItemsParams = zod.object({
  "id": zod.uuid().describe('Stocktake ID')
})

export const UpsertItemsBody = zod.object({
  "items": zod.array(zod.object({
  "counted_qty": zod.number(),
  "note": zod.string().nullish(),
  "org_ingredient_id": zod.uuid(),
  "variance_reason": zod.string().nullish().describe('Why the count differs from book stock. One of: theft | spoilage |\nbreakage | miscount | supplier_short | transfer_error | other. Required\nat finalize for rows whose difference exceeds the org\'s threshold.')
}))
})

export const UpsertItemsResponse = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string().nullish().describe('Branch label — only populated by the stocktakes list (so the \"All\nbranches\" view can show which branch each stocktake belongs to).'),
  "counted_items": zod.number().nullish().describe('Items counted \/ items in scope; populated by the list endpoint only.'),
  "created_at": zod.iso.datetime({"offset":true}),
  "finalized_at": zod.iso.datetime({"offset":true}).nullish(),
  "finalized_by": zod.uuid().nullish(),
  "id": zod.uuid(),
  "note": zod.string().nullish(),
  "org_id": zod.uuid(),
  "scope": zod.looseObject({

}).describe('`{\"kind\":\"full\"}`, `{\"kind\":\"category\",\"category_id\":…}` or\n`{\"kind\":\"items\",\"org_ingredient_ids\":[…]}`.'),
  "started_at": zod.iso.datetime({"offset":true}),
  "started_by": zod.uuid(),
  "started_by_name": zod.string().nullish(),
  "status": zod.string(),
  "total_items": zod.number().nullish()
}).and(zod.object({
  "items": zod.array(zod.object({
  "book_qty": zod.number().describe('The baseline the difference is measured against: live book stock while\nthe count is open, frozen at finalize.'),
  "category_id": zod.uuid(),
  "category_name": zod.string(),
  "counted_by": zod.uuid().nullish(),
  "counted_qty": zod.number().nullish(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "ingredient_name": zod.string(),
  "is_new": zod.boolean().describe('True when the branch had no stock activity for this ingredient when the\ncount opened — counting it is what starts tracking it here.'),
  "note": zod.string().nullish(),
  "opening_qty": zod.number().describe('Book stock when the count was opened (reference only).'),
  "org_ingredient_id": zod.uuid(),
  "stocktake_id": zod.uuid(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish().describe('Piastres per unit snapshot; `null` ⟺ unknown.'),
  "variance": zod.number().nullish().describe('counted − book; `null` until counted.'),
  "variance_reason": zod.string().nullish().describe('theft | spoilage | breakage | miscount | supplier_short | transfer_error | other.')
})),
  "variance_threshold_pct": zod.number().describe('Org tolerance: a counted row whose |difference| is >= this percent of\nbook stock (or that appears-from \/ vanishes-to zero) is flagged and\nrequires a `variance_reason` before the count can be finalized.')
}))


export const VarianceReportParams = zod.object({
  "id": zod.uuid().describe('Stocktake ID')
})

export const VarianceReportResponse = zod.object({
  "net_variance_value": zod.number().describe('overage − shrinkage (net effect on inventory value).'),
  "rows": zod.array(zod.object({
  "book_qty": zod.number().describe('Book stock the difference is measured against (at finalize).'),
  "category_name": zod.string(),
  "counted_qty": zod.number().nullish(),
  "ingredient_name": zod.string(),
  "is_flagged": zod.boolean().describe('True when |difference| exceeds the org threshold (or appears\/vanishes from zero).'),
  "opening_qty": zod.number().describe('Book stock when the count opened.'),
  "org_ingredient_id": zod.uuid(),
  "unit": zod.string(),
  "unit_cost": zod.number().nullish(),
  "variance": zod.number().nullish().describe('counted − book.'),
  "variance_reason": zod.string().nullish(),
  "variance_value": zod.number().nullish().describe('variance × unit_cost in piastres; `null` when cost unknown.')
})),
  "stocktake_id": zod.uuid(),
  "total_overage_value": zod.number().describe('Piastres of overage (positive variances).'),
  "total_shrinkage_value": zod.number().describe('Piastres lost to shrinkage (negative variances), as a positive number.'),
  "unknown_cost_count": zod.number().describe('Count of counted rows whose cost was unknown (excluded from totals).'),
  "variance_threshold_pct": zod.number()
})


export const ListTillsQueryParams = zod.object({
  "branch_id": zod.uuid()
})

export const ListTillsResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})
export const ListTillsResponse = zod.array(ListTillsResponseItem)


export const CreateTillBody = zod.object({
  "branch_id": zod.uuid(),
  "is_active": zod.boolean().nullish(),
  "is_default": zod.boolean().nullish(),
  "name": zod.string()
})

export const CreateTillResponse = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})


export const DeleteTillParams = zod.object({
  "id": zod.uuid().describe('Till ID')
})

export const DeleteTillResponse = zod.void()


export const UpdateTillParams = zod.object({
  "id": zod.uuid().describe('Till ID')
})

export const UpdateTillBody = zod.object({
  "is_active": zod.boolean().nullish(),
  "is_default": zod.boolean().nullish(),
  "name": zod.string().nullish()
})

export const UpdateTillResponse = zod.object({
  "branch_id": zod.uuid(),
  "created_at": zod.iso.datetime({"offset":true}),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "is_default": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "updated_at": zod.iso.datetime({"offset":true})
})


/**
 * @summary The full set of selectable IANA timezones — the labels of the `timezone_name`
DB enum. The dashboard's timezone `<select>` is populated from this, so the
frontend can never offer a value the backend/DB would reject (single source
of truth: DB enum → this endpoint → select options).
 */
export const ListTimezonesResponseItem = zod.string()
export const ListTimezonesResponse = zod.array(ListTimezonesResponseItem)


export const UploadMenuItemImageParams = zod.object({
  "menu_item_id": zod.uuid().describe('Menu item ID')
})

export const UploadMenuItemImageBody = zod.object({
  "image": zod.instanceof(File)
})

export const UploadMenuItemImageResponse = zod.object({
  "image_url": zod.string()
})


export const ListUsersQueryParams = zod.object({
  "org_id": zod.uuid().optional().describe('Filter to a specific organization. Optional for super-admins\n(who see all orgs when omitted); required-by-policy for everyone\nelse (overridden server-side to the caller\'s own org).')
})

export const ListUsersResponseItem = zod.object({
  "branch_id": zod.uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller', 'waiter', 'kitchen'])
})
export const ListUsersResponse = zod.array(ListUsersResponseItem)


export const createUserBodyPinMin = 4;
export const createUserBodyPinMax = 6;


export const createUserBodyPinRegExp = new RegExp('^[0-9]{4,6}$');


export const CreateUserBody = zod.object({
  "branch_ids": zod.array(zod.uuid()).nullish().describe('Branches to assign the new user to immediately. Branch managers\ncan only assign to branches they themselves are assigned to.'),
  "email": zod.email().nullish().describe('Required for admins and managers; ignored for tellers.'),
  "name": zod.string(),
  "org_id": zod.uuid(),
  "password": zod.string().nullish().describe('Required when `role` is anything other than `teller`. Plain text;\nhashed server-side with bcrypt before storage.'),
  "phone": zod.string().nullish(),
  "pin": zod.string().min(createUserBodyPinMin).max(createUserBodyPinMax).regex(createUserBodyPinRegExp).nullish().describe('Required when `role = teller`. 4–6 ASCII digits.'),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller', 'waiter', 'kitchen'])
})

export const CreateUserResponse = zod.object({
  "user": zod.object({
  "branch_id": zod.uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller', 'waiter', 'kitchen'])
})
})


export const GetUserParams = zod.object({
  "id": zod.uuid().describe('User ID')
})

export const GetUserResponse = zod.object({
  "branch_id": zod.uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller', 'waiter', 'kitchen'])
})


export const DeleteUserParams = zod.object({
  "id": zod.uuid().describe('User ID')
})

export const DeleteUserResponse = zod.void()


export const UpdateUserParams = zod.object({
  "id": zod.uuid().describe('User ID')
})

export const updateUserBodyPinMin = 4;
export const updateUserBodyPinMax = 6;


export const updateUserBodyPinRegExp = new RegExp('^[0-9]{4,6}$');


export const UpdateUserBody = zod.object({
  "email": zod.email().nullish(),
  "is_active": zod.boolean().nullish(),
  "name": zod.string().nullish(),
  "password": zod.string().nullish().describe('Plain-text new password. Server-side bcrypt-hashed.'),
  "phone": zod.string().nullish(),
  "pin": zod.string().min(updateUserBodyPinMin).max(updateUserBodyPinMax).regex(updateUserBodyPinRegExp).nullish(),
  "role": zod.union([zod.null(),zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller', 'waiter', 'kitchen']).describe('Only org-admins and above can change roles. Promoting to\n`super_admin` requires the caller to be a super-admin.')]).optional()
})

export const UpdateUserResponse = zod.object({
  "branch_id": zod.uuid().nullish(),
  "email": zod.string().nullish(),
  "id": zod.uuid(),
  "is_active": zod.boolean(),
  "name": zod.string(),
  "org_id": zod.uuid().nullish(),
  "phone": zod.string().nullish(),
  "role": zod.enum(['super_admin', 'org_admin', 'branch_manager', 'teller', 'waiter', 'kitchen'])
})


export const ListUserBranchesParams = zod.object({
  "id": zod.uuid().describe('User ID')
})

export const ListUserBranchesResponseItem = zod.object({
  "branch_id": zod.uuid(),
  "branch_name": zod.string()
})
export const ListUserBranchesResponse = zod.array(ListUserBranchesResponseItem)


export const AssignBranchParams = zod.object({
  "id": zod.uuid().describe('User ID')
})

export const AssignBranchBody = zod.object({
  "branch_id": zod.uuid()
})

export const AssignBranchResponse = zod.void()


export const UnassignBranchParams = zod.object({
  "id": zod.uuid().describe('User ID'),
  "branch_id": zod.uuid().describe('Branch ID')
})

export const UnassignBranchResponse = zod.void()


/**
 * @summary Unlink the current number. Idempotent — logging out an already-unlinked
session still returns the (now logged-out) status.
 */
export const WhatsappLogoutResponse = zod.object({
  "configured": zod.boolean().describe('`WHATSAPP_SERVICE_URL` is set on the backend.'),
  "connected": zod.boolean().describe('Underlying socket is connected to WhatsApp.'),
  "has_qr": zod.boolean().describe('A pairing QR is currently available to scan.'),
  "logged_in": zod.boolean().describe('A number is linked and ready to send.'),
  "paused": zod.boolean().describe('Sending is paused by an admin — the number stays linked but every\noutbound message (OTP + status) is suppressed until resumed.'),
  "paused_at": zod.iso.datetime({"offset":true}).nullish().describe('When sending was last paused (audit).'),
  "qr_image": zod.string().nullish().describe('Current pairing QR as a `data:image\/png;base64,…` URL (only when `has_qr`).'),
  "reachable": zod.boolean().describe('The gateway answered over HTTP (false = not configured or unreachable).'),
  "session": zod.string().describe('Session name the relay pairs\/sends under.')
}).describe('Snapshot returned to the dashboard. Combines the gateway\'s live link state\nwith the backend\'s persisted pause switch.')


/**
 * @summary Start (or restart) pairing on the gateway. The QR becomes available a moment
later — the dashboard polls `GET /whatsapp/status` until `has_qr`, shows it,
then keeps polling until `logged_in`.
 */
export const WhatsappPairResponse = zod.object({
  "configured": zod.boolean().describe('`WHATSAPP_SERVICE_URL` is set on the backend.'),
  "connected": zod.boolean().describe('Underlying socket is connected to WhatsApp.'),
  "has_qr": zod.boolean().describe('A pairing QR is currently available to scan.'),
  "logged_in": zod.boolean().describe('A number is linked and ready to send.'),
  "paused": zod.boolean().describe('Sending is paused by an admin — the number stays linked but every\noutbound message (OTP + status) is suppressed until resumed.'),
  "paused_at": zod.iso.datetime({"offset":true}).nullish().describe('When sending was last paused (audit).'),
  "qr_image": zod.string().nullish().describe('Current pairing QR as a `data:image\/png;base64,…` URL (only when `has_qr`).'),
  "reachable": zod.boolean().describe('The gateway answered over HTTP (false = not configured or unreachable).'),
  "session": zod.string().describe('Session name the relay pairs\/sends under.')
}).describe('Snapshot returned to the dashboard. Combines the gateway\'s live link state\nwith the backend\'s persisted pause switch.')


/**
 * @summary Pause or resume all outbound WhatsApp sends. Persisted; survives restarts
and does not touch the linked session.
 */
export const WhatsappPauseBody = zod.object({
  "paused": zod.boolean().describe('`true` = mute all sends; `false` = resume.')
}).describe('Body for `POST \/whatsapp\/pause`.')

export const WhatsappPauseResponse = zod.object({
  "configured": zod.boolean().describe('`WHATSAPP_SERVICE_URL` is set on the backend.'),
  "connected": zod.boolean().describe('Underlying socket is connected to WhatsApp.'),
  "has_qr": zod.boolean().describe('A pairing QR is currently available to scan.'),
  "logged_in": zod.boolean().describe('A number is linked and ready to send.'),
  "paused": zod.boolean().describe('Sending is paused by an admin — the number stays linked but every\noutbound message (OTP + status) is suppressed until resumed.'),
  "paused_at": zod.iso.datetime({"offset":true}).nullish().describe('When sending was last paused (audit).'),
  "qr_image": zod.string().nullish().describe('Current pairing QR as a `data:image\/png;base64,…` URL (only when `has_qr`).'),
  "reachable": zod.boolean().describe('The gateway answered over HTTP (false = not configured or unreachable).'),
  "session": zod.string().describe('Session name the relay pairs\/sends under.')
}).describe('Snapshot returned to the dashboard. Combines the gateway\'s live link state\nwith the backend\'s persisted pause switch.')


/**
 * @summary Current WhatsApp link + pause status, with the pairing QR inlined when one
is waiting to be scanned. Safe to poll from the dashboard.
 */
export const WhatsappStatusResponse = zod.object({
  "configured": zod.boolean().describe('`WHATSAPP_SERVICE_URL` is set on the backend.'),
  "connected": zod.boolean().describe('Underlying socket is connected to WhatsApp.'),
  "has_qr": zod.boolean().describe('A pairing QR is currently available to scan.'),
  "logged_in": zod.boolean().describe('A number is linked and ready to send.'),
  "paused": zod.boolean().describe('Sending is paused by an admin — the number stays linked but every\noutbound message (OTP + status) is suppressed until resumed.'),
  "paused_at": zod.iso.datetime({"offset":true}).nullish().describe('When sending was last paused (audit).'),
  "qr_image": zod.string().nullish().describe('Current pairing QR as a `data:image\/png;base64,…` URL (only when `has_qr`).'),
  "reachable": zod.boolean().describe('The gateway answered over HTTP (false = not configured or unreachable).'),
  "session": zod.string().describe('Session name the relay pairs\/sends under.')
}).describe('Snapshot returned to the dashboard. Combines the gateway\'s live link state\nwith the backend\'s persisted pause switch.')


