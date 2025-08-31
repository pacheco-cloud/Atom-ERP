from django.contrib import admin
from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    """
    Permite adicionar e editar os itens da venda diretamente na página da Venda.
    """
    model = SaleItem
    extra = 1  # Mostra 1 linha extra para adicionar um novo item.
    autocomplete_fields = ['product']  # Adiciona um campo de busca para produtos.


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('id', 'customer__name')
    inlines = [SaleItemInline]
    autocomplete_fields = ['customer']  # Adiciona um campo de busca para clientes.
    readonly_fields = ('total_amount',) # O total será calculado automaticamente no futuro.
