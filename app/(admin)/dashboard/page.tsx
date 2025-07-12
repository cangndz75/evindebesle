"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Filter, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hoşgeldin</h1>
          <p className="text-muted-foreground">
            Burada genel istatistikleri ve önemli bilgileri görebilirsin.
          </p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search..." className="max-w-sm" />
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl">12,345</CardTitle>
            <p className="text-green-500 text-sm">+12%</p>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-muted rounded-full">
              <div className="h-full bg-blue-500 w-[75%] rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-2xl">$45,678</CardTitle>
            <p className="text-green-500 text-sm">+8.2%</p>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-muted rounded-full">
              <div className="h-full bg-green-500 w-[60%] rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Active Sessions</CardDescription>
            <CardTitle className="text-2xl">2,456</CardTitle>
            <p className="text-purple-500 text-sm">+15%</p>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-muted rounded-full">
              <div className="h-full bg-purple-500 w-[50%] rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Page Views</CardDescription>
            <CardTitle className="text-2xl">34,567</CardTitle>
            <p className="text-red-500 text-sm">-2.4%</p>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-muted rounded-full">
              <div className="h-full bg-orange-500 w-[40%] rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Revenue Analytics</CardTitle>
            <CardDescription>Monthly revenue performance</CardDescription>
          </div>
          <Button variant="outline">Last 6 months</Button>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
            Chart placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
