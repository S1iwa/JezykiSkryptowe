from .helping_functions import *

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
