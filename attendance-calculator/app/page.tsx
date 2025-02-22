"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

// shadcn/ui components
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

// Toggle (checkbox) for invert
// You can also import a switch component from shadcn if you like.
function InvertToggle({
  inverted,
  onToggle,
}: {
  inverted: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Label>Invert Colors</Label>
      <input
        type="checkbox"
        checked={inverted}
        onChange={onToggle}
        className="h-4 w-4 cursor-pointer"
      />
    </div>
  )
}

export default function AttendanceCalculator() {
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
  const [theme, setTheme] = useState("zinc")

  // NEW: Whether colors are inverted
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

  // These classes control your accent/outline, etc.
  // The main container uses theming + an invert toggle for background/text.
  const themes: Record<string, string> = {
    zinc: "border-zinc-500 focus:ring-zinc-500",
    rose: "border-rose-500 focus:ring-rose-500",
    blue: "border-blue-500 focus:ring-blue-500",
    green: "border-green-500 focus:ring-green-500",
    purple: "border-purple-500 focus:ring-purple-500",
  }

  // Recompute all results whenever inputs change
  useEffect(() => {
    const totalLecturesPerWeek = Object.values(schedule).reduce(
      (a, b) => a + b,
      0
    )
    const totalPossibleLectures = currentWeek * totalLecturesPerWeek
    const totalTermLectures = WEEKS_IN_TERM * totalLecturesPerWeek

    // Required for week
    const requiredForWeek = Math.ceil(
      (REQUIRED_PERCENTAGE / 100) * totalLecturesPerWeek
    )

    // Monthly calculations
    const totalLecturesInMonth = WEEKS_IN_MONTH * totalLecturesPerWeek
    const rawRequiredForMonth = Math.ceil(
      (REQUIRED_PERCENTAGE / 100) * totalLecturesInMonth -
        (attendedLectures % totalLecturesInMonth)
    )
    const requiredForMonth = Math.max(0, rawRequiredForMonth)

    // Term calculations
    const rawRequiredForTerm = Math.ceil(
      (REQUIRED_PERCENTAGE / 100) * totalTermLectures - attendedLectures
    )
    const requiredForTerm = Math.max(0, rawRequiredForTerm)

    // Attendance percentage
    const currentPercentage =
      totalPossibleLectures === 0
        ? 0
        : (attendedLectures / totalPossibleLectures) * 100

    // Missable lectures
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

  // Keep currentAttendancePercentage in sync
  useEffect(() => {
    const totalPossibleLectures = currentWeek * results.totalPerWeek
    if (totalPossibleLectures > 0) {
      setCurrentAttendancePercentage(
        (attendedLectures / totalPossibleLectures) * 100
      )
    } else {
      setCurrentAttendancePercentage(0)
    }
  }, [attendedLectures, currentWeek, results.totalPerWeek])

  // Parse integer helper
  const parseIntValue = (val: string) => {
    const n = parseInt(val, 10)
    return isNaN(n) ? 0 : n
  }

  // For typing attendance percentage directly
  const handleAttendanceChange = (val: string) => {
    const parsed = parseFloat(val)
    if (isNaN(parsed)) return
    const percentage = Math.max(0, Math.min(100, parsed))
    setCurrentAttendancePercentage(percentage)
    const totalPossibleLectures = currentWeek * results.totalPerWeek
    const newAttended = Math.round((percentage / 100) * totalPossibleLectures)
    setAttendedLectures(newAttended)
  }

  // Container classes:
  // - Invert toggle => background black + text white (or vice versa)
  // - Use theme to style borders/outlines
  const containerClass = `
    min-h-screen p-4
    ${inverted ? "bg-black text-white" : "bg-white text-black"}
    ${themes[theme]}
  `

  return (
    <TooltipProvider>
      <div className={containerClass}>
        <Card className="max-w-2xl mx-auto space-y-4">
          <CardHeader>
            <CardTitle>Attendance Calculator</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Theming controls */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Theme dropdown */}
              <div className="flex items-center gap-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
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

              {/* Invert Colors toggle */}
              <InvertToggle
                inverted={inverted}
                onToggle={() => setInverted(!inverted)}
              />
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
                    <p>Set how many months are in your academic term</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="months-in-term"
                type="number"
                min={1}
                value={monthsInTerm}
                onChange={(e) => {
                  const val = parseIntValue(e.target.value)
                  setMonthsInTerm(val < 1 ? 1 : val)
                }}
              />
            </div>

            {/* Current Status Inputs */}
            <div className="grid grid-cols-2 gap-4">
              {/* Current Week */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="current-week">Current Week</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter which week you are currently in</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="current-week"
                  type="number"
                  min={1}
                  value={currentWeek}
                  onChange={(e) => {
                    const val = parseIntValue(e.target.value)
                    const clamped = Math.min(WEEKS_IN_TERM, Math.max(1, val))
                    setCurrentWeek(clamped)
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
                      <p>Enter your current attendance percentage</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="current-percentage"
                  type="number"
                  step={0.01}
                  min={0}
                  max={100}
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
                      <p>Enter how many lectures you have attended so far</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="attended"
                  type="number"
                  min={0}
                  value={attendedLectures}
                  onChange={(e) => {
                    const val = parseIntValue(e.target.value)
                    setAttendedLectures(val < 0 ? 0 : val)
                  }}
                />
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Weekly Schedule</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the number of lectures for each weekday</p>
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
                      min={0}
                      value={lectures}
                      onChange={(e) => {
                        const val = parseIntValue(e.target.value)
                        setSchedule((prev) => ({
                          ...prev,
                          [day]: val < 0 ? 0 : val,
                        }))
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
                      Current Attendance: {results.currentPercentage.toFixed(2)}
                      %
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

                {/* Weekly stats */}
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

                {/* Monthly stats */}
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

                {/* Term stats */}
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
