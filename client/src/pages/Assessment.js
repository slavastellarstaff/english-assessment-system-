import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssessment } from '../context/AssessmentContext';
import VoiceRecorder from '../components/VoiceRecorder';
import PhaseIndicator from '../components/PhaseIndicator';
import AIPlayer from '../components/AIPlayer';

const AssessmentContainer = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Content = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
  color: white;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
`;

const MainCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const PhaseContent = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const PhaseTitle = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 20px;
`;

const PhaseDescription = styled.p`
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 30px;
`;

const Instructions = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border-left: 4px solid #667eea;
`;

const InstructionText = styled.p`
  font-size: 1rem;
  color: #333;
  margin: 0;
  line-height: 1.5;
`;

const InteractionArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
`;

const TranscriptDisplay = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 600px;
  min-height: 80px;
  border: 2px solid #e9ecef;
`;

const TranscriptLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
  font-weight: 600;
`;

const TranscriptText = styled.div`
  font-size: 1rem;
  color: #333;
  line-height: 1.5;
  min-height: 20px;
`;

const AIResponseDisplay = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 600px;
  min-height: 80px;
`;

const AIResponseLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 10px;
  font-weight: 600;
`;

const AIResponseText = styled.div`
  font-size: 1rem;
  line-height: 1.5;
  min-height: 20px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  text-align: center;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 20px;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  text-align: center;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LoadingContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Assessment = () => {
  const navigate = useNavigate();
  const {
    session,
    currentPhase,
    startSession,
    processAudio,
    transcript,
    aiResponse,
    phaseTimeRemaining,
    loading,
    error,
    deviceInfo
  } = useAssessment();

  const [phaseData, setPhaseData] = useState(null);
  const [isPlayingAI, setIsPlayingAI] = useState(false);

  useEffect(() => {
    if (!session) {
      initializeSession();
    }
  }, []);

  useEffect(() => {
    if (currentPhase === 'complete') {
      navigate(`/results/${session?.session_id}`);
    }
  }, [currentPhase, session, navigate]);

  const initializeSession = async () => {
    try {
      await startSession();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleRecordingComplete = async (audioBlob) => {
    try {
      const result = await processAudio(audioBlob);
      
      // Play AI response if available
      if (result?.ai_response) {
        // In a real implementation, you'd play the AI audio here
        console.log('AI Response:', result.ai_response);
      }
    } catch (error) {
      console.error('Failed to process audio:', error);
    }
  };

  const getPhaseInfo = (phase) => {
    const phaseInfo = {
      init: {
        title: 'Initialization',
        description: 'Setting up your assessment session and testing your microphone.',
        instructions: 'Please grant microphone permissions and complete the setup process.',
        showRecorder: false
      },
      warmup: {
        title: 'Warm-up',
        description: 'Let\'s start with a simple introduction to get comfortable.',
        instructions: 'Tell me your first name and where you\'re calling from.',
        showRecorder: true
      },
      interview_q1: {
        title: 'Interview Question 1',
        description: 'Tell me about your typical workday routine.',
        instructions: 'What do you usually do on a typical workday? Mention two tasks.',
        showRecorder: true
      },
      interview_q2: {
        title: 'Interview Question 2',
        description: 'Share your preference about work environment.',
        instructions: 'Do you prefer working from home or office? Why?',
        showRecorder: true
      },
      task: {
        title: 'Task Completion',
        description: 'Complete a specific task or describe a scenario.',
        instructions: deviceInfo.taskType === 'picture' 
          ? 'Describe what you see in this office scene and what might be happening.'
          : 'You\'re calling a customer to reschedule a meeting. Explain the reason, propose two new times, and confirm next steps.',
        showRecorder: true
      },
      listening: {
        title: 'Listening Comprehension',
        description: 'Listen to a short audio clip and answer questions.',
        instructions: 'I\'ll play a short business message. Listen carefully, then answer my question about it.',
        showRecorder: true
      },
      wrap: {
        title: 'Wrap-up',
        description: 'Thank you for completing the assessment.',
        instructions: 'Your results will be available shortly.',
        showRecorder: false
      }
    };

    return phaseInfo[phase] || phaseInfo.init;
  };

  const calculateProgress = () => {
    const phases = ['init', 'warmup', 'interview_q1', 'interview_q2', 'task', 'listening', 'wrap'];
    const currentIndex = phases.indexOf(currentPhase);
    return Math.round(((currentIndex + 1) / phases.length) * 100);
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) {
    return (
      <LoadingOverlay>
        <LoadingContent>
          <div className="spinner"></div>
          <p>Initializing assessment session...</p>
        </LoadingContent>
      </LoadingOverlay>
    );
  }

  const currentPhaseInfo = getPhaseInfo(currentPhase);
  const progress = calculateProgress();

  return (
    <AssessmentContainer>
      <Content>
        <Header>
          <Title>English Assessment</Title>
          <Subtitle>Session ID: {session?.session_id}</Subtitle>
        </Header>

        <MainCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PhaseIndicator 
            currentPhase={currentPhase} 
            progress={progress}
            timeRemaining={phaseTimeRemaining}
          />

          <PhaseContent>
            <PhaseTitle>{currentPhaseInfo.title}</PhaseTitle>
            <PhaseDescription>{currentPhaseInfo.description}</PhaseDescription>
            
            <Instructions>
              <InstructionText>{currentPhaseInfo.instructions}</InstructionText>
            </Instructions>
          </PhaseContent>

          {error && (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          )}

          <InteractionArea>
            {currentPhaseInfo.showRecorder && (
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                isDisabled={loading}
              />
            )}

            {transcript && (
              <TranscriptDisplay>
                <TranscriptLabel>Your Response:</TranscriptLabel>
                <TranscriptText>{transcript}</TranscriptText>
              </TranscriptDisplay>
            )}

            {aiResponse && (
              <AIResponseDisplay>
                <AIResponseLabel>AI Response:</AIResponseLabel>
                <AIResponseText>{aiResponse}</AIResponseText>
                <AIPlayer 
                  text={aiResponse}
                  onPlay={() => setIsPlayingAI(true)}
                  onStop={() => setIsPlayingAI(false)}
                  isPlaying={isPlayingAI}
                />
              </AIResponseDisplay>
            )}
          </InteractionArea>

          {phaseTimeRemaining > 0 && (
            <div>
              <ProgressText>
                Time remaining in this phase: {formatTime(phaseTimeRemaining)}
              </ProgressText>
              <ProgressBar>
                <ProgressFill 
                  progress={(phaseTimeRemaining / 60000) * 100} 
                />
              </ProgressBar>
            </div>
          )}
        </MainCard>
      </Content>

      {loading && (
        <LoadingOverlay>
          <LoadingContent>
            <div className="spinner"></div>
            <p>Processing your response...</p>
          </LoadingContent>
        </LoadingOverlay>
      )}
    </AssessmentContainer>
  );
};

export default Assessment;
