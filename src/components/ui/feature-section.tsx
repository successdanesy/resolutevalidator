"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const tasks = [
  {
    title: "Manual NUBAN Entry",
    subtitle: "Staff split 1,000+ codes",
    icon: <Clock className="w-4 h-4 text-red-500" />,
  },
  {
    title: "Days of Processing",
    subtitle: "2-3 business days per batch",
    icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
  },
  {
    title: "Human Error Risk",
    subtitle: "Typos lead to failed transfers",
    icon: <Shield className="w-4 h-4 text-gray-400" />,
  },
  {
    title: "Resolute Batching",
    subtitle: "5,000 accounts in 15 mins",
    icon: <Zap className="w-4 h-4 text-blue-500" />,
  },
  {
    title: "Verified Success",
    subtitle: "99.9% validation accuracy",
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
  {
    title: "Direct API Sync",
    subtitle: "Real-time bank node verification",
    icon: <FileText className="h-4 w-4 text-purple-500" />,
  },
];

export default function FeatureSection() {
  return (
    <section className="relative w-full py-24 px-4 bg-white text-gray-900 border-y border-gray-100 transition-colors">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 items-center gap-16">
        {/* LEFT SIDE - Content */}
        <div className="space-y-8 order-1 md:order-1">
          <Badge variant="secondary" className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border-blue-100/50 rounded-lg">
            Our Evolution
          </Badge>

          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-[1.1]">
              The Story Behind <br />
              <span className="text-blue-600">Resolute Validator</span>
            </h2>

            <p className="text-gray-600 text-lg leading-relaxed font-medium">
              Before Resolute, teams manually verified accounts in banking apps.
              A batch of 1,000 would take days of grueling, error-prone effort.
            </p>

            <p className="text-gray-600 text-lg leading-relaxed font-medium">
              We rebuilt the engine from scratch. What took days now takes minutes, giving you
              enterprise-grade speed without compromising on absolute accuracy.
            </p>
          </div>

          <div className="flex gap-4 flex-wrap pt-4">
            <div className="flex items-center gap-2 group">
              <div className="h-2 w-2 rounded-full bg-blue-600 group-hover:scale-150 transition-transform"></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">98% Efficient</span>
            </div>
            <div className="flex items-center gap-2 group">
              <div className="h-2 w-2 rounded-full bg-blue-600 group-hover:scale-150 transition-transform"></div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Zero Fatigue</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Task Loop */}
        <div className="relative w-full max-w-sm mx-auto md:mx-0 order-2 md:order-2">
          <Card className="overflow-hidden bg-white border border-gray-100 shadow-2xl rounded-[2rem]">
            <CardContent className="relative h-[360px] p-0 overflow-hidden">
              <div className="relative h-full overflow-hidden">
                <motion.div
                  className="flex flex-col gap-2 absolute w-full p-4"
                  animate={{ y: ["0%", "-50%"] }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 16,
                    ease: "linear",
                  }}
                >
                  {[...tasks, ...tasks].map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-5 py-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 relative group hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between flex-1">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                            {task.icon}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-none mb-1">{task.title}</p>
                            <p className="text-[11px] text-gray-500 font-medium">{task.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Fade effects */}
                <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
