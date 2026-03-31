from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "default-secret-change-in-production-12345678901234567890")

# Password utilities
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT utilities
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Auth helper
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Create the main app
app = FastAPI()

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth")
content_router = APIRouter(prefix="/content")

# Pydantic Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

# Content Models
class TransformationCreate(BaseModel):
    weight_lost: str
    months_post_op: str
    image_url: str

class TransformationResponse(BaseModel):
    id: str
    weight_lost: str
    months_post_op: str
    image_url: str
    created_at: str

class TestimonialCreate(BaseModel):
    name: str
    country: str
    text: str
    rating: int = 5

class TestimonialResponse(BaseModel):
    id: str
    name: str
    country: str
    text: str
    rating: int
    created_at: str

class VideoTestimonialCreate(BaseModel):
    title: str
    duration: str
    thumbnail_url: str
    video_url: str

class VideoTestimonialResponse(BaseModel):
    id: str
    title: str
    duration: str
    thumbnail_url: str
    video_url: str
    created_at: str

class ItineraryDayCreate(BaseModel):
    day_number: int
    title: str
    description: str

class ItineraryDayResponse(BaseModel):
    id: str
    day_number: int
    title: str
    description: str
    created_at: str

# Auth Routes
@auth_router.post("/login")
async def login(request: LoginRequest, response: Response):
    email = request.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    # Set cookies (for same-domain)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    # Return token in response body (for cross-domain/PHP proxy)
    return {"id": user_id, "email": user["email"], "name": user["name"], "role": user["role"], "token": access_token}

@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@auth_router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# Content Routes - Transformations
@content_router.get("/transformations", response_model=List[TransformationResponse])
async def get_transformations():
    items = await db.transformations.find({}, {"_id": 1, "weight_lost": 1, "months_post_op": 1, "image_url": 1, "created_at": 1}).sort("created_at", -1).to_list(100)
    return [{"id": str(item["_id"]), "weight_lost": item["weight_lost"], "months_post_op": item["months_post_op"], "image_url": item["image_url"], "created_at": item.get("created_at", datetime.now(timezone.utc)).isoformat()} for item in items]

@content_router.post("/transformations", response_model=TransformationResponse)
async def create_transformation(data: TransformationCreate, current_user: dict = Depends(get_current_user)):
    doc = {**data.model_dump(), "created_at": datetime.now(timezone.utc)}
    result = await db.transformations.insert_one(doc)
    return {"id": str(result.inserted_id), **data.model_dump(), "created_at": doc["created_at"].isoformat()}

@content_router.put("/transformations/{item_id}", response_model=TransformationResponse)
async def update_transformation(item_id: str, data: TransformationCreate, current_user: dict = Depends(get_current_user)):
    result = await db.transformations.find_one_and_update(
        {"_id": ObjectId(item_id)},
        {"$set": data.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": str(result["_id"]), "weight_lost": result["weight_lost"], "months_post_op": result["months_post_op"], "image_url": result["image_url"], "created_at": result.get("created_at", datetime.now(timezone.utc)).isoformat()}

@content_router.delete("/transformations/{item_id}")
async def delete_transformation(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.transformations.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# Content Routes - Testimonials
@content_router.get("/testimonials", response_model=List[TestimonialResponse])
async def get_testimonials():
    items = await db.testimonials.find({}, {"_id": 1, "name": 1, "country": 1, "text": 1, "rating": 1, "created_at": 1}).sort("created_at", -1).to_list(100)
    return [{"id": str(item["_id"]), "name": item["name"], "country": item["country"], "text": item["text"], "rating": item.get("rating", 5), "created_at": item.get("created_at", datetime.now(timezone.utc)).isoformat()} for item in items]

@content_router.post("/testimonials", response_model=TestimonialResponse)
async def create_testimonial(data: TestimonialCreate, current_user: dict = Depends(get_current_user)):
    doc = {**data.model_dump(), "created_at": datetime.now(timezone.utc)}
    result = await db.testimonials.insert_one(doc)
    return {"id": str(result.inserted_id), **data.model_dump(), "created_at": doc["created_at"].isoformat()}

@content_router.put("/testimonials/{item_id}", response_model=TestimonialResponse)
async def update_testimonial(item_id: str, data: TestimonialCreate, current_user: dict = Depends(get_current_user)):
    result = await db.testimonials.find_one_and_update(
        {"_id": ObjectId(item_id)},
        {"$set": data.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": str(result["_id"]), "name": result["name"], "country": result["country"], "text": result["text"], "rating": result.get("rating", 5), "created_at": result.get("created_at", datetime.now(timezone.utc)).isoformat()}

@content_router.delete("/testimonials/{item_id}")
async def delete_testimonial(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.testimonials.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# Content Routes - Video Testimonials
@content_router.get("/video-testimonials", response_model=List[VideoTestimonialResponse])
async def get_video_testimonials():
    items = await db.video_testimonials.find({}, {"_id": 1, "title": 1, "duration": 1, "thumbnail_url": 1, "video_url": 1, "created_at": 1}).sort("created_at", -1).to_list(100)
    return [{"id": str(item["_id"]), "title": item["title"], "duration": item["duration"], "thumbnail_url": item["thumbnail_url"], "video_url": item["video_url"], "created_at": item.get("created_at", datetime.now(timezone.utc)).isoformat()} for item in items]

@content_router.post("/video-testimonials", response_model=VideoTestimonialResponse)
async def create_video_testimonial(data: VideoTestimonialCreate, current_user: dict = Depends(get_current_user)):
    doc = {**data.model_dump(), "created_at": datetime.now(timezone.utc)}
    result = await db.video_testimonials.insert_one(doc)
    return {"id": str(result.inserted_id), **data.model_dump(), "created_at": doc["created_at"].isoformat()}

@content_router.put("/video-testimonials/{item_id}", response_model=VideoTestimonialResponse)
async def update_video_testimonial(item_id: str, data: VideoTestimonialCreate, current_user: dict = Depends(get_current_user)):
    result = await db.video_testimonials.find_one_and_update(
        {"_id": ObjectId(item_id)},
        {"$set": data.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": str(result["_id"]), "title": result["title"], "duration": result["duration"], "thumbnail_url": result["thumbnail_url"], "video_url": result["video_url"], "created_at": result.get("created_at", datetime.now(timezone.utc)).isoformat()}

@content_router.delete("/video-testimonials/{item_id}")
async def delete_video_testimonial(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.video_testimonials.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# Content Routes - Itinerary
@content_router.get("/itinerary", response_model=List[ItineraryDayResponse])
async def get_itinerary():
    items = await db.itinerary.find({}, {"_id": 1, "day_number": 1, "title": 1, "description": 1, "created_at": 1}).sort("day_number", 1).to_list(100)
    return [{"id": str(item["_id"]), "day_number": item["day_number"], "title": item["title"], "description": item["description"], "created_at": item.get("created_at", datetime.now(timezone.utc)).isoformat()} for item in items]

@content_router.post("/itinerary", response_model=ItineraryDayResponse)
async def create_itinerary_day(data: ItineraryDayCreate, current_user: dict = Depends(get_current_user)):
    doc = {**data.model_dump(), "created_at": datetime.now(timezone.utc)}
    result = await db.itinerary.insert_one(doc)
    return {"id": str(result.inserted_id), **data.model_dump(), "created_at": doc["created_at"].isoformat()}

@content_router.put("/itinerary/{item_id}", response_model=ItineraryDayResponse)
async def update_itinerary_day(item_id: str, data: ItineraryDayCreate, current_user: dict = Depends(get_current_user)):
    result = await db.itinerary.find_one_and_update(
        {"_id": ObjectId(item_id)},
        {"$set": data.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": str(result["_id"]), "day_number": result["day_number"], "title": result["title"], "description": result["description"], "created_at": result.get("created_at", datetime.now(timezone.utc)).isoformat()}

@content_router.delete("/itinerary/{item_id}")
async def delete_itinerary_day(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.itinerary.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

# Include routers
api_router.include_router(auth_router)
api_router.include_router(content_router)

@api_router.get("/")
async def root():
    return {"message": "Bariatric Istanbul API"}

app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Startup event - seed admin and default content
@app.on_event("startup")
async def startup_event():
    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@bariatricistanbul.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info(f"Admin password updated")
    
    # Seed default content if empty
    if await db.transformations.count_documents({}) == 0:
        default_transformations = [
            {"weight_lost": "85kg lost", "months_post_op": "12 months post-op", "image_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=400", "created_at": datetime.now(timezone.utc)},
            {"weight_lost": "60kg lost", "months_post_op": "18 months post-op", "image_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=400", "created_at": datetime.now(timezone.utc)},
            {"weight_lost": "70kg lost", "months_post_op": "10 months post-op", "image_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=400", "created_at": datetime.now(timezone.utc)},
            {"weight_lost": "55kg lost", "months_post_op": "14 months post-op", "image_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=400", "created_at": datetime.now(timezone.utc)},
        ]
        await db.transformations.insert_many(default_transformations)
    
    if await db.testimonials.count_documents({}) == 0:
        default_testimonials = [
            {"name": "Sarah M.", "country": "United Kingdom", "text": "The entire experience exceeded my expectations. From the airport pickup to the aftercare, everything was perfectly organized. I've lost 45kg and feel like a new person!", "rating": 5, "created_at": datetime.now(timezone.utc)},
            {"name": "Michael R.", "country": "Germany", "text": "Dr. Yılmaz and his team are incredible. The hospital was world-class and the care I received was exceptional. Best decision I ever made for my health.", "rating": 5, "created_at": datetime.now(timezone.utc)},
            {"name": "Emma L.", "country": "Netherlands", "text": "I was nervous about having surgery abroad, but Bariatric Istanbul made me feel completely safe and cared for. The results speak for themselves - 60kg down!", "rating": 5, "created_at": datetime.now(timezone.utc)},
            {"name": "David K.", "country": "Australia", "text": "Flying all the way from Australia was worth every mile. The quality of care, the facilities, and the results have been life-changing. Highly recommended!", "rating": 5, "created_at": datetime.now(timezone.utc)},
        ]
        await db.testimonials.insert_many(default_testimonials)
    
    if await db.video_testimonials.count_documents({}) == 0:
        default_videos = [
            {"title": "Sarah's Story", "duration": "3:45", "thumbnail_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=600", "video_url": "https://www.w3schools.com/html/mov_bbb.mp4", "created_at": datetime.now(timezone.utc)},
            {"title": "Michael's Journey", "duration": "4:12", "thumbnail_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=600", "video_url": "https://www.w3schools.com/html/mov_bbb.mp4", "created_at": datetime.now(timezone.utc)},
            {"title": "Emma's Transformation", "duration": "2:58", "thumbnail_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=600", "video_url": "https://www.w3schools.com/html/mov_bbb.mp4", "created_at": datetime.now(timezone.utc)},
            {"title": "David's Experience", "duration": "3:30", "thumbnail_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=600", "video_url": "https://www.w3schools.com/html/mov_bbb.mp4", "created_at": datetime.now(timezone.utc)},
        ]
        await db.video_testimonials.insert_many(default_videos)
    
    if await db.itinerary.count_documents({}) == 0:
        default_itinerary = [
            {"day_number": 1, "title": "Arrival & Welcome", "description": "Airport pickup by our VIP transfer service. Check-in to your 5-star hotel. Meet your personal patient coordinator. Pre-operative blood tests and health screening at the hospital.", "created_at": datetime.now(timezone.utc)},
            {"day_number": 2, "title": "Consultation & Preparation", "description": "Detailed consultation with Dr. Yılmaz. Review of medical history and surgical plan. Final pre-operative tests. Meet the anesthesiology team. Preparation for surgery.", "created_at": datetime.now(timezone.utc)},
            {"day_number": 3, "title": "Surgery Day", "description": "Admission to private hospital suite. Bariatric surgery performed by Dr. Yılmaz. Post-operative monitoring in recovery. 24/7 nursing care begins.", "created_at": datetime.now(timezone.utc)},
            {"day_number": 4, "title": "Recovery & Monitoring", "description": "Continue recovery in private suite. Begin liquid diet. Regular check-ups by medical team. Gentle mobilization exercises.", "created_at": datetime.now(timezone.utc)},
            {"day_number": 5, "title": "Discharge & Aftercare", "description": "Final examination by Dr. Yılmaz. Discharge from hospital. Return to hotel for rest. Dietary guidelines and medication schedule provided.", "created_at": datetime.now(timezone.utc)},
            {"day_number": 6, "title": "Follow-up & Departure", "description": "Final check-up with the medical team. Receive comprehensive aftercare package. VIP transfer to airport. Begin your new life journey!", "created_at": datetime.now(timezone.utc)},
        ]
        await db.itinerary.insert_many(default_itinerary)
    
    # Write test credentials
    try:
        import pathlib
        pathlib.Path("/app/memory").mkdir(exist_ok=True)
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write(f"# Test Credentials\n\n")
            f.write(f"## Admin Account\n")
            f.write(f"- Email: {admin_email}\n")
            f.write(f"- Password: {admin_password}\n")
            f.write(f"- Role: admin\n\n")
            f.write(f"## Auth Endpoints\n")
            f.write(f"- POST /api/auth/login\n")
            f.write(f"- POST /api/auth/logout\n")
            f.write(f"- GET /api/auth/me\n")
    except Exception as e:
        logger.warning(f"Could not write test credentials: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
