#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.request
import urllib.error

ISSUES = [
    {
        "title": "feat: Implement SMS/WhatsApp notifications for grievance updates",
        "body": (
            "### Description\n"
            "Citizens want real-time updates when their grievance status changes. "
            "We should integrate Twilio or a similar messaging gateway to send automated "
            "notifications to the user's phone number when:\n"
            "- A department officer is assigned.\n"
            "- The grievance status transitions to 'In Progress'.\n"
            "- The grievance is resolved.\n\n"
            "### Requirements\n"
            "1. Register a verified Twilio SMS or WhatsApp Sandbox channel.\n"
            "2. Add asynchronous dispatch worker (Celery/redis or simple background task) to handle API calls.\n"
            "3. Update user profile to validate phone numbers with international prefix formats."
        ),
        "labels": ["enhancement", "priority-medium"]
    },
    {
        "title": "feat: Ward-level heatmaps and department performance analytics",
        "body": (
            "### Description\n"
            "Extend the Admin dashboard to show geographical heatmaps and resolution metrics across municipal wards.\n\n"
            "### Requirements\n"
            "1. Visualize active vs resolved complaints across different wards on an interactive map (e.g. Leaflet/Mapbox).\n"
            "2. Generate performance metrics charting resolution-time patterns by department (Water, Electricity, Roads).\n"
            "3. Add database queries to group grievance records by ward location and created timestamps."
        ),
        "labels": ["enhancement", "admin-panel"]
    },
    {
        "title": "perf: Image compression and client-side previews for file uploads",
        "body": (
            "### Description\n"
            "Currently, citizens can upload files but there's no visual preview or file compression. "
            "Optimize file uploads to reduce network payloads and database/S3 footprint.\n\n"
            "### Requirements\n"
            "1. Add client-side image compression resizing before upload using Canvas API or standard library (`browser-image-compression`).\n"
            "2. Implement image/document file previews on the 'Submit Grievance' page.\n"
            "3. Add file-type and size validation checks (limit to 5MB, JPG/PNG/PDF)."
        ),
        "labels": ["performance", "frontend"]
    },
    {
        "title": "feat: Interactive voicebot assistant for speech-based filing",
        "body": (
            "### Description\n"
            "Fully integrate voice capabilities to allow citizens to dictate grievances in their regional languages.\n\n"
            "### Requirements\n"
            "1. Connect Whisper ASR to translate microphone recordings into text.\n"
            "2. Add a Text-to-Speech (TTS) engine to read status updates and confirmation messages.\n"
            "3. Optimize audio compression format (WebM/Opus) for fast uploads."
        ),
        "labels": ["enhancement", "ai-engine"]
    }
]

def parse_args():
    parser = argparse.ArgumentParser(description="Create GitHub issues for Naarad-GRS project.")
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
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        print(f"Failed to create issue '{title}': API error {exc.code} - {detail}")

def main():
    args = parse_args()
    if not args.token:
        print("Error: GitHub Token is missing. Provide it via --token or set GITHUB_TOKEN environment variable.")
        sys.exit(1)

    print(f"Creating 4 issues on repo: {args.repo}")
    for iss in ISSUES:
        create_issue(args.repo, args.token, iss["title"], iss["body"], iss["labels"])

if __name__ == "__main__":
    main()
