import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface RoomCardProps {
  roomId: string;
  roomName?: string;
  participantCount: number;
}

export const RoomCard = ({ roomId, roomName, participantCount }: RoomCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-medium text-lg">{roomName || `Room ${roomId}`}</h3>
          <p className="text-xs text-muted-foreground mb-1">{roomId}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <span className="material-icons text-base">people</span>
            {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
          </p>
        </div>
        <Button
          onClick={() => navigate(`/room/${roomId}`)}
          size="sm"
          className="gap-2"
        >
          <span className="material-icons text-sm">login</span>
          Join
        </Button>
      </div>
    </Card>
  );
};
