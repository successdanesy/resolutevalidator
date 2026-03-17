import { Link } from "react-router-dom";
import { CheckCircle2, Zap, Shield, BarChart3, ArrowRight, Star } from "lucide-react";
import { GlowyWavesHero } from "@/components/ui/glowy-waves-hero-shadcnui";
import { GradientSlideButton } from "@/components/ui/gradient-slide-button";
import FeatureSection from "@/components/ui/feature-section";
import { UserFlow } from "@/components/ui/features-2";

export default function Home() {
    return (
        <div className="bg-white min-h-screen transition-colors duration-300">
            {/* Animated Hero Section */}
            <GlowyWavesHero />

            {/* The Story Section */}
            <FeatureSection />

            {/* Technical Architecture Section */}
            <section className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-3 gap-16 items-start">
                    <div className="lg:sticky lg:top-32">
                        <h2 className="text-4xl font-black text-gray-900 mb-6 tracking-tighter uppercase leading-none">The <br />Architecture</h2>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">
                            Built for high-volume financial operations. We've abstracted the complexity of banking integrations into a seamless, high-speed engine.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl text-blue-700 text-xs font-bold uppercase tracking-widest transition-colors">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                            Engine v2.0 optimized
                        </div>
                    </div>

                    <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                        {[
                            {
                                id: "01",
                                title: "Input Normalization",
                                tech: "System Sanitization",
                                desc: "We transform messy CSV data into clean system objects, automatically fixing malformed headers and messy encodings."
                            },
                            {
                                id: "02",
                                title: "High-Speed Batching",
                                tech: "Parallel Validation",
                                desc: "Validating thousands of records simultaneously across 300+ integrated banking nodes for maximum coverage and throughput."
                            },
                            {
                                id: "03",
                                title: "Background Processing",
                                tech: "Persistent Jobs",
                                desc: "Validation runs in the background. You can safely close your browser and return later to track progress or fetch your results."
                            },
                            {
                                id: "04",
                                title: "Verified Outputs",
                                tech: "Schema Mapping",
                                desc: "Results are mapped directly to your disbursement format, providing high-integrity lists ready for immediate financial use."
                            },
                        ].map((item, i) => (
                            <div key={i} className="group p-8 bg-white border border-gray-100 rounded-[2rem] hover:border-gray-900 transition-all relative overflow-hidden h-full flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-xs font-black text-blue-600 font-mono tracking-widest">{item.id}</span>
                                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                        <Zap className="h-4 w-4" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">{item.title}</h3>
                                <div className="inline-block self-start px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded mb-4 uppercase tracking-tighter transition-colors">
                                    {item.tech}
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed font-medium mt-auto">{item.desc}</p>

                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* User Flow Section */}
            <UserFlow />

            {/* Reviews Section */}
            <section className="py-24 bg-gray-900 text-white overflow-hidden relative transition-colors">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 tracking-tight">Trusted by Professionals</h2>
                        <p className="text-gray-400 font-medium">Join teams who have reclaimed their time with Resolute.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: "Folake A.", role: "Ops Lead", text: "What used to take my team a whole weekend now happens during my lunch break. Incredible speed." },
                            { name: "Chidi O.", role: "Finance Officer", text: "The accuracy is what impressed me most. We haven't had a single failed transfer since we started using Resolute." },
                            { name: "Samuel T.", role: "HR Manager", text: "The batch upload feature is a life-saver for payroll days. It's so simple even my non-tech staff use it with ease." },
                        ].map((review, i) => (
                            <div key={i} className="bg-gray-800/50 p-10 rounded-3xl border border-gray-700/50 backdrop-blur-sm transition-colors">
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-blue-500 text-blue-500" />)}
                                </div>
                                <p className="text-gray-300 italic mb-8 leading-relaxed">"{review.text}"</p>
                                <div>
                                    <p className="font-bold text-lg">{review.name}</p>
                                    <p className="text-xs font-bold uppercase tracking-widest text-blue-500">{review.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 text-center px-4">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-10 tracking-tight">Ready to reclaim your time?</h2>
                <Link to="/validator">
                    <GradientSlideButton
                        bgColor="#2563eb"
                        colorFrom="#ffffff"
                        colorTo="#e2e8f0"
                        className="rounded-2xl text-base font-black px-10 h-14 uppercase tracking-widest shadow-xl shadow-blue-500/20 text-white hover:text-blue-600 gap-3"
                    >
                        Start Processing Now <ArrowRight className="h-5 w-5" />
                    </GradientSlideButton>
                </Link>
            </section>
        </div>
    );
}
