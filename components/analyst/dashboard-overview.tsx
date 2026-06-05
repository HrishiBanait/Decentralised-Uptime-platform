"use client";
import { motion } from "framer-motion";
import {
    Activity,
    Briefcase,
    CheckCircle2,
    Clock,
    FileText,
    Shield,
    TrendingUp,
    Users,
    AlertTriangle,
    Search,
    Upload,
    ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getAllEvidence, StoredEvidence } from "@/lib/evidence-storage";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface DashboardOverviewProps {
    stats: {
        totalEvidence: number;
        totalCases: number;
        verified: number;
        reportsGenerated: number;
        onBlockchain: number;
    };
    onNavigate: (tab: string) => void;
}

export default function DashboardOverview({ stats, onNavigate }: DashboardOverviewProps) {
    const [recentEvidence, setRecentEvidence] = useState<StoredEvidence[]>([]);
    const [trendData, setTrendData] = useState<{ display: string; uploads: number }[]>([]);
    const [donutData, setDonutData] = useState<{ name: string; value: number; color: string }[]>([]);

    useEffect(() => {
        const updateData = async () => {
            const allEv = await getAllEvidence();
            
            // Sort by uploadDate descending for Recent List
            const sorted = [...allEv].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
            setRecentEvidence(sorted.slice(0, 5));

            // Generate last 7 days trend
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return {
                    dateStr: d.toISOString().split('T')[0],
                    display: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    uploads: 0
                };
            });

            allEv.forEach(ev => {
                const dStr = new Date(ev.uploadDate).toISOString().split('T')[0];
                const match = last7Days.find(d => d.dateStr === dStr);
                if (match) match.uploads++;
            });

            setTrendData(last7Days);

            // Generate Donut Data
            const authentic = allEv.filter(e => e.status === "complete" && e.result === "authentic").length;
            const tampered = allEv.filter(e => e.status === "complete" && e.result === "tampered").length;
            const pending = allEv.filter(e => e.status !== "complete").length;

            setDonutData([
                { name: 'Authentic', value: authentic, color: '#10b981' }, 
                { name: 'Tampered', value: tampered, color: '#ef4444' }, 
                { name: 'Pending', value: pending, color: '#f59e0b' },
            ].filter(d => d.value > 0));
        };

        updateData();
        const interval = setInterval(updateData, 5000);
        return () => clearInterval(interval);
    }, []);

    const getTimeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    const overviewStats = [
        {
            title: "Active Cases",
            value: stats.totalCases,
            icon: Briefcase,
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-100 dark:bg-indigo-900/20",
        },
        {
            title: "Total Evidence",
            value: stats.totalEvidence,
            icon: Activity,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
            title: "Verified",
            value: stats.verified,
            icon: Shield,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-100 dark:bg-emerald-900/20",
        },
        {
            title: "Blockchain Secured",
            value: stats.onBlockchain,
            icon: CheckCircle2,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-100 dark:bg-purple-900/20",
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-muted-foreground mt-1">
                        Welcome back. Here's your real-time evidence analysis.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => onNavigate("upload")} className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload New Evidence
                    </Button>
                    <Button variant="outline" onClick={() => onNavigate("detect")} className="gap-2">
                        <Search className="h-4 w-4" />
                        Quick Analysis
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {overviewStats.map((stat) => (
                    <motion.div key={stat.title} variants={item}>
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${stat.bg}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                {stat.title === "Blockchain Secured" && stats.totalEvidence > 0 && (
                                    <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-purple-500" 
                                            style={{ width: `${(stats.onBlockchain / stats.totalEvidence) * 100}%` }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-7 h-[350px]">
                {/* 7-Day Trend Chart */}
                <Card className="col-span-1 md:col-span-4 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Evidence Upload Trend</CardTitle>
                        <CardDescription>Upload activity over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="uploads" stroke="#8884d8" fillOpacity={1} fill="url(#colorUploads)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Analysis Breakdown */}
                <Card className="col-span-1 md:col-span-3 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Authenticity Breakdown</CardTitle>
                        <CardDescription>Ratio of authentic vs tampered evidence</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 flex items-center justify-center">
                        {donutData.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm flex flex-col items-center">
                                <Activity className="h-8 w-8 mb-2 opacity-20" />
                                No analyzed data yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Uploads Row */}
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Uploads</CardTitle>
                        <CardDescription>
                            Latest evidence uploaded and analyzed across your cases
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentEvidence.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/20 rounded-lg border border-dashed text-muted-foreground">
                                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                    <p className="text-sm font-medium">No recent uploads</p>
                                    <p className="text-xs">Upload some evidence to see it appear here</p>
                                </div>
                            ) : (
                                recentEvidence.map((ev) => (
                                    <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            {/* Preview Thumbnail Box */}
                                            <div className="flex-shrink-0 relative overflow-hidden h-12 w-12 rounded-md border bg-muted flex flex-col justify-center items-center">
                                                {ev.imageData ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={ev.imageData} alt="preview" className="object-cover h-full w-full" />
                                                ) : (
                                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {ev.fileName}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <span>{ev.caseName || 'Unassigned Case'}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {getTimeAgo(ev.uploadDate)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex-shrink-0">
                                            {ev.status !== 'complete' ? (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                                                    Pending Analysis
                                                </Badge>
                                            ) : ev.result === 'tampered' ? (
                                                <Badge variant="destructive" className="flex gap-1.5 items-center">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Tampered
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-500 hover:bg-emerald-600 flex gap-1.5 items-center text-white">
                                                    <Shield className="h-3 w-3" />
                                                    Authentic
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
