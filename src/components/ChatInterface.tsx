import { useEffect, useRef, useState } from 'react';
import { Send, MapPin, Loader2, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { ChatMessage, MapViewport, PlaceMarker } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isThinking: boolean;
  onSendMessage: (msg: string) => void;
  onClear: () => void;
}

export function ChatInterface({ messages, isThinking, onSendMessage, onClear }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-full md:w-96 lg:w-[400px] shrink-0 shadow-lg relative z-10">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <MapPin size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-slate-800 tracking-tight leading-none">Map Assistant</h1>
            <p className="text-xs text-slate-500 mt-1">Powered by Gemini & Search</p>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
        >
          Reset
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-10 text-slate-400">
            <MapPin size={48} className="text-slate-300 opacity-50" />
            <p className="text-sm max-w-[250px] leading-relaxed">
              Ask me to find places, navigate the map, or look up information about any location.
            </p>
          </div>
        )}
        
        {messages.map((msg) => {
           // Skip internal system-level tool call echoes if they don't contain standard text
           if (msg.role === 'model' && ((!msg.parts || msg.parts.length === 0) || (msg.parts[0].text === ''))) {
              if (msg.functionCalls && msg.functionCalls.length > 0) {
                 return (
                    <div key={msg.id} className="flex justify-start">
                       <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg flex items-center space-x-2 border border-blue-100">
                         <Info size={14} />
                         <span>Updating map view...</span>
                       </div>
                    </div>
                 );
              }
              return null;
           }

           const isUser = msg.role === 'user';
           return (
            <div key={msg.id} className={cn("flex flex-col space-y-1 w-full", isUser ? "items-end" : "items-start")}>
              <div 
                className={cn(
                  "px-4 py-3 max-w-[90%] rounded-2xl shadow-sm text-[15px] leading-relaxed",
                  isUser 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
                )}
              >
                <div className="markdown-body">
                  {msg.parts.map((p, i) => (
                      <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                        {p.text}
                      </ReactMarkdown>
                  ))}
                </div>
              </div>
              {msg.isSearching && (
                 <span className="text-[10px] text-slate-400 font-medium px-2 flex items-center space-x-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <span>Used Google Search</span>
                 </span>
              )}
            </div>
          )
        })}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-3 text-slate-500 text-[15px]">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form 
          onSubmit={handleSubmit}
          className="flex items-end space-x-2 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 ring-blue-500 ring-opacity-20 transition-all p-1"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Search nearby places..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-3 text-[15px] placeholder:text-slate-400 text-slate-800"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="p-3 mb-1 mr-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex shrink-0 shadow-sm"
          >
            <Send size={18} className={cn("transition-transform", input.trim() && !isThinking ? "translate-x-0.5 -translate-y-0.5" : "")} />
          </button>
        </form>
      </div>
    </div>
  );
}
