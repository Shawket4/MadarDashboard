import { useState } from "react";

import { useDebounced } from "@/lib/use-debounced";

/**
 * A list's search box, and the query it becomes: `search` is what is typed
 * (bind it to `SearchInput`), `q` is that trimmed and settled — what goes to
 * the server, so a request is not fired per keystroke.
 */
export function useListSearch(delay = 300): { search: string; setSearch: (v: string) => void; q: string } {
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim(), delay);
  return { search, setSearch, q };
}
