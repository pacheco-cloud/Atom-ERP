"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Agrupa todas as rotas da API sob o prefixo /api/v1/
    path('api/v1/', include([
        # Rotas de autenticação JWT
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

        # Inclui as rotas dos nossos apps
        path('catalog/', include('catalog.urls')),
        path('customers/', include('customers.urls')),
        path('sales/', include('sales.urls')),
        path('sellers/', include('sellers.urls')),
        path('configuration/', include('configuration.urls')),
        path('finance/', include('finance.urls')), # ADICIONE ESTA LINHA
    ])),
]