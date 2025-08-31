from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SaleViewSet, SalesSummaryView, DashboardStatsView

router = DefaultRouter()
# Registra as rotas padrão (listar, criar, etc.) na raiz, pois o prefixo 'sales/' 
# é adicionado em core/urls.py
router.register(r'', SaleViewSet, basename='sale')

# As URLs da API são determinadas automaticamente pelo roteador.
# Rotas personalizadas são adicionadas separadamente.
urlpatterns = [
    path('summary/', SalesSummaryView.as_view(), name='sales-summary'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    # O include(router.urls) deve vir por último para não sobrepor as rotas personalizadas.
    path('', include(router.urls)),
]
