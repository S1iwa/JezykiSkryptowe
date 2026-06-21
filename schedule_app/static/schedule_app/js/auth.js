function pokazLogowanie(app) {
    app.innerHTML = `
        <button id="przycisk-motywu-login" class="przycisk-motywu">
            ${document.body.classList.contains('dark') ? '<span class="material-symbols-outlined">light_mode</span>' : '<span class="material-symbols-outlined">dark_mode</span>'}
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
                    <span class="material-symbols-outlined ikona-hasla" onclick="const i=document.getElementById('pole-haslo'); i.type = i.type==='password'?'text':'password'; this.textContent = i.type==='password'?'visibility_off':'visibility';">visibility_off</span>
                </div>
                <button id="przycisk-login">Zaloguj się</button>
            </div>
        </div>
    `;

    document.getElementById('przycisk-motywu-login').onclick = function() {
        toggleMotyw();
        this.innerHTML = document.body.classList.contains('dark') ? '<span class="material-symbols-outlined">light_mode</span>' : '<span class="material-symbols-outlined">dark_mode</span>';
    };

    document.getElementById('przycisk-login').onclick = function() {
        var email = document.getElementById('pole-email').value;
        var haslo = document.getElementById('pole-haslo').value;
        var komunikatBledu = document.getElementById('blad-logowania');

        komunikatBledu.classList.add('hidden');

        apiCall('/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: haslo })
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
        .catch(function(err) {
            komunikatBledu.textContent = err.message || 'Wystąpił nieznany błąd.';
            komunikatBledu.classList.remove('hidden');
        });
    }
}
