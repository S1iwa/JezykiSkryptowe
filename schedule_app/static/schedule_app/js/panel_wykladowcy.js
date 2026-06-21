
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
        wierszeTabeli = '<tr><td colspan="5" class="tekst-wysrodkowany">Brak zaplanowanych zajęć</td></tr>';
    }

    app.innerHTML = `
        <div class="panel-layout">
            <aside class="panel-sidebar">
                <p class="sidebar-tytul">Panel Wykładowcy</p>
                
                <div class="sidebar-info">
                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">Zalogowano jako</span>
                        <span class="sidebar-info-wartosc tekst-pogrubiony">${pelneImie}</span>
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
                    
                    <div class="sidebar-divider" ></div>
                    
                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">Zaplanowane zajęcia</span>
                        <span class="sidebar-info-wartosc">${liczbaZajec}</span>
                    </div>
                </div>
                
                <hr class="sidebar-divider">
                
                <!-- WYSZUKIWARKA SAL -->
                <div>
                    <span class="sidebar-info-label odstep-maly">Szukaj wolnej sali</span>
                    <div class="pole odstep-maly">
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
                    <div class="pole odstep-maly">
                        <input type="time" id="szukaj-sale-od" placeholder="Od np. 08:00">
                    </div>
                    <div class="pole odstep-maly">
                        <input type="time" id="szukaj-sale-do" placeholder="Do np. 10:00">
                    </div>
                    <div class="sidebar-akcje">
                        <button id="przycisk-szukaj-sal" class="sidebar-btn">Szukaj Sali</button>
                        <button id="przycisk-resetuj-sal" class="sidebar-btn motyw">Resetuj</button>
                    </div>
                    <div id="komunikat-sale" class="tekst-szary hidden odstep-maly"></div>
                </div>

                <hr class="sidebar-divider">

                <!-- WYSZUKIWARKA PROWADZĄCYCH -->
                <div>
                    <span class="sidebar-info-label odstep-maly">Szukaj prowadzącego</span>
                    <div class="pole odstep-maly">
                        <input type="text" id="szukaj-imie" placeholder="Imię">
                    </div>
                    <div class="pole odstep-maly">
                        <input type="text" id="szukaj-nazwisko" placeholder="Nazwisko">
                    </div>
                    <div class="sidebar-akcje">
                        <button id="przycisk-szukaj-prowadzacy" class="sidebar-btn">Szukaj Prowadzącego</button>
                        <button id="przycisk-resetuj-prowadzacy" class="sidebar-btn motyw">Resetuj</button>
                    </div>
                    <div id="komunikat-szukaj" class="tekst-szary hidden odstep-maly"></div>
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
                <!-- ZMIANA HASŁA -->
                <div id="sekcja-haslo-wykladowca" class="content-sekcja hidden odstep-duzy">
                    <h3 class="naglowek-maly">Zmiana hasła</h3>
                    <div id="komunikat-haslo-wykladowca" class="blad hidden"></div>
                    <div class="pole">
                        <input type="password" id="stare-haslo-wykladowca" placeholder="Stare hasło">
                    </div>
                    <div class="pole">
                        <input type="password" id="nowe-haslo-wykladowca" placeholder="Nowe hasło">
                    </div>
                    <button id="przycisk-zmien-haslo-wykladowca" class="przycisk-akcja">Potwierdź zmianę</button>
                </div>

                <!-- WYNIKI SZUKANIA SAL -->
                <div id="kontener-sal" class="hidden odstep-bardzo-duzy">
                    <h3 class="odstep-sredni">Znalezione sale</h3>
                    <table class="tabela-planu" id="tabela-wynikow-sal">
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

                <!-- WYNIKI SZUKANIA PROWADZĄCYCH -->
                <div id="kontener-prowadzacych" class="hidden odstep-bardzo-duzy">
                    <h3 class="odstep-sredni">Znalezieni prowadzący</h3>
                    <table class="tabela-planu" id="tabela-wynikow-prowadzacy">
                        <thead>
                            <tr>
                                <th>Stopień</th>
                                <th>Imię i nazwisko</th>
                                <th>E-mail</th>
                                <th>Prowadzone przedmioty</th>
                            </tr>
                        </thead>
                        <tbody id="wyniki-wyszukiwania"></tbody>
                    </table>
                </div>

                <!-- MÓJ PLAN -->
                <h3 class="odstep-sredni">Twój plan zajęć</h3>
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
            </main>
        </div>
    `;

    // Przełączanie motywu
    document.getElementById('przycisk-motyw-wykladowca').onclick = function() {
        toggleMotyw();
        this.innerHTML = document.body.classList.contains('dark') ? '<span class="material-symbols-outlined">light_mode</span> Jasny motyw' : '<span class="material-symbols-outlined">dark_mode</span> Ciemny motyw';
    };

    document.getElementById('przycisk-wyloguj-wykladowca').onclick = function() {
        apiCall('/api/auth/logout/', { method: 'POST' })
        .then(function() {
            sessionStorage.clear();
            history.pushState({}, '', '/logowanie/');
            router();
        });
    };

    document.getElementById('przycisk-pokaz-haslo-wykladowca').onclick = function() {
        document.getElementById('sekcja-haslo-wykladowca').classList.toggle('hidden');
    };

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

    document.getElementById('przycisk-zmien-haslo-wykladowca').onclick = function() {
        var stareHaslo = document.getElementById('stare-haslo-wykladowca').value;
        var noweHaslo = document.getElementById('nowe-haslo-wykladowca').value;
        var komunikat = document.getElementById('komunikat-haslo-wykladowca');

        apiCall('/api/auth/change_password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ old_password: stareHaslo, new_password: noweHaslo })
        })
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

    document.getElementById('przycisk-szukaj-sal').onclick = function() {
        var dzien = document.getElementById('szukaj-sale-dzien').value;
        var odGodz = document.getElementById('szukaj-sale-od').value;
        var doGodz = document.getElementById('szukaj-sale-do').value;
        var komunikat = document.getElementById('komunikat-sale');
        var tabela = document.getElementById('tabela-wynikow-sal');
        var wyniki = document.getElementById('wyniki-sal');
        var kontener = document.getElementById('kontener-sal');

        komunikat.classList.add('hidden');
        wyniki.innerHTML = '';
        kontener.classList.add('hidden');

        if (!odGodz || !doGodz) {
            komunikat.classList.remove('hidden');
            komunikat.innerHTML = '<small>Proszę podać godziny rozpoczęcia i zakończenia.</small>';
            return;
        }

        apiCall(`/api/schedule/find-audience/?dzien=${encodeURIComponent(dzien)}&odGodz=${encodeURIComponent(odGodz)}&doGodz=${encodeURIComponent(doGodz)}`)
        .then(dane => {
            if (dane.status === 'success') {
                kontener.classList.remove('hidden');
                var saleDoWyswietlenia = dane.wolne_sale || dane.sale || []; // Backend może to różnie zwracać
                
                // Jeśli backend nie filtruje po stronie serwera, robimy to po stronie klienta:
                if (!dane.wolne_sale && dane.sale) {
                    saleDoWyswietlenia = dane.sale.filter(sala => {
                        for (let z of sala.zajecia) {
                            if (z.dzien === dzien) {
                                let szOdMin = parseInt(odGodz.split(':')[0]) * 60 + parseInt(odGodz.split(':')[1]);
                                let szDoMin = parseInt(doGodz.split(':')[0]) * 60 + parseInt(doGodz.split(':')[1]);
                                let zOdMin = parseInt(z.godzrozp.split(':')[0]) * 60 + parseInt(z.godzrozp.split(':')[1]);
                                let zDoMin = parseInt(z.godzzak.split(':')[0]) * 60 + parseInt(z.godzzak.split(':')[1]);

                                // Konflikt, gdy się pokrywają
                                if (szOdMin < zDoMin && szDoMin > zOdMin) {
                                    return false;
                                }
                            }
                        }
                        return true;
                    });
                }

                if (saleDoWyswietlenia.length === 0) {
                    wyniki.innerHTML = '<tr><td colspan="4" class="tekst-wysrodkowany">Brak wolnych sal w podanym przedziale czasowym.</td></tr>';
                } else {
                    wyniki.innerHTML = saleDoWyswietlenia.map(s => `
                        <tr>
                            <td>${s.budynek.nazwab} <br><small class="tekst-szary">${s.budynek.adresb}</small></td>
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

    document.getElementById('przycisk-resetuj-sal').onclick = function() {
        document.getElementById('szukaj-sale-dzien').value = 'Poniedziałek';
        document.getElementById('szukaj-sale-od').value = '';
        document.getElementById('szukaj-sale-do').value = '';
        document.getElementById('kontener-sal').classList.add('hidden');
        document.getElementById('komunikat-sale').classList.add('hidden');
    };

    document.getElementById('przycisk-szukaj-prowadzacy').onclick = function() {
        var imieVal = document.getElementById('szukaj-imie').value.trim();
        var nazwiskoVal = document.getElementById('szukaj-nazwisko').value.trim();
        wykonajWyszukiwanieProwadzacego(imieVal, nazwiskoVal);
    };

    document.getElementById('przycisk-resetuj-prowadzacy').onclick = function() {
        document.getElementById('szukaj-imie').value = '';
        document.getElementById('szukaj-nazwisko').value = '';
        wykonajWyszukiwanieProwadzacego('', '');
    };

    function wykonajWyszukiwanieProwadzacego(imieVal, nazwiskoVal) {
        var komunikat = document.getElementById('komunikat-szukaj');
        var wynikiLista = document.getElementById('wyniki-wyszukiwania');
        var kontener = document.getElementById('kontener-prowadzacych');

        komunikat.classList.add('hidden');

        if (!imieVal && !nazwiskoVal) {
            kontener.classList.add('hidden');
            return;
        }

        wynikiLista.innerHTML = '';

        apiCall(`/api/students/professors-information/?imie=${encodeURIComponent(imieVal)}&nazwisko=${encodeURIComponent(nazwiskoVal)}`)
        .then(dane => {
            if (dane.status === 'success') {
                kontener.classList.remove('hidden');
                if (dane.prowadzacy.length === 0) {
                    wynikiLista.innerHTML = '<tr><td colspan="3" class="tekst-wysrodkowany tekst-szary">Brak pasujących wyników.</td></tr>';
                } else {
                    wynikiLista.innerHTML = dane.prowadzacy.map(p => {
                        var przedmiotyStr = p.przedmioty.map(pr => pr.nazwap + ' <span class="tekst-szary">(' + pr.formap + ')</span>').join('<br>');
                        return `
                            <tr>
                                <td>${p.stopien || '-'}</td>
                                <td><strong>${p.imie} ${p.nazwisko}</strong></td>
                                <td>${p.email || '-'}</td>
                                <td>${przedmiotyStr || '<span class="tekst-szary">Brak przypisanych przedmiotów</span>'}</td>
                            </tr>
                        `;
                    }).join('');
                }
            } else {
                komunikat.classList.remove('hidden');
                komunikat.textContent = dane.message;
            }
        });
    }

    router();
}
