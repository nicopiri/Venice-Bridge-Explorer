import React, { useState, useEffect } from 'react';
import '../index.css';

function MapComponentUI({
  mapRef,
  bridges,
  selectedBridge,
  bridgeImages,
  isAdmin,
  pendingImages,
  handleFileUpload,
  handleAdminLogin,
  handleImageApproval,
  adminSelectedBridge,
  setAdminSelectedBridge,
  sanitizeText,
  showUserLocation,
  findNearestBridge,
  handleAdminLogout,
  handleAdminFileUpload
}) {
  const [rightPanelWidth, setRightPanelWidth] = useState('20%');

  useEffect(() => {
    if (selectedBridge) {
      setRightPanelWidth('50%'); // Aumenta la larghezza al 50% quando un ponte è selezionato
    } else {
      setRightPanelWidth('20%'); // Torna alla larghezza originale quando nessun ponte è selezionato
    }
  }, [selectedBridge]);

  const mapWidth = `calc(98% - ${rightPanelWidth})`;

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '10px 20px', 
        backgroundColor: '#B91135', 
        color: '#fff', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        zIndex: 1 
      }}>
        <img src="logo_sdpt.png" alt="Company Logo" style={{ height: '40px', marginRight: '20px' }} />
        <h1 style={{ margin: 0, fontFamily: 'Dancing Script, cursive', fontSize: '30px', fontWeight: 'normal' }}>
          Venice Bridge Explorer
        </h1>
      </header>
      <div 
        style={{
          position: 'absolute',
          top: '60px',
          left: 0,
          width: mapWidth,
          height: 'calc(100% - 60px)',
          padding: '15px', // Aggiunge spazio per il bordo esterno
          boxSizing: 'border-box',
          backgroundColor: '#F5F2E6' 
        }}
      >
        <div 
          ref={mapRef} 
          style={{ 
            width: '99%',
            height: '99%',
            border: '1px solid #B91135', // Cornice interna attorno alla mappa
            transition: 'width 0.5s ease'
          }} 
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: '60px',
          right: 0,
          width: rightPanelWidth,
          height: 'calc(100% - 60px)',
          backgroundColor: '#F5F2E6',
          overflowY: 'auto',
          padding: '20px',
          transition: 'width 0.5s ease' // Aggiunge una transizione fluida
        }}
      >
        {!isAdmin ? (
          <>
            {selectedBridge ? (
              <div>
                <h2 style={{ fontFamily: 'Arial, sans-serif' }}>{selectedBridge.name}</h2> {/* Cambia font del nome del ponte */}
                <p style={{ fontFamily: 'Arial, sans-serif' }}>{sanitizeText(selectedBridge.description)}</p> {/* Cambia font della descrizione del ponte */}
                <div>
                    {bridgeImages.length > 0 ? (
                        bridgeImages.map((image, index) => (
                        <img
                            key={index}
                            src={image.url}
                            alt={image.alt}
                            style={{ 
                            maxWidth: '50%',  // Imposta una larghezza massima per le immagini
                            maxHeight: '300px', // Imposta un'altezza massima per le immagini
                            marginBottom: '10px',
                            objectFit: 'fit' // Mantiene le proporzioni dell'immagine
                            }}
                            onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'imageerror.png';
                            }}
                        />
                        ))
                    ) : (
                        <p style={{ fontFamily: 'Arial, sans-serif' }}>No images available, upload one!</p>
                    )}
                </div>

                <input 
                  type="file" 
                  id="fileUpload" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
                <label htmlFor="fileUpload" style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline', fontFamily: 'Arial, sans-serif' }}>
                  Choose file to upload
                </label>
              </div>
            ) : (
              <p style={{ fontFamily: 'Arial, sans-serif' }}>Select a bridge on the map to see details</p>
            )}
            <div style={buttonContainerStyle}>
              <button style={vintageButtonStyle} onClick={findNearestBridge}>Find Nearest Bridge</button>
              <button style={vintageButtonStyle} onClick={showUserLocation}>Show My Location</button>
              <button style={vintageButtonStyle} onClick={handleAdminLogin}>Admin Login</button>
            </div>
          </>
        ) : (
          <div>
            <h2 style={{ fontFamily: 'Arial, sans-serif' }}>Admin Panel</h2> 
            <button style={vintageButtonStyle} onClick={handleAdminLogout}>Back to Main Page</button>
            
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontFamily: 'Arial, sans-serif' }}>Upload Image Directly</h3> 
              <select 
                value={adminSelectedBridge} 
                onChange={(e) => setAdminSelectedBridge(e.target.value)}
                style={{ marginRight: '10px', fontFamily: 'Arial, sans-serif' }} 
              >
                <option value="">Select a bridge</option>
                {bridges.map(bridge => (
                  <option key={bridge.id} value={bridge.id} style={{ fontFamily: 'Arial, sans-serif' }}>{bridge.name}</option>
                ))}
              </select>
              <input 
                type="file" 
                onChange={handleAdminFileUpload}
                disabled={!adminSelectedBridge}
              />
            </div>

            <h3 style={{ fontFamily: 'Arial, sans-serif' }}>Pending Images</h3> {/* Cambia font */}
            {pendingImages.map((image, index) => (
              <div key={index} style={{ marginBottom: '20px' }}>
                <img src={image.url} alt="Pending" style={{ maxWidth: '100%' }} />
                <div style={buttonContainerStyle}>
                  <button style={vintageButtonStyle} onClick={() => handleImageApproval(image.key, true)}>Approve</button>
                  <button style={vintageButtonStyle} onClick={() => handleImageApproval(image.key, false)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stile vintage per i pulsanti
const vintageButtonStyle = {
  backgroundColor: '#F5F2E6',
  border: '2px solid #B91135',
  borderRadius: '5px',
  color: '#B91135',
  cursor: 'pointer',
  fontFamily: 'Bebas Neue, sans-serif', // Font vintage
  fontSize: '16px',
  padding: '10px 20px',
  textAlign: 'center',
  textDecoration: 'none',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Ombra leggera
  transition: 'background-color 0.5s, color 0.5s',
  marginBottom: '10px', // Spazio tra i pulsanti
};

// Contenitore per i pulsanti
const buttonContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px', // Spazio tra i pulsanti
};

export default MapComponentUI;
