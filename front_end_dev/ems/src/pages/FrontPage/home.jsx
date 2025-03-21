import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import img1 from "../../assets/volunteer.png";
import img2 from "../../assets/logo.png";
import "./home.css";
import Contact from "./Contact/Contact";

function Home() {
  const [events] = useState([
    { id: 1, title: "Foster for Kitten or Cat", date: "03-12-2025" },
    { id: 2, title: "Save the World", date: "04-22-2025" },
  ]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/isLoggedIn", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (data.loggedIn) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };
    
    checkLoginStatus();
  }, []); 

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include", 
      });
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="Home">
      <header className="header">
        <div className="home">
          <p>
            <img src={img2} alt="Share-Care Logo" />
            SHARE-CARE
          </p>
        </div>
        <div className="buttons-container">
          <div className="left-header">
            {user ? (
              // Logged-in header
              <>
                <div className="profile">
                  <Link to={user.role === "Manager" ? "/admin" : "/user"}>
                    <button>Profile</button>
                  </Link>
                </div>
                <div className="logout">
                  <button onClick={handleLogout}>Logout</button>
                </div>
                <div className="donation-bar">
                  <Link to="/donate">
                    <button>Donate Now!</button>
                  </Link>
                </div>
                <div className="contact-info">
                  <button
                    onClick={() =>
                      window.scrollTo({
                        top: document.documentElement.scrollHeight,
                        behavior: "smooth",
                      })
                    }
                  >
                    Contact Us
                  </button>
                </div>
              </>
            ) : (
              // Not logged-in header: Original buttons
              <>
                <div className="login">
                  <Link to="/login">
                    <button>Login</button>
                  </Link>
                </div>
                <div className="signin">
                  <Link to="/login" state={{ signup: true }}>
                    <button>Sign Up</button>
                  </Link>
                </div>
                <div className="donation-bar">
                  <Link to="/donate">
                    <button>Donate Now!</button>
                  </Link>
                </div>
                <div className="contact-info">
                  <button
                    onClick={() =>
                      window.scrollTo({
                        top: document.documentElement.scrollHeight,
                        behavior: "smooth",
                      })
                    }
                  >
                    Contact Us
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="image-gallery">
          <img src={img1} alt="Volunteer" />
        </div>

        <section className="events">
          <h2>Upcoming Events</h2>
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <h3>{event.title}</h3>
                <p>Date: {event.date}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Contact />
    </div>
  );
}

export default Home;