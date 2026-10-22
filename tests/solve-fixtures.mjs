import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const read = (p) =>
  readFileSync(new URL("../public/evidence/" + p, import.meta.url));
const extract = (text) => {
  const match = String(text).match(/SCP\{[^}\r\n]+\}/);
  assert.ok(match, "Artifact must contain recoverable evidence");
  return match[0];
};
export function solveFixtures() {
  const answers = {};
  answers[1] = extract(
    read("001/control.html")
      .toString()
      .match(/<!--([\s\S]*?)-->/)[1],
  );
  answers[2] = vm.runInNewContext(
    read("002/memo.js").toString() + "\nrestoreMemo()",
    {},
    { timeout: 1000 },
  );
  answers[3] = extract(
    Buffer.from(
      read("003/transmission.txt").toString().split("payload=")[1].trim(),
      "base64",
    ).toString(),
  );
  const events = read("004/auth.log").toString().trim().split("\n");
  const failures = events
    .filter((s) => s.includes("result=FAIL"))
    .map((s) => s.match(/user=(\S+)/)[1]);
  const auth = events.find(
    (s) =>
      s.includes("result=SUCCESS") &&
      failures.includes(s.match(/user=(\S+)/)[1]),
  );
  answers[4] = `SCP{${auth.match(/user=(\S+)/)[1]}_${auth
    .match(/T(\d\d):(\d\d):(\d\d)/)
    .slice(1)
    .join("")}}`;
  const png = read("005/cctv.png");
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  let pos = 8;
  while (pos < png.length) {
    const size = png.readUInt32BE(pos),
      type = png.subarray(pos + 4, pos + 8).toString(),
      data = png.subarray(pos + 8, pos + 8 + size);
    if (type === "tEXt" && data.toString().startsWith("IncidentComment\0"))
      answers[5] = extract(data.toString());
    pos += size + 12;
  }
  const logs = read("007/timeline.txt").toString();
  const time = logs.match(/(\d\d:\d\d:\d\d) camera=173 state=OFFLINE/)[1];
  const command = logs
    .split("\n")
    .find((s) => s.startsWith(time) && s.includes("actor="));
  answers[7] = `SCP{${command.match(/actor=(\S+)/)[1]}_${command.match(/command=(\S+)/)[1]}_${time.replaceAll(":", "")}}`;
  const cipher = Buffer.from(
    read("008/journal.txt").toString().trim().split("\n")[1],
    "hex",
  );
  for (let k = 0; k < 256; k++) {
    const plain = Buffer.from([...cipher].map((b) => b ^ k)).toString();
    if (plain.includes("SCP{")) answers[8] = extract(plain);
  }
  const pcap = read("009/last-contact.pcap");
  assert.equal(pcap.readUInt32LE(0), 0xa1b2c3d4);
  assert.equal(pcap.readUInt32LE(20), 1);
  let offset = 24;
  const serverPayload = [];
  let packets = 0;
  while (offset < pcap.length) {
    const len = pcap.readUInt32LE(offset + 8);
    const f = pcap.subarray(offset + 16, offset + 16 + len);
    assert.equal(f.length, len);
    assert.equal(f.readUInt16BE(12), 0x0800);
    const ip = 14,
      ihl = (f[ip] & 15) * 4,
      tcp = ip + ihl,
      thl = (f[tcp + 12] >> 4) * 4;
    assert.equal(f[ip + 9], 6);
    if (f.readUInt16BE(tcp) === 80 && len > tcp + thl)
      serverPayload.push({
        seq: f.readUInt32BE(tcp + 4),
        data: f.subarray(tcp + thl),
      });
    offset += 16 + len;
    packets++;
  }
  assert.ok(
    packets >= 8,
    "PCAP contains handshake, normal traffic and HTTP evidence",
  );
  const stream = Buffer.concat(
    serverPayload.sort((a, b) => a.seq - b.seq).map((p) => p.data),
  ).toString();
  assert.ok(stream.includes("HTTP/1.1 200 OK"));
  answers[9] = extract(stream);
  const report = read("010/report.html").toString();
  const project = report.match(/class="redacted">([^<]+)/)[1];
  const minutes = stream.match(/(\d+) minutes before breach/)[1];
  answers[10] = `SCP{${project.replaceAll(" ", "_")}_${minutes}}`;
  return answers;
}
export async function solveIdor(base) {
  const normal = await fetch(base + "/report?id=100").then((r) => r.text());
  assert.ok(!normal.includes("SCP{"));
  const hidden = await fetch(base + "/report?id=101").then((r) => r.text());
  return extract(hidden);
}
