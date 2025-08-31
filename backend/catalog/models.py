from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255, verbose_name="Nome")
    sku = models.CharField(max_length=100, unique=True, help_text="Stock Keeping Unit", verbose_name="SKU")
    description = models.TextField(blank=True, null=True, verbose_name="Descrição")
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Preço de Custo")
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço de Venda")
    stock_quantity = models.IntegerField(default=0, verbose_name="Quantidade em Estoque")
    pays_commission = models.BooleanField(default=True, verbose_name="Paga Comissão") # ADICIONE ESTA LINHA
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"
        ordering = ['name']