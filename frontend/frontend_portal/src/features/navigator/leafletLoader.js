/**
 * Ленивая загрузка Leaflet с публичного CDN (unpkg).
 *
 * Leaflet — открытая библиотека карт, тайлы берём из OpenStreetMap
 * (публичный API карт, без ключей — соответствует п.2.2.4 ТЗ).
 * Грузим по требованию, только на странице навигатора, чтобы не утяжелять
 * основной бандл. Промис кэшируется — повторные вызовы не дублируют запрос.
 */

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

let loadPromise = null;

export function loadLeaflet() {
    if (typeof window !== 'undefined' && window.L) {
        return Promise.resolve(window.L);
    }
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
        // CSS
        if (!document.querySelector('link[data-leaflet]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = LEAFLET_CSS;
            link.setAttribute('data-leaflet', '1');
            document.head.appendChild(link);
        }
        // JS
        const existing = document.querySelector('script[data-leaflet]');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.L));
            existing.addEventListener('error', () => reject(new Error('Не удалось загрузить карту')));
            return;
        }
        const script = document.createElement('script');
        script.src = LEAFLET_JS;
        script.async = true;
        script.setAttribute('data-leaflet', '1');
        script.addEventListener('load', () => resolve(window.L));
        script.addEventListener('error', () => reject(new Error('Не удалось загрузить карту')));
        document.body.appendChild(script);
    });

    return loadPromise;
}

// Цвета меток по типу организации (используются и на карте, и в легенде/фильтре).
export const TYPE_COLORS = {
    university: '#2563eb',
    college: '#0891b2',
    research: '#7c4dff',
    enterprise: '#f59e0b',
};

export const DEFAULT_TYPE_COLOR = '#64748b';
