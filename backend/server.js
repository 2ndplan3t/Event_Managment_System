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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
