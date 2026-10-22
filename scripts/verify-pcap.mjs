import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { solveFixtures } from "../tests/solve-fixtures.mjs";
const exe = process.env.TSHARK || "C:/Program Files/Wireshark/tshark.exe";
const file = "public/evidence/009/last-contact.pcap";
const http = execFileSync(
  exe,
  ["-r", file, "-Y", "http", "-T", "fields", "-e", "http.request.uri"],
  { encoding: "utf8" },
);
assert.ok(http.includes("/health"));
assert.ok(http.includes("/research/079"));
const stream = execFileSync(exe, ["-r", file, "-q", "-z", "follow,tcp,raw,0"], {
  encoding: "utf8",
});
const reconstructed = Buffer.from(
  stream
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /^[a-f0-9]+$/i.test(s))
    .join(""),
  "hex",
).toString();
assert.ok(reconstructed.includes(solveFixtures()[9]));
console.log(
  "PASS: TShark HTTP filter recognizes normal and evidence requests; Follow TCP Stream reconstructs challenge evidence. No answers printed.",
);
