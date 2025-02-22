<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Attendance Calculator</title>
  <style>
    /* Basic styling */
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #333;
    }
    pre {
      background: #eee;
      padding: 10px;
      overflow-x: auto;
    }
    code {
      background: #eee;
      padding: 2px 4px;
      border-radius: 4px;
    }
    a {
      color: #007BFF;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 20px 0;
    }
    ul, ol {
      margin-left: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Attendance Calculator</h1>
    <p>
      A personal project built to help determine how many lectures you can skip without your attendance falling below a specific threshold. What started as a simple experiment evolved into a fully interactive attendance tracker with detailed calculations for weekly, monthly, and term-based attendance.
    </p>
    <hr />
    <h2>Table of Contents</h2>
    <ul>
      <li><a href="#introduction-motivation">Introduction &amp; Motivation</a></li>
      <li><a href="#features">Features</a></li>
      <li><a href="#installation">Installation</a></li>
      <li><a href="#usage">Usage</a></li>
      <li><a href="#detailed-functionality">Detailed Functionality</a></li>
      <li><a href="#future-improvements">Future Improvements</a></li>
      <li><a href="#contact">Contact</a></li>
      <li><a href="#license">License</a></li>
    </ul>
    <hr />
    <h2 id="introduction-motivation">Introduction &amp; Motivation</h2>
    <p>
      This project was initially created as a personal challenge to figure out the maximum number of lectures I could skip without jeopardizing my required attendance percentage. Over time, I expanded its functionality by gradually implementing additional features to handle different attendance calculations and provide a better user experience. The goal is to help students monitor and plan their attendance effectively.
    </p>
    <h2 id="features">Features</h2>
    <ul>
      <li><strong>Dynamic Theming:</strong> Customize the UI with multiple themes (rose, zinc, blue, green, purple) and an option to invert the color scheme.</li>
      <li><strong>Real-Time Calculations:</strong> Automatically computes weekly, monthly, and term totals based on your daily lecture schedule.</li>
      <li><strong>Customizable Global Settings:</strong> Set your required attendance percentage and the number of months in a term.</li>
      <li><strong>Detailed Attendance Breakdown:</strong> Input partial data (weeks and days passed) to get precise calculations of attended and missed lectures for both month and term.</li>
      <li><strong>Animated UI:</strong> Uses <a href="https://www.framer.com/motion/" target="_blank">Framer Motion</a> for smooth transitions and alerts.</li>
      <li><strong>Responsive &amp; Accessible Components:</strong> Built using <a href="https://ui.shadcn.com/" target="_blank">shadcn/ui</a> for a consistent, accessible design.</li>
    </ul>
    <h2 id="installation">Installation</h2>
    <p>To run this project locally, follow these steps:</p>
    <ol>
      <li>
        <strong>Clone the Repository:</strong>
        <pre><code>git clone https://github.com/your-username/attendance-calculator.git
cd attendance-calculator</code></pre>
      </li>
      <li>
        <strong>Install Dependencies:</strong>
        <p>Make sure you have <a href="https://nodejs.org/" target="_blank">Node.js</a> installed. Then run:</p>
        <pre><code>npm install</code></pre>
      </li>
      <li>
        <strong>Run the Development Server:</strong>
        <pre><code>npm run dev</code></pre>
        <p>
          Open your browser and navigate to <code>http://localhost:3000</code> to view the application.
        </p>
      </li>
    </ol>
    <h2 id="usage">Usage</h2>
    <p>Once the application is running:</p>
    <ol>
      <li><strong>Set Global Settings:</strong> Adjust the required attendance percentage and define the number of months in your term.</li>
      <li><strong>Configure Your Daily Schedule:</strong> Input the number of lectures for each day (Monday through Saturday). The app automatically calculates the weekly, monthly, and full-term totals.</li>
      <li><strong>Monthly Attendance:</strong> Enter the current month number, the number of complete weeks and additional days passed, and your current attendance percentage for that month. The application displays the number of lectures attended and missed, along with a visual progress bar.</li>
      <li><strong>Term Attendance (Optional):</strong> For a broader view, input the number of full months, weeks, and days passed in the term along with the current term attendance percentage. The tool computes your overall term attendance.</li>
      <li><strong>Theming Options:</strong> Use the dropdown menu to select a theme and toggle the inversion option to change the overall look and feel.</li>
    </ol>
    <h2 id="detailed-functionality">Detailed Functionality</h2>
    <h3>Theme &amp; Inversion</h3>
    <ul>
      <li><strong>Theme Map:</strong> A mapping object defines different color classes for container and card elements based on the selected theme.</li>
      <li><strong>Invert Toggle:</strong> A minimal checkbox component to invert the theme colors for a darker or lighter appearance.</li>
    </ul>
    <h3>Global Settings</h3>
    <ul>
      <li><strong>Required Attendance %:</strong> Sets the minimum attendance threshold. This influences the progress bar color—red if below the threshold and green if above.</li>
      <li><strong>Months in Term:</strong> Defines the number of months that make up a full term, which is used to compute term totals.</li>
    </ul>
    <h3>Daily Schedule</h3>
    <ul>
      <li><strong>Schedule State:</strong> Allows you to input the number of lectures for each day (Monday–Saturday). These values are summed to create weekly and monthly totals.</li>
      <li>
        <strong>Computed Totals:</strong>
        <ul>
          <li><em>Weekly Total:</em> Sum of daily lectures.</li>
          <li><em>Monthly Total:</em> Weekly total multiplied by 4.</li>
          <li><em>Term Total:</em> Monthly total multiplied by the number of months in the term.</li>
        </ul>
      </li>
    </ul>
    <h3>Monthly &amp; Term Calculations</h3>
    <ul>
      <li><strong>Partial Month Calculation:</strong> Uses the number of weeks and days passed in the current month to compute a partial total. It then calculates attended versus missed lectures based on the current attendance percentage.</li>
      <li><strong>Partial Term Calculation:</strong> Computes the overall term attendance by combining full months, additional weeks, and days passed.</li>
    </ul>
    <h3>Utility Functions</h3>
    <ul>
      <li><strong>parseIntOrZero:</strong> Converts a string to an integer, ensuring a minimum value of 0.</li>
      <li><strong>computeFromPct:</strong> Rounds the computed percentage of lectures attended and calculates the number of missed lectures.</li>
      <li><strong>calcSkipAllowed:</strong> Determines the maximum number of lectures that can be skipped while still meeting the required attendance.</li>
      <li><strong>sumFirstNDays:</strong> Sums the lectures from Monday to Saturday for a given number of days, used in calculating partial week totals.</li>
    </ul>
    <h3>Animated Display Components</h3>
    <ul>
      <li><strong>MonthDisplay &amp; TermDisplay:</strong> Use Framer Motion to animate progress bars and alerts, providing visual feedback on attendance performance.</li>
    </ul>
    <h2 id="future-improvements">Future Improvements</h2>
    <ul>
      <li><strong>Enhanced Input Validation:</strong> Improve validation and error handling for edge cases.</li>
      <li><strong>Responsive Design Enhancements:</strong> Further optimize the UI for mobile devices.</li>
      <li><strong>Data Persistence:</strong> Add local storage or cloud-based persistence to save user data.</li>
      <li><strong>Export Functionality:</strong> Allow users to export attendance data as CSV or PDF.</li>
      <li><strong>Unit Testing:</strong> Implement comprehensive tests to ensure reliability.</li>
      <li><strong>Advanced Analytics:</strong> Introduce detailed historical tracking and performance metrics.</li>
    </ul>
    <h2 id="contact">Contact</h2>
    <p>For feedback, suggestions, or any inquiries, feel free to reach out:</p>
    <ul>
      <li><strong>Email:</strong> <a href="mailto:your.email@example.com">your.email@example.com</a></li>
      <li><strong>GitHub Issues:</strong> Open an issue on the <a href="https://github.com/your-username/attendance-calculator/issues" target="_blank">GitHub repository</a>.</li>
    </ul>
    <h2 id="license">License</h2>
    <p>This project is licensed under the MIT License. See the <code>LICENSE</code> file for details.</p>
  </div>
</body>
</html>


