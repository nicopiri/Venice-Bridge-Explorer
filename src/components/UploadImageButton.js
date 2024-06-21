import React from 'react';

const UploadImageButton = ({ bridgeID, onImageUploaded }) => {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64data = reader.result.split(',')[1];

        const response = await fetch('https://1l63iebti8.execute-api.eu-north-1.amazonaws.com/prod/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bridgeID: bridgeID,
            image: {
              name: file.name,    
              type: file.type,
              data: base64data,
            },
          }),
        });

        const data = await response.json();
        if (response.ok) {
          alert('Immagine caricata con successo!');
          onImageUploaded(); // Aggiorna l'elenco delle immagini dopo l'upload
        } else {
          alert('Errore durante il caricamento dell\'immagine');
        }
      };
    } catch (error) {
      console.error('Errore durante il caricamento dell\'immagine:', error);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

export default UploadImageButton;
