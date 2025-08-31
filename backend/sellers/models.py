from django.db import models
from django.conf import settings

class Seller(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name="Usuário do Sistema"
    )
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone")
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name="Percentual de Comissão (%)"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    def __str__(self):
        # Mostra o nome completo do usuário, se disponível, senão o username.
        return self.user.get_full_name() or self.user.username

    class Meta:
        verbose_name = "Vendedor"
        verbose_name_plural = "Vendedores"
        ordering = ['user__first_name', 'user__username']