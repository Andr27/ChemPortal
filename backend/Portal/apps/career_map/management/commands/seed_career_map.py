"""
Заполнение профориентационного навигатора демонстрационными метками.

Запуск:  python manage.py seed_career_map

Команда идемпотентна — повторный запуск не создаёт дубликаты (поиск по названию).
Координаты реальных учреждений Хабаровского края (приблизительные).
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.career_map.models import Organization, Industry, Direction, Vacancy


INDUSTRIES = [
    'Нефтехимия',
    'Металлургия',
    'Новые материалы',
    'Экология',
    'Образование и наука',
]

DIRECTIONS = [
    'Химическая технология',
    'Наноматериалы',
    'Аналитическая химия',
    'Материаловедение',
    'Экологическая безопасность',
]

ORGS = [
    {
        'name': 'Тихоокеанский государственный университет (ТОГУ)',
        'org_type': 'university',
        'description': 'Крупнейший вуз Хабаровского края. Готовит инженеров-химиков '
                       'и специалистов по новым материалам, ведёт научные исследования.',
        'address': 'г. Хабаровск, ул. Тихоокеанская, 136',
        'phone': '+7 (4212) 37-51-91',
        'email': 'khstu@pnu.edu.ru',
        'website': 'https://togudv.ru',
        'latitude': 48.4776, 'longitude': 135.0493,
        'industries': ['Образование и наука', 'Новые материалы'],
        'directions': ['Химическая технология', 'Наноматериалы', 'Материаловедение'],
        'vacancies': [
            {'title': 'Стажёр-лаборант кафедры химии', 'employment': 'Стажировка',
             'salary': 'по договорённости',
             'description': 'Помощь в проведении лабораторных исследований.',
             'requirements': 'Студент 2–4 курса химических направлений.',
             'contact': 'career@pnu.edu.ru'},
        ],
    },
    {
        'name': 'Дальневосточный государственный университет путей сообщения (ДВГУПС)',
        'org_type': 'university',
        'description': 'Технический университет с программами по материаловедению '
                       'и защите материалов от коррозии.',
        'address': 'г. Хабаровск, ул. Серышева, 47',
        'phone': '+7 (4212) 40-71-00',
        'website': 'https://www.dvgups.ru',
        'latitude': 48.4690, 'longitude': 135.0668,
        'industries': ['Образование и наука', 'Новые материалы'],
        'directions': ['Материаловедение', 'Химическая технология'],
        'vacancies': [],
    },
    {
        'name': 'Хабаровский технологический колледж',
        'org_type': 'college',
        'description': 'Среднее профессиональное образование по химико-технологическим '
                       'и лабораторным специальностям.',
        'address': 'г. Хабаровск, ул. Краснодарская, 1',
        'phone': '+7 (4212) 53-00-50',
        'website': 'https://htc27.ru',
        'latitude': 48.4820, 'longitude': 135.0840,
        'industries': ['Образование и наука'],
        'directions': ['Аналитическая химия', 'Химическая технология'],
        'vacancies': [
            {'title': 'Практика: лаборант химического анализа', 'employment': 'Практика',
             'description': 'Производственная практика в учебной лаборатории.',
             'requirements': 'Студенты колледжа профильных специальностей.',
             'contact': 'htc27@edu.27.ru'},
        ],
    },
    {
        'name': 'Институт водных и экологических проблем ДВО РАН (ИВЭП)',
        'org_type': 'research',
        'description': 'Научно-исследовательский институт: химия природных вод, '
                       'экологический мониторинг, аналитическая химия.',
        'address': 'г. Хабаровск, ул. Дикопольцева, 56',
        'phone': '+7 (4212) 32-50-55',
        'website': 'http://ivep.as.khb.ru',
        'latitude': 48.4765, 'longitude': 135.0775,
        'industries': ['Экология', 'Образование и наука'],
        'directions': ['Аналитическая химия', 'Экологическая безопасность'],
        'vacancies': [
            {'title': 'Стажёр-исследователь (аналитическая химия)', 'employment': 'Стажировка',
             'salary': 'стипендия',
             'description': 'Участие в исследованиях состава природных вод.',
             'requirements': 'Студенты старших курсов, магистранты.',
             'contact': 'ivep@ivep.as.khb.ru'},
        ],
    },
    {
        'name': 'Институт тектоники и геофизики им. Ю.А. Косыгина ДВО РАН',
        'org_type': 'research',
        'description': 'Геохимия, минералогия, исследование новых материалов '
                       'на основе минерального сырья региона.',
        'address': 'г. Хабаровск, ул. Ким Ю Чена, 65',
        'phone': '+7 (4212) 22-79-15',
        'website': 'https://itig.as.khb.ru',
        'latitude': 48.4750, 'longitude': 135.0600,
        'industries': ['Образование и наука', 'Новые материалы'],
        'directions': ['Материаловедение', 'Аналитическая химия'],
        'vacancies': [],
    },
    {
        'name': 'Хабаровский нефтеперерабатывающий завод (ННК)',
        'org_type': 'enterprise',
        'description': 'Один из ключевых нефтеперерабатывающих заводов Дальнего Востока. '
                       'Производство топлива и нефтехимической продукции.',
        'address': 'г. Хабаровск, ул. Металлистов, 23',
        'phone': '+7 (4212) 41-11-11',
        'website': 'https://nnk.ru',
        'latitude': 48.4350, 'longitude': 135.1200,
        'industries': ['Нефтехимия'],
        'directions': ['Химическая технология'],
        'vacancies': [
            {'title': 'Стажёр оператора технологических установок', 'employment': 'Стажировка',
             'salary': 'от 45 000 ₽',
             'description': 'Стажировка на установках первичной переработки нефти.',
             'requirements': 'Выпускники по направлению «Химическая технология».',
             'contact': 'hr@nnk.ru'},
            {'title': 'Лаборант химического анализа', 'employment': 'Полная занятость',
             'salary': 'от 50 000 ₽',
             'description': 'Контроль качества нефтепродуктов в заводской лаборатории.',
             'requirements': 'СПО/ВО химического профиля.',
             'contact': 'hr@nnk.ru'},
        ],
    },
    {
        'name': 'Амурметалл',
        'org_type': 'enterprise',
        'description': 'Крупнейшее на Дальнем Востоке металлургическое предприятие. '
                       'Производство стали из лома.',
        'address': 'г. Комсомольск-на-Амуре, ул. Вагонная, 30',
        'phone': '+7 (4217) 26-30-00',
        'website': 'https://amurmetal.ru',
        'latitude': 50.5520, 'longitude': 137.0090,
        'industries': ['Металлургия', 'Новые материалы'],
        'directions': ['Материаловедение'],
        'vacancies': [
            {'title': 'Стажёр-металлург', 'employment': 'Стажировка',
             'salary': 'от 48 000 ₽',
             'description': 'Стажировка в сталеплавильном производстве.',
             'requirements': 'Студенты и выпускники металлургических направлений.',
             'contact': 'personal@amurmetal.ru'},
        ],
    },
]


class Command(BaseCommand):
    help = 'Заполняет навигатор демонстрационными метками организаций Хабаровского края'

    @transaction.atomic
    def handle(self, *args, **options):
        industries = {name: Industry.objects.get_or_create(name=name)[0] for name in INDUSTRIES}
        directions = {name: Direction.objects.get_or_create(name=name)[0] for name in DIRECTIONS}

        created, updated = 0, 0
        for entry in ORGS:
            data = dict(entry)  # копия, чтобы не мутировать глобальный ORGS
            vacancies = data.pop('vacancies', [])
            ind_names = data.pop('industries', [])
            dir_names = data.pop('directions', [])

            org, was_created = Organization.objects.get_or_create(
                name=data['name'], defaults=data,
            )
            if not was_created:
                # Обновляем поля на случай повторного запуска с правками.
                for field, value in data.items():
                    setattr(org, field, value)
                org.save()
                updated += 1
            else:
                created += 1

            org.industries.set([industries[n] for n in ind_names])
            org.directions.set([directions[n] for n in dir_names])

            for vac in vacancies:
                Vacancy.objects.get_or_create(
                    organization=org, title=vac['title'], defaults=vac,
                )

        total_vac = Vacancy.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f'Готово. Организаций: создано {created}, обновлено {updated}. '
            f'Отраслей: {len(industries)}, направлений: {len(directions)}, вакансий всего: {total_vac}.'
        ))
