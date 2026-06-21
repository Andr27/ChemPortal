import React from 'react';
import { TYPE_COLORS, DEFAULT_TYPE_COLOR } from '../leafletLoader';
import cl from '../pages/NavigatorPage.module.css';

/**
 * Карточка метки: описание, контакты, фото, ссылка на сайт и список
 * стажёрских вакансий (п.2.2 Модуль 4 ТЗ).
 */
const OrganizationCard = ({ org, loading, onClose }) => {
    if (!org && !loading) return null;

    const color = org ? (TYPE_COLORS[org.org_type] || DEFAULT_TYPE_COLOR) : DEFAULT_TYPE_COLOR;

    return (
        <aside className={cl.card} aria-label="Карточка организации">
            <button type="button" className={cl.cardClose} onClick={onClose} aria-label="Закрыть карточку">
                ×
            </button>

            {loading && <div className={cl.cardLoading}>Загрузка…</div>}

            {org && !loading && (
                <>
                    {org.photo && (
                        <img className={cl.cardPhoto} src={org.photo} alt={org.name} loading="lazy" />
                    )}

                    <span className={cl.cardType} style={{ backgroundColor: color }}>
                        {org.org_type_display}
                    </span>
                    <h2 className={cl.cardTitle}>{org.name}</h2>

                    {org.description && <p className={cl.cardDesc}>{org.description}</p>}

                    {(org.directions?.length > 0 || org.industries?.length > 0) && (
                        <div className={cl.cardChips}>
                            {org.directions?.map((d) => (
                                <span key={`d-${d.id}`} className={cl.chip}>{d.name}</span>
                            ))}
                            {org.industries?.map((i) => (
                                <span key={`i-${i.id}`} className={`${cl.chip} ${cl.chipAlt}`}>{i.name}</span>
                            ))}
                        </div>
                    )}

                    <div className={cl.cardContacts}>
                        {org.address && <div><span className={cl.contactLabel}>Адрес:</span> {org.address}</div>}
                        {org.phone && <div><span className={cl.contactLabel}>Телефон:</span> {org.phone}</div>}
                        {org.email && (
                            <div>
                                <span className={cl.contactLabel}>E-mail:</span>{' '}
                                <a href={`mailto:${org.email}`}>{org.email}</a>
                            </div>
                        )}
                        {org.website && (
                            <div>
                                <span className={cl.contactLabel}>Сайт:</span>{' '}
                                <a href={org.website} target="_blank" rel="noopener noreferrer">
                                    {org.website}
                                </a>
                            </div>
                        )}
                    </div>

                    <div className={cl.cardVacancies}>
                        <h3 className={cl.cardSubtitle}>
                            Вакансии для стажёров
                            {org.vacancies?.length > 0 && <span className={cl.vacCount}> · {org.vacancies.length}</span>}
                        </h3>

                        {(!org.vacancies || org.vacancies.length === 0) && (
                            <p className={cl.vacEmpty}>Актуальных вакансий пока нет.</p>
                        )}

                        {org.vacancies?.map((v) => (
                            <div key={v.id} className={cl.vacancy}>
                                <div className={cl.vacancyHead}>
                                    <strong>{v.title}</strong>
                                    {v.salary && <span className={cl.vacancySalary}>{v.salary}</span>}
                                </div>
                                {v.employment && <div className={cl.vacancyMeta}>{v.employment}</div>}
                                {v.description && <p className={cl.vacancyText}>{v.description}</p>}
                                {v.requirements && (
                                    <p className={cl.vacancyText}>
                                        <span className={cl.contactLabel}>Требования:</span> {v.requirements}
                                    </p>
                                )}
                                {(v.contact || v.url) && (
                                    <div className={cl.vacancyMeta}>
                                        {v.url ? (
                                            <a href={v.url} target="_blank" rel="noopener noreferrer">Откликнуться</a>
                                        ) : v.contact}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </aside>
    );
};

export default OrganizationCard;
