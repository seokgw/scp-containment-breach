alter table scp_game.users add column role text not null default 'agent' check(role in ('agent','admin'));
create or replace function scp_game.rankings() returns table(codename text,score bigint,solved bigint,last_solved timestamptz) language sql stable security invoker set search_path='' as $$
select u.codename,coalesce(sum(c.points),0)::bigint,count(p.challenge_id),max(p.solved_at)
from scp_game.users u left join scp_game.progress p on p.user_id=u.id left join scp_game.challenges c on c.id=p.challenge_id and c.release_status='released'
where u.role='agent'
group by u.id order by coalesce(sum(c.points),0) desc,max(p.solved_at) asc nulls last,u.codename asc limit 50;
$$;
notify pgrst,'reload schema';
