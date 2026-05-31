create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values (
  'delivery',
  '{
    "freeCities": ["Казань"],
    "deliveryPrice": 500,
    "inStockMinDays": 1,
    "inStockMaxDays": 3,
    "foreignMinDays": 7,
    "foreignMaxDays": 14,
    "pickupAddress": "г. Казань, Академика Глушко 16Г, ТЦ \"АКАДЕМИК\", 2 этаж"
  }'::jsonb
)
on conflict (key) do nothing;
