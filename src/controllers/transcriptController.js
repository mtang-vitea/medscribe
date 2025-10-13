/**
 * Transcript Controller
 * Handles HTTP requests for medical transcript processing
 */

const ExtractionService = require('../services/extractionService');
const TranscriptionService = require('../services/transcriptionService');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class TranscriptController {
  constructor() {
    this.extractionService = new ExtractionService();
    this.transcriptionService = new TranscriptionService();
    
    // Configure multer for audio file uploads
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `audio-${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    this.upload = multer({
      storage,
      limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit for Whisper API
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'audio/mpeg',
          'audio/mp3',
          'audio/wav',
          'audio/wave',
          'audio/x-wav',
          'audio/mp4',
          'audio/x-m4a',
          'audio/webm',
          'audio/ogg',
          'audio/flac'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid audio format. Supported formats: MP3, WAV, M4A, MP4, WEBM, OGG, FLAC'));
        }
      }
    }).single('audio');
  }

  /**
   * Process a medical transcript
   * POST /api/transcript/process
   */
  async processTranscript(req, res) {
    try {
      const { transcript, options = {} } = req.body;

      // Validate input
      if (!transcript) {
        return res.status(400).json({
          error: 'Transcript is required',
          code: 'MISSING_TRANSCRIPT'
        });
      }

      if (typeof transcript !== 'string') {
        return res.status(400).json({
          error: 'Transcript must be a string',
          code: 'INVALID_TRANSCRIPT_TYPE'
        });
      }

      // Generate processing ID for tracking
      const processingId = uuidv4();
      
      // Add processing ID to options
      const processingOptions = {
        ...options,
        processingId,
        mockResponse: options.mockResponse || false
      };

      // Process the transcript
      const result = await this.extractionService.processTranscript(transcript, processingOptions);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to process transcript',
          details: result.error,
          code: 'PROCESSING_FAILED',
          processingId
        });
      }

      // Validate the extraction
      const validation = this.extractionService.validateExtraction(result.data);

      // Return successful result
      res.json({
        success: true,
        processingId,
        data: result.data,
        validation,
        metadata: result.metadata
      });

    } catch (error) {
      console.error('Error processing transcript:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing the transcript'
      });
    }
  }

  /**
   * Get processing status (for future async processing)
   * GET /api/transcript/status/:processingId
   */
  async getProcessingStatus(req, res) {
    try {
      const { processingId } = req.params;

      // Placeholder for status tracking
      res.json({
        processingId,
        status: 'completed',
        message: 'Status tracking not implemented yet'
      });

    } catch (error) {
      console.error('Error getting processing status:', error);
      
      res.status(500).json({
        error: 'Failed to get processing status',
        code: 'STATUS_ERROR'
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/transcript/health
   */
  async healthCheck(req, res) {
    res.json({
      status: 'healthy',
      service: 'Vitea test suite - AI scribe Transcript Processor',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  }

  /**
   * Get supported categories
   * GET /api/transcript/categories
   */
  async getCategories(req, res) {
    res.json({
      categories: this.extractionService.categories,
      description: 'Clinical data extraction categories with weightage levels'
    });
  }

  /**
   * Transcribe audio file to text
   * POST /api/transcript/transcribe
   */
  async transcribeAudio(req, res) {
    try {
      // Handle file upload
      this.upload(req, res, async (err) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'File too large. Maximum size is 25MB.',
              code: 'FILE_TOO_LARGE'
            });
          }
          return res.status(400).json({
            error: err.message || 'Failed to upload audio file',
            code: 'UPLOAD_FAILED'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            error: 'No audio file provided',
            code: 'NO_FILE'
          });
        }

        const { mockTranscription = false } = req.body;
        const audioPath = req.file.path;

        try {
          let transcriptionResult;
          
          if (mockTranscription === 'true' || mockTranscription === true) {
            // Use mock transcription for demo
            transcriptionResult = this.transcriptionService.generateMockTranscription();
            // Clean up uploaded file since we're using mock
            fs.unlinkSync(audioPath);
          } else {
            // Use real Whisper API transcription
            transcriptionResult = await this.transcriptionService.transcribeAudio(audioPath, {
              deleteAfterTranscription: true
            });
          }

          res.json({
            success: true,
            transcript: transcriptionResult.transcript,
            duration: transcriptionResult.duration,
            language: transcriptionResult.language,
            metadata: transcriptionResult.metadata
          });

        } catch (transcriptionError) {
          // Clean up file if transcription fails
          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
          
          console.error('Transcription error:', transcriptionError);
          res.status(500).json({
            error: transcriptionError.message,
            code: 'TRANSCRIPTION_FAILED'
          });
        }
      });
    } catch (error) {
      console.error('Error in transcribeAudio:', error);
      res.status(500).json({
        error: 'Failed to process audio file',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = TranscriptController;