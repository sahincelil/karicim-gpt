"""COMMAND-0 Phase 1: bounded, offline CPU worker. No shell, networking or plugins."""
import argparse
import hashlib
import hmac
import json
import math
import os
import re
import sys
from pathlib import Path

VERSION = 1
MAX_END = 1_000_000
MAX_SPAN = 50_000

def is_prime(n):
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    for divisor in range(3, math.isqrt(n) + 1, 2):
        if n % divisor == 0:
            return False
    return True

def digest(data):
    raw = json.dumps(data, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def make_result(start, stop, node):
    if not (0 <= start < stop <= MAX_END and stop - start <= MAX_SPAN):
        raise ValueError("invalid or oversized compute interval")
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,32}", node):
        raise ValueError("invalid node identifier")
    result = {"schema": VERSION, "task": "prime_count",
              "start": start, "stop": stop, "node": node,
              "count": sum(is_prime(n) for n in range(start, stop))}
    result["checksum"] = digest(result)
    return result

def validate_result(item):
    if not isinstance(item, dict):
        raise ValueError("invalid result object")
    expected = {"schema", "task", "start", "stop", "node", "count", "checksum"}
    if set(item) != expected or item["schema"] != VERSION or item["task"] != "prime_count":
        raise ValueError("invalid result schema")
    start, stop, count = item["start"], item["stop"], item["count"]
    if type(start) is not int or type(stop) is not int or type(count) is not int:
        raise ValueError("invalid field types")
    if not (0 <= start < stop <= MAX_END and stop - start <= MAX_SPAN and 0 <= count <= stop-start):
        raise ValueError("out-of-bounds result")
    if not isinstance(item["node"], str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,32}", item["node"]):
        raise ValueError("invalid node")
    if not isinstance(item["checksum"], str) or not hmac.compare_digest(
        item["checksum"], digest({k: v for k, v in item.items() if k != "checksum"})
    ):
        raise ValueError("checksum mismatch")
    return item

def sieve_flags(stop):
    """Independent bounded prime oracle, different from the worker's trial division."""
    flags = bytearray(b"\x01") * stop
    flags[:min(stop, 2)] = b"\x00" * min(stop, 2)
    for candidate in range(2, math.isqrt(stop - 1) + 1):
        if flags[candidate]:
            begin = candidate * candidate
            flags[begin:stop:candidate] = b"\x00" * ((stop - 1 - begin) // candidate + 1)
    return flags

def verify(paths, start, stop):
    if len(paths) < 1 or len(paths) > 16 or not 0 <= start < stop <= MAX_END:
        raise ValueError("invalid verify request")
    rows = []
    for path in paths:
        if Path(path).stat().st_size > 4096:
            raise ValueError("result too large")
        rows.append(validate_result(json.loads(Path(path).read_text(encoding="utf-8"))))
    rows.sort(key=lambda x: x["start"])
    cursor = start
    for row in rows:
        if row["start"] != cursor:
            raise ValueError("gap or overlap detected")
        cursor = row["stop"]
    if cursor != stop:
        raise ValueError("incomplete coverage")
    if len({row["node"] for row in rows}) != len(rows):
        raise ValueError("duplicate node identifiers")
    flags = sieve_flags(stop)
    for row in rows:
        actual = sum(flags[row["start"]:row["stop"]])
        if actual != row["count"]:
            raise ValueError(f"incorrect prime count from node {row['node']}")
    return {"schema": VERSION, "task": "prime_count", "start": start,
            "stop": stop, "count": sum(row["count"] for row in rows),
            "shards": len(rows), "nodes": [row["node"] for row in rows],
            "checksums_valid": True}

def self_test():
    assert make_result(0, 10, "local")["count"] == 4
    assert make_result(10, 20, "local")["count"] == 4
    assert make_result(20, 30, "local")["count"] == 2
    try:
        make_result(0, 100_000, "local")
        raise AssertionError("oversized job accepted")
    except ValueError:
        pass
    broken = make_result(0, 10, "local")
    broken["count"] = 9
    try:
        validate_result(broken)
        raise AssertionError("tampered result accepted")
    except ValueError:
        pass
    print("PASS: bounded worker and integrity tests")

def main():
    parser = argparse.ArgumentParser(description="Offline bounded CPU worker")
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run")
    run.add_argument("--start", type=int, required=True)
    run.add_argument("--stop", type=int, required=True)
    run.add_argument("--node", required=True)
    run.add_argument("--output", required=True)
    check = sub.add_parser("verify")
    check.add_argument("--start", type=int, required=True)
    check.add_argument("--stop", type=int, required=True)
    check.add_argument("--files", nargs="+", required=True)
    sub.add_parser("self-test")
    args = parser.parse_args()
    try:
        if args.command == "self-test":
            self_test()
        elif args.command == "run":
            result = make_result(args.start, args.stop, args.node)
            output = Path(args.output)
            if output.exists():
                raise ValueError("output exists: refusing to overwrite")
            output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
            print(json.dumps(result, sort_keys=True))
        else:
            print(json.dumps(verify(args.files, args.start, args.stop), sort_keys=True))
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(2)

if __name__ == "__main__":
    main()
