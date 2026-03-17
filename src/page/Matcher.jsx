import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function Matcher() {
    return (
        <div className="min-h-[80vh] bg-white flex items-center justify-center px-4">
            <div className="text-center max-w-lg">
                <div className="inline-flex items-center justify-center p-4 bg-blue-50 rounded-2xl mb-8">
                    <Sparkles className="h-12 w-12 text-blue-600 animate-pulse" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Resolute Matcher</h1>
                <p className="text-xl text-blue-600 font-medium mb-6">Coming Soon</p>
                <p className="text-gray-600 mb-10 leading-relaxed">
                    We're building an intelligent name matching engine that uses fuzzy logic to compare 
                    beneficiary names across different data sources, ensuring 100% confidence in your disbursements.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:text-blue-600 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Home
                </Link>
            </div>
        </div>
    );
}
