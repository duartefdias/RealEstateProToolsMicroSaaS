'use client';

import { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown } from "lucide-react";

export default function LanguageDropdown() {
  const [selectedLanguage, setSelectedLanguage] = useState('PT');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'PT', name: 'Português', flag: '🇵🇹' },
    { code: 'EN', name: 'English', flag: '🇬🇧' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span>{selectedLanguage}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  setSelectedLanguage(language.code);
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center space-x-3 ${
                  selectedLanguage === language.code ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                <span className="text-base">{language.flag}</span>
                <span>{language.name}</span>
                {selectedLanguage === language.code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}