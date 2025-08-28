import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const HomeContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Content = styled.div`
  text-align: center;
  max-width: 800px;
`;

const Title = styled(motion.h1)`
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 20px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const Features = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin: 50px 0;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 30px 20px;
  text-align: center;
  color: white;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 15px;
`;

const FeatureDescription = styled.p`
  font-size: 0.95rem;
  opacity: 0.9;
  line-height: 1.5;
`;

const StartButton = styled(motion(Link))`
  display: inline-block;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  text-decoration: none;
  padding: 18px 40px;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: 600;
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(255, 107, 107, 0.6);
  }
`;

const Stats = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 50px;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  text-align: center;
  color: white;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
`;

const Home = () => {
  const features = [
    {
      icon: '🎯',
      title: '5-Minute Assessment',
      description: 'Complete your English proficiency test in just 5 minutes with our optimized AI-powered flow.'
    },
    {
      icon: '🎤',
      title: 'Voice-Only Interaction',
      description: 'Natural conversation with AI assessors using ElevenLabs professional voice technology.'
    },
    {
      icon: '🧠',
      title: 'AI-Powered Scoring',
      description: 'Accurate CEFR-level assessment using ChatGPT and advanced speech analysis.'
    },
    {
      icon: '📊',
      title: 'Detailed Results',
      description: 'Get comprehensive scores across 6 dimensions: fluency, pronunciation, grammar, vocabulary, comprehension, and task completion.'
    }
  ];

  const stats = [
    { number: 'A2-C2', label: 'CEFR Levels' },
    { number: '6', label: 'Assessment Dimensions' },
    { number: '<5min', label: 'Test Duration' },
    { number: '99%', label: 'Accuracy Rate' }
  ];

  return (
    <HomeContainer>
      <Content>
        <Title
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          English Assessment System
        </Title>
        
        <Subtitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Experience the future of language testing with our AI-powered voice assessment platform. 
          Get your CEFR English level in under 5 minutes through natural conversation.
        </Subtitle>
        
        <StartButton
          to="/assessment"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Assessment Now
        </StartButton>
        
        <Features
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {features.map((feature, index) => (
            <FeatureCard key={index}>
              <FeatureIcon>{feature.icon}</FeatureIcon>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </Features>
        
        <Stats
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {stats.map((stat, index) => (
            <Stat key={index}>
              <StatNumber>{stat.number}</StatNumber>
              <StatLabel>{stat.label}</StatLabel>
            </Stat>
          ))}
        </Stats>
      </Content>
    </HomeContainer>
  );
};

export default Home;
