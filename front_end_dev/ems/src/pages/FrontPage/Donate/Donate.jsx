import React, { useState } from 'react';
import { Link } from 'react-router-dom';
//import './donation.css';

const Donate = () => {
  const [donationType, setDonationType] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [itemDescription, setItemDescription] = useState('');

  const handleDonationTypeChange = (event) => {
    setDonationType(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('Thank you for your donation! Your contribution will help those in need.');
  };



  return (
    <div className="DonateApp">
      <header>
        <h1>Donation Drive at Our Local Address</h1>
        <p>
          We are collecting donations of money, clothes, and other essential items.
          Please drop them off at the following address:
        </p>
        <address>
          <strong>Donation Address:</strong> 123 Charity Lane, Lubbock-TX, USA
        </address>
      </header>

      <section className="donation-form">
        <h2>How You Can Help</h2>
        <form onSubmit={handleSubmit}>
          <label>
            <input
              type="radio"
              value="money"
              checked={donationType === 'money'}
              onChange={handleDonationTypeChange}
            />
            Donate Money
          </label>

          <label>
            <input
              type="radio"
              value="clothes"
              checked={donationType === 'clothes'}
              onChange={handleDonationTypeChange}
            />
            Donate Clothes
          </label>

          <label>
            <input
              type="radio"
              value="other"
              checked={donationType === 'other'}
              onChange={handleDonationTypeChange}
            />
            Donate Other Items
          </label>

          {donationType === 'money' && (
            <div className="money-donation">
              <label>
                Amount ($): 
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter donation amount"
                />
              </label>
            </div>
          )}

          {donationType === 'clothes' && (
            <div className="clothes-donation">
              <label>
                Description of Clothes:
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Briefly describe the clothes you're donating."
                />
              </label>
            </div>
          )}

          {donationType === 'other' && (
            <div className="other-donation">
              <label>
                Description of Items:
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Describe other items you're donating."
                />
              </label>
            </div>
          )}

          <button type="submit">Submit Donation</button>
        </form>

        {message && <p className="thank-you-message">{message}</p>}
      </section>

      <footer>
        <p>
          <strong>How Donations Will Be Used:</strong><br />
          All monetary donations will go towards supporting local communities, providing food, shelter, and other necessities.<br />
          Clothes and other items will be distributed to families in need.
        </p>
      </footer>
      <Link to="/">
        <button>
          Back to homepage
        </button>
      </Link>
      
    </div>
  );
};

export default Donate;
