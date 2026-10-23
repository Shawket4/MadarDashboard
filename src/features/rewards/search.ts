import { defineListSearch, param } from "@/data/scope/list-search";

/** Rewards › Members: search, the segment (madar-card audience rules, as JSON), sort and page in the URL. */
export const rewardsMembersSearch = defineListSearch("/rewards/members", {
  q: param.string(),
  rules: param.string(),
  sort: param.enum(["joined", "last_visit", "balance", "name"] as const, "joined"),
  asc: param.bool(false),
  page: param.page(),
});

/** Rewards › Programme: the open tab. */
export const rewardsProgrammeSearch = defineListSearch("/rewards/programme", {
  tab: param.enum(["programme", "tracks", "rewards", "codes"] as const, "programme", { keepsPage: true }),
});
