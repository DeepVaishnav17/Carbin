from django.db import models


class LocationSearch(models.Model):
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    search_count = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def increment_search(self):
        self.search_count += 1
        self.save()

    def __str__(self):
        return f"{self.name} ({self.search_count})"


class PollutionRecord(models.Model):
    location_name = models.CharField(max_length=255)
    pollutant = models.CharField(max_length=20, default="NO2")

    latitude = models.FloatField()
    longitude = models.FloatField()

    value = models.FloatField()
    date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.location_name} {self.pollutant} {self.value} on {self.date}"
