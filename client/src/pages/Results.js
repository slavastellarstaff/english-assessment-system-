import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAssessment } from '../context/AssessmentContext';

const ResultsContainer = styled.div`
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

const ResultsCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 30px;
`;

const CEFRDisplay = styled.div`
  text-align: center;
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
`;

const CEFRLevel = styled.div`
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
`;

const CEFRDescription = styled.div`
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 20px;
`;

const CEFRConfidence = styled.div`
  font-size: 1rem;
  opacity: 0.8;
`;

const ScoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ScoreCard = styled(motion.div)`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    border-color: #667eea;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
  }
`;

const ScoreTitle = styled.h3`
  font-size: 1rem;
  color: #333;
  margin-bottom: 15px;
  font-weight: 600;
`;

const ScoreValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 10px;
`;

const ScoreBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
`;

const ScoreBarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  width: ${props => props.score}%;
  transition: width 0.8s ease;
`;

const ScoreLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const RationaleSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  border-left: 4px solid #667eea;
`;

const RationaleTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 15px;
  font-weight: 600;
`;

const RationaleText = styled.p`
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
`;

const SignalsSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
`;

const SignalsTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
`;

const SignalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const SignalItem = styled.div`
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const SignalValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 5px;
`;

const SignalLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const Actions = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled(Link)`
  display: inline-block;
  padding: 15px 30px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: #f8f9fa;
    color: #333;
    border: 2px solid #e9ecef;
    
    &:hover {
      border-color: #667eea;
      color: #667eea;
    }
  }
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

const Results = () => {
  const { sessionId } = useParams();
  const { getResults } = useAssessment();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await getResults(sessionId);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCEFRDescription = (level) => {
    const descriptions = {
      'A1': 'Beginner - Can understand and use familiar everyday expressions',
      'A2': 'Elementary - Can communicate in simple and routine tasks',
      'B1': 'Intermediate - Can deal with most situations likely to arise',
      'B2': 'Upper Intermediate - Can interact with fluency and spontaneity',
      'C1': 'Advanced - Can express ideas fluently and spontaneously',
      'C2': 'Mastery - Can understand virtually everything heard or read'
    };
    return descriptions[level] || 'Level description not available';
  };

  const getScoreColor = (score) => {
    if (score >= 4) return '#28a745';
    if (score >= 3) return '#ffc107';
    return '#dc3545';
  };

  if (loading) {
    return (
      <LoadingOverlay>
        <LoadingContent>
          <div className="spinner"></div>
          <p>Loading your assessment results...</p>
        </LoadingContent>
      </LoadingOverlay>
    );
  }

  if (error || !results) {
    return (
      <ResultsContainer>
        <Content>
          <Header>
            <Title>Results Not Available</Title>
            <Subtitle>Unable to load assessment results</Subtitle>
          </Header>
          
          <ResultsCard>
            <p style={{ textAlign: 'center', color: '#666' }}>
              {error || 'Results could not be loaded. Please try again later.'}
            </p>
            
            <Actions>
              <ActionButton to="/" className="primary">
                Return Home
              </ActionButton>
            </Actions>
          </ResultsCard>
        </Content>
      </ResultsContainer>
    );
  }

  const { level_cefr, scores, confidence, rationale, total_score, signals } = results;

  return (
    <ResultsContainer>
      <Content>
        <Header>
          <Title>Assessment Results</Title>
          <Subtitle>Session ID: {sessionId}</Subtitle>
        </Header>

        <ResultsCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CEFRDisplay>
            <CEFRLevel>{level_cefr}</CEFRLevel>
            <CEFRDescription>{getCEFRDescription(level_cefr)}</CEFRDescription>
            <CEFRConfidence>
              Confidence: {Math.round(confidence * 100)}%
            </CEFRConfidence>
          </CEFRDisplay>

          <ScoresGrid>
            {Object.entries(scores).map(([dimension, score]) => {
              if (typeof score === 'number' && dimension !== 'automated_signals') {
                return (
                  <ScoreCard
                    key={dimension}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <ScoreTitle>
                      {dimension.charAt(0).toUpperCase() + dimension.slice(1).replace('_', ' ')}
                    </ScoreTitle>
                    <ScoreValue style={{ color: getScoreColor(score) }}>
                      {score}/5
                    </ScoreValue>
                    <ScoreBar>
                      <ScoreBarFill score={(score / 5) * 100} />
                    </ScoreBar>
                    <ScoreLabel>
                      {score >= 4 ? 'Excellent' : score >= 3 ? 'Good' : score >= 2 ? 'Fair' : 'Needs Improvement'}
                    </ScoreLabel>
                  </ScoreCard>
                );
              }
              return null;
            })}
          </ScoresGrid>

          <RationaleSection>
            <RationaleTitle>Assessment Rationale</RationaleTitle>
            <RationaleText>{rationale}</RationaleText>
          </RationaleSection>

          {signals && Object.keys(signals).length > 0 && (
            <SignalsSection>
              <SignalsTitle>Performance Metrics</SignalsTitle>
              <SignalsGrid>
                {Object.entries(signals).map(([key, value]) => {
                  if (typeof value === 'number' && key !== 'total_duration') {
                    return (
                      <SignalItem key={key}>
                        <SignalValue>{value}</SignalValue>
                        <SignalLabel>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SignalLabel>
                      </SignalItem>
                    );
                  }
                  return null;
                })}
              </SignalsGrid>
            </SignalsSection>
          )}

          <Actions>
            <ActionButton to="/" className="secondary">
              Return Home
            </ActionButton>
            <ActionButton to="/assessment" className="primary">
              Take Another Test
            </ActionButton>
          </Actions>
        </ResultsCard>
      </Content>
    </ResultsContainer>
  );
};

export default Results;
