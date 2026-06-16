// Funkcja pokazLogowanie - Strona logowania
function pokazLogowanie(app) {
    app.innerHTML = `
        <div class="formularz-logowania">
            <h2>Logowanie</h2>
            <p>Jeden formularz dla studenta, wykładowcy i planisty.</p>
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



// Funkcja pokazPanelStudenta:
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
        app.innerHTML = '<h1>Panel planisty</h1>';
    } else {
        app.innerHTML = '<h1>Strona główna</h1>';
    }
}
document.addEventListener('DOMContentLoaded', function() {
    router();
});