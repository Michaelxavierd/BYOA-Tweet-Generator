import { useState } from 'react'

function App() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRemix = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      })
      const data = await response.json()
      setOutputText(data.remixedText)
    } catch (error) {
      console.error('Error:', error)
      setOutputText('Error occurred while remixing text')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Remixer</h1>
        
        <div className="space-y-4">
          <textarea
            className="w-full h-40 p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Paste your text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <button
            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            onClick={handleRemix}
            disabled={!inputText || isLoading}
          >
            {isLoading ? 'Remixing...' : 'Remix Text'}
          </button>
          
          {outputText && (
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <h2 className="text-lg font-semibold mb-2">Remixed Output:</h2>
              <p className="whitespace-pre-wrap">{outputText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App 