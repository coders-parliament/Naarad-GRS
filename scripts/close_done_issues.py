#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Iterable

DEFAULT_DONE_LABELS = {"done", "completed", "resolved", "executed", "closed-ready"}
DEFAULT_DONE_KEYWORDS = {"done", "completed", "resolved", "fixed"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Close GitHub issues that are already completed.")
    parser.add_argument("--repo", required=True, help="GitHub repo in owner/name format")
    parser.add_argument("--token", default=os.getenv("GITHUB_TOKEN"), help="GitHub token (or set GITHUB_TOKEN)")
    parser.add_argument("--dry-run", action="store_true", help="Print issues that would be closed")
    return parser.parse_args()


def normalize(items: Iterable[str]) -> set[str]:
    return {item.strip().lower() for item in items if item and item.strip()}


def should_close(issue: dict, done_labels: set[str], done_keywords: set[str]) -> bool:
    labels = normalize(label["name"] for label in issue.get("labels", []))
    if labels.intersection(done_labels):
        return True

    title = issue.get("title", "").lower()
    return any(keyword in title for keyword in done_keywords)


def request_json(method: str, url: str, token: str, data: dict | None = None):
    body = None if data is None else json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        method=method,
        data=body,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = response.read()
            if not raw:
                return None
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"GitHub API error {exc.code}: {detail}") from exc


def fetch_open_issues(repo: str, token: str) -> list[dict]:
    issues: list[dict] = []
    page = 1
    while True:
        query = urllib.parse.urlencode({"state": "open", "per_page": 100, "page": page})
        url = f"https://api.github.com/repos/{repo}/issues?{query}"
        chunk = request_json("GET", url, token) or []
        chunk = [item for item in chunk if "pull_request" not in item]
        if not chunk:
            break
        issues.extend(chunk)
        page += 1
    return issues


def close_issue(repo: str, token: str, issue_number: int, dry_run: bool) -> None:
    if dry_run:
        print(f"[DRY-RUN] would close issue #{issue_number}")
        return

    url = f"https://api.github.com/repos/{repo}/issues/{issue_number}"
    request_json("PATCH", url, token, data={"state": "closed"})
    print(f"closed issue #{issue_number}")


def main() -> int:
    args = parse_args()
    if not args.token:
        print("error: GitHub token missing. Use --token or set GITHUB_TOKEN.", file=sys.stderr)
        return 2

    issues = fetch_open_issues(args.repo, args.token)
    closable = [i for i in issues if should_close(i, DEFAULT_DONE_LABELS, DEFAULT_DONE_KEYWORDS)]

    print(f"Open issues: {len(issues)}")
    print(f"Closable issues: {len(closable)}")

    for issue in closable:
        close_issue(args.repo, args.token, issue["number"], args.dry_run)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
