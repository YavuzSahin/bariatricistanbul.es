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
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
from typing import List, Optional

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "default-secret-change-in-production")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {"id": str(user["_id"]), "email": user["email"], "name": user["name"], "role": user["role"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

app = FastAPI(title="Bariatric Istanbul API", description="API para cirugía bariátrica en Estambul")
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth")
content_router = APIRouter(prefix="/content")

# ============================================
# PYDANTIC MODELS
# ============================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Transformation Models
class TransformationCreate(BaseModel):
    weight_lost: str
    months_post_op: str
    image_url: str
    patient_name: Optional[str] = ""
    procedure_type: Optional[str] = ""

class TransformationResponse(BaseModel):
    id: str
    weight_lost: str
    months_post_op: str
    image_url: str
    patient_name: Optional[str] = ""
    procedure_type: Optional[str] = ""

# Testimonial Models
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

# Video Testimonial Models
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

# Itinerary Models
class ItineraryDayCreate(BaseModel):
    day_number: int
    title: str
    description: str

class ItineraryDayResponse(BaseModel):
    id: str
    day_number: int
    title: str
    description: str

# Surgeon Model
class SurgeonCreate(BaseModel):
    name: str
    title: str
    bio: str
    image_url: str
    surgeries_count: str
    years_experience: str
    credentials: List[str] = []

class SurgeonResponse(BaseModel):
    id: str
    name: str
    title: str
    bio: str
    image_url: str
    surgeries_count: str
    years_experience: str
    credentials: List[str]

# Hospital Model
class HospitalCreate(BaseModel):
    name: str
    description: str
    image_url: str
    features: List[str] = []

class HospitalResponse(BaseModel):
    id: str
    name: str
    description: str
    image_url: str
    features: List[str]

# Blog Models
class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    image_url: str
    meta_title: str
    meta_description: str
    keywords: List[str] = []
    published: bool = True

class BlogPostResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    image_url: str
    meta_title: str
    meta_description: str
    keywords: List[str]
    published: bool
    created_at: str

# Site Settings Model
class SiteSettingsUpdate(BaseModel):
    site_title: Optional[str] = None
    site_description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    whatsapp_link: Optional[str] = None
    address: Optional[str] = None

# ============================================
# AUTH ROUTES
# ============================================

@auth_router.post("/login")
async def login(request: LoginRequest, response: Response):
    user = await db.users.find_one({"email": request.email.lower()})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_access_token(str(user["_id"]), user["email"])
    response.set_cookie("access_token", token, httponly=True, max_age=86400, path="/")
    return {"id": str(user["_id"]), "email": user["email"], "name": user["name"], "role": user["role"], "token": token}

@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Sesión cerrada"}

@auth_router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ============================================
# CONTENT ROUTES - TRANSFORMATIONS
# ============================================

@content_router.get("/transformations", response_model=List[TransformationResponse])
async def get_transformations():
    items = await db.transformations.find().sort("_id", -1).to_list(100)
    return [{"id": str(i["_id"]), **{k: i.get(k, "") for k in ["weight_lost", "months_post_op", "image_url", "patient_name", "procedure_type"]}} for i in items]

@content_router.post("/transformations", response_model=TransformationResponse)
async def create_transformation(data: TransformationCreate, user: dict = Depends(get_current_user)):
    result = await db.transformations.insert_one(data.model_dump())
    return {"id": str(result.inserted_id), **data.model_dump()}

@content_router.put("/transformations/{id}", response_model=TransformationResponse)
async def update_transformation(id: str, data: TransformationCreate, user: dict = Depends(get_current_user)):
    await db.transformations.update_one({"_id": ObjectId(id)}, {"$set": data.model_dump()})
    return {"id": id, **data.model_dump()}

@content_router.delete("/transformations/{id}")
async def delete_transformation(id: str, user: dict = Depends(get_current_user)):
    await db.transformations.delete_one({"_id": ObjectId(id)})
    return {"message": "Eliminado"}

# ============================================
# CONTENT ROUTES - TESTIMONIALS
# ============================================

@content_router.get("/testimonials", response_model=List[TestimonialResponse])
async def get_testimonials():
    items = await db.testimonials.find().sort("_id", -1).to_list(100)
    return [{"id": str(i["_id"]), "name": i["name"], "country": i["country"], "text": i["text"], "rating": i.get("rating", 5)} for i in items]

@content_router.post("/testimonials", response_model=TestimonialResponse)
async def create_testimonial(data: TestimonialCreate, user: dict = Depends(get_current_user)):
    result = await db.testimonials.insert_one(data.model_dump())
    return {"id": str(result.inserted_id), **data.model_dump()}

@content_router.put("/testimonials/{id}", response_model=TestimonialResponse)
async def update_testimonial(id: str, data: TestimonialCreate, user: dict = Depends(get_current_user)):
    await db.testimonials.update_one({"_id": ObjectId(id)}, {"$set": data.model_dump()})
    return {"id": id, **data.model_dump()}

@content_router.delete("/testimonials/{id}")
async def delete_testimonial(id: str, user: dict = Depends(get_current_user)):
    await db.testimonials.delete_one({"_id": ObjectId(id)})
    return {"message": "Eliminado"}

# ============================================
# CONTENT ROUTES - VIDEO TESTIMONIALS
# ============================================

@content_router.get("/video-testimonials", response_model=List[VideoTestimonialResponse])
async def get_video_testimonials():
    items = await db.video_testimonials.find().sort("_id", -1).to_list(100)
    return [{"id": str(i["_id"]), "title": i["title"], "duration": i["duration"], "thumbnail_url": i["thumbnail_url"], "video_url": i["video_url"]} for i in items]

@content_router.post("/video-testimonials", response_model=VideoTestimonialResponse)
async def create_video_testimonial(data: VideoTestimonialCreate, user: dict = Depends(get_current_user)):
    result = await db.video_testimonials.insert_one(data.model_dump())
    return {"id": str(result.inserted_id), **data.model_dump()}

@content_router.put("/video-testimonials/{id}", response_model=VideoTestimonialResponse)
async def update_video_testimonial(id: str, data: VideoTestimonialCreate, user: dict = Depends(get_current_user)):
    await db.video_testimonials.update_one({"_id": ObjectId(id)}, {"$set": data.model_dump()})
    return {"id": id, **data.model_dump()}

@content_router.delete("/video-testimonials/{id}")
async def delete_video_testimonial(id: str, user: dict = Depends(get_current_user)):
    await db.video_testimonials.delete_one({"_id": ObjectId(id)})
    return {"message": "Eliminado"}

# ============================================
# CONTENT ROUTES - ITINERARY
# ============================================

@content_router.get("/itinerary", response_model=List[ItineraryDayResponse])
async def get_itinerary():
    items = await db.itinerary.find().sort("day_number", 1).to_list(100)
    return [{"id": str(i["_id"]), "day_number": i["day_number"], "title": i["title"], "description": i["description"]} for i in items]

@content_router.post("/itinerary", response_model=ItineraryDayResponse)
async def create_itinerary_day(data: ItineraryDayCreate, user: dict = Depends(get_current_user)):
    result = await db.itinerary.insert_one(data.model_dump())
    return {"id": str(result.inserted_id), **data.model_dump()}

@content_router.put("/itinerary/{id}", response_model=ItineraryDayResponse)
async def update_itinerary_day(id: str, data: ItineraryDayCreate, user: dict = Depends(get_current_user)):
    await db.itinerary.update_one({"_id": ObjectId(id)}, {"$set": data.model_dump()})
    return {"id": id, **data.model_dump()}

@content_router.delete("/itinerary/{id}")
async def delete_itinerary_day(id: str, user: dict = Depends(get_current_user)):
    await db.itinerary.delete_one({"_id": ObjectId(id)})
    return {"message": "Eliminado"}

# ============================================
# CONTENT ROUTES - SURGEON
# ============================================

@content_router.get("/surgeon")
async def get_surgeon():
    surgeon = await db.surgeon.find_one()
    if not surgeon:
        return None
    return {"id": str(surgeon["_id"]), **{k: surgeon.get(k, "") for k in ["name", "title", "bio", "image_url", "surgeries_count", "years_experience"]}, "credentials": surgeon.get("credentials", [])}

@content_router.post("/surgeon", response_model=SurgeonResponse)
async def save_surgeon(data: SurgeonCreate, user: dict = Depends(get_current_user)):
    await db.surgeon.delete_many({})
    result = await db.surgeon.insert_one(data.model_dump())
    return {"id": str(result.inserted_id), **data.model_dump()}

# ============================================
# CONTENT ROUTES - HOSPITAL
# ============================================

@content_router.get("/hospital")
async def get_hospital():
    hospital = await db.hospital.find_one()
    if not hospital:
        return None
    return {"id": str(hospital["_id"]), **{k: hospital.get(k, "") for k in ["name", "description", "image_url"]}, "features": hospital.get("features", [])}

@content_router.post("/hospital", response_model=HospitalResponse)
async def save_hospital(data: HospitalCreate, user: dict = Depends(get_current_user)):
    await db.hospital.delete_many({})
    result = await db.hospital.insert_one(data.model_dump())
    return {"id": str(result.inserted_id), **data.model_dump()}

# ============================================
# CONTENT ROUTES - BLOG
# ============================================

@content_router.get("/blog", response_model=List[BlogPostResponse])
async def get_blog_posts(published_only: bool = False):
    query = {"published": True} if published_only else {}
    items = await db.blog.find(query).sort("_id", -1).to_list(100)
    return [{"id": str(i["_id"]), **{k: i.get(k, "") for k in ["title", "slug", "excerpt", "content", "image_url", "meta_title", "meta_description"]}, "keywords": i.get("keywords", []), "published": i.get("published", True), "created_at": i.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(i.get("created_at"), datetime) else str(i.get("created_at", ""))} for i in items]

@content_router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog.find_one({"slug": slug})
    if not post:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    return {"id": str(post["_id"]), **{k: post.get(k, "") for k in ["title", "slug", "excerpt", "content", "image_url", "meta_title", "meta_description"]}, "keywords": post.get("keywords", []), "published": post.get("published", True), "created_at": post.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(post.get("created_at"), datetime) else str(post.get("created_at", ""))}

@content_router.post("/blog", response_model=BlogPostResponse)
async def create_blog_post(data: BlogPostCreate, user: dict = Depends(get_current_user)):
    doc = {**data.model_dump(), "created_at": datetime.now(timezone.utc)}
    result = await db.blog.insert_one(doc)
    return {"id": str(result.inserted_id), **data.model_dump(), "created_at": doc["created_at"].isoformat()}

@content_router.put("/blog/{id}", response_model=BlogPostResponse)
async def update_blog_post(id: str, data: BlogPostCreate, user: dict = Depends(get_current_user)):
    post = await db.blog.find_one({"_id": ObjectId(id)})
    await db.blog.update_one({"_id": ObjectId(id)}, {"$set": data.model_dump()})
    return {"id": id, **data.model_dump(), "created_at": post.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(post.get("created_at"), datetime) else str(post.get("created_at", ""))}

@content_router.delete("/blog/{id}")
async def delete_blog_post(id: str, user: dict = Depends(get_current_user)):
    await db.blog.delete_one({"_id": ObjectId(id)})
    return {"message": "Eliminado"}

# ============================================
# CONTENT ROUTES - SITE SETTINGS
# ============================================

@content_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one()
    if not settings:
        return {"site_title": "Bariatric Istanbul", "site_description": "", "phone": "", "email": "", "whatsapp_link": "", "address": ""}
    return {k: settings.get(k, "") for k in ["site_title", "site_description", "phone", "email", "whatsapp_link", "address"]}

@content_router.post("/settings")
async def save_settings(data: SiteSettingsUpdate, user: dict = Depends(get_current_user)):
    await db.settings.delete_many({})
    await db.settings.insert_one(data.model_dump(exclude_none=True))
    return {"message": "Configuración guardada"}

# ============================================
# SETUP ROUTERS
# ============================================

api_router.include_router(auth_router)
api_router.include_router(content_router)

@api_router.get("/")
async def root():
    return {"message": "Bariatric Istanbul API - Cirugía Bariátrica en Turquía"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# STARTUP - SEED DATA
# ============================================

@app.on_event("startup")
async def startup_event():
    # Create admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@bariatricistanbul.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password), "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc)})
        logger.info(f"Admin created: {admin_email}")
    
    # Seed default Spanish content
    if await db.transformations.count_documents({}) == 0:
        await db.transformations.insert_many([
            {"weight_lost": "85kg perdidos", "months_post_op": "12 meses post-op", "image_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=400", "patient_name": "María G.", "procedure_type": "Manga Gástrica"},
            {"weight_lost": "60kg perdidos", "months_post_op": "18 meses post-op", "image_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=400", "patient_name": "Carlos R.", "procedure_type": "Bypass Gástrico"},
            {"weight_lost": "70kg perdidos", "months_post_op": "10 meses post-op", "image_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=400", "patient_name": "Ana M.", "procedure_type": "Manga Gástrica"},
            {"weight_lost": "55kg perdidos", "months_post_op": "14 meses post-op", "image_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=400", "patient_name": "Pedro L.", "procedure_type": "Manga Gástrica"},
        ])
    
    if await db.testimonials.count_documents({}) == 0:
        await db.testimonials.insert_many([
            {"name": "María García", "country": "España", "text": "Mi experiencia superó todas mis expectativas. Desde la recogida en el aeropuerto hasta el cuidado postoperatorio, todo fue perfecto. ¡He perdido 45kg y me siento como una persona nueva!", "rating": 5},
            {"name": "Carlos Rodríguez", "country": "México", "text": "El Dr. Yılmaz y su equipo son increíbles. El hospital es de primera clase y la atención que recibí fue excepcional. La mejor decisión que tomé para mi salud.", "rating": 5},
            {"name": "Ana Martínez", "country": "Argentina", "text": "Estaba nerviosa por operarme en el extranjero, pero Bariatric Istanbul me hizo sentir completamente segura. ¡Los resultados hablan por sí solos - 60kg menos!", "rating": 5},
        ])
    
    if await db.video_testimonials.count_documents({}) == 0:
        await db.video_testimonials.insert_many([
            {"title": "La Historia de María", "duration": "3:45", "thumbnail_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=600", "video_url": "https://www.w3schools.com/html/mov_bbb.mp4"},
            {"title": "El Viaje de Carlos", "duration": "4:12", "thumbnail_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=600", "video_url": "https://www.w3schools.com/html/mov_bbb.mp4"},
            {"title": "Transformación de Ana", "duration": "2:58", "thumbnail_url": "https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd?w=600", "video_url": "https://www.w3schools.com/html/mov_bbb.mp4"},
        ])
    
    if await db.itinerary.count_documents({}) == 0:
        await db.itinerary.insert_many([
            {"day_number": 1, "title": "Llegada y Bienvenida", "description": "Recogida VIP en el aeropuerto. Check-in en hotel 5 estrellas. Conoce a tu coordinador personal. Análisis de sangre y evaluación médica en el hospital."},
            {"day_number": 2, "title": "Consulta y Preparación", "description": "Consulta detallada con el Dr. Yılmaz. Revisión del historial médico y plan quirúrgico. Pruebas preoperatorias finales. Conoce al equipo de anestesiología."},
            {"day_number": 3, "title": "Día de la Cirugía", "description": "Admisión en suite privada del hospital. Cirugía bariátrica realizada por el Dr. Yılmaz. Monitoreo postoperatorio en recuperación. Cuidado de enfermería 24/7."},
            {"day_number": 4, "title": "Recuperación", "description": "Continúa la recuperación en suite privada. Inicio de dieta líquida. Revisiones regulares del equipo médico. Ejercicios suaves de movilización."},
            {"day_number": 5, "title": "Alta y Cuidados", "description": "Examen final del Dr. Yılmaz. Alta del hospital. Regreso al hotel para descansar. Guías dietéticas y calendario de medicación."},
            {"day_number": 6, "title": "Seguimiento y Partida", "description": "Revisión final con el equipo médico. Recibe paquete completo de cuidados posteriores. Traslado VIP al aeropuerto. ¡Comienza tu nuevo viaje de vida!"},
        ])
    
    if await db.surgeon.count_documents({}) == 0:
        await db.surgeon.insert_one({
            "name": "Dr. Mehmet Yılmaz",
            "title": "Cirujano Bariátrico Principal",
            "bio": "Con más de 15 años de experiencia y más de 5.000 procedimientos bariátricos exitosos, el Dr. Yılmaz es uno de los principales cirujanos bariátricos de Turquía. Certificado y con formación internacional, se especializa en técnicas mínimamente invasivas que garantizan una recuperación más rápida y resultados óptimos.",
            "image_url": "https://images.pexels.com/photos/7585019/pexels-photo-7585019.jpeg",
            "surgeries_count": "5000+",
            "years_experience": "15+",
            "credentials": ["Miembro de IFSO (Federación Internacional de Cirugía de la Obesidad)", "Cirujano General Certificado", "Fellowship en Cirugía Mínimamente Invasiva"]
        })
    
    if await db.hospital.count_documents({}) == 0:
        await db.hospital.insert_one({
            "name": "Hospital de Clase Mundial en Estambul",
            "description": "Nuestro hospital asociado es una instalación acreditada por la JCI con quirófanos de última generación, suites privadas de recuperación y soporte médico 24/7. Ubicado en el corazón de Estambul, experimentará atención premium en un ambiente moderno y cómodo.",
            "image_url": "https://images.unsplash.com/photo-1764885518098-781b23d50e7f",
            "features": ["Acreditación Internacional JCI", "Última Tecnología Laparoscópica", "Habitaciones Privadas VIP", "Departamento Dedicado a Pacientes Internacionales", "Laboratorio e Imagenología en el Sitio"]
        })
    
    # Seed SEO Blog Posts
    if await db.blog.count_documents({}) == 0:
        await db.blog.insert_many([
            {
                "title": "Manga Gástrica en Turquía: Guía Completa 2024",
                "slug": "manga-gastrica-turquia-guia-completa",
                "excerpt": "Todo lo que necesitas saber sobre la cirugía de manga gástrica en Turquía: precios, procedimiento, recuperación y por qué Estambul es el destino líder mundial.",
                "content": """<h2>¿Qué es la Manga Gástrica?</h2>
<p>La manga gástrica, también conocida como gastrectomía en manga, es el procedimiento bariátrico más popular del mundo. Consiste en remover aproximadamente el 80% del estómago, dejando un estómago en forma de tubo o "manga".</p>

<h2>¿Por qué elegir Turquía para tu Manga Gástrica?</h2>
<p>Turquía se ha convertido en el destino número uno mundial para cirugía bariátrica por varias razones:</p>
<ul>
<li><strong>Precios accesibles:</strong> Ahorra hasta un 70% comparado con España, México o Estados Unidos</li>
<li><strong>Cirujanos expertos:</strong> Médicos con formación internacional y miles de procedimientos exitosos</li>
<li><strong>Hospitales de primera:</strong> Instalaciones acreditadas por JCI con tecnología de última generación</li>
<li><strong>Paquetes todo incluido:</strong> Cirugía, hotel, traslados y cuidados posteriores incluidos</li>
</ul>

<h2>¿Cuánto cuesta la Manga Gástrica en Turquía?</h2>
<p>Los paquetes todo incluido de manga gástrica en Estambul comienzan desde €3,500, incluyendo:</p>
<ul>
<li>Cirugía y anestesia</li>
<li>Estancia hospitalaria en habitación privada</li>
<li>Hotel 5 estrellas (4-5 noches)</li>
<li>Traslados aeropuerto-hotel-hospital</li>
<li>Traductor personal</li>
<li>12 meses de seguimiento</li>
</ul>

<h2>Resultados esperados</h2>
<p>Los pacientes de manga gástrica típicamente pierden entre el 60-70% de su exceso de peso en los primeros 12-18 meses después de la cirugía.</p>""",
                "image_url": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
                "meta_title": "Manga Gástrica en Turquía 2024 | Precios, Procedimiento y Resultados",
                "meta_description": "Guía completa sobre manga gástrica en Turquía. Precios desde €3,500. Cirujanos expertos, hospitales JCI, paquetes todo incluido. ¡Solicita tu consulta gratis!",
                "keywords": ["manga gástrica turquía", "manga gástrica estambul", "cirugía bariátrica turquía", "manga gástrica precio", "gastrectomía en manga"],
                "published": True,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "title": "Bypass Gástrico vs Manga Gástrica: ¿Cuál es Mejor para Ti?",
                "slug": "bypass-gastrico-vs-manga-gastrica",
                "excerpt": "Comparación detallada entre bypass gástrico y manga gástrica para ayudarte a decidir cuál procedimiento es mejor para tu situación.",
                "content": """<h2>Bypass Gástrico vs Manga Gástrica</h2>
<p>Ambos procedimientos son efectivos para la pérdida de peso, pero tienen diferencias importantes que debes conocer.</p>

<h2>Manga Gástrica</h2>
<ul>
<li>Procedimiento más simple y rápido</li>
<li>Pérdida de peso: 60-70% del exceso</li>
<li>Recuperación más rápida</li>
<li>Sin malabsorción de nutrientes</li>
<li>Ideal para IMC 35-45</li>
</ul>

<h2>Bypass Gástrico</h2>
<ul>
<li>Procedimiento más complejo</li>
<li>Pérdida de peso: 70-80% del exceso</li>
<li>Mejor para diabetes tipo 2</li>
<li>Requiere suplementación de vitaminas</li>
<li>Ideal para IMC > 45</li>
</ul>

<h2>¿Cuál elegir?</h2>
<p>La elección depende de tu IMC, condiciones médicas, y objetivos. En Bariatric Istanbul, nuestro equipo te ayudará a determinar el mejor procedimiento para ti durante tu consulta gratuita.</p>""",
                "image_url": "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800",
                "meta_title": "Bypass Gástrico vs Manga Gástrica | Comparación Completa 2024",
                "meta_description": "¿Bypass gástrico o manga gástrica? Conoce las diferencias, ventajas y cuál procedimiento es mejor para ti. Consulta gratuita con expertos en Turquía.",
                "keywords": ["bypass gástrico", "manga gástrica", "cirugía bariátrica", "bypass vs manga", "cual es mejor bypass o manga"],
                "published": True,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "title": "Precios de Cirugía Bariátrica en Turquía 2024",
                "slug": "precios-cirugia-bariatrica-turquia",
                "excerpt": "Guía actualizada de precios de cirugía bariátrica en Turquía. Manga gástrica, bypass gástrico y balón gástrico con paquetes todo incluido.",
                "content": """<h2>¿Por qué los precios son más bajos en Turquía?</h2>
<p>Los precios más accesibles no significan menor calidad. Turquía ofrece:</p>
<ul>
<li>Menores costos operativos</li>
<li>Tipo de cambio favorable</li>
<li>Apoyo gubernamental al turismo médico</li>
<li>Alto volumen de procedimientos (mayor experiencia)</li>
</ul>

<h2>Precios de Paquetes Todo Incluido 2024</h2>
<table>
<tr><th>Procedimiento</th><th>Precio</th></tr>
<tr><td>Manga Gástrica</td><td>Desde €3,500</td></tr>
<tr><td>Bypass Gástrico</td><td>Desde €4,500</td></tr>
<tr><td>Balón Gástrico</td><td>Desde €2,500</td></tr>
<tr><td>Cirugía de Revisión</td><td>Consultar</td></tr>
</table>

<h2>¿Qué incluye el paquete?</h2>
<ul>
<li>Consulta preoperatoria</li>
<li>Todos los análisis y pruebas</li>
<li>Cirugía + anestesia</li>
<li>3-4 noches de hospital</li>
<li>4-5 noches de hotel 5 estrellas</li>
<li>Traslados VIP</li>
<li>Traductor</li>
<li>12 meses de seguimiento online</li>
</ul>""",
                "image_url": "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=800",
                "meta_title": "Precios Cirugía Bariátrica Turquía 2024 | Paquetes Todo Incluido",
                "meta_description": "Precios actualizados de cirugía bariátrica en Turquía. Manga gástrica desde €3,500. Paquetes todo incluido con hotel 5 estrellas y traslados VIP.",
                "keywords": ["precio manga gástrica turquía", "cirugía bariátrica precio", "cuanto cuesta operarse en turquía", "bypass gástrico precio turquía"],
                "published": True,
                "created_at": datetime.now(timezone.utc)
            }
        ])
    
    logger.info("Startup complete - Spanish content seeded")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
