from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated # Importar
from .models import CompanySettings
from .serializers import CompanySettingsSerializer

class CompanySettingsView(APIView):
    """
    Endpoint para obter e atualizar as configurações da empresa.
    Sempre atua sobre a única instância de CompanySettings.
    """
    permission_classes = [IsAuthenticated] # Adicionar permissão

    def get(self, request):
        settings = CompanySettings.load()
        serializer = CompanySettingsSerializer(settings)
        return Response(serializer.data)

    def patch(self, request):
        settings = CompanySettings.load()
        serializer = CompanySettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)