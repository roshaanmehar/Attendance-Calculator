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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

// Helper to parse integers (no negatives)
function parseIntOrZero(val: string) {
  const parsed = parseInt(val, 10)
  if (isNaN(parsed) || parsed < 0) return 0
  return parsed
}

// Helper to clamp a float to [0..100]
function parseFloatClamped(str: string, min = 0, max = 100) {
  const parsed = parseFloat(str)
  if (isNaN(parsed)) return min
  return Math.min(Math.max(parsed, min), max)
}

export default function AttendanceCalculator() {
  // Theming
  const [theme, setTheme] = useState<keyof typeof themeMap>("rose")
  const [inverted, setInverted] = useState(false)

  // Required attendance (global)
  const [requiredAttendance, setRequiredAttendance] = useState(85)

  // ========== Day Tab ==========
  const [dayNumber, setDayNumber] = useState(1)
  const [dayAttended, setDayAttended] = useState(0)
  const [dayMissed, setDayMissed] = useState(0)
  const [dayAttendance, setDayAttendance] = useState(0)

  // ========== Week Tab ==========
  const [weekNumber, setWeekNumber] = useState(1)
  const [weekAttended, setWeekAttended] = useState(0)
  const [weekMissed, setWeekMissed] = useState(0)
  const [weekAttendance, setWeekAttendance] = useState(0)

  // ========== Month Tab ==========
  const [monthAttended, setMonthAttended] = useState(0)
  const [monthMissed, setMonthMissed] = useState(0)
  const [monthAttendance, setMonthAttendance] = useState(0)

  // ========== Term Tab ==========
  const [monthsPassed, setMonthsPassed] = useState(0)
  const [weeksPassed, setWeeksPassed] = useState(0)
  const [daysPassed, setDaysPassed] = useState(0)
  const [termAttended, setTermAttended] = useState(0)
  const [termMissed, setTermMissed] = useState(0)
  const [termAttendance, setTermAttendance] = useState(0)

  // ========== Effects for Calculations ==========

  // Day attendance
  useEffect(() => {
    const total = dayAttended + dayMissed
    if (total > 0) {
      setDayAttendance((dayAttended / total) * 100)
    } else {
      setDayAttendance(0)
    }
  }, [dayAttended, dayMissed])

  // Week attendance
  useEffect(() => {
    const total = weekAttended + weekMissed
    if (total > 0) {
      setWeekAttendance((weekAttended / total) * 100)
    } else {
      setWeekAttendance(0)
    }
  }, [weekAttended, weekMissed])

  // Month attendance
  useEffect(() => {
    const total = monthAttended + monthMissed
    if (total > 0) {
      setMonthAttendance((monthAttended / total) * 100)
    } else {
      setMonthAttendance(0)
    }
  }, [monthAttended, monthMissed])

  // Term attendance
  useEffect(() => {
    const total = termAttended + termMissed
    if (total > 0) {
      setTermAttendance((termAttended / total) * 100)
    } else {
      setTermAttendance(0)
    }
  }, [termAttended, termMissed])

  // ========== Simple progress bar helper ==========

  function getProgressBarColor(current: number, target: number) {
    return current < target ? "bg-red-500" : "bg-green-500"
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

        {/* Card with tabs: Day, Week, Month, Term */}
        <Card className={`max-w-3xl mx-auto ${cardClass}`}>
          <CardHeader>
            <CardTitle className="text-xl">Settings & Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required attendance */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="requiredAttendance">Required Attendance %</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Set the target attendance percentage for each level (day,
                      week, month, term).
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

            <Tabs defaultValue="day">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="term">Term</TabsTrigger>
              </TabsList>

              {/* ========== Day Tab ========== */}
              <TabsContent value="day" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="day-number">Current Day #</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Which day is it (just for reference)?</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="day-number"
                        type="number"
                        value={dayNumber}
                        onChange={(e) =>
                          setDayNumber(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="day-attended">Lectures Attended</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How many lectures did you attend today?</p>
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

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="day-missed">Lectures Missed</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How many lectures did you miss today?</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="day-missed"
                        type="number"
                        value={dayMissed}
                        onChange={(e) =>
                          setDayMissed(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <DayResult
                    dayAttendance={dayAttendance}
                    requiredAttendance={requiredAttendance}
                  />
                </div>
              </TabsContent>

              {/* ========== Week Tab ========== */}
              <TabsContent value="week" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="week-number">Week #</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Which week are you on (just for reference)?</p>
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

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="week-attended">Lectures Attended</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How many lectures have you attended this week?</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="week-attended"
                        type="number"
                        value={weekAttended}
                        onChange={(e) =>
                          setWeekAttended(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="week-missed">Lectures Missed</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How many lectures have you missed this week?</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="week-missed"
                        type="number"
                        value={weekMissed}
                        onChange={(e) =>
                          setWeekMissed(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <WeekResult
                    weekAttendance={weekAttendance}
                    requiredAttendance={requiredAttendance}
                  />
                </div>
              </TabsContent>

              {/* ========== Month Tab ========== */}
              <TabsContent value="month" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="month-attended">
                          Lectures Attended (Month)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How many lectures attended so far this month?</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="month-attended"
                        type="number"
                        value={monthAttended}
                        onChange={(e) =>
                          setMonthAttended(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="month-missed">
                          Lectures Missed (Month)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How many lectures missed so far this month?</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="month-missed"
                        type="number"
                        value={monthMissed}
                        onChange={(e) =>
                          setMonthMissed(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <MonthResult
                    monthAttendance={monthAttendance}
                    requiredAttendance={requiredAttendance}
                  />
                </div>
              </TabsContent>

              {/* ========== Term Tab ========== */}
              <TabsContent value="term" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="months-passed">Months Passed</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How many full months have passed in the term?</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="months-passed"
                        type="number"
                        value={monthsPassed}
                        onChange={(e) =>
                          setMonthsPassed(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="weeks-passed">Weeks Passed</Label>
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
                        id="weeks-passed"
                        type="number"
                        value={weeksPassed}
                        onChange={(e) =>
                          setWeeksPassed(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="days-passed">Days Passed</Label>
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
                        id="days-passed"
                        type="number"
                        value={daysPassed}
                        onChange={(e) =>
                          setDaysPassed(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="term-attended">
                          Lectures Attended (Term)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Total lectures attended so far across the entire
                              term.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="term-attended"
                        type="number"
                        value={termAttended}
                        onChange={(e) =>
                          setTermAttended(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="term-missed">
                          Lectures Missed (Term)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Total lectures missed so far across the entire
                              term.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="term-missed"
                        type="number"
                        value={termMissed}
                        onChange={(e) =>
                          setTermMissed(parseIntOrZero(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <TermResult
                    termAttendance={termAttendance}
                    requiredAttendance={requiredAttendance}
                    monthsPassed={monthsPassed}
                    weeksPassed={weeksPassed}
                    daysPassed={daysPassed}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

// ========== Day Result Card ==========
function DayResult({
  dayAttendance,
  requiredAttendance,
}: {
  dayAttendance: number
  requiredAttendance: number
}) {
  const belowReq = dayAttendance < requiredAttendance
  const color = belowReq ? "bg-red-500" : "bg-green-500"
  const width = `${Math.min(dayAttendance, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`day-${dayAttendance}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Day Attendance: {dayAttendance.toFixed(2)}%
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

// ========== Week Result Card ==========
function WeekResult({
  weekAttendance,
  requiredAttendance,
}: {
  weekAttendance: number
  requiredAttendance: number
}) {
  const belowReq = weekAttendance < requiredAttendance
  const color = belowReq ? "bg-red-500" : "bg-green-500"
  const width = `${Math.min(weekAttendance, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`week-${weekAttendance}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Week Attendance: {weekAttendance.toFixed(2)}%
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

// ========== Month Result Card ==========
function MonthResult({
  monthAttendance,
  requiredAttendance,
}: {
  monthAttendance: number
  requiredAttendance: number
}) {
  const belowReq = monthAttendance < requiredAttendance
  const color = belowReq ? "bg-red-500" : "bg-green-500"
  const width = `${Math.min(monthAttendance, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`month-${monthAttendance}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Monthly Attendance: {monthAttendance.toFixed(2)}%
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

// ========== Term Result Card ==========
function TermResult({
  termAttendance,
  requiredAttendance,
  monthsPassed,
  weeksPassed,
  daysPassed,
}: {
  termAttendance: number
  requiredAttendance: number
  monthsPassed: number
  weeksPassed: number
  daysPassed: number
}) {
  const belowReq = termAttendance < requiredAttendance
  const color = belowReq ? "bg-red-500" : "bg-green-500"
  const width = `${Math.min(termAttendance, 100).toFixed(2)}%`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`term-${termAttendance}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <Alert className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Term Attendance: {termAttendance.toFixed(2)}%
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

        {/* Display how many months/weeks/days have passed for user reference */}
        <div className="mt-2 text-sm text-gray-600">
          <p>Months passed: {monthsPassed}</p>
          <p>Weeks passed: {weeksPassed}</p>
          <p>Days passed: {daysPassed}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
