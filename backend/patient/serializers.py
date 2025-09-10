
from rest_framework import serializers
from .models import Patient
from django.utils.dateparse import parse_date

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'dob', 'sex', 'ethnic_background']


class AddPatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['first_name', 'last_name', 'dob', 'sex', 'ethnic_background']

    def validate_dob(self, value):
        # ensure dob is a date object (if sent as string)
        if isinstance(value, str):
            value = parse_date(value)
        return value
