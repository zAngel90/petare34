import { useState, useRef } from 'react';
import { Upload, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import './FileUpload.css';

const FileUpload = ({ 
  onUploadComplete, 
  type = 'payment-proof', // 'payment-proof' o 'product-image'
  acceptedTypes = 'image/*',
  maxSize = 5, // MB
  label = 'Subir archivo'
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`El archivo es muy grande. Máximo ${maxSize}MB`);
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }

    setError('');

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Subir archivo
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      const fieldName = type === 'product-image' ? 'image' : 'file';
      formData.append(fieldName, file);

      const endpoint = type === 'product-image' 
        ? API_CONFIG.ENDPOINTS.UPLOAD.PRODUCT_IMAGE
        : API_CONFIG.ENDPOINTS.UPLOAD.PAYMENT_PROOF;

      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const fileUrl = `${API_CONFIG.SERVER_URL}${data.data.url}`;
        setUploadedFile({
          url: fileUrl,
          filename: data.data.filename,
          size: data.data.size
        });
        onUploadComplete(fileUrl);
      } else {
        setError(data.error || 'Error al subir archivo');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {!uploadedFile ? (
        <div 
          className={`upload-area ${uploading ? 'uploading' : ''} ${error ? 'error' : ''}`}
          onClick={!uploading ? handleClick : undefined}
        >
          {uploading ? (
            <>
              <Loader2 size={48} className="spin-animation" />
              <p>Subiendo archivo...</p>
            </>
          ) : preview ? (
            <>
              <img src={preview} alt="Preview" className="upload-preview" />
              <p>Procesando...</p>
            </>
          ) : (
            <>
              {type === 'product-image' ? (
                <ImageIcon size={48} />
              ) : (
                <Upload size={48} />
              )}
              <p className="upload-label">{label}</p>
              <p className="upload-hint">
                Click para seleccionar o arrastra aquí<br />
                Máximo {maxSize}MB
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="uploaded-file">
          <div className="file-preview">
            {preview && (
              <img src={preview} alt="Uploaded file" />
            )}
            <div className="file-success">
              <Check size={32} />
            </div>
          </div>
          <div className="file-info">
            <p className="file-name">{uploadedFile.filename}</p>
            <p className="file-size">
              {(uploadedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <button 
            className="remove-file-btn"
            onClick={handleRemove}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
