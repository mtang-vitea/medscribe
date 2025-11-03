# MedScribe - Medical AI Scribe

A powerful medical AI scribe application that extracts structured clinical data from doctor-patient conversation transcripts. Built with Node.js and Express, featuring a clean web interface for processing medical transcripts and generating comprehensive clinical documentation.

## Features

- **Clinical Data Extraction**: Automatically extracts and categorizes clinical information from medical transcripts
- **Weighted Categories**: Organizes data by clinical importance (High, Medium, Low weightage)
- **Professional UI**: Clean, medical-themed interface optimized for healthcare professionals
- **Export Options**: Export results as JSON or copy formatted text to clipboard
- **Mock Mode**: Demo functionality with sample clinical data for testing
- **Validation**: Built-in validation to ensure data completeness and accuracy

## Clinical Data Categories

### High Weightage (Critical Clinical Information)
- Chief Complaint/Reason for Visit
- History of Present Illness (HPI)
- Current Medications
- Allergies
- Vital Signs

### Medium Weightage (Supporting Clinical Context)
- Past Medical History
- Surgical History
- Family History
- Social History
- Review of Systems
- Physical Exam Findings
- Previous Test Results

### Low Weightage (Planning and Assessment)
- Assessment/Differential Diagnosis
- Diagnostic Plan
- Treatment Plan
- Patient Education
- Follow-up Instructions
- Referrals

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the Application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Access the Application**
   - Web Interface (frontend): http://localhost:3000
   - API Endpoint (FastAPI): http://localhost:8000/api/transcript/process
   - Health Check (FastAPI): http://localhost:8000/api/transcript/health

## Starting the frontend under /frontend

To run the app with the frontend served from /frontend and the API provided by FastAPI:

1. Install Node dependencies (from repo root)
   
   ```bash
   npm install
   ```

2. Start the frontend/static server (Node/Express serves ./frontend)
   
   ```bash
   # Development (auto-reload)
   npm run dev
   
   # Or production
   npm start
   ```
   
   This serves the web UI at http://localhost:3000.

3. In a separate terminal, start the FastAPI backend
   
   ```bash
   uvicorn backend.api:app --reload --port 8000
   ```
   
   The frontend calls the API at http://localhost:8000/api/transcript by default. You can override this by defining a global before loading the app.js script:
   
   ```html
   <script>
     window.__API_BASE_URL__ = 'http://your-host:8000/api/transcript';
   </script>
   <script src="/js/app.js"></script>
   ```

4. Open the app
   - Web UI: http://localhost:3000
   - Health check: http://localhost:8000/api/transcript/health

## API Usage

### Process Medical Transcript

```bash
POST /api/transcript/process
Content-Type: application/json

{
  "transcript": "Doctor: What brings you in today? Patient: I've been having chest pain...",
  "options": {
    "mockResponse": false
  }
}
```

### Response Format

```json
{
  "success": true,
  "processingId": "uuid-here",
  "data": {
    "highWeightage": [...],
    "mediumWeightage": [...],
    "lowWeightage": [...],
    "summary": {
      "totalDataPoints": 15,
      "categoriesFound": [...],
      "confidenceScore": null
    }
  },
  "validation": {
    "isValid": true,
    "warnings": [],
    "errors": []
  },
  "metadata": {
    "processedAt": "2024-01-01T12:00:00.000Z",
    "transcriptLength": 1250,
    "extractionMethod": "default"
  }
}
```

## Development

### Project Structure

```
src/
├── controllers/         # HTTP request handlers
├── services/           # Business logic and data processing
├── prompts/            # AI prompt templates
├── utils/              # Utility functions
└── index.js           # Main server file

public/
├── css/               # Stylesheets
├── js/                # Frontend JavaScript
└── index.html         # Main web interface

tests/                 # Test files
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Check code style
- `npm run format` - Format code with prettier

### Adding AI Integration

Currently, the application uses mock responses. To integrate with real AI services:

1. Install AI SDK (OpenAI, Anthropic, etc.)
2. Update `src/services/extractionService.js`
3. Implement the `extractClinicalData` method
4. Add API keys to `.env` file

Example with OpenAI:

```javascript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async extractClinicalData(prompt, options) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });
  
  return response.choices[0].message.content;
}
```

## Security Considerations

- Input validation and sanitization
- Rate limiting (configurable)
- CORS protection
- Helmet.js security headers
- No patient data persistence by default
- Environment variable configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and formatting
6. Submit a pull request

## License

ISC License - see package.json for details

## Medical Disclaimer

This application is for educational and development purposes. It should not be used as the sole source for medical documentation or clinical decision-making. Always verify extracted information and follow your institution's documentation requirements.