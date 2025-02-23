"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Minimal checkbox to invert the theme
function InvertToggle({
  inverted,
  onChange,
}: {
  inverted: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="invert-toggle">Invert</Label>
      <input
        id="invert-toggle"
        type="checkbox"
        checked={inverted}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer"
      />
    </div>
  )
}

/**
 * Themes:
 *  - containerNormal/containerInvert => entire page background
 *  - cardNormal/cardInvert => card styling
 */
const themeMap = {
  rose: {
    containerNormal: "bg-rose-50 text-rose-900",
    containerInvert: "bg-rose-900 text-rose-50",
    cardNormal: "bg-rose-100 border border-rose-200 text-rose-900",
    cardInvert: "bg-rose-800 border border-rose-600 text-rose-100",
  },
  zinc: {
    containerNormal: "bg-zinc-50 text-zinc-900",
    containerInvert: "bg-zinc-900 text-zinc-50",
    cardNormal: "bg-zinc-100 border border-zinc-200 text-zinc-900",
    cardInvert: "bg-zinc-800 border border-zinc-600 text-zinc-100",
  },
  blue: {
    containerNormal: "bg-blue-50 text-blue-900",
    containerInvert: "bg-blue-900 text-blue-50",
    cardNormal: "bg-blue-100 border border-blue-200 text-blue-900",
    cardInvert: "bg-blue-800 border border-blue-600 text-blue-100",
  },
  green: {
    containerNormal: "bg-green-50 text-green-900",
    containerInvert: "bg-green-900 text-green-50",
    cardNormal: "bg-green-100 border border-green-200 text-green-900",
    cardInvert: "bg-green-800 border border-green-600 text-green-100",
  },
  purple: {
    containerNormal: "bg-purple-50 text-purple-900",
    containerInvert: "bg-purple-900 text-purple-50",
    cardNormal: "bg-purple-100 border border-purple-200 text-purple-900",
    cardInvert: "bg-purple-800 border border-purple-600 text-purple-100",
  },
}

/** Clamps an integer to ≥ 0. */
function parseIntOrZero(val: string) {
  const parsed = parseInt(val, 10)
  if (isNaN(parsed) || parsed < 0) return 0
  return parsed
}

/** Rounds the (pct% of total) to get attended, and computes missed. */
function computeFromPct(total: number, pct: number) {
  const attended = Math.round((pct / 100) * total)
  const missed = Math.max(0, total - attended)
  return { attended, missed }
}

/** Computes how many lectures one can skip (maximum) while still meeting `requiredAttendance`. */
function calcSkipAllowed(total: number, requiredPct: number) {
  const needed = Math.ceil((requiredPct / 100) * total)
  const allowed = total - needed
  return allowed < 0 ? 0 : allowed
}

/** Sums the first `n` days from Monday→Saturday (0..5), given the daily schedule. */
function sumFirstNDays(schedule: Record<string, number>, days: number) {
  // We'll store them in an array in Mon->Sat order
  const dayKeys = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  let sum = 0
  for (let i = 0; i < days; i++) {
    if (i < dayKeys.length) {
      sum += schedule[dayKeys[i]] ?? 0
    }
  }
  return sum
}

export default function AttendanceCalculator() {
  // ====== Theme/Invert ======
  const [theme, setTheme] = useState<keyof typeof themeMap>("rose")
  const [inverted, setInverted] = useState(false)

  // ====== Global Settings ======
  const [requiredAttendance, setRequiredAttendance] = useState(85)
  const [monthsInTerm, setMonthsInTerm] = useState(3)

  // ====== Daily schedule (Mon–Sat) ======
  const [schedule, setSchedule] = useState({
    Monday: 3,
    Tuesday: 3,
    Wednesday: 3,
    Thursday: 3,
    Friday: 3,
    Saturday: 0,
  })

  // We'll compute these automatically
  const [weekTotal, setWeekTotal] = useState(0)
  const [monthTotal, setMonthTotal] = useState(0)
  const [termTotal, setTermTotal] = useState(0)

  // ====== Month Info ======
  const [monthNumber, setMonthNumber] = useState("1")
  const [monthWeeksPassed, setMonthWeeksPassed] = useState("3")
  const [monthDaysPassed, setMonthDaysPassed] = useState("0")

  // The user’s typed monthly attendance % => numeric monthPct
  const [monthAttendanceStr, setMonthAttendanceStr] = useState("85")
  const [monthPct, setMonthPct] = useState(85)
  const [monthAttendedCalc, setMonthAttendedCalc] = useState(0)
  const [monthMissedCalc, setMonthMissedCalc] = useState(0)

  // ====== Term Info ======
  const [termMonthsPassed, setTermMonthsPassed] = useState("0")
  const [termWeeksPassed, setTermWeeksPassed] = useState("0")
  const [termDaysPassed, setTermDaysPassed] = useState("0")
  // The user’s typed term attendance
  const [termAttStr, setTermAttStr] = useState("0")
  const [termPct, setTermPct] = useState(0)
  const [termAttendedCalc, setTermAttendedCalc] = useState(0)
  const [termMissedCalc, setTermMissedCalc] = useState(0)

  /* ==================== Compute Weekly / Monthly / Term totals from daily schedule ===================== */
  useEffect(() => {
    const sumDaily = Object.values(schedule).reduce((a, b) => a + b, 0)
    setWeekTotal(sumDaily)          // total lectures in a single full week
    const monthly = sumDaily * 4
    setMonthTotal(monthly)          // total lectures in a full month (4 weeks)
    setTermTotal(monthly * monthsInTerm) // if we had a full term
  }, [schedule, monthsInTerm])

  /* ==================== Monthly Calculation ==================== */
  // Whenever the user changes the typed monthly attendance string => parse & clamp
  useEffect(() => {
    const val = parseFloat(monthAttendanceStr)
    if (!isNaN(val)) {
      const clamped = Math.min(Math.max(val, 0), 100)
      setMonthPct(clamped)
    }
  }, [monthAttendanceStr])

  // Recalculate partial monthly total => then attended, missed
  useEffect(() => {
    // partialMonthTotal = (weeks passed × weeklyTotal) + sumFirstNDays( schedule, daysPassed )
    const wPassed = parseIntOrZero(monthWeeksPassed)
    const dPassed = parseIntOrZero(monthDaysPassed)

    const partialMonthTotal = wPassed * weekTotal + sumFirstNDays(schedule, dPassed)
    const { attended, missed } = computeFromPct(partialMonthTotal, monthPct)

    setMonthAttendedCalc(attended)
    setMonthMissedCalc(missed)
  }, [monthWeeksPassed, monthDaysPassed, monthPct, weekTotal, schedule])

  /* ==================== Term Calculation ==================== */
  // Whenever the user changes the typed term attendance string => parse & clamp
  useEffect(() => {
    const val = parseFloat(termAttStr)
    if (!isNaN(val)) {
      const clamped = Math.min(Math.max(val, 0), 100)
      setTermPct(clamped)
    }
  }, [termAttStr])

  // Recompute partialTermTotal => then attended, missed
  useEffect(() => {
    // partialTermTotal = (months fully passed × monthTotal) + (termWeeksPassed × weekTotal) + sumFirstNDays(schedule, termDaysPassed)
    const mPassed = parseIntOrZero(termMonthsPassed)
    const wPassed = parseIntOrZero(termWeeksPassed)
    const dPassed = parseIntOrZero(termDaysPassed)

    // full months done:
    const fullMonthsLectures = mPassed * monthTotal
    // partial next month (weeks + days)
    const partialFromWeeks = wPassed * weekTotal
    const partialFromDays = sumFirstNDays(schedule, dPassed)
    const partialTermTotal = fullMonthsLectures + partialFromWeeks + partialFromDays

    const { attended, missed } = computeFromPct(partialTermTotal, termPct)
    setTermAttendedCalc(attended)
    setTermMissedCalc(missed)
  }, [termMonthsPassed, termWeeksPassed, termDaysPassed, termPct, monthTotal, weekTotal, schedule])

  // Container + card classes for theming
  const containerClass = inverted
    ? themeMap[theme].containerInvert
    : themeMap[theme].containerNormal
  const cardClass = inverted
    ? themeMap[theme].cardInvert
    : themeMap[theme].cardNormal

  return (
    <TooltipProvider>
      <div className={`min-h-screen w-full p-4 ${containerClass}`}>
        {/* Top bar: heading + theme controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold">Attendance Calculator</h1>
          <div className="flex flex-wrap items-center gap-4">
            {/* Theme dropdown */}
            <div className="flex items-center gap-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={theme}
                onValueChange={(val) => setTheme(val as keyof typeof themeMap)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rose">Rose</SelectItem>
                  <SelectItem value="zinc">Zinc</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <InvertToggle inverted={inverted} onChange={setInverted} />
          </div>
        </div>

        {/* Global Settings */}
        <Card className={`max-w-4xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Global Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required attendance */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="requiredAttendance">
                    Required Attendance %
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        If actual attendance is below this number, we color the bar red; else green.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="requiredAttendance"
                  type="number"
                  value={requiredAttendance}
                  onChange={(e) => {
                    const val = parseIntOrZero(e.target.value)
                    setRequiredAttendance(val > 100 ? 100 : val)
                  }}
                />
              </div>

              {/* Months in Term */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="monthsInTerm">Months in Term</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Used to figure out a <strong>full</strong> term total = monthTotal × monthsInTerm.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="monthsInTerm"
                  type="number"
                  value={monthsInTerm}
                  onChange={(e) => setMonthsInTerm(parseIntOrZero(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily schedule -> for weekly, monthly, and partial calculations */}
        <Card className={`max-w-4xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Daily Schedule (Mon–Sat)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter how many lectures for each day. If zero, that day is off.
              <br />
              We'll sum them for a weekly total (and multiply by 4 for monthly).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(schedule).map(([day, val]) => (
                <div key={day} className="space-y-1">
                  <Label htmlFor={day}>{day}</Label>
                  <Input
                    id={day}
                    type="number"
                    value={val}
                    onChange={(e) => {
                      const newVal = parseIntOrZero(e.target.value)
                      setSchedule((prev) => ({ ...prev, [day]: newVal }))
                    }}
                  />
                </div>
              ))}
            </div>
            {/* Show computed totals */}
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>Weekly Total:</strong> {weekTotal}
              </p>
              <p>
                <strong>Monthly Total (4×week):</strong> {monthTotal}
              </p>
              <p>
                <strong>Term Total (full):</strong> {termTotal}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Month portion */}
        <Card className={`max-w-4xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Month Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Month # */}
              <div className="space-y-1">
                <Label htmlFor="monthNumber">Month #</Label>
                <Input
                  id="monthNumber"
                  type="text"
                  value={monthNumber}
                  onChange={(e) => setMonthNumber(e.target.value)}
                />
              </div>

              {/* Weeks Passed in Current Month */}
              <div className="space-y-1">
                <Label htmlFor="monthWeeksPassed">Weeks Passed</Label>
                <Input
                  id="monthWeeksPassed"
                  type="text"
                  value={monthWeeksPassed}
                  onChange={(e) => setMonthWeeksPassed(e.target.value)}
                />
              </div>

              {/* Days Passed in Partial Next Week */}
              <div className="space-y-1">
                <Label htmlFor="monthDaysPassed">Days Passed</Label>
                <Input
                  id="monthDaysPassed"
                  type="text"
                  value={monthDaysPassed}
                  onChange={(e) => setMonthDaysPassed(e.target.value)}
                />
              </div>

              {/* Current Monthly Attendance % */}
              <div className="space-y-1">
                <Label htmlFor="monthAttendanceStr">
                  Current Monthly Attendance %
                </Label>
                <Input
                  id="monthAttendanceStr"
                  type="text"
                  value={monthAttendanceStr}
                  onChange={(e) => setMonthAttendanceStr(e.target.value)}
                />
              </div>
            </div>

            <MonthDisplay
              monthNo={monthNumber}
              attendancePct={monthPct}
              attended={monthAttendedCalc}
              missed={monthMissedCalc}
              required={requiredAttendance}
            />
          </CardContent>
        </Card>

        {/* Term portion (optional) */}
        <Card className={`max-w-4xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Term Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This section is optional if you want a broader “Term” calculation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="termMonthsPassed">Months Passed</Label>
                <Input
                  id="termMonthsPassed"
                  type="text"
                  value={termMonthsPassed}
                  onChange={(e) => setTermMonthsPassed(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="termWeeksPassed">Weeks Passed</Label>
                <Input
                  id="termWeeksPassed"
                  type="text"
                  value={termWeeksPassed}
                  onChange={(e) => setTermWeeksPassed(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="termDaysPassed">Days Passed</Label>
                <Input
                  id="termDaysPassed"
                  type="text"
                  value={termDaysPassed}
                  onChange={(e) => setTermDaysPassed(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="termAttStr">Current Term Attendance %</Label>
                <Input
                  id="termAttStr"
                  type="text"
                  value={termAttStr}
                  onChange={(e) => setTermAttStr(e.target.value)}
                />
              </div>
            </div>
            <TermDisplay
              termPct={termPct}
              attended={termAttendedCalc}
              missed={termMissedCalc}
              required={requiredAttendance}
            />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

/* ================== Month Display (Attended, Missed, etc.) ================== */
function MonthDisplay({
  monthNo,
  attendancePct,
  attended,
  missed,
  required,
}: {
  monthNo: string
  attendancePct: number
  attended: number
  missed: number
  required: number
}) {
  const below = attendancePct < required
  const barColor = below ? "bg-red-500" : "bg-green-500"
  const widthStr = `${Math.min(attendancePct, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`month-${attendancePct}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <AlertDescription>
            <strong>Month {monthNo} Attendance:</strong>{" "}
            {attendancePct.toFixed(2)}%
            <br />
            <span>Attended {attended} | Missed {missed}</span>
          </AlertDescription>
          <div className="w-full h-3 bg-gray-300 rounded">
            <motion.div
              className={`h-full rounded ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: widthStr }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}

/* ================== Term Display (Attended, Missed, etc.) ================== */
function TermDisplay({
  termPct,
  attended,
  missed,
  required,
}: {
  termPct: number
  attended: number
  missed: number
  required: number
}) {
  const below = termPct < required
  const barColor = below ? "bg-red-500" : "bg-green-500"
  const widthStr = `${Math.min(termPct, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`term-${termPct}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <AlertDescription>
            <strong>Term Attendance:</strong> {termPct.toFixed(2)}%
            <br />
            <span>Attended {attended} | Missed {missed}</span>
          </AlertDescription>
          <div className="w-full h-3 bg-gray-300 rounded">
            <motion.div
              className={`h-full rounded ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: widthStr }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}
