import { useState, useEffect } from 'react'

interface TimeLeft {
  days: number
  hrs: number
  mins: number
  secs: number
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    days: Math.floor(diff / 86_400_000),
    hrs: Math.floor((diff % 86_400_000) / 3_600_000),
    mins: Math.floor((diff % 3_600_000) / 60_000),
    secs: Math.floor((diff % 60_000) / 1_000),
  }
}

function Pad({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-black tabular-nums leading-none">
        {String(n).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-white/60 mt-1">{label}</span>
    </div>
  )
}

export default function RaceCountdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <div className="flex items-start gap-4">
      <Pad n={timeLeft.days} label="Days" />
      <Pad n={timeLeft.hrs} label="Hrs" />
      <Pad n={timeLeft.mins} label="Mins" />
      <Pad n={timeLeft.secs} label="Secs" />
    </div>
  )
}
