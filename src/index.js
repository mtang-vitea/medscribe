/**
 * Vitea test suite - AI scribe Application
 * Main server entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const TranscriptController = require('./controllers/transcriptController');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize controllers
const transcriptController = new TranscriptController();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Support large transcripts
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.post('/api/transcript/process', (req, res) => transcriptController.processTranscript(req, res));
app.post('/api/transcript/transcribe', (req, res) => transcriptController.transcribeAudio(req, res));
app.get('/api/transcript/status/:processingId', (req, res) => transcriptController.getProcessingStatus(req, res));
app.get('/api/transcript/health', (req, res) => transcriptController.healthCheck(req, res));
app.get('/api/transcript/categories', (req, res) => transcriptController.getCategories(req, res));

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'UNHANDLED_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏥 Vitea test suite - MedAI scribe server running on port ${PORT}`);
  console.log(`📋 Web interface: http://localhost:${PORT}`);
  console.log(`⚡ API endpoint: http://localhost:${PORT}/api/transcript/process`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/transcript/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;