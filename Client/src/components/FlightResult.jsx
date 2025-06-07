import React from 'react';
import ThreatMap from './ThreatMap';

function FlightResult({ response, onSave, saveStatus, droneCoords }) {
  if (!response) return null;

  const isThreat = response.threat;

  return (
    <div style={{
      marginTop: '25px',
      backgroundColor: isThreat ? '#ffe0e0' : '#e0ffe0',
      padding: '20px',
      borderRadius: '10px',
      border: isThreat ? '1px solid red' : '1px solid green'
    }}>
      {isThreat ? (
        <>
          <h3 style={{ marginTop: 0, color: 'red' }}>איום זוהה!</h3>
          <p><strong>מטוס קרוב:</strong> {response.closestFlight.callsign}</p>
          <p><strong>מרחק:</strong> {response.distance.toFixed(2)} ק"מ</p>
          <p><strong>מהירות מטוס:</strong> {response.closestFlight.velocity.toFixed(2)} מ/ש</p>
          <p><strong>גובה:</strong> {response.closestFlight.altitude.toFixed(2)} מטר</p>
          <p><strong>זמן סגירה משוער:</strong>{" "} {response.closureTime < 1? `${(response.closureTime * 60).toFixed(1)} שניות`:`${response.closureTime.toFixed(1)} דקות`}
</p>
        </>
      ) : (
        <h3 style={{ marginTop: 0, color: 'green' }}>אין איום בטווח שנבחר.</h3>
      )}

      <button
        onClick={onSave}
        style={{
          marginTop: '15px',
          backgroundColor: '#28a745',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        💾 שמור למאגר
      </button>

      {saveStatus && (
        <p style={{
          marginTop: '10px',
          color: saveStatus.includes("נשמר") ? 'green' : 'red'
        }}>{saveStatus}</p>
      )}

      {/* 🗺️ מפת איום – תוצג רק אם יש איום */}
      {isThreat && (
        <ThreatMap
          droneCoords={droneCoords}
          flightCoords={response.closestFlight}
        />
      )}
    </div>
  );
}

export default FlightResult;
