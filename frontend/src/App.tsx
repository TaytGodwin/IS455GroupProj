import { useState, useEffect } from 'react';
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';

type CsvRec = {
  user_id: string;
  rec_1: string;
  rec_2: string;
  rec_3: string;
  rec_4: string;
  rec_5: string;
};
const App = () => {
  const [userId, setUserId] = useState('');
  const [cfRecs, setCfRecs] = useState<string[]>([]);
  const [contentRecs, setContentRecs] = useState<string[]>([]);
  const [azureRecs, setAzureRecs] = useState<string[]>([]);
  const [cfData, setCfData] = useState<CsvRec[]>([]);
  const [contentData, setContentData] = useState<CsvRec[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Utility to load CSV from string to JSON
  const parseCSV = (csvText: string): CsvRec[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const record: any = {};
      headers.forEach((header, i) => {
        record[header] = values[i];
      });
      return record;
    });
  };

  // Load CSVs on first render
  useEffect(() => {
    fetch("Recommender/news_collaborative_recommendations.csv")
      .then((res) => res.text())
      .then((text) => setCfData(parseCSV(text)));

    fetch("Recommender/news_content_filtering_results.csv")
      .then((res) => res.text())
      .then((text) => setContentData(parseCSV(text)));
  }, []);

  const getRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      // Find CF and Content recs from CSVs
      const cfRow = cfData.find((row) => row.user_id === userId);
      const contentRow = contentData.find((row) => row.user_id === userId);

      setCfRecs(cfRow ? Object.values(cfRow).slice(1) : []);
      setContentRecs(contentRow ? Object.values(contentRow).slice(1) : []);

      // Azure
      const body = { user_id: parseInt(userId) };
      const azureRes = await fetch('https://YOUR_AZURE_ENDPOINT_URL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY_HERE',
        },
        body: JSON.stringify(body),
      }).then((res) => res.json());

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
      <button className='btn btn-primary' onClick={getRecommendations}>
        Get Recommendations
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

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