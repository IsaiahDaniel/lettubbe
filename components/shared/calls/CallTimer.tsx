import React, { useState, useEffect } from 'react';
import { Text, TextStyle } from 'react-native';

interface CallTimerProps {
  startTime?: Date;
  style?: TextStyle;
}

const CallTimer: React.FC<CallTimerProps> = ({ startTime, style }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    // Calculate initial elapsed time
    const initialElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    setElapsedTime(initialElapsed);

    // Update timer every second
    const intervalId = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime]);

  if (!startTime) {
    return <Text style={style}>00:00</Text>;
  }

  // Format time as mm:ss
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return <Text style={style}>{formattedTime}</Text>;
};

export default CallTimer;