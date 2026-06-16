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




// Funkcja router - Przeglądarka sprawdza aktualny adres URL i wyświetla odpowiednią treść:
function router() {
    var sciezka = window.location.pathname;
    var app = document.getElementById('app');

    if (sciezka === '/logowanie/') {
        pokazLogowanie(app);
    } else if (sciezka === '/panel-studenta/') {
        app.innerHTML = '<h1>Panel studenta</h1>';
    } else if (sciezka === '/panel-wykladowcy/') {
        app.innerHTML = '<h1>Panel wykładowcy</h1>';
    } else if (sciezka === '/panel-planisty/') {
        app.innerHTML = '<h1>Panel planisty</h1>';
    } else {
        app.innerHTML = '<h1>Strona główna</h1>';
    }
}
document.addEventListener('DOMContentLoaded', function() {
    router();
});