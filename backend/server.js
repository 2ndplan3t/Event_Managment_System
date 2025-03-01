const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
//hardcoded admin and volunteer profiles
const users = [
    { id: 1, email: "admin@example.com", password: "admin_123", role:"admin" },
    { id: 2, email: "volunteer@example.com", password: "volunteer_123", role:"volunteer" },
    { id: 3, email: "johndoe@gmail.com", password: "admin_123", role:"admin" },

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
      res.json({ message: "Login successful", role: user.role });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
