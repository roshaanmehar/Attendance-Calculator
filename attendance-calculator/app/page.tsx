"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ShadCN/UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

// A nicer switch for "Invert Colors" would be from shadcn's Switch component,
// but here's a basic checkbox to keep dependencies minimal.
function InvertToggle({
  inverted,
  onChange,
}: {
  inverted: boolean
  onChange: (value: boolean) => void
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

// Theme definitions: each theme has "normal" (light) and "invert" (dark)
const themeMap = {
  zinc: {
    normal: "bg-zinc-100 text-zinc-900",
    invert: "bg-zinc-900 text-zinc-100",
  },
  rose: {
    normal: "bg-rose-100 text-rose-900",
    invert: "bg-rose-900 text-rose-100",
  },
  blue: {
    normal: "bg-blue-100 text-blue-900",
    invert: "bg-blue-900 text-blue-100",
  },
  green: {
    normal: "bg-green-100 text-green-900",
    invert: "bg-green-900 text-green-100",
  },
  purple: {
    normal: "bg-purple-100 text-purple-900",
    invert: "bg-purple-900 text-purple-100",
  },
}

// Helper to parse integer from text; empty -> 0; negative -> clamp at 0
function parseIntOrZero(str: string) {
  const parsed = parseInt(str, 10)
  if (isNaN(parsed) || parsed < 0) return 0
  return parsed
}

// Helper to parse attendance percentage
function parseFloatClamped(str: string, min = 0, max = 100) {
  const parsed = parseFloat(str)
  if (isNaN(parsed)) return min
  return Math.max(min, Math.min(max, parsed))
}

export default function AttendanceCalculator() {
  // Basic states
  const [schedule, setSchedule] = useState({
    Monday: 3,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 2,
  })
  const [currentWeek, setCurrentWeek] = useState(1)
  const [monthsInTerm, setMonthsInTerm] = useState(4)
  const [attendedLectures, setAttendedLectures] = useState(0)
  const [currentAttendancePercentage, setCurrentAttendancePercentage] =
    useState<number>(0)

  // Theming states
  const [theme, setTheme] = useState<keyof typeof themeMap>("zinc")
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

  const REQUIRED_PERCENTAGE = 85
  const WEEKS_IN_MONTH = 4
  const WEEKS_IN_TERM = useMemo(
    () => monthsInTerm * WEEKS_IN_MONTH,
    [monthsInTerm]
  )

  // Recompute results whenever inputs change
  useEffect(() => {
    const totalLecturesPerWeek = Object.values(schedule).reduce(
      (a, b) => a + b,
      0
    )
    const totalPossibleLectures = currentWeek * totalLecturesPerWeek
    const totalTermLectures = WEEKS_IN_TERM * totalLecturesPerWeek

    const requiredForWeek = Math.ceil(
      (REQUIRED_PERCENTAGE / 100) * totalLecturesPerWeek
    )

    // monthly
    const totalLecturesInMonth = WEEKS_IN_MONTH * totalLecturesPerWeek
    const rawRequiredForMonth = Math.ceil(
      (REQUIRED_PERCENTAGE / 100) * totalLecturesInMonth -
        (attendedLectures % totalLecturesInMonth)
    )
    const requiredForMonth = Math.max(0, rawRequiredForMonth)

    // term
    const rawRequiredForTerm = Math.ceil(
      (REQUIRED_PERCENTAGE / 100) * totalTermLectures - attendedLectures
    )
    const requiredForTerm = Math.max(0, rawRequiredForTerm)

    // Current attendance
    const currentPercentage =
      totalPossibleLectures === 0
        ? 0
        : (attendedLectures / totalPossibleLectures) * 100

    // Missable
    const minimumRequired = Math.ceil(
      (REQUIRED_PERCENTAGE / 100) * totalTermLectures
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
  }, [schedule, currentWeek, attendedLectures, WEEKS_IN_TERM])

  // Keep the numeric percentage in sync
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

  // Called when user types a new attendance percentage
  const handleAttendanceChange = (val: string) => {
    const newPercent = parseFloatClamped(val)
    setCurrentAttendancePercentage(newPercent)
    const totalPossibleLectures = results.totalPerWeek * currentWeek
    const calculatedAttended = Math.round((newPercent / 100) * totalPossibleLectures)
    setAttendedLectures(calculatedAttended)
  }

  // The final theme classes for the entire page
  const themeClasses = inverted
    ? themeMap[theme].invert
    : themeMap[theme].normal

  return (
    <TooltipProvider>
      {/* 
        Full-page container uses the chosen theme.
        "min-h-screen" ensures it covers the full viewport.
      */}
      <div className={`min-h-screen w-full p-4 ${themeClasses}`}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Attendance Calculator</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Theming Controls */}
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
                    <SelectItem value="zinc">Zinc</SelectItem>
                    <SelectItem value="rose">Rose</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invert toggle */}
              <InvertToggle inverted={inverted} onChange={setInverted} />
            </div>

            {/* Term config */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="months-in-term">Months in Term</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Set how many months are in your academic term.</p>
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

            {/* Current status inputs */}
            <div className="grid grid-cols-2 gap-4">
              {/* Week */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="current-week">Current Week</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Which week are you on? Max is {WEEKS_IN_TERM} for this
                        term.
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
                    // clamp to not exceed WEEKS_IN_TERM
                    setCurrentWeek(Math.min(val, WEEKS_IN_TERM))
                  }}
                />
              </div>

              {/* Percentage */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="current-percentage">
                    Current Attendance %
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter your current attendance percentage (0-100).</p>
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
              <div className="space-y-2">
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
                  onChange={(e) =>
                    setAttendedLectures(parseIntOrZero(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Weekly schedule */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Weekly Schedule</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter how many lectures occur each weekday.</p>
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

            {/* Results */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`alert-${results.currentPercentage}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      Current Attendance: {results.currentPercentage.toFixed(2)}%
                    </AlertDescription>
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
                      <span>Required lectures this week for 85%:</span>
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
                    <span>Required for current month:</span>
                    <Badge>{results.requiredForMonth}</Badge>
                  </motion.div>
                </TabsContent>

                {/* Term */}
                <TabsContent value="term" className="space-y-4">
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between items-center"
                    >
                      <span>Required for term ({monthsInTerm} months):</span>
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
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
