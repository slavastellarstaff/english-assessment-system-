import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAssessment } from '../context/AssessmentContext';

const RecorderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
`;

const RecordButton = styled.button`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isRecording ? '#dc3545' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const AudioVisualizer = styled.div`
  width: 200px;
  height: 60px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
`;

const AudioBar = styled.div`
  width: 8px;
  background: #667eea;
  border-radius: 4px;
  transition: height 0.1s ease;
  height: ${props => props.height}px;
`;

const StatusText = styled.div`
  font-size: 16px;
  color: #666;
  text-align: center;
  min-height: 24px;
`;

const Timer = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  font-family: monospace;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const ControlButton = styled.button`
  padding: 8px 16px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    color: #667eea;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const VoiceRecorder = ({ onRecordingComplete, isDisabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [error, setError] = useState(null);
  
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  
  const { dispatch } = useAssessment();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const startRecording = async () => {
    try {
      setError(null);
      setAudioChunks([]);
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      // Set up audio analysis
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Start audio visualization
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      // Set up MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start audio visualization
      updateAudioLevel();
      
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAudioBars = () => {
    const bars = [];
    const barCount = 20;
    const maxHeight = 40;
    
    for (let i = 0; i < barCount; i++) {
      const height = isRecording ? Math.random() * maxHeight * (audioLevel / 255) + 5 : 5;
      bars.push(
        <AudioBar 
          key={i} 
          height={height} 
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      );
    }
    
    return bars;
  };

  return (
    <RecorderContainer>
      <RecordButton
        onClick={isRecording ? stopRecording : startRecording}
        isRecording={isRecording}
        disabled={isDisabled}
      >
        {isRecording ? '⏹️' : '🎤'}
      </RecordButton>
      
      <AudioVisualizer>
        {getAudioBars()}
      </AudioVisualizer>
      
      <StatusText>
        {error ? (
          <span style={{ color: '#dc3545' }}>{error}</span>
        ) : isRecording ? (
          'Recording... Speak clearly into your microphone'
        ) : (
          'Click the microphone to start recording'
        )}
      </StatusText>
      
      {isRecording && (
        <Timer>{formatTime(recordingTime)}</Timer>
      )}
      
      <Controls>
        {isRecording && (
          <ControlButton onClick={stopRecording}>
            Stop Recording
          </ControlButton>
        )}
      </Controls>
    </RecorderContainer>
  );
};

export default VoiceRecorder;
