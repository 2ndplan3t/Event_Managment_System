import React, { useState, useEffect  } from 'react';
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


//closing login/signup will redirect to the homepage
  const closeModal = () => {
    setIsModalOpen(false); 
    navigate('/'); 
  };
 //alternative to clicking 'x' to exit out:
 //click outside the login/signup box or press escape to go back to the home page 
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
    // the password has at least 8 characters and contains at least one number
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
      console.log("Sign-up logic needs backend implementation.");
    } else {
      if (!email || !password) {
        setError("Please fill in both fields");
        return;
      }
  
      try {
        const response = await fetch("http://localhost:5000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
  
        if (!response.ok) {
          throw new Error("Invalid email or password");
        }
  
        const data = await response.json();
        console.log("Login successful:", data);

        localStorage.setItem("user", JSON.stringify(data));
  
        if (data.role === "admin") {
          localStorage.setItem("adminId", data.id);
          navigate("/admin");
        } else if (data.role === "volunteer") {
          navigate("/user");
        }else {
          navigate("/"); //undefined user role
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
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="log-in-container">
            <div className="login-form-container">
              <button className="login-close-btn" onClick={closeModal}>×</button>

              {/* toggle buttons for Login/SignUp */}
              <div className="login-form-toggle">
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

              <form className="login-form" onSubmit={handleSubmit}>
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
                 required />

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
