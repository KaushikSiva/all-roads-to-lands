#!/usr/bin/env python3
"""Inspect and export JamBase city + representative concert media.

The production application talks to JamBase from Convex. This utility gives
operators a Python path for validating credentials, inspecting normalized city
records, or creating a JSON snapshot before a live demo.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path
from typing import Any

API_ROOT = "https://api.data.jambase.com/v3"


class JamBaseError(RuntimeError):
    """Raised when JamBase returns an unsuccessful response."""


def request_json(path: str, api_key: str) -> dict[str, Any]:
    request = urllib.request.Request(
        f"{API_ROOT}{path}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "User-Agent": "AllRoadsToTheLands-Python/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise JamBaseError(f"JamBase returned HTTP {error.code}") from error
    except urllib.error.URLError as error:
        raise JamBaseError(f"Could not reach JamBase: {error.reason}") from error


def normalize_city(city: dict[str, Any]) -> dict[str, Any] | None:
    geo = city.get("geo") or {}
    address = city.get("address") or {}
    region = address.get("addressRegion")
    if isinstance(region, dict):
        region = region.get("name") or region.get("identifier")
    required = (
        city.get("identifier"),
        city.get("name"),
        address.get("addressCountry"),
        geo.get("latitude"),
        geo.get("longitude"),
    )
    if any(value is None or value == "" for value in required):
        return None
    metro = city.get("containedInPlace") or {}
    return {
        "jambaseCityId": city["identifier"],
        "name": city["name"],
        "region": region,
        "countryCode": address["addressCountry"],
        "latitude": geo["latitude"],
        "longitude": geo["longitude"],
        "metroName": metro.get("name"),
        "upcomingEvents": city.get("x-numUpcomingEvents"),
    }


def extract_image(value: Any) -> str | None:
    if isinstance(value, str) and value.startswith("https://"):
        return value
    if isinstance(value, list):
        return next((url for item in value if (url := extract_image(item))), None)
    if isinstance(value, dict):
        return value.get("url") or value.get("contentUrl")
    return None


def representative_media(city_id: str, api_key: str) -> dict[str, str] | None:
    parameters = urllib.parse.urlencode(
        {"geoCityId": city_id, "eventDateFrom": date.today().isoformat(), "perPage": 20}
    )
    payload = request_json(f"/events?{parameters}", api_key)
    for event in payload.get("events", []):
        image = extract_image(event.get("image"))
        if not image or not event.get("name") or not event.get("url"):
            continue
        performers = event.get("performer") or []
        artist = performers[0].get("name") if performers else None
        return {
            "imageUrl": image,
            "eventName": event["name"],
            "eventUrl": event["url"],
            "artistName": artist,
        }
    return None


def find_city(name: str, country_code: str | None, api_key: str) -> dict[str, Any] | None:
    parameters: dict[str, str | int] = {"geoCityName": name, "perPage": 8}
    if country_code:
        parameters["geoCountryIso2"] = country_code.upper()
    payload = request_json(f"/geographies/cities?{urllib.parse.urlencode(parameters)}", api_key)
    normalized = [normalize_city(city) for city in payload.get("cities", [])]
    candidates = [city for city in normalized if city]
    exact = next((city for city in candidates if city["name"].casefold() == name.casefold()), None)
    return exact or (candidates[0] if candidates else None)


def build_snapshot(names: list[str], country_code: str | None, api_key: str) -> list[dict[str, Any]]:
    snapshot = []
    for name in names:
        city = find_city(name, country_code, api_key)
        if not city:
            print(f"warning: no JamBase city match for {name!r}", file=sys.stderr)
            continue
        city["media"] = representative_media(city["jambaseCityId"], api_key)
        snapshot.append(city)
    return snapshot


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cities", nargs="+", required=True, help="City names to inspect")
    parser.add_argument("--country", help="Optional ISO-2 country restriction")
    parser.add_argument("--output", type=Path, help="Write JSON to this path instead of stdout")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    api_key = os.environ.get("JAMBASE_API_KEY")
    if not api_key:
        print("JAMBASE_API_KEY is required", file=sys.stderr)
        return 2
    try:
        snapshot = build_snapshot(args.cities, args.country, api_key)
    except JamBaseError as error:
        print(str(error), file=sys.stderr)
        return 1
    serialized = json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized, encoding="utf-8")
        print(f"Wrote {len(snapshot)} cities to {args.output}")
    else:
        print(serialized, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
