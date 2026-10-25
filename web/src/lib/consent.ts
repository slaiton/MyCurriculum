'use client';

import { useSyncExternalStore } from 'react';

export type ConsentChoice = 'granted' | 'denied';

/**
 * Clave versionada: si cambia el texto o el alcance del consentimiento,
 * se sube el número para volver a preguntar.
 */
const STORAGE_KEY = 'slaiton-analytics-consent-v1';

let choice: ConsentChoice | null = null;
let loaded = false;
let bannerOpen = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readStoredChoice(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    // Almacenamiento bloqueado (modo privado, políticas del navegador).
    return null;
  }
}

function getConsentSnapshot(): ConsentChoice | null {
  if (!loaded) {
    loaded = true;
    choice = readStoredChoice();
  }
  return choice;
}

function getBannerSnapshot(): boolean {
  return bannerOpen;
}

function getServerConsentSnapshot(): ConsentChoice | null {
  return null;
}

function getServerBannerSnapshot(): boolean {
  return false;
}

export function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Elección guardada: `null` = todavía no ha decidido. */
export function useConsent(): ConsentChoice | null {
  return useSyncExternalStore(subscribeConsent, getConsentSnapshot, getServerConsentSnapshot);
}

export function useConsentBannerOpen(): boolean {
  return useSyncExternalStore(subscribeConsent, getBannerSnapshot, getServerBannerSnapshot);
}

export function setConsent(next: ConsentChoice) {
  choice = next;
  loaded = true;
  bannerOpen = false;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Si no se puede guardar, la elección vale solo para esta visita.
  }
  emit();
}

export function openConsentBanner() {
  bannerOpen = true;
  emit();
}

export function closeConsentBanner() {
  bannerOpen = false;
  emit();
}
