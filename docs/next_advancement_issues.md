# Planned Issues for Next Advancements (Version 2)

This document specifies the technical design, requirements, and task breakdowns for the next high-priority issues/features in Naarad-GRS.

---

## 🎫 Issue 1: Step-by-Step Grievance Timeline and Audit Logging

### Description
Citizens want transparent updates showing who handled their complaint, what steps were taken, and when status updates occurred. Currently, only a single global `status` exists on the `Grievance` model, and there is no record of individual administrative updates or remarks.

### Proposed Changes

#### 1. Database Timeline Model
Create a new `GrievanceTimeline` database model in [models.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/app/models.py):
```python
class GrievanceTimeline(Base):
    __tablename__ = "grievance_timelines"

    id = Column(Integer, primary_key=True, index=True)
    grievance_id = Column(Integer, ForeignKey("grievances.id", ondelete="CASCADE"))
    status = Column(String)  # e.g., Pending, In Progress, Resolved, Reopened, Rejected
    remarks = Column(String, nullable=True)  # Admin feedback/notes
    action_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin user ID
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### 2. Backend Schemas & Serialization
Update [schemas.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/app/schemas.py):
* Add a `GrievanceTimelineOut` Pydantic schema:
  ```python
  class GrievanceTimelineOut(BaseModel):
      id: int
      status: str
      remarks: Optional[str] = None
      action_by: Optional[int] = None
      created_at: datetime

      class Config:
          orm_mode = True
  ```
* Update `GrievanceOut` to include a list of timeline events:
  ```python
  class GrievanceOut(GrievanceBase):
      id: int
      status: str
      created_at: datetime
      timeline: List[GrievanceTimelineOut] = []
  ```

#### 3. Automatic Audit Logging Hooks
Modify the status-updating endpoint `PUT /grievances/{id}/status` in [main.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/main.py):
* Whenever an administrator or departmental official updates the status or adds comments, append a new `GrievanceTimeline` record to the database.
* Ensure a default `GrievanceTimeline` record of "Submitted" is created when the grievance is first filed.

#### 4. Frontend Interactive Timeline UI
* **Citizen View:** Update the tracking page (`/dashboard` or `/submit` receipt page) to render a clean vertical checkpoint stepper showing status progress, dates, and administrative remarks.
* **Admin View:** Render the historic logs inside the Grievance detail modal/drawer so other admins can review past actions before making updates.

---

## 🎫 Issue 2: Citizen Feedback, Rating, and Grievance Re-opening

### Description
To ensure high-quality civic service delivery, citizens must be able to rate the resolution of their grievances. If a resolution is unsatisfactory, they should have the right to reopen the grievance within a set timeframe (e.g., 7 days) rather than submitting a brand-new complaint.

### Proposed Changes

#### 1. Database Model Updates
Modify the `Grievance` model in [models.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/app/models.py) to include feedback fields:
```python
class Grievance(Base):
    # ... existing fields ...
    rating = Column(Integer, nullable=True)  # 1 to 5 stars
    feedback = Column(String, nullable=True)  # Text feedback
    reopened_count = Column(Integer, default=0)
```

#### 2. Feedback and Reopen Endpoints
Add new endpoints in [main.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/main.py):
* `POST /grievances/{id}/feedback`
  * Validates that the grievance status is `Resolved`.
  * Saves the user's rating (1–5) and optional text review.
* `POST /grievances/{id}/reopen`
  * Validates that the grievance status is `Resolved` and that the resolution was within the last 7 days.
  * Resets the status to `Reopened`, increments `reopened_count`, and appends a `Reopened` timeline event log.

#### 3. Frontend Rating & Re-opening Interface
* Update the Citizen Dashboard (`frontend/app/dashboard/page.tsx`):
  * For grievances in `Resolved` state, render a dynamic rating widget (using interactive SVG stars) and a feedback textarea.
  * If a citizen rates the grievance low (e.g., 1 or 2 stars), display a prominent **"Reopen Complaint"** button next to it.
  * On clicking "Reopen", request the user to provide a reason, send it to the backend, and refresh the dashboard view to display the updated state.

---

## 🎫 Issue 3: AI-Powered Duplicate Grievance Detection

### Description
In civic administrations, multiple citizens often report the exact same issue (e.g., the same pothole on a main street or a local water pipe burst). This results in duplicated workflows for officials. We should detect duplicates during submission and let citizens "upvote" or "subscribe" to existing reports instead.

### Proposed Changes

#### 1. Backend Duplicate Detection API
Add a new endpoint `POST /grievances/detect-duplicates` in [main.py](file:///c:/Users/ACER/OneDrive/Desktop/Naarad-GRS/backend/main.py):
* Accepts the title, category, description, and GPS coordinates (latitude/longitude) of the new submission.
* Queries active/open grievances in the database within the same category.
* Uses spatial filtering (e.g., within 200 meters) combined with text similarity (using TF-IDF or the existing AI classification pipeline) to find matches.
* Returns a list of potential duplicates: `{"duplicates": [{"id": 1, "title": "...", "distance_meters": 45, "similarity": 0.85}]}`.

#### 2. "Watch / Subscribe" Endpoint
Add a subscription model or field mapping to allow citizens to register their interest in an existing grievance:
* Citizens who subscribe to an existing grievance will receive notification alerts (email/SMS) when that issue is resolved, avoiding the need to submit another ticket.

#### 3. Frontend Suggestion Widget
* Update the Grievance Submission Form (`frontend/app/submit/page.tsx`):
  * When the user finishes typing their description and locks their GPS location, trigger an asynchronous check to `POST /grievances/detect-duplicates`.
  * If highly matching duplicates are found, show an elegant prompt panel:
    > 🔍 **Similar issue reported nearby!**
    > "Water leak at Block B lane corner" was reported 50m away and is currently **In Progress**.
    >
    > **[Subscribe to Updates]** instead of filing a new ticket, or **[Submit Anyway]** if yours is different.
