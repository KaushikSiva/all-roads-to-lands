"use client";

import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-110m.json";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { CityPoint } from "./types";

const WIDTH = 920;
const HEIGHT = 560;
const SAN_FRANCISCO: [number, number] = [-122.4194, 37.7749];

type Props = {
  cities: CityPoint[];
  selected?: CityPoint;
  onSelect: (city: CityPoint) => void;
};

export function WorldMap({ cities, selected, onSelect }: Props) {
  const projection = geoEqualEarth().translate([WIDTH / 2, HEIGHT / 2]).scale(172).center([2, 3]);
  const path = geoPath(projection);
  const topology = countriesTopology as unknown as Topology;
  const countries = feature(
    topology,
    topology.objects.countries as GeometryCollection,
  );
  const sanFranciscoPoint = projection(SAN_FRANCISCO) ?? [0, 0];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="World map of traveler origin cities">
      <defs>
        <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="world-geographies">
        {countries.features.map((country, index) => (
          <path key={String(country.id ?? index)} d={path(country) ?? undefined} />
        ))}
      </g>

      <g className="world-routes">
        {cities.slice(0, 18).map((city, index) => {
          const route = {
            type: "LineString" as const,
            coordinates: [[city.longitude, city.latitude], SAN_FRANCISCO],
          };
          const active = city.jambaseCityId === selected?.jambaseCityId;
          return (
            <path
              key={`route-${city.jambaseCityId}`}
              d={path(route) ?? undefined}
              className={`travel-route${active ? " active" : ""}`}
              style={{ animationDelay: `${index * 70}ms` }}
              filter={active ? "url(#routeGlow)" : undefined}
            />
          );
        })}
      </g>

      <g className="world-markers">
        {cities.slice(0, 30).map((city) => {
          const point = projection([city.longitude, city.latitude]);
          if (!point) return null;
          const active = city.jambaseCityId === selected?.jambaseCityId;
          const radius = Math.max(2.2, Math.min(6, 2 + Math.sqrt(city.count) / 3));
          return (
            <g
              key={city.jambaseCityId}
              transform={`translate(${point[0]}, ${point[1]})`}
              role="button"
              tabIndex={0}
              aria-label={`${city.name}: ${city.count} travelers`}
              onClick={() => onSelect(city)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelect(city);
              }}
              className="map-marker-group"
            >
              {active && <circle r={radius + 7} className="marker-ripple" />}
              <circle r={active ? radius + 1.5 : radius} className={`city-marker${active ? " active" : ""}`} />
            </g>
          );
        })}
      </g>

      <g transform={`translate(${sanFranciscoPoint[0]}, ${sanFranciscoPoint[1]})`}>
        <circle r={13} className="sf-pulse" />
        <circle r={4.8} className="sf-core" filter="url(#routeGlow)" />
        <text x={11} y={4} className="sf-label">SAN FRANCISCO</text>
      </g>
    </svg>
  );
}
