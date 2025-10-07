import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Shield, Key, Loader2, Copy, RefreshCw } from "lucide-react";
import { appwriteAuth, account } from "@/lib/appwrite";
import { toast } from "react-hot-toast";

interface MfaSettingsProps {
  userId?: string;
}

export default function MfaSettings({ userId }: MfaSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaFactors, setMfaFactors] = useState<any>(null);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  // Helper to verify session before MFA operations
  const verifySession = async () => {
    try {
      await account.get();
      return true;
    } catch (error) {
      console.error("Session verification failed:", error);
      setError("Your session has expired. Please refresh the page.");
      toast.error("Session expired. Please refresh the page.");
      return false;
    }
  };

  const checkMfaStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const factors = await appwriteAuth.listMfaFactors();
      setMfaFactors(factors);
      setIsMfaEnabled(!!factors.phone || !!factors.totp);
    } catch (err: any) {
      console.error("Failed to check MFA status:", err);
      const errorMessage = err.message || "Failed to load MFA settings";

      // Handle specific session-related errors
      if (errorMessage.includes("session") || errorMessage.includes("unauthorized")) {
        setError("Please refresh the page and try again");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableMfa = async () => {
    // Verify session first
    if (!(await verifySession())) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create phone MFA authenticator
      await appwriteAuth.createMfaAuthenticator('phone');

      toast.success("SMS MFA enabled successfully!");
      await checkMfaStatus();
    } catch (err: any) {
      console.error("Enable MFA error:", err);
      const errorMessage = err.message || "Failed to enable MFA";

      // Handle session-related errors with helpful message
      if (errorMessage.includes("session is prohibited") || errorMessage.includes("session is active")) {
        setError("MFA is already being configured. Please refresh the page and try again.");
        toast.error("Please refresh the page and try again");
      } else if (errorMessage.includes("phone") && errorMessage.includes("not found")) {
        setError("Please add and verify your phone number first");
        toast.error("Please add a phone number first");
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRecoveryCodes = async () => {
    // Verify session first
    if (!(await verifySession())) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const codes = await appwriteAuth.createMfaRecoveryCodes();
      setRecoveryCodes(codes.recoveryCodes);
      setShowRecoveryCodes(true);
      toast.success("Recovery codes generated!");
    } catch (err: any) {
      console.error("Generate recovery codes error:", err);
      const errorMessage = err.message || "Failed to generate recovery codes";

      // Handle session-related errors with helpful message
      if (errorMessage.includes("session is prohibited") || errorMessage.includes("session is active")) {
        setError("Recovery codes are already being generated. Please refresh the page and try again.");
        toast.error("Please refresh the page and try again");
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRecoveryCodes = () => {
    const codesText = recoveryCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success("Recovery codes copied to clipboard!");
  };

  const handleDownloadRecoveryCodes = () => {
    const codesText = recoveryCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded!");
  };

  return (
    <div className="space-y-4">
      {/* MFA Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-700" />
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            {isMfaEnabled ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">
                Disabled
              </Badge>
            )}
          </div>
          <CardDescription>
            Add an extra layer of security to your account with SMS-based MFA
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* MFA Status */}
          {mfaFactors && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SMS Authentication</span>
                <Badge variant={mfaFactors.phone ? "default" : "secondary"}>
                  {mfaFactors.phone ? "Active" : "Inactive"}
                </Badge>
              </div>
              {mfaFactors.phone && (
                <p className="text-xs text-gray-500">
                  You&apos;ll receive a code via SMS when logging in
                </p>
              )}
            </div>
          )}

          {/* Enable MFA Button */}
          {!isMfaEnabled && (
            <Button
              onClick={handleEnableMfa}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling MFA...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Enable SMS MFA
                </>
              )}
            </Button>
          )}

          {/* Refresh Status Button */}
          <Button
            variant="outline"
            onClick={checkMfaStatus}
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </CardContent>
      </Card>

      {/* Recovery Codes Card */}
      {isMfaEnabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-gray-700" />
              <CardTitle>Recovery Codes</CardTitle>
            </div>
            <CardDescription>
              Use recovery codes to access your account if you lose your phone
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!showRecoveryCodes ? (
              <Button
                onClick={handleGenerateRecoveryCodes}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating codes...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Generate Recovery Codes
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Save these codes in a secure place. Each code can only be used once.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{code}</span>
                      <Badge variant="outline">{index + 1}</Badge>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopyRecoveryCodes}
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Codes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadRecoveryCodes}
                    className="flex-1"
                  >
                    Download
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setShowRecoveryCodes(false)}
                  className="w-full"
                >
                  Hide Codes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
