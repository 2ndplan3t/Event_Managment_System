const express = require("express");
const session = require("express-session");
const cors = require("cors");
const {db} = require("./db")
const bcrypt = require('bcrypt');
require("dotenv").config();

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


var users;
var events = [];
// Get all the users from the database
async function fetchUsers() {
  try {
      users = await new Promise((resolve, reject) => {
          db.query("SELECT * FROM logininfo", function(err, result) {
            /* istanbul ignore next */
              if (err) reject(err);  // Reject if issue
              else resolve(result);   // Resolve if success
          });
      });

      console.log("Users fetched from database successfully.");  // Users was successfully gotten
      users = users.map(user => ({ ...user }));

  } catch (error) {
    /* istanbul ignore next */
      console.error('Error fetching users:', error);
  }
}

async function fetchEvents(){
  try {
    const eventsWNoSkill = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM eventlist", function(err, result){
        /* istanbul ignore next */
        if(err) reject(err);
        else resolve(result);
      });
    });

    console.log("Events fetched from database successfully.");  // Events was successfully gotten

    events = await Promise.all(eventsWNoSkill.map(async (e) => {
      const requiredSkills = await new Promise((resolve, reject) =>{
          db.query("SELECT SkillName FROM eventskills WHERE EventID = ?", [e.EventID], function(err, results){
            /* istanbul ignore next */
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
    /* istanbul ignore next*/
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
                    /* istanbul ignore next */
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

  if (user.role !== "Manager") { 
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

app.get("/api/profile", requireAuth,(req, res) => {
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
  fetchUsers();
  res.json(users);
});

app.post('/api/events', (req, res) => {
    const { name, location, envoy, requiredSkills, urgencyLevel, date, manager } = req.body;
    if (!name || !location || !envoy || !requiredSkills || !urgencyLevel || !date || !manager) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    db.query("INSERT INTO eventlist (EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventManager, EventStatus) VALUES (?,?,?,?,?,?,?)", 
      [name, envoy, location, urgencyLevel, date, manager, "In Progress"], function(err, result){
        /* istanbul ignore next */
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

app.get('/api/eventmatch/:id', async (req, res) => {
  try {
    const eventID = parseInt(req.params.id, 10); // Get the event ID from URL params

    // Run the query to get the user IDs who match all required skills for the event
    // Also check and confirm they're available on the date of the event
    db.query(`SELECT us.UserID, info.FullName
              FROM userprofile AS info
              JOIN userskills AS us ON us.UserID = info.UserID
              JOIN eventskills AS es ON us.SkillName = es.SkillName
              JOIN eventlist AS e ON es.EventID = e.EventID
              JOIN useravailability AS ua ON ua.UserID = us.UserID AND ua.DateAvail = e.EventDate
              WHERE es.EventID = ?
              GROUP BY us.UserID
              HAVING COUNT(DISTINCT us.SkillName) = (
                SELECT COUNT(DISTINCT SkillName)
                FROM eventskills
                WHERE EventID = ?
            )`, [eventID, eventID], (err, results) => {
      if (err) {
        // Handle query errors
        console.error(err);
        return res.status(500).json({ message: 'An error occurred while processing the request.' });
      }

      // Return the results as JSON
      return res.status(200).json(results);
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occurred while processing the request.' });
  }
});

app.get('/api/events/:id/selectedUsers', async(req, res) =>{
  const eventId = parseInt(req.params.id, 10);
  try {
    getSelectedVols = await new Promise((resolve, reject) => {
        db.query("SELECT eventvolmatch.UserID, userprofile.FullName FROM eventvolmatch, userprofile WHERE EventID = ? AND eventvolmatch.userID = userprofile.UserID", [eventId],  function(err, result) {
            /* istanbul ignore next */
            if (err) reject(err);  // Reject if issue
            else resolve(result);   // Resolve if success
        });
    });
  } catch (error) {
      console.error('Error fetching selected volunteers:', error);
  }

  return res.status(200).json(getSelectedVols);
});

app.post('/api/events/:id/volunteers', async (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { action, volunteerId } = req.body;

  // add volunteer - make sure one query finishes before doing the other
  try {
    if (action === "add") {
      await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO eventvolmatch (EventID, UserID) VALUES (?, ?)",
          [eventId, volunteerId],
          (err, result) => {
            /* istanbul ignore next */
            if (err) return reject(err);
            resolve(result);
          }
        );
      });
      
      await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO usernotifs (UserID, EventID, NotifType) VALUES (?, ?, 'Assigned')",
          [volunteerId, eventId],
          (err, result) => {
            /* istanbul ignore next */
            if (err) return reject(err);
            resolve(result);
          }
        );
      });
      // remove volunteer - same idea, make sure one finishes before the other.
    } else if (action === "remove") {
      await new Promise((resolve, reject) => {
        db.query(
          "DELETE FROM eventvolmatch WHERE EventID = ? AND UserID = ?",
          [eventId, volunteerId],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      });

      await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO usernotifs (UserID, EventID, NotifType) VALUES (?, ?, 'Removed')",
          [volunteerId, eventId],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      });
    }
    return res.status(200).json("Success");
  } catch (err) {
    console.error("Error updating volunteers:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});


// get notifications from the user
app.get("/api/users/:id", async (req, res) => {
  const UserID = parseInt(req.params.id);
  try {
    notifList = await new Promise((resolve, reject) => {
        db.query("SELECT NotifID, EventName, EventLocation, EventUrgency, EventDate, NotifType FROM usernotifs, eventlist WHERE usernotifs.UserID = ? AND eventlist.EventID = usernotifs.EventID AND isCleared = FALSE ORDER BY NotifID desc", [UserID], function(err, result) {
           /* istanbul ignore next */
            if (err) reject(err);  // Reject if issue
            else resolve(result);   // Resolve if success
        });
    });

    console.log("User notifications gotten from database.");
    res.status(200).json({ notifications: notifList });

  } catch (error) {
    /* istanbul ignore next */
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ message: 'Failed to fetch user notifications' });
  }
});

// clear a notification from a user's view
app.put("/api/notifs/:id", async(req, res) =>{
  const notifID = parseInt(req.params.id);

  try {
    notifList = await new Promise((resolve, reject) => {
        db.query("UPDATE usernotifs SET isCleared = TRUE WHERE notifID = ?", [notifID], function(err, result) {
          /* istanbul ignore next */
            if (err) reject(err);  // Reject if issue
            else resolve(result);   // Resolve if success
        });
    });

    console.log("User notifications gotten from database.");
    res.status(200).json({ notifications: notifList });

  } catch (error) {
    /* istanbul ignore next */
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ message: 'Failed to fetch user notifications' });
  }
});



// Get all (NOT CANCELLED/FINISHED) events - to see cancelled and finished events, see report
app.get('/api/events', async(req, res) => {
  await fetchEvents();
  const curr_events = events.filter(event => event.EventStatus == "In Progress");
  res.json(curr_events);
});

// Delete an event
app.delete('/api/events/:id', async (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  db.query("UPDATE eventlist SET EventStatus = ? WHERE EventID = ?",
    ["Cancelled", eventId], function(err, result){
      console.log("Event with id " + eventId + " cancelled.")
  });

  const getSelectedVols = await new Promise((resolve, reject) => {
    db.query("SELECT eventvolmatch.UserID FROM eventvolmatch, userprofile WHERE EventID = ? AND eventvolmatch.userID = userprofile.UserID", [eventId],  function(err, result) {
        /* istanbul ignore next */
        if (err) reject(err);  // Reject if issue
        else resolve(result);   // Resolve if success
    });
});

  for(vol of getSelectedVols){
    db.query("INSERT INTO usernotifs (UserID, EventID, NotifType) VALUES (?, ?, 'Cancelled')",[vol.UserID, eventId]);
  }

  fetchEvents();
  res.status(200).json({ message: 'Event deleted successfully. All users notified.' });
});

app.get('/api/managers', async(req, res) => {
  try{
    const managersByName = await new Promise((resolve, reject) => {
      db.query("SELECT userprofile.UserID, userprofile.FullName FROM userprofile LEFT JOIN logininfo ON userprofile.UserID = logininfo.UserID WHERE UserRole = 'Manager'",  function(err, result) {
          /* istanbul ignore next */
          if (err) reject(err);  // Reject if issue
          else resolve(result);   // Resolve if success
      })
    })
    res.status(200).json(managersByName);
  } catch (err){
    console.error('Error fetching manager list:', err);
    res.status(500).json({ message: 'Failed to retrieve managers.' });
  }
});

// The two report gets:
app.get('/api/reports/events', async(req, res) =>{
  try{
    // returns specifically what's needed for the reports.
    const allEvents = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM eventlist",  function(err, result) {
          if (err) reject(err);  // Reject if issue
          else resolve(result);   // Resolve if success
      })
    })

    const eventsWithVols = await Promise.all(
      allEvents.map(async (event) => {
        const selectedVolunteers = await new Promise((resolve, reject) => {
          db.query(
            `SELECT userprofile.FullName 
             FROM eventvolmatch 
             JOIN userprofile ON eventvolmatch.UserID = userprofile.UserID 
             WHERE eventvolmatch.EventID = ?`,
            [event.EventID],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });

        return {
          ...event,
          selectedVolunteers, 
        };
      })
    );

    res.status(200).json(eventsWithVols);  
  } catch(err){
    console.error('Error fetching event report:', err);
    res.status(500).json({ message: 'Failed to create Event History report.' });
  }
});

app.get('/api/report/volunteer_history', async(req, res) =>{
  try{
    const allVolunteers = await new Promise((resolve, reject) => {
    db.query(`SELECT FullName, EventName, EventDate, EventStatus FROM userprofile LEFT JOIN logininfo ON userprofile.UserID = logininfo.UserID 
                  LEFT JOIN eventvolmatch ON eventvolmatch.UserID = logininfo.UserID 
                  LEFT JOIN eventlist ON eventvolmatch.EventID = eventlist.EventID
                  WHERE logininfo.userrole = 'Volunteer'
                  GROUP BY userprofile.UserID, eventlist.EventID;`,  function(err, result) {
        if (err) reject(err);  // Reject if issue
        else resolve(result);   // Resolve if success
      })
    })
    res.status(200).json(allVolunteers); 
  } catch(err){
    console.error('Error fetching volunteer report:', err);
    res.status(500).json({ message: 'Failed to create Volunteer History report.' });
  }
});

// Create a new volunteer
/*istanbul ignore start */
app.post('/api/volunteers', (req, res) => {
  const { name, skills } = req.body;
  const newVolunteer = {
    id: volunteers.length + 1,
    name,
    skills,
  };
  /* istanbul ignore next */
  volunteers.push(newVolunteer);
  /* istanbul ignore next */
  res.status(201).json(newVolunteer);
});
/*istanbul ignore end */
// Get all volunteers
app.get('/api/volunteers', (req, res) => {
  const volunteers = users.filter(user => user.role === 'Volunteer');
  res.json(volunteers);
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
app.put("/api/profile/:id", async (req, res) => {
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

  try {
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM userskills WHERE UserID = ?", [userId], function(err) {
        if (err) reject(err);
        else {
          console.log("User skills reset");
          resolve();
        }
      });
    });

    const skillsArray = Array.isArray(skills) ? skills : [];
    for (let skill of skills) {
      await new Promise((resolve, reject) => {
        db.query("INSERT INTO userskills (UserID, SkillName) VALUES (?, ?)", [userId, skill], function(err) {
          if (err) reject(err);
          else {
            console.log("Inserted " + skill);
            resolve();
          }
        });
      });
    }

  } catch (err) {
      console.error("Error editing skills: ", err)
  }

  try {
    await new Promise((resolve, reject) => {
      db.query("DELETE FROM useravailability WHERE UserID = ?", [userId], function(err){
        if (err) reject(err);
        else {
          console.log("User availability reset");
          resolve();
        }
      });
    });

    const availabilityArray = Array.isArray(availability) ? availability : [];
    for (let avail of availability) {
      await new Promise((resolve, reject) => {
        const formattedDate = new Date(avail).toISOString().slice(0, 10);
        db.query("INSERT INTO useravailability (UserID, DateAvail) VALUES (?,?)", [userId, formattedDate], function(err){
          if(err) throw err;
          else{
            console.log("Inserted " + avail)
            resolve();
          }
        });
      });
    }

  } catch (err) {
      console.error("Error editing skills: ", err)
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
  user.skills = Array.isArray(skills) ? skills : user.skills || [];
  user.availability = Array.isArray(availability) ? availability : user.availability || [];

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
    /* istanbul ignore next */
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
    /* istanbul ignore next */
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
        /* istanbul ignore next */
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
    /* istanbul ignore next */
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
        /* istanbul ignore next */
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
            /* istanbul ignore next */
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
/* istanbul ignore start */
async function init() {
  await fetchUsers(); 
  await fetchEvents();
}
/* istanbul ignore end */

/* istanbul ignore next */
if (require.main === module) {
  /* istanbul ignore next */
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  init();
}


module.exports = { fetchUsers, events, app, users, db };