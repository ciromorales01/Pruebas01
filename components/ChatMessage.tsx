
import React from 'react';
import { Message } from '../types';

interface Props {
  message: Message;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          isUser ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser 
            ? 'bg-slate-900 text-white rounded-tr-none shadow-lg shadow-slate-200' 
            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
        }`}>
          <div className="prose prose-sm max-w-none">
            {message.text.split('\n').map((line, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
            ))}
          </div>
          <span className={`text-[10px] mt-2 block opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
