const { v4: uuidv4 } = require('uuid');
const aiService = require('./aiService');

class AssessmentEngine {
  constructor() {
    this.phases = {
      INIT: 'init',
      WARMUP: 'warmup',
      INTERVIEW_Q1: 'interview_q1',
      INTERVIEW_Q2: 'interview_q2',
      TASK: 'task',
      LISTENING: 'listening',
      WRAP: 'wrap',
      COMPLETE: 'complete'
    };

    this.phaseConfig = {
      [this.phases.INIT]: { duration: 45000, next: this.phases.WARMUP },
      [this.phases.WARMUP]: { duration: 30000, next: this.phases.INTERVIEW_Q1 },
      [this.phases.INTERVIEW_Q1]: { duration: 60000, next: this.phases.INTERVIEW_Q2 },
      [this.phases.INTERVIEW_Q2]: { duration: 60000, next: this.phases.TASK },
      [this.phases.TASK]: { duration: 90000, next: this.phases.LISTENING },
      [this.phases.LISTENING]: { duration: 60000, next: this.phases.WRAP },
      [this.phases.WRAP]: { duration: 15000, next: this.phases.COMPLETE },
      [this.phases.COMPLETE]: { duration: 0, next: null }
    };
  }

  // Initialize new assessment session
  createSession() {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      phase: this.phases.INIT,
      phaseStartTime: Date.now(),
      turnIndex: 0,
      turns: [],
      metadata: {
        deviceInfo: {},
        consentRecorded: false,
        micTestCompleted: false,
        speakingRate: null,
        interruptions: 0
      },
      scores: null,
      status: 'active'
    };

    return session;
  }

  // Advance to next phase
  advancePhase(session) {
    const currentPhase = session.phase;
    const nextPhase = this.phaseConfig[currentPhase]?.next;

    if (nextPhase && nextPhase !== currentPhase) {
      session.phase = nextPhase;
      session.phaseStartTime = Date.now();
      session.turnIndex = 0;
      console.log(`Session ${session.id} advanced to phase: ${nextPhase}`);
      return nextPhase;
    }

    return currentPhase;
  }

  // Check if phase should timeout
  checkPhaseTimeout(session) {
    const currentPhase = session.phase;
    const phaseDuration = this.phaseConfig[currentPhase]?.duration || 0;
    
    if (phaseDuration > 0) {
      const elapsed = Date.now() - session.phaseStartTime;
      if (elapsed >= phaseDuration) {
        console.log(`Session ${session.id} phase ${currentPhase} timed out`);
        return true;
      }
    }
    
    return false;
  }

  // Process user turn and generate AI response
  async processTurn(session, userAudio, userTranscript) {
    try {
      const turn = {
        index: session.turnIndex,
        phase: session.phase,
        timestamp: Date.now(),
        userAudio: userAudio,
        userTranscript: userTranscript,
        aiResponse: null,
        aiAudio: null,
        duration: null,
        metadata: {}
      };

      // Generate AI response based on current phase
      const aiResponse = await this.generatePhaseResponse(session, turn);
      turn.aiResponse = aiResponse;

      // Convert AI response to speech
      const aiAudio = await aiService.textToSpeech(aiResponse);
      turn.aiAudio = aiAudio;

      // Calculate turn duration
      turn.duration = Date.now() - turn.timestamp;

      // Add turn to session
      session.turns.push(turn);
      session.turnIndex++;

      // Check if phase should advance
      if (this.shouldAdvancePhase(session, turn)) {
        this.advancePhase(session);
      }

      return {
        aiResponse,
        aiAudio,
        phase: session.phase,
        phaseTimeRemaining: this.getPhaseTimeRemaining(session),
        shouldAdvance: session.phase === this.phaseConfig[session.phase]?.next
      };

    } catch (error) {
      console.error('Error processing turn:', error);
      throw error;
    }
  }

  // Generate appropriate response for current phase
  async generatePhaseResponse(session, turn) {
    const phase = session.phase;
    const context = this.buildContext(session, turn);

    switch (phase) {
      case this.phases.INIT:
        return await this.generateInitResponse(session, context);
      
      case this.phases.WARMUP:
        return await this.generateWarmupResponse(session, context);
      
      case this.phases.INTERVIEW_Q1:
      case this.phases.INTERVIEW_Q2:
        return await this.generateInterviewResponse(session, context);
      
      case this.phases.TASK:
        return await this.generateTaskResponse(session, context);
      
      case this.phases.LISTENING:
        return await this.generateListeningResponse(session, context);
      
      case this.phases.WRAP:
        return await this.generateWrapResponse(session, context);
      
      default:
        return "Please continue with your response.";
    }
  }

  // Generate initialization response
  async generateInitResponse(session, context) {
    if (!session.metadata.consentRecorded) {
      return "Welcome to the English assessment. I'll need to record your consent to proceed. Please say 'I consent to this assessment' after the beep.";
    }
    
    if (!session.metadata.micTestCompleted) {
      return "Great! Now let's test your microphone. Please say 'Testing, testing, one two three' so I can check the audio levels.";
    }
    
    return "Perfect! Your microphone is working well. Let's begin the assessment. Tell me your first name and where you're calling from.";
  }

  // Generate warmup response
  async generateWarmupResponse(session, context) {
    if (session.turnIndex === 0) {
      return "Tell me your first name and where you're calling from.";
    }
    
    // Check if we got the required information
    const transcript = context.lastUserTranscript || '';
    if (transcript.includes('name') || transcript.includes('call') || transcript.includes('from')) {
      return "Thank you. Now let's move to the first interview question.";
    }
    
    return "I didn't catch that clearly. Could you please tell me your first name and where you're calling from?";
  }

  // Generate interview response
  async generateInterviewResponse(session, context) {
    const phase = session.phase;
    const turnIndex = session.turnIndex;
    
    if (turnIndex === 0) {
      if (phase === this.phases.INTERVIEW_Q1) {
        return "What do you usually do on a typical workday? Mention two tasks.";
      } else {
        return "Do you prefer working from home or office? Why?";
      }
    }
    
    // Follow-up questions
    if (phase === this.phases.INTERVIEW_Q1) {
      return "How do you prioritize those tasks?";
    } else {
      return "Can you give me an example of when the opposite approach might be better?";
    }
  }

  // Generate task response
  async generateTaskResponse(session, context) {
    if (session.turnIndex === 0) {
      // Randomly choose between picture and role-play
      const taskType = Math.random() > 0.5 ? 'picture' : 'roleplay';
      session.metadata.taskType = taskType;
      
      if (taskType === 'picture') {
        return "I'll show you an office scene. Describe what you see and what might be happening.";
      } else {
        return "You're calling a customer to reschedule a meeting. Explain the reason, propose two new times, and confirm next steps.";
      }
    }
    
    return "Thank you. That completes the task section.";
  }

  // Generate listening response
  async generateListeningResponse(session, context) {
    if (session.turnIndex === 0) {
      return "I'll play a short business message. Listen carefully, then answer my question about it.";
    }
    
    return "What did the speaker promise to send and why?";
  }

  // Generate wrap response
  async generateWrapResponse(session, context) {
    return "Thank you for completing the assessment. Your results will be available shortly.";
  }

  // Build context for AI response generation
  buildContext(session, turn) {
    const lastTurn = session.turns[session.turns.length - 2];
    return {
      phase: session.phase,
      turnIndex: session.turnIndex,
      lastUserTranscript: lastTurn?.userTranscript,
      phaseTimeRemaining: this.getPhaseTimeRemaining(session),
      metadata: session.metadata
    };
  }

  // Check if phase should advance
  shouldAdvancePhase(session, turn) {
    const phase = session.phase;
    const turnIndex = session.turnIndex;
    
    // Phase-specific advancement logic
    switch (phase) {
      case this.phases.INIT:
        return session.metadata.consentRecorded && session.metadata.micTestCompleted;
      
      case this.phases.WARMUP:
        return turnIndex > 0 && turn.userTranscript && turn.userTranscript.length > 10;
      
      case this.phases.INTERVIEW_Q1:
      case this.phases.INTERVIEW_Q2:
        return turnIndex > 0;
      
      case this.phases.TASK:
        return turnIndex > 0;
      
      case this.phases.LISTENING:
        return turnIndex > 0;
      
      case this.phases.WRAP:
        return turnIndex > 0;
      
      default:
        return false;
    }
  }

  // Get remaining time for current phase
  getPhaseTimeRemaining(session) {
    const currentPhase = session.phase;
    const phaseDuration = this.phaseConfig[currentPhase]?.duration || 0;
    
    if (phaseDuration > 0) {
      const elapsed = Date.now() - session.phaseStartTime;
      return Math.max(0, phaseDuration - elapsed);
    }
    
    return 0;
  }

  // Calculate final scores
  async calculateFinalScores(session) {
    if (session.scores) {
      return session.scores;
    }

    try {
      // Aggregate all transcripts
      const allTranscripts = session.turns
        .map(turn => turn.userTranscript)
        .filter(Boolean)
        .join(' ');

      // Calculate automated signals
      const signals = this.calculateSignals(session);

      // Get AI scoring
      const aiScores = await aiService.scoreAssessment(
        allTranscripts,
        { session, signals },
        'assessment_rubric'
      );

      // Combine automated signals with AI scores
      const finalScores = {
        ...aiScores.scores,
        automated_signals: signals
      };

      // Calculate CEFR level
      const totalScore = Object.values(finalScores)
        .filter(score => typeof score === 'number' && !isNaN(score))
        .reduce((sum, score) => sum + score, 0);

      const cefrLevel = this.mapToCEFR(totalScore);

      session.scores = {
        level_cefr: cefrLevel,
        scores: finalScores,
        confidence: aiScores.confidence,
        rationale: aiScores.rationale,
        total_score: totalScore,
        signals: signals
      };

      return session.scores;

    } catch (error) {
      console.error('Error calculating final scores:', error);
      throw error;
    }
  }

  // Calculate automated signals from session data
  calculateSignals(session) {
    const turns = session.turns.filter(turn => turn.userTranscript);
    
    if (turns.length === 0) {
      return {};
    }

    // Calculate speaking rate (words per minute)
    const totalWords = turns.reduce((sum, turn) => {
      return sum + (turn.userTranscript.split(' ').length || 0);
    }, 0);

    const totalDuration = turns.reduce((sum, turn) => {
      return sum + (turn.duration || 0);
    }, 0);

    const wpm = totalDuration > 0 ? Math.round((totalWords / totalDuration) * 60000) : 0;

    // Calculate silence ratio and other metrics
    const silenceRatio = this.calculateSilenceRatio(session);
    const fillersPerMin = this.calculateFillersPerMinute(session);

    return {
      wpm,
      silence_ratio: silenceRatio,
      fillers_per_min: fillersPerMin,
      total_turns: turns.length,
      total_duration: totalDuration,
      average_turn_duration: Math.round(totalDuration / turns.length)
    };
  }

  // Calculate silence ratio
  calculateSilenceRatio(session) {
    // This would be calculated from audio analysis
    // For MVP, return a placeholder
    return 0.15;
  }

  // Calculate fillers per minute
  calculateFillersPerMinute(session) {
    const turns = session.turns.filter(turn => turn.userTranscript);
    const totalDuration = turns.reduce((sum, turn) => sum + (turn.duration || 0), 0);
    
    const fillerWords = ['uh', 'um', 'like', 'you know', 'i mean'];
    const totalFillers = turns.reduce((sum, turn) => {
      const transcript = turn.userTranscript.toLowerCase();
      return sum + fillerWords.reduce((count, filler) => {
        const regex = new RegExp(`\\b${filler}\\b`, 'g');
        const matches = transcript.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
    }, 0);

    return totalDuration > 0 ? Math.round((totalFillers / totalDuration) * 60000) : 0;
  }

  // Map total score to CEFR level
  mapToCEFR(totalScore) {
    if (totalScore >= 26) return 'C2';
    if (totalScore >= 21) return 'C1';
    if (totalScore >= 16) return 'B2';
    if (totalScore >= 11) return 'B1';
    if (totalScore >= 6) return 'A2';
    return 'A1';
  }
}

module.exports = new AssessmentEngine();
