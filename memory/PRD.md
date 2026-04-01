# Bariatric Istanbul Landing Page - PRD

## Original Problem Statement
Build a landing page for Bariatric Istanbul to collect patient information (name, surname, email, phone, language) via a lead capture form that posts to CRM endpoint. Dark/premium design. Full admin panel, Spanish translation, SEO/AEO, Blog, editable Surgeon/Hospital, legal pages, image uploads.

## What's Been Implemented
- [x] Full Spanish landing page with all sections (Hero, About, Hospital, Surgeon, Procedures, Itinerary, Results, Testimonials, Videos, FAQ, CTA, Footer)
- [x] Official logo (logo.png) integrated everywhere (navbar h-16, footer h-12, admin, favicon)
- [x] Lead capture form with international phone input → CRM POST
- [x] WhatsApp CTA → wa.me/bariatricistanbul
- [x] Contact email: help@bariatricistanbul.com
- [x] Instagram: @bariatricaistanbul
- [x] Dark premium theme with gold accents
- [x] Slick carousels with bigger gold arrows (72px)
- [x] Admin Panel CMS in English (7 tabs: Transformations, Testimonials, Videos, Itinerary, Surgeon, Hospital, Blog)
- [x] Image/video upload in admin (POST /api/upload → /api/uploads/)
- [x] YouTube embed support for video testimonials
- [x] Blog section with listing and individual posts
- [x] SEO meta tags, Schema.org structured data, sitemap.xml, robots.txt
- [x] Legal pages: Política de Privacidad, Términos, Cancelación y Reembolso (Spanish)
- [x] Cookie consent banner linking to privacy policy
- [x] All prices removed → "Contáctenos para presupuesto personalizado"
- [x] Mobile text sizing increased (html 17px base on mobile)
- [x] Admin link removed from public pages
- [x] cPanel deployment scripts (PHP proxy, .htaccess)
- [x] localStorage JWT auth for cPanel compatibility

## Admin Credentials
- URL: /admin (direct access only, no public link)
- Email: admin@bariatricistanbul.com
- Password: admin123

## Tech Stack
React + FastAPI + MongoDB, Tailwind CSS, Slick Carousel, FontAwesome, react-international-phone

- [x] Google Analytics (GA4: G-65DHG712ZZ) + Meta Pixel (413226940305519)
- [x] Lead conversion tracking on form submit (GA4 generate_lead + Meta Lead event)
- [x] Meta Conversions API (server-side tracking with event deduplication)

## Prioritized Backlog
### P1
- Replace placeholder images with real B&A photos
- Real video testimonials (YouTube embeds)

### P2
- Deploy alternative languages (Turkish, German)
- Live chat widget
- More blog posts for SEO
