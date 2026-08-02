"use client";

import { useAction, useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { isConvexConfigured } from "./app-providers";
import { demoCandidates } from "./demo-data";
import type { CityCandidate } from "./types";

export function JoinExperience() {
  if (!isConvexConfigured) return <DemoJoin />;
  return <LiveJoin />;
}

function LiveJoin() {
  const searchCities = useAction(api.jambase.searchCities);
  const enrichCity = useAction(api.jambase.enrichCity);
  const submitOrigin = useMutation(api.wall.submitOrigin);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CityCandidate | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [participantId] = useState(() => {
    if (typeof window === "undefined") return "";
    const stored = window.localStorage.getItem("roads-participant-id");
    const id = stored || window.crypto.randomUUID();
    window.localStorage.setItem("roads-participant-id", id);
    return id;
  });

  useEffect(() => {
    if (query.trim().length < 2 || selected) {
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const cities = await searchCities({ query: query.trim() });
        setResults(cities as CityCandidate[]);
      } catch {
        setError("City search is taking a fog break. Try again in a moment.");
      } finally {
        setSearching(false);
      }
    }, 320);
    return () => window.clearTimeout(timer);
  }, [query, selected, searchCities]);

  async function submit() {
    if (!selected || !participantId) return;
    setError("");
    try {
      await submitOrigin({ participantId, city: selected });
      setSubmitted(true);
      void enrichCity({ jambaseCityId: selected.jambaseCityId });
    } catch {
      setError("We couldn’t map that journey. Please try once more.");
    }
  }

  return (
    <JoinLayout
      query={query}
      setQuery={(value) => {
        setQuery(value);
        setSelected(null);
        setSubmitted(false);
      }}
      results={results}
      searching={searching}
      selected={selected}
      setSelected={(city) => {
        setSelected(city);
        setQuery(city.name);
        setResults([]);
      }}
      submitted={submitted}
      error={error}
      onSubmit={submit}
    />
  );
}

function DemoJoin() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CityCandidate | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const results = useMemo(
    () => query.length < 2 || selected
      ? []
      : demoCandidates.filter((city) => `${city.name} ${city.countryCode}`.toLowerCase().includes(query.toLowerCase())),
    [query, selected],
  );
  return (
    <JoinLayout
      query={query}
      setQuery={(value) => {
        setQuery(value);
        setSelected(null);
        setSubmitted(false);
      }}
      results={results}
      searching={false}
      selected={selected}
      setSelected={(city) => {
        setSelected(city);
        setQuery(city.name);
      }}
      submitted={submitted}
      error=""
      onSubmit={() => setSubmitted(true)}
      demo
    />
  );
}

type JoinLayoutProps = {
  query: string;
  setQuery: (value: string) => void;
  results: CityCandidate[];
  searching: boolean;
  selected: CityCandidate | null;
  setSelected: (city: CityCandidate) => void;
  submitted: boolean;
  error: string;
  onSubmit: () => void;
  demo?: boolean;
};

function JoinLayout(props: JoinLayoutProps) {
  return (
    <main className="join-page">
      <div className="join-sun" aria-hidden="true" />
      <nav className="join-nav">
        <Link href="/" className="wordmark">
          <span className="brand-orbit" />
          <span>ALL ROADS</span>
          <span className="brand-light">TO THE LANDS</span>
        </Link>
        <Link href="/" className="back-link">View live wall ↗</Link>
      </nav>

      <section className="join-content">
        <AnimatePresence mode="wait">
          {!props.submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="join-form"
            >
              <p className="eyebrow">YOUR JOURNEY TO GOLDEN GATE PARK</p>
              <h1>Where are you<br />traveling from?</h1>
              <p className="join-intro">Choose the city your trip began in. No GPS, account, or precise location required.</p>

              <div className="city-search">
                <label htmlFor="city">Origin city</label>
                <input
                  id="city"
                  value={props.query}
                  onChange={(event) => props.setQuery(event.target.value)}
                  placeholder="Start typing a city…"
                  autoComplete="off"
                  autoFocus
                />
                {props.searching && <span className="search-state">Searching JamBase…</span>}
                {props.results.length > 0 && (
                  <ul className="search-results">
                    {props.results.map((city) => (
                      <li key={city.jambaseCityId}>
                        <button onClick={() => props.setSelected(city)}>
                          <span>{city.name}</span>
                          <small>{[city.region, city.countryCode].filter(Boolean).join(" · ")}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {props.selected && (
                <motion.div className="selection-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span>DESTINATION LOCKED</span>
                  <strong>{props.selected.name} → San Francisco</strong>
                </motion.div>
              )}

              {props.error && <p className="form-error" role="alert">{props.error}</p>}
              {props.demo && <p className="demo-note">Preview mode: connect Convex to make submissions live.</p>}

              <button className="submit-city" disabled={!props.selected} onClick={props.onSubmit}>
                Send my city to the wall <span>→</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="join-success"
            >
              <motion.div
                className="success-route"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
              <p className="eyebrow">YOU’RE ON THE MAP</p>
              <h1>{props.selected?.name}<br /><em>is arriving.</em></h1>
              <p>Your route just lit up on the live wall.</p>
              <Link href="/" className="submit-city">Watch it land <span>↗</span></Link>
              <button className="change-city" onClick={() => props.setQuery("")}>Choose a different city</button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <footer className="join-footer">
        <span>AN UNOFFICIAL OUTSIDE LANDS COMMUNITY MAP</span>
        <span>City data by JamBase · Live state by Convex</span>
      </footer>
    </main>
  );
}
