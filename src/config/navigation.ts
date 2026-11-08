export interface NavItem {
  label: string;
  href: string;
  description?: string;
  badge?: string;
}

export const MAIN_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/products' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export const CATEGORY_NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Curtains & Drapes',
    href: '/products?category=curtains_window_treatments',
    description: 'Blackout, sheers, motorized & custom pleated drapes',
  },
  {
    label: 'Sofa Upholstery',
    href: '/products?category=sofa_upholstery_fabrics',
    description: 'Velvet, jacquards, linen blends & commercial rexine',
  },
  {
    label: 'Wallpapers',
    href: '/products?category=wallpapers',
    description: 'PVC, non-woven, 3D textures & custom murals',
  },
  {
    label: 'Mattresses',
    href: '/products?category=mattresses_sleep_solutions',
    description: 'Refresh, Dr. Ortho, memory foam & latex beds',
  },
  {
    label: 'Bedding & Cushions',
    href: '/products?category=bedding_accessories',
    description: 'Luxury sheets, cushion covers, comforters & protectors',
  },
  {
    label: 'Home Decor',
    href: '/products?category=home_decor',
    description: 'Carpets, headboards, mosquito nets & artificial turf',
  },
] as const;
