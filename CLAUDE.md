# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MedScribe is a medical AI scribe application that extracts structured clinical data from doctor-patient conversation transcripts. Built with Node.js/Express backend and vanilla JavaScript frontend.

## Development Commands

```bash
# Install dependencies
npm install

# Development server (auto-reload)
npm run dev

# Production server
npm start

# Run tests
npm test

# Code quality
npm run lint
npm run format
```

## Project Architecture

### Backend (`src/`)
- **`index.js`** - Express server setup, middleware, routes
- **`controllers/transcriptController.js`** - HTTP request handlers for transcript processing
- **`services/extractionService.js`** - Core business logic for clinical data extraction
- **`prompts/clinical-extraction.js`** - AI prompt templates and clinical categories

### Frontend (`public/`)
- **`index.html`** - Single-page application interface
- **`js/app.js`** - Frontend JavaScript (vanilla JS, no frameworks)
- **`css/style.css`** - Medical-themed styling with CSS custom properties

### Key Design Patterns
- **Service Layer**: Business logic separated from HTTP concerns
- **Template System**: Modular prompt system for AI integration
- **Weighted Categories**: Clinical data organized by importance (High/Medium/Low)
- **Mock Mode**: Built-in demo functionality for development/testing

## API Endpoints

- `POST /api/transcript/process` - Main transcript processing endpoint
- `GET /api/transcript/health` - Health check
- `GET /api/transcript/categories` - Get clinical data categories
- `GET /api/transcript/status/:id` - Processing status (placeholder)

## Development Notes

- **AI Integration**: Currently uses mock responses. Real AI integration goes in `extractionService.js`
- **Environment Config**: Copy `.env.example` to `.env` for local settings
- **Security**: Helmet, CORS, input validation built-in
- **Clinical Focus**: Follows medical documentation standards and terminology

## Testing

The application includes mock mode for development. To test with real medical transcripts, ensure HIPAA compliance and use de-identified data only.