
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



# serializers.py
from rest_framework import serializers
from .models import PatientMetrics

from rest_framework import serializers
from .models import PatientMetrics

class PatientMetricsPostSerializer(serializers.ModelSerializer):
    """
    Accept nested weight/height structure and map to model fields
    """
    weight = serializers.DictField(write_only=True)
    height = serializers.DictField(write_only=True)

    class Meta:
        model = PatientMetrics
        fields = ['weight', 'height']

    def validate(self, data):
        # optional: validate value/unit types
        for key in ['weight', 'height']:
            if 'value' not in data[key] or 'unit' not in data[key]:
                raise serializers.ValidationError(f"{key} must include value and unit")
        return data

    def create(self, validated_data):
        weight = validated_data.pop('weight')
        height = validated_data.pop('height')
        return PatientMetrics.objects.create(
            weight_value=weight['value'],
            weight_unit=weight['unit'],
            height_value=height['value'],
            height_unit=height['unit'],
            **validated_data
        )

    def update(self, instance, validated_data):
        weight = validated_data.pop('weight', {})
        height = validated_data.pop('height', {})
        if weight:
            instance.weight_value = weight.get('value', instance.weight_value)
            instance.weight_unit = weight.get('unit', instance.weight_unit)
        if height:
            instance.height_value = height.get('value', instance.height_value)
            instance.height_unit = height.get('unit', instance.height_unit)
        instance.save()
        return instance

