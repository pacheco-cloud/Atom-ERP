from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'sku', 
            'description', 
            'sale_price', 
            'cost_price', 
            'stock_quantity', 
            'pays_commission',
            'created_at', 
            'updated_at'
        ]
