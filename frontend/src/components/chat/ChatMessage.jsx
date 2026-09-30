import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ActionCard } from './ActionCard';
import { Bot, User, Sparkles } from 'lucide-react';

export const ChatMessage = ({ message }) => {
  const isAssistant = message.sender === 'assistant';
  const actionData = message.structured_action_json;

  return (
    <div className={`flex gap-3 mb-4 animate-fade-in ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {/* Avatar Icon */}
      <div 
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
          isAssistant
            ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
            : 'bg-slate-700 text-slate-200'
        }`}
      >
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        <div 
          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
            isAssistant
              ? 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm'
              : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
          }`}
        >
          {isAssistant ? (
            <div className="prose prose-invert prose-xs max-w-none space-y-2">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Render Action Card if structured action is present */}
          {isAssistant && actionData && actionData.updated_task && (
            <ActionCard
              actionType={actionData.action_type}
              task={actionData.updated_task}
            />
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-[10px] text-slate-500 mt-1 px-1 ${isAssistant ? 'text-left' : 'text-right'}`}>
          {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
        </div>
      </div>
    </div>
  );
};
