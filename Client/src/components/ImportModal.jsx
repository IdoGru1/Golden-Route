import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ImportModal.css'; // שימוש בקובץ ה-CSS ששלחת

function ImportModal({ isOpen, onClose, onImport }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      axios.get('http://localhost:4000/checks/history')
        .then(res => setHistory(res.data.history || []))
        .catch(err => console.error('שגיאה בשליפת היסטוריה:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>❌</button>
        <h3>📜 בדיקות קודמות</h3>

        {history.length === 0 ? (
          <p>לא נמצאו בדיקות שמורות</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>קו רוחב</th>
                <th>קו אורך</th>
                <th>רדיוס</th>
                <th>מהירות</th>
                <th>טיסה</th>
                <th>פעולה</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.latitude}</td>
                  <td>{item.longitude}</td>
                  <td>{item.radius} ק"מ</td>
                  <td>{item.speed} קמ"ש</td>
                  <td>{item.flightCallsign || 'לא זוהתה'}</td>
                  <td>
                    <button onClick={() => onImport({
                      latitude: item.latitude,
                      longitude: item.longitude,
                      radius: item.radius,
                      speed: item.speed
                    })}>
                      ייבוא
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ImportModal;
