const express = require("express");
const session = require("express-session");
const cors = require("cors");
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
        {event: "event name",
         eventdesc:"example description",
         location: "location", 
         date: "2024-06-15",
         status: "Completed" }],
      notifications: []
    },
];

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ message: "Unauthorized" });
    next();
};

// User Registration Route
app.post("/api/register", async (req, res) => {
    const { fullName, email, password, role = "volunteer", skills = [] } = req.body;
    if (users.some(user => user.email === email)) return res.status(400).json({ message: "Email already in use." });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, email, password: hashedPassword, role, fullName, skills };
    users.push(newUser);
    res.status(201).json({ message: "Registration successful" });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password); // Direct comparison
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  req.session.user = { id: user.id, email: user.email, role: user.role, fullName: user.fullName };
  console.log("Session set:", req.session); // Debug
  res.json({ message: "Login successful", user: req.session.user });
});


app.post("/api/logout", (req, res) => {
    req.session.destroy(() => res.json({ message: "Logout successful" }));
});

app.get("/api/admin/profile", requireAuth, (req, res) => {
  const user = req.session.user;
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  // Return the admin's profile data from the session
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
});

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
    res.json(events);
});

app.delete('/api/events/:id', (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    console.log(`Deleting event with ID: ${eventId}`);
    events = events.filter((event) => event.id !== eventId);
    console.log('Updated events:', events);
    res.status(200).json({ message: 'Event deleted successfully.' });
});


app.post('/api/volunteers', (req, res) => {
    const { name, skills } = req.body;
    const newVolunteer = {
        id: users.length + 1,
        name,
        skills,
    };
    users.push(newVolunteer); // Changed from volunteers to users
    res.status(201).json(newVolunteer);
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});