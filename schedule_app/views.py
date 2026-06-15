import json
from django.shortcuts import render
from django.contrib.auth.hashers import check_password
from django.contrib.auth import logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import *

# Create your views here.

#Login button
@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    try:
        #   Pobieramy dane przesłane z formularza w Reactie
        data = json.loads(request.body)
        email_input = data.get('email')
        password_input = data.get('password')

        if not email_input or not password_input:
            return JsonResponse({'status': 'error', 'message': 'Email i hasło są wymagane'}, status=400)

        #   Szukamy najpierw w tabeli Studenci
        student = Studenci.objects.filter(email=email_input).first()
        if student and check_password(password_input, student.haslo):
            return JsonResponse({
                'status': 'success',
                'role': 'student',
                'redirect_to': '/panel-studenta',
                'user_info': {'email': student.email}
            })

        #   Jeśli to nie student, szukamy w tabeli Pracownicy
        pracownik = Pracownicy.objects.filter(email=email_input).first()
        if pracownik and check_password(password_input, pracownik.haslo):
            # Sprawdzamy wartość w kolumnie 'role' (wykladowca / planista)
            rola_pracownika = pracownik.rola.lower()  # Zabezpieczenie przed wielkimi literami

            if rola_pracownika == 'wykladowca':
                return JsonResponse({
                    'status': 'success',
                    'role': 'wykladowca',
                    'redirect_to': '/panel-wykladowcy',
                    'user_info': {'email': pracownik.email}
                })
            elif rola_pracownika == 'planista':
                return JsonResponse({
                    'status': 'success',
                    'role': 'planista',
                    'redirect_to': '/panel-planisty',
                    'user_info': {'email': pracownik.email}
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

# Logout button
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