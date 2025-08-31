// Realistic Bulgarian cities and addresses
export interface BulgarianAddress {
  city: string;
  district?: string;
  street: string;
  lat: number;
  lng: number;
  postalCode: string;
}

export const BULGARIAN_CITIES = {
  Sofia: {
    lat: 42.6977,
    lng: 23.3219,
    postalCode: '1000',
    districts: [
      { name: 'Center', streets: ['Vitosha Blvd', 'Alexander Nevsky Square', 'Graf Ignatiev St', 'Rakovski St'] },
      { name: 'Lozenets', streets: ['Cherni Vrah Blvd', 'Srebarna St', 'Koziak St', 'Krum Popov St'] },
      { name: 'Mladost', streets: ['Alexander Malinov Blvd', 'Andrey Saharov Blvd', 'Business Park St'] },
      { name: 'Lyulin', streets: ['Europa Blvd', 'Pancho Vladigerov Blvd', 'Tsar Boris III Blvd'] },
      { name: 'Studentski Grad', streets: ['8-mi Dekemvri St', 'Acad. Stefan Mladenov St', 'Prof. Hristo Danov St'] }
    ]
  },
  Plovdiv: {
    lat: 42.1354,
    lng: 24.7453,
    postalCode: '4000',
    districts: [
      { name: 'Center', streets: ['Main St', 'Tsar Boris III Obedinitel Blvd', 'Ivan Vazov St', 'Hristo Botev Blvd'] },
      { name: 'Karshiyaka', streets: ['Dunav Blvd', 'Osvobozhdenie Blvd', 'Nikola Vaptsarov Blvd'] },
      { name: 'Trakia', streets: ['Trakiya St', 'Osvobozhdenie Blvd', 'Maritsa Blvd'] }
    ]
  },
  Varna: {
    lat: 43.2141,
    lng: 27.9147,
    postalCode: '9000',
    districts: [
      { name: 'Center', streets: ['Knyaz Boris I Blvd', 'Slivnitsa Blvd', 'Maria Luiza Blvd', 'Preslav St'] },
      { name: 'Primorski', streets: ['Primorski Park St', 'San Stefano St', '8-mi Primorski Polk Blvd'] },
      { name: 'Mladost', streets: ['Mladost St', 'Republika Blvd', 'Tsar Osvoboditel Blvd'] }
    ]
  },
  Burgas: {
    lat: 42.5048,
    lng: 27.4626,
    postalCode: '8000',
    districts: [
      { name: 'Center', streets: ['Alexandrovska St', 'Bogoridi Blvd', 'San Stefano St', 'Tsar Simeon I St'] },
      { name: 'Slaveykov', streets: ['Stefan Stambolov Blvd', 'Demokratsia Blvd', 'Yanko Komitov St'] },
      { name: 'Meden Rudnik', streets: ['Struma St', 'Maritsa St', 'Iskar St'] }
    ]
  },
  Ruse: {
    lat: 43.8356,
    lng: 25.9657,
    postalCode: '7000',
    districts: [
      { name: 'Center', streets: ['Alexandrovska St', 'Pridunavski Blvd', 'Tsar Osvoboditel Blvd'] },
      { name: 'Charodeyka', streets: ['Lipnik Blvd', 'Pliska St', 'Dunav St'] }
    ]
  },
  Stara_Zagora: {
    lat: 42.4257,
    lng: 25.6344,
    postalCode: '6000',
    districts: [
      { name: 'Center', streets: ['Tsar Simeon Veliki Blvd', 'Mitropolit Metodi Kusev St', 'Han Asparuh St'] },
      { name: 'Kazanski', streets: ['Slavyanski Blvd', 'Patriarch Evtimiy Blvd'] }
    ]
  },
  Pleven: {
    lat: 43.4170,
    lng: 24.6067,
    postalCode: '5800',
    districts: [
      { name: 'Center', streets: ['Vasil Levski St', 'Danail Popov St', 'San Stefano St'] }
    ]
  },
  Veliko_Tarnovo: {
    lat: 43.0757,
    lng: 25.6172,
    postalCode: '5000',
    districts: [
      { name: 'Center', streets: ['Stefan Stambolov St', 'Hristo Botev St', 'Nezavisimost St'] }
    ]
  }
};

export function getRandomBulgarianAddress(): BulgarianAddress {
  const cities = Object.keys(BULGARIAN_CITIES);
  const cityName = cities[Math.floor(Math.random() * cities.length)];
  const city = BULGARIAN_CITIES[cityName as keyof typeof BULGARIAN_CITIES];
  const district = city.districts[Math.floor(Math.random() * city.districts.length)];
  const street = district.streets[Math.floor(Math.random() * district.streets.length)];
  const streetNumber = Math.floor(Math.random() * 200) + 1;
  
  // Add some variance to coordinates within the city
  const latVariance = (Math.random() - 0.5) * 0.05;
  const lngVariance = (Math.random() - 0.5) * 0.05;
  
  return {
    city: cityName.replace('_', ' '),
    district: district.name,
    street: `${streetNumber} ${street}`,
    lat: city.lat + latVariance,
    lng: city.lng + lngVariance,
    postalCode: city.postalCode
  };
}

// Service issue types for realistic problem reporting
export const SERVICE_ISSUES = {
  'Roads and Infrastructure': [
    { type: 'Pothole', description: 'Large pothole causing traffic hazard', urgency: 'HIGH' },
    { type: 'Cracked sidewalk', description: 'Sidewalk cracked and uneven, trip hazard', urgency: 'MEDIUM' },
    { type: 'Missing road sign', description: 'Stop sign missing at intersection', urgency: 'HIGH' },
    { type: 'Faded road markings', description: 'Lane markings barely visible', urgency: 'LOW' },
    { type: 'Damaged guardrail', description: 'Guardrail damaged and unsafe', urgency: 'HIGH' },
    { type: 'Bridge maintenance', description: 'Bridge needs inspection and repairs', urgency: 'MEDIUM' }
  ],
  'Water and Utilities': [
    { type: 'Water leak', description: 'Water leaking from main pipe', urgency: 'HIGH' },
    { type: 'Low water pressure', description: 'Insufficient water pressure in building', urgency: 'MEDIUM' },
    { type: 'Sewage backup', description: 'Sewage backing up into street', urgency: 'HIGH' },
    { type: 'Fire hydrant issue', description: 'Fire hydrant damaged or leaking', urgency: 'HIGH' },
    { type: 'Water quality', description: 'Discolored or bad-smelling water', urgency: 'MEDIUM' }
  ],
  'Parks and Recreation': [
    { type: 'Playground damage', description: 'Broken playground equipment', urgency: 'HIGH' },
    { type: 'Park maintenance', description: 'Overgrown grass and weeds', urgency: 'LOW' },
    { type: 'Vandalism', description: 'Graffiti on park structures', urgency: 'MEDIUM' },
    { type: 'Tree hazard', description: 'Dead tree threatening to fall', urgency: 'HIGH' },
    { type: 'Lighting issue', description: 'Park lights not working', urgency: 'MEDIUM' }
  ],
  'Public Safety': [
    { type: 'Street light out', description: 'Multiple street lights not working', urgency: 'HIGH' },
    { type: 'Traffic signal malfunction', description: 'Traffic light stuck on red', urgency: 'HIGH' },
    { type: 'Crosswalk issue', description: 'Pedestrian crossing signal broken', urgency: 'HIGH' },
    { type: 'Security concern', description: 'Area needs increased patrol', urgency: 'MEDIUM' },
    { type: 'Emergency phone broken', description: 'Emergency call box not working', urgency: 'HIGH' }
  ],
  'Waste Management': [
    { type: 'Missed collection', description: 'Garbage not collected on scheduled day', urgency: 'MEDIUM' },
    { type: 'Illegal dumping', description: 'Large pile of illegally dumped waste', urgency: 'HIGH' },
    { type: 'Overflowing bins', description: 'Public waste bins overflowing', urgency: 'MEDIUM' },
    { type: 'Recycling issue', description: 'Recycling not being collected properly', urgency: 'LOW' },
    { type: 'Hazardous waste', description: 'Hazardous materials improperly disposed', urgency: 'HIGH' }
  ],
  'Transportation': [
    { type: 'Bus stop damage', description: 'Bus shelter damaged or missing', urgency: 'MEDIUM' },
    { type: 'Parking meter broken', description: 'Parking meter not accepting payment', urgency: 'LOW' },
    { type: 'Traffic congestion', description: 'Recurring traffic jam needs solution', urgency: 'MEDIUM' },
    { type: 'Bike lane blocked', description: 'Bike lane obstructed by debris', urgency: 'MEDIUM' },
    { type: 'Transit schedule', description: 'Bus consistently late on route', urgency: 'LOW' }
  ],
  'Environmental Services': [
    { type: 'Tree removal needed', description: 'Dead or dangerous tree needs removal', urgency: 'HIGH' },
    { type: 'Pest control', description: 'Rodent or insect infestation in public area', urgency: 'MEDIUM' },
    { type: 'Air quality issue', description: 'Strong chemical smell in area', urgency: 'HIGH' },
    { type: 'Noise complaint', description: 'Excessive noise from construction', urgency: 'LOW' },
    { type: 'Storm damage', description: 'Storm debris blocking road or path', urgency: 'HIGH' }
  ],
  'Building and Permits': [
    { type: 'Unsafe structure', description: 'Building appears structurally unsafe', urgency: 'HIGH' },
    { type: 'Permit violation', description: 'Construction without proper permits', urgency: 'MEDIUM' },
    { type: 'Abandoned building', description: 'Abandoned property becoming hazard', urgency: 'MEDIUM' },
    { type: 'Code violation', description: 'Property not meeting building codes', urgency: 'LOW' },
    { type: 'Inspection request', description: 'Request for building inspection', urgency: 'LOW' }
  ]
};

export function getRandomServiceIssue(departmentName: string) {
  const issues = SERVICE_ISSUES[departmentName as keyof typeof SERVICE_ISSUES];
  if (!issues) {
    return {
      type: 'General Issue',
      description: 'General service request',
      urgency: 'MEDIUM'
    };
  }
  return issues[Math.floor(Math.random() * issues.length)];
}