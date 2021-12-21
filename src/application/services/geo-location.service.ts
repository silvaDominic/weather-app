import axios from 'axios';
import { PlainObject } from '../../shared/interfaces/plain-object';
import { mapToGeolocationResponse } from '../location.mapper';
import { API_KEY_OPEN_WEATHER } from '../../shared/constants/environment.const';
import { IGeolocationResponse } from '../models/geo-response.interface';

const GEOLOCATION_BASE_URL = "http://api.openweathermap.org/geo/1.0";

export const GeoLocationService = {
  async getCurrentLocationCoords(): Promise<IGeolocationResponse> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async position => {
          resolve(await this.getLocationByCoordinates(position.coords.latitude, position.coords.longitude));
        }, err => {
          reject(err);
        });
      } else {
        reject("Location service not found");
      }
    });
  },

  async getLocationByCoordinates(latitude: number, longitude: number): Promise<IGeolocationResponse> {
    const params: PlainObject = {
      lat: latitude,
      lon: longitude,
      limit: 1, // Prefer the first result since we cannot vet the response for correctness
      appid: API_KEY_OPEN_WEATHER,
    }
    return axios.get(`${GEOLOCATION_BASE_URL}/reverse`, {params})
      .then(res => {
        if (!res.data.length) {
          throw new Error("The provided location cannot be found");
        }
        return mapToGeolocationResponse(res.data[0]);
      })
      .catch(err => {
        console.log("GEO-SERVICE: ", err);
        throw err;
      })
  },

  async getGeolocationByZipcode(zipcode: string): Promise<IGeolocationResponse> {
    if (isValidParams(zipcode)) {
      const params: PlainObject = {
        zip: zipcode,
        appid: API_KEY_OPEN_WEATHER,
      }
      try {
        const res = await axios.get(`${GEOLOCATION_BASE_URL}/zip`, {params});
        if (!res.data) {
          throw new Error("The provided location cannot be found");
        }
        return await this.getLocationByCoordinates(res.data.lat, res.data.lon);
      } catch (err) {
        throw err;
      }
    } else {
      throw new Error("City and/or country must be valid strings");
    }
  }
}

function isValidParams(zipcode: string): boolean {
  // Check if zipcode contains only digits
  return zipcode !== undefined && /^[0-9]+$/.test(zipcode);
}