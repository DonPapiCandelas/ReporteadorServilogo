import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = ({ children, title }) => {
    const { user, logout, companyKey, setCompanyKey, companies } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-text-main antialiased selection:bg-primary/30">
            {/* Sidebar */}
            <aside className={`w-56 bg-surface h-full flex flex-col border-r border-border flex-shrink-0 z-20 transition-transform duration-300 absolute md:relative ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded bg-primary flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-[18px]">query_stats</span>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold tracking-tight">ANALYSIS_CORE</h1>
                            <span className="text-[9px] text-text-sub uppercase font-mono tracking-widest">v2.4.0-stable</span>
                        </div>
                        {/* Mobile Close Button */}
                        <button className="md:hidden ml-auto text-text-sub" onClick={() => setMobileOpen(false)}>✕</button>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">Navigation</p>
                        <div className="space-y-0.5">
                            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                                <span className="material-symbols-outlined icon">terminal</span>
                                <span>Dashboard</span>
                            </Link>
                            {/* Placeholders for other links from template if needed, or just keep existing functionality */}
                            {user?.is_admin && (
                                <Link to="/admin" className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                                    <span className="material-symbols-outlined icon">settings</span>
                                    <span>Admin Console</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>

                <div className="p-3 border-t border-border bg-background/50">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-7 h-7 rounded bg-cover bg-center border border-border bg-primary flex items-center justify-center text-white font-bold text-xs">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate">{user?.username || 'User'}</p>
                            <p className="text-[9px] text-text-sub font-mono truncate uppercase tracking-tighter">{user?.is_admin ? 'Administrator' : 'Consultant'}</p>
                        </div>
                        <button onClick={logout} className="material-symbols-outlined text-text-sub text-[16px] hover:text-white transition-colors" title="Logout">logout</button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <button className="md:hidden text-text-sub" onClick={toggleMobileSidebar}>☰</button>

                        {/* Search / Company Selector */}
                        <div className="relative w-full max-w-xs flex items-center gap-2">
                            <span className="text-[10px] uppercase text-text-sub font-bold hidden sm:block">Company:</span>
                            <select
                                value={companyKey || ""}
                                onChange={(e) => setCompanyKey(e.target.value)}
                                className="bg-background border border-border rounded text-[11px] py-1 px-2 focus:border-primary/50 outline-none text-text-main w-full"
                            >
                                {(companies || []).map((c) => (
                                    <option key={c.key} value={c.key}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="hidden sm:flex items-center gap-2 ml-2">
                            <span className="size-1.5 rounded-full bg-success"></span>
                            <span className="text-[10px] font-mono text-success uppercase">System Online</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 font-mono text-[10px] text-text-sub">
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="h-4 w-[1px] bg-border mx-1 hidden md:block"></div>
                        <button className="relative text-text-sub hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-danger rounded-full ring-1 ring-surface"></span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto space-y-4">
                        {/* Page Title Section */}
                        <div className="flex items-end justify-between border-b border-border pb-3">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">{title}</h2>
                                <p className="text-[10px] text-text-sub font-mono mt-0.5">SESSION: {user?.username?.toUpperCase()}</p>
                            </div>
                        </div>

                        {children}
                    </div>

                    <footer className="max-w-[1600px] mx-auto mt-8 border-t border-border pt-4 flex justify-between items-center font-mono text-[9px] text-text-sub pb-4">
                        <p>SYSTEM_CORE_FOOTPRINT: v2.4.0-stable // (C) 2024 FINREPORT ANALYTICS CORP.</p>
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
