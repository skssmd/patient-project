# patient/models.py
from django.db import models

class Patient(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField()
    sex_choices = [('male','Male'),('female','Female'),('other','Other')]
    sex = models.CharField(max_length=10, choices=sex_choices)
    ethnic_background = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class PatientMetrics(models.Model):
    patient = models.ForeignKey('Patient', on_delete=models.CASCADE, related_name='metrics')
    weight_value = models.FloatField(blank=True, null=True)
    weight_unit = models.CharField(max_length=10, default='kg')
    height_value = models.FloatField(blank=True, null=True)
    height_unit = models.CharField(max_length=10, default='m')
    results = models.JSONField(blank=True, null=True)  # store the array from API as-is
    processed_at = models.DateTimeField(auto_now_add=True)
