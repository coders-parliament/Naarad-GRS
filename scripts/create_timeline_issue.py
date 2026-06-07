#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.request
import urllib.error

ISSUE = {
    "title": "feat: Implement Step-by-Step Grievance Timeline and Audit Logging",
    "body": (
        "### Description\n"
        "Citizens want transparent updates showing who handled their complaint, what steps were taken, "
        "and when status updates occurred. Currently, only a single global `status` exists on the "
        "`Grievance` model, and there is no record of individual administrative updates or remarks.\n\n"
        "### Requirements\n"
        "1. **Database Model**: Create a `GrievanceTimeline` table to store status updates, remarks, "
        "dates, and the administrator ID who performed the action.\n"
        "2. **Backend API**:\n"
        "   - Create an initial timeline log when a grievance is submitted.\n"
        "   - Automatically append timeline logs on status changes or when custom remarks are provided via `PUT /grievance/{id}`.\n"
        "   - Update `GrievanceOut` to return the full list of timeline events.\n"
        "3. **Citizen Dashboard**: Add a collapsible history logs accordion inside each grievance card to display the step-by-step progress.\n"
        "4. **Admin Panel**: Prompt admins with a remarks modal when updating a grievance's status to log comments/notes in the timeline."
    ),
    "labels": ["enhancement", "backend", "frontend"]
}

def parse_args():
    parser = argparse.ArgumentParser(description="Create GitHub issue for Naarad-GRS Grievance Timeline.")
    parser.add_argument("--repo", default="coders-parliament/Naarad-GRS", help="GitHub repo (owner/name)")
    parser.add_argument("--token", default=os.getenv("GITHUB_TOKEN"), help="GitHub Access Token (or set GITHUB_TOKEN)")
    return parser.parse_args()

def create_issue(repo, token, title, body, labels):
    url = f"https://api.github.com/repos/{repo}/issues"
    data = {
        "title": title,
        "body": body,
        "labels": labels
    }
    req = urllib.request.Request(
        url,
        method="POST",
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            print(f"Created issue #{res_data.get('number')}: {title}")
            print(f"URL: {res_data.get('html_url')}")
            return res_data.get('html_url')
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        print(f"Failed to create issue '{title}': API error {exc.code} - {detail}")
        sys.exit(1)

def main():
    args = parse_args()
    if not args.token:
        print("Error: GitHub Token is missing. Please provide it via --token or set the GITHUB_TOKEN environment variable.")
        sys.exit(1)

    print(f"Creating issue on repo: {args.repo}...")
    create_issue(args.repo, args.token, ISSUE["title"], ISSUE["body"], ISSUE["labels"])

if __name__ == "__main__":
    main()
