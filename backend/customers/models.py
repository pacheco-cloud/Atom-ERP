from django.db import models
from django.conf import settings

class Customer(models.Model):
    # --- Choices (Opções pré-definidas) ---
    PERSON_TYPE_CHOICES = [('F', 'Pessoa Física'), ('J', 'Pessoa Jurídica')]
    STATUS_CHOICES = [('A', 'Ativo'), ('I', 'Inativo'), ('B', 'Bloqueado')]
    TAX_REGIME_CHOICES = [
        ('simples', 'Simples Nacional'),
        ('presumido', 'Lucro Presumido'),
        ('real', 'Lucro Real'),
    ]

    # --- Identificação Principal ---
    code = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name="Código")
    name = models.CharField(max_length=255, verbose_name="Nome / Razão Social")
    fantasy_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nome Fantasia")
    person_type = models.CharField(max_length=1, choices=PERSON_TYPE_CHOICES, verbose_name="Tipo de Pessoa")
    cpf_cnpj = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name="CPF / CNPJ")
    ie_rg = models.CharField(max_length=20, blank=True, null=True, verbose_name="IE / RG")
    is_ie_exempt = models.BooleanField(default=False, verbose_name="IE Isento")
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='A', verbose_name="Situação")
    tax_regime = models.CharField(max_length=20, choices=TAX_REGIME_CHOICES, blank=True, null=True, verbose_name="Regime Tributário")
    segment = models.CharField(max_length=100, blank=True, null=True, verbose_name="Segmento")
    contact_type = models.CharField(max_length=50, blank=True, null=True, verbose_name="Tipo de Contato")
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Vendedor")

    # --- Contato ---
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Fone")
    fax = models.CharField(max_length=20, blank=True, null=True, verbose_name="Fax")
    cell_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Celular")
    email = models.EmailField(max_length=255, unique=True, blank=True, null=True, verbose_name="E-mail")
    nfe_email = models.EmailField(max_length=255, blank=True, null=True, verbose_name="E-mail para NFe")
    website = models.URLField(max_length=255, blank=True, null=True, verbose_name="Web Site")

    # --- Endereço ---
    street = models.CharField(max_length=255, blank=True, null=True, verbose_name="Endereço")
    number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Número")
    complement = models.CharField(max_length=100, blank=True, null=True, verbose_name="Complemento")
    district = models.CharField(max_length=100, blank=True, null=True, verbose_name="Bairro")
    city = models.CharField(max_length=100, blank=True, null=True, verbose_name="Cidade")
    state = models.CharField(max_length=2, blank=True, null=True, verbose_name="UF")
    zip_code = models.CharField(max_length=10, blank=True, null=True, verbose_name="CEP")

    # --- Dados Pessoa Física ---
    marital_status = models.CharField(max_length=20, blank=True, null=True, verbose_name="Estado Civil")
    profession = models.CharField(max_length=100, blank=True, null=True, verbose_name="Profissão")
    gender = models.CharField(max_length=10, blank=True, null=True, verbose_name="Sexo")
    birth_date = models.DateField(blank=True, null=True, verbose_name="Data de Nascimento")
    place_of_birth = models.CharField(max_length=100, blank=True, null=True, verbose_name="Naturalidade")
    father_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nome do Pai")
    father_cpf = models.CharField(max_length=14, blank=True, null=True, verbose_name="CPF do Pai")
    mother_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nome da Mãe")
    mother_cpf = models.CharField(max_length=14, blank=True, null=True, verbose_name="CPF da Mãe")

    # --- Informações Adicionais ---
    observations = models.TextField(blank=True, null=True, verbose_name="Observações")
    contacts = models.TextField(blank=True, null=True, verbose_name="Contatos")
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="Limite de Crédito")
    customer_since = models.DateField(blank=True, null=True, verbose_name="Cliente Desde")
    next_visit = models.DateField(blank=True, null=True, verbose_name="Próxima Visita")
    payment_condition = models.CharField(max_length=100, blank=True, null=True, verbose_name="Condição de Pagamento")

    # --- Timestamps ---
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['name']