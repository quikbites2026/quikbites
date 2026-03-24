// Maps kitchen email addresses to their kitchenId
// When you add more kitchens, add them here AND in the Admin portal
// This file controls which orders each kitchen can see

export const KITCHEN_EMAIL_MAP = {
  'kitchen@quikbites.com': 'kitchen-1',
  // Future kitchens:
  // 'kitchen2@quikbites.com': 'kitchen-2',
  // 'kitchen3@quikbites.com': 'kitchen-3',
};

export const KITCHEN_NAMES = {
  'kitchen-1': 'Main Kitchen — Honiara',
  // 'kitchen-2': 'Branch 2 — Name',
};

export function getKitchenId(email) {
  return KITCHEN_EMAIL_MAP[email] || 'kitchen-1';
}

export function getKitchenName(kitchenId) {
  return KITCHEN_NAMES[kitchenId] || 'Kitchen';
}
