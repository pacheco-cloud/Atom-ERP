from django.db import models
from django.utils import timezone
from catalog.models import Product
from customers.models import Customer
from sellers.models import Seller
from django.db import transaction
from finance.models import AccountReceivable, AccountPayable # Importe os modelos financeiros

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

    # Dentro da classe Sale(models.Model):
    # Substitua o seu método save() existente (se houver) por este
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs) # Salva a venda primeiro

        # Se for uma nova venda, não há o que processar ainda
        if is_new:
            return

        # Dispara a lógica financeira APENAS quando o status muda para 'Concluída'
        original_status = Sale.objects.get(pk=self.pk).status
        if original_status != self.SaleStatus.COMPLETED and self.status == self.SaleStatus.COMPLETED:
            self.generate_financial_entries()

    # Adicione este novo método dentro da classe Sale(models.Model)
    @transaction.atomic
    def generate_financial_entries(self):
        # Limpa lançamentos antigos para o caso de uma revenda
        AccountReceivable.objects.filter(sale=self).delete()
        AccountPayable.objects.filter(sale=self).delete()

        # 1. Cria as Contas a Receber a partir das parcelas
        for installment in self.installments.all():
            AccountReceivable.objects.create(
                sale=self,
                customer=self.customer,
                description=f"Parcela {installment.installment_number} da OS #{self.id}",
                amount=installment.amount,
                due_date=installment.due_date,
            )

        # 2. Cria a Conta a Pagar da Comissão
        total_commission = sum(
            (item.quantity * item.unit_price) * (self.seller.commission_rate / 100)
            for item in self.items.filter(pays_commission=True)
        )
        if total_commission > 0:
            AccountPayable.objects.create(
                sale=self,
                seller=self.seller,
                category=AccountPayable.PayableCategory.COMMISSION,
                description=f"Comissão para {self.seller.user.get_full_name()} da OS #{self.id}",
                amount=total_commission,
                due_date=self.exit_date, # Pode ser ajustado conforme a regra de negócio
            )

        # 3. Cria a Conta a Pagar do Imposto
        if self.tax_amount > 0:
            AccountPayable.objects.create(
                sale=self,
                category=AccountPayable.PayableCategory.TAX,
                description=f"Imposto (SN) referente à OS #{self.id}",
                amount=self.tax_amount,
                due_date=self.exit_date, # Pode ser ajustado
            )


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
