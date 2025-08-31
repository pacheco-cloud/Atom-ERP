from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Product


class ProductAPITests(APITestCase):
    """
    Conjunto de testes para a API de Produtos.
    """

    def setUp(self):
        """
        Configuração inicial para cada teste.
        Cria um usuário e o autentica para as requisições.
        """
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client.force_authenticate(user=self.user)

        # URLs da API
        self.list_create_url = reverse('product-list')

        # Cria alguns produtos para os testes de listagem e detalhe
        self.product1 = Product.objects.create(
            name="Laptop Pro", sku="LP-001", sale_price=5500.00, stock_quantity=10
        )
        self.product2 = Product.objects.create(
            name="Mouse Gamer", sku="MG-002", sale_price=250.00, stock_quantity=50
        )
        self.detail_url = reverse('product-detail', kwargs={'pk': self.product1.pk})

    def test_list_products(self):
        """
        Garante que podemos listar os produtos.
        """
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2) # DRF usa paginação por padrão
        self.assertEqual(response.data['results'][0]['name'], self.product1.name)

    def test_retrieve_product(self):
        """
        Garante que podemos obter os detalhes de um único produto.
        """
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.product1.name)

    def test_create_product(self):
        """
        Garante que podemos criar um novo produto.
        """
        data = {
            "name": "Teclado Mecânico",
            "sku": "TM-003",
            "sale_price": "450.99",
            "stock_quantity": 30
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 3)
        self.assertEqual(Product.objects.get(sku="TM-003").name, "Teclado Mecânico")

    def test_update_product(self):
        """
        Garante que podemos atualizar um produto existente (PATCH).
        """
        data = {"sale_price": "5250.50"}
        response = self.client.patch(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product1.refresh_from_db()
        self.assertEqual(float(self.product1.sale_price), 5250.50)

    def test_delete_product(self):
        """
        Garante que podemos deletar um produto.
        """
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Product.objects.count(), 1)
