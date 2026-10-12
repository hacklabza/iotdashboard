export const getColorValue = (colorName: string) => {
  const colorMap: { [key: string]: string } = {
    red: '#EF5350',
    blue: '#42A5F5',
    green: '#66BB6A',
    yellow: '#FFEE58',
    orange: '#FFA726',
    purple: '#AB47BC',
    pink: '#EC407A',
    teal: '#26A69A',
    cyan: '#26C6DA',
    lime: '#D4E157',
    amber: '#FFCA28',
    indigo: '#5C6BC0',
  };
  return colorMap[colorName.toLowerCase()];
};


export const getIconEmoji = (iconName?: string) => {
  const iconMap: { [key: string]: string } = {
    thermometer: '🌡️',
    humidity: '💧',
    light: '💡',
    switch: '🔌',
    pool: '🏖️',
    rain: '🌧️',
    sun: '☀️',
    battery: '🔋',
    electricity: '⚡',
    pressure: '🕰️'
  };
  return iconName ? iconMap[iconName.toLowerCase()] || '📌' : '📌'
};


export const getUnitSymbol = (unitName?: string) => {
  const unitMap: { [key: string]: string } = {
    celsius: '°C',
    fahrenheit: '°F',
    percentage: '%',
    lux: 'lx',
    volts: 'V',
    amps: 'A',
    watts: 'W',
    kilowatts: 'kW',
    hertz: 'Hz',
    millimeters: 'mm',
    centimeters: 'cm',
    meters: 'm',
    kilometers: 'km',
    inches: 'in',
    feet: 'ft',
    yards: 'yd',
    miles: 'mi',
    hpa: 'hPa',
  };
  return unitName ? unitMap[unitName.toLowerCase()] || unitName : '';
};
