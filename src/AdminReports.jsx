import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CSVLink } from 'react-csv';
import './AdminReports.css'; // Optional for styling

function AdminReports() {
  const [volunteerData, setVolunteerData] = useState([]);
  const [eventData, setEventData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const volunteerRes = await fetch('http://localhost:5000/api/volunteer-history/all');
        const eventRes = await fetch('http://localhost:5000/api/events');
        const volunteers = await volunteerRes.json();
        const events = await eventRes.json();

        setVolunteerData(volunteers);
        setEventData(events);
      } catch (error) {
        console.error('Error fetching report data:', error);
      }
    };

    fetchData();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();

    // Volunteer History Section
    doc.text("Volunteer Participation Report", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Volunteer', 'Event', 'Date', 'Status']],
      body: volunteerData.map(v => [
        v.userName || v.volunteerName,
        v.eventName,
        new Date(v.eventDate).toLocaleDateString(),
        v.eventStatus
      ])
    });

    // Event Details Section
    doc.addPage();
    doc.text("Event Assignments", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Event', 'Location', 'Date', 'Manager', 'Volunteers']],
      body: eventData.map(e => [
        e.EventName,
        e.EventLocation,
        new Date(e.EventDate).toLocaleDateString(),
        e.manager || 'N/A',
        (e.selectedVolunteers || []).map(v => v.label || v.FullName).join(", ")
      ])
    });

    doc.save("volunteer_report.pdf");
  };

  const csvVolunteerData = [
    ["Volunteer", "Event", "Date", "Status"],
    ...volunteerData.map(v => [
      v.userName || v.volunteerName,
      v.eventName,
      v.eventDate,
      v.eventStatus
    ])
  ];

  return (
    <div className="admin-reports">
      <h1>Admin Reports</h1>

      <div className="report-buttons">
        <button onClick={exportPDF}>📄 Export as PDF</button>
        <CSVLink data={csvVolunteerData} filename="volunteer_report.csv">
          <button>🧾 Export as CSV</button>
        </CSVLink>
      </div>

      <h2>Volunteer Participation Overview</h2>
      <table>
        <thead>
          <tr>
            <th>Volunteer</th>
            <th>Event</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {volunteerData.map((v, index) => (
            <tr key={index}>
              <td>{v.userName || v.volunteerName}</td>
              <td>{v.eventName}</td>
              <td>{new Date(v.eventDate).toLocaleDateString()}</td>
              <td>{v.eventStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Event Assignments</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Location</th>
            <th>Date</th>
            <th>Manager</th>
            <th>Volunteers</th>
          </tr>
        </thead>
        <tbody>
          {eventData.map((e, index) => (
            <tr key={index}>
              <td>{e.EventName}</td>
              <td>{e.EventLocation}</td>
              <td>{new Date(e.EventDate).toLocaleDateString()}</td>
              <td>{e.manager}</td>
              <td>{(e.selectedVolunteers || []).map(v => v.label || v.FullName).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminReports;

