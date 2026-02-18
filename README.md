# frontend-capstone-team-18
Repo for final assignment

# Bookify – Frontend Capstone Project

## System Description

Bookify is a responsive frontend web application that simulates a modern digital library platform.  
The system allows users to browse books, view details, manage a personal profile, and track borrowing activity.

The project was built as a full frontend capstone assignment with emphasis on:
- Clean architecture
- Responsive design
- Accessibility
- Dark mode support
- JSON usage
- Git workflow & deployment

The website is fully deployed using GitHub Pages.

---

##  Technologies & Main Features

## Global & Local files
- Each page is associated with its own css and js files (if applicable)
- Each page is associated with global reuseable pieces of code e.g. Header, Footer, Dark mode, etc.

### 🔹 Responsive Design
- Fully responsive layout
- Breakpoints for desktop, tablet and mobile
- Adaptive navigation with hamburger menu

### 🔹 Dark Mode
- Toggle between light and dark theme
- Implemented using CSS variables
- Persistent theme behavior
- Global usage of darkmode.js across all pages

### 🔹 Header
- Reusable header across all pages
- Accessible navigation with `aria-current`
- Mobile burger menu with toggle logic

### 🔹 Footer
- Reusable footer across all pages
- Accordion behavior on mobile
- Static layout on desktop


### 🔹 Homepage
- Hero section with carousel
- Search input UI
- Best sellers grid


### 🔹 Catalog Page
- Book grid layout
- Dynamic rendering from `books.json`
- Category badges
- Book interaction buttons

### 🔹 Borrow Page
- Book details view
- parameter handling (`?id=`)
- Dynamic content rendering
- Adds selected books to the user's borrowing state
- Synchronizes with the Profile page statistics and lists

### 🔹 Profile Page
- User profile card
- Borrowed books tracking
- History view
- Tracks borrowed, returned and read books dynamically
- Automatically updates counters (Currently Borrowed, Overdue, Books Returned)

### 🔹 Contact Page
- Styled contact form
- Comprhensive input fields to create an inquiry
- Responsive layout


---

## 🌐 Live Website

https://amitgalili.github.io/frontend-capstone-team-18/


---

Developed as part of a Frontend Capstone Assignment.