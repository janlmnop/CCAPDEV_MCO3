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
├── index.js                                  # entry point
├── database/                                 
│   ├── models/
│   │   ├── Computer.js                      
│   │   ├── Lab.js                        
│   │   ├── LabTech.js                        
│   │   ├── Reservation.js            
│   │   └── Student.js                   
│   ├── reservation_db.computers.json         # computer data
│   ├── reservation_db.labs.json              # lab data
│   ├── reservation_db.reservations.json      # reservation data
│   ├── reservation_db.students.json          # student data
│   └── reservation_db.png                    # reservation DB schema                  
├── public/
│   ├── css/
│   │   ├── login.css                         
│   │   ├── lt-rc.css                         # lab tech - reserve computer style
│   │   ├── main-menu.css         
│   │   ├── registration.css               
│   │   ├── reservations.css                 
│   │   ├── s-rc.css                          # student - reserve computer style
│   │   ├── user-profiles.css              
│   │   └── welcome.css                    
│   ├── images/
│   │   └── ...
│   ├── js/
│   │   ├── lt-rc.js                          # lab tech - reserve computer script
│   │   ├── s-rc.js                           # student - reserve computer script
│   │   ├── script_labtech.js                 # lab tech - user profile script
│   │   ├── script_student_other.js           # other student - user profile script
│   │   └── script_student.js                 # student - user profile script
│   └── nine0.ttf                             # project font
├── views/
│   ├── labtech/
│   │   ├── lt-vr-ls.html                     # view reservations - lab selection
│   │   ├── lt-vr-cs.html                     # view reservations - computer selection
│   │   ├── lt-vr-cs-c.html                   # view reservations - computer selection - comp #
│   │   ├── lt-ss.html                        # student search
│   │   ├── lt-rc-ls.html                     # reserve computer - lab selection
│   │   ├── lt-rc-cs.html                     # reserve computer - computer selection
│   │   ├── lt-rc-cs-c.html                   # view reservations - computer selection - comp #
│   │   ├── mainmenu_labtech.html             
│   │   ├── RegistrationPageLabTech.html      
│   │   └── userprofile_labtech.html
│   ├── other-student/
│   │   └── userprofile_student_other.html
│   ├── shared/
│   │   ├── login.html             
│   │   ├── reservations_current.html
│   │   ├── reservations_past.html
│   │   ├── welcomeNew.html
│   │   └── welcomePage.html    
│   ├── student/
│   │   ├── mainmenu_student.html             
│   │   ├── RegistrationPage.html
│   │   ├── s-rc-ls.html                      # reserve computer - lab selection
│   │   ├── s-rc-cs.html                      # reserve computer - computer selection
│   │   ├── s-rc-cs-c.html                    # reserve computer - computer selection - comp #
│   │   ├── s-ss.html                         # student search
│   │   └── userprofile_student.html
├── node_modules/
│   └── ...
├── package-lock.json
└── package.json
```

---
