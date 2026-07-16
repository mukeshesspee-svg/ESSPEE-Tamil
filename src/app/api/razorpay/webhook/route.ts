import { NextResponse } from "next/server";
import crypto from "crypto";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not set");
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle Subscription events
    // Typical events: subscription.charged, subscription.halted, subscription.cancelled
    if (event.event === "subscription.charged" || event.event === "subscription.authenticated") {
      const subscription = event.payload.subscription.entity;
      
      // Get the userId we passed in the notes when creating the subscription
      const userId = subscription.notes?.userId;

      if (userId) {
        // Upgrade the user in Clerk
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            isPremium: true,
            razorpaySubscriptionId: subscription.id,
          },
        });
        console.log(`Successfully upgraded user ${userId}`);
      } else {
        console.warn("Received subscription charge but no userId was found in notes.");
      }
    } 
    
    if (event.event === "subscription.halted" || event.event === "subscription.cancelled") {
        const subscription = event.payload.subscription.entity;
        const userId = subscription.notes?.userId;
        
        if (userId) {
            const client = await clerkClient();
            await client.users.updateUserMetadata(userId, {
              publicMetadata: {
                isPremium: false,
              },
            });
            console.log(`Successfully downgraded user ${userId}`);
          }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
