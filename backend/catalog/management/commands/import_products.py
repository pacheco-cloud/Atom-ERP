import csv
from decimal import Decimal, InvalidOperation
from django.core.management.base import BaseCommand
from catalog.models import Product

class Command(BaseCommand):
    help = 'Importa produtos de um arquivo CSV para o banco de dados.'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='O caminho para o arquivo CSV a ser importado.')

    def handle(self, *args, **kwargs):
        csv_file_path = kwargs['csv_file']
        self.stdout.write(self.style.SUCCESS(f'Iniciando a importação do arquivo: {csv_file_path}'))

        # Limpa a tabela de produtos antes de importar para evitar duplicatas
        Product.objects.all().delete()
        self.stdout.write(self.style.WARNING('Tabela de produtos existente foi limpa.'))

        try:
            with open(csv_file_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file, delimiter=';')

                created_count = 0
                # Usamos enumerate para ter um índice único para cada linha
                for index, row in enumerate(reader, start=1):
                    name_val = row.get('Descrição', '').strip()
                    if not name_val:
                        continue

                    # O SKU é único. Se estiver vazio, usamos o ID do CSV ou o número da linha como fallback.
                    sku_val = row.get('Código', '').strip()
                    if not sku_val:
                        csv_id = row.get('ID', '').strip()
                        if csv_id:
                            sku_val = f'CSV-ID-{csv_id}'
                        else:
                            # Se Código e ID estiverem vazios, o número da linha garante a unicidade.
                            sku_val = f'AUTOGEN-SKU-{index}'

                    # Função para limpar e converter valores monetários
                    def clean_price(price_str):
                        if not price_str:
                            return Decimal('0.00')
                        try:
                            # Remove o ponto de milhar e substitui a vírgula decimal por ponto
                            cleaned_str = price_str.replace('.', '').replace(',', '.')
                            return Decimal(cleaned_str)
                        except InvalidOperation:
                            return Decimal('0.00')

                    # Função para limpar e converter valores inteiros
                    def clean_int(int_str):
                        return int(clean_price(int_str))

                    Product.objects.create(
                        name=name_val,
                        sku=sku_val,
                        description=row.get('Descrição Complementar', '').strip() or None,
                        sale_price=clean_price(row.get('Preço', '0,00')),
                        cost_price=clean_price(row.get('Preço de custo', '0,00')),
                        stock_quantity=clean_int(row.get('Estoque', '0')),
                    )
                    created_count += 1

                self.stdout.write(self.style.SUCCESS(f'\nImportação concluída!'))
                self.stdout.write(f'Total de produtos criados: {created_count}')

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'Arquivo não encontrado: {csv_file_path}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ocorreu um erro: {e}'))