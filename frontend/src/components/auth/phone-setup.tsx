import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, CheckCircle2, Loader2, Phone } from "lucide-react";
import { appwriteAuth } from "@/lib/appwrite";
import { toast } from "react-hot-toast";

// Phone number validation schema (E.164 format)
const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (e.g., +1234567890)")
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers")
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

interface PhoneSetupProps {
  password?: string; // User's password required for phone update
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PhoneSetup({ password, onSuccess, onError }: PhoneSetupProps) {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Phone form
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: ""
    }
  });

  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ""
    }
  });

  const handlePhoneSubmit = async (data: PhoneFormValues) => {
    if (!password) {
      const errorMsg = "Password is required to update phone number";
      setError(errorMsg);
      toast.error(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Update phone number
      const user = await appwriteAuth.updatePhone(data.phone, password);
      setUserId(user.$id);
      setPhoneNumber(data.phone);

      // Step 2: Send verification SMS
      const token = await appwriteAuth.createPhoneToken(data.phone);

      toast.success("Verification code sent to your phone!");
      setStep('verify');
    } catch (err: any) {
      const errorMessage = err.message || "Failed to add phone number";
      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(errorMessage);
      console.error("Phone setup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (data: OtpFormValues) => {
    if (!userId) {
      const errorMsg = "User ID not found. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify phone with OTP
      await appwriteAuth.updatePhoneVerification(userId, data.otp);

      toast.success("Phone verified successfully!");
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || "Invalid verification code";
      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(errorMessage);
      console.error("Phone verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!phoneNumber) {
      toast.error("Phone number not found");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await appwriteAuth.createPhoneToken(phoneNumber);
      toast.success("Verification code resent!");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to resend code";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-gray-700" />
          <CardTitle>Add Phone Number</CardTitle>
        </div>
        <CardDescription>
          {step === 'phone'
            ? "Add your phone number to enable SMS-based authentication"
            : "Enter the 6-digit code sent to your phone"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'phone' ? (
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
              <FormField
                control={phoneForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1234567890"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Format: +[country code][number] (e.g., +15551234567)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  Code sent to <strong>{phoneNumber}</strong>
                </p>
              </div>

              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        disabled={isLoading}
                        className="text-center text-2xl tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verify Phone
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isLoading}
                >
                  Resend Code
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep('phone');
                  setError(null);
                  otpForm.reset();
                }}
                disabled={isLoading}
              >
                Change Phone Number
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
