const express = require('express');
const router = express.Router();
const assessmentEngine = require('../services/assessmentEngine');
const sessionStore = require('../config/database');

// Start new assessment session
router.post('/start', async (req, res) => {
  try {
    const session = assessmentEngine.createSession();
    sessionStore.createSession(session.id, session);

    res.json({
      success: true,
      session_id: session.id,
      phase: session.phase,
      phase_time_remaining: assessmentEngine.getPhaseTimeRemaining(session),
      message: 'Assessment session started successfully'
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start assessment session'
    });
  }
});

// Get session status
router.get('/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check for phase timeout
    if (assessmentEngine.checkPhaseTimeout(session)) {
      assessmentEngine.advancePhase(session);
      sessionStore.updateSession(sessionId, session);
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        phase: session.phase,
        phase_time_remaining: assessmentEngine.getPhaseTimeRemaining(session),
        turn_index: session.turnIndex,
        status: session.status,
        metadata: session.metadata
      }
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session status'
    });
  }
});

// Get session results
router.get('/:sessionId/results', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (session.phase !== 'complete' && session.phase !== 'wrap') {
      return res.status(400).json({
        success: false,
        error: 'Assessment not yet completed'
      });
    }

    // Calculate final scores if not already done
    if (!session.scores) {
      session.scores = await assessmentEngine.calculateFinalScores(session);
      sessionStore.updateSession(sessionId, session);
    }

    res.json({
      success: true,
      results: {
        session_id: session.id,
        level_cefr: session.scores.level_cefr,
        scores: session.scores.scores,
        confidence: session.scores.confidence,
        rationale: session.scores.rationale,
        total_score: session.scores.total_score,
        signals: session.scores.signals,
        artifacts: {
          transcript_url: `/api/session/${sessionId}/transcript`,
          audio_urls: session.turns.map(turn => `/api/session/${sessionId}/audio/${turn.index}`)
        },
        versions: {
          llm_model: 'gpt-4',
          asr: 'whisper-1',
          tts: 'elevenlabs'
        }
      }
    });
  } catch (error) {
    console.error('Error getting session results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session results'
    });
  }
});

// Get session transcript
router.get('/:sessionId/transcript', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const transcript = session.turns
      .filter(turn => turn.userTranscript)
      .map(turn => ({
        phase: turn.phase,
        turn_index: turn.index,
        timestamp: turn.timestamp,
        transcript: turn.userTranscript,
        ai_response: turn.aiResponse
      }));

    res.json({
      success: true,
      session_id: sessionId,
      transcript: transcript
    });
  } catch (error) {
    console.error('Error getting transcript:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transcript'
    });
  }
});

// Get session audio
router.get('/:sessionId/audio/:turnIndex', async (req, res) => {
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

    // For MVP, return audio data as base64
    // In production, you'd serve actual audio files
    res.json({
      success: true,
      turn_index: parseInt(turnIndex),
      user_audio: turn.userAudio ? 'audio_data_available' : null,
      ai_audio: turn.aiAudio ? 'audio_data_available' : null
    });
  } catch (error) {
    console.error('Error getting audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audio'
    });
  }
});

// Update session metadata (for consent, mic test, etc.)
router.patch('/:sessionId/metadata', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { updates } = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid updates object'
      });
    }

    const session = sessionStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Update metadata
    Object.assign(session.metadata, updates);
    sessionStore.updateSession(sessionId, session);

    res.json({
      success: true,
      message: 'Session metadata updated successfully',
      metadata: session.metadata
    });
  } catch (error) {
    console.error('Error updating session metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session metadata'
    });
  }
});

// End session early
router.post('/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    session.status = 'ended';
    session.phase = 'complete';
    sessionStore.updateSession(sessionId, session);

    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

// Get server stats
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = sessionStore.getStats();
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get server stats'
    });
  }
});

module.exports = router;
