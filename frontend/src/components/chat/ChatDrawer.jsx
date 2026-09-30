import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { chatApi } from '../../api/chatApi';
import { ChatMessage } from './ChatMessage';
import { 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  RotateCcw, 
  Lightbulb, 
  Loader2,
  ChevronRight
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "Create a High priority task called 'Setup Redis Caching' due next Monday",
  "What issues are being discussed in Project Alpha?",
  "Update task 'Database Connection Pooling Optimization' to Done",
  "Show project metrics report",
];

export const ChatDrawer = () => {
  const { isChatOpen, setIsChatOpen, activeProject, handleTaskMutated } = useProject();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load chat history when drawer opens or active project changes
  useEffect(() => {
    if (isChatOpen) {
      loadHistory();
    }
  }, [isChatOpen, activeProject?.id]);

  const loadHistory = async () => {
    try {
      const data = await chatApi.getHistory(activeProject?.id);
      const list = Array.isArray(data) ? data : data.results || [];
      if (list.length > 0) {
        setMessages(list);
      } else {
        // Welcome message
        setMessages([
          {
            id: 'welcome',
            sender: 'assistant',
            content: `Hello! I am your **PMS AI Assistant** with semantic RAG retrieval and tool execution.\n\nYou can ask questions about **${activeProject?.name || 'your project'}**, retrieve blockers from discussions, or instruct me to create and update tasks directly!`,
            created_at: new Date().toISOString(),
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setInputMessage('');

    // Append user message optimistically
    const tempUserMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(query, activeProject?.id);

      const asstMsg = {
        id: response.message_id || `asst-${Date.now()}`,
        sender: 'assistant',
        content: response.reply,
        structured_action_json: response.action_performed ? {
          action_type: response.action_type,
          updated_task: response.updated_task,
        } : null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, asstMsg]);

      // Synchronize UI Kanban state if an action was executed
      if (response.action_performed && response.updated_task) {
        handleTaskMutated(response.updated_task, response.action_type);
      }
    } catch (err) {
      console.error('Chat error', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          content: 'Sorry, I encountered an issue processing your request. Please ensure the backend is active and try again.',
          created_at: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[450px] bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col transition-all duration-300 animate-slide-in">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white font-['Outfit']">PMS Assistant</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                RAG Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Grounded on project context & tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={loadHistory}
            title="Reload history"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="close-chat-drawer-btn"
            onClick={() => setIsChatOpen(false)}
            title="Close Assistant"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Suggested Prompts Carousel / Chips */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto flex items-center gap-2 scrollbar-none">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Try:</span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="shrink-0 text-[11px] bg-slate-800/80 hover:bg-indigo-900/40 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-200 px-2.5 py-1 rounded-full border border-slate-700/60 transition-all text-left whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 w-fit animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span>Retrieving context & reasoning...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="chat-input-field"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question or type 'Create a task...'..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            disabled={isLoading}
          />
          <button
            id="send-chat-message-btn"
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
