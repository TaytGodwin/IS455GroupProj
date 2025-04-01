import { useState } from 'react';
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';


const App = () => {
  const [userId, setUserId] = useState('');
  const [cfRecs, setCfRecs] = useState([]);
  const [contentRecs, setContentRecs] = useState([]);
  const [azureRecs, setAzureRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const body = { user_id: parseInt(userId) };
      
      // Collaborative Filtering
      const cfRes = await fetch('http://localhost:8000/recommend-cf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((res) => res.json());

      // Content-Based Filtering
      const contentRes = await fetch('http://localhost:5000/recommend-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((res) => res.json());

      // Azure ML Endpoint
      const azureRes = await fetch('https://YOUR_AZURE_ENDPOINT_URL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY_HERE',
        },
        body: JSON.stringify(body),
      }).then((res) => res.json());

      setCfRecs(cfRes);
      setContentRecs(contentRes);
      setAzureRecs(azureRes);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please check your backend servers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Article Recommendation System</h1>
      <input
        type="number"
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button className='btn-primary'
        onClick={getRecommendations}
      >
        Get Recommendations

      </button>
      <div>
        <h2>Collaborative Filtering</h2>
        <ul>{cfRecs.map((id, idx) => <li key={idx}>Article ID: {id}</li>)}</ul>

        <h2>Content-Based Filtering</h2>
        <ul>{contentRecs.map((id, idx) => <li key={idx}>Article ID: {id}</li>)}</ul>

        <h2>Azure Wide & Deep</h2>
        <ul>{azureRecs.map((id, idx) => <li key={idx}>Article ID: {id}</li>)}</ul>
      </div>
    </div>
  );
};

export default App;
