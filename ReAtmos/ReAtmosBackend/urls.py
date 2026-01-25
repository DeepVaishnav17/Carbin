# ReAtmosbackend: ReAtmosBackend/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # dashboard + api
    path("map/", include("pollution.urls")),
    path("", include("pollution.urls")),
]
