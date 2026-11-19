-- ClicAnglais : photos de profil (à exécuter UNE fois dans Supabase > SQL Editor)
-- Ne modifie aucune fonction existante.

-- 1. Colonne pour l'adresse de la photo
alter table public.profiles add column if not exists avatar_url text;

-- 2. Espace de stockage public en lecture, chaque personne n'écrit que dans son dossier
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "avatars_lecture" on storage.objects;
create policy "avatars_lecture" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_ajout" on storage.objects;
create policy "avatars_ajout" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_suppression" on storage.objects;
create policy "avatars_suppression" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Lire les photos d'une liste de personnes (réservé aux connectés)
create or replace function public.avatars_de(p_ids uuid[])
returns table (id uuid, avatar_url text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.avatar_url
  from public.profiles p
  where auth.uid() is not null
    and p.id = any(p_ids)
    and p.avatar_url is not null
  limit 200;
$$;

-- 4. Enregistrer MA photo (l'adresse doit pointer vers mon dossier)
create or replace function public.mon_avatar(p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Non connecté.'; end if;
  if p_url is not null and position('/avatars/' || auth.uid()::text || '/' in p_url) = 0 then
    raise exception 'Adresse de photo invalide.';
  end if;
  update public.profiles set avatar_url = p_url where id = auth.uid();
end;
$$;

-- 5. Le professeur peut retirer la photo d'un élève
create or replace function public.prof_retirer_avatar(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_professeur() then raise exception 'Réservé au professeur.'; end if;
  update public.profiles set avatar_url = null where id = p_id;
end;
$$;

revoke all on function public.avatars_de(uuid[]) from public, anon;
revoke all on function public.mon_avatar(text) from public, anon;
revoke all on function public.prof_retirer_avatar(uuid) from public, anon;
grant execute on function public.avatars_de(uuid[]) to authenticated;
grant execute on function public.mon_avatar(text) to authenticated;
grant execute on function public.prof_retirer_avatar(uuid) to authenticated;
