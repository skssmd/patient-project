
from django.utils.dateparse import parse_date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests

from .models import Patient, PatientMetrics
from .serializers import PatientSerializer, AddPatientSerializer, PatientMetricsPostSerializer

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
            "series": {
                "success": True,
                "result": {
                    "page": page,
                    "total_pages": total_pages,
                    "total_count": total_count,
                    "patients": serializer.data
                }
            }
        })

    def post(self, request):
        serializer = AddPatientSerializer(data=request.data)
        if serializer.is_valid():
            patient = serializer.save()
            return Response({
                "series": {
                    "success": True,
                    "result": {
                        "patient": {
                            "id": patient.id,
                            "first_name": patient.first_name,
                            "last_name": patient.last_name,
                            "dob": patient.dob,
                            "sex": patient.sex,
                            "ethnic_background": patient.ethnic_background
                        }
                    }
                }
            }, status=status.HTTP_201_CREATED)

        return Response({
            "series": {
                "success": False,
                "result": {
                    "errors": serializer.errors
                }
            }
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
    Return, delete a single patient by ID
    """

    def get(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({
                "series": {
                    "success": False,
                    "result": {"patient": None}
                }
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = PatientSerializer(patient)
        return Response({
            "series": {
                "success": True,
                "result": {"patient": serializer.data}
            }
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response({
                "series": {
                    "success": False,
                    "result": {"patient": None}
                }
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = PatientSerializer(patient)
        patient.delete()
        return Response({
            "series": {
                "success": True,
                "result": {"patient": serializer.data}
            }
        }, status=status.HTTP_200_OK)





class ProcessPatientView(APIView):
    """
    Accept weight/height from user, call external process API if needed,
    store results, and return full response.
    """

    def post(self, request, pk):
        # Fetch patient
        try:
            patient = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response(
                {"success": False, "error": "Patient not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate input (weight + height)
        serializer = PatientMetricsPostSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extract nested values
        weight_value = serializer.validated_data['weight']['value']
        weight_unit = serializer.validated_data['weight']['unit']
        height_value = serializer.validated_data['height']['value']
        height_unit = serializer.validated_data['height']['unit']

        # Check if metrics with same weight/height already exist
        metrics = PatientMetrics.objects.filter(
            patient=patient,
            weight_value=weight_value,
            weight_unit=weight_unit,
            height_value=height_value,
            height_unit=height_unit
        ).first()

        if metrics:
            # Structure results for response
            results = [
                {"duration_30_m": r[0], "concentration": r[1]} for r in (metrics.results or [])
            ]
            return Response({
                "success": True,
                "patient": {
                    "weight": {"value": metrics.weight_value, "unit": metrics.weight_unit},
                    "height": {"value": metrics.height_value, "unit": metrics.height_unit}
                },
                "results": results
            }, status=status.HTTP_200_OK)

        # Call external API
        payload = {
            "weight": {"value": weight_value, "unit": weight_unit},
            "height": {"value": height_value, "unit": height_unit}
        }
        external_url = f"https://coding-patient-api.vesynta.workers.dev/api/patients/{pk}/process"
        resp = requests.post(external_url, json=payload, verify=False)

        if resp.status_code != 200:
            return Response({"success": False, "error": resp.text}, status=resp.status_code)

        data = resp.json()

        # Save raw results in DB
        metrics = PatientMetrics.objects.create(
            patient=patient,
            weight_value=data["patient"]["weight"]["value"],
            weight_unit=data["patient"]["weight"]["unit"],
            height_value=data["patient"]["height"]["value"],
            height_unit=data["patient"]["height"]["unit"],
            results=data.get("results", [])  # store raw
        )

        # Structure results for response
        structured_results = [
            {"duration_30_m": r[0], "concentration": r[1]} for r in (metrics.results or [])
        ]

        return Response({
            "success": True,
            "patient": {
                "weight": {"value": metrics.weight_value, "unit": metrics.weight_unit},
                "height": {"value": metrics.height_value, "unit": metrics.height_unit}
            },
            "results": structured_results
        }, status=status.HTTP_200_OK)
