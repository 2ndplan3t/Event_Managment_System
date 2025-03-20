import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Login.css'; 
import Home from '../FrontPage/home';

function Login() {
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(location.state?.signup || false);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Closing login/signup will redirect to the homepage
  const closeModal = () => {
    setIsModalOpen(false);
    navigate('/');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  const passwordValidation = (password) => {
    const lengthCondition = /.{8,}/;
    const numberCondition = /\d/;

    if (!lengthCondition.test(password)) {
      return 'Password must be at least 8 characters long';
    }
    if (!numberCondition.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handleTabSwitch = (isSignUp) => {
    setIsSignUp(isSignUp);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      const passwordError = passwordValidation(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', 
          body: JSON.stringify({
            fullName: email.split("@")[0],
            email,
            password,
          }),
        });

        if (!response.ok) {
          throw new Error("Registration failed");
        }

        const data = await response.json();
        
        console.log("Registration successful:", data);
        alert("Sign-up successful! You can now log in.");
        setIsSignUp(false);
      } catch (error) {
        setError("Registration failed. Email may already be in use.");
        console.error("Sign-up error:", error);
      }
    } else {
      if (!email || !password) {
        setError("Please fill in both fields");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', 
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error("Invalid email or password");
        }

        const data = await response.json();
        
        console.log("Login successful:", data);
        console.log("User ID from login:", data.user.id);

        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "Manager") {
          localStorage.setItem("adminId", data.user.id);
          navigate("/admin");
        } else if (data.user.role === "Volunteer") {
          navigate("/user");
        } else {
          navigate("/");
        }
      } catch (error) {
        setError("Invalid email or password");
        console.error("Login error:", error);
      }
    }
  };

  return (
    <>
      <Home />
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown} tabIndex={0}>
          <div className="log-in-container">
            <div className="login-form-container">
              <button className="login-close-btn" onClick={closeModal}>×</button>

              <div className="login-form-toggle" data-testid="login-form-toggle">
                <button
                  className={isSignUp ? '' : 'active'}
                  onClick={() => handleTabSwitch(false)}
                >
                  Login
                </button>
                <button
                  className={isSignUp ? 'active' : ''}
                  onClick={() => handleTabSwitch(true)}
                >
                  Sign Up
                </button>
              </div>

              <form className="login-form" onSubmit={handleSubmit} data-testid="login-form">
                <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {isSignUp && (
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                )}

                <button type="submit">{isSignUp ? 'Sign Up' : 'Login'}</button>

                {!isSignUp && <a href="#">Forgot password?</a>}

                {error && <p className="error">{error}</p>}

                <p>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <span
                    style={{ color: '#1fb9b4', cursor: 'pointer' }}
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? ' Log in' : ' Sign Up'}
                  </span>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Login;