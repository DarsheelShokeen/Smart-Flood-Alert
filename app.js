// ==========================================================================
//  Smart Flood Alert — Dashboard Controller
// ==========================================================================

// Track project visit in portfolio
(function() {
    var sfCount = parseInt(localStorage.getItem('smartflood_use_count') || '0', 10);
    localStorage.setItem('smartflood_use_count', (sfCount + 1).toString());
})();

const API_BASE = '';
const POLL_INTERVAL = 2000;

// --------------------------------------------------------------------------
//  DOM Elements
// --------------------------------------------------------------------------
const el = {
    statusHero:     document.getElementById('status-hero'),
    statusText:     document.getElementById('status-text'),
    statusSub:      document.getElementById('status-sub'),
    iconNormal:     document.getElementById('icon-normal'),
    iconFlood:      document.getElementById('icon-flood'),

    waterFill:      document.getElementById('water-fill'),
    waterNumber:    document.getElementById('water-level-number'),
    levelBadge:     document.getElementById('level-badge'),

    esp32Status:    document.getElementById('esp32-status'),
    esp32LastSeen:  document.getElementById('esp32-last-seen'),
    alarmState:     document.getElementById('alarm-state'),
    whatsappStatus: document.getElementById('whatsapp-status'),
    demoMode:       document.getElementById('demo-mode'),
    totalAlerts:    document.getElementById('total-alerts'),

    lastFlood:      document.getElementById('last-flood'),
    lastWhatsapp:   document.getElementById('last-whatsapp'),
    alertHistory:   document.getElementById('alert-history'),

    connBadge:      document.getElementById('connection-status'),
    connText:       document.getElementById('connection-text'),
    clock:          document.getElementById('clock'),

    simSlider:      document.getElementById('sim-slider'),
    simValue:       document.getElementById('sim-value'),
    simStatusLabel: document.getElementById('sim-status-label'),

    themeBtn:       document.getElementById('theme-toggle'),
};

// --------------------------------------------------------------------------
//  State & Client-Side Simulation Fallback
// --------------------------------------------------------------------------
let previousState = null;
let displayedLevel = 0;
let numberAnim = null;
let liveServerAvailable = false;

let mockState = {
    water_level: 18,
    current_state: 'NORMAL',
    alarm_active: false,
    whatsapp_status: 'ARMED',
    esp32_connected: true,
    last_seen: new Date().toISOString(),
    total_alerts: 1,
    demo_mode: true,
    last_flood: null,
    last_whatsapp: null,
    alert_history: [
        {
            device_id: 'esp32-zone-a',
            water_level: 84,
            recipients_notified: 3,
            success: true,
            timestamp: new Date(Date.now() - 1800000).toISOString()
        }
    ]
};

// --------------------------------------------------------------------------
//  Theme Toggle & Sync with Portfolio
// --------------------------------------------------------------------------
function getTheme() {
    return localStorage.getItem('portfolio_theme') || localStorage.getItem('flood-theme') || 'dark';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('flood-theme', theme);
    localStorage.setItem('portfolio_theme', theme);
}

setTheme(getTheme());

if (el.themeBtn) {
    el.themeBtn.addEventListener('click', () => {
        const next = getTheme() === 'dark' ? 'light' : 'dark';
        setTheme(next);
    });
}

// --------------------------------------------------------------------------
//  Clock
// --------------------------------------------------------------------------
function updateClock() {
    if (el.clock) {
        el.clock.textContent = new Date().toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
    }
}
setInterval(updateClock, 1000);
updateClock();

// --------------------------------------------------------------------------
//  Slider Fill Tracking
// --------------------------------------------------------------------------
function syncSliderFill(val) {
    const pct = Math.max(0, Math.min(100, val));
    const isDark = getTheme() === 'dark';
    const trackColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const fillColor = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#3b82f6';
    if (el.simSlider) {
        el.simSlider.style.background =
            `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${pct}%, ${trackColor} ${pct}%, ${trackColor} 100%)`;
    }
}
syncSliderFill(18);

// --------------------------------------------------------------------------
//  Smooth Number Animation
// --------------------------------------------------------------------------
function animateNumber(target) {
    if (numberAnim) cancelAnimationFrame(numberAnim);
    target = Math.round(target);
    if (displayedLevel === target) {
        if (el.waterNumber) el.waterNumber.textContent = target;
        return;
    }

    const start = displayedLevel;
    const diff = target - start;
    const duration = Math.min(600, Math.abs(diff) * 18);
    const t0 = performance.now();

    function tick(now) {
        const elapsed = now - t0;
        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        displayedLevel = Math.round(start + diff * eased);
        if (el.waterNumber) el.waterNumber.textContent = displayedLevel;
        if (progress < 1) {
            numberAnim = requestAnimationFrame(tick);
        } else {
            displayedLevel = target;
            if (el.waterNumber) el.waterNumber.textContent = target;
            numberAnim = null;
        }
    }
    numberAnim = requestAnimationFrame(tick);
}

// --------------------------------------------------------------------------
//  Fetch & Update (with offline simulation fallback)
// --------------------------------------------------------------------------
async function fetchStatus() {
    try {
        const res = await fetch(`${API_BASE}/api/status`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        liveServerAvailable = true;
        updateDashboard(data);
        setConnection(true);
    } catch (err) {
        liveServerAvailable = false;
        // Run with client-side interactive mock
        updateDashboard(mockState);
        setConnection(false);
    }
}

function updateDashboard(data) {
    const isFlood = data.current_state === 'FLOOD';
    previousState = data.current_state;

    // Status Hero
    if (isFlood) {
        el.statusHero.className = 'card hero hero-flood';
        el.statusText.textContent = 'Flood Detected';
        el.statusSub.textContent = 'Water level exceeded 75% threshold. Emergency alerts dispatched.';
        el.iconNormal.classList.add('hidden');
        el.iconFlood.classList.remove('hidden');
        document.body.classList.add('flood-active');
    } else {
        el.statusHero.className = 'card hero hero-normal';
        el.statusText.textContent = 'System Normal';
        el.statusSub.textContent = 'All water levels within safe parameters. Alert dispatch armed.';
        el.iconNormal.classList.remove('hidden');
        el.iconFlood.classList.add('hidden');
        document.body.classList.remove('flood-active');
    }

    // Gauge
    const level = data.water_level || 0;
    el.waterFill.style.width = `${level}%`;
    animateNumber(level);

    if (level >= 75) {
        el.waterFill.style.background = 'var(--red)';
        el.levelBadge.textContent = 'Critical';
        el.levelBadge.className = 'tag tag-danger';
    } else if (level >= 40) {
        el.waterFill.style.background = 'var(--amber)';
        el.levelBadge.textContent = 'Elevated';
        el.levelBadge.className = 'tag tag-warn';
    } else {
        el.waterFill.style.background = 'var(--blue)';
        el.levelBadge.textContent = 'Safe';
        el.levelBadge.className = 'tag tag-safe';
    }

    // ESP32 Status
    if (data.esp32_connected) {
        el.esp32Status.textContent = 'Connected';
        el.esp32Status.className = 'tag tag-safe';
        el.esp32LastSeen.textContent = formatTime(data.last_seen);
    } else {
        el.esp32Status.textContent = 'Disconnected';
        el.esp32Status.className = 'tag tag-danger';
        el.esp32LastSeen.textContent = formatTime(data.last_seen);
    }

    // Alarm State
    if (data.alarm_active) {
        el.alarmState.textContent = 'Buzzer + Red LED ACTIVE';
        el.alarmState.className = 'val val-danger';
    } else {
        el.alarmState.textContent = 'Silent (Green LED)';
        el.alarmState.className = 'val val-muted';
    }

    // WhatsApp Status
    if (data.whatsapp_status === 'SENT' || data.whatsapp_status === 'DELIVERED') {
        el.whatsappStatus.textContent = 'Alert Sent';
        el.whatsappStatus.className = 'tag tag-danger';
    } else if (data.whatsapp_status === 'ARMED') {
        el.whatsappStatus.textContent = 'Armed';
        el.whatsappStatus.className = 'tag tag-safe';
    } else {
        el.whatsappStatus.textContent = data.whatsapp_status || 'Armed';
        el.whatsappStatus.className = 'tag tag-subtle';
    }

    // Demo Mode & Alert Count
    el.demoMode.textContent = data.demo_mode ? 'Enabled' : 'Disabled';
    el.totalAlerts.textContent = data.total_alerts || 0;

    // Last Events
    el.lastFlood.textContent = formatTime(data.last_flood);
    el.lastWhatsapp.textContent = formatTime(data.last_whatsapp);

    // History
    renderHistory(data.alert_history || []);
}

// --------------------------------------------------------------------------
//  History Rendering
// --------------------------------------------------------------------------
function renderHistory(items) {
    if (!items || !items.length) {
        el.alertHistory.innerHTML = '<p class="empty-msg">No alerts recorded yet.</p>';
        return;
    }
    el.alertHistory.innerHTML = items.map(item => `
        <div class="history-item">
            <div class="hi-info">
                <span class="hi-device">${item.device_id || 'model-city-01'} — ${item.water_level}%</span>
                <span class="hi-detail">${item.recipients_notified || 3} notified ${item.success !== false ? '✓' : '✗'}</span>
            </div>
            <span class="hi-time">${formatTime(item.timestamp)}</span>
        </div>
    `).join('');
}

// --------------------------------------------------------------------------
//  Connection Indicator
// --------------------------------------------------------------------------
function setConnection(online) {
    if (online) {
        el.connBadge.className = 'pill conn online';
        el.connText.textContent = 'Live ESP32';
    } else {
        el.connBadge.className = 'pill conn online';
        el.connText.textContent = 'Interactive Demo';
    }
}

// --------------------------------------------------------------------------
//  Client-Side Simulation Engine (Runs when server is not local)
// --------------------------------------------------------------------------
function updateMockLevel(level) {
    mockState.water_level = level;
    mockState.last_seen = new Date().toISOString();
    
    if (level >= 75) {
        if (mockState.current_state !== 'FLOOD') {
            mockState.total_alerts++;
            mockState.last_flood = new Date().toISOString();
            mockState.last_whatsapp = new Date().toISOString();
            mockState.whatsapp_status = 'DELIVERED';
            mockState.alert_history.unshift({
                device_id: 'esp32-zone-a',
                water_level: level,
                recipients_notified: 3,
                success: true,
                timestamp: new Date().toISOString()
            });
        }
        mockState.current_state = 'FLOOD';
        mockState.alarm_active = true;
    } else {
        mockState.current_state = 'NORMAL';
        mockState.alarm_active = false;
        mockState.whatsapp_status = 'ARMED';
    }
    updateDashboard(mockState);
}

// --------------------------------------------------------------------------
//  Button Handlers
// --------------------------------------------------------------------------
document.getElementById('btn-test').addEventListener('click', async () => {
    if (liveServerAvailable) {
        try {
            await fetch(`${API_BASE}/api/test-alert`, { method: 'POST' });
            fetchStatus();
            return;
        } catch (e) {}
    }
    // Mock test
    mockState.total_alerts++;
    mockState.last_whatsapp = new Date().toISOString();
    mockState.alert_history.unshift({
        device_id: 'manual-test-btn',
        water_level: mockState.water_level,
        recipients_notified: 3,
        success: true,
        timestamp: new Date().toISOString()
    });
    alert('Simulated WhatsApp Emergency Dispatch sent to 3 recipients!');
    updateDashboard(mockState);
});

document.getElementById('btn-reset').addEventListener('click', async () => {
    if (liveServerAvailable) {
        try {
            await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
            fetchStatus();
            return;
        } catch (e) {}
    }
    // Mock reset
    mockState.current_state = 'NORMAL';
    mockState.alarm_active = false;
    mockState.whatsapp_status = 'ARMED';
    updateMockLevel(15);
    el.simSlider.value = 15;
    el.simValue.textContent = '15%';
    syncSliderFill(15);
});

document.getElementById('btn-simulate').addEventListener('click', async () => {
    const level = parseInt(el.simSlider.value);
    if (liveServerAvailable) {
        try {
            await fetch(`${API_BASE}/api/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ water_level: level })
            });
            fetchStatus();
            return;
        } catch (e) {}
    }
    updateMockLevel(level);
});

el.simSlider.addEventListener('input', (e) => {
    el.simValue.textContent = e.target.value + '%';
    syncSliderFill(e.target.value);
});

// --------------------------------------------------------------------------
//  Pour & Drain Actions
// --------------------------------------------------------------------------
let simTimer = null;
function clearSim() {
    if (simTimer) { clearInterval(simTimer); simTimer = null; }
}

async function pushLevel(level) {
    el.simSlider.value = level;
    el.simValue.textContent = level + '%';
    syncSliderFill(level);
    if (liveServerAvailable) {
        try {
            await fetch(`${API_BASE}/api/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ water_level: level })
            });
            await fetchStatus();
            return;
        } catch (e) {}
    }
    updateMockLevel(level);
}

document.getElementById('btn-pour').addEventListener('click', () => {
    clearSim();
    el.simStatusLabel.textContent = 'Pouring...';
    el.simStatusLabel.className = 'tag tag-active';
    let current = parseInt(el.simSlider.value) || 0;
    simTimer = setInterval(async () => {
        current += 7;
        if (current >= 88) {
            current = 88;
            clearSim();
            el.simStatusLabel.textContent = 'Flooded';
        }
        await pushLevel(current);
    }, 280);
});

document.getElementById('btn-drain').addEventListener('click', () => {
    clearSim();
    el.simStatusLabel.textContent = 'Draining...';
    el.simStatusLabel.className = 'tag tag-active';
    let current = parseInt(el.simSlider.value) || 0;
    simTimer = setInterval(async () => {
        current -= 8;
        if (current <= 10) {
            current = 10;
            clearSim();
            el.simStatusLabel.textContent = 'Ready';
            el.simStatusLabel.className = 'tag tag-subtle';
        }
        await pushLevel(current);
    }, 250);
});

// --------------------------------------------------------------------------
//  Helper
// --------------------------------------------------------------------------
function formatTime(iso) {
    if (!iso) return 'Never';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

// --------------------------------------------------------------------------
//  Initial Run
// --------------------------------------------------------------------------
setInterval(fetchStatus, POLL_INTERVAL);
fetchStatus();
