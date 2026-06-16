from .helping_functions import *
from .helping_functions import _serializuj_zajecia

@csrf_exempt
def api_get_budynki(request, budynek_id=None):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)
        
    rola = request.session.get('zalogowana_rola')
    if not rola:
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień. Musisz być zalogowany.'}, status=403)

    if budynek_id:
        budynek = Budynki.objects.filter(idb=budynek_id).first()
        if not budynek:
            return JsonResponse({'status': 'error', 'message': 'Budynek nie istnieje'}, status=404)
        return JsonResponse({'status': 'success', 'budynek': {'idb': budynek.idb, 'nazwab': budynek.nazwab, 'adresb': budynek.adresb}})
    else:
        budynki_qs = Budynki.objects.all()
        wynik = [{'idb': b.idb, 'nazwab': b.nazwab, 'adresb': b.adresb} for b in budynki_qs]
        return JsonResponse({'status': 'success', 'budynki': wynik})

@csrf_exempt
def api_get_kierunki(request, kierunek_id=None):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    rola = request.session.get('zalogowana_rola')
    if not rola:
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień. Musisz być zalogowany.'}, status=403)

    if kierunek_id:
        kierunek = Kierunki.objects.select_related('idw').filter(idk=kierunek_id).first()
        if not kierunek:
            return JsonResponse({'status': 'error', 'message': 'Kierunek nie istnieje'}, status=404)
        return JsonResponse({'status': 'success', 'kierunek': {'idk': kierunek.idk, 'nazwak': kierunek.nazwak, 'rokstartu': kierunek.rokstartu, 'wydzial': {'idw': kierunek.idw.idw, 'nazwaw': kierunek.idw.nazwaw}}})
    else:
        kierunki_qs = Kierunki.objects.select_related('idw').all()
        wynik = [{'idk': k.idk, 'nazwak': k.nazwak, 'rokstartu': k.rokstartu, 'wydzial': {'idw': k.idw.idw, 'nazwaw': k.idw.nazwaw}} for k in kierunki_qs]
        return JsonResponse({'status': 'success', 'kierunki': wynik})

@csrf_exempt
def api_get_przedmioty(request, przedmiot_id=None):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    rola = request.session.get('zalogowana_rola')
    if not rola:
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień. Musisz być zalogowany.'}, status=403)

    if przedmiot_id:
        przedmiot = Przedmioty.objects.filter(idp=przedmiot_id).first()
        if not przedmiot:
            return JsonResponse({'status': 'error', 'message': 'Przedmiot nie istnieje'}, status=404)
        return JsonResponse({'status': 'success', 'przedmiot': {'idp': przedmiot.idp, 'nazwap': przedmiot.nazwap, 'formap': przedmiot.formap, 'lbgodz': przedmiot.lbgodz}})
    else:
        przedmioty_qs = Przedmioty.objects.all()
        wynik = [{'idp': p.idp, 'nazwap': p.nazwap, 'formap': p.formap, 'lbgodz': p.lbgodz} for p in przedmioty_qs]
        return JsonResponse({'status': 'success', 'przedmioty': wynik})

@csrf_exempt
def api_get_sale(request, sala_id=None):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    rola = request.session.get('zalogowana_rola')
    if not rola:
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień. Musisz być zalogowany.'}, status=403)

    if sala_id:
        sala = Sale.objects.select_related('idb').filter(ids=sala_id).first()
        if not sala:
            return JsonResponse({'status': 'error', 'message': 'Sala nie istnieje'}, status=404)
        return JsonResponse({'status': 'success', 'sala': {'ids': sala.ids, 'numers': sala.numers, 'typs': sala.typs, 'pojemnosc': sala.pojemnosc, 'budynek': {'idb': sala.idb.idb, 'nazwab': sala.idb.nazwab, 'adresb': sala.idb.adresb}}})
    else:
        sale_qs = Sale.objects.select_related('idb').all()
        wynik = [{'ids': s.ids, 'numers': s.numers, 'typs': s.typs, 'pojemnosc': s.pojemnosc, 'budynek': {'idb': s.idb.idb, 'nazwab': s.idb.nazwab, 'adresb': s.idb.adresb}} for s in sale_qs]
        return JsonResponse({'status': 'success', 'sale': wynik})

@csrf_exempt
def api_get_pracownicy(request, pracownik_id=None):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    rola = request.session.get('zalogowana_rola')
    if not rola:
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień. Musisz być zalogowany.'}, status=403)

    if pracownik_id:
        pracownik = Pracownicy.objects.filter(idpr=pracownik_id).first()
        if not pracownik:
            return JsonResponse({'status': 'error', 'message': 'Pracownik nie istnieje'}, status=404)
        # Omijamy zwracanie hasla w odpowiedzi GET
        return JsonResponse({'status': 'success', 'pracownik': {'idpr': pracownik.idpr, 'stopien': pracownik.stopien, 'nazwisko': pracownik.nazwisko, 'imie': pracownik.imie, 'email': pracownik.email, 'nrtel': pracownik.nrtel, 'rola': pracownik.rola}})
    else:
        pracownicy_qs = Pracownicy.objects.all()
        wynik = [{'idpr': p.idpr, 'stopien': p.stopien, 'nazwisko': p.nazwisko, 'imie': p.imie, 'email': p.email, 'nrtel': p.nrtel, 'rola': p.rola} for p in pracownicy_qs]
        return JsonResponse({'status': 'success', 'pracownicy': wynik})

@csrf_exempt
def api_get_grupy(request, grupa_id=None):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    rola = request.session.get('zalogowana_rola')
    if not rola:
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień. Musisz być zalogowany.'}, status=403)

    if grupa_id:
        grupa = Grupy.objects.select_related('idk').filter(idg=grupa_id).first()
        if not grupa:
            return JsonResponse({'status': 'error', 'message': 'Grupa nie istnieje'}, status=404)
        return JsonResponse({'status': 'success', 'grupa': {'idg': grupa.idg, 'rokstudiow': grupa.rokstudiow, 'semestr': grupa.semestr, 'rokakadem': grupa.rokakadem, 'liczbaos': grupa.liczbaos, 'opis': grupa.opis, 'kierunek': {'idk': grupa.idk.idk, 'nazwak': grupa.idk.nazwak}}})
    else:
        grupy_qs = Grupy.objects.select_related('idk').all()
        wynik = [{'idg': g.idg, 'rokstudiow': g.rokstudiow, 'semestr': g.semestr, 'rokakadem': g.rokakadem, 'liczbaos': g.liczbaos, 'opis': g.opis, 'kierunek': {'idk': g.idk.idk, 'nazwak': g.idk.nazwak}} for g in grupy_qs]
        return JsonResponse({'status': 'success', 'grupy': wynik})

@csrf_exempt
def api_get_zajecia(request, zajecia_id=None):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    rola = request.session.get('zalogowana_rola')
    if not rola:
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień. Musisz być zalogowany.'}, status=403)

    if zajecia_id:
        zajecia = Zajecia.objects.select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg', 'idg__idk').filter(idz=zajecia_id).first()
        if not zajecia:
            return JsonResponse({'status': 'error', 'message': 'Zajęcia nie istnieją'}, status=404)
        return JsonResponse({'status': 'success', 'zajecia': _serializuj_zajecia(zajecia)})
    else:
        zajecia_qs = Zajecia.objects.select_related('ids', 'ids__idb', 'idp', 'idpr', 'idg', 'idg__idk').all()
        wynik = [_serializuj_zajecia(z) for z in zajecia_qs]
        return JsonResponse({'status': 'success', 'zajecia': wynik})

@csrf_exempt
def api_get_studenci(request, student_id=None):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Metoda niedozwolona'}, status=405)

    rola = request.session.get('zalogowana_rola')
    if rola != 'planista':
        return JsonResponse({'status': 'error', 'message': 'Brak uprawnień. Tylko planista ma dostęp do listy studentów.'}, status=403)

    if student_id:
        student = Studenci.objects.filter(idst=student_id).first()
        if not student:
            return JsonResponse({'status': 'error', 'message': 'Student nie istnieje'}, status=404)
        return JsonResponse({'status': 'success', 'student': {'idst': student.idst, 'nazwisko': student.nazwisko, 'imie': student.imie, 'status': student.status, 'email': student.email}})
    else:
        studenci_qs = Studenci.objects.all()
        wynik = [{'idst': s.idst, 'nazwisko': s.nazwisko, 'imie': s.imie, 'status': s.status, 'email': s.email} for s in studenci_qs]
        return JsonResponse({'status': 'success', 'studenci': wynik})
