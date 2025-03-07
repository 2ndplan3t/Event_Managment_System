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
        {event: "event name",
         eventdesc:"example description",
         location: "location", 
         date: "2024-06-15",
         status: "Completed" }],
      notifications: []
    },
];

const hashPasswords = async () => {
  for (let user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;  
  }
  console.log("Users with hashed passwords:", users);
};


hashPasswords();

const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ message: "Unauthorized" });
    next();
};

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
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email); 

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  req.session.user = { id: user.id, email: user.email, role: user.role, fullName: user.fullName };
  console.log("Session set:", req.session); 
  res.json({ message: "Login successful", user: req.session.user });
});


app.post("/api/logout", (req, res) => {
    req.session.user = null;
    req.session.destroy(() => res.json({ message: "Logout successful" }));
    console.log("Logout successful");
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
    res.status(404).json({ message: "No user found - how did you get here?" });
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
        matchedVolunteers: [],
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