"use client";

import { HeartPulse } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/shared/ui/button";
import { PageTransition } from "@/shared/ui/page-transition";

/**
 * Where a session goes when the user stopped because something hurt.
 *
 * Deliberately free of numbers. A summary answers "how did I do?", which is the
 * wrong question to put in front of someone who just got hurt — and totals
 * would quietly frame a stopped session as a shortfall. Stopping *was* the
 * right call, so that is the only message here.
 */
export function PainStopView() {
  return (
    <PageTransition className="summary-page">
      <main className="pain-stop">
        <div className="pain-stop__mark" aria-hidden="true">
          <HeartPulse size={30} />
        </div>

        <h1 className="pain-stop__title">You made the right call.</h1>
        <p className="pain-stop__body">
          Stopping when something hurts is training well, not giving up. Today is set aside — it
          won&rsquo;t count against your streak or your load.
        </p>

        <ul className="pain-stop__care">
          <li>Rest the area today. Ice it if it is swollen or sore to touch.</li>
          <li>If the pain is sharp, spreading, or still there tomorrow, see a professional.</li>
        </ul>

        <p className="pain-stop__note">
          Your next plan review will work around this. Nothing to do now.
        </p>

        <div className="pain-stop__actions">
          <Link className={buttonVariants({ size: "large", variant: "primary" })} href="/home">
            Back to home
          </Link>
        </div>
      </main>
    </PageTransition>
  );
}
