// src/components/Modal.js
import React from 'react';
import './Modal.css';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null; // Si no está abierto, no renderiza nada
  }

  return (
    // El "backdrop" oscuro
    <div className="modal-backdrop" onClick={onClose}>
      {/* El contenido del modal */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          {children} {/* Aquí es donde irán nuestros formularios */}
        </div>
      </div>
    </div>
  );
}

export default Modal;