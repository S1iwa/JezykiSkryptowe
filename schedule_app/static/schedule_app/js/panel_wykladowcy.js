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
                <div class="sidebar-info">
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
                    <button id="przycisk-motyw-wykladowca" class="sidebar-btn motyw">${document.body.classList.contains('dark') ? '☀️ Jasny motyw' : '🌙 Ciemny motyw'}</button>
                    <button id="przycisk-eksport-csv-wykladowca" class="sidebar-btn">⬇️ Pobierz plan (CSV)</button>
                    <button id="przycisk-pokaz-haslo-wykladowca" class="sidebar-btn">🔑 Zmień hasło</button>
                    <button id="przycisk-wyloguj-wykladowca" class="sidebar-btn danger">⬅️ Wyloguj się</button>
                </div>
            </aside>
            <main class="panel-content">
                <h3>Twój plan zajęć</h3>

                <div id="sekcja-haslo-wykladowca" class="content-sekcja hidden">
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
        this.textContent = document.body.classList.contains('dark') ? '☀️ Jasny motyw' : '🌙 Ciemny motyw';
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
}
