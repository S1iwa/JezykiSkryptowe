import json

from django.db.models import Case, When, IntegerField
from django.shortcuts import render
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from schedule_app.models import *
import pandas as pd
import numpy as np
from django.apps import apps
from django.http import HttpResponse


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
        .annotate(
            kolejnosc_dni=Case(
                When(dzien='Poniedziałek', then=1),
                When(dzien='Wtorek', then=2),
                When(dzien='Środa', then=3),
                When(dzien='Czwartek', then=4),
                When(dzien='Piątek', then=5),
                When(dzien='Sobota', then=6),
                When(dzien='Niedziela', then=7),
                default=8,
                output_field=IntegerField(),
            )
        )

        .order_by('kolejnosc_dni', 'godzrozp')
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
        .annotate(
            kolejnosc_dni=Case(
                When(dzien='Poniedziałek', then=1),
                When(dzien='Wtorek', then=2),
                When(dzien='Środa', then=3),
                When(dzien='Czwartek', then=4),
                When(dzien='Piątek', then=5),
                When(dzien='Sobota', then=6),
                When(dzien='Niedziela', then=7),
                default=8,
                output_field=IntegerField(),
            )
        )

        .order_by('kolejnosc_dni', 'godzrozp')
    )

    return [_serializuj_zajecia(z) for z in zajecia_qs]

# Raporty Obciążeń
def _oblicz_czas_w_minutach(t_start, t_end):
    """Zwraca różnicę w minutach między dwoma obiektami datetime.time."""
    if not t_start or not t_end:
        return 0
    minuty_start = t_start.hour * 60 + t_start.minute
    minuty_end = t_end.hour * 60 + t_end.minute
    return max(0, minuty_end - minuty_start)
