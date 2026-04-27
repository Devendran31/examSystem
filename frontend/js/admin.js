// =====================================================
//  Admin Dashboard Logic
// =====================================================

let adminData = {
    exams: [],
    currentExamId: null,
    submissions: []
};

async function loadAdminDashboard() {
    showPage('admin-page');
    const user = api.getUser();
    document.getElementById('admin-user-name').textContent = user.fullName || user.username;
    document.getElementById('admin-user-initial').textContent = (user.fullName || user.username)[0].toUpperCase();
    initSidebarNav('ADMIN');
    await showAdminSection('dashboard');
}

async function showAdminSection(section) {
    setActiveNav(section);
    const sections = ['dashboard', 'exams', 'questions', 'results'];
    sections.forEach(s => {
        const el = document.getElementById(`admin-section-${s}`);
        if (el) el.style.display = s === section ? 'block' : 'none';
    });

    document.getElementById('topbar-title').textContent = {
        dashboard: 'Admin Dashboard',
        exams: 'Manage Exams',
        questions: 'Manage Questions',
        results: 'Student Results'
    }[section] || 'Dashboard';

    if (section === 'dashboard') await loadAdminStats();
    if (section === 'exams') await loadAdminExams();
    if (section === 'results') await loadAllResults();
}

// ── Stats ──
async function loadAdminStats() {
    try {
        const [exams, submissions] = await Promise.all([
            api.admin.getExams(),
            api.admin.getAllSubmissions()
        ]);
        adminData.exams = exams;
        adminData.submissions = submissions;

        document.getElementById('stat-total-exams').textContent = exams.length;
        document.getElementById('stat-active-exams').textContent = exams.filter(e => e.isActive).length;
        document.getElementById('stat-total-submissions').textContent = submissions.length;
        const passed = submissions.filter(s => s.passed).length;
        const rate = submissions.length > 0 ? Math.round(passed / submissions.length * 100) : 0;
        document.getElementById('stat-pass-rate').textContent = rate + '%';

        // Recent submissions
        renderRecentSubmissions(submissions.slice(-5).reverse());
    } catch (e) {
        showToast('Error', e.message, 'error');
    }
}

function renderRecentSubmissions(submissions) {
    const tbody = document.getElementById('recent-submissions-body');
    if (!tbody) return;
    if (!submissions.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">No submissions yet</td></tr>`;
        return;
    }
    tbody.innerHTML = submissions.map(s => `
        <tr>
            <td><strong>${sanitize(s.studentName)}</strong><br><small style="color:var(--text-muted)">@${sanitize(s.studentUsername)}</small></td>
            <td>${sanitize(s.examTitle)}</td>
            <td>${formatScore(s.totalScore)} / ${formatScore(s.maxScore)}</td>
            <td><span style="color:${getScoreColor(s.percentage)};font-weight:700">${s.percentage ?? 0}%</span></td>
            <td><span class="badge ${s.passed ? 'badge-success' : 'badge-danger'}">${s.passed ? 'PASS' : 'FAIL'}</span></td>
        </tr>
    `).join('');
}

// ── Exams ──
async function loadAdminExams() {
    try {
        adminData.exams = await api.admin.getExams();
        renderExamTable(adminData.exams);
    } catch (e) {
        showToast('Error', e.message, 'error');
    }
}

function renderExamTable(exams) {
    const tbody = document.getElementById('exams-table-body');
    if (!exams.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No exams created yet</td></tr>`;
        return;
    }
    tbody.innerHTML = exams.map(e => `
        <tr>
            <td><strong>${sanitize(e.title)}</strong></td>
            <td>${e.questionCount ?? 0}</td>
            <td>${e.totalMarks}</td>
            <td>${formatDuration(e.durationMinutes)}</td>
            <td><span class="badge ${e.isActive ? 'badge-success' : 'badge-secondary'}">${e.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
            <td>${formatDate(e.createdAt)}</td>
            <td>
                <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
                    <button class="btn btn-sm btn-secondary" onclick="openQuestionManager(${e.id}, '${sanitize(e.title)}')">Questions</button>
                    <button class="btn btn-sm btn-warning" onclick="toggleExam(${e.id})">Toggle</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteExam(${e.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ── Create Exam Modal ──
function openCreateExamModal() {
    document.getElementById('create-exam-form').reset();
    openModal('create-exam-modal');
}

async function submitCreateExam(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        title: form.title.value,
        description: form.description.value,
        durationMinutes: parseInt(form.durationMinutes.value),
        totalMarks: parseInt(form.totalMarks.value),
        passingMarks: parseInt(form.passingMarks.value),
        isRandom: form.isRandom.checked,
        randomQuestionCount: form.randomQuestionCount.value ? parseInt(form.randomQuestionCount.value) : null
    };

    try {
        showLoading('Creating exam...');
        await api.admin.createExam(data);
        hideLoading();
        closeModal('create-exam-modal');
        showToast('Success', 'Exam created successfully!', 'success');
        await loadAdminExams();
    } catch (err) {
        hideLoading();
        showToast('Error', err.message, 'error');
    }
}

async function toggleExam(examId) {
    try {
        await api.admin.toggleExam(examId);
        showToast('Updated', 'Exam status changed', 'info');
        await loadAdminExams();
    } catch (e) {
        showToast('Error', e.message, 'error');
    }
}

async function deleteExam(examId) {
    if (!confirm('Delete this exam and all its questions? This cannot be undone.')) return;
    try {
        await api.admin.deleteExam(examId);
        showToast('Deleted', 'Exam deleted', 'success');
        await loadAdminExams();
    } catch (e) {
        showToast('Error', e.message, 'error');
    }
}

// ── Question Manager ──
async function openQuestionManager(examId, examTitle) {
    adminData.currentExamId = examId;
    document.getElementById('questions-exam-title').textContent = examTitle;
    await showAdminSection('questions');
    await loadQuestions(examId);
}

async function loadQuestions(examId) {
    try {
        const questions = await api.admin.getQuestions(examId);
        renderQuestionsTable(questions);
    } catch (e) {
        showToast('Error', e.message, 'error');
    }
}

function renderQuestionsTable(questions) {
    const tbody = document.getElementById('questions-table-body');
    if (!questions.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted)">No questions yet. Add your first question!</td></tr>`;
        return;
    }
    tbody.innerHTML = questions.map((q, i) => `
        <tr>
            <td>${i + 1}</td>
            <td style="max-width:300px">${sanitize(q.questionText.substring(0, 80))}${q.questionText.length > 80 ? '...' : ''}</td>
            <td><span class="badge ${q.type === 'MCQ' ? 'badge-primary' : 'badge-warning'}">${q.type}</span></td>
            <td>${q.marks}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${q.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openAddQuestionModal() {
    document.getElementById('add-question-form').reset();
    document.getElementById('mcq-fields').style.display = 'none';
    document.getElementById('subjective-fields').style.display = 'none';
    document.getElementById('question-type').value = '';
    openModal('add-question-modal');
}

function onQuestionTypeChange(val) {
    document.getElementById('mcq-fields').style.display = val === 'MCQ' ? 'block' : 'none';
    document.getElementById('subjective-fields').style.display = val === 'SUBJECTIVE' ? 'block' : 'none';
}

async function submitAddQuestion(e) {
    e.preventDefault();
    const form = e.target;
    const type = form.type.value;

    const data = {
        questionText: form.questionText.value,
        type: type,
        marks: parseInt(form.marks.value),
        explanation: form.explanation.value || null
    };

    if (type === 'MCQ') {
        data.optionA = form.optionA.value;
        data.optionB = form.optionB.value;
        data.optionC = form.optionC.value;
        data.optionD = form.optionD.value;
        data.correctAnswer = form.correctAnswer.value;
    } else {
        data.modelAnswer = form.modelAnswer.value;
    }

    try {
        showLoading('Adding question...');
        await api.admin.addQuestion(adminData.currentExamId, data);
        hideLoading();
        closeModal('add-question-modal');
        showToast('Success', 'Question added!', 'success');
        await loadQuestions(adminData.currentExamId);
    } catch (err) {
        hideLoading();
        showToast('Error', err.message, 'error');
    }
}

async function deleteQuestion(qId) {
    if (!confirm('Delete this question?')) return;
    try {
        await api.admin.deleteQuestion(qId);
        showToast('Deleted', 'Question deleted', 'success');
        await loadQuestions(adminData.currentExamId);
    } catch (e) {
        showToast('Error', e.message, 'error');
    }
}

// ── Results ──
async function loadAllResults() {
    try {
        adminData.submissions = await api.admin.getAllSubmissions();
        renderResultsTable(adminData.submissions);
    } catch (e) {
        showToast('Error', e.message, 'error');
    }
}

function renderResultsTable(submissions) {
    const tbody = document.getElementById('results-table-body');
    if (!submissions.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No results yet</td></tr>`;
        return;
    }
    tbody.innerHTML = submissions.map(s => `
        <tr>
            <td><strong>${sanitize(s.studentName)}</strong><br><small style="color:var(--text-muted)">@${sanitize(s.studentUsername)}</small></td>
            <td>${sanitize(s.examTitle)}</td>
            <td>${formatScore(s.totalScore)} / ${formatScore(s.maxScore)}</td>
            <td><span style="color:${getScoreColor(s.percentage)};font-weight:700">${s.percentage ?? 0}%</span></td>
            <td><span class="badge ${s.passed ? 'badge-success' : 'badge-danger'}">${s.passed ? 'PASS' : 'FAIL'}</span></td>
            <td>${formatDate(s.submittedAt)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewSubmissionDetail(${s.submissionId})">View</button>
            </td>
        </tr>
    `).join('');
}

async function viewSubmissionDetail(submissionId) {
    try {
        showLoading('Loading result...');
        const result = await api.admin.getSubmission(submissionId);
        hideLoading();
        renderResultModal(result);
        openModal('result-detail-modal');
    } catch (e) {
        hideLoading();
        showToast('Error', e.message, 'error');
    }
}

function renderResultModal(result) {
    const pct = result.percentage ?? 0;
    document.getElementById('result-modal-content').innerHTML = `
        <div style="text-align:center;margin-bottom:1.5rem">
            <h3 style="font-family:var(--font-display);margin-bottom:0.5rem">${sanitize(result.examTitle)}</h3>
            <div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;margin:1rem 0">
                <span class="badge badge-primary">Score: ${formatScore(result.totalScore)} / ${formatScore(result.maxScore)}</span>
                <span style="color:${getScoreColor(pct)};font-weight:700">${pct}%</span>
                <span class="badge ${result.passed ? 'badge-success' : 'badge-danger'}">${result.passed ? 'PASSED' : 'FAILED'}</span>
            </div>
        </div>
        ${result.answerResults.map((a, i) => `
            <div class="answer-review-card ${a.isCorrect ? 'correct' : a.scoreObtained > 0 ? 'partial' : 'incorrect'}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
                    <span class="question-number">Q${i + 1} · ${a.type}</span>
                    <span style="font-weight:700;color:${getScoreColor(a.maxScore > 0 ? (a.scoreObtained/a.maxScore*100) : 0)}">
                        ${formatScore(a.scoreObtained)} / ${formatScore(a.maxScore)}
                    </span>
                </div>
                <p style="font-weight:600;margin-bottom:0.75rem">${sanitize(a.questionText)}</p>
                <div style="display:grid;gap:0.4rem;font-size:0.85rem">
                    <div><span style="color:var(--text-secondary)">Student answer:</span> <span style="color:var(--text-primary)">${sanitize(a.studentAnswer || '(No answer)')}</span></div>
                    ${a.type === 'MCQ' ? `<div><span style="color:var(--text-secondary)">Correct answer:</span> <span style="color:var(--color-success);font-weight:700">${sanitize(a.correctAnswer || 'N/A')}</span></div>` : ''}
                    ${a.type === 'SUBJECTIVE' && a.nlpSimilarity !== null ? `
                        <div style="margin-top:0.5rem">
                            <span style="color:var(--text-secondary)">NLP Similarity: </span>
                            <span style="font-weight:700">${Math.round((a.nlpSimilarity || 0) * 100)}%</span>
                            <div class="nlp-bar-container" style="margin-top:0.3rem">
                                <div class="nlp-bar-fill" style="width:${Math.round((a.nlpSimilarity || 0) * 100)}%"></div>
                            </div>
                        </div>
                    ` : ''}
                    <div style="margin-top:0.5rem;padding:0.65rem 0.85rem;background:rgba(255,255,255,0.03);border-radius:var(--radius-sm);border:1px solid var(--border)">
                        <span style="color:var(--text-secondary);font-size:0.78rem">Feedback: </span>${sanitize(a.feedback || '')}
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}
