import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserRound, Calendar, DollarSign } from "lucide-react";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="clinical-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-clinical-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-clinical-200 rounded w-16 mb-4"></div>
                <div className="h-3 bg-clinical-200 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Active Patients",
      value: stats?.activePatients || 0,
      icon: Users,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      change: "+12%",
      changeText: "vs last month",
    },
    {
      title: "Consultants",
      value: stats?.consultants || 0,
      icon: UserRound,
      iconColor: "text-health-600",
      iconBg: "bg-health-100",
      change: null,
      changeText: "3 visiting this week",
    },
    {
      title: "Appointments",
      value: stats?.appointments || 0,
      icon: Calendar,
      iconColor: "text-yellow-600",
      iconBg: "bg-yellow-100",
      change: null,
      changeText: "Today's schedule",
    },
    {
      title: "Revenue",
      value: `$${(stats?.revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      change: "+8%",
      changeText: "this month",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statItems.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="clinical-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-clinical-500 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-clinical-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`${stat.iconColor} text-lg`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stat.change && (
                  <span className="text-health-600 font-medium">{stat.change}</span>
                )}
                <span className={`text-clinical-500 ${stat.change ? 'ml-2' : ''}`}>
                  {stat.changeText}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
