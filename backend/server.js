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
      fullName: "Charlie Brown" ,
      address1:"1267 Main street",
      address2:"",
      city: "Long Island",
      state: "NY",
      zip:"88580",
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

//user profile management
//get user profile by ID
app.get("/api/profile/:id", (req, res) => {
  const user = users.find((user) => user.id === parseInt(req.params.id));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// Route to update user profile
app.post("/api/profile/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const { fullName, address1, address2, city, state, zipCode, skills, preferences, availability } = req.body;

  if (!fullName){return res.status(400).json({ message: "Full name is required" });}
  if (!address1){return res.status(400).json({ message: "Address is required" });}
  if (!city){return res.status(400).json({ message: "City is required" });}
  if (!state){return res.status(400).json({ message: "State is required" });}
  if (!zipCode){return res.status(400).json({ message: "Zipcode is required" });}
  if (!skills){return res.status(400).json({ message: "Skills are required" });}

  

  const user = users.find((user) => user.id === userId);
  if (user) {
    // Update the user profile with the new data
    user.fullName = fullName;
    user.address1 = address1;
    user.address2 = address2 || "";
    user.city = city;
    user.state = state;
    user.zip = zipCode;
    user.skills = skills;
    user.preferences = preferences || "";
    user.availability = availability || [];

    res.json({ message: "Profile updated successfully", user });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

//volunteer history

//get a user's volunteer history
app.get("/api/volunteer-history/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  console.log("Requested user ID:", userId);

  const user = users.find((u) => u.id === userId);
  console.log("Found user:", user);

  if (!user) {
      return res.status(404).json({ message: "User not found" });
  }

  if (!user.volunteerHistory) {
      return res.status(200).json([]); // Return empty history instead of 404
  }

  res.json(user.volunteerHistory);
});

//add a volunteer event to a user's history
app.post("/api/volunteer-history/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const { event, eventdesc, location, date, status } = req.body;

  if (!fullName){return res.status(400).json({ message: "Full name is required" });}
  if (!address1){return res.status(400).json({ message: "Address is required" });}
  if (!city){return res.status(400).json({ message: "City is required" });}
  if (!state){return res.status(400).json({ message: "State is required" });}
  if (!zipCode){return res.status(400).json({ message: "Zipcode is required" });}
  if (!skills){return res.status(400).json({ message: "Skills are required" });}

  const user = users.find((u) => u.id === userId);

  if (!user) {
      return res.status(404).json({ message: "User not found" });
  }

  if (!user.volunteerHistory) {
      user.volunteerHistory = [];
  }

  user.volunteerHistory.push({ event, eventdesc, location, date, status });

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
