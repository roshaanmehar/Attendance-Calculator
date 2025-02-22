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

  // ====== Day Info ======
  const [dayNumber, setDayNumber] = useState("1") // user can freely type
  const [dayTotalLectures, setDayTotalLectures] = useState("5") // user can type, default 5
  const [dayAttended, setDayAttended] = useState("3") // user can type
  const [dayMissed, setDayMissed] = useState(0)
  const [dayPerc, setDayPerc] = useState(0)

  // ====== Week Info ======
  const [weekNumber, setWeekNumber] = useState("1") // which week it is
  const [weekAttendanceStr, setWeekAttendanceStr] = useState("0") // typed % string
  const [weekPct, setWeekPct] = useState(0) // parsed numeric
  const [weekAttendedCalc, setWeekAttendedCalc] = useState(0)
  const [weekMissedCalc, setWeekMissedCalc] = useState(0)

  // ====== Month Info ======
  const [monthNumber, setMonthNumber] = useState("1")
  const [monthAttendanceStr, setMonthAttendanceStr] = useState("0")
  const [monthPct, setMonthPct] = useState(0)
  const [monthAttendedCalc, setMonthAttendedCalc] = useState(0)
  const [monthMissedCalc, setMonthMissedCalc] = useState(0)

  // ====== Term Info ======
  const [termAttStr, setTermAttStr] = useState("0") // typed % string
  const [termPct, setTermPct] = useState(0)
  const [termAttendedCalc, setTermAttendedCalc] = useState(0)
  const [termMissedCalc, setTermMissedCalc] = useState(0)
  const [termWeeksPassed, setTermWeeksPassed] = useState("0") // reference
  const [termDaysPassed, setTermDaysPassed] = useState("0")  // reference

  /* ==================== Compute Weekly / Monthly / Term from daily schedule ===================== */
  useEffect(() => {
    const sumDaily = Object.values(schedule).reduce((a, b) => a + b, 0)
    setWeekTotal(sumDaily)
    const monthly = sumDaily * 4
    setMonthTotal(monthly)
    setTermTotal(monthly * monthsInTerm)
  }, [schedule, monthsInTerm])

  /* ==================== Day Calculation ==================== */
  // The user can type total lectures and attended. We parse them => compute missed + %.
  useEffect(() => {
    const total = parseIntOrZero(dayTotalLectures)
    const attended = parseIntOrZero(dayAttended)
    const missed = Math.max(0, total - attended)
    setDayMissed(missed)
    const p = total > 0 ? (attended / total) * 100 : 0
    setDayPerc(p)
  }, [dayTotalLectures, dayAttended])

  /* ==================== Week Calculation ==================== */
  // The user can type a week attendance string => we parse it => compute attended vs missed from weekTotal
  useEffect(() => {
    const val = parseFloat(weekAttendanceStr)
    if (!isNaN(val)) {
      const clamped = Math.min(Math.max(val, 0), 100)
      setWeekPct(clamped)
    }
  }, [weekAttendanceStr])

  // Each time weekPct or weekTotal changes => recalc attended + missed
  useEffect(() => {
    const { attended, missed } = computeFromPct(weekTotal, weekPct)
    setWeekAttendedCalc(attended)
    setWeekMissedCalc(missed)
  }, [weekPct, weekTotal])

  /* ==================== Month Calculation ==================== */
  useEffect(() => {
    const val = parseFloat(monthAttendanceStr)
    if (!isNaN(val)) {
      const clamped = Math.min(Math.max(val, 0), 100)
      setMonthPct(clamped)
    }
  }, [monthAttendanceStr])

  useEffect(() => {
    const { attended, missed } = computeFromPct(monthTotal, monthPct)
    setMonthAttendedCalc(attended)
    setMonthMissedCalc(missed)
  }, [monthPct, monthTotal])

  /* ==================== Term Calculation ==================== */
  useEffect(() => {
    const val = parseFloat(termAttStr)
    if (!isNaN(val)) {
      const clamped = Math.min(Math.max(val, 0), 100)
      setTermPct(clamped)
    }
  }, [termAttStr])

  useEffect(() => {
    const { attended, missed } = computeFromPct(termTotal, termPct)
    setTermAttendedCalc(attended)
    setTermMissedCalc(missed)
  }, [termPct, termTotal])

  /* ==================== Utility for progress bar color ==================== */
  function getBarColor(pct: number) {
    return pct < requiredAttendance ? "bg-red-500" : "bg-green-500"
  }

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

        {/* Required attendance + monthsInTerm */}
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
                        If actual attendance is below this number, we show red;
                        else green.
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
                        Used to compute <strong>term total</strong> = monthTotal
                        × monthsInTerm.
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

        {/* Daily schedule -> week, month, term totals */}
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
                      setSchedule((prev) => ({
                        ...prev,
                        [day]: newVal,
                      }))
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
                <strong>Term Total:</strong> {termTotal}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Day portion: user picks day #, total lectures, and how many they attended */}
        <Card className={`max-w-4xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Day Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Day # */}
              <div className="space-y-1">
                <Label htmlFor="dayNumber">Day #</Label>
                <Input
                  id="dayNumber"
                  type="text"
                  value={dayNumber}
                  onChange={(e) => setDayNumber(e.target.value)}
                />
              </div>

              {/* Day total lectures */}
              <div className="space-y-1">
                <Label htmlFor="dayTotalLectures">Total Lectures (Day)</Label>
                <Input
                  id="dayTotalLectures"
                  type="text"
                  value={dayTotalLectures}
                  onChange={(e) => setDayTotalLectures(e.target.value)}
                />
              </div>

              {/* Day attended */}
              <div className="space-y-1">
                <Label htmlFor="dayAttended">Attended Lectures</Label>
                <Input
                  id="dayAttended"
                  type="text"
                  value={dayAttended}
                  onChange={(e) => setDayAttended(e.target.value)}
                />
              </div>
            </div>

            <DayDisplay
              dayNo={dayNumber}
              dayMissed={dayMissed}
              dayPerc={dayPerc}
              required={requiredAttendance}
            />
          </CardContent>
        </Card>

        {/* Week portion */}
        <Card className={`max-w-4xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Week Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Week # */}
              <div className="space-y-1">
                <Label htmlFor="weekNumber">Week #</Label>
                <Input
                  id="weekNumber"
                  type="text"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(e.target.value)}
                />
              </div>

              {/* Current Attendance % as a string */}
              <div className="space-y-1">
                <Label htmlFor="weekAttendanceStr">
                  Current Weekly Attendance %
                </Label>
                <Input
                  id="weekAttendanceStr"
                  type="text"
                  value={weekAttendanceStr}
                  onChange={(e) => setWeekAttendanceStr(e.target.value)}
                />
              </div>
            </div>
            <WeekDisplay
              weekNo={weekNumber}
              weekTotal={weekTotal}
              attendancePct={weekPct}
              attended={weekAttendedCalc}
              missed={weekMissedCalc}
              required={requiredAttendance}
            />
          </CardContent>
        </Card>

        {/* Month portion */}
        <Card className={`max-w-4xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Month Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              monthTotal={monthTotal}
              attendancePct={monthPct}
              attended={monthAttendedCalc}
              missed={monthMissedCalc}
              required={requiredAttendance}
            />
          </CardContent>
        </Card>

        {/* Term portion */}
        <Card className={`max-w-4xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Term Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Weeks Passed (info only)</Label>
                <Input
                  type="text"
                  value={termWeeksPassed}
                  onChange={(e) => setTermWeeksPassed(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Days Passed (info only)</Label>
                <Input
                  type="text"
                  value={termDaysPassed}
                  onChange={(e) => setTermDaysPassed(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="termAttStr">
                  Current Term Attendance %
                </Label>
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
              termTotal={termTotal}
              attended={termAttendedCalc}
              missed={termMissedCalc}
              required={requiredAttendance}
              weeksPassed={termWeeksPassed}
              daysPassed={termDaysPassed}
            />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

/* ================== Day Display ================== */
function DayDisplay({
  dayNo,
  dayMissed,
  dayPerc,
  required,
}: {
  dayNo: string
  dayMissed: number
  dayPerc: number
  required: number
}) {
  const below = dayPerc < required
  const barColor = below ? "bg-red-500" : "bg-green-500"
  const widthStr = `${Math.min(dayPerc, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`day-${dayPerc}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <AlertDescription>
            <strong>Day {dayNo} Attendance:</strong> {dayPerc.toFixed(2)}% | Missed: {dayMissed}
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

/* ================== Week Display ================== */
function WeekDisplay({
  weekNo,
  weekTotal,
  attendancePct,
  attended,
  missed,
  required,
}: {
  weekNo: string
  weekTotal: number
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
        key={`week-${attendancePct}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <AlertDescription>
            <strong>Week {weekNo} Attendance:</strong> {attendancePct.toFixed(2)}%
            <br />
            <span>Out of {weekTotal} total lectures:</span> Attended {attended} | Missed {missed}
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

/* ================== Month Display ================== */
function MonthDisplay({
  monthNo,
  monthTotal,
  attendancePct,
  attended,
  missed,
  required,
}: {
  monthNo: string
  monthTotal: number
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
            <strong>Month {monthNo} Attendance:</strong> {attendancePct.toFixed(2)}%
            <br />
            <span>Out of {monthTotal} total lectures:</span> Attended {attended} | Missed {missed}
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

/* ================== Term Display ================== */
function TermDisplay({
  termPct,
  termTotal,
  attended,
  missed,
  required,
  weeksPassed,
  daysPassed,
}: {
  termPct: number
  termTotal: number
  attended: number
  missed: number
  required: number
  weeksPassed: string
  daysPassed: string
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
            <span>Out of {termTotal} total lectures:</span> Attended {attended} | Missed {missed}
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
        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <p>Weeks passed (info): {weeksPassed}</p>
          <p>Days passed (info): {daysPassed}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
