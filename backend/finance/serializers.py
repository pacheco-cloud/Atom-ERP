from rest_framework import serializers
from .models import AccountPayable, AccountReceivable

class AccountReceivableSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    sale_id = serializers.IntegerField(source='sale.id', read_only=True)

    class Meta:
        model = AccountReceivable
        fields = ['id', 'description', 'amount', 'due_date', 'status', 'payment_date', 'customer_name', 'sale_id']

class AccountPayableSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.user.get_full_name', read_only=True, default=None)
    sale_id = serializers.IntegerField(source='sale.id', read_only=True)

    class Meta:
        model = AccountPayable
        fields = ['id', 'description', 'category', 'amount', 'due_date', 'status', 'payment_date', 'seller_name', 'sale_id']