import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30">
            {/* Navigation */}
            <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="text-xl font-bold tracking-tighter text-white">
                        Continuum
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/login')}
                        className="text-gray-300 hover:text-white hover:bg-gray-800"
                    >
                        Sign In
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-br from-white via-gray-200 to-gray-600 bg-clip-text text-transparent">
                    Real-Time Skill Exchange.<br />
                    <span className="text-blue-500">Zero Content Fluff.</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                    Continuum matches you with peers to learn and teach any skill—from coding to creative writing—through live audio calls and screen sharing.
                </p>
                <div className="flex justify-center">
                    <Button
                        onClick={() => navigate('/login')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full transition-all hover:scale-105 shadow-lg shadow-blue-900/20"
                    >
                        Get Started
                    </Button>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 border-t border-gray-800 bg-gray-900/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-16 text-white">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-blue-500/30 transition-colors">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">1. Join the Network</h3>
                            <p className="text-gray-400">Sign up and build your profile. List the skills you can teach and the ones you want to master.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-purple-500/30 transition-colors">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">2. Get Matched</h3>
                            <p className="text-gray-400">Our system connects you with the perfect peer. You teach what you know, they teach what you need.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-green-500/30 transition-colors">
                            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">3. Voice & Screen</h3>
                            <p className="text-gray-400">Connect instantly via crystal-clear audio and low-latency screen sharing. No setup required.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features / Capabilities */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-16 text-white">Platform Capabilities</h2>
                <div className="grid md:grid-cols-2 gap-8">

                    {/* Active Feature: Audio */}
                    <div className="flex gap-4 p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Audio Calls</h3>
                            <p className="text-sm text-gray-400 mt-1">Available Now</p>
                            <p className="text-gray-300 mt-2">Low-latency voice chat for seamless conversation and mentorship.</p>
                        </div>
                    </div>

                    {/* Active Feature: Screen Share */}
                    <div className="flex gap-4 p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Screen Sharing</h3>
                            <p className="text-sm text-gray-400 mt-1">Available Now</p>
                            <p className="text-gray-300 mt-2">Share your context instantly. Perfect for pair programming, design reviews, or debugging.</p>
                        </div>
                    </div>

                    {/* Roadmap Feature: Video */}
                    <div className="flex gap-4 p-6 rounded-xl bg-gray-900 border border-gray-800 opacity-75">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-gray-300">Video Calls</h3>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-800">Coming Soon</span>
                            </div>
                            <p className="text-gray-500 mt-2">Face-to-face video interaction is currently in development.</p>
                        </div>
                    </div>

                    {/* Any Skill */}
                    <div className="flex gap-4 p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Any Skill</h3>
                            <p className="text-sm text-gray-400 mt-1">Available Now</p>
                            <p className="text-gray-300 mt-2">Design, Music, Coding, Physics. If you can teach it, you can exchange it.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-24 text-center border-t border-gray-800 bg-gradient-to-b from-black to-gray-900">
                <h2 className="text-3xl font-bold mb-8 text-white">Start exchanging skills today.</h2>
                <Button
                    onClick={() => navigate('/login')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full transition-all hover:scale-105 shadow-lg shadow-blue-900/30"
                >
                    Get Started
                </Button>
            </section>

            <footer className="py-8 text-center text-gray-600 text-sm border-t border-gray-900">
                &copy; {new Date().getFullYear()} Project Continuum.
            </footer>
        </div>
    );
};

export default LandingPage;
