-- =============================================================================
-- Stayscape — 100 simulated guest users
--
-- Paste the entire file into the Supabase SQL Editor and click Run.
-- Password for all accounts: Stayscape2024!
-- Safe to re-run — ON CONFLICT DO NOTHING on every table.
--
-- If you see "column instance_id does not exist" remove that column
-- from the auth.users INSERT below (newer Supabase projects omit it).
-- =============================================================================

create extension if not exists pgcrypto;

with

-- Pre-compute one bcrypt hash — reused for all 100 rows for speed.
-- All users share the same plaintext password so this is fine.
pwd as (
  select crypt('Stayscape2024!', gen_salt('bf', 8)) as hash
),

-- Master seed table ────────────────────────────────────────────────────────
-- columns: email, firstname, lastname, phone,
--          age_band, city, country,
--          novelty, vibes, discovery, food, planning, spend,
--          dealbreakers, completed
seed (email, firstname, lastname, phone,
      age_band, city, country,
      novelty, vibes, discovery, food, planning, spend,
      dealbreakers, completed) as (
  values
  -- ── Luxury travellers ─────────────────────────────────────────────────
  ('sophia.harrington@gmail.com',   'Sophia',    'Harrington', '+447911123456',   '35_44', 'London',          'GB', 'explorer', '{dining,wellness,top_places}',     'researched',  'adventurous', 'far_ahead',   'luxury', '{no_ac,noisy_area}',     true),
  ('j.blackwood@icloud.com',        'James',     'Blackwood',  '+447922234567',   '45_54', 'Edinburgh',       'GB', 'comfort',  '{dining,historical,top_places}',   'researched',  'local',       'far_ahead',   'ultra',  '{noisy_area,no_gym}',    true),
  ('isabelle.moreau@outlook.fr',    'Isabelle',  'Moreau',     '+33612345678',    '35_44', 'Paris',           'FR', 'explorer', '{dining,shopping,wellness}',        'researched',  'adventurous', 'far_ahead',   'luxury', '{no_wifi}',              true),
  ('a.schmidt@gmail.com',           'Alexander', 'Schmidt',    '+4915201234567',  '45_54', 'Munich',          'DE', 'comfort',  '{historical,dining,top_places}',   'researched',  'local',       'far_ahead',   'luxury', '{smoking,noisy_area}',   true),
  ('natasha.v@hotmail.com',         'Natasha',   'Volkov',     '+79161234567',    '25_34', 'Moscow',          'RU', 'explorer', '{nightlife,shopping,dining}',       'spontaneous', 'adventurous', 'last_minute', 'luxury', '{no_wifi}',              true),
  ('will.chen.hk@gmail.com',        'William',   'Chen',       '+85291234567',    '35_44', 'Hong Kong',       'HK', 'explorer', '{dining,top_places,local_spots}',   'spontaneous', 'adventurous', 'flexible',    'luxury', '{no_ac}',                true),
  ('amelia.foster@gmail.com',       'Amelia',    'Foster',     '+12025551234',    '45_54', 'New York',        'US', 'comfort',  '{wellness,dining,shopping}',        'researched',  'dietary',     'far_ahead',   'ultra',  '{no_gym,smoking}',       true),
  ('marco.bianchi@gmail.com',       'Marco',     'Bianchi',    '+393312345678',   '35_44', 'Milan',           'IT', 'explorer', '{dining,historical,nightlife}',     'spontaneous', 'local',       'flexible',    'luxury', '{no_wifi,no_ac}',        true),
  ('cat.dubois@yahoo.fr',           'Catherine', 'Dubois',     '+33698765432',    '55_64', 'Lyon',            'FR', 'comfort',  '{dining,historical,wellness}',      'researched',  'local',       'far_ahead',   'luxury', '{noisy_area,smoking}',   true),
  ('h.tanaka@outlook.jp',           'Hiroshi',   'Tanaka',     '+819012345678',   '45_54', 'Tokyo',           'JP', 'explorer', '{local_spots,dining,top_places}',   'researched',  'adventurous', 'far_ahead',   'luxury', '{smoking,noisy_area}',   true),
  ('mei.liu.sh@gmail.com',          'Mei',       'Liu',        '+8613812345678',  '35_44', 'Shanghai',        'CN', 'explorer', '{shopping,dining,top_places}',      'researched',  'adventurous', 'far_ahead',   'luxury', '{no_wifi,no_ac}',        true),
  ('anika.patel@hotmail.com',       'Anika',     'Patel',      '+4420123456789',  '25_34', 'London',          'GB', 'explorer', '{dining,wellness,shopping}',        'researched',  'adventurous', 'flexible',    'mid',    '{}',                     true),
  ('wei.huang.sg@gmail.com',        'Wei',       'Huang',      '+6592345678',     '35_44', 'Singapore',       'SG', 'comfort',  '{dining,shopping,wellness}',        'researched',  'adventurous', 'far_ahead',   'luxury', '{no_wifi}',              true),
  ('fatima.alhassan@gmail.com',     'Fatima',    'Al-Hassan',  '+97150123456',    '35_44', 'Dubai',           'AE', 'explorer', '{dining,shopping,top_places}',      'researched',  'dietary',     'far_ahead',   'luxury', '{smoking,no_ac}',        true),
  ('daniel.muller.ch@gmail.com',    'Daniel',    'Muller',     '+4916112345678',  '35_44', 'Zurich',          'CH', 'comfort',  '{top_places,dining,wellness}',      'researched',  'local',       'far_ahead',   'ultra',  '{no_wifi,no_gym}',       true),

  -- ── Foodie explorers ──────────────────────────────────────────────────
  ('ryan.nguyen.sf@gmail.com',      'Ryan',      'Nguyen',     '+16505551234',    '25_34', 'San Francisco',   'US', 'explorer', '{dining,local_spots,fun_places}',   'researched',  'adventurous', 'flexible',    'mid',    '{no_wifi}',              true),
  ('giulia.romano@outlook.com',     'Giulia',    'Romano',     '+39331234567',    '35_44', 'Rome',            'IT', 'explorer', '{dining,historical,local_spots}',   'spontaneous', 'local',       'flexible',    'mid',    '{smoking}',              true),
  ('kenji.yama@gmail.com',          'Kenji',     'Yamamoto',   '+818012345678',   '25_34', 'Osaka',           'JP', 'explorer', '{dining,nightlife,fun_places}',     'spontaneous', 'adventurous', 'last_minute', 'mid',    '{no_wifi}',              true),
  ('h.wright@yahoo.co.uk',          'Hannah',    'Wright',     '+447733123456',   '35_44', 'Manchester',      'GB', 'explorer', '{dining,local_spots,shopping}',     'researched',  'adventurous', 'far_ahead',   'mid',    '{no_wifi,smoking}',      true),
  ('o.thompson.au@gmail.com',       'Oliver',    'Thompson',   '+61412345678',    '25_34', 'Sydney',          'AU', 'explorer', '{dining,nature,fun_places}',        'spontaneous', 'adventurous', 'flexible',    'mid',    '{}',                     true),
  ('ana.silva.br@gmail.com',        'Ana',       'Silva',      '+5511912345678',  '25_34', 'Sao Paulo',       'BR', 'explorer', '{dining,nightlife,local_spots}',    'spontaneous', 'local',       'last_minute', 'budget', '{no_wifi}',              true),
  ('sungjin.park@naver.com',        'Sung-Jin',  'Park',       '+821012345678',   '25_34', 'Seoul',           'KR', 'explorer', '{dining,shopping,nightlife}',       'researched',  'adventurous', 'far_ahead',   'mid',    '{no_wifi}',              true),
  ('tom.bradley@outlook.com',       'Tom',       'Bradley',    '+16175551234',    '45_54', 'Boston',          'US', 'comfort',  '{dining,historical,top_places}',   'researched',  'local',       'far_ahead',   'mid',    '{noisy_area}',           true),
  ('yasmin.osman.au@gmail.com',     'Yasmin',    'Osman',      '+61423456789',    '25_34', 'Melbourne',       'AU', 'explorer', '{dining,wellness,local_spots}',     'researched',  'adventurous', 'flexible',    'mid',    '{smoking}',              true),
  ('david.kim.sg@gmail.com',        'David',     'Kim',        '+6591234567',     '25_34', 'Singapore',       'SG', 'explorer', '{dining,local_spots,nightlife}',    'spontaneous', 'adventurous', 'flexible',    'mid',    '{no_wifi}',              true),
  ('priya.sharma91@gmail.com',      'Priya',     'Sharma',     '+919876543210',   '25_34', 'Mumbai',          'IN', 'explorer', '{shopping,dining,fun_places}',      'researched',  'dietary',     'far_ahead',   'mid',    '{smoking}',              true),

  -- ── Adventure seekers ─────────────────────────────────────────────────
  ('jake.morrison@gmail.com',       'Jake',      'Morrison',   '+16045551234',    '18_24', 'Vancouver',       'CA', 'explorer', '{nature,fun_places,local_spots}',   'spontaneous', 'adventurous', 'last_minute', 'budget', '{no_wifi}',              true),
  ('emma.j.se@gmail.com',           'Emma',      'Johansson',  '+46701234567',    '25_34', 'Stockholm',       'SE', 'explorer', '{nature,wellness,local_spots}',     'spontaneous', 'local',       'flexible',    'mid',    '{}',                     true),
  ('arjun.mehta@gmail.com',         'Arjun',     'Mehta',      '+919898765432',   '25_34', 'Bangalore',       'IN', 'explorer', '{nature,fun_places,local_spots}',   'spontaneous', 'adventurous', 'last_minute', 'budget', '{no_wifi}',              true),
  ('s.mcallister@icloud.com',       'Sarah',     'McAllister', '+61434567890',    '25_34', 'Brisbane',        'AU', 'explorer', '{nature,fun_places,dining}',        'spontaneous', 'adventurous', 'flexible',    'mid',    '{}',                     true),
  ('mikael.bjork@hotmail.com',      'Mikael',    'Bjork',      '+46723456789',    '35_44', 'Goteborg',        'SE', 'explorer', '{nature,local_spots,dining}',       'spontaneous', 'local',       'flexible',    'mid',    '{smoking}',              true),
  ('zoe.clarke.nz@gmail.com',       'Zoe',       'Clarke',     '+64211234567',    '25_34', 'Auckland',        'NZ', 'explorer', '{nature,fun_places,local_spots}',   'spontaneous', 'adventurous', 'last_minute', 'budget', '{}',                     true),
  ('rafi.santos@gmail.com',         'Rafi',      'Santos',     '+6389012345',     '25_34', 'Manila',          'PH', 'explorer', '{nature,fun_places,local_spots}',   'spontaneous', 'local',       'last_minute', 'budget', '{no_wifi}',              true),
  ('astrid.larsen@gmail.com',       'Astrid',    'Larsen',     '+4540123456',     '25_34', 'Oslo',            'NO', 'explorer', '{nature,wellness,local_spots}',     'researched',  'local',       'far_ahead',   'mid',    '{}',                     true),
  ('chidi.okafor@gmail.com',        'Chidi',     'Okafor',     '+2348012345678',  '25_34', 'Lagos',           'NG', 'explorer', '{fun_places,nightlife,local_spots}','spontaneous', 'adventurous', 'last_minute', 'budget', '{no_wifi,no_ac}',        true),
  ('lena.fischer.de@gmail.com',     'Lena',      'Fischer',    '+4915301234567',  '25_34', 'Berlin',          'DE', 'explorer', '{nightlife,local_spots,fun_places}','spontaneous', 'adventurous', 'last_minute', 'budget', '{no_wifi}',              true),
  ('niko.papa@hotmail.com',         'Niko',      'Papadopoulos','+306912345678',  '18_24', 'Athens',          'GR', 'explorer', '{fun_places,nightlife,local_spots}','spontaneous', 'local',       'last_minute', 'budget', '{no_wifi}',              true),
  ('tranminh.hn@gmail.com',         'Tran',      'Minh',       '+84912345678',    '25_34', 'Hanoi',           'VN', 'explorer', '{local_spots,nature,dining}',       'spontaneous', 'local',       'flexible',    'budget', '{no_wifi}',              true),
  ('mia.petrov@outlook.com',        'Mia',       'Petrov',     '+35921234567',    '25_34', 'Sofia',           'BG', 'explorer', '{nature,historical,local_spots}',   'researched',  'local',       'flexible',    'budget', '{no_wifi}',              true),
  ('viktor.sokolov@outlook.com',    'Viktor',    'Sokolov',    '+79211234567',    '35_44', 'Novosibirsk',     'RU', 'explorer', '{historical,local_spots,nature}',   'researched',  'local',       'flexible',    'mid',    '{no_wifi}',              true),
  ('lucas.andersen.dk@gmail.com',   'Lucas',     'Andersen',   '+4512345678',     '25_34', 'Copenhagen',      'DK', 'explorer', '{nature,local_spots,dining}',       'spontaneous', 'local',       'flexible',    'mid',    '{no_wifi}',              true),

  -- ── Culture buffs ─────────────────────────────────────────────────────
  ('jonathan.hughes@outlook.com',   'Jonathan',  'Hughes',     '+12125551234',    '45_54', 'New York',        'US', 'explorer', '{historical,top_places,dining}',    'researched',  'adventurous', 'far_ahead',   'mid',    '{noisy_area,smoking}',   true),
  ('yuki.w@outlook.jp',             'Yuki',      'Watanabe',   '+817012345678',   '35_44', 'Kyoto',           'JP', 'comfort',  '{historical,wellness,local_spots}', 'researched',  'local',       'far_ahead',   'mid',    '{noisy_area,smoking}',   true),
  ('pita.khumalo@gmail.com',        'Pita',      'Khumalo',    '+27821234567',    '35_44', 'Cape Town',       'ZA', 'explorer', '{historical,local_spots,nature}',   'researched',  'adventurous', 'flexible',    'mid',    '{}',                     true),
  ('helena.kovac@gmail.com',        'Helena',    'Kovac',      '+38591234567',    '35_44', 'Zagreb',          'HR', 'explorer', '{historical,local_spots,dining}',   'researched',  'local',       'flexible',    'mid',    '{smoking}',              true),
  ('rahul.kapoor@gmail.com',        'Rahul',     'Kapoor',     '+919123456789',   '35_44', 'New Delhi',       'IN', 'explorer', '{historical,local_spots,dining}',   'researched',  'dietary',     'far_ahead',   'mid',    '{smoking,no_ac}',        true),
  ('valentina.greco@libero.it',     'Valentina', 'Greco',      '+393801234567',   '45_54', 'Florence',        'IT', 'comfort',  '{historical,dining,wellness}',      'researched',  'local',       'far_ahead',   'luxury', '{noisy_area,smoking}',   true),
  ('ahmad.rashid.kl@gmail.com',     'Ahmad',     'Rashid',     '+60112345678',    '35_44', 'Kuala Lumpur',    'MY', 'explorer', '{historical,local_spots,dining}',   'researched',  'dietary',     'flexible',    'mid',    '{smoking}',              true),
  ('ingrid.l@gmail.com',            'Ingrid',    'Lindqvist',  '+46731234567',    '45_54', 'Stockholm',       'SE', 'comfort',  '{historical,wellness,dining}',      'researched',  'local',       'far_ahead',   'mid',    '{noisy_area}',           true),
  ('pierre.laurent@gmail.com',      'Pierre',    'Laurent',    '+33623456789',    '55_64', 'Bordeaux',        'FR', 'comfort',  '{historical,dining,top_places}',    'researched',  'local',       'far_ahead',   'luxury', '{noisy_area,smoking}',   true),
  ('maywong.hk@gmail.com',          'May',       'Wong',       '+85261234567',    '45_54', 'Hong Kong',       'HK', 'explorer', '{historical,shopping,dining}',      'researched',  'local',       'far_ahead',   'luxury', '{no_wifi,no_ac}',        true),
  ('claudia.munoz.cl@gmail.com',    'Claudia',   'Munoz',      '+56912345678',    '35_44', 'Santiago',        'CL', 'explorer', '{historical,nature,local_spots}',   'researched',  'local',       'flexible',    'mid',    '{}',                     true),
  ('kevin.lim.sg@gmail.com',        'Kevin',     'Lim',        '+6581234567',     '35_44', 'Singapore',       'SG', 'explorer', '{dining,top_places,nightlife}',     'researched',  'adventurous', 'flexible',    'luxury', '{no_wifi}',              true),

  -- ── Wellness seekers ──────────────────────────────────────────────────
  ('laura.bennett@icloud.com',      'Laura',     'Bennett',    '+447811234567',   '35_44', 'Bristol',         'GB', 'comfort',  '{wellness,nature,dining}',          'researched',  'dietary',     'far_ahead',   'luxury', '{smoking,noisy_area}',   true),
  ('kaito.n@gmail.com',             'Kaito',     'Nakamura',   '+819512345678',   '35_44', 'Tokyo',           'JP', 'comfort',  '{wellness,nature,local_spots}',     'researched',  'local',       'far_ahead',   'luxury', '{smoking,noisy_area}',   true),
  ('nina.hansen.dk@gmail.com',      'Nina',      'Hansen',     '+4531234567',     '35_44', 'Copenhagen',      'DK', 'comfort',  '{wellness,dining,nature}',          'researched',  'dietary',     'far_ahead',   'mid',    '{smoking}',              true),
  ('mturner@outlook.com',           'Michael',   'Turner',     '+14155551234',    '45_54', 'San Francisco',   'US', 'comfort',  '{wellness,dining,top_places}',      'researched',  'dietary',     'far_ahead',   'luxury', '{smoking,no_gym}',       true),
  ('sakura.ito@gmail.com',          'Sakura',    'Ito',        '+817512345678',   '25_34', 'Nagoya',          'JP', 'comfort',  '{wellness,local_spots,dining}',     'researched',  'local',       'far_ahead',   'mid',    '{smoking}',              true),
  ('rebecca.cohen.il@gmail.com',    'Rebecca',   'Cohen',      '+97250123456',    '45_54', 'Tel Aviv',        'IL', 'comfort',  '{wellness,dining,nature}',          'researched',  'dietary',     'far_ahead',   'luxury', '{smoking,noisy_area}',   true),
  ('sven.nielsen.dk@gmail.com',     'Sven',      'Nielsen',    '+4541234567',     '45_54', 'Aarhus',          'DK', 'comfort',  '{wellness,nature,local_spots}',     'researched',  'local',       'far_ahead',   'mid',    '{smoking,noisy_area}',   true),
  ('alicia.garcia.es@gmail.com',    'Alicia',    'Garcia',     '+34612345678',    '35_44', 'Barcelona',       'ES', 'explorer', '{wellness,dining,nature}',          'researched',  'local',       'flexible',    'mid',    '{smoking}',              true),
  ('junwei.bj@outlook.com',         'Jun',       'Wei',        '+8613912345678',  '35_44', 'Beijing',         'CN', 'explorer', '{wellness,top_places,dining}',      'researched',  'local',       'far_ahead',   'luxury', '{no_wifi,smoking}',      true),
  ('clare.obrien.ie@gmail.com',     'Clare',     'OBrien',     '+35386234567',    '35_44', 'Cork',            'IE', 'comfort',  '{wellness,nature,local_spots}',     'researched',  'local',       'flexible',    'mid',    '{smoking}',              true),

  -- ── Nightlife lovers ──────────────────────────────────────────────────
  ('max.richter.de@gmail.com',      'Max',       'Richter',    '+4915101234567',  '18_24', 'Hamburg',         'DE', 'explorer', '{nightlife,fun_places,dining}',     'spontaneous', 'adventurous', 'last_minute', 'mid',    '{no_wifi}',              true),
  ('jasmin.s.se@gmail.com',         'Jasmin',    'Svensson',   '+46741234567',    '25_34', 'Malmo',           'SE', 'explorer', '{nightlife,dining,shopping}',       'spontaneous', 'adventurous', 'last_minute', 'mid',    '{no_wifi}',              true),
  ('diego.fernandez@hotmail.es',    'Diego',     'Fernandez',  '+34662345678',    '25_34', 'Madrid',          'ES', 'explorer', '{nightlife,dining,local_spots}',    'spontaneous', 'local',       'last_minute', 'mid',    '{}',                     true),
  ('aaliya.bangura@gmail.com',      'Aaliya',    'Bangura',    '+44208123456',    '25_34', 'London',          'GB', 'explorer', '{nightlife,shopping,dining}',       'spontaneous', 'adventurous', 'flexible',    'mid',    '{no_wifi}',              true),
  ('leon.dupont.fr@gmail.com',      'Leon',      'Dupont',     '+33745678901',    '25_34', 'Paris',           'FR', 'explorer', '{nightlife,dining,local_spots}',    'spontaneous', 'adventurous', 'last_minute', 'mid',    '{}',                     true),
  ('thabo.molefe@gmail.com',        'Thabo',     'Molefe',     '+27761234567',    '25_34', 'Johannesburg',    'ZA', 'explorer', '{nightlife,fun_places,local_spots}','spontaneous', 'adventurous', 'last_minute', 'mid',    '{no_wifi}',              true),
  ('yujin.choi.kr@naver.com',       'Yu-Jin',    'Choi',       '+821112345678',   '18_24', 'Busan',           'KR', 'explorer', '{nightlife,shopping,dining}',       'spontaneous', 'adventurous', 'last_minute', 'mid',    '{no_wifi}',              true),
  ('sasha.ivanova.ru@gmail.com',    'Sasha',     'Ivanova',    '+79031234567',    '25_34', 'St Petersburg',   'RU', 'explorer', '{nightlife,historical,dining}',     'spontaneous', 'adventurous', 'flexible',    'mid',    '{no_wifi}',              true),

  -- ── Family travellers ─────────────────────────────────────────────────
  ('chris.stewart@outlook.com',     'Christine', 'Stewart',    '+16135551234',    '35_44', 'Ottawa',          'CA', 'comfort',  '{family,nature,fun_places}',        'researched',  'familiar',    'far_ahead',   'mid',    '{smoking,noisy_area}',   true),
  ('thomas.weber.de@gmail.com',     'Thomas',    'Weber',      '+4916012345678',  '35_44', 'Frankfurt',       'DE', 'comfort',  '{family,fun_places,nature}',        'researched',  'familiar',    'far_ahead',   'mid',    '{smoking,noisy_area}',   true),
  ('sunita.rao@gmail.com',          'Sunita',    'Rao',        '+919765432100',   '35_44', 'Chennai',         'IN', 'comfort',  '{family,historical,local_spots}',   'researched',  'dietary',     'far_ahead',   'mid',    '{smoking,no_ac}',        true),
  ('matt.wilson@icloud.com',        'Matthew',   'Wilson',     '+61445678901',    '45_54', 'Perth',           'AU', 'comfort',  '{family,nature,fun_places}',        'researched',  'familiar',    'far_ahead',   'mid',    '{smoking}',              true),
  ('hana.kovacs@gmail.com',         'Hana',      'Kovacs',     '+36301234567',    '35_44', 'Budapest',        'HU', 'explorer', '{family,historical,local_spots}',   'researched',  'local',       'far_ahead',   'mid',    '{smoking}',              true),
  ('roberto.esposito@gmail.com',    'Roberto',   'Esposito',   '+393201234567',   '45_54', 'Naples',          'IT', 'comfort',  '{family,dining,historical}',        'researched',  'local',       'far_ahead',   'mid',    '{smoking,noisy_area}',   true),
  ('minji.lee.kr@gmail.com',        'Min-Ji',    'Lee',        '+821512345678',   '35_44', 'Incheon',         'KR', 'comfort',  '{family,shopping,fun_places}',      'researched',  'familiar',    'far_ahead',   'mid',    '{smoking}',              true),
  ('patricia.nguyen@outlook.com',   'Patricia',  'Nguyen',     '+13105551234',    '45_54', 'Los Angeles',     'US', 'comfort',  '{family,fun_places,shopping}',      'researched',  'familiar',    'far_ahead',   'mid',    '{smoking,noisy_area}',   true),
  ('kwame.asante@gmail.com',        'Kwame',     'Asante',     '+233241234567',   '35_44', 'Accra',           'GH', 'explorer', '{family,local_spots,nature}',       'researched',  'local',       'far_ahead',   'budget', '{no_ac}',                true),
  ('nadia.aziz.kl@gmail.com',       'Nadia',     'Aziz',       '+60123456789',    '35_44', 'Kuala Lumpur',    'MY', 'comfort',  '{family,shopping,dining}',          'researched',  'dietary',     'far_ahead',   'mid',    '{smoking}',              true),

  -- ── Business / bleisure ───────────────────────────────────────────────
  ('richard.okonkwo@gmail.com',     'Richard',   'Okonkwo',    '+447001234567',   '45_54', 'London',          'GB', 'comfort',  '{dining,top_places,wellness}',      'researched',  'local',       'flexible',    'luxury', '{no_wifi,noisy_area}',   true),
  ('s.nilsson@outlook.se',          'Sandra',    'Nilsson',    '+46751234567',    '45_54', 'Stockholm',       'SE', 'comfort',  '{top_places,dining,wellness}',      'researched',  'local',       'flexible',    'luxury', '{no_wifi,no_gym}',       true),
  ('steph.leung@icloud.com',        'Stephanie', 'Leung',      '+85271234567',    '35_44', 'Hong Kong',       'HK', 'comfort',  '{dining,shopping,wellness}',        'researched',  'adventurous', 'flexible',    'luxury', '{no_wifi,noisy_area}',   true),
  ('aisha.alfarsi@gmail.com',       'Aisha',     'Al-Farsi',   '+97151234567',    '35_44', 'Abu Dhabi',       'AE', 'comfort',  '{shopping,dining,wellness}',        'researched',  'dietary',     'far_ahead',   'ultra',  '{smoking,no_ac}',        true),
  ('paul.dupre.ch@gmail.com',       'Paul',      'Dupre',      '+33756789012',    '45_54', 'Geneva',          'CH', 'comfort',  '{dining,top_places,wellness}',      'researched',  'local',       'far_ahead',   'ultra',  '{no_wifi,noisy_area}',   true),
  ('jiwoo.choi.kr@gmail.com',       'Ji-Woo',    'Choi',       '+821612345678',   '35_44', 'Seoul',           'KR', 'explorer', '{dining,top_places,shopping}',      'researched',  'adventurous', 'flexible',    'luxury', '{no_wifi}',              true),

  -- ── Budget backpackers ────────────────────────────────────────────────
  ('finn.mccarthy@gmail.com',       'Finn',      'McCarthy',   '+35387345678',    '18_24', 'Galway',          'IE', 'explorer', '{local_spots,fun_places,nature}',   'spontaneous', 'local',       'last_minute', 'budget', '{no_wifi}',              true),
  ('iris.dejong.nl@gmail.com',      'Iris',      'de Jong',    '+31612345678',    '18_24', 'Amsterdam',       'NL', 'explorer', '{local_spots,nature,dining}',       'spontaneous', 'adventurous', 'last_minute', 'budget', '{}',                     true),
  ('mateus.oliveira@hotmail.com',   'Mateus',    'Oliveira',   '+5521912345678',  '18_24', 'Rio de Janeiro',  'BR', 'explorer', '{fun_places,nightlife,nature}',     'spontaneous', 'local',       'last_minute', 'budget', '{no_wifi}',              true),
  ('anya.kowalski@wp.pl',           'Anya',      'Kowalski',   '+48501234567',    '18_24', 'Warsaw',          'PL', 'explorer', '{historical,local_spots,nightlife}','spontaneous', 'local',       'last_minute', 'budget', '{no_wifi}',              true),
  ('lola.martin.es@gmail.com',      'Lola',      'Martin',     '+34722345678',    '18_24', 'Valencia',        'ES', 'explorer', '{fun_places,nightlife,local_spots}','spontaneous', 'local',       'last_minute', 'budget', '{}',                     true),
  ('ben.osullivan.ie@gmail.com',    'Ben',       'OSullivan',  '+35387123456',    '25_34', 'Dublin',          'IE', 'explorer', '{nightlife,local_spots,dining}',    'spontaneous', 'local',       'last_minute', 'mid',    '{}',                     true),
  ('amara.diallo@gmail.com',        'Amara',     'Diallo',     '+221771234567',   '25_34', 'Dakar',           'SN', 'explorer', '{local_spots,nature,dining}',       'spontaneous', 'local',       'flexible',    'budget', '{no_ac}',                true),

  -- ── Incomplete profiles (onboarding drop-off) ─────────────────────────
  ('kai.suzuki@gmail.com',          'Kai',       'Suzuki',     '+819712345678',   '18_24', 'Tokyo',           'JP', 'explorer', '{fun_places,dining}',               'spontaneous', 'adventurous', 'last_minute', 'budget', '{}',                     false),
  ('bianca.marini@libero.it',       'Bianca',    'Marini',     '+393601234567',   '18_24', 'Turin',           'IT', 'explorer', '{shopping,dining}',                 'spontaneous', 'local',       'flexible',    'budget', '{}',                     false),
  ('tyler.barnes@yahoo.com',        'Tyler',     'Barnes',     '+17735551234',    '18_24', 'Chicago',         'US', 'explorer', '{nightlife,fun_places}',             'spontaneous', 'adventurous', 'last_minute', 'budget', '{}',                     false),
  ('zara.khan92@gmail.com',         'Zara',      'Khan',       '+447912345678',   '25_34', 'Birmingham',      'GB', 'explorer', '{shopping,dining,wellness}',        'researched',  'dietary',     'flexible',    'mid',    '{smoking}',              false),
  ('naomi.hayashi@gmail.com',       'Naomi',     'Hayashi',    '+819012345679',   '25_34', 'Fukuoka',         'JP', 'explorer', '{dining,local_spots}',              'researched',  'local',       'flexible',    'mid',    '{smoking}',              false),
  ('sam.adeyemi@gmail.com',         'Sam',       'Adeyemi',    '+2347012345678',  '25_34', 'Abuja',           'NG', 'explorer', '{local_spots,dining}',              'spontaneous', 'local',       'flexible',    'budget', '{}',                     false),
  ('felix.braun.de@gmail.com',      'Felix',     'Braun',      '+4916212345678',  '18_24', 'Cologne',         'DE', 'explorer', '{nightlife,fun_places}',             'spontaneous', 'adventurous', 'last_minute', 'budget', '{no_wifi}',              false),
  ('tanaka.ren@yahoo.co.jp',        'Tanaka',    'Ren',        '+818512345678',   '18_24', 'Sapporo',         'JP', 'explorer', '{local_spots,nature}',              'spontaneous', 'local',       'last_minute', 'budget', '{}',                     false)
),

-- ── Step 1: auth.users ────────────────────────────────────────────────────────
new_auth as (
  insert into auth.users (
    instance_id, id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    is_super_admin, is_sso_user
  )
  select
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    s.email,
    p.hash,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('first_name', s.firstname, 'last_name', s.lastname),
    now(),
    now(),
    false,
    false
  from seed s, pwd p
  on conflict (email) do nothing
  returning id, email
),

-- ── Step 2: public.users ──────────────────────────────────────────────────────
new_users as (
  insert into public.users (id, firstname, lastname, email, phone, role)
  select
    na.id,
    s.firstname,
    s.lastname,
    na.email,
    s.phone,
    'guest'
  from new_auth na
  join seed s using (email)
  on conflict (id) do nothing
  returning id, email
)

-- ── Step 3: user_profiles ─────────────────────────────────────────────────────
insert into public.user_profiles (
  user_id,
  age_band, location_city, location_country,
  novelty, vibe,
  discovery, food, planning, spend,
  dealbreakers,
  completed, completed_at,
  region_id
)
select
  nu.id,
  s.age_band,
  s.city,
  s.country,
  s.novelty,
  s.vibes::text[],
  s.discovery,
  s.food,
  s.planning,
  s.spend,
  s.dealbreakers::text[],
  s.completed,
  case when s.completed then now() else null end,
  -- randomly assign an active region
  (select id from public.regions where is_active = true order by random() limit 1)
from new_users nu
join seed s using (email)
on conflict (user_id) do nothing;
