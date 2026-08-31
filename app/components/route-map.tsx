"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crosshair,
  Layers3,
  MapPinned,
  Navigation,
  Route,
  Sparkles,
  Truck,
} from "lucide-react";
import { AppState, RouteRecord } from "@/app/lib/seed";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

const palette = [
  "#f97316",
  "#7c3aed",
  "#0284c7",
  "#16a34a",
  "#db2777",
  "#ca8a04",
];
const mapStyles = {
  clean: {
    label: "Claro elegante",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  streets: {
    label: "Ruas detalhadas",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  dark: {
    label: "Noturno roxo",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
} as const;

function hash(value: string) {
  return [...value].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    7,
  );
}

function fallbackCoordinate(row: RouteRecord, index: number): [number, number] {
  const seed = hash(`${row.id}-${row.client}-${index}`);
  const angle = ((seed % 360) * Math.PI) / 180;
  const distance = 0.018 + ((seed >> 8) % 70) / 2200;
  return [
    -23.2237 + Math.sin(angle) * distance,
    -45.9009 + Math.cos(angle) * distance,
  ];
}

function routeLabel(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function routeKey(row?: RouteRecord) {
  if (!row) return "all";
  return [
    row.base || "sem-base",
    row.driver || "Sem motorista",
    row.trip || row.batch || "Viagem principal",
  ].join("|");
}

function minutesFromClock(value?: string) {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function routeMetric(rows: RouteRecord[]) {
  const ordered = [...rows].sort(
    (a, b) =>
      (a.order || minutesFromClock(a.time) || 0) -
      (b.order || minutesFromClock(b.time) || 0),
  );
  const departure = ordered[0]?.time || "—";
  const arrival = ordered.at(-1)?.time || "—";
  const startMinutes = minutesFromClock(departure);
  let endMinutes = minutesFromClock(arrival);
  if (startMinutes !== null && endMinutes !== null && endMinutes < startMinutes)
    endMinutes += 24 * 60;
  const duration =
    startMinutes !== null && endMinutes !== null
      ? Math.max(20, endMinutes - startMinutes)
      : Math.max(20, ordered.length * 9);
  const drivingMinutes = Math.max(
    15,
    duration - Math.max(0, ordered.length - 1) * 4,
  );
  const distance = Math.max(4, Math.round((drivingMinutes / 60) * 28));
  return {
    departure,
    arrival,
    duration,
    distance,
    stops: ordered.length,
    ordered,
  };
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${String(rest).padStart(2, "0")}min` : `${rest}min`;
}

export function RouteMap({ state }: { state: AppState }) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const [planId, setPlanId] = useState(() => routeKey(state.routes[0]));
  const [mapStyle, setMapStyle] = useState<keyof typeof mapStyles>("clean");
  const [selectedStop, setSelectedStop] = useState<RouteRecord | null>(null);
  const routeGroups = useMemo(() => {
    const keys = [...new Set(state.routes.map(routeKey))];
    const bases = [
      ...new Set(state.routes.map((row) => row.base || "sem-base")),
    ];
    return keys.map((key, index) => {
      const rows = state.routes.filter((row) => routeKey(row) === key);
      const [base, driver, trip] = key.split("|");
      const baseIndex = bases.indexOf(base);
      return {
        key,
        label: `${driver} · ${trip}`,
        base: routeLabel(base),
        color:
          state.routePlans[baseIndex]?.color ||
          palette[baseIndex % palette.length] ||
          palette[index % palette.length],
        metric: routeMetric(rows),
      };
    });
  }, [state.routePlans, state.routes]);
  const visibleRows = useMemo(() => {
    if (planId === "all") {
      return routeGroups.flatMap((group) =>
        state.routes.filter((row) => routeKey(row) === group.key).slice(0, 5),
      );
    }
    return state.routes.filter((row) => routeKey(row) === planId).slice(0, 100);
  }, [planId, routeGroups, state.routes]);
  const currentMetric = useMemo(() => routeMetric(visibleRows), [visibleRows]);
  const selectedPosition = selectedStop
    ? currentMetric.ordered.findIndex((row) => row.id === selectedStop.id) + 1
    : 0;

  useEffect(() => {
    let cancelled = false;
    async function renderMap() {
      if (!mapElement.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapElement.current) return;
      mapInstance.current?.remove();
      const map = L.map(mapElement.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([-23.2237, -45.9009], 11);
      mapInstance.current = map;
      const tiles = mapStyles[mapStyle];
      L.tileLayer(tiles.url, {
        attribution: tiles.attribution,
        maxZoom: 19,
      }).addTo(map);
      const grouped = new Map<
        string,
        Array<{ row: RouteRecord; point: [number, number] }>
      >();
      visibleRows.forEach((row, index) => {
        const group = routeKey(row);
        const point: [number, number] =
          typeof row.latitude === "number" && typeof row.longitude === "number"
            ? [row.latitude, row.longitude]
            : fallbackCoordinate(row, index);
        grouped.set(group, [...(grouped.get(group) || []), { row, point }]);
      });
      const bounds: [number, number][] = [];
      [...grouped.entries()].forEach(([group, points], groupIndex) => {
        const color =
          routeGroups.find((routeGroup) => routeGroup.key === group)?.color ||
          palette[groupIndex % palette.length];
        const sorted = points.sort(
          (a, b) => (a.row.order || 0) - (b.row.order || 0),
        );
        const coordinates = sorted.map((item) => item.point);
        bounds.push(...coordinates);
        if (coordinates.length > 1)
          L.polyline(coordinates, {
            color,
            weight: 4,
            opacity: 0.72,
            dashArray: "9 7",
          }).addTo(map);
        sorted.forEach(({ row, point }, pointIndex) => {
          const marker = L.marker(point, {
            icon: L.divIcon({
              className: "route-leaflet-marker-wrap",
              html: `<span class="route-leaflet-marker" style="--marker:${color}"><b>${pointIndex + 1}</b></span>`,
              iconSize: [34, 34],
              iconAnchor: [17, 17],
            }),
          }).addTo(map);
          const groupLabel =
            routeGroups.find((routeGroup) => routeGroup.key === group)?.label ||
            routeLabel(group);
          marker.bindTooltip(`${row.client} · ${groupLabel}`, {
            direction: "top",
          });
          marker.on("click", () => setSelectedStop(row));
        });
      });
      if (bounds.length)
        map.fitBounds(bounds, { padding: [38, 38], maxZoom: 14 });
      setTimeout(() => map.invalidateSize(), 80);
    }
    renderMap();
    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [mapStyle, routeGroups, visibleRows]);

  return (
    <div className="route-map-layout">
      <Card className="route-map-sidebar">
        <CardHeader>
          <div className="map-title-icon">
            <MapPinned />
          </div>
          <CardTitle>Mapa de distribuição</CardTitle>
          <CardDescription>
            Entregas de pães, congelados e produção organizadas em rotas
            personalizadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="map-style-control">
            <span>
              <Layers3 /> Estilo do mapa
            </span>
            <div>
              {(Object.keys(mapStyles) as Array<keyof typeof mapStyles>).map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    className={mapStyle === key ? "active" : ""}
                    onClick={() => setMapStyle(key)}
                  >
                    {mapStyles[key].label}
                  </button>
                ),
              )}
            </div>
          </div>
          <NativeSelect
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
          >
            <NativeSelectOption value="all">Todas as rotas</NativeSelectOption>
            {routeGroups.map((group) => (
              <NativeSelectOption key={group.key} value={group.key}>
                {group.base} · {group.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <div className="map-trip-summary">
            <div>
              <Navigation />
              <span>
                <small>Distância estimada</small>
                <strong>{currentMetric.distance} km</strong>
              </span>
            </div>
            <div>
              <Crosshair />
              <span>
                <small>Tempo de percurso</small>
                <strong>{durationLabel(currentMetric.duration)}</strong>
              </span>
            </div>
            <div>
              <MapPinned />
              <span>
                <small>Paradas exibidas</small>
                <strong>{currentMetric.stops}</strong>
              </span>
            </div>
            <div>
              <Truck />
              <span>
                <small>Saída → chegada</small>
                <strong>
                  {currentMetric.departure} → {currentMetric.arrival}
                </strong>
              </span>
            </div>
          </div>
          <div className="map-route-legend">
            {routeGroups.map((group) => (
              <button
                type="button"
                key={group.key}
                onClick={() => setPlanId(group.key)}
                className={planId === group.key ? "active" : ""}
              >
                <i style={{ background: group.color }} />
                <span>
                  <strong>{group.label}</strong>
                  <small>
                    {group.base} · {group.metric.stops} paradas ·{" "}
                    {group.metric.distance} km ·{" "}
                    {durationLabel(group.metric.duration)}
                  </small>
                </span>
                <Route />
              </button>
            ))}
          </div>
          <div className="map-note">
            <Crosshair />
            <span>
              <strong>Coordenadas reais quando cadastradas</strong>
              <small>
                Paradas ainda sem latitude/longitude aparecem em posição
                estimada até completar o endereço.
              </small>
            </span>
          </div>
          <div className="map-beauty-note">
            <Sparkles />
            <span>
              As cores podem ser alteradas em{" "}
              <strong>Rotas → Editar → Cor da rota</strong>.
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className="route-live-map-card">
        <CardContent>
          <div
            ref={mapElement}
            className={`route-live-map map-style-${mapStyle}`}
          />
        </CardContent>
      </Card>
      {selectedStop && (
        <aside className="map-stop-detail">
          <button onClick={() => setSelectedStop(null)} aria-label="Fechar">
            ×
          </button>
          <MapPinned />
          <span>
            <small>
              PARADA {selectedPosition || "—"} DE {currentMetric.stops}
            </small>
            <h3>{selectedStop.client}</h3>
            <p>{selectedStop.address || "Endereço ainda não informado"}</p>
            <div>
              <em>
                <Route /> {routeLabel(selectedStop.base || "sem rota")} ·{" "}
                {selectedStop.driver || "Motorista a definir"}
              </em>
              <em>
                <Truck /> {selectedStop.driver || "Motorista a definir"}
              </em>
              <em>
                <Navigation /> Previsão {selectedStop.time || "a definir"}
              </em>
              <em>
                <Crosshair />{" "}
                {selectedStop.trip || selectedStop.batch || "Viagem principal"}
              </em>
            </div>
          </span>
        </aside>
      )}
    </div>
  );
}
