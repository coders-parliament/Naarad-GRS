import os
import sys

# Add workspace root directory to path to resolve backend package correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import HTTPException
from backend.app.database import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import backend.app.models as models
import backend.app.schemas as schemas
import backend.app.auth as auth
from backend.app.ai import analyze_grievance
import main

# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_all():
    db = TestingSessionLocal()
    
    print("--- 1. Testing AI Grievance Classification ---")
    res_elec = analyze_grievance("Power cut", "The electricity has been down for 5 hours. Live wire is sparking.")
    print("Electricity test:", res_elec)
    assert res_elec["category"] == "Electricity"
    assert res_elec["priority"] == "High"
    
    res_water = analyze_grievance("Water leak", "There is a water leak and sewage overflow in Sector 4.")
    print("Water test:", res_water)
    assert res_water["category"] == "Water"
    
    res_road = analyze_grievance("Potholes in street", "Minor potholes in the road need repair.")
    print("Road test:", res_road)
    assert res_road["category"] == "Road"
    assert res_road["priority"] in ["Medium", "Low"]
    
    print("\n--- 2. Testing User Registration ---")
    reg_schema = schemas.UserCreate(email="citizen@naarad.com", password="securepassword123")
    reg_res = main.register(reg_schema, db)
    print("Registration response:", reg_res)
    assert reg_res["message"] == "User created successfully"
    
    # Test duplicate register
    try:
        main.register(reg_schema, db)
        assert False, "Should have raised user exists exception"
    except HTTPException as e:
        print("Duplicate registration caught correctly:", e.detail)
        assert e.status_code == 400
        
    print("\n--- 3. Testing User Login ---")
    login_schema = schemas.UserLogin(email="citizen@naarad.com", password="securepassword123")
    login_res = main.login(login_schema, db)
    print("Login response:", login_res)
    assert "access_token" in login_res
    
    # Assert wrong password fails
    try:
        main.login(schemas.UserLogin(email="citizen@naarad.com", password="wrongpassword"), db)
        assert False, "Should have failed login"
    except HTTPException as e:
        print("Wrong password caught correctly:", e.detail)
        assert e.status_code == 401
        
    print("\n--- 4. Testing Grievance Submission & Uploads ---")
    # Test Upload Endpoint
    from fastapi import UploadFile
    import io
    dummy_file = UploadFile(filename="test_image.png", file=io.BytesIO(b"dummy image data"))
    upload_res = main.upload_file(dummy_file)
    print("Upload response:", upload_res)
    assert "url" in upload_res
    assert upload_res["url"].endswith(".png")

    # Anonymous submission with attachment
    anon_grievance = schemas.GrievanceCreate(
        title="Main water pipe burst",
        description="A major water line has burst on main road, causing flooding.",
        category="Water",
        name="John Doe",
        email="john@example.com",
        attachment_url=upload_res["url"]
    )
    g1 = main.create_grievance(anon_grievance, authorization=None, db=db)
    print("Anon grievance created with attachment:", g1.id, g1.title, g1.category, g1.priority, g1.status, "attachment:", g1.attachment_url)
    assert g1.user_id is None
    assert g1.category == "Water"
    assert g1.priority == "High"
    assert g1.attachment_url == upload_res["url"]
    
    # Verify timeline populated on creation
    assert len(g1.timeline) == 1
    assert g1.timeline[0].status == "Pending"
    print("Initial timeline entry verified:", g1.timeline[0].remarks)
    
    # Authenticated submission
    token = login_res["access_token"]
    auth_header = f"Bearer {token}"
    
    auth_grievance = schemas.GrievanceCreate(
        title="Broken street light lamp",
        description="The street light bulb at corner of street 5 is broken.",
        category="Other", # Let AI classify
        name=None,
        email=None
    )
    g2 = main.create_grievance(auth_grievance, authorization=auth_header, db=db)
    print("Auth grievance created:", g2.id, g2.title, g2.category, g2.priority, g2.status, "linked to user_id:", g2.user_id)
    assert g2.user_id is not None
    assert g2.category == "Electricity" # classified by AI
    
    print("\n--- 5. Testing Role-Based Access Control ---")
    # Verify citizen profile
    current_citizen = main.get_current_user(auth_header, db)
    print("Citizen user profile role:", current_citizen.role)
    assert current_citizen.role == "user"
    
    # Try fetching all grievances as citizen (should fail admin check)
    try:
        main.require_role("admin")(current_user=current_citizen)
        assert False, "Should block non-admin from admin endpoint"
    except HTTPException as e:
        print("Access denied to citizen user on admin endpoint:", e.detail)
        assert e.status_code == 403

    # Add an admin user to db
    admin_user = models.User(email="admin@naarad.com", password=auth.hash_password("adminpassword"), role="admin")
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    # Verify admin can view all grievances
    all_g = main.get_grievances(admin_user=admin_user, db=db)
    print("Admin retrieved grievances count:", len(all_g))
    assert len(all_g) == 2
    
    print("\n--- 6. Testing Grievance Status Updates ---")
    # Update as admin with custom remarks
    update_schema = schemas.GrievanceUpdate(status="Resolved", remarks="Resolved after main pipe repair.")
    g1_updated = main.update_grievance(g1.id, update_schema, current_user=admin_user, db=db)
    print("Grievance status updated by admin:", g1_updated.status)
    assert g1_updated.status == "Resolved"
    
    # Verify new timeline entry created
    assert len(g1_updated.timeline) == 2
    assert g1_updated.timeline[1].status == "Resolved"
    assert g1_updated.timeline[1].remarks == "Resolved after main pipe repair."
    print("Updated timeline entry verified:", g1_updated.timeline[1].remarks)
    
    # Try updating someone else's grievance as citizen
    try:
        main.update_grievance(g1.id, update_schema, current_user=current_citizen, db=db)
        assert False, "Citizen should not be allowed to update another user's grievance"
    except HTTPException as e:
        print("Unauthorized update attempt blocked:", e.detail)
        assert e.status_code == 403
        
    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")
    
if __name__ == "__main__":
    test_all()
