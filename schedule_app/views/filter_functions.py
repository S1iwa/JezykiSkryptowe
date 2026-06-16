from .helping_functions import *

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
