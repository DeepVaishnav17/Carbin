from django.urls import path
from .views import DashboardView, MongoUsersApiCentersMapView

urlpatterns = [
    path("", DashboardView.as_view(), name="dashboard"),

    # ✅ MongoDB Map API (Users + Apicenters)
    path("mongo/users-apicenters/", MongoUsersApiCentersMapView.as_view(), name="mongo-users-apicenters"),
]
