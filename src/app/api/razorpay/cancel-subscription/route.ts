import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptionId = user.publicMetadata?.razorpaySubscriptionId as string | undefined;

    if (!subscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    if (!process.env.RAZORPAY_KEY_SECRET || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      return NextResponse.json({ error: "Razorpay keys missing from environment" }, { status: 500 });
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Cancel the subscription immediately in Razorpay
    await instance.subscriptions.cancel(subscriptionId, false); // false means cancel immediately, not at billing cycle end

    // Update the user in Clerk immediately
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        isPremium: false,
        razorpaySubscriptionId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error canceling Razorpay subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
