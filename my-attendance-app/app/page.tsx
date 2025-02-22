"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon, HelpCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [currentAttendancePercentage, setCurrentAttendancePercentage] = useState<number>(0)
  const [theme, setTheme] = useState("zinc")
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

  // Theme configuration
  const themes = {
    zinc: {
      primary: "bg-zinc-950",
      secondary: "bg-zinc-900",
      accent: "bg-zinc-800",
    },
    rose: {
      primary: "bg-rose-950",
      secondary: "bg-rose-900",
      accent: "bg-rose-800",
    },
    blue: {
      primary: "bg-blue-950",
      secondary: "bg-blue-900",
      accent: "bg-blue-800",
    },
    green: {
      primary: "bg-green-950",
      secondary: "bg-green-900",
      accent: "bg-green-800",
    },
    purple: {
      primary: "bg-purple-950",
      secondary: "bg-purple-900",
      accent: "bg-purple-800",
    },
  }

  useEffect(() => {
    const totalLecturesPerWeek = Object.values(schedule).reduce((a, b) => a + b, 0)
    const totalPossibleLectures = currentWeek * totalLecturesPerWeek
    const totalTermLectures = WEEKS_IN_TERM * totalLecturesPerWeek

    // Calculate required lectures for different periods
    const requiredForWeek = Math.ceil((REQUIRED_PERCENTAGE / 100) * totalLecturesPerWeek)

    // Monthly calculations
    const totalLecturesInMonth = WEEKS_IN_MONTH * totalLecturesPerWeek
    const requiredForMonth = Math.ceil(
      (REQUIRED_PERCENTAGE / 100) * totalLecturesInMonth - (attendedLectures % totalLecturesInMonth),
    )

    // Term calculations
    const requiredForTerm = Math.ceil((REQUIRED_PERCENTAGE / 100) * totalTermLectures - attendedLectures)

    // Calculate missable lectures
    const minimumRequired = Math.ceil((REQUIRED_PERCENTAGE / 100) * totalTermLectures)
    const missableTotal = totalTermLectures - minimumRequired
    const missableRemaining = Math.max(0, missableTotal - (totalPossibleLectures - attendedLectures))

    setResults({
      totalPerWeek: totalLecturesPerWeek,
      requiredForWeek,
      requiredForMonth: Math.max(0, requiredForMonth),
      requiredForTerm: Math.max(0, requiredForTerm),
      currentPercentage: totalPossibleLectures === 0 ? 0 : (attendedLectures / totalPossibleLectures) * 100,
      missableLectures: missableRemaining,
    })
  }, [schedule, currentWeek, attendedLectures, WEEKS_IN_TERM])

  // Sync attendance percentage when lectures change
  useEffect(() => {
    const totalPossibleLectures = currentWeek * results.totalPerWeek
    if (totalPossibleLectures > 0) {
      setCurrentAttendancePercentage((attendedLectures / totalPossibleLectures) * 100)
    }
  }, [attendedLectures, currentWeek, results.totalPerWeek])

  // Handle attendance percentage change
  const handleAttendanceChange = (value: string) => {
    const percentage = Math.min(100, Math.max(0, Number.parseFloat(value) || 0))
    setCurrentAttendancePercentage(percentage)
    const totalPossibleLectures = currentWeek * results.totalPerWeek
    const newLectures = Math.round((percentage / 100) * totalPossibleLectures)
    setAttendedLectures(newLectures)
  }

  return (
    <TooltipProvider>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Attendance Calculator</CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Term Configuration */}
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={monthsInTerm}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "")
                  setMonthsInTerm(value === "" ? 1 : Math.max(1, Number.parseInt(value)))
                }}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Current Status Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="current-week">Current Week</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter which week you are currently in (1-{WEEKS_IN_TERM})</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="current-week"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={currentWeek}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "")
                    setCurrentWeek(value === "" ? 1 : Math.max(1, Math.min(WEEKS_IN_TERM, Number.parseInt(value))))
                  }}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="current-percentage">Current Attendance %</Label>
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
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={currentAttendancePercentage.toFixed(2)}
                  onChange={(e) => handleAttendanceChange(e.target.value)}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

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
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={attendedLectures}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "")
                    setAttendedLectures(value === "" ? 0 : Number.parseInt(value))
                  }}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    <p>Enter the number of lectures for each day</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(schedule).map(([day, lectures]) => (
                  <div key={day} className="space-y-2">
                    <Label htmlFor={day}>{day}</Label>
                    <Input
                      id={day}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={lectures}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "")
                        setSchedule((prev) => ({
                          ...prev,
                          [day]: value === "" ? 0 : Number.parseInt(value),
                        }))
                      }}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    <AlertDescription>Current Attendance: {results.currentPercentage.toFixed(2)}%</AlertDescription>
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
                      <Badge variant="outline">{Math.max(0, results.totalPerWeek - results.requiredForWeek)}</Badge>
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
                      <Badge variant="outline">{results.missableLectures}</Badge>
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

