import { db } from '@/firebase/client';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, increment, Firestore } from 'firebase/firestore';

/**
 * @fileOverview Secure Next.js API route for coupon redemption.
 * Handles the logic for validating and granting credits to users.
 */

const couponValues: Record<string, number> = {
  "S49A1B2": 100,
  "MELODY100": 100,
  "SKVPRO49": 100,
  "TUNE7K2L": 100,
  "BEAT49X1": 100,
  "MAX@250#₹": 250,
  "PRO#SKV@₹99": 250,
  "GOLD₹@MAX#": 250,
  "VIP#99@₹250": 250,
  "ULTRA@₹#99": 250
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, userId } = body;

    if (!code || !userId) {
      return Response.json({ status: "invalid", message: "Missing code or user ID" }, { status: 400 });
    }

    // Explicitly use the Firestore instance from our client singleton
    const firestore: Firestore = db;

    // 1. Check if the coupon exists in our simple database
    const creditsToGrant = couponValues[code];
    if (!creditsToGrant) {
      return Response.json({ status: "invalid", message: "That's not a valid coupon code." }, { status: 404 });
    }

    // 2. Access the user document in Firestore
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    // 3. Handle if the user doc doesn't exist yet (e.g. first-time guest)
    if (!userDoc.exists()) {
      // Create a skeleton doc so we can track redemptions
      await setDoc(userDocRef, {
        id: userId,
        createdAt: serverTimestamp(),
        redeemedCoupons: [code],
        credits: creditsToGrant + 5, // Give the base 5 credits + the coupon amount
        displayName: 'Guest User',
        email: `guest_${userId}@example.com`
      });

      return Response.json({
        status: "success",
        credits: creditsToGrant
      });
    }

    // 4. Check if this specific user has already used THIS code
    const userData = userDoc.data();
    const redeemedCoupons = userData.redeemedCoupons || [];

    if (redeemedCoupons.includes(code)) {
      return Response.json({ status: "used", message: "You've already used this coupon code." }, { status: 400 });
    }

    // 5. Success: Add code to the list of redeemed coupons and increment credits
    await updateDoc(userDocRef, {
      redeemedCoupons: arrayUnion(code),
      credits: increment(creditsToGrant)
    });

    return Response.json({
      status: "success",
      credits: creditsToGrant
    });

  } catch (error: any) {
    console.error("Redemption API Error:", error);
    return Response.json({ 
      status: "error", 
      message: "Studio server is having a moment. Please try again in a bit." 
    }, { status: 500 });
  }
}
