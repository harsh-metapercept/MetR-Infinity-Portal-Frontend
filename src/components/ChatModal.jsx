import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { getUserLocation } from '../utils/geoLocation';

const ChatModal = ({ isOpen, onClose, domain = 'general' }) => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({});
  const messagesEndRef = useRef(null);
  const API_BASE = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    getUserLocation().then(setUserLocation);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const savedId = localStorage.getItem(`conversation_${domain}`);
      if (savedId) {
        loadConversation(savedId);
      }
    }
  }, [isOpen, domain]);

  const loadConversation = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/conversations/${id}`);
      const data = await response.json();
      setConversationId(data.id);
      setMessages((data.messages || []).map(msg => ({
        ...msg,
        content: msg.role === 'assistant' ? marked(msg.content) : msg.content,
        message_id: msg.id,
        feedback: msg.feedback
      })));
    } catch (error) {
      console.error('Error loading conversation:', error);
      localStorage.removeItem(`conversation_${domain}`);
    }
  };

  const submitFeedback = async (messageId, feedback) => {
    try {
      await fetch(`${API_BASE}/api/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, feedback })
      });
      setMessages(prev => prev.map(msg => 
        msg.message_id === messageId ? { ...msg, feedback } : msg
      ));
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const messageText = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      let currentConvId = conversationId;
      
      if (!currentConvId) {
        const response = await fetch(`${API_BASE}/api/v1/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain })
        });
        const data = await response.json();
        currentConvId = data.id;
        setConversationId(currentConvId);
        localStorage.setItem(`conversation_${domain}`, currentConvId);
      }

      const userMessage = { role: 'user', content: messageText, created_at: new Date() };
      setMessages(prev => [...prev, userMessage]);

      const response = await fetch(`${API_BASE}/api/v1/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: messageText,
          domain,
          conversation_id: currentConvId,
          ...(userLocation.latitude && { latitude: userLocation.latitude }),
          ...(userLocation.longitude && { longitude: userLocation.longitude }),
          ...(userLocation.country && { country: userLocation.country })
        })
      });

      const messageId = response.headers.get('X-Message-ID');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let fullMarkdown = '';
      let supportingDocs = [];
      let inSupportingDocs = false;
      let supportingDocsBuffer = '';

      const botMessage = { 
        role: 'assistant', 
        content: '', 
        created_at: new Date(),
        message_id: messageId ? parseInt(messageId) : null,
        supportingDocs: []
      };
      setMessages(prev => [...prev, botMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        if (chunk.includes('---SUPPORTING_DOCS_START---')) {
          inSupportingDocs = true;
          continue;
        }
        if (chunk.includes('---SUPPORTING_DOCS_END---')) {
          try {
            supportingDocs = JSON.parse(supportingDocsBuffer);
          } catch (e) {
            console.error('Failed to parse supporting docs:', e);
          }
          break;
        }

        if (inSupportingDocs) {
          supportingDocsBuffer += chunk;
        } else if (chunk.trim()) {
          fullMarkdown += chunk;
          const htmlContent = marked(fullMarkdown);
          setMessages(prev => prev.map((msg, idx) => 
            idx === prev.length - 1 ? { ...msg, content: htmlContent } : msg
          ));
        }
      }

      if (supportingDocs.length > 0) {
        setMessages(prev => prev.map((msg, idx) => 
          idx === prev.length - 1 ? { ...msg, supportingDocs } : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error processing your request', 
        created_at: new Date(),
        message_id: null
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#3d3e3f]">
              {domain !== 'general' ? `${domain.charAt(0).toUpperCase() + domain.slice(1)} Assistant` : 'AI Assistant'}
            </h2>
            <button
              onClick={() => {
                localStorage.removeItem(`conversation_${domain}`);
                setConversationId(null);
                setMessages([]);
              }}
              className="text-[#266EF6] hover:text-[#1e5ad4] transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-[#266EF6] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#266EF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#3d3e3f] mb-2">Start a Conversation</h3>
              <p className="text-gray-500">Ask me anything about {domain !== 'general' ? domain : 'the documentation'}...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${
                  msg.role === 'user' 
                    ? 'bg-[#266EF6] text-white rounded-2xl px-4 py-3' 
                    : 'space-y-2'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <>
                      <div className="bg-gray-100 text-[#3d3e3f] rounded-2xl px-4 py-3">
                        <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: msg.content }} />
                      </div>
                      {msg.supportingDocs && msg.supportingDocs.length > 0 && (
                        <div className="bg-white rounded-xl px-4 py-3 border border-gray-200">
                          <div className="text-xs font-semibold text-gray-700 mb-2">Supporting Documents</div>
                          <div className="space-y-2">
                            {msg.supportingDocs.map((doc, docIdx) => (
                              <div key={docIdx} className="text-xs text-gray-600 border-l-2 border-gray-300 pl-2">
                                <div className="font-medium">{doc.metadata?.title || 'Untitled'}</div>
                                <div className="text-gray-500 line-clamp-2">{doc.content?.substring(0, 150)}...</div>
                                {doc.score && <div className="text-gray-400 mt-1">Score: {doc.score.toFixed(2)}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.message_id && (
                        <div className="flex gap-2 px-2">
                          <button
                            onClick={() => submitFeedback(msg.message_id, true)}
                            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                              msg.feedback === true ? 'text-green-600' : 'text-gray-400'
                            }`}
                            title="Like"
                          >
                            <svg className="w-4 h-4" fill={msg.feedback === true ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                          </button>
                          <button
                            onClick={() => submitFeedback(msg.message_id, false)}
                            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                              msg.feedback === false ? 'text-red-600' : 'text-gray-400'
                            }`}
                            title="Dislike"
                          >
                            <svg className="w-4 h-4" fill={msg.feedback === false ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#266EF6] focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
              className="bg-[#266EF6] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1e5ad4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
