import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, FileText, Shield, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            NoteSync
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Your unified workspace for notes across all cloud providers
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Sign In to Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Cloud className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Multi-Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect iCloud, Google, and Outlook accounts in one place
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Rich Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create and edit notes with formatting, attachments, and organization
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Share & Collaborate</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Share notes with secure links and collaborative editing
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Secure Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Keep your notes synchronized securely across all devices
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to organize your notes?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Sign in with your account to connect your note providers and start syncing
          </p>
          <Button 
            size="lg" 
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login-secondary"
          >
            Sign In Now
          </Button>
        </div>
      </div>
    </div>
  );
}