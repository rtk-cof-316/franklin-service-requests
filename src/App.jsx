import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
      if (data && data.length > 0) {
        setConnected(true)
      }
    }
    testConnection()
  }, [])

  return (
    <div>
      <h1>Franklin Service Requests</h1>
      <p>{connected ? 'Connected to database!' : 'Connecting...'}</p>
    </div>
  )
}

export default App