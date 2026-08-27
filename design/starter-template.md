```html

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Antigravity UI Design System Starter</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg-app: #f8fafc;
      --bg-surface: #ffffff;
      --bg-card: #ffffff;
      --bg-subtle: #f1f5f9;
      --border: #e2e8f0;
      --border-strong: #cbd5e1;
      --border-focus: #2563eb;

      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;

      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --primary-subtle: #eff6ff;
      --primary-glow: rgba(37, 99, 235, 0.2);
      --accent: #7c3aed;

      --success: #16a34a;
      --success-subtle: #f0fdf4;
      --warning: #d97706;
      --warning-subtle: #fffbeb;
      --danger: #dc2626;
      --danger-subtle: #fef2f2;

      --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;

      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-full: 9999px;

      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: var(--bg-app); color: var(--text-primary); font-family: var(--font); height: 100vh; overflow: hidden; -webkit-font-smoothing: antialiased; }
    .app-layout { display: flex; flex-direction: column; height: 100vh; }

    /* NAVBAR */
    .app-header { height: 60px; background: var(--bg-surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 20; }
    .header-left, .header-center, .header-right { display: flex; align-items: center; gap: 12px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-badge { background: linear-gradient(135deg, var(--primary), var(--accent)); color: #fff; font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: var(--radius-sm); letter-spacing: 0.5px; }
    .brand-title { font-size: 0.95rem; color: var(--text-secondary); }
    .brand-title strong { color: var(--text-primary); font-weight: 700; }
    .brand-sub { font-size: 0.78rem; color: var(--text-muted); border-left: 1px solid var(--border); padding-left: 10px; }

    .active-badge { display: flex; align-items: center; gap: 8px; padding: 4px 14px; background: var(--primary-subtle); border: 1px solid #bfdbfe; border-radius: var(--radius-full); font-size: 0.82rem; font-weight: 600; color: var(--primary); }
    .pulse-dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { transform: scale(0.9); opacity: 0.7; } 50% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.7; } }
    .badge-type { background: #dbeafe; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #1e40af; }

    .status-chip { display: flex; align-items: center; gap: 8px; padding: 5px 12px; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: var(--radius-full); font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-muted); }
    .status-chip.connected { color: var(--success); border-color: #bbf7d0; background: var(--success-subtle); }
    .status-chip.connected .status-dot { background: var(--success); }

    /* BODY & SIDEBAR */
    .app-body { flex: 1; display: flex; overflow: hidden; }
    .app-sidebar { width: 320px; background: var(--bg-surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
    .sidebar-header { padding: 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
    .sidebar-title-row { display: flex; align-items: center; gap: 8px; }
    .sidebar-title-row h3 { font-size: 0.95rem; font-weight: 600; }
    .counter-badge { background: var(--primary); color: #fff; font-size: 0.75rem; font-weight: 700; padding: 1px 7px; border-radius: var(--radius-full); }

    .task-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .task-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px; cursor: pointer; transition: all 0.15s ease; }
    .task-card:hover { border-color: var(--primary); box-shadow: var(--shadow-sm); }
    .task-card.active { border-color: var(--primary); background: var(--primary-subtle); }
    .task-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .task-card-id { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 600; color: var(--primary); }
    .task-card-type { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: var(--text-secondary); }
    .task-card-url { font-size: 0.8rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 8px; }
    .task-card-footer { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); }

    /* MAIN STAGE */
    .app-main { flex: 1; overflow-y: auto; padding: 24px; background: var(--bg-app); display: flex; flex-direction: column; gap: 16px; }
    .challenge-header-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px 20px; box-shadow: var(--shadow-sm); }
    .challenge-meta-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .challenge-title-group { display: flex; align-items: center; gap: 12px; }
    .challenge-title-group h2 { font-family: var(--font-mono); font-size: 1.15rem; font-weight: 700; }
    .type-pill { background: #eff6ff; border: 1px solid #bfdbfe; color: var(--primary); font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: var(--radius-full); text-transform: uppercase; }
    .url-bar { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
    .url-label { font-weight: 600; color: var(--text-muted); }
    .url-link { color: var(--primary); text-decoration: none; font-family: var(--font-mono); }

    .v2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm); }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .card-header h4 { font-size: 0.95rem; font-weight: 600; }
    .badge-subtle { font-size: 0.75rem; color: var(--primary); background: var(--primary-subtle); border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 4px; font-weight: 600; }

    .signal-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .s-label { color: var(--text-muted); }
    .s-val { color: var(--text-secondary); font-weight: 500; }

    /* BUTTONS */
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 16px; font-size: 0.85rem; font-weight: 600; border-radius: var(--radius-sm); cursor: pointer; border: 1px solid transparent; transition: all 0.15s ease; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-glow { box-shadow: 0 0 16px rgba(37, 99, 235, 0.25); }
    .btn-secondary { background: var(--bg-subtle); border-color: var(--border); color: var(--text-primary); }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-icon { padding: 6px; background: transparent; color: var(--text-muted); border-radius: var(--radius-sm); }
    .btn-icon:hover { color: var(--text-primary); background: var(--bg-subtle); border-color: var(--border); }
  </style>
</head>
<body>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-left">
        <div class="brand">
          <div class="brand-badge">AGY</div>
          <span class="brand-title">Antigravity <strong>Dashboard</strong></span>
          <span class="brand-sub">UI System</span>
        </div>
      </div>
      <div class="header-center">
        <div class="active-badge">
          <span class="pulse-dot"></span>
          <span>task-1024</span>
          <span class="badge-type">ACTIVE</span>
        </div>
      </div>
      <div class="header-right">
        <div class="status-chip connected">
          <span class="status-dot"></span>
          <span>System Online</span>
        </div>
      </div>
    </header>

    <div class="app-body">
      <aside class="app-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-title-row">
            <h3>Active Queue</h3>
            <span class="counter-badge">2</span>
          </div>
          <button class="btn btn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
        </div>
        <div class="task-list">
          <div class="task-card active">
            <div class="task-card-header">
              <span class="task-card-id">TASK-1024</span>
              <span class="task-card-type">RECAPTCHA</span>
            </div>
            <div class="task-card-url">https://example.com/checkout</div>
            <div class="task-card-footer">
              <span>Status: Active</span>
              <span>10:45 AM</span>
            </div>
          </div>
          <div class="task-card">
            <div class="task-card-header">
              <span class="task-card-id">TASK-1025</span>
              <span class="task-card-type">TURNSTILE</span>
            </div>
            <div class="task-card-url">https://example.com/login</div>
            <div class="task-card-footer">
              <span>Status: Pending</span>
              <span>10:48 AM</span>
            </div>
          </div>
        </div>
      </aside>

      <main class="app-main">
        <div class="challenge-header-card">
          <div class="challenge-meta-row">
            <div class="challenge-title-group">
              <span class="type-pill">reCAPTCHA v2</span>
              <h2>task-1024</h2>
            </div>
            <button class="btn btn-primary btn-glow">Execute Action</button>
          </div>
          <div class="url-bar">
            <span class="url-label">Target URL:</span>
            <a href="#" class="url-link">https://example.com/checkout</a>
          </div>
        </div>

        <div class="v2-grid">
          <div class="card">
            <div class="card-header">
              <h4>System Details</h4>
              <span class="badge-subtle">Ready</span>
            </div>
            <div class="signal-row">
              <span class="s-label">Environment:</span>
              <span class="s-val">Production</span>
            </div>
            <div class="signal-row">
              <span class="s-label">Viewport:</span>
              <span class="s-val">1280 x 720</span>
            </div>
            <div class="signal-row">
              <span class="s-label">Latency:</span>
              <span class="s-val">12 ms</span>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h4>Quick Actions</h4>
              <span class="badge-subtle">Controls</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
              Trigger background worker replay or refresh active token cache.
            </p>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary">Start Task</button>
              <button class="btn btn-secondary">Pause</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</body>
</html>

```