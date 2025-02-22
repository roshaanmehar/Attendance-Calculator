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
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { InfoIcon, HelpCircle } from "lucide-react"
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
 * Themes: containerNormal/containerInvert => page background
 *         cardNormal/cardInvert => card styling
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

// Helpers
function parseIntOrZero(val: string) {
  const parsed = parseInt(val, 10)
  if (isNaN(parsed) || parsed < 0) return 0
  return parsed
}
function parseFloatClamped(str: string, min = 0, max = 100) {
  const parsed = parseFloat(str)
  if (isNaN(parsed)) return min
  return Math.min(Math.max(parsed, min), max)
}

/** 
 * Returns an object with:
 *   attended => round( (attendance%/100)*total )
 *   missed => total - attended
 */
function computeFromPercentage(
  total: number,
  attendancePct: number
): { attended: number; missed: number } {
  const attended = Math.round((attendancePct / 100) * total)
  const missed = total - attended
  return { attended, missed }
}

export default function AttendanceCalculator() {
  // Theming
  const [theme, setTheme] = useState<keyof typeof themeMap>("rose")
  const [inverted, setInverted] = useState(false)

  // Required attendance (used for progress bar color-coded)
  const [requiredAttendance, setRequiredAttendance] = useState(85)

  // ========== DAY ==========
  const [dayNumber, setDayNumber] = useState(1)
  const [dayTotal, setDayTotal] = useState(5) // e.g. 5 lectures today
  const [dayAttended, setDayAttended] = useState(0)
  const [dayMissed, setDayMissed] = useState(0)
  const [dayPerc, setDayPerc] = useState(0)

  // ========== WEEK ==========
  const [weekNumber, setWeekNumber] = useState(1)
  const [weekTotal, setWeekTotal] = useState(25) // e.g. 25 lectures in the entire week
  const [weekAttendancePct, setWeekAttendancePct] = useState(0)
  const [weekAttended, setWeekAttended] = useState(0)
  const [weekMissed, setWeekMissed] = useState(0)

  // ========== MONTH ==========
  const [monthNumber, setMonthNumber] = useState(1)
  const [monthTotal, setMonthTotal] = useState(100) // e.g. 100 lectures in the entire month
  const [monthAttendancePct, setMonthAttendancePct] = useState(0)
  const [monthAttended, setMonthAttended] = useState(0)
  const [monthMissed, setMonthMissed] = useState(0)

  // ========== TERM ==========
  const [termMonthsPassed, setTermMonthsPassed] = useState(0) // informational
  const [termWeeksPassed, setTermWeeksPassed] = useState(0) // informational
  const [termDaysPassed, setTermDaysPassed] = useState(0) // informational
  const [termTotal, setTermTotal] = useState(300) // e.g. total lectures in the entire term
  const [termAttendancePct, setTermAttendancePct] = useState(0)
  const [termAttended, setTermAttended] = useState(0)
  const [termMissed, setTermMissed] = useState(0)

  // ========== Effects ==========

  // Day: user sets total and attended => we compute missed + % 
  useEffect(() => {
    const missed = Math.max(0, dayTotal - dayAttended)
    setDayMissed(missed)
    const dayRatio = dayTotal > 0 ? (dayAttended / dayTotal) * 100 : 0
    setDayPerc(dayRatio)
  }, [dayTotal, dayAttended])

  // Week: user sets total + attendance% => we compute attended + missed
  useEffect(() => {
    const { attended, missed } = computeFromPercentage(
      weekTotal,
      weekAttendancePct
    )
    setWeekAttended(attended)
    setWeekMissed(missed)
  }, [weekTotal, weekAttendancePct])

  // Month: user sets total + attendance% => we compute attended + missed
  useEffect(() => {
    const { attended, missed } = computeFromPercentage(
      monthTotal,
      monthAttendancePct
    )
    setMonthAttended(attended)
    setMonthMissed(missed)
  }, [monthTotal, monthAttendancePct])

  // Term: user sets total + attendance% => we compute attended + missed
  useEffect(() => {
    const { attended, missed } = computeFromPercentage(
      termTotal,
      termAttendancePct
    )
    setTermAttended(attended)
    setTermMissed(missed)
  }, [termTotal, termAttendancePct])

  // ========== Progress Bar Coloring ==========

  function progressBarColor(currentPerc: number) {
    return currentPerc < requiredAttendance ? "bg-red-500" : "bg-green-500"
  }

  // container + card theming
  const containerClass = inverted
    ? themeMap[theme].containerInvert
    : themeMap[theme].containerNormal
  const cardClass = inverted
    ? themeMap[theme].cardInvert
    : themeMap[theme].cardNormal

  return (
    <TooltipProvider>
      <div className={`min-h-screen w-full p-6 ${containerClass}`}>
        {/* Top bar with heading and theme controls */}
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

            {/* Invert */}
            <InvertToggle inverted={inverted} onChange={setInverted} />
          </div>
        </div>

        {/* Required attendance */}
        <Card className={`max-w-3xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Global Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="requiredAttendance">Required Attendance %</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Set the target attendance percentage you want to compare
                      against.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="requiredAttendance"
                type="number"
                value={requiredAttendance}
                onChange={(e) => {
                  const val = parseFloatClamped(e.target.value)
                  setRequiredAttendance(val)
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* DAY */}
        <Card className={`max-w-3xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Day Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Day # */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="day-number">Day #</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Which day is it? (reference only)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="day-number"
                  type="number"
                  value={dayNumber}
                  onChange={(e) => setDayNumber(parseIntOrZero(e.target.value))}
                />
              </div>

              {/* Total Lectures */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="day-total">Total Lectures</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many lectures occur today?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="day-total"
                  type="number"
                  value={dayTotal}
                  onChange={(e) => setDayTotal(parseIntOrZero(e.target.value))}
                />
              </div>

              {/* Attended Lectures */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="day-attended">Attended Lectures</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many did you attend out of today's total?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="day-attended"
                  type="number"
                  value={dayAttended}
                  onChange={(e) =>
                    setDayAttended(parseIntOrZero(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Display for Missed & Percentage */}
            <DayCardDisplay
              dayMissed={dayMissed}
              dayPerc={dayPerc}
              requiredAttendance={requiredAttendance}
            />
          </CardContent>
        </Card>

        {/* WEEK */}
        <Card className={`max-w-3xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Week Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Week # */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="week-number">Week #</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Which week is it (just for reference)?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="week-number"
                  type="number"
                  value={weekNumber}
                  onChange={(e) =>
                    setWeekNumber(parseIntOrZero(e.target.value))
                  }
                />
              </div>

              {/* Total Lectures This Week */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="week-total">Total Lectures (Week)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many lectures occur this entire week?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="week-total"
                  type="number"
                  value={weekTotal}
                  onChange={(e) =>
                    setWeekTotal(parseIntOrZero(e.target.value))
                  }
                />
              </div>

              {/* Current Attendance % */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="week-attendance">
                    Current Attendance %
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your app or portal’s weekly attendance percentage.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="week-attendance"
                  type="number"
                  step={0.01}
                  value={weekAttendancePct.toFixed(2)}
                  onChange={(e) =>
                    setWeekAttendancePct(
                      parseFloatClamped(e.target.value, 0, 100)
                    )
                  }
                />
              </div>
            </div>

            {/* Show computed “Attended,” “Missed,” etc. */}
            <WeekCardDisplay
              attended={weekAttended}
              missed={weekMissed}
              attendancePct={weekAttendancePct}
              requiredAttendance={requiredAttendance}
            />
          </CardContent>
        </Card>

        {/* MONTH */}
        <Card className={`max-w-3xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Month Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Month # */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="month-number">Month #</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Which month is it (just for reference)?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="month-number"
                  type="number"
                  value={monthNumber}
                  onChange={(e) =>
                    setMonthNumber(parseIntOrZero(e.target.value))
                  }
                />
              </div>

              {/* Total Lectures (Month) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="month-total">Total Lectures (Month)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many lectures occur in this entire month?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="month-total"
                  type="number"
                  value={monthTotal}
                  onChange={(e) =>
                    setMonthTotal(parseIntOrZero(e.target.value))
                  }
                />
              </div>

              {/* Current Attendance % */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="month-attendance">
                    Current Attendance %
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your app/portal’s monthly attendance percentage.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="month-attendance"
                  type="number"
                  step={0.01}
                  value={monthAttendancePct.toFixed(2)}
                  onChange={(e) =>
                    setMonthAttendancePct(
                      parseFloatClamped(e.target.value, 0, 100)
                    )
                  }
                />
              </div>
            </div>

            <MonthCardDisplay
              attended={monthAttended}
              missed={monthMissed}
              attendancePct={monthAttendancePct}
              requiredAttendance={requiredAttendance}
            />
          </CardContent>
        </Card>

        {/* TERM */}
        <Card className={`max-w-3xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Term Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Months Passed */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="term-months-passed">Months Passed</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many months have passed in the term? (info only)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="term-months-passed"
                  type="number"
                  value={termMonthsPassed}
                  onChange={(e) =>
                    setTermMonthsPassed(parseIntOrZero(e.target.value))
                  }
                />
              </div>

              {/* Weeks Passed */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="term-weeks-passed">Weeks Passed</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many weeks have passed (beyond those months)?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="term-weeks-passed"
                  type="number"
                  value={termWeeksPassed}
                  onChange={(e) =>
                    setTermWeeksPassed(parseIntOrZero(e.target.value))
                  }
                />
              </div>

              {/* Days Passed */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="term-days-passed">Days Passed</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many days have passed (beyond those weeks)?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="term-days-passed"
                  type="number"
                  value={termDaysPassed}
                  onChange={(e) =>
                    setTermDaysPassed(parseIntOrZero(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Lectures (Term) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="term-total">Total Lectures (Term)</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many lectures are in the entire term (so far)?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="term-total"
                  type="number"
                  value={termTotal}
                  onChange={(e) => setTermTotal(parseIntOrZero(e.target.value))}
                />
              </div>

              {/* Current Attendance % */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="term-attendance">
                    Current Attendance %
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Your app/portal’s attendance for the entire term.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="term-attendance"
                  type="number"
                  step={0.01}
                  value={termAttendancePct.toFixed(2)}
                  onChange={(e) =>
                    setTermAttendancePct(parseFloatClamped(e.target.value, 0, 100))
                  }
                />
              </div>
            </div>

            <TermCardDisplay
              monthsPassed={termMonthsPassed}
              weeksPassed={termWeeksPassed}
              daysPassed={termDaysPassed}
              attended={termAttended}
              missed={termMissed}
              attendancePct={termAttendancePct}
              requiredAttendance={requiredAttendance}
            />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

/* --- DAY DISPLAY --- */
function DayCardDisplay({
  dayMissed,
  dayPerc,
  requiredAttendance,
}: {
  dayMissed: number
  dayPerc: number
  requiredAttendance: number
}) {
  const belowReq = dayPerc < requiredAttendance
  const color = belowReq ? "bg-red-500" : "bg-green-500"
  const width = `${Math.min(dayPerc, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`day-att-${dayPerc}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Day Attendance: {dayPerc.toFixed(2)}% | Missed: {dayMissed}
            </AlertDescription>
          </div>
          {/* Progress bar */}
          <div className="w-full h-3 bg-gray-300 rounded">
            <motion.div
              className={`h-full rounded ${color}`}
              initial={{ width: 0 }}
              animate={{ width }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}

/* --- WEEK DISPLAY --- */
function WeekCardDisplay({
  attended,
  missed,
  attendancePct,
  requiredAttendance,
}: {
  attended: number
  missed: number
  attendancePct: number
  requiredAttendance: number
}) {
  const belowReq = attendancePct < requiredAttendance
  const color = belowReq ? "bg-red-500" : "bg-green-500"
  const width = `${Math.min(attendancePct, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`week-att-${attendancePct}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Week Attendance: {attendancePct.toFixed(2)}% | Attended: {attended} | Missed: {missed}
            </AlertDescription>
          </div>
          {/* Progress */}
          <div className="w-full h-3 bg-gray-300 rounded">
            <motion.div
              className={`h-full rounded ${color}`}
              initial={{ width: 0 }}
              animate={{ width }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}

/* --- MONTH DISPLAY --- */
function MonthCardDisplay({
  attended,
  missed,
  attendancePct,
  requiredAttendance,
}: {
  attended: number
  missed: number
  attendancePct: number
  requiredAttendance: number
}) {
  const belowReq = attendancePct < requiredAttendance
  const color = belowReq ? "bg-red-500" : "bg-green-500"
  const width = `${Math.min(attendancePct, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`month-att-${attendancePct}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Monthly Attendance: {attendancePct.toFixed(2)}% | Attended: {attended} | Missed: {missed}
            </AlertDescription>
          </div>
          {/* Progress */}
          <div className="w-full h-3 bg-gray-300 rounded">
            <motion.div
              className={`h-full rounded ${color}`}
              initial={{ width: 0 }}
              animate={{ width }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}

/* --- TERM DISPLAY --- */
function TermCardDisplay({
  monthsPassed,
  weeksPassed,
  daysPassed,
  attended,
  missed,
  attendancePct,
  requiredAttendance,
}: {
  monthsPassed: number
  weeksPassed: number
  daysPassed: number
  attended: number
  missed: number
  attendancePct: number
  requiredAttendance: number
}) {
  const belowReq = attendancePct < requiredAttendance
  const color = belowReq ? "bg-red-500" : "bg-green-500"
  const width = `${Math.min(attendancePct, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`term-att-${attendancePct}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Term Attendance: {attendancePct.toFixed(2)}% | Attended: {attended} | Missed: {missed}
            </AlertDescription>
          </div>
          <div className="w-full h-3 bg-gray-300 rounded">
            <motion.div
              className={`h-full rounded ${color}`}
              initial={{ width: 0 }}
              animate={{ width }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </Alert>

        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <p>Months passed: {monthsPassed}</p>
          <p>Weeks passed: {weeksPassed}</p>
          <p>Days passed: {daysPassed}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
