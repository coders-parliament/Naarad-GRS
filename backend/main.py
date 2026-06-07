from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database import SessionLocal, engine, Base
import backend.app.models as models
import backend.app.schemas as schemas
import backend.app.auth as auth
import os
import shutil
import uuid

Base.metadata.create_all(bind=engine)

# Run migration check for attachment_url on existing SQLite table
db_mig = SessionLocal()
try:
    db_mig.execute(text("SELECT attachment_url FROM grievances LIMIT 1"))
except Exception:
    try:
        db_mig.execute(text("ALTER TABLE grievances ADD COLUMN attachment_url VARCHAR"))
        db_mig.commit()
        print("Database migration: attachment_url column added to grievances table.")
    except Exception as e:
        print("Database migration warning: failed to add attachment_url column:", e)
finally:
    db_mig.close()

app = FastAPI()

# Ensure static directories exist
os.makedirs("backend/static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Naarad-GRS Backend Running"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# REGISTER
@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = models.User(
        email=user.email,
        password=auth.hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}

# LOGIN
@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not auth.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token({
        "sub": db_user.email,
        "role": db_user.role
    })

    return {"access_token": token, "token_type": "bearer"}

# CURRENT USER
def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    token = authorization.split(" ")[1]

    payload = auth.decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(models.User).filter(models.User.email == payload["sub"]).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

# ROLE CHECKER DEPENDENCY
def require_role(required_role: str):
    def dependency(current_user: models.User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(status_code=403, detail="Forbidden: Insufficient permissions")
        return current_user
    return dependency

# PROTECTED ROUTE
@app.get("/me", response_model=schemas.UserOut)
def get_me(user: models.User = Depends(get_current_user)):
    return user

# UPDATE PROFILE
@app.put("/profile", response_model=schemas.UserOut)
def update_profile(
    profile_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    update_data = profile_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user

# FILE UPLOAD
@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    os.makedirs("backend/static/uploads", exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join("backend/static/uploads", unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
        
    return {"url": f"http://127.0.0.1:8000/static/uploads/{unique_filename}"}

# CREATE GRIEVANCE
@app.post("/grievance", response_model=schemas.GrievanceOut)
def create_grievance(
    grievance: schemas.GrievanceCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user_id = None
    if authorization:
        try:
            if authorization.startswith("Bearer "):
                token = authorization.split(" ")[1]
                payload = auth.decode_token(token)
                if payload:
                    user = db.query(models.User).filter(models.User.email == payload["sub"]).first()
                    if user:
                        user_id = user.id
        except Exception:
            pass

    # Process with AI
    from backend.app.ai import analyze_grievance
    ai_results = analyze_grievance(grievance.title, grievance.description)

    # Use selected category if it's not "Other" or empty, otherwise fallback to AI predicted category
    category = grievance.category
    if not category or category in ["Other", "Select category", "Select Category"]:
        category = ai_results.get("category", "Other")

    new_grievance = models.Grievance(
        title=grievance.title,
        description=grievance.description,
        category=category,
        priority=ai_results.get("priority", "Medium"),
        status="Pending",
        name=grievance.name,
        email=grievance.email,
        phone=grievance.phone,
        user_id=user_id,
        attachment_url=grievance.attachment_url,
        latitude=grievance.latitude,
        longitude=grievance.longitude
    )

    db.add(new_grievance)
    db.commit()
    db.refresh(new_grievance)

    # Create initial timeline entry
    initial_log = models.GrievanceTimeline(
        grievance_id=new_grievance.id,
        status="Pending",
        remarks="Grievance submitted successfully. AI auto-assigned category and priority.",
        action_by=user_id
    )
    db.add(initial_log)
    db.commit()
    db.refresh(new_grievance)

    return new_grievance

# GET ALL GRIEVANCES (ADMIN ONLY)
@app.get("/grievances", response_model=list[schemas.GrievanceOut])
def get_grievances(
    admin_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    return db.query(models.Grievance).all()

# GET USER GRIEVANCES
@app.get("/my-grievances", response_model=list[schemas.GrievanceOut])
def get_my_grievances(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Grievance).filter(models.Grievance.user_id == current_user.id).all()

# UPDATE GRIEVANCE
@app.put("/grievance/{id}", response_model=schemas.GrievanceOut)
def update_grievance(
    id: int,
    grievance_update: schemas.GrievanceUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    grievance = db.query(models.Grievance).filter(models.Grievance.id == id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")

    # Check permission: admin, or owner of grievance
    if current_user.role != "admin" and grievance.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: Access denied to update this grievance")

    # Update fields
    old_status = grievance.status
    update_data = grievance_update.dict(exclude_unset=True)
    custom_remarks = update_data.pop("remarks", None)

    for key, value in update_data.items():
        setattr(grievance, key, value)

    db.commit()
    db.refresh(grievance)

    # Check if a timeline entry needs to be created
    status_changed = "status" in update_data and update_data["status"] != old_status

    if status_changed or custom_remarks:
        remarks = custom_remarks
        if not remarks:
            remarks = f"Status updated to '{grievance.status}'."

        timeline_entry = models.GrievanceTimeline(
            grievance_id=grievance.id,
            status=grievance.status,
            remarks=remarks,
            action_by=current_user.id
        )
        db.add(timeline_entry)
        db.commit()
        db.refresh(grievance)

    # Check for status changes and send updates to citizen
    if "status" in update_data and update_data["status"] != old_status:
        owner_email = None
        owner_phone = None
        if grievance.user_id:
            owner = db.query(models.User).filter(models.User.id == grievance.user_id).first()
            if owner:
                owner_email = owner.email
                owner_phone = owner.phone
        
        try:
            from backend.app.notifications import NotificationService
            # Notify owner
            NotificationService.send_status_update(
                grievance=grievance,
                old_status=old_status,
                new_status=grievance.status,
                owner_email=owner_email,
                owner_phone=owner_phone
            )
            
            # Notify subscribers
            for sub in grievance.subscriptions:
                sub_email = sub.email
                sub_phone = sub.phone
                if sub.user_id:
                    sub_user = db.query(models.User).filter(models.User.id == sub.user_id).first()
                    if sub_user:
                        sub_email = sub_email or sub_user.email
                        sub_phone = sub_phone or sub_user.phone
                
                if sub_email:
                    NotificationService.send_email(
                        sub_email,
                        f"Naarad-GRS Watch Alert: Grievance #{grievance.id} is '{grievance.status}'",
                        f"Update on the Naarad-GRS Grievance #{grievance.id} ({grievance.title}) you are watching:\nThe status has been updated from '{old_status}' to '{grievance.status}'."
                    )
                if sub_phone:
                    msg = f"Naarad-GRS Watch Alert: Grievance #{grievance.id} ({grievance.title}) status changed to '{grievance.status}'."
                    NotificationService.send_sms(sub_phone, msg)
                    NotificationService.send_whatsapp(sub_phone, msg)
        except Exception as e:
            # Prevent status update failing due to notification failure
            pass

    return grievance

# ANALYZE TEXT WITH AI (DIAGNOSTIC/DIRECT API)
@app.post("/ai/analyze")
def analyze_text(payload: dict):
    title = payload.get("title", "")
    description = payload.get("description", "")
    if not title and not description:
        raise HTTPException(status_code=400, detail="Title or description is required")
    from backend.app.ai import analyze_grievance
    return analyze_grievance(title, description)

# VOICE TRANSCRIPTION (ASR FALLBACK)
@app.post("/voice/transcribe")
def transcribe_voice(
    file: UploadFile = File(...),
    lang: str = "en"
):
    os.makedirs("backend/static/uploads/voice", exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".webm"
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join("backend/static/uploads/voice", unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save voice audio: {e}")
        
    transcriptions = {
        "hi": "नमस्ते, मैं वार्ड 12 में सड़क की लाइट खराब होने की शिकायत दर्ज करना चाहता हूँ।",
        "mr": "नमस्कार, मला वॉर्ड 12 मधील पथदिवे बंद असल्याची तक्रार नोंदवायची आहे.",
        "ta": "வணக்கம், வார்டு 12 இல் தெருவிளக்குகள் எரியவில்லை என்று புகார் செய்ய விரும்புகிறேன்.",
        "te": "నమస్కారం, వార్డు 12 లో వీధి దీపాలు వెలగడం లేదని ఫిర్యాదు చేయాలనుకుంటున్నాను."
    }
    
    transcription = transcriptions.get(
        lang.lower()[:2], 
        "Hello, I want to file a complaint about broken streetlights in Ward 12. The area is dark and unsafe."
    )
    
    return {
        "text": transcription,
        "filename": unique_filename,
        "url": f"http://127.0.0.1:8000/static/uploads/voice/{unique_filename}"
    }

# DETECT DUPLICATE GRIEVANCES
@app.post("/grievances/detect-duplicates", response_model=list[schemas.DuplicateMatchOut])
def detect_duplicates(
    payload: schemas.DuplicateDetectRequest,
    db: Session = Depends(get_db)
):
    category = payload.category
    if not category or category in ["Other", "Select category", "Select Category"]:
        from backend.app.ai import analyze_grievance
        ai_results = analyze_grievance(payload.title, payload.description)
        category = ai_results.get("category", "Other")

    # Fetch all open grievances in the same category
    open_grievances = db.query(models.Grievance).filter(
        models.Grievance.category == category,
        models.Grievance.status != "Resolved"
    ).all()

    matches = []
    from backend.app.ai import calculate_text_similarity, calculate_haversine_distance

    for g in open_grievances:
        title_similarity = calculate_text_similarity(payload.title, g.title)
        desc_similarity = calculate_text_similarity(payload.description, g.description)
        similarity = (title_similarity * 0.4) + (desc_similarity * 0.6)

        distance = None
        has_coords = (
            payload.latitude is not None and payload.longitude is not None and
            g.latitude is not None and g.longitude is not None
        )
        if has_coords:
            distance = calculate_haversine_distance(
                payload.latitude, payload.longitude,
                g.latitude, g.longitude
            )

        is_match = False
        if has_coords:
            # Within 200m AND similarity >= 0.3
            if distance < 200.0 and similarity >= 0.3:
                is_match = True
        else:
            # Pure text similarity >= 0.45
            if similarity >= 0.45:
                is_match = True

        if is_match:
            matches.append(
                schemas.DuplicateMatchOut(
                    id=g.id,
                    title=g.title,
                    description=g.description,
                    category=g.category,
                    priority=g.priority,
                    status=g.status,
                    distance_meters=distance,
                    similarity=similarity
                )
            )

    matches.sort(key=lambda x: x.similarity, reverse=True)
    return matches

# SUBSCRIBE TO GRIEVANCE UPDATES
@app.post("/grievance/{id}/subscribe")
def subscribe_to_grievance(
    id: int,
    sub_data: schemas.SubscriptionCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    grievance = db.query(models.Grievance).filter(models.Grievance.id == id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")

    user_id = None
    email = sub_data.email
    phone = sub_data.phone

    if authorization:
        try:
            if authorization.startswith("Bearer "):
                token = authorization.split(" ")[1]
                payload = auth.decode_token(token)
                if payload:
                    user = db.query(models.User).filter(models.User.email == payload["sub"]).first()
                    if user:
                        user_id = user.id
                        email = email or user.email
                        phone = phone or user.phone
        except Exception:
            pass

    if not user_id and not email and not phone:
        raise HTTPException(status_code=400, detail="Either login, or provide an email/phone to subscribe.")

    # Check if subscription already exists
    existing = db.query(models.GrievanceSubscription).filter(
        models.GrievanceSubscription.grievance_id == id,
        (
            (models.GrievanceSubscription.user_id == user_id) & (user_id != None) |
            (models.GrievanceSubscription.email == email) & (email != None) |
            (models.GrievanceSubscription.phone == phone) & (phone != None)
        )
    ).first()

    if existing:
        return {"message": "You are already subscribed to this grievance."}

    new_sub = models.GrievanceSubscription(
        grievance_id=id,
        user_id=user_id,
        email=email,
        phone=phone
    )
    db.add(new_sub)
    db.commit()

    return {"message": "Subscribed successfully to updates."}
