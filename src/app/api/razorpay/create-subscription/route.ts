import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.RAZORPAY_KEY_SECRET || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_PLAN_ID) {
      return NextResponse.json({ error: "Razorpay keys or Plan ID missing from environment" }, { status: 500 });
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const subscription = await instance.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 120, // Example: 10 years
      notes: {
        userId: userId, // Pass Clerk User ID so we know who to upgrade in the webhook
        email: user.primaryEmailAddress?.emailAddress || "",
      },
    });

    return NextResponse.json({ subscriptionId: subscription.id });
  } catch (error: any) {
    console.error("Error creating Razorpay subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create subscription" },
      { status: 500 }
    );
  }
}
