const TABLES = new Set([
  "users",
  "sessions",
  "progress",
  "hints",
  "submissions",
]);
export class SupabaseRepository {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }
  async request(path, options = {}) {
    const response = await fetch(`${this.url}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
        "Accept-Profile": "scp_game",
        "Content-Profile": "scp_game",
        ...options.headers,
      },
    });
    if (!response.ok) {
      const error = new Error("Database operation failed");
      error.code = (await response.json().catch(() => ({}))).code;
      throw error;
    }
    return response.status === 204 ? [] : response.json();
  }
  select(table, filters = {}) {
    if (!TABLES.has(table)) throw Error("Invalid table");
    return this.request(
      `${table}?select=*&${new URLSearchParams(Object.entries(filters).map(([k, v]) => [k, `eq.${v}`]))}`,
    );
  }
  insert(table, row, ignore = false) {
    if (!TABLES.has(table)) throw Error("Invalid table");
    return this.request(table, {
      method: "POST",
      headers: {
        Prefer: `return=representation${ignore ? ",resolution=ignore-duplicates" : ""}`,
      },
      body: JSON.stringify(row),
    });
  }
  remove(table, filters) {
    if (!TABLES.has(table) || !Object.keys(filters).length)
      throw Error("Invalid delete");
    return this.request(
      `${table}?${new URLSearchParams(Object.entries(filters).map(([k, v]) => [k, `eq.${v}`]))}`,
      { method: "DELETE" },
    );
  }
  async rate(key, limit, seconds) {
    return this.request("rpc/consume_rate", {
      method: "POST",
      body: JSON.stringify({
        bucket_key: key,
        max_count: limit,
        window_seconds: seconds,
      }),
    });
  }
  rankings() {
    return this.request("rpc/rankings", { method: "POST", body: "{}" });
  }
}
