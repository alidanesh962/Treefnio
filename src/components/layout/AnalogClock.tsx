import React, { useState, useEffect } from 'react';

interface ClockProps {
  size?: number;
}

const AnalogClock: React.FC<ClockProps> = ({ size = 200 }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const radius = size / 2;
  const center = radius;
  const strokeWidth = size / 50;

  // Calculate hand angles
  const secondAngle = (time.getSeconds() * 6) - 90;
  const minuteAngle = (time.getMinutes() * 6 + time.getSeconds() * 0.1) - 90;
  const hourAngle = (time.getHours() % 12 * 30 + time.getMinutes() * 0.5) - 90;

  return (
    <svg width={size} height={size} className="rounded-full bg-white dark:bg-gray-800 shadow-lg">
      {/* Clock face */}
      <circle
        cx={center}
        cy={center}
        r={radius - strokeWidth}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-gray-700"
      />

      {/* Hour markers */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const markerLength = size / 15;
        const x1 = center + (radius - markerLength - strokeWidth) * Math.cos(angle);
        const y1 = center + (radius - markerLength - strokeWidth) * Math.sin(angle);
        const x2 = center + (radius - strokeWidth) * Math.cos(angle);
        const y2 = center + (radius - strokeWidth) * Math.sin(angle);

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-400 dark:text-gray-500"
          />
        );
      })}

      {/* Hour hand */}
      <line
        x1={center}
        y1={center}
        x2={center + radius * 0.5 * Math.cos(hourAngle * Math.PI / 180)}
        y2={center + radius * 0.5 * Math.sin(hourAngle * Math.PI / 180)}
        stroke="currentColor"
        strokeWidth={strokeWidth * 1.5}
        strokeLinecap="round"
        className="text-blue-600 dark:text-blue-400"
      />

      {/* Minute hand */}
      <line
        x1={center}
        y1={center}
        x2={center + radius * 0.7 * Math.cos(minuteAngle * Math.PI / 180)}
        y2={center + radius * 0.7 * Math.sin(minuteAngle * Math.PI / 180)}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="text-blue-500 dark:text-blue-300"
      />

      {/* Second hand */}
      <line
        x1={center}
        y1={center}
        x2={center + radius * 0.8 * Math.cos(secondAngle * Math.PI / 180)}
        y2={center + radius * 0.8 * Math.sin(secondAngle * Math.PI / 180)}
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.5}
        strokeLinecap="round"
        className="text-red-500"
      />

      {/* Center dot */}
      <circle
        cx={center}
        cy={center}
        r={strokeWidth * 1.5}
        fill="currentColor"
        className="text-blue-600 dark:text-blue-400"
      />
    </svg>
  );
};

export default AnalogClock;