-- =====================================================
-- Ceremonie Wensen - Seed Data
-- File: sql/migrations/121_ceremonie_wensen_seeds.sql
-- =====================================================

\echo 'Migration 121: Seed ceremonie_wens data'

-- Insert standard ceremony wishes
INSERT INTO ihw.ceremonie_wens (code, naam, omschrijving, prijs_euro, gratis, volgorde, beschikbaar_voor_types) VALUES
  (
    'RINGEN',
    'Ringen uitwisselen',
    'Het bruidspaar wisselt de ringen uit tijdens de ceremonie, begeleid door de ambtenaar.',
    0.00,
    true,
    1,
    '[]'::jsonb -- Beschikbaar voor alle ceremonie types
  ),
  (
    'SPEECH',
    'Persoonlijke speech',
    'De ambtenaar leest jullie verhaal voor of geeft een korte toespraak.',
    0.00,
    true,
    2,
    '[]'::jsonb
  ),
  (
    'MUZIEK',
    'Muziek tijdens de ceremonie',
    'Live of opgenomen muziek naar keuze tijdens de ceremonie.',
    24.50,
    false,
    3,
    '[]'::jsonb
  ),
  (
    'BELLEN',
    'Bellen blazen bij vertrek',
    'Gasten blazen bellen wanneer het bruidspaar de trouwlocatie verlaat, voor een feestelijk moment.',
    24.50,
    false,
    4,
    '[]'::jsonb
  ),
  (
    'FOTOGRAAF',
    'Gemeentelijke fotograaf',
    'Officiële foto''s gemaakt door een gemeentelijke fotograaf tijdens de ceremonie.',
    75.00,
    false,
    5,
    '[]'::jsonb
  ),
  (
    'BLOEMEN',
    'Bloemstuk op tafel',
    'Een mooi bloemstuk op de tafel tijdens de ceremonie.',
    35.00,
    false,
    6,
    '[]'::jsonb
  ),
  (
    'LIVESTREAM',
    'Livestream ceremonie',
    'Livestream van de ceremonie zodat familie en vrienden op afstand kunnen meekijken.',
    50.00,
    false,
    7,
    '[]'::jsonb
  ),
  (
    'CHAMPAGNE',
    'Champagne toast',
    'Een champagne toast na de ceremonie voor het bruidspaar en gasten.',
    45.00,
    false,
    8,
    '["STANDAARD", "PREMIUM", "BUDGET"]'::jsonb -- Niet beschikbaar voor gratis ceremonies
  ),
  (
    'KINDEREN_CEREMONIE',
    'Ceremonie aangepast voor kinderen',
    'De ambtenaar past de ceremonie aan zodat kinderen er goed bij betrokken kunnen worden.',
    0.00,
    true,
    9,
    '[]'::jsonb
  ),
  (
    'GETUIGEN_SPEECH',
    'Getuigen mogen spreken',
    'Tijd voor getuigen om een korte speech te houden tijdens de ceremonie.',
    0.00,
    true,
    10,
    '["STANDAARD", "PREMIUM", "BUDGET"]'::jsonb -- Alleen voor ceremonies met voldoende tijd
  )
ON CONFLICT (code) DO NOTHING;

\echo '✅ Seeded ceremonie_wens data'

-- Show what was inserted
SELECT 
  code,
  naam,
  CASE 
    WHEN gratis THEN 'Gratis'
    ELSE '€ ' || prijs_euro::text
  END as prijs,
  actief,
  volgorde
FROM ihw.ceremonie_wens
ORDER BY volgorde;

