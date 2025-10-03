export const BASE_URL = 'https://beneshtyapi.geniussystemapi.com/api';
export const endpoints = {

home:`${BASE_URL}/Home`,
  productBundle: `${BASE_URL}/ProductBundle?pageNo=1&pageSize=20`,
  advancedSearch: `${BASE_URL}/AdvancedSearch`,
  // Auth (if you have auth endpoints)

  productById: (id) => `${BASE_URL}/ProductDetails?id=${id}`,


  auth: {
    signin: `${BASE_URL}/auth/signin`,
    sendOTP: `${BASE_URL}/auth/otp/send`,
    verifyOTP: `${BASE_URL}/auth/otp/verify`,
    refresh: `${BASE_URL}/auth/refresh`,
    profile: `${BASE_URL}/auth/profile`,
  },
  
  // Cart & Favorites (if available)
  cart: `${BASE_URL}/cart`,
  favorites: `${BASE_URL}/favorites`,
};
