import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createHandler } from "../backend/app.mjs";
import { SQLiteRepository } from "../backend/sqlite.mjs";
import { challenges, progressOf } from "../backend/catalog.mjs";
import verifiers from "../backend/verifiers.json" with { type: "json" };
import { solveFixtures, solveIdor } from "./solve-fixtures.mjs";
const origin = "http://localhost:5173";
function client(handler) {
  let cookie = "";
  return {
    get cookie() {
      return cookie;
    },
    async call(path, body, extra = {}) {
      const response = await handler(
        new Request(origin + "/api" + path, {
          method: body ? "POST" : "GET",
          headers: {
            cookie,
            origin,
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...extra,
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        }),
      );
      if (response.headers.has("set-cookie"))
        cookie = response.headers.get("set-cookie").split(";")[0];
      return {
        status: response.status,
        body: await response.json(),
        headers: response.headers,
      };
    },
  };
}
test("all ten artifacts are independently solvable and match verifiers", async () => {
  const lab = spawn(process.execPath, ["challenges/idor/server.mjs"], {
    stdio: "pipe",
  });
  try {
    await new Promise((resolve, reject) => {
      lab.stdout.once("data", resolve);
      lab.once("error", reject);
      lab.once("exit", (code) => reject(Error("Lab failed: " + code)));
    });
    const answers = solveFixtures();
    answers[6] = await solveIdor("http://127.0.0.1:8080");
    assert.equal(Object.keys(answers).length, 10);
    assert.equal(new Set(Object.values(answers)).size, 10);
    for (const [id, flag] of Object.entries(answers)) {
      assert.match(flag, /^SCP\{.+\}$/);
      assert.equal(
        createHash("sha256").update(flag).digest("hex"),
        verifiers[id],
        `Challenge ${id} must match`,
      );
    }
  } finally {
    lab.kill();
  }
});
test("complete game lifecycle, ownership, gates, scoring, hints and logout", async () => {
  const repo = new SQLiteRepository();
  const handler = createHandler(repo, { origin, secure: false }),
    a = client(handler),
    b = client(handler);
  const answers = solveFixtures();
  answers[6] = JSON.parse(
    (await import("node:fs")).readFileSync(
      new URL("../challenges/idor/fixture.json", import.meta.url),
      "utf8",
    ),
  )["101"].body.match(/SCP\{[^}]+\}/)[0];
  assert.equal((await a.call("/me")).status, 401);
  const catalog = await a.call("/catalog");
  assert.equal(catalog.body.challenges.length, 10);
  for (const flag of Object.values(answers))
    assert.ok(!JSON.stringify(catalog.body).includes(flag));
  assert.ok(!JSON.stringify(catalog.body).includes("explanation"));
  assert.equal(
    (
      await a.call("/auth/register", {
        codename: "agent_alpha",
        password: "long-passphrase-001",
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await b.call("/auth/register", {
        codename: "agent_beta",
        password: "long-passphrase-002",
      })
    ).status,
    201,
  );
  assert.equal((await a.call("/challenges/5")).status, 403);
  assert.equal((await a.call("/challenges/1/solution")).status, 403);
  assert.equal((await a.call("/challenges/1/document")).status, 403);
  assert.equal((await a.call("/challenges/11")).status, 404);
  assert.equal(
    (await a.call("/challenges/1/hint", { level: 3 })).body.hints.length,
    3,
  );
  assert.equal(
    (await a.call("/challenges/1/submit", { flag: "SCP{wrong}" })).body.correct,
    false,
  );
  assert.equal(
    (
      await a.call(
        "/challenges/1/submit",
        { flag: answers[1] },
        { origin: "https://evil.test" },
      )
    ).status,
    403,
  );
  for (const c of challenges) {
    assert.equal((await a.call("/challenges/" + c.id)).status, 200);
    const result = await a.call(`/challenges/${c.id}/submit`, {
      flag: answers[c.id],
    });
    assert.equal(result.body.correct, true, `challenge ${c.id}`);
    if (c.id === 1) {
      const duplicate = await a.call(`/challenges/${c.id}/submit`, {
        flag: answers[c.id],
      });
      assert.equal(duplicate.body.duplicate, true);
    }
    assert.equal((await a.call(`/challenges/${c.id}/solution`)).status, 200);
    assert.equal((await a.call(`/challenges/${c.id}/document`)).status, 200);
  }
  const me = (await a.call("/me")).body;
  assert.equal(me.score, 2250);
  assert.equal(me.clearance, 3);
  assert.equal(me.solved.length, 10);
  assert.equal(me.documents.length, 10);
  assert.match(me.ending, /ACT 1 COMPLETE/);
  let last;
  for (let i = 0; i < 10; i++)
    last = await a.call("/challenges/1/submit", { flag: answers[1] });
  assert.equal(last.status, 429);
  const beta = (await b.call("/me")).body;
  assert.equal(beta.score, 0);
  assert.equal(beta.documents.length, 0);
  assert.equal((await b.call("/challenges/1/solution")).status, 403);
  const ranking = (await a.call("/rankings")).body.rankings;
  assert.equal(ranking[0].codename, "agent_alpha");
  assert.ok(!JSON.stringify(ranking).includes("password"));
  assert.ok(!JSON.stringify(ranking).includes("user_id"));
  const oldCookie = a.cookie;
  assert.equal((await a.call("/auth/logout", {})).status, 200);
  assert.equal((await a.call("/me")).status, 401);
  assert.equal(
    (
      await handler(
        new Request(origin + "/api/me", { headers: { cookie: oldCookie } }),
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await a.call("/auth/login", {
        codename: "agent_alpha",
        password: "incorrect-password",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await a.call("/auth/login", {
        codename: "agent_alpha",
        password: "long-passphrase-001",
      })
    ).status,
    200,
  );
  assert.equal((await a.call("/me")).body.score, 2250);
  assert.equal(
    (
      await b.call("/auth/register", {
        codename: "agent_alpha",
        password: "long-passphrase-003",
      })
    ).status,
    409,
  );
  assert.equal(progressOf([1, 2, 3, 4]).clearance, 1);
  assert.equal(progressOf([1, 2, 3, 4, 5, 6, 7]).clearance, 2);
  repo.db.close();
});
test("concurrent duplicate submissions award once and secure cookie is hardened", async () => {
  const repo = new SQLiteRepository(),
    handler = createHandler(repo, { origin, secure: true }),
    a = client(handler);
  const r = await a.call("/auth/register", {
    codename: "race_agent",
    password: "concurrent-password",
  });
  const cookie = r.headers.get("set-cookie");
  assert.match(cookie, /^__Host-scp_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  const flags = solveFixtures();
  await Promise.all(
    Array.from({ length: 8 }, () =>
      a.call("/challenges/1/submit", { flag: flags[1] }),
    ),
  );
  assert.equal((await a.call("/me")).body.score, 100);
  assert.equal((await repo.select("progress")).length, 1);
  repo.db.close();
});
