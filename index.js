"use strict";

const TelegramBot = require('node-telegram-bot-api');
const Config = require('./config');

const bot = new TelegramBot(Config.tgToken, {polling: true});

const locationRegExp = /(\-?\d{1,3}(?:\.|,)\d+)[, /|;\s]+(\-?\d{1,3}(?:\.|,)\d+)/i
const directDigitsRegExp = /(\-?[0-9\s\-]+)/

const putDecimal = (str, positionFromEnd) => {
  const index = str.length - positionFromEnd
  return str.substr(0,index) + '.' + str.substr(index)
}


// Valid longitudes are from -180 to 180 degrees.
// Valid latitudes are from -85.05112878 to 85.05112878 degrees.
const getCoordinatesFromDirectString = (typeinString) => {
  const directString = `${typeinString}`.replace(/\s+/, '')
  let raw = {}
  
  const latMinus = directString.indexOf('-')
  const lonMinus = directString.indexOf('-', 2)
  
  const directDigits = directString.replace(/\-/gi, '') 
  
  let ddMiddle = directDigits.length / 2
  if (lonMinus > 1){
    ddMiddle = lonMinus
  }
  
  const middle = Math.floor(ddMiddle)
  raw.lat = directDigits.substr(0,middle)
  raw.lon = directDigits.substr(middle)
  
  // Decimal Precision Scale
  const digitsNum = raw.lat.replace('-', '').length
  const decimalScale = digitsNum > 2 ? digitsNum - 2 : 1
  
  let latitude = parseFloat(putDecimal(raw.lat, decimalScale))
  let longitude = parseFloat(putDecimal(raw.lon, decimalScale))
  
  if (Math.abs(latitude) > 90)
    latitude = parseFloat(putDecimal(raw.lat, decimalScale + 1))
  if (Math.abs(longitude) > 180)
    longitude = parseFloat(putDecimal(raw.lon, decimalScale + 1))
  
  if (latMinus === 0)
  	latitude = latitude * -1
  if (lonMinus > 2)
  	longitude = longitude * -1
  
  return {latitude: latitude, longitude: longitude }
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userName = !msg.from ? '' : msg.from.first_name || `@${msg.from.username}`
  
  const llMatch = msg.text && msg.text.match(locationRegExp)
  let coordinates = null
  let directDigitsMatch = null
  
  if (llMatch){
    coordinates = {latitude: llMatch[1].replace(/[,]+/gi, '.'), longitude:llMatch[2].replace(/[,]+/gi, '.')}
  }
  else if (directDigitsMatch = msg.text.match(directDigitsRegExp)){
    coordinates = getCoordinatesFromDirectString(directDigitsMatch[1])
  }
  
  if (coordinates){
    bot.sendMessage(chatId, `${userName}, here's location for ${coordinates.latitude}, ${coordinates.longitude}`);
    bot.sendLocation(chatId, coordinates.latitude, coordinates.longitude)
  }
  else{
    bot.sendMessage(chatId, 'Please send me the coordinates');
  }
});
