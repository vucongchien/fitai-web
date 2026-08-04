"use client";

import { Dumbbell, Plus, Scale, Utensils, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function QuickActionsFab() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="home-fab-container">
      {/* Backdrop overlay when menu is open */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="home-fab-backdrop"
          onClick={closeMenu}
        />
      )}

      {/* Floating Speed Dial Options Menu */}
      <div
        aria-label="Quick action options"
        className={`home-fab-menu ${isOpen ? "home-fab-menu--open" : ""}`}
        role="menu"
      >
        <Link
          className="home-fab-option"
          href="/workout/adhoc"
          onClick={closeMenu}
          role="menuitem"
        >
          <span className="home-fab-option__label">Extra workout</span>
          <span className="home-fab-option__icon home-fab-option__icon--blue">
            <Dumbbell size={18} />
          </span>
        </Link>

        <Link
          className="home-fab-option"
          href="/progress/weight"
          onClick={closeMenu}
          role="menuitem"
        >
          <span className="home-fab-option__label">Log weight</span>
          <span className="home-fab-option__icon home-fab-option__icon--green">
            <Scale size={18} />
          </span>
        </Link>

        <Link
          className="home-fab-option"
          href="/nutrition/log"
          onClick={closeMenu}
          role="menuitem"
        >
          <span className="home-fab-option__label">Log meal</span>
          <span className="home-fab-option__icon home-fab-option__icon--coral">
            <Utensils size={18} />
          </span>
        </Link>
      </div>

      {/* Main Sticky Circular Action Button */}
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        className={`home-fab-trigger ${isOpen ? "home-fab-trigger--active" : ""}`}
        onClick={toggleMenu}
        type="button"
      >
        <Plus className="home-fab-trigger__icon" size={24} />
      </button>
    </div>
  );
}
