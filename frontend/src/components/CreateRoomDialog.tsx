import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateRoomDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (roomName: string) => void;
}

export const CreateRoomDialog = ({ open, onClose, onSubmit }: CreateRoomDialogProps) => {
  const [roomName, setRoomName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      onSubmit(roomName.trim());
      setRoomName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create New Room</DialogTitle>
          <DialogDescription>
            Choose a name for your chat room.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomname">Room Name</Label>
            <Input
              id="roomname"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              autoFocus
              className="h-12"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 text-base font-medium"
              disabled={!roomName.trim()}
            >
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
