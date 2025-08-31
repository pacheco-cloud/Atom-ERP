from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountPayableViewSet, AccountReceivableViewSet

router = DefaultRouter()
router.register(r'receivables', AccountReceivableViewSet, basename='account-receivable')
router.register(r'payables', AccountPayableViewSet, basename='account-payable')

urlpatterns = [
    path('', include(router.urls)),
]