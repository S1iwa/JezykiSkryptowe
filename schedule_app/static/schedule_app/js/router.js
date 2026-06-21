// Funkcja router - Przeglądarka sprawdza aktualny adres URL i wyświetla odpowiednią treść:
function router() {
    var sciezka = window.location.pathname;
    var app = document.getElementById('app');
    var rola = sessionStorage.getItem('rola');

    if (sciezka === '/logowanie/' || sciezka === '/logowanie') {
        pokazLogowanie(app);
    } else if (sciezka === '/panel-studenta/' || sciezka === '/panel-studenta') {
        if (rola !== 'student') {
            history.pushState({}, '', '/logowanie/');
            pokazLogowanie(app);
        } else {
            pokazPanelStudenta(app);
        }
    } else if (sciezka === '/panel-wykladowcy/' || sciezka === '/panel-wykladowcy') {
        if (rola !== 'wykladowca') {
            history.pushState({}, '', '/logowanie/');
            pokazLogowanie(app);
        } else {
            pokazPanelWykladowcy(app);
        }
    } else if (sciezka === '/panel-planisty/' || sciezka === '/panel-planisty') {
        if (rola !== 'planista') {
            history.pushState({}, '', '/logowanie/');
            pokazLogowanie(app);
        } else {
            pokazPanelPlanisty(app);
        }
    } else {
        if (rola === 'student') {
            history.pushState({}, '', '/panel-studenta/');
            pokazPanelStudenta(app);
        } else if (rola === 'wykladowca') {
            history.pushState({}, '', '/panel-wykladowcy/');
            pokazPanelWykladowcy(app);
        } else if (rola === 'planista') {
            history.pushState({}, '', '/panel-planisty/');
            pokazPanelPlanisty(app);
        } else {
            history.pushState({}, '', '/logowanie/');
            pokazLogowanie(app);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    router();
});
