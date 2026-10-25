import { Injectable } from '@angular/core';

export interface CarMake {
  name: string;
  models: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CarCatalogService {
  private carMakes: CarMake[] = [
    {
      name: 'Toyota',
      models: ['Corolla', 'Camry', 'RAV4', 'Highlander', 'Prius', 'Sienna', 'Tacoma', 'Tundra', '4Runner', 'Land Cruiser', 'Avalon', 'Venza', 'C-HR', 'Yaris', 'Supra', 'GR86', 'Mirai', 'Sequoia', 'Tundra', 'Hilux']
    },
    {
      name: 'Honda',
      models: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit', 'HR-V', 'Passport', 'Ridgeline', 'Insight', 'Clarity', 'NSX', 'City', 'Jazz', 'BR-V', 'HR-V', 'Civic Type R']
    },
    {
      name: 'Ford',
      models: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Expedition', 'Ranger', 'Bronco', 'Fusion', 'Focus', 'Taurus', 'EcoSport', 'Maverick', 'F-250', 'F-350', 'Thunderbird', 'GT']
    },
    {
      name: 'Chevrolet',
      models: ['Silverado', 'Equinox', 'Malibu', 'Traverse', 'Tahoe', 'Suburban', 'Blazer', 'Camaro', 'Corvette', 'Colorado', 'Trax', 'Spark', 'Sonic', 'Impala', 'Cruze', 'Bolt EV', 'Express']
    },
    {
      name: 'Nissan',
      models: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Murano', 'Frontier', 'Titan', 'Maxima', 'Leaf', '370Z', 'GT-R', 'Kicks', 'Armada', 'Versa', 'Juke', 'NV200']
    },
    {
      name: 'BMW',
      models: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'M3', 'M5', 'M4', 'Z4', 'i3', 'i4', 'i8', 'iX', '2 Series', '4 Series', '6 Series', '8 Series', 'X1', 'X2', 'X4', 'X6']
    },
    {
      name: 'Mercedes-Benz',
      models: ['C-Class', 'E-Class', 'S-Class', 'A-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'CLS', 'CLA', 'SL', 'SLC', 'AMG GT', 'EQC', 'EQS', 'Maybach S-Class', 'B-Class']
    },
    {
      name: 'Audi',
      models: ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'e-tron', 'TT', 'R8']
    },
    {
      name: 'Volkswagen',
      models: ['Golf', 'Jetta', 'Passat', 'Tiguan', 'Atlas', 'ID.4', 'ID.3', 'Polo', 'Beetle', 'Arteon', 'Touareg', 'CC', 'Eos', 'Phaeton', 'Up!', 'T-Cross', 'T-Roc']
    },
    {
      name: 'Hyundai',
      models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Venue', 'Ioniq 5', 'Ioniq 6', 'Veloster', 'Accent', 'Genesis', 'Equus', 'Azera', 'Santa Cruz']
    },
    {
      name: 'Kia',
      models: ['Soul', 'Sportage', 'Sorento', 'Telluride', 'Forte', 'Rio', 'Stinger', 'K5', 'Seltos', 'Carnival', 'EV6', 'Niro', 'Optima', 'Ceed', 'Picanto']
    },
    {
      name: 'Mazda',
      models: ['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'CX-30', 'CX-50', 'MX-5 Miata', 'MX-30', 'Mazda2', 'CX-3', 'CX-8', 'Mazda CX-60', 'Mazda CX-90']
    },
    {
      name: 'Subaru',
      models: ['Outback', 'Forester', 'Impreza', 'Legacy', 'Crosstrek', 'Ascent', 'WRX', 'WRX STI', 'BRZ', 'Baja', 'Tribeca', 'Solterra']
    },
    {
      name: 'Lexus',
      models: ['ES', 'LS', 'GS', 'IS', 'NX', 'RX', 'GX', 'LX', 'UX', 'LC', 'RC', 'LM', 'IS F', 'LFA']
    },
    {
      name: 'Tesla',
      models: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster']
    },
    {
      name: 'Volvo',
      models: ['XC40', 'XC60', 'XC90', 'S60', 'S90', 'V60', 'V90', 'C40', 'V40', 'V50', 'V70', 'XC70', 'Polestar 1', 'Polestar 2']
    },
    {
      name: 'Jaguar',
      models: ['F-Type', 'XE', 'XF', 'XJ', 'E-Pace', 'F-Pace', 'I-Pace', 'XK', 'S-Type', 'X-Type']
    },
    {
      name: 'Land Rover',
      models: ['Range Rover', 'Range Rover Sport', 'Range Rover Evoque', 'Discovery', 'Discovery Sport', 'Defender', 'LR4', 'LR3', 'Freelander']
    },
    {
      name: 'Porsche',
      models: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Boxster', 'Cayman', '718 Cayman', '718 Boxster']
    },
    {
      name: 'Fiat',
      models: ['500', '500X', '500L', 'Panda', 'Punto', 'Tipo', '124 Spider', 'Ducato', 'Doblo', 'Fiorino']
    },
    {
      name: 'Alfa Romeo',
      models: ['Giulia', 'Stelvio', '4C', 'Giulietta', 'MiTo', 'Tonale']
    },
    {
      name: 'Maserati',
      models: ['Ghibli', 'Quattroporte', 'Levante', 'GranTurismo', 'GranCabrio', 'MC20']
    },
    {
      name: 'Ferrari',
      models: ['458', '488', 'F8', 'Ferrari 296 GTB', 'Roma', 'Portofino', 'SF90 Stradale', 'LaFerrari', '812 Superfast', 'GTC4Lusso', 'FF']
    },
    {
      name: 'Lamborghini',
      models: ['Huracán', 'Aventador', 'Urus', 'Gallardo', 'Revuelto']
    },
    {
      name: 'McLaren',
      models: ['720S', '570S', '600LT', 'Artura', 'Speedtail', 'P1', 'Senna', 'GT', '765LT']
    },
    {
      name: 'Aston Martin',
      models: ['DB11', 'Vantage', 'DBS', 'DBX', 'Valhalla', 'Valkyrie', 'Rapide', 'Vanquish']
    },
    {
      name: 'Bentley',
      models: ['Continental GT', 'Flying Spur', 'Bentayga', 'Mulsanne', 'Azure']
    },
    {
      name: 'Rolls-Royce',
      models: ['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan', 'Spirit of Ecstasy']
    },
    {
      name: 'Bugatti',
      models: ['Chiron', 'Veyron', 'Chiron Sport', 'Divo', 'Centodieci']
    },
    {
      name: 'Peugeot',
      models: ['208', '308', '508', '2008', '3008', '5008', '108', '208 GTi', '308 GTi', 'RCZ', 'Partner', 'Expert', 'Boxer']
    },
    {
      name: 'Renault',
      models: ['Clio', 'Megane', 'Captur', 'Kadjar', 'Zoe', 'Scenic', 'Grand Scenic', 'Twingo', 'Talisman', 'Koleos', 'Duster', 'Laguna', 'Fluence', 'Kangoo', 'Trafic', 'Master']
    },
    {
      name: 'Citroën',
      models: ['C3', 'C4', 'C5', 'C3 Aircross', 'C4 Cactus', 'C4 Picasso', 'Grand C4 Picasso', 'Berlingo', 'Jumpy', 'Jumper', 'DS3', 'DS4', 'DS5', 'C1', 'C2', 'C6']
    },
    {
      name: 'Opel',
      models: ['Astra', 'Corsa', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Zafira', 'Vivaro', 'Movano', 'Adam', 'Karl', 'Combo']
    },
    {
      name: 'Seat',
      models: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Alhambra', 'Mii', 'Toledo', 'Altea', 'Exeo']
    },
    {
      name: 'Skoda',
      models: ['Octavia', 'Fabia', 'Superb', 'Yeti', 'Kodiaq', 'Karoq', 'Scala', 'Kamiq', 'Rapid', 'Roomster', 'Citigo', 'Enyaq']
    },
    {
      name: 'Suzuki',
      models: ['Swift', 'Vitara', 'S-Cross', 'Jimny', 'Ignis', 'Baleno', 'SX4', 'Alto', 'Celerio', 'Grand Vitara', 'XL7']
    },
    {
      name: 'Mitsubishi',
      models: ['Lancer', 'Outlander', 'ASX', 'Eclipse Cross', 'Mirage', 'Pajero', 'Montero', 'L200', 'Galant', 'i-MiEV']
    },
    {
      name: 'Jeep',
      models: ['Wrangler', 'Cherokee', 'Grand Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Commander', 'Liberty', 'Patriot']
    },
    {
      name: 'Ram',
      models: ['1500', '2500', '3500', 'Promaster', 'ProMaster City']
    },
    {
      name: 'Dodge',
      models: ['Challenger', 'Charger', 'Durango', 'Journey', 'Grand Caravan', 'Viper', 'Ram', 'Nitro', 'Caliber', 'Avenger']
    },
    {
      name: 'Chrysler',
      models: ['300', 'Pacifica', 'Voyager', '200', 'Sebring', 'Crossfire', 'Aspen', 'PT Cruiser']
    },
    {
      name: 'Buick',
      models: ['Enclave', 'Encore', 'LaCrosse', 'Regal', 'Verano', 'Envision', 'Cascada', 'Park Avenue', 'Lucerne']
    },
    {
      name: 'Cadillac',
      models: ['Escalade', 'XT5', 'XT4', 'XT6', 'CT4', 'CT5', 'CT6', 'ATS', 'CTS', 'SRX', 'XLR', 'DeVille', 'DTS']
    },
    {
      name: 'GMC',
      models: ['Sierra', 'Yukon', 'Acadia', 'Terrain', 'Canyon', 'Savana', 'Envoy', 'Jimmy']
    },
    {
      name: 'Lincoln',
      models: ['Navigator', 'Aviator', 'Nautilus', 'Corsair', 'MKC', 'MKZ', 'MKS', 'MKT', 'Town Car', 'Continental', 'Blackwood', 'Mark LT']
    },
    {
      name: 'Acura',
      models: ['MDX', 'RDX', 'TLX', 'ILX', 'NSX', 'RLX', 'TL', 'TSX', 'RSX', 'Integra', 'Legend', 'Vigor', 'ZDX']
    },
    {
      name: 'Infiniti',
      models: ['Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX70', 'QX80', 'Q45', 'M35', 'M37', 'G35', 'G37', 'FX35', 'FX37', 'FX45', 'EX35', 'EX37', 'JX35']
    },
    {
      name: 'Genesis',
      models: ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80']
    },
    {
      name: 'Mini',
      models: ['Cooper', 'Cooper S', 'Countryman', 'Clubman', 'Paceman', 'John Cooper Works', 'Convertible', 'Coupe', 'Roadster']
    },
    {
      name: 'Smart',
      models: ['Fortwo', 'Forfour', 'Fortwo Cabrio']
    },
    {
      name: 'Dacia',
      models: ['Sandero', 'Duster', 'Logan', 'Lodgy', 'Dokker', 'Jogger']
    },
    {
      name: 'MG',
      models: ['MG3', 'MG5', 'MG ZS', 'MG GS', 'MG Hector', 'MG Gloster', 'MG Comet']
    },
    {
      name: 'Mahindra',
      models: ['Thar', 'Scorpio', 'XUV500', 'XUV700', 'Bolero', 'XUV300', 'Alturas G4']
    },
    {
      name: 'Tata',
      models: ['Nexon', 'Harrier', 'Safari', 'Tiago', 'Altroz', 'Punch', 'Hexa', 'Indica', 'Indigo']
    },
    {
      name: 'Maruti Suzuki',
      models: ['Swift', 'Baleno', 'Dzire', 'Vitara Brezza', 'Ertiga', 'Ciaz', 'S-Cross', 'Ignis', 'WagonR', 'Alto', 'Zen', 'Esteem']
    },
    {
      name: 'Honda India',
      models: ['City', 'Amaze', 'Jazz', 'WR-V', 'Civic', 'CR-V', 'HR-V', 'BR-V']
    },
    {
      name: 'Hyundai India',
      models: ['Creta', 'Venue', 'i20', 'Grand i10', 'Verna', 'Elantra', 'Tucson', 'Aura', 'Alcazar']
    },
    {
      name: 'Kia India',
      models: ['Seltos', 'Sonet', 'Carnival', 'Seltos X-Line', 'Carens']
    },
    {
      name: 'BYD',
      models: ['Han', 'Tang', 'Qin', 'Song', 'Yuan', 'Seal', 'Dolphin', 'Atto 3', 'Fang Cheng Bao']
    },
    {
      name: 'Geely',
      models: ['Coolray', 'Azkarra', 'Tugella', 'Monjaro', 'Panda', 'Emgrand', 'Geometry']
    },
    {
      name: 'Chery',
      models: ['Tiggo 8', 'Tiggo 7', 'Tiggo 5', 'Arrizo 5', 'Arrizo 6', 'Omoda 5', 'Jaecoo 7']
    },
    {
      name: 'Great Wall',
      models: ['Haval H6', 'Haval Jolion', 'Wey', 'Tank 300', 'Tank 500', 'Poer', 'Cannon']
    },
    {
      name: 'NIO',
      models: ['ES8', 'ES6', 'EC6', 'ET7', 'ET5', 'EP9']
    },
    {
      name: 'XPeng',
      models: ['P7', 'P5', 'G9', 'G6']
    },
    {
      name: 'Lucid',
      models: ['Air']
    },
    {
      name: 'Rivian',
      models: ['R1T', 'R1S', 'EDV']
    },
    {
      name: 'Fisker',
      models: ['Ocean', 'Pear', 'Ronin']
    },
    {
      name: 'Canoo',
      models: ['Lifestyle Vehicle', 'MPDV']
    },
    {
      name: 'Lotus',
      models: ['Evija', 'Emira', 'Eletre', 'Exige', 'Evora', 'Elise']
    },
    {
      name: 'Koenigsegg',
      models: ['Regera', 'Jesko', 'Gemera', 'CCX', 'Agera']
    },
    {
      name: 'Pagani',
      models: ['Huayra', 'Zonda']
    },
    {
      name: 'Hennessey',
      models: ['Venom F5', 'Exorcist']
    },
    {
      name: 'Zenvo',
      models: ['TS1', 'ST1', 'TCR']
    },
    {
      name: 'SSC',
      models: ['Tuatara', 'Ultimate Aero']
    },
    {
      name: 'Spyker',
      models: ['C8 Aileron', 'C8 Laviolette', 'D8 Peking-to-Paris']
    },
    {
      name: 'Gumpert',
      models: ['Apollo']
    },
    {
      name: 'Tramontana',
      models: ['XTR']
    },
    {
      name: 'Artega',
      models: ['GT']
    },
    {
      name: 'Wiesmann',
      models: ['GT MF4', 'Roadster MF5']
    },
    {
      name: 'BAC',
      models: ['Mono']
    },
    {
      name: 'Radical',
      models: ['SR3', 'SR8', 'RXC']
    },
    {
      name: 'Caterham',
      models: ['Seven', 'Seven 620R', 'Seven 420R']
    },
    {
      name: ' Ariel',
      models: ['Atom', 'Nomad']
    },
    {
      name: 'Bristol',
      models: ['Fighter']
    },
    {
      name: 'Morgan',
      models: ['3 Wheeler', 'Plus 4', 'Plus 6', 'Plus 8', 'Aero 8']
    },
    {
      name: 'TVR',
      models: ['Griffith', 'Chimaera', 'Tuscan', 'Sagaris', 'Cerbera']
    },
    {
      name: 'Noble',
      models: ['M600', 'M12', 'M400']
    },
    {
      name: 'Ultima',
      models: ['GTR', 'Can-Am']
    },
    {
      name: 'Caparo',
      models: ['T1']
    },
    {
      name: 'Mosler',
      models: ['MT900']
    },
    {
      name: 'Saleen',
      models: ['S7', 'S570', 'S281']
    },
    {
      name: 'Vector',
      models: ['W8', 'WX3', 'M12']
    },
    {
      name: 'Panoz',
      models: ['Esperante', 'Abruzzi']
    },
    {
      name: 'De Tomaso',
      models: ['Pantera', 'Guara', 'Mangusta', 'Deville']
    },
    {
      name: 'Iso',
      models: ['Rivolta', 'Grifo', 'Lele']
    },
    {
      name: 'Bizzarrini',
      models: ['Strada', '5300 GT']
    },
    {
      name: 'Cizeta',
      models: ['V16T']
    },
    {
      name: 'Gillet',
      models: ['Vertigo']
    },
    {
      name: 'Donkervoort',
      models: ['D8 GTO', 'F22']
    },
    {
      name: 'Praga',
      models: ['R1', 'Bohema']
    },
    {
      name: 'Apollo',
      models: ['IE', 'Arrow']
    },
    {
      name: 'Deus',
      models: ['Vayanne']
    },
    {
      name: 'Qiantu',
      models: ['K50', 'M-Byte']
    },
    {
      name: 'Aiways',
      models: ['U5', 'U6']
    },
    {
      name: 'Nio',
      models: ['ES8', 'ES6', 'EC6', 'ET7', 'ET5']
    },
    {
      name: 'Zeekr',
      models: ['001', '009', 'X', '007']
    },
    {
      name: 'Avatr',
      models: ['11', '12']
    },
    {
      name: 'AITO',
      models: ['M5', 'M7']
    },
    {
      name: 'Livan',
      models: ['7', '9']
    },
    {
      name: 'Deepal',
      models: ['SL03', 'S7']
    },
    {
      name: 'Tank',
      models: ['300', '400', '500']
    },
    {
      name: 'Omoda',
      models: ['5', '7']
    },
    {
      name: 'Jaecoo',
      models: ['7']
    },
    {
      name: 'Dongfeng',
      models: ['eπ 007', 'M-Hero']
    },
    {
      name: 'Hongqi',
      models: ['H9', 'E-HS9', 'LS7']
    },
    {
      name: 'GAC',
      models: ['Aion Y', 'Aion S', 'Empow', 'Trumpchi']
    },
    {
      name: 'Changan',
      models: ['UNI-V', 'UNI-K', 'UNI-T', 'CS75', 'CS55', 'CS35']
    },
    {
      name: 'FAW',
      models: ['Bestune', 'Hongqi']
    },
    {
      name: 'SAIC',
      models: ['Roewe', 'MG', 'Maxus']
    },
    {
      name: 'BAIC',
      models: ['Beijing', 'Arcfox']
    },
    {
      name: 'JAC',
      models: ['Jiayue', 'Refine']
    },
    {
      name: 'Geely Galaxy',
      models: ['L7', 'L6']
    },
    {
      name: 'Voyah',
      models: ['Free', 'Dreamer', 'Zhiyin']
    },
    {
      name: 'Aito',
      models: ['M5', 'M7', 'M9']
    },
    {
      name: 'Lynk & Co',
      models: ['01', '02', '03', '05', '06', '08', '09']
    },
    {
      name: 'Polestar',
      models: ['1', '2', '3', '4', '5']
    },
    {
      name: 'Volkswagen ID',
      models: ['ID.3', 'ID.4', 'ID.5', 'ID.6', 'ID.7', 'ID.Buzz']
    },
    {
      name: 'Mercedes EQ',
      models: ['EQS', 'EQE', 'EQC', 'EQB', 'EQA', 'EQV', 'EQG']
    },
    {
      name: 'BMW i',
      models: ['i3', 'i4', 'i5', 'i7', 'i8', 'iX', 'iX1', 'iX2', 'iX3']
    },
    {
      name: 'Audi e-tron',
      models: ['e-tron', 'e-tron GT', 'e-tron S', 'Q4 e-tron', 'Q6 e-tron']
    },
    {
      name: 'Genesis Electrified',
      models: ['GV60', 'G80 Electrified', 'GV70 Electrified']
    },
    {
      name: 'Hyundai Ioniq',
      models: ['Ioniq 5', 'Ioniq 6', 'Ioniq 7']
    },
    {
      name: 'Kia EV',
      models: ['EV6', 'EV9', 'EV5']
    },
    {
      name: 'Toyota bZ',
      models: ['bZ4X', 'bZ3']
    },
    {
      name: 'Honda e',
      models: ['e:NS1', 'e:NP1', 'e:Ny1']
    },
    {
      name: 'Nissan Ariya',
      models: ['Ariya', 'Leaf']
    },
    {
      name: 'Mazda MX-30',
      models: ['MX-30']
    },
    {
      name: 'Subaru Solterra',
      models: ['Solterra']
    },
    {
      name: 'Lexus RZ',
      models: ['RZ', 'UX 300e']
    },
    {
      name: 'Ford Mustang Mach-E',
      models: ['Mustang Mach-E', 'F-150 Lightning', 'E-Transit']
    },
    {
      name: 'GM Ultium',
      models: ['Hummer EV', 'Silverado EV', 'Sierra EV', 'Lyriq', 'Blazer EV', 'Equinox EV']
    },
    {
      name: 'RAM 1500 REV',
      models: ['1500 REV']
    },
    {
      name: 'GMC Hummer',
      models: ['Hummer EV SUV', 'Hummer EV Pickup']
    },
    {
      name: 'Jeep Recon',
      models: ['Recon', 'Wagoneer S']
    },
    {
      name: 'VinFast',
      models: ['VF 8', 'VF 9', 'VF 5', 'VF 6', 'VF 7', 'VF 3']
    },
    {
      name: 'Fisker Ocean',
      models: ['Ocean', 'Pear', 'Ronin']
    },
    {
      name: 'Canoo',
      models: ['Lifestyle Vehicle', 'American Bulldog']
    },
    {
      name: 'Faraday Future',
      models: ['FF 91']
    },
    {
      name: 'Mullen',
      models: ['RS', 'Five', 'Gorilla']
    },
    {
      name: 'Sono',
      models: ['Sion']
    },
    {
      name: 'Lightyear',
      models: ['0', '2']
    },
    {
      name: 'Aehra',
      models: ['Sedan', 'SUV']
    },
    {
      name: 'Nammi',
      models: ['0']
    },
    {
      name: 'M-Hero',
      models: ['917']
    },
    {
      name: 'Yangwang',
      models: ['U8', 'U9']
    },
    {
      name: 'Fang Cheng Bao',
      models: ['Leopard 5']
    },
    {
      name: 'Denza',
      models: ['D9', 'N7', 'N8']
    },
    {
      name: 'Jiyue',
      models: ['01', '07']
    },
    {
      name: 'Xiaomi',
      models: ['SU7']
    },
    {
      name: 'Denza',
      models: ['D9', 'N7']
    },
    {
      name: 'Fang Cheng Bao',
      models: ['Leopard 5']
    },
    {
      name: 'Yuniqu',
      models: ['Chenghua']
    },
    {
      name: 'Luxeed',
      models: ['S7']
    },
    {
      name: 'Smart China',
      models: ['#1', '#3', '#5']
    },
    {
      name: 'Dongfeng Voyah',
      models: ['Free', 'Dreamer', 'Zhiyin']
    },
    {
      name: 'GAC Aion',
      models: ['Aion Y', 'Aion S', 'Aion LX', 'Aion V', 'Hyper GT', 'Hyper SSR']
    },
    {
      name: 'Changan UNI',
      models: ['UNI-V', 'UNI-K', 'UNI-T']
    },
    {
      name: 'Hongqi',
      models: ['H5', 'H7', 'H9', 'E-HS9', 'LS7', 'EH7']
    },
    {
      name: 'JMC',
      models: ['Grand Avenue', 'Domain']
    },
    {
      name: 'Chery Exeed',
      models: ['VX', 'LX', 'TXL', 'Sterra ES', 'Sterra ET']
    },
    {
      name: 'Geely Galaxy',
      models: ['L7', 'L6', 'E8']
    },
    {
      name: 'Geely Haoyue',
      models: ['Haoyue']
    },
    {
      name: 'Geely Xingyue',
      models: ['Xingyue L', 'Xingyue S']
    },
    {
      name: 'Geely Emgrand',
      models: ['Emgrand', 'Emgrand S']
    },
    {
      name: 'Geely Preface',
      models: ['Preface']
    },
    {
      name: 'Geely Monjaro',
      models: ['Monjaro']
    },
    {
      name: 'Geely Azkarra',
      models: ['Azkarra']
    },
    {
      name: 'Geely Coolray',
      models: ['Coolray']
    },
    {
      name: 'Geely Okavango',
      models: ['Okavango']
    },
    {
      name: 'Geely Tugella',
      models: ['Tugella']
    },
    {
      name: 'Lotus Technology',
      models: ['Eletre', 'Emeya', 'Eletre R']
    },
    {
      name: 'Niutron',
      models: ['NV']
    },
    {
      name: 'Arcfox',
      models: ['Kaola', 'Alpha T5', 'Alpha S', 'Alpha S HI']
    },
    {
      name: 'Tank',
      models: ['300', '400', '500', '400 Hi4-T', '500 Hi4-T']
    },
    {
      name: 'Wey',
      models: ['Coffee 01', 'Coffee 02', 'Coffee 03', 'Mountain', 'Lanshan']
    },
    {
      name: 'Haval',
      models: ['H6', 'H6 HEV', 'H6 PHEV', 'Jolion', 'Dargo', 'Chitu', 'Big Dog', 'Shenshou']
    },
    {
      name: 'ORA',
      models: ['Good Cat', 'Fancy Cat', 'Punk Cat', 'Lightning Cat', 'Ballet Cat']
    },
    {
      name: 'Wuling',
      models: ['Hongguang Mini EV', 'Bingo', 'Starlight', 'Cloud']
    },
    {
      name: 'Baojun',
      models: ['KiWi EV', 'RC-5', 'RS-5', 'RM-5', 'Yep']
    },
    {
      name: 'New Jiachuan',
      models: ['A00']
    },
    {
      name: 'IM Motors',
      models: ['L7', 'LS6', 'LS7']
    },
    {
      name: 'Rising Auto',
      models: ['R7', 'F7', 'R33']
    },
    {
      name: 'Feifan',
      models: ['R7', 'F7']
    },
    {
      name: 'Volkswagen Anhui',
      models: ['ID.UNYX', 'ID.']
    },
    {
      name: 'DS',
      models: ['3', '4', '7', '9', '4 Crossback', '7 Crossback']
    },
    {
      name: 'Alpine',
      models: ['A110', 'A290', 'A390']
    },
    {
      name: 'DFSK',
      models: ['Fengon', 'Seres', 'Seresto']
    },
    {
      name: 'Seresto',
      models: ['SF5', 'SF7', 'AITO M5', 'AITO M7']
    },
    {
      name: 'Seres',
      models: ['5', '7', '9']
    },
    {
      name: 'AITO',
      models: ['M5', 'M7', 'M9']
    },
    {
      name: 'Qiyuan',
      models: ['520']
    },
    {
      name: 'Xingyue',
      models: ['L7']
    },
    {
      name: 'Trumpchi',
      models: ['GA6', 'GA8', 'GS3', 'GS4', 'GS8', 'M6', 'ES9', 'Empow', '', '']
    },
    {
      name: 'Aion',
      models: ['Aion S', 'Aion Y', 'Aion V', 'Aion LX', 'Hyper GT', 'Hyper SSR']
    },
    {
      name: 'Hyper',
      models: ['GT', 'SSR']
    },
    {
      name: 'Dongfeng Nammi',
      models: ['01']
    },
    {
      name: 'Dongfeng eπ',
      models: ['007', '008']
    },
    {
      name: 'M-Hero',
      models: ['917']
    },
    {
      name: 'Yangwang',
      models: ['U8', 'U9']
    },
    {
      name: 'Fang Cheng Bao',
      models: ['Leopard 5', 'Leopard 3']
    },
    {
      name: 'Deepal',
      models: ['SL03', 'S7']
    },
    {
      name: 'Avatr',
      models: ['11', '12']
    },
    {
      name: 'Livan',
      models: ['7', '9']
    },
    {
      name: 'Geometry',
      models: ['A', 'C', 'E', 'G6', 'M6', 'Panda Mini']
    },
    {
      name: 'Galaxy',
      models: ['L6', 'L7', 'E8']
    },
    {
      name: 'Zeekr',
      models: ['001', '009', 'X', '007', 'FR']
    },
    {
      name: 'Lynk & Co',
      models: ['01', '02', '03', '05', '06', '08', '09', 'Z10']
    },
    {
      name: 'Voyah',
      models: ['Free', 'Dreamer', 'Zhiyin']
    },
    {
      name: 'Dongfeng',
      models: ['eπ', 'M-Hero', 'Nammi', 'Fengshen']
    },
    {
      name: 'Jetour',
      models: ['Traveler', 'X70', 'X90', 'Dashing', 'T2']
    },
    {
      name: 'Omoda',
      models: ['5', 'Jaecoo 7']
    },
    {
      name: 'Jaecoo',
      models: ['7']
    },
    {
      name: 'Exeed',
      models: ['VX', 'LX', 'TXL', 'Sterra ES', 'Sterra ET']
    },
    {
      name: 'Sterra',
      models: ['ES', 'ET']
    },
    {
      name: 'Chery',
      models: ['Tiggo 8', 'Tiggo 7', 'Tiggo 5', 'Arrizo 8', 'Arrizo 5', 'eQ1', 'eQ7']
    },
    {
      name: 'Iqiyi',
      models: ['S5']
    },
    {
      name: 'Kaiyi',
      models: ['X5', 'X3']
    },
    {
      name: 'Hozon',
      models: ['Neta U', 'Neta V', 'Neta S', 'Neta GT']
    },
    {
      name: 'Neta',
      models: ['U', 'V', 'S', 'GT', 'L']
    },
    {
      name: 'Hozon Auto',
      models: ['Neta U', 'Neta V', 'Neta S', 'Neta GT']
    },
    {
      name: 'Leapmotor',
      models: ['S01', 'C11', 'C01', 'C16']
    },
    {
      name: 'Xpeng',
      models: ['P7', 'P5', 'G9', 'G6', 'X9']
    },
    {
      name: 'Nio',
      models: ['ES8', 'ES6', 'EC6', 'ET7', 'ET5', 'ES7']
    },
    {
      name: 'Arcfox',
      models: ['Kaola', 'Alpha T5', 'Alpha S', 'Alpha S HI']
    },
    {
      name: 'Rising Auto',
      models: ['R7', 'F7']
    },
    {
      name: 'IM Motors',
      models: ['L7', 'LS6', 'LS7']
    },
    {
      name: 'Luxeed',
      models: ['S7']
    },
    {
      name: 'Xiaomi',
      models: ['SU7']
    },
    {
      name: 'Fang Cheng Bao',
      models: ['Leopard 5']
    },
    {
      name: 'Yuniku',
      models: ['Chenghua']
    },
    {
      name: 'M-Hero',
      models: ['917']
    },
    {
      name: 'Yangwang',
      models: ['U8', 'U9']
    },
    {
      name: 'Denza',
      models: ['D9', 'N7', 'N8']
    },
    {
      name: 'Aito',
      models: ['M5', 'M7', 'M9']
    },
    {
      name: 'Seres',
      models: ['5', '7', '9']
    },
    {
      name: 'Livan',
      models: ['7', '9']
    },
    {
      name: 'Geely',
      models: ['Emgrand', 'Preface', 'Xingyue', 'Haoyue', 'Coolray', 'Azkarra', 'Tugella', 'Monjaro', 'Galaxy', 'Geometry']
    },
    {
      name: 'Changan',
      models: ['UNI-V', 'UNI-K', 'UNI-T', 'CS75', 'CS55', 'CS35', 'Lamore', 'Qiyuan']
    },
    {
      name: 'Changan Ford',
      models: ['Escape', 'Edge', 'Explorer', 'Mondeo', 'Fuga']
    },
    {
      name: 'Changan Mazda',
      models: ['Mazda3', 'Mazda CX-5', 'Mazda CX-30', 'Mazda CX-50']
    },
    {
      name: 'SAIC Volkswagen',
      models: ['Lavida', 'Passat', 'Tiguan', 'Touran', 'Polo', 'Santana', 'ID.4 X', 'ID.6 X']
    },
    {
      name: 'FAW-Volkswagen',
      models: ['Magotan', 'Bora', 'Golf', 'Sagitar', 'Tayron', 'Volkswagen CC', 'ID.4 CROZZ', 'ID.6 CROZZ']
    },
    {
      name: 'SAIC GM',
      models: ['Buick', 'Chevrolet', 'Cadillac']
    },
    {
      name: 'FAW Toyota',
      models: ['Corolla', 'RAV4', 'Prado', 'Land Cruiser', 'Crown', 'Avalon', 'bZ4X']
    },
    {
      name: 'GAC Toyota',
      models: ['Camry', 'Levin', 'Yaris', 'C-HR', 'Highlander', 'Venza', 'bZ4X']
    },
    {
      name: 'Dongfeng Nissan',
      models: ['Sylphy', 'Teana', 'X-Trail', 'Qashqai', 'Murano', 'Pathfinder', 'Ariya']
    },
    {
      name: 'GAC Nissan',
      models: ['Sylphy', 'Altima', 'X-Trail', 'Qashqai', 'Ariya']
    },
    {
      name: 'Beijing Hyundai',
      models: ['Elantra', 'Sonata', 'ix35', 'Mistra', 'Celesta', 'Verna', 'Custin', 'Ioniq 5']
    },
    {
      name: 'Dongfeng Yueda Kia',
      models: ['K3', 'K5', 'KX3', 'KX5', 'KX7', 'Sportage', 'Seltos']
    },
    {
      name: 'Dongfeng Honda',
      models: ['Civic', 'Crider', 'XR-V', 'Envix', 'Inspire', 'UR-V', 'e:NS1']
    },
    {
      name: 'GAC Honda',
      models: ['Accord', 'Freed', 'Ridgeline', 'Crosstour', 'Avancier', 'Breeze', 'e:NP1']
    },
    {
      name: 'Dongfeng Peugeot',
      models: ['2008', '3008', '4008', '508L']
    },
    {
      name: 'Dongfeng Citroën',
      models: ['C3-XR', 'C5 Aircross', 'C6']
    },
    {
      name: 'SAIC Peugeot',
      models: ['2008', '3008', '4008', '508']
    },
    {
      name: 'SAIC Citroën',
      models: ['C5 Aircross', 'C3L']
    },
    {
      name: 'Dongfeng Renault',
      models: ['Koleos', 'Captur', 'Wind']
    },
    {
      name: 'Brilliance BMW',
      models: ['1 Series', '2 Series', '3 Series', '5 Series', 'X1', 'X2', 'X3', 'X5', 'i3', 'iX3']
    },
    {
      name: 'BMW Brilliance',
      models: ['1 Series', '2 Series', '3 Series', '5 Series', 'X1', 'X2', 'X3', 'X5', 'i3', 'iX3']
    },
    {
      name: 'Beijing Benz',
      models: ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLB', 'GLC', 'EQC', 'EQB', 'EQA']
    },
    {
      name: 'Beijing Mercedes-Benz',
      models: ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLB', 'GLC', 'EQC', 'EQB', 'EQA']
    },
    {
      name: 'Mercedes-Benz',
      models: ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'EQS', 'EQE', 'EQC', 'EQB', 'EQA', 'EQV', 'Maybach']
    },
    {
      name: 'Audi FAW',
      models: ['A3', 'A4L', 'A6L', 'Q3', 'Q5L', 'e-tron', 'Q4 e-tron']
    },
    {
      name: 'SAIC Audi',
      models: ['A7L', 'Q5 e-tron']
    },
    {
      name: 'Volkswagen Anhui',
      models: ['ID.UNYX']
    },
    {
      name: 'JAC Volkswagen',
      models: ['Viloran', 'ID.4 X']
    },
    {
      name: 'SAIC GM Wuling',
      models: ['Hongguang', 'Baojun', 'Wuling']
    },
    {
      name: 'GM China',
      models: ['Buick', 'Chevrolet', 'Cadillac']
    },
    {
      name: 'Tesla China',
      models: ['Model 3', 'Model Y', 'Model S', 'Model X']
    },
    {
      name: 'BYD',
      models: ['Han', 'Tang', 'Qin', 'Song', 'Yuan', 'Seal', 'Dolphin', 'Atto 3', 'Fang Cheng Bao', 'Yangwang', 'Denza']
    },
    {
      name: 'GAC Aion',
      models: ['Aion S', 'Aion Y', 'Aion V', 'Aion LX', 'Hyper GT', 'Hyper SSR']
    },
    {
      name: 'Geely',
      models: ['Emgrand', 'Preface', 'Xingyue', 'Haoyue', 'Coolray', 'Azkarra', 'Tugella', 'Monjaro', 'Galaxy', 'Geometry']
    },
    {
      name: 'Changan',
      models: ['UNI-V', 'UNI-K', 'UNI-T', 'CS75', 'CS55', 'CS35', 'Lamore', 'Qiyuan']
    },
    {
      name: 'Chery',
      models: ['Tiggo 8', 'Tiggo 7', 'Tiggo 5', 'Arrizo 8', 'Arrizo 5', 'eQ1', 'eQ7', 'Exeed']
    },
    {
      name: 'Great Wall',
      models: ['Haval', 'Wey', 'Tank', 'ORA', 'Great Wall Pickup']
    },
    {
      name: 'Dongfeng',
      models: ['Fengshen', 'Forthing', 'eπ', 'M-Hero', 'Nammi', 'Voyah', 'Seres', 'Aito']
    },
    {
      name: 'SAIC',
      models: ['Roewe', 'MG', 'Maxus', 'IM', 'Rising']
    },
    {
      name: 'FAW',
      models: ['Bestune', 'Hongqi', 'Faw-Volkswagen', 'Faw-Toyota']
    },
    {
      name: 'BAIC',
      models: ['Beijing', 'Arcfox', 'BAIC BJEV']
    },
    {
      name: 'JAC',
      models: ['Jiayue', 'Refine', 'JAC Volkswagen']
    },
    {
      name: 'Changan Automobile',
      models: ['Changan', 'Changan Ford', 'Changan Mazda', 'Deepal', 'Avatr', 'Oshan']
    },
    {
      name: 'GAC Group',
      models: ['GAC Trumpchi', 'GAC Aion', 'GAC Toyota', 'GAC Honda', 'GAC Mitsubishi']
    },
    {
      name: 'Zhejiang Geely',
      models: ['Geely', 'Lynk & Co', 'Lotus', 'Proton', 'Volvo', 'Polestar', 'Geometry', 'Galaxy', 'Zeekr']
    },
    {
      name: 'Dongfeng Motor',
      models: ['Dongfeng', 'Fengshen', 'Forthing', 'Voyah', 'Seres', 'Aito', 'eπ', 'M-Hero', 'Nammi', 'Deepal']
    },
    {
      name: 'SAIC Motor',
      models: ['Roewe', 'MG', 'Maxus', 'IM', 'Rising', 'SAIC Volkswagen', 'SAIC GM', 'SAIC Skoda']
    },
    {
      name: 'FAW Group',
      models: ['Bestune', 'Hongqi', 'FAW-Volkswagen', 'FAW-Toyota']
    },
    {
      name: 'BAIC Group',
      models: ['Beijing', 'Arcfox', 'BAIC BJEV', 'BAIC Foton']
    },
    {
      name: 'Chery Automobile',
      models: ['Chery', 'Exeed', 'Jetour', 'Omoda', 'Jaecoo', 'iCar', 'Kaiyi']
    },
    {
      name: 'Great Wall Motor',
      models: ['Haval', 'Wey', 'Tank', 'ORA', 'GWM Pickup', 'Poer']
    },
    {
      name: 'BYD Auto',
      models: ['BYD', 'Fang Cheng Bao', 'Yangwang', 'Denza']
    },
    {
      name: 'GAC Group',
      models: ['Trumpchi', 'Aion', 'Hyper']
    },
    {
      name: 'XPeng',
      models: ['P7', 'P5', 'G9', 'G6', 'X9']
    },
    {
      name: 'NIO',
      models: ['ES8', 'ES6', 'EC6', 'ET7', 'ET5', 'ES7']
    },
    {
      name: 'Li Auto',
      models: ['L7', 'L8', 'L9', 'MEGA']
    },
    {
      name: 'Hozon',
      models: ['Neta U', 'Neta V', 'Neta S', 'Neta GT']
    },
    {
      name: 'Leapmotor',
      models: ['S01', 'C11', 'C01', 'C16']
    },
    {
      name: 'Zeekr',
      models: ['001', '009', 'X', '007', 'FR']
    },
    {
      name: 'Avatr',
      models: ['11', '12']
    },
    {
      name: 'IM Motors',
      models: ['L7', 'LS6', 'LS7']
    },
    {
      name: 'Rising Auto',
      models: ['R7', 'F7']
    },
    {
      name: 'Arcfox',
      models: ['Kaola', 'Alpha T5', 'Alpha S', 'Alpha S HI']
    },
    {
      name: 'Luxeed',
      models: ['S7']
    },
    {
      name: 'Xiaomi',
      models: ['SU7']
    },
    {
      name: 'Seresto',
      models: ['SF5', 'SF7']
    },
    {
      name: 'AITO',
      models: ['M5', 'M7', 'M9']
    },
    {
      name: 'Seres',
      models: ['5', '7', '9']
    },
    {
      name: 'Voyah',
      models: ['Free', 'Dreamer', 'Zhiyin']
    },
    {
      name: 'Dongfeng eπ',
      models: ['007', '008']
    },
    {
      name: 'M-Hero',
      models: ['917']
    },
    {
      name: 'Yangwang',
      models: ['U8', 'U9']
    },
    {
      name: 'Fang Cheng Bao',
      models: ['Leopard 5']
    },
    {
      name: 'Deepal',
      models: ['SL03', 'S7']
    },
    {
      name: 'Livan',
      models: ['7', '9']
    },
    {
      name: 'Geometry',
      models: ['A', 'C', 'E', 'G6', 'M6', 'Panda Mini']
    },
    {
      name: 'Galaxy',
      models: ['L6', 'L7', 'E8']
    },
    {
      name: 'Tank',
      models: ['300', '400', '500']
    },
    {
      name: 'Wey',
      models: ['Coffee 01', 'Coffee 02', 'Coffee 03', 'Mountain', 'Lanshan']
    },
    {
      name: 'Haval',
      models: ['H6', 'H6 HEV', 'H6 PHEV', 'Jolion', 'Dargo', 'Chitu', 'Big Dog', 'Shenshou']
    },
    {
      name: 'ORA',
      models: ['Good Cat', 'Fancy Cat', 'Punk Cat', 'Lightning Cat', 'Ballet Cat']
    },
    {
      name: 'Wuling',
      models: ['Hongguang Mini EV', 'Bingo', 'Starlight', 'Cloud']
    },
    {
      name: 'Baojun',
      models: ['KiWi EV', 'RC-5', 'RS-5', 'RM-5', 'Yep']
    },
    {
      name: 'New Jiachuan',
      models: ['A00']
    },
    {
      name: 'Jetour',
      models: ['Traveler', 'X70', 'X90', 'Dashing', 'T2']
    },
    {
      name: 'Omoda',
      models: ['5', 'Jaecoo 7']
    },
    {
      name: 'Jaecoo',
      models: ['7']
    },
    {
      name: 'Exeed',
      models: ['VX', 'LX', 'TXL', 'Sterra ES', 'Sterra ET']
    },
    {
      name: 'Sterra',
      models: ['ES', 'ET']
    },
    {
      name: 'iCar',
      models: ['03', 'V23']
    },
    {
      name: 'Kaiyi',
      models: ['X5', 'X3']
    },
    {
      name: 'Hozon',
      models: ['Neta U', 'Neta V', 'Neta S', 'Neta GT']
    },
    {
      name: 'Leapmotor',
      models: ['S01', 'C11', 'C01', 'C16']
    },
    {
      name: 'Zeekr',
      models: ['001', '009', 'X', '007', 'FR']
    },
    {
      name: 'Avatr',
      models: ['11', '12']
    },
    {
      name: 'IM Motors',
      models: ['L7', 'LS6', 'LS7']
    },
    {
      name: 'Rising Auto',
      models: ['R7', 'F7']
    },
    {
      name: 'Arcfox',
      models: ['Kaola', 'Alpha T5', 'Alpha S', 'Alpha S HI']
    },
    {
      name: 'Luxeed',
      models: ['S7']
    },
    {
      name: 'Xiaomi',
      models: ['SU7']
    },
    {
      name: 'Fang Cheng Bao',
      models: ['Leopard 5']
    },
    {
      name: 'Yuniku',
      models: ['Chenghua']
    },
    {
      name: 'M-Hero',
      models: ['917']
    },
    {
      name: 'Yangwang',
      models: ['U8', 'U9']
    },
    {
      name: 'Denza',
      models: ['D9', 'N7', 'N8']
    },
    {
      name: 'Aito',
      models: ['M5', 'M7', 'M9']
    },
    {
      name: 'Seres',
      models: ['5', '7', '9']
    },
    {
      name: 'Livan',
      models: ['7', '9']
    },
    {
      name: 'Geely',
      models: ['Emgrand', 'Preface', 'Xingyue', 'Haoyue', 'Coolray', 'Azkarra', 'Tugella', 'Monjaro', 'Galaxy', 'Geometry']
    },
    {
      name: 'Changan',
      models: ['UNI-V', 'UNI-K', 'UNI-T', 'CS75', 'CS55', 'CS35', 'Lamore', 'Qiyuan']
    },
    {
      name: 'Chery',
      models: ['Tiggo 8', 'Tiggo 7', 'Tiggo 5', 'Arrizo 8', 'Arrizo 5', 'eQ1', 'eQ7', 'Exeed']
    },
    {
      name: 'Great Wall',
      models: ['Haval', 'Wey', 'Tank', 'ORA', 'Great Wall Pickup']
    },
    {
      name: 'Dongfeng',
      models: ['Fengshen', 'Forthing', 'eπ', 'M-Hero', 'Nammi', 'Voyah', 'Seres', 'Aito']
    },
    {
      name: 'SAIC',
      models: ['Roewe', 'MG', 'Maxus', 'IM', 'Rising']
    },
    {
      name: 'FAW',
      models: ['Bestune', 'Hongqi', 'Faw-Volkswagen', 'Faw-Toyota']
    },
    {
      name: 'BAIC',
      models: ['Beijing', 'Arcfox', 'BAIC BJEV']
    },
    {
      name: 'JAC',
      models: ['Jiayue', 'Refine', 'JAC Volkswagen']
    },
    {
      name: 'Changan Automobile',
      models: ['Changan', 'Changan Ford', 'Changan Mazda', 'Deepal', 'Avatr', 'Oshan']
    },
    {
      name: 'GAC Group',
      models: ['GAC Trumpchi', 'GAC Aion', 'GAC Toyota', 'GAC Honda', 'GAC Mitsubishi']
    },
    {
      name: 'Zhejiang Geely',
      models: ['Geely', 'Lynk & Co', 'Lotus', 'Proton', 'Volvo', 'Polestar', 'Geometry', 'Galaxy', 'Zeekr']
    },
    {
      name: 'Dongfeng Motor',
      models: ['Dongfeng', 'Fengshen', 'Forthing', 'Voyah', 'Seres', 'Aito', 'eπ', 'M-Hero', 'Nammi', 'Deepal']
    },
    {
      name: 'SAIC Motor',
      models: ['Roewe', 'MG', 'Maxus', 'IM', 'Rising', 'SAIC Volkswagen', 'SAIC GM', 'SAIC Skoda']
    },
    {
      name: 'FAW Group',
      models: ['Bestune', 'Hongqi', 'FAW-Volkswagen', 'FAW-Toyota']
    },
    {
      name: 'BAIC Group',
      models: ['Beijing', 'Arcfox', 'BAIC BJEV', 'BAIC Foton']
    },
    {
      name: 'Chery Automobile',
      models: ['Chery', 'Exeed', 'Jetour', 'Omoda', 'Jaecoo', 'iCar', 'Kaiyi']
    },
    {
      name: 'Great Wall Motor',
      models: ['Haval', 'Wey', 'Tank', 'ORA', 'GWM Pickup', 'Poer']
    },
    {
      name: 'BYD Auto',
      models: ['BYD', 'Fang Cheng Bao', 'Yangwang', 'Denza']
    },
    {
      name: 'GAC Group',
      models: ['Trumpchi', 'Aion', 'Hyper']
    },
    {
      name: 'XPeng',
      models: ['P7', 'P5', 'G9', 'G6', 'X9']
    },
    {
      name: 'NIO',
      models: ['ES8', 'ES6', 'EC6', 'ET7', 'ET5', 'ES7']
    },
    {
      name: 'Li Auto',
      models: ['L7', 'L8', 'L9', 'MEGA']
    },
    {
      name: 'Hozon',
      models: ['Neta U', 'Neta V', 'Neta S', 'Neta GT']
    },
    {
      name: 'Leapmotor',
      models: ['S01', 'C11', 'C01', 'C16']
    },
    {
      name: 'Zeekr',
      models: ['001', '009', 'X', '007', 'FR']
    },
    {
      name: 'Avatr',
      models: ['11', '12']
    },
    {
      name: 'IM Motors',
      models: ['L7', 'LS6', 'LS7']
    },
    {
      name: 'Rising Auto',
      models: ['R7', 'F7']
    },
    {
      name: 'Arcfox',
      models: ['Kaola', 'Alpha T5', 'Alpha S', 'Alpha S HI']
    },
    {
      name: 'Luxeed',
      models: ['S7']
    },
    {
      name: 'Xiaomi',
      models: ['SU7']
    },
    {
      name: 'Seresto',
      models: ['SF5', 'SF7']
    },
    {
      name: 'AITO',
      models: ['M5', 'M7', 'M9']
    },
    {
      name: 'Seres',
      models: ['5', '7', '9']
    },
    {
      name: 'Voyah',
      models: ['Free', 'Dreamer', 'Zhiyin']
    },
    {
      name: 'Dongfeng eπ',
      models: ['007', '008']
    },
    {
      name: 'M-Hero',
      models: ['917']
    },
    {
      name: 'Yangwang',
      models: ['U8', 'U9']
    },
    {
      name: 'Fang Cheng Bao',
      models: ['Leopard 5']
    },
    {
      name: 'Deepal',
      models: ['SL03', 'S7']
    },
    {
      name: 'Livan',
      models: ['7', '9']
    },
    {
      name: 'Geometry',
      models: ['A', 'C', 'E', 'G6', 'M6', 'Panda Mini']
    },
    {
      name: 'Galaxy',
      models: ['L6', 'L7', 'E8']
    },
    {
      name: 'Tank',
      models: ['300', '400', '500']
    },
    {
      name: 'Wey',
      models: ['Coffee 01', 'Coffee 02', 'Coffee 03', 'Mountain', 'Lanshan']
    },
    {
      name: 'Haval',
      models: ['H6', 'H6 HEV', 'H6 PHEV', 'Jolion', 'Dargo', 'Chitu', 'Big Dog', 'Shenshou']
    },
    {
      name: 'ORA',
      models: ['Good Cat', 'Fancy Cat', 'Punk Cat', 'Lightning Cat', 'Ballet Cat']
    },
    {
      name: 'Wuling',
      models: ['Hongguang Mini EV', 'Bingo', 'Starlight', 'Cloud']
    },
    {
      name: 'Baojun',
      models: ['KiWi EV', 'RC-5', 'RS-5', 'RM-5', 'Yep']
    },
    {
      name: 'New Jiachuan',
      models: ['A00']
    },
    {
      name: 'Jetour',
      models: ['Traveler', 'X70', 'X90', 'Dashing', 'T2']
    },
    {
      name: 'Omoda',
      models: ['5', 'Jaecoo 7']
    },
    {
      name: 'Jaecoo',
      models: ['7']
    },
    {
      name: 'Exeed',
      models: ['VX', 'LX', 'TXL', 'Sterra ES', 'Sterra ET']
    },
    {
      name: 'Sterra',
      models: ['ES', 'ET']
    },
    {
      name: 'iCar',
      models: ['03', 'V23']
    },
    {
      name: 'Kaiyi',
      models: ['X5', 'X3']
    }
  ];

  getCarMakes(): CarMake[] {
    return this.carMakes;
  }

  getModelsByMake(makeName: string): string[] {
    const make = this.carMakes.find(m => m.name === makeName);
    return make ? make.models : [];
  }

  getYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  }

  searchModels(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const models: string[] = [];
    for (const make of this.carMakes) {
      for (const model of make.models) {
        if (model.toLowerCase().includes(lowerQuery)) {
          models.push(`${make.name} ${model}`);
        }
      }
    }
    return models;
  }
}
