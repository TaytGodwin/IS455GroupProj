import { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import arrayofIds from './arrayofIds';

// All content ids
const content_id = arrayofIds();

type CsvRec = {
  rec_1: string;
  rec_2: string;
  rec_3: string;
  rec_4: string;
  rec_5: string;
};

const App = () => {
  const [contentIndex, setContentIndex] = useState('');
  const [cfRecs, setCfRecs] = useState<string[]>([]);
  const [cfData, setCfData] = useState<CsvRec[]>([]);
  const [contentRecs, setContentRecs] = useState<string[]>([]);
  const [contentMatrix, setContentMatrix] = useState<string[][]>([]);
  const [azureRecs, setAzureRecs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parseCSV = (csvText: string): CsvRec[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map((line) => {
      const values = line.split(',');
      const record: any = {};
      headers.forEach((header, i) => {
        record[header] = values[i];
      });
      return record;
    });
  };

  const parseMatrixCSV = (csvText: string): string[][] => {
    const lines = csvText.trim().split('\n');
    return lines.map(line => line.split(','));
  };

  useEffect(() => {
    fetch("/data/news_collaborative_recommendations.csv")
      .then((res) => res.text())
      .then((text) => setCfData(parseCSV(text)));

    fetch("/data/news_content_filtering_results.csv")
      .then((res) => res.text())
      .then((text) => setContentMatrix(parseMatrixCSV(text)));
  }, []);

  const getRecommendations = async() => {
    setLoading(true);
    setError('');
    try {
      const index = parseInt(contentIndex);

      // Collaborative Filtering (by row index)
      const cfRow = cfData[index];
      if (cfRow) {
        setCfRecs(Object.values(cfRow));
      } else {
        setCfRecs([]);
        setError(`No CF recommendations found for index ${index}`);
      }

      // Content-Based Filtering (by column similarity)
      const colValues: { similarity: number; index: number }[] = contentMatrix.map((row, rowIndex) => {
        return { similarity: parseFloat(row[index]), index: rowIndex };
      });

      const top5 = colValues
        .filter(row => row.index !== index && !isNaN(row.similarity))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map(row => row.index.toString());

      setContentRecs(top5);

      const body = {
        Inputs: {
          WebServiceInput0: {
            
            contentId: content_id,
          },
        },
      };

      const azureRes = await fetch(
        'http://2bd92409-589d-46be-959c-76d6eaf53f46.eastus2.azurecontainer.io/score',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer cmCRPLiMB5N11an7fDqVKKix4ueRnKqs',
          },
          body: JSON.stringify(body),
        }
      ).then((res) => res.json());

      setAzureRecs(azureRes);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please enter a valid number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Article Recommendation System</h1>
      <input
        type="number"
        placeholder="Enter Content Index"
        value={contentIndex}
        onChange={(e) => setContentIndex(e.target.value)}
      />
      <button onClick={getRecommendations}>
        Get Recommendations
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
      <h2>Collaborative Filtering</h2>
        <p><strong>If you watched:</strong> {cfRecs[0]}</p>
        <h5>Top Recommendations:</h5>
       <ol>
        
        {cfRecs.slice(1).map((id, idx) => (
          <li key={idx}>{id}</li>
        ))}
      </ol>
        <h2>Content-Based Filtering</h2>
        <ol>{contentRecs.map((id, idx) => <li key={idx}>Article ID: {id}</li>)}</ol>

        <h2>Azure Wide & Deep</h2>
        <ol>{azureRecs.map((id, idx) => <li key={idx}>Article ID: {id}</li>)}</ol>
      </div>
    </div>
  );
};

export default App;
