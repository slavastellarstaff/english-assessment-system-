import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const PlayerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const PlayButton = styled(motion.button)`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isPlaying ? '#dc3545' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    background: ${props => props.isPlaying ? '#c82333' : 'rgba(255, 255, 255, 0.3)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PlayerInfo = styled.div`
  flex: 1;
  color: white;
`;

const PlayerTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 5px;
  opacity: 0.9;
`;

const PlayerStatus = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: white;
  border-radius: 2px;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const VolumeIcon = styled.div`
  font-size: 1rem;
  opacity: 0.8;
  cursor: pointer;
  
  &:hover {
    opacity: 1;
  }
`;

const VolumeSlider = styled.input`
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

const AIPlayer = ({ text, onPlay, onStop, isPlaying }) => {
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // For MVP, this is a placeholder component
  // In production, you'd integrate with ElevenLabs TTS API to get actual audio
  
  const handlePlayPause = () => {
    if (isPlaying) {
      handleStop();
    } else {
      handlePlay();
    }
  };

  const handlePlay = () => {
    // Simulate AI audio playback for MVP
    onPlay();
    
    // Simulate progress updates
    setCurrentTime(0);
    setDuration(5000); // 5 seconds for demo
    
    progressIntervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= duration) {
          handleStop();
          return 0;
        }
        return prev + 100;
      });
    }, 100);
  };

  const handleStop = () => {
    onStop();
    setCurrentTime(0);
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerContainer>
      <PlayButton
        onClick={handlePlayPause}
        isPlaying={isPlaying}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </PlayButton>
      
      <PlayerInfo>
        <PlayerTitle>AI Response Audio</PlayerTitle>
        <PlayerStatus>
          {isPlaying ? 'Playing...' : 'Ready to play'}
        </PlayerStatus>
        
        <ProgressBar>
          <ProgressFill
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.1 }}
          />
        </ProgressBar>
        
        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '5px' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </PlayerInfo>
      
      <VolumeControl>
        <VolumeIcon onClick={toggleMute}>
          {isMuted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
        </VolumeIcon>
        
        <VolumeSlider
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
        />
      </VolumeControl>
    </PlayerContainer>
  );
};

export default AIPlayer;
