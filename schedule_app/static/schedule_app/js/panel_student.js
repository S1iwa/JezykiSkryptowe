function pokazPanelStudenta(app) {
    var email = sessionStorage.getItem('email');
    var imie = sessionStorage.getItem('imie');
    var nazwisko = sessionStorage.getItem('nazwisko');
    var status = sessionStorage.getItem('status_studenta');
    var planTekst = sessionStorage.getItem('plan');
    var planZajec = planTekst ? JSON.parse(planTekst) : [];

    var pelneImie = `${imie} ${nazwisko}`;
    if (!imie && !nazwisko) pelneImie = email;

    var liczbaZajec = planZajec.length;

    // Funkcja renderująca wiersze tabeli
    function renderujWiersze(zajecia) {
        if (!zajecia || zajecia.length === 0) {
            return '<tr><td colspan="5" class="tekst-wysrodkowany tekst-szary">Brak zaplanowanych zajęć</td></tr>';
        }
        return zajecia.map(function(z) {
            var prowadzacyNazwa = `${z.prowadzacy.imie} ${z.prowadzacy.nazwisko}`;
            return `
                <tr>
                    <td>${z.dzien}</td>
                    <td>${z.godzrozp} - ${z.godzzak}</td>
                    <td>${z.przedmiot.nazwap} (${z.przedmiot.formap})</td>
                    <td>${z.sala.budynek.nazwab}, sala ${z.sala.numers}</td>
                    <td>${z.prowadzacy.stopien || ''} ${prowadzacyNazwa}</td>
                </tr>
            `;
        }).join('');
    }

    app.innerHTML = `
        <div class="panel-layout">
            <aside class="panel-sidebar">
                <p class="sidebar-tytul">Panel Studenta</p>
                <div class="sidebar-info">
                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">Zalogowano jako</span>
                        <span class="sidebar-info-wartosc tekst-pogrubiony">${pelneImie}</span>
                    </div>
                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">E-mail</span>
                        <span class="sidebar-info-wartosc">${email}</span>
                    </div>
                    ${status ? `
                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">Status</span>
                        <span class="sidebar-info-wartosc">${status}</span>
                    </div>
                    ` : ''}

                    <div class="sidebar-divider" ></div>

                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">Zaplanowane zajęcia</span>
                        <span class="sidebar-info-wartosc">${liczbaZajec}</span>
                    </div>
                </div>

                <hr class="sidebar-divider" >

                <!-- Wyszukiwanie prowadzącego – zawsze widoczne pod separatorem -->
                <div>
                    <span class="sidebar-info-label odstep-maly">Szukaj prowadzącego</span>
                    <div class="pole odstep-maly">
                        <input type="text" id="szukaj-imie" placeholder="Imię">
                    </div>
                    <div class="pole odstep-maly">
                        <input type="text" id="szukaj-nazwisko" placeholder="Nazwisko">
                    </div>
                    <button id="przycisk-szukaj" class="sidebar-btn">Szukaj</button>
                    <div id="komunikat-szukaj" class="tekst-szary hidden odstep-maly"></div>
                </div>

                <hr class="sidebar-divider">
                <div class="sidebar-akcje">
                    <button id="przycisk-motyw-student" class="sidebar-btn motyw">${document.body.classList.contains('dark') ? '<span class="material-symbols-outlined">light_mode</span> Jasny motyw' : '<span class="material-symbols-outlined">dark_mode</span> Ciemny motyw'}</button>
                    <button id="przycisk-eksport-csv" class="sidebar-btn"><span class="material-symbols-outlined">download</span> Pobierz plan (CSV)</button>
                    <button id="przycisk-pokaz-haslo" class="sidebar-btn"><span class="material-symbols-outlined">key</span> Zmień hasło</button>
                    <button id="przycisk-wyloguj" class="sidebar-btn danger"><span class="material-symbols-outlined">logout</span> Wyloguj się</button>
                </div>
            </aside>

            <main class="panel-content">

                <!-- Sekcja zmiany hasła -->
                <div id="sekcja-haslo" class="content-sekcja hidden odstep-duzy">
                    <h3 class="naglowek-maly">Zmiana hasła</h3>
                    <div id="komunikat-haslo" class="blad hidden"></div>
                    <div class="pole">
                        <input type="password" id="stare-haslo" placeholder="Stare hasło">
                    </div>
                    <div class="pole">
                        <input type="password" id="nowe-haslo" placeholder="Nowe hasło">
                    </div>
                    <button id="przycisk-zmien-haslo" class="przycisk-akcja">Potwierdź zmianę</button>
                </div>

                <!-- Tabela prowadzących – pojawia się po wyszukaniu -->
                <div id="kontener-prowadzacych" class="hidden odstep-bardzo-duzy">
                    <h3 id="naglowek-prowadzacych" class="odstep-sredni">Znalezieni prowadzący</h3>
                    <table class="tabela-planu" id="tabela-prowadzacych">
                        <thead>
                            <tr>
                                <th>Stopień</th>
                                <th>Imię i nazwisko</th>
                                <th>E-mail</th>
                                <th>Prowadzone przedmioty</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-prowadzacych"></tbody>
                    </table>
                </div>

                <h3 id="naglowek-tabeli" class="odstep-sredni">Twój plan zajęć</h3>

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
                    <tbody id="tbody-planu">
                        ${renderujWiersze(planZajec)}
                    </tbody>
                </table>
            </main>
        </div>
    `;

    // Przełączanie motywu
    document.getElementById('przycisk-motyw-student').onclick = function() {
        toggleMotyw();
        this.innerHTML = document.body.classList.contains('dark') ? '<span class="material-symbols-outlined">light_mode</span> Jasny motyw' : '<span class="material-symbols-outlined">dark_mode</span> Ciemny motyw';
    };

    document.getElementById('przycisk-wyloguj').onclick = function() {
        apiCall('/api/auth/logout/', { method: 'POST' })
        .then(function() {
            sessionStorage.clear();
            history.pushState({}, '', '/logowanie/');
            router();
        });
    };

    document.getElementById('przycisk-pokaz-haslo').onclick = function() {
        document.getElementById('sekcja-haslo').classList.toggle('hidden');
    };

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
                (z.prowadzacy.stopien || '') + ' ' + z.prowadzacy.nazwisko
            ].join(';');
        });
        var csvTekst = '\uFEFF' + naglowki.join(';') + '\n' + wierszeCsv.join('\n');
        var blob = new Blob([csvTekst], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'moj_plan_zajec.csv';
        link.click();
    };

    document.getElementById('przycisk-zmien-haslo').onclick = function() {
        var stareHaslo = document.getElementById('stare-haslo').value;
        var noweHaslo = document.getElementById('nowe-haslo').value;
        var komunikat = document.getElementById('komunikat-haslo');
        
        apiCall('/api/auth/change_password/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_password: stareHaslo, new_password: noweHaslo })
        })
        .then(dane => {
            komunikat.classList.remove('hidden');
            if (dane.status === 'success') {
                komunikat.classList.add('tekst-sukces');
                komunikat.classList.remove('tekst-blad');
                komunikat.textContent = 'Hasło zostało zmienione!';
            } else {
                komunikat.classList.add('tekst-blad');
                komunikat.classList.remove('tekst-sukces');
                komunikat.textContent = dane.message;
            }
        })
        .catch(err => {
            komunikat.classList.remove('hidden');
            komunikat.classList.remove('tekst-sukces');
            komunikat.classList.add('tekst-blad');
            komunikat.textContent = err.message || 'Wystąpił błąd.';
        });
    };

    document.getElementById('przycisk-szukaj').onclick = function() {
        var imieVal = document.getElementById('szukaj-imie').value.trim();
        var nazwiskoVal = document.getElementById('szukaj-nazwisko').value.trim();
        var komunikat = document.getElementById('komunikat-szukaj');
        var tbody = document.getElementById('tbody-planu');
        var naglowek = document.getElementById('naglowek-tabeli');

        if (!imieVal && !nazwiskoVal) {
            document.getElementById('kontener-prowadzacych').classList.add('hidden');
            komunikat.style.display = 'none';
            tbody.innerHTML = renderujWiersze(planZajec);
            naglowek.textContent = 'Twój plan zajęć';
            return;
        }

        komunikat.style.display = 'none';

        apiCall(`/api/students/professors-information/?imie=${encodeURIComponent(imieVal)}&nazwisko=${encodeURIComponent(nazwiskoVal)}`)
        .then(dane => {
            var kontener = document.getElementById('kontener-prowadzacych');
            var tbodyProw = document.getElementById('tbody-prowadzacych');

            if (dane.status === 'success') {
                var znalezieni = new Set(
                    dane.prowadzacy.map(p => `${p.imie} ${p.nazwisko}`.toLowerCase())
                );

                tbodyProw.innerHTML = dane.prowadzacy.map(p => {
                    var przedmiotyStr = p.przedmioty.length > 0
                        ? p.przedmioty.map(pr => `${pr.nazwap} (${pr.formap})`).join(', ')
                        : '—';
                    return `
                        <tr>
                            <td>${p.stopien || '—'}</td>
                            <td>${p.imie} ${p.nazwisko}</td>
                            <td>${p.email}</td>
                            <td>${przedmiotyStr}</td>
                        </tr>
                    `;
                }).join('');
                kontener.classList.remove('hidden');

                var przefiltrowane = planZajec.filter(z =>
                    znalezieni.has(`${z.prowadzacy.imie} ${z.prowadzacy.nazwisko}`.toLowerCase())
                );

                if (przefiltrowane.length === 0) {
                    naglowek.textContent = 'Brak zajęć z tym prowadzącym w Twoim planie';
                    tbody.innerHTML = '<tr><td colspan="5" class="tekst-wysrodkowany tekst-szary">Żaden z Twoich terminów nie jest prowadzony przez znalezioną osobę.</td></tr>';
                } else {
                    naglowek.textContent = `Zajęcia filtrowane: ${[imieVal, nazwiskoVal].filter(Boolean).join(' ')}`;
                    tbody.innerHTML = renderujWiersze(przefiltrowane);
                }

            } else {
                kontener.classList.add('hidden');
                komunikat.textContent = dane.message;
                komunikat.style.color = 'var(--color-error, red)';
                komunikat.style.display = 'block';
                tbody.innerHTML = renderujWiersze(planZajec);
                naglowek.textContent = 'Twój plan zajęć';
            }
        })
        .catch(() => {
            document.getElementById('kontener-prowadzacych').classList.add('hidden');
            komunikat.textContent = 'Błąd połączenia z serwerem.';
            komunikat.style.color = 'var(--color-error, red)';
            komunikat.style.display = 'block';
        });
    };
}
