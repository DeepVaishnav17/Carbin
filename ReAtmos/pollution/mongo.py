from django.conf import settings
from pymongo import MongoClient


def get_mongo_db():
    if not settings.MONGO_URI:
        raise Exception("MONGO_URI is missing in .env")

    client = MongoClient(settings.MONGO_URI)
    db = client[settings.MONGODB_DB]
    return db


def get_users_collection():
    db = get_mongo_db()
    return db[settings.MONGODB_USERS_COLLECTION]


def get_apicenters_collection():
    db = get_mongo_db()
    return db[settings.MONGODB_APICENTERS_COLLECTION]
