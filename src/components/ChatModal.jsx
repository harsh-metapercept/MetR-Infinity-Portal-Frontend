import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

// Configure marked for better rendering
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
});

const ChatModal = ({ isOpen, onClose, domain = 'general' }) => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState({});
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
          content: msg.role === 'assistant' ? marked.parse(msg.content) : msg.content,
          message_id: msg.id,
          feedback: msg.feedback,
          supportingDocs: msg.supporting_docs || []
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
          const parts = chunk.split('---SUPPORTING_DOCS_START---');
          if (parts[0].trim()) {
            fullMarkdown += parts[0];
            const htmlContent = marked.parse(fullMarkdown);
            setMessages(prev => prev.map((msg, idx) => 
              idx === prev.length - 1 ? { ...msg, content: htmlContent } : msg
            ));
          }
          if (parts[1]) supportingDocsBuffer += parts[1];
          continue;
        }
        
        if (chunk.includes('---SUPPORTING_DOCS_END---')) {
          const parts = chunk.split('---SUPPORTING_DOCS_END---');
          if (parts[0]) supportingDocsBuffer += parts[0];
          
          if (supportingDocsBuffer.trim()) {
            try {
              supportingDocs = JSON.parse(supportingDocsBuffer);
              console.log('Parsed supporting docs:', supportingDocs.length, 'documents');
            } catch (e) {
              console.error('Failed to parse supporting docs:', e);
              console.error('Buffer content:', supportingDocsBuffer);
              supportingDocs = [];
            }
          }
          inSupportingDocs = false;
          continue;
        }

        if (inSupportingDocs) {
          supportingDocsBuffer += chunk;
        } else if (chunk.trim()) {
          fullMarkdown += chunk;
          const htmlContent = marked.parse(fullMarkdown);
          setMessages(prev => prev.map((msg, idx) => 
            idx === prev.length - 1 ? { ...msg, content: htmlContent } : msg
          ));
        }
      }

      console.log('Final supporting docs count:', supportingDocs.length);
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
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: msg.content }} />
                      </div>
                      {msg.supportingDocs && msg.supportingDocs.length > 0 && (
                        <div className="bg-gradient-to-br from-accent-blue/5 to-accent-purple/5 rounded-xl border border-accent-blue/30 shadow-sm mt-3 overflow-hidden">
                          <button
                            onClick={() => setExpandedDocs(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            className="w-full flex items-center justify-between p-3 hover:bg-accent-blue/5 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm font-bold text-accent-blue">Supporting Documents ({msg.supportingDocs.length})</span>
                            </div>
                            <svg 
                              className={`w-5 h-5 text-accent-blue transition-transform ${expandedDocs[idx] ? 'rotate-180' : ''}`}
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {expandedDocs[idx] && (
                            <div className="px-3 pb-3 space-y-2">
                              {msg.supportingDocs.map((doc, docIdx) => {
                                const displayContent = doc.content_type === 'abstract' && doc.metadata?.abstract 
                                  ? doc.metadata.abstract 
                                  : doc.content;
                                const relevanceScore = doc.score !== undefined ? (doc.score * 100).toFixed(0) : null;
                                
                                return (
                                  <div key={docIdx} className="bg-white rounded-lg p-3 border border-accent-blue/20 hover:border-accent-blue/40 transition-all">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="font-semibold text-sm text-gray-800 flex-1">
                                        {doc.metadata?.title || 'Untitled Document'}
                                      </div>
                                      {relevanceScore && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                                          {relevanceScore}% match
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                                      {displayContent?.substring(0, 200)}{displayContent?.length > 200 ? '...' : ''}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-wrap gap-2">
                                        {doc.metadata?.domain && (
                                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                                            {doc.metadata.domain}
                                          </span>
                                        )}
                                      </div>
                                      {doc.metadata?.s3_key && (
                                        <button className="text-xs text-accent-blue hover:text-accent-purple font-medium flex items-center gap-1">
                                          <span>View</span>
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
