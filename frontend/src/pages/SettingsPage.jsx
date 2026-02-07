import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { user, logout, deactivateAccount, deleteAccount } = useAuth();
    const {
        isSupported,
        isSubscribed,
        permission,
        loading: pushLoading,
        enablePush,
        disablePush,
    } = usePushNotifications();

    const [accountAction, setAccountAction] = useState(null);
    const [accountError, setAccountError] = useState('');

    const isBusy = accountAction !== null;

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

    const extractErrorMessage = (err, fallback) => {
        return err?.response?.data?.message || fallback;
    };

    const handleLogout = async () => {
        setAccountError('');
        setAccountAction('logout');
        await logout();
        navigate('/login', { replace: true });
    };

    const handleDeactivate = async () => {
        const confirmed = window.confirm(
            'Deactivate account? You can contact support later to restore access.'
        );
        if (!confirmed) return;

        setAccountError('');
        setAccountAction('deactivate');

        try {
            await deactivateAccount();
            navigate('/login', { replace: true });
        } catch (err) {
            setAccountError(extractErrorMessage(err, 'Failed to deactivate account.'));
        } finally {
            setAccountAction(null);
        }
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            'Delete account permanently? This action cannot be undone and all data will be removed.'
        );
        if (!confirmed) return;

        setAccountError('');
        setAccountAction('delete');

        try {
            await deleteAccount();
            navigate('/login', { replace: true });
        } catch (err) {
            setAccountError(extractErrorMessage(err, 'Failed to delete account.'));
        } finally {
            setAccountAction(null);
        }
    };

    return (
        <PageContainer>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Settings</h1>

                <div className="space-y-6">
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
                                variant={isSubscribed ? 'outline' : 'primary'}
                                onClick={handlePushToggle}
                                disabled={pushLoading || !isSupported || permission === 'denied'}
                            >
                                {pushLoading ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
                            </Button>
                        </div>
                    </Card>

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

                    <Card className="border-red-200 dark:border-red-900/30">
                        <CardHeader
                            title="Account"
                            description="Manage your account and session"
                        />

                        <div className="space-y-4 p-1">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">Session</div>
                                    <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                        Stay signed in until you explicitly sign out.
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    disabled={isBusy}
                                    onClick={handleLogout}
                                >
                                    {accountAction === 'logout' ? 'Signing out...' : 'Sign Out'}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="font-medium text-amber-700 dark:text-amber-400">Deactivate Account</div>
                                    <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                        Disable your account without deleting your data.
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    disabled={isBusy}
                                    onClick={handleDeactivate}
                                >
                                    {accountAction === 'deactivate' ? 'Deactivating...' : 'Deactivate'}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="font-medium text-red-600 dark:text-red-400">Delete Account</div>
                                    <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                        Permanently remove your account and related data.
                                    </div>
                                </div>
                                <Button
                                    variant="danger"
                                    disabled={isBusy}
                                    onClick={handleDelete}
                                >
                                    {accountAction === 'delete' ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>

                            {accountError && (
                                <p className="text-sm text-red-600 dark:text-red-400">{accountError}</p>
                            )}
                        </div>
                    </Card>

                    <div className="text-center text-xs text-gray-400 py-4">
                        Continuum v1.0.0 | Connected as {user?.name || `User #${user?.id ?? ''}`}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default SettingsPage;
