from rest_framework import viewsets
from .models import Seller
from .serializers import SellerSerializer, SellerCreateUpdateSerializer

class SellerViewSet(viewsets.ModelViewSet):
    queryset = Seller.objects.all().select_related('user')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SellerCreateUpdateSerializer
        return SellerSerializer