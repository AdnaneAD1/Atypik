'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export function ParentTracking() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Track Your Child&apos;s Journey</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Live Location Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Map view will be implemented here</p>
            </div>
          </CardContent>
        </Card>

        {/* Journey Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Journey Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Driver</p>
              <p className="text-sm text-gray-500">John Smith</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Estimated Arrival</p>
              <p className="text-sm text-gray-500">3:30 PM</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Status</p>
              <p className="text-sm text-gray-500">En route to school</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}