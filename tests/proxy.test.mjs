import test from "node:test";
import assert from "node:assert/strict";
import proxy from "../api/gateway.mjs";
test("nested API rewrite preserves route/body/origin and only returns app session cookies", async (t) => {
  const old = process.env.SCP_BACKEND_URL;
  process.env.SCP_BACKEND_URL =
    "https://backend.example/functions/v1/scp-game-api";
  t.after(() => {
    if (old === undefined) delete process.env.SCP_BACKEND_URL;
    else process.env.SCP_BACKEND_URL = old;
  });
  let observed;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    observed = { url, options };
    return new Response('{"correct":true}', {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Set-Cookie": "__Host-scp_session=test-session; Secure; HttpOnly",
      },
    });
  });
  const headers = {},
    res = {
      statusCode: 0,
      body: null,
      setHeader(k, v) {
        headers[k] = v;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      send(body) {
        this.body = body;
      },
      json(body) {
        this.body = body;
      },
    };
  await proxy(
    {
      url: "/api/gateway?route=challenges/1/submit",
      query: { route: "challenges/1/submit" },
      method: "POST",
      headers: {
        origin: "https://scp-containment-breach.vercel.app",
        cookie: "__Host-scp_session=synthetic",
      },
      body: { flag: "SCP{synthetic}" },
    },
    res,
  );
  assert.equal(
    observed.url,
    "https://backend.example/functions/v1/scp-game-api/challenges/1/submit",
  );
  assert.equal(
    observed.options.headers.origin,
    "https://scp-containment-breach.vercel.app",
  );
  assert.equal(observed.options.headers.cookie, "__Host-scp_session=synthetic");
  assert.deepEqual(JSON.parse(observed.options.body), {
    flag: "SCP{synthetic}",
  });
  assert.equal(res.statusCode, 200);
  assert.equal(headers["cache-control"], "no-store");
  assert.equal(headers["Set-Cookie"].length, 1);
  globalThis.fetch.mock.mockImplementation(
    async () =>
      new Response("{}", {
        headers: { "Set-Cookie": "__cf_bm=unrelated-cdn-cookie; Secure" },
      }),
  );
  delete headers["Set-Cookie"];
  await proxy(
    { url: "/api/me", query: { route: "me" }, method: "GET", headers: {} },
    res,
  );
  assert.equal(headers["Set-Cookie"], undefined);
});
