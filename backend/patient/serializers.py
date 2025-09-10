
from rest_framework import serializers

class PatientSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    dob = serializers.DateField()
    sex = serializers.CharField()
    ethnic_background = serializers.CharField()
