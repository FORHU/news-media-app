import React from 'react';
import {
    FileText,
    Globe,
    Link as LinkIcon,
    TrendingUp,
    Activity,
    Clock,
    ArrowUpRight
} from 'lucide-react';

const StatCard = ({ title, value, icon, color, description }: any) => (
    <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${color} shadow-sm transition-all group-hover:shadow-md`}>
                {React.cloneElement(icon, { className: `w-5 h-5 md:w-6 md:h-6 text-white` })}
            </div>
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">{title}</p>
            <h3 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">{value}</h3>
            {description && <p className="text-[10px] md:text-xs text-gray-500 mt-2 font-medium">{description}</p>}
        </div>
    </div>
);

export default function DashboardPage() {
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#ff4500] font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">
                    <Activity className="w-3.5 h-3.5 md:w-4 h-4" />
                    System Overview
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                <p className="text-sm md:text-base text-gray-500 font-medium">Real-time performance and metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Generated Articles"
                    value="0"
                    description="+0 from last week"
                    icon={<FileText />}
                    color="bg-blue-600"
                />
                <StatCard
                    title="Crawled Articles"
                    value="0"
                    description="+0 from today"
                    icon={<Globe />}
                    color="bg-green-600"
                />
                <StatCard
                    title="Crawled URLs"
                    value="0"
                    description="Across 0 sources"
                    icon={<LinkIcon />}
                    color="bg-purple-600"
                />
                <StatCard
                    title="Active Crawlers"
                    value="0"
                    description="System health: 100%"
                    icon={<TrendingUp />}
                    color="bg-[#ff4500]"
                />
            </div>

            {/* Lower Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-6 md:mb-8">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-900">Recent Activity</h2>
                            <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">Monitor live logs.</p>
                        </div>
                        <button className="text-xs md:text-sm font-bold text-[#ff4500] hover:underline">View All</button>
                    </div>

                    <div className="py-12 md:py-20 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Clock className="w-6 h-6 md:w-8 md:h-8 text-gray-300" />
                        </div>
                        <div className="space-y-1 px-4">
                            <h3 className="text-sm md:text-base font-bold text-gray-900">No Activity Yet</h3>
                            <p className="text-[11px] md:text-sm text-gray-400 max-w-[240px] font-medium leading-relaxed mx-auto">
                                Once the system starts crawling, logs will appear here.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col group hover:shadow-md transition-all">
                    <div className="relative z-10">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">System Status</h2>
                        <p className="text-gray-400 text-xs md:text-sm font-medium mb-6 md:mb-8">Efficiency metrics.</p>

                        <div className="space-y-4 md:space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest">System Load</span>
                                <span className="text-xl md:text-2xl font-black text-gray-900">0%</span>
                            </div>
                            <div className="w-full h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="w-0 h-full bg-[#ff4500] rounded-full transition-all duration-1000"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 md:mt-auto pt-4 md:pt-8 relative z-10">
                        <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 transition-colors group-hover:bg-orange-50/30">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Update</p>
                            <p className="text-xs md:text-sm font-bold text-gray-700">{new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>

                    {/* Decorative element */}
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 md:w-40 md:h-40 bg-orange-100 rounded-full blur-[60px] md:blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
                </div>
            </div>
        </div>
    );
}

