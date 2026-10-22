import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { evidencePage } from "./evidence-page.mjs";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { challenges } from "../backend/catalog.mjs";
const root = new URL("../", import.meta.url);
function write(path, data) {
  const url = new URL(path, root);
  mkdirSync(new URL("./", url), { recursive: true });
  writeFileSync(url, data);
}
const privatePath = new URL(".local/answers.json", root);
if (
  existsSync(new URL("backend/verifiers.json", root)) &&
  !existsSync(privatePath)
)
  throw new Error(
    "Existing verifiers found. Do not regenerate a published challenge set without the private answers backup.",
  );
const flags = existsSync(privatePath)
  ? JSON.parse(readFileSync(privatePath, "utf8"))
  : Object.fromEntries(
      challenges.map((c) => [c.id, `SCP{${randomBytes(12).toString("hex")}}`]),
    );
flags[4] = "SCP{maintenance_031658}";
flags[7] = "SCP{warden_DISABLE_CCTV_031721}";
flags[10] = "SCP{PROJECT_BLACK_VEIL_11}";
write(".local/answers.json", JSON.stringify(flags, null, 2));
write(
  "backend/verifiers.json",
  JSON.stringify(
    Object.fromEntries(
      Object.entries(flags).map(([id, f]) => [
        id,
        createHash("sha256").update(f).digest("hex"),
      ]),
    ),
    null,
    2,
  ),
);
const base = "public/evidence/";
const page = evidencePage;
write(
  base + "001/control.html",
  page(
    "EMERGENCY CONSOLE",
    `<p>03:17 / 비상 통제망 응답 없음</p><p>관제실 인원에게 알림. 중앙 통제는 OFFLINE 상태로 전환되었다. 단말에 표시된 마지막 경고는 손상되어 판독할 수 없다.</p><p>화면에 남아 있지 않은 수신 내용은 이 단말의 원본 기록에 보존한다. 외부 연결을 복구하기 전까지 기록을 폐기하지 말 것.</p><!-- incident-marker: ${flags[1]} -->`,
  ),
);
write(
  base + "002/memo.html",
  page(
    "DELETED MEMO",
    '<p>수신: 야간 근무 관리자 / 전달 경로: 관제실 단말</p><p>기록 삭제 명령 이후 메모 본문이 소실되었다. 복구 모듈 상태: LOADED. 남은 조각은 원래 순서와 다르게 보관되어 있다.</p><p>인수인계 담당자는 복구 모듈의 원본을 확인하여 전달 내용을 복원할 것. 이 용지에는 복원된 본문을 재출력하지 않는다.</p><script src="memo.js"></script>',
  ),
);
const parts = [flags[2].slice(0, 8), flags[2].slice(8, 19), flags[2].slice(19)];
write(
  base + "002/memo.js",
  `// Client-side memo recovery module\nconst fragments = ${JSON.stringify([parts[2], parts[0], parts[1]])};\nconst order = [1, 2, 0];\nfunction restoreMemo() { return order.map(i => fragments[i]).join(''); }\n// Operator must inspect this source to recover the deleted memo.\n`,
);
write(
  base + "003/transmission.txt",
  `SITE-17 COMMUNICATION / 2026-10-22 KST\ncodec=base64\npayload=${Buffer.from("격리 실패는 사고가 아니다.\n" + flags[3]).toString("base64")}\n`,
);
write(
  base + "004/auth.log",
  "2026-10-22T03:14:02+09:00 user=researcher result=SUCCESS source=terminal-A\n2026-10-22T03:16:20+09:00 user=maintenance result=FAIL source=terminal-X\n2026-10-22T03:16:39+09:00 user=maintenance result=FAIL source=terminal-X\n2026-10-22T03:16:58+09:00 user=maintenance result=SUCCESS source=terminal-X\n2026-10-22T03:17:05+09:00 user=researcher result=LOGOUT source=terminal-A\n",
);
function crc32(b) {
  let c = 0xffffffff;
  for (const v of b) {
    c ^= v;
    for (let n = 0; n < 8; n++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type),
    len = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
const w = 1280, h = 720, ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
const pixels = await sharp(fileURLToPath(new URL("public/images/story/cctv-173-source.png", root))).resize(w,h).removeAlpha().raw().toBuffer();
const raw = Buffer.alloc((w * 3 + 1) * h);
for (let y = 0; y < h; y++) pixels.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);

write(
  base + "005/cctv.png",
  Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", ihdr),
    chunk("tEXt", Buffer.from("IncidentComment\0" + flags[5])),
    chunk(
      "tEXt",
      Buffer.from(
        "Description\0SCP-173 / synthetic CCTV frame / no third-party sculpture image",
      ),
    ),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]),
);
write(
  "challenges/idor/fixture.json",
  JSON.stringify(
    {
      100: {
        title: "연구원 일반 보고서",
        body: "격리 구역 점검 완료. 비공개 보고서는 인접한 ID로 보관된다.",
      },
      101: {
        title: "비공개 / 감시 비활성화 승인",
        body: "실습 데이터: 소유권 검사 누락. " + flags[6],
      },
    },
    null,
    2,
  ),
);
write(
  base + "007/timeline.txt",
  "ALL TIMES KST (UTC+09:00)\n[CCTV]\n03:16:00 camera=173 state=ONLINE\n03:17:21 camera=173 state=OFFLINE reason=maintenance\n03:18:02 camera=173 state=NO_SIGNAL\n[ACCESS CONTROL]\n03:16:00 actor=guard command=OPEN_DOOR\n03:17:21 actor=warden command=DISABLE_CCTV\n03:17:34 actor=warden command=PURGE_CENTRAL_LOG\n",
);
write(
  base + "008/journal.txt",
  "RESEARCH JOURNAL / single-byte XOR / hex\n" +
    Buffer.from(
      [
        ...Buffer.from(
          "SCP-079 restriction change requested. Evidence: " + flags[8],
        ),
      ].map((b) => b ^ 0x37),
    ).toString("hex") +
    "\n",
);
function sum(b) {
  let s = 0;
  for (let i = 0; i < b.length; i += 2) s += (b[i] << 8) + (b[i + 1] || 0);
  while (s >>> 16) s = (s & 65535) + (s >>> 16);
  return ~s & 65535;
}
const frames = [];
let seqA = 1000,
  seqB = 5000,
  ipid = 1;
function tcp(payload, reverse = false, bits = 0x18, seqOverride, ackOverride) {
  const data = Buffer.from(payload),
    src = Buffer.from(reverse ? [192, 0, 2, 79] : [192, 0, 2, 17]),
    dst = Buffer.from(reverse ? [192, 0, 2, 17] : [192, 0, 2, 79]);
  const t = Buffer.alloc(20);
  t.writeUInt16BE(reverse ? 80 : 49170, 0);
  t.writeUInt16BE(reverse ? 49170 : 80, 2);
  t.writeUInt32BE(seqOverride ?? (reverse ? seqB : seqA), 4);
  t.writeUInt32BE(ackOverride ?? (reverse ? seqA : seqB), 8);
  t[12] = 0x50;
  t[13] = bits;
  t.writeUInt16BE(64240, 14);
  const pseudo = Buffer.concat([
    src,
    dst,
    Buffer.from([0, 6]),
    Buffer.from([(20 + data.length) >> 8, (20 + data.length) & 255]),
  ]);
  t.writeUInt16BE(sum(Buffer.concat([pseudo, t, data])), 16);
  const ip = Buffer.alloc(20);
  ip[0] = 0x45;
  ip.writeUInt16BE(40 + data.length, 2);
  ip.writeUInt16BE(ipid++, 4);
  ip[8] = 64;
  ip[9] = 6;
  src.copy(ip, 12);
  dst.copy(ip, 16);
  ip.writeUInt16BE(sum(ip), 10);
  const eth = Buffer.from("0200000000790200000000170800", "hex");
  frames.push(Buffer.concat([eth, ip, t, data]));
  if (reverse) seqB += data.length + (bits & 2 ? 1 : 0);
  else seqA += data.length + (bits & 2 ? 1 : 0);
}
tcp("", false, 2, 1000, 0);
tcp("", true, 0x12);
tcp("", false, 0x10);
tcp("GET /health HTTP/1.1\r\nHost: site17.test\r\n\r\n");
tcp("HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK", true);
tcp("GET /research/079 HTTP/1.1\r\nHost: site17.test\r\n\r\n");
const body =
  "PROJECT BLACK VEIL\nSCP-079 restriction removed 11 minutes before breach.\n" +
  flags[9] +
  "\n";
const response =
  "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: " +
  Buffer.byteLength(body) +
  "\r\n\r\n" +
  body;
const split = response.indexOf("SCP{") + 6;
tcp(response.slice(0, split), true);
tcp(response.slice(split), true);
tcp("", false, 0x10);
const header = Buffer.alloc(24);
header.writeUInt32LE(0xa1b2c3d4);
header.writeUInt16LE(2, 4);
header.writeUInt16LE(4, 6);
header.writeUInt32LE(65535, 16);
header.writeUInt32LE(1, 20);
write(
  base + "009/last-contact.pcap",
  Buffer.concat([
    header,
    ...frames.flatMap((f, i) => {
      const p = Buffer.alloc(16);
      p.writeUInt32LE(1792605960 + i, 0);
      p.writeUInt32LE(f.length, 8);
      p.writeUInt32LE(f.length, 12);
      return [p, f];
    }),
  ]),
);
write(
  base + "010/report.html",
  page(
    "검열된 연구 보고서",
    '<p>문서 등급: LEVEL 2 / O5 승인 필요</p><p>프로젝트: <span class="redacted">PROJECT BLACK VEIL</span></p><p>관련 개체: SCP-079. 승인자: [데이터 삭제됨]</p><!-- analyst-note: 제출 규칙 SCP{프로젝트명_사건전시간(분)}. 프로젝트명의 공백은 밑줄. 시간은 네트워크 증거(009)와 대조할 것. -->',
    "<style>.redacted{background:#cbd5e1;color:transparent;user-select:none}</style>",
  ),
);
write(
  "public/evidence/README.txt",
  "SCP: CONTAINMENT BREACH — fictional training artifacts. Only ACT I / 001-010 implemented. No real credentials or personal records.",
);
console.log(
  "Generated 10 challenge fixtures. Private answers retained in ignored .local/.",
);
