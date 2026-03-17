interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
}

export function CircularProgress({ percentage, size = 50, strokeWidth = 3 }: CircularProgressProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedPercentage / 100) * circumference
  
  // Determine color based on percentage
  // Red (0%) -> Yellow (50%) -> Green (100%)
  let color = '#ef4444' // red-500
  if (clampedPercentage >= 50) {
    // Interpolate between yellow and green for 50-100%
    const ratio = (clampedPercentage - 50) / 50
    const red = Math.floor(234 - (234 - 34) * ratio)
    const green = Math.floor(179 + (119 - 179) * ratio)
    const blue = Math.floor(56 - (51 - 56) * ratio)
    color = `rgb(${red}, ${green}, ${blue})`
  } else if (clampedPercentage > 0) {
    // Interpolate between red and yellow for 0-50%
    const ratio = clampedPercentage / 50
    const red = 239
    const green = Math.floor(68 + (179 - 68) * ratio)
    const blue = Math.floor(68 + (56 - 68) * ratio)
    color = `rgb(${red}, ${green}, ${blue})`
  }

  return (
    <div className="flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{
          background: 'transparent',
        }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease',
          }}
        />
        {/* Percentage text inside circle */}
        <g transform={`rotate(90 ${size / 2} ${size / 2})`}>
          <text
            x={size / 2}
            y={size / 2 + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-semibold"
            fontSize={size * 0.3}
            fill="#374151"
            style={{
              pointerEvents: 'none',
            }}
          >
            {Math.round(clampedPercentage)}%
          </text>
        </g>
      </svg>
    </div>
  )
}
