# patient/views.py
from django.utils.dateparse import parse_date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Patient
from .serializers import PatientSerializer, AddPatientSerializer


class PatientView(APIView):
    """
    GET: Return patients from DB with manual pagination
    POST: Add a new patient
    """

    def get(self, request):
        try:
            page = int(request.query_params.get('page', 1))
        except ValueError:
            page = 1

        page_size = 10
        start = (page - 1) * page_size
        end = start + page_size

        patients = Patient.objects.all().order_by('id')[start:end]
        serializer = PatientSerializer(patients, many=True)

        total_count = Patient.objects.count()
        total_pages = (total_count + page_size - 1) // page_size

        return Response({
            "success": True,
            "page": page,
            "total_pages": total_pages,
            "total_count": total_count,
            "patients": serializer.data
        })

    def post(self, request):
        serializer = AddPatientSerializer(data=request.data)
        if serializer.is_valid():
            patient = serializer.save()
            return Response({
                "success": True,
                "patient": {
                    "id": patient.id,
                    "first_name": patient.first_name,
                    "last_name": patient.last_name,
                    "dob": patient.dob,
                    "sex": patient.sex,
                    "ethnic_background": patient.ethnic_background
                }
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)



class BulkAddPatientView(APIView):
    """
    Add multiple patients to the database in a single request
    """

    def post(self, request):
        if not isinstance(request.data, list):
            return Response({
                "success": False,
                "error": "Expected a list of patient objects"
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = AddPatientSerializer(data=request.data, many=True)
        if serializer.is_valid():
            patients = serializer.save()
            response_data = [
                {
                    "id": patient.id,
                    "first_name": patient.first_name,
                    "last_name": patient.last_name,
                    "dob": patient.dob,
                    "sex": patient.sex,
                    "ethnic_background": patient.ethnic_background
                }
                for patient in patients
            ]
            return Response({
                "success": True,
                "patients": response_data
            }, status=status.HTTP_201_CREATED)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)



class PatientDetailView(APIView):
    """
    Return a single patient by ID
    """

    def get(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({
                "success": False,
                "error": "Patient not found"
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = PatientSerializer(patient)
        return Response({
            "success": True,
            "patient": serializer.data
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({
                "result": {"patient": None},
                "success": False
            }, status=status.HTTP_404_NOT_FOUND)
        serializer = PatientSerializer(patient)
        patient.delete()
        return Response({
            "result": {
                "patient": serializer.data
            },
            "success": True
        }, status=status.HTTP_200_OK)