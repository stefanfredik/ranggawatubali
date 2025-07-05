import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  id: number;
  eventName: string;
  eventDate: string;
  amount: number;
  targetAmount: number;
  status: "collected" | "pending";
  type: "happy" | "sad" | "fundraising";
  onClick: () => void;
}

export function EventCard({
  id,
  eventName,
  eventDate,
  amount,
  targetAmount,
  status,
  type,
  onClick,
}: EventCardProps) {
  // Calculate progress percentage
  const progress = targetAmount > 0 ? Math.min(Math.round((amount / targetAmount) * 100), 100) : 0;
  
  // Get color based on donation type
  const getColorClass = () => {
    switch (type) {
      case "happy":
        return "from-pink-500 to-pink-700";
      case "sad":
        return "from-blue-500 to-blue-700";
      case "fundraising":
        return "from-amber-500 to-amber-700";
      default:
        return "from-gray-500 to-gray-700";
    }
  };

  // Format date
  const formattedDate = new Date(eventDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card variant="glass" className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col" onClick={onClick}>
      <div className={`h-2 bg-gradient-to-r ${getColorClass()}`} />
      <CardHeader className="pb-2">
        <h3 className="text-xl font-bold truncate">{eventName}</h3>
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarIcon className="mr-1 h-4 w-4" />
          {formattedDate}
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm pt-1">
            <span>Rp {amount.toLocaleString("id-ID")}</span>
            <span className="text-muted-foreground">dari Rp {targetAmount.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between items-center">
        {status === "collected" ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            Terkumpul
          </Badge>
        ) : (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
            Belum Terkumpul
          </Badge>
        )}
        <Button 
          size="sm" 
          className={`bg-gradient-to-r ${getColorClass()} text-white hover:opacity-90`}
        >
          Detail
        </Button>
      </CardFooter>
    </Card>
  );
}