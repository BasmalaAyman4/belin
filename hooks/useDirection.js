// lib/hooks/useDictionary.js
"use client";
import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { getDictionary } from '../lib/i18n/dictionaries'; // Fixed path

export function useDictionary() {
  const params = useParams();
  const locale = params.locale || 'en'; // Add fallback

  const [dictionary, setDictionary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDictionary() {
      try {
        setLoading(true);
        setError(null);
        const dict = await getDictionary(locale);
        setDictionary(dict);
      } catch (err) {
        console.error('Failed to load dictionary:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (locale) {
      loadDictionary();
    }
  }, [locale]);

  // Helper function for accessing nested translations
  const t = (key) => {
    if (!dictionary) return key;
    return key.split('.').reduce((obj, k) => obj?.[k], dictionary) || key;
  };

  return {
    dictionary,
    loading,
    error,
    t,
    locale
  };
}