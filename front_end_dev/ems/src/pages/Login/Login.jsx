import React, { useState, useEffect  } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Login.css'; 

function Login() {
    const location = useLocation();
    const [isSignUp, setIsSignUp] = useState(location.state?.signup || false);
    const [isModalOpen, setIsModalOpen] = useState(true);
    const navigate = useNavigate(); 

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
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="log-in-container">
            <div className="form-container">
              <button className="close-btn" onClick={closeModal}>×</button>

              {/* Toggle buttons for Login/SignUp */}
              <div className="form-toggle">
                <button
                  className={isSignUp ? '' : 'active'}
                  onClick={() => setIsSignUp(false)}
                >
                  Login
                </button>
                <button
                  className={isSignUp ? 'active' : ''}
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </button>
              </div>

              <form className="form">
                <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>

                <input type="email" placeholder="Email" required />
                <input type="password" placeholder="Password" required />

                {isSignUp && <input type="password" placeholder="Confirm Password" required />}

                <button type="submit">{isSignUp ? 'Sign Up' : 'Login'}</button>

                {!isSignUp && <a href="#">Forgot password?</a>}

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
