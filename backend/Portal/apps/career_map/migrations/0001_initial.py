import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Direction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=140, unique=True)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Направление',
                'verbose_name_plural': 'Направления',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Industry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=140, unique=True)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Отрасль',
                'verbose_name_plural': 'Отрасли',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Organization',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('slug', models.SlugField(blank=True, max_length=280, unique=True)),
                ('org_type', models.CharField(choices=[('university', 'Вуз (высшее образование)'), ('college', 'Ссуз (среднее профессиональное)'), ('research', 'НИИ / научный центр'), ('enterprise', 'Промышленное предприятие')], db_index=True, max_length=20, verbose_name='Тип')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('address', models.CharField(blank=True, max_length=300, verbose_name='Адрес')),
                ('phone', models.CharField(blank=True, max_length=60, verbose_name='Телефон')),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('website', models.URLField(blank=True, verbose_name='Сайт')),
                ('photo', models.ImageField(blank=True, null=True, upload_to='career_map/photos/')),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9, verbose_name='Широта')),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9, verbose_name='Долгота')),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('directions', models.ManyToManyField(blank=True, related_name='organizations', to='career_map.direction', verbose_name='Направления')),
                ('industries', models.ManyToManyField(blank=True, related_name='organizations', to='career_map.industry', verbose_name='Отрасли')),
            ],
            options={
                'verbose_name': 'Организация (метка на карте)',
                'verbose_name_plural': 'Организации (метки на карте)',
                'ordering': ['name'],
            },
        ),
        migrations.AddIndex(
            model_name='organization',
            index=models.Index(fields=['org_type', 'is_active'], name='career_map__org_typ_idx'),
        ),
        migrations.CreateModel(
            name='Vacancy',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='Должность')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('requirements', models.TextField(blank=True, verbose_name='Требования')),
                ('employment', models.CharField(blank=True, help_text='Например: стажировка, практика, частичная занятость', max_length=120, verbose_name='Тип занятости')),
                ('salary', models.CharField(blank=True, max_length=120, verbose_name='Оплата')),
                ('contact', models.CharField(blank=True, max_length=255, verbose_name='Контакт для связи')),
                ('url', models.URLField(blank=True, verbose_name='Ссылка на вакансию')),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vacancies', to='career_map.organization')),
            ],
            options={
                'verbose_name': 'Вакансия для стажёров',
                'verbose_name_plural': 'Вакансии для стажёров',
                'ordering': ['-created_at'],
            },
        ),
    ]
