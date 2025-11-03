/**
 * Audio Transcription Service
 * Handles audio file transcription using OpenAI Whisper API
 */

require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class TranscriptionService {
  constructor() {
    // Initialize OpenAI client for Whisper transcription
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('Whisper transcription service initialized');
    } else {
      console.warn('OPENAI_API_KEY not found. Audio transcription will not work.');
    }
  }

  /**
   * Transcribe audio file to text using OpenAI Whisper
   * @param {string} audioFilePath - Path to the audio file
   * @param {Object} options - Transcription options
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(audioFilePath, options = {}) {
    try {
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured. Audio transcription requires OpenAI API access.');
      }

      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error('Audio file not found');
      }

      // Get file stats
      const stats = fs.statSync(audioFilePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      // Check file size (Whisper API limit is 25MB)
      if (fileSizeInMB > 25) {
        throw new Error('Audio file is too large. Maximum size is 25MB.');
      }

      console.log(`Transcribing audio file: ${path.basename(audioFilePath)} (${fileSizeInMB.toFixed(2)} MB)`);

      // Create a read stream for the audio file
      const audioStream = fs.createReadStream(audioFilePath);

      // Transcribe using Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        language: options.language || 'en', // Default to English
        response_format: 'verbose_json', // Get detailed response with timestamps
        prompt: 'This is a medical consultation between a doctor and patient. Please transcribe accurately including medical terminology.' // Context for better accuracy
      });

      // Clean up temporary file
      if (options.deleteAfterTranscription) {
        fs.unlinkSync(audioFilePath);
      }

      return {
        success: true,
        transcript: transcription.text,
        duration: transcription.duration,
        language: transcription.language,
        segments: transcription.segments, // Individual segments with timestamps
        metadata: {
          fileSize: fileSizeInMB.toFixed(2) + ' MB',
          processedAt: new Date().toISOString(),
          model: 'whisper-1'
        }
      };

    } catch (error) {
      console.error('Transcription error:', error);
      
      // Provide specific error messages
      if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key for transcription.');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your account.');
      } else if (error.response?.status === 413) {
        throw new Error('Audio file is too large for transcription.');
      } else if (error.response?.status === 415) {
        throw new Error('Unsupported audio format. Please use MP3, MP4, MPEG, MPGA, M4A, WAV, or WEBM.');
      } else {
        throw new Error('Failed to transcribe audio: ' + error.message);
      }
    }
  }

  /**
   * Format transcription with speaker labels (if detected)
   * @param {Array} segments - Transcription segments
   * @returns {string} Formatted transcript
   */
  formatTranscript(segments) {
    if (!segments || segments.length === 0) {
      return '';
    }

    let formattedTranscript = '';
    let currentSpeaker = null;

    segments.forEach(segment => {
      // Simple heuristic to detect speaker changes based on pauses
      // In production, you might use more sophisticated speaker diarization
      const text = segment.text.trim();
      
      // Look for common medical conversation patterns
      if (text.toLowerCase().includes('doctor:') || text.toLowerCase().includes('dr:')) {
        currentSpeaker = 'Doctor';
      } else if (text.toLowerCase().includes('patient:')) {
        currentSpeaker = 'Patient';
      }
      
      // Add speaker label if detected
      if (currentSpeaker) {
        formattedTranscript += `${currentSpeaker}: ${text}\n`;
      } else {
        formattedTranscript += `${text}\n`;
      }
    });

    return formattedTranscript;
  }

  /**
   * Validate audio file format
   * @param {string} filename - Name of the audio file
   * @returns {boolean} Whether the format is supported
   */
  isValidAudioFormat(filename) {
    const supportedFormats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
    const ext = path.extname(filename).toLowerCase();
    return supportedFormats.includes(ext);
  }

  /**
   * Generate a mock transcription for testing
   * @returns {Object} Mock transcription result
   */
  generateMockTranscription() {
    return {
      success: true,
      transcript: `Doctor: Good morning, how are you feeling today?
Patient: I've been having chest pain for the past 2 days. It's really bothering me.
Doctor: Can you describe the pain for me?
Patient: It's sharp and stabbing, mainly on my left side. It gets worse when I breathe deeply or move around.
Doctor: On a scale of 1 to 10, how would you rate the pain?
Patient: About a 7 out of 10.
Doctor: Have you experienced any shortness of breath?
Patient: Yes, especially when the pain gets bad.
Doctor: What medications are you currently taking?
Patient: I take Lisinopril 10mg once a day for my blood pressure, and Metformin 500mg twice a day for diabetes.
Doctor: Any known allergies?
Patient: No, no allergies.
Doctor: Tell me about your medical history.
Patient: I was diagnosed with high blood pressure about 5 years ago, and diabetes 3 years ago. I used to smoke but quit 2 years ago.
Doctor: Based on your symptoms, I'm thinking this could be musculoskeletal chest pain, but we need to rule out cardiac causes given your risk factors. I'd like to order an ECG, chest X-ray, and some blood work.
Patient: Okay, that sounds good.
Doctor: For now, you can take ibuprofen 400mg every 6 hours as needed for the pain. Please come back if your symptoms worsen.`,
      duration: 120,
      language: 'en',
      segments: [],
      metadata: {
        fileSize: 'Mock',
        processedAt: new Date().toISOString(),
        model: 'mock'
      }
    };
  }
}

module.exports = TranscriptionService;