-- Dedicated application schema. Existing schemas, Auth users and Storage are untouched.
create schema scp_game;
revoke all on schema scp_game from public, anon, authenticated;
grant usage on schema scp_game to service_role;
create table scp_game.users (id uuid primary key, codename text unique not null check(codename ~ '^[a-z0-9_-]{3,24}$'), password_hash text not null, created_at timestamptz not null default now());
create table scp_game.chapters (id integer primary key, act_id integer not null, title text not null, required_clearance integer not null, release_status text not null check(release_status in ('released','planned')));
create table scp_game.challenges (id integer primary key, chapter_id integer not null references scp_game.chapters(id), title text not null, points integer not null check(points>0), difficulty integer not null check(difficulty between 1 and 10), release_status text not null check(release_status in ('released','planned')));
create table scp_game.sessions (token_hash text primary key, user_id uuid not null references scp_game.users(id) on delete cascade, expires_at timestamptz not null);
create index sessions_user_idx on scp_game.sessions(user_id);
create index sessions_expiry_idx on scp_game.sessions(expires_at);
create table scp_game.progress (user_id uuid not null references scp_game.users(id) on delete cascade, challenge_id integer not null references scp_game.challenges(id), solved_at timestamptz not null default now(), primary key(user_id,challenge_id));
create index progress_challenge_idx on scp_game.progress(challenge_id);
create table scp_game.submissions (id uuid primary key, user_id uuid not null references scp_game.users(id) on delete cascade, challenge_id integer not null references scp_game.challenges(id), is_correct boolean not null, submitted_at timestamptz not null default now());
create index submissions_user_idx on scp_game.submissions(user_id,submitted_at);
create index submissions_challenge_idx on scp_game.submissions(challenge_id);
create table scp_game.hints (user_id uuid not null references scp_game.users(id) on delete cascade, challenge_id integer not null references scp_game.challenges(id), level integer not null check(level between 1 and 3), primary key(user_id,challenge_id,level));
create index hints_challenge_idx on scp_game.hints(challenge_id);
create table scp_game.rate_buckets (key text primary key, count integer not null, expires_at timestamptz not null);
create index rate_expiry_idx on scp_game.rate_buckets(expires_at);
alter table scp_game.users enable row level security;
alter table scp_game.chapters enable row level security;
alter table scp_game.challenges enable row level security;
alter table scp_game.sessions enable row level security;
alter table scp_game.progress enable row level security;
alter table scp_game.submissions enable row level security;
alter table scp_game.hints enable row level security;
alter table scp_game.rate_buckets enable row level security;
revoke all on all tables in schema scp_game from public, anon, authenticated;
grant select,insert,update,delete on all tables in schema scp_game to service_role;
-- No end-user policies: only the fixed-path server repository accesses these tables.
create function scp_game.consume_rate(bucket_key text,max_count integer,window_seconds integer) returns boolean language plpgsql security invoker set search_path='' as $$
declare current_count integer;
begin
  if max_count<1 or window_seconds<1 or window_seconds>86400 then return false; end if;
  insert into scp_game.rate_buckets(key,count,expires_at) values(bucket_key,1,now()+make_interval(secs=>window_seconds))
  on conflict(key) do update set count=case when scp_game.rate_buckets.expires_at<=now() then 1 else scp_game.rate_buckets.count+1 end, expires_at=case when scp_game.rate_buckets.expires_at<=now() then excluded.expires_at else scp_game.rate_buckets.expires_at end
  returning count into current_count;
  return current_count<=max_count;
end; $$;
create function scp_game.rankings() returns table(codename text,score bigint,solved bigint,last_solved timestamptz) language sql stable security invoker set search_path='' as $$
  select u.codename,coalesce(sum(c.points),0)::bigint,count(p.challenge_id),max(p.solved_at)
  from scp_game.users u left join scp_game.progress p on p.user_id=u.id left join scp_game.challenges c on c.id=p.challenge_id and c.release_status='released'
  group by u.id order by coalesce(sum(c.points),0) desc,max(p.solved_at) asc nulls last,u.codename asc limit 50;
$$;
revoke all on all functions in schema scp_game from public,anon,authenticated;
grant execute on all functions in schema scp_game to service_role;
insert into scp_game.chapters values (1,1,'비상 통제실',0,'released'),(2,1,'SCP-173 격리 구역',1,'released'),(3,1,'SCP-049 연구 기록실',2,'released');
insert into scp_game.challenges values
(1,1,'숨겨진 경고',100,1,'released'),(2,1,'삭제된 관리자 메모',100,1,'released'),(3,1,'인코딩된 통신',150,1,'released'),(4,1,'통제실 인증 기록',150,2,'released'),
(5,2,'사라진 CCTV 기록',200,2,'released'),(6,2,'제한된 연구원 페이지',250,2,'released'),(7,2,'조작된 감시 로그',250,3,'released'),
(8,3,'암호화된 연구일지',300,2,'released'),(9,3,'마지막 네트워크 통신',350,3,'released'),(10,3,'검열된 연구 보고서',400,3,'released');
-- Preserve all previously exposed schemas; append only this app's schema.
do $$ declare v text; begin
  select split_part(setting,'=',2) into v from pg_roles r cross join lateral unnest(r.rolconfig) setting where r.rolname='authenticator' and setting like 'pgrst.db_schemas=%';
  if v is null then raise exception 'Inspect Data API exposure settings before applying schema'; end if;
  if not ('scp_game'=any(string_to_array(v,','))) then execute format('alter role authenticator set pgrst.db_schemas = %L',v||',scp_game'); end if;
end $$;
notify pgrst,'reload config';
notify pgrst,'reload schema';
