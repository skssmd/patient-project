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
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='metrics')
    
    weight_value = models.FloatField(default=0)
    weight_unit = models.CharField(max_length=10, default='kg')
    
    height_value = models.FloatField(default=0)
    height_unit = models.CharField(max_length=10, default='m')
    
    duration_30_m = models.CharField(max_length=20, blank=True, null=True)
    concentration = models.CharField(max_length=20, blank=True, null=True)
    
    processed_at = models.DateTimeField(auto_now_add=True)  
