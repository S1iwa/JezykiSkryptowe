from .raport_functions import *
from .auth_password import *
from .CRUD import *
from .filter_functions import *
from .csv_import_export import *


# Funkcja łącząca Django z index.html
def index(request):
    return render(request, 'schedule_app/index.html')