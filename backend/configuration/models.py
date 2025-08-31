from django.db import models

class CompanySettings(models.Model):
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=6.00,
        verbose_name="Alíquota Padrão de Imposto (%)"
    )

    def save(self, *args, **kwargs):
        # Garante que haverá apenas uma instância deste modelo
        self.pk = 1
        super(CompanySettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        # Obtém o objeto de configurações, ou cria um se não existir
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Configurações da Empresa"

    class Meta:
        verbose_name_plural = "Configurações da Empresa"