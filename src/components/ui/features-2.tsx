import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Upload, Zap, Download } from 'lucide-react'
import { ReactNode } from 'react'

export function UserFlow() {
    return (
        <section className="py-24 md:py-32 bg-white border-t border-gray-100 transition-colors">
            <div className="@container mx-auto max-w-5xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-balance text-4xl font-black lg:text-5xl text-gray-900 tracking-tight uppercase leading-none">
                        Three Steps to <br />
                        <span className="text-blue-600">Automation</span>
                    </h2>
                    <p className="mt-6 text-gray-500 font-medium max-w-2xl mx-auto">
                        Validate your entire payroll list in minutes. Our streamlined engine handles the complexity of banking nodes in the background.
                    </p>
                </div>
                <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-8 *:text-center md:mt-16 md:grid-cols-3 md:max-w-none">
                    <Card className="group border-0 bg-gray-50/50 shadow-none rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Upload className="size-6 text-blue-600" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-black text-gray-900 uppercase tracking-tight">01. Upload CSV</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Drag and drop your account list. We provide a standardized CSV template to guide your formatting.</p>
                        </CardContent>
                    </Card>

                    <Card className="group border-0 bg-gray-50/50 shadow-none rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Zap className="size-6 text-blue-600" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-black text-gray-900 uppercase tracking-tight">02. Smart Validate</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Our high-speed engine processes thousands of records simultaneously across multiple banking nodes.</p>
                        </CardContent>
                    </Card>

                    <Card className="group border-0 bg-gray-50/50 shadow-none rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Download className="size-6 text-blue-600" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-black text-gray-900 uppercase tracking-tight">03. Export Results</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">Download a cleaned list with full account names and validation statuses ready for immediate use.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div aria-hidden className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
        <div className="absolute inset-0 [--border:rgba(59,130,246,0.1)] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px]"/>
        <div className="bg-white absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l border-gray-100 shadow-sm rounded-lg group-hover:scale-110 group-hover:shadow-blue-500/10 transition-transform duration-500">{children}</div>
    </div>
)
