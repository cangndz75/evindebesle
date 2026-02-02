"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, MousePointerClick } from "lucide-react";

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Advanced Analytics</h1>
                <p className="text-gray-500 mt-2">
                    Funnel analysis, cohort tracking, and heatmap insights
                </p>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="funnels">Funnels</TabsTrigger>
                    <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
                    <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Events (7d)
                                </CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-muted-foreground">
                                    Event tracking not yet active
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Active Sessions
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-muted-foreground">
                                    No session data yet
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Conversion Rate
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-muted-foreground">
                                    Configure funnels to track
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Heatmap Clicks
                                </CardTitle>
                                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-muted-foreground">
                                    Click tracking active (10% sample)
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Getting Started</CardTitle>
                            <CardDescription>
                                Your advanced analytics system is now active
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold">✅ Completed Setup</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    <li>Database schema created with analytics models</li>
                                    <li>Event tracking utility installed</li>
                                    <li>API endpoints configured for tracking</li>
                                    <li>Heatmap click tracking enabled (10% sampling)</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold">📊 Next Steps</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    <li>Create your first funnel in the "Funnels" tab</li>
                                    <li>View cohort analysis in the "Cohorts" tab</li>
                                    <li>Explore user clicks in the "Heatmaps" tab</li>
                                    <li>Events are automatically tracked across your site</li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                                <h3 className="font-semibold text-blue-900">Available Event Types</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                                    <div>• PAGE_VIEW</div>
                                    <div>• VIEW_PRODUCT</div>
                                    <div>• ADD_TO_CART</div>
                                    <div>• REMOVE_FROM_CART</div>
                                    <div>• BEGIN_CHECKOUT</div>
                                    <div>• PURCHASE</div>
                                    <div>• SEARCH</div>
                                    <div>• SIGNUP</div>
                                    <div>• LOGIN</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Funnels  Tab */}
                <TabsContent value="funnels">
                    <Card>
                        <CardHeader>
                            <CardTitle>Funnel Analysis</CardTitle>
                            <CardDescription>
                                Track conversion rates through multi-step user journeys
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">
                                    Funnel management UI coming soon
                                </p>
                                <p className="text-sm text-gray-400">
                                    Use the API at <code className="bg-gray-100 px-2 py-1 rounded">/api/admin/analytics/funnels</code> to create funnels
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Cohorts Tab */}
                <TabsContent value="cohorts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cohort Analysis</CardTitle>
                            <CardDescription>
                                Analyze user retention and revenue by cohort groups
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">
                                    Cohort visualization coming soon
                                </p>
                                <p className="text-sm text-gray-400">
                                    Use the API at <code className="bg-gray-100 px-2 py-1 rounded">/api/admin/analytics/cohorts</code> to get cohort data
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Heatmaps Tab */}
                <TabsContent value="heatmaps">
                    <Card>
                        <CardHeader>
                            <CardTitle>Click Heatmaps</CardTitle>
                            <CardDescription>
                                Visualize where users click on your pages
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">
                                    Heatmap visualization coming soon
                                </p>
                                <p className="text-sm text-gray-400">
                                    Click data is being collected at 10% sampling rate
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
