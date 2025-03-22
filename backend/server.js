const express = require("express");
const app = express();
const session = require("express-session");
const cors = require("cors");
const {db} = require("./db")
const bcrypt = require('bcrypt');
require("dotenv").config();


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


var users;
var events= [];
// Get all the users from the database
async function fetchUsers() {
  try {
      users = await new Promise((resolve, reject) => {
          db.query("SELECT * FROM logininfo", function(err, result) {
              if (err) reject(err);  // Reject if issue
              else resolve(result);   // Resolve if success
          });
      });
      
      //console.log("Users fetched from database successfully.");  // Users was successfully gotten
      users = users.map(user => ({ ...user }));

  } catch (error) {
      console.error('Error fetching users:', error);
  }
}

async function fetchEvents(){
  try {
    const eventsWNoSkill = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM eventlist", function(err, result){
        if(err) reject(err);
        else resolve(result);
      });
    });

    console.log("Events fetched from database successfully.");  // Events was successfully gotten

    events = await Promise.all(eventsWNoSkill.map(async (e) => {
      const requiredSkills = await new Promise((resolve, reject) =>{
          db.query("SELECT SkillName FROM eventskills WHERE EventID = ?", [e.EventID], function(err, results){
            if(err) reject(err);
            else resolve(results.map(skill => skill.SkillName));
          });
      });

      return{
        ...e,
        requiredSkills
      };
    }));

    return events;

  } catch (error){
    console.error("Error fetching events", error);
  }
}

// ALL LOGIN STUFF
/* istanbul ignore start */
const hashPasswords = async () => {
  for (let user of users) {
      if (!user.password.startsWith("$2b$")) {  // Check if not already hashed
          const hashedPassword = await bcrypt.hash(user.password, 10);
          user.password = hashedPassword;
      }
  }
};
/* istanbul ignore end */

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
  const { email, password, role = "Volunteer"} = req.body;

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
                  `INSERT INTO UserProfile (UserID) VALUES (?)`,
                  [userID],
                  (err) => {
                      if (err) {
                          console.error("Error inserting into UserProfile:", err);
                          // Rollback LoginInfo insert if UserProfile fails
                          db.query("DELETE FROM LoginInfo WHERE UserID = ?", [userID]);
                          return res.status(500).json({ message: "Internal server error" });
                      }
                    // Manually set the session for the newly registered user
                    req.session.user = {
                      id: userID,
                      email: email,
                      role: role,
                      fullName: '',
                      address: {
                        line1: '',
                        line2: '',
                        city: '',
                        state: '',
                        zip: ''
                      }
                    };

                    res.status(201).json({
                      message: "Registration successful",
                      user: {
                        id: req.session.user.id,
                        email: req.session.user.email,
                        role: req.session.user.role,
                        fullName: req.session.user.fullName
                      }
                    });
                  }
              );
          }
      );
  });
});


app.post("/api/login", async(req, res) => {
    await fetchUsers();
    //console.log(users);
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
            //console.log(userRows);
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

app.get("/api/admin/profile", requireAuth,(req, res) => {
  const user = req.session.user;

  if (user.role !== "Manager") { // Matches your ENUM
      return res.status(403).json({ message: "Access denied: Admins only" });
  }

  //console.log("Fetching profile for user ID:", user.id); // Debug

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

          //console.log("Database user ID:", dbUser.UserID); // Debug

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

/* istanbul ignore start */
// get the users list
app.get("/api/users", async(req, res) => {
  await fetchUsers();
  res.json(users);
});
/* istanbul ignore end */

app.post('/api/events', (req, res) => {
  const { name, location, envoy, requiredSkills, urgencyLevel, date, manager } = req.body;
  if (!name || !location || !envoy || !requiredSkills || !urgencyLevel || !date || !manager) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  db.query("INSERT INTO eventlist (EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventStatus) VALUES (?,?,?,?,?,?)", 
    [name, envoy, location, urgencyLevel, date, "In Progress"], function(err, result){
      if(err) throw err;
      else{
      console.log("Inserted new event.")
      var eventID = result.insertId;

      for(let skill of requiredSkills){
        db.query("INSERT INTO eventskills (EventID, SkillName) VALUES (?,?)", [eventID, skill.value], function(err){
          if(err) throw err;
          else{
            console.log("Event requires: " + skill.value)
          }
        });
      }

      const newEvent = {
        id: eventID,
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

    }
  });
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
  const userAcc = users.find((user) => user.UserID === parseInt(req.params.id));
  if(userAcc){
    res.json(userAcc);
  }
  else{
    res.status(404).json({ message: "User not found" });
  }
});



// match volunteers with event required skills
const matchVolunteers = (event) => {
  const volunteers = users.filter(user => user.role === "Volunteer");

  return volunteers.filter((volunteer) =>
    volunteer.skills.some((skill) => event.requiredSkills.includes(skill))
  );
};



// Get all (NOT CANCELLED/FINISHED) events - to see cancelled and finished events, see report
app.get('/api/events', async(req, res) => {
  await fetchEvents();
  const curr_events = events.filter(event => event.EventStatus == "In Progress");
  res.json(curr_events);
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

// Delete an event
app.delete('/api/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  db.query("UPDATE eventlist SET EventStatus = ? WHERE EventID = ?",
    ["Cancelled", eventId], function(err, result){
      console.log("Event with id " + eventId + " cancelled.")
  });
  fetchEvents();
  res.status(200).json({ message: 'Event deleted successfully.' });
});

// Create a new volunteer
app.post('/api/volunteers', (req, res) => {
  const { name, skills } = req.body;
  const newVolunteer = {
    id: volunteers.length + 1,
    name,
    skills,
  };
  volunteers.push(newVolunteer);
  res.status(201).json(newVolunteer);
});

// Get all volunteers
app.get('/api/volunteers', (req, res) => {
  
  const volunteers = users.filter(user => user.UserRole === 'Volunteer');
  //console.log(volunteers);
  res.json(volunteers);
});

// Match volunteers to an event
app.post('/api/events/match-volunteers/:eventId', (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  const requiredSkills = event.requiredSkills;
  const matchedVolunteers = users.filter(user => 
    user.role === "Volunteer" && 
    requiredSkills.some(skill => user.skills.includes(skill))
  );

  res.status(200).json(matchedVolunteers);
});

//user profile management
//get user profile by ID
app.get("/api/profile/:id", (req, res) => {
  const user = users.find((user) => user.UserID === parseInt(req.params.id));
  if (user) {

    // all three queries need to execute, be combined into one object, and then returned. yippee!
    const userProfileQuery = new Promise((resolve, reject) => {
      db.query("SELECT * FROM userprofile WHERE UserID = ?", [req.params.id], function(err, result) {
        if(err) reject(err);
        else{
          resolve(result);
        }
      });
    });

    const skillsProfileQuery = new Promise((resolve, reject) => {
      db.query("SELECT SkillName FROM userskills WHERE UserID = ?", [req.params.id], function(err, result){
        if(err) reject(err);
        else{
          resolve(result);
        }
      });
    });

    const availabilityProfileQuery = new Promise((resolve, reject) => {
      db.query("SELECT DateAvail FROM useravailability WHERE UserID = ?", [req.params.id], function(err, result){
        if(err) reject(err);
        else{
          resolve(result);
        }
      });
    });

    // And now, we take everything, combine it together, panic?
    Promise.all([userProfileQuery, skillsProfileQuery, availabilityProfileQuery])
      .then((results) => {
        const[userProfile, userSkills, userAvailability] = results;
        const fullResult = {
          userProfile: userProfile,
          skills: userSkills.map(skill => skill.SkillName),
          availability: userAvailability.map(avail => {
            const date = new Date(avail.DateAvail);
            return date.toLocaleDateString(); // This will return the date in a "MM/DD/YYYY" format
          })
        }
        res.json(fullResult);
      })
      .catch((err) =>{
        console.error("Error getting user profile: ", err);
        res.status(500).json({error: "Server error"});
      });
  
  } else {
    /* istanbul ignore next */
    res.status(404).json({ message: "User not found" });
  }
});

// Update user profile by id
app.put("/api/profile/:id", async(req, res) => {
  /* istanbul ignore next */
  const userId = parseInt(req.params.id);
  const {
    fullName,
    address1,
    address2,
    city,
    state,
    zipCode,
    preferences, 
    skills,
    availability,
  } = req.body;

  // first, insert this into the table
  db.query("UPDATE userprofile SET FullName = ?, AddressLine = ?, AddressLine2 = ?, City = ?, State = ?, ZipCode = ?, Preferences = ? WHERE UserID = ?",
        [fullName, address1, address2, city, state, zipCode, preferences, userId], function(err){
          if(err) throw err;
          else{
            console.log("User profile updated");
          }
        });

  // clear all skills from the user previously and put the new ones in the table
  db.query("DELETE FROM userskills WHERE UserID = ?", [userId], function(err){
    if(err) throw err;
    else{
      console.log(console.log("User skills reset"));
    }
  });

  for(let skill of skills){
    db.query("INSERT INTO userskills (UserID, SkillName) VALUES (?,?)", [userId, skill], function(err){
      if(err) throw err;
      else{
        console.log("Inserted " + skill)
      }
    });
  }

  db.query("DELETE FROM useravailability WHERE UserID = ?", [userId], function(err){
    if(err) throw err;
    else{
      console.log("User availability reset");
    }
  });

  for(let avail of availability){
    db.query("INSERT INTO useravailability (UserID, DateAvail) VALUES (?,?)", [userId, avail], function(err){
      if(err) throw err;
      else{
        console.log("Inserted " + avail)
      }
    });
  }

  const user = users.find((user) => user.UserID === userId);
  /* istanbul ignore next */
  if (!user) {
    /* istanbul ignore next */
    return res.status(404).json({ message: "User not found" });
  }

  // Update only provided fields, keeping existing values if not sent
  user.FullName = fullName !== undefined ? fullName : user.FullName;
  user.AddressLine = address1 !== undefined ? address1 : user.AddressLine;
  user.AddressLine2 = address2 !== undefined ? address2 : user.AddressLine2 || "";
  user.City = city !== undefined ? city : user.City || "";
  user.State = state !== undefined ? state : user.State || "";
  user.ZipCode = zipCode !== undefined ? zipCode : user.ZipCode || ""; 
  user.Preferences = preferences !== undefined ? preferences : user.Preferences || "";
  user.skills = skills !== undefined ? skills : user.skills || [];
  user.availability = availability !== undefined ? availability : user.availability || [];

   // Sync session with updated user data
  req.session.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    FullName: user.FullName,
    AddressLine: user.AddressLine,
    AddressLine2: user.AddressLine2,
    City: user.City,
    State: user.State,
    ZipCode: user.ZipCode,
    skills: user.skills || [],
    volunteerHistory: user.volunteerHistory || [],
    notifications: user.notifications || [],
  };

  return res.json({ message: "Profile updated successfully", profileData: user });
});



//volunteer history

// Fetch volunteer history (events) for a user
app.get("/api/volunteer-history/:id", (req, res) => {
  const userId = parseInt(req.params.id);

  // Query to get event details for a specific user
  db.query(`
      SELECT e.EventName AS eventName, e.EventDesc AS eventDesc, 
             e.EventLocation AS eventLocation, e.EventDate AS eventDate, 
             e.EventStatus AS eventStatus
      FROM EventVolMatch evm
      JOIN EventList e ON evm.EventID = e.EventID
      WHERE evm.UserID = ?
  `, [userId], (err, results) => {
      if (err) {
          return res.status(500).json({ message: "Database error", error: err });
      }
      res.json({ volunteerHistory: results });
  });
});

// Add a volunteer event to a user's history
app.post("/api/volunteer-history/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const { eventId, status } = req.body;

  if (!eventId) {
    return res.status(400).json({ message: "Event ID is required" });
  }

  // Check if the user exists
  db.query("SELECT * FROM UserProfile WHERE UserID = ?", [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the event to the EventVolMatch table
    db.query(
      "INSERT INTO EventVolMatch (EventID, UserID) VALUES (?, ?)",
      [eventId, userId],
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Database error", error: err });
        }
        res.json({ message: "Volunteer event added successfully" });
      }
    );
  });
});

// Delete a volunteer event from a user's history
app.delete("/api/volunteer-history/:id/:eventId", (req, res) => {
  const userId = parseInt(req.params.id);
  const eventId = parseInt(req.params.eventId);

  // Check if the user exists
  db.query("SELECT * FROM UserProfile WHERE UserID = ?", [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is actually associated with the event
    db.query(
      "SELECT * FROM EventVolMatch WHERE EventID = ? AND UserID = ?",
      [eventId, userId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Database error", error: err });
        }
        if (result.length === 0) {
          return res.status(404).json({ message: "Event not found for the user" });
        }

        // Delete the event from the EventVolMatch table
        db.query(
          "DELETE FROM EventVolMatch WHERE EventID = ? AND UserID = ?",
          [eventId, userId],
          (err) => {
            if (err) {
              return res.status(500).json({ message: "Database error", error: err });
            }
            res.json({ message: "Volunteer event removed successfully" });
          }
        );
      }
    );
  });
});




app.get("/api/isLoggedIn", (req, res) => {
  if (req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  return res.json({ loggedIn: false });
});

// get all data when the server is ran
async function init() {
  await fetchUsers(); 
  console.log(users);
}

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = { app, users};