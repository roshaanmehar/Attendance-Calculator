"use client"

import { useState, useEffect, useRef } from "react"
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

/** Computes how many lectures one can skip (maximum) while still meeting `requiredAttendance`. 
 *  For example, if required=85%, you must attend at least 85% of `total`.  
 *  So skipAllowed = total - ceil(required% × total) 
 *  If that’s negative, clamp to 0. 
 */
function calcSkipAllowed(total: number, requiredPct: number) {
  const needed = Math.ceil((requiredPct / 100) * total)
  const allowed = total - needed
  return allowed < 0 ? 0 : allowed
}

/** Returns which month you get if you are in `week`. E.g. weeks 1-4 => month=1, 5-8 => month=2, etc. */
function monthFromWeek(week: number) {
  return Math.ceil(week / 4)
}

/** 
 * Returns the valid range of weeks for a given month. 
 *   - Month 1 => weeks [1..4]
 *   - Month 2 => weeks [5..8]
 *   - etc.
 */
function validWeekRangeForMonth(m: number) {
  const start = (m - 1) * 4 + 1
  const end = m * 4
  return { start, end }
}

/**
 * Sync day/week/month. 
 *  - If user sets “week,” we compute new month from week => day=0. 
 *  - If user sets “month,” we see if current week is in that month’s range. If not, either revert or clamp. 
 *  - If user sets “day,” we see if day≥7 => that means we finished the old week, so increment `week` by 1, day -= 7. Then recalc month.
 *  - This is just a simple example. 
 */
function syncDayWeekMonth(
  day: number,
  week: number,
  month: number,
  changedField: "day" | "week" | "month"
) {
  let newDay = day
  let newWeek = week
  let newMonth = month
  let alertMsg = ""

  if (changedField === "day") {
    // If user says e.g. day=7 or more => that means we completed the old week, so increment. 
    while (newDay >= 7) {
      newDay -= 7
      newWeek += 1
    }
    // Also if newDay < 0, clamp
    if (newDay < 0) newDay = 0

    // Recompute month
    newMonth = monthFromWeek(newWeek)
    // We might want an alert if month changed
    if (newMonth !== month) {
      alertMsg = `Changing day caused Week to shift to ${newWeek}, which also changed Month to ${newMonth}.`
    }
  } else if (changedField === "week") {
    // Recompute the month from this new week
    const recalculatedMonth = monthFromWeek(week)
    if (recalculatedMonth !== month) {
      newMonth = recalculatedMonth
      alertMsg = `Changing Week to ${week} changed Month to ${newMonth}.`
    }
    // Set day=0 if user chooses a new week
    if (day !== 0) {
      newDay = 0
      if (!alertMsg) {
        alertMsg = `Changing Week to ${week} also reset Day to 0.`
      } else {
        alertMsg += ` Also reset Day to 0.`
      }
    }
  } else if (changedField === "month") {
    // Check if current week is in [start..end]. If not, we can do two things:
    // 1) Revert to previous month
    // 2) Clamp the week to the start of that month
    const { start, end } = validWeekRangeForMonth(month)
    if (week < start || week > end) {
      // We'll clamp to the start, day=0
      newWeek = start
      newDay = 0
      alertMsg = `Week ${week} is invalid for Month ${month}. Clamping Week to ${start} and Day=0.`
    }
  }

  return { newDay, newWeek, newMonth, alertMsg }
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

  // -----------------------------
  //  New: Day/Week/Month synergy
  // -----------------------------
  // Keep numeric states internally so we can do math easily
  const [numericDay, setNumericDay] = useState(0)      // 0..6 (or 1..7). 0 => boundary
  const [numericWeek, setNumericWeek] = useState(1)    // user sees "1", meaning the first “elapsed” week
  const [numericMonth, setNumericMonth] = useState(1)  // likewise
  // We'll store which field the user last changed, so we know the direction of sync
  const [lastChanged, setLastChanged] = useState<"day" | "week" | "month" | "">("")
  // We'll store a message if there's a contradiction or forced change
  const [alertMessage, setAlertMessage] = useState("")

  // The original code used string-based states for dayNumber/weekNumber/monthNumber.
  // We’ll keep those for the UI, but keep them synced to numeric states behind the scenes.
  const [dayNumber, setDayNumber] = useState("0")
  const [weekNumber, setWeekNumber] = useState("1")
  const [monthNumber, setMonthNumber] = useState("1")

  // Each time day/week/month numeric states change, we’ll re-sync them via the function above.
  useEffect(() => {
    if (!lastChanged) return // no user input yet; do nothing
    const { newDay, newWeek, newMonth, alertMsg } = syncDayWeekMonth(
      numericDay,
      numericWeek,
      numericMonth,
      lastChanged
    )

    // If the function says we need a correction:
    if (
      newDay !== numericDay ||
      newWeek !== numericWeek ||
      newMonth !== numericMonth
    ) {
      setNumericDay(newDay)
      setNumericWeek(newWeek)
      setNumericMonth(newMonth)
      if (alertMsg) {
        setAlertMessage(alertMsg)
      }
    } else {
      // If no correction is needed, but we changed something intentionally, we clear any prior alert
      if (alertMsg) {
        setAlertMessage(alertMsg)
      } else {
        setAlertMessage("")
      }
    }
  }, [numericDay, numericWeek, numericMonth, lastChanged])

  // Whenever the final numeric states get updated (after any correction), push them back to the text fields
  useEffect(() => {
    setDayNumber(String(numericDay))
    setWeekNumber(String(numericWeek))
    setMonthNumber(String(numericMonth))
  }, [numericDay, numericWeek, numericMonth])

  // ====== Day Info (original) ======
  const [dayTotalLectures, setDayTotalLectures] = useState("5") // user can type, default 5
  const [dayAttended, setDayAttended] = useState("3") // user can type
  const [dayMissed, setDayMissed] = useState(0)
  const [dayPerc, setDayPerc] = useState(0)

  // ====== Week Info (original) ======
  // The user can type a weekly attendance string => parse => compute attended vs missed from weekTotal
  const [weekAttendanceStr, setWeekAttendanceStr] = useState("0") // typed % string
  const [weekPct, setWeekPct] = useState(0) // parsed numeric
  const [weekAttendedCalc, setWeekAttendedCalc] = useState(0)
  const [weekMissedCalc, setWeekMissedCalc] = useState(0)

  // ====== Month Info (original) ======
  const [monthAttendanceStr, setMonthAttendanceStr] = useState("0")
  const [monthPct, setMonthPct] = useState(0)
  const [monthAttendedCalc, setMonthAttendedCalc] = useState(0)
  const [monthMissedCalc, setMonthMissedCalc] = useState(0)

  // ====== Term Info (original) ======
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

        {/* If we have an alert message, display it */}
        {alertMessage && (
          <div className="mb-4">
            <Alert className="bg-red-200 border border-red-300 text-red-900">
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          </div>
        )}

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
                <Label htmlFor="dayNumber">Day # (0..6)</Label>
                <Input
                  id="dayNumber"
                  type="text"
                  value={dayNumber}
                  onChange={(e) => {
                    const val = parseIntOrZero(e.target.value)
                    setDayNumber(val.toString())
                    setNumericDay(val)
                    setLastChanged("day")
                  }}
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
                  onChange={(e) => {
                    const val = parseIntOrZero(e.target.value)
                    setWeekNumber(val.toString())
                    setNumericWeek(val)
                    setLastChanged("week")
                  }}
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
                  onChange={(e) => {
                    const val = parseIntOrZero(e.target.value)
                    setMonthNumber(val.toString())
                    setNumericMonth(val)
                    setLastChanged("month")
                  }}
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

  // Compute how many lectures can be skipped while maintaining the required attendance
  const skipAllowed = calcSkipAllowed(weekTotal, required)

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
            <br />
            You can still skip up to <strong>{skipAllowed}</strong> lecture(s) this week and remain at or above {required}%.
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

  // Compute skip allowance
  const skipAllowed = calcSkipAllowed(monthTotal, required)

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
            <span>Out of {monthTotal} total lectures:</span> Attended {attended} | Missed {missed}
            <br />
            You can still skip up to <strong>{skipAllowed}</strong> lecture(s) this month and remain at or above {required}%.
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

  // Compute skip allowance
  const skipAllowed = calcSkipAllowed(termTotal, required)

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
            <br />
            You can still skip up to <strong>{skipAllowed}</strong> lecture(s) in the term while maintaining {required}% attendance.
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
