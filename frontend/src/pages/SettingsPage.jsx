import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useDialog } from '../context/DialogContext';

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
    const dialog = useDialog();

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
        const confirmed = await dialog.confirm(
            'Deactivate Account',
            'Deactivate account? You can contact support later to restore access.',
            'Deactivate',
            'warning'
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
        const confirmed = await dialog.confirm(
            'Delete Account',
            'Delete account permanently? This action cannot be undone and all data will be removed.',
            'Delete Permanently',
            'destructive'
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
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-foreground text-center">Settings</h1>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Manage how you receive updates when you're away</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Push Notifications</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Receive alerts for calls, matches, and messages when offline.
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                    Status: <span className="font-semibold">{getPushStatusLabel()}</span>
                                </div>
                            </div>

                            <Button
                                variant={isSubscribed ? 'outline' : 'default'}
                                onClick={handlePushToggle}
                                disabled={pushLoading || !isSupported || permission === 'denied'}
                            >
                                {pushLoading ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>Customize your visual experience</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Theme</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Switch between Light and Dark mode.
                                </div>
                            </div>
                            <ThemeToggle />
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/20">
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                            <CardDescription>Manage your account and session</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="font-medium">Session</div>
                                    <div className="text-sm text-muted-foreground mt-1">
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

                            {user?.role !== 'ADMIN' && (
                                <>
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="font-medium text-amber-600 dark:text-amber-500">Deactivate Account</div>
                                            <div className="text-sm text-muted-foreground mt-1">
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
                                            <div className="font-medium text-destructive">Delete Account</div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                Permanently remove your account and related data.
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            disabled={isBusy}
                                            onClick={handleDelete}
                                        >
                                            {accountAction === 'delete' ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    </div>
                                </>
                            )}

                            {accountError && (
                                <p className="text-sm text-destructive">{accountError}</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="text-center text-xs text-muted-foreground py-4">
                        Continuum v1.0.0 | Connected as {user?.name || `User #${user?.id ?? ''}`}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default SettingsPage;
