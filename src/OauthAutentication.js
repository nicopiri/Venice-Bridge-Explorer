import React, { useEffect, useState, useRef, useCallback } from 'react';
import esriConfig from "@arcgis/core/config";

function MapComponent() {

    //...

  const getToken = async () => {
    const clientId = process.env.REACT_APP_ARCGIS_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_ARCGIS_CLIENT_SECRET;
    const tokenUrl = 'https://www.arcgis.com/sharing/rest/oauth2/token';

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        body: params
      });
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Errore nell\'ottenere il token:', error);
      return null;
    }
  };


  const initializeMap = useCallback(async () => {

    const token = await getToken();
    if (!token) {
      console.error('Impossibile ottenere il token di accesso');
      return;
    }

    esriConfig.apiKey = token;
    
    //...
  })
}