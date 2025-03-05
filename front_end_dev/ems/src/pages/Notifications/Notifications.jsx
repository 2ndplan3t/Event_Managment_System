import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Notifications.css'

/*
notifications have
- text
- date
- eventID / eventName
- time_to_be_sent
- notifType (enum -- add, removed, deleted event, 1week, 24hours)
*/

/*
  goals
    - whenever the events object changes, we should re-evaluate WHAT changed
    - and then send a notification based on what changed
*/

function testThing(){
  console.log(localStorage.getItem("eventList"));
}

function Notifications() {
  const [count, setCount] = useState(0)

  return (
    <div className="no-global-reset">
    <div className="root">
      <header className="notif_page">
        <button type="button" onClick={() => testThing()}>
          Test
        </button>

        <div className="nav_buttons"> 
         <Link to="/"> <button type="button">Home</button> </Link>
         <Link to="/user"> <button type="button">Profile</button> </Link>
         <Link to="/notifications"><button type="button">Notifications</button></Link>
         <Link to="/history"><button type="button">History</button></Link>
        </div>
        <h1>Notifications</h1>
      </header>
      <div className="notif_area">
        <p className="notification">This is a test notification</p>
        <p className="notification">This is a test notification</p>
        <p className="notification">This is a test notification</p>
      </div>
      <footer>
        <p><a href= "https://github.com/2ndplan3t/Event_Managment_System/tree/main"><img src="src/assets/GitHub-logo.png" alt="Github Link" width="80px" height="40px"></img></a> &copy; Copyright Group 9</p>
      </footer>
    </div>
    </div>
  )
}

export default Notifications