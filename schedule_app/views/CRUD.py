from .helping_functions import *
from .helping_functions import _serializuj_zajecia

@csrf_exempt
def api_CRUD_budynki(request, budynek_id=None):
    # ZABEZPIECZENIE: Sprawdzamy, czy to na pewno planista
    rola = request.session.get('zalogowana_rola')
    if rola != 'planista':
        return JsonResponse(
            {'status': 'error', 'message': 'Brak uprawnień. Tylko planista może zarządzać budynkami.'}, status=403)

    # DODAWANIE NOWEGO BUDYNKU (POST)
    elif request.method == 'POST':
        data = json.loads(request.body)

        wymagane_pola = ['nazwab', 'adresb']
        brakujace = [pole for pole in wymagane_pola if not data.get(pole)]
        if brakujace:
            return JsonResponse({'status': 'error', 'message': f'Brakujące pola: {", ".join(brakujace)}'}, status=400)

        if Budynki.objects.filter(nazwab=data.get('nazwab')).exists():
            return JsonResponse({'status': 'error', 'message': 'Budynek o podanej nazwie już istnieje'}, status=409)

        nowy_budynek = Budynki.objects.create(
            nazwab=data.get('nazwab'),
            adresb=data.get('adresb')
        )
        return JsonResponse({
            'status': 'success',
            'message': 'Budynek dodany pomyślnie',
            'id': nowy_budynek.idb
        })

    # EDYTOWANIE ISTNIEJĄCEGO BUDYNKU (PUT)
    elif request.method == 'PUT':
        if not budynek_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID budynku do edycji'}, status=400)

        budynek = Budynki.objects.filter(idb=budynek_id).first()
        if not budynek:
            return JsonResponse({'status': 'error', 'message': 'Budynek nie istnieje'}, status=404)

        data = json.loads(request.body)

        nowa_nazwa = data.get('nazwab', budynek.nazwab)
        if nowa_nazwa != budynek.nazwab and Budynki.objects.filter(nazwab=nowa_nazwa).exists():
            return JsonResponse({'status': 'error', 'message': 'Budynek o podanej nazwie już istnieje'}, status=409)

        budynek.nazwab = nowa_nazwa
        budynek.adresb = data.get('adresb', budynek.adresb)
        budynek.save()

        return JsonResponse({'status': 'success', 'message': 'Budynek zaktualizowany'})

    # USUWANIE BUDYNKU (DELETE)
    elif request.method == 'DELETE':
        if not budynek_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID budynku do usunięcia'}, status=400)

        budynek = Budynki.objects.filter(idb=budynek_id).first()
        if not budynek:
            return JsonResponse({'status': 'error', 'message': 'Budynek nie istnieje'}, status=404)

        budynek.delete()
        return JsonResponse({'status': 'success', 'message': 'Budynek usunięty'})

    return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)


@csrf_exempt
def api_CRUD_kierunki(request, kierunek_id=None):
    # ZABEZPIECZENIE: Sprawdzamy, czy to na pewno planista
    rola = request.session.get('zalogowana_rola')
    if rola != 'planista':
        return JsonResponse(
            {'status': 'error', 'message': 'Brak uprawnień. Tylko planista może zarządzać kierunkami.'}, status=403)

    # DODAWANIE NOWEGO KIERUNKU (POST)
    elif request.method == 'POST':
        data = json.loads(request.body)

        wymagane_pola = ['nazwak', 'rokstartu', 'idw']
        brakujace = [pole for pole in wymagane_pola if not data.get(pole)]
        if brakujace:
            return JsonResponse({'status': 'error', 'message': f'Brakujące pola: {", ".join(brakujace)}'}, status=400)

        wydzial = Wydzialy.objects.filter(idw=data.get('idw')).first()
        if not wydzial:
            return JsonResponse({'status': 'error', 'message': 'Podany wydział nie istnieje'}, status=404)

        if Kierunki.objects.filter(idw=wydzial, nazwak=data.get('nazwak')).exists():
            return JsonResponse({'status': 'error', 'message': 'Kierunek o tej nazwie już istnieje na tym wydziale'}, status=409)

        nowy_kierunek = Kierunki.objects.create(
            nazwak=data.get('nazwak'),
            rokstartu=data.get('rokstartu'),
            idw=wydzial
        )
        return JsonResponse({
            'status': 'success',
            'message': 'Kierunek dodany pomyślnie',
            'id': nowy_kierunek.idk
        })

    # EDYTOWANIE ISTNIEJĄCEGO KIERUNKU (PUT)
    elif request.method == 'PUT':
        if not kierunek_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID kierunku do edycji'}, status=400)

        kierunek = Kierunki.objects.filter(idk=kierunek_id).first()
        if not kierunek:
            return JsonResponse({'status': 'error', 'message': 'Kierunek nie istnieje'}, status=404)

        data = json.loads(request.body)

        nowy_wydzial = kierunek.idw
        if 'idw' in data:
            nowy_wydzial = Wydzialy.objects.filter(idw=data['idw']).first()
            if not nowy_wydzial:
                return JsonResponse({'status': 'error', 'message': 'Podany wydział nie istnieje'}, status=404)
            kierunek.idw = nowy_wydzial

        nowa_nazwa = data.get('nazwak', kierunek.nazwak)
        if (nowa_nazwa != kierunek.nazwak or nowy_wydzial.idw != kierunek.idw.idw) and Kierunki.objects.filter(nazwak=nowa_nazwa, idw=nowy_wydzial).exists():
            return JsonResponse({'status': 'error', 'message': 'Kierunek o tej nazwie już istnieje na tym wydziale'}, status=409)

        kierunek.nazwak = nowa_nazwa
        kierunek.rokstartu = data.get('rokstartu', kierunek.rokstartu)
        kierunek.save()

        return JsonResponse({'status': 'success', 'message': 'Kierunek zaktualizowany'})

    # USUWANIE KIERUNKU (DELETE)
    elif request.method == 'DELETE':
        if not kierunek_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać ID kierunku do usunięcia'}, status=400)

        kierunek = Kierunki.objects.filter(idk=kierunek_id).first()
        if not kierunek:
            return JsonResponse({'status': 'error', 'message': 'Kierunek nie istnieje'}, status=404)

        kierunek.delete()
        return JsonResponse({'status': 'success', 'message': 'Kierunek usunięty'})

    return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

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

        if Przedmioty.objects.filter(nazwap=data.get('nazwap'), formap=data.get('formap')).exists():
            return JsonResponse({'status': 'error', 'message': 'Przedmiot o tej nazwie i formie już istnieje'}, status=409)

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
        nowa_nazwa = data.get('nazwap', przedmiot.nazwap)
        nowa_forma = data.get('formap', przedmiot.formap)

        if (nowa_nazwa != przedmiot.nazwap or nowa_forma != przedmiot.formap) and Przedmioty.objects.filter(nazwap=nowa_nazwa, formap=nowa_forma).exists():
            return JsonResponse({'status': 'error', 'message': 'Przedmiot o tej nazwie i formie już istnieje'}, status=409)

        przedmiot.nazwap = nowa_nazwa
        przedmiot.formap = nowa_forma
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
            return JsonResponse({'status': 'error', 'message': 'Sala o tym numerze już istnieje w podanym budynku'},
                                status=409)

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
            if not data['idb'] or str(data['idb']).strip() == "":
                return JsonResponse({'status': 'error', 'message': 'Musisz wybrać budynek'}, status=400)
            nowy_budynek = Budynki.objects.filter(idb=data['idb']).first()
            if not nowy_budynek:
                return JsonResponse({'status': 'error', 'message': 'Podany budynek nie istnieje'}, status=404)
            sala.idb = nowy_budynek

        nowy_numers = data.get('numers', sala.numers)
        # Sprawdzamy czy zmiana nie narusza unikalności numers+idb
        if (nowy_numers != sala.numers or nowy_budynek.idb != sala.idb.idb) and Sale.objects.filter(numers=nowy_numers,
                                                                                                    idb=nowy_budynek).exists():
            return JsonResponse({'status': 'error', 'message': 'Sala o tym numerze już istnieje w tym budynku'},
                                status=409)

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
            return JsonResponse({'status': 'error', 'message': 'Konto z podanym adresem email już istnieje'},
                                status=409)

        nrtel = data.get('nrtel')
        if nrtel and Pracownicy.objects.filter(nrtel=nrtel).exists():
            return JsonResponse({'status': 'error', 'message': 'Konto z podanym numerem telefonu już istnieje'}, status=409)

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
        if nowy_email != pracownik.email and (
                Studenci.objects.filter(email=nowy_email).exists() or Pracownicy.objects.filter(
                email=nowy_email).exists()):
            return JsonResponse({'status': 'error', 'message': 'Konto z podanym adresem email już istnieje'},
                                status=409)

        nowy_nrtel = data.get('nrtel', pracownik.nrtel)
        if nowy_nrtel and nowy_nrtel != pracownik.nrtel and Pracownicy.objects.filter(nrtel=nowy_nrtel).exists():
            return JsonResponse({'status': 'error', 'message': 'Konto z podanym numerem telefonu już istnieje'}, status=409)

        pracownik.stopien = data.get('stopien', pracownik.stopien)
        pracownik.nazwisko = data.get('nazwisko', pracownik.nazwisko)
        pracownik.imie = data.get('imie', pracownik.imie)
        pracownik.email = nowy_email
        pracownik.nrtel = nowy_nrtel
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
            zajecia = Zajecia.objects.select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg', 'idg__idk').filter(
                idz=zajecia_id).first()
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
            return JsonResponse({'status': 'error', 'message': 'Błąd walidacji kluczy obcych', 'errors': bledy},
                                status=404)

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
        zajecia_z_bazy = Zajecia.objects.select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg', 'idg__idk').get(
            idz=nowe_zajecia.idz)

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
            if not przedmiot: return JsonResponse({'status': 'error', 'message': 'Podany przedmiot nie istnieje'},
                                                  status=404)
            zajecia.idp = przedmiot

        if 'idpr' in data:
            pracownik = Pracownicy.objects.filter(idpr=data['idpr']).first()
            if not pracownik: return JsonResponse({'status': 'error', 'message': 'Podany pracownik nie istnieje'},
                                                  status=404)
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
        zaktualizowane_zajecia = Zajecia.objects.select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg',
                                                                'idg__idk').get(idz=zajecia.idz)

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
            return JsonResponse({'status': 'error', 'message': 'Podaj poprawny typ konta (student/pracownik)'},
                                status=400)

        if not email or not haslo:
            return JsonResponse({'status': 'error', 'message': 'Email i hasło są wymagane'}, status=400)

        # Reguła bazy danych: sprawdzamy czy email jest unikalny w OBU tabelach (ponieważ logowanie opiera się na emailu)
        if Studenci.objects.filter(email=email).exists() or Pracownicy.objects.filter(email=email).exists():
            return JsonResponse({'status': 'error', 'message': 'Konto z podanym adresem email już istnieje'},
                                status=409)

        if typ_konta_post == 'student':
            wymagane = ['nazwisko', 'imie', 'status']
            brakujace = [pole for pole in wymagane if not data.get(pole)]
            if brakujace:
                return JsonResponse(
                    {'status': 'error', 'message': f'Brakujące pola dla studenta: {", ".join(brakujace)}'}, status=400)

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
            brakujace = [pole for pole in wymagane if not data.get(pole)]
            if brakujace:
                return JsonResponse(
                    {'status': 'error', 'message': f'Brakujące pola dla pracownika: {", ".join(brakujace)}'},
                    status=400)

            nrtel = data.get('nrtel', '')
            if nrtel and Pracownicy.objects.filter(nrtel=nrtel).exists():
                return JsonResponse({'status': 'error', 'message': 'Konto z podanym numerem telefonu już istnieje'}, status=409)

            nowy = Pracownicy.objects.create(
                stopien=data.get('stopien', ''),
                nazwisko=data.get('nazwisko'),
                imie=data.get('imie'),
                email=email,
                nrtel=nrtel,
                haslo=make_password(haslo),
                rola=data.get('rola')
            )
            return JsonResponse({'status': 'success', 'message': 'Konto pracownika utworzone', 'id': nowy.idpr})

    elif request.method == 'DELETE':
        if not typ_konta or not konto_id:
            return JsonResponse({'status': 'error', 'message': 'Musisz podać typ konta i ID w URL do usunięcia'},
                                status=400)

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
