from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet

# Cria um roteador e registra nosso viewset com ele.
router = DefaultRouter()
router.register(r'', CustomerViewSet, basename='customer')

# As URLs da API são determinadas automaticamente pelo roteador.
urlpatterns = [
    path('', include(router.urls)),
]