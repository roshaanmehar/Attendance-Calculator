"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Shadcn/UI components
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

// Simple "Invert" checkbox
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
 * Each theme gets two sets of classes:
 * - containerNormal / containerInvert => outer page background
 * - cardNormal / cardInvert => card background
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
  const [attendedLectures, setAttendedLectures] = useState(0)
  const [currentAttendancePercentage, setCurrentAttendancePercentage] = useState(0)

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

  const REQUIRED_PERCENTAGE = 85
  const WEEKS_IN_MONTH = 4
  const WEEKS_IN_TERM = useMemo(() => monthsInTerm * WEEKS_IN_MONTH, [monthsInTerm])

  // Recalculate results
  useEffect(() => {
    const totalLecturesPerWeek = Object.values(schedule).reduce((a, b) => a + b, 0)
    const totalPossibleLectures = currentWeek * totalLecturesPerWeek
    const totalTermLectures = WEEKS_IN_TERM * totalLecturesPerWeek

    const requiredForWeek = Math.ceil((REQUIRED_PERCENTAGE / 100) * totalLecturesPerWeek)

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

    // percentage
    const currentPercentage =
      totalPossibleLectures === 0
        ? 0
        : (attendedLectures / totalPossibleLectures) * 100

    // missable
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

  // Sync numeric attendance percentage
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

  // Compute theme classes for container + card
  const containerClass = inverted
    ? themeMap[theme].containerInvert
    : themeMap[theme].containerNormal
  const cardClass = inverted
    ? themeMap[theme].cardInvert
    : themeMap[theme].cardNormal

  return (
    <TooltipProvider>
      {/* The entire page uses the selected theme variant */}
      <div className={`min-h-screen w-full p-4 ${containerClass}`}>
        <Card className={`max-w-2xl mx-auto ${cardClass}`}>
          <CardHeader>
            <CardTitle>Attendance Calculator</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Theme controls */}
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

            {/* Months in Term */}
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
                      <p>Which week are you currently in?</p>
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

              {/* Attendance % */}
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
                      <p>Type your current attendance percentage (0-100).</p>
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
                  onChange={(e) => setAttendedLectures(parseIntOrZero(e.target.value))}
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
                        {Math.max(0, results.totalPerWeek - results.requiredForWeek)}
                      </Badge>
                    </motion.div>
                  </div>
                </TabsContent>

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
