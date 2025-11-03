import { useState, useEffect } from "react";
import { format } from "date-fns";

export const LiveDateTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm text-muted-foreground">
      {format(currentTime, "h:mm a • EEE, MMM d")}
    </div>
  );
};
