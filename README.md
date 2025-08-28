# English Assessment System

An AI-powered English proficiency assessment system that conducts voice-led tests in under 5 minutes, providing CEFR-style scoring with detailed sub-scores.

## Features

- **Voice-Only Interaction**: Fully voice-led back-and-forth conversation
- **5-Minute Duration**: Optimized test flow from setup to results
- **AI-Powered Scoring**: ChatGPT API evaluation with rule-based signals
- **Professional Voice**: ElevenLabs TTS for natural AI responses
- **Accurate Speech Recognition**: OpenAI Whisper for transcript generation
- **CEFR Mapping**: A2 to C2 level assessment with confidence scores

## System Architecture

```
Frontend (React) ←→ Backend (Node.js/Express) ←→ AI Services
     ↓                    ↓                        ↓
Voice Interface    Session Orchestrator    ChatGPT + ElevenLabs + Whisper
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- ElevenLabs API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Copy environment variables:
   ```bash
   cp env.example .env
   ```

4. Add your API keys to `.env`

5. Start development servers:
   ```bash
   npm run dev
   ```

The system will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Test Flow

1. **INIT** (30-45s): Device check, consent, mic test
2. **WARMUP** (30s): Name and location introduction
3. **INTERVIEW Q1** (45-60s): Workday routine + follow-up
4. **INTERVIEW Q2** (45-60s): Work preference + counterargument
5. **TASK** (75-90s): Picture description or role-play scenario
6. **LISTENING** (45-60s): Audio clip + comprehension question
7. **WRAP** (10-15s): Thank you + results preparation

## Scoring Rubric

- **Fluency** (0-5): Continuity, pace, pauses, fillers
- **Pronunciation** (0-5): Intelligibility, phoneme accuracy, stress
- **Grammar** (0-5): Verb tenses, agreement, sentence variety
- **Vocabulary** (0-5): Range, appropriacy, collocations
- **Comprehension** (0-5): Relevance, accuracy, listening skills
- **Task Completion** (0-5): Coverage of required elements

## CEFR Mapping

- A2: 6-10 points
- B1: 11-15 points  
- B2: 16-20 points
- C1: 21-25 points
- C2: 26-30 points

## API Endpoints

- `POST /api/session/start` - Initialize new assessment session
- `POST /api/session/audio` - Submit audio for processing
- `GET /api/session/:id/status` - Get session status
- `GET /api/session/:id/results` - Get assessment results

## Configuration

Key configuration options in `.env`:
- Voice selection and parameters
- Session timeouts
- CEFR threshold adjustments
- Question bank selection

## Development

- `npm run dev` - Start both frontend and backend
- `npm run server:dev` - Backend only with hot reload
- `npm run client:dev` - Frontend only
- `npm run build` - Build production frontend

## Performance Targets

- Total test duration: ≤5 minutes
- Per-turn latency: ≤3.5s (ASR + LLM + TTS)
- Drop/failure rate: <3%
- Results generation: ≤10s after completion

## License

MIT License
