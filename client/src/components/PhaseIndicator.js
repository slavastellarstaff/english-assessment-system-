import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const PhaseContainer = styled.div`
  margin-bottom: 40px;
`;

const ProgressSection = styled.div`
  margin-bottom: 30px;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const ProgressTitle = styled.h3`
  font-size: 1.1rem;
  color: #333;
  margin: 0;
`;

const ProgressPercentage = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
`;

const PhaseSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
`;

const PhaseInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const PhaseIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa'};
  color: ${props => props.isActive ? 'white' : '#666'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  border: 2px solid ${props => props.isActive ? 'transparent' : '#e9ecef'};
  transition: all 0.3s ease;
`;

const PhaseText = styled.div`
  text-align: left;
`;

const PhaseName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
`;

const PhaseStatus = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const TimeRemaining = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
`;

const PhaseIndicator = ({ currentPhase, progress, timeRemaining }) => {
  const phases = [
    { key: 'init', name: 'Setup', icon: '⚙️', status: 'Device check & consent' },
    { key: 'warmup', name: 'Warm-up', icon: '👋', status: 'Introduction' },
    { key: 'interview_q1', name: 'Interview 1', icon: '💼', status: 'Work routine' },
    { key: 'interview_q2', name: 'Interview 2', icon: '🏢', status: 'Work preference' },
    { key: 'task', name: 'Task', icon: '📋', status: 'Scenario completion' },
    { key: 'listening', name: 'Listening', icon: '👂', status: 'Audio comprehension' },
    { key: 'wrap', name: 'Complete', icon: '✅', status: 'Results ready' }
  ];

  const getCurrentPhaseIndex = () => {
    return phases.findIndex(phase => phase.key === currentPhase);
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return '00:00';
    
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPhaseIndex = getCurrentPhaseIndex();

  return (
    <PhaseContainer>
      <ProgressSection>
        <ProgressHeader>
          <ProgressTitle>Assessment Progress</ProgressTitle>
          <ProgressPercentage>{progress}% Complete</ProgressPercentage>
        </ProgressHeader>
        
        <ProgressBar>
          <ProgressFill
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </ProgressBar>
      </ProgressSection>

      <PhaseSection>
        {phases.map((phase, index) => {
          const isActive = phase.key === currentPhase;
          const isCompleted = index < currentPhaseIndex;
          const isUpcoming = index > currentPhaseIndex;
          
          let icon = phase.icon;
          if (isCompleted) icon = '✅';
          if (isUpcoming) icon = '⏳';
          
          return (
            <PhaseInfo key={phase.key}>
              <PhaseIcon isActive={isActive || isCompleted}>
                {icon}
              </PhaseIcon>
              <PhaseText>
                <PhaseName>{phase.name}</PhaseName>
                <PhaseStatus>{phase.status}</PhaseStatus>
              </PhaseText>
            </PhaseInfo>
          );
        })}
      </PhaseSection>

      {timeRemaining > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: 'center', marginTop: '20px' }}
        >
          <TimeRemaining>
            ⏱️ Time remaining: {formatTime(timeRemaining)}
          </TimeRemaining>
        </motion.div>
      )}
    </PhaseContainer>
  );
};

export default PhaseIndicator;
