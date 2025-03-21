const db = require("./db.js");
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bcrypt = require('bcryptjs');
require("dotenv").config();

const app = express();
const PORT = 3000;

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

// Hardcoded admin and volunteer profiles
const users = [
    { id: 1,
      email: "admin@example.com",
      password: "admin_123",
      role:"admin",
      fullName:"Admin" },
    { id: 2, 
      email: "johndoe@gmail.com", 
      password: "admin_123", 
      role:"admin", 
      fullName:"John Doe" },
    { id: 3, 
      email: "charlie@example.com", 
      password: "volunteer_123", 
      role:"volunteer", 
      fullName: "Charlie Brown" ,
      address1:"1267 Main street",
      address2:"",
      city: "Long Island",
      state: "NY",
      zip:"88580",
      skills: ["First Aid", "Security"],
      volunteerHistory: [],
      // all of this gets heavily changed later I just wanted it to kinda reflect how it'll look in the database w/ foreign keys n stuff
      notifications: [
        { notifID: 0,
          eventID: 0,
          eventName: "Cleaning the Beach", // usually you'd use a query for this but alas
          type: "Assignment",
          // there will be a way to time notifications later on, but for now this works
          isCleared: false, // did the user clear this notification?
          isVisible: true, // Should this notification be visible to the user?
          text: "You've been assigned to an event! What follows is the event details:" //this will also be heavily changed
        }
      ]},
    { id: 4, 
      email: "alice@example.com", 
      password: "volunteer_123", 
      role:"volunteer", 
      fullName: "Alice",
      address1:"",
      address2:"",
      city: "",
      state: "",
      zip:"",
      skills: ["First Aid", "Logistics"],
      volunteerHistory: [ 
        {event: "Charity Run",
         eventdesc:"To raise awareness and money for lesser-known diseases",
         location: "18427 Southwest Fwy, Sugar Land, TX 77479", 
         date: "2024-06-15",
         status: "Completed" }],
      notifications: []
    },
];
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

hashPasswords();
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
app.post("/api/register", async (req, res) => {
    try {
        const { fullName, email, password, role = "volunteer", skills = [] } = req.body;
        if (users.some(user => user.email === email)) return res.status(400).json({ message: "Email already in use." });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: users.length + 1, email, password: hashedPassword, role, fullName, skills };
        users.push(newUser);
        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
      /* istanbul ignore next */
        console.error("Registration error:", error);
        /* istanbul ignore next */
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // password presence
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  if (!email){
    return res.status(400).json({ message: "Email is required" });
  }

  const user = users.find((u) => u.email === email); 

  // Check if the password is valid
  try {
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set session with user data
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

    res.json({ message: "Login successful", user: req.session.user });
  } catch (error) {
    /* istanbul ignore next */
    //console.error("Error during password comparison:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/logout", (req, res) => {

    res.clearCookie("connect.sid"); 
    res.json({ message: "Logout successful" });
    //console.log("Logout successful, session destroyed");
});

app.get("/api/admin/profile", requireAuth, (req, res) => {
  const user = req.session.user;
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
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



// Match volunteers with event required skills
const matchVolunteers = (event) => {
    const volunteers = users.filter(user => user.role === "volunteer");
    return volunteers.filter((volunteer) =>
        volunteer.skills.some((skill) => event.requiredSkills.includes(skill))
    );
};

//Mysha lines: 274-485
// Add skills to an event
app.post('/api/events/:eventId/skills', (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const { skillName } = req.body;

  // Check if skill is valid
  const validSkills = ["First-Aid", "Animal Handling", "Cooking", "Sewing", "Communication", "Fundraising"];
  if (!validSkills.includes(skillName)) {
      return res.status(400).json({ message: 'Invalid skill name' });
  }

  // Insert into EventSkills
  db.query(
      `INSERT INTO EventSkills (EventID, SkillName) VALUES (?, ?)`,
      [eventId, skillName],
      (err) => {
          if (err) {
              console.error("Error inserting into EventSkills:", err);
              return res.status(500).json({ message: "Internal server error" });
          }
          res.status(201).json({ message: "Skill added to event successfully" });
      }
  );
});


// POST - Create an Event
app.post('/api/events', (req, res) => {
  const { name, location, envoy, requiredSkills, urgencyLevel, date, manager } = req.body;

  if (!name || !location || !envoy || !requiredSkills || !urgencyLevel || !date || !manager) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  const eventStatus = "In Progress"; // Default status for a new event

  db.query(
    `INSERT INTO EventList (EventName, EventDesc, EventLocation, EventUrgency, EventDate, EventStatus) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, requiredSkills, location, urgencyLevel, date, eventStatus],
    (err, result) => {
      if (err) {
        console.error("Error creating event:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      const newEvent = {
        EventID: result.insertId,
        EventName: name,
        EventDesc: requiredSkills,
        EventLocation: location,
        EventUrgency: urgencyLevel,
        EventDate: date,
        EventStatus: eventStatus,
      };

      res.status(201).json(newEvent);
    }
  );
});

// PUT - Edit an Event
app.put('/api/events/:id', async (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { name, location, envoy, requiredSkills, urgencyLevel, date, manager, status } = req.body;

  db.query('SELECT * FROM EventList WHERE EventID = ?', [eventId], (err, result) => {
    if (err) {
      console.error("Error fetching event:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    db.query(
      `UPDATE EventList 
       SET EventName = ?, EventDesc = ?, EventLocation = ?, EventUrgency = ?, EventDate = ?, EventStatus = ?
       WHERE EventID = ?`,
      [name, requiredSkills, location, urgencyLevel, date, status || 'In Progress', eventId],
      (err, updateResult) => {
        if (err) {
          console.error("Error updating event:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        res.status(200).json({ message: "Event updated successfully" });
      }
    );
  });
});

// GET - Fetch All Events
app.get('/api/events', (req, res) => {
  db.query('SELECT * FROM EventList', (err, results) => {
    if (err) {
      console.error("Error fetching events:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    res.status(200).json(results);
  });
});

// DELETE - Delete an Event
app.delete('/api/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);

  db.query('SELECT * FROM EventList WHERE EventID = ?', [eventId], (err, result) => {
    if (err) {
      console.error("Error fetching event:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    db.query('DELETE FROM EventList WHERE EventID = ?', [eventId], (err, deleteResult) => {
      if (err) {
        console.error("Error deleting event:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.status(200).json({ message: 'Event deleted successfully' });
    });
  });
});


// Match volunteers with event required skills
app.post('/api/events/:eventId/match-volunteers', (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);

  // Get the required skills for the event
  db.query(
      `SELECT SkillName FROM EventSkills WHERE EventID = ?`,
      [eventId],
      (err, skillsRows) => {
          if (err) {
              console.error("Error fetching skills for event:", err);
              return res.status(500).json({ message: "Internal server error" });
          }

          if (skillsRows.length === 0) {
              return res.status(404).json({ message: "Event has no skills defined" });
          }

          const requiredSkills = skillsRows.map(row => row.SkillName);

          // Find volunteers with matching skills
          db.query(
              `SELECT u.UserID, u.FullName, u.Skills FROM UserProfile u WHERE u.Role = 'Volunteer'`,
              (err, volunteers) => {
                  if (err) {
                      console.error("Error fetching volunteers:", err);
                      return res.status(500).json({ message: "Internal server error" });
                  }

                  const matchedVolunteers = volunteers.filter(volunteer =>
                      requiredSkills.some(skill => volunteer.Skills.includes(skill))
                  );

                  if (matchedVolunteers.length === 0) {
                      return res.status(404).json({ message: "No volunteers match the event's skills" });
                  }

                  // Insert matched volunteers into EventVolMatch table
                  matchedVolunteers.forEach(volunteer => {
                      db.query(
                          `INSERT INTO EventVolMatch (EventID, UserID) VALUES (?, ?)`,
                          [eventId, volunteer.UserID],
                          (err) => {
                              if (err) {
                                  console.error("Error inserting into EventVolMatch:", err);
                              }
                          }
                      );
                  });

                  res.status(200).json({ message: "Volunteers matched to event successfully", matchedVolunteers });
              }
          );
      }
  );
});

// Fetch matched volunteers for an event
app.get('/api/events/:eventId/matched-volunteers', (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);

  db.query(
      `SELECT u.UserID, u.FullName, u.Skills FROM UserProfile u
       JOIN EventVolMatch evm ON evm.UserID = u.UserID
       WHERE evm.EventID = ?`,
      [eventId],
      (err, volunteers) => {
          if (err) {
              console.error("Error fetching matched volunteers:", err);
              return res.status(500).json({ message: "Internal server error" });
          }

          if (volunteers.length === 0) {
              return res.status(404).json({ message: "No matched volunteers for this event" });
          }

          res.status(200).json({ matchedVolunteers: volunteers });
      }
  );
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

module.exports = { events, app, users };