import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import TableComponent from './TableComponent';
import { TextField, Box } from '@mui/material';

const CondenserChemicalsComponent = ({ updateData, technicianName, setTechnicianName, noteSignature, handleOpenSignatureModal }) => {
  const [condenserChemicalsData, setCondenserChemicalsData] = useState([]);
  const condenserChemicalsLabels = [
    'PM3601 (25Kg)', 'Biocide AQ', 'PF CC6202 (20Kg)', 'PDV Salt (25Kg)', 'Sodium Hypochlorite (25 kg)',
    'BD 250C (25Kg)', 'PF CL4015 (CHW)', 'BD 350 (30Kg)', 'Dip slide (pcs)'
  ];
  const condenserChemicalsColumns = ['Opening Stock (Kg)', 'Consumption (Kg)', 'Closing Stock (Kg)'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'condenserChemicals1'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCondenserChemicalsData(data);
      } catch (error) {
        console.error('Error fetching condenser chemicals data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <TableComponent
        collectionName="condenserChemicals1"
        rowLabels={condenserChemicalsLabels}
        columnLabels={condenserChemicalsColumns}
        defaultRows={condenserChemicalsData}
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
          onClick={handleOpenSignatureModal}
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

export default CondenserChemicalsComponent;
