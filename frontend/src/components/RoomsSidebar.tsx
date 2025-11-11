import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import logo from "@/assets/app-logo.png";

interface RoomsSidebarProps {
  currentRoomId?: string;
  onClose?: () => void;
}

export function RoomsSidebar({ currentRoomId, onClose }: RoomsSidebarProps) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<{ [key: string]: any }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const username = localStorage.getItem("chatUsername");

  useEffect(() => {
    const roomsRef = ref(database, "rooms");
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      setRooms(data || {});
      
      // Calculate unread counts
      if (data && username) {
        const counts: Record<string, number> = {};
        Object.entries(data).forEach(([roomId, roomData]: [string, any]) => {
          const messages = roomData?.messages || {};
          const lastRead = parseInt(localStorage.getItem(`lastRead_${roomId}`) || "0");
          const unreadCount = Object.values(messages).filter(
            (msg: any) => msg.timestamp > lastRead && msg.username !== username
          ).length;
          if (unreadCount > 0) {
            counts[roomId] = unreadCount;
          }
        });
        setUnreadCounts(counts);
      }
    });
    return () => unsubscribe();
  }, [username]);

  const filteredRooms = Object.entries(rooms).filter(([roomId, roomData]) => {
    const query = searchQuery.toLowerCase();
    return (
      roomId.toLowerCase().includes(query) ||
      roomData?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
                <span className="material-icons">close</span>
              </Button>
            )}
            <h2 className="text-xl font-semibold">Chats</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <span className="material-icons">home</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
            search
          </span>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Messenger"
            className="pl-10 bg-muted/50 border-none"
          />
        </div>
      </div>

      {/* Rooms List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No rooms found
            </div>
          ) : (
            filteredRooms.map(([roomId, roomData]) => (
              <button
                key={roomId}
                onClick={() => {
                  navigate(`/room/${roomId}`);
                  onClose?.();
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors ${
                  currentRoomId === roomId ? "bg-accent" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${roomId}`}
                    alt={roomData?.name || roomId}
                    className="w-12 h-12 rounded-full"
                  />
                  {unreadCounts[roomId] && currentRoomId !== roomId && (
                    <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCounts[roomId] > 9 ? "9+" : unreadCounts[roomId]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium truncate">
                    {roomData?.name || `Room ${roomId}`}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {roomId}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
