import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import './AdminReports.css';

const AdminReports = () => {
  const navigate = useNavigate();
  const [volunteerData, setVolunteerData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [selectedReport, setSelectedReport] = useState('');

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("user");
      localStorage.removeItem("adminId");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const volunteerRes = await fetch('http://localhost:5000/api/report/volunteer_history');
        const eventRes = await fetch('http://localhost:5000/api/reports/events');
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

    if(selectedReport === 'volunteer'){
      doc.text("Volunteer Participation Report", 14, 20);
      const rows = [];
      let prevName = null;
    
      volunteerData.forEach(v => {
        const currentName = v.FullName;
        const showName = currentName !== prevName;
        rows.push([
          showName ? currentName : '',  // should only show name once
          v.EventName,
          new Date(v.EventDate).toLocaleDateString(),
          v.EventStatus
        ]);
        prevName = currentName;
      });
    
      autoTable(doc, {
        startY: 30,
        head: [['Volunteer', 'Event', 'Date', 'Status']],
        body: rows,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [140, 150, 87] }
      });
      doc.save("volunteer_report.pdf");
    }

    if(selectedReport === 'event'){
      doc.text("Event Assignments", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [['Event', 'Location', 'Date', 'Status', 'Volunteers']],
        body: eventData.map(e => [
          e.EventName,
          e.EventLocation,
          new Date(e.EventDate).toLocaleDateString(),
          e.EventStatus,
          (e.selectedVolunteers || []).map(v => v.label || v.FullName).join(", ")
        ]),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [140, 150, 87] }
      });
      doc.save("event_history.pdf");
    }
  };

  const exportCSV = async() =>{
    var csvWriter;
    const rows = [];
    if(selectedReport === 'volunteer'){
      let prevName = null;
    
      volunteerData.forEach(v => {
        const currentName = v.FullName;
        const showName = currentName !== prevName;
        rows.push([
          showName ? currentName : '',  // should only show name once
          v.EventName,
          new Date(v.EventDate).toLocaleDateString(),
          v.EventStatus
        ]);
        prevName = currentName;
      });

      csvWriter = Papa.unparse({
        fields: ['Volunteer', 'Event', 'Date', 'Status'],
        data: rows
      });
    }

    if(selectedReport === 'event'){

      csvWriter = Papa.unparse({
        fields: ['Event', 'Location', 'Date', 'Status', 'Volunteers'],
        data: eventData.map(e => [
          e.EventName,
          e.EventLocation,
          new Date(e.EventDate).toLocaleDateString(),
          e.EventStatus,
          (e.selectedVolunteers || []).map(v => v.label || v.FullName).join(", ")
        ])
      });
    }

    // After data is retrieved, write into CSV file.
    
    const blob = new Blob([csvWriter], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    if(selectedReport === 'volunteer'){
      link.setAttribute('download', 'volunteer_report.csv');
    }
    else{
      link.setAttribute('download', 'event_history.csv')
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="root">
      <div className="report_nav_buttons">
        <Link to="/">
          <button>Home</button>
        </Link>
        <Link to="/admin">
          <button>Event Creation</button>
        </Link>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <h1>Admin Reports</h1>

      <div className="dropdown-container">
        <label htmlFor="reportSelect">Select Report: </label>
        <select
          id="reportSelect"
          value={selectedReport}
          onChange={(e) => setSelectedReport(e.target.value)}
        >
          <option value="">-- Please select a report --</option>
          <option value="volunteer">Volunteer Participation Overview</option>
          <option value="event">Event Assignments</option>
        </select>
      </div>

      {selectedReport && (
      <div className="report-buttons">
        <div className="button-row">
          <button onClick={exportPDF}>Export as PDF</button>
          <button onClick={exportCSV}>Export as CSV</button>
        </div>
        <span className="csv-note">
          Note: Please expand the columns in your .csv file in order for the date to show properly.
        </span>
      </div>
      )}

      {selectedReport === 'volunteer' && (
        <div className="report_area">
            <h3>Volunteer Participation Overview</h3>
            <table className="report_table">
              <thead>
                <tr className="report_row">
                  <th className="report_head">Volunteer</th>
                  <th className="report_head">Event</th>
                  <th className="report_head">Date</th>
                  <th className="report_head">Status</th>
                </tr>
              </thead>
              <tbody>
                {volunteerData.map((v, index) => {
                  const prev = volunteerData[index - 1];
                  const showName = !prev || prev.FullName !== v.FullName;
                  return(
                  <tr key={index} className="report_row">
                    <td className="report_entry">
                      <strong>{showName ? (v.FullName || v.FullName) : ''}</strong>
                    </td>
                    <td className="report_entry">{v.EventName}</td>
                    <td className="report_entry">{new Date(v.EventDate).toLocaleDateString()}</td>
                    <td className="report_entry">{v.EventStatus}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      )}

      {selectedReport === 'event' && (
        <div className="report_area">
            <h3>Event Assignments</h3>
            <table className="report_table">
              <thead>
                <tr className="report_row">
                  <th className="report_head">Event</th>
                  <th className="report_head">Location</th>
                  <th className="report_head">Date</th>
                  <th className="report_head">Status</th>
                  <th className="report_head">Volunteers</th>
                </tr>
              </thead>
              <tbody>
                {eventData.map((e, index) => (
                  <tr key={index} className="report_row">
                    <td className="report_entry">{e.EventName}</td>
                    <td className="report_entry">{e.EventLocation}</td>
                    <td className="report_entry">{new Date(e.EventDate).toLocaleDateString()}</td>
                    <td className="report_entry">{e.EventStatus}</td>
                    <td className="report_entry">{(e.selectedVolunteers || []).map(v => v.label || v.FullName).join(', ') || "None Assigned"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}
    </div>
  );
};

export default AdminReports;
