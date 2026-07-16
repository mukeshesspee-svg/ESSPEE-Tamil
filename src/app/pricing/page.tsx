"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";

// Type definition for Razorpay options
interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: Function) => void;
    };
  }
}

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const isPremium = user?.publicMetadata?.isPremium === true;

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    try {
      setLoading(true);
      // Create a subscription on the server
      const response = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      // Open Razorpay Checkout
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        subscription_id: data.subscriptionId,
        name: "ESSPEE Tamil Writer Pro",
        description: "Monthly Pro Subscription",
        handler: function (response: any) {
          toast.success("Payment successful! Your account will be upgraded shortly.");
          // Ideally, we wait for the webhook to update Clerk metadata.
          // Then we can refresh the user session.
          setTimeout(() => {
             window.location.href = "/";
          }, 3000);
        },
        prefill: {
          name: user.fullName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
          contact: "", // Optional
        },
        theme: {
          color: "#7c3aed", // Violet-600
        },
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any){
        toast.error(`Payment Failed: ${response.error.description}`);
      });

      razorpay.open();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred during checkout");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your Pro subscription? You will lose access to all AI features immediately.")) {
      return;
    }

    try {
      setCanceling(true);
      const response = await fetch("/api/razorpay/cancel-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      toast.success("Subscription canceled successfully.");
      setTimeout(() => {
         window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while canceling");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto py-12 px-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Upgrade to Pro</h1>
        <p className="text-lg text-muted-foreground">
          Unlock the full power of ESSPEE Tamil Writer with AI-powered features.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free Plan */}
        <div className="flex flex-col p-6 bg-card border rounded-2xl shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold">Basic</h3>
            <div className="mt-2 text-3xl font-bold">₹0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
          </div>
          <ul className="space-y-3 mb-6 flex-1 text-sm">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Basic Text Editing</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Local Storage</li>
            <li className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4 opacity-50" /> No AI Features</li>
          </ul>
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        </div>

        {/* Pro Plan */}
        <div className="flex flex-col p-6 bg-primary/5 border-primary border-2 rounded-2xl shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
            RECOMMENDED
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              Pro <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            </h3>
            {/* Note: Update the price text here to match your Razorpay Plan */}
            <div className="mt-2 text-3xl font-bold">₹199<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
          </div>
          <ul className="space-y-3 mb-6 flex-1 text-sm font-medium">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Everything in Basic</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Gemini AI Integration</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> AI Text Generation</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Grammar & Spelling Fixes</li>
          </ul>
          
          {isPremium ? (
            <Button 
              className="w-full" 
              variant="destructive"
              onClick={handleCancel} 
              disabled={canceling}
            >
              {canceling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel Subscription
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleSubscribe} 
              disabled={!isLoaded || loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Subscribe Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
