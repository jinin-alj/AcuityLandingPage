# Acuity. — Landing Page

> Adaptive focus & break guidance for students.

---

## 🚀 Deploying to GitHub Pages

### First-time setup (do this once)

1. **Push the files to your repo:**
   ```bash
   git clone https://github.com/jinin-alj/AcuityLandingPage.git
   cd AcuityLandingPage

   # Copy index.html (and any other files) into this folder, then:
   git add .
   git commit -m "Initial landing page"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repo on GitHub: `github.com/jinin-alj/AcuityLandingPage`
   - Click **Settings** → **Pages** (left sidebar)
   - Under **Source**, select:
     - Branch: `main`
     - Folder: `/ (root)`
   - Click **Save**

3. **Your site will be live at:**
   ```
   https://jinin-alj.github.io/AcuityLandingPage/
   ```
   *(It may take 1–2 minutes the first time)*

---

## 📁 File Structure

```
AcuityLandingPage/
├── index.html      ← The entire site (single file, self-contained)
└── README.md       ← This file
```

All fonts, styles, and scripts are embedded directly in `index.html` — no build step required.

---

## 👥 How teammates collaborate

### Making changes

1. **Clone the repo** (first time only):
   ```bash
   git clone https://github.com/jinin-alj/AcuityLandingPage.git
   ```

2. **Pull latest changes** (always do this before editing):
   ```bash
   git pull origin main
   ```

3. **Edit `index.html`**, then push:
   ```bash
   git add index.html
   git commit -m "Brief description of your change"
   git push origin main
   ```

4. GitHub Pages **auto-deploys** within ~60 seconds of every push to `main`.

### Recommended workflow for bigger changes

1. Create a branch: `git checkout -b feature/your-change`
2. Make changes and push the branch
3. Open a Pull Request on GitHub
4. Review and merge → site updates automatically

---

## 🎨 Customization Guide

All content is in `index.html`. Common edits:

| What to change | Where to find it in the file |
|---|---|
| Team names / roles | Search `team-grid` |
| Stats (76%, 77%, 40%) | Search `data-target` |
| Problem / feature text | Search `#problem`, `#features` |
| Contact email | Search `nikitadjand@gmail.com` |
| Colors | Search `:root {` at the top of `<style>` |
| Waitlist backend | Search `TODO: wire to your email backend` |

---

## 📧 Connecting the Waitlist Form

The waitlist form currently stores submissions in-browser only. To actually collect emails, replace the `joinWaitlist` function with one of these:

### Option A — Formspree (free, no backend needed)
1. Sign up at [formspree.io](https://formspree.io) and create a form
2. Replace `<form ... onsubmit="joinWaitlist(...)">` with:
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

### Option B — Mailchimp embedded form
Replace the form action with your Mailchimp signup URL.

### Option C — Custom backend
Send a `POST` request with the email inside `joinWaitlist()`.

---

## 📸 Adding Real Team Photos

1. Add your photos to the repo (e.g., `images/jinin.jpg`, `images/luc.jpg`, `images/nikita.jpg`)
2. In `index.html`, find the `.team-avatar` divs and replace the initials with:
   ```html
   <img src="images/jinin.jpg" alt="Jinin Aljayyousi" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
   ```

---

*Built with HTML, CSS, and vanilla JS. No frameworks, no build tools — just push and it works.*
