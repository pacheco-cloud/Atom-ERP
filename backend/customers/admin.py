from django.contrib import admin
from .models import Customer

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'fantasy_name', 'cpf_cnpj', 'city', 'state', 'status', 'person_type')
    search_fields = ('name', 'fantasy_name', 'cpf_cnpj', 'email', 'city')
    list_filter = ('status', 'person_type', 'tax_regime', 'state')
