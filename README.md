Attendance Calculator 📊

A React-based tool to calculate how many lectures you can miss while maintaining your desired attendance percentage. Supports daily, monthly, and term-based tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

![Demo](https://via.placeholder.com/800x400?text=Attendance+Calculator+Demo) <!-- Replace with actual screenshot -->

---

## Table of Contents
- [Motivation](#motivation)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Limitations](#limitations)
- [Future Roadmap](#future-roadmap)
- [Contact](#contact)

---

## Motivation
Students often struggle to balance attendance requirements with other commitments. This tool answers:  
***"How many lectures can I skip without falling below my institution's attendance threshold?"***  

Originally built for personal use, it now supports:
- Daily schedule customization
- Monthly progress tracking
- Term-wide attendance management

---

## Key Features
✅ **Daily Schedule Builder**  
- Set lectures per weekday (Mon-Sat)
- Auto-calculates weekly/monthly totals

🎯 **Attendance Calculator**  
- Input current attendance percentage
- See exact attended/missed lecture counts
- Visual progress bars with threshold indicators

📅 **Flexible Tracking**  
- Monthly: Track by weeks + extra days
- Term: Combine months + weeks + days

🎨 **Theme Customization**  
- Multiple color palettes (Rose, Zinc, Blue, etc.)
- Light/dark mode toggle

---

## How It Works

### Daily Schedule
```math
Weekly Total = Σ (Mon + Tue + Wed + Thu + Fri + Sat)
Monthly Total = Weekly Total × 4

Monthly Tracking
math
Copy

Partial Month Total = (Weeks Passed × Weekly Total) + Extra Days
Attended = (Current % × Partial Month Total) / 100
Missed = Partial Month Total - Attended

Term Tracking
math
Copy

Partial Term Total = (Months Passed × Monthly Total) + (Weeks × Weekly Total) + Extra Days
Term Attended = (Term % × Partial Term Total) / 100

Tech Stack

Frontend
React
Next.js
TypeScript

UI Components
Shadcn/ui
Framer Motion
Lucide Icons
Installation

    Clone repository:
    bash
    Copy

    git clone https://github.com/yourusername/attendance-calculator.git
    cd attendance-calculator

    Install dependencies:
    bash
    Copy

    npm install
    # or
    yarn

    Start development server:
    bash
    Copy

    npm run dev
    # or
    yarn dev

    Open in browser: http://localhost:3000

Usage

    Set Up Schedule

        Enter lectures for each weekday

        System auto-calculates weekly/monthly totals

    Track Monthly Attendance

        Enter completed weeks + extra days

        Input current attendance percentage

        View attended/missed counts

    Monitor Term Progress

        Specify completed months + extra weeks/days

        Input term attendance percentage

        See overall performance

    Customize Appearance

        Click palette icon to change theme

        Toggle between light/dark modes

Contributing

We welcome contributions! Here's how:

    Fork the repository

    Create your feature branch:
    bash
    Copy

    git checkout -b feature/amazing-feature

    Commit changes:
    bash
    Copy

    git commit -m 'Add amazing feature'

    Push to branch:
    bash
    Copy

    git push origin feature/amazing-feature

    Open a Pull Request

License

Distributed under the MIT License. See LICENSE for details.
Limitations

    Assumes 4-week months (fixed duration)

    No holiday/break accommodation

    Manual data entry required

Future Roadmap

    Dynamic skip allowance calculator

    Calendar integration (Google/Outlook)

    Automatic percentage projections

    Mobile app version

    PDF report generation

Contact

For questions/suggestions:
📧 your.email@example.com
🐦 @yourtwitterhandle
