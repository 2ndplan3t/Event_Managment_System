/*import React, { useState } from 'react';
import './component/FosterKitten.css';

const App = () => {
  const [volunteerMessage, setVolunteerMessage] = useState('');

  const handleVolunteerClick = () => {
    setVolunteerMessage('Thank you for your interest in volunteering! We will get in touch soon.');
  };

  return (
    <div className="App">
      <header>
        <h1 className="event-title">Foster for Kitten or Cat</h1>
        <p className="event-date">Date: 03-12-2025</p>
        <p className="event-address">
          <strong>Event Address:</strong> 1454 Lake-view park, West-Coast, California, USA
        </p>
      </header>

      <section className="event-description">
        <h2 className="section-title">How Can You Help Kittens and Cats?</h2>
        <p>
          Every year, thousands of kittens and cats are abandoned or found on the streets, left to fend for
          themselves in dangerous conditions. Foster care is a vital way to help these animals survive and thrive
          before they are adopted into loving homes. By volunteering, you are giving these cats the opportunity
          to grow in a safe, warm, and caring environment.
        </p>
        <p>
          You can help by fostering a kitten or cat temporarily until they find their forever home. Your support
          ensures their health, safety, and happiness, preventing them from facing the dangers of being outside
          alone. Whether you're providing food, comfort, or medical care, your role as a foster parent is critical
          in saving lives.
        </p>
      </section>

      <section className="volunteer-section">
        <button className="volunteer-button" onClick={handleVolunteerClick}>
          Apply to Volunteer
        </button>

        {volunteerMessage && <p className="volunteer-thank-you">{volunteerMessage}</p>}
      </section>

      <footer className="footer">
        <p>
          Your participation in this event can help give these animals a second chance at life. If you're unable to foster
          a cat, consider donating supplies or funds to help us continue our mission.
        </p>
      </footer>
    </div>
  );
};

export default App;
*/