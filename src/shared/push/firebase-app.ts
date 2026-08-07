"use client";

import { getApps, initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import type { Messaging } from "firebase/messaging";

/**
 * Lazily initialised Firebase app, for Cloud Messaging only.
 *
 * Nothing else in FITAI uses Firebase — auth and data go through the ConnectRPC
 * BFF. Keep it that way: this module exists so the FCM registration token can be
 * minted, and the token is then handed to our own backend.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export function isFirebaseConfigured(): boolean {
  return Object.values(config).every((value) => typeof value === "string" && value.length > 0);
}

function app(): FirebaseApp {
  return getApps()[0] ?? initializeApp(config);
}

/** Null when the browser cannot do FCM (Safari without install, private mode). */
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!(await isSupported())) {
    return null;
  }
  return getMessaging(app());
}
