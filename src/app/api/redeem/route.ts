
import { NextResponse } from 'next/server';
import { db } from '@/firebase/client';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, increment, Firestore } from 'firebase/firestore';

/**
 * @fileOverview Secure Next.js API route for coupon redemption.
 * Handles the logic for validating and granting credits to users.
 */

const couponValues: Record<string, number> = {
  "SKV-PRO-1": 5000,
  "SKV-PRO-2": 5000,
  "SKV-PRO-3": 5000,
  "SKV-PRO-4": 5000,
  "SKV-PRO-5": 5000,
  "SKV-CREATOR-1": 1000,
  "SKV-CREATOR-2": 1000,
  "SKV-CREATOR-3": 1000,
  "SKV-CREATOR-4": 1000,
  "SKV-CREATOR-5": 1000,
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
        plan: 'free'
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
    await updateDoc(userDocRef, {
      redeemedCoupons: arrayUnion(code),
      credits: increment(creditsToGrant)
    });

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
