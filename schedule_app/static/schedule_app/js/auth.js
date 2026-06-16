// Funkcja pokazLogowanie - Strona logowania
function pokazLogowanie(app) {
    app.innerHTML = `
        <button id="przycisk-motywu-login" class="przycisk-motywu">
            ${document.body.classList.contains('dark') ? '☀️' : '🌙'}
        </button>
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

    // Obsługa przycisku motywu tylko dla strony logowania
    document.getElementById('przycisk-motywu-login').onclick = function() {
        toggleMotyw();
        this.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    };

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
                sessionStorage.setItem('imie', dane.user_info.imie || '');
                sessionStorage.setItem('nazwisko', dane.user_info.nazwisko || '');
                sessionStorage.setItem('stopien', dane.user_info.stopien || '');
                sessionStorage.setItem('telefon', dane.user_info.telefon || '');
                sessionStorage.setItem('status_studenta', dane.user_info.status_studenta || '');
                
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
