-- Habilita a extensão UUID se necessário (geralmente padrão no Supabase)
create extension if not exists "uuid-ossp";

-- Tabela de Perfis (Opcional, mas boa prática para dados extras do usuário)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita RLS em Profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Tabela de Chats (Conversas)
create table public.chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita RLS em Chats
alter table public.chats enable row level security;

create policy "Users can CRUD their own chats" on public.chats
  for all using (auth.uid() = user_id);

-- Tabela de Mensagens
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references public.chats on delete cascade not null,
  user_id uuid references auth.users not null, -- Redundante mas otimiza RLS
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita RLS em Mensagens
alter table public.messages enable row level security;

create policy "Users can CRUD their own messages" on public.messages
  for all using (auth.uid() = user_id);

-- Trigger para criar perfil automaticamente ao se cadastrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
