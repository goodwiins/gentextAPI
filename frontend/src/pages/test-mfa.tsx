import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  Shield,
  Key,
  TestTube
} from "lucide-react";
import PhoneSetup from "@/components/auth/phone-setup";
import MfaSettings from "@/components/auth/mfa-settings";
import { toast } from "react-hot-toast";

export default function TestMfaPage() {
  const [password, setPassword] = useState("");
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pass' | 'fail' | 'pending';
    message?: string;
  }>>([]);

  const addTestResult = (test: string, status: 'pass' | 'fail', message?: string) => {
    setTestResults(prev => [...prev, { test, status, message }]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <TestTube className="h-8 w-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">SMS MFA Testing</h1>
          </div>
          <p className="text-gray-600">
            Comprehensive testing for Appwrite SMS Multi-Factor Authentication
          </p>
        </div>

        {/* Configuration Note */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Before Testing:</strong> Ensure you have configured:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Mock phone numbers in Appwrite Console (Auth → Security → Mock phone numbers)</li>
              <li>Twilio provider in Appwrite (Auth → Settings → Messaging)</li>
              <li>Phone authentication enabled in Appwrite (Auth → Settings)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Password Input */}
        <Card>
          <CardHeader>
            <CardTitle>User Password (Required)</CardTitle>
            <CardDescription>
              Enter your account password for phone number verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Testing Tabs */}
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">
              <Phone className="mr-2 h-4 w-4" />
              Phone Setup
            </TabsTrigger>
            <TabsTrigger value="mfa">
              <Shield className="mr-2 h-4 w-4" />
              MFA Settings
            </TabsTrigger>
            <TabsTrigger value="mock">
              <TestTube className="mr-2 h-4 w-4" />
              Mock Testing
            </TabsTrigger>
            <TabsTrigger value="results">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Test Results
            </TabsTrigger>
          </TabsList>

          {/* Phone Setup Tab */}
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Add & Verify Phone Number</CardTitle>
                <CardDescription>
                  Add your phone number and verify it with SMS code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhoneSetup
                  password={password}
                  onSuccess={() => {
                    toast.success("Phone setup completed!");
                    addTestResult("Phone Setup", "pass", "Phone number verified successfully");
                  }}
                  onError={(error) => {
                    addTestResult("Phone Setup", "fail", error);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* MFA Settings Tab */}
          <TabsContent value="mfa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Enable SMS MFA</CardTitle>
                <CardDescription>
                  Configure and manage SMS-based multi-factor authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MfaSettings />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mock Testing Tab */}
          <TabsContent value="mock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mock Number Testing (Free)</CardTitle>
                <CardDescription>
                  Test with Appwrite mock numbers - no SMS sent, no cost
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <TestTube className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Mock Testing Steps:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                      <li>Generate a mock number in Appwrite Console</li>
                      <li>Use the mock number in Phone Setup (e.g., +1234567890)</li>
                      <li>Use the fixed OTP code shown in Console (e.g., 123456)</li>
                      <li>No actual SMS will be sent</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Mock Configuration Example:</h4>
                  <div className="space-y-1 font-mono text-xs">
                    <div><strong>Mock Phone:</strong> +1234567890</div>
                    <div><strong>Mock OTP:</strong> 123456</div>
                    <div><strong>Cost:</strong> $0 (Free)</div>
                  </div>
                </div>

                <Alert variant="default" className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Recommended:</strong> Use mock numbers for 90% of testing to avoid SMS costs
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Twilio Test Credentials (Free)</CardTitle>
                <CardDescription>
                  Test API integration without sending real SMS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Twilio Magic Numbers:</h4>
                  <div className="space-y-1 font-mono text-xs">
                    <div><strong>Valid Test Number:</strong> +15005550006</div>
                    <div><strong>Invalid Number:</strong> +15005550001</div>
                    <div><strong>Cost:</strong> $0 (No SMS sent)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real SMS Testing (Uses Credits)</CardTitle>
                <CardDescription>
                  Test with your actual phone number
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                  <Key className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Cost:</strong> ~$0.008 per SMS. Use sparingly for final validation only.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Real SMS Testing Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Use your actual phone number in E.164 format</li>
                    <li>Wait for SMS delivery (5-30 seconds)</li>
                    <li>Enter the OTP code from SMS</li>
                    <li>Verify complete end-to-end flow</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Test Results</CardTitle>
                  <CardDescription>
                    View all test outcomes and logs
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={clearTestResults}>
                  Clear Results
                </Button>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No test results yet. Run tests from other tabs.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          result.status === 'pass'
                            ? 'border-green-200 bg-green-50'
                            : result.status === 'fail'
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {result.status === 'pass' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : result.status === 'fail' ? (
                              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            ) : (
                              <Loader2 className="h-5 w-5 text-gray-600 animate-spin mt-0.5" />
                            )}
                            <div>
                              <h4 className="font-medium text-sm">{result.test}</h4>
                              {result.message && (
                                <p className="text-xs text-gray-600 mt-1">{result.message}</p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={result.status === 'pass' ? 'default' : 'destructive'}
                            className={result.status === 'pass' ? 'bg-green-500' : ''}
                          >
                            {result.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Testing Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Testing Checklist</CardTitle>
            <CardDescription>
              Complete these tests to verify SMS MFA functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="test1" className="rounded" />
                <label htmlFor="test1">Add phone number and verify with SMS</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="test2" className="rounded" />
                <label htmlFor="test2">Enable SMS MFA</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="test3" className="rounded" />
                <label htmlFor="test3">Login with MFA (receive SMS)</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="test4" className="rounded" />
                <label htmlFor="test4">Complete login with correct OTP</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="test5" className="rounded" />
                <label htmlFor="test5">Test wrong OTP code</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="test6" className="rounded" />
                <label htmlFor="test6">Test expired OTP</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="test7" className="rounded" />
                <label htmlFor="test7">Generate recovery codes</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="test8" className="rounded" />
                <label htmlFor="test8">Test mock numbers (free)</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="test9" className="rounded" />
                <label htmlFor="test9">Test real SMS (minimal)</label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
