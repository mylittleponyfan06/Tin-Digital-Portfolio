create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'game_slug') then
    create type public.game_slug as enum ('imposter');
  end if;

  if not exists (select 1 from pg_type where typname = 'room_status') then
    create type public.room_status as enum ('lobby', 'collecting_clues', 'voting', 'results', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'round_status') then
    create type public.round_status as enum ('collecting_clues', 'voting', 'results', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'round_winner') then
    create type public.round_winner as enum ('crew', 'imposter', 'draw');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{4,8}$'),
  game_slug public.game_slug not null default 'imposter',
  host_user_id uuid not null references auth.users(id) on delete cascade,
  status public.room_status not null default 'lobby',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Player',
  is_host boolean not null default false,
  is_ready boolean not null default false,
  has_left boolean not null default false,
  score integer not null default 0 check (score >= 0),
  joined_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (room_id, user_id)
);

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_number integer not null check (round_number > 0),
  status public.round_status not null default 'collecting_clues',
  topic text not null,
  imposter_room_player_id uuid not null references public.room_players(id) on delete cascade,
  winner public.round_winner,
  results jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  unique (room_id, round_number)
);

create table if not exists public.player_prompts (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  room_player_id uuid not null references public.room_players(id) on delete cascade,
  prompt text not null,
  is_imposter boolean not null default false,
  submitted_clue text,
  submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (round_id, room_player_id),
  check (submitted_clue is null or char_length(trim(submitted_clue)) between 1 and 120)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  voter_room_player_id uuid not null references public.room_players(id) on delete cascade,
  target_room_player_id uuid not null references public.room_players(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (round_id, voter_room_player_id),
  check (voter_room_player_id <> target_room_player_id)
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  game_slug public.game_slug not null default 'imposter',
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Player',
  wins integer not null default 0 check (wins >= 0),
  rounds_played integer not null default 0 check (rounds_played >= 0),
  crew_wins integer not null default 0 check (crew_wins >= 0),
  imposter_wins integer not null default 0 check (imposter_wins >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (game_slug, user_id)
);

create table if not exists public.imposter_topics (
  id uuid primary key default gen_random_uuid(),
  prompt text not null unique,
  category text not null default 'general',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists rooms_game_status_idx on public.rooms (game_slug, status);
create index if not exists room_players_room_idx on public.room_players (room_id, has_left);
create index if not exists rounds_room_idx on public.rounds (room_id, round_number desc);
create index if not exists player_prompts_round_idx on public.player_prompts (round_id);
create index if not exists votes_round_idx on public.votes (round_id);
create index if not exists leaderboard_game_idx on public.leaderboard_entries (game_slug, wins desc, rounds_played desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
before update on public.rooms
for each row execute procedure public.set_updated_at();

drop trigger if exists room_players_set_updated_at on public.room_players;
create trigger room_players_set_updated_at
before update on public.room_players
for each row execute procedure public.set_updated_at();

drop trigger if exists leaderboard_entries_set_updated_at on public.leaderboard_entries;
create trigger leaderboard_entries_set_updated_at
before update on public.leaderboard_entries
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Player')
  )
  on conflict (id) do update
    set display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.resolve_display_name(p_user_id uuid, p_fallback text default null)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select coalesce(nullif(trim(display_name), ''), nullif(trim(username::text), ''))
  into v_name
  from public.profiles
  where id = p_user_id;

  return coalesce(nullif(trim(p_fallback), ''), v_name, 'Player');
end;
$$;

create or replace function public.generate_room_code(p_length integer default 6)
returns text
language plpgsql
volatile
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  v_index integer;
  v_length integer := greatest(4, least(p_length, 8));
begin
  for v_index in 1..v_length loop
    v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::integer, 1);
  end loop;

  return v_code;
end;
$$;

create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_players
    where room_id = p_room_id
      and user_id = auth.uid()
      and not has_left
  );
$$;

create or replace function public.is_room_host(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms
    where id = p_room_id
      and host_user_id = auth.uid()
  );
$$;

create or replace function public.current_room_player_id(p_room_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.room_players
  where room_id = p_room_id
    and user_id = auth.uid()
    and not has_left
  limit 1;
$$;

create or replace function public.is_prompt_owner(p_room_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_players
    where id = p_room_player_id
      and user_id = auth.uid()
      and not has_left
  );
$$;

create or replace function public.create_imposter_room(p_display_name text default null)
returns table (room_id uuid, room_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_user_id uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_display_name text := nullif(trim(p_display_name), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_display_name is not null then
    insert into public.profiles (id, display_name)
    values (v_user_id, v_display_name)
    on conflict (id) do update
      set display_name = excluded.display_name;
  end if;

  loop
    v_code := public.generate_room_code(6);
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;

  insert into public.rooms (code, host_user_id, status)
  values (v_code, v_user_id, 'lobby')
  returning * into v_room;

  insert into public.room_players (room_id, user_id, display_name, is_host, is_ready)
  values (
    v_room.id,
    v_user_id,
    public.resolve_display_name(v_user_id, v_display_name),
    true,
    true
  );

  return query
  select v_room.id, v_room.code;
end;
$$;

create or replace function public.join_imposter_room(p_room_code text, p_display_name text default null)
returns table (room_id uuid, room_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_user_id uuid := auth.uid();
  v_display_name text := nullif(trim(p_display_name), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_room
  from public.rooms
  where code = upper(trim(p_room_code))
    and game_slug = 'imposter';

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.status not in ('lobby', 'results') then
    raise exception 'Room is already in progress';
  end if;

  if v_display_name is not null then
    insert into public.profiles (id, display_name)
    values (v_user_id, v_display_name)
    on conflict (id) do update
      set display_name = excluded.display_name;
  end if;

  insert into public.room_players (room_id, user_id, display_name, is_host, is_ready, has_left)
  values (
    v_room.id,
    v_user_id,
    public.resolve_display_name(v_user_id, v_display_name),
    false,
    false,
    false
  )
  on conflict (room_id, user_id) do update
    set display_name = excluded.display_name,
        has_left = false,
        is_ready = false;

  return query
  select v_room.id, v_room.code;
end;
$$;

create or replace function public.set_imposter_ready(p_room_code text, p_ready boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_member_id uuid;
begin
  select *
  into v_room
  from public.rooms
  where code = upper(trim(p_room_code))
    and game_slug = 'imposter';

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.status not in ('lobby', 'results') then
    raise exception 'Cannot change readiness after the round starts';
  end if;

  v_member_id := public.current_room_player_id(v_room.id);

  if v_member_id is null then
    raise exception 'Room membership required';
  end if;

  update public.room_players
  set is_ready = p_ready
  where id = v_member_id;

  return true;
end;
$$;

create or replace function public.start_imposter_round(p_room_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_round_id uuid;
  v_round_number integer;
  v_topic text;
  v_imposter_player_id uuid;
  v_active_count integer;
begin
  select *
  into v_room
  from public.rooms
  where code = upper(trim(p_room_code))
    and game_slug = 'imposter';

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.host_user_id <> auth.uid() then
    raise exception 'Only the host can start the round';
  end if;

  if v_room.status not in ('lobby', 'results') then
    raise exception 'Round is already active';
  end if;

  select count(*)
  into v_active_count
  from public.room_players
  where room_id = v_room.id
    and not has_left;

  if v_active_count < 3 then
    raise exception 'At least 3 players are required';
  end if;

  if exists (
    select 1
    from public.room_players
    where room_id = v_room.id
      and not has_left
      and not is_ready
  ) then
    raise exception 'All active players must be ready';
  end if;

  select prompt
  into v_topic
  from public.imposter_topics
  where is_active
  order by random()
  limit 1;

  if v_topic is null then
    raise exception 'No active topics configured';
  end if;

  select id
  into v_imposter_player_id
  from public.room_players
  where room_id = v_room.id
    and not has_left
  order by random()
  limit 1;

  select coalesce(max(round_number), 0) + 1
  into v_round_number
  from public.rounds
  where room_id = v_room.id;

  insert into public.rounds (
    room_id,
    round_number,
    status,
    topic,
    imposter_room_player_id
  )
  values (
    v_room.id,
    v_round_number,
    'collecting_clues',
    v_topic,
    v_imposter_player_id
  )
  returning id into v_round_id;

  insert into public.player_prompts (round_id, room_player_id, prompt, is_imposter)
  select
    v_round_id,
    rp.id,
    case when rp.id = v_imposter_player_id then 'You are the imposter' else v_topic end,
    rp.id = v_imposter_player_id
  from public.room_players rp
  where rp.room_id = v_room.id
    and not rp.has_left;

  update public.room_players
  set is_ready = false
  where room_id = v_room.id
    and not has_left;

  update public.rooms
  set status = 'collecting_clues'
  where id = v_room.id;

  return v_round_id::text;
end;
$$;

create or replace function public.submit_imposter_clue(p_room_code text, p_clue text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_round public.rounds%rowtype;
  v_member_id uuid;
  v_clue text := trim(p_clue);
  v_updated integer;
begin
  if char_length(v_clue) < 1 or char_length(v_clue) > 120 then
    raise exception 'Clue must be between 1 and 120 characters';
  end if;

  select *
  into v_room
  from public.rooms
  where code = upper(trim(p_room_code))
    and game_slug = 'imposter';

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.status <> 'collecting_clues' then
    raise exception 'Round is not collecting clues';
  end if;

  v_member_id := public.current_room_player_id(v_room.id);

  if v_member_id is null then
    raise exception 'Room membership required';
  end if;

  select *
  into v_round
  from public.rounds
  where room_id = v_room.id
  order by round_number desc
  limit 1;

  if not found or v_round.status <> 'collecting_clues' then
    raise exception 'No active clue round found';
  end if;

  update public.player_prompts
  set submitted_clue = v_clue,
      submitted_at = timezone('utc', now())
  where round_id = v_round.id
    and room_player_id = v_member_id
    and submitted_clue is null;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'Clue already submitted';
  end if;

  update public.room_players
  set updated_at = timezone('utc', now())
  where id = v_member_id;

  if not exists (
    select 1
    from public.player_prompts pp
    join public.room_players rp on rp.id = pp.room_player_id
    where pp.round_id = v_round.id
      and not rp.has_left
      and pp.submitted_clue is null
  ) then
    update public.rounds
    set status = 'voting'
    where id = v_round.id;

    update public.rooms
    set status = 'voting'
    where id = v_room.id;

    return 'voting';
  end if;

  return 'collecting_clues';
end;
$$;

create or replace function public.cast_imposter_vote(p_room_code text, p_target_room_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_round public.rounds%rowtype;
  v_member_id uuid;
  v_active_count integer;
  v_vote_count integer;
  v_tied_count integer;
  v_detected_player_id uuid;
  v_vote_counts jsonb := '[]'::jsonb;
  v_results jsonb := '{}'::jsonb;
  v_winning_team public.round_winner;
  v_player record;
begin
  select *
  into v_room
  from public.rooms
  where code = upper(trim(p_room_code))
    and game_slug = 'imposter';

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.status <> 'voting' then
    raise exception 'Round is not in voting state';
  end if;

  v_member_id := public.current_room_player_id(v_room.id);

  if v_member_id is null then
    raise exception 'Room membership required';
  end if;

  if v_member_id = p_target_room_player_id then
    raise exception 'You cannot vote for yourself';
  end if;

  if not exists (
    select 1
    from public.room_players
    where id = p_target_room_player_id
      and room_id = v_room.id
      and not has_left
  ) then
    raise exception 'Vote target is not a valid active player';
  end if;

  select *
  into v_round
  from public.rounds
  where room_id = v_room.id
  order by round_number desc
  limit 1;

  if not found or v_round.status <> 'voting' then
    raise exception 'No active voting round found';
  end if;

  begin
    insert into public.votes (round_id, voter_room_player_id, target_room_player_id)
    values (v_round.id, v_member_id, p_target_room_player_id);
  exception
    when unique_violation then
      raise exception 'Vote already submitted';
  end;

  select count(*)
  into v_active_count
  from public.room_players
  where room_id = v_room.id
    and not has_left;

  select count(*)
  into v_vote_count
  from public.votes
  where round_id = v_round.id;

  if v_vote_count < v_active_count then
    return jsonb_build_object('status', 'voting');
  end if;

  with tallies as (
    select target_room_player_id, count(*)::integer as total
    from public.votes
    where round_id = v_round.id
    group by target_room_player_id
  ),
  ranked as (
    select
      target_room_player_id,
      total,
      rank() over (order by total desc) as position
    from tallies
  )
  select
    count(*) filter (where position = 1),
    max(target_room_player_id) filter (where position = 1),
    coalesce(
      jsonb_agg(
        jsonb_build_object('targetPlayerId', target_room_player_id, 'count', total)
        order by total desc
      ),
      '[]'::jsonb
    )
  into v_tied_count, v_detected_player_id, v_vote_counts
  from ranked;

  if v_tied_count = 1 and v_detected_player_id = v_round.imposter_room_player_id then
    v_winning_team := 'crew';
  else
    v_winning_team := 'imposter';
    if v_tied_count <> 1 then
      v_detected_player_id := null;
    end if;
  end if;

  v_results := jsonb_build_object(
    'winningTeam', v_winning_team,
    'detectedPlayerId', v_detected_player_id,
    'isTie', v_tied_count <> 1,
    'voteCounts', v_vote_counts
  );

  update public.rounds
  set status = 'results',
      winner = v_winning_team,
      results = v_results,
      ended_at = timezone('utc', now())
  where id = v_round.id;

  update public.rooms
  set status = 'results'
  where id = v_room.id;

  if v_winning_team = 'crew' then
    update public.room_players
    set score = score + 1
    where room_id = v_room.id
      and not has_left
      and id <> v_round.imposter_room_player_id;
  else
    update public.room_players
    set score = score + 2
    where id = v_round.imposter_room_player_id;
  end if;

  for v_player in
    select id, user_id, display_name
    from public.room_players
    where room_id = v_room.id
      and not has_left
  loop
    insert into public.leaderboard_entries (
      game_slug,
      user_id,
      display_name,
      wins,
      rounds_played,
      crew_wins,
      imposter_wins
    )
    values (
      'imposter',
      v_player.user_id,
      v_player.display_name,
      case
        when v_winning_team = 'crew' and v_player.id <> v_round.imposter_room_player_id then 1
        when v_winning_team = 'imposter' and v_player.id = v_round.imposter_room_player_id then 1
        else 0
      end,
      1,
      case when v_winning_team = 'crew' and v_player.id <> v_round.imposter_room_player_id then 1 else 0 end,
      case when v_winning_team = 'imposter' and v_player.id = v_round.imposter_room_player_id then 1 else 0 end
    )
    on conflict (game_slug, user_id) do update
      set display_name = excluded.display_name,
          wins = public.leaderboard_entries.wins + excluded.wins,
          rounds_played = public.leaderboard_entries.rounds_played + 1,
          crew_wins = public.leaderboard_entries.crew_wins + excluded.crew_wins,
          imposter_wins = public.leaderboard_entries.imposter_wins + excluded.imposter_wins,
          updated_at = timezone('utc', now());
  end loop;

  return v_results;
end;
$$;

create or replace function public.leave_imposter_room(p_room_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_member public.room_players%rowtype;
  v_next_host public.room_players%rowtype;
  v_active_count integer;
begin
  select *
  into v_room
  from public.rooms
  where code = upper(trim(p_room_code))
    and game_slug = 'imposter';

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.status not in ('lobby', 'results') then
    raise exception 'You can only leave between rounds';
  end if;

  select *
  into v_member
  from public.room_players
  where room_id = v_room.id
    and user_id = auth.uid()
    and not has_left;

  if not found then
    raise exception 'Room membership required';
  end if;

  update public.room_players
  set has_left = true,
      is_ready = false,
      is_host = false
  where id = v_member.id;

  select count(*)
  into v_active_count
  from public.room_players
  where room_id = v_room.id
    and not has_left;

  if v_active_count = 0 then
    update public.rooms
    set status = 'closed'
    where id = v_room.id;

    return true;
  end if;

  if v_member.is_host then
    select *
    into v_next_host
    from public.room_players
    where room_id = v_room.id
      and not has_left
    order by joined_at
    limit 1;

    update public.room_players
    set is_host = (id = v_next_host.id)
    where room_id = v_room.id;

    update public.rooms
    set host_user_id = v_next_host.user_id
    where id = v_room.id;
  end if;

  if v_room.status = 'results' then
    update public.rooms
    set status = 'lobby'
    where id = v_room.id;
  end if;

  return true;
end;
$$;

create or replace function public.get_imposter_room_snapshot(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_member public.room_players%rowtype;
  v_round public.rounds%rowtype;
  v_players jsonb := '[]'::jsonb;
  v_clues jsonb := '[]'::jsonb;
  v_votes jsonb := '[]'::jsonb;
  v_private_prompt text;
begin
  select *
  into v_room
  from public.rooms
  where code = upper(trim(p_room_code))
    and game_slug = 'imposter';

  if not found then
    raise exception 'Room not found';
  end if;

  select *
  into v_member
  from public.room_players
  where room_id = v_room.id
    and user_id = auth.uid()
    and not has_left;

  if not found then
    raise exception 'Room membership required';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', rp.id,
        'userId', rp.user_id,
        'displayName', rp.display_name,
        'isHost', rp.is_host,
        'isReady', rp.is_ready,
        'score', rp.score,
        'joinedAt', rp.joined_at
      )
      order by rp.joined_at
    ),
    '[]'::jsonb
  )
  into v_players
  from public.room_players rp
  where rp.room_id = v_room.id
    and not rp.has_left;

  select *
  into v_round
  from public.rounds
  where room_id = v_room.id
  order by round_number desc
  limit 1;

  if found then
    select prompt
    into v_private_prompt
    from public.player_prompts
    where round_id = v_round.id
      and room_player_id = v_member.id;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'roomPlayerId', rp.id,
          'clue', pp.submitted_clue,
          'hasSubmitted', pp.submitted_at is not null
        )
        order by rp.joined_at
      ),
      '[]'::jsonb
    )
    into v_clues
    from public.room_players rp
    left join public.player_prompts pp
      on pp.round_id = v_round.id
     and pp.room_player_id = rp.id
    where rp.room_id = v_room.id
      and not rp.has_left;

    if v_round.status = 'results' then
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'voterPlayerId', voter_room_player_id,
            'targetPlayerId', target_room_player_id
          )
          order by created_at
        ),
        '[]'::jsonb
      )
      into v_votes
      from public.votes
      where round_id = v_round.id;
    else
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'voterPlayerId', voter_room_player_id,
            'targetPlayerId', target_room_player_id
          )
          order by created_at
        ),
        '[]'::jsonb
      )
      into v_votes
      from public.votes
      where round_id = v_round.id
        and voter_room_player_id = v_member.id;
    end if;
  end if;

  return jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'code', v_room.code,
      'status', v_room.status,
      'hostUserId', v_room.host_user_id
    ),
    'currentUserId', auth.uid(),
    'currentPlayerId', v_member.id,
    'players', v_players,
    'currentRound',
      case
        when v_round.id is null then null
        else jsonb_build_object(
          'id', v_round.id,
          'roundNumber', v_round.round_number,
          'status', v_round.status,
          'topic', case when v_round.status = 'results' then v_round.topic else null end,
          'privatePrompt', v_private_prompt,
          'clues', v_clues,
          'votes', v_votes,
          'results', coalesce(v_round.results, '{}'::jsonb),
          'imposterPlayerId', case when v_round.status = 'results' then v_round.imposter_room_player_id else null end
        )
      end
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.rounds enable row level security;
alter table public.player_prompts enable row level security;
alter table public.votes enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.imposter_topics enable row level security;

drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "room members can read rooms" on public.rooms;
create policy "room members can read rooms"
on public.rooms
for select
to authenticated
using (public.is_room_member(id));

drop policy if exists "hosts can insert rooms" on public.rooms;
create policy "hosts can insert rooms"
on public.rooms
for insert
to authenticated
with check (host_user_id = auth.uid());

drop policy if exists "hosts can update rooms" on public.rooms;
create policy "hosts can update rooms"
on public.rooms
for update
to authenticated
using (host_user_id = auth.uid())
with check (host_user_id = auth.uid());

drop policy if exists "room members can read room players" on public.room_players;
create policy "room members can read room players"
on public.room_players
for select
to authenticated
using (public.is_room_member(room_id));

drop policy if exists "users can insert themselves into room players" on public.room_players;
create policy "users can insert themselves into room players"
on public.room_players
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users or hosts can update room players" on public.room_players;
create policy "users or hosts can update room players"
on public.room_players
for update
to authenticated
using (auth.uid() = user_id or public.is_room_host(room_id))
with check (auth.uid() = user_id or public.is_room_host(room_id));

drop policy if exists "room members can read rounds" on public.rounds;
create policy "room members can read rounds"
on public.rounds
for select
to authenticated
using (public.is_room_member(room_id));

drop policy if exists "hosts can insert rounds" on public.rounds;
create policy "hosts can insert rounds"
on public.rounds
for insert
to authenticated
with check (public.is_room_host(room_id));

drop policy if exists "hosts can update rounds" on public.rounds;
create policy "hosts can update rounds"
on public.rounds
for update
to authenticated
using (public.is_room_host(room_id))
with check (public.is_room_host(room_id));

drop policy if exists "players can read their own prompts" on public.player_prompts;
create policy "players can read their own prompts"
on public.player_prompts
for select
to authenticated
using (public.is_prompt_owner(room_player_id));

drop policy if exists "players can update their own prompts" on public.player_prompts;
create policy "players can update their own prompts"
on public.player_prompts
for update
to authenticated
using (public.is_prompt_owner(room_player_id))
with check (public.is_prompt_owner(room_player_id));

drop policy if exists "room members can read votes after results or for themselves" on public.votes;
create policy "room members can read votes after results or for themselves"
on public.votes
for select
to authenticated
using (
  public.is_room_member((select room_id from public.rounds where id = round_id))
  and (
    voter_room_player_id = public.current_room_player_id((select room_id from public.rounds where id = round_id))
    or exists (
      select 1
      from public.rounds r
      where r.id = votes.round_id
        and r.status = 'results'
    )
  )
);

drop policy if exists "players can insert one vote for themselves" on public.votes;
create policy "players can insert one vote for themselves"
on public.votes
for insert
to authenticated
with check (
  voter_room_player_id = public.current_room_player_id((select room_id from public.rounds where id = round_id))
);

drop policy if exists "authenticated users can read leaderboard" on public.leaderboard_entries;
create policy "authenticated users can read leaderboard"
on public.leaderboard_entries
for select
to authenticated
using (true);

drop policy if exists "authenticated users can read topics" on public.imposter_topics;
create policy "authenticated users can read topics"
on public.imposter_topics
for select
to authenticated
using (true);

grant execute on function public.create_imposter_room(text) to authenticated;
grant execute on function public.join_imposter_room(text, text) to authenticated;
grant execute on function public.set_imposter_ready(text, boolean) to authenticated;
grant execute on function public.start_imposter_round(text) to authenticated;
grant execute on function public.submit_imposter_clue(text, text) to authenticated;
grant execute on function public.cast_imposter_vote(text, uuid) to authenticated;
grant execute on function public.leave_imposter_room(text) to authenticated;
grant execute on function public.get_imposter_room_snapshot(text) to authenticated;

insert into public.imposter_topics (prompt, category)
values
  ('favorite midnight snack', 'general'),
  ('worst school subject', 'general'),
  ('best comfort game', 'gaming'),
  ('dream concert lineup', 'music'),
  ('go-to bubble tea order', 'food'),
  ('most chaotic chore', 'daily life'),
  ('pet you would absolutely adopt', 'general'),
  ('road trip song pick', 'music'),
  ('thing you over-customize', 'lifestyle'),
  ('weekend plan that sounds too ambitious', 'general')
on conflict (prompt) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'room_players'
  ) then
    alter publication supabase_realtime add table public.room_players;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rounds'
  ) then
    alter publication supabase_realtime add table public.rounds;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;
end $$;
