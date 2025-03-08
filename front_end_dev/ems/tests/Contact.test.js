import React from 'react';
import { render, screen } from '@testing-library/react';
import Contact from '../src/pages/FrontPage/Contact/Contact'; // Adjust path as needed

describe('Contact Component', () => {
  const renderContact = () => {
    render(<Contact />);
  };

  it('renders without crashing', () => {
    renderContact();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
  });

  it('displays the correct header', () => {
    renderContact();
    const header = screen.getByRole('heading', { name: 'Contact Information' });
    expect(header).toBeInTheDocument();
    expect(header.tagName).toBe('H1');
  });

  it('renders organization information correctly', () => {
    renderContact();
    
    expect(screen.getByRole('heading', { name: 'Share-Care' })).toBeInTheDocument();
    
    const description = screen.getByText(/Share-Care is a non-profit organization/);
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent(
      'Share-Care is a non-profit organization dedicated to planning and managing events that bring communities together.'
    );
  });

  it('renders contact details section', () => {
    renderContact();
    
    expect(screen.getByRole('heading', { name: 'Contact Us' })).toBeInTheDocument();
    
    // Test address - using a custom matcher function
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Address: 123 Community Lane, Springfield, IL 62701';
    })).toBeInTheDocument();
    
    // Test email
    const emailLink = screen.getByRole('link', { name: 'info@share-care.org' });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:info@share-care.org');
    
    // Test phone
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Phone: (555) 123-4567';
    })).toBeInTheDocument();
  });

  it('has correct class names', () => {
    renderContact();
    
    const container = screen.getByText('Contact Information').closest('div');
    expect(container).toHaveClass('contact-container');
    
    const header = screen.getByText('Contact Information').closest('header');
    expect(header).toHaveClass('contact-header');
    
    expect(screen.getByText(/Share-Care is a non-profit/).closest('section'))
      .toHaveClass('organization-info');
    
    expect(screen.getByText('Contact Us').closest('section'))
      .toHaveClass('contact-details');
  });
});