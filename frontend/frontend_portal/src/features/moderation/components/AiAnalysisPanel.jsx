import React from 'react';

const RISK_LABELS = {
    high:   'Высокий риск',
    medium: 'Средний риск',
    low:    'Низкий риск',
};

const SENTIMENT_LABELS = {
    negative: 'Негативный',
    neutral:  'Нейтральный',
    positive: 'Позитивный',
};

const AiAnalysisPanel = ({ data, loading, error }) => {
    if (loading) {
        return (
            <div className="ai-panel ai-panel--loading">
                Анализируем текст...
            </div>
        );
    }

    if (error) {
        return (
            <div className="ai-panel ai-panel--error">
                {error}
            </div>
        );
    }

    if (!data) return null;

    const { sentiment, stop_words, risk, warnings, recommendation } = data;
    const scores        = sentiment?.scores ?? {};
    const sentimentKey  = sentiment?.label ?? '';

    return (
        <div className="ai-panel">
            {/* Заголовок + бейдж риска */}
            <div className="ai-panel__header">
                <span className="ai-panel__title">ИИ-анализ</span>
                {risk && (
                    <span className={`ai-panel__risk ai-panel__risk--${risk}`}>
                        {RISK_LABELS[risk] ?? risk}
                    </span>
                )}
            </div>

            {/* Тональность */}
            {sentiment && (
                <div className="ai-panel__section">
                    <div className="ai-panel__section-label">
                        Тональность:{' '}
                        <strong>{SENTIMENT_LABELS[sentimentKey] ?? sentimentKey}</strong>
                    </div>
                    <div className="ai-panel__bars">
                        {['negative', 'neutral', 'positive'].map((key) => {
                            const pct = Math.round((scores[key] ?? 0) * 100);
                            return (
                                <div key={key} className="ai-panel__bar-row">
                                    <span className="ai-panel__bar-label">
                                        {SENTIMENT_LABELS[key]}
                                    </span>
                                    <div className="ai-panel__bar-track">
                                        <div
                                            className={`ai-panel__bar-fill ai-panel__bar-fill--${key}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="ai-panel__bar-pct">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Стоп-слова */}
            {Array.isArray(stop_words) && stop_words.length > 0 && (
                <div className="ai-panel__section">
                    <div className="ai-panel__section-label">Стоп-слова</div>
                    <div className="ai-panel__chips">
                        {stop_words.map((word, i) => (
                            <span key={i} className="ai-panel__chip">{word}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Предупреждения */}
            {Array.isArray(warnings) && warnings.length > 0 && (
                <div className="ai-panel__section">
                    <div className="ai-panel__section-label">Предупреждения</div>
                    <ul className="ai-panel__warnings">
                        {warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Рекомендация */}
            {recommendation && (
                <div className="ai-panel__section">
                    <div className="ai-panel__section-label">Рекомендация</div>
                    <p className="ai-panel__recommendation">{recommendation}</p>
                </div>
            )}
        </div>
    );
};

export default AiAnalysisPanel;
