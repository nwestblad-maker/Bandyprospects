"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VerifiedClubBadge } from "@/components/VerifiedClubBadge";
import { supabase } from "@/lib/supabaseClient";

interface ConversationPartner {
  id: string;
  name: string;
  role: string;
  club?: string;
  avatar?: string;
  isVerified?: boolean;
}

interface ConversationItem {
  id: string;
  createdAt: string;
  lastMessageAt: string;
  subject: string;
  partner: ConversationPartner;
  lastMessage: {
    text: string;
    time: string;
    isMine: boolean;
  };
  unreadCount: number;
}

interface MessageItem {
  id: string;
  created_at: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: "player" | "club";
  body: string;
  read: boolean;
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialThreadId = searchParams.get("id");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialThreadId);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
        setCurrentUserEmail(data.user.email || null);
      } else {
        router.push("/login");
      }
      setAuthLoading(false);
    });
  }, [router]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId]);

  // Fetch messages when selectedConversationId changes
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    let isCurrent = true;

    async function loadMessages() {
      setLoadingMessages(true);
      setSendError("");
      try {
        const res = await fetch(`/api/conversations/${selectedConversationId}/messages`);
        if (res.ok && isCurrent) {
          const data = await res.json();
          setMessages(data.messages || []);

          // Reset unread count locally for this conversation
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c
            )
          );
        }
      } catch (err) {
        console.error("Failed to fetch messages for thread:", err);
      } finally {
        if (isCurrent) setLoadingMessages(false);
      }
    }

    loadMessages();

    // Poll new messages every 8 seconds
    const interval = setInterval(() => {
      fetch(`/api/conversations/${selectedConversationId}/messages`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && isCurrent) {
            setMessages(data.messages || []);
          }
        })
        .catch(() => {});
    }, 8000);

    return () => {
      isCurrent = false;
      clearInterval(interval);
    };
  }, [selectedConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationId || !replyText.trim() || sending) return;

    setSending(true);
    setSendError("");

    const textToSend = replyText.trim();
    try {
      const res = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: textToSend }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send message.");
      }

      setReplyText("");
      // Append new message immediately
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }

      // Update conversation's last message locally
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? {
                ...c,
                lastMessageAt: new Date().toISOString(),
                lastMessage: {
                  text: textToSend,
                  time: new Date().toISOString(),
                  isMine: true,
                },
              }
            : c
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending message";
      setSendError(msg);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      c.partner.name.toLowerCase().includes(q) ||
      (c.partner.club && c.partner.club.toLowerCase().includes(q)) ||
      c.subject.toLowerCase().includes(q) ||
      c.lastMessage.text.toLowerCase().includes(q)
    );
  });

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-xs text-zinc-500">
            <div className="w-7 h-7 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>Loading messages...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-2.5">
              <span>Messages</span>
              {conversations.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700">
                  {conversations.length}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Direct and private messaging between players and verified clubs.
            </p>
          </div>

          <button
            onClick={fetchConversations}
            className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
            title="Refresh conversations"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Messaging Container */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[620px] max-h-[780px]">
          {/* LEFT COLUMN: Conversation Threads List */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-zinc-200 flex flex-col bg-zinc-50/50 ${selectedConversationId ? "hidden md:flex" : "flex"}`}>
            {/* Search Box */}
            <div className="p-3.5 border-b border-zinc-200 bg-white">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search conversations..."
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 focus:bg-white"
              />
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
              {loadingConversations ? (
                <div className="p-10 text-center text-xs text-zinc-400">
                  <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading conversations...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3 text-xl">
                    ✉️
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">No messages yet</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto mb-4">
                    No messages yet. Messages from players or clubs will appear here.
                  </p>
                  <Link
                    href="/players"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Browse Players →</span>
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === selectedConversationId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-white border-l-4 border-zinc-900 shadow-2xs"
                          : "hover:bg-zinc-100/70"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200">
                        {conv.partner.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={conv.partner.avatar}
                            alt={conv.partner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(conv.partner.name || "U")[0].toUpperCase()}</span>
                        )}
                      </div>

                      {/* Info & Last snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-zinc-950 truncate">
                            {conv.partner.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                            {formatTimestamp(conv.lastMessageAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1 truncate">
                          <span>{conv.partner.role}</span>
                          {conv.partner.club && (
                            <>
                              <span>•</span>
                              <span className="truncate">{conv.partner.club}</span>
                            </>
                          )}
                          {conv.partner.isVerified && (
                            <VerifiedClubBadge size="xs" showText={false} />
                          )}
                        </div>

                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? "font-bold text-zinc-950" : "text-zinc-500"}`}>
                          {conv.lastMessage.isMine ? "You: " : ""}
                          {conv.lastMessage.text || conv.subject}
                        </p>
                      </div>

                      {/* Unread count badge */}
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-zinc-900 text-white shrink-0 self-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Message Thread */}
          <div className={`flex-1 flex flex-col bg-white ${!selectedConversationId ? "hidden md:flex" : "flex"}`}>
            {selectedConversation ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Back button on mobile */}
                    <button
                      onClick={() => setSelectedConversationId(null)}
                      className="md:hidden p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950"
                      aria-label="Back to conversations list"
                    >
                      ←
                    </button>

                    <div className="w-9 h-9 rounded-full bg-zinc-900 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200">
                      {selectedConversation.partner.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedConversation.partner.avatar}
                          alt={selectedConversation.partner.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{(selectedConversation.partner.name || "U")[0].toUpperCase()}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-950 truncate">
                          {selectedConversation.partner.name}
                        </span>
                        {selectedConversation.partner.isVerified && (
                          <VerifiedClubBadge size="xs" />
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate flex items-center gap-1.5">
                        <span>{selectedConversation.partner.role}</span>
                        {selectedConversation.partner.club && (
                          <>
                            <span>•</span>
                            <span>{selectedConversation.partner.club}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Link (if partner is player) */}
                  {selectedConversation.partner.id && (
                    <Link
                      href={`/players/${selectedConversation.partner.id}`}
                      className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg border border-zinc-200 transition-colors"
                    >
                      <span>View Profile →</span>
                    </Link>
                  )}
                </div>

                {/* Messages Bubbles Stream */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-zinc-50/40">
                  {loadingMessages ? (
                    <div className="p-8 text-center text-xs text-zinc-400">
                      <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Loading thread...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500">
                      No messages yet in this conversation. Write the first message below!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[10px] font-semibold text-zinc-500">
                              {isMine ? "You" : msg.sender_name}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {formatTimestamp(msg.created_at)}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-2xs ${
                              isMine
                                ? "bg-zinc-900 text-white rounded-tr-xs"
                                : "bg-white text-zinc-900 border border-zinc-200 rounded-tl-xs"
                            }`}
                          >
                            {msg.body}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Reply Input Form */}
                <div className="p-3 sm:p-4 border-t border-zinc-200 bg-white">
                  {sendError && (
                    <div className="p-2 mb-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                      {sendError}
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <textarea
                      required
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type your message... (Press Enter to send)"
                      className="flex-1 p-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-900 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {sending ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* Empty state when no conversation is selected */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-400 flex items-center justify-center text-2xl mb-4 shadow-2xs">
                  💬
                </div>
                <h3 className="text-base font-bold text-zinc-950 mb-1">
                  Select a conversation to view messages
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
                  Choose a thread from the list on the left to view the message history, or initiate a contact inquiry from a player profile.
                </p>
                <Link
                  href="/players"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <span>Explore Players →</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
