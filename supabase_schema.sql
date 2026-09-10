-- ==============================================================================
-- OFFICE FILE DROP - SUPABASE SCHEMA & STORAGE CONFIGURATION (V2 - RLS FIXED)
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create the office_files Table
create table if not exists public.office_files (
    id uuid primary key default uuid_generate_v4(),
    sender_name text not null,
    file_name text not null,
    file_path text not null,
    file_size bigint not null,
    mime_type text,
    created_at timestamptz default now() not null,
    expires_at timestamptz default (now() + interval '24 hours') not null
);

-- Index for fast querying by sender and creation time
create index if not exists idx_office_files_created_at on public.office_files (created_at desc);
create index if not exists idx_office_files_sender on public.office_files (sender_name);

-- 3. Grant Explicit Table Permissions to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant all privileges on table public.office_files to anon, authenticated;

-- 4. Configure Row Level Security (RLS)
alter table public.office_files enable row level security;

-- Drop all variants of existing policies for a clean, conflict-free state
drop policy if exists "Allow public insert on office_files" on public.office_files;
drop policy if exists "Allow insert on office_files" on public.office_files;
drop policy if exists "Allow authenticated select on office_files" on public.office_files;
drop policy if exists "Allow select on office_files" on public.office_files;
drop policy if exists "Allow public select on office_files" on public.office_files;
drop policy if exists "Allow authenticated delete on office_files" on public.office_files;
drop policy if exists "Allow delete on office_files" on public.office_files;

-- Policy A: Anyone (colleagues via QR code without login + authenticated users) can insert file records
create policy "Allow insert on office_files"
on public.office_files
for insert
to anon, authenticated
with check (true);

-- Policy B: Anyone (receiver desk and senders) can read file metadata for live preview
create policy "Allow select on office_files"
on public.office_files
for select
to anon, authenticated
using (true);

-- Policy C: Only authenticated admin/receiver can delete files from database
create policy "Allow authenticated delete on office_files"
on public.office_files
for delete
to authenticated
using (true);

-- 5. Enable Supabase Realtime for instant dashboard updates
alter table public.office_files replica identity full;

do $$
begin
    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'office_files'
    ) then
        alter publication supabase_realtime add table public.office_files;
    end if;
end $$;

-- 6. Create Storage Bucket for office files
insert into storage.buckets (id, name, public)
values ('office_files', 'office_files', true)
on conflict (id) do update set public = true;

-- Drop existing storage policies if re-running
drop policy if exists "Public upload to office_files bucket" on storage.objects;
drop policy if exists "Allow upload to office_files bucket" on storage.objects;
drop policy if exists "Public read office_files bucket" on storage.objects;
drop policy if exists "Allow read office_files bucket" on storage.objects;
drop policy if exists "Authenticated delete office_files bucket" on storage.objects;
drop policy if exists "Allow delete office_files bucket" on storage.objects;

-- Storage RLS: Anyone (senders via QR code) can upload files
create policy "Allow upload to office_files bucket"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'office_files');

-- Storage RLS: Anyone can read/download files via public URL
create policy "Allow read office_files bucket"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'office_files');

-- Storage RLS: Only authenticated receiver can delete files from storage
create policy "Allow delete office_files bucket"
on storage.objects
for delete
to authenticated
using (bucket_id = 'office_files');

-- 7. Cleanup routine for expired files (older than 24 hours)
create or replace function public.cleanup_expired_files()
returns integer as $$
declare
    deleted_count integer;
begin
    -- Delete records past their expiration
    delete from public.office_files
    where expires_at < now();
    
    get diagnostics deleted_count = row_count;
    return deleted_count;
end;
$$ language plpgsql security definer;
