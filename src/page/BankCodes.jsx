import { useState, useMemo, useEffect } from 'react';
import { Search, Building2, Copy, CheckCircle, ArrowLeft, ArrowUp, Menu, X, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';

import BANK_CODES from '../utils/bankCodes';

export default function BankCodes() {
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedCode, setCopiedCode] = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [isNavOpen, setIsNavOpen] = useState(false);

    const categories = ["All", "Commercial", "Microfinance"];
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredBanks = useMemo(() => {
        let results = BANK_CODES;
        
        if (activeCategory !== "All") {
            results = results.filter(bank => bank.category === activeCategory);
        }

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            results = results.filter(bank =>
                bank.name.toLowerCase().includes(search) ||
                bank.code.includes(search)
            );
        }

        return results;
    }, [searchTerm, activeCategory]);

    // Group banks by first letter for the jump bar
    const letters = useMemo(() => {
        const set = new Set(filteredBanks.map(b => b.name[0].toUpperCase()));
        return Array.from(set).sort();
    }, [filteredBanks]);

    const handleJumpToLetter = (letter) => {
        const element = document.getElementById(`letter-${letter}`);
        if (element) {
            const offset = 40; // Minimal offset since header is no longer sticky
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setIsNavOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-white transition-colors duration-300 pb-24">
            {/* Simple Top Header */}
            <div className="bg-white border-b border-gray-100 pb-12 pt-12 sm:pt-16 transition-all">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-6">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Bank Directory</h1>
                            <p className="text-gray-500 text-sm">Reference list for {BANK_CODES.length} financial institutions.</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 sm:w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or code..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all bg-gray-50 text-gray-900 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-12">
                {/* Info Tip */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-12 flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <p className="text-sm text-amber-800 font-medium">
                        Click any code to copy. These codes are required for CSV batch uploads.
                    </p>
                </div>

                {/* Banks List Grouped by Letter */}
                {filteredBanks.length > 0 ? (
                    <div className="space-y-12">
                        {letters.map(letter => (
                            <div key={letter} id={`letter-${letter}`} className="scroll-mt-12">
                                <div className="flex items-center gap-4 mb-6 pt-4">
                                    <span className="text-3xl font-black text-blue-600 opacity-20">{letter}</span>
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredBanks
                                        .filter(b => b.name[0].toUpperCase() === letter)
                                        .map((bank, index) => (
                                            <div
                                                key={`${bank.code}-${index}`}
                                                className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-600/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group relative"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${
                                                            bank.category === 'Commercial' ? 'text-blue-500' : 'text-purple-500'
                                                        }`}>
                                                            {bank.category}
                                                        </span>
                                                        <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors mb-4 pr-8 line-clamp-2 min-h-[3rem]">
                                                            {bank.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center px-4 py-1.5 rounded-xl bg-gray-50 text-gray-900 font-mono font-black text-sm border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                                                                {bank.code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopy(bank.code)}
                                                        className="absolute top-4 right-4 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all group-hover:scale-110 active:scale-95 shadow-sm"
                                                        title="Copy code"
                                                    >
                                                        {copiedCode === bank.code ? (
                                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-3xl border border-gray-100 p-20 text-center">
                        <div className="inline-flex items-center justify-center p-6 bg-white rounded-2xl mb-6 shadow-xl shadow-gray-200/50">
                            <Search className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No matching banks</h3>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto">We couldn't find any "{activeCategory !== 'All' ? activeCategory : ''}" banks matching "{searchTerm}"</p>
                        <button
                            onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-900/20"
                        >
                            Reset Directory
                        </button>
                    </div>
                )}

                {/* Guidelines */}
                <div className="mt-16 border-t border-gray-100 pt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">How to use these codes</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <div className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold mb-4">1</div>
                            <h4 className="font-bold mb-2">Single Check</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">Enter the account number and its corresponding bank code in the validator form.</p>
                        </div>
                        <div>
                            <div className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold mb-4">2</div>
                            <h4 className="font-bold mb-2">Batch Processing</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">Ensure your CSV has a <code className="bg-gray-100 px-1 rounded">bankCode</code> column matching these codes.</p>
                        </div>
                        <div>
                            <div className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold mb-4">3</div>
                            <h4 className="font-bold mb-2">Exporting</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">Your exported results will maintain these codes for easy integration with other tools.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Navigation Trigger */}
            <button
                onClick={() => setIsNavOpen(true)}
                className={`fixed bottom-8 left-8 p-5 bg-gray-900 text-white rounded-2xl shadow-2xl transition-all duration-300 transform z-50 hover:bg-black hover:scale-110 flex items-center gap-3 active:scale-95 group`}
                title="Quick Navigation"
            >
                <LayoutGrid className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                <span className="text-sm font-bold pr-2 hidden sm:inline">Navigate</span>
            </button>

            {/* Navigation Modal */}
            {isNavOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsNavOpen(false)}></div>
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Quick Navigation</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Jump to any category or letter</p>
                            </div>
                            <button 
                                onClick={() => setIsNavOpen(false)}
                                className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            {/* Categories in Modal */}
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Filter by Group</h4>
                                <div className="flex flex-wrap gap-3">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setActiveCategory(cat); setIsNavOpen(false); }}
                                            className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border ${
                                                activeCategory === cat 
                                                ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20 scale-105" 
                                                : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                                            }`}
                                        >
                                            {cat}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-lg ${
                                                activeCategory === cat ? "bg-white/20" : "bg-gray-200"
                                            }`}>
                                                {BANK_CODES.filter(b => b.category === cat).length}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Letter Jump in Modal */}
                            {letters.length > 1 && (
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Jump to Letter</h4>
                                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                                        {letters.map(letter => (
                                            <button
                                                key={letter}
                                                onClick={() => handleJumpToLetter(letter)}
                                                className="aspect-square flex items-center justify-center rounded-xl bg-gray-50 border border-transparent text-sm font-bold text-gray-900 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90"
                                            >
                                                {letter}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-8 bg-gray-50 font-medium text-center">
                            <p className="text-xs text-gray-400">Showing {filteredBanks.length} results based on your current filters.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Scroll to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full shadow-2xl transition-all duration-300 transform z-50 hover:bg-blue-700 hover:scale-110 ${
                    showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                }`}
                title="Scroll to Top"
            >
                <ArrowUp className="h-6 w-6" />
            </button>
        </div>
    );
}
