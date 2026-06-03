# Planned Issues for Next Advancements

This document specifies the technical design, requirements, and task breakdowns for the next high-priority issues/features in Naarad-GRS.

---

## 🎫 Issue 1: Implement File & Image Attachment Uploads for Grievances

### Description
Citizens need to attach photographic or document evidence (e.g., photos of a water leak or broken road) when submitting grievances. The frontend has a visual file input, but the backend and schema do not support storing or serving attachments.

### Proposed Changes

#### 1. Backend Database Model
Modify [models.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/app/models.py) to add an optional `attachment_url` column to the `Grievance` table:
```python
class Grievance(Base):
    # ... existing fields ...
    attachment_url = Column(String, nullable=True)
```

#### 2. Backend Schemas
Update [schemas.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/app/schemas.py) to include `attachment_url` in both input and output:
- `GrievanceCreate` (optional field)
- `GrievanceOut`
- `GrievanceUpdate`

#### 3. Upload API Endpoint
Create a directory `backend/static/uploads/` to store uploaded files. In [main.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/main.py):
- Mount a static files helper: `app.mount("/static", StaticFiles(directory="backend/static"), name="static")`
- Add a new endpoint `POST /upload`:
  ```python
  from fastapi import UploadFile, File
  import shutil
  import uuid
  
  @app.post("/upload")
  def upload_file(file: UploadFile = File(...)):
      ext = file.filename.split(".")[-1]
      unique_name = f"{uuid.uuid4()}.{ext}"
      file_path = f"backend/static/uploads/{unique_name}"
      
      with open(file_path, "wb") as buffer:
          shutil.copyfileobj(file.file, buffer)
          
      return {"url": f"http://127.0.0.1:8000/static/uploads/{unique_name}"}
  ```

#### 4. Frontend Integration
Modify [SubmitPage (page.tsx)](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/frontend/app/submit/page.tsx) to:
- Handle the file input state.
- Upload the file to `POST /upload` before form submission.
- Attach the returned URL to the grievance submission payload.

---

## 🎫 Issue 2: Audio Recording and Voice-to-Text Integration (ASR)

### Description
To support accessibility for citizens with limited literacy or motor impairments, the system needs speech-based grievance submission. Whisper ASR is part of the technology stack but currently unused.

### Proposed Changes

#### 1. Backend Transcription API
Add a new endpoint `POST /audio/transcribe` in [main.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/main.py) which:
- Accepts a binary audio stream/file (WebM, WAV, or MP3).
- Uses the HuggingFace Whisper pipeline or a local speech recognition module to transcribe the audio text.
- Returns the transcribed text: `{"text": "transcribed description here"}`.

#### 2. Frontend Voice Record Button
Modify [SubmitPage (page.tsx)](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/frontend/app/submit/page.tsx):
- Add a microphone icon button next to the Description field.
- Implement the browser MediaRecorder API to record user speech.
- Display a real-time recording timer and waveform/active mic indicator.
- Send the audio blob to the backend transcription endpoint and populate the Description text area.

---

## 🎫 Issue 3: Step-by-Step Grievance Timeline and Audit Logging

### Description
Citizens want transparent updates showing who handled their complaint and when. Currently, only a single global `status` exists on the Grievance model. We need a timeline of administrative actions.

### Proposed Changes

#### 1. Database Timeline Model
Create a new `GrievanceTimeline` database model in [models.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/app/models.py):
```python
class GrievanceTimeline(Base):
    __tablename__ = "grievance_timelines"

    id = Column(Integer, primary_key=True, index=True)
    grievance_id = Column(Integer, ForeignKey("grievances.id"))
    status = Column(String)  # e.g., Pending, In Progress, Resolved, Rejected
    remarks = Column(String, nullable=True)  # Admin feedback/notes
    action_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### 2. Automatic Logging Hook
Update the grievance status-updating endpoint `PUT /grievance/{id}` in [main.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/main.py):
- Automatically append a new `GrievanceTimeline` record whenever a status change or remark update occurs.

#### 3. Frontend Timeline Tracker
Display an interactive horizontal or vertical timeline (e.g. progress bar checkpoints) on the tracking/dashboard detail view showing all historic remarks and updates.
