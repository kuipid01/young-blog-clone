import axios from "axios";

const API_KEYS = {
  exchangerates: [
    process.env.EXCHANGERATE_API_ONE,
    process.env.EXCHANGERATE_API_TWO,
    process.env.EXCHANGERATE_API_THREE,
  ],
  fixer: [process.env.FIXER_API_ONE],
};

const BASE = "USD"; // we always convert from 1 NGN → currency
const CACHE_DURATION_MS = 3600000; // 1 hour cache

interface CacheEntry {
  rate: number;
  timestamp: number;
}

let cacheEntry: CacheEntry | null = null;

/**
 * Fetches currency exchange rate with automatic failover across multiple API providers.
 * Tries Exchangerate-API first, then falls back to Fixer API if needed.
 *
 * @returns Promise resolving to the exchange rate object
 * @throws Error if all API sources fail
 */
export const getCurrencyRateWithFailover = async (): Promise<{
  rate: number;
}> => {
  const storeCurrency = "NGN";
  console.log(
    `[CURRENCY] Starting currency rate fetch - Converting from ${BASE} to ${storeCurrency}`
  );

  try {
    let rate: number | null = null;

    // --- 1) Try Exchangerate-API ---
    console.log(
      `[CURRENCY] Attempting Exchangerate-API with ${
        API_KEYS.exchangerates.filter((k) => k).length
      } available keys`
    );

    for (let i = 0; i < API_KEYS.exchangerates.length; i++) {
      const key = API_KEYS.exchangerates[i];
      if (!key) {
        console.log(
          `[CURRENCY] Exchangerate-API key #${
            i + 1
          } is not configured, skipping`
        );
        continue;
      }

      try {
        const url = `https://v6.exchangerate-api.com/v6/${key}/latest/${BASE}`;
        console.log(`[CURRENCY] Trying Exchangerate-API key #${i + 1}`);

        const response = await axios.get(url, { timeout: 5000 });

        console.log(
          `[CURRENCY] Exchangerate-API response - Status: ${response.status}, Result: ${response.data?.result}`
        );

        if (response.status === 200 && response.data.result === "success") {
          const fetchedRate = response.data.conversion_rates[storeCurrency];

          if (fetchedRate) {
            console.log(
              `[CURRENCY SUCCESS] Exchangerate-API key #${
                i + 1
              } succeeded - Rate: 1 ${BASE} = ${fetchedRate} ${storeCurrency}`
            );
            return { rate: fetchedRate };
          } else {
            console.log(
              `[CURRENCY WARNING] Exchangerate-API key #${
                i + 1
              } - ${storeCurrency} rate not found in response`
            );
          }
        }
      } catch (err: any) {
        console.error(
          `[CURRENCY ERROR] Exchangerate-API key #${i + 1} failed - ${
            err.message
          }`
        );
        if (err.response) {
          console.error(
            `[CURRENCY ERROR] Response status: ${err.response.status}, Data:`,
            err.response.data
          );
        }
      }
    }

    console.log(
      `[CURRENCY] All Exchangerate-API attempts exhausted, falling back to Fixer API`
    );

    // --- 2) Try Fixer API (EUR-based) ---
    console.log(
      `[CURRENCY] Attempting Fixer API with ${
        API_KEYS.fixer.filter((k) => k).length
      } available keys`
    );

    for (let i = 0; i < API_KEYS.fixer.length; i++) {
      const key = API_KEYS.fixer[i];
      if (!key) {
        console.log(
          `[CURRENCY] Fixer API key #${i + 1} is not configured, skipping`
        );
        continue;
      }

      try {
        const url = `http://data.fixer.io/api/latest?access_key=${key}&symbols=NGN,${storeCurrency}`;
        console.log(`[CURRENCY] Trying Fixer API key #${i + 1}`);

        const response = await axios.get(url, { timeout: 5000 });

        console.log(
          `[CURRENCY] Fixer API response - Status: ${response.status}, Success: ${response.data?.success}`
        );

        if (response.status === 200 && response.data.success) {
          const { rates } = response.data;

          if (!rates["NGN"]) {
            console.log(
              `[CURRENCY WARNING] Fixer API key #${
                i + 1
              } - NGN rate not found in response`
            );
            continue;
          }

          if (!rates[storeCurrency]) {
            console.log(
              `[CURRENCY WARNING] Fixer API key #${
                i + 1
              } - ${storeCurrency} rate not found in response`
            );
            continue;
          }

          const eurToStoreCurrency = rates[storeCurrency];
          const eurToNGN = rates["NGN"];

          rate = eurToStoreCurrency / eurToNGN;

          console.log(
            `[CURRENCY SUCCESS] Fixer API key #${
              i + 1
            } succeeded - Calculated rate: 1 ${BASE} = ${rate} ${storeCurrency} (via EUR: ${eurToStoreCurrency}/${eurToNGN})`
          );
          return { rate };
        }
      } catch (err: any) {
        console.error(
          `[CURRENCY ERROR] Fixer API key #${i + 1} failed - ${err.message}`
        );
        if (err.response) {
          console.error(
            `[CURRENCY ERROR] Response status: ${err.response.status}, Data:`,
            err.response.data
          );
        }
      }
    }

    console.error(
      `[CURRENCY FATAL] All API sources exhausted - Unable to fetch currency rate`
    );
    throw new Error("Failed to fetch currency rate from all sources");
  } catch (error: any) {
    console.error(
      `[CURRENCY FATAL] Server error while fetching currency rate:`,
      error.message
    );
    throw new Error("Server error while fetching currency rate");
  }
};

/**
 * Returns a cached currency rate or fetches a new one if cache is expired.
 * Cache is valid for 1 hour to reduce API calls.
 *
 * @returns Promise resolving to the exchange rate object
 */
export const getCachedCurrencyRate = async (): Promise<{ rate: number }> => {
  const now = Date.now();

  if (cacheEntry && now - cacheEntry.timestamp < CACHE_DURATION_MS) {
    const cacheAge = Math.floor((now - cacheEntry.timestamp) / 1000);
    console.log(
      `[CURRENCY CACHE] Using cached rate: ${cacheEntry.rate} (Age: ${cacheAge}s)`
    );
    return { rate: cacheEntry.rate };
  }

  if (cacheEntry) {
    const cacheAge = Math.floor((now - cacheEntry.timestamp) / 1000);
    console.log(
      `[CURRENCY CACHE] Cache expired (Age: ${cacheAge}s), fetching new rate`
    );
  } else {
    console.log(`[CURRENCY CACHE] No cache found, fetching new rate`);
  }

  try {
    const result = await getCurrencyRateWithFailover();

    cacheEntry = {
      rate: result.rate,
      timestamp: now,
    };

    console.log(
      `[CURRENCY CACHE] New rate cached: ${result.rate} at ${new Date(
        now
      ).toISOString()}`
    );
    return result;
  } catch (error) {
    if (cacheEntry) {
      const cacheAge = Math.floor((now - cacheEntry.timestamp) / 60000);
      console.warn(
        `[CURRENCY CACHE] Fetch failed, falling back to stale cache (Age: ${cacheAge} minutes)`
      );
      return { rate: cacheEntry.rate };
    }
    throw error;
  }
};

/**
 * Converts a USD price to Nigerian Naira.
 *
 * @param dollarPrice - The price in USD
 * @returns Promise resolving to the price in NGN as a string with 2 decimal places
 */
export const getNigerianPrice = async (
  dollarPrice: number
): Promise<string> => {
  console.log(`[CURRENCY CONVERSION] Converting ${dollarPrice} USD to NGN`);

  try {
    const { rate } = await getCachedCurrencyRate();
    console.log("RATE GOTTEN AFTER CONVERSIONS", rate);
    const ngnPrice = (dollarPrice * rate).toFixed(2);
    const modifiedPrice = 0.6 * Number(ngnPrice) + Number(ngnPrice);
    console.log(
      `[CURRENCY CONVERSION SUCCESS] ${dollarPrice} USD = ${ngnPrice} NGN (Rate: ${rate})`
    );
    console.log(`[MODIFIED PRICE]`, modifiedPrice, `Naira`, ngnPrice);
    return modifiedPrice.toString();
  } catch (error: any) {
    console.error(
      `[CURRENCY CONVERSION ERROR] Failed to convert ${dollarPrice} USD to NGN:`,
      error.message
    );
    throw error;
  }
};
