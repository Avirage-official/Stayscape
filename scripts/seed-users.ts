#!/usr/bin/env npx tsx
/**
 * Seed 100 simulated guest users into Stayscape.
 *
 * Usage:
 *   npx tsx scripts/seed-users.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * The script uses supabase.auth.admin.createUser() to let Supabase
 * generate the UUID, then uses that UUID for public.users and user_profiles.
 * All users get the password: Stayscape2024!
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// ── Load .env.local ───────────────────────────────────────────────────────────

try {
  const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#\s][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch { /* fall through to process.env */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'Stayscape2024!';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserSeed {
  firstName:    string;
  lastName:     string;
  email:        string;
  phone?:       string;
  ageBand:      string;
  city:         string;
  country:      string;
  novelty:      string;
  vibes:        string[];
  discovery:    string;
  food:         string;
  planning:     string;
  spend:        string;
  dealbreakers: string[];
  completed:    boolean;
}

// ── 100 Simulated Users ───────────────────────────────────────────────────────

const USERS: UserSeed[] = [
  // ── Luxury travellers ─────────────────────────────────────────────────────
  { firstName: 'Sophia',    lastName: 'Harrington', email: 'sophia.harrington@gmail.com',   phone: '+447911123456',    ageBand: '35_44', city: 'London',        country: 'GB', novelty: 'explorer', vibes: ['dining','wellness','top_places'],     discovery: 'researched',  food: 'adventurous', planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['no_ac','noisy_area'],     completed: true  },
  { firstName: 'James',     lastName: 'Blackwood',  email: 'j.blackwood@icloud.com',        phone: '+447922234567',    ageBand: '45_54', city: 'Edinburgh',     country: 'GB', novelty: 'comfort',  vibes: ['dining','historical','top_places'], discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'ultra',  dealbreakers: ['noisy_area','no_gym'],    completed: true  },
  { firstName: 'Isabelle',  lastName: 'Moreau',     email: 'isabelle.moreau@outlook.fr',    phone: '+33612345678',     ageBand: '35_44', city: 'Paris',         country: 'FR', novelty: 'explorer', vibes: ['dining','shopping','wellness'],     discovery: 'researched',  food: 'adventurous', planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Alexander', lastName: 'Schmidt',    email: 'a.schmidt@gmail.com',           phone: '+4915201234567',   ageBand: '45_54', city: 'Munich',        country: 'DE', novelty: 'comfort',  vibes: ['historical','dining','top_places'], discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['smoking','noisy_area'],   completed: true  },
  { firstName: 'Natasha',   lastName: 'Volkov',     email: 'natasha.v@hotmail.com',         phone: '+79161234567',     ageBand: '25_34', city: 'Moscow',        country: 'RU', novelty: 'explorer', vibes: ['nightlife','shopping','dining'],    discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'luxury', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'William',   lastName: 'Chen',       email: 'will.chen.hk@gmail.com',        phone: '+85291234567',     ageBand: '35_44', city: 'Hong Kong',     country: 'HK', novelty: 'explorer', vibes: ['dining','top_places','local_spots'],discovery: 'spontaneous', food: 'adventurous', planning: 'flexible',    spend: 'luxury', dealbreakers: ['no_ac'],                 completed: true  },
  { firstName: 'Amelia',    lastName: 'Foster',     email: 'amelia.foster@gmail.com',       phone: '+12025551234',     ageBand: '45_54', city: 'New York',      country: 'US', novelty: 'comfort',  vibes: ['wellness','dining','shopping'],     discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'ultra',  dealbreakers: ['no_gym','smoking'],       completed: true  },
  { firstName: 'Marco',     lastName: 'Bianchi',    email: 'marco.bianchi@gmail.com',       phone: '+393312345678',    ageBand: '35_44', city: 'Milan',         country: 'IT', novelty: 'explorer', vibes: ['dining','historical','nightlife'],  discovery: 'spontaneous', food: 'local',       planning: 'flexible',    spend: 'luxury', dealbreakers: ['no_wifi','no_ac'],       completed: true  },
  { firstName: 'Catherine', lastName: 'Dubois',     email: 'cat.dubois@yahoo.fr',           phone: '+33698765432',     ageBand: '55_64', city: 'Lyon',          country: 'FR', novelty: 'comfort',  vibes: ['dining','historical','wellness'],   discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['noisy_area','smoking'],   completed: true  },
  { firstName: 'Hiroshi',   lastName: 'Tanaka',     email: 'h.tanaka@outlook.jp',           phone: '+819012345678',    ageBand: '45_54', city: 'Tokyo',         country: 'JP', novelty: 'explorer', vibes: ['local_spots','dining','top_places'],discovery: 'researched',  food: 'adventurous', planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['smoking','noisy_area'],   completed: true  },
  { firstName: 'Mei',       lastName: 'Liu',        email: 'mei.liu.sh@gmail.com',          phone: '+8613812345678',   ageBand: '35_44', city: 'Shanghai',      country: 'CN', novelty: 'explorer', vibes: ['shopping','dining','top_places'],   discovery: 'researched',  food: 'adventurous', planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['no_wifi','no_ac'],       completed: true  },
  { firstName: 'Anika',     lastName: 'Patel',      email: 'anika.patel@hotmail.com',       phone: '+4420123456789',   ageBand: '25_34', city: 'London',        country: 'GB', novelty: 'explorer', vibes: ['dining','wellness','shopping'],     discovery: 'researched',  food: 'adventurous', planning: 'flexible',    spend: 'mid',    dealbreakers: [],                        completed: true  },
  { firstName: 'Wei',       lastName: 'Huang',      email: 'wei.huang.sg@gmail.com',        phone: '+6592345678',      ageBand: '35_44', city: 'Singapore',     country: 'SG', novelty: 'comfort',  vibes: ['dining','shopping','wellness'],     discovery: 'researched',  food: 'adventurous', planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Fatima',    lastName: 'Al-Hassan',  email: 'fatima.alhassan@gmail.com',     phone: '+97150123456',     ageBand: '35_44', city: 'Dubai',         country: 'AE', novelty: 'explorer', vibes: ['dining','shopping','top_places'],   discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['smoking','no_ac'],       completed: true  },
  { firstName: 'Daniel',    lastName: 'Müller',     email: 'daniel.muller.ch@gmail.com',    phone: '+4916112345678',   ageBand: '35_44', city: 'Zurich',        country: 'CH', novelty: 'comfort',  vibes: ['top_places','dining','wellness'],   discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'ultra',  dealbreakers: ['no_wifi','no_gym'],       completed: true  },

  // ── Foodie explorers ──────────────────────────────────────────────────────
  { firstName: 'Ryan',      lastName: 'Nguyen',     email: 'ryan.nguyen.sf@gmail.com',      phone: '+16505551234',     ageBand: '25_34', city: 'San Francisco', country: 'US', novelty: 'explorer', vibes: ['dining','local_spots','fun_places'],discovery: 'researched',  food: 'adventurous', planning: 'flexible',    spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Giulia',    lastName: 'Romano',     email: 'giulia.romano@outlook.com',     phone: '+39331234567',     ageBand: '35_44', city: 'Rome',          country: 'IT', novelty: 'explorer', vibes: ['dining','historical','local_spots'],discovery: 'spontaneous', food: 'local',       planning: 'flexible',    spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Kenji',     lastName: 'Yamamoto',   email: 'kenji.yama@gmail.com',          phone: '+818012345678',    ageBand: '25_34', city: 'Osaka',         country: 'JP', novelty: 'explorer', vibes: ['dining','nightlife','fun_places'],  discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Hannah',    lastName: 'Wright',     email: 'h.wright@yahoo.co.uk',          phone: '+447733123456',    ageBand: '35_44', city: 'Manchester',    country: 'GB', novelty: 'explorer', vibes: ['dining','local_spots','shopping'],  discovery: 'researched',  food: 'adventurous', planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['no_wifi','smoking'],     completed: true  },
  { firstName: 'Oliver',    lastName: 'Thompson',   email: 'o.thompson.au@gmail.com',       phone: '+61412345678',     ageBand: '25_34', city: 'Sydney',        country: 'AU', novelty: 'explorer', vibes: ['dining','nature','fun_places'],     discovery: 'spontaneous', food: 'adventurous', planning: 'flexible',    spend: 'mid',    dealbreakers: [],                        completed: true  },
  { firstName: 'Ana',       lastName: 'Silva',      email: 'ana.silva.br@gmail.com',        phone: '+5511912345678',   ageBand: '25_34', city: 'São Paulo',     country: 'BR', novelty: 'explorer', vibes: ['dining','nightlife','local_spots'], discovery: 'spontaneous', food: 'local',       planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Sung-Jin',  lastName: 'Park',       email: 'sungjin.park@naver.com',        phone: '+821012345678',    ageBand: '25_34', city: 'Seoul',         country: 'KR', novelty: 'explorer', vibes: ['dining','shopping','nightlife'],    discovery: 'researched',  food: 'adventurous', planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Tom',       lastName: 'Bradley',    email: 'tom.bradley@outlook.com',       phone: '+16175551234',     ageBand: '45_54', city: 'Boston',        country: 'US', novelty: 'comfort',  vibes: ['dining','historical','top_places'], discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['noisy_area'],            completed: true  },
  { firstName: 'Yasmin',    lastName: 'Osman',      email: 'yasmin.osman.au@gmail.com',     phone: '+61423456789',     ageBand: '25_34', city: 'Melbourne',     country: 'AU', novelty: 'explorer', vibes: ['dining','wellness','local_spots'],  discovery: 'researched',  food: 'adventurous', planning: 'flexible',    spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'David',     lastName: 'Kim',        email: 'david.kim.sg@gmail.com',        phone: '+6591234567',      ageBand: '25_34', city: 'Singapore',     country: 'SG', novelty: 'explorer', vibes: ['dining','local_spots','nightlife'], discovery: 'spontaneous', food: 'adventurous', planning: 'flexible',    spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Priya',     lastName: 'Sharma',     email: 'priya.sharma91@gmail.com',      phone: '+919876543210',    ageBand: '25_34', city: 'Mumbai',        country: 'IN', novelty: 'explorer', vibes: ['shopping','dining','fun_places'],   discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Amara',     lastName: 'Diallo',     email: 'amara.diallo@gmail.com',        phone: '+221771234567',    ageBand: '25_34', city: 'Dakar',         country: 'SN', novelty: 'explorer', vibes: ['local_spots','nature','dining'],    discovery: 'spontaneous', food: 'local',       planning: 'flexible',    spend: 'budget', dealbreakers: ['no_ac'],                 completed: true  },

  // ── Adventure seekers ─────────────────────────────────────────────────────
  { firstName: 'Jake',      lastName: 'Morrison',   email: 'jake.morrison@gmail.com',       phone: '+16045551234',     ageBand: '18_24', city: 'Vancouver',     country: 'CA', novelty: 'explorer', vibes: ['nature','fun_places','local_spots'],discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Emma',      lastName: 'Johansson',  email: 'emma.j.se@gmail.com',           phone: '+46701234567',     ageBand: '25_34', city: 'Stockholm',     country: 'SE', novelty: 'explorer', vibes: ['nature','wellness','local_spots'],  discovery: 'spontaneous', food: 'local',       planning: 'flexible',    spend: 'mid',    dealbreakers: [],                        completed: true  },
  { firstName: 'Arjun',     lastName: 'Mehta',      email: 'arjun.mehta@gmail.com',         phone: '+919898765432',    ageBand: '25_34', city: 'Bangalore',     country: 'IN', novelty: 'explorer', vibes: ['nature','fun_places','local_spots'],discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Sarah',     lastName: 'McAllister', email: 's.mcallister@icloud.com',       phone: '+61434567890',     ageBand: '25_34', city: 'Brisbane',      country: 'AU', novelty: 'explorer', vibes: ['nature','fun_places','dining'],     discovery: 'spontaneous', food: 'adventurous', planning: 'flexible',    spend: 'mid',    dealbreakers: [],                        completed: true  },
  { firstName: 'Mikael',    lastName: 'Björk',      email: 'mikael.bjork@hotmail.com',      phone: '+46723456789',     ageBand: '35_44', city: 'Göteborg',      country: 'SE', novelty: 'explorer', vibes: ['nature','local_spots','dining'],    discovery: 'spontaneous', food: 'local',       planning: 'flexible',    spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Zoe',       lastName: 'Clarke',     email: 'zoe.clarke.nz@gmail.com',       phone: '+64211234567',     ageBand: '25_34', city: 'Auckland',      country: 'NZ', novelty: 'explorer', vibes: ['nature','fun_places','local_spots'],discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'budget', dealbreakers: [],                        completed: true  },
  { firstName: 'Rafi',      lastName: 'Santos',     email: 'rafi.santos@gmail.com',         phone: '+6389012345',      ageBand: '25_34', city: 'Manila',        country: 'PH', novelty: 'explorer', vibes: ['nature','fun_places','local_spots'],discovery: 'spontaneous', food: 'local',       planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Astrid',    lastName: 'Larsen',     email: 'astrid.larsen@gmail.com',       phone: '+4540123456',      ageBand: '25_34', city: 'Oslo',          country: 'NO', novelty: 'explorer', vibes: ['nature','wellness','local_spots'],  discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'mid',    dealbreakers: [],                        completed: true  },
  { firstName: 'Chidi',     lastName: 'Okafor',     email: 'chidi.okafor@gmail.com',        phone: '+2348012345678',   ageBand: '25_34', city: 'Lagos',         country: 'NG', novelty: 'explorer', vibes: ['fun_places','nightlife','local_spots'],discovery: 'spontaneous',food: 'adventurous', planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi','no_ac'],       completed: true  },
  { firstName: 'Lena',      lastName: 'Fischer',    email: 'lena.fischer.de@gmail.com',     phone: '+4915301234567',   ageBand: '25_34', city: 'Berlin',        country: 'DE', novelty: 'explorer', vibes: ['nightlife','local_spots','fun_places'],discovery: 'spontaneous',food: 'adventurous', planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Niko',      lastName: 'Papadopoulos',email: 'niko.papa@hotmail.com',        phone: '+306912345678',    ageBand: '18_24', city: 'Athens',        country: 'GR', novelty: 'explorer', vibes: ['fun_places','nightlife','local_spots'],discovery: 'spontaneous',food: 'local',       planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Tran',      lastName: 'Minh',       email: 'tranminh.hn@gmail.com',         phone: '+84912345678',     ageBand: '25_34', city: 'Hanoi',         country: 'VN', novelty: 'explorer', vibes: ['local_spots','nature','dining'],    discovery: 'spontaneous', food: 'local',       planning: 'flexible',    spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Mia',       lastName: 'Petrov',     email: 'mia.petrov@outlook.com',        phone: '+35921234567',     ageBand: '25_34', city: 'Sofia',         country: 'BG', novelty: 'explorer', vibes: ['nature','historical','local_spots'], discovery: 'researched',  food: 'local',       planning: 'flexible',    spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Viktor',    lastName: 'Sokolov',    email: 'viktor.sokolov@outlook.com',    phone: '+79211234567',     ageBand: '35_44', city: 'Novosibirsk',   country: 'RU', novelty: 'explorer', vibes: ['historical','local_spots','nature'], discovery: 'researched',  food: 'local',       planning: 'flexible',    spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Lucas',     lastName: 'Andersen',   email: 'lucas.andersen.dk@gmail.com',   phone: '+4512345678',      ageBand: '25_34', city: 'Copenhagen',    country: 'DK', novelty: 'explorer', vibes: ['nature','local_spots','dining'],    discovery: 'spontaneous', food: 'local',       planning: 'flexible',    spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },

  // ── Culture buffs ─────────────────────────────────────────────────────────
  { firstName: 'Jonathan',  lastName: 'Hughes',     email: 'jonathan.hughes@outlook.com',   phone: '+12125551234',     ageBand: '45_54', city: 'New York',      country: 'US', novelty: 'explorer', vibes: ['historical','top_places','dining'], discovery: 'researched',  food: 'adventurous', planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['noisy_area','smoking'],   completed: true  },
  { firstName: 'Yuki',      lastName: 'Watanabe',   email: 'yuki.w@outlook.jp',             phone: '+817012345678',    ageBand: '35_44', city: 'Kyoto',         country: 'JP', novelty: 'comfort',  vibes: ['historical','wellness','local_spots'],discovery: 'researched', food: 'local',       planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['noisy_area','smoking'],   completed: true  },
  { firstName: 'Pita',      lastName: 'Khumalo',    email: 'pita.khumalo@gmail.com',        phone: '+27821234567',     ageBand: '35_44', city: 'Cape Town',     country: 'ZA', novelty: 'explorer', vibes: ['historical','local_spots','nature'],discovery: 'researched',  food: 'adventurous', planning: 'flexible',    spend: 'mid',    dealbreakers: [],                        completed: true  },
  { firstName: 'Helena',    lastName: 'Kovač',      email: 'helena.kovac@gmail.com',        phone: '+38591234567',     ageBand: '35_44', city: 'Zagreb',        country: 'HR', novelty: 'explorer', vibes: ['historical','local_spots','dining'], discovery: 'researched',  food: 'local',       planning: 'flexible',    spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Rahul',     lastName: 'Kapoor',     email: 'rahul.kapoor@gmail.com',        phone: '+919123456789',    ageBand: '35_44', city: 'New Delhi',     country: 'IN', novelty: 'explorer', vibes: ['historical','local_spots','dining'], discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking','no_ac'],       completed: true  },
  { firstName: 'Valentina', lastName: 'Greco',      email: 'valentina.greco@libero.it',     phone: '+393801234567',    ageBand: '45_54', city: 'Florence',      country: 'IT', novelty: 'comfort',  vibes: ['historical','dining','wellness'],   discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['noisy_area','smoking'],   completed: true  },
  { firstName: 'Ahmad',     lastName: 'Rashid',     email: 'ahmad.rashid.kl@gmail.com',     phone: '+60112345678',     ageBand: '35_44', city: 'Kuala Lumpur',  country: 'MY', novelty: 'explorer', vibes: ['historical','local_spots','dining'], discovery: 'researched',  food: 'dietary',     planning: 'flexible',    spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Ingrid',    lastName: 'Lindqvist',  email: 'ingrid.l@gmail.com',            phone: '+46731234567',     ageBand: '45_54', city: 'Stockholm',     country: 'SE', novelty: 'comfort',  vibes: ['historical','wellness','dining'],   discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['noisy_area'],            completed: true  },
  { firstName: 'Pierre',    lastName: 'Laurent',    email: 'pierre.laurent@gmail.com',      phone: '+33623456789',     ageBand: '55_64', city: 'Bordeaux',      country: 'FR', novelty: 'comfort',  vibes: ['historical','dining','top_places'], discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['noisy_area','smoking'],   completed: true  },
  { firstName: 'May',       lastName: 'Wong',       email: 'maywong.hk@gmail.com',          phone: '+85261234567',     ageBand: '45_54', city: 'Hong Kong',     country: 'HK', novelty: 'explorer', vibes: ['historical','shopping','dining'],   discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['no_wifi','no_ac'],       completed: true  },
  { firstName: 'Claudia',   lastName: 'Muñoz',      email: 'claudia.munoz.cl@gmail.com',    phone: '+56912345678',     ageBand: '35_44', city: 'Santiago',      country: 'CL', novelty: 'explorer', vibes: ['historical','nature','local_spots'], discovery: 'researched',  food: 'local',       planning: 'flexible',    spend: 'mid',    dealbreakers: [],                        completed: true  },
  { firstName: 'Kevin',     lastName: 'Lim',        email: 'kevin.lim.sg@gmail.com',        phone: '+6581234567',      ageBand: '35_44', city: 'Singapore',     country: 'SG', novelty: 'explorer', vibes: ['dining','top_places','nightlife'],  discovery: 'researched',  food: 'adventurous', planning: 'flexible',    spend: 'luxury', dealbreakers: ['no_wifi'],               completed: true  },

  // ── Wellness seekers ──────────────────────────────────────────────────────
  { firstName: 'Laura',     lastName: 'Bennett',    email: 'laura.bennett@icloud.com',      phone: '+447811234567',    ageBand: '35_44', city: 'Bristol',       country: 'GB', novelty: 'comfort',  vibes: ['wellness','nature','dining'],       discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['smoking','noisy_area'],   completed: true  },
  { firstName: 'Kaito',     lastName: 'Nakamura',   email: 'kaito.n@gmail.com',             phone: '+819512345678',    ageBand: '35_44', city: 'Tokyo',         country: 'JP', novelty: 'comfort',  vibes: ['wellness','nature','local_spots'],  discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['smoking','noisy_area'],   completed: true  },
  { firstName: 'Nina',      lastName: 'Hansen',     email: 'nina.hansen.dk@gmail.com',      phone: '+4531234567',      ageBand: '35_44', city: 'Copenhagen',    country: 'DK', novelty: 'comfort',  vibes: ['wellness','dining','nature'],       discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Michael',   lastName: 'Turner',     email: 'mturner@outlook.com',           phone: '+14155551234',     ageBand: '45_54', city: 'San Francisco', country: 'US', novelty: 'comfort',  vibes: ['wellness','dining','top_places'],   discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['smoking','no_gym'],       completed: true  },
  { firstName: 'Sakura',    lastName: 'Ito',        email: 'sakura.ito@gmail.com',          phone: '+817512345678',    ageBand: '25_34', city: 'Nagoya',        country: 'JP', novelty: 'comfort',  vibes: ['wellness','local_spots','dining'],  discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Rebecca',   lastName: 'Cohen',      email: 'rebecca.cohen.il@gmail.com',    phone: '+97250123456',     ageBand: '45_54', city: 'Tel Aviv',      country: 'IL', novelty: 'comfort',  vibes: ['wellness','dining','nature'],       discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['smoking','noisy_area'],   completed: true  },
  { firstName: 'Sven',      lastName: 'Nielsen',    email: 'sven.nielsen.dk@gmail.com',     phone: '+4541234567',      ageBand: '45_54', city: 'Aarhus',        country: 'DK', novelty: 'comfort',  vibes: ['wellness','nature','local_spots'],  discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking','noisy_area'],   completed: true  },
  { firstName: 'Alicia',    lastName: 'Garcia',     email: 'alicia.garcia.es@gmail.com',    phone: '+34612345678',     ageBand: '35_44', city: 'Barcelona',     country: 'ES', novelty: 'explorer', vibes: ['wellness','dining','nature'],       discovery: 'researched',  food: 'local',       planning: 'flexible',    spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Jun',       lastName: 'Wei',        email: 'junwei.bj@outlook.com',         phone: '+8613912345678',   ageBand: '35_44', city: 'Beijing',       country: 'CN', novelty: 'explorer', vibes: ['wellness','top_places','dining'],   discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'luxury', dealbreakers: ['no_wifi','smoking'],     completed: true  },
  { firstName: 'Clare',     lastName: "O'Brien",    email: 'clare.obrien.ie@gmail.com',      phone: '+35386234567',     ageBand: '35_44', city: 'Cork',          country: 'IE', novelty: 'comfort',  vibes: ['wellness','nature','local_spots'],  discovery: 'researched',  food: 'local',       planning: 'flexible',    spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },

  // ── Nightlife lovers ──────────────────────────────────────────────────────
  { firstName: 'Max',       lastName: 'Richter',    email: 'max.richter.de@gmail.com',      phone: '+4915101234567',   ageBand: '18_24', city: 'Hamburg',       country: 'DE', novelty: 'explorer', vibes: ['nightlife','fun_places','dining'],  discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Jasmin',    lastName: 'Svensson',   email: 'jasmin.s.se@gmail.com',         phone: '+46741234567',     ageBand: '25_34', city: 'Malmö',         country: 'SE', novelty: 'explorer', vibes: ['nightlife','dining','shopping'],    discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Diego',     lastName: 'Fernandez',  email: 'diego.fernandez@hotmail.es',    phone: '+34662345678',     ageBand: '25_34', city: 'Madrid',        country: 'ES', novelty: 'explorer', vibes: ['nightlife','dining','local_spots'], discovery: 'spontaneous', food: 'local',       planning: 'last_minute', spend: 'mid',    dealbreakers: [],                        completed: true  },
  { firstName: 'Aaliya',    lastName: 'Bangura',    email: 'aaliya.bangura@gmail.com',      phone: '+44208123456',     ageBand: '25_34', city: 'London',        country: 'GB', novelty: 'explorer', vibes: ['nightlife','shopping','dining'],    discovery: 'spontaneous', food: 'adventurous', planning: 'flexible',    spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Leon',      lastName: 'Dupont',     email: 'leon.dupont.fr@gmail.com',      phone: '+33745678901',     ageBand: '25_34', city: 'Paris',         country: 'FR', novelty: 'explorer', vibes: ['nightlife','dining','local_spots'], discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'mid',    dealbreakers: [],                        completed: true  },
  { firstName: 'Thabo',     lastName: 'Molefe',     email: 'thabo.molefe@gmail.com',        phone: '+27761234567',     ageBand: '25_34', city: 'Johannesburg',  country: 'ZA', novelty: 'explorer', vibes: ['nightlife','fun_places','local_spots'],discovery: 'spontaneous',food: 'adventurous', planning: 'last_minute', spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Yu-Jin',    lastName: 'Choi',       email: 'yujin.choi.kr@naver.com',       phone: '+821112345678',    ageBand: '18_24', city: 'Busan',         country: 'KR', novelty: 'explorer', vibes: ['nightlife','shopping','dining'],    discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Sasha',     lastName: 'Ivanova',    email: 'sasha.ivanova.ru@gmail.com',    phone: '+79031234567',     ageBand: '25_34', city: 'St. Petersburg',country: 'RU', novelty: 'explorer', vibes: ['nightlife','historical','dining'],  discovery: 'spontaneous', food: 'adventurous', planning: 'flexible',    spend: 'mid',    dealbreakers: ['no_wifi'],               completed: true  },

  // ── Family travellers ─────────────────────────────────────────────────────
  { firstName: 'Christine', lastName: 'Stewart',    email: 'chris.stewart@outlook.com',     phone: '+16135551234',     ageBand: '35_44', city: 'Ottawa',        country: 'CA', novelty: 'comfort',  vibes: ['family','nature','fun_places'],     discovery: 'researched',  food: 'familiar',    planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking','noisy_area'],   completed: true  },
  { firstName: 'Thomas',    lastName: 'Weber',      email: 'thomas.weber.de@gmail.com',     phone: '+4916012345678',   ageBand: '35_44', city: 'Frankfurt',     country: 'DE', novelty: 'comfort',  vibes: ['family','fun_places','nature'],     discovery: 'researched',  food: 'familiar',    planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking','noisy_area'],   completed: true  },
  { firstName: 'Sunita',    lastName: 'Rao',        email: 'sunita.rao@gmail.com',          phone: '+919765432100',    ageBand: '35_44', city: 'Chennai',       country: 'IN', novelty: 'comfort',  vibes: ['family','historical','local_spots'],discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking','no_ac'],       completed: true  },
  { firstName: 'Matthew',   lastName: 'Wilson',     email: 'matt.wilson@icloud.com',        phone: '+61445678901',     ageBand: '45_54', city: 'Perth',         country: 'AU', novelty: 'comfort',  vibes: ['family','nature','fun_places'],     discovery: 'researched',  food: 'familiar',    planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Hana',      lastName: 'Kovacs',     email: 'hana.kovacs@gmail.com',         phone: '+36301234567',     ageBand: '35_44', city: 'Budapest',      country: 'HU', novelty: 'explorer', vibes: ['family','historical','local_spots'],discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Roberto',   lastName: 'Esposito',   email: 'roberto.esposito@gmail.com',    phone: '+393201234567',    ageBand: '45_54', city: 'Naples',        country: 'IT', novelty: 'comfort',  vibes: ['family','dining','historical'],     discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking','noisy_area'],   completed: true  },
  { firstName: 'Min-Ji',    lastName: 'Lee',        email: 'minji.lee.kr@gmail.com',        phone: '+821512345678',    ageBand: '35_44', city: 'Incheon',       country: 'KR', novelty: 'comfort',  vibes: ['family','shopping','fun_places'],   discovery: 'researched',  food: 'familiar',    planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },
  { firstName: 'Patricia',  lastName: 'Nguyen',     email: 'patricia.nguyen@outlook.com',   phone: '+13105551234',     ageBand: '45_54', city: 'Los Angeles',   country: 'US', novelty: 'comfort',  vibes: ['family','fun_places','shopping'],   discovery: 'researched',  food: 'familiar',    planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking','noisy_area'],   completed: true  },
  { firstName: 'Kwame',     lastName: 'Asante',     email: 'kwame.asante@gmail.com',        phone: '+233241234567',    ageBand: '35_44', city: 'Accra',         country: 'GH', novelty: 'explorer', vibes: ['family','local_spots','nature'],    discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'budget', dealbreakers: ['no_ac'],                 completed: true  },
  { firstName: 'Nadia',     lastName: 'Aziz',       email: 'nadia.aziz.kl@gmail.com',       phone: '+60123456789',     ageBand: '35_44', city: 'Kuala Lumpur',  country: 'MY', novelty: 'comfort',  vibes: ['family','shopping','dining'],       discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'mid',    dealbreakers: ['smoking'],               completed: true  },

  // ── Business / bleisure ───────────────────────────────────────────────────
  { firstName: 'Richard',   lastName: 'Okonkwo',    email: 'richard.okonkwo@gmail.com',     phone: '+447001234567',    ageBand: '45_54', city: 'London',        country: 'GB', novelty: 'comfort',  vibes: ['dining','top_places','wellness'],   discovery: 'researched',  food: 'local',       planning: 'flexible',    spend: 'luxury', dealbreakers: ['no_wifi','noisy_area'],   completed: true  },
  { firstName: 'Sandra',    lastName: 'Nilsson',    email: 's.nilsson@outlook.se',          phone: '+46751234567',     ageBand: '45_54', city: 'Stockholm',     country: 'SE', novelty: 'comfort',  vibes: ['top_places','dining','wellness'],   discovery: 'researched',  food: 'local',       planning: 'flexible',    spend: 'luxury', dealbreakers: ['no_wifi','no_gym'],       completed: true  },
  { firstName: 'Stephanie', lastName: 'Leung',      email: 'steph.leung@icloud.com',        phone: '+85271234567',     ageBand: '35_44', city: 'Hong Kong',     country: 'HK', novelty: 'comfort',  vibes: ['dining','shopping','wellness'],     discovery: 'researched',  food: 'adventurous', planning: 'flexible',    spend: 'luxury', dealbreakers: ['no_wifi','noisy_area'],   completed: true  },
  { firstName: 'Aisha',     lastName: 'Al-Farsi',   email: 'aisha.alfarsi@gmail.com',       phone: '+97151234567',     ageBand: '35_44', city: 'Abu Dhabi',     country: 'AE', novelty: 'comfort',  vibes: ['shopping','dining','wellness'],     discovery: 'researched',  food: 'dietary',     planning: 'far_ahead',   spend: 'ultra',  dealbreakers: ['smoking','no_ac'],       completed: true  },
  { firstName: 'Paul',      lastName: 'Dupré',      email: 'paul.dupre.ch@gmail.com',       phone: '+33756789012',     ageBand: '45_54', city: 'Geneva',        country: 'CH', novelty: 'comfort',  vibes: ['dining','top_places','wellness'],   discovery: 'researched',  food: 'local',       planning: 'far_ahead',   spend: 'ultra',  dealbreakers: ['no_wifi','noisy_area'],   completed: true  },
  { firstName: 'Ji-Woo',    lastName: 'Choi',       email: 'jiwoo.choi.kr@gmail.com',       phone: '+821612345678',    ageBand: '35_44', city: 'Seoul',         country: 'KR', novelty: 'explorer', vibes: ['dining','top_places','shopping'],   discovery: 'researched',  food: 'adventurous', planning: 'flexible',    spend: 'luxury', dealbreakers: ['no_wifi'],               completed: true  },

  // ── Budget backpackers ────────────────────────────────────────────────────
  { firstName: 'Finn',      lastName: 'McCarthy',   email: 'finn.mccarthy@gmail.com',       phone: '+35387345678',     ageBand: '18_24', city: 'Galway',        country: 'IE', novelty: 'explorer', vibes: ['local_spots','fun_places','nature'],discovery: 'spontaneous', food: 'local',       planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Iris',      lastName: 'de Jong',    email: 'iris.dejong.nl@gmail.com',      phone: '+31612345678',     ageBand: '18_24', city: 'Amsterdam',     country: 'NL', novelty: 'explorer', vibes: ['local_spots','nature','dining'],    discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'budget', dealbreakers: [],                        completed: true  },
  { firstName: 'Mateus',    lastName: 'Oliveira',   email: 'mateus.oliveira@hotmail.com',   phone: '+5521912345678',   ageBand: '18_24', city: 'Rio de Janeiro',country: 'BR', novelty: 'explorer', vibes: ['fun_places','nightlife','nature'],  discovery: 'spontaneous', food: 'local',       planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Anya',      lastName: 'Kowalski',   email: 'anya.kowalski@wp.pl',           phone: '+48501234567',     ageBand: '18_24', city: 'Warsaw',        country: 'PL', novelty: 'explorer', vibes: ['historical','local_spots','nightlife'],discovery: 'spontaneous',food: 'local',       planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi'],               completed: true  },
  { firstName: 'Lola',      lastName: 'Martín',     email: 'lola.martin.es@gmail.com',      phone: '+34722345678',     ageBand: '18_24', city: 'Valencia',      country: 'ES', novelty: 'explorer', vibes: ['fun_places','nightlife','local_spots'],discovery: 'spontaneous',food: 'local',       planning: 'last_minute', spend: 'budget', dealbreakers: [],                        completed: true  },
  { firstName: 'Ben',       lastName: "O'Sullivan", email: 'ben.osullivan.ie@gmail.com',     phone: '+35387123456',     ageBand: '25_34', city: 'Dublin',        country: 'IE', novelty: 'explorer', vibes: ['nightlife','local_spots','dining'],  discovery: 'spontaneous', food: 'local',       planning: 'last_minute', spend: 'mid',    dealbreakers: [],                        completed: true  },

  // ── Incomplete / newer profiles ───────────────────────────────────────────
  { firstName: 'Kai',       lastName: 'Suzuki',     email: 'kai.suzuki@gmail.com',          phone: '+819712345678',    ageBand: '18_24', city: 'Tokyo',         country: 'JP', novelty: 'explorer', vibes: ['fun_places','dining'],              discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'budget', dealbreakers: [],                        completed: false },
  { firstName: 'Bianca',    lastName: 'Marini',     email: 'bianca.marini@libero.it',       phone: '+393601234567',    ageBand: '18_24', city: 'Turin',         country: 'IT', novelty: 'explorer', vibes: ['shopping','dining'],                discovery: 'spontaneous', food: 'local',       planning: 'flexible',    spend: 'budget', dealbreakers: [],                        completed: false },
  { firstName: 'Tyler',     lastName: 'Barnes',     email: 'tyler.barnes@yahoo.com',        phone: '+17735551234',     ageBand: '18_24', city: 'Chicago',       country: 'US', novelty: 'explorer', vibes: ['nightlife','fun_places'],           discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'budget', dealbreakers: [],                        completed: false },
  { firstName: 'Zara',      lastName: 'Khan',       email: 'zara.khan92@gmail.com',         phone: '+447912345678',    ageBand: '25_34', city: 'Birmingham',    country: 'GB', novelty: 'explorer', vibes: ['shopping','dining','wellness'],     discovery: 'researched',  food: 'dietary',     planning: 'flexible',    spend: 'mid',    dealbreakers: ['smoking'],               completed: false },
  { firstName: 'Naomi',     lastName: 'Hayashi',    email: 'naomi.hayashi@gmail.com',       phone: '+819012345679',    ageBand: '25_34', city: 'Fukuoka',       country: 'JP', novelty: 'explorer', vibes: ['dining','local_spots'],             discovery: 'researched',  food: 'local',       planning: 'flexible',    spend: 'mid',    dealbreakers: ['smoking'],               completed: false },
  { firstName: 'Sam',       lastName: 'Adeyemi',    email: 'sam.adeyemi@gmail.com',         phone: '+2347012345678',   ageBand: '25_34', city: 'Abuja',         country: 'NG', novelty: 'explorer', vibes: ['local_spots','dining'],             discovery: 'spontaneous', food: 'local',       planning: 'flexible',    spend: 'budget', dealbreakers: [],                        completed: false },
  { firstName: 'Felix',     lastName: 'Braun',      email: 'felix.braun.de@gmail.com',      phone: '+4916212345678',   ageBand: '18_24', city: 'Cologne',       country: 'DE', novelty: 'explorer', vibes: ['nightlife','fun_places'],           discovery: 'spontaneous', food: 'adventurous', planning: 'last_minute', spend: 'budget', dealbreakers: ['no_wifi'],               completed: false },
  { firstName: 'Tanaka',    lastName: 'Ren',        email: 'tanaka.ren@yahoo.co.jp',        phone: '+818512345678',    ageBand: '18_24', city: 'Sapporo',       country: 'JP', novelty: 'explorer', vibes: ['local_spots','nature'],             discovery: 'spontaneous', food: 'local',       planning: 'last_minute', spend: 'budget', dealbreakers: [],                        completed: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function seedOne(seed: UserSeed, regionIds: string[]): Promise<boolean> {
  const regionId = regionIds.length
    ? regionIds[Math.floor(Math.random() * regionIds.length)]
    : null;

  // 1. Create Supabase Auth user — this generates the UUID
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email:         seed.email,
    password:      PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: seed.firstName, last_name: seed.lastName },
  });

  if (authErr) {
    process.stdout.write(`✗ auth: ${authErr.message}\n`);
    return false;
  }

  const uid = authData.user.id;

  // 2. Upsert public.users (a DB trigger may have already created it)
  const { error: userErr } = await supabase.from('users').upsert(
    { id: uid, firstname: seed.firstName, lastname: seed.lastName, email: seed.email, phone: seed.phone ?? null, role: 'guest' },
    { onConflict: 'id' },
  );
  if (userErr) process.stdout.write(` [users warn: ${userErr.message}]`);

  // 3. Insert user_profiles
  const { error: profErr } = await supabase.from('user_profiles').upsert(
    {
      user_id:          uid,
      age_band:         seed.ageBand,
      location_city:    seed.city,
      location_country: seed.country,
      novelty:          seed.novelty,
      vibe:             seed.vibes,
      discovery:        seed.discovery,
      food:             seed.food,
      planning:         seed.planning,
      spend:            seed.spend,
      dealbreakers:     seed.dealbreakers,
      completed:        seed.completed,
      completed_at:     seed.completed ? new Date().toISOString() : null,
      region_id:        regionId,
    },
    { onConflict: 'user_id' },
  );
  if (profErr) process.stdout.write(` [profile warn: ${profErr.message}]`);

  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀  Seeding 100 guest users into Stayscape\n');

  const { data: regions } = await supabase
    .from('regions')
    .select('id')
    .eq('is_active', true);
  const regionIds = (regions ?? []).map((r: { id: string }) => r.id);
  console.log(`📍  ${regionIds.length} active region(s) found — profiles will be randomly assigned\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < USERS.length; i++) {
    const s = USERS[i];
    process.stdout.write(`[${String(i + 1).padStart(3, '0')}/${USERS.length}] ${s.firstName} ${s.lastName} <${s.email}> ... `);
    const success = await seedOne(s, regionIds);
    if (success) { process.stdout.write('✓\n'); ok++; } else { fail++; }
    await sleep(300); // stay well under Supabase Auth rate limit
  }

  console.log(`\n✅  Finished — ${ok} created, ${fail} skipped`);
  if (fail > 0) console.log('   Skipped users likely already exist in auth.users (re-run is safe).');
}

main().catch(err => { console.error('\n❌ ', err); process.exit(1); });
