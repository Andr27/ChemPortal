from django.db import migrations, models
import django.contrib.postgres.search
from django.contrib.postgres.indexes import GinIndex


def _fill_search_vector(apps, schema_editor):
    """
    Одноразовое заполнение search_vector для всех существующих постов.
    После этой миграции поле будет обновляться сигналом post_save автоматически.
    """
    Post = apps.get_model('posts', 'Post')
    from django.contrib.postgres.search import SearchVector

    Post.objects.update(
        search_vector=(
            SearchVector('title', weight='A', config='russian')
            + SearchVector('body', weight='B', config='russian')
        )
    )


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0013_post_reject_comment'),
    ]

    operations = [
        # Добавляем предрасчитанное поле tsvector
        migrations.AddField(
            model_name='post',
            name='search_vector',
            field=django.contrib.postgres.search.SearchVectorField(
                blank=True,
                editable=False,
                null=True,
            ),
        ),

        # GIN-индекс для мгновенного полнотекстового поиска
        migrations.AddIndex(
            model_name='post',
            index=GinIndex(
                fields=['search_vector'],
                name='posts_search_vec_gin_idx',
            ),
        ),

        # Заполняем поле для существующих постов один раз (RunPython)
        migrations.RunPython(
            _fill_search_vector,
            migrations.RunPython.noop,
            elidable=True,
        ),
    ]
