/**
 * Globalna funkcja pomocnicza do zapytań do API.
 * Automatycznie weryfikuje status odpowiedzi HTTP i obsługuje błędy sieciowe.
 */
function apiCall(url, options = {}) {
    if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method.toUpperCase())) {
        options.headers = options.headers || {};
        if (!options.headers['X-CSRFToken'] && window.CSRF_TOKEN) {
            options.headers['X-CSRFToken'] = window.CSRF_TOKEN;
        }
    }

    if (!options.credentials) {
        options.credentials = 'same-origin';
    }

    return fetch(url, options)
        .then(res => {
            if (!res.ok) {
                return res.json().then(
                    errData => Promise.reject(new Error(errData.message || `Błąd HTTP: ${res.status}`)),
                    () => Promise.reject(new Error(`Błąd HTTP: ${res.status}`))
                );
            }
            return res.json();
        })
        .catch(error => {
            if (error instanceof TypeError && error.message === "Failed to fetch") {
                return { status: 'error', message: 'Błąd połączenia z serwerem.' };
            }
            return { status: 'error', message: error.message || 'Wystąpił nieoczekiwany błąd.' };
        });
}
