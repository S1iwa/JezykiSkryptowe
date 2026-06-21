from .helping_functions import *
from .helping_functions import _oblicz_czas_w_minutach


@csrf_exempt
def api_raport_obciazenia_sal(request):
    """Endpoint dla Wykładowcy / Planisty generujący raport obciążenia wszystkich sal."""
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    rola_sesja = request.session.get('zalogowana_rola')
    if rola_sesja not in ['wykladowca', 'planista']:
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień. Dostęp dla wykładowcy lub planisty.'},
                            status=403)

    try:
        sale = Sale.objects.select_related('idb').all()
        # Pobieramy zajęcia z góry dla zoptymalizowania zapytań
        zajecia_all = list(Zajecia.objects.select_related('idp', 'idpr', 'idg', 'idg__idk').all())

        wynik = []
        for sala in sale:
            zajecia_sali = [z for z in zajecia_all if z.ids_id == sala.ids]

            lacznie_minut = 0
            zajecia_dane = []

            for z in zajecia_sali:
                trwanie = _oblicz_czas_w_minutach(z.godzrozp, z.godzzak)
                lacznie_minut += trwanie

                zajecia_dane.append({
                    'dzien': z.dzien,
                    'godzrozp': z.godzrozp.strftime('%H:%M'),
                    'godzzak': z.godzzak.strftime('%H:%M'),
                    'czas_trwania_minuty': trwanie,
                    'przedmiot': z.idp.nazwap,
                    'forma': z.idp.formap,
                    'grupa_kierunek': f"{z.idg.idk.nazwak} (Rok {z.idg.rokstudiow}, Semestr {z.idg.semestr})",
                    'wykladowca': f"{z.idpr.stopien or ''} {z.idpr.imie} {z.idpr.nazwisko}".strip()
                })

            wynik.append({
                'ids': sala.ids,
                'numers': sala.numers,
                'typs': sala.typs,
                'pojemnosc': sala.pojemnosc,
                'budynek_nazwa': sala.idb.nazwab,
                'obciazenie_tygodniowe_minuty': lacznie_minut,
                'obciazenie_tygodniowe_godziny': round(lacznie_minut / 60, 2),
                'zajecia': zajecia_dane
            })

        return JsonResponse({'status': 'success', 'raport_sal': wynik})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@csrf_exempt
def api_raport_obciazenia_wykladowcow(request):
    """Endpoint dla Wykładowcy / Planisty generujący raport obciążenia wszystkich wykładowców."""
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    rola_sesja = request.session.get('zalogowana_rola')
    if rola_sesja not in ['wykladowca', 'planista']:
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień. Dostęp dla wykładowcy lub planisty.'},
                            status=403)

    try:
        # Tylko pracownicy będący wykładowcami
        wykladowcy = Pracownicy.objects.filter(rola__iexact='wykladowca')
        zajecia_all = list(Zajecia.objects.select_related('ids', 'ids__idb', 'idp', 'idg', 'idg__idk').all())

        wynik = []
        for pracownik in wykladowcy:
            zajecia_pracownika = [z for z in zajecia_all if z.idpr_id == pracownik.idpr]

            lacznie_minut = 0
            zajecia_dane = []

            for z in zajecia_pracownika:
                trwanie = _oblicz_czas_w_minutach(z.godzrozp, z.godzzak)
                lacznie_minut += trwanie

                zajecia_dane.append({
                    'dzien': z.dzien,
                    'godzrozp': z.godzrozp.strftime('%H:%M'),
                    'godzzak': z.godzzak.strftime('%H:%M'),
                    'czas_trwania_minuty': trwanie,
                    'przedmiot': z.idp.nazwap,
                    'forma': z.idp.formap,
                    'grupa_kierunek': f"{z.idg.idk.nazwak} (Rok {z.idg.rokstudiow})",
                    'sala': f"Sala {z.ids.numers} ({z.ids.idb.nazwab})"
                })

            wynik.append({
                'idpr': pracownik.idpr,
                'stopien': pracownik.stopien or '',
                'imie': pracownik.imie,
                'nazwisko': pracownik.nazwisko,
                'email': pracownik.email,
                'obciazenie_tygodniowe_minuty': lacznie_minut,
                'obciazenie_tygodniowe_godziny': round(lacznie_minut / 60, 2),
                'zajecia': zajecia_dane
            })

        return JsonResponse({'status': 'success', 'raport_wykladowcow': wynik})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)