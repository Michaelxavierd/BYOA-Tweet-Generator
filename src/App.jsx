import { useState, useEffect } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from './supabaseClient'

function App() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [savedTweets, setSavedTweets] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Fetch saved tweets on component mount
  useEffect(() => {
    fetchSavedTweets()
  }, [])

  const fetchSavedTweets = async () => {
    const { data, error } = await supabase
      .from('saved_tweets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved tweets:', error)
    } else {
      setSavedTweets(data)
    }
  }

  const handleSaveTweet = async (tweetContent) => {
    try {
      console.log('Attempting to save tweet:', { tweetContent });
      
      if (!tweetContent) {
        throw new Error('Tweet content is empty');
      }

      const { data, error } = await supabase
        .from('saved_tweets')
        .insert([
          { 
            content: tweetContent,
            created_at: new Date().toISOString()
          }
        ])
        .select('*')
        .single()

      if (error) {
        console.error('Supabase Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from save operation');
      }

      console.log('Tweet saved successfully:', data);
      setSavedTweets(prev => [...prev, data]);
      setIsSidebarOpen(true);
      
    } catch (error) {
      console.error('Save tweet error:', error);
      alert(error.message || 'Failed to save tweet. Please try again.');
    }
  }

  const handleDeleteSavedTweet = async (tweetId) => {
    try {
      const { error } = await supabase
        .from('saved_tweets')
        .delete()
        .eq('id', tweetId)

      if (error) {
        console.error('Error deleting tweet:', error)
        alert('Failed to delete tweet. Please try again.')
      } else {
        setSavedTweets(savedTweets.filter(tweet => tweet.id !== tweetId))
      }
    } catch (error) {
      console.error('Error deleting tweet:', error)
      alert('Failed to delete tweet. Please try again.')
    }
  }

  const handleRemix = async () => {
    setIsLoading(true)
    try {
      if (!import.meta.env.VITE_CLAUDE_API_KEY) {
        throw new Error('Please add your Claude API key to the .env file')
      }

      const anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
        dangerouslyAllowBrowser: true
      })

      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        messages: [
          { 
            role: "user", 
            content: `Generate 5 unique, natural-sounding tweets based on the following content. Format each tweet exactly like this, with each tweet on its own line and use | to indicate line breaks within each tweet:

            [TWEET 1]
            First complete thought or sentence here |
            Another full thought here |
            Final complete thought here

            [TWEET 2]
            Complete opening statement here |
            Full closing thought here

            For each tweet:
            - Write in clear, conversational language without hashtags
            - Keep under 280 characters total
            - Break up the text into 2-3 complete thoughts using | as separator
            - Never break a line after a comma
            - Each line should be a complete thought or sentence
            - Maintain the original tone and style
            - Focus on one clear point or angle
            - Make it engaging and shareable
            
            Content to transform into tweets: ${inputText}`
          }
        ],
      })

      console.log('Claude API Response:', response)

      if (!response || !response.content || !response.content[0]) {
        throw new Error('Invalid response from Claude API')
      }

      setOutputText(response.content[0].text)
    } catch (error) {
      console.error('Detailed Error:', {
        message: error.message,
        type: error.type,
        status: error.status,
        details: error
      })
      setOutputText(`Error: ${error.message || 'Unknown error occurred'}. Please check your API key and try again.`)
    }
    setIsLoading(false)
  }

  const handleTweetShare = (tweetContent) => {
    const formattedTweet = tweetContent.replace(/\s*\|\s*/g, '\n\n');
    const tweetText = encodeURIComponent(formattedTweet.trim());
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  const renderTweets = () => {
    if (!outputText) return null;
    const tweets = outputText.split('\n').reduce((acc, line) => {
      const tweetMatch = line.match(/\[TWEET \d\]/);
      if (tweetMatch) {
        acc.push({ content: '' });
      } else if (acc.length > 0 && line.trim()) {
        acc[acc.length - 1].content += line.trim();
      }
      return acc;
    }, []);

    return tweets.map((tweet, index) => (
      <div 
        key={index} 
        className="group relative bg-[#232527] p-6 rounded-xl border border-gray-800 transform transition-all duration-500 ease-out hover:scale-[1.05] hover:-translate-y-4 hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:z-10 hover:border-indigo-500/50 hover:bg-[#2A2D30]"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-grow">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-400 flex items-center justify-center group-hover:border-indigo-300 transition-colors">
              <span className="text-indigo-400 font-semibold group-hover:text-indigo-300 transition-colors text-sm">
                {index + 1}
              </span>
            </div>
            <div className="h-px flex-grow bg-gray-800 group-hover:bg-indigo-900/50 transition-colors"></div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleSaveTweet(tweet.content)}
              className="p-2 text-gray-400 hover:text-indigo-400 transition-colors relative z-20"
              title="Save Tweet"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button 
              onClick={() => handleTweetShare(tweet.content)}
              className="p-2 text-gray-400 hover:text-indigo-400 transition-colors relative z-20"
              title="Share on Twitter"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="text-gray-300 space-y-6 group-hover:text-white transition-all transform group-hover:translate-x-1">
          {tweet.content.split('|').map((line, i) => (
            <p key={i} className="leading-relaxed text-lg transition-all">{line.trim()}</p>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <span className="text-sm text-gray-500">
            {280 - tweet.content.length} characters remaining
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/0 group-hover:from-indigo-600/5 group-hover:to-transparent rounded-xl transition-all duration-500"></div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-[#0E1012] text-white py-12 px-4 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-full inline-block mb-4">
            Beta 2025
          </div>
          <h1 className="text-5xl font-bold tracking-tight flex items-center justify-center gap-3">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>
              <span className="font-bold">R</span>
              <span className="font-bold">e</span>
              <span className="font-black border-b-4 border-indigo-600">mixer</span>
            </span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Transform your content with AI-powered remixing
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6 mt-12">
          <div className="bg-[#1A1C1E] rounded-2xl p-6 border border-gray-800">
            <textarea
              className="w-full h-40 bg-[#1A1C1E] text-white placeholder-gray-500 focus:outline-none resize-none"
              placeholder="Paste your content to generate tweets..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <button
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase flex items-center justify-center gap-3"
              onClick={handleRemix}
              disabled={!inputText || isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  GENERATING TWEETS...
                </>
              ) : (
                'GENERATE TWEETS'
              )}
            </button>
          </div>
          
          {outputText && (
            <div className="space-y-6 mt-48">
              <h2 className="text-2xl font-bold text-gray-300 px-1">Generated Tweets</h2>
              <div className="space-y-8">
                {renderTweets()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Tweets Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-[#1A1C1E] border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-300">Saved Tweets</h3>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            {savedTweets.map((tweet) => (
              <div key={tweet.id} className="bg-[#232527] p-4 rounded-lg border border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <button
                    onClick={() => handleTweetShare(tweet.content)}
                    className="text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteSavedTweet(tweet.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="text-gray-300">
                  {tweet.content.split('|').map((line, i) => (
                    <p key={i} className="mb-2">{line.trim()}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle Saved Tweets Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Toggle Saved Tweets"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>
    </div>
  )
}

export default App 