from django import forms


class ApplicationForm(forms.Form):
    first_name = forms.CharField(max_length=80, label="First name")
    last_name = forms.CharField(max_length=80, label="Last name")
    email = forms.EmailField(max_length=200, label="Email address")
    species = forms.CharField(
        max_length=100, required=False, label="Species you can care for (if relevant)"
    )
    capacity = forms.CharField(
        max_length=200,
        required=False,
        label="Household, experience and capacity (if relevant)",
    )
    message = forms.CharField(
        max_length=4000,
        widget=forms.Textarea(attrs={"rows": 6}),
        label="Tell us about your enquiry",
    )
    privacy = forms.BooleanField(
        label="I have read the privacy notice and understand that the team will use these details to respond."
    )
    website = forms.CharField(required=False, widget=forms.HiddenInput)

    def clean_website(self):
        if self.cleaned_data["website"]:
            raise forms.ValidationError("Unable to accept submission")
        return ""
