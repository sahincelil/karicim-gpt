"""Adversarial, offline tests for COMMAND-0's bounded compute result verifier."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from worker import digest, make_result, verify


def verify_rows(rows, start, stop):
    with TemporaryDirectory() as tmp:
        paths = []
        for index, row in enumerate(rows):
            path = Path(tmp) / f"result-{index}.json"
            path.write_text(json.dumps(row), encoding="utf-8")
            paths.append(path)
        return verify(paths, start, stop)


class VerifyResultTests(unittest.TestCase):
    def test_two_valid_shards(self):
        result = verify_rows([make_result(0, 10, "node0"),
                              make_result(10, 20, "node1")], 0, 20)
        self.assertEqual(result["count"], 8)
        self.assertEqual(result["shards"], 2)

    def test_real_cloud_ranges(self):
        result = verify_rows([make_result(0, 10000, "cloud0"),
                              make_result(10000, 20000, "cloud1")], 0, 20000)
        self.assertEqual(result["count"], 2262)

    def test_false_count_even_with_recomputed_checksum(self):
        row = make_result(0, 10, "node0")
        row["count"] = 3
        row["checksum"] = digest({k: v for k, v in row.items() if k != "checksum"})
        with self.assertRaisesRegex(ValueError, "incorrect prime count"):
            verify_rows([row], 0, 10)

    def test_corrupted_checksum(self):
        row = make_result(0, 10, "node0")
        row["checksum"] = "f" * 64
        with self.assertRaisesRegex(ValueError, "checksum mismatch"):
            verify_rows([row], 0, 10)

    def test_missing_shard(self):
        with self.assertRaisesRegex(ValueError, "incomplete coverage"):
            verify_rows([make_result(0, 10, "node0")], 0, 20)

    def test_gap(self):
        rows = [make_result(0, 10, "node0"), make_result(11, 20, "node1")]
        with self.assertRaisesRegex(ValueError, "gap or overlap"):
            verify_rows(rows, 0, 20)

    def test_overlap(self):
        rows = [make_result(0, 11, "node0"), make_result(10, 20, "node1")]
        with self.assertRaisesRegex(ValueError, "gap or overlap"):
            verify_rows(rows, 0, 20)

    def test_duplicate_node_id(self):
        rows = [make_result(0, 10, "same"), make_result(10, 20, "same")]
        with self.assertRaisesRegex(ValueError, "duplicate node"):
            verify_rows(rows, 0, 20)

    def test_boolean_count_rejected(self):
        row = make_result(0, 10, "node0")
        row["count"] = True
        row["checksum"] = digest({k: v for k, v in row.items() if k != "checksum"})
        with self.assertRaisesRegex(ValueError, "invalid field types"):
            verify_rows([row], 0, 10)

    def test_oversized_result_file_rejected(self):
        with TemporaryDirectory() as tmp:
            path = Path(tmp) / "large.json"
            path.write_text(" " * 4097, encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "result too large"):
                verify([path], 0, 10)

    def test_no_results_rejected(self):
        with self.assertRaisesRegex(ValueError, "invalid verify request"):
            verify([], 0, 10)


if __name__ == "__main__":
    unittest.main()
