import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import axios from "axios";

const WHATSAPP_LINK = "https://wa.me/bariatricistanbul";
const CRM_ENDPOINT = "https://crm.bariatricistanbul.com/action/addLeads";
const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Axios instance
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.get('/api/auth/me').then(res => setUser(res.data)).catch(() => localStorage.removeItem('auth_token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('auth_token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const logout = () => { localStorage.removeItem('auth_token'); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

// Icon Component
const FAIcon = ({ icon, className = "" }) => <i className={`${icon} ${className}`}></i>;

// Slick Arrow
const SlickArrow = ({ onClick, direction }) => (
  <button className={`slick-custom-arrow slick-${direction}`} onClick={onClick}>
    <FAIcon icon={direction === 'prev' ? 'fas fa-chevron-left' : 'fas fa-chevron-right'} />
  </button>
);

// Slider Settings
const sliderSettings = {
  dots: true, infinite: true, speed: 500, slidesToShow: 3, slidesToScroll: 1,
  prevArrow: <SlickArrow direction="prev" />, nextArrow: <SlickArrow direction="next" />,
  responsive: [{ breakpoint: 1024, settings: { slidesToShow: 2 } }, { breakpoint: 640, settings: { slidesToShow: 1 } }]
};

// ============================================
// LANDING PAGE COMPONENTS
// ============================================

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navLinks = [
    { href: "#nosotros", label: "Nosotros" },
    { href: "#hospital", label: "Hospital" },
    { href: "#cirujano", label: "Cirujano" },
    { href: "#procedimientos", label: "Procedimientos" },
    { href: "#itinerario", label: "Itinerario" },
    { href: "#resultados", label: "Resultados" },
    { href: "#testimonios", label: "Testimonios" },
    { href: "#faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
  ];

  const scrollTo = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center"><img src="/logo.png" alt="Bariatric Istanbul" className="h-14 md:h-16" /></Link>          
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              link.href.startsWith('#') ? 
                <a key={link.href} href={link.href} onClick={(e) => scrollTo(e, link.href)} className="nav-link text-zinc-400 hover:text-zinc-50 text-sm">{link.label}</a> :
                <Link key={link.href} to={link.href} className="nav-link text-zinc-400 hover:text-zinc-50 text-sm">{link.label}</Link>
            ))}
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <FAIcon icon="fab fa-whatsapp" />WhatsApp
            </a>
            <a href="#contacto" className="btn-gold px-6 py-2 rounded-full text-sm">Consulta Gratis</a>
          </div>

          <button className="lg:hidden text-zinc-50 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <FAIcon icon={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"} className="text-xl" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-zinc-950/98 backdrop-blur-xl border-b border-white/5 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            link.href.startsWith('#') ?
              <a key={link.href} href={link.href} onClick={(e) => scrollTo(e, link.href)} className="block text-zinc-400 hover:text-zinc-50 py-2">{link.label}</a> :
              <Link key={link.href} to={link.href} onClick={() => setMobileMenuOpen(false)} className="block text-zinc-400 hover:text-zinc-50 py-2">{link.label}</Link>
          ))}
          <a href="#contacto" className="btn-gold block text-center px-6 py-3 rounded-full mt-4">Consulta Gratis</a>
        </div>
      )}
    </nav>
  );
};

const HeroSection = () => {
  const [formData, setFormData] = useState({ name: "", surname: "", email: "", phone: "", language: "spanish" });
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(CRM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      setStatus("success");
    } catch { setStatus("error"); }
  };

  return (
    <section className="hero-bg min-h-screen flex items-center pt-20" id="contacto">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Cirugía Bariátrica de Clase Mundial en Turquía</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-zinc-50 leading-tight mb-6">
              Manga Gástrica en <span className="text-gold">Estambul</span>
            </h1>
            <p className="text-lg text-zinc-300 mb-8 max-w-lg">
              Únete a miles de pacientes internacionales que han logrado una pérdida de peso duradera con nuestros cirujanos acreditados internacionalmente.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              {["Hospital Acreditado JCI", "+5000 Cirugías Exitosas", "Paquetes Todo Incluido"].map((item, i) => (
                <div key={i} className="flex items-center gap-2"><FAIcon icon="fas fa-check" className="text-gold" /><span className="text-zinc-300 text-sm">{item}</span></div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-8 animate-fade-in-up animation-delay-200">
            <h2 className="font-serif text-2xl text-zinc-50 mb-2">Comienza Tu Transformación</h2>
            <p className="text-zinc-400 mb-6">Consulta gratuita y plan de tratamiento personalizado</p>
            
            {status === "success" ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FAIcon icon="fas fa-check" className="text-green-500 text-2xl" />
                </div>
                <h3 className="font-serif text-xl text-zinc-50 mb-2">¡Gracias!</h3>
                <p className="text-zinc-400">Te contactaremos en 24 horas.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Nombre" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="form-input h-12" required />
                  <Input placeholder="Apellido" value={formData.surname} onChange={(e) => setFormData({...formData, surname: e.target.value})} className="form-input h-12" required />
                </div>
                <Input type="email" placeholder="Correo Electrónico" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="form-input h-12" required />
                <div className="phone-input-wrapper">
                  <PhoneInput defaultCountry="es" value={formData.phone} onChange={(phone) => setFormData({...formData, phone})} />
                </div>
                <Select value={formData.language} onValueChange={(v) => setFormData({...formData, language: v})}>
                  <SelectTrigger className="form-input h-12"><SelectValue placeholder="Idioma Preferido" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="spanish">Español</SelectItem>
                    <SelectItem value="english">Inglés</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="btn-gold w-full h-12 text-base font-medium">Solicitar Consulta Gratis</Button>
                <p className="text-zinc-500 text-xs text-center">Al enviar, aceptas nuestra política de privacidad.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutSection = () => (
  <section id="nosotros" className="bg-zinc-950 py-24">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="text-center mb-16">
        <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">¿Por Qué Elegirnos?</p>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Excelencia en Cirugía Bariátrica</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">Combinamos experiencia médica de clase mundial con la calidez de la hospitalidad turca.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { number: "5000+", label: "Cirugías Exitosas", icon: "fas fa-trophy" },
          { number: "98%", label: "Satisfacción", icon: "fas fa-star" },
          { number: "15+", label: "Años de Experiencia", icon: "fas fa-calendar-alt" },
          { number: "50+", label: "Países Atendidos", icon: "fas fa-globe" },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-8 text-center card-hover">
            <FAIcon icon={stat.icon} className="text-gold text-3xl mb-4" />
            <p className="font-serif text-3xl text-gold mb-2">{stat.number}</p>
            <p className="text-zinc-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HospitalSection = () => {
  const [hospital, setHospital] = useState(null);
  useEffect(() => { api.get('/api/content/hospital').then(res => setHospital(res.data)).catch(() => {}); }, []);

  if (!hospital) return null;

  return (
    <section id="hospital" className="bg-zinc-900 py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="img-zoom rounded-2xl overflow-hidden">
            <img src={hospital.image_url} alt={hospital.name} className="w-full h-[400px] object-cover" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Nuestras Instalaciones</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-zinc-50 mb-6">{hospital.name}</h2>
            <p className="text-zinc-300 mb-6">{hospital.description}</p>
            <ul className="space-y-4">
              {hospital.features?.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300"><FAIcon icon="fas fa-check-circle" className="text-gold" />{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const SurgeonSection = () => {
  const [surgeon, setSurgeon] = useState(null);
  useEffect(() => { api.get('/api/content/surgeon').then(res => setSurgeon(res.data)).catch(() => {}); }, []);

  if (!surgeon) return null;

  return (
    <section id="cirujano" className="bg-zinc-950 py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Conoce a Tu Cirujano</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-zinc-50 mb-2">{surgeon.name}</h2>
            <p className="text-gold mb-6">{surgeon.title}</p>
            <p className="text-zinc-300 mb-6">{surgeon.bio}</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass rounded-xl p-4"><p className="text-gold font-serif text-2xl">{surgeon.surgeries_count}</p><p className="text-zinc-400 text-sm">Cirugías</p></div>
              <div className="glass rounded-xl p-4"><p className="text-gold font-serif text-2xl">{surgeon.years_experience}</p><p className="text-zinc-400 text-sm">Años Experiencia</p></div>
            </div>
            <ul className="space-y-3">
              {surgeon.credentials?.map((c, i) => (
                <li key={i} className="flex items-start gap-3 text-zinc-300 text-sm"><FAIcon icon="fas fa-award" className="text-gold mt-0.5" />{c}</li>
              ))}
            </ul>
          </div>
          <div className="order-1 lg:order-2 img-zoom rounded-2xl overflow-hidden">
            <img src={surgeon.image_url} alt={surgeon.name} className="w-full h-[500px] object-cover object-top" />
          </div>
        </div>
      </div>
    </section>
  );
};

const ProceduresSection = () => {
  const procedures = [
    { title: "Manga Gástrica", desc: "El procedimiento más popular. Reduce el estómago un 80% para disminuir el apetito.", benefits: ["60-70% pérdida de exceso de peso", "Recuperación rápida", "Sin cuerpos extraños"], icon: "fas fa-cut" },
    { title: "Bypass Gástrico", desc: "Crea una bolsa estomacal pequeña y redirige el sistema digestivo.", benefits: ["70-80% pérdida de exceso de peso", "Resuelve diabetes tipo 2", "Resultados duraderos"], icon: "fas fa-random" },
    { title: "Balón Gástrico", desc: "Opción no quirúrgica. Un balón de silicona reduce la capacidad del estómago.", benefits: ["Sin cirugía", "Colocación 6-12 meses", "15-20% pérdida de peso"], icon: "fas fa-circle" },
    { title: "Cirugía de Revisión", desc: "Para pacientes que necesitan corrección de un procedimiento previo.", benefits: ["Enfoque personalizado", "Equipo experto", "Mejores resultados"], icon: "fas fa-redo" },
  ];

  return (
    <section id="procedimientos" className="bg-zinc-900 py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Nuestros Procedimientos</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Opciones de Cirugía</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {procedures.map((p, i) => (
            <div key={i} className="procedure-card rounded-2xl p-8 card-hover">
              <FAIcon icon={p.icon} className="text-gold text-2xl mb-4" />
              <h3 className="font-serif text-2xl text-zinc-50 mb-3">{p.title}</h3>
              <p className="text-zinc-400 mb-4">{p.desc}</p>
              <ul className="space-y-2 mb-6">
                {p.benefits.map((b, j) => <li key={j} className="flex items-center gap-2 text-zinc-300 text-sm"><FAIcon icon="fas fa-check" className="text-gold text-xs" />{b}</li>)}
              </ul>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm">
                <FAIcon icon="fab fa-whatsapp" />Solicitar Presupuesto
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ItinerarySection = () => {
  const [itinerary, setItinerary] = useState([]);
  useEffect(() => { api.get('/api/content/itinerary').then(res => setItinerary(res.data)).catch(() => {}); }, []);

  return (
    <section id="itinerario" className="bg-zinc-950 py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Tu Viaje</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Itinerario del Tratamiento</h2>
        </div>
        <div className="relative">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gold/30 md:-translate-x-1/2"></div>
          <div className="space-y-8">
            {itinerary.map((day, i) => (
              <div key={day.id} className={`relative flex items-start gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className="hidden md:block flex-1"></div>
                <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-gold rounded-full -translate-x-1/2 mt-2 z-10"></div>
                <div className="flex-1 ml-16 md:ml-0 glass rounded-2xl p-6">
                  <span className="bg-gold text-zinc-950 text-sm font-bold px-3 py-1 rounded-full">Día {day.day_number}</span>
                  <h3 className="font-serif text-xl text-zinc-50 mt-3 mb-2">{day.title}</h3>
                  <p className="text-zinc-400">{day.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const GallerySection = () => {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/api/content/transformations').then(res => setItems(res.data)).catch(() => {}); }, []);

  if (items.length === 0) return null;

  return (
    <section id="resultados" className="bg-zinc-950 py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Resultados Reales</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Transformaciones de Pacientes</h2>
        </div>
        <div className="slick-slider-container">
          <Slider {...sliderSettings}>
            {items.map((item, i) => (
              <div key={item.id} className="px-3">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800 group">
                  <img src={item.image_url} alt={item.weight_lost} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                    <div>
                      <p className="text-gold font-semibold text-lg">{item.weight_lost}</p>
                      <p className="text-zinc-400">{item.months_post_op}</p>
                      {item.procedure_type && <p className="text-zinc-500 text-sm">{item.procedure_type}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/api/content/testimonials').then(res => setItems(res.data)).catch(() => {}); }, []);

  if (items.length === 0) return null;

  return (
    <section id="testimonios" className="bg-zinc-900 py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Testimonios</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Lo Que Dicen Nuestros Pacientes</h2>
        </div>
        <div className="slick-slider-container">
          <Slider {...sliderSettings}>
            {items.map((t) => (
              <div key={t.id} className="px-3">
                <div className="testimonial-card rounded-2xl p-8 h-full">
                  <div className="flex gap-1 mb-4">{[...Array(t.rating)].map((_, i) => <FAIcon key={i} icon="fas fa-star" className="text-gold" />)}</div>
                  <p className="text-zinc-300 mb-6">"{t.text}"</p>
                  <div><p className="text-zinc-50 font-medium">{t.name}</p><p className="text-zinc-500 text-sm">{t.country}</p></div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
};

const VideoTestimonialsSection = () => {
  const [items, setItems] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  useEffect(() => { api.get('/api/content/video-testimonials').then(res => setItems(res.data)).catch(() => {}); }, []);

  const isYouTube = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  if (items.length === 0) return null;

  return (
    <section className="bg-zinc-950 py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Videos</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Testimonios en Video</h2>
        </div>
        <div className="slick-slider-container">
          <Slider {...sliderSettings}>
            {items.map((v) => (
              <div key={v.id} className="px-3">
                <div className="relative aspect-[4/5] bg-zinc-800 rounded-2xl overflow-hidden group cursor-pointer card-hover" onClick={() => setActiveVideo(v)}>
                  <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FAIcon icon="fas fa-play" className="text-zinc-950 text-2xl ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6"><p className="text-zinc-50 font-medium text-lg">{v.title}</p><p className="text-zinc-400">{v.duration}</p></div>
                </div>
              </div>
            ))}
          </Slider>
        </div>

        {activeVideo && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setActiveVideo(null)}>
            <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setActiveVideo(null)} className="absolute -top-12 right-0 w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-white hover:text-gold">
                <FAIcon icon="fas fa-times" />
              </button>
              {isYouTube(activeVideo.video_url) ? (
                <iframe src={`https://www.youtube.com/embed/${getYouTubeId(activeVideo.video_url)}?autoplay=1`} className="w-full aspect-video rounded-xl" allow="autoplay; encrypted-media" allowFullScreen title={activeVideo.title} />
              ) : (
                <video src={activeVideo.video_url} controls autoPlay className="w-full rounded-xl" />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const FAQSection = () => {
  const faqs = [
    { q: "¿Cuánto cuesta la manga gástrica en Turquía?", a: "Ofrecemos paquetes todo incluido con precios competitivos. Cada caso es único, por lo que le invitamos a contactarnos por WhatsApp o formulario para recibir un presupuesto personalizado sin compromiso." },
    { q: "¿Es seguro operarse en Turquía?", a: "Absolutamente. Turquía es líder mundial en turismo médico. Nuestro hospital tiene acreditación JCI y nuestros cirujanos tienen formación internacional." },
    { q: "¿Cuántos días necesito quedarme en Estambul?", a: "La mayoría de pacientes se quedan 5-7 días. Esto incluye pruebas preoperatorias, cirugía y seguimiento inicial." },
    { q: "¿Qué incluye el paquete?", a: "Cirugía, anestesia, estancia hospitalaria privada, hotel 5 estrellas, traslados VIP, traductor y 12 meses de seguimiento online. Contáctenos para más detalles." },
    { q: "¿Cuánto peso puedo perder?", a: "Con manga gástrica: 60-70% del exceso de peso en 12-18 meses. Con bypass gástrico: 70-80% del exceso de peso." },
    { q: "¿Qué seguimiento ofrecen?", a: "12 meses de seguimiento incluido: consultas virtuales, guía nutricional, soporte WhatsApp 24/7 y acceso a nuestra comunidad de pacientes." },
  ];

  return (
    <section id="faq" className="bg-zinc-900 py-24">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">FAQ</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Preguntas Frecuentes</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="bg-zinc-800/50 border border-zinc-700 rounded-xl px-6 data-[state=open]:border-gold/30">
              <AccordionTrigger className="text-left text-zinc-50 hover:text-gold py-5 hover:no-underline">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-zinc-400 pb-5">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="cta-bg py-24">
    <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Comienza Hoy</p>
      <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">¿Listo para Transformar Tu Vida?</h2>
      <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">Da el primer paso hacia una vida más saludable. Contáctanos hoy para una consulta gratuita y presupuesto personalizado.</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-8 py-4 rounded-full text-lg inline-flex items-center justify-center gap-2">
          <FAIcon icon="fab fa-whatsapp" className="text-xl" />Chatear por WhatsApp
        </a>
        <a href="#contacto" className="btn-gold px-8 py-4 rounded-full text-lg">Solicitar Consulta</a>
      </div>
      <div className="flex flex-wrap justify-center gap-8 text-zinc-400">
        <a href="mailto:help@bariatricistanbul.com" className="flex items-center gap-2 hover:text-gold"><FAIcon icon="fas fa-envelope" />help@bariatricistanbul.com</a>
        <a href="https://www.instagram.com/bariatricaistanbul" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold"><FAIcon icon="fab fa-instagram" />@bariatricaistanbul</a>
        <span className="flex items-center gap-2"><FAIcon icon="fas fa-map-marker-alt" />Estambul, Turquía</span>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-zinc-950 border-t border-zinc-800 py-12">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <Link to="/" className="flex items-center"><img src="/logo.png" alt="Bariatric Istanbul" className="h-12" /></Link>
          <p className="text-zinc-500 text-sm mt-2">Cirugía bariátrica de clase mundial en Turquía</p>
        </div>
        <div className="flex flex-wrap gap-6 text-zinc-400 text-sm justify-center">
          <Link to="/politica-de-privacidad" className="hover:text-gold">Política de Privacidad</Link>
          <Link to="/terminos" className="hover:text-gold">Términos</Link>
          <Link to="/cancelacion-y-reembolso" className="hover:text-gold">Cancelación y Reembolso</Link>
          <Link to="/blog" className="hover:text-gold">Blog</Link>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://www.instagram.com/bariatricaistanbul" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-gold text-xl"><FAIcon icon="fab fa-instagram" /></a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-gold text-xl"><FAIcon icon="fab fa-whatsapp" /></a>
          <a href="mailto:help@bariatricistanbul.com" className="text-zinc-400 hover:text-gold text-xl"><FAIcon icon="fas fa-envelope" /></a>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent my-8"></div>
      <p className="text-zinc-500 text-sm text-center">© 2024 Bariatric Istanbul. Todos los derechos reservados.</p>
    </div>
  </footer>
);

const WhatsAppButton = () => (
  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-40 btn-whatsapp w-16 h-16 rounded-full flex items-center justify-center animate-pulse-glow shadow-lg">
    <FAIcon icon="fab fa-whatsapp" className="text-3xl" />
  </a>
);

// ============================================
// BLOG COMPONENTS
// ============================================

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  useEffect(() => { api.get('/api/content/blog?published_only=true').then(res => setPosts(res.data)).catch(() => {}); }, []);

  return (
    <div className="bg-zinc-950 min-h-screen pt-24">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Blog</p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Artículos sobre Cirugía Bariátrica</h1>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="glass rounded-2xl overflow-hidden card-hover group">
              <div className="aspect-video overflow-hidden">
                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <h2 className="font-serif text-xl text-zinc-50 mb-2 group-hover:text-gold transition-colors">{post.title}</h2>
                <p className="text-zinc-400 text-sm line-clamp-3">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => { api.get(`/api/content/blog/${slug}`).then(res => setPost(res.data)).catch(() => {}); }, [slug]);

  if (!post) return <div className="bg-zinc-950 min-h-screen pt-24 flex items-center justify-center"><FAIcon icon="fas fa-spinner fa-spin" className="text-gold text-3xl" /></div>;

  return (
    <div className="bg-zinc-950 min-h-screen pt-24">
      <Navigation />
      <article className="max-w-4xl mx-auto px-6 md:px-12 py-12">
        <Link to="/blog" className="text-gold hover:underline text-sm mb-4 inline-block">← Volver al Blog</Link>
        <h1 className="font-serif text-3xl sm:text-4xl text-zinc-50 mb-6">{post.title}</h1>
        <img src={post.image_url} alt={post.title} className="w-full rounded-2xl mb-8" />
        <div className="prose prose-invert prose-gold max-w-none text-zinc-300" dangerouslySetInnerHTML={{ __html: post.content }} />
        
        <div className="mt-12 glass rounded-2xl p-8 text-center">
          <h3 className="font-serif text-2xl text-zinc-50 mb-4">¿Tienes preguntas?</h3>
          <p className="text-zinc-400 mb-6">Solicita tu consulta gratuita hoy</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp inline-flex items-center gap-2 px-8 py-4 rounded-full">
            <FAIcon icon="fab fa-whatsapp" className="text-xl" />Contactar por WhatsApp
          </a>
        </div>
      </article>
      <Footer />
    </div>
  );
};

// ============================================
// ADMIN COMPONENTS
// ============================================

const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-4"><img src="/logo.png" alt="Bariatric Istanbul" className="h-16" /></div>
        <p className="text-zinc-400 text-center mb-8">Admin Panel</p>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="admin-login-form">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input h-12" required data-testid="admin-email-input" />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input h-12" required data-testid="admin-password-input" />
          {error && <p className="text-red-400 text-sm" data-testid="admin-login-error">{error}</p>}
          <Button type="submit" className="btn-gold w-full h-12" data-testid="admin-login-btn">Sign In</Button>
        </form>
        <Link to="/" className="block text-center text-zinc-400 hover:text-gold mt-6 text-sm">← Back to site</Link>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("transformations");
  const [data, setData] = useState({});
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const tabs = [
    { key: "transformations", label: "Transformations", icon: "fas fa-images" },
    { key: "testimonials", label: "Testimonials", icon: "fas fa-quote-right" },
    { key: "videoTestimonials", label: "Videos", icon: "fas fa-video" },
    { key: "itinerary", label: "Itinerary", icon: "fas fa-calendar-day" },
    { key: "surgeon", label: "Surgeon", icon: "fas fa-user-md" },
    { key: "hospital", label: "Hospital", icon: "fas fa-hospital" },
    { key: "blog", label: "Blog", icon: "fas fa-blog" },
  ];

  const endpoints = {
    transformations: "transformations", testimonials: "testimonials", videoTestimonials: "video-testimonials",
    itinerary: "itinerary", surgeon: "surgeon", hospital: "hospital", blog: "blog"
  };

  useEffect(() => { loadData(); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const res = await api.get(`/api/content/${endpoints[activeTab]}`);
      setData(prev => ({ ...prev, [activeTab]: res.data }));
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await api.delete(`/api/content/${endpoints[activeTab]}/${id}`);
    loadData();
  };

  const handleSave = async (formData) => {
    if (activeTab === 'surgeon' || activeTab === 'hospital') {
      await api.post(`/api/content/${endpoints[activeTab]}`, formData);
    } else if (editItem) {
      await api.put(`/api/content/${endpoints[activeTab]}/${editItem.id}`, formData);
    } else {
      await api.post(`/api/content/${endpoints[activeTab]}`, formData);
    }
    setShowForm(false);
    setEditItem(null);
    loadData();
  };

  const handleLogout = () => { logout(); navigate("/admin"); };

  const currentData = data[activeTab];
  const isSingle = activeTab === 'surgeon' || activeTab === 'hospital';

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="flex items-center"><img src="/logo.png" alt="Bariatric Istanbul" className="h-10" /><span className="ml-2 text-zinc-400 text-sm">Admin</span></h1>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm">{user?.email}</span>
            <Button onClick={handleLogout} variant="outline" size="sm" className="border-zinc-700 text-zinc-300" data-testid="admin-logout-btn">
              <FAIcon icon="fas fa-sign-out-alt" className="mr-2" />Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setShowForm(false); setEditItem(null); }}
              data-testid={`admin-tab-${tab.key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm ${activeTab === tab.key ? 'bg-gold text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
              <FAIcon icon={tab.icon} />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl text-zinc-50">{tabs.find(t => t.key === activeTab)?.label}</h2>
          {!isSingle && <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-gold" data-testid="admin-add-btn"><FAIcon icon="fas fa-plus" className="mr-2" />Add New</Button>}
          {isSingle && !showForm && <Button onClick={() => { setEditItem(currentData); setShowForm(true); }} className="btn-gold" data-testid="admin-edit-btn"><FAIcon icon="fas fa-edit" className="mr-2" />Edit</Button>}
        </div>

        {showForm ? (
          <AdminForm type={activeTab} item={editItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} />
        ) : (
          isSingle ? (
            currentData && <SingleItemDisplay type={activeTab} item={currentData} />
          ) : (
            <AdminList type={activeTab} items={Array.isArray(currentData) ? currentData : []} onEdit={(item) => { setEditItem(item); setShowForm(true); }} onDelete={handleDelete} />
          )
        )}
      </div>
    </div>
  );
};

const SingleItemDisplay = ({ type, item }) => {
  if (!item) return <p className="text-zinc-400">No data yet. Click Edit to add.</p>;

  return (
    <div className="glass rounded-xl p-6">
      {type === 'surgeon' && (
        <div className="flex gap-6">
          <img src={item.image_url} alt={item.name} className="w-40 h-40 rounded-xl object-cover" />
          <div>
            <h3 className="font-serif text-xl text-zinc-50">{item.name}</h3>
            <p className="text-gold">{item.title}</p>
            <p className="text-zinc-400 mt-2">{item.bio?.substring(0, 200)}...</p>
            <p className="text-zinc-300 mt-2">Surgeries: {item.surgeries_count} | Experience: {item.years_experience}</p>
          </div>
        </div>
      )}
      {type === 'hospital' && (
        <div className="flex gap-6">
          <img src={item.image_url} alt={item.name} className="w-40 h-40 rounded-xl object-cover" />
          <div>
            <h3 className="font-serif text-xl text-zinc-50">{item.name}</h3>
            <p className="text-zinc-400 mt-2">{item.description?.substring(0, 200)}...</p>
            <p className="text-zinc-300 mt-2">Features: {item.features?.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminList = ({ type, items, onEdit, onDelete }) => {
  if (!items?.length) return <p className="text-zinc-400 text-center py-12">No items yet. Click "Add New" to create one.</p>;

  return (
    <div className="grid gap-4">
      {items.map((item, i) => (
        <div key={item.id} className="glass rounded-xl p-4 flex items-center gap-4">
          {(type === 'transformations' || type === 'blog') && item.image_url && <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />}
          {type === 'videoTestimonials' && item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="w-24 h-16 rounded-lg object-cover" />}
          <div className="flex-1 min-w-0">
            {type === 'transformations' && <><p className="text-gold font-medium">{item.weight_lost}</p><p className="text-zinc-400 text-sm">{item.months_post_op}</p></>}
            {type === 'testimonials' && <><p className="text-zinc-50">{item.name} - {item.country}</p><p className="text-zinc-400 text-sm truncate">{item.text}</p></>}
            {type === 'videoTestimonials' && <><p className="text-zinc-50">{item.title}</p><p className="text-zinc-400 text-sm">{item.duration}</p></>}
            {type === 'itinerary' && <><p className="text-gold">Day {item.day_number}: {item.title}</p><p className="text-zinc-400 text-sm truncate">{item.description}</p></>}
            {type === 'blog' && <><p className="text-zinc-50">{item.title}</p><p className="text-zinc-400 text-sm">{item.published ? 'Published' : 'Draft'}</p></>}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onEdit(item)} variant="outline" size="sm" className="border-zinc-700" data-testid={`edit-item-${i}`}><FAIcon icon="fas fa-edit" /></Button>
            <Button onClick={() => onDelete(item.id)} variant="outline" size="sm" className="border-red-900 text-red-400" data-testid={`delete-item-${i}`}><FAIcon icon="fas fa-trash" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminForm = ({ type, item, onSave, onCancel }) => {
  const [formData, setFormData] = useState(item || {});
  const [uploading, setUploading] = useState(false);

  const fields = {
    transformations: [
      { name: "weight_lost", label: "Weight Lost", placeholder: "e.g., 85kg lost" },
      { name: "months_post_op", label: "Time Post-Op", placeholder: "e.g., 12 months post-op" },
      { name: "image_url", label: "Image", uploadable: true, accept: "image/*" },
      { name: "patient_name", label: "Patient Name (optional)" },
      { name: "procedure_type", label: "Procedure Type (optional)" },
    ],
    testimonials: [
      { name: "name", label: "Name" },
      { name: "country", label: "Country" },
      { name: "text", label: "Testimonial", textarea: true },
      { name: "rating", label: "Rating (1-5)", type: "number" },
    ],
    videoTestimonials: [
      { name: "title", label: "Title" },
      { name: "duration", label: "Duration" },
      { name: "thumbnail_url", label: "Thumbnail", uploadable: true, accept: "image/*" },
      { name: "video_url", label: "Video (YouTube URL or upload)", uploadable: true, accept: "video/*" },
    ],
    itinerary: [
      { name: "day_number", label: "Day Number", type: "number" },
      { name: "title", label: "Day Title" },
      { name: "description", label: "Description", textarea: true },
    ],
    surgeon: [
      { name: "name", label: "Name" },
      { name: "title", label: "Title / Position" },
      { name: "bio", label: "Biography", textarea: true },
      { name: "image_url", label: "Photo", uploadable: true, accept: "image/*" },
      { name: "surgeries_count", label: "Number of Surgeries" },
      { name: "years_experience", label: "Years of Experience" },
      { name: "credentials", label: "Credentials (one per line)", textarea: true, isArray: true },
    ],
    hospital: [
      { name: "name", label: "Hospital Name" },
      { name: "description", label: "Description", textarea: true },
      { name: "image_url", label: "Photo", uploadable: true, accept: "image/*" },
      { name: "features", label: "Features (one per line)", textarea: true, isArray: true },
    ],
    blog: [
      { name: "title", label: "Title" },
      { name: "slug", label: "Slug (URL)" },
      { name: "excerpt", label: "Excerpt", textarea: true },
      { name: "content", label: "Content (HTML)", textarea: true, large: true },
      { name: "image_url", label: "Featured Image", uploadable: true, accept: "image/*" },
      { name: "meta_title", label: "Meta Title (SEO)" },
      { name: "meta_description", label: "Meta Description (SEO)", textarea: true },
      { name: "keywords", label: "Keywords (one per line)", textarea: true, isArray: true },
      { name: "published", label: "Published", type: "checkbox" },
    ],
  };

  const handleChange = (name, value, isArray) => {
    if (isArray) {
      setFormData({ ...formData, [name]: value.split('\n').filter(Boolean) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const getValue = (name, isArray) => {
    const val = formData[name];
    if (isArray && Array.isArray(val)) return val.join('\n');
    return val || '';
  };

  const handleUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, [fieldName]: res.data.url }));
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="font-serif text-xl text-zinc-50 mb-6">{item ? 'Edit' : 'Add New'}</h3>
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4" data-testid="admin-form">
        {fields[type]?.map((f) => (
          <div key={f.name}>
            <label className="text-zinc-400 text-sm mb-2 block">{f.label}</label>
            {f.type === 'checkbox' ? (
              <input type="checkbox" checked={formData[f.name] || false} onChange={(e) => handleChange(f.name, e.target.checked)} className="w-5 h-5" />
            ) : f.uploadable ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={getValue(f.name)} onChange={(e) => handleChange(f.name, e.target.value)} placeholder="Paste URL or upload file" className="form-input h-12 flex-1" />
                  <label className={`btn-gold px-4 h-12 flex items-center cursor-pointer rounded-lg text-sm shrink-0 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <FAIcon icon={uploading ? "fas fa-spinner fa-spin" : "fas fa-upload"} className="mr-2" />{uploading ? 'Uploading...' : 'Upload'}
                    <input type="file" accept={f.accept} className="hidden" onChange={(e) => handleUpload(e, f.name)} disabled={uploading} />
                  </label>
                </div>
                {getValue(f.name) && f.accept?.includes('image') && (
                  <img src={getValue(f.name)} alt="Preview" className="h-24 rounded-lg object-cover" />
                )}
              </div>
            ) : f.textarea ? (
              <Textarea value={getValue(f.name, f.isArray)} onChange={(e) => handleChange(f.name, e.target.value, f.isArray)} placeholder={f.placeholder} className={`form-input ${f.large ? 'min-h-[200px]' : 'min-h-[100px]'}`} />
            ) : (
              <Input type={f.type || "text"} value={getValue(f.name)} onChange={(e) => handleChange(f.name, f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)} placeholder={f.placeholder} className="form-input h-12" />
            )}
          </div>
        ))}
        <div className="flex gap-4 pt-4">
          <Button type="submit" className="btn-gold" data-testid="admin-save-btn">Save</Button>
          <Button type="button" onClick={onCancel} variant="outline" className="border-zinc-700">Cancel</Button>
        </div>
      </form>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><FAIcon icon="fas fa-spinner fa-spin" className="text-gold text-3xl" /></div>;
  if (!user) return <Navigate to="/admin" replace />;
  return children;
};

// ============================================
// LEGAL PAGES
// ============================================

const LegalPage = ({ title, children }) => (
  <div className="bg-zinc-950 min-h-screen pt-24">
    <Navigation />
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      <Link to="/" className="text-gold hover:underline text-sm mb-4 inline-block">← Volver al inicio</Link>
      <h1 className="font-serif text-3xl sm:text-4xl text-zinc-50 mb-8">{title}</h1>
      <div className="prose prose-invert max-w-none text-zinc-300 space-y-6">{children}</div>
    </div>
    <Footer />
  </div>
);

const PrivacyPage = () => (
  <LegalPage title="Política de Privacidad">
    <p>Última actualización: Enero 2025</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">1. Responsable del Tratamiento</h2>
    <p>Bariatric Istanbul, con domicilio en Estambul, Turquía, es responsable del tratamiento de sus datos personales. Para cualquier consulta relacionada con la privacidad, puede contactarnos en: <a href="mailto:help@bariatricistanbul.com" className="text-gold">help@bariatricistanbul.com</a></p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">2. Datos que Recopilamos</h2>
    <p>Recopilamos los siguientes datos personales cuando usted completa nuestro formulario de contacto:</p>
    <ul className="list-disc pl-6 space-y-2">
      <li>Nombre y apellido</li>
      <li>Dirección de correo electrónico</li>
      <li>Número de teléfono</li>
      <li>Idioma preferido de comunicación</li>
    </ul>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">3. Finalidad del Tratamiento</h2>
    <p>Sus datos personales se utilizan exclusivamente para:</p>
    <ul className="list-disc pl-6 space-y-2">
      <li>Responder a su solicitud de información médica</li>
      <li>Proporcionarle una consulta personalizada</li>
      <li>Enviarle información relevante sobre nuestros servicios</li>
      <li>Coordinar su tratamiento médico en caso de que decida proceder</li>
    </ul>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">4. Protección de Datos</h2>
    <p>Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales contra acceso no autorizado, pérdida o destrucción. Sus datos médicos se tratan con la máxima confidencialidad conforme a la legislación turca de protección de datos (KVKK).</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">5. Compartición de Datos</h2>
    <p>No vendemos ni compartimos sus datos personales con terceros, excepto cuando sea necesario para la prestación de nuestros servicios médicos (hospital, equipo médico) y siempre con su consentimiento previo.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">6. Sus Derechos</h2>
    <p>Usted tiene derecho a acceder, rectificar, eliminar sus datos personales y a oponerse a su tratamiento. Para ejercer estos derechos, contacte: <a href="mailto:help@bariatricistanbul.com" className="text-gold">help@bariatricistanbul.com</a></p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">7. Cookies</h2>
    <p>Nuestro sitio web utiliza cookies para mejorar su experiencia de navegación. Puede aceptar o rechazar las cookies a través del banner de consentimiento que aparece en su primera visita.</p>
  </LegalPage>
);

const TermsPage = () => (
  <LegalPage title="Términos y Condiciones">
    <p>Última actualización: Enero 2025</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">1. Aceptación de los Términos</h2>
    <p>Al acceder y utilizar el sitio web de Bariatric Istanbul, usted acepta estos términos y condiciones en su totalidad. Si no está de acuerdo, por favor no utilice nuestros servicios.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">2. Servicios Médicos</h2>
    <p>Bariatric Istanbul facilita el acceso a servicios de cirugía bariátrica en Turquía. La información proporcionada en este sitio web es de carácter informativo y no sustituye el consejo médico profesional. Cada paciente será evaluado individualmente antes de cualquier procedimiento.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">3. Consultas y Presupuestos</h2>
    <p>Las consultas iniciales son gratuitas y sin compromiso. Los presupuestos proporcionados son personalizados y pueden variar según las necesidades médicas específicas de cada paciente.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">4. Requisitos del Paciente</h2>
    <p>El paciente se compromete a proporcionar información médica veraz y completa. Bariatric Istanbul se reserva el derecho de rechazar un procedimiento si determina que no es médicamente apropiado para el paciente.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">5. Responsabilidad</h2>
    <p>Bariatric Istanbul trabaja con hospitales acreditados y cirujanos certificados. Sin embargo, como en cualquier procedimiento quirúrgico, existen riesgos inherentes que serán explicados durante la consulta preoperatoria.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">6. Propiedad Intelectual</h2>
    <p>Todo el contenido de este sitio web, incluyendo textos, imágenes, logotipos y diseño, es propiedad de Bariatric Istanbul y está protegido por las leyes de propiedad intelectual.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">7. Contacto</h2>
    <p>Para cualquier consulta sobre estos términos: <a href="mailto:help@bariatricistanbul.com" className="text-gold">help@bariatricistanbul.com</a></p>
  </LegalPage>
);

const CancellationPage = () => (
  <LegalPage title="Política de Cancelación y Reembolso">
    <p>Última actualización: Enero 2025</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">1. Cancelación por parte del Paciente</h2>
    <p>Entendemos que las circunstancias pueden cambiar. Nuestra política de cancelación es la siguiente:</p>
    <ul className="list-disc pl-6 space-y-2">
      <li><strong>Más de 30 días antes:</strong> Cancelación gratuita con reembolso completo del depósito</li>
      <li><strong>15-30 días antes:</strong> Reembolso del 50% del depósito</li>
      <li><strong>Menos de 15 días:</strong> El depósito no es reembolsable, pero puede reprogramar su cirugía dentro de los 6 meses siguientes</li>
    </ul>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">2. Cancelación por Razones Médicas</h2>
    <p>Si la cirugía es cancelada por razones médicas determinadas durante la evaluación preoperatoria, se realizará un reembolso completo de todos los pagos realizados.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">3. Reprogramación</h2>
    <p>Los pacientes pueden reprogramar su procedimiento una vez sin costo adicional, siempre que la notificación se realice con al menos 15 días de antelación. Las reprogramaciones están sujetas a disponibilidad.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">4. Reembolsos</h2>
    <p>Los reembolsos se procesan dentro de los 14 días hábiles siguientes a la aprobación. Se realizan por el mismo método de pago utilizado originalmente. Los gastos bancarios de transferencia internacional corren por cuenta del paciente.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">5. Servicios No Reembolsables</h2>
    <p>Los siguientes servicios no son reembolsables una vez utilizados:</p>
    <ul className="list-disc pl-6 space-y-2">
      <li>Traslados ya realizados</li>
      <li>Noches de hotel ya consumidas</li>
      <li>Análisis y pruebas médicas realizadas</li>
      <li>Consultas médicas completadas</li>
    </ul>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">6. Seguimiento Postoperatorio</h2>
    <p>El seguimiento de 12 meses incluido en el paquete no es transferible ni reembolsable una vez realizada la cirugía.</p>
    <h2 className="font-serif text-2xl text-zinc-50 mt-8 mb-4">7. Contacto para Cancelaciones</h2>
    <p>Para solicitar una cancelación o reprogramación, contacte a nuestro equipo:</p>
    <ul className="list-disc pl-6 space-y-2">
      <li>Email: <a href="mailto:help@bariatricistanbul.com" className="text-gold">help@bariatricistanbul.com</a></li>
      <li>WhatsApp: <a href="https://wa.me/bariatricistanbul" className="text-gold">Contactar por WhatsApp</a></li>
    </ul>
  </LegalPage>
);

// ============================================
// LANDING PAGE
// ============================================

const LandingPage = () => (
  <div className="bg-zinc-950 min-h-screen">
    <Navigation />
    <HeroSection />
    <AboutSection />
    <HospitalSection />
    <SurgeonSection />
    <ProceduresSection />
    <ItinerarySection />
    <GallerySection />
    <TestimonialsSection />
    <VideoTestimonialsSection />
    <FAQSection />
    <CTASection />
    <Footer />
    <WhatsAppButton />
  </div>
);

// ============================================
// COOKIE CONSENT BANNER
// ============================================

const CookieConsent = () => {
  const [visible, setVisible] = useState(() => !localStorage.getItem('cookie_consent'));

  const accept = () => { localStorage.setItem('cookie_consent', 'accepted'); setVisible(false); };
  const decline = () => { localStorage.setItem('cookie_consent', 'declined'); setVisible(false); };

  if (!visible) return null;

  return (
    <div data-testid="cookie-consent-banner" className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-4 md:p-6 animate-fade-in-up">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-zinc-300 text-sm leading-relaxed">
            Utilizamos cookies para mejorar tu experiencia en nuestro sitio web. Al continuar navegando, aceptas nuestra{' '}
            <a href="/politica-de-privacidad" className="text-gold hover:underline">política de cookies</a>.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button data-testid="cookie-decline-btn" onClick={decline} className="px-5 py-2.5 rounded-full text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            Rechazar
          </button>
          <button data-testid="cookie-accept-btn" onClick={accept} className="btn-gold px-6 py-2.5 rounded-full text-sm font-medium">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/politica-de-privacidad" element={<PrivacyPage />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/cancelacion-y-reembolso" element={<CancellationPage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
