import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const blocked=files.filter(f=>/^\.env($|\.(?!example$))|^\.local\/|^\.vercel\/|\.sqlite/.test(f));
assert.deepEqual(blocked,[],'Private runtime files must not be tracked');
const tokenPatterns=[/gh[pousr]_[A-Za-z0-9]{30,}/,/sb_secret_[A-Za-z0-9_-]{20,}/,/sk-proj-[A-Za-z0-9_-]{20,}/,/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/];
for(const f of files){if(/\.(png|pcap)$/.test(f))continue;const text=readFileSync(f,'utf8');assert.ok(!tokenPatterns.some(p=>p.test(text)),`Credential pattern found in ${f}`);}
function walk(path){return readdirSync(path).flatMap(name=>{const p=path+'/'+name;return statSync(p).isDirectory()?walk(p):[p];});}
const built=walk('dist');assert.ok(!built.some(p=>/WALKTHROUGH|verifiers|\.env|answers\.json/.test(p)));for(const f of built.filter(f=>f.endsWith('.js'))){const text=readFileSync(f,'utf8');assert.ok(!text.includes('password_hash'));assert.ok(!text.includes('timingSafeEqual'));assert.ok(!text.includes('SUPABASE_SERVICE_ROLE_KEY'));}
console.log(`PASS: ${files.length} tracked files scanned; no private runtime files or credential patterns; built client excludes server verification/authentication code.`);
