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

function roundAttendance(total: number, pct: number) {
  // attended = round( total * pct/100 )
  const attended = Math.round((pct / 100) * total)
  const missed = total - attended
  return { attended, missed }
}

export default function AttendanceCalculator() {
  // ====== Theme/Invert ======
  const [theme, setTheme] = useState<keyof typeof themeMap>("rose")
  const [inverted, setInverted] = useState(false)

  // ====== Global Settings ======
  const [requiredAttendance, setRequiredAttendance] = useState(85)
  const [monthsInTerm, setMonthsInTerm] = useState(3) // used to compute term total

  // ====== Daily Schedule (Mon–Sat) ======
  const [schedule, setSchedule] = useState({
    Monday: 3,
    Tuesday: 3,
    Wednesday: 3,
    Thursday: 3,
    Friday: 3,
    Saturday: 0,
  })
  // computed from the schedule
  const [weekTotal, setWeekTotal] = useState(0)
  const [monthTotal, setMonthTotal] = useState(0)
  const [termTotal, setTermTotal] = useState(0)

  // ====== Week Attendance ======
  const [weekAttendancePct, setWeekAttendancePct] = useState(0)
  const [weekAttended, setWeekAttended] = useState(0)
  const [weekMissed, setWeekMissed] = useState(0)

  // ====== Month Attendance ======
  const [monthAttendancePct, setMonthAttendancePct] = useState(0)
  const [monthAttended, setMonthAttended] = useState(0)
  const [monthMissed, setMonthMissed] = useState(0)

  // ====== Term Attendance ======
  const [termAttendancePct, setTermAttendancePct] = useState(0)
  const [termAttended, setTermAttended] = useState(0)
  const [termMissed, setTermMissed] = useState(0)

  // Recompute weekly, monthly, term totals whenever daily schedule or monthsInTerm changes
  useEffect(() => {
    // sum daily lectures
    const dailySum = Object.values(schedule).reduce((a, b) => a + b, 0)
    setWeekTotal(dailySum)

    // monthly total = 4 * weekly
    const monthly = 4 * dailySum
    setMonthTotal(monthly)

    // term total = monthsInTerm * monthly
    setTermTotal(monthly * monthsInTerm)
  }, [schedule, monthsInTerm])

  // Recompute weekAttended/weekMissed whenever weekAttendancePct or weekTotal changes
  useEffect(() => {
    const { attended, missed } = roundAttendance(weekTotal, weekAttendancePct)
    setWeekAttended(attended)
    setWeekMissed(missed)
  }, [weekTotal, weekAttendancePct])

  // Recompute monthAttended/monthMissed whenever monthAttendancePct or monthTotal changes
  useEffect(() => {
    const { attended, missed } = roundAttendance(monthTotal, monthAttendancePct)
    setMonthAttended(attended)
    setMonthMissed(missed)
  }, [monthTotal, monthAttendancePct])

  // Recompute termAttended/termMissed whenever termAttendancePct or termTotal changes
  useEffect(() => {
    const { attended, missed } = roundAttendance(termTotal, termAttendancePct)
    setTermAttended(attended)
    setTermMissed(missed)
  }, [termTotal, termAttendancePct])

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
        {/* Page header + theme controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Attendance Calculator</h1>

          <div className="flex flex-wrap items-center gap-4">
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

        {/* Global settings */}
        <Card className={`max-w-3xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Global Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required Attendance */}
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
                        Used to color progress bars red if below requirement, or
                        green if above.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="requiredAttendance"
                  type="number"
                  value={requiredAttendance}
                  onChange={(e) =>
                    setRequiredAttendance(
                      parseFloatClamped(e.target.value, 0, 100)
                    )
                  }
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
                        How many months does the term last? Used to compute
                        Term’s total lectures = monthsInTerm × monthly total.
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

        {/* Daily schedule => compute weekly, monthly, term totals */}
        <Card className={`max-w-3xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Daily Schedule (Mon–Sat)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter how many lectures occur each day. If a day is zero, it’s
              effectively an off-day. We’ll sum these for your weekly total,
              then multiply by 4 for a monthly total, and again by the months in
              term for your term total.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

            {/* Display computed totals */}
            <div className="space-y-2 mt-4 text-sm">
              <p>
                <strong>Weekly Total:</strong> {weekTotal}
              </p>
              <p>
                <strong>Monthly Total (approx 4 weeks):</strong> {monthTotal}
              </p>
              <p>
                <strong>Term Total:</strong> {termTotal}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* WEEK Attendance */}
        <Card className={`max-w-3xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Weekly Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="weekAttendance">
                    Current Weekly Attendance %
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Enter the weekly attendance % shown by your college
                        portal/app. We’ll compute attended vs. missed from it.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="weekAttendance"
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

              <DisplayAttendance
                periodLabel="Week"
                total={weekTotal}
                attendancePct={weekAttendancePct}
                requiredAttendance={requiredAttendance}
              />
            </div>
          </CardContent>
        </Card>

        {/* MONTH Attendance */}
        <Card className={`max-w-3xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Monthly Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="monthAttendance">
                    Current Monthly Attendance %
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Enter the monthly attendance % from your portal. We’ll
                        compute attended vs. missed from that.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="monthAttendance"
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

              <DisplayAttendance
                periodLabel="Month"
                total={monthTotal}
                attendancePct={monthAttendancePct}
                requiredAttendance={requiredAttendance}
              />
            </div>
          </CardContent>
        </Card>

        {/* TERM Attendance */}
        <Card className={`max-w-3xl mx-auto mb-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Term Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="termAttendance">
                    Current Term Attendance %
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Enter the overall term attendance % from your portal.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="termAttendance"
                  type="number"
                  step={0.01}
                  value={termAttendancePct.toFixed(2)}
                  onChange={(e) =>
                    setTermAttendancePct(
                      parseFloatClamped(e.target.value, 0, 100)
                    )
                  }
                />
              </div>

              <DisplayAttendance
                periodLabel="Term"
                total={termTotal}
                attendancePct={termAttendancePct}
                requiredAttendance={requiredAttendance}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

/**
 * Displays the calculated "Attended" and "Missed" from the given total & attendancePct,
 * plus a color-coded progress bar based on the user’s requiredAttendance.
 */
function DisplayAttendance({
  periodLabel,
  total,
  attendancePct,
  requiredAttendance,
}: {
  periodLabel: string
  total: number
  attendancePct: number
  requiredAttendance: number
}) {
  // compute actual attended & missed
  const attended = Math.round((attendancePct / 100) * total)
  const missed = total - attended

  const belowReq = attendancePct < requiredAttendance
  const barColor = belowReq ? "bg-red-500" : "bg-green-500"
  const barWidth = `${Math.min(attendancePct, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${periodLabel}-${attendancePct}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="space-y-2"
      >
        <Alert className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              {periodLabel} Attendance: {attendancePct.toFixed(2)}%  
              {"  "}| Attended: {attended} | Missed: {missed}
            </AlertDescription>
          </div>
          <div className="w-full h-3 bg-gray-300 rounded">
            <motion.div
              className={`h-full rounded ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: barWidth }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}
