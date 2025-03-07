const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bcrypt = require('bcrypt');
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
      fullName: "Charlie" ,
      address1:"",
      address2:"",
      city: "",
      state: "",
      zip:"",
      skills: ["First Aid", "Security"],
      volunteerHistory: [],
      notifications: [] },
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

let events = [];

// Match volunteers with event required skills
const matchVolunteers = (event) => {
    const volunteers = users.filter(user => user.role === "volunteer");
    return volunteers.filter((volunteer) =>
        volunteer.skills.some((skill) => event.requiredSkills.includes(skill))
    );
};


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
        selectedVolunteers: [],
    };
    events.push(newEvent);
    res.status(201).json(newEvent);
});


app.get('/api/events', (req, res) => {
    //console.log(events);
    res.json(events);
});

app.delete('/api/events/:id', (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    //console.log(`Deleting event with ID: ${eventId}`);

    const eventIndex = events.findIndex(event => event.id === eventId);

    if (eventIndex === -1) {
      return res.status(404).json({ message: "Event not found." });
    }

    events.splice(eventIndex, 1);

  

    //console.log('Updated events:', events);
    res.status(200).json({ message: 'Event deleted successfully.' });
});


app.get('/api/volunteers', (req, res) => {
    const volunteers = users.filter(user => user.role === 'volunteer');
    res.json(volunteers);
});


app.post('/api/events/match-volunteers/:eventId', (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const event = events.find((e) => e.id === eventId);

    if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
    }

    const matchedVolunteers = matchVolunteers(event);
    res.json(matchedVolunteers);
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


  const { event, eventdesc, location, date, status, fullName, address1, city, state, zipCode, skills } = req.body;

  if (!fullName) return res.status(400).json({ message: "Full name is required" });
  if (!address1) return res.status(400).json({ message: "Address is required" });
  if (!city) return res.status(400).json({ message: "City is required" });
  if (!state) return res.status(400).json({ message: "State is required" });
  if (!zipCode) return res.status(400).json({ message: "Zipcode is required" });
  if (!skills) return res.status(400).json({ message: "Skills are required" });
  

  const user = users.find((u) => u.id === userId);
  //console.log("POST /volunteer-history - Found user:", user);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }



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