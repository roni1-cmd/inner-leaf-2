import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LinkPreviewProps {
  url: string;
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<{
    title?: string;
    description?: string;
    image?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple URL preview - in production, you'd use a proper API or edge function
    setLoading(false);
    setPreview({
      title: new URL(url).hostname,
      description: url,
    });
  }, [url]);

  if (loading || !preview) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline mt-2"
    >
      <Card className="overflow-hidden hover:bg-accent/50 transition-colors">
        {preview.image && (
          <img
            src={preview.image}
            alt={preview.title}
            className="w-full h-32 object-cover"
          />
        )}
        <CardContent className="p-3">
          <p className="font-medium text-sm truncate">{preview.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {preview.description}
          </p>
        </CardContent>
      </Card>
    </a>
  );
}
