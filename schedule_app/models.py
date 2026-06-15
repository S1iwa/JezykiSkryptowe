# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Budynki(models.Model):
    idb = models.AutoField(primary_key=True)
    nazwab = models.CharField(max_length=100)
    adresb = models.CharField(max_length=200)

    class Meta:
        managed = False
        db_table = 'budynki'


class Grupy(models.Model):
    idg = models.AutoField(primary_key=True)
    idk = models.ForeignKey('Kierunki', models.DO_NOTHING, db_column='idk')
    rokstudiow = models.SmallIntegerField()
    semestr = models.SmallIntegerField()
    rokakadem = models.CharField(max_length=9)
    liczbaos = models.SmallIntegerField()
    opis = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'grupy'


class Kierunki(models.Model):
    idk = models.AutoField(primary_key=True)
    idw = models.ForeignKey('Wydzialy', models.DO_NOTHING, db_column='idw')
    nazwak = models.CharField(max_length=100)
    rokstartu = models.SmallIntegerField()

    class Meta:
        managed = False
        db_table = 'kierunki'
        unique_together = (('idw', 'nazwak'),)


class Pracownicy(models.Model):
    idpr = models.AutoField(primary_key=True)
    stopien = models.CharField(max_length=50, blank=True, null=True)
    nazwisko = models.CharField(max_length=80)
    imie = models.CharField(max_length=80)
    email = models.CharField(unique=True, max_length=150)
    nrtel = models.CharField(max_length=20, blank=True, null=True)
    haslo = models.CharField(max_length=255)
    rola = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'pracownicy'


class Przedmioty(models.Model):
    idp = models.AutoField(primary_key=True)
    nazwap = models.CharField(max_length=150)
    formap = models.CharField(max_length=50)
    lbgodz = models.SmallIntegerField()

    class Meta:
        managed = False
        db_table = 'przedmioty'


class Przypisy(models.Model):
    idprzypisu = models.AutoField(primary_key=True)
    idst = models.ForeignKey('Studenci', models.DO_NOTHING, db_column='idst')
    idg = models.ForeignKey(Grupy, models.DO_NOTHING, db_column='idg')
    opis = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'przypisy'
        unique_together = (('idst', 'idg'),)


class Sale(models.Model):
    ids = models.AutoField(primary_key=True)
    numers = models.CharField(max_length=20)
    typs = models.CharField(max_length=50)
    pojemnosc = models.SmallIntegerField()
    idb = models.ForeignKey(Budynki, models.DO_NOTHING, db_column='idb')

    class Meta:
        managed = False
        db_table = 'sale'
        unique_together = (('numers', 'idb'),)


class Studenci(models.Model):
    idst = models.AutoField(primary_key=True)
    nazwisko = models.CharField(max_length=80)
    imie = models.CharField(max_length=80)
    status = models.CharField(max_length=30)
    email = models.CharField(unique=True, max_length=150)
    haslo = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = 'studenci'


class Wydzialy(models.Model):
    idw = models.AutoField(primary_key=True)
    nazwaw = models.CharField(unique=True, max_length=100)

    class Meta:
        managed = False
        db_table = 'wydzialy'


class Zajecia(models.Model):
    idz = models.AutoField(primary_key=True)
    dzien = models.CharField(max_length=12)
    godzrozp = models.TimeField()
    godzzak = models.TimeField()
    uwagi = models.TextField(blank=True, null=True)
    ids = models.ForeignKey(Sale, models.DO_NOTHING, db_column='ids')
    idp = models.ForeignKey(Przedmioty, models.DO_NOTHING, db_column='idp')
    idpr = models.ForeignKey(Pracownicy, models.DO_NOTHING, db_column='idpr')
    idg = models.ForeignKey(Grupy, models.DO_NOTHING, db_column='idg')

    class Meta:
        managed = False
        db_table = 'zajecia'
