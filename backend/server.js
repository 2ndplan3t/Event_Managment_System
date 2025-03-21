const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bcrypt = require('bcrypt');
require("dotenv").config();
const db = require('./db');
const app = express();
const PORT = 5000;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,  
}));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 3600000 },
  })
);

/* istanbul ignore start */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }
  next();
};
/* istanbul ignore end */

// User Registration Route
app.post("/api/register", (req, res) => {
  const { fullName, email, password, role = "Volunteer"} = req.body;

  // hashy
  bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
          console.error("Error hashing password:", err);
          return res.status(500).json({ message: "Internal server error" });
      }

      // insert into LoginInfo
      db.query(
          `INSERT INTO LoginInfo (Email, UserPass, UserRole) VALUES (?, ?, ?)`,
          [email, hashedPassword, role],
          (err, loginResult) => {
              if (err) {
                  if (err.code === "ER_DUP_ENTRY") {
                      return res.status(400).json({ message: "Email already in use." });
                  }
                  console.error("Error inserting into LoginInfo:", err);
                  return res.status(500).json({ message: "Internal server error" });
              }

              const userID = loginResult.insertId;

              // insert into UserProfile
              db.query(
                  `INSERT INTO UserProfile (UserID, FullName) VALUES (?, ?)`,
                  [userID, fullName],
                  (err) => {
                      if (err) {
                          console.error("Error inserting into UserProfile:", err);
                          // Rollback LoginInfo insert if UserProfile fails
                          db.query("DELETE FROM LoginInfo WHERE UserID = ?", [userID]);
                          return res.status(500).json({ message: "Internal server error" });
                      }
                      res.status(201).json({ message: "Registration successful" });
                  }
              );
          }
      );
  });
});


app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required"});
    }
    if(!password){
        return res.status(400).json({ message: "Password is required"});
    }

    db.query(
        `SELECT li.UserID, li.UserPass, li.UserRole, li.Email,
                up.FullName, up.AddressLine, up.AddressLine2,
                up.City, up.State, up.ZipCode
         FROM LoginInfo li
         LEFT JOIN UserProfile up ON li.UserID = up.UserID
         WHERE li.Email = ?`,
        [email],
        (err, userRows) => {
            if (err) {
                console.error("Query error:", err);
                return res.status(500).json({ message: "Internal server error" });
            }

            if (!userRows || userRows.length === 0) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const user = userRows[0];

            bcrypt.compare(password, user.UserPass, (err, isMatch) => {
                if (err) {
                    console.error("Bcrypt error:", err);
                    return res.status(500).json({ message: "Internal server error" });
                }

                if (!isMatch) {
                    return res.status(401).json({ message: "Invalid credentials" });
                }

                // Set session data
                req.session.user = {
                    id: user.UserID,
                    email: user.Email,
                    role: user.UserRole,
                    fullName: user.FullName || '',
                    address: {
                        line1: user.AddressLine || '',
                        line2: user.AddressLine2 || '',
                        city: user.City || '',
                        state: user.State || '',
                        zip: user.ZipCode || ''
                    }
                };


                res.status(200).json({
                    message: "Login successful",
                    user: {
                        id: req.session.user.id,
                        email: req.session.user.email,
                        role: req.session.user.role,
                        fullName: req.session.user.fullName
                    }
                });
            });
        }
    );
});



app.post("/api/logout", (req, res) => {

    res.clearCookie("connect.sid"); 
    res.json({ message: "Logout successful" });
    //console.log("Logout successful, session destroyed");
});

app.get("/api/admin/profile", requireAuth, (req, res) => {
  const user = req.session.user;

  if (user.role !== "Manager") { // Matches your ENUM
      return res.status(403).json({ message: "Access denied: Admins only" });
  }

  console.log("Fetching profile for user ID:", user.id); // Debug

  db.query(
      `SELECT li.UserID, li.Email, li.UserRole, 
              up.FullName, up.AddressLine, up.AddressLine2, 
              up.City, up.State, up.ZipCode
       FROM LoginInfo li
       LEFT JOIN UserProfile up ON li.UserID = up.UserID
       WHERE li.UserID = ?`,
      [user.id],
      (err, userRows) => {
          if (err) {
              console.error("Query error:", err);
              return res.status(500).json({ message: "Internal server error" });
          }

          if (!userRows || userRows.length === 0) {
              return res.status(404).json({ message: "User not found" });
          }

          const dbUser = userRows[0];

          console.log("Database user ID:", dbUser.UserID); // Debug

          res.json({
              id: dbUser.UserID,
              email: dbUser.Email,
              fullName: dbUser.FullName || '',
              role: dbUser.UserRole
          });
      }
  );
});

app.get("/api/profile", (req, res) => {
  if (req.session.user) {  // Check if user is authenticated via session
      res.json({ profileData: req.session.user });
  } else {
      res.status(401).json({ message: "Not authenticated" });
  }
});

/* istanbul ignore next */
app.get("/", (req, res) => {
    res.send("Welcome to the server");
});

// Testing backend connection
app.get("/api/test", (req, res) => {
    res.json({ message: "Backend is working" });
});

// get the users list
app.get("/api/users", (req, res) => {
  res.json(users);
});


// Edit the event's selected users
app.put('/api/events/:id', async(req, res) =>{
  const eventId = parseInt(req.params.id, 10);
  const eventData = req.body;
  const eventIndex = events.findIndex((event) => event.id === eventId);
  
  // if event couldn't be found:
  if (eventIndex === -1) {
    return res.status(404).json({ message: 'Event not found' });  // Return a 404 if the event does not exist
  }
  
  // otherwise, we update the event
  const updatedEvent = {
    ...events[eventIndex],
    ...eventData,
  };

  events[eventIndex] = updatedEvent;
  return res.status(200).json(updatedEvent);
});

// get notifications from the user
app.get("/api/users/:id", (req, res) => {
  const userAcc = users.find((user) => user.id === parseInt(req.params.id));
  if(userAcc){
    res.json(userAcc);
  }
  else{
    res.status(404).json({ message: "User not found" });
  }
});

// Edit user's notifications
app.put("/api/users/:id", async(req, res) =>{
  const userId = parseInt(req.params.id, 10);
  const newNotifs = req.body;
  const userIndex = users.findIndex((user) => user.id === userId);
  
  // if user cannot be found
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });  // Return a 404 if the user does not exist
  }
  
  // otherwise, we update the user
  const updatedUser = {
    ...users[userIndex],
    notifications: newNotifs
  };

  users[userIndex] = updatedUser;
  return res.status(200).json(updatedUser);
});

let events = [];

// Match volunteers with event required skills
const matchVolunteers = (event) => {
    const volunteers = users.filter(user => user.role === "volunteer");
    return volunteers.filter((volunteer) =>
        volunteer.skills.some((skill) => event.requiredSkills.includes(skill))
    );
};

const event_num = 0;
app.post('/api/events', (req, res) => {
  
    const { name, location, envoy, requiredSkills, urgencyLevel, date, manager } = req.body;
    if (!name || !location || !envoy || !requiredSkills || !urgencyLevel || !date || !manager) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }
    const newEvent = {
        id: events.length + 1,
        name,
        location,
        envoy,
        requiredSkills,
        urgencyLevel,
        date,
        manager,
        matchedVolunteers: [],
        selectedVolunteers: [],
    };
    events.push(newEvent);
    res.status(201).json(newEvent);
});
// Edit the event's selected users
app.put('/api/events/:id', async(req, res) =>{
  const eventId = parseInt(req.params.id, 10);
  const eventData = req.body;
  const eventIndex = events.findIndex((event) => event.id === eventId);
  
  // if event couldn't be found:
  if (eventIndex === -1) {
    return res.status(404).json({ message: 'Event not found' });  // Return a 404 if the event does not exist
  }
  
  // otherwise, we update the event
  const updatedEvent = {
    ...events[eventIndex],
    ...eventData,
  };

  events[eventIndex] = updatedEvent;
  return res.status(200).json(updatedEvent);
});


app.get('/api/events', (req, res) => {
    //console.log(events);
    res.json(events);
});

app.delete('/api/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  //console.log(`Deleting event with ID: ${eventId}`);
  
  // Find if the event exists before filtering
  const eventExists = events.some(event => event.id === eventId);
  //console.log('Events before deletion:', events)
  if (!eventExists) {
    return res.status(404).json({ message: 'Event not found' });
  }
  
  events = events.filter((event) => event.id !== eventId);
  //console.log('Updated events:', events);
  res.status(200).json({ message: 'Event deleted successfully.' });
});


app.get('/api/volunteers', (req, res) => {
    const volunteers = users.filter(user => user.role === 'Volunteer');
    res.json(volunteers);
});


app.post('/api/events/match-volunteers/:eventId', (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  console.log('Event ID:', eventId); // Debug: Log the eventId
  console.log('Events in server:', events); // Debug: Log the events array

  const event = events.find(e => e.id === eventId);

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  const requiredSkills = event.requiredSkills;
  const matchedVolunteers = users.filter(user => 
    user.role === "volunteer" && 
    requiredSkills.some(skill => user.skills.includes(skill))
  );

  res.status(200).json(matchedVolunteers);
});

//user profile management
//get user profile by ID
app.get("/api/profile/:id", (req, res) => {
  const user = users.find((user) => user.id === parseInt(req.params.id));
  if (user) {
    res.json(user);
  } else {
    /* istanbul ignore next */
    res.status(404).json({ message: "User not found" });
  }
});

// Update user profile
app.put("/api/profile", requireAuth, (req, res) => {
  /* istanbul ignore next */
  const userId = req.session.user ? req.session.user.id : null;
  const {
    fullName,
    address1,
    address2,
    city,
    state,
    zipCode, 
    skills,
    preferences,
    availability,
  } = req.body;

  const user = users.find((user) => user.id === userId);
  /* istanbul ignore next */
  if (!user) {
    /* istanbul ignore next */
    return res.status(404).json({ message: "User not found" });
  }

  // Update only provided fields, keeping existing values if not sent
  user.fullName = fullName !== undefined ? fullName : user.fullName;
  user.address1 = address1 !== undefined ? address1 : user.address1;
  user.address2 = address2 !== undefined ? address2 : user.address2 || "";
  user.city = city !== undefined ? city : user.city || "";
  user.state = state !== undefined ? state : user.state || "";
  user.zip = zipCode !== undefined ? zipCode : user.zip || ""; 
  user.skills = skills !== undefined ? skills : user.skills || [];
  user.preferences = preferences !== undefined ? preferences : user.preferences || "";
  user.availability = availability !== undefined ? availability : user.availability || [];

   // Sync session with updated user data
  req.session.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    address1: user.address1,
    address2: user.address2,
    city: user.city,
    state: user.state,
    zip: user.zip,
    skills: user.skills || [],
    volunteerHistory: user.volunteerHistory || [],
    notifications: user.notifications || [],
  };

  return res.json({ message: "Profile updated successfully", profileData: user });
});


//add a volunteer event to a user's history
app.post("/api/volunteer-history/:id", (req, res) => {
  const userId = parseInt(req.params.id);

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { event, eventdesc, location, date, status, fullName, address1, city, state, zipCode, skills } = req.body;

  if (!fullName) return res.status(400).json({ message: "Full name is required" });
  if (!address1) return res.status(400).json({ message: "Address is required" });
  if (!city) return res.status(400).json({ message: "City is required" });
  if (!state) return res.status(400).json({ message: "State is required" });
  if (!zipCode) return res.status(400).json({ message: "Zipcode is required" });
  if (!skills) return res.status(400).json({ message: "Skills are required" });

  // Add the event to the user's volunteer history
  user.volunteerHistory.push({
    event,
    eventdesc,
    location,
    date,
    status,
    fullName,
    address1,
    city,
    state,
    zipCode,
    skills,
  });

  res.json({ message: "Volunteer history updated successfully", volunteerHistory: user.volunteerHistory });
});

//delete volunteer event from a user's history
app.delete("/api/volunteer-history/:id/:eventIndex", (req, res) => {
  const userId = parseInt(req.params.id);
  const eventIndex = parseInt(req.params.eventIndex);
  const user = users.find((u) => u.id === userId);

  if (!user) {
      return res.status(404).json({ message: "User not found" });
  }

  if (!user.volunteerHistory || eventIndex < 0 || eventIndex >= user.volunteerHistory.length) {
      return res.status(400).json({ message: "Invalid event index" });
  }

  user.volunteerHistory.splice(eventIndex, 1);
  res.json({ message: "Volunteer event removed successfully", volunteerHistory: user.volunteerHistory });
});

app.get("/api/isLoggedIn", (req, res) => {
  if (req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  return res.json({ loggedIn: false });
});

/* istanbul ignore next */
if (require.main === module) {
  /* istanbul ignore next */
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = { events, app, db };