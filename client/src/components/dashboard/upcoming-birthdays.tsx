import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";

export function UpcomingBirthdays() {
  const { data: birthdays, isLoading } = useQuery({
    queryKey: ["/api/dashboard/birthdays"],
  });

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDaysUntilBirthday = (birthday: string) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const birthdayThisYear = new Date(`${currentYear}-${birthday.slice(5)}`);
    
    if (birthdayThisYear < today) {
      // Birthday already passed this year, calculate for next year
      const birthdayNextYear = new Date(`${currentYear + 1}-${birthday.slice(5)}`);
      return differenceInDays(birthdayNextYear, today);
    }
    
    return differenceInDays(birthdayThisYear, today);
  };

  if (isLoading) {
    return (
      <Card className="glassmorphism-card border-0">
        <CardHeader>
          <CardTitle>Upcoming Birthdays</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-4 glassmorphism rounded-xl">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Birthdays</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            View Calendar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!birthdays?.length ? (
          <p className="text-muted-foreground text-center py-8">
            No birthdays this month
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {birthdays.slice(0, 4).map((member: any) => {
              const daysUntil = getDaysUntilBirthday(member.birthday);
              return (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-4 glassmorphism rounded-xl"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {getUserInitials(member.fullName)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{member.fullName}</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(`2024-${member.birthday.slice(5)}`), "MMM dd")}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {daysUntil === 0
                        ? "Today!"
                        : daysUntil === 1
                        ? "Tomorrow"
                        : `in ${daysUntil} days`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
