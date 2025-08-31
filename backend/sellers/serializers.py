from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Seller

# Serializer para o modelo User, focando nos dados do vendedor
class UserSellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

# Serializer principal para o modelo Seller
class SellerSerializer(serializers.ModelSerializer):
    user = UserSellerSerializer()

    class Meta:
        model = Seller
        fields = ['id', 'user', 'phone', 'commission_rate']

# Serializer para criar/atualizar um vendedor
class SellerCreateUpdateSerializer(serializers.ModelSerializer):
    # Permite receber os dados do User diretamente
    first_name = serializers.CharField(source='user.first_name', max_length=150)
    last_name = serializers.CharField(source='user.last_name', max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username', max_length=150)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Seller
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'phone', 'commission_rate']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        password = validated_data.pop('password', None)

        # Cria o User primeiro
        user = User.objects.create(
            username=user_data['username'],
            email=user_data['email'],
            first_name=user_data['first_name'],
            last_name=user_data.get('last_name', '')
        )
        if password:
            user.set_password(password)
        else:
            # Define uma senha padrão se nenhuma for fornecida
            user.set_password('123456')
        user.save()

        # Cria o Seller associado ao User
        seller = Seller.objects.create(user=user, **validated_data)
        return seller

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        # Atualiza os campos do User
        user.first_name = user_data.get('first_name', user.first_name)
        user.last_name = user_data.get('last_name', user.last_name)
        user.email = user_data.get('email', user.email)
        user.username = user_data.get('username', user.username)
        user.save()

        # Atualiza os campos do Seller
        instance.phone = validated_data.get('phone', instance.phone)
        instance.commission_rate = validated_data.get('commission_rate', instance.commission_rate)
        instance.save()

        return instance
