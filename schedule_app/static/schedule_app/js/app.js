function router() {
    var sciezka = window.location.pathname;
    var app = document.getElementById('app');
    if (sciezka === '/logowanie/') {
        app.innerHTML = '<h1>Logowanie</h1>';
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