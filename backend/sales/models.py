from django.db import models
from django.utils import timezone
from catalog.models import Product
from customers.models import Customer
from sellers.models import Seller

class Sale(models.Model):
    class SaleStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pendente'
        COMPLETED = 'COMPLETED', 'Concluída'
        CANCELED = 'CANCELED', 'Cancelada'

    class SaleCategory(models.TextChoices):
        SERVICE = 'SERVICE', 'Serviços'
        # Futuramente, pode adicionar outras categorias aqui
        # PRODUCT = 'PRODUCT', 'Produtos'

    # --- Dados Principais ---
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, verbose_name="Cliente")
    seller = models.ForeignKey(Seller, on_delete=models.PROTECT, verbose_name="Vendedor", null=True)
    status = models.CharField(max_length=10, choices=SaleStatus.choices, default=SaleStatus.PENDING, verbose_name="Status")
    category = models.CharField(max_length=20, choices=SaleCategory.choices, default=SaleCategory.SERVICE, verbose_name="Categoria")

    # --- Datas ---
    entry_date = models.DateField(default=timezone.now, verbose_name="Data de Entrada")
    exit_date = models.DateField(blank=True, null=True, verbose_name="Data de Saída")

    # --- Financeiro ---
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Valor Total")
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name="Alíquota de Imposto (%)")
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Valor do Imposto")
    payment_condition = models.CharField(max_length=100, blank=True, null=True, verbose_name="Condição de Pagamento")

    # --- Timestamps ---
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data da Venda")

    def __str__(self):
        return f"Venda #{self.id} - {self.customer.name}"

    class Meta:
        verbose_name = "Venda"
        verbose_name_plural = "Vendas"
        ordering = ['-created_at']


class SaleItem(models.Model):
    # ... (Este modelo não precisa de alterações)
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE, verbose_name="Venda")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, verbose_name="Produto")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Quantidade")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço Unitário")
    pays_commission = models.BooleanField(default=False, verbose_name="Paga Comissão na Venda")


# NOVO MODELO PARA AS PARCELAS
class Installment(models.Model):
    sale = models.ForeignKey(Sale, related_name='installments', on_delete=models.CASCADE, verbose_name="Venda")
    installment_number = models.PositiveIntegerField(verbose_name="Número da Parcela")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor")
    due_date = models.DateField(verbose_name="Data de Vencimento")

    def __str__(self):
        return f"Parcela {self.installment_number} da Venda #{self.sale.id}"

    class Meta:
        verbose_name = "Parcela"
        verbose_name_plural = "Parcelas"
        ordering = ['due_date']
