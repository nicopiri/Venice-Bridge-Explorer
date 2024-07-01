// MapComponentUI.js
import React from 'react';

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
    return(
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
    {!isAdmin ? (
      <>
        <div style={{ display: 'flex', height: '100%' }}>
          <div ref={mapRef} style={{ flex: 1 }} />
          <div style={{ flex: 1, padding: '20px', backgroundColor: '#f4f4f4', overflowY: 'auto' }}>
            {selectedBridge ? (
              <div>
                <h2>{selectedBridge.name}</h2>
                <p>{sanitizeText(selectedBridge.description)}</p>
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


export default MapComponentUI;
 