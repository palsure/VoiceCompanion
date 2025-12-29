import './AnimatedLogo.css'

interface AnimatedLogoProps {
  size?: number
  className?: string
}

const AnimatedLogo = ({ size = 96, className = '' }: AnimatedLogoProps) => {
  const centerX = size / 2
  const centerY = size / 2
  const circleRadius = size * 0.2
  const waveCount = 8
  
  return (
    <div className={`animated-logo ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
        {/* Central blue gradient circle */}
        <defs>
          <radialGradient id="blueGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#4169E1" />
          </radialGradient>
        </defs>
        
        {/* Animated sound waves */}
        {Array.from({ length: waveCount }).map((_, i) => {
          const waveRadius = circleRadius + (i + 1) * (size * 0.08)
          const delay = i * 0.15
          return (
            <circle
              key={`wave-${i}`}
              cx={centerX}
              cy={centerY}
              r={waveRadius}
              fill="none"
              stroke="#667eea"
              strokeWidth={Math.max(1, size * 0.01)}
              opacity={0.3 - (i * 0.03)}
              className="sound-wave"
              style={{
                animationDelay: `${delay}s`,
              }}
            />
          )
        })}
        
        {/* Central blue circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={circleRadius}
          fill="url(#blueGradient)"
        />
        
        {/* White microphone icon */}
        <g transform={`translate(${centerX}, ${centerY})`}>
          {/* Microphone body */}
          <rect
            x={-size * 0.06}
            y={-size * 0.08}
            width={size * 0.12}
            height={size * 0.16}
            rx={size * 0.02}
            fill="white"
          />
          {/* Microphone stand */}
          <line
            x1={0}
            y1={size * 0.08}
            x2={0}
            y2={size * 0.12}
            stroke="white"
            strokeWidth={size * 0.015}
            strokeLinecap="round"
          />
          {/* Microphone base */}
          <ellipse
            cx={0}
            cy={size * 0.12}
            rx={size * 0.05}
            ry={size * 0.01}
            fill="white"
          />
        </g>
      </svg>
    </div>
  )
}

export default AnimatedLogo

