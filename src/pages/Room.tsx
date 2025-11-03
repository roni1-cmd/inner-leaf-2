import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, push, onValue, serverTimestamp } from "firebase/database";
import { database, auth } from "@/lib/firebase";
import { UsernameDialog } from "@/components/UsernameDialog";
import { LiveDateTime } from "@/components/LiveDateTime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  username: string;
  timestamp: number;
}

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUsernameSubmit = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("chatUsername", newUsername);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !username || !roomId) return;

    try {
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      await push(messagesRef, {
        text: newMessage.trim(),
        username,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleLeaveRoom = () => {
    navigate("/");
  };

  if (!username) {
    return <UsernameDialog open={true} onSubmit={handleUsernameSubmit} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="material-icons text-primary">spa</span>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-lg font-semibold truncate">
                {roomName || `Room ${roomId}`}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {roomId} • {username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LiveDateTime />
            <Button
              onClick={handleLeaveRoom}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <span className="material-icons text-sm">exit_to_app</span>
              <span className="hidden sm:inline">Leave</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 container mx-auto px-4 py-6 overflow-hidden flex flex-col max-w-4xl">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <Card
                key={message.id}
                className={`p-3 max-w-[80%] ${
                  message.username === username
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto"
                }`}
              >
                <p className="text-xs font-medium mb-1 opacity-90">
                  {message.username}
                </p>
                <p className="break-words">{message.text}</p>
              </Card>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-12"
          />
          <Button type="submit" size="icon" className="h-12 w-12">
            <span className="material-icons">send</span>
          </Button>
        </form>
      </main>
    </div>
  );
}
