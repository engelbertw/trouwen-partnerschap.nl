import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babs, babsGemeente, ceremonie, typeCeremonie, babsRecurringRule, babsBlockedDate } from '@/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { getGemeenteContext } from '@/lib/gemeente';

/**
 * GET /api/ceremonie/beschikbare-babs
 * Get available BABS for a specific date and time
 * 
 * Query parameters:
 * - datum: Date (YYYY-MM-DD) - required
 * - startTijd: Time (HH:MM) - required
 * - duurMinuten: Duration in minutes (default: 60)
 * - taal: Language code (nl, en, de, fr) - optional, for language matching
 * - typeCeremonieId: UUID of ceremony type (optional, for language matching)
 * - locatieId: UUID of location (optional, for location-specific filtering)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const datum = searchParams.get('datum');
    const startTijd = searchParams.get('startTijd');
    const duurMinuten = parseInt(searchParams.get('duurMinuten') || '60');
    const taal = searchParams.get('taal');
    const typeCeremonieId = searchParams.get('typeCeremonieId');
    const locatieId = searchParams.get('locatieId');

    // Validation
    if (!datum || !startTijd) {
      return NextResponse.json(
        { success: false, error: 'datum en startTijd zijn verplicht' },
        { status: 400 }
      );
    }

    // Parse time to calculate end time
    const [hours, minutes] = startTijd.split(':').map(Number);
    const startTimeObj = new Date(`${datum}T${startTijd}:00`);
    const endTimeObj = new Date(startTimeObj.getTime() + duurMinuten * 60 * 1000);
    const eindTijd = `${String(endTimeObj.getHours()).padStart(2, '0')}:${String(endTimeObj.getMinutes()).padStart(2, '0')}`;

    // Get required languages
    // Priority: 1. Direct taal parameter, 2. typeCeremonieId talen
    let requiredTalen: string[] = [];
    
    console.log('🔍 Taal parameter check:', {
      taal,
      taalType: typeof taal,
      taalIsNull: taal === null,
      taalIsUndefined: taal === undefined,
      taalIsFalsy: !taal,
      typeCeremonieId,
    });
    
    if (taal) {
      // If taal is directly provided, use it
      requiredTalen = [taal];
      console.log('✅ Using direct taal parameter:', requiredTalen);
    } else if (typeCeremonieId) {
      // Otherwise, get languages from ceremony type
      const [typeCeremonieData] = await db
        .select({ talen: typeCeremonie.talen })
        .from(typeCeremonie)
        .where(eq(typeCeremonie.id, typeCeremonieId))
        .limit(1);

      if (typeCeremonieData) {
        requiredTalen = Array.isArray(typeCeremonieData.talen) ? typeCeremonieData.talen : ['nl'];
        console.log('✅ Using talen from typeCeremonie:', requiredTalen);
      }
    } else {
      console.log('⚠️ GEEN taal filter - noch taal parameter noch typeCeremonieId aanwezig!');
    }

    // Get BABS linked to this gemeente
    const babsList = await db
      .select({
        id: babs.id,
        naam: babs.naam,
        voornaam: babs.voornaam,
        tussenvoegsel: babs.tussenvoegsel,
        achternaam: babs.achternaam,
        talen: babs.talen,
        status: babs.status,
        beschikbaarheid: babs.beschikbaarheid,
        beschikbaarVanaf: babs.beschikbaarVanaf,
        beschikbaarTot: babs.beschikbaarTot,
        actief: babs.actief,
      })
      .from(babs)
      .innerJoin(babsGemeente, eq(babs.id, babsGemeente.babsId))
      .where(
        and(
          eq(babsGemeente.gemeenteOin, context.data.gemeenteOin),
          eq(babsGemeente.actief, true),
          eq(babs.actief, true),
          eq(babs.status, 'beedigd') // Only show beëdigd BABS
        )
      )
      .orderBy(babs.achternaam, babs.voornaam);

    // Debug: log all BABS found
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 BABS found for gemeente:');
      console.log(JSON.stringify({
        gemeenteOin: context.data.gemeenteOin,
        gemeenteNaam: context.data.gemeenteNaam,
        totalBabs: babsList.length,
        requiredTalen: requiredTalen.length > 0 ? requiredTalen : 'geen filter',
        filters: {
          datum,
          startTijd,
          eindTijd,
          taal: taal || 'niet opgegeven',
        },
        babs: babsList.map(b => ({
          naam: b.naam,
          status: b.status,
          actief: b.actief,
          talen: b.talen, // Nu zichtbaar met JSON.stringify
          heeftBeschikbaarheid: !!b.beschikbaarheid,
        })),
      }, null, 2));
    }

    // Filter BABS based on availability
    const beschikbareBabs = [];
    const debugLog: string[] = [];

    for (const babsItem of babsList) {
      let skipReason = '';

      // Check if BABS has required languages
      if (requiredTalen.length > 0) {
        const babsTalen = Array.isArray(babsItem.talen) ? babsItem.talen : ['nl'];
        const hasMatchingLanguage = requiredTalen.some((taal: string) => babsTalen.includes(taal));
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Taal check voor ${babsItem.naam}:`, {
            requiredTalen,
            babsTalen,
            hasMatchingLanguage,
          });
        }
        
        if (!hasMatchingLanguage) {
          skipReason = `Missing required language (has: ${babsTalen.join(', ')}, needs: ${requiredTalen.join(', ')})`;
          debugLog.push(`${babsItem.naam}: ${skipReason}`);
          continue; // Skip BABS that don't speak required languages
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚠️ GEEN taal filter actief - alle BABS worden toegelaten (requiredTalen is leeg)`);
        }
      }

      // Check date availability (beschikbaarVanaf / beschikbaarTot)
      if (babsItem.beschikbaarVanaf && datum < babsItem.beschikbaarVanaf) {
        skipReason = `Not yet available (available from ${babsItem.beschikbaarVanaf})`;
        debugLog.push(`${babsItem.naam}: ${skipReason}`);
        continue; // Not yet available
      }
      if (babsItem.beschikbaarTot && datum > babsItem.beschikbaarTot) {
        skipReason = `No longer available (available until ${babsItem.beschikbaarTot})`;
        debugLog.push(`${babsItem.naam}: ${skipReason}`);
        continue; // No longer available
      }

      // Check if BABS already has a ceremony at this time
      const existingCeremonie = await db
        .select()
        .from(ceremonie)
        .where(
          and(
            eq(ceremonie.babsId, babsItem.id),
            eq(ceremonie.datum, datum),
            or(
              // Overlapping time slots: ceremony starts before requested end and ends after requested start
              sql`${ceremonie.startTijd}::time <= ${eindTijd}::time AND ${ceremonie.eindTijd}::time > ${startTijd}::time`
            )
          )
        )
        .limit(1);

      if (existingCeremonie.length > 0) {
        skipReason = `Already has ceremony at ${existingCeremonie[0].startTijd}-${existingCeremonie[0].eindTijd}`;
        debugLog.push(`${babsItem.naam}: ${skipReason}`);
        continue; // BABS already has a ceremony at this time
      }

      // Check if date is blocked
      const [blockedDate] = await db
        .select()
        .from(babsBlockedDate)
        .where(
          and(
            eq(babsBlockedDate.babsId, babsItem.id),
            eq(babsBlockedDate.blockedDate, datum),
            or(
              eq(babsBlockedDate.allDay, true),
              sql`${babsBlockedDate.startTime}::time <= ${eindTijd}::time AND ${babsBlockedDate.endTime}::time > ${startTijd}::time`
            )
          )
        )
        .limit(1);

      if (blockedDate) {
        skipReason = `Date ${datum} is blocked`;
        debugLog.push(`${babsItem.naam}: ${skipReason}`);
        continue; // Date is blocked
      }

      // Get day of week (0 = Sunday, 1 = Monday, etc.)
      const dateObj = new Date(datum);
      const dayOfWeek = dateObj.getDay();

      // Check recurring rules first (new calendar system)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Querying recurring rules for ${babsItem.naam} (ID: ${babsItem.id})`);
      }
      
      const allRecurringRules = await db
        .select()
        .from(babsRecurringRule)
        .where(eq(babsRecurringRule.babsId, babsItem.id));

      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Found ${allRecurringRules.length} recurring rules for ${babsItem.naam}`);
        if (allRecurringRules.length === 0) {
          console.log(`⚠️ No recurring rules found in database for BABS ID ${babsItem.id}`);
        }
      }

      // Filter rules that apply to this date
      // Note: validFrom and validUntil are date strings (YYYY-MM-DD), datum is also YYYY-MM-DD
      const recurringRules = allRecurringRules.filter((rule) => {
        // Check validity period (string comparison works for YYYY-MM-DD format)
        if (rule.validFrom > datum) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ Rule ${rule.id} for ${babsItem.naam}: validFrom (${rule.validFrom}) > date (${datum})`);
          }
          return false;
        }
        if (rule.validUntil && rule.validUntil < datum) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ Rule ${rule.id} for ${babsItem.naam}: validUntil (${rule.validUntil}) < date (${datum})`);
          }
          return false;
        }

        // Check if rule applies to this day of week
        if (rule.ruleType === 'workdays') {
          // Monday (1) to Friday (5)
          const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 5;
          if (isWorkday) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Rule ${rule.id} for ${babsItem.naam}: workdays rule matches dayOfWeek ${dayOfWeek} (workday)`);
            }
            return true;
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log(`❌ Rule ${rule.id} for ${babsItem.naam}: workdays rule excludes dayOfWeek ${dayOfWeek} (weekend)`);
            }
            return false;
          }
        }
        if (rule.ruleType === 'weekly' && rule.dayOfWeek === dayOfWeek) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Rule ${rule.id} for ${babsItem.naam}: weekly rule matches dayOfWeek ${dayOfWeek}`);
          }
          return true;
        }
        if (rule.ruleType === 'biweekly' && rule.dayOfWeek === dayOfWeek) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Rule ${rule.id} for ${babsItem.naam}: biweekly rule matches dayOfWeek ${dayOfWeek}`);
          }
          return true;
        }
        if (rule.ruleType === 'monthly_weekday' && rule.dayOfWeek === dayOfWeek) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Rule ${rule.id} for ${babsItem.naam}: monthly_weekday rule matches dayOfWeek ${dayOfWeek}`);
          }
          return true;
        }
        if (rule.ruleType === 'monthly_day') {
          const dayOfMonth = new Date(datum).getDate();
          if (rule.dayOfMonth === dayOfMonth) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Rule ${rule.id} for ${babsItem.naam}: monthly_day rule matches dayOfMonth ${dayOfMonth}`);
            }
            return true;
          }
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`❌ Rule ${rule.id} for ${babsItem.naam}: no match - type=${rule.ruleType}, dayOfWeek=${rule.dayOfWeek}, dateDayOfWeek=${dayOfWeek}`);
        }
        return false;
      });

      // Debug: log recurring rules
      if (process.env.NODE_ENV === 'development') {
        console.log(`📅 Recurring rules for ${babsItem.naam}:`, {
          totalRules: allRecurringRules.length,
          matchingRules: recurringRules.length,
          date: datum,
          dayOfWeek,
          requestedTime: `${startTijd}-${eindTijd}`,
          allRules: allRecurringRules.map(r => ({
            id: r.id,
            type: r.ruleType,
            dayOfWeek: r.dayOfWeek,
            dayOfMonth: r.dayOfMonth,
            startTime: r.startTime,
            endTime: r.endTime,
            validFrom: r.validFrom,
            validUntil: r.validUntil,
            matches: recurringRules.some(mr => mr.id === r.id),
            reason: (() => {
              if (r.validFrom > datum) return `validFrom (${r.validFrom}) > date (${datum})`;
              if (r.validUntil && r.validUntil < datum) return `validUntil (${r.validUntil}) < date (${datum})`;
              if (r.ruleType === 'weekly' && r.dayOfWeek !== dayOfWeek) return `dayOfWeek mismatch: rule=${r.dayOfWeek}, date=${dayOfWeek}`;
              if (r.ruleType === 'monthly_day') {
                const dayOfMonth = new Date(datum).getDate();
                if (r.dayOfMonth !== dayOfMonth) return `dayOfMonth mismatch: rule=${r.dayOfMonth}, date=${dayOfMonth}`;
              }
              return 'matches';
            })(),
          })),
        });
      }

      let isAvailableViaRecurring = false;
      if (recurringRules.length > 0) {
        // Check if requested time fits within any recurring rule
        isAvailableViaRecurring = recurringRules.some((rule) => {
          const ruleStartTime = rule.startTime.split(':').map(Number);
          const ruleEndTime = rule.endTime.split(':').map(Number);
          const ruleStartMinutes = ruleStartTime[0] * 60 + ruleStartTime[1];
          const ruleEndMinutes = ruleEndTime[0] * 60 + ruleEndTime[1];
          const requestedStartMinutes = hours * 60 + minutes;
          const requestedEndMinutes = requestedStartMinutes + duurMinuten;

          const fits = requestedStartMinutes >= ruleStartMinutes && requestedEndMinutes <= ruleEndMinutes;
          
          if (process.env.NODE_ENV === 'development' && !fits) {
            console.log(`⏰ Time check for ${babsItem.naam}:`, {
              requested: `${startTijd} (${requestedStartMinutes}min) - ${eindTijd} (${requestedEndMinutes}min)`,
              rule: `${rule.startTime} (${ruleStartMinutes}min) - ${rule.endTime} (${ruleEndMinutes}min)`,
              fits,
            });
          }

          return fits;
        });
      }

      // If available via recurring rules, skip JSON check
      if (isAvailableViaRecurring) {
        // BABS is available via recurring rules!
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${babsItem.naam}: Available via recurring rules!`);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚠️ ${babsItem.naam}: Not available via recurring rules, checking JSON beschikbaarheid...`);
        }
        // Fallback to old beschikbaarheid JSON system
        if (!babsItem.beschikbaarheid) {
          skipReason = 'No beschikbaarheid configured (null/undefined) and no recurring rules';
          debugLog.push(`${babsItem.naam}: ${skipReason}`);
          continue; // No beschikbaarheid set - BABS is not available
        }

        if (typeof babsItem.beschikbaarheid !== 'object') {
          skipReason = `Beschikbaarheid is not an object (type: ${typeof babsItem.beschikbaarheid})`;
          debugLog.push(`${babsItem.naam}: ${skipReason}`);
          continue;
        }

        const beschikbaarheid = babsItem.beschikbaarheid as Record<string, any>;
        
        // Check if beschikbaarheid object has any keys (is not empty)
        const beschikbaarheidKeys = Object.keys(beschikbaarheid);
        const hasBeschikbaarheid = beschikbaarheidKeys.length > 0;
        
        if (!hasBeschikbaarheid) {
          skipReason = `Beschikbaarheid object is empty (keys: ${beschikbaarheidKeys.length}) and no recurring rules`;
          debugLog.push(`${babsItem.naam}: ${skipReason}`);
          continue; // Empty beschikbaarheid - BABS is not available
        }

        const dayNames = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
        const dayName = dayNames[dayOfWeek];
        const daySlots = beschikbaarheid[dayName] || [];

        // Day must be explicitly in beschikbaarheid with slots
        if (!(dayName in beschikbaarheid)) {
          skipReason = `Day ${dayName} not in beschikbaarheid and no recurring rules`;
          debugLog.push(`${babsItem.naam}: ${skipReason}`);
          continue; // Day not configured - BABS is not available
        }

        // If day is explicitly listed but has no slots, BABS is not available
        if (daySlots.length === 0) {
          skipReason = `Day ${dayName} explicitly blocked (empty slots)`;
          debugLog.push(`${babsItem.naam}: ${skipReason}`);
          continue; // Not available on this day (explicitly blocked)
        }

        // Check if the requested time slot fits within available slots
        const isAvailable = daySlots.some((slot: string) => {
          const [slotStart, slotEnd] = slot.split('-');
          const [slotStartHour, slotStartMin] = slotStart.split(':').map(Number);
          const [slotEndHour, slotEndMin] = slotEnd.split(':').map(Number);
          
          const slotStartTime = slotStartHour * 60 + slotStartMin;
          const slotEndTime = slotEndHour * 60 + slotEndMin;
          const requestedStartTime = hours * 60 + minutes;
          const requestedEndTime = requestedStartTime + duurMinuten;

          // Check if requested time fits within available slot
          return requestedStartTime >= slotStartTime && requestedEndTime <= slotEndTime;
        });

        if (!isAvailable) {
          skipReason = `Time ${startTijd} not in available slots for ${dayName}: ${daySlots.join(', ')}`;
          debugLog.push(`${babsItem.naam}: ${skipReason}`);
          continue; // Not available at this time
        }
      }

      // BABS is available!
      beschikbareBabs.push({
        id: babsItem.id,
        naam: babsItem.naam,
        voornaam: babsItem.voornaam,
        tussenvoegsel: babsItem.tussenvoegsel,
        achternaam: babsItem.achternaam,
        talen: babsItem.talen,
        volledigeNaam: [
          babsItem.voornaam,
          babsItem.tussenvoegsel,
          babsItem.achternaam,
        ]
          .filter(Boolean)
          .join(' '),
      });
    }

    // Log debug info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 BABS availability check debug:');
      console.log(JSON.stringify({
        datum,
        startTijd,
        gemeenteOin: context.data.gemeenteOin,
        gemeenteNaam: context.data.gemeenteNaam,
        totalBabs: babsList.length,
        availableBabs: beschikbareBabs.length,
        skippedReasons: debugLog,
        babsDetails: babsList.map(b => ({
          naam: b.naam,
          status: b.status,
          actief: b.actief,
          talen: b.talen, // Nu volledig zichtbaar
          beschikbaarVanaf: b.beschikbaarVanaf,
          beschikbaarTot: b.beschikbaarTot,
          heeftBeschikbaarheid: !!b.beschikbaarheid,
          beschikbaarheidType: typeof b.beschikbaarheid,
          beschikbaarheidKeys: b.beschikbaarheid && typeof b.beschikbaarheid === 'object' 
            ? Object.keys(b.beschikbaarheid as Record<string, any>)
            : [],
          beschikbaarheidValue: b.beschikbaarheid && typeof b.beschikbaarheid === 'object'
            ? JSON.stringify(b.beschikbaarheid).substring(0, 200) // First 200 chars
            : String(b.beschikbaarheid),
        })),
      }, null, 2));
    }

    return NextResponse.json({
      success: true,
      data: beschikbareBabs,
      count: beschikbareBabs.length,
      ...(process.env.NODE_ENV === 'development' && debugLog.length > 0
        ? { debug: { skipped: debugLog } }
        : {}),
    });
  } catch (error) {
    console.error('Error fetching available BABS:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Er ging iets mis bij het ophalen van beschikbare BABS',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

