import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AssessmentContext = createContext();

const initialState = {
  session: null,
  currentPhase: 'init',
  isRecording: false,
  isPlaying: false,
  transcript: '',
  aiResponse: '',
  phaseTimeRemaining: 0,
  progress: 0,
  error: null,
  loading: false,
  deviceInfo: {
    microphone: false,
    audioLevel: 0,
    consentRecorded: false,
    micTestCompleted: false
  }
};

const assessmentReducer = (state, action) => {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        session: action.payload,
        currentPhase: 'init',
        loading: false,
        error: null
      };
    
    case 'SET_PHASE':
      return {
        ...state,
        currentPhase: action.payload,
        phaseTimeRemaining: action.timeRemaining || 0
      };
    
    case 'SET_RECORDING':
      return {
        ...state,
        isRecording: action.payload
      };
    
    case 'SET_PLAYING':
      return {
        ...state,
        isPlaying: action.payload
      };
    
    case 'SET_TRANSCRIPT':
      return {
        ...state,
        transcript: action.payload
      };
    
    case 'SET_AI_RESPONSE':
      return {
        ...state,
        aiResponse: action.payload
      };
    
    case 'SET_TIME_REMAINING':
      return {
        ...state,
        phaseTimeRemaining: action.payload
      };
    
    case 'SET_PROGRESS':
      return {
        ...state,
        progress: action.payload
      };
    
    case 'SET_DEVICE_INFO':
      return {
        ...state,
        deviceInfo: {
          ...state.deviceInfo,
          ...action.payload
        }
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case 'RESET_SESSION':
      return {
        ...initialState
      };
    
    default:
      return state;
  }
};

export const AssessmentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);

  // Start new assessment session
  const startSession = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.post('/api/session/start');
      
      if (response.data.success) {
        dispatch({ 
          type: 'START_SESSION', 
          payload: response.data 
        });
        
        // Start phase timer
        startPhaseTimer(response.data.phase_time_remaining);
        
        return response.data.session_id;
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.response?.data?.error || 'Failed to start session' 
      });
      throw error;
    }
  };

  // Process audio and get AI response
  const processAudio = async (audioBlob) => {
    if (!state.session?.session_id) {
      throw new Error('No active session');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('sessionId', state.session.session_id);

      const response = await axios.post('/api/audio/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const { turn_result, user_transcript, session_status } = response.data;
        
        dispatch({ type: 'SET_TRANSCRIPT', payload: user_transcript });
        dispatch({ type: 'SET_AI_RESPONSE', payload: turn_result.ai_response });
        dispatch({ type: 'SET_PHASE', payload: session_status.phase });
        
        // Update phase timer
        if (turn_result.phase_time_remaining) {
          startPhaseTimer(turn_result.phase_time_remaining);
        }
        
        return turn_result;
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.response?.data?.error || 'Failed to process audio' 
      });
      throw error;
    }
  };

  // Test microphone
  const testMicrophone = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await axios.post('/api/audio/test', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const { audio_quality } = response.data;
        
        dispatch({
          type: 'SET_DEVICE_INFO',
          payload: {
            microphone: audio_quality.has_audio,
            audioLevel: audio_quality.quality_score,
            micTestCompleted: true
          }
        });
        
        return audio_quality;
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to test microphone' 
      });
      throw error;
    }
  };

  // Update session metadata
  const updateMetadata = async (updates) => {
    if (!state.session?.session_id) return;

    try {
      const response = await axios.patch(
        `/api/session/${state.session.session_id}/metadata`,
        { updates }
      );

      if (response.data.success) {
        dispatch({
          type: 'SET_DEVICE_INFO',
          payload: response.data.metadata
        });
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  };

  // Get session results
  const getResults = async (sessionId) => {
    try {
      const response = await axios.get(`/api/session/${sessionId}/results`);
      
      if (response.data.success) {
        return response.data.results;
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to get results' 
      });
      throw error;
    }
  };

  // Phase timer management
  const startPhaseTimer = (duration) => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      
      dispatch({ type: 'SET_TIME_REMAINING', payload: remaining });
      
      if (remaining <= 0) {
        clearInterval(timer);
        // Phase timeout - could trigger auto-advancement
      }
    }, 1000);

    return timer;
  };

  // Get session status
  const getSessionStatus = async (sessionId) => {
    try {
      const response = await axios.get(`/api/session/${sessionId}/status`);
      
      if (response.data.success) {
        const { session } = response.data;
        dispatch({ type: 'SET_PHASE', payload: session.phase });
        return session;
      }
    } catch (error) {
      console.error('Failed to get session status:', error);
    }
  };

  // Reset session
  const resetSession = () => {
    dispatch({ type: 'RESET_SESSION' });
  };

  // Context value
  const value = {
    ...state,
    startSession,
    processAudio,
    testMicrophone,
    updateMetadata,
    getResults,
    getSessionStatus,
    resetSession,
    dispatch
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
