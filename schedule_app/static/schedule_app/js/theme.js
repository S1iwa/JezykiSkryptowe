// Inicjalizacja motywu z localStorage
(function() {
    if (localStorage.getItem('motyw') === 'dark') {
        document.body.classList.add('dark');
    }
})();

function toggleMotyw() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('motyw', isDark ? 'dark' : 'light');
}
