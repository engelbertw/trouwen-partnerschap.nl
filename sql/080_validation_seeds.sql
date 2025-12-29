-- ============================================================================
-- 080_VALIDATION_SEEDS.SQL
-- ============================================================================
-- Seed data voor validatieregels
-- Documenteert alle kwaliteitscontroles die worden toegepast
-- Schema: ihw (consistentie met andere applicatie tabellen)
-- ============================================================================

-- Kinderen validatieregels
INSERT INTO ihw.validatie_regel (regel_code, categorie, veld_naam, regel_type, beschrijving, technische_regel, foutmelding, rationale, wettelijke_basis, prioriteit) VALUES

-- KIND001: Voornamen verplicht
('KIND_VOORNAMEN_VEREIST', 'kind', 'voornamen', 'vereist',
 'Voornamen van het kind zijn verplicht',
 'voornamen !== null && voornamen.trim().length > 0',
 'Voer de voornamen van het kind in',
 'Nodig voor identificatie conform BRP',
 'Burgerlijk Wetboek Boek 1',
 1),

-- KIND002: Achternaam verplicht
('KIND_ACHTERNAAM_VEREIST', 'kind', 'achternaam', 'vereist',
 'Achternaam van het kind is verplicht',
 'achternaam !== null && achternaam.trim().length > 0',
 'Voer de achternaam van het kind in',
 'Nodig voor identificatie conform BRP',
 'Burgerlijk Wetboek Boek 1',
 1),

-- KIND003: Geboortedatum verplicht
('KIND_GEBOORTEDATUM_VEREIST', 'kind', 'geboortedatum', 'vereist',
 'Geboortedatum van het kind is verplicht',
 'geboortedatum !== null && geboortedatum !== ""',
 'Voer de geboortedatum van het kind in',
 'Nodig voor leeftijdsverificatie',
 'Burgerlijk Wetboek Boek 1',
 1),

-- KIND004: Geboortedatum formaat
('KIND_GEBOORTEDATUM_FORMAAT', 'kind', 'geboortedatum', 'formaat',
 'Geboortedatum moet in het formaat DD-MM-JJJJ zijn',
 'regex: /^\d{2}-\d{2}-\d{4}$/',
 'Gebruik het formaat DD-MM-JJJJ (bijvoorbeeld 15-03-2010)',
 'Standaardisatie voor datumnotatie',
 'Nederlandse datum conventie',
 1),

-- KIND005: Geboortedatum in verleden
('KIND_GEBOORTEDATUM_VERLEDEN', 'kind', 'geboortedatum', 'bereik',
 'Geboortedatum van het kind moet in het verleden liggen',
 'new Date(geboortedatum) < new Date()',
 'De geboortedatum kan niet in de toekomst liggen',
 'Logische controle - geboren kinderen hebben geboortedatum in verleden',
 'Logische consistentie',
 1),

-- KIND006: Kind jonger dan ouder (kritisch)
('KIND_JONGER_DAN_OUDER', 'kind', 'geboortedatum', 'relatie',
 'Kind moet jonger zijn dan de ouder',
 'kindGeboortedatum > ouderGeboortedatum',
 'De geboortedatum van het kind moet na de geboortedatum van de ouder liggen',
 'Biologisch onmogelijk dat kind ouder is dan ouder',
 'Logische consistentie',
 1),

-- KIND007: Ouder minimaal 12 jaar bij geboorte kind
('OUDER_MIN_LEEFTIJD_BIJ_GEBOORTE', 'kind', 'geboortedatum', 'relatie',
 'Ouder moet minimaal 12 jaar oud zijn geweest bij geboorte van het kind',
 '(kindGeboortedatum - ouderGeboortedatum) / (365.25 * 24 * 60 * 60 * 1000) >= 12',
 'De ouder moet minimaal 12 jaar oud zijn geweest bij de geboorte van het kind',
 'Biologische minimumleeftijd voor ouderschap',
 'Logische consistentie',
 1),

-- KIND008: Kind niet ouder dan 100 jaar
('KIND_MAX_LEEFTIJD', 'kind', 'geboortedatum', 'bereik',
 'Kind kan niet ouder zijn dan 100 jaar',
 '(new Date() - new Date(geboortedatum)) / (365.25 * 24 * 60 * 60 * 1000) <= 100',
 'Controleer de geboortedatum - deze lijkt onwaarschijnlijk oud',
 'Praktische controle op typfouten',
 'Logische consistentie',
 2),

-- KIND009: Achternaam komt overeen met een ouder
('KIND_ACHTERNAAM_OVEREENKOMST', 'kind', 'achternaam', 'logisch',
 'Achternaam van kind moet overeenkomen met achternaam van minimaal één ouder',
 'kindAchternaam === partner1Achternaam || kindAchternaam === partner2Achternaam || kindAchternaam === partner1GeboorteNaam || kindAchternaam === partner2GeboorteNaam',
 'De achternaam van het kind komt niet overeen met de achternaam van een van de ouders. Controleer of dit correct is.',
 'Kind neemt meestal achternaam van een ouder aan',
 'Burgerlijk Wetboek Boek 1, Titel 11',
 2);

-- Partner validatieregels
INSERT INTO ihw.validatie_regel (regel_code, categorie, veld_naam, regel_type, beschrijving, technische_regel, foutmelding, rationale, wettelijke_basis, prioriteit) VALUES

-- PARTNER001: Minimale leeftijd voor huwelijk
('PARTNER_MIN_LEEFTIJD_HUWELIJK', 'partner', 'geboortedatum', 'bereik',
 'Partner moet minimaal 18 jaar oud zijn om te trouwen',
 '(huwelijksdatum - geboortedatum) / (365.25 * 24 * 60 * 60 * 1000) >= 18',
 'U moet minimaal 18 jaar oud zijn om te kunnen trouwen',
 'Wettelijke minimumleeftijd voor huwelijk in Nederland',
 'Burgerlijk Wetboek Boek 1, Artikel 31',
 1),

-- PARTNER002: BSN formaat
('PARTNER_BSN_FORMAAT', 'partner', 'bsn', 'formaat',
 'BSN moet bestaan uit 8 of 9 cijfers',
 'regex: /^[0-9]{8,9}$/',
 'Een BSN bestaat uit 8 of 9 cijfers',
 'Standaard BSN formaat',
 'Wet algemene bepalingen burgerservicenummer',
 1),

-- PARTNER003: BSN elfproef
('PARTNER_BSN_ELFPROEF', 'partner', 'bsn', 'formaat',
 'BSN moet voldoen aan de 11-proef',
 'elfproef(bsn) === true',
 'Dit BSN-nummer is ongeldig (voldoet niet aan de 11-proef)',
 'BSN validatie volgens officiële regels',
 'Wet algemene bepalingen burgerservicenummer',
 1),

-- PARTNER004: Postcode formaat
('PARTNER_POSTCODE_FORMAAT', 'partner', 'postcode', 'formaat',
 'Nederlandse postcode moet format 1234AB hebben',
 'regex: /^[1-9][0-9]{3}[\s]?[A-Z]{2}$/i',
 'Gebruik het formaat 1234AB',
 'Standaard Nederlandse postcode formaat',
 'PostNL postcode systeem',
 2),

-- PARTNER005: Geldige email
('PARTNER_EMAIL_FORMAAT', 'partner', 'email', 'formaat',
 'Email moet een geldig formaat hebben',
 'regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/',
 'Voer een geldig e-mailadres in',
 'Nodig voor communicatie',
 'AVG - Correcte contactgegevens',
 1),

-- PARTNER006: Telefoonnummer formaat
('PARTNER_TELEFOON_FORMAAT', 'partner', 'telefoonnummer', 'formaat',
 'Nederlands telefoonnummer moet geldig zijn',
 'regex: /^(\+31|0)[1-9][0-9]{8}$/',
 'Voer een geldig Nederlands telefoonnummer in (10 cijfers, beginnend met 0 of +31)',
 'Standaard Nederlands telefoonformaat',
 'Telecommunicatie standaarden',
 2);

-- Datum validatieregels
INSERT INTO ihw.validatie_regel (regel_code, categorie, veld_naam, regel_type, beschrijving, technische_regel, foutmelding, rationale, wettelijke_basis, prioriteit) VALUES

-- DATUM001: Huwelijksdatum in toekomst
('HUWELIJK_DATUM_TOEKOMST', 'datum', 'huwelijksdatum', 'bereik',
 'Huwelijksdatum moet in de toekomst liggen',
 'new Date(huwelijksdatum) > new Date()',
 'De huwelijksdatum moet in de toekomst liggen',
 'Je kunt alleen toekomstige huwelijken aankondigen',
 'Logische consistentie',
 1),

-- DATUM002: Huwelijksdatum niet te ver in toekomst
('HUWELIJK_DATUM_MAX_TOEKOMST', 'datum', 'huwelijksdatum', 'bereik',
 'Huwelijksdatum mag maximaal 2 jaar in de toekomst liggen',
 '(new Date(huwelijksdatum) - new Date()) / (365.25 * 24 * 60 * 60 * 1000) <= 2',
 'De huwelijksdatum mag maximaal 2 jaar in de toekomst liggen',
 'Praktische limiet voor planning',
 'Gemeentelijk beleid',
 2),

-- DATUM003: Minimale aankondigingstermijn
('HUWELIJK_MIN_AANKONDIGING', 'datum', 'huwelijksdatum', 'bereik',
 'Huwelijk moet minimaal 14 dagen van tevoren worden aangekondigd',
 '(new Date(huwelijksdatum) - new Date()) / (24 * 60 * 60 * 1000) >= 14',
 'Een huwelijk moet minimaal 14 dagen van tevoren worden aangekondigd',
 'Wettelijke termijn voor bezwaarperiode',
 'Burgerlijk Wetboek Boek 1, Artikel 50',
 1);

-- Document validatieregels
INSERT INTO ihw.validatie_regel (regel_code, categorie, veld_naam, regel_type, beschrijving, technische_regel, foutmelding, rationale, wettelijke_basis, prioriteit) VALUES

-- DOC001: Toegestane bestandstypen
('DOCUMENT_BESTANDSTYPE', 'document', 'bestand', 'formaat',
 'Document moet PDF, JPG, JPEG of PNG zijn',
 'fileExtension in ["pdf", "jpg", "jpeg", "png"]',
 'Upload een PDF, JPG of PNG bestand',
 'Veiligheid en compatibiliteit',
 'Gemeentelijk beleid',
 1),

-- DOC002: Maximum bestandsgrootte
('DOCUMENT_MAX_GROOTTE', 'document', 'bestand', 'bereik',
 'Document mag maximaal 10MB groot zijn',
 'fileSize <= 10 * 1024 * 1024',
 'Het bestand is te groot. Maximale grootte is 10MB',
 'Praktische limiet voor opslag en verwerking',
 'Gemeentelijk beleid',
 1),

-- DOC003: Bestand niet leeg
('DOCUMENT_NIET_LEEG', 'document', 'bestand', 'vereist',
 'Document mag niet leeg zijn',
 'fileSize > 0',
 'Het bestand is leeg. Upload een geldig document',
 'Document moet inhoud hebben',
 'Logische consistentie',
 1);

-- Algemene validatieregels
INSERT INTO ihw.validatie_regel (regel_code, categorie, veld_naam, regel_type, beschrijving, technische_regel, foutmelding, rationale, wettelijke_basis, prioriteit) VALUES

-- GEN001: XSS preventie
('ALGEMEEN_XSS_PREVENTIE', 'algemeen', 'alle_tekstvelden', 'formaat',
 'Tekstvelden mogen geen script tags bevatten',
 '!/<script|javascript:|onerror=|onclick=/i.test(value)',
 'Ongeldige tekens gedetecteerd',
 'Beveiliging tegen XSS aanvallen',
 'AVG - Beveiliging persoonsgegevens',
 1),

-- GEN002: SQL injection preventie
('ALGEMEEN_SQL_PREVENTIE', 'algemeen', 'alle_tekstvelden', 'formaat',
 'Tekstvelden mogen geen SQL statements bevatten',
 '!/(\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b).*\b(TABLE|FROM|WHERE)\b/i.test(value)',
 'Ongeldige tekens gedetecteerd',
 'Beveiliging tegen SQL injection',
 'AVG - Beveiliging persoonsgegevens',
 1),

-- GEN003: Maximum tekstveld lengte
('ALGEMEEN_MAX_LENGTE_TEKST', 'algemeen', 'tekstvelden', 'bereik',
 'Tekstvelden hebben een maximale lengte',
 'value.length <= maxLength',
 'De ingevoerde tekst is te lang',
 'Praktische limiet voor database en display',
 'Technische beperking',
 2);

-- Metadata over validatieregels
COMMENT ON TABLE ihw.validatie_regel IS 'Versie 1.0 - Geïmplementeerd op basis van Burgerlijk Wetboek en AVG vereisten';

