from django.urls import path
from . import views

urlpatterns = [
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/change_password/', views.api_change_password, name='api_change_password'),
    path('api/data/export/<str:model_name>/', views.api_export_csv, name='api_export_csv'),
    path('api/data/import/<str:model_name>/', views.api_import_csv, name='api_import_csv'),
    path('api/schedule/find-audience/', views.api_find_the_audience, name='api_find_the_audience'),
    path('api/students/professors-information/', views.api_professors_information, name='api_professors_information'),
]