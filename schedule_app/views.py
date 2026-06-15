import json
from django.shortcuts import render
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import *
import pandas as pd
import numpy as np
from django.apps import apps
from django.http import HttpResponse
#For all buttons

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

            request.session['zalogowany_email'] = Studenci.email
            request.session['zalogowana_rola'] = "student"

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

            request.session['zalogowany_email'] = pracownik.email
            request.session['zalogowana_rola'] = rola_pracownika

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

# Change Password Button
@csrf_exempt
def api_change_password(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    email_z_sesji = request.session.get('zalogowany_email')
    rola_z_sesji = request.session.get('zalogowana_rola')

    if not email_z_sesji or not rola_z_sesji:
        return JsonResponse({'status': 'error', 'message': 'Musisz być zalogowany, aby zmienić hasło'}, status=401)

    data = json.loads(request.body)
    old_password = data.get('old_password')
    new_password = data.get('new_password')

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

# Export CSV dla dowolnego modelu
def api_export_csv(request, model_name):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)
    
    try:
        model = apps.get_model('schedule_app', model_name)
    except LookupError:
        return JsonResponse({'status': 'error', 'message': f'Model {model_name} nie istnieje'}, status=404)
        
    data = list(model.objects.all().values())
    if not data:
        return JsonResponse({'status': 'error', 'message': 'Brak danych do eksportu'}, status=404)

    df = pd.DataFrame(data)
    
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{model_name}.csv"'
    
    df.to_csv(path_or_buf=response, index=False, encoding='utf-8')
    
    return response

# Import CSV dla dowolnego modelu
@csrf_exempt
def api_import_csv(request, model_name):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)
        
    try:
        model = apps.get_model('schedule_app', model_name)
    except LookupError:
        return JsonResponse({'status': 'error', 'message': f'Model {model_name} nie istnieje'}, status=404)
        
    if 'file' not in request.FILES:
        return JsonResponse({'status': 'error', 'message': 'Brak pliku w żądaniu'}, status=400)
        
    file = request.FILES['file']
    if not file.name.endswith('.csv'):
        return JsonResponse({'status': 'error', 'message': 'Plik musi być w formacie CSV'}, status=400)
        
    try:
        df = pd.read_csv(file)
        df = df.replace({np.nan: None})
        
        success_count = 0
        skipped_records = []
        
        for index, row in df.iterrows():
            row_dict = row.to_dict()
            try:
                model.objects.create(**row_dict)
                success_count += 1
            except Exception as e:
                skipped_records.append({'row': index + 2, 'data': row_dict, 'reason': str(e)})
                
        return JsonResponse({
            'status': 'success',
            'message': f'Import zakończony. Zaimportowano: {success_count}. Pominięto: {len(skipped_records)}',
            'skipped': skipped_records
        })
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Błąd podczas przetwarzania pliku: {str(e)}'}, status=500)
