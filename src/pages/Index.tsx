import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, set, serverTimestamp } from "firebase/database";
import { database, signInAnonymouslyUser } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RoomCard } from "@/components/RoomCard";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { LiveDateTime } from "@/components/LiveDateTime";
import { toast } from "sonner";

export default function Index() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [rooms, setRooms] = useState<{ [key: string]: any }>({});
  const [activeTab, setActiveTab] = useState("rooms");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    // Check if user was in a room and redirect back
    const currentRoom = localStorage.getItem("currentRoom");
    const storedUsername = localStorage.getItem("chatUsername");
    
    if (currentRoom && storedUsername) {
      navigate(`/room/${currentRoom}`);
      return;
    }

    // Sign in anonymously
    signInAnonymouslyUser().catch((error) => {
      console.error("Auth error:", error);
      toast.error("Authentication failed");
    });

    // Listen to all rooms
    const roomsRef = ref(database, "rooms");
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      setRooms(data || {});
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  const handleCreateRoom = async (roomName: string) => {
    const newRoomId = "IL" + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Create room with name in Firebase
    const roomRef = ref(database, `rooms/${newRoomId}`);
    await set(roomRef, {
      name: roomName,
      createdAt: serverTimestamp(),
    });
    
    setCreateDialogOpen(false);
    navigate(`/room/${newRoomId}`);
  };

  const getRoomParticipantCount = (roomData: any) => {
    if (!roomData?.messages) return 0;
    const usernames = new Set(
      Object.values(roomData.messages).map((msg: any) => msg.username)
    );
    return usernames.size;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <CreateRoomDialog 
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateRoom}
      />

      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex lg:w-64 bg-card border-r flex-col p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <span className="material-icons text-primary text-3xl">spa</span>
          <span className="text-xl font-medium">Inner Leaf</span>
        </div>
        
        <nav className="space-y-2 flex-1 overflow-y-auto">
          <div className="text-xs font-medium text-muted-foreground px-4 py-2 uppercase">
            Your Rooms
          </div>
          
          {Object.entries(rooms).length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground text-center">
              No rooms yet. Create one to get started!
            </div>
          ) : (
            Object.entries(rooms).map(([roomId, roomData]) => (
              <button
                key={roomId}
                onClick={() => navigate(`/room/${roomId}`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <span className="material-icons text-primary">chat</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {roomData.name || `Room ${roomId}`}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {roomId}
                  </div>
                </div>
              </button>
            ))
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-icons text-primary text-2xl lg:hidden">spa</span>
            <span className="text-lg font-medium lg:hidden">Inner Leaf</span>
            <span className="hidden lg:block text-base font-medium">Inner Leaf Chat</span>
          </div>
          <LiveDateTime />
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-3xl">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-normal text-foreground mb-4">
                Instant chats and rooms for everyone
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Connect, collaborate, and chat from anywhere
              </p>
            </div>

            {/* Action Section */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-8">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="h-12 px-6 gap-2 font-medium"
              >
                <span className="material-icons text-xl">add</span>
                New room
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    keyboard
                  </span>
                  <Input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter a code"
                    className="h-12 pl-12 pr-4 w-full sm:w-64 border-2"
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  />
                </div>
                <Button
                  onClick={handleJoinRoom}
                  disabled={!roomCode.trim()}
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 font-medium"
                >
                  Join
                </Button>
              </div>
            </div>

            <div className="border-t my-12"></div>

            {/* Active Rooms Section */}
            {Object.keys(rooms).length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-medium flex items-center gap-2">
                  <span className="material-icons">groups</span>
                  Active Rooms
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(rooms).map(([roomId, roomData]) => (
                    <RoomCard
                      key={roomId}
                      roomId={roomId}
                      roomName={roomData.name}
                      participantCount={getRoomParticipantCount(roomData)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
