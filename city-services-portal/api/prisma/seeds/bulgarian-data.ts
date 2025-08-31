// Real Bulgarian cities with actual coordinates and districts
export const BULGARIAN_CITIES = {
  Sofia: {
    lat: 42.6977,
    lng: 23.3219,
    districts: [
      { name: 'Center', streets: ['Vitosha Boulevard', 'Alexander Nevsky Square', 'Graf Ignatiev Street', 'Rakovski Street', 'Tsar Osvoboditel Boulevard'] },
      { name: 'Lozenets', streets: ['Cherni Vrah Boulevard', 'Srebarna Street', 'Koziak Street', 'Krum Popov Street', 'James Bourchier Boulevard'] },
      { name: 'Mladost', streets: ['Alexander Malinov Boulevard', 'Andrey Saharov Boulevard', 'Business Park Street', 'Yordan Yosifov Street'] },
      { name: 'Lyulin', streets: ['Europa Boulevard', 'Pancho Vladigerov Boulevard', 'Tsar Boris III Boulevard', 'Dobrinova Skala Street'] },
      { name: 'Studentski Grad', streets: ['8th December Street', 'Acad. Stefan Mladenov Street', 'Prof. Hristo Danov Street'] }
    ]
  },
  Plovdiv: {
    lat: 42.1354,
    lng: 24.7453,
    districts: [
      { name: 'Center', streets: ['Main Street', 'Tsar Boris III Obedinitel Boulevard', 'Ivan Vazov Street', 'Hristo Botev Boulevard'] },
      { name: 'Karshiyaka', streets: ['Dunav Boulevard', 'Osvobozhdenie Boulevard', 'Nikola Vaptsarov Boulevard'] },
      { name: 'Trakia', streets: ['Trakiya Street', 'Osvobozhdenie Boulevard', 'Maritsa Boulevard'] }
    ]
  },
  Varna: {
    lat: 43.2141,
    lng: 27.9147,
    districts: [
      { name: 'Center', streets: ['Knyaz Boris I Boulevard', 'Slivnitsa Boulevard', 'Maria Luiza Boulevard', 'Preslav Street'] },
      { name: 'Primorski', streets: ['Primorski Park Street', 'San Stefano Street', '8th Primorski Polk Boulevard'] },
      { name: 'Mladost', streets: ['Mladost Street', 'Republika Boulevard', 'Tsar Osvoboditel Boulevard'] }
    ]
  },
  Burgas: {
    lat: 42.5048,
    lng: 27.4626,
    districts: [
      { name: 'Center', streets: ['Alexandrovska Street', 'Bogoridi Boulevard', 'San Stefano Street', 'Tsar Simeon I Street'] },
      { name: 'Slaveykov', streets: ['Stefan Stambolov Boulevard', 'Demokratsia Boulevard', 'Yanko Komitov Street'] }
    ]
  },
  Ruse: {
    lat: 43.8356,
    lng: 25.9657,
    districts: [
      { name: 'Center', streets: ['Alexandrovska Street', 'Pridunavski Boulevard', 'Tsar Osvoboditel Boulevard'] },
      { name: 'Charodeyka', streets: ['Lipnik Boulevard', 'Pliska Street', 'Dunav Street'] }
    ]
  }
};

// Diverse, realistic service request issues by department
export const SERVICE_ISSUES = {
  'Roads and Infrastructure': [
    { title: 'Large pothole on main road', description: 'Dangerous pothole approximately 30cm deep causing vehicle damage' },
    { title: 'Cracked sidewalk near school', description: 'Multiple cracks creating trip hazard for children and elderly' },
    { title: 'Missing stop sign at intersection', description: 'Stop sign knocked down in accident, urgent replacement needed' },
    { title: 'Faded pedestrian crossing', description: 'Zebra crossing barely visible, needs repainting for safety' },
    { title: 'Damaged guardrail on bridge', description: 'Guardrail bent after collision, poses safety risk' },
    { title: 'Street flooding after rain', description: 'Poor drainage causes water accumulation during rainfall' },
    { title: 'Uneven road surface', description: 'Road surface deteriorated, multiple bumps and depressions' },
    { title: 'Broken curb at bus stop', description: 'Curb damaged making it difficult for bus access' },
    { title: 'Sinkhole developing on street', description: 'Small sinkhole forming, approximately 1 meter wide' },
    { title: 'Bridge expansion joint damaged', description: 'Expansion joint creating dangerous gap for cyclists' }
  ],
  'Water and Utilities': [
    { title: 'Water main leak on street', description: 'Visible water bubbling up through pavement, wasting water' },
    { title: 'No water pressure in building', description: 'Multiple apartments experiencing very low water pressure' },
    { title: 'Sewage smell from drain', description: 'Strong sewage odor coming from storm drain' },
    { title: 'Fire hydrant leaking', description: 'Continuous water leak from fire hydrant base' },
    { title: 'Brown water from taps', description: 'Discolored water in entire neighborhood for 3 days' },
    { title: 'Sewage backup in street', description: 'Sewage overflowing from manhole cover' },
    { title: 'Broken water meter', description: 'Water meter not recording usage correctly' },
    { title: 'Gas smell near building', description: 'Strong gas odor detected, possible leak' },
    { title: 'Storm drain blocked', description: 'Drain completely blocked with debris, flooding risk' },
    { title: 'Water supply interruption', description: 'Unexpected water cut-off affecting entire block' }
  ],
  'Parks and Recreation': [
    { title: 'Broken playground swing', description: 'Swing chain broken, hanging dangerously' },
    { title: 'Overgrown park grass', description: 'Grass over 30cm tall, attracting pests' },
    { title: 'Graffiti on park monument', description: 'Vandalism on historical monument needs removal' },
    { title: 'Dead tree threatening to fall', description: 'Large dead oak tree leaning dangerously' },
    { title: 'Park bench destroyed', description: 'Wooden bench completely broken, needs replacement' },
    { title: 'Playground slide damaged', description: 'Sharp edge on slide, injury risk for children' },
    { title: 'Park fountain not working', description: 'Decorative fountain stopped working months ago' },
    { title: 'Walking path eroded', description: 'Rain erosion created dangerous holes in path' },
    { title: 'Sports field fence broken', description: 'Large hole in fence around basketball court' },
    { title: 'Picnic area needs maintenance', description: 'Tables rotting and garbage bins overflowing' }
  ],
  'Public Safety': [
    { title: 'Street lights out on entire block', description: 'All street lights dark for past week, safety concern' },
    { title: 'Traffic light malfunction', description: 'Signal stuck on red in one direction' },
    { title: 'Crosswalk signal not working', description: 'Pedestrian signal not responding to button' },
    { title: 'Emergency phone broken', description: 'Emergency call box damaged and non-functional' },
    { title: 'Dark alley needs lighting', description: 'No lighting in pedestrian alley, crime concern' },
    { title: 'Speed camera damaged', description: 'Camera knocked down by vehicle, needs reinstallation' },
    { title: 'Security camera offline', description: 'Public area surveillance camera not recording' },
    { title: 'Missing street name sign', description: 'Street sign stolen, causing navigation issues' },
    { title: 'Flashing yellow light needed', description: 'Dangerous intersection needs warning light' },
    { title: 'Pedestrian bridge lighting out', description: 'Overhead walkway completely dark at night' }
  ],
  'Waste Management': [
    { title: 'Missed garbage collection', description: 'Bins not emptied for two weeks, overflowing' },
    { title: 'Illegal dumping site', description: 'Large pile of construction waste dumped illegally' },
    { title: 'Recycling bins overflowing', description: 'Recycling containers full, items scattered around' },
    { title: 'Broken garbage container', description: 'Public bin damaged, lid missing' },
    { title: 'Hazardous waste dumped', description: 'Paint cans and chemicals found in regular trash' },
    { title: 'Dead animal removal needed', description: 'Large animal carcass on roadside' },
    { title: 'Bulk item pickup request', description: 'Old furniture needs special collection' },
    { title: 'Medical waste found', description: 'Syringes and medical supplies in public area' },
    { title: 'Oil spill in parking lot', description: 'Motor oil leaked, environmental hazard' },
    { title: 'Composting bin request', description: 'Apartment building requesting organic waste bins' }
  ]
};

// Bulgarian names (in English transliteration)
export const BULGARIAN_NAMES = {
  first: [
    'Alexander', 'Maria', 'Ivan', 'Elena', 'Georgi', 'Anna', 'Dimitar', 'Sophia',
    'Nikolay', 'Victoria', 'Peter', 'Kristina', 'Stefan', 'Daniela', 'Martin',
    'Teodora', 'Boris', 'Milena', 'Hristo', 'Ralitsa', 'Vladimir', 'Desislava',
    'Plamen', 'Simona', 'Krasimir', 'Yana', 'Todor', 'Gabriela', 'Emil', 'Polina',
    'Yordan', 'Svetlana', 'Asen', 'Nadezhda', 'Lyubomir', 'Radostina', 'Vasil', 'Lilyana',
    'Stoyan', 'Margarita', 'Rosen', 'Violeta', 'Angel', 'Tsvetanka', 'Kiril', 'Rumyana'
  ],
  last: [
    'Petrov', 'Ivanov', 'Georgiev', 'Dimitrov', 'Nikolov', 'Stefanov', 'Todorov',
    'Stoyanov', 'Mihaylov', 'Kolev', 'Marinov', 'Popov', 'Angelov', 'Hristov',
    'Atanasov', 'Iliev', 'Kostov', 'Vasilev', 'Petkov', 'Borisov', 'Yankov',
    'Aleksandrov', 'Tsvetkov', 'Vladimirov', 'Radoslavov', 'Lyubenov', 'Simeonov',
    'Pavlov', 'Velikov', 'Gospodinov', 'Yordanov', 'Penchev', 'Rusev', 'Trifonov'
  ]
};

export function getRandomBulgarianAddress() {
  const cities = Object.keys(BULGARIAN_CITIES);
  const cityName = cities[Math.floor(Math.random() * cities.length)];
  const city = BULGARIAN_CITIES[cityName as keyof typeof BULGARIAN_CITIES];
  const district = city.districts[Math.floor(Math.random() * city.districts.length)];
  const street = district.streets[Math.floor(Math.random() * district.streets.length)];
  const streetNumber = Math.floor(Math.random() * 200) + 1;
  
  // Add small variance to coordinates to simulate different locations
  const latVariance = (Math.random() - 0.5) * 0.02;
  const lngVariance = (Math.random() - 0.5) * 0.02;
  
  return {
    city: cityName,
    district: district.name,
    street: `${streetNumber} ${street}`,
    fullAddress: `${streetNumber} ${street}, ${district.name}, ${cityName}`,
    lat: city.lat + latVariance,
    lng: city.lng + lngVariance
  };
}

export function getRandomServiceIssue(departmentName: string) {
  const issues = SERVICE_ISSUES[departmentName as keyof typeof SERVICE_ISSUES];
  if (!issues) {
    return {
      title: 'General service request',
      description: 'Requires attention from city services'
    };
  }
  return issues[Math.floor(Math.random() * issues.length)];
}

export function getRandomBulgarianName() {
  const firstName = BULGARIAN_NAMES.first[Math.floor(Math.random() * BULGARIAN_NAMES.first.length)];
  const lastName = BULGARIAN_NAMES.last[Math.floor(Math.random() * BULGARIAN_NAMES.last.length)];
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}