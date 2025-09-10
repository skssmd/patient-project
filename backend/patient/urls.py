from django.urls import path
from .views import PatientView,BulkAddPatientView,PatientDetailView

urlpatterns = [
    path('patients/', PatientView.as_view(), name='patients'),
    path('patients/bulk', BulkAddPatientView.as_view(), name='patientsBulk'),
    path('patients/<int:pk>/', PatientDetailView.as_view(), name='patient-detail'),
]
