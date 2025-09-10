from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Patient
from .serializers import PatientSerializer

class PatientListView(APIView):
    """
    Return patients from DB with manual pagination
    """
    def get(self, request):
        try:
            page = int(request.query_params.get('page', 1))
        except ValueError:
            page = 1

        page_size = 10  # items per page
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
