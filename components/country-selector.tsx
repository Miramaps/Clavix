'use client';

import { useCountry, COUNTRIES } from '@/contexts/country-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CountrySelector() {
  const { selectedCountry, setSelectedCountry, country } = useCountry();

  return (
    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
      <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className="text-xl">{country.flag}</span>
            <span className="font-medium">{country.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {COUNTRIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{c.flag}</span>
              <div className="flex flex-col">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-gray-500">{c.registryName}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
