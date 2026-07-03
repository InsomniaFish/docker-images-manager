from django.urls import path
from . import views

urlpatterns = [
    path('', views.image_list, name='image_list'),
    path('delete/', views.delete_images_view, name='delete_images'),
    path('refresh/', views.refresh_images, name='refresh_images'),
    path('pull/', views.pull_images_view, name='pull_images'),
    path('search/', views.search_images_view, name='search_images'),
]
