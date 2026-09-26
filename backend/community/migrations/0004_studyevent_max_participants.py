from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0003_comment_code_language_comment_code_solution_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='studyevent',
            name='max_participants',
            field=models.PositiveIntegerField(blank=True, default=30, null=True),
        ),
    ]
