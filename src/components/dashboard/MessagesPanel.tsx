import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { MessageSquare, Send } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useTravelMate } from '../../context/TravelMateContext';
import type { ChatMessage } from '../../types/travelmate';

export function MessagesPanel() {
  const { conversations, firebaseUser, sendMessage } = useTravelMate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    if (!selectedId || !firebaseUser) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'conversations', selectedId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ ...(d.data() as ChatMessage), id: d.id })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `conversations/${selectedId}/messages`)
    );
    return () => unsub();
  }, [selectedId, firebaseUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    await sendMessage(selectedId, text);
  };

  const activeConv = conversations.find((c) => c.id === selectedId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#0F172A]">
          Direct &amp; Provider Messaging
        </h2>
        <p className="text-sm text-[#0F172A]/70 mt-1">
          Coordinate securely with guides, hotel hosts, vehicle providers, and travel buddies.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-[#0B57D0] mx-auto" />
          <div className="font-display font-bold text-[#0F172A]">No conversations yet</div>
          <p className="text-xs text-[#0F172A]/65">
            Click &ldquo;Message&rdquo; on any tour guide, hotel, or travel buddy listing to start a thread.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
          {/* Thread list */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 divide-y divide-slate-200">
            {conversations.map((conv) => {
              const active = conv.id === selectedId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    active ? 'bg-[#EEF4FF]/55' : 'hover:bg-[#F4F7FC]'
                  }`}
                >
                  <div className="text-sm font-bold text-[#0F172A] truncate">{conv.title}</div>
                  <div className="text-xs text-[#0F172A]/65 truncate mt-1">
                    {conv.lastMessage || 'No messages yet'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Conversation */}
          <div className="md:col-span-8 flex flex-col justify-between">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-[#F4F7FC]">
              <div className="font-display font-bold text-sm text-[#0F172A]">
                {activeConv?.title || 'Select a thread'}
              </div>
            </div>

            <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[360px]">
              {messages.map((msg) => {
                const mine = msg.senderId === firebaseUser?.uid;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[11px] text-[#0F172A]/55 mb-0.5">{msg.senderName}</div>
                    <div
                      className={`max-w-[80%] px-3.5 py-2 rounded-xl text-sm ${
                        mine
                          ? 'bg-[#0D5EFF] text-white'
                          : 'bg-[#F4F7FC] border border-slate-200 text-[#0F172A]'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleSend}
              className="p-3.5 border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0D5EFF]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D5EFF] text-white text-sm font-medium rounded-lg hover:bg-[#0948CC] cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
