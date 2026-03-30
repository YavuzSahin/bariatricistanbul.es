import { useState } from "react";
import "@/App.css";
import { Phone, Mail, MapPin, ChevronDown, ChevronUp, Play, Star, Check, Menu, X, MessageCircle } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";

const WHATSAPP_LINK = "https://wa.me/bariatric";
const CRM_ENDPOINT = "https://crm.bariatricistanbul.com/action/addLeads";

// Navigation Component
const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#hospital", label: "Hospital" },
    { href: "#surgeon", label: "Surgeon" },
    { href: "#procedures", label: "Procedures" },
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
          
          {/* Desktop Nav */}
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
            <a 
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
              data-testid="nav-whatsapp-btn"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <a 
              href="#contact"
              className="btn-gold px-6 py-2 rounded-full text-sm"
              data-testid="nav-consultation-btn"
            >
              Book Consultation
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-zinc-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu lg:hidden absolute top-20 left-0 right-0 border-b border-white/5">
          <div className="px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <a 
                key={link.href}
                href={link.href} 
                onClick={(e) => { scrollToSection(e, link.href); setMobileMenuOpen(false); }}
                className="block text-zinc-400 hover:text-zinc-50 py-2"
              >
                {link.label}
              </a>
            ))}
            <a 
              href="#contact"
              className="btn-gold block text-center px-6 py-3 rounded-full mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Book Consultation
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

// Hero Section with Lead Form
const HeroSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    language: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(CRM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", surname: "", email: "", phone: "", language: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="hero-bg min-h-screen flex items-center pt-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-up">
            <p className="text-sm font-sans uppercase tracking-[0.2em] text-zinc-400 mb-6">
              World-Class Bariatric Surgery in Turkey
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-zinc-50 leading-tight mb-6">
              Transform Your Life with{" "}
              <span className="text-gold">Expert Care</span>
            </h1>
            <p className="text-lg text-zinc-300 leading-relaxed mb-8 max-w-lg">
              Join thousands of international patients who have achieved lasting weight loss 
              with our internationally accredited surgeons and premium care in Istanbul.
            </p>
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-gold" />
                <span className="text-zinc-300">JCI Accredited Hospital</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-gold" />
                <span className="text-zinc-300">5000+ Successful Surgeries</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-gold" />
                <span className="text-zinc-300">All-Inclusive Packages</span>
              </div>
            </div>
          </div>

          {/* Lead Form */}
          <div className="glass rounded-2xl p-8 md:p-10 animate-fade-in-up animation-delay-200" data-testid="lead-form-container">
            <h2 className="font-serif text-2xl text-zinc-50 mb-2">Start Your Journey</h2>
            <p className="text-zinc-400 mb-6">Get a free consultation and personalized treatment plan</p>
            
            {submitStatus === "success" ? (
              <div className="text-center py-8" data-testid="form-success-message">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-serif text-xl text-zinc-50 mb-2">Thank You!</h3>
                <p className="text-zinc-400">We'll contact you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="lead-form">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="First Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-input h-12 rounded-lg"
                    required
                    data-testid="input-name"
                  />
                  <Input
                    type="text"
                    placeholder="Last Name"
                    value={formData.surname}
                    onChange={(e) => setFormData({...formData, surname: e.target.value})}
                    className="form-input h-12 rounded-lg"
                    required
                    data-testid="input-surname"
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input h-12 rounded-lg"
                  required
                  data-testid="input-email"
                />
                <Input
                  type="tel"
                  placeholder="Phone Number (with country code)"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="form-input h-12 rounded-lg"
                  required
                  data-testid="input-phone"
                />
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({...formData, language: value})}
                >
                  <SelectTrigger className="form-input h-12 rounded-lg" data-testid="language-select">
                    <SelectValue placeholder="Preferred Language" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="turkish">Turkish</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="russian">Russian</SelectItem>
                  </SelectContent>
                </Select>
                
                {submitStatus === "error" && (
                  <p className="text-red-400 text-sm" data-testid="form-error-message">
                    Something went wrong. Please try again or contact us via WhatsApp.
                  </p>
                )}
                
                <Button 
                  type="submit" 
                  className="btn-gold w-full h-12 rounded-lg text-base font-medium"
                  disabled={isSubmitting}
                  data-testid="lead-form-submit-button"
                >
                  {isSubmitting ? "Submitting..." : "Get Free Consultation"}
                </Button>
                
                <p className="text-zinc-500 text-xs text-center">
                  By submitting, you agree to our privacy policy.
                </p>
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
  return (
    <section id="about" className="bg-zinc-950 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Why Choose Us</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">
            Excellence in Bariatric Surgery
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            We combine world-class medical expertise with the warmth of Turkish hospitality 
            to deliver exceptional patient outcomes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { number: "5000+", label: "Successful Surgeries", icon: "🏆" },
            { number: "98%", label: "Patient Satisfaction", icon: "⭐" },
            { number: "15+", label: "Years Experience", icon: "📅" },
            { number: "50+", label: "Countries Served", icon: "🌍" },
          ].map((stat, index) => (
            <div 
              key={index}
              className="glass rounded-2xl p-8 text-center card-hover"
              data-testid={`stat-card-${index}`}
            >
              <p className="text-4xl mb-2">{stat.icon}</p>
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
const HospitalSection = () => {
  return (
    <section id="hospital" className="bg-zinc-900 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="img-zoom rounded-2xl overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1764885518098-781b23d50e7f" 
              alt="Modern Hospital Building"
              className="w-full h-[400px] object-cover"
            />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Our Facility</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-zinc-50 mb-6">
              World-Class Hospital in Istanbul
            </h2>
            <p className="text-zinc-300 mb-6 leading-relaxed">
              Our partner hospital is a JCI-accredited facility featuring state-of-the-art 
              operating theaters, private recovery suites, and 24/7 medical support. Located 
              in the heart of Istanbul, you'll experience premium care in a modern, comfortable environment.
            </p>
            <ul className="space-y-4">
              {[
                "JCI International Accreditation",
                "Latest Laparoscopic Technology",
                "Private VIP Patient Rooms",
                "Dedicated International Patient Department",
                "On-site Laboratory & Imaging",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-zinc-300">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

// Surgeon Section
const SurgeonSection = () => {
  return (
    <section id="surgeon" className="bg-zinc-950 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Meet Your Surgeon</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-zinc-50 mb-6">
              Dr. Mehmet Yılmaz, MD
            </h2>
            <p className="text-zinc-300 mb-6 leading-relaxed">
              With over 15 years of experience and more than 5,000 successful bariatric procedures, 
              Dr. Yılmaz is one of Turkey's leading bariatric surgeons. Board-certified and internationally 
              trained, he specializes in minimally invasive techniques that ensure faster recovery and optimal results.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass rounded-xl p-4">
                <p className="text-gold font-serif text-2xl">5000+</p>
                <p className="text-zinc-400 text-sm">Surgeries Performed</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-gold font-serif text-2xl">15+</p>
                <p className="text-zinc-400 text-sm">Years Experience</p>
              </div>
            </div>
            <ul className="space-y-3">
              {[
                "Member of IFSO (International Federation for Surgery of Obesity)",
                "Board Certified General Surgeon",
                "Fellowship in Minimally Invasive Surgery",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-zinc-300 text-sm">
                  <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 lg:order-2 img-zoom rounded-2xl overflow-hidden">
            <img 
              src="https://images.pexels.com/photos/7585019/pexels-photo-7585019.jpeg" 
              alt="Dr. Mehmet Yılmaz"
              className="w-full h-[500px] object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Procedures Section
const ProceduresSection = () => {
  const procedures = [
    {
      title: "Gastric Sleeve",
      description: "The most popular bariatric procedure. Removes 80% of the stomach to reduce appetite and food intake.",
      benefits: ["60-70% excess weight loss", "Short recovery time", "No foreign objects"],
      price: "From €3,500"
    },
    {
      title: "Gastric Bypass",
      description: "Creates a small stomach pouch and reroutes the digestive system for maximum weight loss.",
      benefits: ["70-80% excess weight loss", "Resolves type 2 diabetes", "Long-term results"],
      price: "From €4,500"
    },
    {
      title: "Gastric Balloon",
      description: "Non-surgical option. A silicone balloon is placed in the stomach to reduce capacity.",
      benefits: ["No surgery required", "6-12 month placement", "15-20% weight loss"],
      price: "From €2,500"
    },
    {
      title: "Revision Surgery",
      description: "For patients who need correction or conversion of a previous bariatric procedure.",
      benefits: ["Customized approach", "Expert revision team", "Improved outcomes"],
      price: "Custom Quote"
    },
  ];

  return (
    <section id="procedures" className="bg-zinc-900 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Our Procedures</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">
            Surgery Options
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            We offer a full range of bariatric procedures tailored to your individual needs 
            and health goals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {procedures.map((procedure, index) => (
            <div 
              key={index}
              className="procedure-card rounded-2xl p-8 card-hover"
              data-testid={`procedure-card-${index}`}
            >
              <h3 className="font-serif text-2xl text-zinc-50 mb-3">{procedure.title}</h3>
              <p className="text-zinc-400 mb-4">{procedure.description}</p>
              <ul className="space-y-2 mb-6">
                {procedure.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-zinc-300 text-sm">
                    <Check className="w-4 h-4 text-gold" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <p className="text-gold font-semibold">{procedure.price}</p>
                <a 
                  href="#contact" 
                  className="text-zinc-400 hover:text-gold text-sm transition-colors"
                >
                  Learn More →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Before/After Gallery
const GallerySection = () => {
  const galleryItems = [
    { before: "85kg lost", months: "12 months post-op" },
    { before: "60kg lost", months: "18 months post-op" },
    { before: "70kg lost", months: "10 months post-op" },
    { before: "55kg lost", months: "14 months post-op" },
  ];

  return (
    <section id="results" className="bg-zinc-950 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Real Results</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">
            Patient Transformations
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            See the incredible journeys of our patients who have transformed their lives 
            through bariatric surgery.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleryItems.map((item, index) => (
            <div 
              key={index}
              className="gallery-item aspect-[3/4] bg-zinc-800 rounded-xl relative group"
              data-testid={`gallery-item-${index}`}
            >
              <img 
                src="https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd"
                alt={`Patient transformation ${index + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div>
                  <p className="text-gold font-semibold">{item.before}</p>
                  <p className="text-zinc-400 text-sm">{item.months}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-zinc-500 text-sm">
            * Results may vary. Photos shared with patient consent.
          </p>
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah M.",
      country: "United Kingdom",
      text: "The entire experience exceeded my expectations. From the airport pickup to the aftercare, everything was perfectly organized. I've lost 45kg and feel like a new person!",
      rating: 5
    },
    {
      name: "Michael R.",
      country: "Germany",
      text: "Dr. Yılmaz and his team are incredible. The hospital was world-class and the care I received was exceptional. Best decision I ever made for my health.",
      rating: 5
    },
    {
      name: "Emma L.",
      country: "Netherlands",
      text: "I was nervous about having surgery abroad, but Bariatric Istanbul made me feel completely safe and cared for. The results speak for themselves - 60kg down!",
      rating: 5
    },
  ];

  return (
    <section id="testimonials" className="bg-zinc-900 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Testimonials</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">
            What Our Patients Say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="testimonial-card rounded-2xl p-8"
              data-testid={`testimonial-card-${index}`}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />
                ))}
              </div>
              <p className="text-zinc-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
              <div>
                <p className="text-zinc-50 font-medium">{testimonial.name}</p>
                <p className="text-zinc-500 text-sm">{testimonial.country}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Video Testimonials Section
const VideoTestimonialsSection = () => {
  const videos = [
    { title: "Sarah's Story", duration: "3:45" },
    { title: "Michael's Journey", duration: "4:12" },
    { title: "Emma's Transformation", duration: "2:58" },
  ];

  return (
    <section className="bg-zinc-950 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Video Stories</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">
            Patient Video Testimonials
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <div 
              key={index}
              className="relative aspect-video bg-zinc-800 rounded-2xl overflow-hidden group cursor-pointer card-hover"
              data-testid={`video-testimonial-${index}`}
            >
              <img 
                src="https://images.unsplash.com/photo-1759476598893-66c7cd9c31cd"
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="video-overlay absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-zinc-950 ml-1" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-zinc-50 font-medium">{video.title}</p>
                <p className="text-zinc-400 text-sm">{video.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const faqs = [
    {
      question: "How much does bariatric surgery cost in Istanbul?",
      answer: "Our all-inclusive packages start from €3,500 for gastric sleeve surgery. This includes the surgery, hospital stay, airport transfers, hotel accommodation, and post-operative care. Contact us for a personalized quote based on your specific needs."
    },
    {
      question: "Is it safe to have surgery in Turkey?",
      answer: "Absolutely. Turkey is one of the world's leading medical tourism destinations. Our partner hospital is JCI-accredited (the gold standard in international healthcare), and our surgeons are board-certified with extensive international training and experience."
    },
    {
      question: "How long will I need to stay in Istanbul?",
      answer: "Most patients stay 5-7 days for gastric sleeve surgery. This includes pre-operative tests, the surgery itself, and initial recovery monitoring. We'll provide detailed guidance on your specific timeline during your consultation."
    },
    {
      question: "What's included in the package?",
      answer: "Our all-inclusive packages typically include: surgery and anesthesia, hospital stay in a private room, pre and post-operative tests, airport transfers, hotel accommodation, translator services, and 12 months of aftercare support."
    },
    {
      question: "How much weight can I expect to lose?",
      answer: "Results vary by procedure and individual factors. Gastric sleeve patients typically lose 60-70% of excess weight within 12-18 months. Gastric bypass can result in 70-80% excess weight loss. Our team will help set realistic expectations during your consultation."
    },
    {
      question: "What aftercare support do you provide?",
      answer: "We provide comprehensive 12-month aftercare including regular virtual check-ups, dietary guidance from our nutritionist, 24/7 WhatsApp support, and access to our patient community. We're with you every step of your weight loss journey."
    },
  ];

  return (
    <section id="faq" className="bg-zinc-900 py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">FAQ</p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-zinc-800/50 border border-zinc-700 rounded-xl px-6 data-[state=open]:border-gold/30"
              data-testid={`faq-item-${index}`}
            >
              <AccordionTrigger className="text-left text-zinc-50 hover:text-gold py-5 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400 pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

// Contact/CTA Section
const ContactSection = () => {
  return (
    <section id="contact" className="cta-bg py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gold mb-4">Get Started</p>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-zinc-50 mb-6">
          Ready to Transform Your Life?
        </h2>
        <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">
          Take the first step towards a healthier, happier you. Contact us today for 
          a free consultation and personalized treatment plan.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a 
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp px-8 py-4 rounded-full text-lg font-medium inline-flex items-center justify-center gap-2"
            data-testid="cta-whatsapp-btn"
          >
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp
          </a>
          <a 
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="btn-gold px-8 py-4 rounded-full text-lg font-medium"
            data-testid="cta-form-btn"
          >
            Fill Out Form
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-zinc-400">
          <a href="tel:+905491470247" className="flex items-center gap-2 hover:text-gold transition-colors">
            <Phone className="w-5 h-5" />
            +90 549 147 0247
          </a>
          <a href="mailto:info@bariatricistanbul.com" className="flex items-center gap-2 hover:text-gold transition-colors">
            <Mail className="w-5 h-5" />
            info@bariatricistanbul.com
          </a>
          <span className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Istanbul, Turkey
          </span>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <a href="#" className="font-serif text-xl text-zinc-50">
              Bariatric<span className="text-gold">Istanbul</span>
            </a>
            <p className="text-zinc-500 text-sm mt-2">
              World-class bariatric surgery in Turkey
            </p>
          </div>
          <div className="flex gap-6 text-zinc-400 text-sm">
            <a href="#" className="hover:text-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gold transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gold transition-colors">Contact</a>
          </div>
        </div>
        <div className="section-divider my-8"></div>
        <p className="text-zinc-500 text-sm text-center">
          © 2024 Bariatric Istanbul. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

// WhatsApp Floating Button
const WhatsAppButton = () => {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 btn-whatsapp w-16 h-16 rounded-full flex items-center justify-center animate-pulse-glow shadow-lg"
      data-testid="whatsapp-floating-btn"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
};

// Main App
function App() {
  return (
    <div className="bg-zinc-950 min-h-screen">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <HospitalSection />
      <SurgeonSection />
      <ProceduresSection />
      <GallerySection />
      <TestimonialsSection />
      <VideoTestimonialsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default App;
