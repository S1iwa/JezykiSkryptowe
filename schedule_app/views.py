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

    rola_z_sesji = request.session.get('zalogowana_rola')
    if not rola_z_sesji:
        return JsonResponse({'status': 'error', 'message': 'Musisz być zalogowany'}, status=401)

    try:
        sale = Sale.objects.select_related('idb').all()

        wynik = []
        for sala in sale:
            # Dane jawne
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
                # Dane ukryte (zakryte) – kiedy sala jest zajęta
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

    # Tylko zalogowany użytkownik ma dostęp
    rola_z_sesji = request.session.get('zalogowana_rola')
    if not rola_z_sesji:
        return JsonResponse({'status': 'error', 'message': 'Musisz być zalogowany'}, status=401)

    try:
        nazwisko_param = request.GET.get('nazwisko', '').strip()
        imie_param = request.GET.get('imie', '').strip()

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

# Planista
# Przedmioty
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

        wymagane_pola = ['nazwap', 'formap', 'lbgodz']
        brakujace = [pole for pole in wymagane_pola if not data.get(pole)]
        if brakujace:
            return JsonResponse({'status': 'error', 'message': f'Brakujące pola: {", ".join(brakujace)}'}, status=400)

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

# Sala
@csrf_exempt
def api_CRUD_sala(request, sala_id=None):
    # ZABEZPIECZENIE: Sprawdzamy, czy to na pewno planista
    rola = request.session.get('zalogowana_rola')
    if rola != 'planista':
        return JsonResponse(
            {'status': 'error', 'message': 'Brak uprawnień. Tylko planista może zarządzać salami.'}, status=403)

    # DODAWANIE NOWEJ SALI (POST)
    if request.method == 'POST':
        data = json.loads(request.body)

        wymagane_pola = ['numers', 'typs', 'pojemnosc', 'idb']
        brakujace = [pole for pole in wymagane_pola if data.get(pole) is None or data.get(pole) == '']
        if brakujace:
            return JsonResponse({'status': 'error', 'message': f'Brakujące pola: {", ".join(brakujace)}'}, status=400)

        # pobieramy obiekt Budynki na podstawie przesłanego ID
        budynek = Budynki.objects.filter(idb=data.get('idb')).first()
        if not budynek:
            return JsonResponse({'status': 'error', 'message': 'Podany budynek nie istnieje'}, status=404)

        numers = data.get('numers')
        if Sale.objects.filter(numers=numers, idb=budynek).exists():
            return JsonResponse({'status': 'error', 'message': 'Sala o tym numerze już istnieje w podanym budynku'}, status=409)

        nowa_sala = Sale.objects.create(
            numers=data.get('numers'),
            typs=data.get('typs'),
            pojemnosc=data.get('pojemnosc'),
            idb=budynek
        )
        return JsonResponse({
            'status': 'success',
            'message': 'Sala dodana pomyślnie',
            'id': nowa_sala.ids
        })

    # EDYTOWANIE ISTNIEJĄCEJ SALI (PUT)
    elif request.method == 'PUT':
        if not sala_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID sali do edycji'}, status=400)

        sala = Sale.objects.filter(ids=sala_id).first()
        if not sala:
            return JsonResponse({'status': 'error', 'message': 'Sala nie istnieje'}, status=404)

        data = json.loads(request.body)

        # Jeśli przesłano nowe idb, zamieniamy budynek
        nowy_budynek = sala.idb
        if 'idb' in data:
            nowy_budynek = Budynki.objects.filter(idb=data['idb']).first()
            if not nowy_budynek:
                return JsonResponse({'status': 'error', 'message': 'Podany budynek nie istnieje'}, status=404)
            sala.idb = nowy_budynek

        nowy_numers = data.get('numers', sala.numers)
        # Sprawdzamy czy zmiana nie narusza unikalności numers+idb
        if (nowy_numers != sala.numers or nowy_budynek.idb != sala.idb.idb) and Sale.objects.filter(numers=nowy_numers, idb=nowy_budynek).exists():
            return JsonResponse({'status': 'error', 'message': 'Sala o tym numerze już istnieje w tym budynku'}, status=409)

        sala.numers = nowy_numers
        sala.typs = data.get('typs', sala.typs)
        sala.pojemnosc = data.get('pojemnosc', sala.pojemnosc)
        sala.save()

        return JsonResponse({'status': 'success', 'message': 'Sala zaktualizowana'})

    # USUWANIE SALI (DELETE)
    elif request.method == 'DELETE':
        if not sala_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID sali do usunięcia'}, status=400)

        sala = Sale.objects.filter(ids=sala_id).first()
        if not sala:
            return JsonResponse({'status': 'error', 'message': 'Sala nie istnieje'}, status=404)

        sala.delete()
        return JsonResponse({'status': 'success', 'message': 'Sala usunięta'})

    return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)


# Pracownik
@csrf_exempt
def api_CRUD_pracownik(request, pracownik_id=None):
    # ZABEZPIECZENIE: Sprawdzamy, czy to na pewno planista
    rola_sesja = request.session.get('zalogowana_rola')
    if rola_sesja != 'planista':
        return JsonResponse(
            {'status': 'error', 'message': 'Brak uprawnień. Tylko planista może zarządzać pracownikami.'}, status=403)

    # DODAWANIE NOWEGO PRACOWNIKA (POST)
    if request.method == 'POST':
        data = json.loads(request.body)
        
        wymagane_pola = ['nazwisko', 'imie', 'email', 'haslo', 'rola']
        brakujace = [pole for pole in wymagane_pola if not data.get(pole)]
        if brakujace:
            return JsonResponse({'status': 'error', 'message': f'Brakujące pola: {", ".join(brakujace)}'}, status=400)

        haslo = data.get('haslo')
        email = data.get('email')
        
        if email and (Studenci.objects.filter(email=email).exists() or Pracownicy.objects.filter(email=email).exists()):
            return JsonResponse({'status': 'error', 'message': 'Konto z podanym adresem email już istnieje'}, status=409)

        nowy_pracownik = Pracownicy.objects.create(
            stopien=data.get('stopien'),
            nazwisko=data.get('nazwisko'),
            imie=data.get('imie'),
            email=data.get('email'),
            nrtel=data.get('nrtel'),
            haslo=make_password(haslo),
            rola=data.get('rola')
        )
        return JsonResponse({
            'status': 'success',
            'message': 'Pracownik dodany pomyślnie',
            'id': nowy_pracownik.idpr
        })

    # EDYTOWANIE ISTNIEJĄCEGO PRACOWNIKA (PUT)
    elif request.method == 'PUT':
        if not pracownik_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID pracownika do edycji'}, status=400)

        pracownik = Pracownicy.objects.filter(idpr=pracownik_id).first()
        if not pracownik:
            return JsonResponse({'status': 'error', 'message': 'Pracownik nie istnieje'}, status=404)

        data = json.loads(request.body)

        nowy_email = data.get('email', pracownik.email)
        if nowy_email != pracownik.email and (Studenci.objects.filter(email=nowy_email).exists() or Pracownicy.objects.filter(email=nowy_email).exists()):
            return JsonResponse({'status': 'error', 'message': 'Konto z podanym adresem email już istnieje'}, status=409)

        pracownik.stopien = data.get('stopien', pracownik.stopien)
        pracownik.nazwisko = data.get('nazwisko', pracownik.nazwisko)
        pracownik.imie = data.get('imie', pracownik.imie)
        pracownik.email = nowy_email
        pracownik.nrtel = data.get('nrtel', pracownik.nrtel)
        pracownik.rola = data.get('rola', pracownik.rola)
        
        haslo = data.get('haslo')
        if haslo:
            pracownik.haslo = make_password(haslo)

        pracownik.save()

        return JsonResponse({'status': 'success', 'message': 'Dane pracownika zaktualizowane'})

    # USUWANIE PRACOWNIKA (DELETE)
    elif request.method == 'DELETE':
        if not pracownik_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID pracownika do usunięcia'}, status=400)

        pracownik = Pracownicy.objects.filter(idpr=pracownik_id).first()
        if not pracownik:
            return JsonResponse({'status': 'error', 'message': 'Pracownik nie istnieje'}, status=404)

        pracownik.delete()
        return JsonResponse({'status': 'success', 'message': 'Pracownik usunięty'})

    return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)


# Grupa
@csrf_exempt
def api_CRUD_grupa(request, grupa_id=None):
    # ZABEZPIECZENIE: Sprawdzamy, czy to na pewno planista
    rola_sesja = request.session.get('zalogowana_rola')
    if rola_sesja != 'planista':
        return JsonResponse(
            {'status': 'error', 'message': 'Brak uprawnień. Tylko planista może zarządzać grupami.'}, status=403)

    # DODAWANIE NOWEJ GRUPY (POST)
    if request.method == 'POST':
        data = json.loads(request.body)

        wymagane_pola = ['idk', 'rokstudiow', 'semestr', 'rokakadem', 'liczbaos']
        brakujace = [pole for pole in wymagane_pola if data.get(pole) is None or data.get(pole) == '']
        if brakujace:
            return JsonResponse({'status': 'error', 'message': f'Brakujące pola: {", ".join(brakujace)}'}, status=400)

        # idk to Foreign Key – pobieramy obiekt Kierunki
        kierunek = Kierunki.objects.filter(idk=data.get('idk')).first()
        if not kierunek:
            return JsonResponse({'status': 'error', 'message': 'Podany kierunek nie istnieje'}, status=404)

        nowa_grupa = Grupy.objects.create(
            idk=kierunek,
            rokstudiow=data.get('rokstudiow'),
            semestr=data.get('semestr'),
            rokakadem=data.get('rokakadem'),
            liczbaos=data.get('liczbaos'),
            opis=data.get('opis', '')
        )
        return JsonResponse({
            'status': 'success',
            'message': 'Grupa dodana pomyślnie',
            'id': nowa_grupa.idg
        })

    # EDYTOWANIE ISTNIEJĄCEJ GRUPY (PUT)
    elif request.method == 'PUT':
        if not grupa_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID grupy do edycji'}, status=400)

        grupa = Grupy.objects.filter(idg=grupa_id).first()
        if not grupa:
            return JsonResponse({'status': 'error', 'message': 'Grupa nie istnieje'}, status=404)

        data = json.loads(request.body)

        # Jeśli przesłano nowe idk, zamieniamy FK
        if 'idk' in data:
            kierunek = Kierunki.objects.filter(idk=data['idk']).first()
            if not kierunek:
                return JsonResponse({'status': 'error', 'message': 'Podany kierunek nie istnieje'}, status=404)
            grupa.idk = kierunek

        grupa.rokstudiow = data.get('rokstudiow', grupa.rokstudiow)
        grupa.semestr = data.get('semestr', grupa.semestr)
        grupa.rokakadem = data.get('rokakadem', grupa.rokakadem)
        grupa.liczbaos = data.get('liczbaos', grupa.liczbaos)
        grupa.opis = data.get('opis', grupa.opis)

        grupa.save()

        return JsonResponse({'status': 'success', 'message': 'Dane grupy zaktualizowane'})

    # USUWANIE GRUPY (DELETE)
    elif request.method == 'DELETE':
        if not grupa_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID grupy do usunięcia'}, status=400)

        grupa = Grupy.objects.filter(idg=grupa_id).first()
        if not grupa:
            return JsonResponse({'status': 'error', 'message': 'Grupa nie istnieje'}, status=404)

        grupa.delete()
        return JsonResponse({'status': 'success', 'message': 'Grupa usunięta'})

    return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)


# Zajęcia
@csrf_exempt
def api_CRUD_zajecia(request, zajecia_id=None):
    # ZABEZPIECZENIE: Sprawdzamy, czy to na pewno planista
    rola_sesja = request.session.get('zalogowana_rola')
    if rola_sesja != 'planista':
        return JsonResponse(
            {'status': 'error', 'message': 'Brak uprawnień. Tylko planista może zarządzać zajęciami.'}, status=403)

    # POBIERANIE ZAJĘĆ (GET)
    if request.method == 'GET':
        if zajecia_id:
            zajecia = Zajecia.objects.select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg', 'idg__idk').filter(idz=zajecia_id).first()
            if not zajecia:
                return JsonResponse({'status': 'error', 'message': 'Zajęcia nie istnieją'}, status=404)
            return JsonResponse({'status': 'success', 'zajecia': _serializuj_zajecia(zajecia)})
        else:
            # Pobieramy wszystkie zajęcia, opcjonalnie można by dodać paginację lub filtry
            zajecia_qs = Zajecia.objects.select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg', 'idg__idk').all()
            wynik = [_serializuj_zajecia(z) for z in zajecia_qs]
            return JsonResponse({'status': 'success', 'zajecia': wynik})

    # DODAWANIE NOWYCH ZAJĘĆ (POST)
    elif request.method == 'POST':
        data = json.loads(request.body)

        wymagane_pola = ['dzien', 'godzrozp', 'godzzak', 'ids', 'idp', 'idpr', 'idg']
        brakujace = [pole for pole in wymagane_pola if data.get(pole) is None or data.get(pole) == '']
        if brakujace:
            return JsonResponse({'status': 'error', 'message': f'Brakujące pola: {", ".join(brakujace)}'}, status=400)

        # Pobieranie kluczy obcych i walidacja
        sala = Sale.objects.filter(ids=data.get('ids')).first()
        przedmiot = Przedmioty.objects.filter(idp=data.get('idp')).first()
        pracownik = Pracownicy.objects.filter(idpr=data.get('idpr')).first()
        grupa = Grupy.objects.filter(idg=data.get('idg')).first()

        bledy = []
        if not sala: bledy.append('Podana sala nie istnieje')
        if not przedmiot: bledy.append('Podany przedmiot nie istnieje')
        if not pracownik: bledy.append('Podany wykładowca nie istnieje')
        if not grupa: bledy.append('Podana grupa nie istnieje')

        if bledy:
            return JsonResponse({'status': 'error', 'message': 'Błąd walidacji kluczy obcych', 'errors': bledy}, status=404)

        nowe_zajecia = Zajecia.objects.create(
            dzien=data.get('dzien'),
            godzrozp=data.get('godzrozp'),
            godzzak=data.get('godzzak'),
            uwagi=data.get('uwagi', ''),
            ids=sala,
            idp=przedmiot,
            idpr=pracownik,
            idg=grupa
        )
        
        # Aby zwrócić szczegóły nowo dodanych zajęć, ładujemy je z relacjami
        zajecia_z_bazy = Zajecia.objects.select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg', 'idg__idk').get(idz=nowe_zajecia.idz)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Zajęcia dodane pomyślnie',
            'zajecia': _serializuj_zajecia(zajecia_z_bazy)
        })

    # EDYTOWANIE ISTNIEJĄCYCH ZAJĘĆ (PUT)
    elif request.method == 'PUT':
        if not zajecia_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID zajęć do edycji'}, status=400)

        zajecia = Zajecia.objects.filter(idz=zajecia_id).first()
        if not zajecia:
            return JsonResponse({'status': 'error', 'message': 'Zajęcia nie istnieją'}, status=404)

        data = json.loads(request.body)

        # Walidacja ewentualnych zmian kluczy obcych
        if 'ids' in data:
            sala = Sale.objects.filter(ids=data['ids']).first()
            if not sala: return JsonResponse({'status': 'error', 'message': 'Podana sala nie istnieje'}, status=404)
            zajecia.ids = sala
            
        if 'idp' in data:
            przedmiot = Przedmioty.objects.filter(idp=data['idp']).first()
            if not przedmiot: return JsonResponse({'status': 'error', 'message': 'Podany przedmiot nie istnieje'}, status=404)
            zajecia.idp = przedmiot
            
        if 'idpr' in data:
            pracownik = Pracownicy.objects.filter(idpr=data['idpr']).first()
            if not pracownik: return JsonResponse({'status': 'error', 'message': 'Podany pracownik nie istnieje'}, status=404)
            zajecia.idpr = pracownik
            
        if 'idg' in data:
            grupa = Grupy.objects.filter(idg=data['idg']).first()
            if not grupa: return JsonResponse({'status': 'error', 'message': 'Podana grupa nie istnieje'}, status=404)
            zajecia.idg = grupa

        zajecia.dzien = data.get('dzien', zajecia.dzien)
        zajecia.godzrozp = data.get('godzrozp', zajecia.godzrozp)
        zajecia.godzzak = data.get('godzzak', zajecia.godzzak)
        zajecia.uwagi = data.get('uwagi', zajecia.uwagi)

        zajecia.save()
        
        # Zwracanie zaktualizowanych zajęć
        zaktualizowane_zajecia = Zajecia.objects.select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg', 'idg__idk').get(idz=zajecia.idz)

        return JsonResponse({
            'status': 'success', 
            'message': 'Dane zajęć zaktualizowane',
            'zajecia': _serializuj_zajecia(zaktualizowane_zajecia)
        })

    # USUWANIE ZAJĘĆ (DELETE)
    elif request.method == 'DELETE':
        if not zajecia_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID zajęć do usunięcia'}, status=400)

        zajecia = Zajecia.objects.filter(idz=zajecia_id).first()
        if not zajecia:
            return JsonResponse({'status': 'error', 'message': 'Zajęcia nie istnieją'}, status=404)

        zajecia.delete()
        return JsonResponse({'status': 'success', 'message': 'Zajęcia usunięte'})

    return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)


# Dodawanie i usuwanie kont
@csrf_exempt
def api_add_delete_account(request, typ_konta=None, konto_id=None):
    # ZABEZPIECZENIE: Sprawdzamy, czy to na pewno planista
    rola_sesja = request.session.get('zalogowana_rola')
    if rola_sesja != 'planista':
        return JsonResponse(
            {'status': 'error', 'message': 'Brak uprawnień. Tylko planista może zarządzać kontami.'}, status=403)

    if request.method == 'POST':
        data = json.loads(request.body)
        typ_konta_post = data.get('typ_konta')
        email = data.get('email')
        haslo = data.get('haslo')

        if not typ_konta_post or typ_konta_post not in ['student', 'pracownik']:
            return JsonResponse({'status': 'error', 'message': 'Podaj poprawny typ konta (student/pracownik)'}, status=400)
        
        if not email or not haslo:
            return JsonResponse({'status': 'error', 'message': 'Email i hasło są wymagane'}, status=400)

        # Reguła bazy danych: sprawdzamy czy email jest unikalny w OBU tabelach (ponieważ logowanie opiera się na emailu)
        if Studenci.objects.filter(email=email).exists() or Pracownicy.objects.filter(email=email).exists():
            return JsonResponse({'status': 'error', 'message': 'Konto z podanym adresem email już istnieje'}, status=409)

        if typ_konta_post == 'student':
            wymagane = ['nazwisko', 'imie', 'status']
            brakujące = [pole for pole in wymagane if not data.get(pole)]
            if brakujące:
                return JsonResponse({'status': 'error', 'message': f'Brakujące pola dla studenta: {", ".join(brakujące)}'}, status=400)

            nowy = Studenci.objects.create(
                nazwisko=data.get('nazwisko'),
                imie=data.get('imie'),
                status=data.get('status'),
                email=email,
                haslo=make_password(haslo)
            )
            return JsonResponse({'status': 'success', 'message': 'Konto studenta utworzone', 'id': nowy.idst})
        
        elif typ_konta_post == 'pracownik':
            wymagane = ['nazwisko', 'imie', 'rola']
            brakujące = [pole for pole in wymagane if not data.get(pole)]
            if brakujące:
                return JsonResponse({'status': 'error', 'message': f'Brakujące pola dla pracownika: {", ".join(brakujące)}'}, status=400)

            nowy = Pracownicy.objects.create(
                stopien=data.get('stopien', ''),
                nazwisko=data.get('nazwisko'),
                imie=data.get('imie'),
                email=email,
                nrtel=data.get('nrtel', ''),
                haslo=make_password(haslo),
                rola=data.get('rola')
            )
            return JsonResponse({'status': 'success', 'message': 'Konto pracownika utworzone', 'id': nowy.idpr})

    elif request.method == 'DELETE':
        if not typ_konta or not konto_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać typ konta i ID w URL do usunięcia'}, status=400)

        if typ_konta == 'student':
            konto = Studenci.objects.filter(idst=konto_id).first()
            if not konto: return JsonResponse({'status': 'error', 'message': 'Student nie istnieje'}, status=404)
            konto.delete()
            return JsonResponse({'status': 'success', 'message': 'Konto studenta usunięte'})
            
        elif typ_konta == 'pracownik':
            konto = Pracownicy.objects.filter(idpr=konto_id).first()
            if not konto: return JsonResponse({'status': 'error', 'message': 'Pracownik nie istnieje'}, status=404)
            konto.delete()
            return JsonResponse({'status': 'success', 'message': 'Konto pracownika usunięte'})
            
        else:
            return JsonResponse({'status': 'error', 'message': 'Nieznany typ konta'}, status=400)

    return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

