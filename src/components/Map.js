import React, { useEffect, useState, useRef, useCallback } from 'react';
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import AWS from 'aws-sdk';
import axios from 'axios';

const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY;
const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
const region = process.env.REACT_APP_AWS_REGION;


const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';

function MapComponent() {
  const [selectedBridge, setSelectedBridge] = useState(null);
  const [bridgeImages, setBridgeImages] = useState([]);
  const [userIP, setUserIP] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [bridges, setBridges] = useState([]);
  const [adminSelectedBridge, setAdminSelectedBridge] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const highlightGraphicRef = useRef(null);
  const mapViewRef = useRef(null);
  const mapRef = useRef(null);

  const initializeMap = useCallback(() => {
    const map = new Map({
      basemap: 'topo-vector'
    });

    const view = new MapView({
      container: mapRef.current,
      map: map,
      center: [12.3155, 45.4408],
      zoom: 14,
      popup: {
        defaultPopupTemplateEnabled: false
      }
    });

    const featureLayer = new FeatureLayer({
      url: 'https://services7.arcgis.com/BEVijU9IvwRENrmx/arcgis/rest/services/bridges/FeatureServer',
      outFields: ['birth_certificate_birthID', 'data_Bridge_Name', 'data_History']
    });

    map.add(featureLayer);
    mapViewRef.current = view;

    featureLayer.queryFeatures().then(result => {
      const bridgeData = result.features.map(feature => ({
        id: feature.attributes.birth_certificate_birthID,
        name: feature.attributes.data_Bridge_Name
      }));
      bridgeData.sort((a, b) => a.name.localeCompare(b.name));
      setBridges(bridgeData);
    });

    view.on("click", event => {
      view.hitTest(event).then(response => {
        if (response.results.length) {
          const graphic = response.results[0].graphic;
          if (graphic && graphic.attributes && graphic.attributes.birth_certificate_birthID) {
            setSelectedBridge({
              id: graphic.attributes.birth_certificate_birthID,
              name: graphic.attributes.data_Bridge_Name,
              description: graphic.attributes.data_History
            });

            if (highlightGraphicRef.current) {
              view.graphics.remove(highlightGraphicRef.current);
            }

            const markerSymbol = {
              type: "simple-marker",
              color: [226, 119, 40],
              outline: {
                color: [255, 255, 255],
                width: 2
              }
            };

            const pointGraphic = new Graphic({
              geometry: graphic.geometry,
              symbol: markerSymbol
            });

            view.graphics.add(pointGraphic);
            highlightGraphicRef.current = pointGraphic;

            loadBridgeImages(graphic.attributes.birth_certificate_birthID);
          } else {
            setSelectedBridge(null);
            setBridgeImages([]);
            if (highlightGraphicRef.current) {
              view.graphics.remove(highlightGraphicRef.current);
              highlightGraphicRef.current = null;
            }
          }
        }
      });
    });
  }, []);

  useEffect(() => {
    initializeMap();

    axios.get('https://api.ipify.org?format=json')
      .then(response => {
        setUserIP(response.data.ip);
      })
      .catch(error => {
        console.error('Error fetching user IP:', error);
      });
  }, [initializeMap]);


  const loadBridgeImages = async (bridgeID) => {
    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });

    const listParams = {
      Bucket: 'venicebridges',
      Prefix: `${bridgeID}_image`
    };

    try {
      const { Contents } = await s3.listObjectsV2(listParams).promise();
      const imageNames = Contents.map(item => item.Key);
      const images = imageNames.map(image => ({
        url: `https://venicebridges.s3.eu-north-1.amazonaws.com/${image}`,
        alt: `${bridgeID} Image`
      }));
      setBridgeImages(images);
    } catch (err) {
      console.error('There was an error loading images: ', err.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedBridge || !userIP) return;

    const currentDate = new Date().toISOString().split('T')[0];
    const uploadKey = `upload_${userIP}_${selectedBridge.id}`;

    let uploadData;
    try {
      uploadData = JSON.parse(localStorage.getItem(uploadKey)) || {};
    } catch (e) {
      uploadData = {};
    }
    const { date, count } = uploadData;

    if (date === currentDate && count >= 4) {
      alert('You can only upload up to 4 images per bridge per day.');
      return;
    }

    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });

    try {
      const { Contents } = await s3.listObjectsV2({
        Bucket: 'venicebridges',
        Prefix: `pending_${selectedBridge.id}_image`
      }).promise();
      const imageCount = Contents.length + 1;
      const newFileName = `pending_${selectedBridge.id}_image${imageCount}.jpg`;

      const uploadParams = {
        Bucket: 'venicebridges',
        Key: newFileName,
        Body: file
      };

      await s3.upload(uploadParams).promise();
      alert('File uploaded successfully! It will be reviewed by an admin.');

      const newCount = date === currentDate ? count + 1 : 1;
      localStorage.setItem(uploadKey, JSON.stringify({ date: currentDate, count: newCount }));
    } catch (err) {
      console.error('There was an error uploading your file: ', err.message);
    }
  };

  const handleAdminLogin = () => {
    const username = prompt('Enter admin username:');
    const password = prompt('Enter admin password:');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      loadPendingImages();
    } else {
      alert('Invalid credentials');
    }
  };

  const loadPendingImages = async () => {
    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });

    try {
      const { Contents } = await s3.listObjectsV2({
        Bucket: 'venicebridges',
        Prefix: 'pending_'
      }).promise();

      const pendingImages = Contents.map(item => ({
        key: item.Key,
        url: `https://venicebridges.s3.eu-north-1.amazonaws.com/${item.Key}`
      }));

      setPendingImages(pendingImages);
    } catch (err) {
      console.error('Error loading pending images:', err);
    }
  };

  const handleImageApproval = async (imageKey, approved) => {
    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });

    try {
      if (approved) {
        const newKey = imageKey.replace('pending_', '');
        await s3.copyObject({
          Bucket: 'venicebridges',
          CopySource: `venicebridges/${imageKey}`,
          Key: newKey
        }).promise();
      }

      await s3.deleteObject({
        Bucket: 'venicebridges',
        Key: imageKey
      }).promise();

      loadPendingImages();
    } catch (err) {
      console.error('Error handling image approval:', err);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raggio della Terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const showUserLocation = () => {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            let { latitude, longitude } = position.coords;
            //correzione coordinate 
            latitude +=  (670 / 111111);
            longitude -= (75 / (111111 * Math.cos(latitude * Math.PI / 180))); 
            
            const newLocation = { latitude, longitude };
            setUserLocation(newLocation);
            
            if (mapViewRef.current) {
              const point = {
                type: "point",
                longitude: longitude,
                latitude: latitude
              };
              
              const markerSymbol = {
                type: "simple-marker",
                color: [0, 102, 255],
                outline: {
                  color: [255, 255, 255],
                  width: 2
                }
              };
              
              const userLocationGraphic = new Graphic({
                geometry: point,
                symbol: markerSymbol
              });
              
              mapViewRef.current.graphics.removeAll();
              mapViewRef.current.graphics.add(userLocationGraphic);
              mapViewRef.current.center = [longitude, latitude];
              mapViewRef.current.zoom = 15;
            }
            resolve(newLocation);
          },
          (error) => {
            console.error("Errore nel recupero della posizione dell'utente:", error);
            alert("Impossibile recuperare la tua posizione. Assicurati di aver concesso il permesso di accesso alla tua posizione.");
            reject(error);
          }
        );
      } else {
        alert("La geolocalizzazione non è supportata dal tuo browser.");
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  const findNearestBridge = async () => {
    try {
      let location = userLocation;
      if (!location) {
        location = await showUserLocation();
      }
  
      if (!location) {
        throw new Error("Impossibile ottenere la posizione dell'utente");
      }
  
      const featureLayer = mapViewRef.current.map.layers.getItemAt(0);
      const query = featureLayer.createQuery();
      query.outFields = ["*"];
      query.returnGeometry = true;
  
      const results = await featureLayer.queryFeatures(query);
      let nearestBridge = null;
      let shortestDistance = Infinity;
  
      results.features.forEach(feature => {
        const bridgeLat = feature.geometry.latitude;
        const bridgeLon = feature.geometry.longitude;
        const distance = calculateDistance(
          location.latitude, location.longitude,
          bridgeLat, bridgeLon
        );
  
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestBridge = feature;
        }
      });
  
      if (nearestBridge) {
        setSelectedBridge({
          id: nearestBridge.attributes.birth_certificate_birthID,
          name: nearestBridge.attributes.data_Bridge_Name,
          description: nearestBridge.attributes.data_History
        });
  
        if (highlightGraphicRef.current) {
          mapViewRef.current.graphics.remove(highlightGraphicRef.current);
        }
  
        const markerSymbol = {
          type: "simple-marker",
          color: [226, 119, 40],
          outline: {
            color: [255, 255, 255],
            width: 2
          }
        };
  
        const pointGraphic = new Graphic({
          geometry: nearestBridge.geometry,
          symbol: markerSymbol
        });
  
        mapViewRef.current.graphics.add(pointGraphic);
        highlightGraphicRef.current = pointGraphic;
  
        mapViewRef.current.center = [nearestBridge.geometry.longitude, nearestBridge.geometry.latitude];
        mapViewRef.current.zoom = 16;
  
        loadBridgeImages(nearestBridge.attributes.birth_certificate_birthID);
      } else {
        alert("Nessun ponte trovato nelle vicinanze.");
      }
    } catch (error) {
      console.error("Errore nel trovare il ponte più vicino:", error);
      alert("Si è verificato un errore nel trovare il ponte più vicino. Per favore, riprova.");
    }
  };


  const handleAdminFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !adminSelectedBridge) return;

    const s3 = new AWS.S3({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    });

    try {
      const { Contents } = await s3.listObjectsV2({
        Bucket: 'venicebridges',
        Prefix: `${adminSelectedBridge}_image`
      }).promise();

      const imageCount = Contents.length + 1;
      const newFileName = `${adminSelectedBridge}_image${imageCount}.jpg`;

      const uploadParams = {
        Bucket: 'venicebridges',
        Key: newFileName,
        Body: file
      };

      await s3.upload(uploadParams).promise();
      alert('File uploaded successfully!');
    } catch (err) {
      console.error('There was an error uploading your file: ', err.message);
    }
  };

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    setAdminSelectedBridge(null);
    setTimeout(() => {
      initializeMap();
    }, 0);
  }, [initializeMap]);

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      {!isAdmin ? (
        <>
          <div style={{ display: 'flex', height: '100%' }}>
            <div ref={mapRef} style={{ flex: 1 }} />
            <div style={{ flex: 1, padding: '20px', backgroundColor: '#f4f4f4', overflowY: 'auto' }}>
              {selectedBridge ? (
                <div>
                  <h2>{selectedBridge.name}</h2>
                  <p>{selectedBridge.description}</p>
                  <div>
                    {bridgeImages.length > 0 ? (
                      bridgeImages.map((image, index) => (
                        <img
                          key={index}
                          src={image.url}
                          alt={image.alt}
                          style={{ maxWidth: '100%', marginBottom: '10px' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'imageerror.png';
                          }}
                        />
                      ))
                    ) : (
                      <p>No images available, upload one!</p>
                    )}
                  </div>
                  <input 
                    type="file" 
                    id="fileUpload" 
                    style={{ display: 'none' }} 
                    onChange={handleFileUpload} 
                  />
                  <label htmlFor="fileUpload" style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>
                    Choose file to upload
                  </label>
                </div>
              ) : (
                <p>Select a bridge on the map to see details</p>
              )}
               <button onClick={showUserLocation}>Show My Location</button>
              <button onClick={handleAdminLogin}>Admin Login</button>
              <button onClick={findNearestBridge}>Trova il ponte più vicino</button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '20px', backgroundColor: '#f4f4f4', overflowY: 'auto', height: '100%' }}>
          <h2>Admin Panel</h2>
          <button onClick={handleAdminLogout}>Back to Main Page</button>
          
          <div style={{ marginTop: '20px' }}>
            <h3>Upload Image Directly</h3>
            <select 
              value={adminSelectedBridge} 
              onChange={(e) => setAdminSelectedBridge(e.target.value)}
              style={{ marginRight: '10px' }}
            >
              <option value="">Select a bridge</option>
              {bridges.map(bridge => (
                <option key={bridge.id} value={bridge.id}>{bridge.name}</option>
              ))}
            </select>
            <input 
              type="file" 
              onChange={handleAdminFileUpload}
              disabled={!adminSelectedBridge}
            />
          </div>

          <h3>Pending Images</h3>
          {pendingImages.map((image, index) => (
            <div key={index} style={{ marginBottom: '20px' }}>
              <img src={image.url} alt="Pending" style={{ maxWidth: '100%' }} />
              <button onClick={() => handleImageApproval(image.key, true)}>Approve</button>
              <button onClick={() => handleImageApproval(image.key, false)}>Reject</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MapComponent;