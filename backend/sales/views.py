from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from django.db.models.functions import TruncDate
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Sale
from customers.models import Customer
from catalog.models import Product
from .serializers import (
    SaleSerializer, 
    SaleCreateSerializer, 
    SaleUpdateSerializer, 
    DashboardSaleSerializer
)

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().prefetch_related('items__product', 'customer', 'seller')

    def get_serializer_class(self):
        if self.action == 'create':
            return SaleCreateSerializer
        if self.action in ['update', 'partial_update']:
            return SaleUpdateSerializer
        return SaleSerializer

class SalesSummaryView(APIView):
    """
    Fornece um resumo das vendas concluídas dos últimos 30 dias para o dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        
        sales_data = (
            Sale.objects
            .filter(created_at__gte=thirty_days_ago, status='COMPLETED')
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(daily_total=Sum('total_amount'))
            .order_by('date')
        )
        
        formatted_data = [{'date': item['date'].strftime('%d/%m'), 'total': item['daily_total']} for item in sales_data]
        
        return Response(formatted_data)

class DashboardStatsView(APIView):
    """
    Endpoint otimizado para fornecer as estatísticas do Dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        customer_count = Customer.objects.count()
        product_count = Product.objects.count()
        sale_count = Sale.objects.count()

        recent_sales = Sale.objects.select_related('customer').order_by('-created_at')[:5]
        recent_sales_serializer = DashboardSaleSerializer(recent_sales, many=True)

        data = {
            'customer_count': customer_count,
            'product_count': product_count,
            'sale_count': sale_count,
            'recent_sales': recent_sales_serializer.data,
        }
        return Response(data)
