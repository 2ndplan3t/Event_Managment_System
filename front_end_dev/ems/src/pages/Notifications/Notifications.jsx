import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Notifications.css'

function Notifications() {
  const [count, setCount] = useState(0)

  return (
    <div className="root">
      <header class="notif_page">
        <div class="nav_buttons"> 
         <Link to="/"> <button type="button">Home</button> </Link>
         <Link to="/user"> <button type="button">Profile</button> </Link>
         <Link to="/admin"><button type="button">Manage Event</button></Link>
         <Link to="/history"><button type="button">History</button></Link>
        </div>
        <h1>Notifications</h1>
      </header>
      <div class="notif_area">
        <p class="notification">This is a test notification</p>
        <p class="notification">This is a test notification</p>
        <p class="notification">This is a test notification</p>
      </div>
      <footer>
        <p><a href= "https://github.com/2ndplan3t/Event_Managment_System/tree/main"><img src="src/assets/GitHub-logo.png" alt="Github Link" width="80px" height="40px"></img></a> &copy; Copyright Group 9</p>
      </footer>
    </div>
  )
}

export default Notifications