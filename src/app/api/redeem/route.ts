import { NextResponse } from 'next/server';
import { db } from '@/firebase/client';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * @fileOverview Secure Next.js API route for coupon redemption.
 * Migrated from external Python backend.
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
        const { code, userId } = await req.json();

        if (!code || !userId) {
            return NextResponse.json({ status: "invalid", message: "Missing required fields" }, { status: 400 });
        }

        const creditsToGrant = couponValues[code];
        if (!creditsToGrant) {
            return NextResponse.json({ status: "invalid", message: "Invalid coupon code" }, { status: 404 });
        }

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            return NextResponse.json({ status: "invalid", message: "User account not found" }, { status: 404 });
        }

        const userData = userDoc.data();
        const redeemedCoupons = userData.redeemedCoupons || [];

        if (redeemedCoupons.includes(code)) {
            return NextResponse.json({ status: "used", message: "You have already redeemed this code" }, { status: 400 });
        }

        // Atomically record the redemption in Firestore
        await updateDoc(userDocRef, {
            redeemedCoupons: arrayUnion(code)
        });

        return NextResponse.json({
            status: "success",
            credits: creditsToGrant
        });
    } catch (error: any) {
        console.error("Redemption API Error:", error);
        return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
    }
}
