from rest_framework import viewsets, filters
from .models import AccountPayable, AccountReceivable
from .serializers import AccountPayableSerializer, AccountReceivableSerializer

class AccountReceivableViewSet(viewsets.ModelViewSet):
    """
    API endpoint para Contas a Receber.
    """
    queryset = AccountReceivable.objects.select_related('customer', 'sale').all()
    serializer_class = AccountReceivableSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'customer__name', 'sale__id']
    ordering_fields = ['due_date', 'status', 'amount', 'customer__name']


class AccountPayableViewSet(viewsets.ModelViewSet):
    """
    API endpoint para Contas a Pagar.
    """
    queryset = AccountPayable.objects.select_related('seller__user', 'sale').all()
    serializer_class = AccountPayableSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'category', 'seller__user__first_name', 'seller__user__last_name']
    ordering_fields = ['due_date', 'status', 'amount', 'category']