from django.db import models

class FinancialAccount(models.Model):
    """ Modelo base abstrato para contas a pagar e receber. """
    class StatusChoices(models.TextChoices):
        PENDING = 'PENDING', 'Pendente'
        PAID = 'PAID', 'Pago'
        CANCELED = 'CANCELED', 'Cancelado'

    description = models.CharField(max_length=255, verbose_name="Descrição")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor")
    due_date = models.DateField(verbose_name="Data de Vencimento")
    payment_date = models.DateField(blank=True, null=True, verbose_name="Data de Pagamento")
    status = models.CharField(max_length=10, choices=StatusChoices.choices, default=StatusChoices.PENDING, verbose_name="Status")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Liga a conta à venda original, se aplicável
    sale = models.ForeignKey('sales.Sale', on_delete=models.SET_NULL, null=True, blank=True, related_name='%(class)s_related')

    class Meta:
        abstract = True # Torna este modelo uma base, não uma tabela real

class AccountReceivable(FinancialAccount):
    customer = models.ForeignKey('customers.Customer', on_delete=models.PROTECT, verbose_name="Cliente")

    def __str__(self):
        return f"Recebível de {self.customer.name} - Venc: {self.due_date}"

    class Meta:
        verbose_name = "Conta a Receber"
        verbose_name_plural = "Contas a Receber"
        ordering = ['due_date']

class AccountPayable(FinancialAccount):
    class PayableCategory(models.TextChoices):
        COMMISSION = 'COMMISSION', 'Comissão'
        TAX = 'TAX', 'Imposto'
        OTHER = 'OTHER', 'Outros'

    category = models.CharField(max_length=20, choices=PayableCategory.choices, default=PayableCategory.OTHER, verbose_name="Categoria")
    # Podemos querer saber a quem pagar (ex: vendedor)
    seller = models.ForeignKey('sellers.Seller', on_delete=models.PROTECT, null=True, blank=True, verbose_name="Vendedor (Comissão)")


    def __str__(self):
        return f"Pagável: {self.description} - Venc: {self.due_date}"

    class Meta:
        verbose_name = "Conta a Pagar"
        verbose_name_plural = "Contas a Pagar"
        ordering = ['due_date']