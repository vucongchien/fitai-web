"use client";

import { Dumbbell, Plus, Scale, Utensils } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { QuickAction } from "@/features/home/model/home-page.types";

type QuickActionsFabProps = {
  actions: QuickAction[];
};

const iconMap = {
  dumbbell: Dumbbell,
  scale: Scale,
  utensils: Utensils,
  plus: Plus,
} as const;

export function QuickActionsFab({ actions }: QuickActionsFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="home-fab-container">
      {/* Backdrop overlay when menu is open */}
      {isOpen && <div aria-hidden="true" className="home-fab-backdrop" onClick={closeMenu} />}

      {/* Floating Speed Dial Options Menu */}
      <div
        aria-label="Quick action options"
        className={`home-fab-menu ${isOpen ? "home-fab-menu--open" : ""}`}
        role="menu"
      >
        {actions.map((action) => {
          const Icon = iconMap[action.icon] ?? Dumbbell;
          return (
            <Link
              className="home-fab-option"
              href={action.href}
              key={action.id}
              onClick={closeMenu}
              role="menuitem"
            >
              <span className="home-fab-option__label">{action.label}</span>
              <span
                className={`home-fab-option__icon home-fab-option__icon--${action.colorVariant}`}
              >
                <Icon size={18} />
              </span>
            </Link>
          );
        })}
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
