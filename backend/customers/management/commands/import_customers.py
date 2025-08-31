import csv
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from customers.models import Customer

class Command(BaseCommand):
    help = 'Importa clientes de um arquivo CSV para a nova estrutura do banco de dados.'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='O caminho para o arquivo CSV a ser importado.')

    @transaction.atomic
    def handle(self, *args, **kwargs):
        csv_file_path = kwargs['csv_file']
        self.stdout.write(self.style.SUCCESS(f'Iniciando a importação do arquivo: {csv_file_path}'))

        try:
            # Limpa a tabela para garantir uma importação limpa
            Customer.objects.all().delete()
            self.stdout.write(self.style.WARNING('Tabela de clientes existente foi limpa.'))

            with open(csv_file_path, mode='r', encoding='utf-8') as file:
                # Usamos DictReader para ler o CSV como um dicionário por linha
                reader = csv.DictReader(file, delimiter=';')

                total_rows = 0
                created_count = 0
                updated_count = 0

                for row in reader:
                    total_rows += 1
                    
                    # Limpa e prepara os dados do CSV
                    name_val = row.get('Nome', '').strip()
                    if not name_val:
                        self.stdout.write(self.style.WARNING(f'Linha {total_rows}: Nome do cliente está vazio. Pulando.'))
                        continue

                    cpf_cnpj_raw = row.get('CNPJ / CPF', '').strip()
                    # Remove caracteres não numéricos para inferir o tipo
                    cpf_cnpj_digits = re.sub(r'\D', '', cpf_cnpj_raw)
                    cpf_cnpj_val = cpf_cnpj_raw or None
                    
                    email_val = row.get('E-mail', '').strip() or None
                    
                    # Inferir o tipo de pessoa
                    person_type_val = 'F' # Padrão para Pessoa Física
                    if len(cpf_cnpj_digits) > 11:
                        person_type_val = 'J' # CNPJ

                    # Prepara os dados da linha do CSV para o novo modelo
                    customer_data = {
                        'code': row.get('ID', '').strip() or None,
                        'name': name_val,
                        'fantasy_name': row.get('Fantasia', '').strip() or None,
                        'person_type': person_type_val, # Novo campo obrigatório
                        'phone': row.get('Fone', '').strip() or None,
                        'street': row.get('Endereço', '').strip() or None,
                        'number': row.get('Número', '').strip() or None,
                        'complement': row.get('Complemento', '').strip() or None,
                        'district': row.get('Bairro', '').strip() or None,
                        'city': row.get('Cidade', '').strip() or None,
                        'state': row.get('UF', '').strip() or None,
                        'zip_code': row.get('CEP', '').strip() or None,
                    }

                    # Constrói uma query para encontrar o cliente por CPF/CNPJ ou E-mail
                    lookup_query = Q()
                    if cpf_cnpj_val:
                        lookup_query |= Q(cpf_cnpj=cpf_cnpj_val)
                    if email_val:
                        lookup_query |= Q(email=email_val)

                    customer = None
                    if lookup_query:
                        customer = Customer.objects.filter(lookup_query).order_by('id').first()

                    if customer:
                        # Cliente encontrado, atualiza os dados (merge)
                        for key, value in customer_data.items():
                            # Only update if the new value is not None
                            if value is not None:
                                setattr(customer, key, value)
                        
                        customer.save()
                        updated_count += 1
                    else:
                        # Cliente não encontrado, cria um novo
                        customer_data['cpf_cnpj'] = cpf_cnpj_val
                        customer_data['email'] = email_val
                        Customer.objects.create(**customer_data)
                        created_count += 1

                self.stdout.write(self.style.SUCCESS(f'\nImportação concluída!'))
                self.stdout.write(f'Total de linhas processadas: {total_rows}')
                self.stdout.write(f'Clientes criados: {created_count}')
                self.stdout.write(f'Clientes atualizados: {updated_count}')

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'Arquivo não encontrado: {csv_file_path}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ocorreu um erro: {e}'))