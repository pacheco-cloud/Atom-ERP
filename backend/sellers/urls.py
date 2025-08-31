from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SellerViewSet

router = DefaultRouter()
router.register(r'', SellerViewSet, basename='seller')

urlpatterns = [
    path('', include(router.urls)),
]
