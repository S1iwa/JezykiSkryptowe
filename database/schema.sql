CREATE EXTENSION IF NOT EXISTS btree_gist;
DROP TABLE IF EXISTS Zajecia CASCADE;
DROP TABLE IF EXISTS Przypisy CASCADE;
DROP TABLE IF EXISTS Grupy CASCADE;
DROP TABLE IF EXISTS Kierunki CASCADE;
DROP TABLE IF EXISTS Wydzialy CASCADE;
DROP TABLE IF EXISTS Studenci CASCADE;
DROP TABLE IF EXISTS Pracownicy CASCADE;
DROP TABLE IF EXISTS Przedmioty CASCADE;
DROP TABLE IF EXISTS Sale CASCADE;
DROP TABLE IF EXISTS Budynki CASCADE;

CREATE TABLE Wydzialy (
 IdW SERIAL PRIMARY KEY,
 NazwaW VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Kierunki (
 IdK SERIAL PRIMARY KEY,
 IdW INT NOT NULL REFERENCES Wydzialy(IdW) ON DELETE RESTRICT,
 NazwaK VARCHAR(100) NOT NULL,
 RokStartu SMALLINT NOT NULL CHECK (RokStartu >= 1900),
 UNIQUE (IdW, NazwaK)
);

CREATE TABLE Budynki (
 IdB SERIAL PRIMARY KEY,
 NazwaB VARCHAR(100) NOT NULL,
 AdresB VARCHAR(200) NOT NULL
);

CREATE TABLE Sale (
 IdS SERIAL PRIMARY KEY,
 NumerS VARCHAR(20) NOT NULL,
 TypS VARCHAR(50) NOT NULL,
 Pojemnosc SMALLINT NOT NULL CHECK (Pojemnosc > 0),
 IdB INT NOT NULL REFERENCES Budynki(IdB) ON DELETE RESTRICT,
 UNIQUE (NumerS, IdB)
);


CREATE TABLE Przedmioty (
 IdP SERIAL PRIMARY KEY,
 NazwaP VARCHAR(150) NOT NULL,
 FormaP VARCHAR(50) NOT NULL,
 LbGodz SMALLINT NOT NULL CHECK (LbGodz > 0)
);

CREATE TABLE Pracownicy (
 IdPr SERIAL PRIMARY KEY,
 Stopien VARCHAR(50),
 Nazwisko VARCHAR(80) NOT NULL,
 Imie VARCHAR(80) NOT NULL,
 Email VARCHAR(150) NOT NULL UNIQUE,
 NrTel VARCHAR(20),
 Haslo VARCHAR(255) NOT NULL,
 Rola VARCHAR(20) NOT NULL
 CHECK (Rola IN ('PLANISTA', 'WYKLADOWCA'))
);

CREATE TABLE Studenci (
 IdSt SERIAL PRIMARY KEY,
 Nazwisko VARCHAR(80) NOT NULL,
 Imie VARCHAR(80) NOT NULL,
 Status VARCHAR(30) NOT NULL
 CHECK (Status IN ('aktywny', 'urlopowany', 'skreślony', 'absolwent')),
 Email VARCHAR(150) NOT NULL UNIQUE,
 Haslo VARCHAR(255) NOT NULL
);

CREATE TABLE Grupy (
 IdG SERIAL PRIMARY KEY,
 IdK INT NOT NULL REFERENCES Kierunki(IdK) ON DELETE RESTRICT,
 RokStudiow SMALLINT NOT NULL CHECK (RokStudiow BETWEEN 1 AND 5),
 Semestr SMALLINT NOT NULL CHECK (Semestr BETWEEN 1 AND 10),
 RokAkadem VARCHAR(9) NOT NULL,
 LiczbaOs SMALLINT NOT NULL CHECK (LiczbaOs > 0),
 Opis TEXT
);

CREATE TABLE Przypisy (
 IdPrzypisu SERIAL PRIMARY KEY,
 IdSt INT NOT NULL REFERENCES Studenci(IdSt) ON DELETE CASCADE,
 IdG INT NOT NULL REFERENCES Grupy(IdG) ON DELETE CASCADE,
 Opis TEXT,
 UNIQUE (IdSt, IdG)
);

CREATE TABLE Zajecia (
 IdZ SERIAL PRIMARY KEY,
 Dzien VARCHAR(12) NOT NULL
 CHECK (Dzien IN ('Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela')),
 GodzRozp TIME NOT NULL,
 GodzZak TIME NOT NULL,
 Uwagi TEXT,
 IdS INT NOT NULL REFERENCES Sale(IdS) ON DELETE RESTRICT,
 IdP INT NOT NULL REFERENCES Przedmioty(IdP) ON DELETE RESTRICT,
 IdPr INT NOT NULL REFERENCES Pracownicy(IdPr) ON DELETE RESTRICT,
 IdG INT NOT NULL REFERENCES Grupy(IdG) ON DELETE RESTRICT,

 CONSTRAINT godz_logiczne CHECK (GodzZak > GodzRozp),

 CONSTRAINT brak_kolizji_sali
 EXCLUDE USING GIST (
 IdS WITH =,
 Dzien WITH =,
 tsrange(
 ('2000-01-01'::date + GodzRozp)::timestamp,
 ('2000-01-01'::date + GodzZak)::timestamp
 ) WITH &&
 ),

 CONSTRAINT brak_kolizji_pracownika
 EXCLUDE USING GIST (
 IdPr WITH =,
 Dzien WITH =,
 tsrange(
 ('2000-01-01'::date + GodzRozp)::timestamp,
 ('2000-01-01'::date + GodzZak)::timestamp
 ) WITH &&
 )
);

CREATE INDEX idx_zajecia_dzien ON Zajecia(Dzien);
CREATE INDEX idx_zajecia_sala ON Zajecia(IdS);
CREATE INDEX idx_zajecia_pracownik ON Zajecia(IdPr);
CREATE INDEX idx_zajecia_grupa ON Zajecia(IdG);
CREATE INDEX idx_przypisy_student ON Przypisy(IdSt);
CREATE INDEX idx_przypisy_grupa ON Przypisy(IdG);
CREATE INDEX idx_sale_budynek ON Sale(IdB);
CREATE INDEX idx_kierunki_wydzial ON Kierunki(IdW);
CREATE INDEX idx_grupy_kierunek ON Grupy(IdK);

CREATE VIEW v_plan_grupy AS
SELECT
 z.IdZ,
 z.Dzien,
 z.GodzRozp,
 z.GodzZak,
 z.Uwagi,
 p.NazwaP AS Przedmiot,
 p.FormaP AS Forma,
 pr.Stopien || ' ' || pr.Imie || ' ' || pr.Nazwisko AS Prowadzacy,
 pr.Email AS EmailProwadzacego,
 s.NumerS AS Sala,
 s.TypS AS TypSali,
 s.Pojemnosc,
 b.NazwaB AS Budynek,
 b.AdresB AS AdresBudynku,
 g.IdG,
 k.NazwaK AS Kierunek,
 g.RokStudiow,
 g.Semestr,
 g.RokAkadem
FROM Zajecia z
JOIN Przedmioty p ON z.IdP = p.IdP
JOIN Pracownicy pr ON z.IdPr = pr.IdPr
JOIN Sale s ON z.IdS = s.IdS
JOIN Budynki b ON s.IdB = b.IdB
JOIN Grupy g ON z.IdG = g.IdG
JOIN Kierunki k ON g.IdK = k.IdK;

CREATE VIEW v_plan_pracownika AS
SELECT
 z.IdZ,
 z.Dzien,
 z.GodzRozp,
 z.GodzZak,
 z.Uwagi,
 pr.IdPr,
 p.NazwaP AS Przedmiot,
 p.FormaP AS Forma,
 s.NumerS AS Sala,
 b.NazwaB AS Budynek,
 g.IdG,
 k.NazwaK AS Kierunek,
 g.RokStudiow,
 g.Semestr,
 g.RokAkadem,
 g.LiczbaOs
FROM Zajecia z
JOIN Przedmioty p ON z.IdP = p.IdP
JOIN Pracownicy pr ON z.IdPr = pr.IdPr
JOIN Sale s ON z.IdS = s.IdS
JOIN Budynki b ON s.IdB = b.IdB
JOIN Grupy g ON z.IdG = g.IdG
JOIN Kierunki k ON g.IdK = k.IdK;

CREATE VIEW v_plan_studenta AS
SELECT
 st.IdSt,
 z.IdZ,
 z.Dzien,
 z.GodzRozp,
 z.GodzZak,
 z.Uwagi,
 p.NazwaP AS Przedmiot,
 p.FormaP AS Forma,
 pr.Stopien || ' ' || pr.Imie || ' ' || pr.Nazwisko AS Prowadzacy,
 pr.Email AS EmailProwadzacego,
 s.NumerS AS Sala,
 s.TypS AS TypSali,
 b.NazwaB AS Budynek,
 b.AdresB AS AdresBudynku,
 k.NazwaK AS Kierunek,
 g.RokStudiow,
 g.Semestr,
 g.RokAkadem
FROM Studenci st
JOIN Przypisy r ON st.IdSt = r.IdSt
JOIN Grupy g ON r.IdG = g.IdG
JOIN Zajecia z ON z.IdG = g.IdG
JOIN Przedmioty p ON z.IdP = p.IdP
JOIN Pracownicy pr ON z.IdPr = pr.IdPr
JOIN Sale s ON z.IdS = s.IdS
JOIN Budynki b ON s.IdB = b.IdB
JOIN Kierunki k ON g.IdK = k.IdK;

CREATE VIEW v_obciazenie_sal AS
SELECT
 s.IdS,
 s.NumerS,
 s.TypS,
 b.NazwaB AS Budynek,
 COUNT(z.IdZ) AS LiczbaZajec,
 SUM(EXTRACT(EPOCH FROM (z.GodzZak - z.GodzRozp)) / 3600) AS SumaGodzin
FROM Sale s
JOIN Budynki b ON s.IdB = b.IdB
LEFT JOIN Zajecia z ON s.IdS = z.IdS
GROUP BY s.IdS, s.NumerS, s.TypS, b.NazwaB;

CREATE VIEW v_obciazenie_pracownikow AS
SELECT
 pr.IdPr,
 pr.Stopien,
 pr.Imie,
 pr.Nazwisko,
 pr.Email,
 COUNT(z.IdZ) AS LiczbaZajec,
 SUM(EXTRACT(EPOCH FROM (z.GodzZak - z.GodzRozp)) / 3600) AS SumaGodzin
FROM Pracownicy pr
LEFT JOIN Zajecia z ON pr.IdPr = z.IdPr
WHERE pr.Rola = 'WYKLADOWCA'
GROUP BY pr.IdPr, pr.Stopien, pr.Imie, pr.Nazwisko, pr.Email;
