// =====================================================
//  Exam Portal - UI Utilities
// =====================================================

// ── Toast notifications ──
function showToast(title, message, type = 'info', duration = 4000) {
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div>
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ── Loading overlay ──
function showLoading(msg = 'Processing...') {
    const el = document.getElementById('loading-overlay');
    el.querySelector('.loading-text').textContent = msg;
    el.classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

// ── Page navigation ──
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
}

// ── Modal ──
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ── Format helpers ──
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatDuration(mins) {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

function formatScore(score) {
    return score !== null && score !== undefined ? Number(score).toFixed(1) : '0.0';
}

function getScoreColor(percentage) {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#00d4ff';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
}

function getLevelBadge(level) {
    const map = {
        excellent: 'badge-success',
        good: 'badge-primary',
        average: 'badge-warning',
        below_average: 'badge-warning',
        poor: 'badge-danger',
        very_poor: 'badge-danger',
        no_answer: 'badge-secondary'
    };
    return map[level] || 'badge-secondary';
}

// ── Timer ──
class ExamTimer {
    constructor(durationMinutes, onTick, onExpire) {
        this.remaining = durationMinutes * 60;
        this.onTick = onTick;
        this.onExpire = onExpire;
        this.interval = null;
    }

    start() {
        this.interval = setInterval(() => {
            this.remaining--;
            this.onTick(this.remaining);
            if (this.remaining <= 0) {
                this.stop();
                this.onExpire();
            }
        }, 1000);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
    }

    format() {
        const mins = Math.floor(this.remaining / 60).toString().padStart(2, '0');
        const secs = (this.remaining % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }
}

// ── Anti-cheat: warn on tab switch ──
function setupAntiCheat(onViolation) {
    let violations = 0;

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            violations++;
            onViolation(violations);
        }
    });

    window.addEventListener('beforeunload', (e) => {
        e.preventDefault();
        e.returnValue = 'Your exam is in progress. Are you sure you want to leave?';
    });
}

// ── Sidebar nav ──
function initSidebarNav(role) {
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            if (role === 'ADMIN') {
                showAdminSection(section);
            } else {
                showStudentSection(section);
            }
        });
    });
}

function setActiveNav(section) {
    document.querySelectorAll('.nav-item[data-section]').forEach(n => {
        n.classList.toggle('active', n.dataset.section === section);
    });
}

// ── Sanitize HTML to prevent XSS ──
function sanitize(str) {
    const el = document.createElement('div');
    el.textContent = str || '';
    return el.innerHTML;
}
