import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import NavigatorService from '../API/NavigatorService';
import { loadLeaflet, TYPE_COLORS, DEFAULT_TYPE_COLOR } from '../leafletLoader';
import NavigatorFilters from '../components/NavigatorFilters';
import OrganizationCard from '../components/OrganizationCard';
import cl from './NavigatorPage.module.css';

// Центр и зум по умолчанию — Хабаровский край.
const KRAI_CENTER = [50.5, 137.0];
const KRAI_ZOOM = 5;

const NavigatorPage = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersLayerRef = useRef(null);
    const didFitRef = useRef(false);

    const [mapError, setMapError] = useState('');

    // Справочники для фильтров
    const [types, setTypes] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [directions, setDirections] = useState([]);

    // Состояние фильтров
    const [activeType, setActiveType] = useState('');
    const [activeIndustries, setActiveIndustries] = useState([]);
    const [activeDirections, setActiveDirections] = useState([]);
    const [search, setSearch] = useState('');

    // Данные карты
    const [organizations, setOrganizations] = useState([]);

    // Выбранная метка (карточка)
    const [selectedSlug, setSelectedSlug] = useState(null);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [loadingCard, setLoadingCard] = useState(false);

    // --- Инициализация карты + загрузка справочников ---
    useEffect(() => {
        let cancelled = false;

        loadLeaflet()
            .then((L) => {
                if (cancelled || !mapContainerRef.current || mapRef.current) return;
                const map = L.map(mapContainerRef.current, {
                    center: KRAI_CENTER,
                    zoom: KRAI_ZOOM,
                    scrollWheelZoom: true,
                });
                // Убираем дефолтный префикс Leaflet (с флагом), оставляем только © OSM.
                map.attributionControl.setPrefix(false);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap',
                    maxZoom: 18,
                }).addTo(map);
                markersLayerRef.current = L.layerGroup().addTo(map);
                mapRef.current = map;
            })
            .catch(() => {
                if (!cancelled) setMapError('Не удалось загрузить карту. Проверьте подключение к интернету.');
            });

        Promise.all([
            NavigatorService.getTypes().then((r) => setTypes(r.data || [])).catch(() => {}),
            NavigatorService.getIndustries().then((r) => setIndustries(r.data || [])).catch(() => {}),
            NavigatorService.getDirections().then((r) => setDirections(r.data || [])).catch(() => {}),
        ]);

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // --- Загрузка меток при изменении фильтров (с дебаунсом для поиска) ---
    useEffect(() => {
        const handle = setTimeout(() => {
            NavigatorService.getOrganizations({
                type: activeType,
                industry: activeIndustries,
                direction: activeDirections,
                search,
            })
                .then((r) => {
                    const data = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
                    setOrganizations(data);
                })
                .catch(() => setOrganizations([]));
        }, 300);
        return () => clearTimeout(handle);
    }, [activeType, activeIndustries, activeDirections, search]);

    // --- Перерисовка меток на карте ---
    useEffect(() => {
        const L = window.L;
        const layer = markersLayerRef.current;
        if (!L || !layer) return;

        layer.clearLayers();

        organizations.forEach((org) => {
            const lat = Number(org.latitude);
            const lng = Number(org.longitude);
            if (Number.isNaN(lat) || Number.isNaN(lng)) return;

            const color = TYPE_COLORS[org.org_type] || DEFAULT_TYPE_COLOR;
            const marker = L.circleMarker([lat, lng], {
                radius: 9,
                color: '#ffffff',
                weight: 2,
                fillColor: color,
                fillOpacity: 1,
            });
            const vac = org.vacancies_count > 0 ? ` · вакансий: ${org.vacancies_count}` : '';
            marker.bindTooltip(`${org.name}${vac}`);
            marker.on('click', () => setSelectedSlug(org.slug));
            marker.addTo(layer);
        });

        // Один раз подгоняем масштаб под метки.
        if (!didFitRef.current && organizations.length > 0 && mapRef.current) {
            const pts = organizations
                .map((o) => [Number(o.latitude), Number(o.longitude)])
                .filter(([a, b]) => !Number.isNaN(a) && !Number.isNaN(b));
            if (pts.length > 0) {
                mapRef.current.fitBounds(pts, { padding: [50, 50], maxZoom: 9 });
                didFitRef.current = true;
            }
        }
    }, [organizations]);

    // --- Загрузка карточки выбранной метки ---
    useEffect(() => {
        if (!selectedSlug) {
            setSelectedOrg(null);
            return;
        }
        let cancelled = false;
        setLoadingCard(true);
        NavigatorService.getOrganization(selectedSlug)
            .then((r) => { if (!cancelled) setSelectedOrg(r.data); })
            .catch(() => { if (!cancelled) setSelectedOrg(null); })
            .finally(() => { if (!cancelled) setLoadingCard(false); });
        return () => { cancelled = true; };
    }, [selectedSlug]);

    const toggleIndustry = useCallback((slug) => {
        setActiveIndustries((prev) =>
            prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
        );
    }, []);

    const toggleDirection = useCallback((slug) => {
        setActiveDirections((prev) =>
            prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
        );
    }, []);

    const resetFilters = useCallback(() => {
        setActiveType('');
        setActiveIndustries([]);
        setActiveDirections([]);
        setSearch('');
    }, []);

    const closeCard = useCallback(() => setSelectedSlug(null), []);

    return (
        <div className={cl.page}>
            <Helmet>
                <title>Профориентационный навигатор — карта Хабаровского края</title>
            </Helmet>

            <NavigatorFilters
                types={types}
                industries={industries}
                directions={directions}
                activeType={activeType}
                activeIndustries={activeIndustries}
                activeDirections={activeDirections}
                search={search}
                onTypeChange={setActiveType}
                onToggleIndustry={toggleIndustry}
                onToggleDirection={toggleDirection}
                onSearchChange={setSearch}
                onReset={resetFilters}
                total={organizations.length}
            />

            <div className={cl.mapWrap}>
                {mapError ? (
                    <div className={cl.mapError}>{mapError}</div>
                ) : (
                    <div ref={mapContainerRef} className={cl.map} />
                )}

                {(selectedOrg || loadingCard) && (
                    <OrganizationCard org={selectedOrg} loading={loadingCard} onClose={closeCard} />
                )}
            </div>
        </div>
    );
};

export default NavigatorPage;
