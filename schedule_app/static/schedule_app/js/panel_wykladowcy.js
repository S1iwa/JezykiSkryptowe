// Funkcja pokazPanelWykladowcy:
function pokazPanelWykladowcy(app) {
    var email = sessionStorage.getItem('email');
    var imie = sessionStorage.getItem('imie');
    var nazwisko = sessionStorage.getItem('nazwisko');
    var stopien = sessionStorage.getItem('stopien');
    var telefon = sessionStorage.getItem('telefon');
    var planTekst = sessionStorage.getItem('plan');
    var planZajec = planTekst ? JSON.parse(planTekst) : [];
    
    var pelneImie = stopien ? `${stopien} ${imie} ${nazwisko}` : `${imie} ${nazwisko}`;
    if (!imie && !nazwisko) pelneImie = email; // Fallback w razie pustego cache
    
    var liczbaZajec = planZajec.length;

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
    if (liczbaZajec === 0) {
        wierszeTabeli = '<tr><td colspan="5" style="text-align: center;">Brak zaplanowanych zajęć</td></tr>';
    }

    app.innerHTML = `
        <div class="panel-layout">
            <aside class="panel-sidebar">
                <p class="sidebar-tytul">Panel Wykładowcy</p>
                
                <div class="sidebar-akcje" style="margin-top: 20px; margin-bottom: 2px;">
                    <button id="nav-plan" class="sidebar-btn active"><span class="material-symbols-outlined">calendar_month</span> Mój plan zajęć</button>
                    <button id="nav-sale" class="sidebar-btn"><span class="material-symbols-outlined">meeting_room</span> Wyszukaj wolną salę</button>
                    <button id="nav-prowadzacy" class="sidebar-btn"><span class="material-symbols-outlined">groups</span> Lista prowadzących</button>
                </div>

                <hr class="sidebar-divider">

                <div class="sidebar-info" style="margin-top: 0;">
                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">Zalogowano jako</span>
                        <span class="sidebar-info-wartosc" style="font-weight: 600;">${pelneImie}</span>
                    </div>
                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">E-mail</span>
                        <span class="sidebar-info-wartosc">${email}</span>
                    </div>
                    ${telefon ? `
                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">Telefon</span>
                        <span class="sidebar-info-wartosc">${telefon}</span>
                    </div>
                    ` : ''}
                    
                    <div class="sidebar-divider" style="margin: 12px 0;"></div>
                    
                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">Zaplanowane zajęcia</span>
                        <span class="sidebar-info-wartosc">${liczbaZajec}</span>
                    </div>
                </div>
                
                <hr class="sidebar-divider">
                
                <div class="sidebar-akcje">
                    <button id="przycisk-motyw-wykladowca" class="sidebar-btn motyw">${document.body.classList.contains('dark') ? '<span class="material-symbols-outlined">light_mode</span> Jasny motyw' : '<span class="material-symbols-outlined">dark_mode</span> Ciemny motyw'}</button>
                    <button id="przycisk-eksport-csv-wykladowca" class="sidebar-btn"><span class="material-symbols-outlined">download</span> Pobierz plan (CSV)</button>
                    <button id="przycisk-pokaz-haslo-wykladowca" class="sidebar-btn"><span class="material-symbols-outlined">key</span> Zmień hasło</button>
                    <button id="przycisk-wyloguj-wykladowca" class="sidebar-btn danger"><span class="material-symbols-outlined">logout</span> Wyloguj się</button>
                </div>
            </aside>
            <main class="panel-content">
                <!-- WIDOK 1: MÓJ PLAN -->
                <div id="widok-plan">
                    <h3>Twój plan zajęć</h3>
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

                <!-- WIDOK 2: WYSZUKIWARKA SAL -->
                <div id="widok-sale" class="hidden">
                    <h3>Wyszukaj wolną salę</h3>
                    <div class="content-sekcja" style="max-width: 100%;">
                        <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px;">
                            <div class="pole" style="margin-bottom: 0; flex: 1; min-width: 150px;">
                                <label>Dzień tygodnia</label>
                                <select id="szukaj-sale-dzien">
                                    <option value="Poniedziałek">Poniedziałek</option>
                                    <option value="Wtorek">Wtorek</option>
                                    <option value="Środa">Środa</option>
                                    <option value="Czwartek">Czwartek</option>
                                    <option value="Piątek">Piątek</option>
                                    <option value="Sobota">Sobota</option>
                                    <option value="Niedziela">Niedziela</option>
                                </select>
                            </div>
                            <div class="pole" style="margin-bottom: 0; flex: 1; min-width: 120px;">
                                <label>Od godziny</label>
                                <input type="time" id="szukaj-sale-od" value="08:00">
                            </div>
                            <div class="pole" style="margin-bottom: 0; flex: 1; min-width: 120px;">
                                <label>Do godziny</label>
                                <input type="time" id="szukaj-sale-do" value="10:00">
                            </div>
                            <div style="display: flex; align-items: flex-end;">
                                <button id="przycisk-szukaj-sal" class="przycisk-akcja przycisk-wyszukiwarka">Szukaj</button>
                            </div>
                        </div>
                        <div id="komunikat-sale" class="blad hidden"></div>
                    </div>
                    
                    <table class="tabela-planu hidden" id="tabela-wynikow-sal">
                        <thead>
                            <tr>
                                <th>Budynek</th>
                                <th>Sala</th>
                                <th>Typ sali</th>
                                <th>Pojemność</th>
                            </tr>
                        </thead>
                        <tbody id="wyniki-sal"></tbody>
                    </table>
                </div>

                <!-- WIDOK 3: LISTA PROWADZĄCYCH -->
                <div id="widok-prowadzacy" class="hidden">
                    <h3>Lista prowadzących</h3>
                    <div id="komunikat-szukaj-prowadzacego" class="blad hidden"></div>
                    <table class="tabela-planu hidden" id="tabela-wynikow-prowadzacy" style="margin-top: 20px;">
                        <thead>
                            <tr>
                                <th>Stopień</th>
                                <th>Imię i nazwisko</th>
                                <th>Prowadzone przedmioty</th>
                            </tr>
                        </thead>
                        <tbody id="wyniki-wyszukiwania"></tbody>
                    </table>
                </div>

                <!-- ZMIANA HASŁA -->
                <div id="sekcja-haslo-wykladowca" class="content-sekcja hidden" style="margin-top: 30px;">
                    <h3 style="margin-top:0; font-size: 16px;">Zmiana hasła</h3>
                    <div id="komunikat-haslo-wykladowca" class="blad hidden"></div>
                    <div class="pole">
                        <input type="password" id="stare-haslo-wykladowca" placeholder="Stare hasło">
                    </div>
                    <div class="pole">
                        <input type="password" id="nowe-haslo-wykladowca" placeholder="Nowe hasło">
                    </div>
                    <button id="przycisk-zmien-haslo-wykladowca" class="przycisk-akcja">Potwierdź zmianę</button>
                </div>
            </main>
        </div>
    `;

    // Przełączanie motywu
    document.getElementById('przycisk-motyw-wykladowca').onclick = function() {
        toggleMotyw();
        this.innerHTML = document.body.classList.contains('dark') ? '<span class="material-symbols-outlined">light_mode</span> Jasny motyw' : '<span class="material-symbols-outlined">dark_mode</span> Ciemny motyw';
    };

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

    // ===== WYSZUKIWARKA SAL =====
    document.getElementById('przycisk-szukaj-sal').onclick = function() {
        var dzien = document.getElementById('szukaj-sale-dzien').value;
        var odGodz = document.getElementById('szukaj-sale-od').value;
        var doGodz = document.getElementById('szukaj-sale-do').value;
        var komunikat = document.getElementById('komunikat-sale');
        var tabela = document.getElementById('tabela-wynikow-sal');
        var wyniki = document.getElementById('wyniki-sal');

        komunikat.classList.add('hidden');
        wyniki.innerHTML = '';
        tabela.classList.add('hidden');

        if (!odGodz || !doGodz) {
            komunikat.textContent = 'Proszę podać godziny rozpoczęcia i zakończenia.';
            komunikat.classList.remove('hidden');
            return;
        }

        fetch('/api/schedule/find-audience/')
        .then(res => res.json())
        .then(dane => {
            if (dane.status === 'success') {
                var sale = dane.sale;
                
                var wolneSale = sale.filter(sala => {
                    // Sprawdzamy czy sala ma konflikt
                    for (let z of sala.zajecia) {
                        if (z.dzien === dzien) {
                            let [szOdh, szOdm] = odGodz.split(':').map(Number);
                            let [szDoh, szDom] = doGodz.split(':').map(Number);
                            let szOdMin = szOdh * 60 + szOdm;
                            let szDoMin = szDoh * 60 + szDom;

                            let [zOdh, zOdm] = z.godzrozp.split(':').map(Number);
                            let [zDoh, zDom] = z.godzzak.split(':').map(Number);
                            let zOdMin = zOdh * 60 + zOdm;
                            let zDoMin = zDoh * 60 + zDom;

                            // Kolizja, gdy szukany czas zachodzi na czas zajęć
                            if (szOdMin < zDoMin && szDoMin > zOdMin) {
                                return false;
                            }
                        }
                    }
                    return true;
                });

                tabela.classList.remove('hidden');
                if (wolneSale.length === 0) {
                    wyniki.innerHTML = '<tr><td colspan="4" style="text-align:center;">Brak wolnych sal w podanym przedziale czasowym.</td></tr>';
                } else {
                    wyniki.innerHTML = wolneSale.map(s => `
                        <tr>
                            <td>${s.budynek.nazwab} <br><small style="color: var(--text-secondary);">${s.budynek.adresb}</small></td>
                            <td><strong>${s.numers}</strong></td>
                            <td>${s.typs}</td>
                            <td>${s.pojemnosc} os.</td>
                        </tr>
                    `).join('');
                }
            } else {
                komunikat.textContent = dane.message;
                komunikat.classList.remove('hidden');
            }
        });
    };

    // ===== WYSZUKIWARKA INNYCH PROWADZĄCYCH =====
    function zaladujProwadzacych() {
        var komunikat = document.getElementById('komunikat-szukaj-prowadzacego');
        var wynikiLista = document.getElementById('wyniki-wyszukiwania');
        var tabelaProwadzacy = document.getElementById('tabela-wynikow-prowadzacy');

        komunikat.classList.add('hidden');
        wynikiLista.innerHTML = '';
        tabelaProwadzacy.classList.add('hidden');

        fetch(`/api/students/professors-information/?imie=&nazwisko=`)
        .then(res => res.json())
        .then(dane => {
            if (dane.status === 'success') {
                tabelaProwadzacy.classList.remove('hidden');
                if (dane.prowadzacy.length === 0) {
                    wynikiLista.innerHTML = '<tr><td colspan="3" style="text-align:center;">Brak prowadzących w bazie.</td></tr>';
                } else {
                    wynikiLista.innerHTML = dane.prowadzacy.map(p => {
                        var przedmiotyStr = p.przedmioty.map(pr => pr.nazwap + ' <span style="color:var(--text-secondary);">(' + pr.formap + ')</span>').join('<br>');
                        return `
                            <tr>
                                <td>${p.stopien || '-'}</td>
                                <td><strong>${p.imie} ${p.nazwisko}</strong></td>
                                <td>${przedmiotyStr || 'Brak przypisanych przedmiotów'}</td>
                            </tr>
                        `;
                    }).join('');
                }
            } else {
                komunikat.classList.remove('hidden');
                komunikat.style.color = 'red';
                komunikat.textContent = dane.message;
            }
        });
    }

    // ===== NAWIGACJA (SPA TABS) =====
    var prowadzacyZaladowani = false;

    function zmienWidok(widokId, przyciskId) {
        document.getElementById('widok-plan').classList.add('hidden');
        document.getElementById('widok-sale').classList.add('hidden');
        document.getElementById('widok-prowadzacy').classList.add('hidden');
        
        document.getElementById('nav-plan').classList.remove('active');
        document.getElementById('nav-sale').classList.remove('active');
        document.getElementById('nav-prowadzacy').classList.remove('active');
        
        document.getElementById(widokId).classList.remove('hidden');
        document.getElementById(przyciskId).classList.add('active');

        // Zamknięcie sekcji zmiany hasła gdy zmieniamy widok
        document.getElementById('sekcja-haslo-wykladowca').classList.add('hidden');

        if (widokId === 'widok-prowadzacy' && !prowadzacyZaladowani) {
            zaladujProwadzacych();
            prowadzacyZaladowani = true;
        }
    }

    document.getElementById('nav-plan').onclick = () => zmienWidok('widok-plan', 'nav-plan');
    document.getElementById('nav-sale').onclick = () => zmienWidok('widok-sale', 'nav-sale');
    document.getElementById('nav-prowadzacy').onclick = () => zmienWidok('widok-prowadzacy', 'nav-prowadzacy');
}
