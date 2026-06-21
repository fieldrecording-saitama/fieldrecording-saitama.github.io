#!/usr/bin/env python3
"""Export SoundCloud playlist metadata to JSON and CSV.

This script intentionally uses only the Python standard library so it can run
both locally and in GitHub Actions without dependency installation.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen


DEFAULT_PLAYLIST_URL = "https://soundcloud.com/livingroom-tapes/sets/field-recording-club-saitama"
DEFAULT_JSON_PATH = Path("data/soundcloud-playlist.json")
DEFAULT_CSV_PATH = Path("data/soundcloud-playlist.csv")
USER_AGENT = "fieldrecording-saitama-soundcloud-export/1.0"

CSV_FIELDS = [
    "position",
    "id",
    "urn",
    "title",
    "permalink_url",
    "description",
    "duration_ms",
    "duration",
    "created_at",
    "display_date",
    "last_modified",
    "artwork_url",
    "waveform_url",
    "genre",
    "tag_list",
    "license",
    "streamable",
    "embeddable_by",
    "playback_count",
    "likes_count",
    "comment_count",
    "user_id",
    "user_username",
    "user_permalink_url",
]


def fetch_text(url: str, timeout: int = 30) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(request, timeout=timeout) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return response.read().decode(charset, errors="replace")
    except HTTPError as error:
        raise RuntimeError(f"HTTP {error.code} while fetching {url}") from error
    except URLError as error:
        raise RuntimeError(f"Network error while fetching {url}: {error.reason}") from error


def extract_hydration(html_text: str) -> list[dict[str, Any]]:
    match = re.search(r"window\.__sc_hydration\s*=\s*(\[.*?\]);\s*</script>", html_text, re.S)
    if not match:
        raise RuntimeError("Could not find window.__sc_hydration in the SoundCloud page.")
    return json.loads(html.unescape(match.group(1)))


def find_playlist(hydration: list[dict[str, Any]]) -> dict[str, Any]:
    for item in hydration:
        data = item.get("data")
        if isinstance(data, dict) and data.get("kind") == "playlist":
            return data
    raise RuntimeError("Could not find playlist data in SoundCloud hydration payload.")


def extract_asset_urls(html_text: str, base_url: str) -> list[str]:
    urls = re.findall(r'<script[^>]+src="([^"]+\.js)"', html_text)
    return [urljoin(base_url, url) for url in urls]


def extract_client_id(html_text: str, playlist_url: str) -> str | None:
    patterns = [
        r'client_id\s*[:=]\s*"([A-Za-z0-9_-]{20,})"',
        r"client_id\s*[:=]\s*'([A-Za-z0-9_-]{20,})'",
        r"client_id=([A-Za-z0-9_-]{20,})",
        r"client_id%3D([A-Za-z0-9_-]{20,})",
        r'clientId\s*[:=]\s*"([A-Za-z0-9_-]{20,})"',
    ]

    for asset_url in extract_asset_urls(html_text, playlist_url):
        try:
            asset_text = fetch_text(asset_url)
        except RuntimeError:
            continue
        for pattern in patterns:
            match = re.search(pattern, asset_text)
            if match:
                return match.group(1)
    return None


def complete_playlist_from_api(
    playlist: dict[str, Any], playlist_url: str, client_id: str | None
) -> dict[str, Any]:
    if not client_id:
        return playlist

    endpoints = []
    playlist_id = playlist.get("id")
    if playlist_id:
        endpoints.append(
            f"https://api-v2.soundcloud.com/playlists/{playlist_id}?client_id={quote(client_id)}"
        )
    endpoints.append(
        "https://api-v2.soundcloud.com/resolve"
        f"?url={quote(playlist_url, safe='')}&client_id={quote(client_id)}"
    )

    for endpoint in endpoints:
        try:
            api_playlist = json.loads(fetch_text(endpoint))
        except (RuntimeError, json.JSONDecodeError):
            continue
        if isinstance(api_playlist, dict) and api_playlist.get("kind") == "playlist":
            if count_complete_tracks(api_playlist) >= count_complete_tracks(playlist):
                return fill_missing_tracks(api_playlist, client_id)
    return fill_missing_tracks(playlist, client_id)


def fill_missing_tracks(playlist: dict[str, Any], client_id: str | None) -> dict[str, Any]:
    if not client_id:
        return playlist

    tracks = playlist.get("tracks") or []
    missing_ids = [
        str(track.get("id"))
        for track in tracks
        if isinstance(track, dict) and track.get("id") and not track.get("title")
    ]
    if not missing_ids:
        return playlist

    detailed_tracks: dict[str, dict[str, Any]] = {}
    for start in range(0, len(missing_ids), 50):
        chunk = missing_ids[start : start + 50]
        endpoint = (
            "https://api-v2.soundcloud.com/tracks"
            f"?ids={quote(','.join(chunk))}&client_id={quote(client_id)}"
        )
        try:
            response = json.loads(fetch_text(endpoint))
        except (RuntimeError, json.JSONDecodeError):
            continue

        if isinstance(response, dict):
            response_tracks = response.get("collection") or response.get("tracks") or []
        else:
            response_tracks = response

        for track in response_tracks:
            if isinstance(track, dict) and track.get("id"):
                detailed_tracks[str(track["id"])] = track

    if not detailed_tracks:
        return playlist

    playlist = dict(playlist)
    playlist["tracks"] = [
        detailed_tracks.get(str(track.get("id")), track) if isinstance(track, dict) else track
        for track in tracks
    ]
    return playlist


def count_complete_tracks(playlist: dict[str, Any]) -> int:
    tracks = playlist.get("tracks") or []
    return sum(1 for track in tracks if isinstance(track, dict) and track.get("title"))


def milliseconds_to_duration(value: Any) -> str:
    try:
        milliseconds = int(value)
    except (TypeError, ValueError):
        return ""

    total_seconds = milliseconds // 1000
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"


def compact_track(track: dict[str, Any], position: int) -> dict[str, Any]:
    user = track.get("user") if isinstance(track.get("user"), dict) else {}
    return {
        "position": position,
        "id": track.get("id"),
        "urn": track.get("urn"),
        "title": track.get("title"),
        "permalink_url": track.get("permalink_url"),
        "description": track.get("description"),
        "duration_ms": track.get("duration"),
        "duration": milliseconds_to_duration(track.get("duration")),
        "created_at": track.get("created_at"),
        "display_date": track.get("display_date"),
        "last_modified": track.get("last_modified"),
        "artwork_url": track.get("artwork_url"),
        "waveform_url": track.get("waveform_url"),
        "genre": track.get("genre"),
        "tag_list": track.get("tag_list"),
        "license": track.get("license"),
        "streamable": track.get("streamable"),
        "embeddable_by": track.get("embeddable_by"),
        "playback_count": track.get("playback_count"),
        "likes_count": track.get("likes_count"),
        "comment_count": track.get("comment_count"),
        "user_id": track.get("user_id") or user.get("id"),
        "user_username": user.get("username"),
        "user_permalink_url": user.get("permalink_url"),
    }


def compact_playlist(playlist: dict[str, Any], source_url: str) -> dict[str, Any]:
    user = playlist.get("user") if isinstance(playlist.get("user"), dict) else {}
    tracks = [
        compact_track(track, index)
        for index, track in enumerate(playlist.get("tracks") or [], start=1)
        if isinstance(track, dict)
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_url": source_url,
        "playlist": {
            "id": playlist.get("id"),
            "urn": playlist.get("urn"),
            "title": playlist.get("title"),
            "description": playlist.get("description"),
            "permalink_url": playlist.get("permalink_url"),
            "created_at": playlist.get("created_at"),
            "display_date": playlist.get("display_date"),
            "last_modified": playlist.get("last_modified"),
            "duration_ms": playlist.get("duration"),
            "duration": milliseconds_to_duration(playlist.get("duration")),
            "track_count": playlist.get("track_count") or len(tracks),
            "artwork_url": playlist.get("artwork_url"),
            "user": {
                "id": user.get("id"),
                "username": user.get("username"),
                "permalink_url": user.get("permalink_url"),
            },
        },
        "tracks": tracks,
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, tracks: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(tracks)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export a SoundCloud playlist to JSON and CSV metadata files."
    )
    parser.add_argument("--url", default=DEFAULT_PLAYLIST_URL, help="SoundCloud playlist URL")
    parser.add_argument("--json", default=DEFAULT_JSON_PATH, type=Path, help="JSON output path")
    parser.add_argument("--csv", default=DEFAULT_CSV_PATH, type=Path, help="CSV output path")
    parser.add_argument(
        "--no-api",
        action="store_true",
        help="Use only metadata embedded in the SoundCloud HTML page.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    html_text = fetch_text(args.url)
    playlist = find_playlist(extract_hydration(html_text))

    if not args.no_api:
        client_id = extract_client_id(html_text, args.url)
        playlist = complete_playlist_from_api(playlist, args.url, client_id)

    payload = compact_playlist(playlist, args.url)
    write_json(args.json, payload)
    write_csv(args.csv, payload["tracks"])

    complete_tracks = sum(1 for track in payload["tracks"] if track.get("title"))
    print(f"Wrote {args.json} and {args.csv}")
    print(f"Tracks: {complete_tracks}/{payload['playlist']['track_count']}")
    if complete_tracks < int(payload["playlist"]["track_count"] or 0):
        print(
            "Warning: some tracks only had partial metadata. "
            "Try again later or run without --no-api if it was used.",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
