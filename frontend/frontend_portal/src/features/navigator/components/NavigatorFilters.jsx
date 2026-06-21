import React from 'react';
import { TYPE_COLORS, DEFAULT_TYPE_COLOR } from '../leafletLoader';
import cl from '../pages/NavigatorPage.module.css';

/**
 * Панель фильтрации меток по типу, направлению и отрасли (п.2.2 Модуль 4 ТЗ).
 */
const NavigatorFilters = ({
    types, industries, directions,
    activeType, activeIndustries, activeDirections, search,
    onTypeChange, onToggleIndustry, onToggleDirection, onSearchChange, onReset,
    total,
}) => {
    return (
        <div className={cl.filters}>
            <div className={cl.filtersHeader}>
                <h2 className={cl.filtersTitle}>Навигатор</h2>
                <span className={cl.filtersCount}>{total} меток</span>
            </div>

            <input
                type="search"
                className={cl.search}
                placeholder="Поиск по названию…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Поиск организаций"
            />

            <div className={cl.filterGroup}>
                <div className={cl.filterGroupTitle}>Тип</div>
                <div className={cl.typeList}>
                    <button
                        type="button"
                        className={`${cl.typeBtn} ${!activeType ? cl.typeBtnActive : ''}`}
                        onClick={() => onTypeChange('')}
                    >
                        Все
                    </button>
                    {types.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            className={`${cl.typeBtn} ${activeType === t.value ? cl.typeBtnActive : ''}`}
                            onClick={() => onTypeChange(activeType === t.value ? '' : t.value)}
                        >
                            <span
                                className={cl.typeDot}
                                style={{ backgroundColor: TYPE_COLORS[t.value] || DEFAULT_TYPE_COLOR }}
                                aria-hidden="true"
                            />
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {directions.length > 0 && (
                <div className={cl.filterGroup}>
                    <div className={cl.filterGroupTitle}>Направление</div>
                    <div className={cl.chipFilters}>
                        {directions.map((d) => (
                            <button
                                key={d.id}
                                type="button"
                                className={`${cl.chipFilter} ${activeDirections.includes(d.slug) ? cl.chipFilterActive : ''}`}
                                onClick={() => onToggleDirection(d.slug)}
                            >
                                {d.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {industries.length > 0 && (
                <div className={cl.filterGroup}>
                    <div className={cl.filterGroupTitle}>Отрасль</div>
                    <div className={cl.chipFilters}>
                        {industries.map((i) => (
                            <button
                                key={i.id}
                                type="button"
                                className={`${cl.chipFilter} ${activeIndustries.includes(i.slug) ? cl.chipFilterActive : ''}`}
                                onClick={() => onToggleIndustry(i.slug)}
                            >
                                {i.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {(activeType || activeIndustries.length > 0 || activeDirections.length > 0 || search) && (
                <button type="button" className={cl.resetBtn} onClick={onReset}>
                    Сбросить фильтры
                </button>
            )}
        </div>
    );
};

export default NavigatorFilters;
