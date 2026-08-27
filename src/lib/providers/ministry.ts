// Ministry of Ecological Transition (MITECO) Fuel API Provider

export interface RawMinistryStation {
  'C.P.': string;
  'Dirección': string;
  'Horario': string;
  'Latitud': string;
  'Localidad': string;
  'Longitud (WGS84)': string;
  'Margen': string;
  'Municipio': string;
  'Precio Adblue'?: string;
  'Precio Biodiesel'?: string;
  'Precio Bioetanol'?: string;
  'Precio Biogas Natural Comprimido'?: string;
  'Precio Biogas Natural Licuado'?: string;
  'Precio Diésel Renovable'?: string;
  'Precio Gas Natural Comprimido'?: string;
  'Precio Gas Natural Licuado'?: string;
  'Precio Gases licuados del petróleo'?: string;
  'Precio Gasoleo A'?: string;
  'Precio Gasoleo B'?: string;
  'Precio Gasoleo Premium'?: string;
  'Precio Gasolina 95 E10'?: string;
  'Precio Gasolina 95 E25'?: string;
  'Precio Gasolina 95 E5'?: string;
  'Precio Gasolina 95 E5 Premium'?: string;
  'Precio Gasolina 95 E85'?: string;
  'Precio Gasolina 98 E10'?: string;
  'Precio Gasolina 98 E5'?: string;
  'Precio Gasolina Renovable'?: string;
  'Precio Hidrogeno'?: string;
  'Provincia': string;
  'Remisión': string;
  'Rótulo': string;
  'Tipo Venta': string;
  'IDEESS': string;
  'IDMunicipio': string;
  'IDProvincia': string;
  'IDCCAA': string;
}

export interface MinistryResponse {
  Fecha: string;
  Nota?: string;
  ResultadoConsulta?: string;
  ListaEESSPrecio: RawMinistryStation[];
}

export interface NormalizedStation {
  ministryId: string;
  brand: string;
  rawBrand: string;
  name: string;
  address: string;
  locality?: string;
  municipality: string;
  municipalityId: string;
  province: string;
  provinceId: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  schedule?: string;
  margin?: string;
  saleType?: string;
  prices: Record<string, number>;
}

export class MinistryFuelProvider {
  private static BASE_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes';

  /**
   * Helper to normalize Spanish formatted numbers (e.g. "1,529" -> 1.529 or "39,211417" -> 39.211417)
   */
  public static parseSpanishFloat(val?: string | null): number | null {
    if (!val || typeof val !== 'string') return null;
    const clean = val.trim().replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }

  /**
   * Normalize brand names into standardized brand names for program matching
   */
  public static normalizeBrand(rawBrand: string): string {
    if (!rawBrand) return 'OTRA';
    const b = rawBrand.toUpperCase().trim();

    if (b.includes('REPSOL') || b.includes('CAMPSA') || b.includes('PETRONOR')) return 'REPSOL';
    if (b.includes('CEPSA') || b.includes('MOEVE')) return 'CEPSA';
    if (b.includes('BP')) return 'BP';
    if (b.includes('SHELL')) return 'SHELL';
    if (b.includes('GALP')) return 'GALP';
    if (b.includes('PLENOIL')) return 'PLENOIL';
    if (b.includes('BALLENOIL')) return 'BALLENOIL';
    if (b.includes('PETROPRIX')) return 'PETROPRIX';
    if (b.includes('ALCAMPO')) return 'ALCAMPO';
    if (b.includes('CARREFOUR')) return 'CARREFOUR';
    if (b.includes('EROSKI')) return 'EROSKI';
    if (b.includes('ESCLATOIL') || b.includes('BONPREU')) return 'ESCLATOIL';
    if (b.includes('AVIA')) return 'AVIA';
    if (b.includes('Q8')) return 'Q8';
    if (b.includes('DISA')) return 'DISA';
    if (b.includes('MEROIL')) return 'MEROIL';
    if (b.includes('AUTONETOIL')) return 'AUTONETOIL';
    if (b.includes('EASYGAS')) return 'EASYGAS';
    if (b.includes('VALCARCE')) return 'VALCARCE';

    return b;
  }

  /**
   * Fetch all stations from MITECO API
   */
  public async getAllStations(): Promise<{ stations: NormalizedStation[]; date: string }> {
    const url = `${MinistryFuelProvider.BASE_URL}/EstacionesTerrestres/`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'FuelIQ-App/1.0',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch from Ministry API: ${res.status} ${res.statusText}`);
    }

    const data: MinistryResponse = await res.json();
    const stations = this.normalizeStationList(data.ListaEESSPrecio || []);
    return { stations, date: data.Fecha };
  }

  /**
   * Fetch stations by Province ID (useful for selective sync or fast testing)
   */
  public async getStationsByProvince(provinceId: string): Promise<NormalizedStation[]> {
    const url = `${MinistryFuelProvider.BASE_URL}/EstacionesTerrestres/FiltroProvincia/${provinceId}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch province ${provinceId}: ${res.status}`);
    }

    const data: MinistryResponse = await res.json();
    return this.normalizeStationList(data.ListaEESSPrecio || []);
  }

  /**
   * Normalize raw API records into FuelIQ NormalizedStation objects
   */
  private normalizeStationList(rawList: RawMinistryStation[]): NormalizedStation[] {
    const normalized: NormalizedStation[] = [];

    for (const item of rawList) {
      const lat = MinistryFuelProvider.parseSpanishFloat(item['Latitud']);
      const lng = MinistryFuelProvider.parseSpanishFloat(item['Longitud (WGS84)']);

      if (!item.IDEESS || lat === null || lng === null) continue;

      const prices: Record<string, number> = {};

      const g95 = MinistryFuelProvider.parseSpanishFloat(item['Precio Gasolina 95 E5']);
      if (g95) prices['GASOLINA_95_E5'] = g95;

      const g98 = MinistryFuelProvider.parseSpanishFloat(item['Precio Gasolina 98 E5']);
      if (g98) prices['GASOLINA_98_E5'] = g98;

      const dieselA = MinistryFuelProvider.parseSpanishFloat(item['Precio Gasoleo A']);
      if (dieselA) prices['GASOLEO_A'] = dieselA;

      const dieselPrem = MinistryFuelProvider.parseSpanishFloat(item['Precio Gasoleo Premium']);
      if (dieselPrem) prices['GASOLEO_PREMIUM'] = dieselPrem;

      const dieselB = MinistryFuelProvider.parseSpanishFloat(item['Precio Gasoleo B']);
      if (dieselB) prices['GASOLEO_B'] = dieselB;

      const glp = MinistryFuelProvider.parseSpanishFloat(item['Precio Gases licuados del petróleo']);
      if (glp) prices['GLP'] = glp;

      const gnc = MinistryFuelProvider.parseSpanishFloat(item['Precio Gas Natural Comprimido']);
      if (gnc) prices['GNC'] = gnc;

      const gnl = MinistryFuelProvider.parseSpanishFloat(item['Precio Gas Natural Licuado']);
      if (gnl) prices['GNL'] = gnl;

      const dieselRen = MinistryFuelProvider.parseSpanishFloat(item['Precio Diésel Renovable']);
      if (dieselRen) prices['DIESEL_RENOVABLE'] = dieselRen;

      const hidrogeno = MinistryFuelProvider.parseSpanishFloat(item['Precio Hidrogeno']);
      if (hidrogeno) prices['HIDROGENO'] = hidrogeno;

      const adblue = MinistryFuelProvider.parseSpanishFloat(item['Precio Adblue']);
      if (adblue) prices['ADBLUE'] = adblue;

      const g95e10 = MinistryFuelProvider.parseSpanishFloat(item['Precio Gasolina 95 E10']);
      if (g95e10) prices['GASOLINA_95_E10'] = g95e10;

      const rawBrand = item['Rótulo'] || 'DESCONOCIDO';
      const brand = MinistryFuelProvider.normalizeBrand(rawBrand);

      normalized.push({
        ministryId: item.IDEESS,
        brand,
        rawBrand,
        name: `${brand} - ${item['Dirección'] || item['Municipio']}`,
        address: item['Dirección'] || '',
        locality: item['Localidad'] || undefined,
        municipality: item['Municipio'] || '',
        municipalityId: item.IDMunicipio || '',
        province: item['Provincia'] || '',
        provinceId: item.IDProvincia || '',
        postalCode: item['C.P.'] || '',
        latitude: lat,
        longitude: lng,
        schedule: item['Horario'] || '',
        margin: item['Margen'] || '',
        saleType: item['Tipo Venta'] || 'P',
        prices,
      });
    }

    return normalized;
  }
}
