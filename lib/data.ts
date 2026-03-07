import { Product, Service, Category } from './types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Dome Cameras',
    icon: '📷',
    image: '/images/dome-cameras.jpg',
  },
  {
    id: '2',
    name: 'Bullet Cameras',
    icon: '🔫',
    image: '/images/bullet-cameras.jpg',
  },
  {
    id: '3',
    name: 'PTZ Cameras',
    icon: '🎯',
    image: '/images/ptz-cameras.jpg',
  },
  {
    id: '4',
    name: 'Thermal Cameras',
    icon: '🌡️',
    image: '/images/thermal-cameras.jpg',
  },
  {
    id: '5',
    name: 'Recorders & Storage',
    icon: '💾',
    image: '/images/recorders.jpg',
  },
  {
    id: '6',
    name: 'Accessories',
    icon: '🔧',
    image: '/images/accessories.jpg',
  },
];

export const products: Product[] = [
  {
    id: '1',
    name: '4MP Full HD Dome Camera',
    price: 249.99,
    rating: 4.8,
    reviews: 124,
    image: '/images/product-1.jpg',
    category: 'Dome Cameras',
    specs: {
      resolution: '4MP (2560×1920)',
      sensor: '1/2.8" Progressive Scan CMOS',
      'lens angle': '103.6°',
      'night vision': 'IR LED up to 20m',
      'weatherproof': 'IP67',
    },
    description:
      'Professional dome camera with 4MP resolution, ideal for indoor surveillance. Features advanced motion detection and night vision capabilities.',
    inStock: true,
  },
  {
    id: '2',
    name: '5MP Ultra HD Bullet Camera',
    price: 179.99,
    rating: 4.6,
    reviews: 89,
    image: '/images/product-2.jpg',
    category: 'Bullet Cameras',
    specs: {
      resolution: '5MP (2560×2048)',
      sensor: '1/1.8" Progressive Scan CMOS',
      'lens angle': '107.2°',
      'night vision': 'IR LED up to 30m',
      'weatherproof': 'IP66',
    },
    description:
      'Compact bullet camera with exceptional 5MP resolution. Perfect for outdoor surveillance with enhanced weatherproofing.',
    inStock: true,
  },
  {
    id: '3',
    name: 'HD PTZ Dome Camera',
    price: 599.99,
    rating: 4.9,
    reviews: 56,
    image: '/images/product-3.jpg',
    category: 'PTZ Cameras',
    specs: {
      resolution: '2MP (1920×1080)',
      sensor: '1/3" Progressive Scan CMOS',
      'pan/tilt': '0° to 360° / -90° to 90°',
      zoom: '20x Optical + 16x Digital',
      'night vision': 'IR LED up to 50m',
    },
    description:
      'Advanced PTZ camera with 20x optical zoom. Ideal for large area monitoring with intelligent tracking features.',
    inStock: true,
  },
  {
    id: '4',
    name: 'HD Thermal Camera',
    price: 899.99,
    rating: 5.0,
    reviews: 32,
    image: '/images/product-4.jpg',
    category: 'Thermal Cameras',
    specs: {
      resolution: '640×512 Thermal',
      sensor: 'Uncooled Microbolometer',
      'temperature range': '-20°C to 550°C',
      'thermal sensitivity': '< 50mK',
      'detection range': 'Up to 1000m',
    },
    description:
      'Professional thermal imaging camera for 24/7 surveillance without visible light. Perfect for high-security applications.',
    inStock: false,
  },
  {
    id: '5',
    name: 'Professional 16-Channel DVR',
    price: 449.99,
    rating: 4.7,
    reviews: 78,
    image: '/images/product-5.jpg',
    category: 'Recorders & Storage',
    specs: {
      channels: '16 Channels',
      resolution: 'Up to 4MP per channel',
      storage: 'Up to 8TB HDD',
      'bandwidth': '320 Mbps',
      interfaces: 'HDMI, VGA, USB',
    },
    description:
      'Enterprise-grade 16-channel DVR recorder. Supports mixed resolution recording and advanced search features.',
    inStock: true,
  },
  {
    id: '6',
    name: 'Coaxial Cable Roll 1000ft',
    price: 89.99,
    rating: 4.4,
    reviews: 45,
    image: '/images/product-6.jpg',
    category: 'Accessories',
    specs: {
      'cable type': 'RG-59',
      impedance: '75Ω',
      'length': '1000 feet',
      'thickness': '0.242"',
      color: 'Black',
    },
    description:
      'High-quality coaxial cable for CCTV installations. Professional-grade with superior shielding.',
    inStock: true,
  },
  {
    id: '7',
    name: '2MP Smart Dome Camera',
    price: 199.99,
    rating: 4.5,
    reviews: 67,
    image: '/images/product-7.jpg',
    category: 'Dome Cameras',
    specs: {
      resolution: '2MP (1920×1080)',
      sensor: '1/3" Progressive Scan CMOS',
      'lens angle': '110°',
      'night vision': 'IR LED up to 15m',
      smart: 'AI Motion Detection',
    },
    description:
      'Smart dome camera with AI-powered motion detection. Reduces false alarms with intelligent video analytics.',
    inStock: true,
  },
  {
    id: '8',
    name: 'IP Network Switch PoE',
    price: 279.99,
    rating: 4.6,
    reviews: 52,
    image: '/images/product-8.jpg',
    category: 'Accessories',
    specs: {
      ports: '16 Gigabit + 2 SFP',
      'poe power': '240W total',
      'switching capacity': '240 Gbps',
      'vlan support': 'Yes',
      management: 'Web Interface',
    },
    description:
      'Industrial-grade PoE switch designed for CCTV network infrastructure. Provides power and data over Ethernet.',
    inStock: true,
  },
];

export const services: Service[] = [
  {
    id: '1',
    name: 'CCTV Installation',
    description:
      'Professional installation of CCTV systems with site assessment and cable management',
    icon: '🔧',
    price: 500,
  },
  {
    id: '2',
    name: 'Security Consultation',
    description:
      'Expert security assessment and system design recommendations for your property',
    icon: '📋',
    price: 200,
  },
  {
    id: '3',
    name: 'Maintenance & Repair',
    description:
      'Regular maintenance and emergency repair services for all CCTV equipment',
    icon: '🛠️',
    price: 150,
  },
  {
    id: '4',
    name: 'Smart Home Security',
    description:
      'Integration of CCTV with smart home systems for comprehensive security automation',
    icon: '🏠',
    price: 800,
  },
  {
    id: '5',
    name: 'Cloud Storage & Backup',
    description:
      'Secure cloud backup of your surveillance footage with 24/7 access',
    icon: '☁️',
    price: 99,
  },
];

export const whyChooseUs = [
  {
    title: '20+ Years Experience',
    description:
      'Over two decades of industry expertise in security systems and customer service.',
  },
  {
    title: 'Expert Technical Support',
    description:
      'Dedicated support team available 24/7 to assist with your security needs.',
  },
  {
    title: 'Premium Quality Products',
    description:
      'Only the highest-grade CCTV equipment from trusted manufacturers worldwide.',
  },
  {
    title: 'Competitive Pricing',
    description:
      'Best value for money with flexible financing options available for all budgets.',
  },
];
