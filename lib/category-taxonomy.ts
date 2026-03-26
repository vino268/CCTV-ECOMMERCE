import { Category, Product } from '@/lib/types';

interface SubcategoryDefinition {
  name: string;
  keywords: string[];
}

export interface MainCategoryDefinition extends Category {
  keywords: string[];
  subcategories: SubcategoryDefinition[];
}

export const MAIN_CATEGORY_DEFINITIONS: MainCategoryDefinition[] = [
  {
    id: 'cameras',
    name: 'Cameras',
    icon: '📷',
    image:
      'https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=1200',
    keywords: ['camera', 'ip camera', 'cctv'],
    subcategories: [
      { name: 'Dome Cameras', keywords: ['dome'] },
      { name: 'Bullet Cameras', keywords: ['bullet'] },
      { name: 'PTZ Cameras', keywords: ['ptz', 'pan tilt zoom'] },
      { name: 'Wi-Fi Cameras', keywords: ['wifi', 'wi-fi', 'wireless'] },
      { name: 'Indoor & Outdoor Cameras', keywords: ['indoor', 'outdoor'] },
    ],
  },
  {
    id: 'dvr-nvr',
    name: 'DVR & NVR',
    icon: '🖥️',
    image:
      'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1200',
    keywords: ['dvr', 'nvr', 'xvr', 'recorder'],
    subcategories: [
      { name: 'DVR Recorders', keywords: ['dvr'] },
      { name: 'NVR Recorders', keywords: ['nvr'] },
      { name: 'XVR / Hybrid Recorders', keywords: ['xvr', 'hybrid'] },
      { name: 'Recorder Kits', keywords: ['kit', 'bundle'] },
    ],
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: '💾',
    image:
      'https://images.pexels.com/photos/33999/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1200',
    keywords: ['storage', 'hdd', 'ssd', 'nas', 'memory', 'sd card'],
    subcategories: [
      { name: 'Surveillance HDD', keywords: ['hdd', 'hard disk'] },
      { name: 'SSD Storage', keywords: ['ssd'] },
      { name: 'Memory Cards', keywords: ['memory card', 'sd card', 'micro sd'] },
      { name: 'Network Storage (NAS)', keywords: ['nas'] },
    ],
  },
  {
    id: 'power-supply',
    name: 'Power Supply',
    icon: '🔌',
    image:
      'https://images.pexels.com/photos/159220/charging-station-charger-jack-plug-159220.jpeg?auto=compress&cs=tinysrgb&w=1200',
    keywords: ['power', 'adapter', 'smps', 'ups', 'volt', 'supply'],
    subcategories: [
      { name: 'SMPS Units', keywords: ['smps'] },
      { name: 'Power Adapters', keywords: ['adapter'] },
      { name: 'UPS Backup', keywords: ['ups', 'backup'] },
      { name: 'Power Cords & Splitters', keywords: ['cord', 'splitter', 'dc plug'] },
    ],
  },
  {
    id: 'networking-poe',
    name: 'Networking (POE devices)',
    icon: '🌐',
    image:
      'https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=1200',
    keywords: ['poe', 'switch', 'injector', 'router', 'network'],
    subcategories: [
      { name: 'POE Switches', keywords: ['poe switch', 'switch'] },
      { name: 'POE Injectors', keywords: ['poe injector', 'injector'] },
      { name: 'Routers & Networking', keywords: ['router', 'network'] },
      { name: 'Network Extenders', keywords: ['extender', 'repeater'] },
    ],
  },
  {
    id: 'cables-connectors',
    name: 'Cables & Connectors',
    icon: '🧵',
    image:
      'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=1200',
    keywords: ['cable', 'connector', 'bnc', 'rj45', 'coax', 'cat6', 'cat5'],
    subcategories: [
      { name: 'Coaxial Cables', keywords: ['coax', 'rg6', 'coaxial'] },
      { name: 'Ethernet Cables', keywords: ['ethernet', 'cat6', 'cat5', 'lan'] },
      { name: 'BNC Connectors', keywords: ['bnc'] },
      { name: 'RJ45 Connectors', keywords: ['rj45'] },
    ],
  },
  {
    id: 'accessories-installation',
    name: 'Accessories & Installation',
    icon: '🛠️',
    image:
      'https://images.pexels.com/photos/159358/construction-site-build-construction-work-159358.jpeg?auto=compress&cs=tinysrgb&w=1200',
    keywords: ['accessory', 'mount', 'bracket', 'junction', 'installation', 'tool'],
    subcategories: [
      { name: 'Mounts & Brackets', keywords: ['mount', 'bracket', 'stand'] },
      { name: 'Junction Boxes', keywords: ['junction', 'box'] },
      { name: 'Installation Tools', keywords: ['tool', 'crimp', 'drill', 'tester'] },
      { name: 'General Accessories', keywords: ['accessory', 'kit', 'cover'] },
    ],
  },
];

export const MAIN_CATEGORIES: Category[] = MAIN_CATEGORY_DEFINITIONS.map(
  ({ id, name, icon, image }) => ({ id, name, icon, image })
);

function normalize(value: string | undefined): string {
  return (value || '').toLowerCase();
}

function includesKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function resolveProductCategory(product: Pick<Product, 'name' | 'category' | 'description'>) {
  const combinedText = normalize(
    `${product.name} ${product.category} ${product.description}`
  );

  for (const mainCategory of MAIN_CATEGORY_DEFINITIONS) {
    for (const subcategory of mainCategory.subcategories) {
      if (includesKeyword(combinedText, subcategory.keywords)) {
        return {
          mainCategoryId: mainCategory.id,
          mainCategoryName: mainCategory.name,
          subcategory: subcategory.name,
        };
      }
    }
  }

  for (const mainCategory of MAIN_CATEGORY_DEFINITIONS) {
    if (includesKeyword(combinedText, mainCategory.keywords)) {
      return {
        mainCategoryId: mainCategory.id,
        mainCategoryName: mainCategory.name,
        subcategory: mainCategory.subcategories[0]?.name || 'General',
      };
    }
  }

  const fallbackCategory = MAIN_CATEGORY_DEFINITIONS.find(
    (category) => category.id === 'accessories-installation'
  ) || MAIN_CATEGORY_DEFINITIONS[0];

  return {
    mainCategoryId: fallbackCategory.id,
    mainCategoryName: fallbackCategory.name,
    subcategory: fallbackCategory.subcategories[0]?.name || 'General',
  };
}

export function findCategoryByParam(param: string | null) {
  if (!param) return null;
  const normalized = normalize(decodeURIComponent(param));

  return (
    MAIN_CATEGORY_DEFINITIONS.find(
      (category) => category.id === normalized || normalize(category.name) === normalized
    ) || null
  );
}
