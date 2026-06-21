/*
 * Интерактивный выбор координат для метки навигатора в админке.
 *
 * Подключается через OrganizationAdmin.Media. Находит поля #id_latitude и
 * #id_longitude, встраивает карту Leaflet (OSM), позволяет:
 *   - кликнуть по карте, чтобы поставить метку;
 *   - перетащить метку;
 *   - найти место по адресу (геокодер Nominatim);
 *   - ручной ввод координат синхронизирует метку.
 */
(function () {
    'use strict';

    var DEFAULT = { lat: 48.4827, lng: 135.0838, zoom: 12 }; // Хабаровск

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    function num(v) {
        var n = parseFloat(String(v).replace(',', '.'));
        return isNaN(n) ? null : n;
    }

    ready(function () {
        var latInput = document.getElementById('id_latitude');
        var lngInput = document.getElementById('id_longitude');
        if (!latInput || !lngInput) return;            // не форма организации
        if (typeof window.L === 'undefined') return;   // Leaflet не загрузился
        if (document.getElementById('cm-map-picker')) return; // уже встроено

        // --- UI-контейнер ---
        var box = document.createElement('div');
        box.className = 'cm-map-box';
        box.innerHTML =
            '<div class="cm-map-search">' +
            '  <input type="text" id="cm-map-search-input" placeholder="Найти по адресу, напр.: Хабаровск, ул. Тихоокеанская 136" autocomplete="off">' +
            '  <button type="button" id="cm-map-search-btn">Найти</button>' +
            '</div>' +
            '<div id="cm-map-picker"></div>' +
            '<div class="cm-map-hint">Кликните по карте или перетащите метку — координаты подставятся автоматически.</div>';

        var fieldset = latInput.closest('fieldset') || latInput.parentNode;
        fieldset.insertBefore(box, fieldset.firstChild);

        // --- Инициализация карты ---
        var startLat = num(latInput.value);
        var startLng = num(lngInput.value);
        var hasStart = startLat !== null && startLng !== null;

        var map = L.map('cm-map-picker').setView(
            [hasStart ? startLat : DEFAULT.lat, hasStart ? startLng : DEFAULT.lng],
            hasStart ? 14 : DEFAULT.zoom
        );
        // Убираем дефолтный префикс Leaflet (с флагом), оставляем только © OSM.
        map.attributionControl.setPrefix(false);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);

        var marker = L.marker(
            [hasStart ? startLat : DEFAULT.lat, hasStart ? startLng : DEFAULT.lng],
            { draggable: true }
        ).addTo(map);
        if (!hasStart) marker.setOpacity(0.5);

        function writeFields(lat, lng) {
            latInput.value = lat.toFixed(6);
            lngInput.value = lng.toFixed(6);
            marker.setOpacity(1);
        }

        function setMarker(lat, lng, recenter) {
            marker.setLatLng([lat, lng]);
            writeFields(lat, lng);
            if (recenter) map.setView([lat, lng], Math.max(map.getZoom(), 14));
        }

        map.on('click', function (e) {
            setMarker(e.latlng.lat, e.latlng.lng, false);
        });
        marker.on('dragend', function () {
            var p = marker.getLatLng();
            writeFields(p.lat, p.lng);
        });

        // Ручной ввод в поля → двигаем метку
        function syncFromInputs() {
            var la = num(latInput.value), ln = num(lngInput.value);
            if (la !== null && ln !== null) setMarker(la, ln, true);
        }
        latInput.addEventListener('change', syncFromInputs);
        lngInput.addEventListener('change', syncFromInputs);

        // --- Геокодер (Nominatim) ---
        function geocode() {
            var q = document.getElementById('cm-map-search-input').value.trim();
            if (!q) return;
            var btn = document.getElementById('cm-map-search-btn');
            var old = btn.textContent;
            btn.textContent = '…';
            btn.disabled = true;
            var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1' +
                '&accept-language=ru&countrycodes=ru&q=' + encodeURIComponent(q);
            fetch(url, { headers: { 'Accept': 'application/json' } })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data && data.length) {
                        setMarker(parseFloat(data[0].lat), parseFloat(data[0].lon), true);
                    } else {
                        alert('Адрес не найден. Уточните запрос или поставьте метку вручную.');
                    }
                })
                .catch(function () { alert('Ошибка геокодера. Поставьте метку вручную.'); })
                .finally(function () { btn.textContent = old; btn.disabled = false; });
        }
        document.getElementById('cm-map-search-btn').addEventListener('click', geocode);
        document.getElementById('cm-map-search-input').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); geocode(); }
        });

        // --- Карта в скрытой вкладке (jazzmin horizontal_tabs) рендерится с
        //     нулевым размером; пересчитываем при появлении контейнера. ---
        function invalidate() { map.invalidateSize(); }
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) { if (en.isIntersecting) invalidate(); });
            });
            io.observe(document.getElementById('cm-map-picker'));
        }
        window.addEventListener('resize', invalidate);
        setTimeout(invalidate, 300);
    });
})();
