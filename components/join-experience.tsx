"use client";

import { useAction, useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { isConvexConfigured } from "./app-providers";
import { demoCandidates } from "./demo-data";
import { demoArtists, outsideLands2026Featured, outsideLands2026Lineup } from "./lineup-data";
import type { ArtistCandidate, CityCandidate } from "./types";

type JoinStep = "city" | "artist" | "success";

function searchableName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/ł/g, "l");
}

export function JoinExperience() {
  if (!isConvexConfigured) return <DemoJoin />;
  return <LiveJoin />;
}

function LiveJoin() {
  const searchCities = useAction(api.jambase.searchCities);
  const resolveLineupArtist = useAction(api.jambase.resolveLineupArtist);
  const enrichCity = useAction(api.jambase.enrichCity);
  const submitJourney = useMutation(api.wall.submitJourney);
  const [step, setStep] = useState<JoinStep>("city");
  const [cityQuery, setCityQuery] = useState("");
  const [results, setResults] = useState<CityCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityCandidate | null>(null);
  const [artistQuery, setArtistQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<ArtistCandidate | null>(null);
  const [resolvingArtist, setResolvingArtist] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [participantId] = useState(() => {
    if (typeof window === "undefined") return "";
    const stored = window.localStorage.getItem("roads-participant-id");
    const id = stored || window.crypto.randomUUID();
    window.localStorage.setItem("roads-participant-id", id);
    return id;
  });

  useEffect(() => {
    if (cityQuery.trim().length < 2 || selectedCity || step !== "city") return;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const cities = await searchCities({ query: cityQuery.trim() });
        setResults(cities as CityCandidate[]);
      } catch {
        setError("City search is taking a fog break. Try again in a moment.");
      } finally {
        setSearching(false);
      }
    }, 320);
    return () => window.clearTimeout(timer);
  }, [cityQuery, selectedCity, searchCities, step]);

  async function selectArtist(name: string) {
    setArtistQuery(name);
    setSelectedArtist(null);
    setResolvingArtist(true);
    setError("");
    try {
      const artist = await resolveLineupArtist({ name });
      setSelectedArtist(artist as ArtistCandidate);
    } catch {
      setError("That artist record missed the beat. Choose another lineup artist.");
    } finally {
      setResolvingArtist(false);
    }
  }

  async function submit() {
    if (!selectedCity || !selectedArtist || !participantId) return;
    setSubmitting(true);
    setError("");
    try {
      await submitJourney({ participantId, city: selectedCity, artist: selectedArtist });
      setStep("success");
      void enrichCity({ jambaseCityId: selectedCity.jambaseCityId });
    } catch {
      setError("We couldn’t send that journey to the wall. Please try once more.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("city");
    setCityQuery("");
    setResults([]);
    setSelectedCity(null);
    setArtistQuery("");
    setSelectedArtist(null);
    setError("");
  }

  return (
    <JoinLayout
      step={step}
      cityQuery={cityQuery}
      setCityQuery={(value) => {
        setCityQuery(value);
        setSelectedCity(null);
        setResults([]);
      }}
      results={results}
      searching={searching}
      selectedCity={selectedCity}
      setSelectedCity={(city) => {
        setSelectedCity(city);
        setCityQuery(city.name);
        setResults([]);
      }}
      onContinue={() => selectedCity && setStep("artist")}
      artistQuery={artistQuery}
      setArtistQuery={(value) => {
        setArtistQuery(value);
        setSelectedArtist(null);
      }}
      selectedArtist={selectedArtist}
      onArtistSelect={selectArtist}
      resolvingArtist={resolvingArtist}
      submitting={submitting}
      error={error}
      onBack={() => {
        setStep("city");
        setError("");
      }}
      onSubmit={submit}
      onReset={reset}
    />
  );
}

function DemoJoin() {
  const [step, setStep] = useState<JoinStep>("city");
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityCandidate | null>(null);
  const [artistQuery, setArtistQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<ArtistCandidate | null>(null);
  const results = useMemo(
    () => cityQuery.length < 2 || selectedCity
      ? []
      : demoCandidates.filter((city) => `${city.name} ${city.countryCode}`.toLowerCase().includes(cityQuery.toLowerCase())),
    [cityQuery, selectedCity],
  );

  function reset() {
    setStep("city");
    setCityQuery("");
    setSelectedCity(null);
    setArtistQuery("");
    setSelectedArtist(null);
  }

  return (
    <JoinLayout
      step={step}
      cityQuery={cityQuery}
      setCityQuery={(value) => {
        setCityQuery(value);
        setSelectedCity(null);
      }}
      results={results}
      searching={false}
      selectedCity={selectedCity}
      setSelectedCity={(city) => {
        setSelectedCity(city);
        setCityQuery(city.name);
      }}
      onContinue={() => selectedCity && setStep("artist")}
      artistQuery={artistQuery}
      setArtistQuery={(value) => {
        setArtistQuery(value);
        setSelectedArtist(null);
      }}
      selectedArtist={selectedArtist}
      onArtistSelect={(name) => {
        setArtistQuery(name);
        setSelectedArtist(demoArtists.find((artist) => artist.name === name) ?? null);
      }}
      resolvingArtist={false}
      submitting={false}
      error=""
      onBack={() => setStep("city")}
      onSubmit={() => setStep("success")}
      onReset={reset}
      demo
    />
  );
}

type JoinLayoutProps = {
  step: JoinStep;
  cityQuery: string;
  setCityQuery: (value: string) => void;
  results: CityCandidate[];
  searching: boolean;
  selectedCity: CityCandidate | null;
  setSelectedCity: (city: CityCandidate) => void;
  onContinue: () => void;
  artistQuery: string;
  setArtistQuery: (value: string) => void;
  selectedArtist: ArtistCandidate | null;
  onArtistSelect: (name: string) => void;
  resolvingArtist: boolean;
  submitting: boolean;
  error: string;
  onBack: () => void;
  onSubmit: () => void;
  onReset: () => void;
  demo?: boolean;
};

function JoinLayout(props: JoinLayoutProps) {
  const artistMatches = useMemo(() => {
    const query = searchableName(props.artistQuery.trim());
    const choices = query
      ? outsideLands2026Lineup.filter((name) => searchableName(name).includes(query))
      : outsideLands2026Featured;
    return choices.slice(0, 12);
  }, [props.artistQuery]);

  return (
    <main className="join-page">
      <div className="join-sun" aria-hidden="true" />
      {props.selectedArtist?.imageUrl && (
        <motion.div
          className="artist-photo-wash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.22 }}
          style={{ backgroundImage: `url(${props.selectedArtist.imageUrl})` }}
          aria-hidden="true"
        />
      )}
      <nav className="join-nav">
        <WallLink className="wordmark">
          <span className="brand-orbit" />
          <span>ALL ROADS</span>
          <span className="brand-light">TO THE LANDS</span>
        </WallLink>
        <WallLink className="back-link">View live wall ↗</WallLink>
      </nav>

      <section className="join-content">
        <AnimatePresence mode="wait">
          {props.step === "city" && (
            <motion.div
              key="city"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="join-form"
            >
              <StepLabel current="01" label="YOUR JOURNEY TO GOLDEN GATE PARK" />
              <h1>Where are you<br />traveling from?</h1>
              <p className="join-intro">Choose the city your trip began in. No GPS, account, or precise location required.</p>

              <div className="city-search">
                <label htmlFor="city">Origin city</label>
                <input
                  id="city"
                  value={props.cityQuery}
                  onChange={(event) => props.setCityQuery(event.target.value)}
                  placeholder="Start typing a city…"
                  autoComplete="off"
                />
                {props.searching && <span className="search-state">Searching JamBase…</span>}
                {props.results.length > 0 && (
                  <ul className="search-results">
                    {props.results.map((city) => (
                      <li key={city.jambaseCityId}>
                        <button onClick={() => props.setSelectedCity(city)}>
                          <span>{city.name}</span>
                          <small>{[city.region, city.countryCode].filter(Boolean).join(" · ")}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {props.selectedCity && (
                <motion.div className="selection-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span>ROUTE LOCKED</span>
                  <strong>{props.selectedCity.name} → San Francisco</strong>
                </motion.div>
              )}
              {props.error && <p className="form-error" role="alert">{props.error}</p>}
              {props.demo && <p className="demo-note">Preview mode: connect Convex to make picks live.</p>}
              <button className="submit-city" disabled={!props.selectedCity} onClick={props.onContinue}>
                Continue to the lineup <span>02 →</span>
              </button>
            </motion.div>
          )}

          {props.step === "artist" && (
            <motion.div
              key="artist"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="join-form artist-step"
            >
              <StepLabel current="02" label={`${props.selectedCity?.name ?? "YOUR CITY"} IS ON THE ROUTE`} />
              <h1>Who can’t you<br /><em>miss?</em></h1>
              <p className="join-intro">Pick one artist from the 2026 Outside Lands lineup.</p>
              <div className="city-search artist-search">
                <label htmlFor="artist">Lineup artist</label>
                <input
                  id="artist"
                  value={props.artistQuery}
                  onChange={(event) => props.setArtistQuery(event.target.value)}
                  placeholder="Search the lineup…"
                  autoComplete="off"
                />
                {props.resolvingArtist && <span className="search-state">Finding the beat…</span>}
              </div>

              {!props.selectedArtist && (
                <motion.ol className="lineup-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {artistMatches.map((name, index) => (
                    <li key={name}>
                      <button onClick={() => props.onArtistSelect(name)} disabled={props.resolvingArtist}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{name}</strong>
                        <i>＋</i>
                      </button>
                    </li>
                  ))}
                </motion.ol>
              )}

              {props.selectedArtist && (
                <motion.div
                  className="artist-lock"
                  initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                  animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} />
                  <small>FAN PICK LOCKED</small>
                  <strong>{props.selectedArtist.name}</strong>
                  <button onClick={() => props.setArtistQuery("")}>Change</button>
                </motion.div>
              )}
              {props.error && <p className="form-error" role="alert">{props.error}</p>}
              <button
                className="submit-city"
                disabled={!props.selectedArtist || props.submitting}
                onClick={props.onSubmit}
              >
                {props.submitting ? "Sending your signal…" : "Send both to the wall"}<span>→</span>
              </button>
              <button className="change-city" onClick={props.onBack}>← Back to city</button>
            </motion.div>
          )}

          {props.step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              className="join-success"
            >
              <motion.div
                className="success-route"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
              <p className="eyebrow">YOUR ROUTE + SOUND ARE LIVE</p>
              <h1>{props.selectedCity?.name}<br /><em>for {props.selectedArtist?.name}.</em></h1>
              <p>Your journey and fan pick just pulsed across the live wall.</p>
              <WallLink className="submit-city">Watch it land <span>↗</span></WallLink>
              <button className="change-city" onClick={props.onReset}>Choose again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <footer className="join-footer">
        <span>AN UNOFFICIAL OUTSIDE LANDS COMMUNITY MAP</span>
        <span>City + artist data by JamBase · Live state by Convex</span>
      </footer>
    </main>
  );
}

function StepLabel({ current, label }: { current: string; label: string }) {
  return <p className="eyebrow step-label"><span>{current} / 02</span>{label}</p>;
}

function WallLink({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <Link
      href="/"
      prefetch={false}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign("/");
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
