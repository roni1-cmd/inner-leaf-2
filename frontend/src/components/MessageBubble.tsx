import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPickerComponent } from "@/components/EmojiPicker";
import { LinkPreview } from "@/components/LinkPreview";

interface Reaction {
  emoji: string;
  users: string[];
}

interface Message {
  id: string;
  text: string;
  username: string;
  nickname?: string;
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

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUsername: string;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onReply: (message: Message) => void;
  onPin?: (messageId: string) => void;
  renderText?: (text: string) => React.ReactNode;
}

const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

export const MessageBubble = ({
  message,
  isOwn,
  currentUsername,
  onReact,
  onEdit,
  onDelete,
  onReply,
  onPin,
  renderText,
}: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false);
  const [pinActions, setPinActions] = useState(false);

  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([_, users]) => users.length > 0);

  // Extract URLs from message text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = message.text.match(urlRegex) || [];
  const textWithoutUrls = message.text.replace(urlRegex, "").trim();

  const handleReaction = (emoji: string) => {
    onReact(message.id, emoji);
  };

  return (
    <div
      className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onFocus={() => setShowActions(true)}
      onBlur={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.username}`}
          alt={message.username}
          className="w-8 h-8 rounded-full"
        />
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Reply Preview */}
        {message.replyTo && (
          <div
            className={`text-xs px-3 py-1 mb-1 rounded-lg bg-muted/50 border-l-2 ${
              isOwn ? "border-primary" : "border-accent"
            }`}
          >
            <div className="font-medium text-muted-foreground">
              {message.replyTo.username}
            </div>
            <div className="text-muted-foreground truncate">
              {message.replyTo.text}
            </div>
          </div>
        )}

        {/* Message Card */}
        <div className="relative">
          <Card
            className={`p-3 ${
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-card"
            }`}
          >
            <p className="text-xs font-medium mb-1 opacity-90">
              {message.username}
            </p>
            
            {/* File Attachment */}
            {message.fileUrl && (
              <div className="mb-2">
                {message.fileType?.startsWith('image/') ? (
                  <img
                    src={message.fileUrl}
                    alt={message.fileName}
                    className="max-w-full max-h-80 rounded-lg"
                  />
                ) : message.fileType?.startsWith('video/') ? (
                  <video
                    src={message.fileUrl}
                    controls
                    className="max-w-full max-h-80 rounded-lg"
                  />
                ) : message.fileType?.startsWith('audio/') ? (
                  <audio src={message.fileUrl} controls className="w-full" />
                ) : (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted"
                  >
                    <span className="material-icons text-sm">insert_drive_file</span>
                    <span className="text-sm truncate">{message.fileName}</span>
                  </a>
                )}
              </div>
            )}
            
            {textWithoutUrls && (
              <p className="break-words whitespace-pre-wrap">
                {textWithoutUrls}
                {message.edited && (
                  <span className="text-xs opacity-70 ml-2">(edited)</span>
                )}
              </p>
            )}
            
            {urls.map((url, idx) => (
              <div key={idx} className="mt-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline break-all block mb-1"
                >
                  {url}
                </a>
                <LinkPreview url={url} />
              </div>
            ))}
          </Card>

          {/* Quick Actions */}
          {(showActions || pinActions) && (
            <div
              className={`absolute top-0 flex gap-1 ${
                isOwn ? "right-full mr-2" : "left-full ml-2"
              }`}
            >
              <Popover onOpenChange={(open) => setPinActions(open)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 bg-background/95 shadow-sm"
                  >
                    <span className="material-icons text-sm">add_reaction</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-50 bg-popover border shadow-md w-auto p-2">
                  <div className="flex gap-1 items-center">
                    {QUICK_REACTIONS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                        onClick={() => handleReaction(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                    <div className="border-l pl-1 ml-1">
                      <EmojiPickerComponent onEmojiClick={(emoji) => handleReaction(emoji)} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu onOpenChange={(open) => setPinActions(open)}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 bg-background/95 shadow-sm"
                  >
                    <span className="material-icons text-sm">more_horiz</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-50 bg-popover border shadow-md" align={isOwn ? "end" : "start"}>
                  <DropdownMenuItem onClick={() => onReply(message)}>
                    <span className="material-icons text-sm mr-2">reply</span>
                    Reply
                  </DropdownMenuItem>
                  {onPin && (
                    <DropdownMenuItem onClick={() => onPin(message.id)}>
                      <span className="material-icons text-sm mr-2">
                        {message.pinned ? "push_pin" : "push_pin"}
                      </span>
                      {message.pinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                  )}
                  {isOwn && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit(message.id)}>
                        <span className="material-icons text-sm mr-2">edit</span>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(message.id)}
                        className="text-destructive"
                      >
                        <span className="material-icons text-sm mr-2">delete</span>
                        Unsend
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Reactions */}
        {reactionEntries.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {reactionEntries.map(([emoji, users]) => {
              const hasReacted = users.includes(currentUsername);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                    hasReacted
                      ? "bg-primary/20 border-primary"
                      : "bg-muted border-border hover:bg-muted/80"
                  }`}
                >
                  {emoji} {users.length}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
