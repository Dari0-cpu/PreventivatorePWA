import React from 'react'
import QuoteBuilder from './QuoteBuilder'

function App() {
  return (
    // Il div root dell'app
    <div className="antialiased text-gray-900 font-sans selection:bg-blue-200">
      <QuoteBuilder />
    </div>
  )
}

export default App