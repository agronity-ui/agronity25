-- Agronity25 production schema: Supabase Auth + DB + Storage + Realtime + Streak/Pet.
-- Jalankan di Supabase SQL Editor. Jika rerun dan policy already exists, hapus policy lama atau reset DB dev.

create extension if not exists pgcrypto;
create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, username text unique, student_id text, dob date, cohort text default 'TIP ULM 2025',
  role text not null default 'user' check (role in ('user','admin','super_admin')),
  avatar_url text, bio text, onboarding_completed boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.my_role() returns text language sql stable security definer set search_path=public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user')
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select public.my_role() in ('admin','super_admin')
$$;

create table if not exists public.app_settings (key text primary key, value jsonb default '{}', updated_by uuid references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.app_links (id uuid primary key default gen_random_uuid(), title text not null, description text, url text not null, icon text, sort_order int default 0, is_active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.legacy_students (id uuid primary key default gen_random_uuid(), name text not null, dob date, pob text, created_at timestamptz default now());

create table if not exists public.jadwal_perkuliahan (
  id uuid primary key default gen_random_uuid(), semester int not null default 1, hari text not null, day_order int default 1,
  waktu text, start_time time, end_time time, nama_matkul text not null, ruangan text, dosen text, source text default 'admin',
  is_active boolean default true, created_by uuid references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists idx_jadwal_sem_day on public.jadwal_perkuliahan(semester, day_order, start_time);
create trigger jadwal_updated_at before update on public.jadwal_perkuliahan for each row execute function public.set_updated_at();

create table if not exists public.berita (
  id uuid primary key default gen_random_uuid(), judul text not null, slug text unique, tipe text default 'Info', waktu text,
  ringkasan text, konten text, poster text, link text, is_published boolean default true,
  created_by uuid references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists idx_berita_pub_created on public.berita(is_published, created_at desc);
create trigger berita_updated_at before update on public.berita for each row execute function public.set_updated_at();

create table if not exists public.apresiasi (
  id uuid primary key default gen_random_uuid(), slug text unique, name text not null, category text, badge text, image text, quote text,
  achievements jsonb default '[]', gradient text default 'from-yellow-400 to-orange-500', is_published boolean default true,
  created_by uuid references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now()
);
create trigger apresiasi_updated_at before update on public.apresiasi for each row execute function public.set_updated_at();

create table if not exists public.dokumentasi (
  id uuid primary key default gen_random_uuid(), title text not null, description text, category text, image_url text, video_url text, file_path text,
  event_date date, is_published boolean default true, created_by uuid references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now()
);
create trigger dokumentasi_updated_at before update on public.dokumentasi for each row execute function public.set_updated_at();

create table if not exists public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, title text not null, body text, type text default 'general', target_url text, read_at timestamptz, created_at timestamptz default now());
create table if not exists public.notification_queue (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, title text not null, body text, payload jsonb default '{}', channel text default 'in_app', status text default 'pending', scheduled_for timestamptz default now(), sent_at timestamptz, created_at timestamptz default now());

-- Social media
create table if not exists public.social_posts (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, caption text not null, media_url text, media_path text, media_type text default 'none' check (media_type in ('image','video','none')), visibility text default 'angkatan', status text default 'published', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.social_comments (id uuid primary key default gen_random_uuid(), post_id uuid references public.social_posts(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, parent_id uuid references public.social_comments(id) on delete cascade, body text not null, status text default 'published', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.social_likes (post_id uuid references public.social_posts(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, created_at timestamptz default now(), primary key(post_id,user_id));
create table if not exists public.social_saved_posts (post_id uuid references public.social_posts(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, created_at timestamptz default now(), primary key(post_id,user_id));
create table if not exists public.social_reports (id uuid primary key default gen_random_uuid(), post_id uuid references public.social_posts(id) on delete cascade, reporter_id uuid default auth.uid() references public.profiles(id), reason text not null, status text default 'open', admin_note text, created_at timestamptz default now(), updated_at timestamptz default now());
create index if not exists idx_social_posts_status_created on public.social_posts(status, created_at desc);
create trigger social_posts_updated_at before update on public.social_posts for each row execute function public.set_updated_at();
create trigger social_comments_updated_at before update on public.social_comments for each row execute function public.set_updated_at();
create trigger social_reports_updated_at before update on public.social_reports for each row execute function public.set_updated_at();

create or replace view public.social_posts_with_counts as
select p.*, pr.full_name, pr.avatar_url,
  (select count(*)::int from public.social_likes l where l.post_id=p.id) like_count,
  (select count(*)::int from public.social_comments c where c.post_id=p.id and c.status='published') comment_count
from public.social_posts p left join public.profiles pr on pr.id=p.user_id where p.status='published';
create or replace view public.social_comments_with_profiles as select c.*, p.full_name, p.avatar_url from public.social_comments c left join public.profiles p on p.id=c.user_id where c.status='published';

create or replace function public.toggle_social_like(p_post_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if exists(select 1 from public.social_likes where post_id=p_post_id and user_id=auth.uid()) then
   delete from public.social_likes where post_id=p_post_id and user_id=auth.uid();
 else
   insert into public.social_likes(post_id,user_id) values(p_post_id,auth.uid());
   perform public.record_activity('social_like', jsonb_build_object('post_id',p_post_id));
   insert into public.notifications(user_id,title,body,type,target_url)
   select user_id,'Postinganmu disukai','Ada like baru di Agronity Social','social_like','/social' from public.social_posts where id=p_post_id and user_id<>auth.uid();
 end if;
end $$;
create or replace function public.toggle_social_save(p_post_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if exists(select 1 from public.social_saved_posts where post_id=p_post_id and user_id=auth.uid()) then delete from public.social_saved_posts where post_id=p_post_id and user_id=auth.uid();
 else insert into public.social_saved_posts(post_id,user_id) values(p_post_id,auth.uid()); end if;
end $$;

-- Chat + chat streak
create table if not exists public.chat_rooms (id uuid primary key default gen_random_uuid(), type text default 'direct' check(type in('direct','group')), name text, created_by uuid references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.chat_participants (room_id uuid references public.chat_rooms(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, joined_at timestamptz default now(), last_read_at timestamptz, primary key(room_id,user_id));
create table if not exists public.chat_messages (id uuid primary key default gen_random_uuid(), room_id uuid references public.chat_rooms(id) on delete cascade, sender_id uuid references public.profiles(id) on delete cascade, body text, attachment_url text, attachment_path text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.chat_streaks (id uuid primary key default gen_random_uuid(), room_id uuid references public.chat_rooms(id) on delete cascade unique, user_a uuid references public.profiles(id), user_b uuid references public.profiles(id), current_count int default 0, best_count int default 0, status text default 'waiting_reply', last_increment_date date, deadline_at timestamptz, freeze_available int default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create index if not exists idx_chat_messages_room_created on public.chat_messages(room_id,created_at desc);

-- KHS/IPK
create table if not exists public.khs_scans (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, semester int not null, file_url text, file_path text, ocr_text text, status text default 'scanned', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.khs_courses (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, scan_id uuid references public.khs_scans(id) on delete set null, semester int not null, course_name text not null, sks numeric not null, grade_letter text not null, grade_point numeric, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.semester_grades (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, semester int not null, total_sks numeric default 0, ips numeric default 0, ipk numeric default 0, created_at timestamptz default now(), updated_at timestamptz default now(), unique(user_id,semester));
create table if not exists public.ipk_targets (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, target_ipk numeric not null, next_semester_sks numeric default 20, note text, created_at timestamptz default now(), updated_at timestamptz default now());

-- AI, journal, finance
create table if not exists public.ai_chats (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, title text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.ai_messages (id uuid primary key default gen_random_uuid(), chat_id uuid references public.ai_chats(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, role text check(role in('system','user','assistant')), content text not null, created_at timestamptz default now());
create table if not exists public.journals (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, entry_date date not null, mood text, tags text[] default '{}', title text, body text not null, is_private boolean default true, pin_locked boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.journal_attachments (id uuid primary key default gen_random_uuid(), journal_id uuid references public.journals(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, file_url text, file_path text, file_type text, created_at timestamptz default now());
create table if not exists public.finance_categories (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, name text not null, type text default 'expense', icon text, color text, created_at timestamptz default now(), unique(user_id,name,type));
create table if not exists public.finance_transactions (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, type text not null check(type in('income','expense')), amount numeric not null check(amount>=0), category text not null, wallet text default 'cash', transaction_date date not null default ((now() at time zone 'Asia/Makassar')::date), note text, receipt_url text, receipt_path text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.finance_budgets (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, month date not null, category text, amount numeric not null, created_at timestamptz default now(), updated_at timestamptz default now(), unique(user_id,month,category));
create table if not exists public.finance_goals (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, title text not null, target_amount numeric not null, current_amount numeric default 0, deadline date, created_at timestamptz default now(), updated_at timestamptz default now());

-- Streak + Pet
create table if not exists public.user_activity_logs (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, activity_type text not null, metadata jsonb default '{}', server_day date not null default ((now() at time zone 'Asia/Makassar')::date), created_at timestamptz default now());
create table if not exists public.user_streaks (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, streak_type text not null, current_count int default 0, best_count int default 0, last_activity_date date, status text default 'active', freeze_count int default 3, next_deadline_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now(), unique(user_id,streak_type));
create table if not exists public.streak_freezes (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, streak_type text not null, used_at timestamptz, reason text, created_at timestamptz default now());
create table if not exists public.streak_rewards (id uuid primary key default gen_random_uuid(), streak_type text not null, days_required int not null, reward_type text not null, reward_payload jsonb default '{}', created_at timestamptz default now());
create table if not exists public.achievements (id uuid primary key default gen_random_uuid(), code text unique not null, title text not null, description text, badge_icon text default '🔥', criteria_key text, criteria_value int, created_at timestamptz default now());
create table if not exists public.user_achievements (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, achievement_id uuid references public.achievements(id) on delete cascade, unlocked_at timestamptz default now(), unique(user_id,achievement_id));
create table if not exists public.pet_evolution_stages (id uuid primary key default gen_random_uuid(), min_level int not null, name text not null, image_url text, animation_key text, created_at timestamptz default now());
create table if not exists public.pets (id uuid primary key default gen_random_uuid(), user_id uuid unique references public.profiles(id) on delete cascade, name text default 'AgroPet', level int default 1, xp int default 0, mood text default 'happy', energy int default 80, hunger int default 40, happiness int default 75, evolution_stage int default 1, motivation text default 'Semangat kuliah hari ini. Jaga streak dan progresmu!', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.pet_stats (id uuid primary key default gen_random_uuid(), pet_id uuid references public.pets(id) on delete cascade, stat_key text not null, stat_value numeric default 0, updated_at timestamptz default now(), unique(pet_id,stat_key));
create table if not exists public.pet_items (id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, effect jsonb default '{}', rarity text default 'common', created_at timestamptz default now());
create table if not exists public.user_pet_items (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, item_id uuid references public.pet_items(id) on delete cascade, quantity int default 0, created_at timestamptz default now(), updated_at timestamptz default now(), unique(user_id,item_id));
create table if not exists public.pet_quests (id uuid primary key default gen_random_uuid(), title text not null, description text, quest_type text check(quest_type in('daily','weekly')), activity_type text, target_count int default 1, reward_xp int default 10, reward_item_code text, is_active boolean default true, created_at timestamptz default now());
create table if not exists public.user_pet_quests (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, quest_id uuid references public.pet_quests(id) on delete cascade, period_start date not null, progress int default 0, completed_at timestamptz, claimed_at timestamptz, created_at timestamptz default now(), unique(user_id,quest_id,period_start));

create or replace view public.streak_leaderboard as select p.id user_id, coalesce(p.full_name,p.username,'Mahasiswa') full_name, sum(s.current_count)::int total_streak, max(s.best_count)::int best_streak from public.profiles p join public.user_streaks s on s.user_id=p.id group by p.id,p.full_name,p.username order by total_streak desc,best_streak desc;

create or replace function public.map_activity_to_streak(p_activity text) returns text language sql immutable as $$
select case when p_activity='login_daily' then 'daily_login' when p_activity='journal_write' then 'journal_daily' when p_activity='finance_record' then 'finance_daily' when p_activity in('khs_scan','grade_update','simulator_open') then 'study_ipk' when p_activity in('social_post','social_comment','social_like') then 'social_daily' when p_activity='chat_message' then 'chat_daily' else 'app_engagement' end
$$;

create or replace function public.record_activity_for_user(p_user_id uuid, p_activity_type text, p_metadata jsonb default '{}') returns void language plpgsql security definer set search_path=public as $$
declare v_day date := (now() at time zone 'Asia/Makassar')::date; v_type text := public.map_activity_to_streak(p_activity_type); v_old public.user_streaks%rowtype; v_count int; v_xp int;
begin
 if p_user_id is null then return; end if;
 insert into public.user_activity_logs(user_id,activity_type,metadata,server_day) values(p_user_id,p_activity_type,coalesce(p_metadata,'{}'),v_day);
 select * into v_old from public.user_streaks where user_id=p_user_id and streak_type=v_type for update;
 if not found then
   v_count:=1; insert into public.user_streaks(user_id,streak_type,current_count,best_count,last_activity_date,status,next_deadline_at) values(p_user_id,v_type,1,1,v_day,'active',now()+interval '36 hours');
 elsif v_old.last_activity_date = v_day then v_count:=v_old.current_count;
 elsif v_old.last_activity_date = v_day-1 then v_count:=v_old.current_count+1; update public.user_streaks set current_count=v_count,best_count=greatest(best_count,v_count),last_activity_date=v_day,status='active',next_deadline_at=now()+interval '36 hours' where id=v_old.id;
 elsif v_old.freeze_count>0 then v_count:=v_old.current_count+1; update public.user_streaks set current_count=v_count,best_count=greatest(best_count,v_count),last_activity_date=v_day,status='restored_with_freeze',freeze_count=freeze_count-1,next_deadline_at=now()+interval '36 hours' where id=v_old.id;
 else v_count:=1; update public.user_streaks set current_count=1,last_activity_date=v_day,status='active',next_deadline_at=now()+interval '36 hours' where id=v_old.id;
 end if;
 v_xp := case p_activity_type when 'khs_scan' then 50 when 'journal_write' then 25 when 'finance_record' then 20 when 'social_post' then 20 when 'chat_message' then 10 else 8 end;
 update public.pets set xp=xp+v_xp, level=greatest(1,floor((xp+v_xp)/100)+1), happiness=least(100,happiness+2), energy=greatest(0,energy-1), hunger=least(100,hunger+1) where user_id=p_user_id;
 insert into public.user_achievements(user_id,achievement_id) select p_user_id,a.id from public.achievements a where a.criteria_key=v_type and a.criteria_value<=coalesce(v_count,1) on conflict do nothing;
end $$;
create or replace function public.record_activity(p_activity_type text, p_metadata jsonb default '{}') returns void language plpgsql security definer set search_path=public as $$ begin perform public.record_activity_for_user(auth.uid(),p_activity_type,p_metadata); end $$;

create or replace function public.feed_pet(p_item_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare v_effect jsonb; v_user uuid:=auth.uid();
begin
 if not exists(select 1 from public.user_pet_items where user_id=v_user and item_id=p_item_id and quantity>0) then raise exception 'Item tidak tersedia'; end if;
 select effect into v_effect from public.pet_items where id=p_item_id;
 update public.user_pet_items set quantity=quantity-1 where user_id=v_user and item_id=p_item_id;
 update public.pets set hunger=greatest(0,hunger-coalesce((v_effect->>'hunger')::int,10)), happiness=least(100,happiness+coalesce((v_effect->>'happiness')::int,5)), xp=xp+coalesce((v_effect->>'xp')::int,5) where user_id=v_user;
end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name,username) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),split_part(new.email,'@',1)) on conflict(id) do nothing;
 insert into public.pets(user_id,name) values(new.id,'AgroPet') on conflict(user_id) do nothing;
 return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_chat_message_streak() returns trigger language plpgsql security definer set search_path=public as $$
declare users uuid[]; other uuid; v_day date := (now() at time zone 'Asia/Makassar')::date; cnt_a int; cnt_b int;
begin
 perform public.record_activity_for_user(new.sender_id,'chat_message',jsonb_build_object('room_id',new.room_id));
 select array_agg(user_id order by user_id) into users from public.chat_participants where room_id=new.room_id;
 if array_length(users,1)=2 then
   other := case when users[1]=new.sender_id then users[2] else users[1] end;
   insert into public.chat_streaks(room_id,user_a,user_b,status,deadline_at) values(new.room_id,users[1],users[2],'waiting_reply',now()+interval '24 hours') on conflict(room_id) do nothing;
   select count(*) into cnt_a from public.chat_messages where room_id=new.room_id and sender_id=users[1] and created_at>now()-interval '24 hours';
   select count(*) into cnt_b from public.chat_messages where room_id=new.room_id and sender_id=users[2] and created_at>now()-interval '24 hours';
   if cnt_a>0 and cnt_b>0 then update public.chat_streaks set current_count=case when last_increment_date=v_day then current_count else current_count+1 end, best_count=greatest(best_count, case when last_increment_date=v_day then current_count else current_count+1 end), status='active', last_increment_date=v_day, deadline_at=now()+interval '24 hours' where room_id=new.room_id; else update public.chat_streaks set status='waiting_reply',deadline_at=now()+interval '24 hours' where room_id=new.room_id; end if;
 end if;
 return new;
end $$;
drop trigger if exists chat_message_streak on public.chat_messages;
create trigger chat_message_streak after insert on public.chat_messages for each row execute function public.handle_chat_message_streak();

create or replace function public.check_expiring_streaks() returns void language plpgsql security definer set search_path=public as $$
begin
 update public.user_streaks set status='almost_broken' where next_deadline_at between now() and now()+interval '6 hours' and status in('active','restored_with_freeze');
 insert into public.notification_queue(user_id,title,body,channel,status) select user_id,'Streak hampir putus','Buka Agronity25 hari ini agar streak tidak putus 🔥','in_app','pending' from public.user_streaks where status='almost_broken';
 update public.user_streaks set status='broken',current_count=0 where next_deadline_at<now() and status in('active','almost_broken','restored_with_freeze') and freeze_count<=0;
 update public.user_streaks set status='restored_with_freeze',freeze_count=freeze_count-1,next_deadline_at=now()+interval '24 hours' where next_deadline_at<now() and status in('active','almost_broken') and freeze_count>0;
end $$;

-- Enable RLS for all public tables created above.
do $$ declare r record; begin for r in select tablename from pg_tables where schemaname='public' and tablename in (
'profiles','app_settings','app_links','legacy_students','jadwal_perkuliahan','berita','apresiasi','dokumentasi','notifications','notification_queue','social_posts','social_comments','social_likes','social_saved_posts','social_reports','chat_rooms','chat_participants','chat_messages','chat_streaks','khs_scans','khs_courses','semester_grades','ipk_targets','ai_chats','ai_messages','journals','journal_attachments','finance_categories','finance_transactions','finance_budgets','finance_goals','user_activity_logs','user_streaks','streak_freezes','streak_rewards','achievements','user_achievements','pet_evolution_stages','pets','pet_stats','pet_items','user_pet_items','pet_quests','user_pet_quests') loop execute format('alter table public.%I enable row level security', r.tablename); end loop; end $$;

-- Compact policies
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (id=auth.uid() or public.is_admin()) with check (id=auth.uid() or public.is_admin());
create policy profiles_admin on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy public_read_jadwal on public.jadwal_perkuliahan for select using (is_active or public.is_admin());
create policy admin_jadwal on public.jadwal_perkuliahan for all to authenticated using (public.is_admin()) with check(public.is_admin());
create policy public_read_berita on public.berita for select using (is_published or public.is_admin());
create policy admin_berita on public.berita for all to authenticated using (public.is_admin()) with check(public.is_admin());
create policy public_read_apresiasi on public.apresiasi for select using (is_published or public.is_admin());
create policy admin_apresiasi on public.apresiasi for all to authenticated using (public.is_admin()) with check(public.is_admin());
create policy public_read_dokumentasi on public.dokumentasi for select using (is_published or public.is_admin());
create policy admin_dokumentasi on public.dokumentasi for all to authenticated using (public.is_admin()) with check(public.is_admin());
create policy app_links_read on public.app_links for select using (is_active or public.is_admin());
create policy app_links_admin on public.app_links for all to authenticated using (public.is_admin()) with check(public.is_admin());
create policy settings_admin on public.app_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy legacy_students_read on public.legacy_students for select to authenticated using(true);

create policy notifications_self on public.notifications for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy notifications_update_self on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy notification_queue_admin on public.notification_queue for all to authenticated using(public.is_admin()) with check(public.is_admin());

create policy social_posts_read on public.social_posts for select to authenticated using(status='published' or user_id=auth.uid() or public.is_admin());
create policy social_posts_insert on public.social_posts for insert to authenticated with check(user_id=auth.uid());
create policy social_posts_update on public.social_posts for update to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy social_posts_delete on public.social_posts for delete to authenticated using(user_id=auth.uid() or public.is_admin());
create policy comments_read on public.social_comments for select to authenticated using(status='published' or user_id=auth.uid() or public.is_admin());
create policy comments_insert on public.social_comments for insert to authenticated with check(user_id=auth.uid());
create policy comments_update on public.social_comments for update to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy likes_self on public.social_likes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy saved_self on public.social_saved_posts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy reports_insert on public.social_reports for insert to authenticated with check(reporter_id=auth.uid() or reporter_id is null);
create policy reports_admin on public.social_reports for all to authenticated using(public.is_admin()) with check(public.is_admin());

create policy chat_rooms_member on public.chat_rooms for select to authenticated using(public.is_admin() or exists(select 1 from public.chat_participants cp where cp.room_id=id and cp.user_id=auth.uid()));
create policy chat_rooms_create on public.chat_rooms for insert to authenticated with check(created_by=auth.uid());
create policy chat_participants_member on public.chat_participants for select to authenticated using(public.is_admin() or exists(select 1 from public.chat_participants cp where cp.room_id=chat_participants.room_id and cp.user_id=auth.uid()));
create policy chat_participants_insert on public.chat_participants for insert to authenticated with check(public.is_admin() or user_id=auth.uid() or exists(select 1 from public.chat_rooms cr where cr.id=room_id and cr.created_by=auth.uid()));
create policy chat_messages_member on public.chat_messages for select to authenticated using(public.is_admin() or exists(select 1 from public.chat_participants cp where cp.room_id=room_id and cp.user_id=auth.uid()));
create policy chat_messages_insert on public.chat_messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.chat_participants cp where cp.room_id=room_id and cp.user_id=auth.uid()));
create policy chat_streaks_member on public.chat_streaks for select to authenticated using(public.is_admin() or auth.uid() in(user_a,user_b));

-- Generate owner policies for tables that have user_id.
do $$ declare t text; begin
foreach t in array array['khs_scans','khs_courses','semester_grades','ipk_targets','ai_chats','ai_messages','journals','journal_attachments','finance_categories','finance_transactions','finance_budgets','finance_goals','user_activity_logs','user_streaks','streak_freezes','user_achievements','pets','user_pet_items','user_pet_quests'] loop
 execute format('create policy %I on public.%I for all to authenticated using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin())', 'owner_'||t, t);
end loop; end $$;
create policy achievements_read on public.achievements for select to authenticated using(true);
create policy streak_rewards_read on public.streak_rewards for select to authenticated using(true);
create policy pet_items_read on public.pet_items for select to authenticated using(true);
create policy pet_quests_read on public.pet_quests for select to authenticated using(is_active or public.is_admin());
create policy pet_stages_read on public.pet_evolution_stages for select to authenticated using(true);
create policy pet_stats_read on public.pet_stats for select to authenticated using(public.is_admin() or exists(select 1 from public.pets p where p.id=pet_id and p.user_id=auth.uid()));

-- Storage
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
('avatars','avatars',true,5242880,array['image/png','image/jpeg','image/webp','image/gif']),
('agronity-cms','agronity-cms',true,52428800,array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm']),
('social-media','social-media',true,52428800,array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm']),
('khs-files','khs-files',false,20971520,array['image/png','image/jpeg','image/webp','application/pdf']),
('journal-attachments','journal-attachments',false,10485760,array['image/png','image/jpeg','image/webp']),
('finance-receipts','finance-receipts',false,15728640,array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict(id) do nothing;
create policy storage_public_read on storage.objects for select using(bucket_id in('avatars','agronity-cms','social-media'));
create policy storage_private_owner_read on storage.objects for select to authenticated using(bucket_id in('khs-files','journal-attachments','finance-receipts') and owner=auth.uid());
create policy storage_auth_insert on storage.objects for insert to authenticated with check(bucket_id in('avatars','agronity-cms','social-media','khs-files','journal-attachments','finance-receipts'));
create policy storage_owner_update on storage.objects for update to authenticated using(owner=auth.uid() or public.is_admin()) with check(owner=auth.uid() or public.is_admin());
create policy storage_owner_delete on storage.objects for delete to authenticated using(owner=auth.uid() or public.is_admin());

-- Realtime publication
do $$ begin
 alter publication supabase_realtime add table public.social_posts; alter publication supabase_realtime add table public.social_comments; alter publication supabase_realtime add table public.social_likes; alter publication supabase_realtime add table public.chat_messages; alter publication supabase_realtime add table public.chat_streaks; alter publication supabase_realtime add table public.user_streaks; alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

-- Seed legacy content
insert into public.jadwal_perkuliahan(semester,hari,day_order,waktu,start_time,end_time,nama_matkul,ruangan,source) values
(1,'Senin',1,'08:50 - 10:30','08:50','10:30','Kimia Dasar','R. Kalalayu','legacy'),(1,'Senin',1,'10:30 - 11:20','10:30','11:20','Pengantar Teknologi','R. Hambawang','legacy'),(1,'Selasa',2,'07:10 - 08:50','07:10','08:50','Matematika Dasar','R. Kalalayu','legacy'),(1,'Selasa',2,'10:30 - 12:10','10:30','12:10','Praktikum Kimia','Lab. Dasar','legacy'),(1,'Selasa',2,'13:00 - 14:40','13:00','14:40','Ekonomi Teknik','R. Hambawang','legacy'),(1,'Rabu',3,'08:50 - 10:30','08:50','10:30','Rekayasa Bioproses','R. Kenanga','legacy'),(1,'Rabu',3,'10:30 - 12:10','10:30','12:10','Agama','R. Pampaken','legacy'),(1,'Rabu',3,'14:40 - 16:20','14:40','16:20','Bahasa Indonesia','R. Kemuning','legacy'),(1,'Kamis',4,'08:50 - 10:30','08:50','10:30','Matematika Lanjut','R. Kenanga','legacy'),(1,'Kamis',4,'13:00 - 14:40','13:00','14:40','Pancasila','R. Pampaken','legacy'),(2,'Senin',1,'09.40 - 11.20','09:40','11:20','Bahasa Inggris','Ruang Pampaken','legacy'),(2,'Senin',1,'13.00 - 14.40','13:00','14:40','Manajemen Sumber Daya Manusia','Ruang Kenanga','legacy'),(2,'Senin',1,'14.40 - 16.20','14:40','16:20','Metode Statistika','Ruang Kemuning','legacy'),(2,'Selasa',2,'08.00 - 09.40','08:00','09:40','Manajemen Lingkungan Industri','Ruang Kalalayu','legacy'),(2,'Selasa',2,'09.40 - 11.20','09:40','11:20','Bahasa Inggris','Ruang Pampaken','legacy'),(2,'Selasa',2,'13.00 - 14.40','13:00','14:40','Dasar Teknik Proses','Ruang Kenanga','legacy'),(2,'Rabu',3,'14.40 - 16.20','14:40','16:20','Pengantar Lingkungan Lahan Basah','Ruang Culan','legacy'),(2,'Rabu',3,'16.20 - 18.00','16:20','18:00','Metode Statistika','Ruang Pampaken','legacy'),(2,'Kamis',4,'08.00 - 09.40','08:00','09:40','Kewarganegaraan','Ruang Pampaken','legacy'),(2,'Kamis',4,'13.00 - 14.40','13:00','14:40','Pengetahuan Bahan Agroindustri','Ruang Kemuning','legacy'),(2,'Kamis',4,'16.20 - 18.00','16:20','18:00','Kalkulus','Ruang Kemuning','legacy') on conflict do nothing;
insert into public.berita(judul,tipe,waktu,ringkasan,poster,link) values ('Startup Agrotech Indonesia Mulai Dilirik Investor Global','Teknologi','2 jam yang lalu','Seed berita bawaan dari prototype lama. Admin bisa edit/publish berita baru tanpa menimpa data lama.','https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1000&auto=format&fit=crop','#'),('Portal Agronity25 Production Ready','Info','Hari ini','Agronity25 kini memakai Supabase Auth, Database, Storage, Realtime, PWA, dan fitur mahasiswa modern.','https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop','#') on conflict do nothing;
insert into public.apresiasi(slug,name,category,badge,quote,achievements,gradient,image) values ('khairul','Khairul Hidayatullah','Olahraga - Drumband','AGRONITY APRESIASI','Prestasi tidak lahir dari sekali langkah, tapi dari irama disiplin yang terus dijaga.','[{"title":"LUG","medal":"Perak"},{"title":"Etape 2","medal":"Emas"}]','from-orange-500 to-red-500','https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=800&auto=format&fit=crop'),('amelia','Amelia Qalsyum J.','Olahraga - Badminton','AGRONITY APRESIASI','Setiap pukulan adalah keputusan, dan setiap keputusan menentukan kemenangan.','[{"title":"Kejuaraan Provinsi PBSI Kalsel 2025","medal":"Partisipan"}]','from-cyan-500 to-blue-600','https://images.unsplash.com/photo-1626224583764-8476496238b8?q=80&w=800&auto=format&fit=crop'),('faris','Ahmad Faris Alzabar','Debat - KDMI','AGRONITY APRESIASI','Kata-kata adalah senjata paling tajam dalam perubahan.','[{"title":"Lolos Seleksi Fakultas","medal":"Lolos"}]','from-green-600 to-teal-600','https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop') on conflict(slug) do nothing;
insert into public.app_links(title,description,url,sort_order) values ('Siakad ULM','Akses akademik resmi ULM','https://simari.ulm.ac.id',1),('Google Drive Angkatan','Folder bersama Agronity25','#',2),('Kontak Admin','Hubungi admin Agronity25','#',3) on conflict do nothing;
insert into public.achievements(code,title,description,badge_icon,criteria_key,criteria_value) values ('daily_3','Streak 3 Hari','Aktif 3 hari berturut-turut','🔥','daily_login',3),('daily_7','Streak 7 Hari','Seminggu aktif tanpa putus','🔥','daily_login',7),('daily_14','Streak 14 Hari','Dua minggu konsisten','🔥','daily_login',14),('daily_30','Streak 30 Hari','Satu bulan penuh','🏆','daily_login',30),('journal_7','Jurnal 7 Hari','Menulis jurnal konsisten','📓','journal_daily',7),('finance_7','Finance 7 Hari','Catat keuangan konsisten','💸','finance_daily',7),('study_7','IPK Guardian','Update data belajar/IPK konsisten','🎓','study_ipk',7) on conflict(code) do nothing;
insert into public.pet_items(code,name,effect,rarity) values ('snack','Snack Maggot Energy','{"hunger":20,"happiness":8,"xp":5}','common'),('kopi','Kopi Praktikum','{"hunger":5,"happiness":12,"xp":10}','rare'),('star','Bintang Streak','{"hunger":0,"happiness":25,"xp":30}','epic') on conflict(code) do nothing;
insert into public.pet_quests(title,description,quest_type,activity_type,target_count,reward_xp,reward_item_code) values ('Buka Agronity','Login harian untuk menjaga streak','daily','login_daily',1,10,'snack'),('Tulis Jurnal','Catat refleksi hari ini','daily','journal_write',1,20,'snack'),('Catat Keuangan','Masukkan minimal satu transaksi','daily','finance_record',1,20,'kopi'),('Update Akademik','Scan KHS atau buka simulator IPK','weekly','khs_scan',1,50,'star') on conflict do nothing;
insert into public.pet_evolution_stages(min_level,name,animation_key) values (1,'Seedling Pet','seedling'),(5,'Sprout Pet','sprout'),(10,'Agro Hero','hero'),(20,'Legend Agronity','legend') on conflict do nothing;

-- Supabase Cron setelah Edge Function deploy:
-- select cron.schedule('agronity25-streak-hourly','0 * * * *', $$select net.http_post(url := 'https://YOUR_PROJECT.supabase.co/functions/v1/streak-worker', headers := '{"Authorization":"Bearer YOUR_CRON_SECRET"}'::jsonb, body := '{}'::jsonb);$$);
