# Attendance Calculator

A personal project built to help determine how many lectures you can skip without your attendance falling below a specific threshold. What started as a simple experiment evolved into a fully interactive attendance tracker with a variety of features and customization options.

---

## Table of Contents

- [Introduction & Motivation](#introduction--motivation)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Detailed Functionality](#detailed-functionality)
- [Future Improvements](#future-improvements)
- [Contact](#contact)
- [License](#license)

---

## Introduction & Motivation

This project was initially created as a personal challenge to figure out the maximum number of lectures I could skip without jeopardizing my required attendance percentage. Over time, I expanded its functionality by adding detailed calculations for weekly, monthly, and term-based attendance. The project now serves as a versatile tool for students who want to monitor and plan their attendance effectively.

---

## Features

- **Dynamic Theming:**  
  Customize the UI with multiple themes (rose, zinc, blue, green, purple) and an option to invert the color scheme.

- **Real-Time Calculations:**  
  Automatically computes weekly, monthly, and term totals based on your daily lecture schedule.

- **Customizable Global Settings:**  
  Set your required attendance percentage and the number of months in a term.

- **Detailed Attendance Breakdown:**  
  Input partial data (weeks and days passed) to get precise calculations of attended and missed lectures for both month and term.

- **Animated UI:**  
  Uses [Framer Motion](https://www.framer.com/motion/) for smooth transitions and alerts, enhancing the user experience.

- **Responsive and Accessible UI Components:**  
  Built using [shadcn/ui](https://ui.shadcn.com/) components for consistency and accessibility.

---

## Installation

To run this project locally, follow these steps:

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/attendance-calculator.git
   cd attendance-calculator
Install Dependencies:

Make sure you have Node.js installed. Then run:

bash
Copy
Edit
npm install
Run the Development Server:

bash
Copy
Edit
npm run dev
Open your browser and navigate to http://localhost:3000 to view the application.

Usage
Once the application is running:

Set Global Settings:
Adjust the required attendance percentage and define the number of months in your term.

Configure Your Daily Schedule:
Input the number of lectures for each day (Monday through Saturday). The app automatically calculates the weekly, monthly, and full-term totals.

Monthly Attendance:
Enter the current month number, the number of complete weeks and additional days passed, and your current attendance percentage for that month. The app displays the number of lectures attended and missed, along with a visual progress bar.

Term Attendance (Optional):
For a broader view, input the number of full months, weeks, and days passed in the term along with the current term attendance percentage. The tool then computes your overall term attendance.

Theming Options:
Use the dropdown menu to select a theme and toggle the inversion option to change the overall look and feel of the application.

Detailed Functionality
Theme & Inversion
Theme Map:
A mapping object defines different color classes for container and card elements based on the selected theme.

Invert Toggle:
A minimal checkbox component to invert the theme colors for a darker or lighter appearance.

Global Settings
Required Attendance %:
Sets the minimum attendance threshold, influencing the color of the progress bars (red if below, green if above).

Months in Term:
Defines the number of months that make up a full term, which is used to compute term totals.

Daily Schedule
Schedule State:
Allows you to input lectures for each day (Monday–Saturday). These values are summed to create weekly and monthly totals.

Computed Totals:
Automatically computes:

Weekly Total: Sum of daily lectures.
Monthly Total: Weekly total multiplied by 4.
Term Total: Monthly total multiplied by the number of months in the term.
Monthly & Term Calculations
Partial Month Calculation:
Uses inputs for weeks and days passed in the current month to compute the partial month total. Then, it calculates attended versus missed lectures based on the current attendance percentage.

Partial Term Calculation:
Similarly computes the term attendance using full months, additional weeks, and days passed, providing a detailed breakdown.

Utility Functions
parseIntOrZero:
Clamps a given input to an integer ≥ 0.

computeFromPct:
Rounds the percentage of total lectures attended and calculates the number of missed lectures.

calcSkipAllowed:
Determines the maximum number of lectures that can be skipped while still meeting the required attendance.

sumFirstNDays:
Sums the lectures from Monday to Saturday for a given number of days, useful for calculating partial week totals.

Animated Display Components
MonthDisplay & TermDisplay:
Components that utilize Framer Motion to animate the progress bars and attendance alerts, providing visual feedback on attendance performance.
Future Improvements
Enhanced Validation:
Improve input validation and error handling for edge cases.

Responsive Design:
Further optimize the UI for mobile devices.

Data Persistence:
Add local storage or cloud-based persistence to save user progress.

Export Functionality:
Allow users to export their attendance data as CSV or PDF.

Unit Testing:
Implement comprehensive tests to ensure reliability.

Additional Metrics:
Introduce more detailed analytics and historical performance tracking.

Contact
For feedback, suggestions, or any inquiries, feel free to reach out:

Email: your.email@example.com
GitHub Issues: Open an issue on the GitHub repository.
License
This project is licensed under the MIT License. See the LICENSE file for details.


