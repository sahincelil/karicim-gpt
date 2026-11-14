import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import youtube_analytics as analytics


class AnalyticsReportTests(unittest.TestCase):
    def test_previous_28_complete_days_ends_yesterday(self):
        start, end = analytics.previous_complete_28_days(date(2026, 11, 14))
        self.assertEqual(end, date(2026, 11, 13))
        self.assertEqual(start, date(2026, 10, 17))
        self.assertEqual((end - start).days + 1, 28)

    def test_week_ranges_are_adjacent_non_overlapping(self):
        ranges = analytics.week_ranges(date(2026, 11, 13))
        current_start, current_end = ranges["current_7_days"]
        previous_start, previous_end = ranges["previous_7_days"]
        self.assertEqual((current_end - current_start).days, 6)
        self.assertEqual((previous_end - previous_start).days, 6)
        self.assertEqual(previous_end.toordinal() + 1, current_start.toordinal())

    def test_response_rows_maps_columns(self):
        response = {
            "columnHeaders": [{"name": "day"}, {"name": "views"}],
            "rows": [["2026-11-13", 12]],
        }
        self.assertEqual(
            analytics.response_rows(response),
            [{"day": "2026-11-13", "views": 12}],
        )

    def test_missing_days_are_not_filled_with_zero(self):
        rows = [
            {"day": "2026-11-07", "views": "5", "engagedViews": "3"},
            {"day": "2026-11-09", "views": "7", "engagedViews": "4"},
        ]
        summary = analytics._period_metrics(
            rows, date(2026, 11, 7), date(2026, 11, 13)
        )
        self.assertEqual(summary["coverage_days"], 2)
        self.assertFalse(summary["complete_coverage"])
        self.assertEqual(summary["metrics"]["views"], 12)

    def test_zero_previous_period_has_no_percentage_change(self):
        self.assertIsNone(analytics._change_percent(10, 0))

    def test_weekly_change_withholds_partial_coverage(self):
        daily = {
            "columnHeaders": [
                {"name": "day"}, {"name": "creatorContentType"},
                {"name": "engagedViews"}, {"name": "views"},
                {"name": "estimatedMinutesWatched"},
                {"name": "averageViewDuration"}, {"name": "averageViewPercentage"},
                {"name": "likes"}, {"name": "comments"}, {"name": "shares"},
            ],
            "rows": [
                ["2026-11-07", "SHORTS", 5, 7, 4, 8, 70, 1, 0, 1],
                ["2026-11-08", "SHORTS", 6, 8, 5, 9, 75, 2, 0, 0],
                ["2026-11-09", "SHORTS", 7, 9, 6, 10, 80, 1, 1, 0],
                ["2026-11-10", "SHORTS", 8, 10, 7, 11, 85, 1, 0, 0],
                ["2026-11-11", "SHORTS", 9, 11, 8, 12, 90, 1, 0, 1],
                ["2026-11-12", "SHORTS", 10, 12, 9, 13, 95, 1, 0, 0],
                ["2026-11-13", "SHORTS", 11, 13, 10, 14, 100, 1, 0, 0],
            ],
        }
        report = analytics.build_report(
            {"columnHeaders": [], "rows": []},
            daily,
            date(2026, 10, 17),
            date(2026, 11, 13),
        )
        weekly = report["weekly_comparison_by_content_type"]["SHORTS"]
        self.assertEqual(weekly["comparison_status"], "incomplete_data_coverage")
        self.assertIsNone(weekly["change_percent"]["views"])
        self.assertEqual(
            report["not_included_in_this_query"]["shorts_stayed_to_watch"],
            "Not returned by this YouTube Analytics query; do not infer it from engagedViews.",
        )

    def test_weighted_average_uses_engaged_views(self):
        rows = [
            {"day": "2026-11-13", "engagedViews": 1, "averageViewDuration": 10},
            {"day": "2026-11-13", "engagedViews": 3, "averageViewDuration": 20},
        ]
        summary = analytics._period_metrics(
            rows, date(2026, 11, 13), date(2026, 11, 13)
        )
        self.assertEqual(summary["metrics"]["averageViewDuration"], 17.5)


if __name__ == "__main__":
    unittest.main()
