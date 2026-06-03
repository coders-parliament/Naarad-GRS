from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, engine, Base
import backend.app.models as models
import backend.app.schemas as schemas
import backend.app.auth as auth

Base.metadata.create_all(bind=engine)

app = FastAPI()

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
@app.get("/me")
def get_me(user: models.User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role
    }

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
        user_id=user_id
    )

    db.add(new_grievance)
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
    update_data = grievance_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(grievance, key, value)

    db.commit()
    db.refresh(grievance)
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
