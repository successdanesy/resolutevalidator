import { Link } from "react-router-dom";
import { Building2, Menu, X } from "lucide-react";
import { useState } from "react";
import { GradientSlideButton } from "@/components/ui/gradient-slide-button";

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Validator", path: "/validator" },
        { name: "Bank Codes", path: "/bank-codes" },
        { name: "Matcher", path: "/matcher" },
    ];

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-[1000] transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-2 group">
                        <img src="/favicon.svg" alt="Resolute Validator Logo" className="h-6 w-6 transition-transform group-hover:scale-110" />
                        <span className="text-xl font-bold tracking-tight text-gray-900">Resolute Validator</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                        
                        <Link to="/validator">
                            <GradientSlideButton
                                bgColor="#2563eb"
                                colorFrom="#ffffff"
                                colorTo="#e2e8f0"
                                className="rounded-xl font-bold shadow-lg shadow-blue-500/20 text-white hover:text-blue-600"
                            >
                                Get Started
                            </GradientSlideButton>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            className="p-2 text-gray-900"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-100 py-4">
                    <div className="flex flex-col px-4 gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-2"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
