import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UsernameDialogProps {
  open: boolean;
  onSubmit: (username: string) => void;
}

export const UsernameDialog = ({ open, onSubmit }: UsernameDialogProps) => {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Welcome!</DialogTitle>
          <DialogDescription>
            Please enter a username to continue to the chat room.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              className="h-12"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium"
            disabled={!username.trim()}
          >
            Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
