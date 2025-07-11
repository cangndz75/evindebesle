"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { Loader } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function VerifyRequest() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [emailPending, startTransition] = useTransition();
  const params = useSearchParams();
  const email = params.get("email") as string;
  const isOtpCompleted = otp.length === 6;

  function verifyOtp() {
    startTransition(async () => {
      await authClient.signIn.emailOtp({
        email,
        otp,
        fetchOptions: {
          onSuccess: () => {
            toast.success("E-posta doğrulandı! Giriş yapabilirsiniz.");
            router.push("/");
          },
          onError: () => {
            toast.error("Doğrulama kodu geçersiz veya süresi dolmuş.");
          },
        },
      });
    });
  }

  return (
    <div className="flex items-center justify-center w-full min-h-screen px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>E-mail adresinizi onaylayın.</CardTitle>
          <CardDescription>
            E-posta adresinize bir doğrulama kodu gönderdik. Lütfen e-postanızı
            kontrol edin ve aşağıya girin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <InputOTP
              value={otp}
              onChange={(value) => setOtp(value)}
              maxLength={6}
              className="gap-2"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-sm text-muted-foreground">
              6 haneli doğrulama kodunuzu yukarıdaki alana girin.
            </p>
          </div>
          <Button
            onClick={verifyOtp}
            disabled={emailPending || !isOtpCompleted}
            className="w-full"
          >
            {emailPending ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                <span>Doğrulama yapılıyor...</span>
              </>
            ) : (
              "Doğrulama Yap"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
