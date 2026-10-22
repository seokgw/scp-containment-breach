import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { solveFixtures, solveIdor } from "../tests/solve-fixtures.mjs";
const base =
    process.env.BASE_URL || "https://scp-containment-breach.vercel.app",
  origin = new URL(base).origin;
const suffix = Date.now().toString(36) + "_" + randomBytes(3).toString("hex");
const names = ["qa_a_" + suffix, "qa_b_" + suffix];
const password = randomBytes(22).toString("base64url");
const checks = [];
function pass(name) {
  checks.push({ name, status: "PASS" });
  console.log("PASS", name);
}
function client() {
  let cookie = "";
  return {
    async call(path, body, override = {}) {
      const response = await fetch(base + "/api" + path, {
        method: body ? "POST" : "GET",
        headers: {
          origin,
          cookie,
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...override,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (response.headers.has("set-cookie"))
        cookie = response.headers.get("set-cookie").split(";")[0];
      return {
        status: response.status,
        headers: response.headers,
        body: await response.json(),
      };
    },
  };
}
mkdirSync(".local", { recursive: true });
const a = client(),
  b = client();
let lab;
try {
  assert.equal((await a.call("/health")).status, 200);
  assert.equal((await a.call("/me")).status, 401);
  pass("production API and unauthenticated denial");
  const cat = (await a.call("/catalog")).body;
  assert.equal(cat.challenges.length, 10);
  assert.equal(
    cat.challenges.reduce((s, c) => s + c.points, 0),
    2250,
  );
  pass("10 released challenges and 2250 points");
  const answers = solveFixtures();
  for (const c of cat.challenges.filter((c) => c.attachment)) {
    const r = await fetch(base + "/evidence/" + c.attachment);
    assert.equal(r.status, 200);
    const actual = Buffer.from(await r.arrayBuffer()),
      expected = readFileSync(
        new URL("../public/evidence/" + c.attachment, import.meta.url),
      );
    assert.equal(
      createHash("sha256").update(actual).digest("hex"),
      createHash("sha256").update(expected).digest("hex"),
    );
  }
  pass("all 9 deployed artifacts match independently solved local files");
  lab = spawn(process.execPath, ["challenges/idor/server.mjs"], {
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    lab.stdout.once("data", resolve);
    lab.once("error", reject);
  });
  answers[6] = await solveIdor("http://127.0.0.1:8080");
  pass("IDOR lab HTTP analysis (local Node; Docker not tested)");
  let r = await a.call("/auth/register", { codename: names[0], password });
  assert.equal(r.status, 201);
  for (const attr of [
    "__Host-scp_session=",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ])
    assert.ok(r.headers.get("set-cookie").includes(attr));
  assert.equal(
    (await b.call("/auth/register", { codename: names[1], password })).status,
    201,
  );
  pass("production registration and hardened cookie");
  assert.equal((await a.call("/challenges/5")).status, 403);
  assert.equal((await a.call("/challenges/11")).status, 404);
  assert.equal((await a.call("/challenges/1/solution")).status, 403);
  assert.equal((await a.call("/challenges/1/document")).status, 403);
  pass("chapter gates, unreleased access, solution/document gates");
  r = await a.call("/challenges/1/hint", { level: 3 });
  assert.equal(r.body.hints.length, 3);
  assert.equal(
    (await a.call("/challenges/1/submit", { flag: "SCP{incorrect}" })).body
      .correct,
    false,
  );
  assert.equal(
    (
      await a.call(
        "/challenges/1/submit",
        { flag: answers[1] },
        { origin: "https://invalid.test" },
      )
    ).status,
    403,
  );
  pass("hints, incorrect flag and cross-origin denial");
  for (let id = 1; id <= 10; id++) {
    assert.equal((await a.call("/challenges/" + id)).status, 200);
    r = await a.call(`/challenges/${id}/submit`, { flag: answers[id] });
    assert.equal(r.status, 200);
    assert.equal(r.body.correct, true);
    assert.equal((await a.call(`/challenges/${id}/solution`)).status, 200);
    assert.equal((await a.call(`/challenges/${id}/document`)).status, 200);
    if ([4, 7, 10].includes(id))
      assert.equal(r.body.clearance, id === 4 ? 1 : id === 7 ? 2 : 3);
    pass(
      "challenge " +
        String(id).padStart(3, "0") +
        " solved and debrief/document unlocked",
    );
  }
  r = await a.call("/challenges/1/submit", { flag: answers[1] });
  assert.equal(r.body.duplicate, true);
  const me = (await a.call("/me")).body;
  assert.equal(me.score, 2250);
  assert.equal(me.clearance, 3);
  assert.equal(me.documents.length, 10);
  assert.match(me.ending, /ACT 1 COMPLETE/);
  pass("duplicate prevention, 2250 points, level 3, ACT I ending");
  let beta = (await b.call("/me")).body;
  assert.equal(beta.score, 0);
  assert.equal(beta.documents.length, 0);
  assert.equal((await b.call("/challenges/1/solution")).status, 403);
  pass("cross-user progress and debrief isolation");
  const ranks = (await a.call("/rankings")).body.rankings;
  const rank = ranks.find((r) => r.codename === names[0]);
  assert.equal(Number(rank.score), 2250);
  assert.ok(!JSON.stringify(ranks).includes("user_id"));
  pass("production rankings");
  await a.call("/auth/logout", {});
  assert.equal((await a.call("/me")).status, 401);
  assert.equal(
    (await a.call("/auth/login", { codename: names[0], password })).status,
    200,
  );
  assert.equal((await a.call("/me")).body.score, 2250);
  pass("logout, login and persistent progress");
  const burst = await Promise.all(
    Array.from({ length: 21 }, () =>
      a.call("/challenges/1/submit", { flag: answers[1] }),
    ),
  );
  assert.ok(burst.some((x) => x.status === 429));
  pass("durable production flag submission limit");
  await a.call("/auth/logout", {});
  await b.call("/auth/logout", {});
  const report = {
    timestamp: new Date().toISOString(),
    base,
    checks,
    cleanupCodenames: names,
  };
  writeFileSync(".local/live-results.json", JSON.stringify(report, null, 2));
  console.log(
    "LIVE TEST COMPLETE:",
    checks.length,
    "checks. Synthetic accounts listed in ignored .local/live-results.json for cleanup.",
  );
} catch (e) {
  writeFileSync(
    ".local/live-results.json",
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        base,
        checks,
        cleanupCodenames: names,
        error: e.message,
      },
      null,
      2,
    ),
  );
  console.error("LIVE TEST FAILED:", e.message);
  process.exitCode = 1;
} finally {
  lab?.kill();
}
