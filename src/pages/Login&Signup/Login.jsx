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

//temp admin and volunteer accounts
//logging in will redirect to the admin/volunteer user profile pages
  const adminCredentials = {
    email: 'johndoe@gmail.com',
    password: 'admin_123',
  };

  const volunteerCredentials = {
    email: 'volunteer@example.com',
    password: 'volunteer_123',
  };
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
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');  

    if (isSignUp) {
      const passwordError = passwordValidation(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
      } else {
        
        console.log('Signing up with', email, password);
      }
    } else {
      // Check if it's a temp admin/user login
      if (email === adminCredentials.email && password === adminCredentials.password) {
        //redirect to admin user profile page
        navigate('/admin'); 
      }if (email === volunteerCredentials.email && password === volunteerCredentials.password){
        //redirect to volunteer user profile page
        navigate('/user');
      
      } else if (!email || !password) {
        setError('Please fill in both fields');
      } else {
        // Validate temp login...
        console.log('Logging in with', email, password);
      }
    }
  };

  useEffect(() => {
    setIsSignUp(location.pathname === '/signup');
    
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [location, isModalOpen]);

  return (
    <>
    <Home />
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="log-in-container">
            <div className="form-container">
              <button className="close-btn" onClick={closeModal}>×</button>

              {/* toggle buttons for Login/SignUp */}
              <div className="form-toggle">
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

              <form className="form" onSubmit={handleSubmit}>
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
                    style={{ color: '#5ad0cc', cursor: 'pointer' }}
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