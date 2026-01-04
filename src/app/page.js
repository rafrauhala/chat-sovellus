'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [userEmail, setUserEmail] = useState('testi@kayttaja.fi') // Väliaikainen tunnus

  // 1. Hae viestit ja kuuntele reaaliaikaisia päivityksiä
  useEffect(() => {
    // Haetaan olemassa olevat viestit
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }

    fetchMessages()

    // Tilaa reaaliaikaiset päivitykset
    const channel = supabase
      .channel('chat-huone')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
      (payload) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 2. Viestin lähetys
  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { error } = await supabase
      .from('messages')
      .insert([{ content: newMessage, user_email: userEmail }])

    if (error) {
      console.error('Virhe lähetyksessä:', error.message)
    } else {
      setNewMessage('')
    }
  }

// ... (pidä aiempi koodi ennallaan sendMessage-funktioon asti)

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4 items-center justify-center">
      {/* Sovelluksen nimi boksin yläpuolella */}
      <h1 className="text-3xl font-bold mb-6 text-red-600">Tervetuloa viestittelemään!</h1>

      {/* Pienennetty chat-boksi (max-w-md ja h-[500px]) */}
      <div className="flex flex-col w-full max-w-md h-[500px] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Viestialue */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`p-3 rounded-2xl max-w-[80%] shadow-sm ${
                m.user_email === userEmail 
                  ? 'bg-blue-500 text-white ml-auto rounded-tr-none' 
                  : 'bg-white text-gray-800 mr-auto rounded-tl-none border border-gray-100'
              }`}
            >
              <p className="text-[10px] uppercase font-bold opacity-70 mb-1">{m.user_email.split('@')[0]}</p>
              <p className="text-sm leading-relaxed">{m.content}</p>
            </div>
          ))}
        </div>

        {/* Viestin lähetyslomake boksin alareunassa */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Kirjoita viesti..."
            className="flex-1 p-2 bg-gray-100 rounded-full px-4 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button 
            type="submit" 
            className="bg-blue-500 text-white p-2 px-5 rounded-full hover:bg-blue-600 transition-colors font-semibold text-sm"
          >
            Lähetä
          </button>
        </form>
      </div>
    </div>
  )
}