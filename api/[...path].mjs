export default async function proxy(req, res) {
  const endpoint = process.env.SCP_BACKEND_URL;
  if (!endpoint) {
    res.status(503).json({ error: "백엔드 연결을 구성해야 합니다." });
    return;
  }
  const incoming = new URL(
    req.url,
    "https://scp-containment-breach.vercel.app",
  );
  const path = incoming.pathname.replace(/^\/api/, "");
  const headers = { "Content-Type": "application/json" };
  for (const name of ["cookie", "origin"])
    if (req.headers[name]) headers[name] = req.headers[name];
  try {
    const response = await fetch(endpoint + path, {
      method: req.method,
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(25000),
      ...(!["GET", "HEAD"].includes(req.method)
        ? { body: JSON.stringify(req.body || {}) }
        : {}),
    });
    for (const name of [
      "content-type",
      "set-cookie",
      "cache-control",
      "retry-after",
      "x-content-type-options",
    ]) {
      const value = response.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  } catch {
    res
      .status(503)
      .json({
        error: "조사 시스템에 연결하지 못했습니다. 잠시 후 다시 시도하세요.",
      });
  }
}
