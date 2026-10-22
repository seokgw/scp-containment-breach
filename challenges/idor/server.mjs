import http from "node:http";
import { readFileSync } from "node:fs";
const fixture = JSON.parse(
  readFileSync(new URL("./fixture.json", import.meta.url), "utf8"),
);
const html = (body) =>
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site-17 / Research archive</title><style>
  *{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at top right,#28362b,#090e0b 70%);color:#b7c8bb;font:15px/1.9 Consolas,monospace;min-height:100vh}header{padding:20px 6%;border-bottom:1px solid #6b7b6855;font-size:11px;letter-spacing:2px;color:#d5dfd0}main{max-width:1000px;margin:8vh auto;padding:24px}.stamp{color:#d88a73;border:1px solid #a85d4855;display:inline-block;padding:4px 12px;font-size:10px;letter-spacing:2px}.archive{border:1px solid #61745c66;background:#142017;box-shadow:0 25px 90px #0009;padding:clamp(22px,5vw,48px);position:relative;margin-top:20px;min-height:350px}.archive:before{content:'';position:absolute;top:0;left:0;height:3px;width:75px;background:#a55945}h1{font-size:clamp(24px,5vw,36px);color:#e0e7d9;line-height:1.4}a{display:inline-block;padding:10px 20px;color:#c4dbb5;border:1px solid #79936b;background:#23351e;margin-top:20px}a:hover{background:#32482a}a:focus-visible{outline:2px solid white;outline-offset:4px}.serial{font-size:10px;letter-spacing:2px;color:#78926f}footer{border-top:1px solid #67785b55;margin-top:30px;padding-top:20px;font-size:11px;color:#8d9d80}p{overflow-wrap:anywhere}.warning{color:#c69773;font-size:12px}body:after{content:'';position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(transparent 0 3px,#0002 3px 4px)}</style></head><body><header>SCP FOUNDATION / SITE-17 — RESEARCH RECORDS</header><main><span class="stamp">RESTRICTED ACCESS / LEVEL 1</span><section class="archive"><div class="serial">DOCUMENT RETRIEVAL TERMINAL · RESEARCH WING</div>${body}<footer>ARCHIVE STATUS: LOCAL MIRROR / CENTRAL NETWORK OFFLINE<br>담당 연구원의 접근 기록은 사고 조사 대상으로 보존됩니다.</footer></section><p class="warning">ISOLATED TRAINING LAB / FICTIONAL DATA ONLY — 교육용 가상 문서 조회 시스템</p></main></body></html>`;

const server = http
  .createServer((req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const url = new URL(req.url, "http://lab");
    if (url.pathname === "/")
      return res.end(
        html(
          '<h1>연구 보고서 시스템</h1><p>연구원 100으로 접속됨</p><a href="/report?id=100">내 보고서 보기</a>',
        ),
      );
    if (url.pathname === "/report") {
      const id = url.searchParams.get("id");
      const report = Object.hasOwn(fixture, id) ? fixture[id] : null;
      if (report)
        return res.end(html(`<h1>${report.title}</h1><p>${report.body}</p>`));
    }
    res.statusCode = 404;
    res.end(html("<h1>보고서 없음</h1>"));
  })
  .listen(
    Number(process.env.LAB_PORT || 8080),
    process.env.LAB_HOST || "127.0.0.1",
    () => console.log("IDOR lab http://127.0.0.1:" + server.address().port),
  );
