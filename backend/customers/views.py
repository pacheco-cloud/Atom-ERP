from rest_framework import viewsets, filters
from .models import Customer
from .serializers import CustomerSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite que os clientes sejam visualizados ou editados.
    """
    queryset = Customer.objects.all().order_by('name')
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'fantasy_name', 'cpf_cnpj', 'email', 'code', 'city', 'phone']