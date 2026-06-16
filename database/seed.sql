INSERT INTO Wydzialy (NazwaW) VALUES
 ('Wydział Informatyki i Telekomunikacji'),
 ('Wydział Elektrotechniki'),
 ('Wydział Matematyki i Fizyki');

INSERT INTO Kierunki (IdW, NazwaK, RokStartu) VALUES
 (1, 'Informatyka', 2010),
 (1, 'Cyberbezpieczeństwo', 2018),
 (2, 'Elektrotechnika', 2005),
 (3, 'Matematyka stosowana', 2012);

INSERT INTO Budynki (NazwaB, AdresB) VALUES
 ('Budynek A', 'ul. Akademicka 1, 30-001 Kraków'),
 ('Budynek B', 'ul. Akademicka 3, 30-001 Kraków'),
 ('Budynek C', 'ul. Naukowa 5, 30-002 Kraków');

INSERT INTO Sale (NumerS, TypS, Pojemnosc, IdB) VALUES
 ('A101', 'wykładowa', 120, 1),
 ('A102', 'ćwiczeniowa', 30, 1),
 ('A201', 'laboratoryjna', 20, 1),
 ('B01', 'wykładowa', 200, 2),
 ('B101', 'ćwiczeniowa', 25, 2),
 ('C101', 'laboratoryjna', 15, 3),
 ('C102', 'laboratoryjna', 15, 3);

INSERT INTO Przedmioty (NazwaP, FormaP, LbGodz) VALUES
 ('Języki skryptowe', 'laboratorium', 30),
 ('Bazy danych', 'laboratorium', 30),
 ('Bazy danych', 'wykład', 30),
 ('Algorytmy i struktury danych', 'wykład', 45),
 ('Algorytmy i struktury danych', 'ćwiczenia', 30),
 ('Sieci komputerowe', 'wykład', 30),
 ('Sieci komputerowe', 'laboratorium', 30),
 ('Matematyka dyskretna', 'wykład', 45),
 ('Bezpieczeństwo systemów', 'wykład', 30);

INSERT INTO Pracownicy (Stopien, Nazwisko, Imie, Email, NrTel, Haslo, Rola) VALUES
 ('', 'Kowalski', 'Adam', 'planista@uczelnia.pl', '500100200', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4=', 'PLANISTA'),
 ('dr', 'Nowak', 'Piotr', 'p.nowak@uczelnia.pl', '500200300', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4=', 'WYKLADOWCA'),
 ('dr hab.','Wiśniewski', 'Anna', 'a.wisniewski@uczelnia.pl', '500300400', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4=', 'WYKLADOWCA'),
 ('prof.', 'Zając', 'Marek', 'm.zajac@uczelnia.pl', '500400500', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4=', 'WYKLADOWCA'),
 ('dr', 'Krawczyk', 'Elżbieta','e.krawczyk@uczelnia.pl', '500500600', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4=', 'WYKLADOWCA');

INSERT INTO Studenci (Nazwisko, Imie, Status, Email, Haslo) VALUES
 ('Gasinski', 'Tomasz', 'aktywny', 't.gasinski@student.pl', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4='),
 ('Nikonenko', 'Vladyslav', 'aktywny', 'v.nikonenko@student.pl', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4='),
 ('Kowalczyk', 'Maria', 'aktywny', 'm.kowalczyk@student.pl', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4='),
 ('Lewandowski', 'Jan', 'aktywny', 'j.lewandowski@student.pl', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4='),
 ('Wójcik', 'Katarzyna', 'aktywny', 'k.wojcik@student.pl', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4='),
 ('Mazur', 'Paweł', 'urlopowany', 'p.mazur@student.pl', 'pbkdf2_sha256$1200000$NW1LXTaX0qKhZfUqOnlEyH$BhGYDHD6dGg2bBwBQONIoTd/vvXXOj3tPbL84xPEjI4=');


INSERT INTO Grupy (IdK, RokStudiow, Semestr, RokAkadem, LiczbaOs, Opis) VALUES
 (1, 2, 4, '2025/2026', 25, 'Informatyka – 2 rok, sem. letni, gr. A'),
 (1, 2, 4, '2025/2026', 23, 'Informatyka – 2 rok, sem. letni, gr. B'),
 (1, 3, 6, '2025/2026', 20, 'Informatyka – 3 rok, sem. letni'),
 (2, 1, 2, '2025/2026', 18, 'Cyberbezpieczeństwo – 1 rok, sem. letni');

INSERT INTO Przypisy (IdSt, IdG, Opis) VALUES
 (1, 1, NULL),
 (2, 1, NULL),
 (3, 1, NULL),
 (4, 2, NULL),
 (5, 2, NULL),
 (6, 3, 'Student na urlopie – zapisany warunkowo');

INSERT INTO Zajecia (Dzien, GodzRozp, GodzZak, Uwagi, IdS, IdP, IdPr, IdG) VALUES
 ('Wtorek', '08:00', '09:30', NULL, 3, 1, 2, 1),
 ('Wtorek', '09:45', '11:15', NULL, 3, 1, 2, 2),
 ('Poniedziałek', '08:00', '09:30', NULL, 1, 3, 3, 1),
 ('Poniedziałek', '10:00', '11:30', NULL, 4, 3, 3, 2),
 ('Środa', '12:00', '13:30', NULL, 2, 2, 2, 1),
 ('Środa', '13:45', '15:15', NULL, 2, 2, 2, 2),
 ('Czwartek', '08:00', '09:30', NULL, 4, 4, 4, 3),
 ('Piątek', '10:00', '11:30', NULL, 5, 9, 5, 4);