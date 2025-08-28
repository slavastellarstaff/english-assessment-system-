const express = require('express');
const router = express.Router();
const assessmentEngine = require('../services/assessmentEngine');
const sessionStore = require('../config/database');
const aiService = require('../services/aiService');

// Get assessment configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      phases: assessmentEngine.phases,
      phase_config: assessmentEngine.phaseConfig,
      timeouts: {
        session_timeout: process.env.SESSION_TIMEOUT || 300000,
        max_audio_duration: process.env.MAX_AUDIO_DURATION || 60000
      },
      scoring: {
        cefr_thresholds: {
          A2: parseInt(process.env.CEFR_THRESHOLDS_A2) || 6,
          B1: parseInt(process.env.CEFR_THRESHOLDS_B1) || 11,
          B2: parseInt(process.env.CEFR_THRESHOLDS_B2) || 16,
          C1: parseInt(process.env.CEFR_THRESHOLDS_C1) || 21,
          C2: parseInt(process.env.CEFR_THRESHOLDS_C2) || 26
        }
      },
      voice: {
        voice_id: process.env.ELEVENLABS_VOICE_ID,
        stability: process.env.ELEVENLABS_STABILITY,
        similarity_boost: process.env.ELEVENLABS_SIMILARITY_BOOST
      }
    };

    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    console.error('Error getting assessment config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assessment configuration'
    });
  }
});

// Get current phase information
router.get('/:sessionId/phase', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const currentPhase = session.phase;
    const phaseConfig = assessmentEngine.phaseConfig[currentPhase];
    const timeRemaining = assessmentEngine.getPhaseTimeRemaining(session);

    res.json({
      success: true,
      phase: {
        current: currentPhase,
        next: phaseConfig?.next,
        duration: phaseConfig?.duration,
        time_remaining: timeRemaining,
        turn_index: session.turnIndex,
        phase_start_time: session.phaseStartTime
      }
    });
  } catch (error) {
    console.error('Error getting phase info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get phase information'
    });
  }
});

// Force phase advancement (for testing/admin)
router.post('/:sessionId/advance', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { targetPhase } = req.body;

    const session = sessionStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    if (targetPhase && assessmentEngine.phases[targetPhase.toUpperCase()]) {
      session.phase = assessmentEngine.phases[targetPhase.toUpperCase()];
      session.phaseStartTime = Date.now();
      session.turnIndex = 0;
    } else {
      assessmentEngine.advancePhase(session);
    }

    sessionStore.updateSession(sessionId, session);

    res.json({
      success: true,
      message: 'Phase advanced successfully',
      new_phase: session.phase,
      phase_time_remaining: assessmentEngine.getPhaseTimeRemaining(session)
    });
  } catch (error) {
    console.error('Error advancing phase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to advance phase'
    });
  }
});

// Get assessment progress
router.get('/:sessionId/progress', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const totalPhases = Object.keys(assessmentEngine.phases).length - 1; // Exclude COMPLETE
    const completedPhases = Object.keys(assessmentEngine.phases)
      .filter(phase => phase !== 'COMPLETE')
      .indexOf(session.phase.toUpperCase());

    const progress = {
      current_phase: session.phase,
      phase_number: completedPhases + 1,
      total_phases: totalPhases,
      progress_percentage: Math.round(((completedPhases + 1) / totalPhases) * 100),
      turns_completed: session.turnIndex,
      time_elapsed: Date.now() - session.createdAt,
      estimated_time_remaining: this.estimateTimeRemaining(session)
    };

    res.json({
      success: true,
      progress: progress
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assessment progress'
    });
  }
});

// Estimate time remaining based on current progress
estimateTimeRemaining(session) {
  const currentPhase = session.phase;
  const phaseConfig = assessmentEngine.phaseConfig[currentPhase];
  
  if (!phaseConfig || !phaseConfig.duration) {
    return 0;
  }

  const elapsed = Date.now() - session.phaseStartTime;
  const remainingInPhase = Math.max(0, phaseConfig.duration - elapsed);

  // Estimate remaining phases
  let totalRemaining = remainingInPhase;
  let currentPhaseKey = currentPhase;

  while (assessmentEngine.phaseConfig[currentPhaseKey]?.next) {
    const nextPhase = assessmentEngine.phaseConfig[currentPhaseKey].next;
    if (nextPhase === 'complete') break;
    
    totalRemaining += assessmentEngine.phaseConfig[nextPhase]?.duration || 0;
    currentPhaseKey = nextPhase;
  }

  return totalRemaining;
}

// Get assessment analytics
router.get('/:sessionId/analytics', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const analytics = {
      session_duration: Date.now() - session.createdAt,
      total_turns: session.turns.length,
      phase_breakdown: this.getPhaseBreakdown(session),
      speaking_metrics: this.calculateSpeakingMetrics(session),
      response_times: this.calculateResponseTimes(session)
    };

    res.json({
      success: true,
      analytics: analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assessment analytics'
    });
  }
});

// Get phase breakdown
getPhaseBreakdown(session) {
  const breakdown = {};
  
  session.turns.forEach(turn => {
    const phase = turn.phase;
    if (!breakdown[phase]) {
      breakdown[phase] = {
        turns: 0,
        total_duration: 0,
        average_duration: 0
      };
    }
    
    breakdown[phase].turns++;
    breakdown[phase].total_duration += turn.duration || 0;
  });

  // Calculate averages
  Object.keys(breakdown).forEach(phase => {
    if (breakdown[phase].turns > 0) {
      breakdown[phase].average_duration = Math.round(
        breakdown[phase].total_duration / breakdown[phase].turns
      );
    }
  });

  return breakdown;
}

// Calculate speaking metrics
calculateSpeakingMetrics(session) {
  const turns = session.turns.filter(turn => turn.userTranscript);
  
  if (turns.length === 0) {
    return {};
  }

  const totalWords = turns.reduce((sum, turn) => {
    return sum + (turn.userTranscript.split(' ').length || 0);
  }, 0);

  const totalDuration = turns.reduce((sum, turn) => {
    return sum + (turn.duration || 0);
  }, 0);

  const wpm = totalDuration > 0 ? Math.round((totalWords / totalDuration) * 60000) : 0;

  return {
    total_words: totalWords,
    words_per_minute: wpm,
    average_turn_length: Math.round(totalWords / turns.length),
    total_speaking_time: totalDuration
  };
}

// Calculate response times
calculateResponseTimes(session) {
  const turns = session.turns;
  
  if (turns.length < 2) {
    return {};
  }

  const responseTimes = [];
  
  for (let i = 1; i < turns.length; i++) {
    const currentTurn = turns[i];
    const previousTurn = turns[i - 1];
    
    if (previousTurn.aiResponse && currentTurn.userTranscript) {
      const responseTime = currentTurn.timestamp - previousTurn.timestamp;
      responseTimes.push(responseTime);
    }
  }

  if (responseTimes.length === 0) {
    return {};
  }

  const avgResponseTime = Math.round(
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
  );

  return {
    average_response_time: avgResponseTime,
    total_responses: responseTimes.length,
    response_times: responseTimes
  };
}

// Get assessment summary
router.get('/:sessionId/summary', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const summary = {
      session_id: session.id,
      status: session.status,
      phase: session.phase,
      total_turns: session.turns.length,
      duration: Date.now() - session.createdAt,
      metadata: session.metadata,
      scores: session.scores,
      created_at: session.createdAt,
      last_activity: session.lastActivity
    };

    res.json({
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assessment summary'
    });
  }
});

// Reset assessment session (for testing)
router.post('/:sessionId/reset', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Reset to initial state
    session.phase = assessmentEngine.phases.INIT;
    session.phaseStartTime = Date.now();
    session.turnIndex = 0;
    session.turns = [];
    session.scores = null;
    session.status = 'active';
    session.metadata = {
      deviceInfo: {},
      consentRecorded: false,
      micTestCompleted: false,
      speakingRate: null,
      interruptions: 0
    };

    sessionStore.updateSession(sessionId, session);

    res.json({
      success: true,
      message: 'Assessment session reset successfully',
      session: {
        id: session.id,
        phase: session.phase,
        phase_time_remaining: assessmentEngine.getPhaseTimeRemaining(session)
      }
    });
  } catch (error) {
    console.error('Error resetting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset assessment session'
    });
  }
});

module.exports = router;
