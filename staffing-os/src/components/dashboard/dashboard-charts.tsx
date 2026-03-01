"use client"

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
    PieChart,
    Pie,
    Cell
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const monthlyData = [
    { name: "5月", candidates: 120, assignments: 80 },
    { name: "6月", candidates: 150, assignments: 90 },
    { name: "7月", candidates: 180, assignments: 110 },
    { name: "8月", candidates: 200, assignments: 130 },
    { name: "9月", candidates: 250, assignments: 160 },
    { name: "10月", candidates: 280, assignments: 190 },
]

const statusDistribution = [
    { name: "審査中", value: 45, color: "var(--color-warning)" },
    { name: "承認済み", value: 80, color: "var(--color-info)" },
    { name: "採用済み", value: 155, color: "var(--color-success)" },
    { name: "不合格", value: 30, color: "var(--color-destructive)" },
]

export function DashboardCharts() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>月間候補者・稼働推移</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAssignments" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "var(--radius)" }}
                                    itemStyle={{ color: "var(--color-foreground)" }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="candidates" name="新規候補者" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorCandidates)" />
                                <Area type="monotone" dataKey="assignments" name="新規稼働" stroke="var(--color-secondary)" fillOpacity={1} fill="url(#colorAssignments)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>ステータス分布</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "var(--radius)" }}
                                    itemStyle={{ color: "var(--color-foreground)" }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
