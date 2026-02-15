import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useRealTime } from '../context/RealTimeContext';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Moon,
    Sun,
    CloudSun,
    Sunset,
    Bird,
    Users,
    Mail,
    MessageSquare,
    Handshake,
    ArrowLeftRight,
    UserPlus,
    Wifi
} from 'lucide-react';

/**
 * HomePage - Uses RealTimeContext for centralized real-time state
 */
const HomePage = () => {
    const { user, isAdmin } = useAuth();
    const { unreadCount } = useNotifications();
    const {
        friends,
        friendsOnline,
        pendingRequestCount,
        isLoading
    } = useRealTime();

    // Map presence status to UI configuration
    const presenceConfig = {
        ONLINE: {
            label: 'Online',
            description: "You're visible and available",
            variant: "default",
            dotClass: "bg-emerald-500",
            bgClass: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
        },
        OFFLINE: {
            label: 'Offline',
            description: "You're not visible to others",
            variant: "secondary",
            dotClass: "bg-slate-400",
            bgClass: "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
        },
        IN_SESSION: {
            label: 'In Session',
            description: "You're in an active exchange",
            variant: "default",
            dotClass: "bg-blue-500",
            bgClass: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        },
        BUSY: {
            label: 'Busy',
            description: "You're occupied right now",
            variant: "default",
            dotClass: "bg-amber-500",
            bgClass: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
        }
    };

    // Safe fallback to OFFLINE
    const currentPresence = presenceConfig[user?.presenceStatus] || presenceConfig.OFFLINE;

    // Greeting based on time of day with icon
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return { text: 'Burning the midnight oil', icon: <Moon className="w-7 h-7 text-indigo-400 inline-block align-text-bottom" /> };
        if (hour < 12) return { text: 'Good morning', icon: <Sun className="w-7 h-7 text-amber-400 inline-block align-text-bottom" /> };
        if (hour < 17) return { text: 'Good afternoon', icon: <CloudSun className="w-7 h-7 text-sky-400 inline-block align-text-bottom" /> };
        if (hour < 21) return { text: 'Good evening', icon: <Sunset className="w-7 h-7 text-orange-400 inline-block align-text-bottom" /> };
        return { text: 'Late night focus', icon: <Bird className="w-7 h-7 text-violet-400 inline-block align-text-bottom" /> };
    };

    const greeting = getGreeting();

    return (
        <PageContainer>
            <div className="space-y-8 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                        {greeting.text}, {user?.name} {greeting.icon}
                        {isAdmin && (
                            <Badge variant="destructive" className="ml-2 align-middle">
                                Admin
                            </Badge>
                        )}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Welcome back to your skills ecosystem. Let's make progress today.
                    </p>
                </div>

                {/* Presence Indicator Card */}
                <Card className={cn("border transition-all", currentPresence.bgClass)}>
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        <div className="relative flex items-center justify-center">
                            <div className={cn("h-3 w-3 rounded-full", currentPresence.dotClass)} />
                            <div className={cn("absolute h-3 w-3 rounded-full animate-ping opacity-75", currentPresence.dotClass)} />
                        </div>
                        <div className="flex items-center gap-3">
                            <Wifi className="w-4 h-4 text-slate-400" />
                            <div>
                                <CardTitle className="text-base">{currentPresence.label}</CardTitle>
                                <CardDescription>{currentPresence.description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <SummaryCard
                        label="Friends Online"
                        value={isLoading ? '...' : friendsOnline}
                        icon={<Users className="w-5 h-5" />}
                        iconColor="text-emerald-500"
                        iconBg="bg-emerald-50 dark:bg-emerald-900/20"
                        link="/friends"
                        highlight={friendsOnline > 0}
                    />
                    <SummaryCard
                        label="Friend Requests"
                        value={isLoading ? '...' : pendingRequestCount}
                        icon={<Mail className="w-5 h-5" />}
                        iconColor="text-blue-500"
                        iconBg="bg-blue-50 dark:bg-blue-900/20"
                        link="/friends"
                        highlight={pendingRequestCount > 0}
                    />
                    <SummaryCard
                        label="New Messages"
                        value={unreadCount}
                        icon={<MessageSquare className="w-5 h-5" />}
                        iconColor="text-violet-500"
                        iconBg="bg-violet-50 dark:bg-violet-900/20"
                        link="/friends"
                        highlight={unreadCount > 0}
                    />
                    <SummaryCard
                        label="Total Friends"
                        value={isLoading ? '...' : friends.length}
                        icon={<Handshake className="w-5 h-5" />}
                        iconColor="text-amber-500"
                        iconBg="bg-amber-50 dark:bg-amber-900/20"
                        link="/friends"
                    />
                </div>

                {/* Main Actions Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <Link to="/exchanges">
                        <Card className="h-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02] group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                                <ArrowLeftRight className="w-24 h-24" />
                            </div>
                            <CardHeader className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <ArrowLeftRight className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-2xl">Start Exchange</CardTitle>
                                <CardDescription className="text-indigo-100 opacity-90">
                                    Find a partner and start learning now.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link to="/friends">
                        <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-indigo-200 dark:hover:border-indigo-800 group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                                <UserPlus className="w-24 h-24 text-indigo-500" />
                            </div>
                            <CardHeader className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <UserPlus className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <CardTitle className="text-2xl">Your Network</CardTitle>
                                <CardDescription>
                                    {friendsOnline > 0
                                        ? <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            {friendsOnline} online now
                                        </span>
                                        : 'Connect with your peers.'}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>
            </div>
        </PageContainer>
    );
};

// Sub-component for metric cards
const SummaryCard = ({ label, value, icon, iconColor = "text-slate-500", iconBg = "bg-slate-100", link, highlight = false }) => (
    <Link to={link}>
        <Card className={cn(
            "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group",
            highlight && "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10"
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {label}
                </CardTitle>
                <div className={cn("p-2 rounded-lg transition-colors", iconBg, iconColor, "group-hover:scale-110 transition-transform duration-300")}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
            </CardContent>
        </Card>
    </Link>
);

export default HomePage;
