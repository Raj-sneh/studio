
import { NextResponse } from 'next/server';
import { db } from '@/firebase/client';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, increment, Firestore } from 'firebase/firestore';

/**
 * @fileOverview Secure Next.js API route for coupon redemption.
 * Includes randomized complex coupon patterns for Creator and Pro packs.
 */

const couponValues: Record<string, number> = {
  // RANDOMIZED CREATOR PACKS (1000 Credits) - Letters and Numbers
  "CrEaT0r99x": 1000,
  "MaGic123S": 1000,
  "skvCreaTor7": 1000,
  "NeuralArt88": 1000,
  "PianoPack99": 1000,
  
  // RANDOMIZED PRO PACKS (5000 Credits) - Letters, Numbers, Special Characters (@#$)
  "Pr0@Sargam#": 5000,
  "N3ur@l$5000": 5000,
  "SKV#V0ice@99": 5000,
  "Elite$Artist#1": 5000,
  "Master@SKV#77": 5000,

  // LEGACY/TEST CODES
  "SKV-PRO-1": 5000,
  "SKV-CREATOR-1": 1000,
  "S49A1B2": 100,
  "MELODY100": 100,
  "SKVPRO49": 100,
};

const INITIAL_CREDITS = 10;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body) {
       return NextResponse.json({ status: "invalid", message: "Invalid request body" }, { status: 400 });
    }

    const { code, userId } = body;

    if (!code || !userId) {
      return NextResponse.json({ status: "invalid", message: "Missing code or user ID" }, { status: 400 });
    }

    const firestore: Firestore = db;

    // 1. Check if the coupon exists
    const creditsToGrant = couponValues[code];
    if (!creditsToGrant) {
      return NextResponse.json({ status: "invalid", message: "That's not a valid coupon code." }, { status: 404 });
    }

    // 2. Access the user document
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    // 3. Handle if the user doc doesn't exist yet
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        id: userId,
        createdAt: serverTimestamp(),
        redeemedCoupons: [code],
        credits: creditsToGrant + INITIAL_CREDITS,
        displayName: 'Guest User',
        email: `guest_${userId}@example.com`,
        plan: creditsToGrant >= 5000 ? 'pro' : creditsToGrant >= 1000 ? 'creator' : 'free'
      });

      return NextResponse.json({
        status: "success",
        credits: creditsToGrant
      });
    }

    // 4. Check for double redemption
    const userData = userDoc.data();
    const redeemedCoupons = userData.redeemedCoupons || [];

    if (redeemedCoupons.includes(code)) {
      return NextResponse.json({ status: "used", message: "You've already used this coupon code." }, { status: 400 });
    }

    // 5. Success
    const updates: any = {
      redeemedCoupons: arrayUnion(code),
      credits: increment(creditsToGrant)
    };

    if (creditsToGrant >= 5000) updates.plan = 'pro';
    else if (creditsToGrant >= 1000) updates.plan = 'creator';

    await updateDoc(userDocRef, updates);

    return NextResponse.json({
      status: "success",
      credits: creditsToGrant
    });

  } catch (error: any) {
    console.error("Redemption API Error:", error);
    return NextResponse.json({ 
      status: "error", 
      message: error.message || "An unexpected error occurred during redemption."
    }, { status: 500 });
  }
}
