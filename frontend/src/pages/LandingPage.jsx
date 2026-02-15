import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../auth/AuthContext';
import { UserPlus, Zap, Mic, Volume2, Monitor, Video, FlaskConical } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    // Redirect to app if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate('/app', { replace: true });
        }
    }, [user, loading, navigate]);

    // Show nothing while checking auth to prevent flash
    if (loading) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500/30 transition-colors">
            {/* Navigation */}
            <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/50 backdrop-blur-md sticky top-0 z-50 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="text-xl font-bold tracking-tighter text-gray-900 dark:text-white">
                        Continuum
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/login')}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        Sign In
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-600 bg-clip-text text-transparent">
                    Real-Time Skill Exchange.<br />
                    <span className="text-blue-600 dark:text-blue-500">Zero Content Fluff.</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                    Continuum matches you with peers to learn and teach any skill—from coding to creative writing—through live audio calls and screen sharing.
                </p>
                <div className="flex justify-center">
                    <Button
                        onClick={() => navigate('/login')}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-full px-8 py-6 h-auto shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 transition-all hover:scale-105"
                    >
                        Get Started
                    </Button>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 border-t border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-900/30 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-500/30 transition-colors shadow-sm hover:shadow-md">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center mb-6">
                                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Join the Network</h3>
                            <p className="text-gray-500 dark:text-gray-400">Sign up and build your profile. List the skills you can teach and the ones you want to master.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors shadow-sm hover:shadow-md">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 rounded-lg flex items-center justify-center mb-6">
                                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Get Matched</h3>
                            <p className="text-gray-500 dark:text-gray-400">Our system connects you with the perfect peer. You teach what you know, they teach what you need.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-500/30 transition-colors shadow-sm hover:shadow-md">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/10 rounded-lg flex items-center justify-center mb-6">
                                <Mic className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Voice & Screen</h3>
                            <p className="text-gray-500 dark:text-gray-400">Connect instantly via crystal-clear audio and low-latency screen sharing. No setup required.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features / Capabilities */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">Platform Capabilities</h2>
                <div className="grid md:grid-cols-2 gap-8">

                    {/* Active Feature: Audio */}
                    <div className="flex gap-4 p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                            <Volume2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Audio Calls</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Available Now</p>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">Low-latency voice chat for seamless conversation and mentorship.</p>
                        </div>
                    </div>

                    {/* Active Feature: Screen Share */}
                    <div className="flex gap-4 p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                            <Monitor className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Screen Sharing</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Available Now</p>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">Share your context instantly. Perfect for pair programming, design reviews, or debugging.</p>
                        </div>
                    </div>

                    {/* Roadmap Feature: Video */}
                    <div className="flex gap-4 p-6 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 opacity-75 transition-colors">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">Video Calls</h3>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Coming Soon</span>
                            </div>
                            <p className="text-gray-500 mt-2">Face-to-face video interaction is currently in development.</p>
                        </div>
                    </div>

                    {/* Any Skill */}
                    <div className="flex gap-4 p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center">
                            <FlaskConical className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Any Skill</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Available Now</p>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">Design, Music, Coding, Physics. If you can teach it, you can exchange it.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-24 text-center border-t border-gray-200 dark:border-gray-800 bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-gray-900 transition-colors">
                <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Start exchanging skills today.</h2>
                <Button
                    onClick={() => navigate('/login')}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-full px-8 py-6 h-auto shadow-lg shadow-blue-500/20 dark:shadow-blue-900/30 transition-all hover:scale-105"
                >
                    Get Started
                </Button>
            </section>

            <footer className="py-8 text-center text-gray-400 dark:text-gray-600 text-sm border-t border-gray-200 dark:border-gray-900 transition-colors">
                &copy; {new Date().getFullYear()} Project Continuum.
            </footer>
        </div>
    );
};

export default LandingPage;
