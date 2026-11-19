# Mike's Irrigation Mockup

Static, one-page landing-page **mockup** for Michael's Irrigation & Landscaping (Crosby, TX).
It demonstrates a "Request a free estimate" flow (services, project details, date & time, contact) and a project portfolio.
Nothing is submitted anywhere. Forms and bookings are simulated in the browser.

## Stack
- Plain HTML / CSS / JS, with no build step
- [GSAP 3](https://gsap.com/) (core, ScrollTrigger, ScrollToPlugin) loaded from cdnjs
- Font: Plus Jakarta Sans (Google Fonts)

## Structure
```
index.html
css/styles.css        design tokens, layout, components (mobile-first)
js/estimate.js        free-estimate flow: services, project questions, calendar, time slots, .ics download
js/main.js            header/menu, portfolio carousel, FAQ, contact form, GSAP motion
assets/img/portfolio  project photos from the current website
```

## Preview locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages
Push the repo, then go to **Settings → Pages → Deploy from branch → `main` / root**.
All paths are relative, so it also works under a `/<repo>/` subpath.

## Notes
- No prices are shown online. The written price comes after the free on-site visit.
- Booked time slots are generated deterministically per date to look realistic.
