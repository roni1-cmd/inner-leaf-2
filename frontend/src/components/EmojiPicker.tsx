import EmojiPicker from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface EmojiPickerComponentProps {
  onEmojiClick: (emoji: string) => void;
}

export function EmojiPickerComponent({ onEmojiClick }: EmojiPickerComponentProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="material-icons text-sm">add_reaction</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0" align="end">
        <EmojiPicker
          onEmojiClick={(emojiData) => onEmojiClick(emojiData.emoji)}
          width={320}
          height={400}
        />
      </PopoverContent>
    </Popover>
  );
}
