import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { acts, chapters, challenges, progressOf, ending } from "./catalog.mjs";
import verifiers from "./verifiers.json" with { type: "json" };
const hash = (text) => createHash("sha256").update(text).digest("hex");
const cookieName = "__Host-scp_session";
const dummyHash = bcrypt.hashSync("not-a-user-password", 10);
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, text) => {
  throw new HttpError(status, text);
};
export function createHandler(
  repo,
  { origin = "http://localhost:5173", secure = true } = {},
) {
  const sessionName = secure ? cookieName : "scp_session";
  return async function handle(request) {
    let headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
    };
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers });
    try {
      const url = new URL(request.url),
        path =
          url.pathname
            .replace(/^\/(?:functions\/v1\/)?scp-game-api/, "")
            .replace(/^\/api/, "") || "/";
      const method = request.method;
      if (!["GET", "POST"].includes(method))
        fail(405, "지원하지 않는 요청입니다.");
      if (method === "POST") {
        if (request.headers.get("origin") !== origin)
          fail(403, "요청 출처를 확인할 수 없습니다.");
        if (
          !(request.headers.get("content-type") || "").startsWith(
            "application/json",
          )
        )
          fail(415, "JSON 요청이 필요합니다.");
      }
      const readBody = async () => {
        const raw = await request.text();
        if (raw.length > 4096) fail(413, "요청이 너무 큽니다.");
        try {
          const b = JSON.parse(raw);
          if (!b || Array.isArray(b) || typeof b !== "object")
            fail(400, "잘못된 입력입니다.");
          return b;
        } catch {
          fail(400, "잘못된 JSON입니다.");
        }
      };
      const allowed = async (key, limit, seconds) => {
        if (!(await repo.rate(key, limit, seconds))) {
          headers["Retry-After"] = String(seconds);
          fail(429, "요청이 많습니다. 잠시 후 다시 시도하세요.");
        }
      };
      if (path === "/health" && method === "GET")
        return json({
          status: "ok",
          version: "1.0.0",
          implementedChallenges: 10,
        });
      if (path === "/catalog" && method === "GET")
        return json({
          chapters,
          acts,
          challenges: challenges.map(
            ({ hints, explanation, document, ...c }) => ({
              ...c,
              hintCount: hints.length,
            }),
          ),
        });
      if (path === "/rankings" && method === "GET")
        return json({ rankings: await repo.rankings() });
      if (
        ["/auth/register", "/auth/login"].includes(path) &&
        method === "POST"
      ) {
        const b = await readBody(),
          codename =
            typeof b.codename === "string"
              ? b.codename.trim().toLowerCase()
              : "";
        if (
          !/^[a-z0-9_-]{3,24}$/.test(codename) ||
          typeof b.password !== "string" ||
          b.password.length < 10 ||
          Buffer.byteLength(b.password) > 72
        )
          fail(
            400,
            "코드명은 영문·숫자·_- 3–24자, 비밀번호는 10자 이상 72바이트 이하입니다.",
          );
        // Codename limiter is durable and cannot be bypassed by forging an IP header.
        await allowed("auth:" + hash(codename), 10, 300);
        const users = await repo.select("users", { codename });
        let user = users[0];
        if (path === "/auth/register") {
          await allowed("register:global", 100, 3600);
          if (user) fail(409, "사용할 수 없는 코드명입니다.");
          const password_hash = await bcrypt.hash(b.password, 12);
          try {
            [user] = await repo.insert("users", {
              id: crypto.randomUUID(),
              codename,
              password_hash,
              created_at: new Date().toISOString(),
            });
          } catch (e) {
            if (e.code === "23505") fail(409, "사용할 수 없는 코드명입니다.");
            throw e;
          }
        } else if (
          !(await bcrypt.compare(
            b.password,
            user?.password_hash || dummyHash,
          )) ||
          !user
        )
          fail(401, "코드명 또는 비밀번호를 확인하세요.");
        const token = randomBytes(32).toString("hex");
        await repo.insert("sessions", {
          token_hash: hash(token),
          user_id: user.id,
          expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        });
        headers["Set-Cookie"] =
          `${sessionName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secure ? "; Secure" : ""}`;
        return json(
          { user: { codename: user.codename } },
          path.endsWith("register") ? 201 : 200,
        );
      }
      const token = (request.headers.get("cookie") || "")
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith(sessionName + "="))
        ?.slice(sessionName.length + 1);
      if (!token || !/^[a-f0-9]{64}$/.test(token))
        fail(401, "요원 로그인이 필요합니다.");
      const [session] = await repo.select("sessions", {
        token_hash: hash(token),
      });
      if (!session || new Date(session.expires_at).getTime() <= Date.now())
        fail(401, "세션이 만료되었습니다. 다시 로그인하세요.");
      const [user] = await repo.select("users", { id: session.user_id });
      if (!user) fail(401, "등록되지 않은 요원입니다.");
      if (path === "/auth/logout" && method === "POST") {
        await repo.remove("sessions", { token_hash: hash(token) });
        headers["Set-Cookie"] =
          `${sessionName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;
        return json({ ok: true });
      }
      const solvedRows = await repo.select("progress", { user_id: user.id }),
        progress = progressOf(solvedRows);
      if (path === "/me" && method === "GET")
        return json({
          user: { codename: user.codename, createdAt: user.created_at },
          ...progress,
          hints: await repo
            .select("hints", { user_id: user.id })
            .then((rows) =>
              rows.map(({ challenge_id, level }) => ({
                challengeId: challenge_id,
                level,
              })),
            ),
          documents: challenges
            .filter((c) => progress.solved.includes(c.id))
            .map((c) => c.document),
          ending: progress.completed ? ending : null,
        });
      const match = path.match(
        /^\/challenges\/(\d+)(?:\/(submit|hint|solution|document))?$/,
      );
      if (!match) fail(404, "존재하지 않는 경로입니다.");
      const id = Number(match[1]),
        action = match[2],
        c = challenges.find(
          (c) => c.id === id && c.releaseStatus === "released",
        );
      if (!c) fail(404, "공개되지 않은 임무입니다.");
      const chapter = chapters.find((ch) => ch.id === c.chapterId);
      if (progress.clearance < chapter.requiredClearance)
        fail(403, "이전 챕터를 완료해 보안 인가를 획득하세요.");
      if (!action && method === "GET") {
        const { hints, explanation, document, ...publicChallenge } = c;
        return json({
          challenge: publicChallenge,
          solved: progress.solved.includes(id),
        });
      }
      if (["solution", "document"].includes(action) && method === "GET") {
        if (!progress.solved.includes(id))
          fail(403, "임무 완료 후 공개됩니다.");
        return json(
          action === "solution"
            ? { explanation: c.explanation }
            : { document: c.document },
        );
      }
      if (action === "hint" && method === "POST") {
        const b = await readBody();
        if (!Number.isInteger(b.level) || b.level < 1 || b.level > 3)
          fail(400, "힌트 단계는 1–3입니다.");
        await allowed("hint:" + user.id, 30, 60);
        await repo.insert(
          "hints",
          { user_id: user.id, challenge_id: id, level: b.level },
          true,
        );
        return json({ level: b.level, hints: c.hints.slice(0, b.level) });
      }
      if (action === "submit" && method === "POST") {
        const b = await readBody();
        if (
          typeof b.flag !== "string" ||
          !/^SCP\{[^\r\n]{1,200}\}$/.test(b.flag.trim())
        )
          fail(400, "SCP{...} 형식으로 제출하세요.");
        await allowed("submit:" + user.id, 20, 60);
        const actual = Buffer.from(hash(b.flag.trim()), "hex"),
          expected = Buffer.from(verifiers[id], "hex"),
          correct = timingSafeEqual(actual, expected);
        await repo.insert("submissions", {
          id: crypto.randomUUID(),
          user_id: user.id,
          challenge_id: id,
          is_correct: correct,
          submitted_at: new Date().toISOString(),
        });
        if (!correct)
          return json({
            correct: false,
            message: "증거가 일치하지 않습니다. 분석 결과를 다시 확인하세요.",
          });
        const inserted = await repo.insert(
          "progress",
          {
            user_id: user.id,
            challenge_id: id,
            solved_at: new Date().toISOString(),
          },
          true,
        );
        const updated = progressOf(
          await repo.select("progress", { user_id: user.id }),
        );
        return json({
          correct: true,
          duplicate: inserted.length === 0,
          message: inserted.length
            ? "증거 검증 완료. 기밀문서가 해금되었습니다."
            : "이미 해결한 임무입니다. 점수는 한 번만 반영됩니다.",
          ...updated,
          ending: updated.completed ? ending : null,
        });
      }
      fail(405, "지원하지 않는 요청입니다.");
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error("SCP API error", e.code || e.name);
      return json(
        { error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도하세요." },
        503,
      );
    }
  };
}
