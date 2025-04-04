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
  const [userForAzure, setUserForAzure] = useState('');
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

  const getRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const index = parseInt(contentIndex);

      // Collaborative Filtering
      const cfRow = cfData[index];
      setCfRecs(cfRow ? Object.values(cfRow) : []);

      // Content-Based Filtering
      const colValues: { similarity: number; index: number }[] = contentMatrix.map((row, rowIndex) => {
        return { similarity: parseFloat(row[index]), index: rowIndex };
      });

      const top5 = colValues
        .filter(row => row.index !== index && !isNaN(row.similarity))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map(row => row.index.toString());

      setContentRecs(top5);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  const getAzureRecs = async () => {
    const body = {
      Inputs: {
        WebServiceInput0: content_id.map((cid) => ({
          User: userForAzure,
          Item: cid,
        })),
      },
    };

    try {
      setAzureRecs([]);
      const azureRes = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer TYjmuaCeCAwChga2meKn5UiZFEijsFzr',
        },
        body: JSON.stringify(body),
      }).then((res) => res.json());

      const top5Items = [];
      for (let i = 1; i <= 5; i++) {
        const item = azureRes['Results']['WebServiceOutput0'][0][`Recommended Item ${i}`];
        if (item) top5Items.push(item);
      }
      setAzureRecs(top5Items);
    } catch (err) {
      console.error(err);
      setError('Something went wrong with the Azure ML request.');
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
      <button onClick={getRecommendations} disabled={loading}>
        Get Recommendations
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <h2>Collaborative Filtering</h2>
        {cfRecs.length > 0 && (
          <>
            <p><strong>If you watched:</strong> {cfRecs[0]}</p>
            <h5>Top Recommendations:</h5>
            <ol>
              {cfRecs.slice(1).map((id, idx) => (
                <li key={idx}>{id}</li>
              ))}
            </ol>
          </>
        )}

        <h2>Content-Based Filtering</h2>
        <ol>
          {contentRecs.map((id, idx) => (
            <li key={idx}>Article ID: {id}</li>
          ))}
        </ol>

        <h2>Azure Wide & Deep</h2>
        <input
          type="number"
          placeholder="Enter User ID"
          value={userForAzure}
          onChange={(e) => setUserForAzure(e.target.value)}
        />
        <button onClick={getAzureRecs} disabled={loading}>
          Get Azure Recommendations
        </button>

        <ol>
          {azureRecs.map((r, idx) => (
            <li key={idx}>Article ID: {r}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default App;
