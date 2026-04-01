# CCAPDEV_MCO3
Lab Reservation Web App

## How to install dependencies
```
npm install express mongoose
```

How to run the application locally
1. Start the Node.js server
   ```
   node index.js
   ```
   
2. Access the application in your browser at:
   ```
   http://localhost:3000
   ```

---

## Project Structure

```text
CCAPDEV_MCO3/
├── admin.php               # Administrative Dashboard
├── index.php               # Main Student/Client Interface
├── dlsu-room-tracker.sql   # Database Schema & Seed Data
├── css/
│   ├── admin.css           # Admin-specific styling
│   └── styles.css          # Main application styling
├── includes/
│   ├── auth_modal.php      # Login/Register Modal
│   ├── data.php            # Core data fetching logic
│   ├── db.php              # Database connection
│   ├── footer.php          # Common footer
│   ├── helpers.php         # Utility functions & status logic
│   └── navbar.php          # Main navigation
└── php/
    ├── login.php           # Login handler
    ├── logout.php          # Logout handler
    ├── my_reservations.php # Student reservation view
    ├── register.php        # Registration handler
    └── reserve.php         # Reservation request handler
```

---
