import { useState } from 'react'
import './App.css'
import Router from './routes/Router.jsx'
import React from 'react'
function App() {
  const [count, setCount] = useState(0)

  return (
     <div>
        <Router />
     </div>
  )
}

export default App
