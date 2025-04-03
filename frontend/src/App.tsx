import { useState, useEffect } from 'react';
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const getRecommendations = () => {
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
      <button className='btn btn-primary' onClick={getRecommendations}>
        Get Recommendations
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <h2>Collaborative Filtering</h2>
        <ul>{cfRecs.map((id, idx) => <li key={idx}>{id}</li>)}</ul>

        <h2>Content-Based Filtering</h2>
        <ul>{contentRecs.map((idx, id) => <li key={id}>{idx}</li>)}</ul>
      </div>
    </div>
  );
};

export default App;