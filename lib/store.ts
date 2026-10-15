'use client'

import { create } from 'zustand'
import type Lenis from 'lenis'

export const BUDGET_MIN = 5
export const BUDGET_MAX = 60
export const BUDGET_DEFAULT = 35

export type Band = 'refresh' | 'redesign' | 'build' | null

/** Price bands on the tape, in £k. Below £10k nothing is highlighted. */
export function bandFor(budgetK: number): Band {
  if (budgetK < 10) return null
  if (budgetK < 20) return 'refresh'
  if (budgetK < 40) return 'redesign'
  return 'build'
}

type SiteState = {
  /** Budget from the Costs tape, in £k. Pre-selects the enquiry budget step. */
  budget: number
  /** True once the visitor has moved the budget pin themselves. */
  budgetTouched: boolean
  setBudget: (k: number, touched?: boolean) => void
  introDone: boolean
  setIntroDone: () => void
  lenis: Lenis | null
  setLenis: (lenis: Lenis | null) => void
}

export const useSite = create<SiteState>((set) => ({
  budget: BUDGET_DEFAULT,
  budgetTouched: false,
  setBudget: (k, touched = true) =>
    set((s) => ({ budget: k, budgetTouched: s.budgetTouched || touched })),
  introDone: false,
  setIntroDone: () => set({ introDone: true }),
  lenis: null,
  setLenis: (lenis) => set({ lenis }),
}))
