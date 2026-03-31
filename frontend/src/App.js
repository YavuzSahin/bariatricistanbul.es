import { useState, useEffect, useRef, createContext, useContext } from "react";
import "@/App.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import axios from "axios";

const WHATSAPP_LINK = "https://wa.me/bariatric";
const CRM_ENDPOINT = "https://crm.bariatricistanbul.com/action/addLeads";
const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Axios instance with auth header
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
    } catch {
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('auth_token', res.data.token);
    }
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// FontAwesome Icon Component
const FAIcon = ({ icon, className = "" }) => (
  <i className={`${icon} ${className}`}></i>
);

// Custom Slick Arrow
const SlickArrow = ({ className, onClick, direction }) => (
  <button
    className={`slick-custom-arrow slick-${direction} ${className}`}
    onClick={onClick}
    data-testid={`slider-${direction}-btn`}
  >
    <FAIcon icon={direction === 'prev' ? 'fas fa-chevron-left' : 'fas fa-chevron-right'} />
  </button>
);

// Navigation Component
const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#hospital", label: "Hospital" },
    { href: "#surgeon", label: "Surgeon" },
    { href: "#procedures", label: "Procedures" },
    { href: "#itinerary", label: "Itinerary" },
    { href: "#results", label: "Results" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#faq", label: "FAQ" },
  ];

  const scrollToSection = (e, href) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/70 backdrop-blur-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          <a href="#" className="font-serif text-2xl text-zinc-50 font-semibold" data-testid="logo">
            Bariatric<span className="text-gold">Istanbul</span>
          </a>
          
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.href}
                href={link.href} 
                onClick={(e) => scrollToSection(e, link.href)}
                className="nav-link text-zinc-400 hover:text-zinc-50 text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2" data-testid="nav-whatsapp-btn">
              <FAIcon icon="fab fa-whatsapp" className="text-base" />
              WhatsApp
            </a>
            <a href="#contact" className="btn-gold px-6 py-2 rounded-full text-sm" data-testid="nav-consultation-btn">
              Book Consultation
            </a>
          </div>

          <button className="lg:hidden text-zinc-50 p-2 -mr-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="mobile-menu-btn" aria-label="Toggle menu">
            <FAIcon icon={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"} className="text-xl" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu lg:hidden absolute top-20 left-0 right-0 border-b border-white/5">
          <div className="px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={(e) => { scrollToSection(e, link.href); setMobileMenuOpen(false); }} className="block text-zinc-400 hover:text-zinc-50 py-2">
                {link.label}
              </a>
            ))}
            <a href="#contact" className="btn-gold block text-center px-6 py-3 rounded-full mt-4" onClick={() => setMobileMenuOpen(false)}>
              Book Consultation
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

// Hero Section
const HeroSection = () => {
  const [formData, setFormData] = useState({ name: "", surname: "", email: "", phone: "", language: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch(CRM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      setSubmitStatus("success");
      setFormData({ name: "", surname: "", email: "", phone: "", language: "" });
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="hero-bg min-h-screen flex items-center pt-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="animate-fade-in-up">
            <p className="text-sm font-sans uppercase tracking-[0.2em] text-zinc-400 mb-6">World-Class Bariatric Surgery in Turkey</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-zinc-50 leading-tight mb-6">
              Transform Your Life with <span className="text-gold">Expert Care</span>
            </h1>
            <p className="text-lg text-zinc-300 leading-relaxed mb-8 max-w-lg">
              Join thousands of international patients who have achieved lasting weight loss with our internationally accredited surgeons and premium care in Istanbul.
            </p>
            <div className="flex flex-wrap gap-6 mb-8">
              {["JCI Accredited Hospital", "5000+ Successful Surgeries", "All-Inclusive Packages"].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <FAIcon icon="fas fa-check" className="text-gold" />
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-8 md:p-10 animate-fade-in-up animation-delay-200" data-testid="lead-form-container">
            <h2 className="font-serif text-2xl text-zinc-50 mb-2">Start Your Journey</h2>
            <p className="text-zinc-400 mb-6">Get a free consultation and personalized treatment plan</p>
            
            {submitStatus === "success" ? (
              <div className="text-center py-8" data-testid="form-success-message">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FAIcon icon="fas fa-check" className="text-green-500 text-2xl" />
                </div>
                <h3 className="font-serif text-xl text-zinc-50 mb-2">Thank You!</h3>
                <p className="text-zinc-400">We'll contact you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="lead-form">
                <div className="grid grid-cols-2 gap-4">
                  <Input type="text" placeholder="First Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="form-input h-12 rounded-lg" required data-testid="input-name" />
                  <Input type="text" placeholder="Last Name" value={formData.surname} onChange={(e) => setFormData({...formData, surname: e.target.value})} className="form-input h-12 rounded-lg" required data-testid="input-surname" />
                </div>
                <Input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="form-input h-12 rounded-lg" required data-testid="input-email" />
                <div className="phone-input-wrapper">
                  <PhoneInput defaultCountry="gb" value={formData.phone} onChange={(phone) => setFormData({...formData, phone})} inputClassName="form-input" data-testid="input-phone" />
                </div>
                <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                  <SelectTrigger className="form-input h-12 rounded-lg" data-testid="language-select"><SelectValue placeholder="Preferred Language" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {["english", "turkish", "german", "french", "arabic", "russian"].map(lang => (
                      <SelectItem key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {submitStatus === "error" && <p className="text-red-400 text-sm">Something went wrong. Please try again or contact us via WhatsApp.</p>}
                <Button type="submit" className="btn-gold w-full h-12 rounded-lg text-base font-medium" disabled={isSubmitting} data-testid="lead-form-submit-button">
                  {isSubmitting ? "Submitting..." : "Get Free Consultation"}
                </Button>
                <p className="text-zinc-500 text-xs text-center">By submitting, you agree to our privacy policy.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  const stats = [
    { number: "5000+", label: "Successful Surgeries", icon: "fas fa-trophy" },
    { number: "98%", label: "Patient Satisfaction", icon: "fas fa-star" },
    { number: "15+", label: "Years Experience", icon: "fas fa-calendar-alt" },
    { number: "50+", label: "Countries Served", icon: "fas fa-globe" },
  ];

  return (
    <section id="about" className="bg-zinc-950 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Why Choose Us</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Excellence in Bariatric Surgery</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">We combine world-class medical expertise with the warmth of Turkish hospitality to deliver exceptional patient outcomes.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="glass rounded-2xl p-8 text-center card-hover" data-testid={`stat-card-${index}`}>
              <FAIcon icon={stat.icon} className="text-gold text-3xl mb-4" />
              <p className="font-serif text-3xl text-gold mb-2">{stat.number}</p>
              <p className="text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Hospital Section
const HospitalSection = () => (
  <section id="hospital" className="bg-zinc-900 py-24 md:py-32">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="img-zoom rounded-2xl overflow-hidden">
          <img src="https://images.unsplash.com/photo-1764885518098-781b23d50e7f" alt="Modern Hospital" className="w-full h-[400px] object-cover" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Our Facility</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-zinc-50 mb-6">World-Class Hospital in Istanbul</h2>
          <p className="text-zinc-300 mb-6 leading-relaxed">Our partner hospital is a JCI-accredited facility featuring state-of-the-art operating theaters, private recovery suites, and 24/7 medical support.</p>
          <ul className="space-y-4">
            {["JCI International Accreditation", "Latest Laparoscopic Technology", "Private VIP Patient Rooms", "Dedicated International Patient Department", "On-site Laboratory & Imaging"].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-zinc-300"><FAIcon icon="fas fa-check-circle" className="text-gold" />{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

// Surgeon Section
const SurgeonSection = () => (
  <section id="surgeon" className="bg-zinc-950 py-24 md:py-32">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Meet Your Surgeon</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-zinc-50 mb-6">Dr. Mehmet Yılmaz, MD</h2>
          <p className="text-zinc-300 mb-6 leading-relaxed">With over 15 years of experience and more than 5,000 successful bariatric procedures, Dr. Yılmaz is one of Turkey's leading bariatric surgeons.</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass rounded-xl p-4"><p className="text-gold font-serif text-2xl">5000+</p><p className="text-zinc-400 text-sm">Surgeries Performed</p></div>
            <div className="glass rounded-xl p-4"><p className="text-gold font-serif text-2xl">15+</p><p className="text-zinc-400 text-sm">Years Experience</p></div>
          </div>
          <ul className="space-y-3">
            {["Member of IFSO (International Federation for Surgery of Obesity)", "Board Certified General Surgeon", "Fellowship in Minimally Invasive Surgery"].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-zinc-300 text-sm"><FAIcon icon="fas fa-award" className="text-gold mt-0.5" />{item}</li>
            ))}
          </ul>
        </div>
        <div className="order-1 lg:order-2 img-zoom rounded-2xl overflow-hidden">
          <img src="https://images.pexels.com/photos/7585019/pexels-photo-7585019.jpeg" alt="Dr. Mehmet Yılmaz" className="w-full h-[500px] object-cover object-top" />
        </div>
      </div>
    </div>
  </section>
);

// Procedures Section
const ProceduresSection = () => {
  const procedures = [
    { title: "Gastric Sleeve", description: "The most popular bariatric procedure. Removes 80% of the stomach to reduce appetite and food intake.", benefits: ["60-70% excess weight loss", "Short recovery time", "No foreign objects"], icon: "fas fa-cut" },
    { title: "Gastric Bypass", description: "Creates a small stomach pouch and reroutes the digestive system for maximum weight loss.", benefits: ["70-80% excess weight loss", "Resolves type 2 diabetes", "Long-term results"], icon: "fas fa-random" },
    { title: "Gastric Balloon", description: "Non-surgical option. A silicone balloon is placed in the stomach to reduce capacity.", benefits: ["No surgery required", "6-12 month placement", "15-20% weight loss"], icon: "fas fa-circle" },
    { title: "Revision Surgery", description: "For patients who need correction or conversion of a previous bariatric procedure.", benefits: ["Customized approach", "Expert revision team", "Improved outcomes"], icon: "fas fa-redo" },
  ];

  return (
    <section id="procedures" className="bg-zinc-900 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Our Procedures</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Surgery Options</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">We offer a full range of bariatric procedures tailored to your individual needs and health goals.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {procedures.map((proc, index) => (
            <div key={index} className="procedure-card rounded-2xl p-8 card-hover" data-testid={`procedure-card-${index}`}>
              <FAIcon icon={proc.icon} className="text-gold text-2xl mb-4" />
              <h3 className="font-serif text-2xl text-zinc-50 mb-3">{proc.title}</h3>
              <p className="text-zinc-400 mb-4">{proc.description}</p>
              <ul className="space-y-2 mb-6">
                {proc.benefits.map((b, i) => <li key={i} className="flex items-center gap-2 text-zinc-300 text-sm"><FAIcon icon="fas fa-check" className="text-gold text-xs" />{b}</li>)}
              </ul>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium">
                <FAIcon icon="fab fa-whatsapp" />Get Quote
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Itinerary Section
const ItinerarySection = () => {
  const [itinerary, setItinerary] = useState([]);

  useEffect(() => {
    api.get('/api/content/itinerary').then(res => setItinerary(res.data)).catch(() => {});
  }, []);

  return (
    <section id="itinerary" className="bg-zinc-950 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Your Journey</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Treatment Itinerary</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">A detailed day-by-day overview of your bariatric surgery journey in Istanbul.</p>
        </div>
        <div className="relative">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gold/30 transform md:-translate-x-1/2"></div>
          <div className="space-y-8">
            {itinerary.map((day, index) => (
              <div key={day.id} className={`relative flex items-start gap-6 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`} data-testid={`itinerary-day-${day.day_number}`}>
                <div className="hidden md:block flex-1"></div>
                <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-gold rounded-full transform -translate-x-1/2 mt-2 z-10"></div>
                <div className="flex-1 ml-16 md:ml-0 glass rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-gold text-zinc-950 text-sm font-bold px-3 py-1 rounded-full">Day {day.day_number}</span>
                    <h3 className="font-serif text-xl text-zinc-50">{day.title}</h3>
                  </div>
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

// Gallery Section with Slick Slider
const GallerySection = () => {
  const [transformations, setTransformations] = useState([]);

  useEffect(() => {
    api.get('/api/content/transformations').then(res => setTransformations(res.data)).catch(() => {});
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    prevArrow: <SlickArrow direction="prev" />,
    nextArrow: <SlickArrow direction="next" />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } }
    ]
  };

  return (
    <section id="results" className="bg-zinc-950 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Real Results</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Patient Transformations</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">See the incredible journeys of our patients who have transformed their lives through bariatric surgery.</p>
        </div>
        <div className="slick-slider-container">
          <Slider {...settings}>
            {transformations.map((item, index) => (
              <div key={item.id} className="px-3">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800 group" data-testid={`gallery-item-${index}`}>
                  <img src={item.image_url} alt={item.weight_lost} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                    <div>
                      <p className="text-gold font-semibold text-lg">{item.weight_lost}</p>
                      <p className="text-zinc-400">{item.months_post_op}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
        <p className="text-zinc-500 text-sm text-center mt-8">* Results may vary. Photos shared with patient consent.</p>
      </div>
    </section>
  );
};

// Testimonials Section with Slick Slider
const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    api.get('/api/content/testimonials').then(res => setTestimonials(res.data)).catch(() => {});
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    prevArrow: <SlickArrow direction="prev" />,
    nextArrow: <SlickArrow direction="next" />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } }
    ]
  };

  return (
    <section id="testimonials" className="bg-zinc-900 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Testimonials</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">What Our Patients Say</h2>
        </div>
        <div className="slick-slider-container">
          <Slider {...settings}>
            {testimonials.map((t, index) => (
              <div key={t.id} className="px-3">
                <div className="testimonial-card rounded-2xl p-8 h-full" data-testid={`testimonial-card-${index}`}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => <FAIcon key={i} icon="fas fa-star" className="text-gold" />)}
                  </div>
                  <p className="text-zinc-300 mb-6 leading-relaxed">"{t.text}"</p>
                  <div>
                    <p className="text-zinc-50 font-medium">{t.name}</p>
                    <p className="text-zinc-500 text-sm">{t.country}</p>
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

// Video Testimonials Section with Slick Slider
const VideoTestimonialsSection = () => {
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    api.get('/api/content/video-testimonials').then(res => setVideos(res.data)).catch(() => {});
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    prevArrow: <SlickArrow direction="prev" />,
    nextArrow: <SlickArrow direction="next" />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } }
    ]
  };

  return (
    <section className="bg-zinc-950 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Video Stories</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Patient Video Testimonials</h2>
        </div>
        <div className="slick-slider-container">
          <Slider {...settings}>
            {videos.map((video, index) => (
              <div key={video.id} className="px-3">
                <div className="relative aspect-[4/5] bg-zinc-800 rounded-2xl overflow-hidden group cursor-pointer card-hover" onClick={() => setActiveVideo(video)} data-testid={`video-testimonial-${index}`}>
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                  <div className="video-overlay absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FAIcon icon="fas fa-play" className="text-zinc-950 text-2xl ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-zinc-50 font-medium text-lg">{video.title}</p>
                    <p className="text-zinc-400">{video.duration}</p>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>

        {activeVideo && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setActiveVideo(null)} data-testid="video-modal">
            <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setActiveVideo(null)} className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center text-white hover:text-gold transition-colors bg-zinc-800 rounded-full" data-testid="video-modal-close">
                <FAIcon icon="fas fa-times" className="text-xl" />
              </button>
              <video src={activeVideo.video_url} controls autoPlay className="w-full rounded-xl" data-testid="video-player" />
              <p className="text-center text-zinc-400 mt-4">{activeVideo.title}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const faqs = [
    { question: "How much does bariatric surgery cost in Istanbul?", answer: "Our all-inclusive packages vary based on the procedure type. Contact us for a personalized quote that includes surgery, hospital stay, airport transfers, hotel accommodation, and post-operative care." },
    { question: "Is it safe to have surgery in Turkey?", answer: "Absolutely. Turkey is one of the world's leading medical tourism destinations. Our partner hospital is JCI-accredited (the gold standard in international healthcare)." },
    { question: "How long will I need to stay in Istanbul?", answer: "Most patients stay 5-7 days for gastric sleeve surgery. This includes pre-operative tests, the surgery itself, and initial recovery monitoring." },
    { question: "What's included in the package?", answer: "Our all-inclusive packages typically include: surgery and anesthesia, hospital stay in a private room, pre and post-operative tests, airport transfers, hotel accommodation, translator services, and 12 months of aftercare support." },
    { question: "How much weight can I expect to lose?", answer: "Results vary by procedure. Gastric sleeve: 60-70% excess weight loss. Gastric bypass: 70-80% excess weight loss within 12-18 months." },
    { question: "What aftercare support do you provide?", answer: "We provide comprehensive 12-month aftercare including regular virtual check-ups, dietary guidance, 24/7 WhatsApp support, and access to our patient community." },
  ];

  return (
    <section id="faq" className="bg-zinc-900 py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">FAQ</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="bg-zinc-800/50 border border-zinc-700 rounded-xl px-6 data-[state=open]:border-gold/30" data-testid={`faq-item-${index}`}>
              <AccordionTrigger className="text-left text-zinc-50 hover:text-gold py-5 hover:no-underline">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-zinc-400 pb-5">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => (
  <section id="contact" className="cta-bg py-24 md:py-32">
    <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Get Started</p>
      <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">Ready to Transform Your Life?</h2>
      <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">Take the first step towards a healthier, happier you. Contact us today for a free consultation.</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-8 py-4 rounded-full text-lg font-medium inline-flex items-center justify-center gap-2" data-testid="cta-whatsapp-btn">
          <FAIcon icon="fab fa-whatsapp" className="text-xl" />Chat on WhatsApp
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn-gold px-8 py-4 rounded-full text-lg font-medium" data-testid="cta-form-btn">
          Fill Out Form
        </a>
      </div>
      <div className="flex flex-wrap justify-center gap-8 text-zinc-400">
        <a href="tel:+905491470247" className="flex items-center gap-2 hover:text-gold transition-colors"><FAIcon icon="fas fa-phone" />+90 549 147 0247</a>
        <a href="mailto:info@bariatricistanbul.com" className="flex items-center gap-2 hover:text-gold transition-colors"><FAIcon icon="fas fa-envelope" />info@bariatricistanbul.com</a>
        <span className="flex items-center gap-2"><FAIcon icon="fas fa-map-marker-alt" />Istanbul, Turkey</span>
      </div>
    </div>
  </section>
);

// Footer
const Footer = () => (
  <footer className="bg-zinc-950 border-t border-zinc-800 py-12">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <a href="#" className="font-serif text-xl text-zinc-50">Bariatric<span className="text-gold">Istanbul</span></a>
          <p className="text-zinc-500 text-sm mt-2">World-class bariatric surgery in Turkey</p>
        </div>
        <div className="flex gap-6 text-zinc-400 text-sm">
          <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
          <a href="/admin" className="hover:text-gold transition-colors">Admin</a>
        </div>
      </div>
      <div className="section-divider my-8"></div>
      <p className="text-zinc-500 text-sm text-center">© 2024 Bariatric Istanbul. All rights reserved.</p>
    </div>
  </footer>
);

// WhatsApp Button
const WhatsAppButton = () => (
  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-40 btn-whatsapp w-16 h-16 rounded-full flex items-center justify-center animate-pulse-glow shadow-lg" data-testid="whatsapp-floating-btn">
    <FAIcon icon="fab fa-whatsapp" className="text-3xl" />
  </a>
);

// Landing Page
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
    <ContactSection />
    <Footer />
    <WhatsAppButton />
  </div>
);

// Admin Login
const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <h1 className="font-serif text-3xl text-zinc-50 mb-2 text-center">Admin Login</h1>
        <p className="text-zinc-400 text-center mb-8">Bariatric Istanbul CMS</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input h-12" required data-testid="admin-email" />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input h-12" required data-testid="admin-password" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" className="btn-gold w-full h-12" disabled={loading} data-testid="admin-login-btn">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <a href="/" className="block text-center text-zinc-400 hover:text-gold mt-6 text-sm">← Back to Website</a>
      </div>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("transformations");
  const [data, setData] = useState({ transformations: [], testimonials: [], videoTestimonials: [], itinerary: [] });
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [t, te, v, i] = await Promise.all([
        api.get('/api/content/transformations'),
        api.get('/api/content/testimonials'),
        api.get('/api/content/video-testimonials'),
        api.get('/api/content/itinerary')
      ]);
      setData({ transformations: t.data, testimonials: te.data, videoTestimonials: v.data, itinerary: i.data });
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin");
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("Are you sure?")) return;
    const endpoints = { transformations: "transformations", testimonials: "testimonials", videoTestimonials: "video-testimonials", itinerary: "itinerary" };
    await api.delete(`/api/content/${endpoints[type]}/${id}`);
    loadAllData();
  };

  const handleSave = async (type, formData) => {
    const endpoints = { transformations: "transformations", testimonials: "testimonials", videoTestimonials: "video-testimonials", itinerary: "itinerary" };
    if (editItem) {
      await api.put(`/api/content/${endpoints[type]}/${editItem.id}`, formData);
    } else {
      await api.post(`/api/content/${endpoints[type]}`, formData);
    }
    setShowForm(false);
    setEditItem(null);
    loadAllData();
  };

  const tabs = [
    { key: "transformations", label: "Transformations", icon: "fas fa-images" },
    { key: "testimonials", label: "Testimonials", icon: "fas fa-quote-right" },
    { key: "videoTestimonials", label: "Video Stories", icon: "fas fa-video" },
    { key: "itinerary", label: "Itinerary", icon: "fas fa-calendar-day" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="font-serif text-xl text-zinc-50">Bariatric<span className="text-gold">Istanbul</span> Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm">{user?.email}</span>
            <Button onClick={handleLogout} variant="outline" size="sm" className="border-zinc-700 text-zinc-300" data-testid="admin-logout-btn">
              <FAIcon icon="fas fa-sign-out-alt" className="mr-2" />Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setShowForm(false); setEditItem(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-gold text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              data-testid={`tab-${tab.key}`}>
              <FAIcon icon={tab.icon} />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl text-zinc-50">{tabs.find(t => t.key === activeTab)?.label}</h2>
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-gold" data-testid="add-new-btn">
            <FAIcon icon="fas fa-plus" className="mr-2" />Add New
          </Button>
        </div>

        {showForm ? (
          <AdminForm type={activeTab} item={editItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditItem(null); }} />
        ) : (
          <AdminList type={activeTab} items={data[activeTab]} onEdit={(item) => { setEditItem(item); setShowForm(true); }} onDelete={(id) => handleDelete(activeTab, id)} />
        )}
      </div>
    </div>
  );
};

// Admin List Component
const AdminList = ({ type, items, onEdit, onDelete }) => {
  if (!items.length) return <p className="text-zinc-400 text-center py-12">No items yet. Click "Add New" to create one.</p>;

  return (
    <div className="grid gap-4">
      {items.map((item, index) => (
        <div key={item.id} className="glass rounded-xl p-6 flex items-center gap-6" data-testid={`list-item-${index}`}>
          {type === "transformations" && <img src={item.image_url} alt="" className="w-20 h-20 object-cover rounded-lg" />}
          {type === "videoTestimonials" && <img src={item.thumbnail_url} alt="" className="w-32 h-20 object-cover rounded-lg" />}
          <div className="flex-1">
            {type === "transformations" && <><p className="text-gold font-semibold">{item.weight_lost}</p><p className="text-zinc-400 text-sm">{item.months_post_op}</p></>}
            {type === "testimonials" && <><p className="text-zinc-50 font-medium">{item.name} - {item.country}</p><p className="text-zinc-400 text-sm line-clamp-2">{item.text}</p></>}
            {type === "videoTestimonials" && <><p className="text-zinc-50 font-medium">{item.title}</p><p className="text-zinc-400 text-sm">{item.duration}</p></>}
            {type === "itinerary" && <><p className="text-gold font-semibold">Day {item.day_number}: {item.title}</p><p className="text-zinc-400 text-sm line-clamp-2">{item.description}</p></>}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onEdit(item)} variant="outline" size="sm" className="border-zinc-700" data-testid={`edit-btn-${index}`}><FAIcon icon="fas fa-edit" /></Button>
            <Button onClick={() => onDelete(item.id)} variant="outline" size="sm" className="border-red-900 text-red-400 hover:bg-red-900/20" data-testid={`delete-btn-${index}`}><FAIcon icon="fas fa-trash" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Admin Form Component
const AdminForm = ({ type, item, onSave, onCancel }) => {
  const [formData, setFormData] = useState(item || {});

  const fields = {
    transformations: [
      { name: "weight_lost", label: "Weight Lost", placeholder: "e.g. 85kg lost" },
      { name: "months_post_op", label: "Time Post-Op", placeholder: "e.g. 12 months post-op" },
      { name: "image_url", label: "Image URL", placeholder: "https://..." },
    ],
    testimonials: [
      { name: "name", label: "Patient Name", placeholder: "e.g. Sarah M." },
      { name: "country", label: "Country", placeholder: "e.g. United Kingdom" },
      { name: "text", label: "Testimonial Text", placeholder: "Their story...", textarea: true },
      { name: "rating", label: "Rating (1-5)", placeholder: "5", type: "number" },
    ],
    videoTestimonials: [
      { name: "title", label: "Video Title", placeholder: "e.g. Sarah's Story" },
      { name: "duration", label: "Duration", placeholder: "e.g. 3:45" },
      { name: "thumbnail_url", label: "Thumbnail URL", placeholder: "https://..." },
      { name: "video_url", label: "Video URL", placeholder: "https://..." },
    ],
    itinerary: [
      { name: "day_number", label: "Day Number", placeholder: "1", type: "number" },
      { name: "title", label: "Day Title", placeholder: "e.g. Arrival & Welcome" },
      { name: "description", label: "Description", placeholder: "What happens on this day...", textarea: true },
    ],
  };

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="font-serif text-xl text-zinc-50 mb-6">{item ? "Edit" : "Add"} {type.slice(0, -1)}</h3>
      <form onSubmit={(e) => { e.preventDefault(); onSave(type, formData); }} className="space-y-4">
        {fields[type].map((field) => (
          <div key={field.name}>
            <label className="text-zinc-400 text-sm mb-2 block">{field.label}</label>
            {field.textarea ? (
              <textarea value={formData[field.name] || ""} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} placeholder={field.placeholder} className="form-input w-full rounded-lg p-3 min-h-[100px]" required data-testid={`form-${field.name}`} />
            ) : (
              <Input type={field.type || "text"} value={formData[field.name] || ""} onChange={(e) => setFormData({ ...formData, [field.name]: field.type === "number" ? parseInt(e.target.value) : e.target.value })} placeholder={field.placeholder} className="form-input h-12" required data-testid={`form-${field.name}`} />
            )}
          </div>
        ))}
        <div className="flex gap-4 pt-4">
          <Button type="submit" className="btn-gold" data-testid="form-save-btn">Save</Button>
          <Button type="button" onClick={onCancel} variant="outline" className="border-zinc-700" data-testid="form-cancel-btn">Cancel</Button>
        </div>
      </form>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><FAIcon icon="fas fa-spinner fa-spin" className="text-gold text-3xl" /></div>;
  if (!user) return <Navigate to="/admin" replace />;
  return children;
};

// Main App
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
