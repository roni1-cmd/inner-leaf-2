import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ModerationDialogProps {
  open: boolean;
  action: "mute" | "kick" | "ban" | null;
  username: string;
  onClose: () => void;
  onConfirm: (duration?: number) => void;
}

export function ModerationDialog({
  open,
  action,
  username,
  onClose,
  onConfirm,
}: ModerationDialogProps) {
  const [muteDuration, setMuteDuration] = useState<string>("2");

  const handleConfirm = () => {
    if (action === "mute") {
      onConfirm(parseInt(muteDuration));
    } else {
      onConfirm();
    }
    onClose();
  };

  const getTitle = () => {
    switch (action) {
      case "mute":
        return "Mute User";
      case "kick":
        return "Kick User";
      case "ban":
        return "Ban User";
      default:
        return "";
    }
  };

  const getDescription = () => {
    switch (action) {
      case "mute":
        return `${username} will not be able to send messages for the selected duration. They can still see all messages.`;
      case "kick":
        return `${username} will be removed from the room but can rejoin using the room code.`;
      case "ban":
        return `${username} will be permanently banned from this room and cannot rejoin.`;
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        
        {action === "mute" && (
          <div className="py-4">
            <Label className="text-sm font-medium mb-3 block">Mute Duration</Label>
            <RadioGroup value={muteDuration} onValueChange={setMuteDuration}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="2" id="2min" />
                <Label htmlFor="2min" className="cursor-pointer">2 minutes</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="5" id="5min" />
                <Label htmlFor="5min" className="cursor-pointer">5 minutes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="10" id="10min" />
                <Label htmlFor="10min" className="cursor-pointer">10 minutes</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant={action === "ban" ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            Confirm {action === "mute" ? "Mute" : action === "kick" ? "Kick" : "Ban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
