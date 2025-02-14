import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <header class="notif_page">
        <div class="nav_buttons"> 
          <button type="button">Home</button>
          <button type="button">Profile</button>
          <button type="button">Manage Event</button>
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
    </>
  )
}

export default App
