import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';

const SettingsPage = () => {
    const { user, deleteAccount } = useAuth();
    const {
        isSupported,
        isSubscribed,
        permission,
        loading: pushLoading,
        enablePush,
        disablePush
    } = usePushNotifications();

    const handlePushToggle = async () => {
        if (isSubscribed) {
            await disablePush();
        } else {
            await enablePush();
        }
    };

    const getPushStatusLabel = () => {
        if (!isSupported) return 'Not supported in this browser';
        if (permission === 'denied') return 'Blocked in browser settings';
        if (isSubscribed) return 'Enabled';
        return 'Disabled';
    };

    return (
        <PageContainer>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Settings</h1>

                <div className="space-y-6">

                    {/* NOTIFICATIONS */}
                    <Card>
                        <CardHeader
                            title="Notifications"
                            description="Manage how you receive updates when you're away"
                        />
                        <div className="flex items-center justify-between p-1">
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                                <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                    Receive alerts for calls, matches, and messages when offline.
                                </div>
                                <div className="text-xs text-gray-400 mt-2">
                                    Status: <span className="font-semibold">{getPushStatusLabel()}</span>
                                </div>
                            </div>

                            <Button
                                variant={isSubscribed ? "outline" : "primary"}
                                onClick={handlePushToggle}
                                disabled={pushLoading || !isSupported || permission === 'denied'}
                            >
                                {pushLoading ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
                            </Button>
                        </div>
                    </Card>

                    {/* APPEARANCE */}
                    <Card>
                        <CardHeader
                            title="Appearance"
                            description="Customize your visual experience"
                        />
                        <div className="flex items-center justify-between p-1">
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">Theme</div>
                                <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                    Switch between Light and Dark mode.
                                </div>
                            </div>
                            <ThemeToggle />
                        </div>
                    </Card>

                    {/* ACCOUNT */}
                    <Card className="border-red-200 dark:border-red-900/30">
                        <CardHeader
                            title="Account"
                            description="Manage your account data"
                        />
                        <div className="flex items-center justify-between p-1">
                            <div>
                                <div className="font-medium text-red-600 dark:text-red-400">Danger Zone</div>
                                <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                    Permanently delete your account and all data.
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => alert("Deletion functionality coming soon")}
                            >
                                Delete Account
                            </Button>
                        </div>
                    </Card>

                    {/* APP INFO */}
                    <div className="text-center text-xs text-gray-400 py-4">
                        Continuum v1.0.0 • Connected as {user?.email}
                    </div>

                </div>
            </div>
        </PageContainer>
    );
};

export default SettingsPage;
