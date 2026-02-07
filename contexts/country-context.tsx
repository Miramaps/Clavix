'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CountryCode = 'NO' | 'SE' | 'DK' | 'FI';

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  registryName: string;
  currency: string;
}

export const COUNTRIES: Country[] = [
  {
    code: 'NO',
    name: 'Norge',
    flag: '🇳🇴',
    registryName: 'Brønnøysundregistrene',
    currency: 'NOK',
  },
  {
    code: 'SE',
    name: 'Sverige',
    flag: '🇸🇪',
    registryName: 'Bolagsverket',
    currency: 'SEK',
  },
  {
    code: 'DK',
    name: 'Danmark',
    flag: '🇩🇰',
    registryName: 'CVR',
    currency: 'DKK',
  },
  {
    code: 'FI',
    name: 'Finland',
    flag: '🇫🇮',
    registryName: 'YTJ',
    currency: 'EUR',
  },
];

interface CountryContextType {
  selectedCountry: CountryCode;
  setSelectedCountry: (country: CountryCode) => void;
  country: Country;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [selectedCountry, setSelectedCountryState] = useState<CountryCode>('NO');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('clavix-selected-country');
    if (saved && ['NO', 'SE', 'DK', 'FI'].includes(saved)) {
      setSelectedCountryState(saved as CountryCode);
    }
  }, []);

  const setSelectedCountry = (country: CountryCode) => {
    setSelectedCountryState(country);
    localStorage.setItem('clavix-selected-country', country);
  };

  const country = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];

  return (
    <CountryContext.Provider value={{ selectedCountry, setSelectedCountry, country }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
