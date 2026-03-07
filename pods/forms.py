from django import forms

from .models import Event, Pod


class PodForm(forms.ModelForm):
    class Meta:
        model = Pod
        fields = ["name", "description"]
        widgets = {
            "name": forms.TextInput(
                attrs={
                    "placeholder": "Friday Pod",
                }
            ),
            "description": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Small recurring group with a standing time and place.",
                }
            ),
        }


class EventForm(forms.ModelForm):
    scheduled_for = forms.DateTimeField(
        input_formats=["%Y-%m-%dT%H:%M"],
        widget=forms.DateTimeInput(attrs={"type": "datetime-local"}),
    )

    class Meta:
        model = Event
        fields = ["pod", "title", "location", "scheduled_for", "description"]
        widgets = {
            "title": forms.TextInput(
                attrs={
                    "placeholder": "Commander Night",
                }
            ),
            "location": forms.TextInput(
                attrs={
                    "placeholder": "Library meeting room",
                }
            ),
            "description": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Optional notes, agenda, or what to bring.",
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["pod"].queryset = Pod.objects.order_by("name")
