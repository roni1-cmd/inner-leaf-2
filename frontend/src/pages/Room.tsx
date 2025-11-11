import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, push, onValue, serverTimestamp, update, remove, set, onDisconnect } from "firebase/database";
import { database } from "@/lib/firebase";
import { UsernameDialog } from "@/components/UsernameDialog";
import { MessageBubble } from "@/components/MessageBubble";
import { RoomsSidebar } from "@/components/RoomsSidebar";
import { ChatInfoPanel } from "@/components/ChatInfoPanel";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import logo from "@/assets/app-logo.png";

export interface Message {
  id: string;
  text: string;
  username: string;
  timestamp: number;
  reactions?: { [emoji: string]: string[] };
  replyTo?: {
    id: string;
    text: string;
    username: string;
  };
  edited?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  pinned?: boolean;
}

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("chatUsername"));
  const [roomName, setRoomName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [presence, setPresence] = useState<Record<string, { username: string; typing?: boolean; lastSeen?: number }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [unreadCount, setUnreadCount] = useState<Record<string, number>>({});
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientIdRef = useRef<string | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  // Load username from localStorage on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("chatUsername");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Store current room in localStorage
  useEffect(() => {
    if (roomId && username) {
      localStorage.setItem("currentRoom", roomId);
    }
  }, [roomId, username]);

  useEffect(() => {
    if (!roomId) return;

    // Listen to room data including name
    const roomRef = ref(database, `rooms/${roomId}`);
    const roomUnsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.name) {
        setRoomName(data.name);
      }
    });

    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    const messagesUnsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([id, msg]: [string, any]) => ({
          id,
          text: msg.text,
          username: msg.username,
          timestamp: msg.timestamp,
          reactions: msg.reactions || {},
          replyTo: msg.replyTo,
          edited: msg.edited || false,
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          fileType: msg.fileType,
          pinned: msg.pinned || false,
        }));
        setMessages(messagesList.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    });

    return () => {
      roomUnsubscribe();
      messagesUnsubscribe();
    };
  }, [roomId]);

  // Presence tracking
  useEffect(() => {
    if (!roomId || !username) return;

    // Ensure a stable client id
    if (!clientIdRef.current) {
      const existing = localStorage.getItem("clientId");
      if (existing) {
        clientIdRef.current = existing;
      } else {
        const id = Math.random().toString(36).slice(2, 10);
        clientIdRef.current = id;
        localStorage.setItem("clientId", id);
      }
    }

    const clientId = clientIdRef.current!;
    const presenceRef = ref(database, `rooms/${roomId}/presence/${clientId}`);
    set(presenceRef, { username, typing: false, lastSeen: serverTimestamp() });
    onDisconnect(presenceRef).remove();

    const presenceRoomRef = ref(database, `rooms/${roomId}/presence`);
    const unsubPresence = onValue(presenceRoomRef, (snap) => {
      setPresence(snap.val() || {});
    });

    return () => {
      unsubPresence();
    };
  }, [roomId, username]);

  // Typing indicator updates
  useEffect(() => {
    if (!roomId || !username || !clientIdRef.current) return;
    const presenceRef = ref(database, `rooms/${roomId}/presence/${clientIdRef.current}`);

    const isTyping = newMessage.trim().length > 0;
    let timeout: number | undefined;

    update(presenceRef, { typing: isTyping, lastSeen: serverTimestamp() }).catch(() => {});

    if (isTyping) {
      timeout = window.setTimeout(() => {
        update(presenceRef, { typing: false, lastSeen: serverTimestamp() }).catch(() => {});
      }, 2000);
    }

    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [newMessage, roomId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Notifications for new messages
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
      const newMessages = messages.slice(lastMessageCountRef.current);
      newMessages.forEach((msg) => {
        if (msg.username !== username && msg.timestamp > lastReadTimestamp) {
          toast.info(`${msg.username}: ${msg.text.slice(0, 50)}${msg.text.length > 50 ? "..." : ""}`);
        }
      });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, username, lastReadTimestamp]);

  // Mark messages as read when viewing room
  useEffect(() => {
    if (roomId && messages.length > 0) {
      const latestTimestamp = messages[messages.length - 1]?.timestamp || Date.now();
      setLastReadTimestamp(latestTimestamp);
      localStorage.setItem(`lastRead_${roomId}`, latestTimestamp.toString());
    }
  }, [roomId, messages.length]);

  const handleUsernameSubmit = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("chatUsername", newUsername);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !username || !roomId) return;

    try {
      if (editingMessageId) {
        // Update existing message
        const messageRef = ref(database, `rooms/${roomId}/messages/${editingMessageId}`);
        await update(messageRef, {
          text: newMessage.trim(),
          edited: true,
        });
        setEditingMessageId(null);
      } else {
        // Send new message
        const messagesRef = ref(database, `rooms/${roomId}/messages`);
        const messageData: any = {
          text: newMessage.trim(),
          username,
          timestamp: serverTimestamp(),
        };
        
        if (replyingTo) {
          messageData.replyTo = {
            id: replyingTo.id,
            text: replyingTo.text,
            username: replyingTo.username,
          };
        }
        
        await push(messagesRef, messageData);
      }
      
      setNewMessage("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!username || !roomId) return;

    try {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const reactions = message.reactions || {};
      const userReactions = reactions[emoji] || [];

      const updatedUsers = userReactions.includes(username)
        ? userReactions.filter((u) => u !== username)
        : [...userReactions, username];

      const nextReactions = { ...reactions, [emoji]: updatedUsers };
      const messageRef = ref(database, `rooms/${roomId}/messages/${messageId}`);
      await update(messageRef, { reactions: nextReactions });
    } catch (error) {
      console.error("Error reacting to message:", error);
      toast.error("Failed to add reaction");
    }
  };

  const handleEdit = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message && message.username === username) {
      setNewMessage(message.text);
      setEditingMessageId(messageId);
      inputRef.current?.focus();
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!roomId) return;

    try {
      const messageRef = ref(database, `rooms/${roomId}/messages/${messageId}`);
      await remove(messageRef);
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem("currentRoom");
    navigate("/");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !username || !roomId) return;

    try {
      setUploadingFile(true);
      const { supabase } = await import("@/integrations/supabase/client");
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      await push(messagesRef, {
        text: file.type.startsWith('image/') ? '📷 Photo' : `📎 ${file.name}`,
        username,
        timestamp: serverTimestamp(),
        fileUrl: publicUrl,
        fileName: file.name,
        fileType: file.type,
      });

      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob) => {
    if (!username || !roomId) return;

    try {
      setUploadingFile(true);
      const { supabase } = await import("@/integrations/supabase/client");

      const fileName = `voice_${Date.now()}.webm`;
      const filePath = `${roomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      await push(messagesRef, {
        text: '🎤 Voice message',
        username,
        timestamp: serverTimestamp(),
        fileUrl: publicUrl,
        fileName: fileName,
        fileType: 'audio/webm',
      });

      toast.success("Voice message sent");
    } catch (error) {
      console.error("Error uploading voice message:", error);
      toast.error("Failed to send voice message");
    } finally {
      setUploadingFile(false);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!roomId) return;

    try {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const messageRef = ref(database, `rooms/${roomId}/messages/${messageId}`);
      await update(messageRef, { pinned: !message.pinned });
      toast.success(message.pinned ? "Message unpinned" : "Message pinned");
    } catch (error) {
      console.error("Error pinning message:", error);
      toast.error("Failed to pin message");
    }
  };

  if (!username) {
    return <UsernameDialog open={true} onSubmit={handleUsernameSubmit} />;
  }

  const participantsList = Object.values(presence || {});
  const typingUsers = (participantsList as any[])
    .filter((p: any) => p?.typing && p?.username !== username)
    .map((p: any) => p.username);

  const filteredMessages = searchQuery
    ? messages.filter((msg) =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const pinnedMessages = filteredMessages.filter((msg) => msg.pinned);
  const regularMessages = filteredMessages.filter((msg) => !msg.pinned);

  return (
    <div className="h-dvh bg-background flex w-full overflow-hidden">
      {/* Left Sidebar - Rooms (Desktop) */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <RoomsSidebar currentRoomId={roomId} />
      </div>

      {/* Left Sidebar - Mobile Sheet */}
      <Sheet open={isLeftSidebarOpen} onOpenChange={setIsLeftSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <RoomsSidebar currentRoomId={roomId} onClose={() => setIsLeftSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Chat Header */}
        <header className="bg-card border-b shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLeftSidebarOpen(true)}
                className="lg:hidden"
                aria-label="Open rooms"
              >
                <span className="material-icons">menu</span>
              </Button>
              <img
                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${roomId}`}
                alt={roomName}
                className="w-9 h-9 rounded-full"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm md:text-base font-semibold truncate">
                  {roomName || `Room ${roomId}`}
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  {Object.keys(presence).length} online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search messages"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <span className="material-icons">search</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Chat info"
                onClick={() => setIsRightPanelOpen(true)}
                className="lg:hidden"
              >
                <span className="material-icons">info</span>
              </Button>
              <Button
                onClick={handleLeaveRoom}
                variant="ghost"
                size="icon"
                className="text-destructive"
                aria-label="Leave room"
              >
                <span className="material-icons">exit_to_app</span>
              </Button>
            </div>
          </div>
          {isSearchOpen && (
            <div className="px-4 py-2 border-t">
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </header>

        {/* Messages */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          <ScrollArea className="flex-1 h-full">
            <div className="max-w-4xl mx-auto space-y-4 py-4 px-4">
              {pinnedMessages.length > 0 && (
                <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-icons text-sm text-primary">push_pin</span>
                    <span className="text-xs font-medium text-muted-foreground">
                      Pinned Messages
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pinnedMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.username === username}
                        currentUsername={username || ""}
                        onReact={handleReact}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onReply={handleReply}
                        onPin={handlePinMessage}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {regularMessages.length === 0 && pinnedMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground py-20">
                  <div className="text-center">
                    <span className="material-icons text-5xl mb-4 opacity-50">chat_bubble_outline</span>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                regularMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.username === username}
                    currentUsername={username || ""}
                    onReact={handleReact}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReply={handleReply}
                    onPin={handlePinMessage}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t bg-card px-4 py-3">
            <div className="max-w-4xl mx-auto">
              {replyingTo && (
                <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      Replying to {replyingTo.username}
                    </p>
                    <p className="text-sm truncate">{replyingTo.text}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setReplyingTo(null)}
                  >
                    <span className="material-icons text-sm">close</span>
                  </Button>
                </div>
              )}
              {editingMessageId && (
                <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Editing message
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setEditingMessageId(null);
                      setNewMessage("");
                    }}
                  >
                    <span className="material-icons text-sm">close</span>
                  </Button>
                </div>
              )}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground animate-fade-in">
                  {typingUsers.slice(0, 2).map((name) => (
                    <div className="flex items-center gap-1" key={name}>
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                        alt={name}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="font-medium">{name}</span>
                    </div>
                  ))}
                  {typingUsers.length > 2 && <span>+{typingUsers.length - 2}</span>}
                  <span>is typing…</span>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 self-end"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                >
                  <span className="material-icons">
                    {uploadingFile ? "hourglass_empty" : "attach_file"}
                  </span>
                </Button>
                <VoiceRecorder
                  onRecordingComplete={handleVoiceRecording}
                  disabled={uploadingFile}
                />
                <Textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 min-h-[48px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button type="submit" size="icon" className="h-12 w-12 self-end">
                  <span className="material-icons">
                    {editingMessageId ? "check" : "send"}
                  </span>
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Right Panel - Chat Info (Desktop) */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <ChatInfoPanel
          roomId={roomId || ""}
          roomName={roomName}
          presence={presence}
        />
      </div>

      {/* Right Panel - Mobile Sheet */}
      <Sheet open={isRightPanelOpen} onOpenChange={setIsRightPanelOpen}>
        <SheetContent side="right" className="w-80 p-0">
          <ChatInfoPanel
            roomId={roomId || ""}
            roomName={roomName}
            presence={presence}
            onClose={() => setIsRightPanelOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
