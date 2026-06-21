from django.urls import path
from . import views

urlpatterns = [
    # Strona główna SPA:
    path('', views.index, name='index'),
    path('logowanie/', views.index, name='logowanie'),
    path('panel-studenta/', views.index, name='panel_studenta'),
    path('panel-wykladowcy/', views.index, name='panel_wykladowcy'),
    path('panel-planisty/', views.index, name='panel_planisty'),

    # API:
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/change_password/', views.api_change_password, name='api_change_password'),
    path('api/data/export/<str:model_name>/', views.api_export_csv, name='api_export_csv'),
    path('api/data/import/<str:model_name>/', views.api_import_csv, name='api_import_csv'),
    path('api/schedule/find-audience/', views.api_find_the_audience, name='api_find_the_audience'),
    path('api/students/professors-information/', views.api_professors_information, name='api_professors_information'),
    path('api/reports/rooms-load/', views.api_raport_obciazenia_sal, name='api_raport_obciazenia_sal'),
    path('api/reports/lecturers-load/', views.api_raport_obciazenia_wykladowcow, name='api_raport_obciazenia_wykladowcow'),

    #CRUD
    path('api/CRUD/subject/', views.api_CRUD_subject, name='api_CRUD_subject'),
    path('api/CRUD/subject/<int:przedmiot_id>/', views.api_CRUD_subject, name='api_CRUD_subject_id'),
    path('api/CRUD/sala/', views.api_CRUD_sala, name='api_CRUD_sala'),
    path('api/CRUD/sala/<int:sala_id>/', views.api_CRUD_sala, name='api_CRUD_sala_id'),
    path('api/CRUD/pracownik/', views.api_CRUD_pracownik, name='api_CRUD_pracownik'),
    path('api/CRUD/pracownik/<int:pracownik_id>/', views.api_CRUD_pracownik, name='api_CRUD_pracownik_id'),
    path('api/CRUD/grupa/', views.api_CRUD_grupa, name='api_CRUD_grupa'),
    path('api/CRUD/grupa/<int:grupa_id>/', views.api_CRUD_grupa, name='api_CRUD_grupa_id'),
    path('api/CRUD/zajecia/', views.api_CRUD_zajecia, name='api_CRUD_zajecia'),
    path('api/CRUD/zajecia/<int:zajecia_id>/', views.api_CRUD_zajecia, name='api_CRUD_zajecia_id'),
    path('api/accounts/manage/', views.api_add_delete_account, name='api_add_delete_account_post'),
    path('api/accounts/manage/<str:typ_konta>/<int:konto_id>/', views.api_add_delete_account, name='api_add_delete_account_delete'),
    path('api/CRUD/budynek/', views.api_CRUD_budynki, name='api_CRUD_budynki'),
    path('api/CRUD/budynek/<int:budynek_id>/', views.api_CRUD_budynki, name='api_CRUD_budynki_id'),
    path('api/CRUD/kierunek/', views.api_CRUD_kierunki, name='api_CRUD_kierunki'),
    path('api/CRUD/kierunek/<int:kierunek_id>/', views.api_CRUD_kierunki, name='api_CRUD_kierunki_id'),

    # Gettery
    path('api/get/budynek/', views.api_get_budynki, name='api_get_budynki'),
    path('api/get/budynek/<int:budynek_id>/', views.api_get_budynki, name='api_get_budynki_id'),
    path('api/get/kierunek/', views.api_get_kierunki, name='api_get_kierunki'),
    path('api/get/kierunek/<int:kierunek_id>/', views.api_get_kierunki, name='api_get_kierunki_id'),
    path('api/get/subject/', views.api_get_przedmioty, name='api_get_przedmioty'),
    path('api/get/subject/<int:przedmiot_id>/', views.api_get_przedmioty, name='api_get_przedmiot_id'),
    path('api/get/sala/', views.api_get_sale, name='api_get_sale'),
    path('api/get/sala/<int:sala_id>/', views.api_get_sale, name='api_get_sala_id'),
    path('api/get/pracownik/', views.api_get_pracownicy, name='api_get_pracownicy'),
    path('api/get/pracownik/<int:pracownik_id>/', views.api_get_pracownicy, name='api_get_pracownik_id'),
    path('api/get/grupa/', views.api_get_grupy, name='api_get_grupy'),
    path('api/get/grupa/<int:grupa_id>/', views.api_get_grupy, name='api_get_grupa_id'),
    path('api/get/zajecia/', views.api_get_zajecia, name='api_get_zajecia'),
    path('api/get/zajecia/<int:zajecia_id>/', views.api_get_zajecia, name='api_get_zajecia_id'),
    path('api/get/student/', views.api_get_studenci, name='api_get_studenci'),
    path('api/get/student/<int:student_id>/', views.api_get_studenci, name='api_get_studenci_id'),
]
