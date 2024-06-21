import React from 'react';
import { useParams } from 'react-router-dom';

function BridgeDetails() {
  const { id } = useParams();
  // Codice per recuperare e visualizzare i dettagli del ponte con l'ID specificato

  return (
    <div>
      <h2>Dettagli del Ponte</h2>
      {/* Visualizzazione dei dettagli del ponte */}
    </div>
  );
}

export default BridgeDetails;
