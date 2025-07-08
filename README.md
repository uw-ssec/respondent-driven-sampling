## Overview

The RDS App is a secure, accessible, and open-source web application that streamlines data collection for homelessness research using **Respondent-Driven Sampling (RDS)**. Developed in collaboration with the University of Washington iSchool and the King County Regional Homelessness Authority (KCRHA), this app enables volunteers and administrators to collect accurate survey data, track referrals, and generate population estimates more effectively than traditional Point-In-Time (PIT) counts.

> 📍 **Live Deployment:** [Link to App](https://rdspitapp-b5aqd7czezfggta2.westus-01.azurewebsites.net/login)
> 🧠 **Research-Driven:** Based on field-tested RDS methodologies  
> 🔐 **Secure & Compliant:** Built with HIPAA and HUD compliance in mind

## 📄 Project Documentation

For a full overview of system architecture, development process, API design, testing protocols, and stakeholder insights, please refer to our full project documentation:

👉 [RDS App Capstone Documentation](https://docs.google.com/document/d/11gVmNGchNJOIPVri7CZD19c34Q7veDuBgXCw-ZixZR4/edit?usp=sharing)

This document outlines critical decisions, technical diagrams, and recommendations for future developers and collaborators.

## Tech Stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | React, HTML/CSS, JavaScript |
| Backend      | Node.js, Express.js |
| Database     | MongoDB |
| Auth         | Twilio |
| Hosting      | Azure Web Service |
| QR Scanning  | Html5QrcodeScanner, QRCodeCanvas |

## Directory

```plaintext
client/                   # Client-facing React application
├── build/                # Production build of the React app
├── static/               # Static assets (JS, CSS, media)
│   ├── js/               # Compiled JS chunks
│   │   ├── 488.db91e947.chunk.js         # Bundled JS code for part of the React app
│   │   └── 488.db91e947.chunk.js.map     # Source map for debugging that chunk
│   ├── asset-manifest.json               # Maps file names to generated names (used by backend)
│   ├── favicon.ico                       # Icon shown in browser tab
│   ├── index.html                        # Root HTML file for the React app
│   ├── manifest.json                     # Metadata for PWA features (name, icons, theme color)
│   └── robots.txt                        # Tells search engines what to crawl or not
├── public/               # Files accessible to anyone on the internet
│   ├── favicon.ico                       # Icon file for the application
│   ├── index.html                        # The main HTML file that serves as the entry point
│   ├── manifest.json                     # Metadata about the web application
│   └── robots.txt                        # Instructs crawlers on access rules
├── src/                  # Source code for the app
│   ├── components/
│   │   └── survey/
│   │       └── SurveyComponent.js        # Survey component logic
│   ├── pages/
│   │   ├── AdminDashboard/               # Admin dashboard code. Shows staff
│   │   │   ├── dashboard.js              # Admin dashboard functionality code
│   │   │   ├── vdashboard.css            # Styling for admin dashboard
│   │   │   ├── filter.png
│   │   │   ├── magnifyingGlass.png
│   │   │   ├── pencil.png
│   │   │   ├── trash.png
│   │   │   └── up-down.png
│   │   ├── CompletedSurvey/
│   │   │   ├── complete.js               # End of survey functionality code
│   │   │   ├── complete.css              # Styling for end of survey
│   │   │   └── qrpage.js                 # Displays generated QR code
│   │   ├── Header/
│   │   │   ├── header.js                 # Header functionality code
│   │   │   └── header.css                # Header styling
│   │   ├── LandingPage/
│   │   │   ├── landing.js                # App landing page functionality code
│   │   │   └── landing.css               # Styling for app landing page
│   │   ├── Login/
│   │   │   ├── login.js                  # Login functionality code
│   │   │   └── login.css                 # Styling for login
│   │   ├── PastEntries/
│   │   │   ├── PastEntries.js            # Past survey entries dashboard functionality
│   │   │   ├── PastEntriesCss.css        # Styling for past survey entries dashboard
│   │   │   ├── SurveyDetails.js          # Displays individual survey details
│   │   │   └── SurveyDetailsCss.css      # Styling for displaying individual survey details
│   │   ├── Profile/
│   │   │   ├── admineditprofile.js       # Edit profile functionalities
│   │   │   └── profile.css               # Styling for profile page
│   │   ├── QRCodeScan&Referral/
│   │   │   ├── ApplyReferral.js          # Functionality to apply a referral code
│   │   │   └── ApplyReferral.css         # Styling for applying referral code prompt box
│   │   ├── Signup/
│   │   │   ├── signup.js                 # Sign up functionality
│   │   │   └── signup.css                # Styling for sign up page
│   │   └── SurveyEntryDashboard/
│   │       ├── survey-dashboard.js       # Displays all surveys as a dashboard
│   │       └── survey-dashboard.css      # Styling for survey entry dashboard
│   ├── App.js                            # Main component of the application
│   ├── App.test.js                       # Contains tests for the App component
│   ├── AppCopyORIGINAL.js                # Copy of App tests
│   ├── index.js                          # JS entry point; renders root React component
│   ├── index.css                         # Global styles for the application
│   ├── logo.svg                          # The React logo
│   ├── reportWebVitals.js
│   └── setupTests.js                     # Sets up the testing environment
├── .gitignore                            # Specifies files to ignore in Git
├── README.md                             # Description of the project, usage, etc.
├── README.old.md                         # Old version of the project description
├── package.json                          # Frontend dependencies and scripts
└── package-lock.json                     # Lockfile for frontend dependencies

server/                   # Backend code
├── models/               # Mongoose schemas
│   ├── Survey.js                       # Survey entries with responses and geolocation
│   └── Users.js                        # User accounts, roles, and hashed passwords
├── routes/               # API routes
│   ├── auth.js                         # Handles login, registration, and approvals
│   ├── pages.js                        # Future page-level routing logic
│   └── surveys.js                      # Routes to submit, validate, and fetch surveys
├── utils/
│   └── generateReferralCode.js         # Utility to generate unique referral codes
├── database.js                         # Mongoose DB connection init
├── index.js                            # Main entry point for Express backend
├── .gitignore                          # Specifies files to ignore in Git
├── package.json                        # Backend dependencies and scripts
└── package-lock.json                   # Lockfile for backend dependencies
```

## Setup Instructions

### 🔧 Local Development

1. **Clone Repo**
```bash
git clone <repository>
cd <repository>
```

2. **Set Environment Variables**
Copy paste `.env.example` as `.env` in `client` and `server` folders, and paste the neccessary environment values. 

2. **Backend Setup**
```bash
cd server
npm install
node index.js
```

3. **Frontend Setup**
```bash
cd ../client
npm install
npm start
```

4. **Visit App**
```bash
localhost:3000
```

## Future Directions
The items listed below are features our team has identified out of scope for the duration of our project. These items are still considered high importance for the project as a whole, and are highly recommended as a jumping off point for teams taking over the project in the future.

**App Features**
- Auto-populate location using GPS location coordinates
- Widget for staff to comment on survey responses
- Integration with Homeless Management Information System (HMIS) database system
- Volunteer scheduling dashboard for administrators
- Automated SMS gift card distribution 
- Resume unfinished survey feature
- Admin ability to edit survey questions
- Volunteer ability to edit survey responses
- Survey analytics dashboard

**Testing**
- Dynamic Application Security Testing (DAST)

**User Experience**
-Step-by-step user training guide
- Setup wizard

## Contributors
Thanks to the following people for their work on this project.
- Ihsan Kahveci
- June Yang
- Emily Porter
- Zack Almquist
- Elizabeth Deng
- KelliAnn Ramirez
- Jasmine Vuong
- Hannah Lam
- Ella Weinberg
- Arushi Agarwal
- Devanshi Desai
- Aryan Palave
- Kaden Kapadia
- Hrudhai Umashankar
