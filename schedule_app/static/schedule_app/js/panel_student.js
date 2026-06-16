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
        <div class="panel-layout">
            <aside class="panel-sidebar">
                <p class="sidebar-tytul">Panel Studenta</p>
                <div class="sidebar-info">
                    <div class="sidebar-info-wiersz">
                        <span class="sidebar-info-label">Zalogowano jako</span>
                        <span class="sidebar-info-wartosc">${email}</span>
                    </div>
                </div>
                <hr class="sidebar-divider">
                <div class="sidebar-akcje">
                    <button id="przycisk-motyw-student" class="sidebar-btn motyw">${document.body.classList.contains('dark') ? '☀️ Jasny motyw' : '🌙 Ciemny motyw'}</button>
                    <button id="przycisk-eksport-csv" class="sidebar-btn">⬇️ Pobierz plan (CSV)</button>
                    <button id="przycisk-pokaz-szukaj" class="sidebar-btn">🔍 Szukaj prowadzącego</button>
                    <button id="przycisk-pokaz-haslo" class="sidebar-btn">🔑 Zmień hasło</button>
                    <button id="przycisk-wyloguj" class="sidebar-btn danger">⬅️ Wyloguj się</button>
                </div>
            </aside>
            <main class="panel-content">
                <h3>Twój plan zajęć</h3>

                <div id="sekcja-haslo" class="content-sekcja hidden">
                    <h3 style="margin-top:0; font-size: 16px;">Zmiana hasła</h3>
                    <div id="komunikat-haslo" class="blad hidden"></div>
                    <div class="pole">
                        <input type="password" id="stare-haslo" placeholder="Stare hasło">
                    </div>
                    <div class="pole">
                        <input type="password" id="nowe-haslo" placeholder="Nowe hasło">
                    </div>
                    <button id="przycisk-zmien-haslo" class="przycisk-akcja">Potwierdź zmianę</button>
                </div>

                <div id="sekcja-szukaj" class="content-sekcja hidden">
                    <h3 style="margin-top:0; font-size: 16px;">Wyszukaj prowadzącego</h3>
                    <div id="komunikat-szukaj" class="blad hidden"></div>
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="text" id="szukaj-imie" placeholder="Imię" style="flex: 1; padding: 8px;" class="pole" style="margin-bottom:0;">
                        <input type="text" id="szukaj-nazwisko" placeholder="Nazwisko" style="flex: 1; padding: 8px;" class="pole" style="margin-bottom:0;">
                        <button id="przycisk-szukaj" class="przycisk-akcja">Szukaj</button>
                    </div>
                    <ul id="wyniki-wyszukiwania" style="margin-top: 10px; padding-left: 20px;"></ul>
                </div>

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
            </main>
        </div>
    `;

    // Przełączanie motywu
    document.getElementById('przycisk-motyw-student').onclick = function() {
        toggleMotyw();
        this.textContent = document.body.classList.contains('dark') ? '☀️ Jasny motyw' : '🌙 Ciemny motyw';
    };

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
        document.getElementById('sekcja-szukaj').classList.add('hidden');
    };

    document.getElementById('przycisk-pokaz-szukaj').onclick = function() {
        document.getElementById('sekcja-szukaj').classList.toggle('hidden');
        document.getElementById('sekcja-haslo').classList.add('hidden');
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
