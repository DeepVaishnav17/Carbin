from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.generic import TemplateView
from bson import ObjectId

from .mongo import get_users_collection, get_apicenters_collection


class DashboardView(TemplateView):
    template_name = "pollution/dashboard.html"


def convert_objectids(data):
    """Recursively convert MongoDB ObjectId values to strings."""
    if isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, list):
        return [convert_objectids(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_objectids(value) for key, value in data.items()}
    return data


class MongoUsersApiCentersMapView(APIView):
    """
    ✅ Fetch users + join apicenter latitude/longitude
    URL: /map/mongo/users-apicenters/
    """

    def get(self, request):
        try:
            users_col = get_users_collection()
            apicenters_col = get_apicenters_collection()

            users_cursor = users_col.find({}).limit(200)

            results = []

            for user in users_cursor:
                apicenter_id = user.get("apiCenter")

                apicenter_doc = None

                if apicenter_id:
                    try:
                        apicenter_doc = apicenters_col.find_one({"_id": ObjectId(str(apicenter_id))})
                    except Exception:
                        apicenter_doc = None

                lat = None
                lng = None
                apicenter_name = None

                if apicenter_doc:
                    lat = apicenter_doc.get("lat")
                    lng = apicenter_doc.get("lng")
                    apicenter_name = apicenter_doc.get("name")

                results.append({
                    "user_name": user.get("name"),
                    "user_email": user.get("email"),
                    "apiCenterId": str(apicenter_id) if apicenter_id else None,
                    "apiCenterName": apicenter_name,
                    "lat": lat,
                    "lng": lng
                })


            return Response(
                {"count": len(results), "results": results},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
