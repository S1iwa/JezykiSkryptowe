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
