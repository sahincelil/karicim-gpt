#!/usr/bin/env python3
"""Private, read-only YouTube Analytics report generator for SYSTEM ARCHIVE.

OAuth client file, token cache, and report remain on the owner's computer.
Never run this report in a public repository's GitHub Actions logs.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
from typing import Any

SCOPES = (
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.readonly",
)
DEFAULT_PRIVATE_DIR = Path.home() / ".system-archive"
DEFAULT_CLIENT_FILE = DEFAULT_PRIVATE_DIR / "oauth-client.json"
DEFAULT_TOKEN_FILE = DEFAULT_PRIVATE_DIR / "youtube-token.json"

ADDITIVE_METRICS = (
    "engagedViews", "views", "estimatedMinutesWatched",
    "likes", "comments", "shares",
)
WEIGHTED_METRICS = ("averageViewDuration", "averageViewPercentage")
DAILY_METRICS = ADDITIVE_METRICS + WEIGHTED_METRICS
SUMMARY_METRICS = DAILY_METRICS + ("subscribersGained", "subscribersLost")

CONTENT_LABELS = {
    "SHORTS": "Shorts",
    "VIDEO_ON_DEMAND": "Uzun / normal video",
    "LIVE_STREAM": "Canlı yayın",
    "STORY": "Hikâye",
    "UNSPECIFIED": "Belirtilmemiş",
}


def previous_complete_28_days(today: date | None = None) -> tuple[date, date]:
    anchor = today or date.today()
    end_date = anchor - timedelta(days=1)
    return end_date - timedelta(days=27), end_date


def api_query_window(today: date | None = None) -> tuple[date, date]:
    """Fetch an extra four weeks so delayed daily rows still leave a full 28-day report."""
    anchor = today or date.today()
    end_date = anchor - timedelta(days=1)
    return end_date - timedelta(days=55), end_date


def latest_returned_day(daily_response: dict[str, Any]) -> date:
    returned = []
    for row in response_rows(daily_response):
        try:
            returned.append(date.fromisoformat(str(row["day"])))
        except (KeyError, TypeError, ValueError):
            continue
    if not returned:
        raise RuntimeError("YouTube returned no daily rows for the requested range.")
    return max(returned)


def week_ranges(end_date: date) -> dict[str, tuple[date, date]]:
    current_start = end_date - timedelta(days=6)
    previous_end = current_start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=6)
    return {
        "current_7_days": (current_start, end_date),
        "previous_7_days": (previous_start, previous_end),
    }


def response_rows(response: dict[str, Any]) -> list[dict[str, Any]]:
    columns = [item["name"] for item in response.get("columnHeaders", [])]
    return [dict(zip(columns, row)) for row in response.get("rows", [])]


def _number(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _period_metrics(rows: list[dict[str, Any]], start: date, end: date) -> dict[str, Any]:
    in_period: list[dict[str, Any]] = []
    for row in rows:
        try:
            row_day = date.fromisoformat(str(row["day"]))
        except (KeyError, TypeError, ValueError):
            continue
        if start <= row_day <= end:
            in_period.append(row)

    observed_days = sorted({str(row["day"]) for row in in_period})
    expected_days = (end - start).days + 1
    result: dict[str, Any] = {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "coverage_days": len(observed_days),
        "expected_days": expected_days,
        "complete_coverage": len(observed_days) == expected_days,
        "metrics": {},
    }

    for metric in ADDITIVE_METRICS:
        values = [_number(row.get(metric)) for row in in_period]
        result["metrics"][metric] = (
            round(sum(values), 3)
            if values and all(value is not None for value in values)
            else None
        )

    weights = [_number(row.get("engagedViews")) for row in in_period]
    for metric in WEIGHTED_METRICS:
        metric_values = [_number(row.get(metric)) for row in in_period]
        valid = [
            (value, weight)
            for value, weight in zip(metric_values, weights)
            if value is not None and weight is not None and weight > 0
        ]
        denominator = sum(weight for _, weight in valid)
        all_values_present = bool(metric_values) and all(value is not None for value in metric_values)
        result["metrics"][metric] = (
            round(sum(value * weight for value, weight in valid) / denominator, 3)
            if all_values_present and denominator > 0
            else None
        )
        result["metrics"][metric + "Weight"] = round(denominator, 3) if denominator else None
    return result


def _change_percent(current: float | None, previous: float | None) -> float | None:
    if current is None or previous is None or previous == 0:
        return None
    return round(((current - previous) / previous) * 100.0, 2)


def build_report(
    summary_response: dict[str, Any],
    daily_response: dict[str, Any],
    start_date: date,
    end_date: date,
) -> dict[str, Any]:
    summary_rows = response_rows(summary_response)
    daily_rows = response_rows(daily_response)
    types: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in daily_rows:
        types[str(row.get("creatorContentType") or "UNSPECIFIED")].append(row)

    windows = week_ranges(end_date)
    content_types: dict[str, Any] = {}
    weekly_comparison: dict[str, Any] = {}
    for content_type in sorted(types):
        rows = types[content_type]
        current_start, current_end = windows["current_7_days"]
        previous_start, previous_end = windows["previous_7_days"]
        current = _period_metrics(rows, current_start, current_end)
        previous = _period_metrics(rows, previous_start, previous_end)
        can_compare = current["complete_coverage"] and previous["complete_coverage"]
        changes: dict[str, float | None] = {}
        for metric in ADDITIVE_METRICS + WEIGHTED_METRICS:
            changes[metric] = (
                _change_percent(current["metrics"].get(metric), previous["metrics"].get(metric))
                if can_compare else None
            )
        label = CONTENT_LABELS.get(content_type, content_type)
        content_types[content_type] = {
            "label": label,
            "last_28_days": _period_metrics(rows, start_date, end_date),
        }
        weekly_comparison[content_type] = {
            "label": label,
            "current": current,
            "previous": previous,
            "change_percent": changes,
            "comparison_status": "comparable" if can_compare else "incomplete_data_coverage",
        }

    all_days = sorted({
        str(row.get("day"))
        for row in daily_rows
        if row.get("day") and start_date.isoformat() <= str(row.get("day")) <= end_date.isoformat()
    })
    return {
        "channel": "SYSTEM ARCHIVE",
        "generated_on": date.today().isoformat(),
        "date_range": {"start": start_date.isoformat(), "end": end_date.isoformat()},
        "data_coverage": {
            "first_returned_day": all_days[0] if all_days else None,
            "last_returned_day": all_days[-1] if all_days else None,
            "returned_day_count": len(all_days),
            "note": "Missing rows are unknown, not zero. Recent reporting data may be delayed.",
        },
        "channel_summary_28_days": summary_rows[0] if summary_rows else None,
        "content_types_28_days": content_types,
        "weekly_comparison_by_content_type": weekly_comparison,
        "not_included_in_this_query": {
            "shorts_stayed_to_watch": (
                "Not returned by this YouTube Analytics query; do not infer it from engagedViews."
            ),
            "thumbnail_impressions_ctr": (
                "Requires the separate YouTube Reporting API channel reach report; not returned by this query."
            ),
        },
        "interpretation_notes": [
            "Shorts and standard videos are separated by creatorContentType.",
            "Weekly percentage changes are withheld unless both seven-day windows have full daily coverage for that content type.",
            "Average view duration and average view percentage are weighted by engagedViews.",
            "Missing metrics are not treated as zero.",
            "This report is read-only and does not change channel content or settings.",
        ],
    }


def load_credentials(client_file: Path, token_file: Path):
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError as exc:
        raise RuntimeError(
            "Missing Google client libraries. Install requirements-youtube-analytics.txt."
        ) from exc

    credentials = None
    if token_file.is_file():
        credentials = Credentials.from_authorized_user_file(str(token_file), list(SCOPES))

    if credentials and credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
    elif not credentials or not credentials.valid:
        if not client_file.is_file():
            raise RuntimeError(
                f"OAuth client file not found: {client_file}. "
                "Download a Desktop OAuth client from Google Cloud and keep it outside Git."
            )
        flow = InstalledAppFlow.from_client_secrets_file(str(client_file), list(SCOPES))
        credentials = flow.run_local_server(
            host="localhost", port=0, access_type="offline", prompt="consent"
        )

    token_file.parent.mkdir(parents=True, exist_ok=True)
    token_file.write_text(credentials.to_json(), encoding="utf-8")
    try:
        token_file.chmod(0o600)
    except OSError:
        pass
    return credentials


def fetch_report(credentials) -> dict[str, Any]:
    try:
        from googleapiclient.discovery import build
    except ImportError as exc:
        raise RuntimeError(
            "Missing Google API client. Install requirements-youtube-analytics.txt."
        ) from exc

    service = build(
        "youtubeAnalytics", "v2", credentials=credentials, cache_discovery=False
    )
    query_start, query_end = api_query_window()
    daily = service.reports().query(
        ids="channel==MINE",
        startDate=query_start.isoformat(),
        endDate=query_end.isoformat(),
        dimensions="day,creatorContentType",
        metrics=",".join(DAILY_METRICS),
        sort="day,creatorContentType",
        maxResults=1000,
    ).execute()

    # Query daily data over 56 days, then anchor the report to the latest date
    # actually returned by YouTube. The endpoint omits the most recent days.
    report_end = latest_returned_day(daily)
    report_start = report_end - timedelta(days=27)
    summary = service.reports().query(
        ids="channel==MINE",
        startDate=report_start.isoformat(),
        endDate=report_end.isoformat(),
        metrics=",".join(SUMMARY_METRICS),
    ).execute()
    return build_report(summary, daily, report_start, report_end)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client-secrets", type=Path, default=DEFAULT_CLIENT_FILE)
    parser.add_argument("--credentials", type=Path, default=DEFAULT_TOKEN_FILE)
    parser.add_argument("--output", type=Path, help="Private JSON output path; keep it outside the repository.")
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Authenticate and query a minimal read-only metric without printing channel statistics.",
    )
    args = parser.parse_args()
    if not args.check_only and args.output is None:
        parser.error("--output is required unless --check-only is used.")

    credentials = load_credentials(args.client_secrets, args.credentials)
    if args.check_only:
        from googleapiclient.discovery import build
        service = build(
            "youtubeAnalytics", "v2", credentials=credentials, cache_discovery=False
        )
        check_end = date.today() - timedelta(days=1)
        check_start = check_end - timedelta(days=7)
        service.reports().query(
            ids="channel==MINE",
            startDate=check_start.isoformat(),
            endDate=check_end.isoformat(),
            metrics="views",
        ).execute()
        print("Read-only YouTube OAuth check succeeded; channel metrics were suppressed.")
        return 0

    report = fetch_report(credentials)
    output_path = args.output.expanduser().resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    try:
        output_path.chmod(0o600)
    except OSError:
        pass
    print(f"Private analytics report saved locally: {output_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(
            f"Analytics report failed ({type(exc).__name__}). "
            "Check OAuth consent, API enablement, scope, channel access, and date coverage.",
            file=sys.stderr,
        )
        raise SystemExit(1)
