import React from 'react';
import { useParams } from 'react-router-dom';

function EditBridge() {
  const { id } = useParams();
  // Codice per modificare i dettagli del ponte con l'ID specificato

  return (
    <div>
      <h2>Modifica del Ponte</h2>
      {/* Form per modificare i dettagli del ponte */}
    </div>
  );
}

export default EditBridge;
