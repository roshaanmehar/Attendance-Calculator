"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Minimal toggle to invert the theme
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
 * Each theme has two sets of classes:
 * - containerNormal / containerInvert for the page background
 * - cardNormal / cardInvert for the card area
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

export default function AttendanceCalculator() {
  // State
  const [schedule, setSchedule] = useState({
    Monday: 3,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 2,
  })

  const [currentWeek, setCurrentWeek] = useState(1)
  const [monthsInTerm, setMonthsInTerm] = useState(4)
  const [currentMonth, setCurrentMonth] = useState(1) // new: for a more direct monthly calc
  const [attendedLectures, setAttendedLectures] = useState(0)
  const [currentAttendancePercentage, setCurrentAttendancePercentage] =
    useState<number>(0)

  // The user can now pick the required attendance. Default 85.
  const [requiredAttendance, setRequiredAttendance] = useState(85)

  // Theming
  const [theme, setTheme] = useState<keyof typeof themeMap>("rose")
  const [inverted, setInverted] = useState(false)

  // Computed results
  const [results, setResults] = useState({
    totalPerWeek: 0,
    requiredForWeek: 0,
    requiredForMonth: 0,
    requiredForTerm: 0,
    currentPercentage: 0,
    missableLectures: 0,
  })

  const WEEKS_IN_MONTH = 4
  const WEEKS_IN_TERM = useMemo(() => monthsInTerm * WEEKS_IN_MONTH, [monthsInTerm])

  // Recompute results whenever inputs change
  useEffect(() => {
    const totalLecturesPerWeek = Object.values(schedule).reduce((a, b) => a + b, 0)
    const totalPossibleLectures = currentWeek * totalLecturesPerWeek
    const totalTermLectures = WEEKS_IN_TERM * totalLecturesPerWeek

    // Weekly requirement
    const requiredForWeek = Math.ceil(
      (requiredAttendance / 100) * totalLecturesPerWeek
    )

    // For monthly, we try to see how many lectures happen in one typical "4-week" month
    const totalLecturesInMonth = WEEKS_IN_MONTH * totalLecturesPerWeek

    // We guess how many were attended in the *current* month by computing:
    // all lectures attended so far - all lectures in previous full months
    const previousMonths = currentMonth - 1
    const lecturesPreviousMonths = previousMonths * totalLecturesInMonth
    const attendedThisMonthSoFar = Math.max(0, attendedLectures - lecturesPreviousMonths)

    // Then the required for this month is:
    //  (required % of total in a month) - how many you've already done this month
    const rawRequiredForMonth = Math.ceil(
      (requiredAttendance / 100) * totalLecturesInMonth - attendedThisMonthSoFar
    )
    const requiredForMonth = Math.max(0, rawRequiredForMonth)

    // Term calculations
    const rawRequiredForTerm = Math.ceil(
      (requiredAttendance / 100) * totalTermLectures - attendedLectures
    )
    const requiredForTerm = Math.max(0, rawRequiredForTerm)

    // Current attendance percentage
    const currentPercentage =
      totalPossibleLectures === 0
        ? 0
        : (attendedLectures / totalPossibleLectures) * 100

    // Missable lectures for entire term
    const minimumRequired = Math.ceil(
      (requiredAttendance / 100) * totalTermLectures
    )
    const missableTotal = totalTermLectures - minimumRequired
    const missableRemaining = Math.max(
      0,
      missableTotal - (totalPossibleLectures - attendedLectures)
    )

    setResults({
      totalPerWeek: totalLecturesPerWeek,
      requiredForWeek,
      requiredForMonth,
      requiredForTerm,
      currentPercentage,
      missableLectures: missableRemaining,
    })
  }, [
    schedule,
    currentWeek,
    attendedLectures,
    WEEKS_IN_TERM,
    requiredAttendance,
    currentMonth,
  ])

  // Keep numeric attendance in sync
  useEffect(() => {
    const totalPossibleLectures = results.totalPerWeek * currentWeek
    if (totalPossibleLectures > 0) {
      setCurrentAttendancePercentage(
        (attendedLectures / totalPossibleLectures) * 100
      )
    } else {
      setCurrentAttendancePercentage(0)
    }
  }, [attendedLectures, currentWeek, results.totalPerWeek])

  // Called when user types a new attendance %
  const handleAttendanceChange = (val: string) => {
    const newPercent = parseFloatClamped(val)
    setCurrentAttendancePercentage(newPercent)

    // Recompute how many lectures from that percentage
    const totalPossibleLectures = results.totalPerWeek * currentWeek
    const attended = Math.round((newPercent / 100) * totalPossibleLectures)
    setAttendedLectures(attended)
  }

  // The final theme classes for container + card
  const containerClass = inverted
    ? themeMap[theme].containerInvert
    : themeMap[theme].containerNormal
  const cardClass = inverted
    ? themeMap[theme].cardInvert
    : themeMap[theme].cardNormal

  // A small progress bar or color-coded display for current attendance
  // We'll color it red if current < required; green otherwise
  const isBelowRequired = results.currentPercentage < requiredAttendance
  const progressColor = isBelowRequired ? "bg-red-500" : "bg-green-500"
  const progressWidth = `${Math.min(results.currentPercentage, 100).toFixed(2)}%`

  return (
    <TooltipProvider>
      {/* The entire page uses the selected theme variant */}
      <div className={`min-h-screen w-full p-6 ${containerClass}`}>
        {/* "Toolbar" at the top with big heading */}
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

        <Card className={`max-w-3xl mx-auto ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Settings & Inputs</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Required attendance */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="requiredAttendance">Required Attendance %</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Set the target attendance percentage you want to maintain.</p>
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

            {/* Months & Current Month */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="months-in-term">Months in Term</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many months in the entire academic term?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="months-in-term"
                  type="number"
                  value={monthsInTerm}
                  onChange={(e) => setMonthsInTerm(parseIntOrZero(e.target.value))}
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="current-month">Current Month</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Which month of the term are you in now?  
                        (1–{monthsInTerm})
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="current-month"
                  type="number"
                  value={currentMonth}
                  onChange={(e) => {
                    const val = parseIntOrZero(e.target.value)
                    // clamp to not exceed total months
                    setCurrentMonth(Math.min(val, monthsInTerm))
                  }}
                />
              </div>
            </div>

            {/* Current Week & Attendance */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Current Week */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="current-week">Current Week</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Which week are you on now (1–{WEEKS_IN_TERM})?
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="current-week"
                  type="number"
                  value={currentWeek}
                  onChange={(e) => {
                    const val = parseIntOrZero(e.target.value)
                    setCurrentWeek(Math.min(val, WEEKS_IN_TERM))
                  }}
                />
              </div>

              {/* Current Attendance % */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="current-percentage">
                    Current Attendance %
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Type your current attendance percentage (0–100).</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="current-percentage"
                  type="number"
                  step={0.01}
                  value={currentAttendancePercentage.toFixed(2)}
                  onChange={(e) => handleAttendanceChange(e.target.value)}
                />
              </div>

              {/* Lectures Attended */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="attended">Lectures Attended</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many lectures have you attended so far?</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="attended"
                  type="number"
                  value={attendedLectures}
                  onChange={(e) => setAttendedLectures(parseIntOrZero(e.target.value))}
                />
              </div>
            </div>

            {/* Weekly schedule */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">Weekly Schedule</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of lectures each weekday.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(schedule).map(([day, lectures]) => (
                  <div key={day} className="space-y-2">
                    <Label htmlFor={day}>{day}</Label>
                    <Input
                      id={day}
                      type="number"
                      value={lectures}
                      onChange={(e) => {
                        const val = parseIntOrZero(e.target.value)
                        setSchedule((prev) => ({ ...prev, [day]: val }))
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className={`max-w-3xl mx-auto mt-6 ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Results</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Attendance Alert + Progress Bar */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`alert-${results.currentPercentage.toFixed(2)}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Alert className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      Current Attendance: {results.currentPercentage.toFixed(2)}%
                    </AlertDescription>
                  </div>
                  {/* Simple progress bar */}
                  <div className="w-full h-3 bg-gray-300 rounded">
                    <motion.div
                      className={`h-full rounded ${progressColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: progressWidth }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </Alert>
              </motion.div>
            </AnimatePresence>

            <Tabs defaultValue="week">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="term">Term</TabsTrigger>
              </TabsList>

              {/* Weekly */}
              <TabsContent value="week" className="space-y-4">
                <div className="grid gap-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center"
                  >
                    <span>Total lectures per week:</span>
                    <Badge variant="secondary">{results.totalPerWeek}</Badge>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center"
                  >
                    <span>
                      Required lectures this week for {requiredAttendance}%:
                    </span>
                    <Badge>{results.requiredForWeek}</Badge>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center"
                  >
                    <span>Lectures you can miss this week:</span>
                    <Badge variant="outline">
                      {Math.max(
                        0,
                        results.totalPerWeek - results.requiredForWeek
                      )}
                    </Badge>
                  </motion.div>
                </div>
              </TabsContent>

              {/* Monthly */}
              <TabsContent value="month" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between items-center"
                >
                  <span>Required for Month {currentMonth}:</span>
                  <Badge>{results.requiredForMonth}</Badge>
                </motion.div>
                <p className="text-sm text-gray-500">
                  <strong>Note:</strong> The monthly calculation assumes each
                  month is exactly 4 weeks. If your weeks/months don’t align
                  neatly, these numbers are approximate.
                </p>
                {results.requiredForMonth > 0 && (
                  <p className="text-sm">
                    You can still miss up to{" "}
                    <strong>{results.requiredForMonth - 1}</strong> more
                    lectures this month before dropping below {requiredAttendance}%
                    (approx).
                  </p>
                )}
              </TabsContent>

              {/* Term */}
              <TabsContent value="term" className="space-y-4">
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center"
                  >
                    <span>
                      Required for entire term ({monthsInTerm} months):
                    </span>
                    <Badge>{results.requiredForTerm}</Badge>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center"
                  >
                    <span>Remaining lectures you can miss:</span>
                    <Badge variant="outline">
                      {results.missableLectures}
                    </Badge>
                  </motion.div>
                  {results.missableLectures > 0 && (
                    <p className="text-sm">
                      You can skip <strong>{results.missableLectures}</strong>{" "}
                      more lecture(s) overall without falling below{" "}
                      {requiredAttendance}%.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
