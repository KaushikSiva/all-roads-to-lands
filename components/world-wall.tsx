"use client";

import { useAction, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { api } from "@/convex/_generated/api";
import { isConvexConfigured } from "./app-providers";
import { demoMapData } from "./demo-data";
import type { CityPoint, LiveMapData } from "./types";
import { WorldMap } from "./world-map";

export function WorldWall() {
  if (!isConvexConfigured) return <WallCanvas data={demoMapData} />;
  return <LiveWorldWall />;
}

function LiveWorldWall() {
  const live = useQuery(api.wall.getLiveMap);
  const enrichCity = useAction(api.jambase.enrichCity);
  const data = (live ?? demoMapData) as LiveMapData;

  function handleCitySelect(city: CityPoint) {
    if (!city.media && !city.jambaseCityId.startsWith("jambase:demo-")) {
      void enrichCity({ jambaseCityId: city.jambaseCityId });
    }
  }

  return <WallCanvas data={data} loading={!live} onCitySelect={handleCitySelect} />;
}

function WallCanvas({
  data,
  loading = false,
  onCitySelect,
}: {
  data: LiveMapData;
  loading?: boolean;
  onCitySelect?: (city: CityPoint) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>();
  const [showInvite, setShowInvite] = useState(false);
  const joinUrl = useSyncExternalStore(
    () => () => undefined,
    () => `${window.location.origin}/join`,
    () => "https://example.invalid/join",
  );

  const selected =
    data.cities.find((city) => city.jambaseCityId === selectedId) ?? data.latest ?? data.cities[0];
  const ranked = useMemo(() => [...data.cities].sort((a, b) => b.count - a.count), [data.cities]);

  function select(city: CityPoint) {
    setSelectedId(city.jambaseCityId);
    onCitySelect?.(city);
  }

  return (
    <main className="wall-shell">
      <div className="fog fog-one" aria-hidden="true" />
      <div className="fog fog-two" aria-hidden="true" />

      <header className="wall-header">
        <Link href="/" prefetch={false} className="wordmark" aria-label="All Roads Lead to the Lands">
          <span className="brand-orbit" />
          <span>ALL ROADS</span>
          <span className="brand-light">TO THE LANDS</span>
        </Link>
        <div className="header-context">
          <span>OUTSIDE LANDS · SAN FRANCISCO</span>
          <span>AUG 7–9, 2026</span>
        </div>
        <button className="join-trigger" onClick={() => setShowInvite(true)}>
          Add your city <span aria-hidden="true">↗</span>
        </button>
      </header>

      <section className="map-stage" aria-label="Live map of traveler origin cities">
        <div className="map-copy">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            One festival. A whole world arriving.
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            Where did you<br />
            <em>travel from?</em>
          </motion.h1>
        </div>

        <div className="map-canvas">
          <WorldMap cities={ranked} selected={selected} onSelect={select} />
        </div>

        <aside className="ranking" aria-label="Top origin cities">
          <div className="ranking-heading">
            <span>ARRIVING FROM</span>
            <span>LIVE RANK</span>
          </div>
          <ol>
            {ranked.slice(0, 6).map((city, index) => (
              <motion.li
                layout
                key={city.jambaseCityId}
                className={city.jambaseCityId === selected?.jambaseCityId ? "active" : ""}
                onClick={() => select(city)}
              >
                <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="rank-city">
                  {city.name}
                  <small>{city.countryCode}</small>
                </span>
                <motion.strong key={city.count} initial={{ opacity: 0.2, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  {city.count.toLocaleString()}
                </motion.strong>
              </motion.li>
            ))}
          </ol>
        </aside>

        <div className="selected-city" aria-live="polite">
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.jambaseCityId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <span>{data.latest?.jambaseCityId === selected.jambaseCityId ? "LATEST ARRIVAL" : "SELECTED CITY"}</span>
                <strong>{selected.name}</strong>
                <p>
                  {selected.distanceMiles.toLocaleString()} miles to the Lands · {selected.count.toLocaleString()} travelers
                </p>
                {selected.media && (
                  <a href={selected.media.eventUrl} target="_blank" rel="nofollow noopener noreferrer">
                    Now playing there: {selected.media.eventName} ↗
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="stats-ribbon" aria-label="Global participation totals">
        <Stat value={data.stats.travelers} label="travelers mapped" />
        <Stat value={data.stats.cityCount} label="cities in motion" />
        <Stat value={data.stats.countryCount} label="countries connected" />
        <Stat value={data.stats.totalDistanceMiles} label="collective miles" compact />
        <div className="data-status">
          <span className={loading ? "status-dot loading" : "status-dot"} />
          {loading ? "Connecting" : data.mode === "live" ? "Convex live" : "Presentation data"}
        </div>
      </section>

      {selected?.media && (
        <motion.div
          key={selected.media.imageUrl}
          className="media-wash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.22 }}
          style={{ backgroundImage: `url(${selected.media.imageUrl})` }}
          aria-hidden="true"
        />
      )}

      <footer className="wall-footer">
        <span>UNOFFICIAL COMMUNITY EXPERIMENT</span>
        <span>City + live music data by <a href="https://www.jambase.com" target="_blank" rel="nofollow noopener noreferrer">JamBase ↗</a></span>
      </footer>

      <AnimatePresence>
        {showInvite && (
          <motion.div
            className="invite-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInvite(false)}
          >
            <motion.div
              className="invite-sheet"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button className="close-invite" onClick={() => setShowInvite(false)} aria-label="Close">
                ×
              </button>
              <span className="invite-kicker">YOUR JOURNEY STARTS HERE</span>
              <h2>Put your city<br />on the map.</h2>
              <QRCodeSVG value={joinUrl} size={184} bgColor="#f4efdf" fgColor="#11120f" level="M" />
              <p>Scan to add your origin. The wall updates the moment you arrive.</p>
              <Link
                href="/join"
                prefetch={false}
                onClick={(event) => {
                  event.preventDefault();
                  window.location.assign("/join");
                }}
                className="invite-link"
              >
                Or add it on this screen →
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Stat({ value, label, compact = false }: { value: number; label: string; compact?: boolean }) {
  const displayed = compact && value > 999_999 ? `${(value / 1_000_000).toFixed(1)}M` : value.toLocaleString();
  return (
    <div className="stat-item">
      <motion.strong key={displayed} initial={{ opacity: 0.25, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        {displayed}
      </motion.strong>
      <span>{label}</span>
    </div>
  );
}
