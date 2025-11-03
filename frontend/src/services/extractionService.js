/**
 * Clinical Data Extraction Service
 * Handles the core logic for processing medical transcripts and extracting clinical data
 */

require('dotenv').config();
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { CLINICAL_EXTRACTION_PROMPT, CATEGORIES } = require('../prompts/clinical-extraction');

class ExtractionService {
  constructor() {
    this.categories = CATEGORIES;
    
    // Initialize OpenAI API client as primary
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('OpenAI API initialized');
    }
    
    // Initialize Claude API client as fallback
    if (process.env.CLAUDE_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.CLAUDE_API_KEY,
      });
      console.log('Claude API initialized as fallback');
    }
    
    // Check if any API key is available
    if (!process.env.OPENAI_API_KEY && !process.env.CLAUDE_API_KEY) {
      console.warn('No API keys found. Real extraction will not work. Please set OPENAI_API_KEY or CLAUDE_API_KEY in .env file.');
    }
  }

  /**
   * Process a medical transcript and extract clinical data
   * @param {string} transcript - Raw transcript of doctor-patient conversation
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Structured clinical data
   */
  async processTranscript(transcript, options = {}) {
    try {
      // Validate input
      if (!transcript || typeof transcript !== 'string') {
        throw new Error('Invalid transcript provided');
      }

      // Clean and prepare transcript
      const cleanedTranscript = this.cleanTranscript(transcript);
      
      // Generate the full prompt
      const fullPrompt = this.generatePrompt(cleanedTranscript);
      
      // Extract data (placeholder for AI processing)
      const extractedData = await this.extractClinicalData(fullPrompt, options);
      
      // Validate and structure the output
      const structuredData = this.structureOutput(extractedData);
      
      return {
        success: true,
        data: structuredData,
        metadata: {
          processedAt: new Date().toISOString(),
          transcriptLength: cleanedTranscript.length,
          extractionMethod: options.method || 'default'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          processedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Clean and prepare transcript for processing
   * @param {string} transcript - Raw transcript
   * @returns {string} Cleaned transcript
   */
  cleanTranscript(transcript) {
    return transcript
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable characters
      .substring(0, 50000); // Limit length for processing
  }

  /**
   * Generate the full prompt with the transcript
   * @param {string} transcript - Cleaned transcript
   * @returns {string} Full prompt ready for AI processing
   */
  generatePrompt(transcript) {
    return CLINICAL_EXTRACTION_PROMPT.replace('{{TRANSCRIPT}}', transcript);
  }

  /**
   * Extract clinical data using AI processing
   * @param {string} prompt - Full prompt with transcript
   * @param {Object} options - Processing options
   * @returns {Promise<string>} Raw extracted data
   */
  async extractClinicalData(prompt, options) {
    // Return mock response if requested
    if (options.mockResponse) {
      return this.generateMockResponse();
    }

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      try {
        return await this.extractWithOpenAI(prompt);
      } catch (error) {
        console.error('OpenAI extraction failed:', error.message);
        // If OpenAI fails and Claude is available, try Claude
        if (process.env.CLAUDE_API_KEY) {
          console.log('Falling back to Claude API...');
          return await this.extractWithClaude(prompt);
        }
        throw error;
      }
    }
    
    // If no OpenAI key, try Claude
    if (process.env.CLAUDE_API_KEY) {
      return await this.extractWithClaude(prompt);
    }

    throw new Error('No API keys configured. Please set OPENAI_API_KEY or CLAUDE_API_KEY in the .env file or use mockResponse option.');
  }

  /**
   * Extract using OpenAI API
   * @param {string} prompt - Full prompt with transcript
   * @returns {Promise<string>} Raw extracted data
   */
  async extractWithOpenAI(prompt) {
    try {
      console.log('Sending request to OpenAI API...');
      
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI scribe assistant. Extract clinical data from doctor-patient conversations and return it in the exact format specified.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      const extractedText = response.choices[0].message.content;
      console.log('Successfully received response from OpenAI API');
      
      return extractedText;

    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Provide more specific error messages
      if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in the .env file.');
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your account credits.');
      } else if (error.response?.status === 401) {
        throw new Error('OpenAI authentication failed. Please check your API key.');
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI rate limit reached. Please wait and try again.');
      } else {
        throw new Error('Failed to extract clinical data with OpenAI: ' + error.message);
      }
    }
  }

  /**
   * Extract using Claude API (fallback)
   * @param {string} prompt - Full prompt with transcript
   * @returns {Promise<string>} Raw extracted data
   */
  async extractWithClaude(prompt) {
    try {
      console.log('Sending request to Claude API...');
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      if (!response.content || !response.content[0] || !response.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }

      const extractedText = response.content[0].text;
      console.log('Successfully received response from Claude API');
      
      return extractedText;

    } catch (error) {
      console.error('Claude API Error:', error);
      
      // Provide more specific error messages
      if (error.code === 'authentication_error') {
        throw new Error('Invalid Claude API key. Please check your CLAUDE_API_KEY in the .env file.');
      } else if (error.code === 'rate_limit_error') {
        throw new Error('Claude API rate limit exceeded. Please try again later.');
      } else if (error.code === 'invalid_request_error') {
        throw new Error('Invalid request to Claude API: ' + error.message);
      } else {
        throw new Error('Failed to extract clinical data with Claude: ' + error.message);
      }
    }
  }

  /**
   * Structure the AI output into a standardized format
   * @param {string} rawOutput - Raw AI output
   * @returns {Object} Structured clinical data
   */
  structureOutput(rawOutput) {
    // Parse the AI output and structure it
    const structure = {
      categories: [],
      summary: {
        totalDataPoints: 0,
        categoriesFound: [],
        confidenceScore: null
      }
    };

    // Extract content between markers
    const match = rawOutput.match(/=== CLINICAL DATA EXTRACTION ===([\s\S]*?)=== END OF EXTRACTION ===/);
    if (match) {
      structure.categories = this.parseSection(match[1]);
    }

    // Calculate summary
    structure.summary.totalDataPoints = structure.categories.length;

    return structure;
  }

  /**
   * Parse a section of the AI output
   * @param {string} section - Section text
   * @returns {Array} Parsed data points
   */
  parseSection(section) {
    const dataPoints = [];
    const lines = section.split('\n').filter(line => line.trim());
    
    let currentItem = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if it's a numbered item (main category)
      if (/^\d+\./.test(trimmed)) {
        if (currentItem) {
          dataPoints.push(currentItem);
        }
        currentItem = {
          category: trimmed.replace(/^\d+\.\s*/, '').replace(/:$/, ''),
          details: []
        };
      }
      // Check if it's a bullet point (sub-item)
      else if (trimmed.startsWith('-') && currentItem) {
        currentItem.details.push(trimmed.substring(1).trim());
      }
    }
    
    if (currentItem) {
      dataPoints.push(currentItem);
    }
    
    return dataPoints;
  }

  /**
   * Generate a mock response for testing
   * @returns {string} Mock clinical data extraction
   */
  generateMockResponse() {
    return `=== CLINICAL DATA EXTRACTION ===

1. Chief Complaint/Reason for Visit:
   - Patient presents with chest pain for 2 days
   - Describes pain as "sharp and stabbing"

2. History of Present Illness (HPI):
   - Onset: 2 days ago, sudden onset
   - Character: Sharp, stabbing pain
   - Location: Left side of chest
   - Severity: 7/10 on pain scale
   - Aggravating factors: Deep breathing, movement
   - Associated symptoms: Shortness of breath

3. Current Medications:
   - Lisinopril 10mg daily for hypertension
   - Metformin 500mg twice daily for diabetes

4. Past Medical History:
   - Hypertension diagnosed 5 years ago
   - Type 2 diabetes diagnosed 3 years ago

5. Social History:
   - Former smoker, quit 2 years ago (20 pack-year history)
   - Occasional alcohol use, 2-3 drinks per week
   - Works as accountant (sedentary job)

6. Assessment/Differential Diagnosis:
   - Possible musculoskeletal chest pain
   - Rule out cardiac causes given risk factors

7. Diagnostic Plan:
   - ECG ordered
   - Chest X-ray ordered
   - Basic metabolic panel

8. Treatment Plan:
   - Ibuprofen 400mg every 6 hours as needed for pain
   - Return if symptoms worsen

=== END OF EXTRACTION ===`;
  }

  /**
   * Validate extracted data for completeness and accuracy
   * @param {Object} structuredData - Structured clinical data
   * @returns {Object} Validation results
   */
  validateExtraction(structuredData) {
    const validation = {
      isValid: true,
      warnings: [],
      errors: []
    };

    // Check for required categories
    const requiredCategories = ['Chief Complaint', 'History of Present Illness'];
    const foundCategories = structuredData.categories.map(item => item.category);

    for (const required of requiredCategories) {
      if (!foundCategories.some(cat => cat.toLowerCase().includes(required.toLowerCase()))) {
        validation.warnings.push(`Missing expected category: ${required}`);
      }
    }

    // Check for empty extraction
    if (structuredData.summary.totalDataPoints === 0) {
      validation.isValid = false;
      validation.errors.push('No clinical data points extracted');
    }

    return validation;
  }
}

module.exports = ExtractionService;