
from django.contrib import admin
from .models import Patient, PatientMetrics

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'dob', 'sex', 'ethnic_background',  'created_at')
    search_fields = ('first_name', 'last_name', )
    list_filter = ('sex', 'ethnic_background', 'created_at')


@admin.register(PatientMetrics)
class PatientMetricsAdmin(admin.ModelAdmin):
    list_display = ('patient', 'weight_value', 'weight_unit', 'height_value', 'height_unit', 'duration_30_m', 'concentration', 'processed_at')
    search_fields = ('patient__first_name', 'patient__last_name')
    list_filter = ('processed_at',)
