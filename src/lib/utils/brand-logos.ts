/**
 * Official and crisp brand logos, colors and badge styles for Spanish gas station networks
 */

export interface BrandInfo {
  name: string;
  logoText: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  bgGradient: string;
  borderClass: string;
  svgIcon?: string;
}

export function getBrandInfo(rawBrand: string): BrandInfo {
  const brand = (rawBrand || '').toUpperCase().trim();

  if (brand.includes('REPSOL')) {
    return {
      name: 'Repsol',
      logoText: 'REPSOL',
      primaryColor: '#FF5E00',
      secondaryColor: '#002B49',
      textColor: '#FF8A00',
      bgGradient: 'from-[#FF5E00] to-[#E54800]',
      borderClass: 'border-[#FF5E00]/40',
    };
  }

  if (brand.includes('CEPSA') || brand.includes('MOEVE')) {
    return {
      name: 'Moeve / Cepsa',
      logoText: 'MOEVE',
      primaryColor: '#E60000',
      secondaryColor: '#1A1A1A',
      textColor: '#FF4D4D',
      bgGradient: 'from-[#E60000] to-[#990000]',
      borderClass: 'border-[#E60000]/40',
    };
  }

  if (brand.includes('BP')) {
    return {
      name: 'BP',
      logoText: 'BP',
      primaryColor: '#00A651',
      secondaryColor: '#FFD100',
      textColor: '#00D97E',
      bgGradient: 'from-[#00A651] to-[#007036]',
      borderClass: 'border-[#00A651]/40',
    };
  }

  if (brand.includes('SHELL')) {
    return {
      name: 'Shell',
      logoText: 'SHELL',
      primaryColor: '#FFD100',
      secondaryColor: '#DD1D21',
      textColor: '#FFD100',
      bgGradient: 'from-[#FFD100] to-[#FFA800]',
      borderClass: 'border-[#FFD100]/40',
    };
  }

  if (brand.includes('GALP')) {
    return {
      name: 'Galp',
      logoText: 'GALP',
      primaryColor: '#FF6600',
      secondaryColor: '#2B2B2B',
      textColor: '#FF7A00',
      bgGradient: 'from-[#FF6600] to-[#D94F00]',
      borderClass: 'border-[#FF6600]/40',
    };
  }

  if (brand.includes('PLENOIL') || brand.includes('PLENERGY')) {
    return {
      name: 'Plenoil',
      logoText: 'PLENOIL',
      primaryColor: '#0075FF',
      secondaryColor: '#00D97E',
      textColor: '#00B2FF',
      bgGradient: 'from-[#0075FF] to-[#0055B3]',
      borderClass: 'border-[#0075FF]/40',
    };
  }

  if (brand.includes('BALLENOIL')) {
    return {
      name: 'Ballenoil',
      logoText: 'BALLENOIL',
      primaryColor: '#00C2FF',
      secondaryColor: '#0047FF',
      textColor: '#00C2FF',
      bgGradient: 'from-[#00C2FF] to-[#0070E0]',
      borderClass: 'border-[#00C2FF]/40',
    };
  }

  if (brand.includes('PETROPRIX')) {
    return {
      name: 'Petroprix',
      logoText: 'PETROPRIX',
      primaryColor: '#8000FF',
      secondaryColor: '#FF007A',
      textColor: '#C084FC',
      bgGradient: 'from-[#8000FF] to-[#5500AA]',
      borderClass: 'border-[#8000FF]/40',
    };
  }

  if (brand.includes('AUTONET') || brand.includes('AUTONETOIL')) {
    return {
      name: 'Autonet&Oil',
      logoText: 'AUTONET',
      primaryColor: '#00B894',
      secondaryColor: '#0984E3',
      textColor: '#55EFC4',
      bgGradient: 'from-[#00B894] to-[#00cec9]',
      borderClass: 'border-[#00B894]/40',
    };
  }

  if (brand.includes('CARREFOUR')) {
    return {
      name: 'Carrefour',
      logoText: 'CARREFOUR',
      primaryColor: '#0055A5',
      secondaryColor: '#EE1C25',
      textColor: '#3399FF',
      bgGradient: 'from-[#0055A5] to-[#EE1C25]',
      borderClass: 'border-[#0055A5]/40',
    };
  }

  if (brand.includes('ALCAMPO')) {
    return {
      name: 'Alcampo',
      logoText: 'ALCAMPO',
      primaryColor: '#E60000',
      secondaryColor: '#FFFFFF',
      textColor: '#FF6B6B',
      bgGradient: 'from-[#E60000] to-[#B30000]',
      borderClass: 'border-[#E60000]/40',
    };
  }

  if (brand.includes('BONAREA') || brand.includes('BONÀREA')) {
    return {
      name: 'BonÀrea',
      logoText: 'bonÀrea',
      primaryColor: '#00843D',
      secondaryColor: '#F7D117',
      textColor: '#4ADE80',
      bgGradient: 'from-[#00843D] to-[#005A29]',
      borderClass: 'border-[#00843D]/40',
    };
  }

  if (brand.includes('AVIA')) {
    return {
      name: 'AVIA',
      logoText: 'AVIA',
      primaryColor: '#E30613',
      secondaryColor: '#FFFFFF',
      textColor: '#FF4D4D',
      bgGradient: 'from-[#E30613] to-[#9E040D]',
      borderClass: 'border-[#E30613]/40',
    };
  }

  if (brand.includes('VALCARCE')) {
    return {
      name: 'Valcarce',
      logoText: 'VALCARCE',
      primaryColor: '#002B49',
      secondaryColor: '#FFB81C',
      textColor: '#38BDF8',
      bgGradient: 'from-[#002B49] to-[#001726]',
      borderClass: 'border-[#002B49]/40',
    };
  }

  if (brand.includes('DISA')) {
    return {
      name: 'DISA',
      logoText: 'DISA',
      primaryColor: '#ED1C24',
      secondaryColor: '#FFFFFF',
      textColor: '#F87171',
      bgGradient: 'from-[#ED1C24] to-[#A01015]',
      borderClass: 'border-[#ED1C24]/40',
    };
  }

  if (brand.includes('MEROIL')) {
    return {
      name: 'Meroil',
      logoText: 'MEROIL',
      primaryColor: '#004B87',
      secondaryColor: '#F7A800',
      textColor: '#60A5FA',
      bgGradient: 'from-[#004B87] to-[#002E54]',
      borderClass: 'border-[#004B87]/40',
    };
  }

  if (brand.includes('Q8')) {
    return {
      name: 'Q8',
      logoText: 'Q8',
      primaryColor: '#003399',
      secondaryColor: '#FFCC00',
      textColor: '#93C5FD',
      bgGradient: 'from-[#003399] to-[#001F5C]',
      borderClass: 'border-[#003399]/40',
    };
  }

  if (brand.includes('CAMPSA') || brand.includes('PETRONOR')) {
    return {
      name: 'Campsa',
      logoText: 'CAMPSA',
      primaryColor: '#FF5E00',
      secondaryColor: '#002B49',
      textColor: '#FF8A00',
      bgGradient: 'from-[#FF5E00] to-[#E54800]',
      borderClass: 'border-[#FF5E00]/40',
    };
  }

  // Default / Independent station
  return {
    name: brand || 'Gasolinera',
    logoText: brand.slice(0, 6) || 'GAS',
    primaryColor: '#475569',
    secondaryColor: '#0F172A',
    textColor: '#CBD5E1',
    bgGradient: 'from-[#334155] to-[#1E293B]',
    borderClass: 'border-white/10',
  };
}
