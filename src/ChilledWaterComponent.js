import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import TableComponent from './TableComponent';
import { TextField, Box } from '@mui/material';

const ChilledWaterComponent = ({ updateData, technicianName, setTechnicianName, noteSignature, handleOpenSignatureModal }) => {
  const [chilledWaterData, setChilledWaterData] = useState([]);
  const chilledWaterLabels = [new Date().toLocaleDateString()];
  const chilledWaterColumns = ['Day', 'Conductivity', 'Action'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'chilledWater1'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChilledWaterData(data);
      } catch (error) {
        console.error('Error fetching chilled water data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <TableComponent
        collectionName="chilledWater1"
        rowLabels={chilledWaterLabels}
        columnLabels={chilledWaterColumns}
        defaultRows={chilledWaterData}
        updateData={updateData}
      />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 3 }}>
        <TextField
          label="Name"
          value={technicianName}
          onChange={(e) => setTechnicianName(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid lightgrey',
            cursor: 'pointer',
            height: '50px',
          }}
          onClick={() => handleOpenSignatureModal('chilledWater1')}
        >
          {noteSignature ? (
            <img src={noteSignature} alt="Signature" style={{ width: '100px', height: '50px' }} />
          ) : (
            'Sign'
          )}
        </Box>
      </Box>
    </>
  );
};

export default ChilledWaterComponent;
