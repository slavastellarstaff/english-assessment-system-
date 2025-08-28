const express = require('express');
const router = express.Router();
const multer = require('multer');
const assessmentEngine = require('../services/assessmentEngine');
const sessionStore = require('../config/database');
const aiService = require('../services/aiService');

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Process user audio and generate AI response
router.post('/process', upload.single('audio'), async (req, res) => {
  try {
    const { sessionId } = req.body;
    const audioFile = req.file;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    // Get session
    const session = sessionStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if session is active
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Session is not active'
      });
    }

    // Check phase timeout
    if (assessmentEngine.checkPhaseTimeout(session)) {
      assessmentEngine.advancePhase(session);
      sessionStore.updateSession(sessionId, session);
    }

    // Convert audio to base64 for processing
    const audioBuffer = Buffer.from(audioFile.buffer);
    const audioBase64 = audioBuffer.toString('base64');

    // Process audio with Whisper ASR
    let transcript;
    try {
      transcript = await aiService.speechToText(audioBuffer);
    } catch (asrError) {
      console.error('ASR error:', asrError);
      return res.status(500).json({
        success: false,
        error: 'Failed to transcribe audio. Please try again.',
        details: asrError.message
      });
    }

    // Process turn with assessment engine
    const turnResult = await assessmentEngine.processTurn(
      session, 
      audioBase64, 
      transcript.text
    );

    // Update session in store
    sessionStore.updateSession(sessionId, session);

    // Return AI response and audio
    res.json({
      success: true,
      turn_result: {
        ai_response: turnResult.aiResponse,
        ai_audio: turnResult.aiAudio ? 'audio_generated' : null,
        phase: turnResult.phase,
        phase_time_remaining: turnResult.phaseTimeRemaining,
        should_advance: turnResult.shouldAdvance
      },
      user_transcript: transcript.text,
      session_status: {
        phase: session.phase,
        turn_index: session.turnIndex,
        status: session.status
      }
    });

  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process audio',
      details: error.message
    });
  }
});

// Test microphone and get audio levels
router.post('/test', upload.single('audio'), async (req, res) => {
  try {
    const audioFile = req.file;
    
    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    const audioBuffer = Buffer.from(audioFile.buffer);
    
    // Basic audio analysis (for MVP)
    const audioSize = audioBuffer.length;
    const hasAudio = audioSize > 1000; // Simple check for non-empty audio
    
    // In production, you'd analyze actual audio levels, SNR, etc.
    const audioQuality = {
      has_audio: hasAudio,
      file_size: audioSize,
      duration_estimate: Math.round(audioSize / 16000), // Rough estimate for 16kHz audio
      quality_score: hasAudio ? 0.8 : 0.0
    };

    res.json({
      success: true,
      audio_quality: audioQuality,
      message: hasAudio ? 'Microphone test successful' : 'No audio detected'
    });

  } catch (error) {
    console.error('Error testing microphone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test microphone',
      details: error.message
    });
  }
});

// Get AI audio for a specific turn
router.get('/ai/:sessionId/:turnIndex', async (req, res) => {
  try {
    const { sessionId, turnIndex } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const turn = session.turns[parseInt(turnIndex)];
    if (!turn || !turn.aiAudio) {
      return res.status(404).json({
        success: false,
        error: 'AI audio not found for this turn'
      });
    }

    // For MVP, return the audio data
    // In production, you'd serve the actual audio file
    res.json({
      success: true,
      turn_index: parseInt(turnIndex),
      ai_audio: turn.aiAudio,
      ai_response: turn.aiResponse
    });

  } catch (error) {
    console.error('Error getting AI audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI audio'
    });
  }
});

// Stream audio (for real-time playback)
router.get('/stream/:sessionId/:turnIndex', async (req, res) => {
  try {
    const { sessionId, turnIndex } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const turn = session.turns[parseInt(turnIndex)];
    if (!turn) {
      return res.status(404).json({
        success: false,
        error: 'Turn not found'
      });
    }

    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', turn.aiAudio ? turn.aiAudio.length : 0);
    res.setHeader('Accept-Ranges', 'bytes');

    // For MVP, return placeholder
    // In production, you'd stream the actual audio data
    res.json({
      success: true,
      message: 'Audio streaming endpoint - implement actual audio streaming',
      turn_index: parseInt(turnIndex),
      has_audio: !!turn.aiAudio
    });

  } catch (error) {
    console.error('Error streaming audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stream audio'
    });
  }
});

// Validate audio format and quality
router.post('/validate', upload.single('audio'), async (req, res) => {
  try {
    const audioFile = req.file;
    
    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }

    const audioBuffer = Buffer.from(audioFile.buffer);
    
    // Basic validation
    const validation = {
      file_size: audioBuffer.length,
      mime_type: audioFile.mimetype,
      is_valid: true,
      issues: []
    };

    // Check file size
    if (audioBuffer.length > 50 * 1024 * 1024) { // 50MB
      validation.is_valid = false;
      validation.issues.push('File too large');
    }

    // Check MIME type
    if (!audioFile.mimetype.startsWith('audio/')) {
      validation.is_valid = false;
      validation.issues.push('Invalid file type');
    }

    // Check if audio has content
    if (audioBuffer.length < 1000) {
      validation.is_valid = false;
      validation.issues.push('Audio file too small');
    }

    res.json({
      success: true,
      validation: validation,
      message: validation.is_valid ? 'Audio file is valid' : 'Audio file has issues'
    });

  } catch (error) {
    console.error('Error validating audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate audio',
      details: error.message
    });
  }
});

module.exports = router;
