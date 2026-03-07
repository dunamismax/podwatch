from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Event, Pod


class DashboardTests(TestCase):
    def test_dashboard_renders(self) -> None:
        response = self.client.get(reverse("pods:dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "PodWatch")
        self.assertContains(response, "Create a pod")

    def test_create_pod(self) -> None:
        response = self.client.post(
            reverse("pods:create_pod"),
            {
                "name": "Friday Pod",
                "description": "Casual recurring group.",
            },
        )

        self.assertRedirects(response, reverse("pods:dashboard"))
        self.assertTrue(Pod.objects.filter(name="Friday Pod").exists())

    def test_create_event(self) -> None:
        pod = Pod.objects.create(name="Archive Pod", description="Keeps the dates straight.")
        scheduled_for = timezone.localtime(timezone.now() + timedelta(days=2)).replace(
            second=0,
            microsecond=0,
        )

        response = self.client.post(
            reverse("pods:create_event"),
            {
                "pod": pod.pk,
                "title": "Monthly Planning",
                "location": "Back room",
                "scheduled_for": scheduled_for.strftime("%Y-%m-%dT%H:%M"),
                "description": "Bring the draft agenda.",
            },
        )

        self.assertRedirects(response, reverse("pods:dashboard"))
        self.assertTrue(
            Event.objects.filter(
                pod=pod,
                title="Monthly Planning",
                location="Back room",
            ).exists()
        )

    def test_invalid_event_returns_dashboard_with_errors(self) -> None:
        response = self.client.post(
            reverse("pods:create_event"),
            {
                "title": "Missing Pod",
                "scheduled_for": "",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertContains(response, "This field is required.", status_code=400)
