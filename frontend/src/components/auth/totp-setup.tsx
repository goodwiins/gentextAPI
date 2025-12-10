import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, Smartphone, Copy, QrCode } from "lucide-react";
import { appwriteAuth, account } from "@/lib/appwrite";
import { toast } from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

interface TotpSetupProps {
  userId?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function TotpSetup({ userId, onSuccess, onError }: TotpSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle');
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [totpUri, setTotpUri] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isTotpEnabled, setIsTotpEnabled] = useState(false);

  useEffect(() => {
    checkTotpStatus();
  }, []);

  const checkTotpStatus = async () => {
    try {
      const factors = await appwriteAuth.listMfaFactors();
      setIsTotpEnabled(!!factors.totp);
    } catch (err) {
      console.error("Failed to check TOTP status:", err);
    }
  };

  const handleStartSetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create TOTP authenticator - this returns the secret and URI for QR code
      const result = await appwriteAuth.createMfaAuthenticator('totp');
      setTotpSecret(result.secret);
      setTotpUri(result.uri);
      setStep('setup');
    } catch (err: any) {
      const errorMessage = err.message || "Failed to start TOTP setup";
      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify the TOTP code to enable it
      await appwriteAuth.updateMfaAuthenticator('totp', verificationCode);
      setIsTotpEnabled(true);
      setStep('idle');
      toast.success("Authenticator app enabled successfully!");
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || "Invalid verification code";
      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    toast.success("Secret copied to clipboard!");
  };

  const handleCancel = () => {
    setStep('idle');
    setTotpSecret("");
    setTotpUri("");
    setVerificationCode("");
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Authenticator App</CardTitle>
          </div>
          {isTotpEnabled ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Enabled
            </Badge>
          ) : (
            <Badge variant="secondary">
              Not Configured
            </Badge>
          )}
        </div>
        <CardDescription>
          Use an authenticator app like Google Authenticator, Authy, or 1Password for time-based codes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'idle' && !isTotpEnabled && (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">Why use an authenticator app?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• More secure than SMS codes</li>
                <li>• Works offline without cellular service</li>
                <li>• Codes refresh every 30 seconds</li>
                <li>• Compatible with all major authenticator apps</li>
              </ul>
            </div>
            <Button 
              onClick={handleStartSetup} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Set Up Authenticator App
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Scan this QR code with your authenticator app, or enter the secret manually:
              </p>
              
              {/* QR Code for authenticator app */}
              <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center mb-4 p-2">
                {totpUri ? (
                  <QRCodeSVG
                    value={totpUri}
                    size={176}
                    level="M"
                    includeMargin={false}
                  />
                ) : (
                  <div className="text-center">
                    <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 bg-background border rounded-lg p-3">
                <code className="flex-1 text-sm font-mono truncate">
                  {totpSecret}
                </code>
                <Button variant="ghost" size="sm" onClick={handleCopySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Enter the 6-digit code from your app</label>
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Verify & Enable
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {isTotpEnabled && step === 'idle' && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h4 className="font-medium text-green-600 dark:text-green-400">Authenticator App Active</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Your account is protected with time-based one-time passwords from your authenticator app.
              </p>
            </div>
            <Button variant="outline" className="w-full" disabled>
              <Smartphone className="mr-2 h-4 w-4" />
              Reconfigure App (Coming Soon)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
