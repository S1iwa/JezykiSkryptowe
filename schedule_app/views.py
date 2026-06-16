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

# Funkcje pomocnicze – pobierają plan zajęć

def _serializuj_zajecia(z):
    """Zamienia obiekt Zajecia na słownik gotowy do JSON."""
    sala    = z.ids
    budynek = sala.idb
    przed   = z.idp
    prow    = z.idpr
    grupa   = z.idg
    kier    = grupa.idk

    return {
        'idz':      z.idz,
        'dzien':    z.dzien,
        'godzrozp': z.godzrozp.strftime('%H:%M'),
        'godzzak':  z.godzzak.strftime('%H:%M'),
        'uwagi':    z.uwagi or '',
        # sala
        'sala': {
            'numers':    sala.numers,
            'typs':      sala.typs,
            'pojemnosc': sala.pojemnosc,
            'budynek': {
                'nazwab': budynek.nazwab,
                'adresb': budynek.adresb,
            },
        },
        # przedmiot
        'przedmiot': {
            'nazwap': przed.nazwap,
            'formap': przed.formap,
            'lbgodz': przed.lbgodz,
        },
        # prowadzący
        'prowadzacy': {
            'stopien':  prow.stopien or '',
            'imie':     prow.imie,
            'nazwisko': prow.nazwisko,
            'email':    prow.email,
        },
        # kierunek / grupa
        'kierunek': {
            'nazwak':      kier.nazwak,
            'rokstudiow':  grupa.rokstudiow,
            'semestr':     grupa.semestr,
            'rokakadem':   grupa.rokakadem,
        },
    }


def _plan_studenta(student):
    """
    Zwraca plan zajęć studenta posortowany wg dnia i godziny.
    Student może należeć do wielu grup (tabela Przypisy).
    """
    # Pobieramy wszystkie grupy studenta
    przypisy = (
        Przypisy.objects
        .filter(idst=student)
        .select_related('idg')
    )
    grupy_ids = [p.idg.pk for p in przypisy]

    # Pobieramy zajęcia tych grup z wszystkimi powiązanymi danymi jednym zapytaniem
    zajecia_qs = (
        Zajecia.objects
        .filter(idg__in=grupy_ids)
        .select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg', 'idg__idk')
        .order_by('dzien', 'godzrozp')
    )

    return [_serializuj_zajecia(z) for z in zajecia_qs]


def _plan_wykladowcy(pracownik):
    """
    Zwraca plan zajęć wykładowcy posortowany wg dnia i godziny.
    """
    zajecia_qs = (
        Zajecia.objects
        .filter(idpr=pracownik)
        .select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg', 'idg__idk')
        .order_by('dzien', 'godzrozp')
    )

    return [_serializuj_zajecia(z) for z in zajecia_qs]

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

            request.session['zalogowany_email'] = student.email
            request.session['zalogowana_rola'] = "student"

            return JsonResponse({
                'status': 'success',
                'role': 'student',
                'redirect_to': '/panel-studenta',
                'user_info': {'email': student.email},
                'plan_zajec': _plan_studenta(student),
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
                    'user_info': {'email': pracownik.email},
                    'plan_zajec': _plan_wykladowcy(pracownik),
                })
            elif rola_pracownika == 'planista':
                return JsonResponse({
                    'status': 'success',
                    'role': 'planista',
                    'redirect_to': '/panel-planisty',
                    'user_info': {'email': pracownik.email},
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


# Wykladowca
@csrf_exempt
def api_find_the_audience(request):
    """
    Zwraca listę wszystkich sal wraz z:
    - danymi jawnymi (odkrytymi): budynek (nazwa + adres), numer sali, typ, pojemność
    - danymi ukrytymi (zakrytymi): lista bloków czasowych kiedy sala jest zajęta
      (dzień tygodnia, godzina rozpoczęcia, godzina zakończenia)
    """
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    try:
        sale = Sale.objects.select_related('idb').all()

        wynik = []
        for sala in sale:
            # --- Dane jawne (odkryte) ---
            budynek = sala.idb
            dane_sali = {
                'ids': sala.ids,
                'numers': sala.numers,
                'typs': sala.typs,
                'pojemnosc': sala.pojemnosc,
                'budynek': {
                    'idb': budynek.idb,
                    'nazwab': budynek.nazwab,
                    'adresb': budynek.adresb,},
                # --- Dane ukryte (zakryte) – kiedy sala jest zajęta ---
                'zajecia': [
                    {
                        'dzien': z.dzien,
                        'godzrozp': z.godzrozp.strftime('%H:%M'),
                        'godzzak': z.godzzak.strftime('%H:%M'),
                    }
                    for z in Zajecia.objects.filter(ids=sala)
                ],
            }
            wynik.append(dane_sali)

        return JsonResponse({'status': 'success', 'sale': wynik})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Błąd serwera: {str(e)}'}, status=500)


# Student
@csrf_exempt
def api_professors_information(request):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    # Tylko zalogowany student ma dostęp
    rola_z_sesji = request.session.get('zalogowana_rola')
    if not rola_z_sesji:
        return JsonResponse({'status': 'error', 'message': 'Musisz być zalogowany'}, status=401)
    if rola_z_sesji != 'student':
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień – tylko dla studentów'}, status=403)

    try:
        nazwisko_param = request.GET.get('nazwisko', '').strip()
        imie_param = request.GET.get('imie', '').strip()

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
        # Wymagany co najmniej jeden parametr wyszukiwania
        if not nazwisko_param and not imie_param:
            return JsonResponse(
                {'status': 'error', 'message': 'Podaj co najmniej imię lub nazwisko prowadzącego'},
                status=400
            )

        # Szukamy tylko wśród pracowników z rolą wykładowcy (iexact = ignoruj wielkość liter)
        pracownicy_qs = Pracownicy.objects.filter(rola__iexact='wykladowca')

        if nazwisko_param:
            pracownicy_qs = pracownicy_qs.filter(nazwisko__icontains=nazwisko_param)
        if imie_param:
            pracownicy_qs = pracownicy_qs.filter(imie__icontains=imie_param)

        if not pracownicy_qs.exists():
            return JsonResponse(
                {'status': 'error', 'message': 'Nie znaleziono prowadzącego o podanych danych'},
                status=404
            )

        wynik = []
        for pracownik in pracownicy_qs:
            # Pobieramy wszystkie zajęcia prowadzone przez tego pracownika
            # i zbieramy unikalne przedmioty (po idp) z ich formą zajęć
            zajecia = (
                Zajecia.objects
                .filter(idpr=pracownik)
                .select_related('idp')
                .values('idp__nazwap', 'idp__formap')
                .distinct()
            )

            przedmioty = [
                {
                    'nazwap': z['idp__nazwap'],
                    'formap': z['idp__formap'],
                }
                for z in zajecia
            ]

            wynik.append({
                'stopien': pracownik.stopien or '',
                'imie': pracownik.imie,
                'nazwisko': pracownik.nazwisko,
                'email': pracownik.email,
                'przedmioty': przedmioty,
            })

        return JsonResponse({'status': 'success', 'prowadzacy': wynik})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Błąd serwera: {str(e)}'}, status=500)

# Planista
@csrf_exempt
def api_CRUD_subject(request, przedmiot_id=None):
    # 1. ZABEZPIECZENIE: Sprawdzamy, czy to na pewno planista
    rola = request.session.get('zalogowana_rola')
    if rola != 'planista':
        return JsonResponse(
            {'status': 'error', 'message': 'Brak uprawnień. Tylko planista może zarządzać przedmiotami.'}, status=403)

    # DODAWANIE NOWEGO PRZEDMIOTU (POST)
    if request.method == 'POST':
        data = json.loads(request.body)

        nowy_przedmiot = Przedmioty.objects.create(
            nazwap=data.get('nazwap'),
            formap=data.get('formap'),
            lbgodz=data.get('lbgodz')
        )
        return JsonResponse({
            'status': 'success',
            'message': 'Przedmiot dodany pomyślnie',
            'id': nowy_przedmiot.idp
        })

    # EDYTOWANIE ISTNIEJĄCEGO PRZEDMIOTU (PUT)
    elif request.method == 'PUT':
        if not przedmiot_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID przedmiotu do edycji'}, status=400)

        przedmiot = Przedmioty.objects.filter(idp=przedmiot_id).first()
        if not przedmiot:
            return JsonResponse({'status': 'error', 'message': 'Przedmiot nie istnieje'}, status=404)

        data = json.loads(request.body)

        # Zmieniamy dane. Jeśli jakiegoś pola nie wysłano w JSON, zostawiamy stare (drugi parametr get)
        przedmiot.nazwap = data.get('nazwap', przedmiot.nazwap)
        przedmiot.formap = data.get('formap', przedmiot.formap)
        przedmiot.lbgodz = data.get('lbgodz', przedmiot.lbgodz)
        przedmiot.save()

        return JsonResponse({'status': 'success', 'message': 'Przedmiot zaktualizowany'})

    # USUWANIE PRZEDMIOTU (DELETE)
    elif request.method == 'DELETE':
        if not przedmiot_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID przedmiotu do usunięcia'}, status=400)

        przedmiot = Przedmioty.objects.filter(idp=przedmiot_id).first()
        if not przedmiot:
            return JsonResponse({'status': 'error', 'message': 'Przedmiot nie istnieje'}, status=404)

        przedmiot.delete()
        return JsonResponse({'status': 'success', 'message': 'Przedmiot usunięty'})

    return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)