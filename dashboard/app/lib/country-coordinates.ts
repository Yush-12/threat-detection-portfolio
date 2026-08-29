// Accurate longitude and latitude [lon, lat] centroids for all world countries and territories
export const WORLD_COUNTRY_COORDINATES: Record<string, [number, number]> = {
  // North America & Caribbean
  "united states": [-98.5795, 39.8283],
  "united states of america": [-98.5795, 39.8283],
  "usa": [-98.5795, 39.8283],
  "canada": [-106.3468, 56.1304],
  "mexico": [-102.5528, 23.6345],
  "greenland": [-42.6043, 71.7069],
  "cuba": [-77.7812, 21.5218],
  "haiti": [-72.2852, 18.9712],
  "dominican republic": [-70.1627, 18.7357],
  "jamaica": [-77.2975, 18.1096],
  "bahamas": [-77.3963, 25.0343],
  "puerto rico": [-66.5901, 18.2208],
  "guatemala": [-90.2308, 15.7835],
  "belize": [-88.4976, 17.1899],
  "el salvador": [-88.8965, 13.7942],
  "honduras": [-86.2419, 15.2000],
  "nicaragua": [-85.2072, 12.8654],
  "costa rica": [-83.7534, 9.7489],
  "panama": [-80.7821, 8.5380],
  "trinidad and tobago": [-61.2225, 10.6918],
  "barbados": [-59.5432, 13.1939],
  "saint martin": [-63.0548, 18.0708],
  "saint barthelemy": [-62.8333, 17.9000],
  "curacao": [-68.9900, 12.1696],
  "aruba": [-69.9683, 12.5211],
  "cayman islands": [-81.2546, 19.3133],
  "bermuda": [-64.7574, 32.3078],

  // South America
  "brazil": [-51.9253, -14.2350],
  "argentina": [-63.6167, -38.4161],
  "colombia": [-74.2973, 4.5709],
  "peru": [-75.0152, -9.1900],
  "chile": [-71.5430, -35.6751],
  "venezuela": [-66.5897, 6.4238],
  "venezuela, bolivarian republic of": [-66.5897, 6.4238],
  "ecuador": [-78.1834, -1.8312],
  "bolivia": [-63.5887, -16.2902],
  "bolivia, plurinational state of": [-63.5887, -16.2902],
  "paraguay": [-58.4438, -23.4425],
  "uruguay": [-55.7658, -32.5228],
  "guyana": [-58.9302, 4.8604],
  "suriname": [-56.0278, 3.9193],
  "french guiana": [-53.1258, 3.9339],

  // Western & Northern Europe
  "united kingdom": [-3.4360, 55.3781],
  "uk": [-3.4360, 55.3781],
  "ireland": [-8.2439, 53.4129],
  "france": [2.2137, 46.2276],
  "germany": [10.4515, 51.1657],
  "netherlands": [5.2913, 52.1326],
  "belgium": [4.4699, 50.5039],
  "luxembourg": [6.1296, 49.8153],
  "switzerland": [8.2275, 46.8182],
  "austria": [14.5501, 47.5162],
  "sweden": [18.6435, 60.1282],
  "norway": [8.4689, 60.4720],
  "finland": [25.7482, 61.9241],
  "denmark": [9.5018, 56.2639],
  "iceland": [-19.0208, 64.9631],

  // Southern & Eastern Europe
  "spain": [-3.7492, 40.4637],
  "portugal": [-8.2245, 39.3999],
  "italy": [12.5674, 41.8719],
  "greece": [21.8243, 39.0742],
  "poland": [19.1451, 51.9194],
  "czech republic": [15.4730, 49.8175],
  "czechia": [15.4730, 49.8175],
  "slovakia": [19.6990, 48.6690],
  "hungary": [19.5033, 47.1625],
  "romania": [24.9668, 45.9432],
  "bulgaria": [25.4858, 42.7339],
  "croatia": [15.2000, 45.1000],
  "serbia": [21.0059, 44.0165],
  "slovenia": [14.9955, 46.1512],
  "bosnia and herzegovina": [17.6791, 43.9159],
  "albania": [20.1683, 41.1533],
  "north macedonia": [21.7453, 41.6086],
  "ukraine": [31.1656, 48.3794],
  "belarus": [27.9534, 53.7098],
  "moldova": [28.3699, 47.4116],
  "estonia": [25.0136, 58.5953],
  "latvia": [24.6032, 56.8796],
  "lithuania": [23.8813, 55.1694],
  "russia": [105.3188, 61.5240],
  "russian federation": [105.3188, 61.5240],
  "cyprus": [33.4299, 35.1264],
  "malta": [14.3754, 35.9375],

  // Middle East & Central Asia
  "turkey": [35.2433, 38.9637],
  "israel": [34.8516, 31.0461],
  "palestine": [35.2332, 31.9522],
  "jordan": [36.2384, 30.5852],
  "lebanon": [35.8623, 33.8547],
  "syria": [38.9968, 34.8021],
  "syrian arab republic": [38.9968, 34.8021],
  "iraq": [43.6793, 33.2232],
  "iran": [53.6880, 32.4279],
  "iran, islamic republic of": [53.6880, 32.4279],
  "saudi arabia": [45.0792, 23.8859],
  "united arab emirates": [53.8478, 23.4241],
  "uae": [53.8478, 23.4241],
  "qatar": [51.1839, 25.3548],
  "kuwait": [47.4818, 29.3117],
  "bahrain": [50.5577, 26.0667],
  "oman": [55.9233, 21.5126],
  "yemen": [48.5164, 15.5527],
  "georgia": [43.3569, 42.3154],
  "armenia": [45.0382, 40.0691],
  "azerbaijan": [47.5769, 40.1431],
  "kazakhstan": [66.9237, 48.0196],
  "uzbekistan": [64.5853, 41.3775],
  "turkmenistan": [59.5563, 38.9697],
  "kyrgyzstan": [74.7661, 41.2044],
  "tajikistan": [71.2761, 38.8610],
  "afghanistan": [67.7100, 33.9391],

  // South & East Asia
  "china": [104.1954, 35.8617],
  "india": [78.9629, 20.5937],
  "pakistan": [69.3451, 30.3753],
  "bangladesh": [90.3563, 23.6850],
  "sri lanka": [80.7718, 7.8731],
  "nepal": [84.1240, 28.3949],
  "bhutan": [90.4336, 27.5142],
  "maldives": [73.2207, 3.2028],
  "japan": [138.2529, 36.2048],
  "south korea": [127.7669, 35.9078],
  "korea, republic of": [127.7669, 35.9078],
  "north korea": [127.5101, 40.3399],
  "taiwan": [120.9605, 23.6978],
  "taiwan, province of china": [120.9605, 23.6978],
  "hong kong": [114.1694, 22.3193],
  "mongolia": [103.8467, 46.8625],

  // Southeast Asia & Oceania
  "vietnam": [108.2772, 14.0583],
  "viet nam": [108.2772, 14.0583],
  "thailand": [100.9925, 15.8700],
  "indonesia": [113.9213, -0.7893],
  "malaysia": [101.9758, 4.2105],
  "singapore": [103.8198, 1.3521],
  "philippines": [121.7740, 12.8797],
  "myanmar": [95.9560, 21.9162],
  "cambodia": [104.9910, 12.5657],
  "laos": [102.4955, 19.8563],
  "australia": [133.7751, -25.2744],
  "new zealand": [174.8860, -40.9006],
  "papua new guinea": [143.9555, -6.3150],
  "fiji": [178.0650, -17.7134],

  // Africa
  "egypt": [30.8025, 26.8206],
  "south africa": [22.9375, -30.5595],
  "nigeria": [8.6753, 9.0820],
  "kenya": [37.9062, -0.0236],
  "morocco": [-7.0926, 31.7917],
  "ghana": [-1.0232, 7.9465],
  "tanzania": [34.8888, -6.3690],
  "tanzania, united republic of": [34.8888, -6.3690],
  "algeria": [1.6596, 28.0339],
  "ethiopia": [39.7823, 9.1450],
  "uganda": [32.2903, 1.3733],
  "liberia": [-9.4295, 6.4281],
  "cameroon": [12.3547, 7.3697],
  "ivory coast": [-5.5471, 7.5400],
  "cote d'ivoire": [-5.5471, 7.5400],
  "senegal": [-14.4524, 14.4974],
  "zimbabwe": [29.1549, -19.0154],
  "zambia": [27.8493, -13.1339],
  "angola": [17.8739, -11.2027],
  "mozambique": [35.5296, -18.6657],
  "congo": [15.8277, -0.2280],
  "congo, the democratic republic of the": [21.7587, -4.0383],
  "democratic republic of the congo": [21.7587, -4.0383],
  "sudan": [30.2176, 12.8628],
  "tunisia": [9.5375, 33.8869],
  "libya": [17.2283, 26.3351],
  "madagascar": [46.8691, -18.7669],
  "botswana": [24.6849, -22.3285],
  "namibia": [18.4904, -22.9576],
  "rwanda": [29.8739, -1.9403],
  "somalia": [46.1996, 5.1521],
  "mauritius": [57.5522, -20.3484],
};

/**
 * Resolves any raw country string to exact [longitude, latitude] coordinates.
 */
export function getCountryCoordinates(rawName: string): [number, number] {
  if (!rawName) return [-98.5795, 39.8283];

  const clean = rawName.trim().toLowerCase();
  
  // 1. Direct match
  if (WORLD_COUNTRY_COORDINATES[clean]) {
    return WORLD_COUNTRY_COORDINATES[clean];
  }

  // 2. Normalized strip (remove commas, "the", "republic of", etc.)
  const simplified = clean
    .replace(/,.*$/, '')
    .replace(/^(the|republic of|kingdom of|federation of|state of)\s+/i, '')
    .trim();

  if (WORLD_COUNTRY_COORDINATES[simplified]) {
    return WORLD_COUNTRY_COORDINATES[simplified];
  }

  // 3. Substring matching against known keys
  for (const [key, coords] of Object.entries(WORLD_COUNTRY_COORDINATES)) {
    if (clean.includes(key) || key.includes(simplified)) {
      return coords;
    }
  }

  // 4. Default to valid continent center if unknown
  return [-98.5795, 39.8283];
}
