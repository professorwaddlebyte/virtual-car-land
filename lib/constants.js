// lib/constants.js
// Central location for all hardcoded dropdown values

export const BODY_TYPES = [
  "SUV",
  "Sedan",
  "Pickup",
  "Hatchback",
  "Coupe",
  "Van",
  "Minivan",
  "Convertible",
  "Truck"
];

export const TRANSMISSIONS = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" }
];

export const FUEL_TYPES = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" }
];

export const CYLINDERS = ["4", "6", "8", "12"];

export const GCC_OPTIONS = [
  { value: "", label: "Both GCC & Non-GCC" },
  { value: "true", label: "GCC Specs Only" },
  { value: "false", label: "Non-GCC Only" }
];

// For boolean selection (like in AddCarModal)
export const GCC_BOOLEAN = [
  { value: true, label: "GCC" },
  { value: false, label: "Non-GCC" }
];

// Year range
export const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_RANGE = Array.from({ length: 25 }, (_, i) => CURRENT_YEAR - i);

// Price/mileage limits (if needed)
export const MAX_PRICE_ALERT = 10000000; // 10M AED
export const MAX_MILEAGE_ALERT = 500000; // 500k km



