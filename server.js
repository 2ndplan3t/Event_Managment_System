const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
//hardcoded admin and volunteer profiles
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
  app.get("/api/users", (req, res) => {
    res.json(users);
  });

//to check messages in the console log, press F12 in the browser
//testing backend connection
app.get("/api/test", (req, res) => {
    res.json({ message: "Backend is working" });
  });


 
// Login route
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email && u.password === password);
  
    if (user) {
      res.json({
        message: "Login successful",
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
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


// In-memory arrays for events and volunteers
let events = [];
let volunteers = [
  { id: 1, name: 'Alice', skills: ['First - Aid', 'Logistics'] },
  { id: 2, name: 'Bob', skills: ['Security', 'Social and Cultural'] },
  { id: 3, name: 'Charlie', skills: ['First - Aid', 'Security'] },
];


// Utility to match volunteers with event required skills
const matchVolunteers = (event) => {
  if (!event.requiredSkills.length) return [];
  return volunteers.filter((volunteer) =>
    volunteer.skills.some((skill) => event.requiredSkills.includes(skill))
  );
};

// Create a new event
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

// Get all events
app.get('/api/events', (req, res) => {
  res.json(events);
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
  res.json(volunteers);
});

// Match volunteers to an event
app.post('/api/events/match-volunteers/:eventId', (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  // Get the matched volunteers
  const matchedVolunteers = matchVolunteers(event);
  res.json(matchedVolunteers);
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
