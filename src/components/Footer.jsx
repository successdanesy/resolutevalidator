import { Mail, Phone, Globe, Github, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-100 py-16 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/favicon.svg" alt="Resolute Validator Logo" className="h-6 w-6" />
                            <h3 className="text-xl font-bold text-gray-900">Resolute Validator</h3>
                        </div>
                        <p className="text-gray-600 max-w-sm text-sm leading-relaxed mb-6">
                            High-performance account validation for modern financial workflows.
                            Built for speed, accuracy, and reliability.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://www.linkedin.com/in/success-chu/" className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                            <a href="https://github.com/successdanesy/resolutevalidator.git" className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Github className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Product</h4>
                        <ul className="space-y-3">
                            <li><a href="/validator" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Batch Validator</a></li>
                            <li><a href="/bank-codes" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Bank Directory</a></li>
                            <li><a href="/matcher" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Resolute Matcher</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Contact</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4" />
                                <span>successdanesy@gmail.com</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>+234 708 819 3394</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-600 pt-2">
                                <Globe className="h-4 w-4" />
                                <a
                                    href="https://successdanesy.vercel.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-600 transition-colors font-medium"
                                >
                                    Built by &lt;SuccessDanesy/&gt;
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Success Chukwuemeka. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <a href="#" className="text-xs text-gray-500 hover:text-gray-900">Privacy Policy</a>
                        <a href="#" className="text-xs text-gray-500 hover:text-gray-900">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
