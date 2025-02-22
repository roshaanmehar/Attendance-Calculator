"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon, HelpCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

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
  const [currentAttendancePercentage, setCurrentAttendancePercentage] = useState<number | null>(null)
  const [usePercentageInput, setUsePercentageInput] = useState(false)
  const [results, setResults] = useState({
    totalPerWeek: 0,
    requiredForWeek: 0,
    requiredForMonth: 0,
    requiredForTerm: 0,
    currentPercentage: 0,
    calculatedLecturesAttended: 0,
  })

  const REQUIRED_PERCENTAGE = 85
  const WEEKS_IN_MONTH = 4
  const WEEKS_IN_TERM = useMemo(() => monthsInTerm * WEEKS_IN_MONTH, [monthsInTerm])

  useEffect(() => {
    const totalLecturesPerWeek = Object.values(schedule).reduce((a, b) => a + b, 0)
    const totalPossibleLectures = currentWeek * totalLecturesPerWeek

    let currentPercentage = 0
    let lecturesAttended = attendedLectures

    // If using percentage input, calculate lectures attended
    if (usePercentageInput && currentAttendancePercentage !== null) {
      lecturesAttended = Math.ceil((currentAttendancePercentage / 100) * totalPossibleLectures)
      setAttendedLectures(lecturesAttended)
    } else {
      currentPercentage = (attendedLectures / totalPossibleLectures) * 100
    }

    // Calculate required lectures for different periods
    const requiredForWeek = Math.ceil((REQUIRED_PERCENTAGE / 100) * totalLecturesPerWeek)

    // Monthly calculations
    const remainingWeeksInMonth = WEEKS_IN_MONTH - (currentWeek % WEEKS_IN_MONTH)
    const currentMonth = Math.ceil(currentWeek / WEEKS_IN_MONTH)
    const totalLecturesInMonth = WEEKS_IN_MONTH * totalLecturesPerWeek
    const requiredForMonth = Math.ceil(
      (REQUIRED_PERCENTAGE / 100) * totalLecturesInMonth - (attendedLectures % totalLecturesInMonth),
    )

    // Term calculations
    const remainingWeeksInTerm = WEEKS_IN_TERM - currentWeek
    const totalLecturesInTerm = WEEKS_IN_TERM * totalLecturesPerWeek
    const requiredForTerm = Math.ceil((REQUIRED_PERCENTAGE / 100) * totalLecturesInTerm - attendedLectures)

    setResults({
      totalPerWeek: totalLecturesPerWeek,
      requiredForWeek,
      requiredForMonth: Math.max(0, requiredForMonth),
      requiredForTerm: Math.max(0, requiredForTerm),
      currentPercentage: usePercentageInput
        ? currentAttendancePercentage || 0
        : isNaN(currentPercentage)
          ? 0
          : currentPercentage,
      calculatedLecturesAttended: lecturesAttended,
    })
  }, [schedule, currentWeek, attendedLectures, currentAttendancePercentage, usePercentageInput, WEEKS_IN_TERM])

  return (
    <TooltipProvider>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Calculator</CardTitle>
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
                type="number"
                value={monthsInTerm}
                onChange={(e) => setMonthsInTerm(Math.max(1, Number.parseInt(e.target.value) || 1))}
              />
            </div>

            {/* Input Method Toggle */}
            <div className="flex items-center space-x-2">
              <Switch checked={usePercentageInput} onCheckedChange={setUsePercentageInput} />
              <Label>Use percentage instead of lectures attended</Label>
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
                  type="number"
                  min="1"
                  max={WEEKS_IN_TERM}
                  value={currentWeek}
                  onChange={(e) => {
                    const value = e.target.value
                    setCurrentWeek(value === "" ? 1 : Math.max(1, Number.parseInt(value)))
                  }}
                />
              </div>

              {usePercentageInput ? (
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
                    type="number"
                    min="0"
                    max="100"
                    value={currentAttendancePercentage || ""}
                    onChange={(e) => {
                      const value = e.target.value
                      setCurrentAttendancePercentage(
                        value === "" ? null : Math.min(100, Math.max(0, Number.parseFloat(value))),
                      )
                    }}
                  />
                </div>
              ) : (
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
                    min="0"
                    value={attendedLectures}
                    onChange={(e) => {
                      const value = e.target.value
                      setAttendedLectures(value === "" ? 0 : Math.max(0, Number.parseInt(value)))
                    }}
                  />
                </div>
              )}
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
                      type="number"
                      min="0"
                      value={lectures}
                      onChange={(e) => {
                        const value = e.target.value
                        setSchedule((prev) => ({
                          ...prev,
                          [day]: value === "" ? 0 : Math.max(0, Number.parseInt(value)),
                        }))
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Current Attendance: {results.currentPercentage.toFixed(2)}%
                  {usePercentageInput && <> (Calculated lectures attended: {results.calculatedLecturesAttended})</>}
                </AlertDescription>
              </Alert>

              <Tabs defaultValue="week">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="term">Term</TabsTrigger>
                </TabsList>
                <TabsContent value="week" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <span>Total lectures per week:</span>
                      <Badge variant="secondary">{results.totalPerWeek}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Required lectures this week for 85%:</span>
                      <Badge>{results.requiredForWeek}</Badge>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="month" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Required for current month:</span>
                    <Badge>{results.requiredForMonth}</Badge>
                  </div>
                </TabsContent>
                <TabsContent value="term" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Required for term ({monthsInTerm} months):</span>
                    <Badge>{results.requiredForTerm}</Badge>
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

