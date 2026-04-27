// =====================================================
//  Exam Portal - API Client
// =====================================================

const API_BASE = 'http://localhost:8080/api';

const api = {
    // ── Auth helpers ──
    getToken: () => localStorage.getItem('token'),
    getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
    isLoggedIn: () => !!localStorage.getItem('token'),

    setAuth: (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data.userId,
            username: data.username,
            email: data.email,
            fullName: data.fullName,
            role: data.role
        }));
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // ── Request helper ──
    async request(method, endpoint, body = null, auth = true) {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) {
            const token = api.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        const res = await fetch(`${API_BASE}${endpoint}`, config);

        if (res.status === 401) {
            api.logout();
            window.location.reload();
            throw new Error('Session expired. Please login again.');
        }

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }

        if (!res.ok) {
            const msg = data?.message || data?.error || `HTTP ${res.status}`;
            throw new Error(msg);
        }

        return data;
    },

    get: (endpoint) => api.request('GET', endpoint),
    post: (endpoint, body, auth = true) => api.request('POST', endpoint, body, auth),
    put: (endpoint, body) => api.request('PUT', endpoint, body),
    delete: (endpoint) => api.request('DELETE', endpoint),

    // ── Auth ──
    login: (username, password) => api.post('/auth/login', { username, password }, false),
    register: (data) => api.post('/auth/register', data, false),

    // ── Admin ──
    admin: {
        createExam: (data) => api.post('/admin/exams', data),
        getExams: () => api.get('/admin/exams'),
        getExam: (id) => api.get(`/admin/exams/${id}`),
        toggleExam: (id) => api.put(`/admin/exams/${id}/toggle`),
        deleteExam: (id) => api.delete(`/admin/exams/${id}`),
        addQuestion: (examId, data) => api.post(`/admin/exams/${examId}/questions`, data),
        getQuestions: (examId) => api.get(`/admin/exams/${examId}/questions`),
        deleteQuestion: (qId) => api.delete(`/admin/questions/${qId}`),
        getAllSubmissions: () => api.get('/admin/submissions'),
        getSubmission: (id) => api.get(`/admin/submissions/${id}`),
        getExamSubmissions: (examId) => api.get(`/admin/exams/${examId}/submissions`),
    },

    // ── Student ──
    student: {
        getExams: () => api.get('/student/exams'),
        startExam: (id) => api.get(`/student/exams/${id}/start`),
        submitExam: (data) => api.post('/student/exams/submit', data),
        getMySubmissions: () => api.get('/student/submissions'),
        getSubmission: (id) => api.get(`/student/submissions/${id}`),
    }
};
