"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function AttendanceCalculator() {
  const [schedule, setSchedule] = useState({
    Monday: 3,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 2,
  })

  const [currentWeek, setCurrentWeek] = useState(1)
  const [attendedLectures, setAttendedLectures] = useState(0)
  const [results, setResults] = useState({
    totalPerWeek: 0,
    requiredForWeek: 0,
    requiredForMonth: 0,
    requiredForTerm: 0,
    currentPercentage: 0,
  })

  const REQUIRED_PERCENTAGE = 85
  const WEEKS_IN_MONTH = 4
  const WEEKS_IN_TERM = 16

  useEffect(() => {
    const totalLecturesPerWeek = Object.values(schedule).reduce((a, b) => a + b, 0)
    const totalPossibleLectures = currentWeek * totalLecturesPerWeek
    const currentPercentage = (attendedLectures / totalPossibleLectures) * 100

    // Calculate required lectures for different periods
    const requiredForWeek = Math.ceil((REQUIRED_PERCENTAGE / 100) * totalLecturesPerWeek)
    const remainingWeeksInMonth = WEEKS_IN_MONTH - currentWeek
    const totalLecturesInMonth = WEEKS_IN_MONTH * totalLecturesPerWeek
    const requiredForMonth = Math.ceil((REQUIRED_PERCENTAGE / 100) * totalLecturesInMonth - attendedLectures)

    const remainingWeeksInTerm = WEEKS_IN_TERM - currentWeek
    const totalLecturesInTerm = WEEKS_IN_TERM * totalLecturesPerWeek
    const requiredForTerm = Math.ceil((REQUIRED_PERCENTAGE / 100) * totalLecturesInTerm - attendedLectures)

    setResults({
      totalPerWeek: totalLecturesPerWeek,
      requiredForWeek,
      requiredForMonth: Math.max(0, requiredForMonth),
      requiredForTerm: Math.max(0, requiredForTerm),
      currentPercentage: isNaN(currentPercentage) ? 0 : currentPercentage,
    })
  }, [schedule, currentWeek, attendedLectures])

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-week">Current Week</Label>
              <Input
                id="current-week"
                type="number"
                min="1"
                max="16"
                value={currentWeek}
                onChange={(e) => setCurrentWeek(Math.max(1, Number.parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attended">Lectures Attended</Label>
              <Input
                id="attended"
                type="number"
                min="0"
                value={attendedLectures}
                onChange={(e) => setAttendedLectures(Math.max(0, Number.parseInt(e.target.value) || 0))}
              />
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-2">
            <h3 className="font-medium">Weekly Schedule</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(schedule).map(([day, lectures]) => (
                <div key={day} className="space-y-2">
                  <Label htmlFor={day}>{day}</Label>
                  <Input
                    id={day}
                    type="number"
                    min="0"
                    value={lectures}
                    onChange={(e) =>
                      setSchedule((prev) => ({
                        ...prev,
                        [day]: Math.max(0, Number.parseInt(e.target.value) || 0),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>Current Attendance: {results.currentPercentage.toFixed(2)}%</AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <span>Total lectures per week:</span>
                <Badge variant="secondary">{results.totalPerWeek}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Required lectures this week for 85%:</span>
                <Badge>{results.requiredForWeek}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Required for month (remaining weeks):</span>
                <Badge>{results.requiredForMonth}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Required for term (remaining weeks):</span>
                <Badge>{results.requiredForTerm}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

