"use client";

/**
 * NAS Installer Page
 * Card: FI-INFRA-STR-014
 *
 * Interactive installation guide for NAS deployment and PC simulation
 * Philosophy: Visible instruction = reliable action
 */

import { useState } from "react";
import { ArrowLeft, Server, Laptop, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RealNASTab } from "@/components/infra/RealNASTab";
import { PCSimulationTab } from "@/components/infra/PCSimulationTab";
import { VerificationTab } from "@/components/infra/VerificationTab";
import { SERVICES } from "@/lib/nas-config";

export default function NASInstallerPage() {
  const [activeTab, setActiveTab] = useState("real-nas");

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </Link>
              <div className="h-6 w-px bg-slate-700" />
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-emerald-400" />
                <h1 className="text-lg font-semibold text-slate-50">NAS Installer</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <Card className="mb-8 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-50">Free Intelligence Deployment Guide</CardTitle>
            <CardDescription className="text-slate-400">
              Interactive installation guide for NAS deployment (Synology, TrueNAS, QNAP) or PC simulation.
              Choose your target environment below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Services Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SERVICES.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-300">{service.name}</div>
                    <div className="text-xs text-slate-500">
                      {service.workers ? `${service.workers} workers` : "Single instance"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-emerald-400">:{service.port}</div>
                    <div className="text-xs text-slate-500">{service.memory}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Table of Contents (Sticky) */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800/50 border-slate-700 sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm text-slate-50">Installation Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {[
                    { id: "real-nas", label: "Real NAS", icon: Server },
                    { id: "pc-simulation", label: "PC Simulation", icon: Laptop },
                    { id: "verification", label: "Verification", icon: CheckCircle2 },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          activeTab === item.id
                            ? "bg-emerald-500/20 text-emerald-400 font-medium"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Content */}
          <div className="lg:col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
                <TabsTrigger value="real-nas" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  <Server className="h-4 w-4 mr-2" />
                  Real NAS
                </TabsTrigger>
                <TabsTrigger value="pc-simulation" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  <Laptop className="h-4 w-4 mr-2" />
                  PC Simulation
                </TabsTrigger>
                <TabsTrigger value="verification" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verification
                </TabsTrigger>
              </TabsList>

              <TabsContent value="real-nas" className="mt-6">
                <RealNASTab />
              </TabsContent>

              <TabsContent value="pc-simulation" className="mt-6">
                <PCSimulationTab />
              </TabsContent>

              <TabsContent value="verification" className="mt-6">
                <VerificationTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
