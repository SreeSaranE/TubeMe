# Nevada Antigravity Design System & UI Style Guide
## Modern Light Dashboard Component Kit

A clean, minimalist, high-contrast light design system engineered for dashboards, automation portals, and monitoring interfaces.

---

## 🎨 1. Design Tokens & CSS Variables

Include this `:root` block at the top of your global stylesheet:

```css
:root {
  /* Surface & Background Colors */
  --bg-app: #f8fafc;           /* Slate-50: Main viewport canvas */
  --bg-surface: #ffffff;       /* Pure White: Header, Sidebar, Cards */
  --bg-card: #ffffff;          /* Card backgrounds */
  --bg-subtle: #f1f5f9;        /* Slate-100: Inputs, chips, subtle rows */
  
  /* Borders */
  --border: #e2e8f0;           /* Slate-200: Default component border */
  --border-strong: #cbd5e1;    /* Slate-300: Hover / strong outlines */
  --border-focus: #2563eb;     /* Blue-600: Input focus ring */

  /* Typography Colors */
  --text-primary: #0f172a;     /* Slate-900: Headings, prominent text */
  --text-secondary: #475569;   /* Slate-600: Body text, labels */
  --text-muted: #94a3b8;       /* Slate-400: Timestamps, hints, placeholders */

  /* Brand & Accent Palette */
  --primary: #2563eb;          /* Blue-600: Primary actions, active borders */
  --primary-hover: #1d4ed8;    /* Blue-700: Button hover state */
  --primary-subtle: #eff6ff;   /* Blue-50: Active badge / selection background */
  --primary-glow: rgba(37, 99, 235, 0.2);
  --accent: #7c3aed;           /* Purple-600: Brand gradient accent */

  /* Semantic Feedback Colors */
  --success: #16a34a;          /* Green-600: Online / Resolved */
  --success-subtle: #f0fdf4;   /* Green-50: Success chip background */
  --warning: #d97706;          /* Amber-600: Pending / Connecting */
  --warning-subtle: #fffbeb;   /* Amber-50: Warning chip background */
  --danger: #dc2626;           /* Red-600: Offline / Failed */
  --danger-subtle: #fef2f2;    /* Red-50: Danger chip background */

  /* Typography */
  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Corner Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;

  /* Shadows & Elevation */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.08);
}
```

---

## 🔤 2. Typography & Font Setup

Add Google Fonts to your `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

| Type Scale | Size / Weight | CSS Class / Element | Usage |
| :--- | :--- | :--- | :--- |
| **H1 / Hero Title** | `1.4rem` (22px) / `700` | `h1, .hero-title` | Page or feature titles |
| **H2 / Section Title** | `1.15rem` (18px) / `700` | `h2, .stage-title` | Active task card headers |
| **H3 / Sidebar Header**| `0.95rem` (15px) / `600` | `h3, .sidebar-title` | Sidebar section headers |
| **H4 / Card Header** | `0.95rem` (15px) / `600` | `h4, .card-title` | Inner card headings |
| **Body Primary** | `0.88rem` (14px) / `400-500` | `p, body, span` | Main readable text |
| **Caption / Labels** | `0.78rem` (12.5px) / `500-600` | `.s-label, .canvas-hint` | Subtitles, hints, metadata |
| **Mono Text** | `0.80rem` (13px) / `500` | `code, .mono, .url-link` | Task IDs, tokens, URLs, metrics |

---

## 📐 3. App Shell Structure (HTML Template)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App Title</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="app-layout">
    
    <!-- 1. TOP NAVBAR (Height: 60px) -->
    <header class="app-header">
      <div class="header-left">
        <div class="brand">
          <div class="brand-badge">PROD</div>
          <span class="brand-title">Your <strong>Application</strong></span>
          <span class="brand-sub">Sub-Module</span>
        </div>
      </div>

      <div class="header-center">
        <!-- Optional Active Session Pill -->
        <div class="active-badge" id="active-session-pill">
          <span class="pulse-dot"></span>
          <span id="nav-item-id">session-1000</span>
          <span class="badge-type">ACTIVE</span>
        </div>
      </div>

      <div class="header-right">
        <!-- Live Status Chip -->
        <div class="status-chip connected" id="system-badge">
          <span class="status-dot"></span>
          <span>Gateway Online</span>
        </div>
      </div>
    </header>

    <!-- 2. MAIN BODY (Flex Row) -->
    <div class="app-body">
      
      <!-- 2A. LEFT SIDEBAR (Width: 320px) -->
      <aside class="app-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-title-row">
            <h3>Queue Items</h3>
            <span class="counter-badge">3</span>
          </div>
          <button class="btn btn-icon" title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>

        <div class="task-list">
          <!-- Active Card -->
          <div class="task-card active">
            <div class="task-card-header">
              <span class="task-card-id">TASK-1024</span>
              <span class="task-card-type">RECAPTCHA</span>
            </div>
            <div class="task-card-url">https://example.com/checkout</div>
            <div class="task-card-footer">
              <div class="task-card-status">
                <span class="status-dot solving"></span>
                <span>Solving</span>
              </div>
              <span class="task-card-time">10:45 AM</span>
            </div>
          </div>

          <!-- Pending Card -->
          <div class="task-card">
            <div class="task-card-header">
              <span class="task-card-id">TASK-1025</span>
              <span class="task-card-type">CLOUDFLARE</span>
            </div>
            <div class="task-card-url">https://example.com/login</div>
            <div class="task-card-footer">
              <div class="task-card-status">
                <span class="status-dot pending"></span>
                <span>Pending</span>
              </div>
              <span class="task-card-time">10:47 AM</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 2B. MAIN STAGE -->
      <main class="app-main">
        <!-- Content inserted here -->
      </main>
    </div>
  </div>
</body>
</html>
```

---

## 🧩 4. Core UI Component Library

### Component 1: Top Navigation Bar (`.app-header`)
```css
.app-header {
  height: 60px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 20;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-badge {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.5px;
}

.brand-title {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.brand-title strong {
  color: var(--text-primary);
  font-weight: 700;
}

.brand-sub {
  font-size: 0.78rem;
  color: var(--text-muted);
  border-left: 1px solid var(--border);
  padding-left: 10px;
}
```

---

### Component 2: Status Chips with Live Indicators (`.status-chip`)
```html
<!-- Online -->
<div class="status-chip connected">
  <span class="status-dot"></span>
  <span>Gateway Online</span>
</div>

<!-- Offline -->
<div class="status-chip disconnected">
  <span class="status-dot"></span>
  <span>Gateway Offline</span>
</div>

<!-- Connecting -->
<div class="status-chip connecting">
  <span class="status-dot"></span>
  <span>Connecting...</span>
</div>
```

```css
.status-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
}

.status-chip.connected {
  color: var(--success);
  border-color: #bbf7d0;
  background: var(--success-subtle);
}
.status-chip.connected .status-dot {
  background: var(--success);
}

.status-chip.disconnected {
  color: var(--danger);
  border-color: #fecaca;
  background: var(--danger-subtle);
}
.status-chip.disconnected .status-dot {
  background: var(--danger);
}

.status-chip.connecting {
  color: var(--warning);
  border-color: #fde68a;
  background: var(--warning-subtle);
}
.status-chip.connecting .status-dot {
  background: var(--warning);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}
```

---

### Component 3: Sidebar & Queue Cards (`.task-card`)
```css
.app-sidebar {
  width: 320px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.counter-badge {
  background: var(--primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: var(--radius-full);
}

.task-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.task-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.task-card.active {
  border-color: var(--primary);
  background: var(--primary-subtle);
}

.task-card-id {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary);
}

.task-card-type {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
}

.task-card-url {
  font-size: 0.8rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}
```

---

### Component 4: Standard Buttons (`.btn`)
```html
<button class="btn btn-primary btn-glow">Primary Action</button>
<button class="btn btn-secondary">Secondary Action</button>
<button class="btn btn-icon">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-glow {
  box-shadow: 0 0 16px rgba(37, 99, 235, 0.3);
}

.btn-secondary {
  background: var(--bg-subtle);
  border-color: var(--border);
  color: var(--text-primary);
}
.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-icon {
  padding: 6px;
  background: transparent;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
}
.btn-icon:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
  border-color: var(--border);
}
```

---

### Component 5: Header Banner Card (`.challenge-header-card`)
```html
<div class="challenge-header-card">
  <div class="challenge-meta-row">
    <div class="challenge-title-group">
      <span class="type-pill">reCAPTCHA v2</span>
      <h2>task-1234</h2>
    </div>
    <div class="header-actions">
      <button class="btn btn-primary btn-glow">Launch Action</button>
    </div>
  </div>
  <div class="url-bar">
    <span class="url-label">Target URL:</span>
    <a href="#" class="url-link">https://example.com</a>
  </div>
</div>
```

```css
.challenge-header-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
}

.challenge-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.challenge-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.challenge-title-group h2 {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.type-pill {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
}

.url-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.url-label { font-weight: 600; color: var(--text-muted); }
.url-link { color: var(--primary); text-decoration: none; font-family: var(--font-mono); }
.url-link:hover { text-decoration: underline; }
```

---

### Component 6: Minimalist Idle / Waiting State (`.placeholder-view`)
```html
<div class="placeholder-view">
  <div class="placeholder-box">
    <div class="placeholder-icon">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
    </div>
    <h2>Waiting for Challenges</h2>
    <p>Active items will appear here automatically when detected.</p>
  </div>
</div>
```

```css
.placeholder-view {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-box {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 40px;
  max-width: 460px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.placeholder-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--primary-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.placeholder-box h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.placeholder-box p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}
```

---

### Component 7: Pixel-Perfect Click Ripple Indicator
```html
<div class="canvas-container" style="position: relative;">
  <canvas id="viewport-canvas"></canvas>
  <div class="click-ripple" id="click-ripple"></div>
</div>
```

```css
.click-ripple {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.3);
  border: 2px solid #2563eb;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: transform 0.25s ease-out, opacity 0.25s ease-out;
  z-index: 50;
}

.click-ripple.animate {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}
```

```javascript
// JavaScript Click Handler:
function showClickRipple(rippleEl, containerEl, clientX, clientY) {
  if (!rippleEl || !containerEl) return;
  const rect = containerEl.getBoundingClientRect();
  rippleEl.style.left = `${clientX - rect.left}px`;
  rippleEl.style.top = `${clientY - rect.top}px`;
  rippleEl.classList.remove('animate');
  void rippleEl.offsetWidth; // Force reflow
  rippleEl.classList.add('animate');
}
```

---

## 📦 5. How to Replicate in Any New Project

1. Copy the **`:root` CSS variables** and basic body reset into your project's stylesheet.
2. Link Google Fonts (`Inter` + `JetBrains Mono`) in your HTML head.
3. Structure your layout using `<div class="app-layout">` $\rightarrow$ `<header class="app-header">` + `<div class="app-body">` (`.app-sidebar` + `.app-main`).
4. Use standard classes (`.status-chip`, `.task-card`, `.btn-primary`, `.card`) for consistent elements.
