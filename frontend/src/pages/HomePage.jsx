import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useRealTime } from '../context/RealTimeContext';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';

/**
 * HomePage - Uses RealTimeContext for centralized real-time state
 */
const HomePage = () => {
    const { user } = useAuth();
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
            ids: 'ONLINE',
            label: 'Online',
            description: "You're visible and available",
            color: 'bg-green-500',
            ring: 'ring-green-500',
            bg: 'bg-green-500' // Distinct from color for potential text usage
        },
        OFFLINE: {
            ids: 'OFFLINE',
            label: 'Offline',
            description: "You're not visible to others",
            color: 'bg-gray-400',
            ring: 'ring-gray-400',
            bg: 'bg-gray-400'
        },
        IN_SESSION: {
            ids: 'IN_SESSION',
            label: 'In Session',
            description: "You're in an active exchange",
            color: 'bg-blue-500',
            ring: 'ring-blue-500',
            bg: 'bg-blue-500'
        },
        BUSY: {
            ids: 'BUSY',
            label: 'Busy',
            description: "You're occupied right now",
            color: 'bg-yellow-500',
            ring: 'ring-yellow-500',
            bg: 'bg-yellow-500'
        }
    };

    // Safe fallback to OFFLINE
    const currentPresence = presenceConfig[user?.presenceStatus] || presenceConfig.OFFLINE;

    // Greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <PageContainer>
            <div className="space-y-6 sm:space-y-8">

                {/* Header Section */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
                        {getGreeting()}, {user?.name}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-2 transition-colors">
                        Your skills ecosystem is active. Here is what is happening now.
                    </p>
                </div>

                {/* Presence Indicator Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm flex items-center gap-4 transition-all hover:border-gray-300 dark:hover:border-slate-700">
                    <div className="relative">
                        <span className={`block w-4 h-4 rounded-full ${currentPresence.bg}`}></span>
                        <span className={`absolute -inset-1 rounded-full opacity-30 animate-pulse ${currentPresence.bg}`}></span>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white transition-colors">{currentPresence.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{currentPresence.description}</p>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <SummaryCard
                        label="Friends Online"
                        value={isLoading ? '...' : friendsOnline}
                        icon="👥"
                        link="/friends"
                        highlight={friendsOnline > 0}
                    />
                    <SummaryCard
                        label="Friend Requests"
                        value={isLoading ? '...' : pendingRequestCount}
                        icon="✉️"
                        link="/friends"
                        highlight={pendingRequestCount > 0}
                    />
                    <SummaryCard
                        label="New Messages"
                        value={unreadCount}
                        icon="💬"
                        link="/friends"
                        highlight={unreadCount > 0}
                    />
                    <SummaryCard
                        label="Total Friends"
                        value={isLoading ? '...' : friends.length}
                        icon="🤝"
                        link="/friends"
                    />
                </div>

                {/* Main Actions Grid */}
                <div className="grid sm:grid-cols-2 gap-6">
                    <Link
                        to="/exchanges"
                        className="group block p-6 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-xl text-white shadow-lg shadow-blue-900/20 hover:shadow-xl hover:scale-[1.01] transition-all border border-blue-500/20"
                    >
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🔄</div>
                        <h2 className="font-bold text-xl">Start Exchange</h2>
                        <p className="text-blue-100 text-sm mt-1 opacity-90">
                            Find a partner and start learning now.
                        </p>
                    </Link>

                    <Link
                        to="/friends"
                        className="group block p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl hover:border-blue-500/50 hover:shadow-md transition-all"
                    >
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">👋</div>
                        <h2 className="font-bold text-xl text-gray-900 dark:text-white transition-colors">Your Network</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors">
                            {friendsOnline > 0
                                ? <span className="text-green-600 dark:text-green-400 font-medium transition-colors">{friendsOnline} online now</span>
                                : 'Connect with your peers.'}
                        </p>
                    </Link>
                </div>
            </div>
        </PageContainer>
    );
};

// Sub-component for metric cards
const SummaryCard = ({ label, value, icon, link, highlight = false }) => (
    <Link
        to={link}
        className={`block p-5 rounded-xl border transition-all hover:border-gray-400 dark:hover:border-slate-600 ${highlight
            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-400/50'
            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
            }`}
    >
        <div className="text-2xl mb-2 filter grayscale opacity-80">{icon}</div>
        <div className={`text-3xl font-bold mb-1 ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'} transition-colors`}>
            {value}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate transition-colors">{label}</div>
    </Link>
);

export default HomePage;
