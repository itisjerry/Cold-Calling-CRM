// Lightweight city → IANA timezone resolver.
// Covers the top ~120 US metros + a handful of international cities.
// Anything unmatched returns a country-level fallback or null.

type CityKey = string;
const k = (city: string, state?: string | null) =>
  `${city.toLowerCase().trim()}|${(state ?? "").toLowerCase().trim()}`;

const US: Record<CityKey, string> = {};

function addUS(tz: string, list: Array<[string, string]>) {
  for (const [city, state] of list) US[k(city, state)] = tz;
}

addUS("America/New_York", [
  ["New York", "NY"], ["Brooklyn", "NY"], ["Queens", "NY"], ["Buffalo", "NY"], ["Albany", "NY"], ["Rochester", "NY"], ["Syracuse", "NY"],
  ["Boston", "MA"], ["Cambridge", "MA"], ["Worcester", "MA"], ["Springfield", "MA"],
  ["Philadelphia", "PA"], ["Pittsburgh", "PA"], ["Allentown", "PA"], ["Erie", "PA"],
  ["Washington", "DC"], ["Baltimore", "MD"], ["Silver Spring", "MD"], ["Annapolis", "MD"],
  ["Atlanta", "GA"], ["Savannah", "GA"], ["Augusta", "GA"], ["Columbus", "GA"],
  ["Miami", "FL"], ["Orlando", "FL"], ["Tampa", "FL"], ["Jacksonville", "FL"], ["Fort Lauderdale", "FL"], ["St. Petersburg", "FL"], ["Tallahassee", "FL"],
  ["Charlotte", "NC"], ["Raleigh", "NC"], ["Greensboro", "NC"], ["Durham", "NC"],
  ["Columbia", "SC"], ["Charleston", "SC"], ["Greenville", "SC"],
  ["Richmond", "VA"], ["Virginia Beach", "VA"], ["Norfolk", "VA"], ["Arlington", "VA"],
  ["Detroit", "MI"], ["Grand Rapids", "MI"], ["Lansing", "MI"], ["Ann Arbor", "MI"],
  ["Cleveland", "OH"], ["Columbus", "OH"], ["Cincinnati", "OH"], ["Toledo", "OH"], ["Akron", "OH"],
  ["Indianapolis", "IN"], ["Fort Wayne", "IN"], ["Evansville", "IN"],
  ["Louisville", "KY"], ["Lexington", "KY"],
  ["Newark", "NJ"], ["Jersey City", "NJ"], ["Trenton", "NJ"], ["Paterson", "NJ"],
  ["Hartford", "CT"], ["New Haven", "CT"], ["Stamford", "CT"], ["Bridgeport", "CT"],
  ["Providence", "RI"], ["Manchester", "NH"], ["Portland", "ME"], ["Burlington", "VT"],
  ["Wilmington", "DE"], ["Charleston", "WV"],
]);

addUS("America/Chicago", [
  ["Chicago", "IL"], ["Aurora", "IL"], ["Rockford", "IL"], ["Naperville", "IL"], ["Springfield", "IL"], ["Peoria", "IL"],
  ["Houston", "TX"], ["Dallas", "TX"], ["Austin", "TX"], ["San Antonio", "TX"], ["Fort Worth", "TX"], ["El Paso", "TX"], ["Plano", "TX"], ["Arlington", "TX"], ["Corpus Christi", "TX"],
  ["Milwaukee", "WI"], ["Madison", "WI"], ["Green Bay", "WI"],
  ["Minneapolis", "MN"], ["St. Paul", "MN"], ["Rochester", "MN"], ["Duluth", "MN"],
  ["St. Louis", "MO"], ["Kansas City", "MO"], ["Springfield", "MO"], ["Columbia", "MO"],
  ["Memphis", "TN"], ["Nashville", "TN"], ["Knoxville", "TN"], ["Chattanooga", "TN"],
  ["Birmingham", "AL"], ["Montgomery", "AL"], ["Mobile", "AL"], ["Huntsville", "AL"],
  ["New Orleans", "LA"], ["Baton Rouge", "LA"], ["Shreveport", "LA"], ["Lafayette", "LA"],
  ["Oklahoma City", "OK"], ["Tulsa", "OK"],
  ["Little Rock", "AR"], ["Fayetteville", "AR"],
  ["Des Moines", "IA"], ["Cedar Rapids", "IA"], ["Davenport", "IA"],
  ["Wichita", "KS"], ["Topeka", "KS"], ["Overland Park", "KS"],
  ["Omaha", "NE"], ["Lincoln", "NE"],
  ["Jackson", "MS"], ["Gulfport", "MS"],
]);

addUS("America/Denver", [
  ["Denver", "CO"], ["Colorado Springs", "CO"], ["Aurora", "CO"], ["Boulder", "CO"], ["Fort Collins", "CO"],
  ["Salt Lake City", "UT"], ["West Valley City", "UT"], ["Provo", "UT"], ["Ogden", "UT"],
  ["Albuquerque", "NM"], ["Santa Fe", "NM"], ["Las Cruces", "NM"],
  ["Cheyenne", "WY"], ["Casper", "WY"],
  ["Billings", "MT"], ["Missoula", "MT"], ["Bozeman", "MT"], ["Helena", "MT"],
  ["Boise", "ID"], ["Idaho Falls", "ID"],
]);

addUS("America/Phoenix", [
  ["Phoenix", "AZ"], ["Tucson", "AZ"], ["Mesa", "AZ"], ["Scottsdale", "AZ"], ["Chandler", "AZ"], ["Glendale", "AZ"], ["Tempe", "AZ"], ["Flagstaff", "AZ"],
]);

addUS("America/Los_Angeles", [
  ["Los Angeles", "CA"], ["San Diego", "CA"], ["San Francisco", "CA"], ["San Jose", "CA"], ["Sacramento", "CA"], ["Long Beach", "CA"], ["Oakland", "CA"], ["Fresno", "CA"], ["Bakersfield", "CA"], ["Anaheim", "CA"], ["Santa Ana", "CA"], ["Riverside", "CA"], ["Irvine", "CA"], ["San Bernardino", "CA"], ["Burbank", "CA"], ["Pasadena", "CA"], ["Berkeley", "CA"], ["Palo Alto", "CA"], ["Beverly Hills", "CA"], ["Glendale", "CA"], ["Santa Monica", "CA"],
  ["Seattle", "WA"], ["Spokane", "WA"], ["Tacoma", "WA"], ["Bellevue", "WA"], ["Vancouver", "WA"],
  ["Portland", "OR"], ["Salem", "OR"], ["Eugene", "OR"], ["Bend", "OR"],
  ["Las Vegas", "NV"], ["Henderson", "NV"], ["Reno", "NV"], ["Carson City", "NV"],
]);

addUS("America/Anchorage", [
  ["Anchorage", "AK"], ["Fairbanks", "AK"], ["Juneau", "AK"],
]);

addUS("Pacific/Honolulu", [
  ["Honolulu", "HI"], ["Hilo", "HI"], ["Pearl City", "HI"],
]);

addUS("America/Detroit", [
  ["Detroit", "MI"], ["Grand Rapids", "MI"], ["Flint", "MI"], ["Warren", "MI"],
]);

// International (country-level fallback)
const COUNTRY: Record<string, string> = {
  US: "America/New_York",
  CA: "America/Toronto",
  MX: "America/Mexico_City",
  GB: "Europe/London", UK: "Europe/London",
  IE: "Europe/Dublin",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  ES: "Europe/Madrid",
  IT: "Europe/Rome",
  NL: "Europe/Amsterdam",
  CH: "Europe/Zurich",
  SE: "Europe/Stockholm",
  NO: "Europe/Oslo",
  AE: "Asia/Dubai",
  IN: "Asia/Kolkata",
  PK: "Asia/Karachi",
  SG: "Asia/Singapore",
  JP: "Asia/Tokyo",
  CN: "Asia/Shanghai",
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
  BR: "America/Sao_Paulo",
  ZA: "Africa/Johannesburg",
};

const INTL_CITY: Record<string, string> = {
  "london": "Europe/London",
  "manchester": "Europe/London",
  "dublin": "Europe/Dublin",
  "paris": "Europe/Paris",
  "berlin": "Europe/Berlin",
  "munich": "Europe/Berlin",
  "amsterdam": "Europe/Amsterdam",
  "zurich": "Europe/Zurich",
  "dubai": "Asia/Dubai",
  "abu dhabi": "Asia/Dubai",
  "karachi": "Asia/Karachi",
  "lahore": "Asia/Karachi",
  "islamabad": "Asia/Karachi",
  "mumbai": "Asia/Kolkata",
  "delhi": "Asia/Kolkata",
  "bangalore": "Asia/Kolkata",
  "singapore": "Asia/Singapore",
  "tokyo": "Asia/Tokyo",
  "sydney": "Australia/Sydney",
  "melbourne": "Australia/Melbourne",
  "toronto": "America/Toronto",
  "vancouver": "America/Vancouver",
  "montreal": "America/Toronto",
  "mexico city": "America/Mexico_City",
};

export function resolveTimezone(
  city?: string | null,
  state?: string | null,
  country?: string | null
): string {
  if (!city) return COUNTRY[country?.toUpperCase() ?? ""] ?? "America/New_York";
  const key = k(city, state);
  if (US[key]) return US[key];
  const intl = INTL_CITY[city.toLowerCase().trim()];
  if (intl) return intl;
  return COUNTRY[country?.toUpperCase() ?? "US"] ?? "America/New_York";
}

export function localTime(timezone?: string | null, d = new Date()): string {
  if (!timezone) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "—";
  }
}

export function localDayHour(timezone?: string | null, d = new Date()): { hour: number; day: number } {
  if (!timezone) return { hour: d.getHours(), day: d.getDay() };
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
      weekday: "short",
    });
    const parts = fmt.formatToParts(d);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? d.getHours());
    const wkMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = wkMap[parts.find((p) => p.type === "weekday")?.value ?? "Sun"] ?? 0;
    return { hour, day };
  } catch {
    return { hour: d.getHours(), day: d.getDay() };
  }
}

export type CallWindowState = "in" | "edge" | "out";

export function callWindowState(
  timezone?: string | null,
  start = 9,
  end = 18
): CallWindowState {
  const { hour } = localDayHour(timezone);
  if (hour >= start && hour < end) return "in";
  if (hour === start - 1 || hour === end) return "edge";
  return "out";
}
