import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const ChatModal = ({ isOpen, onClose, domain = 'general' }) => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { userLocation } = useApp();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const API_BASE = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  const PREFIX = import.meta.env.VITE_APP_PREFIX || 'APP';

  useEffect(() => {
    if (isOpen) {
      const savedId = localStorage.getItem(`${PREFIX}_conversation_id`);
      if (savedId) {
        setConversationId(savedId);
        loadConversation(savedId);
      } else {
        setConversationId(null);
        setMessages([]);
      }
    }
  }, [isOpen]);

  const loadConversation = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/conversations/${id}`);
      const data = await response.json();
      if (data.id) {
        setConversationId(data.id);
        setMessages((data.messages || []).map(msg => ({
          ...msg,
          content: msg.role === 'assistant' ? marked(msg.content) : msg.content,
          message_id: msg.id,
          feedback: msg.feedback
        })));
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      localStorage.removeItem(`${PREFIX}_conversation_id`);
      setConversationId(null);
      setMessages([]);
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
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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
        localStorage.setItem(`${PREFIX}_conversation_id`, currentConvId);
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
          if (supportingDocsBuffer.trim()) {
            try {
              supportingDocs = JSON.parse(supportingDocsBuffer);
            } catch (e) {
              console.error('Failed to parse supporting docs:', e, 'Buffer:', supportingDocsBuffer.substring(0, 100));
              supportingDocs = [];
            }
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl sm:rounded-2xl w-full max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] flex flex-col shadow-2xl"
          >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-accent-blue/5 to-accent-purple/5">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-text-primary truncate">
                AI Infinity Assistant
              </h2>
              {domain && domain !== 'general' && (
                <span className="text-xs sm:text-sm text-accent-blue font-medium truncate">
                  {domain.charAt(0).toUpperCase() + domain.slice(1)} Domain
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => {
                localStorage.removeItem(`${PREFIX}_conversation_id`);
                setConversationId(null);
                setMessages([]);
              }}
              className="text-accent-blue hover:text-accent-purple transition-colors flex items-center gap-1 text-xs sm:text-sm font-medium px-2 py-1 rounded-lg hover:bg-accent-blue/10"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-accent-blue transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-white to-gray-50 modal-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2">Start a Conversation</h3>
              <p className="text-sm sm:text-base text-gray-500">Ask me anything{domain && domain !== 'general' ? ` about ${domain} domain` : ''}...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-md' 
                    : 'space-y-2'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 text-text-primary rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 shadow-sm">
                        <div className="text-xs sm:text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: msg.content }} />
                      </div>
                      {msg.supportingDocs && msg.supportingDocs.length > 0 && (
                        <div className="bg-gradient-to-br from-accent-blue/5 to-accent-purple/5 rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-accent-blue/30 shadow-sm">
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="text-xs font-bold text-accent-blue">Supporting Documents</div>
                          </div>
                          <div className="space-y-2 sm:space-y-3">
                            {msg.supportingDocs.map((doc, docIdx) => (
                              <div key={docIdx} className="bg-white rounded-lg p-2 sm:p-3 border border-accent-blue/20 hover:border-accent-blue/50 transition-colors">
                                <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                                  <div className="font-semibold text-xs sm:text-sm text-gray-800 flex-1">
                                    {doc.metadata?.title || 'Untitled Document'}
                                  </div>
                                  {doc.score && (
                                    <div className="flex items-center gap-1 bg-accent-blue/10 px-2 py-1 rounded-full flex-shrink-0">
                                      <svg className="w-3 h-3 text-accent-blue" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      <span className="text-xs font-medium text-accent-blue">{doc.score.toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                                  {doc.content?.substring(0, 200)}{doc.content?.length > 200 ? '...' : ''}
                                </div>
                                {doc.metadata?.domain && (
                                  <div className="mt-2 inline-block">
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                      {doc.metadata.domain}
                                    </span>
                                  </div>
                                )}
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
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-gray-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={domain && domain !== 'general' ? `Ask about ${domain.charAt(0).toUpperCase() + domain.slice(1)}...` : 'Type your message...'}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition-all text-sm sm:text-base resize-none overflow-y-auto min-h-[44px] modal-scrollbar"
                disabled={loading}
                rows={1}
                style={{ 
                  height: 'auto',
                  maxHeight: window.innerHeight < 700 ? '80px' : window.innerHeight < 900 ? '120px' : '200px'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  const maxHeight = window.innerHeight < 700 ? 80 : window.innerHeight < 900 ? 120 : 200;
                  e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + 'px';
                }}
              />
              {domain && domain !== 'general' && (
                <div className="absolute right-3 top-3 hidden sm:block">
                  <span className="text-xs bg-gradient-to-r from-accent-blue to-accent-purple text-white px-2 py-1 rounded-full font-medium">
                    {domain.charAt(0).toUpperCase() + domain.slice(1)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
              className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatModal;
