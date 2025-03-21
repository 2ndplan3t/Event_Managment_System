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
// Get all the users from the database
async function fetchUsers() {
  try {
      users = await new Promise((resolve, reject) => {
          db.query("SELECT * FROM logininfo", function(err, result) {
              if (err) reject(err);  // Reject if issue
              else resolve(result);   // Resolve if success
          });
      });

      console.log("Users fetched from database successfully.");  // Users was successfully gotten
      users = users.map(user => ({ ...user }));

  } catch (error) {
      console.error('Error fetching users:', error);
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
    console.log(users);
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
            console.log(userRows);
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

app.get("/api/admin/profile", (req, res) => {
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
  const userAcc = users.find((user) => user.UserID === parseInt(req.params.id));
  if(userAcc){
    res.json(userAcc);
  }
  else{
    res.status(404).json({ message: "User not found" });
  }
});

// route to get admin profile/event management page
app.get("/api/admin/:id", (req, res) => {
  const admin = users.find((user) => user.id === parseInt(req.params.id) && user.role === "admin");
  if (admin) {
      res.json(admin);
  } else {
      res.status(404).json({ message: "Admin not found" });
  }
}); 


let events = [];


// match volunteers with event required skills
const matchVolunteers = (event) => {
  const volunteers = users.filter(user => user.role === "volunteer");

  return volunteers.filter((volunteer) =>
    volunteer.skills.some((skill) => event.requiredSkills.includes(skill))
  );
};



// Get all events
app.get('/api/events', (req, res) => {
  res.json(events);
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
  console.log(`Deleting event with ID: ${eventId}`);
  events = events.filter((event) => event.id !== eventId);
  console.log('Updated events:', events);
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
  const volunteers = users.filter(user => user.role === 'volunteer');
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
    user.role === "volunteer" && 
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
app.put("/api/profile/:id", (req, res) => {
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

// get all data when the server is ran
async function init() {
  await fetchUsers(); 
  console.log(users);
}

/* istanbul ignore next */
if (require.main === module) {
  /* istanbul ignore next */
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  init();
}

module.exports = { events, app, users, db };