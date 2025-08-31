from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet

# Cria um roteador e registra nosso viewset com ele.
router = DefaultRouter()
router.register(r'', ProductViewSet, basename='product')

# As URLs da API são determinadas automaticamente pelo roteador.
urlpatterns = [
    path('', include(router.urls)),
]