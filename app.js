const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Java backend URL
const JAVA_BACKEND_URL = process.env.JAVA_BACKEND_URL || 'http://localhost:8080';
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5000';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Proxy - Forward all /api requests to Java backend
app.use('/api', async (req, res) => {
  try {
    const config = {
      method: req.method,
      url: `${JAVA_BACKEND_URL}${req.path}`,
      headers: {
        ...req.headers,
        'Content-Type': 'application/json',
      },
      data: req.body,
    };

    // Remove host header to avoid issues
    delete config.headers.host;

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data,
    });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start server (for local testing)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Java backend proxy: ${JAVA_BACKEND_URL}`);
  });
}

module.exports = app;
