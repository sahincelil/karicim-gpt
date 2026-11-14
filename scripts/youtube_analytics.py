#!/usr/bin/env python3
"""Read-only YouTube Analytics report for SYSTEM ARCHIVE.

Credentials are read from environment variables and are never printed or saved.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date, timedelta

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPE = "https://www.googleapis.com/auth/yt-analytics.readonly"


def required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def main() -> int:
    client_id = required_env("GOOGLE_CLIENT_ID")
    client_secret = required_env("GOOGLE_CLIENT_SECRET")
    refresh_token = required_env("GOOGLE_REFRESH_TOKEN")

    credentials = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=[SCOPE],
    )

    end_date = date.today() - timedelta(days=1)
    start_date = end_date - timedelta(days=27)

    youtube_analytics = build(
        "youtubeAnalytics", "v2", credentials=credentials, cache_discovery=False
    )
    response = youtube_analytics.reports().query(
        ids="channel==MINE",
        startDate=start_date.isoformat(),
        endDate=end_date.isoformat(),
        dimensions="day",
        metrics="views,estimatedMinutesWatched,averageViewDuration,subscribersGained",
        sort="day",
        maxResults=100,
    ).execute()

    columns = [item["name"] for item in response.get("columnHeaders", [])]
    rows = response.get("rows", [])
    report = {
        "channel": "SYSTEM ARCHIVE",
        "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
        "columns": columns,
        "rows": rows,
        "row_count": len(rows),
        "note": "Read-only report. Missing rows are not interpreted as zero.",
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # avoid dumping request headers or credential objects
        print(f"Analytics report failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        raise SystemExit(1)
