# Bariatric Istanbul Landing Page - PRD

## Original Problem Statement
Build a landing page for Bariatric Istanbul to collect patient information (name, surname, email, phone, language) via a lead capture form that posts to CRM endpoint. The design should be dark/premium. Later expanded to include a full admin panel, Spanish translation, SEO/AEO optimization, Blog, and editable Surgeon/Hospital sections.

## User Personas
- Spanish-speaking patients seeking bariatric surgery in Turkey
- International patients researching weight loss options
- Medical tourism prospects comparing clinics

## Core Requirements
- Patient lead capture form with: name, surname, email, phone, language
- Form submission to: https://crm.bariatricistanbul.com/action/addLeads
- WhatsApp CTA: https://wa.me/bariatric
- Dark/premium design aesthetic
- Full Spanish language site targeting "La cirugía de manga gástrica en Turquía"
- Admin CMS panel for all dynamic content
- Blog section with SEO-optimized posts
- Editable Surgeon and Hospital sections

## Sections Implemented
1. Hero with lead capture form (Spanish)
2. About / Stats section
3. Hospital (dynamic from CMS)
4. Surgeon (dynamic from CMS)
5. Procedures (4 surgery types)
6. Itinerary (6-day timeline, dynamic)
7. Transformations Gallery (carousel, dynamic)
8. Text Testimonials (carousel, dynamic)
9. Video Testimonials (carousel, dynamic)
10. FAQ (6 questions, accordion)
11. CTA section
12. Footer with logo
13. Floating WhatsApp button
14. Blog listing (/blog) and individual posts (/blog/:slug)

## Admin CMS (/admin)
- JWT auth with localStorage Bearer tokens
- 7 management tabs: Transformaciones, Testimonios, Videos, Itinerario, Cirujano, Hospital, Blog
- Full CRUD for all content types
- Blog includes SEO fields (meta_title, meta_description, keywords)
- Surgeon/Hospital are single-item entities (edit replaces)

## Admin Credentials
- URL: /admin
- Email: admin@bariatricistanbul.com
- Password: admin123

## Tech Stack
- React (frontend) + FastAPI (backend) + MongoDB
- Tailwind CSS + Shadcn UI components
- Slick Carousel for sliders
- FontAwesome icons (CDN)
- react-international-phone for phone input
- Custom JWT Auth (localStorage Bearer token for cPanel compatibility)

## SEO/AEO Features
- Spanish meta tags (title, description, keywords, Open Graph, Twitter Card)
- Schema.org structured data (MedicalOrganization, FAQPage, MedicalProcedure, Physician)
- Dynamic sitemap.xml (/api/sitemap.xml) with blog posts
- robots.txt
- Favicon (logo.png)
- 3 seed blog posts with SEO metadata

## What's Been Implemented
- [x] Full landing page with all sections in Spanish
- [x] Official logo (logo.png) integrated in navbar, footer, admin, favicon
- [x] Lead capture form with international phone input
- [x] Form POST to CRM endpoint
- [x] WhatsApp floating CTA
- [x] Responsive mobile design
- [x] Dark premium theme with gold accents
- [x] Slick carousels for Transformations, Testimonials, Videos
- [x] Admin Panel CMS with 7 content management tabs
- [x] Blog section with listing and individual post pages
- [x] Editable Surgeon section (single-item)
- [x] Editable Hospital section (single-item)
- [x] SEO meta tags and structured data
- [x] Sitemap.xml and robots.txt
- [x] cPanel deployment scripts (PHP proxy, .htaccess)
- [x] localStorage auth for cPanel compatibility
- [x] All backend API tests passing (26/26)

## Prioritized Backlog
### P1 (High)
- Replace placeholder images with real B&A photos
- Add real video testimonials (YouTube embeds)
- Add Google Analytics / Meta Pixel

### P2 (Medium)
- Cookie consent banner
- Deploy alternative languages (Turkish, German, etc.)
- Live chat widget
- Add more blog posts for SEO coverage

## Deployment
- Designed for cPanel shared hosting
- PHP proxy at /api/index.php forwards to Python backend
- .htaccess handles routing and auth header preservation
- deploy.sh and setup guides included
