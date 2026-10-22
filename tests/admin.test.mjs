import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../backend/app.mjs';
import {SQLiteRepository} from '../backend/sqlite.mjs';
test('admin access is server enforced, independent of progress, excluded from rankings and revocable', async () => {
 const repo=new SQLiteRepository();
 try {
 const handler=createHandler(repo,{origin:'http://localhost:5173',secure:false});let cookie='';
 const call=async(path,body)=>{const r=await handler(new Request('http://localhost:5173/api'+path,{method:body?'POST':'GET',headers:{origin:'http://localhost:5173',cookie,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));if(r.headers.has('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,body:await r.json()};};
 await call('/auth/register',{codename:'admin_test',password:'local-test-password',role:'admin'});
 assert.equal((await call('/me')).body.user.role,'agent');
 assert.equal((await call('/admin/overview')).status,403);
 assert.equal((await call('/challenges/10')).status,403);
 repo.db.prepare("UPDATE users SET role='admin' WHERE codename='admin_test'").run();
 const me=(await call('/me')).body;
 assert.equal(me.user.role,'admin');assert.equal(me.score,0);assert.equal(me.clearance,0);assert.deepEqual(me.solved,[]);assert.equal(me.accessClearance,3);assert.equal(me.documents.length,10);assert.ok(me.ending);assert.equal(me.completed,false);
 assert.equal((await call('/admin/overview')).status,200);
 for(let id=1;id<=10;id++) for(const suffix of ['', '/solution','/document'])assert.equal((await call(`/challenges/${id}${suffix}`)).status,200);
 assert.equal((await call('/challenges/11')).status,404);
 assert.equal((await call('/rankings')).body.rankings.length,0);
 repo.db.prepare("UPDATE users SET role='agent' WHERE codename='admin_test'").run();
 assert.equal((await call('/admin/overview')).status,403);assert.equal((await call('/challenges/10')).status,403);assert.equal((await call('/challenges/1/solution')).status,403);
 } finally {repo.db.close();}
});
