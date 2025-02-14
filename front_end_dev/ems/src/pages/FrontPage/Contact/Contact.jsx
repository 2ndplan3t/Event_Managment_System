import React from 'react';




function Contact() {
  return (
    <div className="contact-container">
      <header className="contact-header">
        <h1>Contact Information</h1>
      </header>
      <section className="organization-info">
        <h2>Share-Care</h2>
        <p>
          <strong>Description:</strong> Share-Care is a non-profit organization dedicated to planning and managing events that bring communities together. We focus on charity events, community outreach, and providing a platform for organizations to connect with people in need. Our mission is to create meaningful and impactful experiences that support and uplift local communities.
        </p>
      </section>
      <section className="contact-details">
        <h3>Contact Us</h3>
        <p><strong>Address:</strong> 123 Community Lane, Springfield, IL 62701</p>
        <p><strong>Email:</strong> <a href="mailto:info@share-care.org">info@share-care.org</a></p>
        <p><strong>Phone:</strong> (555) 123-4567</p>
      </section>
    </div>
  );
}

export default Contact;

