import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/bag/postcode?postcode=1234AB&huisnummer=12
 * 
 * Fetches address data from BAG API based on postcode and house number
 * Returns: straatnaam, huisnummer, woonplaats
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postcode = searchParams.get('postcode');
    const huisnummer = searchParams.get('huisnummer');

    if (!postcode) {
      return NextResponse.json(
        { success: false, error: 'Postcode is verplicht' },
        { status: 400 }
      );
    }

    // Validate postcode format (1234AB)
    const postcodeRegex = /^[1-9][0-9]{3}\s?[A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode)) {
      return NextResponse.json(
        { success: false, error: 'Ongeldig postcode formaat' },
        { status: 400 }
      );
    }

    // Get BAG API key from environment
    const bagApiKey = process.env.BAG_API_KEY;
    if (!bagApiKey) {
      console.error('BAG_API_KEY is niet ingesteld in .env');
      return NextResponse.json(
        { success: false, error: 'BAG API configuratie ontbreekt' },
        { status: 500 }
      );
    }

    // Normalize postcode (remove spaces, uppercase)
    const normalizedPostcode = postcode.replace(/\s/g, '').toUpperCase();
    const postcodePart = normalizedPostcode.substring(0, 4);
    const letterPart = normalizedPostcode.substring(4, 6);

    // BAG API endpoint - using adres lookup by postcode
    // Documentation: https://github.com/lvbag/BAG-API/tree/master/Technische%20specificatie
    // 
    // Common BAG API endpoints:
    // - v2: https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2/adressenuitgebreid
    // - v1: https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v1/adressen
    //
    // Note: Adjust the endpoint URL based on your BAG API version and subscription
    
    // Try v2 endpoint first (most common)
    let bagApiUrl = `https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2/adressenuitgebreid`;
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      postcode: normalizedPostcode,
    });

    if (huisnummer) {
      queryParams.append('huisnummer', huisnummer);
    }

    // Make request to BAG API
    // Authentication: Check BAG API docs for correct header name (could be X-Api-Key, Authorization, etc.)
    const response = await fetch(`${bagApiUrl}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': bagApiKey, // May need to be 'Authorization: Bearer <key>' or other format
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BAG API error:', response.status, errorText);
      
      // If 404, postcode doesn't exist
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Postcode niet gevonden' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Fout bij ophalen adresgegevens',
          details: process.env.NODE_ENV === 'development' ? errorText : undefined,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Parse BAG API response
    // Note: The exact structure depends on BAG API version
    // This is a generic parser that may need adjustment
    let straatnaam = '';
    let huisnummerStr = '';
    let woonplaats = '';

    if (data._embedded && data._embedded.adressen && data._embedded.adressen.length > 0) {
      const adres = data._embedded.adressen[0];
      
      // Extract street name
      if (adres.openbareRuimte) {
        straatnaam = adres.openbareRuimte.naam || '';
      }
      
      // Extract house number
      if (adres.huisnummer) {
        huisnummerStr = String(adres.huisnummer);
        if (adres.huisletter) {
          huisnummerStr += adres.huisletter;
        }
        if (adres.huisnummertoevoeging) {
          huisnummerStr += '-' + adres.huisnummertoevoeging;
        }
      }
      
      // Extract city
      if (adres.woonplaats) {
        woonplaats = adres.woonplaats.naam || '';
      }
    } else if (data.adressen && data.adressen.length > 0) {
      // Alternative response structure
      const adres = data.adressen[0];
      straatnaam = adres.straatnaam || '';
      huisnummerStr = adres.huisnummer || '';
      woonplaats = adres.woonplaats || '';
    } else {
      return NextResponse.json(
        { success: false, error: 'Geen adresgegevens gevonden voor deze postcode' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        straatnaam,
        huisnummer: huisnummerStr,
        woonplaats,
        postcode: normalizedPostcode,
      },
    });

  } catch (error) {
    console.error('Error fetching BAG data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis bij het ophalen van adresgegevens',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

