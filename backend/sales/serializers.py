from rest_framework import serializers
from .models import Sale, SaleItem, Installment # 1. Importe o Installment
from customers.serializers import CustomerSerializer
from catalog.serializers import ProductSerializer
from sellers.serializers import SellerSerializer
from configuration.models import CompanySettings

class SaleItemDetailSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'pays_commission']

class SaleItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = ['product', 'quantity', 'unit_price', 'pays_commission']

# 2. Crie um serializer para as parcelas
class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = ['installment_number', 'amount', 'due_date']

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemDetailSerializer(many=True, read_only=True)
    installments = InstallmentSerializer(many=True, read_only=True) # 3. Mostre as parcelas
    customer = CustomerSerializer(read_only=True)
    seller = SellerSerializer(read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'customer', 'seller', 'status', 'total_amount', 
            'tax_rate', 'tax_amount', 'created_at', 'items', 'installments',
            'entry_date', 'exit_date', 'payment_condition', 'category' # 4. Adicione os novos campos
        ]

class BaseSaleModifySerializer(serializers.ModelSerializer):
    items = SaleItemCreateSerializer(many=True)
    installments = InstallmentSerializer(many=True) # 5. Receba as parcelas do frontend
    customer_id = serializers.IntegerField()
    seller_id = serializers.IntegerField()
    apply_tax = serializers.BooleanField(write_only=True, default=True)

    class Meta:
        model = Sale
        fields = [
            'customer_id', 'seller_id', 'status', 'items', 'apply_tax', 'installments',
            'entry_date', 'exit_date', 'payment_condition', 'category' # 6. Adicione os novos campos
        ]

    def _process_sale(self, instance, validated_data):
        items_data = validated_data.pop('items')
        installments_data = validated_data.pop('installments') # 7. Obtenha os dados das parcelas
        apply_tax = validated_data.pop('apply_tax')

        # Atribui os dados restantes à instância da venda
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        total_amount = sum(item['quantity'] * item['unit_price'] for item in items_data)
        instance.total_amount = total_amount

        if apply_tax:
            settings = CompanySettings.load()
            instance.tax_rate = settings.tax_rate
            instance.tax_amount = total_amount * (settings.tax_rate / 100)
        else:
            instance.tax_rate = 0
            instance.tax_amount = 0

        instance.save() # Salva a venda para ter um ID

        # Apaga itens e parcelas antigas (importante para edições)
        instance.items.all().delete()
        instance.installments.all().delete()

        # Cria os novos itens e parcelas
        SaleItem.objects.bulk_create([SaleItem(sale=instance, **item) for item in items_data])
        Installment.objects.bulk_create([Installment(sale=instance, **inst) for inst in installments_data])

        return instance

class SaleCreateSerializer(BaseSaleModifySerializer):
    def create(self, validated_data):
        # Cria uma instância de Venda e passa para o processador
        return self._process_sale(Sale(), validated_data)

class SaleUpdateSerializer(BaseSaleModifySerializer):
    def update(self, instance, validated_data):
        # Passa a instância existente para o processador
        return self._process_sale(instance, validated_data)

class SaleStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = ['status']


class DashboardSaleSerializer(serializers.ModelSerializer):
    """
    Um serializer simplificado para mostrar vendas recentes no dashboard.
    """
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'customer_name', 'total_amount', 'created_at', 'status']
