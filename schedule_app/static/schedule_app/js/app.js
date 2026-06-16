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

    // Zabezpieczenie przed brakiem zajęć w planie:
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
            <h3>Twój plan zajęć</h3>
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

    // Logika przyciska wyloguj:
    document.getElementById('przycisk-wyloguj').onclick = function() {
        alert('Wylogowanie (do zrobienia)');
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
        app.innerHTML = '<h1>Panel wykładowcy</h1>';
    } else if (sciezka === '/panel-planisty/' || sciezka === '/panel-planisty') {
        app.innerHTML = '<h1>Panel planisty</h1>';
    } else {
        app.innerHTML = '<h1>Strona główna</h1>';
    }
}
document.addEventListener('DOMContentLoaded', function() {
    router();
});