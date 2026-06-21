from .helping_functions import *
from .helping_functions import _plan_studenta, _plan_wykladowcy


# Login
@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    try:
        #   Pobieramy dane przesłane z formularza w Reactie
        data = json.loads(request.body)
        email_input = data.get('email')
        password_input = data.get('password')

        print("dane z frontu:", data)

        if not email_input or not password_input:
            return JsonResponse({'status': 'error', 'message': 'Email i hasło są wymagane'}, status=400)

        #   Szukamy najpierw w tabeli Studenci
        student = Studenci.objects.filter(email=email_input).first()
        print("Znaleziono studenta:", student)
        if student:
            print("Hash studenta z bazy:", student.haslo)
            print("check_password student:", check_password(password_input, student.haslo))
        if student and check_password(password_input, student.haslo):

            request.session['zalogowany_email'] = student.email
            request.session['zalogowana_rola'] = "student"

            return JsonResponse({
                'status': 'success',
                'role': 'student',
                'redirect_to': '/panel-studenta',
                'user_info': {
                    'email': student.email,
                    'imie': student.imie,
                    'nazwisko': student.nazwisko,
                    'status_studenta': student.status
                },
                'plan_zajec': _plan_studenta(student),
            })

        #   Jeśli to nie student, szukamy w tabeli Pracownicy
        pracownik = Pracownicy.objects.filter(email=email_input).first()
        print("Znaleziono pracownika:", pracownik)
        if pracownik:
            print("Hash pracownika z bazy:", pracownik.haslo)
            print("check_password pracownik:", check_password(password_input, pracownik.haslo))
        if pracownik and check_password(password_input, pracownik.haslo):
            # Sprawdzamy wartość w kolumnie 'role' (wykladowca / planista)
            rola_pracownika = pracownik.rola.lower()  # Zabezpieczenie przed wielkimi literami

            request.session['zalogowany_email'] = pracownik.email
            request.session['zalogowana_rola'] = rola_pracownika

            if rola_pracownika == 'wykladowca':
                return JsonResponse({
                    'status': 'success',
                    'role': 'wykladowca',
                    'redirect_to': '/panel-wykladowcy',
                    'user_info': {
                        'email': pracownik.email,
                        'imie': pracownik.imie,
                        'nazwisko': pracownik.nazwisko,
                        'stopien': pracownik.stopien,
                        'telefon': pracownik.nrtel
                    },
                    'plan_zajec': _plan_wykladowcy(pracownik),
                })
            elif rola_pracownika == 'planista':
                return JsonResponse({
                    'status': 'success',
                    'role': 'planista',
                    'redirect_to': '/panel-planisty',
                    'user_info': {
                        'email': pracownik.email,
                        'imie': pracownik.imie,
                        'nazwisko': pracownik.nazwisko
                    },
                })
            else:
                # Użytkownik jest w tabeli pracownicy, ale ma nieznaną rolę
                return JsonResponse({
                    'status': 'error',
                    'message': 'Nieprawidłowa rola pracownika w bazie danych.'
                }, status=403)

        #  Jeśli nigdzie nie pasuje email lub hasło
        return JsonResponse({'status': 'error', 'message': 'Niepoprawny email lub hasło'}, status=401)

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Błąd serwera: {str(e)}'}, status=500)

# Logout
@csrf_exempt
def api_logout(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    # Funkcja logout usuwa aktualną sesję z Django
    logout(request)

    return JsonResponse({
        'status': 'success',
        'message': 'Wylogowano pomyślnie'
    })

# Change Password
@csrf_exempt
def api_change_password(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    email_z_sesji = request.session.get('zalogowany_email')
    rola_z_sesji = request.session.get('zalogowana_rola')

    if not email_z_sesji or not rola_z_sesji:
        return JsonResponse({'status': 'error', 'message': 'Musisz być zalogowany, aby zmienić hasło'}, status=401)

    try:
        data = json.loads(request.body)
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not old_password or not new_password:
            return JsonResponse({'status': 'error', 'message': 'Stare i nowe hasło są wymagane'}, status=400)

        # SPRAWDZAMY ROLĘ I WYBIERAMY ODPOWIEDNI MODEL
        if rola_z_sesji == 'student':
            uzytkownik = Studenci.objects.filter(email=email_z_sesji).first()
        else:
            # Skoro nie student, to pracownik (planista, wykladowca, admin)
            uzytkownik = Pracownicy.objects.filter(email=email_z_sesji).first()

        if not uzytkownik:
            return JsonResponse({'status': 'error', 'message': 'Użytkownik nie istnieje'}, status=404)

        # Dalej kod jest identyczny dla obu ról!
        if not check_password(old_password, uzytkownik.haslo):
            return JsonResponse({'status': 'error', 'message': 'Obecne hasło jest niepoprawne'}, status=403)

        uzytkownik.haslo = make_password(new_password)
        uzytkownik.save()

        return JsonResponse({'status': 'success', 'message': 'Hasło zostało pomyślnie zmienione'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Błąd serwera: {str(e)}'}, status=500)