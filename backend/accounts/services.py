from django.contrib.auth import get_user_model

User = get_user_model()


def register_user(email, password, full_name):
    return User.objects.create_user(email=email, password=password, full_name=full_name)
