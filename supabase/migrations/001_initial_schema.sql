-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Patients
create table patients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  age int not null,
  phone text,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

-- Examinations
create type examination_status as enum ('draft', 'submitted', 'analyzed', 'finalized');
create table examinations (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients not null,
  symptoms text,
  consent boolean not null default false,
  status examination_status not null default 'draft',
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

-- Retinal images
create type eye_label as enum ('right', 'left');
create type quality_status as enum ('pending', 'suitable', 'insufficient');
create table retinal_images (
  id uuid primary key default uuid_generate_v4(),
  examination_id uuid references examinations on delete cascade not null,
  eye eye_label not null,
  storage_path text not null,
  quality_status quality_status not null default 'pending',
  quality_score float,
  is_from_video boolean default false,
  frame_index int,
  created_at timestamptz default now()
);

-- Screening results
create type risk_level as enum ('low', 'moderate', 'high', 'inconclusive');
create table screening_results (
  id uuid primary key default uuid_generate_v4(),
  examination_id uuid references examinations on delete cascade unique not null,
  ai_result jsonb,
  risk_level risk_level,
  clinician_notes text,
  recommendation text,
  finalized boolean default false,
  finalized_at timestamptz,
  finalized_by uuid references auth.users,
  created_at timestamptz default now()
);

-- RLS: enable on all tables, but don't add policies yet (M9)
alter table patients enable row level security;
alter table examinations enable row level security;
alter table retinal_images enable row level security;
alter table screening_results enable row level security;

-- Storage bucket (run this in Supabase dashboard, noted here for reference)
-- insert into storage.buckets (id, name, public) values ('retinal-images', 'retinal-images', false);
