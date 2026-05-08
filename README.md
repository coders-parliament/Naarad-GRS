# Naarad-GRS 🔥

AI-Powered Citizen Grievance Redressal System

## 📌 Problem Statement
In many public grievance systems across India, including state helplines and municipal portals, citizen complaints are handled through largely manual workflows. Thousands of complaints are submitted daily, ranging from minor civic inconveniences to urgent issues requiring immediate intervention.

However, existing systems face several critical challenges:

### Key Challenges

1. **Lack of Intelligent Prioritization**
2. **Manual Classification & Routing**
3. **No Sentiment or Severity Analysis**
4. **Limited Transparency & Tracking**
5. **Scalability Issues**

## 💡 Solution

Naarad-GRS is an AI-powered grievance redressal system designed to make public complaint handling faster, transparent, and inclusive.

- 🧠 **Intelligent Complaint Processing**
- 🌐 **Multilingual & Voice Accessibility**
- 🔎 **Real-Time Tracking & Transparency**
- 🔐 **Privacy & Anonymity**
- 📊 **Smart Administrative Dashboard**

By combining AI automation, multilingual support, and transparent tracking, Naarad-GRS transforms traditional grievance systems into a scalable, efficient, and citizen-centric platform.

## 🧠 Features

- 🧠 **AI-Based Complaint Classification** – Automatically categorizes grievances using NLP.
- ⚡ **Sentiment & Urgency Detection** – Prioritizes critical complaints based on tone and severity.
- 🌐 **Multilingual Support** – Accepts grievances in major regional languages.
- 🎙 **Voice-to-Text & Text-to-Voice** – Enables speech-based complaint interaction.
- 🔄 **Intelligent Auto-Routing** – Forwards complaints to appropriate authorities.
- 🆔 **Step-by-Step Tracking** – Real-time updates with unique grievance ID.
- 🔐 **Anonymous Submission Option** – Protects user identity.
- 📊 **Admin Analytics Dashboard** – Provides resolution insights and trends.
- ⭐ **Feedback & Rating System** – Collects post-resolution reviews.
- 🎨 **Clean & User-Friendly Interface** – Simple and accessible design.

---

# 🛠 Tech Stack

## 🎨 Frontend

* **React.js** – Component-based UI development
* **Tailwind CSS** – Modern, responsive styling
* **Axios** – API communication
* **React Router** – Client-side routing

---

## ⚙ Backend

* **FastAPI (Python)** – High-performance API framework
* **Uvicorn** – ASGI server
* **Pydantic** – Data validation
* **SQLAlchemy** – ORM for structured database management

---

## 🗄 Database

* **PostgreSQL** – Structured relational data (users, departments, tracking, feedback)
* **MongoDB** – Flexible storage for complaints, multilingual content, and AI-processed data

---

## 🧠 AI & NLP

* **HuggingFace Transformers** – Text classification & sentiment analysis
* **Scikit-learn** – ML-based prioritization
* **Whisper (ASR)** – Voice-to-text conversion
* **FAISS** – Vector search for RAG-based retrieval

---

## 🔐 Authentication & Security

* **JWT Authentication** – Secure user sessions
* **Role-Based Access Control (RBAC)** – Citizen / Authority / Admin roles

---

## 🚀 Deployment & DevOps

* **Docker** – Containerization
* **Vercel** – Frontend deployment
* **Render / Railway** – Backend hosting

---


## 🏗 System Architecture

```mermaid
graph TD
    A[React Frontend] -->|API Calls| B[FastAPI Backend]
    B --> C[PostgreSQL - Structured Data]
    B --> D[MongoDB - Complaints + AI Metadata]
    B --> E[AI Engine - NLP + Sentiment + RAG]
```

## 👥 Team: Ascendrix


## Utility: close already-completed GitHub issues

If your tracker has open issues that are already done, you can close them in bulk:

```bash
python scripts/close_done_issues.py --repo <owner>/<repo> --dry-run
python scripts/close_done_issues.py --repo <owner>/<repo>
```

Set `GITHUB_TOKEN` (with `repo` scope) before running. The script closes open issues that have labels such as `done`, `completed`, `resolved`, or `executed`, and can be safely tested first with `--dry-run`.
