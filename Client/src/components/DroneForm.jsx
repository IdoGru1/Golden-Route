import React, { useState } from 'react';
import axios from 'axios';
import './DroneForm.css';
import ThreatMap from './ThreatMap';
import ImportModal from './ImportModal';
import ErrorMessage from './ErrorMessage';
import FlightResult from './FlightResult';

function DroneForm() {
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    speed: '',
    radius: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [response, setResponse] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const latitude = parseFloat(formData.latitude);
    const longitude = parseFloat(formData.longitude);
    const radius = parseFloat(formData.radius);
    const speed = parseFloat(formData.speed);

    const newErrors = {};
    if (isNaN(latitude) || latitude < -90 || latitude > 90)
      newErrors.latitude = "קו רוחב חייב להיות בין -90 ל-90";
    if (isNaN(longitude) || longitude < -180 || longitude > 180)
      newErrors.longitude = "קו אורך חייב להיות בין -180 ל-180";
    if (isNaN(radius) || radius <= 0)
      newErrors.radius = "רדיוס חייב להיות מספר חיובי";
    if (isNaN(speed) || speed <= 0)
      newErrors.speed = "מהירות חייבת להיות מספר חיובי";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaveStatus(null);

    try {
      const res = await axios.post('http://localhost:4000/check-threat-live', {
        latitude, longitude, radius, speed
      });
      setResponse(res.data);
    } catch (error) {
      console.error('Error sending data:', error);
      setResponse(null);
    }
  };

  const handleSave = async () => {
    if (!response) return;

    try {
      const res = await axios.post('http://localhost:4000/checks/save', {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseFloat(formData.radius),
        speed: parseFloat(formData.speed),
        threat: response.threat,
        flightCallsign: response.closestFlight?.callsign || null,
        distance: response.distance || null,
        closureTime: response.closureTime || null
      });

      setSaveStatus(res.data.success ? "✅ נשמר בהצלחה במסד הנתונים" : "❌ שמירה נכשלה");
    } catch (error) {
      console.error('שגיאה בשמירה:', error);
      setSaveStatus("❌ שגיאה בעת שמירה למסד הנתונים");
    }
  };

  return (
    <div className="drone-container">
      {/* מפה משמאל */}
      {response?.threat && (
        <div className="map-container">
          <ThreatMap
            droneCoords={{
              latitude: parseFloat(formData.latitude),
              longitude: parseFloat(formData.longitude),
              radius: parseFloat(formData.radius)
            }}
            flightCoords={response.closestFlight}
          />
        </div>
      )}

      {/* טופס מימין */}
      <div className="drone-form-box">
        <h2>מערכת זיהוי איום כטב"ם</h2>

        <button className="import-button" onClick={() => setShowModal(true)}>
          📂 ייבוא נתונים שמורים
        </button>

        <ImportModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onImport={(data) => setFormData(data)}
        />

        {response?.usingMockFlight && (
  <div style={{
    backgroundColor: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffeeba',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '15px'
  }}>
    ⚠️ לא ניתן לפנות ל־OpenSky. מוצגת טיסת דמה לצורך בדיקה.
  </div>
)}


        <form onSubmit={handleSubmit}>
          {["latitude", "longitude", "speed", "radius"].map(field => (
            <div key={field} className="form-group">
              <label>{field === "latitude" ? "קו רוחב" :
                      field === "longitude" ? "קו אורך" :
                      field === "speed" ? "מהירות (קמ\"ש)" : "רדיוס (ק\"מ)"}</label>
              <input
                type="number"
                step="0.0001"
                name={field}
                value={formData[field]}
                onChange={handleChange}
              />
              <ErrorMessage message={errors[field]} />
            </div>
          ))}
          <button type="submit" className="submit-button">בדוק איום</button>
        </form>

        <FlightResult
          response={response}
          onSave={handleSave}
          saveStatus={saveStatus}
          droneCoords={{
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            radius: parseFloat(formData.radius)
          }}
        />
      </div>
    </div>
  );
}

export default DroneForm;
