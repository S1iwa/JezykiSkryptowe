// Inicjalizacja motywu z localStorage
(function() {
    if (localStorage.getItem('motyw') === 'dark') {
        document.body.classList.add('dark');
    }

    const btn = document.createElement('button');
    btn.id = 'przycisk-motywu';
    btn.className = 'przycisk-motywu';
    btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    btn.onclick = toggleMotyw;
    document.body.appendChild(btn);
})();

function toggleMotyw() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('motyw', isDark ? 'dark' : 'light');
    const btn = document.getElementById('przycisk-motywu');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// Funkcja pokazLogowanie - Strona logowania
function pokazLogowanie(app) {
    app.innerHTML = `
        <div class="login-wrapper">
            <div class="formularz-logowania">
                <h2>Logowanie</h2>
                <p class="login-podtytul">Jeden formularz dla studenta, wykładowcy i planisty.</p>
                <div id="blad-logowania" class="blad hidden"></div>
                <div class="pole">
                    <label for="pole-email">E-mail</label>
                    <input type="email" id="pole-email" placeholder="np. j.kowalski@student.pl">
                </div>
                <div class="pole">
                    <label for="pole-haslo">Hasło</label>
                    <input type="password" id="pole-haslo" placeholder="hasło">
                </div>
                <button id="przycisk-login">Zaloguj się</button>
            </div>
        </div>
    `;

    // Logika przycisku Zaloguj:
    document.getElementById('przycisk-login').onclick = function() {
        var email = document.getElementById('pole-email').value;
        var haslo = document.getElementById('pole-haslo').value;
        var komunikatBledu = document.getElementById('blad-logowania');

        komunikatBledu.classList.add('hidden');

        fetch('/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRF_TOKEN
            },
            body: JSON.stringify({ email: email, password: haslo })
        })

        .then(function(odpowiedz) {
            return odpowiedz.json();
        })

        .then(function(dane) {
            if (dane.status === 'success') {
                sessionStorage.setItem('email', dane.user_info.email);
                sessionStorage.setItem('rola', dane.role);
                sessionStorage.setItem('plan', JSON.stringify(dane.plan_zajec || []));

                history.pushState({}, '', dane.redirect_to);
                router();
            } else {
                komunikatBledu.textContent = dane.message;
                komunikatBledu.classList.remove('hidden');
            }
        })

        .catch(function() {
            komunikatBledu.textContent = 'Błąd połączenia z serwerem.';
            komunikatBledu.classList.remove('hidden');
        });
    }
}

function pokazPanelStudenta(app) {
    var email = sessionStorage.getItem('email');
    var planTekst = sessionStorage.getItem('plan');
    var planZajec = planTekst ? JSON.parse(planTekst) : [];

    // Szablon wierszy tabeli.
    var wierszeTabeli = planZajec.map(function(zajecie) {
        return `
            <tr>
                <td>${zajecie.dzien}</td>
                <td>${zajecie.godzrozp} - ${zajecie.godzzak}</td>
                <td>${zajecie.przedmiot.nazwap} (${zajecie.przedmiot.formap})</td>
                <td>${zajecie.sala.budynek.nazwab}, sala ${zajecie.sala.numers}</td>
                <td>${zajecie.prowadzacy.stopien} ${zajecie.prowadzacy.imie} ${zajecie.prowadzacy.nazwisko}</td>
            </tr>
        `;
    }).join('');

    // Zabezpieczenie przed brakiem zajęć:
    if (planZajec.length === 0) {
        wierszeTabeli = '<tr><td colspan="5" style="text-align: center;">Brak zaplanowanych zajęć</td></tr>';
    }


    app.innerHTML = `
        <div class="panel-kontener">
            <div class="panel-naglowek">
                <h2>Panel Studenta</h2>
                <p>Zalogowano jako: <strong>${email}</strong></p>
                <button id="przycisk-wyloguj" class="przycisk-maly">Wyloguj się</button>
            </div>

            <div class="akcje-panelu">
                <button id="przycisk-pokaz-haslo" class="przycisk-akcja">Zmień hasło</button>
                <button id="przycisk-eksport-csv" class="przycisk-akcja">Pobierz plan (CSV)</button>
                <button id="przycisk-pokaz-szukaj" class="przycisk-akcja">Szukaj prowadzącego</button>
            </div>

            <div id="sekcja-haslo" class="ukryta-sekcja hidden">
                <h3>Zmiana hasła</h3>
                <div id="komunikat-haslo" class="blad hidden"></div>
                <div class="pole">
                    <input type="password" id="stare-haslo" placeholder="Stare hasło">
                </div>
                <div class="pole">
                    <input type="password" id="nowe-haslo" placeholder="Nowe hasło">
                </div>
                <button id="przycisk-zmien-haslo" class="przycisk-akcja">Potwierdź zmianę</button>
            </div>

            <div id="sekcja-szukaj" class="ukryta-sekcja hidden">
                <h3>Wyszukaj prowadzącego</h3>
                <div id="komunikat-szukaj" class="blad hidden"></div>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <input type="text" id="szukaj-imie" placeholder="Imię" style="flex: 1; padding: 8px;">
                    <input type="text" id="szukaj-nazwisko" placeholder="Nazwisko" style="flex: 1; padding: 8px;">
                    <button id="przycisk-szukaj" class="przycisk-akcja">Szukaj</button>
                </div>
                <ul id="wyniki-wyszukiwania" style="margin-top: 10px;"></ul>
            </div>

            <h3>Twój plan zajęć:</h3>
            <table class="tabela-planu">
                <thead>
                    <tr>
                        <th>Dzień</th>
                        <th>Godziny</th>
                        <th>Przedmiot</th>
                        <th>Sala</th>
                        <th>Prowadzący</th>
                    </tr>
                </thead>
                <tbody>
                    ${wierszeTabeli}
                </tbody>
            </table>
        </div>
    `;

    // Obsługa wylogowania
    document.getElementById('przycisk-wyloguj').onclick = function() {
        fetch('/api/auth/logout/', { method: 'POST', headers: { 'X-CSRFToken': window.CSRF_TOKEN } })
        .then(function() {
            sessionStorage.clear();
            history.pushState({}, '', '/logowanie/');
            router();
        });
    };

    // Pokazuje/ukrywa sekcje zmiany hasła i wyszukiwania
    document.getElementById('przycisk-pokaz-haslo').onclick = function() {
        document.getElementById('sekcja-haslo').classList.toggle('hidden');
        document.getElementById('sekcja-szukaj').classList.add('hidden');       // ukrywa druga odpaloną sekcję
    };

    document.getElementById('przycisk-pokaz-szukaj').onclick = function() {
        document.getElementById('sekcja-szukaj').classList.toggle('hidden');
        document.getElementById('sekcja-haslo').classList.add('hidden');        // ukryj drugą odpaloną sekcje
    };


    // Logika Eksportu CSV
    document.getElementById('przycisk-eksport-csv').onclick = function() {
        if (planZajec.length === 0) {
            alert('Brak zajęć do eksportu.');
            return;
        }

        var naglowki = ['Dzien', 'Od', 'Do', 'Przedmiot', 'Forma', 'Sala', 'Budynek', 'Prowadzacy'];
        var wierszeCsv = planZajec.map(function(z) {
            return [
                z.dzien, z.godzrozp, z.godzzak,
                z.przedmiot.nazwap, z.przedmiot.formap,
                z.sala.numers, z.sala.budynek.nazwab,
                z.prowadzacy.stopien + ' ' + z.prowadzacy.nazwisko
            ].join(';');        // ; dla polskiego Excela
        });


        var csvTekst = '\uFEFF' + naglowki.join(';') + '\n' + wierszeCsv.join('\n');

        var blob = new Blob([csvTekst], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'moj_plan_zajec.csv';
        link.click();
    };

    // Logika zmiany Hasła:
    document.getElementById('przycisk-zmien-haslo').onclick = function() {
        var stareHaslo = document.getElementById('stare-haslo').value;
        var noweHaslo = document.getElementById('nowe-haslo').value;
        var komunikat = document.getElementById('komunikat-haslo');

        fetch('/api/auth/change_password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRF_TOKEN
            },
            body: JSON.stringify({ old_password: stareHaslo, new_password: noweHaslo })
        })
        .then(res => res.json())
        .then(dane => {
            komunikat.classList.remove('hidden');
            if (dane.status === 'success') {
                komunikat.style.color = 'green';
                komunikat.textContent = 'Hasło zostało zmienione!';

            } else {
                komunikat.style.color = 'red';
                komunikat.textContent = dane.message;

            }
        });
    };

    // Logika Wyszukiwania Prowadzącego:
    document.getElementById('przycisk-szukaj').onclick = function() {
        var imie = document.getElementById('szukaj-imie').value;
        var nazwisko = document.getElementById('szukaj-nazwisko').value;
        var komunikat = document.getElementById('komunikat-szukaj');
        var wynikiLista = document.getElementById('wyniki-wyszukiwania');

        komunikat.classList.add('hidden');
        wynikiLista.innerHTML = '';

        // Zapytanie GET przekazuje parametry w URL, a nie w 'body'
        fetch(`/api/students/professors-information/?imie=${imie}&nazwisko=${nazwisko}`)
        .then(res => res.json())
        .then(dane => {
            if (dane.status === 'success') {
                dane.prowadzacy.forEach(p => {
                    var przedmiotyStr = p.przedmioty.map(pr => pr.nazwap + ' (' + pr.formap + ')').join(', ');
                    wynikiLista.innerHTML += `<li><strong>${p.stopien} ${p.imie} ${p.nazwisko}</strong><br><small>Uczy: ${przedmiotyStr}</small></li>`;
                });
            } else {
                komunikat.classList.remove('hidden');
                komunikat.style.color = 'red';
                komunikat.textContent = dane.message;

            }
        });
    };
}

function pokazPanelPlanisty(app) {
    var email = sessionStorage.getItem('email');

    app.innerHTML = `
        <div class="panel-kontener">
            <div class="panel-naglowek">
                <h2>Panel Planisty</h2>
                <p>Zalogowano jako: <strong>${email}</strong></p>
                <button id="przycisk-wyloguj" class="przycisk-maly">Wyloguj się</button>
            </div>

            <div class="akcje-panelu">
                <button id="przycisk-pokaz-haslo" class="przycisk-akcja">Zmień hasło</button>
                <button id="przycisk-pokaz-csv" class="przycisk-akcja">Migracja danych (CSV)</button>
                <button id="przycisk-pokaz-crud" class="przycisk-akcja">Zarządzanie strukturą (CRUD)</button>
            </div>

            <div id="sekcja-haslo" class="ukryta-sekcja hidden">
                <h3>Zmiana hasła</h3>
                <div id="komunikat-haslo" class="blad hidden"></div>
                <div class="pole">
                    <input type="password" id="stare-haslo" placeholder="Stare hasło">
                </div>
                <div class="pole">
                    <input type="password" id="nowe-haslo" placeholder="Nowe hasło">
                </div>
                <button id="przycisk-zmien-haslo" class="przycisk-akcja">Potwierdź zmianę</button>
            </div>

            <div id="sekcja-csv" class="ukryta-sekcja hidden">
                <h3>Masowy Import / Eksport danych (CSV)</h3>
                <p style="font-size: 13px; color: var(--text-secondary);">Wybierz model danych z bazy systemu:</p>
                <div class="pole">
                    <select id="wybierz-model-csv" style="padding: 10px 12px; width: 100%; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--gray-medium); border-radius: 6px; font-family: 'Inter', sans-serif;">
                        <option value="Przedmioty">Przedmioty</option>
                        <option value="Sale">Sale</option>
                        <option value="Pracownicy">Pracownicy</option>
                        <option value="Grupy">Grupy</option>
                        <option value="Zajecia">Zajęcia</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 16px;">
                    <button id="btn-eksport-model" class="przycisk-akcja" style="flex: 1;">Eksportuj do CSV</button>
                    <div style="flex: 1; border: 1px dashed var(--gray-medium); padding: 8px; text-align: center; border-radius: 6px;">
                        <input type="file" id="plik-import-csv" accept=".csv" style="font-size: 13px; width: 100%; color: var(--text-primary);">
                        <button id="btn-import-model" class="przycisk-maly" style="margin-top: 8px; width: 100%; background: var(--color-main);">Importuj plik CSV</button>
                    </div>
                </div>
                <div id="komunikat-csv" style="margin-top: 12px; font-weight: bold; font-size: 13px;"></div>
            </div>

            <div id="sekcja-crud" class="ukryta-sekcja hidden">
                <h3>Zarządzanie strukturą uczelni (CRUD)</h3>

                <div class="pole">
                    <label><strong>Wybierz obszar zarządzania:</strong></label>
                    <select id="wybierz-zasob-crud" style="padding: 10px 12px; width: 100%; margin-top: 5px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--gray-medium); border-radius: 6px; font-family: 'Inter', sans-serif;">
                        <option value="subject">Przedmioty (api/CRUD/subject/)</option>
                        <option value="sala">Sale wykładowe (api/CRUD/sala/)</option>
                        <option value="pracownik">Pracownicy / Wykładowcy (api/CRUD/pracownik/)</option>
                        <option value="grupa">Grupy studenckie (api/CRUD/grupa/)</option>
                        <option value="zajecia">Plan lekcji / Zajęcia (api/CRUD/zajecia/)</option>
                    </select>
                </div>

                <hr style="margin: 20px 0; border: 0; border-top: 1px solid var(--gray-light);">

                <div id="kontener-formularza-crud" style="background: var(--bg-card); padding: 20px; border: 1px solid var(--gray-light); border-radius: 6px;">
                </div>

                <div id="komunikat-crud" style="margin-top: 16px; font-weight: bold; font-size: 13px;"></div>

                <hr style="margin: 20px 0; border: 0; border-top: 1px solid var(--gray-light);">

                <div id="podglad-danych-kontener" class="hidden">
                    <h3 id="naglowek-podgladu">Aktualna lista</h3>
                    <table class="tabela-planu" id="tabela-wszystkie-rekordy">
                        <thead>
                            <tr id="naglowki-tabeli-crud">
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // --- PODSTAWOWA NAWIGACJA PANELU ---
    document.getElementById('przycisk-wyloguj').onclick = function() {
        fetch('/api/auth/logout/', { method: 'POST', headers: { 'X-CSRFToken': window.CSRF_TOKEN } })
        .then(function() {
            sessionStorage.clear();
            history.pushState({}, '', '/logowanie/');
            router();
        });
    };

    document.getElementById('przycisk-pokaz-haslo').onclick = function() {
        document.getElementById('sekcja-haslo').classList.toggle('hidden');
        document.getElementById('sekcja-csv').classList.add('hidden');
        document.getElementById('sekcja-crud').classList.add('hidden');
    };

    document.getElementById('przycisk-pokaz-csv').onclick = function() {
        document.getElementById('sekcja-csv').classList.toggle('hidden');
        document.getElementById('sekcja-haslo').classList.add('hidden');
        document.getElementById('sekcja-crud').classList.add('hidden');
    };

    document.getElementById('przycisk-pokaz-crud').onclick = function() {
        document.getElementById('sekcja-crud').classList.toggle('hidden');
        document.getElementById('sekcja-haslo').classList.add('hidden');
        document.getElementById('sekcja-csv').classList.add('hidden');
        przelaczZasobCrud();
    };

    // --- LOGIKA EDYCJI W WIERSZACH ---
    window.odblokujEdycje = function(id) {
        var zasob = document.getElementById('wybierz-zasob-crud').value;
        var pola = [];

        if (zasob === 'subject') pola = ['nazwa', 'forma', 'godz'].map(p => `row-sub-${p}-${id}`);
        else if (zasob === 'sala') pola = ['numer', 'typ', 'poj'].map(p => `row-sala-${p}-${id}`);
        else if (zasob === 'pracownik') pola = ['stopien', 'imie', 'nazwisko', 'email', 'tel', 'rola'].map(p => `row-prac-${p}-${id}`);
        else if (zasob === 'grupa') pola = ['rokS', 'sem', 'rokA', 'osoby', 'opis'].map(p => `row-grup-${p}-${id}`);
        else if (zasob === 'zajecia') pola = ['dzien', 'rozp', 'zak', 'uwagi'].map(p => `row-zaj-${p}-${id}`);

        // Odblokowujemy komórki, dodajemy styl i ZAPISUJEMY oryginalną wartość
        pola.forEach(idPola => {
            var el = document.getElementById(idPola);
            if (el) {
                // Zapisanie oryginalnego tekstu do atrybutu
                el.setAttribute('data-oryginal', el.textContent.trim());

                el.contentEditable = "true";
                el.style.backgroundColor = "var(--bg-input, #f9f9f9)";
                el.style.borderBottom = "2px dashed var(--color-main, #007bff)";
                el.style.outline = "none";
                el.style.padding = "2px 4px";
                el.style.borderRadius = "3px";
            }
        });

        // Zamiana przycisków na Zatwierdź i Anuluj
        var tdAkcje = document.getElementById(`akcje-${id}`);
        if (tdAkcje) {
            tdAkcje.innerHTML = `
                <button class="przycisk-maly" style="background: var(--color-success, #28a745); color: #fff;" onclick="zapiszEdycje(${id})">Zatwierdź</button>
                <button class="przycisk-maly" style="background: var(--color-error, #dc3545); color: #fff;" onclick="anulujEdycje(${id})">Anuluj</button>
            `;
        }
    };

    window.anulujEdycje = function(id) {
        var zasob = document.getElementById('wybierz-zasob-crud').value;
        var pola = [];

        if (zasob === 'subject') pola = ['nazwa', 'forma', 'godz'].map(p => `row-sub-${p}-${id}`);
        else if (zasob === 'sala') pola = ['numer', 'typ', 'poj'].map(p => `row-sala-${p}-${id}`);
        else if (zasob === 'pracownik') pola = ['stopien', 'imie', 'nazwisko', 'email', 'tel', 'rola'].map(p => `row-prac-${p}-${id}`);
        else if (zasob === 'grupa') pola = ['rokS', 'sem', 'rokA', 'osoby', 'opis'].map(p => `row-grup-${p}-${id}`);
        else if (zasob === 'zajecia') pola = ['dzien', 'rozp', 'zak', 'uwagi'].map(p => `row-zaj-${p}-${id}`);

        // Zablokowanie edycji i przywrócenie oryginalnych wartości
        pola.forEach(idPola => {
            var el = document.getElementById(idPola);
            if (el) {
                if (el.hasAttribute('data-oryginal')) {
                    el.textContent = el.getAttribute('data-oryginal'); // Przywracamy tekst
                }
                el.contentEditable = "false";
                el.style.backgroundColor = "";
                el.style.borderBottom = "";
                el.style.outline = "";
                el.style.padding = "";
                el.style.borderRadius = "";
            }
        });

        // Przywrócenie przycisków Edytuj / Usuń
        var tdAkcje = document.getElementById(`akcje-${id}`);
        if (tdAkcje) {
            var editBtnStyle = "background: var(--gray-dark); color: #fff;";
            var delBtnStyle = "background: var(--color-error); color: #fff;";
            var etykietaUsun = (zasob === 'zajecia') ? 'Odwołaj' : 'Usuń';

            tdAkcje.innerHTML = `
                <button id="btn-edytuj-${id}" class="przycisk-maly" style="${editBtnStyle}" onclick="odblokujEdycje(${id})">Edytuj</button>
                <button class="przycisk-maly" style="${delBtnStyle}" onclick="usunWiersz(${id})">${etykietaUsun}</button>
            `;
        }
    };

    window.zapiszEdycje = function(id) {
        var zasob = document.getElementById('wybierz-zasob-crud').value;
        var url = `/api/CRUD/${zasob}/${id}/`;
        var payload = {};

        var pobierzWartosc = (idPola) => {
            var el = document.getElementById(idPola);
            return el ? el.textContent.trim() : undefined;
        };

        if (zasob === 'subject') {
            payload = {
                nazwap: pobierzWartosc(`row-sub-nazwa-${id}`),
                formap: pobierzWartosc(`row-sub-forma-${id}`),
                lbgodz: pobierzWartosc(`row-sub-godz-${id}`)
            };
        } else if (zasob === 'sala') {
            payload = {
                numers: pobierzWartosc(`row-sala-numer-${id}`),
                typs: pobierzWartosc(`row-sala-typ-${id}`),
                pojemnosc: pobierzWartosc(`row-sala-poj-${id}`)
            };
        } else if (zasob === 'pracownik') {
            var noweHaslo = prompt("Podaj nowe hasło dla pracownika (zostaw puste, jeśli bez zmian):");
            payload = {
                stopien: pobierzWartosc(`row-prac-stopien-${id}`),
                imie: pobierzWartosc(`row-prac-imie-${id}`),
                nazwisko: pobierzWartosc(`row-prac-nazwisko-${id}`),
                email: pobierzWartosc(`row-prac-email-${id}`),
                nrtel: pobierzWartosc(`row-prac-tel-${id}`),
                rola: pobierzWartosc(`row-prac-rola-${id}`),
                haslo: noweHaslo || undefined
            };
        } else if (zasob === 'grupa') {
            payload = {
                rokstudiow: pobierzWartosc(`row-grup-rokS-${id}`),
                semestr: pobierzWartosc(`row-grup-sem-${id}`),
                rokakadem: pobierzWartosc(`row-grup-rokA-${id}`),
                liczbaos: pobierzWartosc(`row-grup-osoby-${id}`),
                opis: pobierzWartosc(`row-grup-opis-${id}`)
            };
        } else if (zasob === 'zajecia') {
            payload = {
                dzien: pobierzWartosc(`row-zaj-dzien-${id}`),
                godzrozp: pobierzWartosc(`row-zaj-rozp-${id}`),
                godzzak: pobierzWartosc(`row-zaj-zak-${id}`),
                uwagi: pobierzWartosc(`row-zaj-uwagi-${id}`)
            };
        }

        wykonajZapytanieCrud(url, 'PUT', payload);
    };

    window.usunWiersz = function(id) {
        var zasob = document.getElementById('wybierz-zasob-crud').value;
        var url = `/api/CRUD/${zasob}/${id}/`;
        if (confirm(`Czy na pewno chcesz usunąć rekord o ID: ${id}?`)) {
            wykonajZapytanieCrud(url, 'DELETE');
        }
    };

    // --- LOGIKA MIGRACJI CSV ---
    document.getElementById('btn-eksport-model').onclick = function() {
        var model = document.getElementById('wybierz-model-csv').value;
        window.location.href = `/api/data/export/${model}/`;
    };

    document.getElementById('btn-import-model').onclick = function() {
        var model = document.getElementById('wybierz-model-csv').value;
        var plikInput = document.getElementById('plik-import-csv');
        var komunikat = document.getElementById('komunikat-csv');

        if (plikInput.files.length === 0) {
            komunikat.style.color = 'var(--color-error)';
            komunikat.textContent = 'Proszę najpierw wybrać plik .csv do załadowania.';
            return;
        }

        var formData = new FormData();
        formData.append('file', plikInput.files[0]);
        komunikat.style.color = 'var(--color-main)';
        komunikat.textContent = 'Przetwarzanie pliku importu...';

        fetch(`/api/data/import/${model}/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': window.CSRF_TOKEN },
            body: formData
        })
        .then(res => res.json())
        .then(dane => {
            if (dane.status === 'success') {
                komunikat.style.color = 'var(--color-success)';
                komunikat.textContent = dane.message;
                plikInput.value = '';
                zaladujDaneDoTabeli();
            } else {
                komunikat.style.color = 'var(--color-error)';
                komunikat.textContent = dane.message + (dane.skipped ? ` Pominiętych wierszy: ${dane.skipped.length}` : '');
            }
        })
        .catch(() => {
            komunikat.style.color = 'var(--color-error)';
            komunikat.textContent = 'Błąd krytyczny podczas wysyłania pliku na serwer.';
        });
    };

    // --- LOGIKA FORMULARZY I OPERACJI CRUD ---
    document.getElementById('wybierz-zasob-crud').onchange = przelaczZasobCrud;



    function przelaczZasobCrud() {
        var zasob = document.getElementById('wybierz-zasob-crud').value;
        var kontenerForm = document.getElementById('kontener-formularza-crud');
        document.getElementById('komunikat-crud').textContent = '';

        document.getElementById('podglad-danych-kontener').classList.remove('hidden');
        zaladujDaneDoTabeli();

        // Wspólny styl dla list rozwijanych pasujący do Twojego szablonu
        const selectStyle = "padding: 10px 12px; width: 100%; margin-top: 5px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--gray-medium); border-radius: 6px; font-family: 'Inter', sans-serif;";

        if (zasob === 'subject') {
            kontenerForm.innerHTML = `
                <h4 style="margin-top: 0;">Dodaj Nowy Przedmiot</h4>
                <div class="pole"><input type="text" id="sub-nazwa" placeholder="Nazwa przedmiotu (np. Programowanie)"></div>
                <div class="pole"><input type="text" id="sub-forma" placeholder="Forma (np. Wykład / Laboratorium)"></div>
                <div class="pole"><input type="number" id="sub-godz" placeholder="Liczba godzin (np. 30)"></div>
                <button id="btn-sub-add" class="przycisk-akcja" style="background: var(--color-success); margin-top:10px;">Dodaj obiekt (POST)</button>
            `;
            document.getElementById('btn-sub-add').onclick = function() {
                wykonajZapytanieCrud('/api/CRUD/subject/', 'POST', {
                    nazwap: document.getElementById('sub-nazwa').value,
                    formap: document.getElementById('sub-forma').value,
                    lbgodz: document.getElementById('sub-godz').value
                });
            };
        }
        else if (zasob === 'sala') {
            kontenerForm.innerHTML = `
                <h4 style="margin-top: 0;">Dodaj Nową Salę Wykładową</h4>
                <div class="pole"><input type="text" id="sala-numer" placeholder="Numer sali (np. 112A)"></div>
                <div class="pole"><input type="text" id="sala-typ" placeholder="Typ sali (np. Laboratoryjna)"></div>
                <div class="pole"><input type="number" id="sala-pojemnosc" placeholder="Pojemność sali (np. 30)"></div>
                <div class="pole">
                    <label style="font-size: 13px; color: var(--text-secondary);"><strong>Budynek:</strong></label>
                    <select id="sala-idb" style="${selectStyle}"></select>
                </div>
                <button id="btn-sala-add" class="przycisk-akcja" style="background: var(--color-success); margin-top:10px;">Dodaj obiekt (POST)</button>
            `;

            // Dynamiczne pobranie budynków
            uzupelnijWyborCrud('/api/CRUD/budynek/', 'sala-idb', 'budynki', b => `${b.nazwab} (${b.adresb || ''})`);

            document.getElementById('btn-sala-add').onclick = function() {
                wykonajZapytanieCrud('/api/CRUD/sala/', 'POST', {
                    numers: document.getElementById('sala-numer').value,
                    typs: document.getElementById('sala-typ').value,
                    pojemnosc: document.getElementById('sala-pojemnosc').value,
                    idb: document.getElementById('sala-idb').value
                });
            };
        }
        else if (zasob === 'pracownik') {
            kontenerForm.innerHTML = `
                <h4 style="margin-top: 0;">Dodaj Nowego Pracownika</h4>
                <div class="pole"><input type="text" id="prac-stopien" placeholder="Stopień naukowy (np. dr inż.)"></div>
                <div class="pole"><input type="text" id="prac-imie" placeholder="Imię"></div>
                <div class="pole"><input type="text" id="prac-nazwisko" placeholder="Nazwisko"></div>
                <div class="pole"><input type="email" id="prac-email" placeholder="E-mail logowania"></div>
                <div class="pole"><input type="text" id="prac-nrtel" placeholder="Numer telefonu"></div>
                <div class="pole"><input type="password" id="prac-haslo" placeholder="Hasło konta"></div>
                <div class="pole"><input type="text" id="prac-rola" placeholder="Rola w systemie (wykladowca / planista)"></div>
                <button id="btn-prac-add" class="przycisk-akcja" style="background: var(--color-success); margin-top:10px;">Dodaj obiekt (POST)</button>
            `;
            document.getElementById('btn-prac-add').onclick = function() {
                wykonajZapytanieCrud('/api/CRUD/pracownik/', 'POST', {
                    stopien: document.getElementById('prac-stopien').value,
                    imie: document.getElementById('prac-imie').value,
                    nazwisko: document.getElementById('prac-nazwisko').value,
                    email: document.getElementById('prac-email').value,
                    nrtel: document.getElementById('prac-nrtel').value,
                    haslo: document.getElementById('prac-haslo').value,
                    rola: document.getElementById('prac-rola').value
                });
            };
        }
        else if (zasob === 'grupa') {
            kontenerForm.innerHTML = `
                <h4 style="margin-top: 0;">Dodaj Nową Grupę</h4>
                <div class="pole">
                    <label style="font-size: 13px; color: var(--text-secondary);"><strong>Kierunek studiów:</strong></label>
                    <select id="grup-idk" style="${selectStyle}"></select>
                </div>
                <div class="pole"><input type="number" id="grup-rokstudiow" placeholder="Rok studiów (np. 1)"></div>
                <div class="pole"><input type="number" id="grup-semestr" placeholder="Semestr (np. 2)"></div>
                <div class="pole"><input type="text" id="grup-rokakadem" placeholder="Rok akademicki (np. 2025/2026)"></div>
                <div class="pole"><input type="number" id="grup-liczbaos" placeholder="Liczba studentów (np. 24)"></div>
                <div class="pole"><input type="text" id="grup-opis" placeholder="Krótki opis grupy"></div>
                <button id="btn-grup-add" class="przycisk-akcja" style="background: var(--color-success); margin-top:10px;">Dodaj obiekt (POST)</button>
            `;

            // Dynamiczne pobranie kierunków
            uzupelnijWyborCrud('/api/CRUD/kierunek/', 'grup-idk', 'kierunki', k => `${k.nazwak}`);

            document.getElementById('btn-grup-add').onclick = function() {
                wykonajZapytanieCrud('/api/CRUD/grupa/', 'POST', {
                    idk: document.getElementById('grup-idk').value,
                    rokstudiow: document.getElementById('grup-rokstudiow').value,
                    semestr: document.getElementById('grup-semestr').value,
                    rokakadem: document.getElementById('grup-rokakadem').value,
                    liczbaos: document.getElementById('grup-liczbaos').value,
                    opis: document.getElementById('grup-opis').value
                });
            };
        }
        else if (zasob === 'zajecia') {
            kontenerForm.innerHTML = `
                <h4 style="margin-top: 0;">Zaplanuj Nowe Zajęcia</h4>
                <div class="pole"><input type="text" id="zaj-dzien" placeholder="Dzień tygodnia (np. Poniedziałek)"></div>
                <div class="pole"><input type="text" id="zaj-godzrozp" placeholder="Godzina startu (Format HH:MM, np. 08:15)"></div>
                <div class="pole"><input type="text" id="zaj-godzzak" placeholder="Godzina końca (Format HH:MM, np. 09:45)"></div>
                <div class="pole"><input type="text" id="zaj-uwagi" placeholder="Uwagi (opcjonalne)"></div>

                <div class="pole">
                    <label style="font-size: 13px; color: var(--text-secondary);"><strong>Sala wykładowa:</strong></label>
                    <select id="zaj-ids" style="${selectStyle}"></select>
                </div>
                <div class="pole">
                    <label style="font-size: 13px; color: var(--text-secondary);"><strong>Przedmiot:</strong></label>
                    <select id="zaj-idp" style="${selectStyle}"></select>
                </div>
                <div class="pole">
                    <label style="font-size: 13px; color: var(--text-secondary);"><strong>Wykładowca / Prowadzący:</strong></label>
                    <select id="zaj-idpr" style="${selectStyle}"></select>
                </div>
                <div class="pole">
                    <label style="font-size: 13px; color: var(--text-secondary);"><strong>Grupa studencka:</strong></label>
                    <select id="zaj-idg" style="${selectStyle}"></select>
                </div>

                <button id="btn-zaj-add" class="przycisk-akcja" style="background: var(--color-success); margin-top:10px;">Zaplanuj zajęcia (POST)</button>
            `;

            // Pobieranie danych z Twoich istniejących już endpointów API w Django!
            uzupelnijWyborCrud('/api/CRUD/sala/', 'zaj-ids', 'sale', s => `Sala ${s.numers} (${s.typs || 'ogólna'})`);
            uzupelnijWyborCrud('/api/CRUD/subject/', 'zaj-idp', 'subjects', p => `${p.nazwap} (${p.formap})`);
            uzupelnijWyborCrud('/api/CRUD/pracownik/', 'zaj-idpr', 'pracownicy', pr => `${pr.stopien || ''} ${pr.imie} ${pr.nazwisko}`);
            uzupelnijWyborCrud('/api/CRUD/grupa/', 'zaj-idg', 'grupy', g => `Semestr ${g.semestr}, Rok ${g.rokstudiow} (${g.opis || 'brak opisu'})`);

            document.getElementById('btn-zaj-add').onclick = function() {
                wykonajZapytanieCrud('/api/CRUD/zajecia/', 'POST', {
                    dzien: document.getElementById('zaj-dzien').value,
                    godzrozp: document.getElementById('zaj-godzrozp').value,
                    godzzak: document.getElementById('zaj-godzzak').value,
                    uwagi: document.getElementById('zaj-uwagi').value,
                    ids: document.getElementById('zaj-ids').value,
                    idp: document.getElementById('zaj-idp').value,
                    idpr: document.getElementById('zaj-idpr').value,
                    idg: document.getElementById('zaj-idg').value
                });
            };
        }
    }


    function wykonajZapytanieCrud(url, metoda, bodyObiekt) {
        var komunikat = document.getElementById('komunikat-crud');
        komunikat.style.color = 'var(--text-primary)';
        komunikat.textContent = 'Trwa komunikacja z serwerem API...';

        var opcjeFetch = {
            method: metoda,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRF_TOKEN
            }
        };
        if (metoda !== 'DELETE') {
            opcjeFetch.body = JSON.stringify(bodyObiekt);
        }

        fetch(url, opcjeFetch)
        .then(res => res.json())
        .then(dane => {
            if (dane.status === 'success') {
                komunikat.style.color = 'var(--color-success)';
                komunikat.textContent = dane.message + (dane.id ? ` (ID: ${dane.id})` : '');
                zaladujDaneDoTabeli();
            } else {
                komunikat.style.color = 'var(--color-error)';
                komunikat.textContent = 'Błąd: ' + (dane.message || 'Wystąpił nieznany błąd serwera.');
            }
        })
        .catch(() => {
            komunikat.style.color = 'var(--color-error)';
            komunikat.textContent = 'Błąd połączenia z backendem Django.';
        });
    }

    function zaladujDaneDoTabeli() {
        var zasob = document.getElementById('wybierz-zasob-crud').value;
        var naglowekText = document.getElementById('naglowek-podgladu');
        var thr = document.getElementById('naglowki-tabeli-crud');
        var tbody = document.querySelector('#tabela-wszystkie-rekordy tbody');

        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color: var(--text-primary);">Ładowanie danych z bazy...</td></tr>';

        fetch(`/api/CRUD/${zasob}/`)
        .then(res => res.json())
        .then(dane => {
            if (dane.status !== 'success') {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color: var(--color-error);">Nie udało się pobrać danych.</td></tr>';
                return;
            }

            var editBtnStyle = "background: var(--gray-dark); color: #fff;";
            var delBtnStyle = "background: var(--color-error); color: #fff;";

            if (zasob === 'subject') {
                naglowekText.textContent = "Aktualna lista przedmiotów";
                thr.innerHTML = `<th>ID</th><th>Nazwa przedmiotu</th><th>Forma</th><th>Liczba godzin</th><th>Akcje</th>`;
                if(dane.subjects && dane.subjects.length > 0) {
                    tbody.innerHTML = dane.subjects.map(s => {
                        var id = s.id_przedmiotu || s.id;
                        return `
                        <tr>
                            <td><strong>${id}</strong></td>
                            <td id="row-sub-nazwa-${id}">${s.nazwap}</td>
                            <td id="row-sub-forma-${id}">${s.formap}</td>
                            <td id="row-sub-godz-${id}">${s.lbgodz}</td>
                            <td id="akcje-${id}">
                                <button id="btn-edytuj-${id}" class="przycisk-maly" style="${editBtnStyle}" onclick="odblokujEdycje(${id})">Edytuj</button>
                                <button class="przycisk-maly" style="${delBtnStyle}" onclick="usunWiersz(${id})">Usuń</button>
                            </td>
                        </tr>
                        `;
                    }).join('');
                } else { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">Brak rekordów.</td></tr>'; }
            }
            else if (zasob === 'sala') {
                naglowekText.textContent = "Aktualna lista sal wykładowych";
                thr.innerHTML = `<th>ID</th><th>Numer sali</th><th>Typ</th><th>Pojemność</th><th>Akcje</th>`;
                if(dane.sale && dane.sale.length > 0) {
                    tbody.innerHTML = dane.sale.map(s => {
                        var id = s.id_sali || s.id;
                        return `
                        <tr>
                            <td><strong>${id}</strong></td>
                            <td id="row-sala-numer-${id}">${s.numers}</td>
                            <td id="row-sala-typ-${id}">${s.typs}</td>
                            <td id="row-sala-poj-${id}">${s.pojemnosc}</td>
                            <td id="akcje-${id}">
                                <button id="btn-edytuj-${id}" class="przycisk-maly" style="${editBtnStyle}" onclick="odblokujEdycje(${id})">Edytuj</button>
                                <button class="przycisk-maly" style="${delBtnStyle}" onclick="usunWiersz(${id})">Usuń</button>
                            </td>
                        </tr>
                        `;
                    }).join('');
                } else { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">Brak rekordów.</td></tr>'; }
            }
            else if (zasob === 'pracownik') {
                naglowekText.textContent = "Aktualna lista pracowników";
                thr.innerHTML = `<th>ID</th><th>Stopień</th><th>Imię</th><th>Nazwisko</th><th>E-mail</th><th>Telefon</th><th>Rola</th><th>Akcje</th>`;
                if(dane.pracownicy && dane.pracownicy.length > 0) {
                    tbody.innerHTML = dane.pracownicy.map(p => {
                        var id = p.id_pracownika || p.id;
                        return `
                        <tr>
                            <td><strong>${id}</strong></td>
                            <td id="row-prac-stopien-${id}">${p.stopien || ''}</td>
                            <td id="row-prac-imie-${id}">${p.imie}</td>
                            <td id="row-prac-nazwisko-${id}">${p.nazwisko}</td>
                            <td id="row-prac-email-${id}">${p.email}</td>
                            <td id="row-prac-tel-${id}">${p.nrtel || ''}</td>
                            <td id="row-prac-rola-${id}">${p.rola || ''}</td>
                            <td id="akcje-${id}">
                                <button id="btn-edytuj-${id}" class="przycisk-maly" style="${editBtnStyle}" onclick="odblokujEdycje(${id})">Edytuj</button>
                                <button class="przycisk-maly" style="${delBtnStyle}" onclick="usunWiersz(${id})">Usuń</button>
                            </td>
                        </tr>
                        `;
                    }).join('');
                } else { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--text-secondary);">Brak rekordów.</td></tr>'; }
            }
            else if (zasob === 'grupa') {
                naglowekText.textContent = "Aktualna lista grup studenckich";
                thr.innerHTML = `<th>ID</th><th>Rok studiów</th><th>Semestr</th><th>Rok akademicki</th><th>Liczba osób</th><th>Opis</th><th>Akcje</th>`;
                if(dane.grupy && dane.grupy.length > 0) {
                    tbody.innerHTML = dane.grupy.map(g => {
                        var id = g.id_grupy || g.id;
                        return `
                        <tr>
                            <td><strong>${id}</strong></td>
                            <td id="row-grup-rokS-${id}">${g.rokstudiow}</td>
                            <td id="row-grup-sem-${id}">${g.semestr}</td>
                            <td id="row-grup-rokA-${id}">${g.rokakadem}</td>
                            <td id="row-grup-osoby-${id}">${g.liczbaos}</td>
                            <td id="row-grup-opis-${id}">${g.opis || ''}</td>
                            <td id="akcje-${id}">
                                <button id="btn-edytuj-${id}" class="przycisk-maly" style="${editBtnStyle}" onclick="odblokujEdycje(${id})">Edytuj</button>
                                <button class="przycisk-maly" style="${delBtnStyle}" onclick="usunWiersz(${id})">Usuń</button>
                            </td>
                        </tr>
                        `;
                    }).join('');
                } else { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-secondary);">Brak rekordów.</td></tr>'; }
            }
            else if (zasob === 'zajecia') {
                naglowekText.textContent = "Aktualna lista wszystkich zajęć w systemie";
                thr.innerHTML = `<th>ID</th><th>Dzień</th><th>Godziny</th><th>Przedmiot</th><th>Sala</th><th>Uwagi</th><th>Akcje</th>`;
                if(dane.zajecia && dane.zajecia.length > 0) {
                    tbody.innerHTML = dane.zajecia.map(z => {
                        var id = z.idz || z.id;
                        return `
                        <tr>
                            <td><strong>${id}</strong></td>
                            <td id="row-zaj-dzien-${id}">${z.dzien}</td>
                            <td><span id="row-zaj-rozp-${id}">${z.godzrozp}</span> - <span id="row-zaj-zak-${id}">${z.godzzak}</span></td>
                            <td>${z.przedmiot ? z.przedmiot.nazwap : ''}</td>
                            <td>${z.sala && z.sala.budynek ? z.sala.budynek.nazwab : ''} s. ${z.sala ? z.sala.numers : ''}</td>
                            <td id="row-zaj-uwagi-${id}">${z.uwagi || ''}</td>
                            <td id="akcje-${id}">
                                <button id="btn-edytuj-${id}" class="przycisk-maly" style="${editBtnStyle}" onclick="odblokujEdycje(${id})">Edytuj</button>
                                <button class="przycisk-maly" style="${delBtnStyle}" onclick="usunWiersz(${id})">Usuń</button>
                            </td>
                        </tr>
                        `;
                    }).join('');
                } else { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-secondary);">Brak zdefiniowanych zajęć w bazie danych.</td></tr>'; }
            }
        })
        .catch(() => {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color: var(--color-error);">Nie udało się załadować podglądu danych.</td></tr>';
        });
    }

    function uzupelnijWyborCrud(url, elementId, kluczDanych, formatujNazwe) {
        const select = document.getElementById(elementId);
        if (!select) return;

        select.innerHTML = '<option value="">Ładowanie opcji...</option>';

        fetch(url)
        .then(res => res.json())
        .then(dane => {
            if (dane.status === 'success' && dane[kluczDanych]) {
                select.innerHTML = '<option value="">-- Wybierz z listy --</option>';
                dane[kluczDanych].forEach(item => {
                    // Obsługa różnych nazw pól kluczy głównych w bazie
                    const id = item.id || item.id_sali || item.id_przedmiotu || item.id_pracownika || item.id_grupy || item.idb || item.idk;
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = formatujNazwe(item);
                    select.appendChild(option);
                });
            } else {
                select.innerHTML = '<option value="">Nie udało się załadować danych</option>';
            }
        })
        .catch(() => {
            select.innerHTML = '<option value="">Błąd połączenia z serwerem</option>';
        });
    }

}


// Funkcja pokazPanelWykladowcy:
function pokazPanelWykladowcy(app) {
    var email = sessionStorage.getItem('email');
    var planTekst = sessionStorage.getItem('plan');
    var planZajec = planTekst ? JSON.parse(planTekst) : [];

    var wierszeTabeli = planZajec.map(function(zajecie) {
        return `
            <tr>
                <td>${zajecie.dzien}</td>
                <td>${zajecie.godzrozp} - ${zajecie.godzzak}</td>
                <td>${zajecie.przedmiot.nazwap} (${zajecie.przedmiot.formap})</td>
                <td>${zajecie.sala.budynek.nazwab}, sala ${zajecie.sala.numers}</td>
                <td>${zajecie.kierunek.nazwak} (sem. ${zajecie.kierunek.semestr})</td>
            </tr>
        `;
    }).join('');
    if (planZajec.length === 0) {
        wierszeTabeli = '<tr><td colspan="5" style="text-align: center;">Brak zaplanowanych zajęć</td></tr>';
    }

    app.innerHTML = `
        <div class="panel-kontener">
            <div class="panel-naglowek">
                <h2>Panel Wykładowcy</h2>
                <p>Zalogowano jako: <strong>${email}</strong></p>
                <button id="przycisk-wyloguj-wykladowca" class="przycisk-maly">Wyloguj się</button>
            </div>
            <div class="akcje-panelu">
                <button id="przycisk-pokaz-haslo-wykladowca" class="przycisk-akcja">Zmień hasło</button>
                <button id="przycisk-eksport-csv-wykladowca" class="przycisk-akcja">Pobierz plan (CSV)</button>
            </div>
            <div id="sekcja-haslo-wykladowca" class="ukryta-sekcja hidden">
                <h3>Zmiana hasła</h3>
                <div id="komunikat-haslo-wykladowca" class="blad hidden"></div>
                <div class="pole">
                    <input type="password" id="stare-haslo-wykladowca" placeholder="Stare hasło">
                </div>
                <div class="pole">
                    <input type="password" id="nowe-haslo-wykladowca" placeholder="Nowe hasło">
                </div>
                <button id="przycisk-zmien-haslo-wykladowca" class="przycisk-akcja">Potwierdź zmianę</button>
            </div>
            <h3>Twój plan zajęć:</h3>
            <table class="tabela-planu">
                <thead>
                    <tr>
                        <th>Dzień</th>
                        <th>Godziny</th>
                        <th>Przedmiot</th>
                        <th>Sala</th>
                        <th>Kierunek (semestr)</th>
                    </tr>
                </thead>
                <tbody>
                    ${wierszeTabeli}
                </tbody>
            </table>
        </div>
    `;

    // Wylogowywanie:
    document.getElementById('przycisk-wyloguj-wykladowca').onclick = function() {
        fetch('/api/auth/logout/', { method: 'POST', headers: { 'X-CSRFToken': window.CSRF_TOKEN } })
        .then(function() {
            sessionStorage.clear();
            history.pushState({}, '', '/logowanie/');
            router();
        });
    };

    // Przełączanie zmiany hasła:
    document.getElementById('przycisk-pokaz-haslo-wykladowca').onclick = function() {
        document.getElementById('sekcja-haslo-wykladowca').classList.toggle('hidden');
    };

    // Logika eksportu CSV:
    document.getElementById('przycisk-eksport-csv-wykladowca').onclick = function() {
        if (planZajec.length === 0) {
            alert('Brak zajęć do eksportu.');
            return;
        }

        var naglowki = ['Dzien', 'Od', 'Do', 'Przedmiot', 'Forma', 'Sala', 'Budynek', 'Kierunek'];

        var wierszeCsv = planZajec.map(function(z) {
            return [
                z.dzien, z.godzrozp, z.godzzak,
                z.przedmiot.nazwap, z.przedmiot.formap,
                z.sala.numers, z.sala.budynek.nazwab,
                z.kierunek.nazwak + " (sem. " + z.kierunek.semestr + ")"
            ].join(';');
        });

        var csvTekst = '\uFEFF' + naglowki.join(';') + '\n' + wierszeCsv.join('\n');
        var blob = new Blob([csvTekst], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');

        link.href = URL.createObjectURL(blob);
        link.download = 'plan_wykladowcy.csv';
        link.click();
    };

    // Logika zmiany hasła:
    document.getElementById('przycisk-zmien-haslo-wykladowca').onclick = function() {
        var stareHaslo = document.getElementById('stare-haslo-wykladowca').value;
        var noweHaslo = document.getElementById('nowe-haslo-wykladowca').value;
        var komunikat = document.getElementById('komunikat-haslo-wykladowca');

        fetch('/api/auth/change_password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRF_TOKEN
            },
            body: JSON.stringify({ old_password: stareHaslo, new_password: noweHaslo })
        })
        .then(res => res.json())
        .then(dane => {
            komunikat.classList.remove('hidden');
            if (dane.status === 'success') {
                komunikat.style.color = 'green';
                komunikat.textContent = 'Hasło zostało zmienione!';

            } else {
                komunikat.style.color = 'red';
                komunikat.textContent = dane.message;

            }
        });
    };
}



// Funkcja router - Przeglądarka sprawdza aktualny adres URL i wyświetla odpowiednią treść:
function router() {
    var sciezka = window.location.pathname;
    var app = document.getElementById('app');

    if (sciezka === '/logowanie/' || sciezka === '/logowanie') {
        pokazLogowanie(app);
    } else if (sciezka === '/panel-studenta/' || sciezka === '/panel-studenta') {
        pokazPanelStudenta(app);
    } else if (sciezka === '/panel-wykladowcy/' || sciezka === '/panel-wykladowcy') {
        pokazPanelWykladowcy(app);
    } else if (sciezka === '/panel-planisty/' || sciezka === '/panel-planisty') {
        pokazPanelPlanisty(app);
    } else {
        app.innerHTML = '<h1>Strona główna</h1>';
    }
}
document.addEventListener('DOMContentLoaded', function() {
    router();
});