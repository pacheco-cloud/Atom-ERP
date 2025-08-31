from django.contrib.auth.models import User
from rest_framework import serializers, validators


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {
                "required": True,
                "validators": [validators.UniqueValidator(queryset=User.objects.all())],
            },
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user