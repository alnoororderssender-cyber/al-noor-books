// Static, non-secret site configuration. Business data (prices, delivery, payment
// details, announcement, store info) comes from the API, never from here.
export const siteConfig = {
  name: 'AL NOOR BOOKS',
  // Replace public/placeholders/hero.svg with your own photo and update the path here.
  heroImage: '/placeholders/hero.svg',
  bannerImage: '/placeholders/banner.svg',
  storeImage: '/placeholders/store.svg',
};

export const PK_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar',
  'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Other',
];

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];
