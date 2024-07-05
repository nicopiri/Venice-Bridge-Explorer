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
  handleAdminFileUpload,
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
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 20px',
          backgroundColor: '#B91135',
          color: '#fff',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 1,
        }}
      >
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
          padding: '15px',
          boxSizing: 'border-box',
          backgroundColor: '#F5F2E6',
        }}
      >
        <div
          ref={mapRef}
          style={{
            width: '99%',
            height: '99%',
            border: '2px solid #B91135',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: '60px',
          right: 0,
          width: rightPanelWidth,
          height: 'calc(95% - 60px)',
          backgroundColor: '#F5F2E6',
          overflowY: 'auto',
          padding: '20px',
          transition: 'width 0.5s ease',
        }}
      >
        {!isAdmin ? (
          <>
            {selectedBridge ? (
              <div>
                <h1
                  style={{
                    fontFamily: 'Great Vibes, cursive',
                    borderBottom: '2px solid #B91135',
                    paddingBottom: '5px',
                  }}
                >
                  {selectedBridge.name}
                </h1>
                <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#F3F0E2',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    marginBottom: '20px',
                  }}
                >
                  <p style={{ fontFamily: 'Cabin, sans-serif', margin: 0 }}>
                    {selectedBridge.description ? (
                      sanitizeText(selectedBridge.description)
                    ) : (
                      <span style={{ fontFamily: 'Cabin, sans-serif' }}>No description available</span>
                    )}
                  </p>
                </div>
                <div>
                  {bridgeImages.length > 0 ? (
                    bridgeImages.map((image, index) => (
                      <img
                        key={index}
                        src={image.url}
                        alt={image.alt}
                        style={{
                          maxWidth: '50%',
                          maxHeight: '300px',
                          marginBottom: '10px',
                          objectFit: 'fit',
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'imageerror.png';
                        }}
                      />
                    ))
                  ) : (
                    <p style={{ fontFamily: 'Cabin, sans-serif' }}>No images available, upload one!</p>
                  )}
                </div>

                <input type="file" id="fileUpload" style={{ display: 'none' }} onChange={handleFileUpload} />
                <label htmlFor="fileUpload" style={{ ...vintageButtonStyle, display: 'inline-block' }}>
                  Choose a photo to upload
                </label>

                {/* Street View iFrame */}
                <div style={{ marginTop: '20px' }}>
                  <h1
                    style={{
                      fontFamily: 'Great Vibes, cursive',
                      borderBottom: '2px solid #B91135',
                      paddingBottom: '5px',
                    }}
                  >
                    Bridge View
                  </h1>
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!4v1625024000000!6m8!1m7!1sAF1QipNMrUOxK8HslcNX_Mjj8U8TE1V1yKJOJgIHrjmR!2m2!1d${selectedBridge.latitude}!2d${selectedBridge.longitude}!3f200.73!4f0!5f0.8!6i1`}
                    width="100%"
                    height="300px"
                    style={{ border: 'none' }}
                    title="Bridge View"
                  />
                </div>
                <p
              style={{
                padding: '10px',
                backgroundColor: '#F3F0E2',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                marginTop: '20px',
                fontFamily: 'Cabin, sans-serif'
              }}
              >Click anywhere on the map to close the details!
              </p>
                <div style={buttonContainerStyle}>
              <button style={vintageButtonStyle} onClick={findNearestBridge}>
                Find Nearest Bridge
              </button>
              <button style={vintageButtonStyle} onClick={showUserLocation}>
                Show My Location
              </button>
              <button style={vintageButtonStyle} onClick={handleAdminLogin}>
                Admin Login
              </button>
            </div>
              </div>
            ) : (
              <div>
              <p
              style={{
                padding: '10px',
                backgroundColor: '#F3F0E2',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                marginTop: '20px',
                fontFamily: 'Cabin, sans-serif'
              }}
              ><strong>Select a bridge on the map</strong> to open the details!
              </p>
              <div style={buttonContainerStyle}>
                <button style={vintageButtonStyle} onClick={findNearestBridge}>
                  Find Nearest Bridge
                </button>
                <button style={vintageButtonStyle} onClick={showUserLocation}>
                  Show My Location
                </button>
                <button style={vintageButtonStyle} onClick={handleAdminLogin}>
                  Admin Login
                </button>
              </div>
               <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#F3F0E2',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    marginTop: '20px',
                  }}
                >
                  <p style={{ fontFamily: 'Cabin, sans-serif' }}><strong>Venice Bridge Explorer</strong> is a digital homage to the bridges of Venice. It transforms static map data into an engaging, <strong>interactive experience</strong> that invites users to explore, learn, and contribute. Whether you’re an enthusiast of Venetian history, a casual explorer, or a dedicated researcher, this App offers a unique and valuable perspective on of the world’s most iconic city.
                  </p>
                  <p style={{ fontFamily: 'Cabin, sans-serif' }}>
                    Embark on your virtual <strong>journey through Venice’s bridges</strong> and discover the stories that span centuries, all brought to life through the synergy of cutting-edge <strong>technology</strong> and rich <strong>cultural heritage</strong>.
                  </p>
                </div>
                <footer
  style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '80%',
    backgroundColor: '#F5F2E6',
    borderTop: '1px solid #B91135',
    padding: '30px',
    textAlign: 'center',
    fontFamily: 'Cabin, sans-serif',
    fontSize: '14px',
    color: '#B91135',
  }}
>
  Created by{' '}
  <a
    href="https://linktr.ee/niccolopirillo"
    style={{
      color: '#B91135',
      textDecoration: 'underline',
      fontWeight: 'bold',
      transition: 'color 0.3s ease',
    }}
    target="_blank"
    rel="noopener noreferrer"
    onMouseOver={(e) => e.currentTarget.style.color = '#A8001C'}
    onMouseOut={(e) => e.currentTarget.style.color = '#B91135'}
  >
    Niccolò Pirillo
  </a>{' '}
  under{' '}
  <a
    href="https://www.serendpt.net/"
    style={{
      color: '#B91135',
      textDecoration: 'underline',
      fontWeight: 'bold',
      transition: 'color 0.3s ease',
    }}
    target="_blank"
    rel="noopener noreferrer"
    onMouseOver={(e) => e.currentTarget.style.color = '#A8001C'}
    onMouseOut={(e) => e.currentTarget.style.color = '#B91135'}
  >
    SerenDPT
  </a>
</footer>


            </div>
            )}

          </>
        ) : (
          <div>
            <h2 style={{ fontFamily: 'Cabin, sans-serif' }}>Admin Panel</h2>
            <button style={vintageButtonStyle} onClick={handleAdminLogout}>
              Back to Main Page
            </button>

            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontFamily: 'Cabin, sans-serif' }}>Upload Image Directly</h3>
              <select
                value={adminSelectedBridge}
                onChange={(e) => setAdminSelectedBridge(e.target.value)}
                style={{ marginRight: '10px', fontFamily: 'Cabin, sans-serif' }}
              >
                <option value="">Select a bridge</option>
                {bridges.map((bridge) => (
                  <option key={bridge.id} value={bridge.id} style={{ fontFamily: 'Cabin, sans-serif' }}>
                    {bridge.name}
                  </option>
                ))}
              </select>
              <input
                type="file"
                onChange={handleAdminFileUpload}
                disabled={!adminSelectedBridge}
                style={{ display: 'inline-block' }}
              />
            </div>

            <h3 style={{ fontFamily: 'Cabin, sans-serif' }}>Pending Images</h3>
            {pendingImages.map((image, index) => (
              <div key={index} style={{ marginBottom: '20px' }}>
                <img src={image.url} alt="Pending" style={{ maxWidth: '100%' }} />
                <div style={buttonContainerStyle}>
                  <button style={vintageButtonStyle} onClick={() => handleImageApproval(image.key, true)}>
                    Approve
                  </button>
                  <button style={vintageButtonStyle} onClick={() => handleImageApproval(image.key, false)}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    
    </div>
  );
}

const vintageButtonStyle = {
  backgroundColor: '#F5F2E6',
  border: '2px solid #B91135',
  borderRadius: '5px',
  color: '#B91135',
  cursor: 'pointer',
  fontFamily: 'Bebas Neue, sans-serif',
  fontSize: '16px',
  padding: '10px 20px',
  textAlign: 'center',
  textDecoration: 'none',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'background-color 0.5s, color 0.5s',
  marginBottom: '10px',
};

const buttonContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

export default MapComponentUI;
