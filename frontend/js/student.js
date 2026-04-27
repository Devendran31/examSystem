// =====================================================
//  Student Dashboard Logic
// =====================================================

let studentData = {
    exams: [],
    currentExam: null,
    answers: {},
    timer: null,
    antiCheatViolations: 0
};

async function loadStudentDashboard() {
    showPage('student-page');
    const user = api.getUser();
    document.getElementById('student-user-name').textContent = user.fullName || user.username;
    document.getElementById('student-user-initial').textContent = (user.fullName || user.username)[0].toUpperCase();
    initSidebarNav('STUDENT');
    await showStudentSection('dashboard');
}

async function showStudentSection(section) {
    setActiveNav(section);
    ['dashboard', 'exams', 'taking', 'results', 'history'].forEach(s => {
        const el = document.getElementById(`student-section-${s}`);
        if (el) el.style.display = s === section ? 'block' : 'none';
    });

    document.getElementById('student-topbar-title').textContent = {
        dashboard: 'My Dashboard',
        exams: 'Available Exams',
        taking: 'Exam in Progress',
        results: 'My Results',
        history: 'Submission History'
    }[section] || 'Dashboard';

    if (section === 'dashboard') await loadStudentStats();
    if (section === 'exams') await loadStudentExams();
    if (section === 'history') await loadSubmissionHistory();
}

// ── Stats ──
async function loadStudentStats() {
    try {
        const [exams, submissions] = await Promise.all([
            api.student.getExams(),
            api.student.getMySubmissions()
        ]);

        document.getElementById('student-stat-available').textContent = exams.length;
        document.getElementById('student-stat-taken').textContent = submissions.length;
        const passed = submissions.filter(s => s.passed).length;
        document.getElementById('student-stat-passed').textContent = passed;
        const avgPct = submissions.length > 0
            ? Math.round(submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.length)
            : 0;
        document.getElementById('student-stat-avg').textContent = avgPct + '%';

        renderStudentRecentResults(submissions.slice(-5).reverse());
    } catch (e) {
        showToast('Error', e.message, 'error');
    }
}

function renderStudentRecentResults(submissions) {
    const container = document.getElementById('student-recent-results');
    if (!container) return;
    if (!submissions.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No exams taken yet. Start your first exam!</div></div>`;
        return;
    }
    container.innerHTML = submissions.map(s => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.85rem 1rem;border-radius:var(--radius-sm);background:rgba(255,255,255,0.02);border:1px solid var(--border);margin-bottom:0.5rem">
            <div>
                <div style="font-weight:600">${sanitize(s.examTitle)}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary)">${formatDate(s.submittedAt)}</div>
            </div>
            <div style="text-align:right">
                <div style="font-weight:700;color:${getScoreColor(s.percentage)}">${s.percentage ?? 0}%</div>
                <span class="badge ${s.passed ? 'badge-success' : 'badge-danger'}" style="font-size:0.68rem">${s.passed ? 'PASS' : 'FAIL'}</span>
            </div>
        </div>
    `).join('');
}

// ── Available Exams ──
async function loadStudentExams() {
    try {
        studentData.exams = await api.student.getExams();
        renderExamGrid(studentData.exams);
    } catch (e) {
        showToast('Error', e.message, 'error');
    }
}

function renderExamGrid(exams) {
    const grid = document.getElementById('student-exam-grid');
    if (!exams.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📚</div><div class="empty-state-text">No exams available right now.</div></div>`;
        return;
    }
    grid.innerHTML = exams.map(e => `
        <div class="exam-card" onclick="confirmStartExam(${e.id}, '${sanitize(e.title)}')">
            <div class="exam-card-title">${sanitize(e.title)}</div>
            <div class="exam-card-desc">${sanitize(e.description || 'No description')}</div>
            <div class="exam-card-meta">
                <span class="exam-meta-item">⏱ ${formatDuration(e.durationMinutes)}</span>
                <span class="exam-meta-item">📊 ${e.totalMarks} marks</span>
                <span class="exam-meta-item">✅ Pass: ${e.passingMarks}</span>
                <span class="exam-meta-item">❓ ${e.questionCount ?? '?'} Qs</span>
            </div>
            <button class="btn btn-primary btn-full">Start Exam →</button>
        </div>
    `).join('');
}

function confirmStartExam(examId, examTitle) {
    document.getElementById('confirm-exam-name').textContent = examTitle;
    document.getElementById('confirm-start-btn').onclick = () => {
        closeModal('confirm-exam-modal');
        startExam(examId);
    };
    openModal('confirm-exam-modal');
}

// ── Exam Taking ──
async function startExam(examId) {
    try {
        showLoading('Loading exam...');
        const exam = await api.student.startExam(examId);
        hideLoading();

        studentData.currentExam = exam;
        studentData.answers = {};
        studentData.antiCheatViolations = 0;

        renderExamTaking(exam);
        await showStudentSection('taking');

        // Start timer
        studentData.timer = new ExamTimer(
            exam.durationMinutes,
            (remaining) => {
                const timerEl = document.getElementById('exam-timer');
                timerEl.textContent = studentData.timer.format();
                if (remaining <= 300) timerEl.parentElement.classList.add('warning');
            },
            () => {
                showToast('Time Up', 'Your exam has been auto-submitted!', 'warning');
                submitExam();
            }
        );
        studentData.timer.start();

        // Anti-cheat
        setupAntiCheat((violations) => {
            studentData.antiCheatViolations = violations;
            showToast('Warning', `Tab switch detected! (${violations} violation${violations > 1 ? 's' : ''})`, 'warning');
        });

    } catch (e) {
        hideLoading();
        showToast('Error', e.message, 'error');
    }
}

function renderExamTaking(exam) {
    document.getElementById('exam-taking-title').textContent = exam.title;
    document.getElementById('exam-total-marks').textContent = exam.totalMarks;
    document.getElementById('exam-question-count').textContent = exam.questions.length;

    const container = document.getElementById('exam-questions-container');
    container.innerHTML = exam.questions.map((q, i) => `
        <div class="question-card" id="qcard-${q.id}">
            <div class="question-number">Question ${i + 1} of ${exam.questions.length}</div>
            <div class="question-text">${sanitize(q.questionText)}</div>
            <div class="question-marks">Marks: ${q.marks}</div>
            ${q.type === 'MCQ' ? renderMCQOptions(q) : renderSubjectiveInput(q)}
        </div>
    `).join('');
}

function renderMCQOptions(q) {
    const options = [
        { key: 'A', text: q.optionA },
        { key: 'B', text: q.optionB },
        { key: 'C', text: q.optionC },
        { key: 'D', text: q.optionD }
    ].filter(o => o.text);

    return `
        <div class="mcq-options">
            ${options.map(opt => `
                <label class="mcq-option" id="opt-${q.id}-${opt.key}">
                    <input type="radio" name="q${q.id}" value="${opt.key}"
                        onchange="recordAnswer(${q.id}, '${opt.key}', 'MCQ')"
                        style="display:none">
                    <span class="option-label">${opt.key}</span>
                    <span>${sanitize(opt.text)}</span>
                </label>
            `).join('')}
        </div>
    `;
}

function renderSubjectiveInput(q) {
    return `
        <textarea class="form-control" rows="5"
            placeholder="Write your answer here..."
            onInput="recordAnswer(${q.id}, this.value, 'SUBJECTIVE')"
            style="margin-top:0.5rem">${studentData.answers[q.id] || ''}</textarea>
        <div style="text-align:right;font-size:0.75rem;color:var(--text-muted);margin-top:0.3rem" id="char-count-${q.id}">0 characters</div>
    `;
}

function recordAnswer(questionId, value, type) {
    studentData.answers[questionId] = value;

    if (type === 'MCQ') {
        // Update visual selection
        document.querySelectorAll(`[id^="opt-${questionId}-"]`).forEach(el => el.classList.remove('selected'));
        document.getElementById(`opt-${questionId}-${value}`)?.classList.add('selected');
    } else {
        const counter = document.getElementById(`char-count-${questionId}`);
        if (counter) counter.textContent = `${value.length} characters`;
    }

    updateProgress();
}

function updateProgress() {
    const exam = studentData.currentExam;
    if (!exam) return;
    const total = exam.questions.length;
    const answered = Object.keys(studentData.answers).filter(k => {
        const v = studentData.answers[k];
        return v && v.toString().trim() !== '';
    }).length;

    document.getElementById('progress-answered').textContent = answered;
    document.getElementById('progress-total').textContent = total;
    const pct = total > 0 ? Math.round(answered / total * 100) : 0;
    document.getElementById('progress-bar-fill').style.width = pct + '%';
}

async function submitExam() {
    if (studentData.timer) studentData.timer.stop();

    const exam = studentData.currentExam;
    if (!exam) return;

    const answers = exam.questions.map(q => ({
        questionId: q.id,
        studentAnswer: studentData.answers[q.id] || ''
    }));

    const payload = {
        examId: exam.id,
        answers: answers
    };

    try {
        showLoading('Evaluating your answers...');
        const result = await api.student.submitExam(payload);
        hideLoading();

        // Remove beforeunload listener
        window.onbeforeunload = null;

        renderResult(result);
        await showStudentSection('results');
    } catch (e) {
        hideLoading();
        showToast('Error', e.message, 'error');
    }
}

function confirmSubmit() {
    const exam = studentData.currentExam;
    if (!exam) return;
    const total = exam.questions.length;
    const answered = Object.keys(studentData.answers).filter(k => {
        const v = studentData.answers[k];
        return v && v.toString().trim() !== '';
    }).length;

    if (answered < total) {
        if (!confirm(`You have answered ${answered} of ${total} questions. Are you sure you want to submit?`)) return;
    }
    submitExam();
}

// ── Results ──
function renderResult(result) {
    const pct = result.percentage ?? 0;
    const passed = result.passed;

    document.getElementById('result-score-value').textContent = `${formatScore(result.totalScore)}/${formatScore(result.maxScore)}`;
    document.getElementById('result-percentage').textContent = pct + '%';
    document.getElementById('result-percentage').style.color = getScoreColor(pct);

    const circle = document.getElementById('result-score-circle');
    circle.className = `result-score-circle ${passed ? 'pass' : 'fail'}`;

    const badge = document.getElementById('result-verdict');
    badge.className = `result-badge-large ${passed ? 'pass' : 'fail'}`;
    badge.textContent = passed ? '🎉 PASSED' : '❌ FAILED';

    document.getElementById('result-exam-title').textContent = result.examTitle;
    document.getElementById('result-submitted-at').textContent = formatDate(result.submittedAt);

    // Answer review
    const container = document.getElementById('answer-review-container');
    container.innerHTML = result.answerResults.map((a, i) => {
        const isCorrect = a.isCorrect;
        const partial = !isCorrect && a.scoreObtained > 0;
        const cardClass = isCorrect ? 'correct' : partial ? 'partial' : 'incorrect';
        const nlpPct = a.nlpSimilarity != null ? Math.round(a.nlpSimilarity * 100) : null;

        return `
            <div class="answer-review-card ${cardClass}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
                    <span class="question-number">Q${i + 1} · <span class="badge ${a.type === 'MCQ' ? 'badge-primary' : 'badge-warning'}">${a.type}</span></span>
                    <span style="font-weight:700;color:${getScoreColor(a.maxScore > 0 ? (a.scoreObtained/a.maxScore*100) : 0)}">
                        ${formatScore(a.scoreObtained)} / ${formatScore(a.maxScore)} marks
                    </span>
                </div>
                <p style="font-weight:600;margin-bottom:0.75rem;line-height:1.5">${sanitize(a.questionText)}</p>

                <div style="display:grid;gap:0.5rem;font-size:0.88rem">
                    <div style="padding:0.6rem 0.85rem;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);border:1px solid var(--border)">
                        <span style="color:var(--text-secondary);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Your Answer</span><br>
                        <span style="margin-top:0.2rem;display:block">${sanitize(a.studentAnswer || '(No answer provided)')}</span>
                    </div>

                    ${a.type === 'MCQ' ? `
                        <div style="padding:0.6rem 0.85rem;background:rgba(16,185,129,0.05);border-radius:var(--radius-sm);border:1px solid rgba(16,185,129,0.2)">
                            <span style="color:var(--text-secondary);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Correct Answer</span><br>
                            <span style="color:var(--color-success);font-weight:700;margin-top:0.2rem;display:block">${sanitize(a.correctAnswer || 'N/A')}</span>
                        </div>
                    ` : ''}

                    ${a.type === 'SUBJECTIVE' && a.modelAnswer ? `
                        <div style="padding:0.6rem 0.85rem;background:rgba(99,102,241,0.05);border-radius:var(--radius-sm);border:1px solid rgba(99,102,241,0.2)">
                            <span style="color:var(--text-secondary);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Model Answer</span><br>
                            <span style="margin-top:0.2rem;display:block;color:var(--text-secondary)">${sanitize(a.modelAnswer)}</span>
                        </div>
                    ` : ''}

                    ${nlpPct !== null && a.type === 'SUBJECTIVE' ? `
                        <div>
                            <span style="font-size:0.78rem;color:var(--text-secondary)">NLP Similarity Score: <strong style="color:var(--color-primary)">${nlpPct}%</strong></span>
                            <div class="nlp-bar-container">
                                <div class="nlp-bar-fill" style="width:${nlpPct}%"></div>
                            </div>
                        </div>
                    ` : ''}

                    <div style="padding:0.6rem 0.85rem;background:rgba(245,158,11,0.05);border-radius:var(--radius-sm);border:1px solid rgba(245,158,11,0.2)">
                        <span style="color:var(--color-accent);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em">💬 Feedback</span><br>
                        <span style="margin-top:0.2rem;display:block">${sanitize(a.feedback || 'No feedback')}</span>
                    </div>

                    ${a.explanation ? `
                        <div style="padding:0.6rem 0.85rem;background:rgba(255,255,255,0.02);border-radius:var(--radius-sm);border:1px solid var(--border)">
                            <span style="color:var(--text-secondary);font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em">📖 Explanation</span><br>
                            <span style="margin-top:0.2rem;display:block;color:var(--text-secondary)">${sanitize(a.explanation)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ── Submission History ──
async function loadSubmissionHistory() {
    try {
        const submissions = await api.student.getMySubmissions();
        renderHistoryTable(submissions);
    } catch (e) {
        showToast('Error', e.message, 'error');
    }
}

function renderHistoryTable(submissions) {
    const tbody = document.getElementById('history-table-body');
    if (!submissions.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">No submissions yet</td></tr>`;
        return;
    }
    tbody.innerHTML = submissions.map(s => `
        <tr>
            <td>${sanitize(s.examTitle)}</td>
            <td>${formatScore(s.totalScore)} / ${formatScore(s.maxScore)}</td>
            <td><span style="color:${getScoreColor(s.percentage)};font-weight:700">${s.percentage ?? 0}%</span></td>
            <td><span class="badge ${s.passed ? 'badge-success' : 'badge-danger'}">${s.passed ? 'PASS' : 'FAIL'}</span></td>
            <td>${formatDate(s.submittedAt)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewMyResult(${s.submissionId})">View</button>
            </td>
        </tr>
    `).join('');
}

async function viewMyResult(submissionId) {
    try {
        showLoading('Loading result...');
        const result = await api.student.getSubmission(submissionId);
        hideLoading();
        renderResult(result);
        await showStudentSection('results');
    } catch (e) {
        hideLoading();
        showToast('Error', e.message, 'error');
    }
}
