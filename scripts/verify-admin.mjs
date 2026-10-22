import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const base='https://scp-containment-breach.vercel.app',credentials=JSON.parse(readFileSync('.local/admin-credentials.json','utf8'));let cookie='';
async function call(path,body){const r=await fetch(base+'/api'+path,{method:body?'POST':'GET',headers:{origin:base,cookie,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const c=r.headers.getSetCookie().find(c=>c.startsWith('__Host-scp_session='));if(c)cookie=c.split(';')[0];return {status:r.status,body:await r.json()};}
try {
 assert.equal((await call('/admin/overview')).status,401);
 assert.equal((await call('/auth/login',credentials)).status,200);
 const me=(await call('/me')).body;assert.equal(me.user.role,'admin');assert.equal(me.accessClearance,3);assert.equal(me.score,0);assert.equal(me.solved.length,0);assert.equal(me.documents.length,10);assert.ok(me.ending);
 assert.equal((await call('/admin/overview')).status,200);
 let checked=0;
 for(let id=1;id<=10;id++){await Promise.all(['','/solution','/document'].map(async suffix=>{assert.equal((await call(`/challenges/${id}${suffix}`)).status,200);checked++;}));}
 assert.equal((await call('/challenges/11')).status,404);
 assert.ok(!(await call('/rankings')).body.rankings.some(r=>r.codename===credentials.codename));
 writeFileSync('.local/admin-verification.json',JSON.stringify({status:'PASS',at:new Date().toISOString(),role:'admin',contentEndpoints:checked,documents:10,score:0,solved:0,rankingsExcluded:true,unreleasedDenied:true},null,2));
 console.log('PASS: production admin login, 30 content endpoints, 10 documents, ending, unchanged progress, rankings exclusion, unpublished denial');
}finally{if(cookie)assert.equal((await call('/auth/logout',{})).status,200);}
